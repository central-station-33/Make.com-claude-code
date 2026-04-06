export interface AgentViews {
  agent_lead_progress: {
    Row: {
      agent_id: string | null;
      agent_name: string | null;
      lead_id: string | null;
      lead_name: string | null;
      lead_status: string | null;
      last_contact_date: string | null;
      follow_up_date: string | null;
      follow_ups_count: number | null;
      activities_count: number | null;
      last_activity_date: string | null;
    };
  };
}