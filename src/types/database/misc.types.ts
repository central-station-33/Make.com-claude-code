
import { Database } from "../database.types";

export type CampaignsTable = Database["public"]["Tables"]["campaigns"]["Row"];
export type CandidatesTable = Database["public"]["Tables"]["candidates"]["Row"];
export type SavedSearchesTable = Database["public"]["Tables"]["saved_searches"]["Row"];
export type SystemLogsTable = Database["public"]["Tables"]["system_logs"]["Row"];
export type CandidateStatisticsView = Database["public"]["Views"]["candidate_statistics"]["Row"];

export type MiscTables = {
  campaigns: CampaignsTable;
  candidates: CandidatesTable;
  saved_searches: SavedSearchesTable;
  system_logs: SystemLogsTable;
};
