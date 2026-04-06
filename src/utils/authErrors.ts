
const errorMessages: Record<string, string> = {
  'Invalid login credentials': 'Invalid email or password. Please try again.',
  'Email not confirmed': 'Please verify your email address before signing in.',
  'Too many login attempts': 'Too many failed attempts. Please try again later.',
  'Invalid email format': 'Please enter a valid email address.',
  'Invalid credentials': 'Invalid email or password. Please check your credentials.',
  'Session expired': 'Your session has expired. Please sign in again.',
  '401': 'Authentication failed. Please check your credentials.',
};

export const getAuthErrorMessage = (message: string) => {
  // Log the raw error message for debugging
  console.log('Raw auth error message:', message);
  
  return errorMessages[message] || message;
};
