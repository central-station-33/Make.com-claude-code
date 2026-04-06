export interface AuthFunctions {
  validate_invitation: {
    Args: { token: string };
    Returns: { is_valid: boolean; email: string; role: string };
  };
  has_role: {
    Args: { role: string };
    Returns: boolean;
  };
}