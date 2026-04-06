import { Database } from "../database.types";

export type PropertiesTable = Database["public"]["Tables"]["properties"]["Row"];
export type PropertyCandidateMatchesTable = Database["public"]["Tables"]["property_candidate_matches"]["Row"];

export type PropertiesTables = {
  properties: PropertiesTable;
  property_candidate_matches: PropertyCandidateMatchesTable;
};