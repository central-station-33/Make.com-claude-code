import { Database } from "../../database.types";

export type CandidatesTable = Database["public"]["Tables"]["candidates"]["Row"];
export type CandidatesInsert = Database["public"]["Tables"]["candidates"]["Insert"];
export type CandidatesUpdate = Database["public"]["Tables"]["candidates"]["Update"];

export type CandidateStatisticsView = Database["public"]["Views"]["candidate_statistics"]["Row"];