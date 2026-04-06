
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MarketingMaterial } from "@/types/marketing.types";
import { Skeleton } from "@/components/ui/skeleton";

interface MaterialGridProps {
  materials: MarketingMaterial[];
  onEdit: (material: MarketingMaterial) => void;
  onDelete: (material: MarketingMaterial) => void;
  isLoading?: boolean;
}

export const MaterialGrid = ({ materials, onEdit, onDelete, isLoading }: MaterialGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[150px]" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
              <div className="mt-2 flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {materials.map((material) => (
        <Card key={material.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {material.title}
              {material.is_premium && (
                <Badge className="ml-2" variant="secondary">
                  Premium
                </Badge>
              )}
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(material)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(material)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{material.description}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">{material.category}</Badge>
              <Badge variant="outline">{material.type}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
