export type RentalPipelineStage =
  | 'new_inquiry' | 'contacted' | 'awaiting_details' | 'qualified' | 'matching_inventory'
  | 'matches_sent' | 'tour_requested' | 'tour_booked' | 'tour_completed'
  | 'application_started' | 'application_submitted' | 'approved' | 'lease_signed'
  | 'nurture' | 'lost' | 'duplicate' | 'invalid_spam';

export const RENTAL_STAGE_LABELS: Record<RentalPipelineStage, string> = {
  new_inquiry: 'New Inquiry',
  contacted: 'Contacted',
  awaiting_details: 'Awaiting Details',
  qualified: 'Qualified',
  matching_inventory: 'Matching Inventory',
  matches_sent: 'Matches Sent',
  tour_requested: 'Tour Requested',
  tour_booked: 'Tour Booked',
  tour_completed: 'Tour Completed',
  application_started: 'Application Started',
  application_submitted: 'Application Submitted',
  approved: 'Approved',
  lease_signed: 'Lease Signed',
  nurture: 'Nurture',
  lost: 'Lost',
  duplicate: 'Duplicate',
  invalid_spam: 'Invalid / Spam',
};

export const RENTAL_STAGE_COLORS: Record<RentalPipelineStage, string> = {
  new_inquiry: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-teal-50 text-teal-700 border-teal-200',
  awaiting_details: 'bg-teal-50 text-teal-700 border-teal-200',
  qualified: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  matching_inventory: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  matches_sent: 'bg-purple-50 text-purple-700 border-purple-200',
  tour_requested: 'bg-purple-50 text-purple-700 border-purple-200',
  tour_booked: 'bg-purple-50 text-purple-700 border-purple-200',
  tour_completed: 'bg-orange-50 text-orange-700 border-orange-200',
  application_started: 'bg-orange-50 text-orange-700 border-orange-200',
  application_submitted: 'bg-orange-50 text-orange-700 border-orange-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  lease_signed: 'bg-green-100 text-green-800 border-green-300',
  nurture: 'bg-gray-50 text-gray-600 border-gray-200',
  lost: 'bg-gray-100 text-gray-500 border-gray-200',
  duplicate: 'bg-gray-100 text-gray-500 border-gray-200',
  invalid_spam: 'bg-gray-100 text-gray-500 border-gray-200',
};

export interface RentalLeadSummary {
  isa_lead_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  market: string;
  routing: string;
  outreach_status: string;
  assigned_agent_id: string | null;
  pipeline_stage: RentalPipelineStage;
  move_date: string | null;
  max_rent: number | null;
  min_bedrooms: number | null;
  ai_confidence: number | null;
  ai_escalation_needed: boolean;
  created_at: string;
}

export interface RentalInquiry {
  id: string;
  isa_lead_id: string;
  move_date: string | null;
  move_date_flexible: boolean;
  target_locations: string[];
  max_rent: number | null;
  min_bedrooms: number | null;
  preferred_bedrooms: number | null;
  bathrooms_needed: number | null;
  household_size: number | null;
  pets: Record<string, unknown>;
  parking_needed: boolean | null;
  laundry_needed: boolean | null;
  accessibility_notes: string | null;
  unit_style: string | null;
  tour_availability: Record<string, unknown>;
  additional_notes: string | null;
  pipeline_stage: RentalPipelineStage;
  lost_reason: string | null;
  ai_conversation_summary: string | null;
  ai_missing_info: string[];
  ai_confidence: number | null;
  ai_escalation_needed: boolean;
  ai_escalation_reason: string | null;
  ai_model: string | null;
  ai_enriched_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RentalLeadDetail extends RentalInquiry {
  isa_lead: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    market: string;
    routing: string;
    outreach_status: string;
    sms_consent: boolean | null;
    marketing_consent: boolean | null;
    opted_out_at: string | null;
    assigned_agent_id: string | null;
    ai_summary: string | null;
  };
}

export type LandlordPipelineStage =
  | 'new_lead' | 'consultation_scheduled' | 'consultation_complete'
  | 'listing_agreement_sent' | 'listing_agreement_signed' | 'active_listing'
  | 'tenant_placed' | 'recurring_relationship' | 'lost';

export const LANDLORD_STAGE_LABELS: Record<LandlordPipelineStage, string> = {
  new_lead: 'New Lead',
  consultation_scheduled: 'Consultation Scheduled',
  consultation_complete: 'Consultation Complete',
  listing_agreement_sent: 'Agreement Sent',
  listing_agreement_signed: 'Agreement Signed',
  active_listing: 'Active Listing',
  tenant_placed: 'Tenant Placed',
  recurring_relationship: 'Recurring Relationship',
  lost: 'Lost',
};

export const LANDLORD_STAGE_COLORS: Record<LandlordPipelineStage, string> = {
  new_lead: 'bg-blue-50 text-blue-700 border-blue-200',
  consultation_scheduled: 'bg-teal-50 text-teal-700 border-teal-200',
  consultation_complete: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  listing_agreement_sent: 'bg-purple-50 text-purple-700 border-purple-200',
  listing_agreement_signed: 'bg-purple-100 text-purple-800 border-purple-300',
  active_listing: 'bg-orange-50 text-orange-700 border-orange-200',
  tenant_placed: 'bg-green-100 text-green-800 border-green-300',
  recurring_relationship: 'bg-green-50 text-green-700 border-green-200',
  lost: 'bg-gray-100 text-gray-500 border-gray-200',
};

export interface LandlordLeadSummary {
  isa_lead_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  market: string;
  assigned_agent_id: string | null;
  pipeline_stage: LandlordPipelineStage;
  property_address: string | null;
  expected_rent: number | null;
  vacancy_date: string | null;
  created_at: string;
}

export interface LandlordLead {
  id: string;
  isa_lead_id: string;
  owner_id: string | null;
  property_address: string | null;
  city: string | null;
  county: string | null;
  state: string | null;
  zip: string | null;
  unit_count: number | null;
  unit_details: unknown[];
  expected_rent: number | null;
  vacancy_date: string | null;
  current_status: string | null;
  leasing_need: string | null;
  preferred_contact_method: string | null;
  pipeline_stage: LandlordPipelineStage;
  lost_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LandlordLeadDetail extends LandlordLead {
  isa_lead: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    market: string;
    sms_consent: boolean | null;
    marketing_consent: boolean | null;
    opted_out_at: string | null;
    assigned_agent_id: string | null;
  };
}
