import { useState } from "react";
import { LeadStatus, LeadType } from "@/types/lead";

export const useLeadFilters = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const statusOptions = [
    { label: "All Statuses", value: "all" },
    { label: "New", value: LeadStatus.NEW },
    { label: "Contacted", value: LeadStatus.CONTACTED },
    { label: "Qualified", value: LeadStatus.QUALIFIED },
    { label: "Negotiating", value: LeadStatus.NEGOTIATING },
    { label: "Closed", value: LeadStatus.CLOSED },
    { label: "Lost", value: LeadStatus.LOST },
  ];

  const typeOptions = [
    { label: "All Types", value: "all" },
    { label: "Buyer", value: LeadType.BUYER },
    { label: "Seller", value: LeadType.SELLER },
    { label: "Investor", value: LeadType.INVESTOR },
  ];

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    statusOptions,
    typeOptions,
  };
};