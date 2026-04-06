import { Database } from "../../database.types";

export type SystemLogsTable = Database["public"]["Tables"]["system_logs"]["Row"];
export type SystemLogsInsert = Database["public"]["Tables"]["system_logs"]["Insert"];
export type SystemLogsUpdate = Database["public"]["Tables"]["system_logs"]["Update"];

export type SavedSearchesTable = Database["public"]["Tables"]["saved_searches"]["Row"];
export type SavedSearchesInsert = Database["public"]["Tables"]["saved_searches"]["Insert"];
export type SavedSearchesUpdate = Database["public"]["Tables"]["saved_searches"]["Update"];