
import { useAuthState } from '@/hooks/auth/useAuthState';
import { useSignInHandler } from '@/hooks/auth/useSignInHandler';
import { usePasswordResetHandler } from '@/hooks/auth/usePasswordResetHandler';
import { AuthFormContextType } from '@/types/auth.types';

export function useAuthFormProvider(): Omit<AuthFormContextType, 'email' | 'setEmail'> {
  const state = useAuthState();
  const { handleSignIn } = useSignInHandler(
    state.setIsLoading,
    state.setError,
    state.isRateLimited,
    state.timeRemaining
  );
  const { handleForgotPassword, handleResetPassword } = usePasswordResetHandler(
    state.setIsLoading,
    state.setError,
    state.setSuccess
  );

  return {
    session: state.session,
    user: state.session?.user ?? null,
    userRole: state.userRole,
    isLoading: state.isLoading,
    error: state.error,
    success: state.success,
    handleSignIn,
    handleForgotPassword,
    handleResetPassword,
    remainingAttempts: state.remainingAttempts,
    isRateLimited: state.isRateLimited,
    timeRemaining: state.timeRemaining,
  };
}
