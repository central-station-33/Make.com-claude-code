export interface CandidateFunctions {
  get_candidate_metrics: {
    Args: Record<string, never>;
    Returns: Array<{ metric_name: string; metric_value: number }>;
  };
  import_candidate_data: {
    Args: {
      name: string;
      experience: string;
      license_status: string;
      specialty: string;
      email: string;
      phone: string;
    };
    Returns: string;
  };
}