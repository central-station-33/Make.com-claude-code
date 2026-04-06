
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DatabaseInvitationStatus } from '@/types/invitation.types';

export const useInvitationValidation = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const cleanupInvitations = async () => {
    try {
      const { data: success, error } = await supabase
        .rpc('delete_previous_invitations', {
          input_email: ''  // Empty string to delete all failed invitations
        });
      
      if (error) {
        console.error('Cleanup error:', error);
        throw error;
      }
      
      toast({
        title: "Cleanup Complete",
        description: "Successfully removed all failed invitations",
      });
      
      return true;
    } catch (err) {
      console.error('Cleanup failed:', err);
      toast({
        variant: "destructive",
        title: "Cleanup Failed",
        description: "Could not remove failed invitations",
      });
      return false;
    }
  };

  const checkRateLimit = async (userId: string): Promise<boolean> => {
    try {
      const { data: isLimited, error } = await supabase
        .rpc('check_invitation_rate_limit', { user_id: userId });
      
      if (error) {
        console.error('Rate limit check error:', error);
        throw error;
      }
      
      return !!isLimited;
    } catch (err) {
      console.error('Rate limit check failed:', err);
      return false;
    }
  };

  const validateEmail = (email: string) => {
    if (!email) {
      throw new Error('Email is required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  };

  const checkExistingInvitation = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('id, status, expires_at')
        .eq('email', email)
        .eq('status', DatabaseInvitationStatus.pending)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) {
        console.error('Error checking existing invitation:', error);
        throw error;
      }

      return !!data;
    } catch (err) {
      console.error('Existing invitation check failed:', err);
      return false;
    }
  };

  const validateInvite = async (email: string): Promise<boolean> => {
    try {
      validateEmail(email);

      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "You must be logged in to send invitations",
        });
        return false;
      }

      const isLimited = await checkRateLimit(user.id);
      if (isLimited) {
        toast({
          variant: "destructive",
          title: "Rate Limited",
          description: "Please wait before sending more invitations",
        });
        return false;
      }

      const hasExistingInvite = await checkExistingInvitation(email);
      if (hasExistingInvite) {
        toast({
          variant: "destructive",
          title: "Invitation Exists",
          description: "This email already has a pending invitation",
        });
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Invitation validation error:', error);
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: error.message || "Failed to validate invitation",
      });
      return false;
    }
  };

  return {
    cleanupInvitations,
    validateInvite,
    validateEmail,
    checkRateLimit,
    checkExistingInvitation
  };
};

export default useInvitationValidation;
