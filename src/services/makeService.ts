import { MAKE_WEBHOOKS } from '@/constants/makeWebhooks';

/** Shared response shape returned by every Make.com webhook scenario */
export interface MakeWebhookResponse {
  success: boolean;
  message: string;
  [key: string]: unknown;
}

export interface BuyerLeadPayload {
  name: string;
  email: string;
  phone?: string;
  lead_type?: 'buyer' | 'seller';
  budget?: string;
  timeline?: string;
  property_address?: string;
  preferred_location?: string;
  preapproval_status?: string;
  home_value_estimate?: string;
  source?: string;
  notes?: string;
  estimated_value?: string;
}

export interface SellerLeadPayload {
  name: string;
  email: string;
  phone?: string;
  property_address?: string;
  home_value_estimate?: string;
  timeline?: string;
  reason_for_selling?: string;
  preferred_move_date?: string;
  source?: string;
  notes?: string;
}

export interface AgentRecruitPayload {
  name: string;
  email: string;
  phone?: string;
  brokerage?: string;
  license_number?: string;
  license_state?: string;
  years_experience?: string | number;
  annual_transactions?: string | number;
  annual_volume?: string | number;
  specialties?: string;
  why_join?: string;
  source?: string;
}

/**
 * Sequence step for the follow-up nurture scenario.
 *
 * The Make.com scenario enforces DNC at the database level:
 * leads with status = 'disqualified' or 'lost' are excluded from the
 * Postgres query and the scenario stops before Claude is called.
 * Claude's prompt adapts its tone to the sequence_type automatically.
 *
 * Recommended cadence:
 *   initial        → Day 1  → follow_up_2 after 3 days of silence
 *   follow_up_2    → Day 3  → follow_up_3 after 4 more days of silence
 *   follow_up_3    → Day 7  → long_term_nurture after 30 days
 *   long_term_nurture → ongoing 30-day drip
 */
export type FollowUpSequenceType =
  | 'initial'
  | 'follow_up_2'
  | 'follow_up_3'
  | 'long_term_nurture';

export interface FollowUpNurturePayload {
  /** UUID of the lead in public.leads */
  lead_id: string;
  /** Controls Claude's tone and cadence instructions */
  sequence_type: FollowUpSequenceType;
  /** 1-based counter; passed to Retool for tracking */
  follow_up_number: number;
}

/**
 * Scored lead response fields.
 *
 * When returned by `refreshLeadScore`, the scenario also fires two
 * downstream actions automatically:
 *   - POSTs to Retool with `action_required` so Retool can trigger
 *     Slack/SMS alerts for hot leads or enqueue warm leads.
 *   - POSTs to the Follow-Up Nurture webhook (closed loop):
 *       prediction_score >= 50  → sequence_type "initial"
 *       prediction_score <  50  → sequence_type "long_term_nurture"
 */
export interface LeadScoringResult extends MakeWebhookResponse {
  lead_id?: number | string;
  prior_score?: number;
  prediction_score?: number;
  quality_tier?: 'A' | 'B' | 'C' | 'D';
  urgency?: 'high' | 'medium' | 'low';
  recommended_action?: string;
  /** Computed routing decision returned by the score-refresh scenario */
  action_required?: 'hot_alert' | 'warm_nurture' | 'cold_suppress';
  /** True when the nurture webhook was triggered as part of this call */
  nurture_triggered?: boolean;
}

/** Scored recruit response fields */
export interface RecruitScoringResult extends MakeWebhookResponse {
  agent_id?: string;
  lead_score?: number;
  quality_tier?: 'A' | 'B' | 'C' | 'D';
  recommended_action?: string;
  pipeline_stage?: string;
}

/** Payload for triggering the NY/NJ Combo Scraper run */
export interface ScraperRunPayload {
  /** Optional Apify actor input (e.g. { locations: ['New York, NY'] }).
   *  Omit to use the actor's saved default input. */
  run_input?: Record<string, unknown>;
}

/** Immediate 202 response from the scraper trigger webhook */
export interface ScraperRunResult extends MakeWebhookResponse {
  status?: 'accepted';
  /** Apify run ID — use to monitor progress in the Apify console */
  run_id?: string;
  /** Default dataset ID populated by the run */
  dataset_id?: string;
}

/** Follow-up sequence response fields */
export interface FollowUpResult extends MakeWebhookResponse {
  lead_id?: string;
  sequence_type?: string;
  follow_up_number?: number;
  subject?: string;
  sms_message?: string;
  next_follow_up_days?: number;
  /** Present when lead was skipped due to DNC status */
  skipped?: boolean;
}

export class MakeWebhookError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly url: string,
  ) {
    super(message);
    this.name = 'MakeWebhookError';
  }
}

async function postWebhook<T extends MakeWebhookResponse>(
  url: string,
  payload: object,
  retries = 2,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new MakeWebhookError(
          `Make.com webhook returned ${response.status} ${response.statusText}`,
          response.status,
          url,
        );
      }

      return response.json() as Promise<T>;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Don't retry on 4xx client errors
      if (err instanceof MakeWebhookError && err.status >= 400 && err.status < 500) break;
      if (attempt < retries) await delay(500 * 2 ** attempt);
    }
  }

  throw lastError;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Submit a buyer lead for intake, AI scoring, and CRM insertion */
export function submitBuyerLead(payload: BuyerLeadPayload) {
  return postWebhook<LeadScoringResult>(MAKE_WEBHOOKS.BUYER_LEAD_INTAKE, payload);
}

/** Submit a seller lead for intake, AI scoring, and CRM insertion */
export function submitSellerLead(payload: SellerLeadPayload) {
  return postWebhook<LeadScoringResult>(MAKE_WEBHOOKS.SELLER_LEAD_INTAKE, payload);
}

/** Submit an agent recruit application for AI scoring and CRM insertion */
export function submitAgentRecruit(payload: AgentRecruitPayload) {
  return postWebhook<RecruitScoringResult>(MAKE_WEBHOOKS.AGENT_RECRUITING_INTAKE, payload);
}

/** Trigger an on-demand re-score for an existing lead */
export function refreshLeadScore(leadId: string) {
  return postWebhook<LeadScoringResult>(MAKE_WEBHOOKS.LEAD_SCORE_REFRESH, { lead_id: leadId });
}

/** Trigger an on-demand re-score for an existing agent recruit */
export function refreshRecruitScore(agentId: string) {
  return postWebhook<RecruitScoringResult>(MAKE_WEBHOOKS.RECRUIT_SCORE_REFRESH, {
    agent_id: agentId,
  });
}

/**
 * Trigger the NY/NJ Combo Scraper run.
 *
 * The scenario responds 202 immediately with a run_id; the Apify actor
 * scrape, UPSERT, and AI scoring continue asynchronously in Make.com.
 * Pass run_input to override the actor's default search parameters.
 */
export function triggerNYNJScraper(payload: ScraperRunPayload = {}) {
  return postWebhook<ScraperRunResult>(MAKE_WEBHOOKS.NYNJ_SCRAPER_RUN, payload);
}

/**
 * Trigger the AI-powered follow-up nurture sequence for a lead.
 *
 * DNC enforcement: the Make.com scenario will skip leads whose
 * status is 'disqualified' or 'lost' at the database level —
 * Claude is never called and Retool is never notified for those leads.
 * Check `result.skipped === true` to detect a DNC skip.
 */
export function triggerFollowUpNurture(payload: FollowUpNurturePayload) {
  return postWebhook<FollowUpResult>(MAKE_WEBHOOKS.FOLLOW_UP_NURTURE, payload);
}
