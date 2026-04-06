import { Database } from "../../database.types";

export type PasswordResetsTable = Database["public"]["Tables"]["password_resets"]["Row"];
export type PasswordResetsInsert = Database["public"]["Tables"]["password_resets"]["Insert"];
export type PasswordResetsUpdate = Database["public"]["Tables"]["password_resets"]["Update"];