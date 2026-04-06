import { Eye, Download } from "lucide-react";

interface MaterialCardStatsProps {
  downloadCount: number;
  viewCount: number;
}

export const MaterialCardStats = ({ downloadCount, viewCount }: MaterialCardStatsProps) => {
  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <Download className="h-4 w-4" />
        {downloadCount}
      </div>
      <div className="flex items-center gap-1">
        <Eye className="h-4 w-4" />
        {viewCount}
      </div>
    </div>
  );
};