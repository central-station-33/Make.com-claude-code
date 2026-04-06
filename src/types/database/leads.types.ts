import { Database } from "../database.types";

export type LeadMagnetInteractionsTable = Database["public"]["Tables"]["lead_magnet_interactions"]["Row"];
export type LeadsTable = Database["public"]["Tables"]["leads"]["Row"];

export type LeadsTables = {
  lead_magnet_interactions: LeadMagnetInteractionsTable;
  leads: LeadsTable;
};