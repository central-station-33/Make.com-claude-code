// Firestore collection names and typed helpers used throughout the app.
// Import `db` from config and the helpers here to avoid touching firebase/firestore directly.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type QueryConstraint,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './config';

// ── Collection names ────────────────────────────────────────
export const COLLECTIONS = {
  // Auth
  USER_ROLES: 'user_roles',
  PROFILES: 'profiles',

  // Leads / CRM (legacy)
  LEADS: 'leads',
  MESSAGES: 'messages',
  IMPORT_RECORDS: 'import_records',

  // The Wire
  WIRE_CONTACTS: 'wire_contacts',
  WIRE_CONVERSATIONS: 'wire_conversations',
  WIRE_MESSAGES: 'wire_messages',
  WIRE_PIPELINES: 'wire_pipelines',
  WIRE_PIPELINE_STAGES: 'wire_pipeline_stages',
  WIRE_OPPORTUNITIES: 'wire_opportunities',
  WIRE_APPOINTMENTS: 'wire_appointments',
  WIRE_AUTOMATIONS: 'wire_automations',
  WIRE_CAMPAIGNS: 'wire_campaigns',
  WIRE_API_KEYS: 'wire_api_keys',
} as const;

// ── Generic CRUD helpers ────────────────────────────────────

export async function getDocument<T = DocumentData>(collectionName: string, id: string) {
  const ref = doc(db, collectionName, id);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as T & { id: string }) : null;
}

export async function getDocuments<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const ref = collection(db, collectionName);
  const q = constraints.length ? query(ref, ...constraints) : query(ref);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T & { id: string }));
}

export async function createDocument<T extends DocumentData>(
  collectionName: string,
  data: T
) {
  const ref = collection(db, collectionName);
  const docRef = await addDoc(ref, {
    ...data,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateDocument(
  collectionName: string,
  id: string,
  data: Partial<DocumentData>
) {
  const ref = doc(db, collectionName, id);
  await updateDoc(ref, { ...data, updated_at: serverTimestamp() });
}

export async function deleteDocument(collectionName: string, id: string) {
  await deleteDoc(doc(db, collectionName, id));
}

export function subscribeToCollection<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (docs: (T & { id: string })[]) => void
) {
  const ref = collection(db, collectionName);
  const q = constraints.length ? query(ref, ...constraints) : query(ref);
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T & { id: string })));
  });
}

// Re-export query builders for convenience
export { where, orderBy, limit, serverTimestamp };
