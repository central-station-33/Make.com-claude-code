
import { BaseTable } from '../supabase/base.types';

export interface AgentCredentialsTable extends BaseTable {
  Row: {
    id: string;
    agent_id: string | null;
    temp_password: string;
    is_used: boolean | null;
    expires_at: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Insert: {
    id?: string;
    agent_id?: string | null;
    temp_password: string;
    is_used?: boolean | null;
    expires_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: string;
    agent_id?: string | null;
    temp_password?: string;
    is_used?: boolean | null;
    expires_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
}

export interface AgentOnboardingTable extends BaseTable {
  Row: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    license_number: string | null;
    company: string | null;
    state: string | null;
    status: string | null;
    processed_at: string | null;
    processed_by: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Insert: {
    id?: string;
    full_name: string;
    email: string;
    phone?: string | null;
    license_number?: string | null;
    company?: string | null;
    state?: string | null;
    status?: string | null;
    processed_at?: string | null;
    processed_by?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: string;
    full_name?: string;
    email?: string;
    phone?: string | null;
    license_number?: string | null;
    company?: string | null;
    state?: string | null;
    status?: string | null;
    processed_at?: string | null;
    processed_by?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
}

export interface AgentToolsTable extends BaseTable {
  Row: {
    id: string;
    name: string;
    description: string;
    type: string;
    configuration: any;
    enabled: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Insert: {
    id?: string;
    name: string;
    description: string;
    type: string;
    configuration?: any;
    enabled?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: string;
    name?: string;
    description?: string;
    type?: string;
    configuration?: any;
    enabled?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
}

export interface AgentContactsTable extends BaseTable {
  Row: {
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
    created_at?: string | null;
    updated_at?: string | null;
  };
  Insert: {
    id?: string;
    mls_id?: string | null;
    mls_source?: string | null;
    full_name: string;
    email?: string | null;
    phone?: string | null;
    office_name?: string | null;
    office_address?: string | null;
    license_number?: string | null;
    state?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: string;
    mls_id?: string | null;
    mls_source?: string | null;
    full_name?: string;
    email?: string | null;
    phone?: string | null;
    office_name?: string | null;
    office_address?: string | null;
    license_number?: string | null;
    state?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
}
