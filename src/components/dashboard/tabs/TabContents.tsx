
import { FC } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { TabContentProps } from '../types/dashboard';
import { LeadsTab } from './LeadsTab';
import { UnassignedTab } from './UnassignedTab';
import { AssignmentsTab } from './AssignmentsTab';
import ImportsTab from '@/components/leads/imports/ImportsTab';
import { LeadImportHistory } from '@/components/leads/LeadImportHistory';
import { useToast } from '@/hooks/use-toast';

const TabContents: FC<TabContentProps> = ({
  leads,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  statusOptions,
  typeOptions,
  isLoading = false,
}) => {
  const { toast } = useToast();

  const handleImportSuccess = () => {
    toast({
      title: "Success",
      description: "Leads imported successfully",
    });
  };

  return (
    <div className="mt-12 space-y-8">
      <TabsContent value="leads" className="mt-0">
        <LeadsTab
          leads={leads}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          statusOptions={statusOptions}
          typeOptions={typeOptions}
          isLoading={isLoading}
        />
      </TabsContent>

      <TabsContent value="unassigned" className="mt-0">
        <UnassignedTab
          leads={leads}
          isLoading={isLoading}
        />
      </TabsContent>

      <TabsContent value="assignments" className="mt-0">
        <AssignmentsTab leads={leads} />
      </TabsContent>

      <TabsContent value="import" className="mt-0">
        <div className="space-y-4">
          <ImportsTab onSuccess={handleImportSuccess} />
        </div>
      </TabsContent>

      <TabsContent value="history" className="mt-0">
        <div className="space-y-4">
          <LeadImportHistory />
        </div>
      </TabsContent>
    </div>
  );
};

export default TabContents;

