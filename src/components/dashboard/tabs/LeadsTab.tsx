import React, { useState } from 'react';
import LeadTable from '@/components/leads/table/LeadTable';
import { Lead, LeadType } from '@/types/lead';
import { LeadTabProps } from '../types/dashboard';

export const LeadsTab = ({
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
}: LeadTabProps) => {
  const [sortField, setSortField] = useState<keyof Lead>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Lead) => {
    setSortField(field);
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const sortedLeads = [...leads].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === null || bValue === null) return 0;

    const comparison = String(aValue).localeCompare(String(bValue));
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="space-y-4">
      <LeadTable 
        leads={sortedLeads}
        isLoading={isLoading}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onRowClick={() => {}}
      />
    </div>
  );
};