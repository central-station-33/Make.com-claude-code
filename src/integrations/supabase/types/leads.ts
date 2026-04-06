import { BaseEntity } from './base';

export interface LeadTables {
  leads: {
    Row: LeadRow;
    Insert: LeadInsert;
    Update: LeadUpdate;
  };
  lead_follow_ups: {
    Row: LeadFollowUpRow;
    Insert: LeadFollowUpInsert;
    Update: LeadFollowUpUpdate;
  };
  lead_messages: {
    Row: LeadMessageRow;
    Insert: LeadMessageInsert;
    Update: LeadMessageUpdate;
  };
}

export interface LeadRow extends BaseEntity {
  name: string;
  email: string;
  phone: string | null;
  type: string;
  status: string;
  property_type: string | null;
  budget: number | null;
  location: string | null;
  notes: string | null;
  user_id: string | null;
  agent_id: string | null;
  follow_up_date: string | null;
  last_contact_date: string | null;
}

export type LeadInsert = Partial<LeadRow>;
export type LeadUpdate = Partial<LeadRow>;

export interface LeadFollowUpRow extends BaseEntity {
  lead_id: string | null;
  template_id: string | null;
  scheduled_for: string;
  completed_at: string | null;
  notes: string | null;
  status: string | null;
  user_id: string | null;
}

export type LeadFollowUpInsert = Partial<LeadFollowUpRow>;
export type LeadFollowUpUpdate = Partial<LeadFollowUpRow>;

export interface LeadMessageRow extends BaseEntity {
  lead_id: string | null;
  sender_id: string | null;
  message: string;
  status: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  metadata: Record<string, unknown>;
}

export type LeadMessageInsert = Partial<LeadMessageRow>;
export type LeadMessageUpdate = Partial<LeadMessageRow>;