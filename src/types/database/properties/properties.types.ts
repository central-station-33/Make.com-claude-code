import { Database } from "../../database.types";

export type PropertiesTable = Database["public"]["Tables"]["properties"]["Row"];
export type PropertiesInsert = Database["public"]["Tables"]["properties"]["Insert"];
export type PropertiesUpdate = Database["public"]["Tables"]["properties"]["Update"];