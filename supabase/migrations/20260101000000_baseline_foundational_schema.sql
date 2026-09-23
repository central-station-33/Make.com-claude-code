-- Migration: baseline_foundational_schema
-- Version: 20260101000000
-- Backfilled to git 2026-09-22 to sync repo with the branch DB fix that resolved 28/28 table drift.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.raw_properties (   id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,   property_hash text NOT NULL,   source text NOT NULL,   raw_data jsonb NOT NULL,   received_at timestamptz DEFAULT now() NOT NULL,   processed_at timestamptz,   PRIMARY KEY (id) );

ALTER TABLE public.raw_properties ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.properties (   id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,   property_hash text NOT NULL,   source text,   data_sources jsonb DEFAULT '[]'::jsonb,   address text,   city text,   state character,   zip text,   county text,   lat numeric,   lng numeric,   property_type text,   bedrooms smallint,   bathrooms numeric,   square_footage integer,   year_built smallint,   estimated_arv numeric,   amount_owed numeric,   asking_price numeric,   equity numeric,   equity_percentage smallint,   below_market_percentage smallint,   assessed_value numeric,   taxes_owed numeric,   owner_name text,   owner_phone text,   owner_email text,   owner_mailing_address text,   owner_type text,   owner_state character,   distress_indicators jsonb DEFAULT '[]'::jsonb,   notice_date timestamptz,   auction_date timestamptz,   process_stage text,   case_number text,   distress_score smallint CHECK (distress_score >= 0 AND distress_score <= 100),   deal_quality_score smallint CHECK (deal_quality_score >= 0 AND deal_quality_score <= 100),   contact_likelihood_score smallint CHECK (contact_likelihood_score >= 0 AND contact_likelihood_score <= 100),   timeline_urgency_score smallint CHECK (timeline_urgency_score >= 0 AND timeline_urgency_score <= 100),   composite_score smallint CHECK (composite_score >= 0 AND composite_score <= 100),   priority_tier text CHECK (priority_tier = ANY (ARRAY['Tier 1'::text, 'Tier 2'::text, 'Tier 3'::text, 'Tier 4'::text])),   ai_analysis jsonb,   ai_enriched_at timestamptz,   enrichment_status text DEFAULT 'pending'::text CHECK (enrichment_status = ANY (ARRAY['pending'::text, 'processing'::text, 'complete'::text, 'failed'::text, 'skipped'::text])),   created_at timestamptz DEFAULT now() NOT NULL,   updated_at timestamptz DEFAULT now() NOT NULL,   PRIMARY KEY (id),   UNIQUE (property_hash) );

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notification_log (   id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,   property_id uuid,   notification_type text,   recipient text,   status text,   error_message text,   sent_at timestamptz,   created_at timestamptz DEFAULT now() NOT NULL,   PRIMARY KEY (id) );

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.contact_activities (   id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,   property_id uuid,   contact_method text,   contact_date timestamptz,   outcome text,   notes text,   agent_id text,   created_at timestamptz DEFAULT now() NOT NULL,   PRIMARY KEY (id) );

ALTER TABLE public.contact_activities ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.deals (   id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,   property_id uuid,   status text,   deal_type text,   offer_price numeric,   contract_price numeric,   close_date date,   profit_estimate numeric,   notes text,   agent_id text,   created_at timestamptz DEFAULT now() NOT NULL,   updated_at timestamptz DEFAULT now() NOT NULL,   PRIMARY KEY (id),   UNIQUE (property_id) );

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.inrange_leads (   id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,   source text NOT NULL,   parcel_id text,   address text,   city text,   state character,   zip text,   county text,   property_type text,   distress_signals text[],   raw_payload jsonb,   created_at timestamptz DEFAULT now(),   updated_at timestamptz DEFAULT now(),   PRIMARY KEY (id) );

ALTER TABLE public.inrange_leads ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.contact_activities DROP CONSTRAINT IF EXISTS contact_activities_property_id_fkey_baseline;

ALTER TABLE public.contact_activities ADD CONSTRAINT contact_activities_property_id_fkey_baseline FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;

ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_property_id_fkey_baseline;

ALTER TABLE public.deals ADD CONSTRAINT deals_property_id_fkey_baseline FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;

ALTER TABLE public.notification_log DROP CONSTRAINT IF EXISTS notification_log_property_id_fkey_baseline;

ALTER TABLE public.notification_log ADD CONSTRAINT notification_log_property_id_fkey_baseline FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;

CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

DROP EVENT TRIGGER IF EXISTS ensure_rls;

CREATE EVENT TRIGGER ensure_rls ON ddl_command_end EXECUTE FUNCTION public.rls_auto_enable();

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS burnt_out_landlord_score smallint;

ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_burnt_out_landlord_score_check;

ALTER TABLE public.properties ADD CONSTRAINT properties_burnt_out_landlord_score_check CHECK (burnt_out_landlord_score >= 0 AND burnt_out_landlord_score <= 100);

DROP TRIGGER IF EXISTS properties_updated_at ON public.properties;

CREATE TRIGGER properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS inrange_leads_parcel_id_source_key ON public.inrange_leads(parcel_id, source);

CREATE UNIQUE INDEX IF NOT EXISTS raw_properties_hash_idx ON public.raw_properties(property_hash);

CREATE INDEX IF NOT EXISTS raw_properties_unprocessed_idx ON public.raw_properties(received_at) WHERE processed_at IS NULL;

CREATE INDEX IF NOT EXISTS prop_address_trgm_idx ON public.properties USING gin(address extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS prop_auction_idx ON public.properties(auction_date);

CREATE INDEX IF NOT EXISTS prop_county_idx ON public.properties(county);

CREATE INDEX IF NOT EXISTS prop_created_idx ON public.properties(created_at DESC);

CREATE INDEX IF NOT EXISTS prop_enrich_idx ON public.properties(enrichment_status);

CREATE INDEX IF NOT EXISTS prop_score_idx ON public.properties(composite_score DESC);

CREATE INDEX IF NOT EXISTS prop_state_idx ON public.properties(state);

CREATE INDEX IF NOT EXISTS prop_tier_idx ON public.properties(priority_tier);

CREATE INDEX IF NOT EXISTS contact_prop_idx ON public.contact_activities(property_id);

CREATE INDEX IF NOT EXISTS notif_prop_idx ON public.notification_log(property_id);

CREATE INDEX IF NOT EXISTS notif_status_idx ON public.notification_log(status);

CREATE TABLE IF NOT EXISTS public.isa_leads_dedupe_backup_20260921 (
  id uuid,
  segment text,
  market text,
  commission_source text,
  full_name text,
  entity_name text,
  email text,
  phone text,
  linkedin_url text,
  instagram_handle text,
  rep_name text,
  rep_email text,
  rep_phone text,
  rep_agency text,
  bant_score integer,
  motivation_score integer,
  routing text,
  assigned_agent_id uuid,
  assigned_isa text,
  outreach_status text,
  property_address text,
  motivation_signals jsonb,
  ai_summary text,
  isa_talking_points jsonb,
  source_url text,
  source_name text,
  contract_value numeric,
  team_name text,
  sport text,
  origin_country text,
  employer text,
  production_name text,
  permit_number text,
  price_range_min numeric,
  price_range_max numeric,
  timeline_months integer,
  raw_data jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  county text,
  state character,
  relocation_partner_id uuid,
  first_response_at timestamptz,
  inbound_channel text,
  inbound_message text,
  cadence_step smallint,
  last_cadence_at timestamptz,
  cadence_paused boolean,
  skip_trace_status text,
  skip_traced_at timestamptz,
  ai_investment_thesis text,
  ai_contact_strategy text,
  ai_bant_budget smallint,
  ai_bant_authority smallint,
  ai_bant_need smallint,
  ai_bant_timing smallint,
  ai_confidence smallint,
  ai_risk_flags text[],
  ai_model text,
  ai_prompt_version text,
  ai_enriched_at timestamptz,
  ai_input_tokens integer,
  ai_output_tokens integer,
  module text,
  lead_role text,
  marketing_consent boolean,
  sms_consent boolean,
  consent_source text,
  consent_captured_at timestamptz,
  opted_out_at timestamptz,
  opted_out_channels text[],
  sms_opt_out boolean,
  sms_opt_out_at timestamptz,
  dedupe_rank bigint
);

COMMENT ON TABLE public.isa_leads_dedupe_backup_20260921 IS 'Rows removed by the 2026-09-21 isa_leads de-duplication. Restore with: insert into isa_leads select (all columns except dedupe_rank) from this table. Safe to drop once the dedupe is confirmed good.';

ALTER TABLE public.isa_leads_dedupe_backup_20260921 ENABLE ROW LEVEL SECURITY;
