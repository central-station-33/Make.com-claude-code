export const validateEmail = (email: string): string | null => {
  if (!email) return "Email is required";
  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
    return "Invalid email address";
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required";
  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }
  return null;
};