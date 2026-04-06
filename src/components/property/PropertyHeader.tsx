import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

interface PropertyHeaderProps {
  virtualTourUrl: string | null;
  status: string;
}

export const PropertyHeader = ({ virtualTourUrl, status }: PropertyHeaderProps) => {
  return (
    <div className="relative">
      <div className="aspect-video bg-gray-100 relative">
        {virtualTourUrl && (
          <Button 
            variant="secondary" 
            size="sm" 
            className="absolute top-2 right-2 z-10"
          >
            <Camera className="h-4 w-4 mr-1" />
            Virtual Tour
          </Button>
        )}
      </div>
      <Badge 
        className="absolute top-2 left-2" 
        variant={status === 'active' ? 'default' : 'secondary'}
      >
        {status}
      </Badge>
    </div>
  );
};