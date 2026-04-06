export const AUTH_CONSTANTS = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15, // minutes
  PASSWORD_REQUIREMENTS: [
    { rule: /.{8,}/, text: 'At least 8 characters' },
    { rule: /[A-Z]/, text: 'One uppercase letter' },
    { rule: /[a-z]/, text: 'One lowercase letter' },
    { rule: /[0-9]/, text: 'One number' },
    { rule: /[^A-Za-z0-9]/, text: 'One special character' },
  ],
  ROUTES: {
    SIGN_IN: '/auth',
    SIGN_UP: '/auth?type=signup',
    FORGOT_PASSWORD: '/auth?type=forgot',
    RESET_PASSWORD: '/auth?type=recovery',
    DASHBOARD: '/dashboard',
  },
};