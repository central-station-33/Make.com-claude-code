export enum LeadType {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  INVESTOR = 'INVESTOR'
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  type: LeadType;
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
  profiles?: {
    full_name: string;
  } | null;
}