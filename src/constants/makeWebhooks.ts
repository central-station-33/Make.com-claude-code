/**
 * Make.com Webhook URLs — JRA Automation Hub
 *
 * All webhook endpoints live on us2.make.com and are secured with
 * the x-make-apikey header.  Each entry maps to an active Make.com
 * scenario that handles intake, scoring, or follow-up for leads and
 * agent recruits.
 */

export const MAKE_WEBHOOKS = {
  /**
   * Buyer Lead Intake — WordPress Gateway (scenario 4676185)
   * Accepts inbound buyer leads, scores with Claude AI, inserts into
   * the leads table, and forwards to Retool CRM.
   * Payload: name, email, phone, lead_type, budget, timeline,
   *          property_address, preferred_location, preapproval_status,
   *          home_value_estimate, source, notes
   */
  BUYER_LEAD_INTAKE: 'https://hook.us2.make.com/oiw6ut86i1s8g4xv4hmiubjoymdmymv9',

  /**
   * Seller Lead Intake — JRA Web Gateway (scenario 4741627)
   * Accepts inbound seller leads, scores with Claude AI (seller-specific
   * prompt), inserts into the leads table (lead_type = seller), and
   * forwards to Retool CRM.
   * Payload: name, email, phone, property_address, home_value_estimate,
   *          timeline, reason_for_selling, preferred_move_date, source, notes
   */
  SELLER_LEAD_INTAKE: 'https://hook.us2.make.com/y6vnlgm1o1pydypmh6kbkpyj7ku9xguy',

  /**
   * Agent Recruiting Intake — WordPress Gateway (scenario 4676188)
   * Accepts agent applicants from the "Join Our Team" form, scores with
   * Claude AI, inserts into the agents table, and forwards to Retool CRM.
   * Payload: name, email, phone, brokerage, license_number, license_state,
   *          years_experience, annual_transactions, annual_volume,
   *          specialties, why_join, source
   */
  AGENT_RECRUITING_INTAKE: 'https://hook.us2.make.com/3m22hn5r2biauai23c5az7cgtbakpxi5',

  /**
   * Lead Score Refresh — On-Demand (scenario 4741630)
   * Re-scores an existing lead using Claude AI and writes the updated
   * prediction_score, quality_tier, urgency, and recommended_action
   * back to the leads table.
   * Payload: lead_id (UUID string)
   */
  LEAD_SCORE_REFRESH: 'https://hook.us2.make.com/lgkvt0hv0iwq1fego1r1emfp8f7a25kh',

  /**
   * Recruit Score Refresh — On-Demand (scenario 4741632)
   * Re-scores an existing agent recruit using Claude AI and writes the
   * updated lead_score, quality_tier, pipeline_stage back to the agents
   * table.
   * Payload: agent_id (UUID string)
   */
  RECRUIT_SCORE_REFRESH: 'https://hook.us2.make.com/bq64fech0155uru5nnmjtsnnyr95ycii',

  /**
   * Follow-Up Nurture — Lead Sequence Trigger (scenario 4741633)
   * Fetches a lead from Postgres, generates a personalized follow-up
   * email, SMS, and call script via Claude AI, pushes the content to
   * Retool CRM, and marks the lead as "contacted".
   * Payload: lead_id (UUID string), sequence_type (string),
   *          follow_up_number (integer)
   */
  FOLLOW_UP_NURTURE: 'https://hook.us2.make.com/xsx1q4fkv6brvgl86all13cova5o4xgw',
} as const;

export type MakeWebhookKey = keyof typeof MAKE_WEBHOOKS;
