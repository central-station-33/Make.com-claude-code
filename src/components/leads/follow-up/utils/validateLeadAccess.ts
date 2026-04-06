import { SupabaseClient } from "@supabase/supabase-js";

export const validateLeadAccess = async (
  supabase: SupabaseClient,
  leadId: string,
  userId: string
) => {
  // Check if user has access as owner
  const { data: userLead, error: userLeadError } = await supabase
    .from('leads')
    .select('id')
    .eq('id', leadId)
    .eq('user_id', userId)
    .maybeSingle();

  if (userLeadError) {
    console.error("Lead access error:", userLeadError);
    throw new Error("Error verifying lead access");
  }

  // If not owner, check if assigned agent
  if (!userLead) {
    const { data: agentLead, error: agentLeadError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', leadId)
      .eq('agent_id', userId)
      .maybeSingle();

    if (agentLeadError) {
      console.error("Lead access error:", agentLeadError);
      throw new Error("Error verifying lead access");
    }

    if (!agentLead) {
      throw new Error("You don't have permission to schedule follow-ups for this lead");
    }
  }

  return true;
};