
import { FC } from 'react';
import { TabContentProps } from '../types/dashboard';
import DashboardTabs from '../DashboardTabs';

const TabsSection: FC<TabContentProps> = ({
  leads,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  statusOptions,
  typeOptions,
  showAdminFeatures = false,
}) => {
  return (
    <div className="space-y-6">
      <DashboardTabs
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
    </div>
  );
};

export default TabsSection;
