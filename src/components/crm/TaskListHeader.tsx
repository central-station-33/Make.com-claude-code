import SearchInput from "./SearchInput";
import FilterDropdown from "./FilterDropdown";

interface TaskListHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
}

const TaskListHeader = ({
  search,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
}: TaskListHeaderProps) => {
  const priorityOptions = [
    { label: "All Priorities", value: "" },
    { label: "High", value: "high" },
    { label: "Medium", value: "medium" },
    { label: "Low", value: "low" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pending Tasks</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search tasks..."
        />
        <FilterDropdown
          value={priorityFilter}
          onChange={onPriorityFilterChange}
          options={priorityOptions}
          placeholder="Filter by priority"
        />
      </div>
    </div>
  );
};

export default TaskListHeader;