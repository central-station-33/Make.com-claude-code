
import { Database } from "@/integrations/supabase/types";
import { SystemEnums } from "@/types/supabase/enums/system.types";

// Define database-specific status types to match Supabase schema
export const DatabaseInvitationStatus = {
  pending: 'pending',
  accepted: 'accepted',
  expired: 'expired',
  revoked: 'revoked'
} as const;

export type DatabaseInvitationStatus = (typeof DatabaseInvitationStatus)[keyof typeof DatabaseInvitationStatus];

export const DatabaseOnboardingStatus = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  suspended: 'suspended'
} as const;

export type DatabaseOnboardingStatus = (typeof DatabaseOnboardingStatus)[keyof typeof DatabaseOnboardingStatus];

export interface Invitation {
  id: string;
  email: string;
  token: string;
  status: DatabaseInvitationStatus;
  expires_at: string;
  created_at?: string;
  created_by?: string;
  role?: SystemEnums['app_role'];
  last_sent_at?: string;
  accepted_at?: string;
  view_count?: number;
  first_viewed_at?: string;
  batch_id?: string;
  invitation_type?: string;
  last_resend_at?: string;
}

export interface InviteAgentState {
  isLoading: boolean;
  inviteStatus: "idle" | "sent" | "opened";
  error?: string;
}

export interface CreateInvitationResponse {
  data: Invitation | null;
  error: Error | null;
}
