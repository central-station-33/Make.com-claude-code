export interface AuthTables {
  password_resets: {
    Row: {
      id: string;
      user_id: string | null;
      token: string;
      status: string | null;
      expires_at: string;
      created_at: string | null;
      updated_at: string | null;
      verification_attempts: number | null;
      last_attempt_at: string | null;
    };
  };
  profiles: {
    Row: {
      id: string;
      user_id: string | null;
      full_name: string;
      email: string;
      phone: string | null;
      created_at: string | null;
      updated_at: string | null;
      two_factor_enabled: boolean | null;
      two_factor_secret: string | null;
      remember_me: boolean | null;
      company: string | null;
      license_number: string | null;
      avatar_url: string | null;
      mfa_enabled: boolean | null;
      mfa_secret: string | null;
      status: string | null;
      last_login: string | null;
    };
  };
  two_factor_recovery_codes: {
    Row: {
      id: string;
      user_id: string;
      code: string;
      used: boolean | null;
      created_at: string | null;
      used_at: string | null;
    };
  };
  user_roles: {
    Row: {
      id: string;
      user_id: string;
      role: string;
      created_at: string | null;
    };
  };
}