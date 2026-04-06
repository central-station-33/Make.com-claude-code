import { Input } from "@/components/ui/input";

interface PropertySearchProps {
  search: string;
  setSearch: (value: string) => void;
}

const PropertySearch = ({ search, setSearch }: PropertySearchProps) => {
  return (
    <div className="mb-4">
      <Input
        type="text"
        placeholder="Search properties by address..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />
    </div>
  );
};

export default PropertySearch;