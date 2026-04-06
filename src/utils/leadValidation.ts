
import { Lead, LeadType, LeadStatus } from "@/types/lead";

export const validateLeadType = (type: string | null | undefined): LeadType => {
  if (type && Object.values(LeadType).includes(type as LeadType)) {
    return type as LeadType;
  }
  console.warn(`Invalid lead type: ${type}, defaulting to BUYER`);
  return LeadType.BUYER;
};

export const validateLeadStatus = (status: string | null | undefined): LeadStatus => {
  if (status && Object.values(LeadStatus).includes(status as LeadStatus)) {
    return status as LeadStatus;
  }
  return LeadStatus.NEW;
};

export const validateLead = (lead: Partial<Lead>): Lead => {
  if (!lead) {
    throw new Error('Lead data is required');
  }

  // Check for required contact information
  if (!lead.email && !lead.phone) {
    throw new Error('Either email or phone is required');
  }

  // Check for required name
  if (!lead.name) {
    throw new Error('Lead name is required');
  }

  // Return the lead with validated fields
  return {
    id: lead.id || '',
    name: lead.name,
    email: lead.email || '',
    phone: lead.phone || null,
    type: validateLeadType(lead.type),
    status: validateLeadStatus(lead.status),
    property_type: lead.property_type || null,
    budget: lead.budget ? Number(lead.budget) : null,
    location: lead.location || null,
    notes: lead.notes || null,
    created_at: lead.created_at || null,
    updated_at: lead.updated_at || null,
    user_id: lead.user_id || null,
    agent_id: lead.agent_id || null,
    follow_up_date: lead.follow_up_date || null,
    last_contact_date: lead.last_contact_date || null,
    source: lead.source || null,
    source_details: lead.source_details || null,
    email_source: lead.email_source || null,
    email_metadata: lead.email_metadata || null,
    source_referral_fee: lead.source_referral_fee || null,
    source_referral_notes: lead.source_referral_notes || null,
    team_id: lead.team_id || null,
    distribution_status: lead.distribution_status || 'pending',
    distribution_date: lead.distribution_date || null,
    import_id: lead.import_id || null,
    import_row_number: lead.import_row_number || null,
    import_errors: lead.import_errors || null
  };
};
