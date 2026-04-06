import { Database } from "../database.types";

export type CRMActivitiesTable = Database["public"]["Tables"]["crm_activities"]["Row"];
export type CRMContactsTable = Database["public"]["Tables"]["crm_contacts"]["Row"];

export type CRMTables = {
  crm_activities: CRMActivitiesTable;
  crm_contacts: CRMContactsTable;
};