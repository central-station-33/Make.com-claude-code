import { Card, CardContent, CardHeader } from "@/components/ui/card";
import MaterialCard from "./MaterialCard";
import { MarketingMaterial } from "@/types/marketing.types";

interface MaterialListProps {
  materials: MarketingMaterial[];
  viewMode: "grid" | "list";
  isLoading: boolean;
  favorites?: Set<string>;
  onFavoriteToggle: (id: string) => void;
  onPreview?: (material: MarketingMaterial) => void;
}

export default function MaterialList({
  materials,
  viewMode,
  isLoading,
  favorites,
  onFavoriteToggle,
  onPreview
}: MaterialListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <Card key={n} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!materials || materials.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900">No materials found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <div className={`grid ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "grid-cols-1 gap-4"}`}>
      {materials.map((material) => (
        <MaterialCard
          key={material.id}
          material={material}
          viewMode={viewMode}
          isFavorited={favorites?.has(material.id)}
          onFavoriteToggle={() => onFavoriteToggle(material.id)}
          onPreview={onPreview ? () => onPreview(material) : undefined}
        />
      ))}
    </div>
  );
}