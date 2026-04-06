import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterState } from "@/types/marketing.types";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MaterialSort } from "@/types/sort.types";

interface MaterialFiltersProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

const MaterialFilters = ({ filters, setFilters }: MaterialFiltersProps) => {
  const handleFilterChange = (key: keyof FilterState, value: string | boolean) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search materials..."
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="pl-9"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <Select
          value={filters.sort}
          onValueChange={(value: MaterialSort) => handleFilterChange("sort", value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Switch
            id="premium-filter"
            checked={filters.isPremium}
            onCheckedChange={(checked) => handleFilterChange("isPremium", checked)}
          />
          <Label htmlFor="premium-filter">Premium</Label>
        </div>

        {filters.category && (
          <Badge variant="secondary" className="gap-1">
            {filters.category}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default MaterialFilters;