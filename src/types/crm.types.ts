export interface CRMActivity {
  id: string;
  contact_id: string | null;
  type: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  status: string;
  priority: 'high' | 'medium' | 'low';
  crm_contacts?: {
    id: string;
    status: string;
    leads?: {
      name: string;
      email: string;
      phone?: string | null;
      source?: string | null;
      source_details?: Record<string, any> | null;
      profiles?: {
        full_name: string | null;
      } | null;
    } | null;
  } | null;
}

export interface CRMContact {
  id: string;
  lead_id: string | null;
  status: string;
  source: string | null;
  lifecycle_stage: string | null;
  last_contacted: string | null;
  next_follow_up: string | null;
  notes: string | null;
  tags: string[] | null;
  custom_fields: Record<string, any> | null;
  metadata: Record<string, any>;
  last_modified_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  engagement_score: number | null;
  preferred_contact_method: string | null;
  communication_history: Record<string, any>[] | null;
  crm_activities?: CRMActivity[];
  leads?: {
    name: string;
    email: string;
    phone?: string | null;
    profiles?: {
      full_name: string;
    } | null;
  } | null;
}

export interface CRMTask {
  id: string;
  title: string;
  completed_at: string | null;
  contactName?: string | null;
}