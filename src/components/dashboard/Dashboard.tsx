
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLeadFilters } from "@/hooks/useLeadFilters";
import { useLeadsQuery } from "@/hooks/queries/useLeadsQuery";
import { useFilteredLeads } from "@/hooks/useFilteredLeads";
import { useAuth } from "@/contexts/AuthContext";
import DashboardContent from "./DashboardContent";
import DashboardError from "./states/DashboardError";
import DashboardLoading from "./states/DashboardLoading";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Plus, Download, Users, UserMinus, ClipboardList, List, Import } from "lucide-react";
import { useLeadStats } from "@/hooks/useLeadStats";
import DashboardStats from "./DashboardStats";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CreateLeadForm from '@/components/leads/CreateLeadForm';
import { useDataExport } from '@/hooks/useDataExport';
import LeadImportForm from '@/components/leads/imports/LeadImportForm';

const Dashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session, userRole } = useAuth();
  const [showContent, setShowContent] = useState(true);
  const { exportToStorage } = useDataExport();

  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    statusOptions,
    typeOptions,
  } = useLeadFilters();

  const { 
    data: leadsData, 
    isLoading: leadsLoading, 
    error: leadsError,
    refetch 
  } = useLeadsQuery();

  const { data: statsData, isLoading: statsLoading } = useLeadStats();

  const leads = useMemo(() => leadsData?.leads || [], [leadsData?.leads]);
  const { filteredLeads } = useFilteredLeads(leads, search, statusFilter, typeFilter);

  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
      toast({
        title: "Dashboard Refreshed",
        description: "The dashboard data has been reloaded.",
        variant: "default",
      });
    } catch (err) {
      console.error("Refresh error:", err);
      toast({
        variant: "destructive",
        title: "Refresh Failed",
        description: "Failed to refresh dashboard data. Please try again.",
      });
    }
  }, [refetch, queryClient, toast]);

  const handleExportLeads = async () => {
    try {
      const result = await exportToStorage({
        tableName: 'leads',
        column: '*',
        destinationPath: 'leads-export'
      });

      if (result) {
        toast({
          title: "Export Successful",
          description: "Your leads have been exported. Click to download.",
          action: (
            <Button variant="outline" onClick={() => window.open(result.url, '_blank')}>
              Download
            </Button>
          ),
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "There was an error exporting your leads.",
      });
    }
  };

  const isLoading = leadsLoading || statsLoading;

  if (leadsError) {
    console.error("Dashboard error:", leadsError);
    return <DashboardError error={leadsError instanceof Error ? leadsError : new Error("Failed to load dashboard data")} />;
  }

  if (isLoading) {
    return <DashboardLoading />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <div className="border-b pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-wrap gap-4 items-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 flex-1 md:flex-none">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lead
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Lead</DialogTitle>
                  </DialogHeader>
                  <CreateLeadForm onSuccess={() => window.location.reload()} />
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={handleExportLeads} className="gap-2 flex-1 md:flex-none">
                <Download className="h-4 w-4" />
                Export Leads
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="gap-2 flex-1 md:flex-none">
                    <Import className="h-4 w-4" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Leads</DialogTitle>
                  </DialogHeader>
                  <LeadImportForm onSuccess={() => window.location.reload()} />
                </DialogContent>
              </Dialog>

              <Button 
                variant="secondary" 
                className="gap-2 flex-1 md:flex-none"
              >
                <List className="h-4 w-4" />
                Lead List
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="secondary" className="gap-2 flex-1 md:flex-none">
                <Users className="h-4 w-4" />
                All Leads
              </Button>

              <Button variant="secondary" className="gap-2 flex-1 md:flex-none">
                <UserMinus className="h-4 w-4" />
                Unassigned
              </Button>

              <Button variant="secondary" className="gap-2 flex-1 md:flex-none">
                <ClipboardList className="h-4 w-4" />
                Assignments
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6 mt-6">
          <DashboardStats />
          <DashboardContent
            leads={filteredLeads}
            isLoading={isLoading}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            statusOptions={statusOptions}
            typeOptions={typeOptions}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
