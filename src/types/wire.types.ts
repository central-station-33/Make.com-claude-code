export type WireChannel = 'sms' | 'email' | 'call' | 'note';
export type WireConversationStatus = 'open' | 'closed' | 'unread';
export type WireOpportunityStatus = 'open' | 'won' | 'lost' | 'abandoned';
export type WireAppointmentStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type WireAutomationStatus = 'active' | 'paused' | 'draft';
export type WireCampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
export type WireMessageDirection = 'inbound' | 'outbound';

export interface WireContact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  tags: string[];
  source?: string;
  assigned_to?: string;
  do_not_contact: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  last_activity?: string;
}

export interface WireConversation {
  id: string;
  contact_id: string;
  contact?: WireContact;
  channel: WireChannel;
  status: WireConversationStatus;
  subject?: string;
  last_message?: string;
  last_message_at?: string;
  assigned_to?: string;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface WireMessage {
  id: string;
  conversation_id: string;
  direction: WireMessageDirection;
  channel: WireChannel;
  body: string;
  from?: string;
  to?: string;
  status: 'sent' | 'delivered' | 'failed' | 'received';
  created_at: string;
}

export interface WirePipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  position: number;
  color: string;
}

export interface WirePipeline {
  id: string;
  name: string;
  stages: WirePipelineStage[];
  created_at: string;
}

export interface WireOpportunity {
  id: string;
  pipeline_id: string;
  stage_id: string;
  contact_id: string;
  contact?: WireContact;
  name: string;
  value?: number;
  status: WireOpportunityStatus;
  assigned_to?: string;
  close_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WireAppointment {
  id: string;
  contact_id: string;
  contact?: WireContact;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: WireAppointmentStatus;
  assigned_to?: string;
  location?: string;
  meeting_link?: string;
  created_at: string;
}

export interface WireAutomationStep {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay';
  name: string;
  config: Record<string, unknown>;
}

export interface WireAutomation {
  id: string;
  name: string;
  description?: string;
  status: WireAutomationStatus;
  trigger_type: string;
  steps: WireAutomationStep[];
  enrolled_count: number;
  completed_count: number;
  created_at: string;
  updated_at: string;
}

export interface WireCampaign {
  id: string;
  name: string;
  type: 'email' | 'sms';
  status: WireCampaignStatus;
  subject?: string;
  body: string;
  recipient_count: number;
  sent_count: number;
  open_count: number;
  click_count: number;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
}

export interface WireStats {
  total_contacts: number;
  new_contacts_today: number;
  open_conversations: number;
  unread_messages: number;
  open_opportunities: number;
  pipeline_value: number;
  appointments_today: number;
  active_automations: number;
}

export type WireView =
  | 'dashboard'
  | 'inbox'
  | 'contacts'
  | 'pipeline'
  | 'calendar'
  | 'automations'
  | 'campaigns'
  | 'reporting';
