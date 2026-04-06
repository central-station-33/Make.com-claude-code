import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useLeadListState } from "./useLeadListState";
import { LeadListHeader } from "./LeadListHeader";
import { LeadListContent } from "./LeadListContent";
import { LeadListEmpty } from "./LeadListEmpty";
import { LeadListError } from "./LeadListError";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Lead } from "@/types/lead";

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
    getLeadsByType,
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

  if (!leads?.length) {
    return (
      <Card className="p-6">
        <LeadListHeader onUploadSuccess={handleUploadSuccess} />
        <LeadListEmpty />
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <Card className="p-6">
        <LeadListHeader onUploadSuccess={handleUploadSuccess} />
        <LeadListContent
          leads={leads}
          isLoading={isLoading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onRowClick={(lead) => navigate(`/leads/${lead.id}`)}
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
    </ErrorBoundary>
  );
};

export default LeadList;