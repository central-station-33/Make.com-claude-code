export interface Profile {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string | null;
  updated_at: string | null;
  company: string | null;
  license_number: string | null;
  avatar_url: string | null;
  status: string | null;
  last_login: string | null;
  mfa_enabled?: boolean;
  mfa_secret?: string | null;
  remember_me?: boolean;
  two_factor_enabled?: boolean;
  two_factor_secret?: string | null;
}