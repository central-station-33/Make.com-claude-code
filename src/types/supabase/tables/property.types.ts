import { Json } from '../base.types';

export interface PropertyRow {
  id: string;
  zillow_id: string | null;
  mls_number: string | null;
  address: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  property_type: string | null;
  year_built: number | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
  sell_score: number | null;
  previous_listing_date: string | null;
  previous_listing_price: number | null;
  days_on_market: number | null;
  price_reductions: number | null;
  last_list_price: number | null;
}

export interface PropertyCandidateMatchRow {
  id: string;
  property_id: string | null;
  candidate_id: string | null;
  match_score: number | null;
  notes: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  match_criteria: Json | null;
}

export interface PropertyListingHistoryRow {
  id: string;
  property_id: string | null;
  list_date: string | null;
  list_price: number | null;
  status: string | null;
  days_on_market: number | null;
  price_change: number | null;
  notes: string | null;
  created_at: string | null;
}

export interface PropertyTables {
  properties: {
    Row: PropertyRow;
    Insert: Omit<PropertyRow, 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Omit<PropertyRow, 'id'>>;
  };
  property_candidate_matches: {
    Row: PropertyCandidateMatchRow;
    Insert: Omit<PropertyCandidateMatchRow, 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Omit<PropertyCandidateMatchRow, 'id'>>;
  };
  property_listing_history: {
    Row: PropertyListingHistoryRow;
    Insert: Omit<PropertyListingHistoryRow, 'id' | 'created_at'>;
    Update: Partial<Omit<PropertyListingHistoryRow, 'id'>>;
  };
}