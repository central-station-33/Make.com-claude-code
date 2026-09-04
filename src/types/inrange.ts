export type PriorityTier = 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4';
export type EnrichmentStatus = 'pending' | 'processing' | 'complete' | 'failed' | 'skipped';

export interface AIAnalysis {
  investment_thesis?: string;
  best_strategy?: 'wholesale' | 'fix_and_flip' | 'buy_and_hold' | 'subject_to';
  profit_potential?: {
    wholesale_fee?: number;
    fix_and_flip_profit?: number;
    max_allowable_offer?: number;
    recommended_offer?: number;
  };
  risks?: string[];
  contact_strategy?: string;
  social_platforms?: string[];
  talking_points?: string[];
  red_flags?: string[];
  priority_action?: string;
}

export interface InRangeLead {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string | null;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_footage: number | null;
  year_built: number | null;
  estimated_arv: number | null;
  amount_owed: number | null;
  asking_price: number | null;
  equity: number | null;
  equity_percentage: number | null;
  below_market_percentage: number | null;
  assessed_value: number | null;
  taxes_owed: number | null;
  owner_name: string | null;
  owner_phone: string | null;
  owner_email: string | null;
  owner_mailing_address: string | null;
  owner_type: string | null;
  owner_state: string | null;
  distress_indicators: string[] | null;
  notice_date: string | null;
  auction_date: string | null;
  process_stage: string | null;
  case_number: string | null;
  source: string | null;
  composite_score: number;
  priority_tier: PriorityTier;
  deal_type: string | null;
  distress_score: number | null;
  deal_quality_score: number | null;
  contact_likelihood_score: number | null;
  timeline_urgency_score: number | null;
  enrichment_status: EnrichmentStatus;
  ai_analysis: AIAnalysis | null;
  ai_enriched_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export type InRangeLeadSummary = Pick<
  InRangeLead,
  | 'id' | 'address' | 'city' | 'state' | 'zip'
  | 'priority_tier' | 'composite_score' | 'deal_type'
  | 'owner_name' | 'owner_type' | 'owner_state'
  | 'distress_indicators' | 'enrichment_status' | 'ai_enriched_at'
>;
