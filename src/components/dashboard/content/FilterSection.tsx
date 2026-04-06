
import { FC } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import LeadFilterBar from '../filters/LeadFilterBar';

interface FilterSectionProps {
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  statusOptions: { label: string; value: string }[];
  typeOptions: { label: string; value: string }[];
}

const FilterSection: FC<FilterSectionProps> = ({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  statusOptions,
  typeOptions,
}) => {
  return (
    <ErrorBoundary>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4 sticky top-0 z-10">
        <LeadFilterBar
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
    </ErrorBoundary>
  );
};

export default FilterSection;
