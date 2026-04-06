import { Database } from "../../database.types";

export type TwoFactorRecoveryCodesTable = Database["public"]["Tables"]["two_factor_recovery_codes"]["Row"];
export type TwoFactorRecoveryCodesInsert = Database["public"]["Tables"]["two_factor_recovery_codes"]["Insert"];
export type TwoFactorRecoveryCodesUpdate = Database["public"]["Tables"]["two_factor_recovery_codes"]["Update"];