import { SupabaseClient } from "@supabase/supabase-js";

interface ScheduleFollowUpParams {
  leadId: string;
  templateId: string;
  date: Date;
  userId: string;
}

export const scheduleFollowUp = async (
  supabase: SupabaseClient,
  params: ScheduleFollowUpParams
) => {
  const { leadId, templateId, date, userId } = params;

  // First verify the user has access to this lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id')
    .eq('id', leadId)
    .or(`user_id.eq.${userId},agent_id.eq.${userId}`)
    .single();

  if (leadError || !lead) {
    console.error("Lead access verification error:", leadError);
    throw new Error("You don't have permission to schedule follow-ups for this lead");
  }

  const { data, error } = await supabase
    .from('lead_follow_ups')
    .insert({
      lead_id: leadId,
      template_id: templateId,
      scheduled_for: date.toISOString(),
      status: 'pending',
      user_id: userId
    })
    .select()
    .single();

  if (error) {
    console.error("Follow-up scheduling error:", error);
    throw new Error(error.message || "Failed to schedule follow-up");
  }

  if (!data) {
    throw new Error("Failed to create follow-up record");
  }

  return data;
};