
export interface LeadControlSettings {
  id: string;
  auto_assign_enabled: boolean;
  daily_lead_limit: number;
  pause_distribution: boolean;
  archive_instead_of_delete: boolean;
  lock_version?: number;
}

export const DEFAULT_SETTINGS: Omit<LeadControlSettings, 'id'> = {
  auto_assign_enabled: true,
  daily_lead_limit: 10,
  pause_distribution: false,
  archive_instead_of_delete: false,
  lock_version: 0
};
