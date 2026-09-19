// Sales pipeline for the two ranked, non-leasing ISA segments (see CLAUDE.md's
// "ISA Segment Priority"): homeowner (regular single/multi-family residential)
// and investor. Backed by the existing residential_sale_pipeline /
// distressed_investor_pipeline views -- same convention as the leasing
// module's rental_leasing_pipeline / landlord_leasing_pipeline.

export type SalesSegment = 'homeowner' | 'investor';

// residential_sale_pipeline further splits homeowner leads by role -- most
// (31 of 42, live) are motivated sellers, not buyers, which matches this
// product's actual premise (finding distressed sellers). Not present on the
// investor view: investors aren't "buyer" or "seller" in this sense.
export type LeadRole = 'buyer' | 'seller';

// Matches the live isa_leads_outreach_status_check constraint exactly.
export type SalesStage =
  | 'new' | 'attempting' | 'contacted' | 'qualified' | 'appointment_set'
  | 'showing_scheduled' | 'under_contract' | 'closed' | 'dead';

export const SALES_STAGE_ORDER: SalesStage[] = [
  'new', 'attempting', 'contacted', 'qualified', 'appointment_set',
  'showing_scheduled', 'under_contract', 'closed', 'dead',
];

export const SALES_STAGE_LABELS: Record<SalesStage, string> = {
  new: 'New',
  attempting: 'Attempting',
  contacted: 'Contacted',
  qualified: 'Qualified',
  appointment_set: 'Appointment Set',
  showing_scheduled: 'Showing Scheduled',
  under_contract: 'Under Contract',
  closed: 'Closed',
  dead: 'Dead',
};

export const SALES_STAGE_COLORS: Record<SalesStage, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  attempting: 'bg-teal-50 text-teal-700 border-teal-200',
  contacted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  qualified: 'bg-purple-50 text-purple-700 border-purple-200',
  appointment_set: 'bg-orange-50 text-orange-700 border-orange-200',
  showing_scheduled: 'bg-orange-100 text-orange-800 border-orange-300',
  under_contract: 'bg-green-50 text-green-700 border-green-200',
  closed: 'bg-green-100 text-green-800 border-green-300',
  dead: 'bg-gray-100 text-gray-500 border-gray-200',
};

export interface SalesLead {
  isa_lead_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  market: string | null;
  lead_role: LeadRole | null;
  routing: string | null;
  outreach_status: SalesStage | null;
  bant_score: number | null;
  motivation_score: number | null;
  assigned_agent_id: string | null;
  created_at: string;
}
