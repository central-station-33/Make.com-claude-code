
import { FC } from 'react';
import { LeadWithProfile } from '@/types/dashboard';
import LeadStatsSection from './content/LeadStatsSection';
import TrendsSection from './content/TrendsSection';
import FilterSection from './content/FilterSection';
import TabsSection from './content/TabsSection';
import { useAuth } from '@/contexts/AuthContext';
import { useDataExport } from '@/hooks/useDataExport';
import { useToast } from '@/hooks/use-toast';

interface DashboardContentProps {
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

const DashboardContent: FC<DashboardContentProps> = ({
  leads = [],
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  statusOptions,
  typeOptions,
  isLoading = false,
  showAdminFeatures = false,
}) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <TabsSection
        leads={leads}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusOptions={statusOptions}
        typeOptions={typeOptions}
        showAdminFeatures={showAdminFeatures}
      />

      <FilterSection
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusOptions={statusOptions}
        typeOptions={typeOptions}
      />

      <LeadStatsSection leads={leads} />
      <TrendsSection leads={leads} isLoading={isLoading} />
    </div>
  );
};

export default DashboardContent;
