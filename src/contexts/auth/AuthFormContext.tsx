
import { createContext, useContext, ReactNode } from 'react';
import { AuthFormContextType } from '@/types/auth.types';
import { useAuthFormProvider } from './useAuthFormProvider';
import { useAuthFormState } from '@/hooks/useAuthFormState';

const AuthFormContext = createContext<AuthFormContextType | undefined>(undefined);

export function AuthFormProvider({ children }: { children: ReactNode }) {
  const authState = useAuthFormState();
  const authFormProvider = useAuthFormProvider();
  
  const value: AuthFormContextType = {
    session: authFormProvider.session,
    user: authFormProvider.user,
    userRole: authFormProvider.userRole,
    email: authState.email,
    setEmail: authState.setEmail,
    isLoading: authState.isLoading,
    error: authState.error,
    success: authState.success,
    handleSignIn: authFormProvider.handleSignIn,
    handleSignUp: authFormProvider.handleSignUp,
    handleForgotPassword: authFormProvider.handleForgotPassword,
    handleResetPassword: authFormProvider.handleResetPassword,
    remainingAttempts: authState.remainingAttempts,
    isRateLimited: authState.isRateLimited,
    timeRemaining: authState.timeRemaining
  };
  
  return (
    <AuthFormContext.Provider value={value}>
      {children}
    </AuthFormContext.Provider>
  );
}

export function useAuthForm() {
  const context = useContext(AuthFormContext);
  if (!context) {
    throw new Error('useAuthForm must be used within an AuthFormProvider');
  }
  return context;
}
