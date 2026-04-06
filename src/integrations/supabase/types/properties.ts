import { BaseEntity } from './base';

export interface PropertyTables {
  properties: {
    Row: PropertyRow;
    Insert: PropertyInsert;
    Update: PropertyUpdate;
  };
  property_candidate_matches: {
    Row: PropertyMatchRow;
    Insert: PropertyMatchInsert;
    Update: PropertyMatchUpdate;
  };
}

export interface PropertyRow extends BaseEntity {
  address: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  property_type: string | null;
  year_built: number | null;
  description: string | null;
  zillow_id: string | null;
  mls_number: string | null;
}

export type PropertyInsert = Partial<PropertyRow>;
export type PropertyUpdate = Partial<PropertyRow>;

export interface PropertyMatchRow extends BaseEntity {
  property_id: string | null;
  candidate_id: string | null;
  match_score: number | null;
  notes: string | null;
  status: string | null;
  match_criteria: Record<string, unknown> | null;
}

export type PropertyMatchInsert = Partial<PropertyMatchRow>;
export type PropertyMatchUpdate = Partial<PropertyMatchRow>;