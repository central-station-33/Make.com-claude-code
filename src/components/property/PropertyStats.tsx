import { Property } from "@/services/realEstateService";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Clock, DollarSign, Calendar } from "lucide-react";

interface PropertyStatsProps {
  property: Property & { property_listing_history: any[] };
}

const PropertyStats = ({ property }: PropertyStatsProps) => {
  const getTotalPriceChange = (history: any[]) => {
    if (!history || history.length === 0) return 0;
    return history.reduce((sum, record) => sum + (record.price_change || 0), 0);
  };

  return (
    <div className="space-y-2 mt-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Calendar className="w-4 h-4" />
        <span>First Listed: {
          property.previous_listing_date 
            ? format(new Date(property.previous_listing_date), 'MMM d, yyyy')
            : 'N/A'
        }</span>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Clock className="w-4 h-4" />
        <span>Days on Market: {property.days_on_market || 'N/A'}</span>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <DollarSign className="w-4 h-4" />
        <span>Price Changes: {property.price_reductions || 0}</span>
      </div>
      
      {getTotalPriceChange(property.property_listing_history) !== 0 && (
        <p className={`text-sm ${
          getTotalPriceChange(property.property_listing_history) > 0 
            ? 'text-green-600' 
            : 'text-red-600'
        }`}>
          Total Price Change: {formatCurrency(getTotalPriceChange(property.property_listing_history))}
        </p>
      )}
    </div>
  );
};

export default PropertyStats;