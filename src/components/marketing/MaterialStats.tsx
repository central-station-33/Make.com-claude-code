import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MaterialStats as MaterialStatsType } from "@/types/marketing.types";
import { Download, Eye, Star } from "lucide-react";

interface MaterialStatsProps {
  stats: MaterialStatsType;
}

const MaterialStats = ({ stats }: MaterialStatsProps) => {
  return (
    <div className="flex gap-4">
      <Card>
        <CardHeader className="py-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Download className="h-4 w-4" />
            Downloads
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <p className="text-2xl font-bold">{stats.downloads}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Views
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <p className="text-2xl font-bold">{stats.views}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Star className="h-4 w-4" />
            Favorites
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <p className="text-2xl font-bold">{stats.favorites}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialStats;