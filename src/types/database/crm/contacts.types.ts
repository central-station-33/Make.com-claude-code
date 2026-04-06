import { Database } from "../../database.types";

export type CRMContactsTable = Database["public"]["Tables"]["crm_contacts"]["Row"];
export type CRMContactsInsert = Database["public"]["Tables"]["crm_contacts"]["Insert"];
export type CRMContactsUpdate = Database["public"]["Tables"]["crm_contacts"]["Update"];