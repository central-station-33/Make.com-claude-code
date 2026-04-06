
import ErrorBoundary from "./ErrorBoundary";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import LeadListError from "./leads/LeadListError";
import LeadListEmpty from "./leads/LeadListEmpty";
import { LeadListHeader } from "./leads/LeadListHeader";
import { LeadListContent } from "./leads/LeadListContent";
import { useLeadListState } from "./leads/list/useLeadListState";
import { Lead, LeadType } from "@/types/lead";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { LeadImportExportTabs } from "./leads/tabs/LeadImportExportTabs";

const LeadList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    data,
    isLoading,
    error,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    statusOptions,
    typeOptions,
    refetch,
  } = useLeadListState();

  const leads = data?.leads || [];

  const handleSort = (field: keyof Lead) => {
    if (field === sortField) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getLeadsByType = (type: LeadType) => {
    return leads.filter(lead => lead.type === type);
  };

  const handleUploadSuccess = () => {
    refetch();
    toast({
      title: "Success",
      description: "Leads imported successfully",
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </Card>
    );
  }

  if (error) {
    return <LeadListError error={error instanceof Error ? error : new Error("Unknown error")} />;
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <Card className="p-6">
          <LeadListHeader onUploadSuccess={handleUploadSuccess} />
          <LeadListContent
            leads={leads}
            isLoading={isLoading}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onRowClick={(id) => navigate(`/leads/${id}`)}
            getLeadsByType={getLeadsByType}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            search={search}
            setSearch={setSearch}
            statusOptions={statusOptions}
            typeOptions={typeOptions}
          />
        </Card>
        
        <LeadImportExportTabs />
      </div>
    </ErrorBoundary>
  );
};

export default LeadList;
