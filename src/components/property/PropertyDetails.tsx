import { Badge } from "@/components/ui/badge";
import { MapPin, Home, Clock } from "lucide-react";

interface PropertyDetailsProps {
  address: string;
  propertyType: string | null;
  daysOnMarket: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  amenities?: string[];
}

export const PropertyDetails = ({ 
  address, 
  propertyType, 
  daysOnMarket, 
  bedrooms, 
  bathrooms, 
  squareFeet,
  amenities 
}: PropertyDetailsProps) => {
  return (
    <div className="space-y-2 text-sm text-gray-600">
      <div className="flex items-center">
        <MapPin className="h-4 w-4 mr-2" />
        {address}
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <Home className="h-4 w-4 mr-1" />
          {propertyType}
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          {daysOnMarket || 0} days
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div>🛏️ {bedrooms || '-'} beds</div>
        <div>🚿 {bathrooms || '-'} baths</div>
        <div>📏 {squareFeet?.toLocaleString() || '-'} sqft</div>
      </div>

      {amenities && amenities.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {amenities.slice(0, 3).map((amenity, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {amenity}
            </Badge>
          ))}
          {amenities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{amenities.length - 3} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};