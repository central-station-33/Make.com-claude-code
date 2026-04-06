import { useQuery } from "@tanstack/react-query";
import { Property } from "@/services/realEstateService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Home, DollarSign, Filter } from "lucide-react";
import PropertyCard from "./property/PropertyCard";

const PropertyList = () => {
  const [search, setSearch] = useState("");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [propertyType, setPropertyType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['properties', search, priceRange, propertyType, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select(`
          *,
          property_listing_history (
            list_date,
            list_price,
            status,
            days_on_market,
            price_change
          )
        `);

      // Apply filters
      if (search) {
        query = query.ilike('address', `%${search}%`);
      }

      if (propertyType !== 'all') {
        query = query.eq('property_type', propertyType);
      }

      if (priceRange !== 'all') {
        const [min, max] = priceRange.split('-').map(Number);
        query = query.gte('price', min).lte('price', max);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price_high':
          query = query.order('price', { ascending: false });
          break;
        case 'price_low':
          query = query.order('price', { ascending: true });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as (Property & { property_listing_history: any[] })[];
    },
  });

  const renderFilters = () => (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={propertyType} onValueChange={setPropertyType}>
        <SelectTrigger className="w-[200px]">
          <Home className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Property Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="house">House</SelectItem>
          <SelectItem value="apartment">Apartment</SelectItem>
          <SelectItem value="condo">Condo</SelectItem>
          <SelectItem value="townhouse">Townhouse</SelectItem>
        </SelectContent>
      </Select>
      <Select value={priceRange} onValueChange={setPriceRange}>
        <SelectTrigger className="w-[200px]">
          <DollarSign className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Price Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any Price</SelectItem>
          <SelectItem value="0-250000">Under $250k</SelectItem>
          <SelectItem value="250000-500000">$250k - $500k</SelectItem>
          <SelectItem value="500000-750000">$500k - $750k</SelectItem>
          <SelectItem value="750000-1000000">$750k - $1M</SelectItem>
          <SelectItem value="1000000-99999999">$1M+</SelectItem>
        </SelectContent>
      </Select>
      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="w-[200px]">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="price_high">Price: High to Low</SelectItem>
          <SelectItem value="price_low">Price: Low to High</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Property History Analysis</h2>
        {renderFilters()}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[300px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          Error loading properties: {error instanceof Error ? error.message : 'Unknown error occurred'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Property History Analysis</h2>
        {renderFilters()}
        <Alert className="mb-4">
          <AlertDescription>
            No properties found. Try adjusting your search criteria.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center space-x-4 mb-6">
        <img 
          src="/lovable-uploads/9426cd2c-3e5d-46c0-8df6-12e24c277730.png" 
          alt="JRA Logo" 
          className="h-12 w-auto"
        />
        <div>
          <h1 className="text-2xl font-bold">Central Station</h1>
          <p className="text-sm text-muted-foreground">Property History Analysis</p>
        </div>
      </div>
      
      {renderFilters()}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
};

export default PropertyList;