import { useMemo } from "react";
import { Lead } from "@/types/lead";

export const useFilteredLeads = (
  leads: Lead[],
  search: string,
  statusFilter: string,
  typeFilter: string
) => {
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        !search ||
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.email.toLowerCase().includes(search.toLowerCase()) ||
        lead.location?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;

      const matchesType = typeFilter === "all" || lead.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [leads, search, statusFilter, typeFilter]);

  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter((l) => l.status === "Qualified").length;
  const conversionRate = totalLeads ? (qualifiedLeads / totalLeads) * 100 : 0;

  return {
    filteredLeads,
    totalLeads,
    qualifiedLeads,
    conversionRate,
  };
};