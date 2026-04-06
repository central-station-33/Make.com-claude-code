
export * from './auth';
export * from './crm';
export * from './leads';
export * from './properties';
export * from './agents';
export * from './misc';

import { AgentCredentialsTable, AgentOnboardingTable, AgentToolsTable, AgentContactsTable } from './agents';
import { CampaignsTable, CandidatesTable, CandidateStatisticsView } from './misc';
import { CRMActivitiesTable, CRMContactsTable } from './crm';
import { LeadMagnetInteractionsTable, LeadsTable } from './leads';
import { PasswordResetsTable, ProfilesTable } from './auth';
import { PropertiesTable, PropertyCandidateMatchesTable } from './properties';
import { SavedSearchesTable, SystemLogsTable } from './misc';
import { TwoFactorRecoveryCodesTable, UserRolesTable } from './auth';

export interface DatabaseTables {
  agent_credentials: AgentCredentialsTable;
  agent_onboarding: AgentOnboardingTable;
  agent_tools: AgentToolsTable;
  agent_contacts: AgentContactsTable;
  campaigns: CampaignsTable;
  candidates: CandidatesTable;
  crm_activities: CRMActivitiesTable;
  crm_contacts: CRMContactsTable;
  lead_magnet_interactions: LeadMagnetInteractionsTable;
  leads: LeadsTable;
  password_resets: PasswordResetsTable;
  profiles: ProfilesTable;
  properties: PropertiesTable;
  property_candidate_matches: PropertyCandidateMatchesTable;
  saved_searches: SavedSearchesTable;
  system_logs: SystemLogsTable;
  two_factor_recovery_codes: TwoFactorRecoveryCodesTable;
  user_roles: UserRolesTable;
}

export interface DatabaseViews {
  candidate_statistics: CandidateStatisticsView;
}

export interface DatabaseFunctions {
  get_candidate_metrics: {
    Args: Record<string, never>;
    Returns: Array<{
      metric_name: string;
      metric_value: number;
    }>;
  };
  handle_new_user: {
    Args: Record<string, never>;
    Returns: void;
  };
  has_role: {
    Args: { _role: string };
    Returns: boolean;
  };
  import_candidate_data: {
    Args: {
      _name: string;
      _experience: string;
      _license_status: string;
      _specialty: string;
      _email: string;
      _phone: string;
    };
    Returns: string;
  };
}

export interface DatabaseEnums {
  app_role: 'admin' | 'user';
  log_type: 'system' | 'user' | 'error';
  reset_status: 'pending' | 'completed' | 'expired';
}
