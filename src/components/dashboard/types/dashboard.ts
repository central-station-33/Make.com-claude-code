import { Lead } from '@/types/lead';

export interface TabContentProps {
  leads: Lead[];
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