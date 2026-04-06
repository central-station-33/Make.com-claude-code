import { Database } from "../../database.types";

export type UserRolesTable = Database["public"]["Tables"]["user_roles"]["Row"];
export type UserRolesInsert = Database["public"]["Tables"]["user_roles"]["Insert"];
export type UserRolesUpdate = Database["public"]["Tables"]["user_roles"]["Update"];