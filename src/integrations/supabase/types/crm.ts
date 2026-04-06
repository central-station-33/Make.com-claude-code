import { BaseEntity } from './base';

export interface CRMTables {
  crm_contacts: {
    Row: CRMContactRow;
    Insert: CRMContactInsert;
    Update: CRMContactUpdate;
  };
  crm_activities: {
    Row: CRMActivityRow;
    Insert: CRMActivityInsert;
    Update: CRMActivityUpdate;
  };
}

export interface CRMContactRow extends BaseEntity {
  lead_id: string | null;
  status: string;
  source: string | null;
  lifecycle_stage: string | null;
  last_contacted: string | null;
  next_follow_up: string | null;
  notes: string | null;
  tags: string[] | null;
  custom_fields: Record<string, any> | null;
  metadata: Record<string, any> | null;
  last_modified_by: string | null;
}

export type CRMContactInsert = Partial<CRMContactRow>;
export type CRMContactUpdate = Partial<CRMContactRow>;

export interface CRMActivityRow extends BaseEntity {
  contact_id: string | null;
  type: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_by: string | null;
  status: string | null;
  priority: 'low' | 'medium' | 'high' | null;
}

export type CRMActivityInsert = Partial<CRMActivityRow>;
export type CRMActivityUpdate = Partial<CRMActivityRow>;