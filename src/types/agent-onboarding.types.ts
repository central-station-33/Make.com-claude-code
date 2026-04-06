
import { Database } from "@/integrations/supabase/types";

export type AgentOnboardingRow = Database["public"]["Tables"]["agent_onboarding"]["Row"];

export interface AgentOnboarding {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  license_number: string | null;
  company: string | null;
  state: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  activation_type?: 'leads' | 'training' | null;
  payment_status?: string | null;
  processed_at?: string | null;
  processed_by?: string | null;
  error_message?: string | null;
  retry_count?: number;
  last_retry_at?: string | null;
  distribution_status?: 'active' | 'paused' | 'limited';
  daily_lead_limit?: number;
  leads_received_today?: number;
  leads_distribution_updated_at?: string;
}
