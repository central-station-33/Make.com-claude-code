import SearchInput from "./SearchInput";
import FilterDropdown from "./FilterDropdown";

interface ContactFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  stageFilter: string;
  setStageFilter: (value: string) => void;
  statusOptions: { label: string; value: string }[];
  stageOptions: { label: string; value: string }[];
}

const ContactFilters = ({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  stageFilter,
  setStageFilter,
  statusOptions,
  stageOptions,
}: ContactFiltersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search contacts..."
      />
      <FilterDropdown
        value={statusFilter}
        onChange={setStatusFilter}
        options={statusOptions}
        placeholder="Filter by status"
      />
      <FilterDropdown
        value={stageFilter}
        onChange={setStageFilter}
        options={stageOptions}
        placeholder="Filter by stage"
      />
    </div>
  );
};

export default ContactFilters;