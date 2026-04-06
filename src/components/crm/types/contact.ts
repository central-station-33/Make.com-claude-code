export interface Contact {
  id: string;
  lead_id: string | null;
  status: string;
  source: string | null;
  lifecycle_stage: string | null;
  last_contacted: string | null;
  next_follow_up: string | null;
  notes: string | null;
  tags: string[] | null;
  custom_fields: any | null;
  created_at: string | null;
  updated_at: string | null;
}