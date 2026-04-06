import { Property } from "@/services/realEstateService";
import { Card } from "@/components/ui/card";
import { PropertyHeader } from "./PropertyHeader";
import { PriceInfo } from "./PriceInfo";
import { PropertyDetails } from "./PropertyDetails";

interface PropertyCardProps {
  property: Property & { property_listing_history: any[] };
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const getMarketTrend = (history: any[]) => {
    if (!history || history.length === 0) return null;
    const sortedHistory = [...history].sort((a, b) => 
      new Date(b.list_date).getTime() - new Date(a.list_date).getTime()
    );
    const latestPrice = sortedHistory[0].list_price;
    const initialPrice = sortedHistory[sortedHistory.length - 1].list_price;
    return latestPrice < initialPrice ? 'decrease' : 'increase';
  };

  const getTotalPriceChange = (history: any[]) => {
    if (!history || history.length === 0) return 0;
    return history.reduce((sum, record) => sum + (record.price_change || 0), 0);
  };

  const priceChange = getTotalPriceChange(property.property_listing_history);
  const trend = getMarketTrend(property.property_listing_history);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <PropertyHeader 
        virtualTourUrl={property.virtual_tour_url} 
        status={property.status} 
      />
      
      <div className="p-4">
        <PriceInfo 
          price={property.price}
          priceChange={priceChange}
          trend={trend as 'increase' | 'decrease' | null}
        />

        <PropertyDetails 
          address={property.address}
          propertyType={property.property_type}
          daysOnMarket={property.days_on_market}
          bedrooms={property.bedrooms}
          bathrooms={property.bathrooms}
          squareFeet={property.square_feet}
          amenities={property.amenities}
        />
      </div>
    </Card>
  );
};

export default PropertyCard;