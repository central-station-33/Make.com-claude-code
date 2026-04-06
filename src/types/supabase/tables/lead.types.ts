import { Json } from '../base.types';

export interface LeadRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  type: string;
  status: string;
  property_type: string | null;
  budget: number | null;
  location: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
  agent_id: string | null;
  follow_up_date: string | null;
  last_contact_date: string | null;
  source: string | null;
  source_details: Json;
  email_source: string | null;
  email_metadata: Json;
  source_referral_fee: number | null;
  source_referral_notes: string | null;
  team_id: string | null;
}

export interface LeadFollowUpRow {
  id: string;
  lead_id: string | null;
  template_id: string | null;
  scheduled_for: string;
  completed_at: string | null;
  notes: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
}

export interface LeadMessageRow {
  id: string;
  lead_id: string | null;
  sender_id: string | null;
  message: string;
  status: string | null;
  sent_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  metadata: Json;
}

export interface LeadMagnetInteractionRow {
  id: string;
  lead_id: string | null;
  magnet_type: string;
  content_title: string;
  downloaded_at: string | null;
  user_id: string | null;
  metadata: Json;
  created_at: string | null;
}

export interface LeadTables {
  leads: {
    Row: LeadRow;
    Insert: Omit<LeadRow, 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Omit<LeadRow, 'id'>>;
  };
  lead_follow_ups: {
    Row: LeadFollowUpRow;
    Insert: Omit<LeadFollowUpRow, 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Omit<LeadFollowUpRow, 'id'>>;
  };
  lead_messages: {
    Row: LeadMessageRow;
    Insert: Omit<LeadMessageRow, 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Omit<LeadMessageRow, 'id'>>;
  };
  lead_magnet_interactions: {
    Row: LeadMagnetInteractionRow;
    Insert: Omit<LeadMagnetInteractionRow, 'id' | 'created_at'>;
    Update: Partial<Omit<LeadMagnetInteractionRow, 'id'>>;
  };
}