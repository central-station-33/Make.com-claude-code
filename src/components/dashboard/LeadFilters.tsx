import SearchInput from "../crm/SearchInput";
import FilterDropdown from "../crm/FilterDropdown";

interface LeadFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  statusOptions: { label: string; value: string }[];
  typeOptions: { label: string; value: string }[];
}

const LeadFilters = ({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  statusOptions,
  typeOptions,
}: LeadFiltersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search leads..."
      />
      <FilterDropdown
        value={statusFilter}
        onChange={setStatusFilter}
        options={statusOptions.map(opt => ({
          ...opt,
          value: opt.value || "all"
        }))}
        placeholder="Filter by status"
      />
      <FilterDropdown
        value={typeFilter}
        onChange={setTypeFilter}
        options={typeOptions.map(opt => ({
          ...opt,
          value: opt.value || "all"
        }))}
        placeholder="Filter by type"
      />
    </div>
  );
};

export default LeadFilters;