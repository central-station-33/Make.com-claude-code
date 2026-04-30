import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import twilio from 'twilio';

admin.initializeApp();
const db = admin.firestore();

// ── Helpers ──────────────────────────────────────────────────

function twilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set');
  return twilio(sid, token);
}

function normalizePhone(phone: string): string {
  // Strip all non-digits, then re-add +1 prefix if US number
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

async function findContactByPhone(phone: string): Promise<string | null> {
  const normalized = normalizePhone(phone);
  // Try exact match first
  const snap = await db.collection('wire_contacts')
    .where('phone', '==', phone)
    .limit(1)
    .get();
  if (!snap.empty) return snap.docs[0].id;

  // Try normalized
  const snap2 = await db.collection('wire_contacts')
    .where('phone', '==', normalized)
    .limit(1)
    .get();
  if (!snap2.empty) return snap2.docs[0].id;

  return null;
}

async function findOrCreateConversation(contactId: string, channel: 'sms' | 'email'): Promise<string> {
  // Find open conversation for this contact + channel
  const snap = await db.collection('wire_conversations')
    .where('contact_id', '==', contactId)
    .where('channel', '==', channel)
    .where('status', '==', 'open')
    .orderBy('last_message_at', 'desc')
    .limit(1)
    .get();

  if (!snap.empty) return snap.docs[0].id;

  // Create a new conversation
  const ref = await db.collection('wire_conversations').add({
    contact_id: contactId,
    channel,
    status: 'open',
    unread_count: 0,
    last_message_at: admin.firestore.FieldValue.serverTimestamp(),
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

// ── 1. Incoming SMS webhook (Twilio → Firestore) ─────────────
//
// Set this URL in Twilio Console → Phone Numbers → your number
// → Messaging → "A message comes in" → Webhook:
//   https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/twilioIncomingSms
//
export const twilioIncomingSms = functions.https.onRequest(async (req, res) => {
  // Validate the request is genuinely from Twilio
  const authToken = process.env.TWILIO_AUTH_TOKEN ?? '';
  const twilioSig = req.headers['x-twilio-signature'] as string ?? '';
  const url = `https://${req.hostname}${req.originalUrl}`;

  if (authToken && !twilio.validateRequest(authToken, twilioSig, url, req.body)) {
    res.status(403).send('Forbidden');
    return;
  }

  const from: string = req.body.From ?? '';
  const body: string = req.body.Body ?? '';
  const to: string = req.body.To ?? '';

  if (!from || !body) {
    res.set('Content-Type', 'text/xml').status(200).send('<Response/>');
    return;
  }

  try {
    // Find matching contact
    let contactId = await findContactByPhone(from);

    // Auto-create contact if unknown number
    if (!contactId) {
      const ref = await db.collection('wire_contacts').add({
        first_name: 'Unknown',
        last_name: from,
        phone: from,
        tags: [],
        do_not_contact: false,
        source: 'Inbound SMS',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        last_activity: admin.firestore.FieldValue.serverTimestamp(),
      });
      contactId = ref.id;
    }

    const conversationId = await findOrCreateConversation(contactId, 'sms');

    // Write the inbound message
    await db.collection('wire_messages').add({
      conversation_id: conversationId,
      direction: 'inbound',
      channel: 'sms',
      body,
      from,
      to,
      status: 'received',
      twilio_sid: req.body.MessageSid ?? null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update conversation metadata
    await db.collection('wire_conversations').doc(conversationId).update({
      last_message: body,
      last_message_at: admin.firestore.FieldValue.serverTimestamp(),
      status: 'open',
      unread_count: admin.firestore.FieldValue.increment(1),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update contact last_activity
    await db.collection('wire_contacts').doc(contactId).update({
      last_activity: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Respond with empty TwiML (no auto-reply)
    res.set('Content-Type', 'text/xml').status(200).send('<Response/>');
  } catch (err) {
    console.error('twilioIncomingSms error:', err);
    res.set('Content-Type', 'text/xml').status(200).send('<Response/>');
  }
});

// ── 2. Outbound SMS sender (frontend → Twilio) ───────────────
//
// Called by the Wire inbox when sending an SMS message.
// Body: { conversationId: string, body: string }
//
export const sendSms = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }

  const { conversationId, body } = data as { conversationId: string; body: string };

  if (!conversationId || !body?.trim()) {
    throw new functions.https.HttpsError('invalid-argument', 'conversationId and body are required');
  }

  // Get the conversation to find the contact's phone
  const convSnap = await db.collection('wire_conversations').doc(conversationId).get();
  if (!convSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Conversation not found');
  }
  const conv = convSnap.data()!;

  // Get contact phone number
  const contactSnap = await db.collection('wire_contacts').doc(conv.contact_id).get();
  if (!contactSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Contact not found');
  }
  const contact = contactSnap.data()!;
  const toPhone = contact.phone as string | undefined;

  if (!toPhone) {
    throw new functions.https.HttpsError('failed-precondition', 'Contact has no phone number');
  }

  const fromPhone = process.env.TWILIO_PHONE_NUMBER;
  if (!fromPhone) {
    throw new functions.https.HttpsError('internal', 'TWILIO_PHONE_NUMBER env var not set');
  }

  // Send via Twilio
  const client = twilioClient();
  const message = await client.messages.create({
    to: normalizePhone(toPhone),
    from: fromPhone,
    body: body.trim(),
  });

  // Write the outbound message to Firestore
  await db.collection('wire_messages').add({
    conversation_id: conversationId,
    direction: 'outbound',
    channel: 'sms',
    body: body.trim(),
    from: fromPhone,
    to: normalizePhone(toPhone),
    status: 'sent',
    twilio_sid: message.sid,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update conversation
  await db.collection('wire_conversations').doc(conversationId).update({
    last_message: body.trim(),
    last_message_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { sid: message.sid, status: message.status };
});

// ── 3. Outbound Email sender (frontend → SendGrid) ───────────
//
// Called by the Wire inbox when sending an email message.
// Body: { conversationId: string, subject: string, body: string }
//
export const sendEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }

  const { conversationId, subject, body } = data as {
    conversationId: string;
    subject?: string;
    body: string;
  };

  if (!conversationId || !body?.trim()) {
    throw new functions.https.HttpsError('invalid-argument', 'conversationId and body are required');
  }

  const sendgridKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  if (!sendgridKey || !fromEmail) {
    throw new functions.https.HttpsError('internal', 'SendGrid env vars not configured');
  }

  const convSnap = await db.collection('wire_conversations').doc(conversationId).get();
  if (!convSnap.exists) throw new functions.https.HttpsError('not-found', 'Conversation not found');
  const conv = convSnap.data()!;

  const contactSnap = await db.collection('wire_contacts').doc(conv.contact_id).get();
  if (!contactSnap.exists) throw new functions.https.HttpsError('not-found', 'Contact not found');
  const contact = contactSnap.data()!;
  const toEmail = contact.email as string | undefined;

  if (!toEmail) {
    throw new functions.https.HttpsError('failed-precondition', 'Contact has no email address');
  }

  // Send via SendGrid REST API (no SDK needed)
  const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sendgridKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: toEmail }] }],
      from: { email: fromEmail },
      subject: subject ?? '(no subject)',
      content: [{ type: 'text/plain', value: body.trim() }],
    }),
  });

  if (!sgRes.ok) {
    const err = await sgRes.text();
    console.error('SendGrid error:', err);
    throw new functions.https.HttpsError('internal', `SendGrid error: ${sgRes.status}`);
  }

  // Write to Firestore
  await db.collection('wire_messages').add({
    conversation_id: conversationId,
    direction: 'outbound',
    channel: 'email',
    body: body.trim(),
    from: fromEmail,
    to: toEmail,
    status: 'sent',
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('wire_conversations').doc(conversationId).update({
    last_message: body.trim(),
    last_message_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { status: 'sent' };
});
