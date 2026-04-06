import { Database } from "../../database.types";

export type CampaignsTable = Database["public"]["Tables"]["campaigns"]["Row"];
export type CampaignsInsert = Database["public"]["Tables"]["campaigns"]["Insert"];
export type CampaignsUpdate = Database["public"]["Tables"]["campaigns"]["Update"];