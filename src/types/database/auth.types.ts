import { Database } from "../database.types";

export type PasswordResetsTable = Database["public"]["Tables"]["password_resets"]["Row"];
export type ProfilesTable = Database["public"]["Tables"]["profiles"]["Row"];
export type TwoFactorRecoveryCodesTable = Database["public"]["Tables"]["two_factor_recovery_codes"]["Row"];
export type UserRolesTable = Database["public"]["Tables"]["user_roles"]["Row"];

export type AuthTables = {
  password_resets: PasswordResetsTable;
  profiles: ProfilesTable;
  two_factor_recovery_codes: TwoFactorRecoveryCodesTable;
  user_roles: UserRolesTable;
};