
import { Tabs } from '@/components/ui/tabs';
import { TabContentProps } from './types/dashboard';
import TabList from './tabs/TabList';
import TabContents from './tabs/TabContents';
import { useToast } from "@/hooks/use-toast";

const DashboardTabs = ({
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
  showAdminFeatures = false,
}: TabContentProps) => {
  const { toast } = useToast();

  const handleImportSuccess = () => {
    toast({
      title: "Success",
      description: "Leads imported successfully",
    });
  };

  return (
    <div>
      <Tabs defaultValue="leads" className="space-y-4">
        <TabList />
        <TabContents
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
          showAdminFeatures={showAdminFeatures}
        />
      </Tabs>
    </div>
  );
};

export default DashboardTabs;
