import { getCurrentUser, signOut as firebaseSignOut } from "@/integrations/firebase/authHelpers";

interface PropertyListing {
  property_id: string;
  address: {
    line: string;
    city: string;
    state: string;
    postal_code: string;
  };
  price: number;
  beds: number;
  baths: number;
  building_size: {
    size: number;
    units: string;
  };
  property_type: string;
}

export interface Property {
  id: string;
  address: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  property_type: string | null;
  mls_number: string | null;
  sell_score: number | null;
  previous_listing_date: string | null;
  previous_listing_price: number | null;
  days_on_market: number | null;
  price_reductions: number | null;
  last_list_price: number | null;
  virtual_tour_url: string | null;
  status: string;
  amenities: string[];
  location_data: Record<string, any>;
}

export const fetchPropertyListings = async (city: string = "New York", state: string = "NY"): Promise<Property[]> => {
  try {
    const session = { user: getCurrentUser() }; const authError = null;
    
    if (authError || !session) {
      console.error('Authentication error:', authError);
      return [];
    }

    const { data: existingData, error: supabaseError } = await supabase
      .from('properties')
      .select('*')
      .ilike('address', `%${city}%`)
      .ilike('address', `%${state}%`)
      .limit(10);

    if (supabaseError) {
      console.error('Error fetching from Supabase:', supabaseError);
      throw supabaseError;
    }

    if (existingData && existingData.length > 0) {
      return existingData as Property[];
    }

    const { data: rapidApiData, error } = await supabase.functions.invoke('fetch-properties', {
      body: { city, state }
    });

    if (error) {
      console.error('Error fetching from RapidAPI:', error);
      throw error;
    }

    if (!rapidApiData || !Array.isArray(rapidApiData)) {
      return [];
    }

    const listings = rapidApiData.map((listing: PropertyListing) => ({
      address: `${listing.address.line}, ${listing.address.city}, ${listing.address.state} ${listing.address.postal_code}`,
      price: listing.price,
      bedrooms: listing.beds,
      bathrooms: listing.baths,
      square_feet: listing.building_size?.size || null,
      property_type: listing.property_type,
      mls_number: listing.property_id
    }));

    if (listings.length > 0) {
      const { error: insertError } = await supabase
        .from('properties')
        .insert(listings);

      if (insertError) {
        console.error('Error storing properties in Supabase:', insertError);
      }

      const { data: newData } = await supabase
        .from('properties')
        .select('*')
        .ilike('address', `%${city}%`)
        .ilike('address', `%${state}%`)
        .limit(10);

      return (newData || []) as Property[];
    }

    return [] as Property[];
  } catch (error) {
    console.error('Error fetching property listings:', error);
    return [];
  }
};
