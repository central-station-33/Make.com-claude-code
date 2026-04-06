export const useFormValidation = () => {
  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? null : 'Please enter a valid email address';
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    return password.length < 8 ? 'Password must be at least 8 characters' : null;
  };

  const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
    if (!confirmPassword) return 'Please confirm your password';
    return password !== confirmPassword ? 'Passwords do not match' : null;
  };

  return { validateEmail, validatePassword, validateConfirmPassword };
};