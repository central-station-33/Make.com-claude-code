
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSRequest {
  id: string
  message: string
  recipient_phone: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { id, message, recipient_phone }: SMSRequest = await req.json()

    // Input validation
    if (!id || !message || !recipient_phone) {
      throw new Error('Missing required fields: id, message, or recipient_phone')
    }

    // Get Twilio credentials from environment
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error('Missing Twilio configuration')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log(`Sending SMS to ${recipient_phone}: ${message}`)

    try {
      // Send SMS via Twilio
      const twilioResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
          },
          body: new URLSearchParams({
            To: recipient_phone,
            From: twilioPhoneNumber,
            Body: message,
          }).toString(),
        }
      )

      const twilioData = await twilioResponse.json()

      if (twilioResponse.ok) {
        console.log('SMS sent successfully', twilioData)
        // Update message status in database
        const { error } = await supabaseClient
          .from('text_messages')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            metadata: {
              twilio_message_sid: twilioData.sid,
            },
          })
          .eq('id', id)

        if (error) {
          console.error('Error updating message status:', error)
          throw error
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        console.error('Twilio API error:', twilioData)
        throw new Error(twilioData.message || 'Failed to send SMS')
      }
    } catch (error) {
      console.error('Error in SMS sending process:', error)
      // Update message status to failed
      await supabaseClient
        .from('text_messages')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', id)

      throw error
    }
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
