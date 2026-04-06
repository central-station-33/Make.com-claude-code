
import { supabase } from '@/integrations/supabase/client';
import { DatabaseInvitationStatus, DatabaseOnboardingStatus } from '@/types/invitation.types';

export const cleanupService = {
  async cleanupFailedInvitations(): Promise<void> {
    console.log('Cleaning up failed invitations...');
    
    try {
      const failedStatuses: DatabaseInvitationStatus[] = ['expired', 'revoked'];

      const { error: deleteError } = await supabase
        .from('invitations')
        .delete()
        .in('status', failedStatuses);

      if (deleteError) {
        console.error('Error deleting failed invitations:', deleteError);
        throw deleteError;
      }

      const failedOnboardingStatuses: DatabaseOnboardingStatus[] = ['rejected', 'suspended'];

      const { error: onboardingError } = await supabase
        .from('agent_onboarding')
        .delete()
        .in('status', failedOnboardingStatuses);

      if (onboardingError) {
        console.error('Error deleting failed onboarding records:', onboardingError);
        throw onboardingError;
      }

      const { error: logsError } = await supabase
        .from('system_logs')
        .delete()
        .eq('type', 'invitation_error');

      if (logsError) {
        console.error('Error deleting invitation error logs:', logsError);
        throw logsError;
      }

      console.log('Successfully cleaned up all failed invitations and related records');
    } catch (error) {
      console.error('Failed to clean up invitations:', error);
      throw error;
    }
  }
};
