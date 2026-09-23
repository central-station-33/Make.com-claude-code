export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_routing_rules: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          market: string | null
          max_active_leads: number
          priority: number
          segment: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          market?: string | null
          max_active_leads?: number
          priority?: number
          segment?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          market?: string | null
          max_active_leads?: number
          priority?: number
          segment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_routing_rules_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_routing_rules_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "team_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_budget_tracker: {
        Row: {
          alert_sent: boolean
          cumulative_cost_usd: number
          id: string
          pause_threshold_usd: number
          paused: boolean
          paused_at: string | null
          period_start: string
          provider: string
          updated_at: string
        }
        Insert: {
          alert_sent?: boolean
          cumulative_cost_usd?: number
          id?: string
          pause_threshold_usd?: number
          paused?: boolean
          paused_at?: string | null
          period_start: string
          provider: string
          updated_at?: string
        }
        Update: {
          alert_sent?: boolean
          cumulative_cost_usd?: number
          id?: string
          pause_threshold_usd?: number
          paused?: boolean
          paused_at?: string | null
          period_start?: string
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      automation_settings: {
        Row: {
          active: boolean
          auto_publish_blog: boolean
          auto_publish_social: boolean
          brand_name: string
          created_at: string
          id: string
          make_webhook_url: string
          schedule_hour: number
          target_audience: string
          target_topic: string
          updated_at: string
          user_id: string | null
          wordpress_app_password: string
          wordpress_url: string
          wordpress_username: string
        }
        Insert: {
          active?: boolean
          auto_publish_blog?: boolean
          auto_publish_social?: boolean
          brand_name?: string
          created_at?: string
          id?: string
          make_webhook_url?: string
          schedule_hour?: number
          target_audience?: string
          target_topic?: string
          updated_at?: string
          user_id?: string | null
          wordpress_app_password?: string
          wordpress_url?: string
          wordpress_username?: string
        }
        Update: {
          active?: boolean
          auto_publish_blog?: boolean
          auto_publish_social?: boolean
          brand_name?: string
          created_at?: string
          id?: string
          make_webhook_url?: string
          schedule_hour?: number
          target_audience?: string
          target_topic?: string
          updated_at?: string
          user_id?: string | null
          wordpress_app_password?: string
          wordpress_url?: string
          wordpress_username?: string
        }
        Relationships: []
      }
      contact_activities: {
        Row: {
          agent_id: string | null
          contact_date: string | null
          contact_method: string | null
          created_at: string
          id: string
          notes: string | null
          outcome: string | null
          property_id: string | null
        }
        Insert: {
          agent_id?: string | null
          contact_date?: string | null
          contact_method?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          outcome?: string | null
          property_id?: string | null
        }
        Update: {
          agent_id?: string | null
          contact_date?: string | null
          contact_method?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          outcome?: string | null
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_activities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_activities_property_id_fkey_baseline"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      content_queue: {
        Row: {
          agent_run_id: string | null
          audience: string | null
          body: string
          brand: string | null
          channel: string | null
          compliance_notes: string | null
          content_type: string
          created_at: string
          draft_cta: string | null
          draft_hashtags: string[]
          expiration_date: string | null
          id: string
          linked_market: string | null
          linked_rental_unit_id: string | null
          meta_description: string | null
          performance_metrics: Json
          platform_data: Json | null
          published_at: string | null
          published_url: string | null
          rejection_note: string | null
          reviewer: string | null
          scheduled_for: string
          status: string
          tags: string[] | null
          target_segment: string | null
          title: string | null
          topic: string | null
          tracked_url: string | null
          utm_campaign: string | null
          verified_facts: Json
        }
        Insert: {
          agent_run_id?: string | null
          audience?: string | null
          body: string
          brand?: string | null
          channel?: string | null
          compliance_notes?: string | null
          content_type: string
          created_at?: string
          draft_cta?: string | null
          draft_hashtags?: string[]
          expiration_date?: string | null
          id?: string
          linked_market?: string | null
          linked_rental_unit_id?: string | null
          meta_description?: string | null
          performance_metrics?: Json
          platform_data?: Json | null
          published_at?: string | null
          published_url?: string | null
          rejection_note?: string | null
          reviewer?: string | null
          scheduled_for?: string
          status?: string
          tags?: string[] | null
          target_segment?: string | null
          title?: string | null
          topic?: string | null
          tracked_url?: string | null
          utm_campaign?: string | null
          verified_facts?: Json
        }
        Update: {
          agent_run_id?: string | null
          audience?: string | null
          body?: string
          brand?: string | null
          channel?: string | null
          compliance_notes?: string | null
          content_type?: string
          created_at?: string
          draft_cta?: string | null
          draft_hashtags?: string[]
          expiration_date?: string | null
          id?: string
          linked_market?: string | null
          linked_rental_unit_id?: string | null
          meta_description?: string | null
          performance_metrics?: Json
          platform_data?: Json | null
          published_at?: string | null
          published_url?: string | null
          rejection_note?: string | null
          reviewer?: string | null
          scheduled_for?: string
          status?: string
          tags?: string[] | null
          target_segment?: string | null
          title?: string | null
          topic?: string | null
          tracked_url?: string | null
          utm_campaign?: string | null
          verified_facts?: Json
        }
        Relationships: [
          {
            foreignKeyName: "content_queue_linked_rental_unit_id_fkey"
            columns: ["linked_rental_unit_id"]
            isOneToOne: false
            referencedRelation: "rental_units"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          agent_gross: number | null
          agent_id: string | null
          agent_split_pct: number | null
          assigned_agent_id: string | null
          close_date: string | null
          commission_rate_pct: number | null
          commission_source: string | null
          contract_price: number | null
          created_at: string
          deal_type: string | null
          gross_commission: number | null
          id: string
          isa_lead_id: string | null
          notes: string | null
          offer_price: number | null
          override_pct: number | null
          profit_estimate: number | null
          property_id: string | null
          sale_price: number | null
          status: string | null
          updated_at: string
          your_gross: number | null
          your_override: number | null
          your_split_pct: number | null
          your_total: number | null
        }
        Insert: {
          agent_gross?: number | null
          agent_id?: string | null
          agent_split_pct?: number | null
          assigned_agent_id?: string | null
          close_date?: string | null
          commission_rate_pct?: number | null
          commission_source?: string | null
          contract_price?: number | null
          created_at?: string
          deal_type?: string | null
          gross_commission?: number | null
          id?: string
          isa_lead_id?: string | null
          notes?: string | null
          offer_price?: number | null
          override_pct?: number | null
          profit_estimate?: number | null
          property_id?: string | null
          sale_price?: number | null
          status?: string | null
          updated_at?: string
          your_gross?: number | null
          your_override?: number | null
          your_split_pct?: number | null
          your_total?: number | null
        }
        Update: {
          agent_gross?: number | null
          agent_id?: string | null
          agent_split_pct?: number | null
          assigned_agent_id?: string | null
          close_date?: string | null
          commission_rate_pct?: number | null
          commission_source?: string | null
          contract_price?: number | null
          created_at?: string
          deal_type?: string | null
          gross_commission?: number | null
          id?: string
          isa_lead_id?: string | null
          notes?: string | null
          offer_price?: number | null
          override_pct?: number | null
          profit_estimate?: number | null
          property_id?: string | null
          sale_price?: number | null
          status?: string | null
          updated_at?: string
          your_gross?: number | null
          your_override?: number | null
          your_split_pct?: number | null
          your_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "deals_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "team_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "distressed_investor_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "deals_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "isa_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "isa_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "landlord_leasing_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "deals_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "leads_needing_module_triage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "rental_leasing_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "deals_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "residential_sale_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "deals_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "unclaimed_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_property_id_fkey_baseline"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inrange_leads: {
        Row: {
          address: string | null
          city: string | null
          county: string | null
          created_at: string | null
          distress_signals: string[] | null
          id: string
          parcel_id: string | null
          property_type: string | null
          raw_payload: Json | null
          source: string
          state: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          county?: string | null
          created_at?: string | null
          distress_signals?: string[] | null
          id?: string
          parcel_id?: string | null
          property_type?: string | null
          raw_payload?: Json | null
          source: string
          state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          county?: string | null
          created_at?: string | null
          distress_signals?: string[] | null
          id?: string
          parcel_id?: string | null
          property_type?: string | null
          raw_payload?: Json | null
          source?: string
          state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      isa_leads: {
        Row: {
          ai_bant_authority: number | null
          ai_bant_budget: number | null
          ai_bant_need: number | null
          ai_bant_timing: number | null
          ai_confidence: number | null
          ai_contact_strategy: string | null
          ai_enriched_at: string | null
          ai_input_tokens: number | null
          ai_investment_thesis: string | null
          ai_model: string | null
          ai_output_tokens: number | null
          ai_prompt_version: string | null
          ai_risk_flags: string[] | null
          ai_summary: string | null
          assigned_agent_id: string | null
          assigned_isa: string | null
          bant_score: number | null
          cadence_paused: boolean
          cadence_step: number
          commission_source: string
          consent_captured_at: string | null
          consent_source: string | null
          contract_value: number | null
          county: string | null
          created_at: string
          email: string | null
          employer: string | null
          entity_name: string | null
          first_response_at: string | null
          full_name: string | null
          id: string
          inbound_channel: string | null
          inbound_message: string | null
          instagram_handle: string | null
          isa_talking_points: Json
          last_cadence_at: string | null
          lead_role: string | null
          linkedin_url: string | null
          market: string
          marketing_consent: boolean | null
          module: string | null
          motivation_score: number | null
          motivation_signals: Json
          opted_out_at: string | null
          opted_out_channels: string[]
          origin_country: string | null
          outreach_status: string
          permit_number: string | null
          phone: string | null
          price_range_max: number | null
          price_range_min: number | null
          production_name: string | null
          property_address: string | null
          raw_data: Json
          relocation_partner_id: string | null
          rep_agency: string | null
          rep_email: string | null
          rep_name: string | null
          rep_phone: string | null
          routing: string
          segment: string
          skip_trace_status: string | null
          skip_traced_at: string | null
          sms_consent: boolean | null
          sms_opt_out: boolean
          sms_opt_out_at: string | null
          source_name: string | null
          source_url: string | null
          sport: string | null
          state: string | null
          team_name: string | null
          timeline_months: number | null
          updated_at: string
        }
        Insert: {
          ai_bant_authority?: number | null
          ai_bant_budget?: number | null
          ai_bant_need?: number | null
          ai_bant_timing?: number | null
          ai_confidence?: number | null
          ai_contact_strategy?: string | null
          ai_enriched_at?: string | null
          ai_input_tokens?: number | null
          ai_investment_thesis?: string | null
          ai_model?: string | null
          ai_output_tokens?: number | null
          ai_prompt_version?: string | null
          ai_risk_flags?: string[] | null
          ai_summary?: string | null
          assigned_agent_id?: string | null
          assigned_isa?: string | null
          bant_score?: number | null
          cadence_paused?: boolean
          cadence_step?: number
          commission_source?: string
          consent_captured_at?: string | null
          consent_source?: string | null
          contract_value?: number | null
          county?: string | null
          created_at?: string
          email?: string | null
          employer?: string | null
          entity_name?: string | null
          first_response_at?: string | null
          full_name?: string | null
          id?: string
          inbound_channel?: string | null
          inbound_message?: string | null
          instagram_handle?: string | null
          isa_talking_points?: Json
          last_cadence_at?: string | null
          lead_role?: string | null
          linkedin_url?: string | null
          market: string
          marketing_consent?: boolean | null
          module?: string | null
          motivation_score?: number | null
          motivation_signals?: Json
          opted_out_at?: string | null
          opted_out_channels?: string[]
          origin_country?: string | null
          outreach_status?: string
          permit_number?: string | null
          phone?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          production_name?: string | null
          property_address?: string | null
          raw_data?: Json
          relocation_partner_id?: string | null
          rep_agency?: string | null
          rep_email?: string | null
          rep_name?: string | null
          rep_phone?: string | null
          routing?: string
          segment: string
          skip_trace_status?: string | null
          skip_traced_at?: string | null
          sms_consent?: boolean | null
          sms_opt_out?: boolean
          sms_opt_out_at?: string | null
          source_name?: string | null
          source_url?: string | null
          sport?: string | null
          state?: string | null
          team_name?: string | null
          timeline_months?: number | null
          updated_at?: string
        }
        Update: {
          ai_bant_authority?: number | null
          ai_bant_budget?: number | null
          ai_bant_need?: number | null
          ai_bant_timing?: number | null
          ai_confidence?: number | null
          ai_contact_strategy?: string | null
          ai_enriched_at?: string | null
          ai_input_tokens?: number | null
          ai_investment_thesis?: string | null
          ai_model?: string | null
          ai_output_tokens?: number | null
          ai_prompt_version?: string | null
          ai_risk_flags?: string[] | null
          ai_summary?: string | null
          assigned_agent_id?: string | null
          assigned_isa?: string | null
          bant_score?: number | null
          cadence_paused?: boolean
          cadence_step?: number
          commission_source?: string
          consent_captured_at?: string | null
          consent_source?: string | null
          contract_value?: number | null
          county?: string | null
          created_at?: string
          email?: string | null
          employer?: string | null
          entity_name?: string | null
          first_response_at?: string | null
          full_name?: string | null
          id?: string
          inbound_channel?: string | null
          inbound_message?: string | null
          instagram_handle?: string | null
          isa_talking_points?: Json
          last_cadence_at?: string | null
          lead_role?: string | null
          linkedin_url?: string | null
          market?: string
          marketing_consent?: boolean | null
          module?: string | null
          motivation_score?: number | null
          motivation_signals?: Json
          opted_out_at?: string | null
          opted_out_channels?: string[]
          origin_country?: string | null
          outreach_status?: string
          permit_number?: string | null
          phone?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          production_name?: string | null
          property_address?: string | null
          raw_data?: Json
          relocation_partner_id?: string | null
          rep_agency?: string | null
          rep_email?: string | null
          rep_name?: string | null
          rep_phone?: string | null
          routing?: string
          segment?: string
          skip_trace_status?: string | null
          skip_traced_at?: string | null
          sms_consent?: boolean | null
          sms_opt_out?: boolean
          sms_opt_out_at?: string | null
          source_name?: string | null
          source_url?: string | null
          sport?: string | null
          state?: string | null
          team_name?: string | null
          timeline_months?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "isa_leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "isa_leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "team_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "isa_leads_relocation_partner_id_fkey"
            columns: ["relocation_partner_id"]
            isOneToOne: false
            referencedRelation: "relocation_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      isa_leads_dedupe_backup_20260921: {
        Row: {
          ai_bant_authority: number | null
          ai_bant_budget: number | null
          ai_bant_need: number | null
          ai_bant_timing: number | null
          ai_confidence: number | null
          ai_contact_strategy: string | null
          ai_enriched_at: string | null
          ai_input_tokens: number | null
          ai_investment_thesis: string | null
          ai_model: string | null
          ai_output_tokens: number | null
          ai_prompt_version: string | null
          ai_risk_flags: string[] | null
          ai_summary: string | null
          assigned_agent_id: string | null
          assigned_isa: string | null
          bant_score: number | null
          cadence_paused: boolean | null
          cadence_step: number | null
          commission_source: string | null
          consent_captured_at: string | null
          consent_source: string | null
          contract_value: number | null
          county: string | null
          created_at: string | null
          dedupe_rank: number | null
          email: string | null
          employer: string | null
          entity_name: string | null
          first_response_at: string | null
          full_name: string | null
          id: string | null
          inbound_channel: string | null
          inbound_message: string | null
          instagram_handle: string | null
          isa_talking_points: Json | null
          last_cadence_at: string | null
          lead_role: string | null
          linkedin_url: string | null
          market: string | null
          marketing_consent: boolean | null
          module: string | null
          motivation_score: number | null
          motivation_signals: Json | null
          opted_out_at: string | null
          opted_out_channels: string[] | null
          origin_country: string | null
          outreach_status: string | null
          permit_number: string | null
          phone: string | null
          price_range_max: number | null
          price_range_min: number | null
          production_name: string | null
          property_address: string | null
          raw_data: Json | null
          relocation_partner_id: string | null
          rep_agency: string | null
          rep_email: string | null
          rep_name: string | null
          rep_phone: string | null
          routing: string | null
          segment: string | null
          skip_trace_status: string | null
          skip_traced_at: string | null
          sms_consent: boolean | null
          sms_opt_out: boolean | null
          sms_opt_out_at: string | null
          source_name: string | null
          source_url: string | null
          sport: string | null
          state: string | null
          team_name: string | null
          timeline_months: number | null
          updated_at: string | null
        }
        Insert: {
          ai_bant_authority?: number | null
          ai_bant_budget?: number | null
          ai_bant_need?: number | null
          ai_bant_timing?: number | null
          ai_confidence?: number | null
          ai_contact_strategy?: string | null
          ai_enriched_at?: string | null
          ai_input_tokens?: number | null
          ai_investment_thesis?: string | null
          ai_model?: string | null
          ai_output_tokens?: number | null
          ai_prompt_version?: string | null
          ai_risk_flags?: string[] | null
          ai_summary?: string | null
          assigned_agent_id?: string | null
          assigned_isa?: string | null
          bant_score?: number | null
          cadence_paused?: boolean | null
          cadence_step?: number | null
          commission_source?: string | null
          consent_captured_at?: string | null
          consent_source?: string | null
          contract_value?: number | null
          county?: string | null
          created_at?: string | null
          dedupe_rank?: number | null
          email?: string | null
          employer?: string | null
          entity_name?: string | null
          first_response_at?: string | null
          full_name?: string | null
          id?: string | null
          inbound_channel?: string | null
          inbound_message?: string | null
          instagram_handle?: string | null
          isa_talking_points?: Json | null
          last_cadence_at?: string | null
          lead_role?: string | null
          linkedin_url?: string | null
          market?: string | null
          marketing_consent?: boolean | null
          module?: string | null
          motivation_score?: number | null
          motivation_signals?: Json | null
          opted_out_at?: string | null
          opted_out_channels?: string[] | null
          origin_country?: string | null
          outreach_status?: string | null
          permit_number?: string | null
          phone?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          production_name?: string | null
          property_address?: string | null
          raw_data?: Json | null
          relocation_partner_id?: string | null
          rep_agency?: string | null
          rep_email?: string | null
          rep_name?: string | null
          rep_phone?: string | null
          routing?: string | null
          segment?: string | null
          skip_trace_status?: string | null
          skip_traced_at?: string | null
          sms_consent?: boolean | null
          sms_opt_out?: boolean | null
          sms_opt_out_at?: string | null
          source_name?: string | null
          source_url?: string | null
          sport?: string | null
          state?: string | null
          team_name?: string | null
          timeline_months?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_bant_authority?: number | null
          ai_bant_budget?: number | null
          ai_bant_need?: number | null
          ai_bant_timing?: number | null
          ai_confidence?: number | null
          ai_contact_strategy?: string | null
          ai_enriched_at?: string | null
          ai_input_tokens?: number | null
          ai_investment_thesis?: string | null
          ai_model?: string | null
          ai_output_tokens?: number | null
          ai_prompt_version?: string | null
          ai_risk_flags?: string[] | null
          ai_summary?: string | null
          assigned_agent_id?: string | null
          assigned_isa?: string | null
          bant_score?: number | null
          cadence_paused?: boolean | null
          cadence_step?: number | null
          commission_source?: string | null
          consent_captured_at?: string | null
          consent_source?: string | null
          contract_value?: number | null
          county?: string | null
          created_at?: string | null
          dedupe_rank?: number | null
          email?: string | null
          employer?: string | null
          entity_name?: string | null
          first_response_at?: string | null
          full_name?: string | null
          id?: string | null
          inbound_channel?: string | null
          inbound_message?: string | null
          instagram_handle?: string | null
          isa_talking_points?: Json | null
          last_cadence_at?: string | null
          lead_role?: string | null
          linkedin_url?: string | null
          market?: string | null
          marketing_consent?: boolean | null
          module?: string | null
          motivation_score?: number | null
          motivation_signals?: Json | null
          opted_out_at?: string | null
          opted_out_channels?: string[] | null
          origin_country?: string | null
          outreach_status?: string | null
          permit_number?: string | null
          phone?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          production_name?: string | null
          property_address?: string | null
          raw_data?: Json | null
          relocation_partner_id?: string | null
          rep_agency?: string | null
          rep_email?: string | null
          rep_name?: string | null
          rep_phone?: string | null
          routing?: string | null
          segment?: string | null
          skip_trace_status?: string | null
          skip_traced_at?: string | null
          sms_consent?: boolean | null
          sms_opt_out?: boolean | null
          sms_opt_out_at?: string | null
          source_name?: string | null
          source_url?: string | null
          sport?: string | null
          state?: string | null
          team_name?: string | null
          timeline_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      landlord_leads: {
        Row: {
          city: string | null
          county: string | null
          created_at: string
          current_status: string | null
          expected_rent: number | null
          id: string
          isa_lead_id: string
          leasing_need: string | null
          lost_reason: string | null
          notes: string | null
          owner_id: string | null
          pipeline_stage: string
          preferred_contact_method: string | null
          property_address: string | null
          state: string | null
          unit_count: number | null
          unit_details: Json
          updated_at: string
          vacancy_date: string | null
          zip: string | null
        }
        Insert: {
          city?: string | null
          county?: string | null
          created_at?: string
          current_status?: string | null
          expected_rent?: number | null
          id?: string
          isa_lead_id: string
          leasing_need?: string | null
          lost_reason?: string | null
          notes?: string | null
          owner_id?: string | null
          pipeline_stage?: string
          preferred_contact_method?: string | null
          property_address?: string | null
          state?: string | null
          unit_count?: number | null
          unit_details?: Json
          updated_at?: string
          vacancy_date?: string | null
          zip?: string | null
        }
        Update: {
          city?: string | null
          county?: string | null
          created_at?: string
          current_status?: string | null
          expected_rent?: number | null
          id?: string
          isa_lead_id?: string
          leasing_need?: string | null
          lost_reason?: string | null
          notes?: string | null
          owner_id?: string | null
          pipeline_stage?: string
          preferred_contact_method?: string | null
          property_address?: string | null
          state?: string | null
          unit_count?: number | null
          unit_details?: Json
          updated_at?: string
          vacancy_date?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landlord_leads_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: true
            referencedRelation: "distressed_investor_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "landlord_leads_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: true
            referencedRelation: "isa_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landlord_leads_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: true
            referencedRelation: "isa_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landlord_leads_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: true
            referencedRelation: "landlord_leasing_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "landlord_leads_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: true
            referencedRelation: "leads_needing_module_triage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landlord_leads_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: true
            referencedRelation: "rental_leasing_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "landlord_leads_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: true
            referencedRelation: "residential_sale_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "landlord_leads_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: true
            referencedRelation: "unclaimed_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landlord_leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["owner_id"]
          },
        ]
      }
      lead_source_events: {
        Row: {
          ad_creative_id: string | null
          campaign: string | null
          conversion_outcome: string | null
          cost_cents: number | null
          created_at: string
          first_touch_at: string | null
          id: string
          isa_lead_id: string | null
          landing_page: string | null
          latest_touch_at: string | null
          phone_tracking_number: string | null
          qr_code_id: string | null
          referrer_url: string | null
          relocation_partner_id: string | null
          rental_unit_id: string | null
          session_id: string | null
          source_channel: string | null
          source_platform: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          ad_creative_id?: string | null
          campaign?: string | null
          conversion_outcome?: string | null
          cost_cents?: number | null
          created_at?: string
          first_touch_at?: string | null
          id?: string
          isa_lead_id?: string | null
          landing_page?: string | null
          latest_touch_at?: string | null
          phone_tracking_number?: string | null
          qr_code_id?: string | null
          referrer_url?: string | null
          relocation_partner_id?: string | null
          rental_unit_id?: string | null
          session_id?: string | null
          source_channel?: string | null
          source_platform?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          ad_creative_id?: string | null
          campaign?: string | null
          conversion_outcome?: string | null
          cost_cents?: number | null
          created_at?: string
          first_touch_at?: string | null
          id?: string
          isa_lead_id?: string | null
          landing_page?: string | null
          latest_touch_at?: string | null
          phone_tracking_number?: string | null
          qr_code_id?: string | null
          referrer_url?: string | null
          relocation_partner_id?: string | null
          rental_unit_id?: string | null
          session_id?: string | null
          source_channel?: string | null
          source_platform?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_source_events_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "distressed_investor_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "lead_source_events_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "isa_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_source_events_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "isa_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_source_events_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "landlord_leasing_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "lead_source_events_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "leads_needing_module_triage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_source_events_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "rental_leasing_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "lead_source_events_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "residential_sale_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "lead_source_events_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "unclaimed_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_source_events_relocation_partner_id_fkey"
            columns: ["relocation_partner_id"]
            isOneToOne: false
            referencedRelation: "relocation_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_source_events_rental_unit_id_fkey"
            columns: ["rental_unit_id"]
            isOneToOne: false
            referencedRelation: "rental_units"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tasks: {
        Row: {
          assigned_agent_id: string | null
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          isa_lead_id: string
          notes: string | null
          status: string
          task_type: string
        }
        Insert: {
          assigned_agent_id?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          isa_lead_id: string
          notes?: string | null
          status?: string
          task_type: string
        }
        Update: {
          assigned_agent_id?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          isa_lead_id?: string
          notes?: string | null
          status?: string
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tasks_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "lead_tasks_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "team_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tasks_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "distressed_investor_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "lead_tasks_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "isa_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tasks_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "isa_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tasks_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "landlord_leasing_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "lead_tasks_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "leads_needing_module_triage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tasks_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "rental_leasing_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "lead_tasks_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "residential_sale_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "lead_tasks_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: false
            referencedRelation: "unclaimed_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_touches: {
        Row: {
          channel: string
          id: string
          isa_name: string | null
          lead_id: string
          notes: string | null
          outcome: string | null
          touch_number: number
          touched_at: string
        }
        Insert: {
          channel: string
          id?: string
          isa_name?: string | null
          lead_id: string
          notes?: string | null
          outcome?: string | null
          touch_number: number
          touched_at?: string
        }
        Update: {
          channel?: string
          id?: string
          isa_name?: string | null
          lead_id?: string
          notes?: string | null
          outcome?: string | null
          touch_number?: number
          touched_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_touches_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "distressed_investor_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "lead_touches_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "isa_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_touches_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "isa_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_touches_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "landlord_leasing_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "lead_touches_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_needing_module_triage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_touches_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "rental_leasing_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "lead_touches_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "residential_sale_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "lead_touches_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "unclaimed_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          notification_type: string | null
          property_id: string | null
          recipient: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type?: string | null
          property_id?: string | null
          recipient?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type?: string | null
          property_id?: string | null
          recipient?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_log_property_id_fkey_baseline"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      outcomes: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          outcome_type: string
          outreach_id: string
          recorded_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          outcome_type: string
          outreach_id: string
          recorded_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          outcome_type?: string
          outreach_id?: string
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outcomes_outreach_id_fkey"
            columns: ["outreach_id"]
            isOneToOne: false
            referencedRelation: "outreach"
            referencedColumns: ["outreach_id"]
          },
        ]
      }
      outreach: {
        Row: {
          agent_id: string | null
          channel: string
          created_at: string
          email_body: string | null
          email_subject: string | null
          mailer_copy: string | null
          outreach_id: string
          owner_id: string | null
          parcel_id: string
          personalization_confidence: number | null
          property_id: string | null
          sent_at: string | null
          sms_copy: string | null
          status: string
          tone_rationale: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          channel?: string
          created_at?: string
          email_body?: string | null
          email_subject?: string | null
          mailer_copy?: string | null
          outreach_id?: string
          owner_id?: string | null
          parcel_id: string
          personalization_confidence?: number | null
          property_id?: string | null
          sent_at?: string | null
          sms_copy?: string | null
          status?: string
          tone_rationale?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          channel?: string
          created_at?: string
          email_body?: string | null
          email_subject?: string | null
          mailer_copy?: string | null
          outreach_id?: string
          owner_id?: string | null
          parcel_id?: string
          personalization_confidence?: number | null
          property_id?: string | null
          sent_at?: string | null
          sms_copy?: string | null
          status?: string
          tone_rationale?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["owner_id"]
          },
          {
            foreignKeyName: "outreach_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          contact_strategy_note: string | null
          created_at: string
          email: string | null
          mailing_address: string | null
          owner_id: string
          owner_type: string | null
          phone: string | null
          resolved_name: string | null
          updated_at: string
        }
        Insert: {
          contact_strategy_note?: string | null
          created_at?: string
          email?: string | null
          mailing_address?: string | null
          owner_id?: string
          owner_type?: string | null
          phone?: string | null
          resolved_name?: string | null
          updated_at?: string
        }
        Update: {
          contact_strategy_note?: string | null
          created_at?: string
          email?: string | null
          mailing_address?: string | null
          owner_id?: string
          owner_type?: string | null
          phone?: string | null
          resolved_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          ai_analysis: Json | null
          ai_enriched_at: string | null
          amount_owed: number | null
          arv_comp_count: number | null
          arv_comp_method: string | null
          arv_computed_at: string | null
          arv_source: string | null
          asking_price: number | null
          assessed_value: number | null
          auction_date: string | null
          bathrooms: number | null
          bedrooms: number | null
          below_market_percentage: number | null
          burnt_out_landlord_score: number | null
          burnt_out_score: number | null
          burnt_out_signals: Json | null
          case_number: string | null
          city: string | null
          composite_score: number | null
          contact_likelihood_score: number | null
          county: string | null
          created_at: string
          data_sources: Json | null
          deal_quality_score: number | null
          deal_type: string | null
          distress_indicators: Json | null
          distress_score: number | null
          enrichment_status: string | null
          equity: number | null
          equity_percentage: number | null
          estimated_arv: number | null
          id: string
          last_contacted_at: string | null
          lat: number | null
          lng: number | null
          notes: string | null
          notice_date: string | null
          owner_email: string | null
          owner_id: string | null
          owner_kind: string | null
          owner_mailing_address: string | null
          owner_name: string | null
          owner_phone: string | null
          owner_state: string | null
          owner_type: string | null
          priority_tier: string | null
          process_stage: string | null
          property_hash: string
          property_type: string | null
          quarantine_reason: string | null
          quarantined_at: string | null
          skip_trace_status: string | null
          skip_traced_at: string | null
          source: string | null
          square_footage: number | null
          state: string | null
          status: string | null
          tags: string[] | null
          taxes_owed: number | null
          timeline_urgency_score: number | null
          updated_at: string
          year_built: number | null
          zip: string | null
          zip_geocoded_at: string | null
          zip_source: string | null
        }
        Insert: {
          address?: string | null
          ai_analysis?: Json | null
          ai_enriched_at?: string | null
          amount_owed?: number | null
          arv_comp_count?: number | null
          arv_comp_method?: string | null
          arv_computed_at?: string | null
          arv_source?: string | null
          asking_price?: number | null
          assessed_value?: number | null
          auction_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          below_market_percentage?: number | null
          burnt_out_landlord_score?: number | null
          burnt_out_score?: number | null
          burnt_out_signals?: Json | null
          case_number?: string | null
          city?: string | null
          composite_score?: number | null
          contact_likelihood_score?: number | null
          county?: string | null
          created_at?: string
          data_sources?: Json | null
          deal_quality_score?: number | null
          deal_type?: string | null
          distress_indicators?: Json | null
          distress_score?: number | null
          enrichment_status?: string | null
          equity?: number | null
          equity_percentage?: number | null
          estimated_arv?: number | null
          id?: string
          last_contacted_at?: string | null
          lat?: number | null
          lng?: number | null
          notes?: string | null
          notice_date?: string | null
          owner_email?: string | null
          owner_id?: string | null
          owner_kind?: string | null
          owner_mailing_address?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_state?: string | null
          owner_type?: string | null
          priority_tier?: string | null
          process_stage?: string | null
          property_hash: string
          property_type?: string | null
          quarantine_reason?: string | null
          quarantined_at?: string | null
          skip_trace_status?: string | null
          skip_traced_at?: string | null
          source?: string | null
          square_footage?: number | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          taxes_owed?: number | null
          timeline_urgency_score?: number | null
          updated_at?: string
          year_built?: number | null
          zip?: string | null
          zip_geocoded_at?: string | null
          zip_source?: string | null
        }
        Update: {
          address?: string | null
          ai_analysis?: Json | null
          ai_enriched_at?: string | null
          amount_owed?: number | null
          arv_comp_count?: number | null
          arv_comp_method?: string | null
          arv_computed_at?: string | null
          arv_source?: string | null
          asking_price?: number | null
          assessed_value?: number | null
          auction_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          below_market_percentage?: number | null
          burnt_out_landlord_score?: number | null
          burnt_out_score?: number | null
          burnt_out_signals?: Json | null
          case_number?: string | null
          city?: string | null
          composite_score?: number | null
          contact_likelihood_score?: number | null
          county?: string | null
          created_at?: string
          data_sources?: Json | null
          deal_quality_score?: number | null
          deal_type?: string | null
          distress_indicators?: Json | null
          distress_score?: number | null
          enrichment_status?: string | null
          equity?: number | null
          equity_percentage?: number | null
          estimated_arv?: number | null
          id?: string
          last_contacted_at?: string | null
          lat?: number | null
          lng?: number | null
          notes?: string | null
          notice_date?: string | null
          owner_email?: string | null
          owner_id?: string | null
          owner_kind?: string | null
          owner_mailing_address?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_state?: string | null
          owner_type?: string | null
          priority_tier?: string | null
          process_stage?: string | null
          property_hash?: string
          property_type?: string | null
          quarantine_reason?: string | null
          quarantined_at?: string | null
          skip_trace_status?: string | null
          skip_traced_at?: string | null
          source?: string | null
          square_footage?: number | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          taxes_owed?: number | null
          timeline_urgency_score?: number | null
          updated_at?: string
          year_built?: number | null
          zip?: string | null
          zip_geocoded_at?: string | null
          zip_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["owner_id"]
          },
        ]
      }
      raw_properties: {
        Row: {
          id: string
          processed_at: string | null
          property_hash: string
          raw_data: Json
          received_at: string
          source: string
        }
        Insert: {
          id?: string
          processed_at?: string | null
          property_hash: string
          raw_data: Json
          received_at?: string
          source: string
        }
        Update: {
          id?: string
          processed_at?: string | null
          property_hash?: string
          raw_data?: Json
          received_at?: string
          source?: string
        }
        Relationships: []
      }
      relocation_partners: {
        Row: {
          active: boolean
          company: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          notes: string | null
          partner_name: string
          partner_type: string | null
          referral_fee_pct: number
          your_pct: number
        }
        Insert: {
          active?: boolean
          company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          partner_name: string
          partner_type?: string | null
          referral_fee_pct?: number
          your_pct?: number
        }
        Update: {
          active?: boolean
          company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          partner_name?: string
          partner_type?: string | null
          referral_fee_pct?: number
          your_pct?: number
        }
        Relationships: []
      }
      rental_applications: {
        Row: {
          created_at: string
          decided_at: string | null
          id: string
          notes: string | null
          rental_inquiry_id: string
          rental_unit_id: string
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          id?: string
          notes?: string | null
          rental_inquiry_id: string
          rental_unit_id: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          id?: string
          notes?: string | null
          rental_inquiry_id?: string
          rental_unit_id?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_applications_rental_inquiry_id_fkey"
            columns: ["rental_inquiry_id"]
            isOneToOne: false
            referencedRelation: "rental_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_applications_rental_unit_id_fkey"
            columns: ["rental_unit_id"]
            isOneToOne: false
            referencedRelation: "rental_units"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_inquiries: {
        Row: {
          accessibility_notes: string | null
          additional_notes: string | null
          ai_confidence: number | null
          ai_conversation_summary: string | null
          ai_enriched_at: string | null
          ai_escalation_needed: boolean
          ai_escalation_reason: string | null
          ai_missing_info: string[]
          ai_model: string | null
          bathrooms_needed: number | null
          created_at: string
          household_size: number | null
          id: string
          isa_lead_id: string
          laundry_needed: boolean | null
          lost_reason: string | null
          max_rent: number | null
          min_bedrooms: number | null
          move_date: string | null
          move_date_flexible: boolean
          parking_needed: boolean | null
          pets: Json
          pipeline_stage: string
          preferred_bedrooms: number | null
          target_locations: string[]
          tour_availability: Json
          unit_style: string | null
          updated_at: string
        }
        Insert: {
          accessibility_notes?: string | null
          additional_notes?: string | null
          ai_confidence?: number | null
          ai_conversation_summary?: string | null
          ai_enriched_at?: string | null
          ai_escalation_needed?: boolean
          ai_escalation_reason?: string | null
          ai_missing_info?: string[]
          ai_model?: string | null
          bathrooms_needed?: number | null
          created_at?: string
          household_size?: number | null
          id?: string
          isa_lead_id: string
          laundry_needed?: boolean | null
          lost_reason?: string | null
          max_rent?: number | null
          min_bedrooms?: number | null
          move_date?: string | null
          move_date_flexible?: boolean
          parking_needed?: boolean | null
          pets?: Json
          pipeline_stage?: string
          preferred_bedrooms?: number | null
          target_locations?: string[]
          tour_availability?: Json
          unit_style?: string | null
          updated_at?: string
        }
        Update: {
          accessibility_notes?: string | null
          additional_notes?: string | null
          ai_confidence?: number | null
          ai_conversation_summary?: string | null
          ai_enriched_at?: string | null
          ai_escalation_needed?: boolean
          ai_escalation_reason?: string | null
          ai_missing_info?: string[]
          ai_model?: string | null
          bathrooms_needed?: number | null
          created_at?: string
          household_size?: number | null
          id?: string
          isa_lead_id?: string
          laundry_needed?: boolean | null
          lost_reason?: string | null
          max_rent?: number | null
          min_bedrooms?: number | null
          move_date?: string | null
          move_date_flexible?: boolean
          parking_needed?: boolean | null
          pets?: Json
          pipeline_stage?: string
          preferred_bedrooms?: number | null
          target_locations?: string[]
          tour_availability?: Json
          unit_style?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_inquiries_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: true
            referencedRelation: "distressed_investor_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "rental_inquiries_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: true
            referencedRelation: "isa_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_inquiries_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: true
            referencedRelation: "isa_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_inquiries_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: true
            referencedRelation: "landlord_leasing_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "rental_inquiries_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: true
            referencedRelation: "leads_needing_module_triage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_inquiries_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: true
            referencedRelation: "rental_leasing_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "rental_inquiries_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: true
            referencedRelation: "residential_sale_pipeline"
            referencedColumns: ["isa_lead_id"]
          },
          {
            foreignKeyName: "rental_inquiries_isa_lead_id_fkey"
            columns: ["isa_lead_id"]
            isOneToOne: true
            referencedRelation: "unclaimed_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_matches: {
        Row: {
          created_at: string
          final_result: string | null
          fit_score: number | null
          id: string
          match_conflicts: Json
          match_reasons: Json
          match_sent_at: string | null
          recommended_rank: number | null
          rental_inquiry_id: string
          rental_unit_id: string
          renter_response: string | null
          tour_status: string | null
        }
        Insert: {
          created_at?: string
          final_result?: string | null
          fit_score?: number | null
          id?: string
          match_conflicts?: Json
          match_reasons?: Json
          match_sent_at?: string | null
          recommended_rank?: number | null
          rental_inquiry_id: string
          rental_unit_id: string
          renter_response?: string | null
          tour_status?: string | null
        }
        Update: {
          created_at?: string
          final_result?: string | null
          fit_score?: number | null
          id?: string
          match_conflicts?: Json
          match_reasons?: Json
          match_sent_at?: string | null
          recommended_rank?: number | null
          rental_inquiry_id?: string
          rental_unit_id?: string
          renter_response?: string | null
          tour_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_matches_rental_inquiry_id_fkey"
            columns: ["rental_inquiry_id"]
            isOneToOne: false
            referencedRelation: "rental_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_matches_rental_unit_id_fkey"
            columns: ["rental_unit_id"]
            isOneToOne: false
            referencedRelation: "rental_units"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_units: {
        Row: {
          address: string
          amenities: string[]
          application_instructions: string | null
          assigned_agent_id: string | null
          available_date: string | null
          bathrooms: number | null
          bedrooms: number | null
          building_id: string | null
          city: string | null
          county: string | null
          created_at: string
          description: string | null
          estimated_move_in_costs: number | null
          fee_structure: Json
          floor_plan_url: string | null
          furnished_status: string | null
          id: string
          landlord_lead_id: string | null
          last_verified_at: string | null
          lat: number | null
          laundry: string | null
          lease_term_options: string[]
          listing_expiration_date: string | null
          listing_source: string | null
          listing_status: string
          lng: number | null
          monthly_rent: number | null
          neighborhood: string | null
          owner_id: string | null
          parking: string | null
          pet_policy: string | null
          photos: string[]
          showing_instructions: string | null
          square_footage: number | null
          state: string
          unit_number: string | null
          updated_at: string
          video_url: string | null
          zip: string | null
        }
        Insert: {
          address: string
          amenities?: string[]
          application_instructions?: string | null
          assigned_agent_id?: string | null
          available_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_id?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          description?: string | null
          estimated_move_in_costs?: number | null
          fee_structure?: Json
          floor_plan_url?: string | null
          furnished_status?: string | null
          id?: string
          landlord_lead_id?: string | null
          last_verified_at?: string | null
          lat?: number | null
          laundry?: string | null
          lease_term_options?: string[]
          listing_expiration_date?: string | null
          listing_source?: string | null
          listing_status?: string
          lng?: number | null
          monthly_rent?: number | null
          neighborhood?: string | null
          owner_id?: string | null
          parking?: string | null
          pet_policy?: string | null
          photos?: string[]
          showing_instructions?: string | null
          square_footage?: number | null
          state?: string
          unit_number?: string | null
          updated_at?: string
          video_url?: string | null
          zip?: string | null
        }
        Update: {
          address?: string
          amenities?: string[]
          application_instructions?: string | null
          assigned_agent_id?: string | null
          available_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          building_id?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          description?: string | null
          estimated_move_in_costs?: number | null
          fee_structure?: Json
          floor_plan_url?: string | null
          furnished_status?: string | null
          id?: string
          landlord_lead_id?: string | null
          last_verified_at?: string | null
          lat?: number | null
          laundry?: string | null
          lease_term_options?: string[]
          listing_expiration_date?: string | null
          listing_source?: string | null
          listing_status?: string
          lng?: number | null
          monthly_rent?: number | null
          neighborhood?: string | null
          owner_id?: string | null
          parking?: string | null
          pet_policy?: string | null
          photos?: string[]
          showing_instructions?: string | null
          square_footage?: number | null
          state?: string
          unit_number?: string | null
          updated_at?: string
          video_url?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_units_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "rental_units_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "team_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_units_landlord_lead_id_fkey"
            columns: ["landlord_lead_id"]
            isOneToOne: false
            referencedRelation: "landlord_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_units_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["owner_id"]
          },
        ]
      }
      scores: {
        Row: {
          final_tier: number
          id: string
          parcel_id: string
          property_id: string | null
          score: number
          score_narrative: string | null
          scored_at: string
        }
        Insert: {
          final_tier: number
          id?: string
          parcel_id: string
          property_id?: string | null
          score: number
          score_narrative?: string | null
          scored_at?: string
        }
        Update: {
          final_tier?: number
          id?: string
          parcel_id?: string
          property_id?: string | null
          score?: number
          score_narrative?: string | null
          scored_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scores_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      skip_trace_confirmations: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          record_count: number
          record_ids: Json
          segment: string | null
          table_name: string
          token: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          record_count: number
          record_ids: Json
          segment?: string | null
          table_name: string
          token: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          record_count?: number
          record_ids?: Json
          segment?: string | null
          table_name?: string
          token?: string
        }
        Relationships: []
      }
      team_agents: {
        Row: {
          auth_user_id: string | null
          brokerage: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          last_deal_date: string | null
          license_number: string | null
          market: string
          notes: string | null
          override_pct: number
          phone: string | null
          role: string
          self_sourced_pct: number
          status: string
          team_lead_pct: number
          updated_at: string
          ytd_deals: number | null
          ytd_gci: number | null
          ytd_volume: number | null
        }
        Insert: {
          auth_user_id?: string | null
          brokerage: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          last_deal_date?: string | null
          license_number?: string | null
          market: string
          notes?: string | null
          override_pct?: number
          phone?: string | null
          role?: string
          self_sourced_pct?: number
          status?: string
          team_lead_pct?: number
          updated_at?: string
          ytd_deals?: number | null
          ytd_gci?: number | null
          ytd_volume?: number | null
        }
        Update: {
          auth_user_id?: string | null
          brokerage?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          last_deal_date?: string | null
          license_number?: string | null
          market?: string
          notes?: string | null
          override_pct?: number
          phone?: string | null
          role?: string
          self_sourced_pct?: number
          status?: string
          team_lead_pct?: number
          updated_at?: string
          ytd_deals?: number | null
          ytd_gci?: number | null
          ytd_volume?: number | null
        }
        Relationships: []
      }
      tours: {
        Row: {
          agent_id: string | null
          created_at: string
          id: string
          notes: string | null
          rental_inquiry_id: string
          rental_unit_id: string
          scheduled_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rental_inquiry_id: string
          rental_unit_id: string
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rental_inquiry_id?: string
          rental_unit_id?: string
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tours_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "tours_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "team_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_rental_inquiry_id_fkey"
            columns: ["rental_inquiry_id"]
            isOneToOne: false
            referencedRelation: "rental_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_rental_unit_id_fkey"
            columns: ["rental_unit_id"]
            isOneToOne: false
            referencedRelation: "rental_units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      agent_commission_summary: {
        Row: {
          agent_id: string | null
          brokerage: string | null
          deals_closed: number | null
          full_name: string | null
          market: string | null
          total_gci: number | null
          total_overrides: number | null
          total_to_agent: number | null
          total_to_you: number | null
          total_volume: number | null
        }
        Relationships: []
      }
      distressed_investor_pipeline: {
        Row: {
          assigned_agent_id: string | null
          bant_score: number | null
          created_at: string | null
          email: string | null
          full_name: string | null
          isa_lead_id: string | null
          market: string | null
          motivation_score: number | null
          outreach_status: string | null
          phone: string | null
          routing: string | null
        }
        Insert: {
          assigned_agent_id?: string | null
          bant_score?: number | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          isa_lead_id?: string | null
          market?: string | null
          motivation_score?: number | null
          outreach_status?: string | null
          phone?: string | null
          routing?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          bant_score?: number | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          isa_lead_id?: string | null
          market?: string | null
          motivation_score?: number | null
          outreach_status?: string | null
          phone?: string | null
          routing?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "isa_leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "isa_leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "team_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      isa_pipeline: {
        Row: {
          agent_name: string | null
          agent_phone: string | null
          ai_summary: string | null
          assigned_isa: string | null
          bant_score: number | null
          commission_source: string | null
          contract_value: number | null
          county: string | null
          created_at: string | null
          email: string | null
          employer: string | null
          entity_name: string | null
          full_name: string | null
          id: string | null
          isa_talking_points: Json | null
          last_outcome: string | null
          last_touched_at: string | null
          linkedin_url: string | null
          market: string | null
          motivation_score: number | null
          origin_country: string | null
          outreach_status: string | null
          phone: string | null
          price_range_max: number | null
          price_range_min: number | null
          production_name: string | null
          property_address: string | null
          rep_email: string | null
          rep_name: string | null
          rep_phone: string | null
          routing: string | null
          segment: string | null
          source_name: string | null
          source_url: string | null
          sport: string | null
          state: string | null
          team_name: string | null
          timeline_months: number | null
          touch_count: number | null
        }
        Relationships: []
      }
      landlord_leasing_pipeline: {
        Row: {
          assigned_agent_id: string | null
          created_at: string | null
          email: string | null
          expected_rent: number | null
          full_name: string | null
          isa_lead_id: string | null
          market: string | null
          phone: string | null
          pipeline_stage: string | null
          property_address: string | null
          vacancy_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "isa_leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "isa_leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "team_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_needing_module_triage: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string | null
          market: string | null
          segment: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          market?: string | null
          segment?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          market?: string | null
          segment?: string | null
        }
        Relationships: []
      }
      rental_leasing_pipeline: {
        Row: {
          ai_confidence: number | null
          ai_escalation_needed: boolean | null
          assigned_agent_id: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          isa_lead_id: string | null
          market: string | null
          max_rent: number | null
          min_bedrooms: number | null
          move_date: string | null
          outreach_status: string | null
          phone: string | null
          pipeline_stage: string | null
          routing: string | null
        }
        Relationships: [
          {
            foreignKeyName: "isa_leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "isa_leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "team_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      residential_sale_pipeline: {
        Row: {
          assigned_agent_id: string | null
          bant_score: number | null
          created_at: string | null
          email: string | null
          full_name: string | null
          isa_lead_id: string | null
          lead_role: string | null
          market: string | null
          motivation_score: number | null
          outreach_status: string | null
          phone: string | null
          routing: string | null
        }
        Insert: {
          assigned_agent_id?: string | null
          bant_score?: number | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          isa_lead_id?: string | null
          lead_role?: string | null
          market?: string | null
          motivation_score?: number | null
          outreach_status?: string | null
          phone?: string | null
          routing?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          bant_score?: number | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          isa_lead_id?: string | null
          lead_role?: string | null
          market?: string | null
          motivation_score?: number | null
          outreach_status?: string | null
          phone?: string | null
          routing?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "isa_leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_commission_summary"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "isa_leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "team_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      segment_roi: {
        Row: {
          appointments: number | null
          appt_rate_pct: number | null
          closed: number | null
          commission_source: string | null
          leads_total: number | null
          market: string | null
          segment: string | null
          total_revenue_to_you: number | null
        }
        Relationships: []
      }
      unclaimed_leads: {
        Row: {
          created_at: string | null
          email: string | null
          entity_name: string | null
          expected_rent: number | null
          full_name: string | null
          id: string | null
          landlord_pipeline_stage: string | null
          leasing_need: string | null
          market: string | null
          motivation_score: number | null
          motivation_signals: Json | null
          outreach_status: string | null
          phone: string | null
          property_address: string | null
          routing: string | null
          segment: string | null
          source_name: string | null
          source_url: string | null
          unit_count: number | null
          vacancy_date: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      agent_workload_counts: {
        Args: never
        Returns: {
          active_leads: number
          assigned_agent_id: string
        }[]
      }
      current_team_agent_id: { Args: never; Returns: string }
      increment_ai_budget_spend: {
        Args: { p_amount: number; p_period_start: string; p_provider: string }
        Returns: {
          cumulative_cost_usd: number
          just_paused: boolean
          pause_threshold_usd: number
          paused: boolean
        }[]
      }
      is_broker: { Args: never; Returns: boolean }
      next_touch_number: { Args: { p_lead_id: string }; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
