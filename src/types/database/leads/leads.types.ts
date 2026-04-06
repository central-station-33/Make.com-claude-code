import { Database } from "../../database.types";

export type LeadsTable = Database["public"]["Tables"]["leads"]["Row"];
export type LeadsInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type LeadsUpdate = Database["public"]["Tables"]["leads"]["Update"];