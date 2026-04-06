
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AuthError } from '@/types/auth.types';

export const useSignUpHandler = (
  setIsLoading: (loading: boolean) => void,
  setError: (error: AuthError | null) => void,
  setSuccess: (success: boolean) => void
) => {
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleSignUp = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await signUp(email);
      
      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Success",
        description: "Please check your email to verify your account",
      });
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred during sign up';
      setError({ 
        message: errorMessage,
        name: 'AuthError',
        status: err.status,
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSignUp };
};
