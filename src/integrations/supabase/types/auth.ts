
import { BaseEntity } from './base';

export interface AuthTables {
  profiles: {
    Row: ProfileRow;
    Insert: ProfileInsert;
    Update: ProfileUpdate;
  };
  user_roles: {
    Row: UserRoleRow;
    Insert: UserRoleInsert;
    Update: UserRoleUpdate;
  };
  password_resets: {
    Row: PasswordResetRow;
    Insert: PasswordResetInsert;
    Update: PasswordResetUpdate;
  };
}

export interface ProfileRow extends BaseEntity {
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  two_factor_enabled: boolean | null;
  two_factor_secret: string | null;
  remember_me: boolean | null;
  company: string | null;
  license_number: string | null;
  avatar_url: string | null;
  status: string | null;
  last_login: string | null;
}

export type ProfileInsert = Partial<ProfileRow>;
export type ProfileUpdate = Partial<ProfileRow>;

export interface UserRoleRow extends BaseEntity {
  user_id: string;
  role: 'admin' | 'user' | 'owner';
}

export type UserRoleInsert = Partial<UserRoleRow>;
export type UserRoleUpdate = Partial<UserRoleRow>;

export interface PasswordResetRow extends BaseEntity {
  user_id: string | null;
  token: string;
  status: 'pending' | 'completed' | 'expired';
  expires_at: string;
  verification_attempts: number | null;
  last_attempt_at: string | null;
}

export type PasswordResetInsert = Partial<PasswordResetRow>;
export type PasswordResetUpdate = Partial<PasswordResetRow>;
