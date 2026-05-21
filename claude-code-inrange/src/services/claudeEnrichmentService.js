'use strict';

const { getClient } = require('../config/anthropic');
const config = require('../config/env');
const logger = require('../config/logger');
const { formatCurrency } = require('../utils/numberHelpers');

// Token usage tracking
let totalTokensUsed = 0;
let totalApiCalls = 0;

/**
 * Build the Claude prompt for property enrichment.
 * @param {object} property - Normalized + scored property
 * @returns {string}
 */
const buildEnrichmentPrompt = (property) => `You are a real estate investment analyst specializing in distressed properties. Analyze this property and return a JSON response only — no markdown, no explanation.

PROPERTY DATA:
Address: ${property.full || property.address}, ${property.city}, ${property.state} ${property.zip}
Property Type: ${property.property_type || 'Unknown'}
Bedrooms/Baths: ${property.bedrooms || '?'}bd / ${property.bathrooms || '?'}ba
Sq Ft: ${property.square_footage || 'Unknown'}
Year Built: ${property.year_built || 'Unknown'}
County: ${property.county || 'Unknown'}

FINANCIAL:
Estimated ARV: ${formatCurrency(property.estimated_arv)}
Amount Owed: ${formatCurrency(property.amount_owed)}
Asking Price: ${formatCurrency(property.asking_price)}
Equity: ${formatCurrency(property.equity)} (${property.equity_percentage || 0}%)
Below Market: ${property.below_market_percentage || 0}%

DISTRESS:
Type: ${property.deal_type}
Indicators: ${(property.distress_indicators || []).join(', ')}
Process Stage: ${property.process_stage || 'Unknown'}
Notice Date: ${property.notice_date || 'Unknown'}
Auction Date: ${property.auction_date || 'Unknown'}

SCORES:
Composite Score: ${property.composite_score}/100 (${property.priority_tier})
Distress Score: ${property.distress_score}/100
Deal Quality Score: ${property.deal_quality_score}/100
Contact Likelihood: ${property.contact_likelihood_score}/100
Timeline Urgency: ${property.timeline_urgency_score}/100

OWNER:
Name: ${property.owner_name || 'Unknown'}
Type: ${property.owner_type || 'Unknown'}
Out-of-State: ${property.state !== property.owner_state ? 'Yes' : 'No'}

Return ONLY this JSON structure:
{
  "investment_thesis": "2-3 sentence investment thesis",
  "estimated_arv_refined": 0,
  "profit_potential": {
    "wholesale_fee": 0,
    "fix_and_flip_profit": 0,
    "rental_monthly_cashflow": 0,
    "best_strategy": "wholesale|fix_and_flip|buy_and_hold|subject_to"
  },
  "risks": ["risk1", "risk2", "risk3"],
  "contact_strategy": "Specific outreach approach for this owner/situation",
  "talking_points": ["point1", "point2", "point3"],
  "red_flags": ["flag1"],
  "opportunity_score_explanation": "Why this scored ${property.composite_score}/100",
  "recommended_offer": 0,
  "max_allowable_offer": 0
}`;

/**
 * Enrich a single property with Claude AI analysis.
 * @param {object} property - Normalized + scored property
 * @returns {Promise<object>} Enrichment analysis
 */
const enrichProperty = async (property) => {
  const client = getClient();
  if (!client) {
    logger.warn('Claude client unavailable — returning stub enrichment');
    return buildFallbackEnrichment(property);
  }

  const prompt = buildEnrichmentPrompt(property);
  let lastError;

  // Retry up to 3 times with exponential backoff
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await client.messages.create({
        model: config.anthropic.model,
        max_tokens: config.anthropic.maxTokens,
        system: 'You are a real estate investment analyst. Always respond with valid JSON only.',
        messages: [{ role: 'user', content: prompt }],
      });

      totalApiCalls++;
      totalTokensUsed += (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

      const text = response.content[0]?.text || '';
      const analysis = JSON.parse(text);

      logger.info('Property enriched', {
        address: property.full || property.address,
        attempt,
        tokens: response.usage?.input_tokens + response.usage?.output_tokens,
      });

      return {
        ...analysis,
        enriched_at: new Date().toISOString(),
        model_used: config.anthropic.model,
        tokens_used: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      };
    } catch (err) {
      lastError = err;
      logger.warn(`Enrichment attempt ${attempt} failed`, { error: err.message });
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }

  logger.error('Enrichment failed after 3 attempts', { error: lastError?.message });
  return buildFallbackEnrichment(property);
};

/**
 * Build a fallback enrichment when Claude is unavailable.
 * @param {object} property
 * @returns {object}
 */
const buildFallbackEnrichment = (property) => ({
  investment_thesis: `Distressed ${property.property_type || 'property'} in ${property.city}, ${property.state} with ${property.deal_type} situation. Score: ${property.composite_score}/100.`,
  estimated_arv_refined: property.estimated_arv || 0,
  profit_potential: {
    wholesale_fee: property.equity ? Math.round(property.equity * 0.3) : 0,
    fix_and_flip_profit: property.equity ? Math.round(property.equity * 0.5) : 0,
    rental_monthly_cashflow: 0,
    best_strategy: 'wholesale',
  },
  risks: ['Unable to generate AI analysis — manual review recommended'],
  contact_strategy: `Contact ${property.owner_name || 'owner'} regarding ${property.deal_type} situation.`,
  talking_points: ['Express empathy', 'Offer quick close', 'Present cash offer'],
  red_flags: [],
  opportunity_score_explanation: `Composite score of ${property.composite_score}/100 based on distress, deal quality, contact likelihood, and urgency.`,
  recommended_offer: property.asking_price || 0,
  max_allowable_offer: property.equity ? Math.round(property.estimated_arv * 0.7 - (property.amount_owed || 0)) : 0,
  enriched_at: new Date().toISOString(),
  model_used: 'fallback',
  tokens_used: 0,
});

/**
 * Get cumulative API usage stats.
 * @returns {{ totalCalls: number, totalTokens: number }}
 */
const getUsageStats = () => ({ totalCalls: totalApiCalls, totalTokens: totalTokensUsed });

module.exports = { enrichProperty, buildFallbackEnrichment, getUsageStats };
