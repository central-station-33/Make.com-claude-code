
import { supabase } from '@/integrations/supabase/client';

export const emailService = {
  async sendInvitationEmail(email: string, token: string): Promise<void> {
    // This is now handled directly by Supabase's magic link system
    console.log('Email sending is handled by Supabase magic link system');
  }
};
