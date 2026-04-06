import { Lead, LeadType } from "@/types/lead";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import LeadListError from "../LeadListError";
import LeadListEmpty from "../LeadListEmpty";
import { LeadListHeader } from "../LeadListHeader";
import { LeadListContent } from "../LeadListContent";

interface LeadListViewProps {
  leads: Lead[];
  isLoading: boolean;
  error: Error | null;
  sortField: keyof Lead;
  sortDirection: "asc" | "desc";
  onSort: (field: keyof Lead) => void;
  onRowClick: (lead: Lead) => void;
  getLeadsByType: (type: LeadType) => Lead[];
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  search: string;
  setSearch: (value: string) => void;
  statusOptions: Array<{ label: string; value: string }>;
  typeOptions: Array<{ label: string; value: string }>;
  onUploadSuccess: () => void;
}

export const LeadListView = ({
  leads,
  isLoading,
  error,
  sortField,
  sortDirection,
  onSort,
  onRowClick,
  getLeadsByType,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  search,
  setSearch,
  statusOptions,
  typeOptions,
  onUploadSuccess
}: LeadListViewProps) => {
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
        <LeadListHeader onUploadSuccess={onUploadSuccess} />
        <LeadListEmpty />
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <Card className="p-6">
        <LeadListHeader onUploadSuccess={onUploadSuccess} />
        <LeadListContent
          leads={leads}
          isLoading={isLoading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
          onRowClick={onRowClick}
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