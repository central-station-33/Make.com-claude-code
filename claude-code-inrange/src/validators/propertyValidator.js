'use strict';

const Joi = require('joi');

// Reusable sub-schemas
const scoreField = Joi.number().integer().min(0).max(100);
const moneyField = Joi.number().min(0).allow(null);
const dateField = Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow(null, '');

// ---------------------------------------------------------------------------
// Raw property payload from Make.com Workflow 1
// ---------------------------------------------------------------------------
const rawPropertySchema = Joi.object({
  source: Joi.string().required(),
  address: Joi.string().required(),
  city: Joi.string().allow('', null),
  state: Joi.string().length(2).uppercase().allow('', null),
  zip: Joi.string().allow('', null),
  county: Joi.string().allow('', null),
  property_type: Joi.string().allow('', null),
  bedrooms: Joi.number().integer().min(0).allow(null),
  bathrooms: Joi.number().min(0).allow(null),
  square_footage: Joi.number().integer().min(0).allow(null),
  year_built: Joi.number().integer().min(1800).max(new Date().getFullYear() + 1).allow(null),

  // Financials — all optional at raw stage
  estimated_arv: moneyField,
  arv: moneyField,
  amount_owed: moneyField,
  mortgage_balance: moneyField,
  asking_price: moneyField,
  list_price: moneyField,
  assessed_value: moneyField,
  taxes_owed: moneyField,

  // Owner
  owner_name: Joi.string().allow('', null),
  owner_phone: Joi.string().allow('', null),
  owner_email: Joi.string().email({ tlds: { allow: false } }).allow('', null),
  owner_mailing_address: Joi.string().allow('', null),
  owner_type: Joi.string().allow('', null),
  owner_state: Joi.string().length(2).uppercase().allow('', null),

  // Distress
  distress_indicators: Joi.array().items(Joi.string()).default([]),
  notice_date: dateField,
  auction_date: dateField,
  record_date: dateField,
  process_stage: Joi.string().allow('', null),
  case_number: Joi.string().allow('', null),

  // Pass-through
  id: Joi.string().allow(null),
  external_id: Joi.string().allow(null),
}).unknown(true); // Allow extra fields from various sources

// ---------------------------------------------------------------------------
// Scored property payload from Make.com Workflow 2
// ---------------------------------------------------------------------------
const scoredPropertySchema = rawPropertySchema.append({
  distress_score: scoreField.required(),
  deal_quality_score: scoreField.required(),
  contact_likelihood_score: scoreField.required(),
  timeline_urgency_score: scoreField.required(),
  composite_score: scoreField.required(),
  priority_tier: Joi.string().valid('Tier 1', 'Tier 2', 'Tier 3', 'Tier 4').required(),
  deal_type: Joi.string().required(),
});

// ---------------------------------------------------------------------------
// Notification status payload from Make.com Workflow 3
// ---------------------------------------------------------------------------
const notificationStatusSchema = Joi.object({
  property_id: Joi.string().allow(null),
  notification_type: Joi.string().valid('email', 'slack', 'sms', 'webhook').required(),
  recipient: Joi.string().required(),
  status: Joi.string().valid('sent', 'delivered', 'failed', 'bounced').required(),
  error_message: Joi.string().allow('', null),
  sent_at: dateField,
  workflow_id: Joi.string().allow(null),
  run_id: Joi.string().allow(null),
}).unknown(true);

// ---------------------------------------------------------------------------
// Contact activity payload (from Retool)
// ---------------------------------------------------------------------------
const contactActivitySchema = Joi.object({
  property_id: Joi.string().required(),
  contact_method: Joi.string().valid('phone', 'email', 'sms', 'mail', 'door_knock').required(),
  contact_date: dateField,
  outcome: Joi.string().valid('no_answer', 'left_voicemail', 'interested', 'not_interested', 'callback', 'other').required(),
  notes: Joi.string().allow('', null),
  agent_id: Joi.string().allow(null),
});

// ---------------------------------------------------------------------------
// Deal payload (from Retool)
// ---------------------------------------------------------------------------
const dealSchema = Joi.object({
  property_id: Joi.string().required(),
  status: Joi.string().valid('lead', 'offer_made', 'under_contract', 'closed', 'dead').required(),
  deal_type: Joi.string().allow('', null),
  offer_price: moneyField,
  contract_price: moneyField,
  close_date: dateField,
  profit_estimate: moneyField,
  notes: Joi.string().allow('', null),
  agent_id: Joi.string().allow(null),
});

// ---------------------------------------------------------------------------
// Query filter schema for GET /api/properties
// ---------------------------------------------------------------------------
const propertyFilterSchema = Joi.object({
  state: Joi.string().length(2).uppercase(),
  county: Joi.string(),
  priority_tier: Joi.string().valid('Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'),
  deal_type: Joi.string(),
  min_score: Joi.number().integer().min(0).max(100),
  max_score: Joi.number().integer().min(0).max(100),
  search: Joi.string().max(200),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(50),
});

/**
 * Validate a payload against a schema; throw if invalid.
 * @param {object} data
 * @param {Joi.ObjectSchema} schema
 * @returns {object} Validated + coerced data
 */
const validate = (data, schema) => {
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: false });
  if (error) {
    const err = new Error('Validation failed');
    err.isJoi = true;
    err.details = error.details;
    throw err;
  }
  return value;
};

module.exports = {
  rawPropertySchema,
  scoredPropertySchema,
  notificationStatusSchema,
  contactActivitySchema,
  dealSchema,
  propertyFilterSchema,
  validate,
};
