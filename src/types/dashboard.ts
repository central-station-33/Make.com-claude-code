
import { Lead } from './lead';
import { Profile } from './profiles.types';
import { CRMContact } from './crm.types';

export interface LeadWithProfile extends Lead {
  profiles?: Profile | null;
  crm_contacts?: CRMContact[];
}

export interface LeadsQueryResult {
  leads: LeadWithProfile[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface AgentProgress {
  agent_id: string;
  agent_name: string;
  lead_count: number;
  activities_count: number;
  follow_ups_count: number;
  last_activity_date: string | null;
}

export interface TabContentProps {
  leads: LeadWithProfile[];
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  statusOptions: { label: string; value: string }[];
  typeOptions: { label: string; value: string }[];
  isLoading?: boolean;
  showAdminFeatures?: boolean;
}

export interface LeadTabProps extends TabContentProps {
  onSort?: (field: keyof Lead, direction: 'asc' | 'desc') => void;
  sortField?: keyof Lead;
  sortDirection?: 'asc' | 'desc';
}
