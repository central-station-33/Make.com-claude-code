import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { auth: { persistSession: false } }
    );

    const { input, agentId, availableTools } = await req.json();

    const { data: agent, error: agentError } = await supabaseClient
      .from("ai_agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (agentError) throw agentError;

    const toolsDescription = availableTools?.length
      ? `\nAvailable tools:\n${availableTools
          .map((t: { name: string; type: string }) => `- ${t.name}: ${t.type}`)
          .join("\n")}`
      : "";

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: `${agent.system_prompt}${toolsDescription}`,
      messages: [{ role: "user", content: input }],
    });

    const output = (msg.content[0] as { text: string }).text;

    await supabaseClient.from("system_logs").insert({
      action:  "agent_interaction",
      details: `Agent ${agent.name} processed input with ${availableTools?.length || 0} tools`,
      type:    "system",
    });

    return new Response(
      JSON.stringify({ output }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("handle-agent-interaction error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
