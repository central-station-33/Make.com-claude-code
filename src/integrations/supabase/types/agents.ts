import { BaseEntity } from './base';

export interface AgentTables {
  agent_credentials: {
    Row: AgentCredentialRow;
    Insert: AgentCredentialInsert;
    Update: AgentCredentialUpdate;
  };
  agent_onboarding: {
    Row: AgentOnboardingRow;
    Insert: AgentOnboardingInsert;
    Update: AgentOnboardingUpdate;
  };
}

export interface AgentCredentialRow extends BaseEntity {
  agent_id: string | null;
  temp_password: string;
  is_used: boolean;
  expires_at: string | null;
}

export type AgentCredentialInsert = Partial<AgentCredentialRow>;
export type AgentCredentialUpdate = Partial<AgentCredentialRow>;

export interface AgentOnboardingRow extends BaseEntity {
  full_name: string;
  email: string;
  phone: string | null;
  license_number: string | null;
  company: string | null;
  state: string | null;
  status: string | null;
  processed_at: string | null;
  processed_by: string | null;
}

export type AgentOnboardingInsert = Partial<AgentOnboardingRow>;
export type AgentOnboardingUpdate = Partial<AgentOnboardingRow>;