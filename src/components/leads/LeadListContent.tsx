import { Lead, LeadType } from "@/types/lead";
import LeadTable from "../leads/table/LeadTable";
import { MarketingButton } from "./MarketingButton";

export interface LeadListContentProps {
  leads: Lead[];
  isLoading: boolean;
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
}

export const LeadListContent = ({
  leads,
  isLoading,
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
}: LeadListContentProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <MarketingButton type={LeadType.BUYER} />
      </div>
      <LeadTable
        leads={leads}
        isLoading={isLoading}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={onSort}
        onRowClick={onRowClick}
      />
    </div>
  );
};