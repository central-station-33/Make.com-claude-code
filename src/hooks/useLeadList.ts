
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lead, LeadType } from "@/types/lead";
import { useToast } from "@/hooks/use-toast";
import { useLeadsQuery } from "@/hooks/queries/useLeadsQuery";
import { useLeadFilters } from "@/hooks/useLeadFilters";

export const useLeadList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useLeadsQuery();
  
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

  const handleRowClick = (lead: Lead) => {
    navigate(`/leads/${lead.id}`);
  };

  return {
    leads,
    isLoading,
    error,
    sortField,
    sortDirection,
    handleSort,
    handleUploadSuccess,
    handleRowClick,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    statusOptions,
    typeOptions,
    getLeadsByType,
  };
};
