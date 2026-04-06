export interface CandidateViews {
  candidate_statistics: {
    Row: {
      total_candidates: number | null;
      active_licenses: number | null;
      unique_specialties: number | null;
      states_represented: number | null;
    };
  };
}