import { Json } from '../base.types';

export interface CrmActivitiesRow {
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
  status: string | null;
  priority: string | null;
}

export interface CrmContactsRow {
  id: string;
  lead_id: string | null;
  status: string;
  source: string | null;
  lifecycle_stage: string | null;
  last_contacted: string | null;
  next_follow_up: string | null;
  notes: string | null;
  tags: string[] | null;
  custom_fields: Json;
  created_at: string | null;
  updated_at: string | null;
  metadata: Json;
  last_modified_by: string | null;
}

export interface CrmTables {
  crm_activities: CrmActivitiesRow;
  crm_contacts: CrmContactsRow;
}