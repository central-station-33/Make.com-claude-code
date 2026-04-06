import { Json } from '../base.types';

export interface AgentCredentialsRow {
  id: string;
  agent_id: string | null;
  temp_password: string;
  is_used: boolean | null;
  expires_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AgentOnboardingRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  license_number: string | null;
  company: string | null;
  state: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  processed_at: string | null;
  processed_by: string | null;
  payment_status: string | null;
  activation_type: string | null;
  payment_processed_at: string | null;
}

export interface AgentToolsRow {
  id: string;
  name: string;
  description: string;
  type: string;
  configuration: Json;
  enabled: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AgentContactsRow {
  id: string;
  mls_id: string | null;
  mls_source: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  office_name: string | null;
  office_address: string | null;
  license_number: string | null;
  state: string | null;
  created_at: string | null;
  updated_at: string | null;
  njmls_id: string | null;
  njmls_last_sync: string | null;
  njmls_status: string | null;
}

export interface AgentTables {
  agent_credentials: AgentCredentialsRow;
  agent_onboarding: AgentOnboardingRow;
  agent_tools: AgentToolsRow;
  agent_contacts: AgentContactsRow;
}