
import { useAuthState } from '@/hooks/auth/useAuthState';
import { useSignInHandler } from '@/hooks/auth/useSignInHandler';
import { useSignUpHandler } from '@/hooks/auth/useSignUpHandler';
import { usePasswordResetHandler } from '@/hooks/auth/usePasswordResetHandler';

export function useAuthFormProvider() {
  const state = useAuthState();
  const { handleSignIn } = useSignInHandler(
    state.setIsLoading,
    state.setError,
    state.isRateLimited,
    state.timeRemaining
  );
  const { handleSignUp } = useSignUpHandler(
    state.setIsLoading,
    state.setError,
    state.setSuccess
  );
  const { handleForgotPassword, handleResetPassword } = usePasswordResetHandler(
    state.setIsLoading,
    state.setError,
    state.setSuccess
  );

  return {
    session: state.session,
    userRole: state.userRole,
    handleSignIn,
    handleSignUp,
    handleForgotPassword,
    handleResetPassword,
    ...state
  };
}
