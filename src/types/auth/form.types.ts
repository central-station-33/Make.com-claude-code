
export type AuthFormMode = 'signIn' | 'signUp' | 'forgotPassword' | 'resetPassword';

export interface AuthFormState {
  email: string;
  isLoading: boolean;
  error: any | null;
  success: boolean;
  remainingAttempts: number;
  isRateLimited: boolean;
  rateLimitExpiry: string | null;
  timeRemaining: number;
}
