import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { feed_config_id, provider, feed_type } = await req.json();

    // Log the start of processing
    console.log(`Processing ${provider} ${feed_type} feed for config ${feed_config_id}`);

    // Get feed configuration
    const { data: feedConfig, error: configError } = await supabaseClient
      .from('mls_feed_configs')
      .select('*')
      .eq('id', feed_config_id)
      .single();

    if (configError || !feedConfig) {
      throw new Error(`Feed configuration not found: ${configError?.message}`);
    }

    // Create a log entry for this processing attempt
    const { data: logEntry, error: logError } = await supabaseClient
      .from('mls_feed_logs')
      .insert({
        feed_config_id,
        status: 'processing',
      })
      .select()
      .single();

    if (logError) {
      throw new Error(`Failed to create log entry: ${logError.message}`);
    }

    // Process based on provider
    let processedRecords = 0;
    let errorMessage = null;

    try {
      switch (provider.toLowerCase()) {
        case 'leadflow':
          // Implementation will be added when LeadFlow API credentials are configured
          console.log('LeadFlow processing will be implemented');
          break;

        case 'agentpronto':
          // Implementation will be added when AgentPronto API credentials are configured
          console.log('AgentPronto processing will be implemented');
          break;

        case 'mls':
          // Implementation will be added when MLS credentials are configured
          console.log('MLS processing will be implemented');
          break;

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      // Update the log entry with success status
      await supabaseClient
        .from('mls_feed_logs')
        .update({
          status: 'completed',
          records_processed: processedRecords,
        })
        .eq('id', logEntry.id);

      // Update the last sync timestamp
      await supabaseClient
        .from('mls_feed_configs')
        .update({
          last_sync_at: new Date().toISOString(),
        })
        .eq('id', feed_config_id);

    } catch (error) {
      errorMessage = error.message;
      
      // Update the log entry with error status
      await supabaseClient
        .from('mls_feed_logs')
        .update({
          status: 'error',
          error_message: errorMessage,
        })
        .eq('id', logEntry.id);

      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        records_processed: processedRecords,
        log_entry_id: logEntry.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error processing feed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});