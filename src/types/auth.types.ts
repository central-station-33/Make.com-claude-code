import type { User } from 'firebase/auth';

export interface AuthError {
  message: string;
  name: string;
  status?: number;
}

export interface SignInFormData {
  email: string;
  password?: string;
}

export interface SignInResult {
  success: boolean;
  error?: Error;
}

export interface AuthContextType {
  user: User | null;
  userRole: string | null;
  signIn: (email: string, password?: string) => Promise<{ data: unknown; error: null } | { data: null; error: unknown }>;
  signUp: (email: string) => Promise<{ data: unknown; error: null } | { data: null; error: unknown }>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export interface AuthFormContextType {
  user: User | null;
  userRole: string | null;
  email: string;
  setEmail: (email: string) => void;
  isLoading: boolean;
  error: AuthError | null;
  success: boolean;
  handleSignIn: (email: string, password?: string) => Promise<SignInResult>;
  handleSignUp: (email: string) => Promise<void>;
  handleForgotPassword: (email: string) => Promise<void>;
  handleResetPassword: (token: string, password: string) => Promise<void>;
  remainingAttempts: number;
  isRateLimited: boolean;
  timeRemaining: number;
}
