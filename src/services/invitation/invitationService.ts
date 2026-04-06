
import { supabase } from '@/integrations/supabase/client';
import { Invitation, DatabaseInvitationStatus } from '@/types/invitation.types';
import { cleanupService } from './cleanupService';
import { emailService } from './emailService';
import { onboardingService } from './onboardingService';
import type { CreateInvitationParams, ProcessInvitationParams } from './types';

export const invitationService = {
  async checkExistingInvite(email: string): Promise<Invitation | null> {
    console.log('Checking existing invite for:', email);
    
    try {
      const { data: existingInvite, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', email)
        .eq('status', DatabaseInvitationStatus.pending)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) {
        console.error('Error checking existing invite:', error);
        throw error;
      }

      console.log('Existing invite result:', existingInvite);
      return existingInvite as Invitation;
    } catch (error) {
      console.error('Failed to check existing invite:', error);
      throw error;
    }
  },

  async createInvitation(email: string, createdBy: string): Promise<string> {
    console.log('Creating invitation for:', email, 'by:', createdBy);
    
    try {
      const siteURL = window.location.origin;
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteURL}/auth/callback?invite=true`,
          data: {
            created_by: createdBy,
            invitation_type: 'magic_link',
            redirect_url: `${siteURL}/dashboard`
          }
        }
      });

      if (error) {
        console.error('Error creating invitation:', error);
        throw error;
      }

      console.log('Magic link invitation sent successfully');
      return email;
    } catch (error) {
      console.error('Failed to create invitation:', error);
      throw error;
    }
  },

  async resendInvitation(email: string): Promise<boolean> {
    console.log('Resending invitation:', email);
    
    try {
      const siteURL = window.location.origin;
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteURL}/auth/callback?invite=true`,
          data: {
            redirect_url: `${siteURL}/dashboard`
          }
        }
      });

      if (error) {
        console.error('Error resending invitation:', error);
        throw error;
      }

      console.log('Invitation resent successfully');
      return true;
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      throw error;
    }
  },

  async processInvitation({ invitationId, status }: ProcessInvitationParams): Promise<void> {
    // Since we're using magic links, we don't need to process invitations separately
    // The status is handled by Supabase auth automatically
    console.log('Magic link invitation processing is handled automatically by Supabase');
  },

  createOnboarding: onboardingService.createOnboarding,
  sendInvitationEmail: emailService.sendInvitationEmail,
  cleanupFailedInvitations: cleanupService.cleanupFailedInvitations
};

export * from './types';

