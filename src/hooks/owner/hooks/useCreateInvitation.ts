
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { invitationService } from '@/services/invitation';
import { useToast } from '@/hooks/use-toast';
import { useInvitationValidation } from '@/hooks/useInvitationValidation';
import { Invitation } from '@/types/invitation.types';
import { supabase } from '@/integrations/supabase/client';

export const useCreateInvitation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { validateInvite } = useInvitationValidation();

  const deletePreviousInvitations = async (email: string) => {
    const { error } = await supabase.rpc('delete_previous_invitations', {
      input_email: email
    });
    
    if (error) {
      console.error('Error deleting previous invitations:', error);
      throw error;
    }
  };

  const handleInvite = async (email: string): Promise<Invitation> => {
    if (isLoading) {
      throw new Error('An invitation is already being processed');
    }

    setIsLoading(true);
    try {
      if (!user) throw new Error('Authentication required');

      console.log('Creating invitation for:', email);

      // Delete any previous pending invitations first
      await deletePreviousInvitations(email);
      console.log('Deleted previous invitations for:', email);

      // Proceed with validation and new invitation creation
      const isValid = await validateInvite(email);
      if (!isValid) {
        throw new Error('Invalid invitation request');
      }

      const inviteData = await invitationService.createInvitation(email, user.id);
      await invitationService.createOnboarding(email);
      
      console.log('Created new invitation with ID:', inviteData);

      const { data: invitation, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', inviteData)
        .single();

      if (error || !invitation) {
        console.error('Error retrieving invitation:', error);
        throw new Error('Failed to retrieve invitation details');
      }

      await invitationService.sendInvitationEmail(email, invitation.token);

      toast({
        title: "Success",
        description: `Successfully sent invitation to ${email}`,
      });

      return invitation;
    } catch (error: any) {
      console.error("Invitation creation error:", error);
      
      const errorMessage = error.message.includes('duplicate key value') 
        ? 'This email already has a pending invitation'
        : error.message;
        
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleInvite,
    isLoading
  };
};
