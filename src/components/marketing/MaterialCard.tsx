import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MaterialCardHeader } from "./components/MaterialCardHeader";
import { MaterialCardStats } from "./components/MaterialCardStats";
import { MaterialCardActions } from "./components/MaterialCardActions";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";

interface MaterialCardProps {
  material: {
    id: string;
    title: string;
    description: string;
    category: string;
    is_premium: boolean;
    download_count: number;
    view_count: number;
    file_type?: string;
    file_url?: string;
    brand_logo_url?: string;
  };
  viewMode: "grid" | "list";
  onPreview?: () => void;
  previewButton?: React.ReactNode;
  isFavorited?: boolean;
  onFavoriteToggle?: () => void;
}

export default function MaterialCard({ 
  material, 
  viewMode,
  previewButton,
  isFavorited = false,
  onFavoriteToggle = () => {}
}: MaterialCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (material.file_url) {
        const { data, error } = await supabase.storage
          .from('marketing_materials')
          .download(material.file_url);

        if (error) throw error;

        // Create a download link
        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${material.title}.${material.file_type || 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        await supabase
          .from('material_downloads')
          .insert([{ material_id: material.id }]);

        toast({
          title: "Download started",
          description: "Your download will begin shortly",
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Please try again later",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className={`${viewMode === "list" ? "flex" : ""} hover:shadow-lg transition-shadow`}>
      <div className={viewMode === "list" ? "flex-1" : ""}>
        <MaterialCardHeader
          title={material.title}
          description={material.description}
          isPremium={material.is_premium}
          category={material.category}
        />
        <CardContent>
          <div className="space-y-4">
            {material.brand_logo_url && (
              <img 
                src={material.brand_logo_url} 
                alt="Brand Logo" 
                className="h-8 w-auto mb-4"
              />
            )}
            <div className="flex items-center justify-between">
              <MaterialCardStats
                downloadCount={material.download_count}
                viewCount={material.view_count}
              />
              <div className="flex gap-2">
                {previewButton || (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onFavoriteToggle}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? "Downloading..." : "Download"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}