
import { supabase } from '@/integrations/supabase/client';

export interface InvitationValidationResult {
  isValid: boolean;
  email?: string;
  role?: string;
  error?: string;
}

interface ValidateInvitationResponse {
  is_valid: boolean;
  email: string;
  role: string;
}

export const validateInvitation = async (token: string): Promise<InvitationValidationResult> => {
  try {
    console.log('Validating invitation for token:', token);
    
    const { data, error } = await supabase
      .rpc('validate_invitation', { _email: token });

    if (error) {
      console.error('RPC error:', error);
      throw error;
    }
    
    // First cast to unknown, then to the expected type
    const validationResult = data as unknown as ValidateInvitationResponse;
    
    // Validate the response structure
    if (!validationResult || 
        typeof validationResult.is_valid !== 'boolean' ||
        typeof validationResult.email !== 'string' ||
        typeof validationResult.role !== 'string') {
      throw new Error('Invalid response format from validate_invitation');
    }

    console.log('Validation result:', validationResult);

    return {
      isValid: validationResult.is_valid,
      email: validationResult.email,
      role: validationResult.role,
      error: validationResult.is_valid ? undefined : 'Invalid invitation'
    };
  } catch (err: any) {
    console.error('Error validating invitation:', err);
    return {
      isValid: false,
      error: err.message
    };
  }
};

export const checkExistingInvitation = async (email: string): Promise<boolean> => {
  try {
    console.log('Checking existing invitation for:', email);
    
    const { data, error } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    console.log('Existing invitation check result:', !!data);
    return !!data;
  } catch (err) {
    console.error('Error checking existing invitation:', err);
    return false;
  }
};
