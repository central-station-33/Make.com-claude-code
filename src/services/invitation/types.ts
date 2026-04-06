
import { Invitation, DatabaseInvitationStatus } from "@/types/invitation.types";

export interface CreateInvitationParams {
  email: string;
  createdBy: string;
}

export interface ProcessInvitationParams {
  invitationId: string;
  status: DatabaseInvitationStatus;
}

export type InvitationResponse = {
  data: Invitation | null;
  error: Error | null;
};
