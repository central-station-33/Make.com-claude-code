import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `${agent.system_prompt}${toolsDescription}\nWhen using tools, mention them explicitly in your response.` 
          },
          { role: 'user', content: input }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!openAIResponse.ok) {
      const error = await openAIResponse.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const openAIData = await openAIResponse.json();
    const output = openAIData.choices[0].message.content;

    // Log the interaction
    await supabaseClient
      .from('system_logs')
      .insert({
        action: 'agent_interaction',
        details: `Agent ${agent.name} processed user input with ${availableTools?.length || 0} tools`,
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