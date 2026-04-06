
import { supabase } from '@/integrations/supabase/client';
import { DatabaseOnboardingStatus } from '@/types/invitation.types';

export const onboardingService = {
  async createOnboarding(email: string): Promise<void> {
    console.log('Creating onboarding for:', email);
    
    try {
      const { data: existingAgent, error: checkError } = await supabase
        .from('agent_onboarding')
        .select('status')
        .eq('email', email)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing agent:', checkError);
        throw checkError;
      }

      if (existingAgent && existingAgent.status !== 'pending') {
        throw new Error('Agent with this email already exists');
      }

      const { error: upsertError } = await supabase
        .from('agent_onboarding')
        .upsert([{ 
          email, 
          status: 'pending' as DatabaseOnboardingStatus,
          full_name: email
        }], {
          onConflict: 'email'
        });

      if (upsertError) {
        console.error('Error creating onboarding:', upsertError);
        throw upsertError;
      }

      console.log('Onboarding created/updated successfully for:', email);
    } catch (error) {
      console.error('Failed to create onboarding:', error);
      throw error;
    }
  }
};
