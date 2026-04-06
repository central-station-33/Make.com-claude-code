import { useState } from "react";
import { Lead, LeadType } from "@/types/lead";
import { useLeadsQuery } from "@/hooks/queries/useLeadsQuery";
import { useLeadFilters } from "@/hooks/useLeadFilters";

export const useLeadListState = () => {
  const [sortField, setSortField] = useState<keyof Lead>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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

  const { data, isLoading, error, refetch } = useLeadsQuery();

  const getLeadsByType = (type: LeadType) => {
    return data?.leads?.filter(lead => lead.type === type) || [];
  };

  return {
    data,
    isLoading,
    error,
    sortField,
    setSortField,
    sortDirection,
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
  };
};