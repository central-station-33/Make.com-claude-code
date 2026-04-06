type AuthMode = 'signIn' | 'signUp' | 'forgotPassword' | 'resetPassword';

interface AuthPageContent {
  title: string;
  description: string;
}

export const useAuthPageContent = (mode: AuthMode): AuthPageContent => {
  const content: Record<AuthMode, AuthPageContent> = {
    signIn: {
      title: 'Welcome Back',
      description: 'Sign in to your account to continue',
    },
    signUp: {
      title: 'Create an Account',
      description: 'Fill in your details to create your account',
    },
    forgotPassword: {
      title: 'Reset Password',
      description: 'Enter your email to receive a password reset link',
    },
    resetPassword: {
      title: 'Set New Password',
      description: 'Enter your new password',
    },
  };

  return content[mode];
};