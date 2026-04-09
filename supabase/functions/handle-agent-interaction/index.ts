import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { input, agentId, availableTools } = await req.json();

    // Get agent configuration
    const { data: agent, error: agentError } = await supabaseClient
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError) throw agentError;

    // Prepare system prompt with available tools
    const toolsDescription = availableTools?.length 
      ? `\nAvailable tools:\n${availableTools.map(t => `- ${t.name}: ${t.type}`).join('\n')}`
      : '';

    // Call Anthropic Claude API with a 25s timeout to stay within Make.com's webhook window
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `${agent.system_prompt}${toolsDescription}\nWhen using tools, mention them explicitly in your response.`,
        messages: [
          { role: 'user', content: input }
        ],
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!claudeResponse.ok) {
      const error = await claudeResponse.json();
      throw new Error(error.error?.message || 'Anthropic API error');
    }

    const claudeData = await claudeResponse.json();
    const output = claudeData.content[0].text;

    // Log the interaction
    await supabaseClient
      .from('system_logs')
      .insert({
        action: 'agent_interaction',
        details: `Agent ${agent.name} processed user input via Claude with ${availableTools?.length || 0} tools`,
        type: 'system'
      });

    return new Response(
      JSON.stringify({ output }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});