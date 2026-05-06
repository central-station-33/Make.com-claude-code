import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ok, err, handleOptions } from '../_shared/cors.ts';

// Called by Make.com Workflow 3 after sending notifications
serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const payload = await req.json();
    const items: Record<string, unknown>[] = Array.isArray(payload) ? payload : [payload];

    const results = { logged: 0, errors: [] as string[] };

    for (const item of items) {
      try {
        const { error } = await supabase.from('notification_log').insert({
          property_id:       item.property_id   || null,
          notification_type: item.type          || item.notification_type || 'unknown',
          recipient:         item.recipient     || item.email || item.phone || '',
          status:            item.status        || 'sent',
          error_message:     item.error         || null,
          sent_at:           item.sent_at       || new Date().toISOString(),
        });

        if (error) throw new Error(error.message);
        results.logged++;

        // Mark property as notified if property_id present and notification was successful
        if (item.property_id && item.status === 'sent') {
          await supabase.from('properties')
            .update({ enrichment_status: 'complete' })
            .eq('id', item.property_id)
            .eq('enrichment_status', 'processing');
        }
      } catch (e) {
        results.errors.push((e as Error).message);
      }
    }

    return ok(results, `Logged ${results.logged} notification(s)`);
  } catch (e) {
    console.error('notification-status error:', e);
    return err((e as Error).message);
  }
});
