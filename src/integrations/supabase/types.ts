export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_contacts: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          license_number: string | null
          mls_id: string | null
          mls_source: string | null
          njmls_id: string | null
          njmls_last_sync: string | null
          njmls_status: string | null
          office_address: string | null
          office_name: string | null
          phone: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          license_number?: string | null
          mls_id?: string | null
          mls_source?: string | null
          njmls_id?: string | null
          njmls_last_sync?: string | null
          njmls_status?: string | null
          office_address?: string | null
          office_name?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          license_number?: string | null
          mls_id?: string | null
          mls_source?: string | null
          njmls_id?: string | null
          njmls_last_sync?: string | null
          njmls_status?: string | null
          office_address?: string | null
          office_name?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_credentials: {
        Row: {
          agent_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_used: boolean | null
          temp_password: string
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          temp_password: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          temp_password?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_credentials_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_onboarding"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_lead_transfer_pool: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          lead_status: string | null
          lead_temperature: string | null
          previous_agent_id: string | null
          previous_agent_name: string | null
          status: string | null
          transfer_reason: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          lead_status?: string | null
          lead_temperature?: string | null
          previous_agent_id?: string | null
          previous_agent_name?: string | null
          status?: string | null
          transfer_reason?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          lead_status?: string | null
          lead_temperature?: string | null
          previous_agent_id?: string | null
          previous_agent_name?: string | null
          status?: string | null
          transfer_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_lead_transfer_pool_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "agent_onboarding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_lead_transfer_pool_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "agent_lead_progress"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "agent_lead_transfer_pool_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_full_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_lead_transfer_pool_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_lead_transfer_pool_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_onboarding: {
        Row: {
          activation_type: string | null
          company: string | null
          created_at: string | null
          created_by: string | null
          daily_lead_limit: number | null
          distribution_status: string | null
          email: string
          error_message: string | null
          full_name: string
          id: string
          last_edited_at: string | null
          last_edited_by: string | null
          last_load_attempt: string | null
          last_retry_at: string | null
          leads_distribution_updated_at: string | null
          leads_received_today: number | null
          license_number: string | null
          loading_status: boolean | null
          payment_processed_at: string | null
          payment_status: string | null
          phone: string | null
          processed_at: string | null
          processed_by: string | null
          retry_count: number | null
          state: string | null
          status: Database["public"]["Enums"]["onboarding_status"]
          updated_at: string | null
        }
        Insert: {
          activation_type?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          daily_lead_limit?: number | null
          distribution_status?: string | null
          email: string
          error_message?: string | null
          full_name: string
          id?: string
          last_edited_at?: string | null
          last_edited_by?: string | null
          last_load_attempt?: string | null
          last_retry_at?: string | null
          leads_distribution_updated_at?: string | null
          leads_received_today?: number | null
          license_number?: string | null
          loading_status?: boolean | null
          payment_processed_at?: string | null
          payment_status?: string | null
          phone?: string | null
          processed_at?: string | null
          processed_by?: string | null
          retry_count?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["onboarding_status"]
          updated_at?: string | null
        }
        Update: {
          activation_type?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          daily_lead_limit?: number | null
          distribution_status?: string | null
          email?: string
          error_message?: string | null
          full_name?: string
          id?: string
          last_edited_at?: string | null
          last_edited_by?: string | null
          last_load_attempt?: string | null
          last_retry_at?: string | null
          leads_distribution_updated_at?: string | null
          leads_received_today?: number | null
          license_number?: string | null
          loading_status?: boolean | null
          payment_processed_at?: string | null
          payment_status?: string | null
          phone?: string | null
          processed_at?: string | null
          processed_by?: string | null
          retry_count?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["onboarding_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_onboarding_details: {
        Row: {
          activation_type: string | null
          company: string | null
          error_message: string | null
          id: string
          last_retry_at: string | null
          license_number: string | null
          payment_processed_at: string | null
          payment_status: string | null
          retry_count: number | null
          source_metadata: Json | null
          state: string | null
        }
        Insert: {
          activation_type?: string | null
          company?: string | null
          error_message?: string | null
          id: string
          last_retry_at?: string | null
          license_number?: string | null
          payment_processed_at?: string | null
          payment_status?: string | null
          retry_count?: number | null
          source_metadata?: Json | null
          state?: string | null
        }
        Update: {
          activation_type?: string | null
          company?: string | null
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          license_number?: string | null
          payment_processed_at?: string | null
          payment_status?: string | null
          retry_count?: number | null
          source_metadata?: Json | null
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_onboarding_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "agent_onboarding"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tools: {
        Row: {
          configuration: Json | null
          created_at: string | null
          description: string
          enabled: boolean | null
          id: string
          name: string
          type: Database["public"]["Enums"]["tool_type"]
          updated_at: string | null
        }
        Insert: {
          configuration?: Json | null
          created_at?: string | null
          description: string
          enabled?: boolean | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["tool_type"]
          updated_at?: string | null
        }
        Update: {
          configuration?: Json | null
          created_at?: string | null
          description?: string
          enabled?: boolean | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["tool_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_agents: {
        Row: {
          can_handoff_to: string[]
          created_at: string | null
          description: string
          id: string
          name: string
          system_prompt: string
          tools: Json
          type: string
          updated_at: string | null
        }
        Insert: {
          can_handoff_to?: string[]
          created_at?: string | null
          description: string
          id?: string
          name: string
          system_prompt: string
          tools?: Json
          type: string
          updated_at?: string | null
        }
        Update: {
          can_handoff_to?: string[]
          created_at?: string | null
          description?: string
          id?: string
          name?: string
          system_prompt?: string
          tools?: Json
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_agents_tools: {
        Row: {
          agent_id: string
          configuration: Json | null
          created_at: string | null
          tool_id: string
        }
        Insert: {
          agent_id: string
          configuration?: Json | null
          created_at?: string | null
          tool_id: string
        }
        Update: {
          agent_id?: string
          configuration?: Json | null
          created_at?: string | null
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_tools_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agents_tools_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "agent_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          content: string
          created_at: string | null
          id: string
          name: string
          scheduled_for: string | null
          sent_at: string | null
          status: string
          target_experience: string | null
          target_license_status: string | null
          target_specialty: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          name: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          target_experience?: string | null
          target_license_status?: string | null
          target_specialty?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          name?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          target_experience?: string | null
          target_license_status?: string | null
          target_specialty?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      candidate_imports: {
        Row: {
          created_at: string | null
          created_by: string | null
          error_count: number | null
          error_details: Json | null
          file_format: string | null
          filename: string
          id: string
          import_type: string | null
          mapping_config: Json | null
          processed_rows: number | null
          status: string | null
          success_count: number | null
          total_rows: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          error_count?: number | null
          error_details?: Json | null
          file_format?: string | null
          filename: string
          id?: string
          import_type?: string | null
          mapping_config?: Json | null
          processed_rows?: number | null
          status?: string | null
          success_count?: number | null
          total_rows?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          error_count?: number | null
          error_details?: Json | null
          file_format?: string | null
          filename?: string
          id?: string
          import_type?: string | null
          mapping_config?: Json | null
          processed_rows?: number | null
          status?: string | null
          success_count?: number | null
          total_rows?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      candidate_metadata: {
        Row: {
          id: string
          import_batch: string | null
          import_errors: Json | null
          import_id: string | null
          import_metadata: Json | null
          import_status: string | null
          raw_data: Json | null
          source: string | null
        }
        Insert: {
          id: string
          import_batch?: string | null
          import_errors?: Json | null
          import_id?: string | null
          import_metadata?: Json | null
          import_status?: string | null
          raw_data?: Json | null
          source?: string | null
        }
        Update: {
          id?: string
          import_batch?: string | null
          import_errors?: Json | null
          import_id?: string | null
          import_metadata?: Json | null
          import_status?: string | null
          raw_data?: Json | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_metadata_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_metadata_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "candidate_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_import"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "candidate_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_scans: {
        Row: {
          candidate_id: string
          created_at: string | null
          error_message: string | null
          id: string
          scan_result: Json | null
          scan_type: string
          scanned_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          scan_result?: Json | null
          scan_type: string
          scanned_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          scan_result?: Json | null
          scan_type?: string
          scanned_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_scans_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string
          experience: string | null
          first_name: string | null
          id: string
          import_batch: string | null
          import_errors: Json | null
          import_id: string | null
          import_metadata: Json | null
          import_status: string | null
          last_action: string | null
          last_name: string | null
          last_scan_at: string | null
          last_updated_by: string | null
          license_status: string | null
          linkedin_url: string | null
          marketing_stage: string | null
          name: string | null
          phone: string
          raw_data: Json | null
          resume_url: string | null
          scan_metadata: Json | null
          scan_status: string | null
          source: string | null
          specialty: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          experience?: string | null
          first_name?: string | null
          id?: string
          import_batch?: string | null
          import_errors?: Json | null
          import_id?: string | null
          import_metadata?: Json | null
          import_status?: string | null
          last_action?: string | null
          last_name?: string | null
          last_scan_at?: string | null
          last_updated_by?: string | null
          license_status?: string | null
          linkedin_url?: string | null
          marketing_stage?: string | null
          name?: string | null
          phone: string
          raw_data?: Json | null
          resume_url?: string | null
          scan_metadata?: Json | null
          scan_status?: string | null
          source?: string | null
          specialty?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          experience?: string | null
          first_name?: string | null
          id?: string
          import_batch?: string | null
          import_errors?: Json | null
          import_id?: string | null
          import_metadata?: Json | null
          import_status?: string | null
          last_action?: string | null
          last_name?: string | null
          last_scan_at?: string | null
          last_updated_by?: string | null
          license_status?: string | null
          linkedin_url?: string | null
          marketing_stage?: string | null
          name?: string | null
          phone?: string
          raw_data?: Json | null
          resume_url?: string | null
          scan_metadata?: Json | null
          scan_status?: string | null
          source?: string | null
          specialty?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "candidate_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      closed_deals: {
        Row: {
          closed_at: string | null
          created_at: string | null
          deal_amount: number | null
          id: string
          lead_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          deal_amount?: number | null
          id?: string
          lead_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          deal_amount?: number | null
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "closed_deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "agent_lead_progress"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "closed_deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_full_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closed_deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closed_deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["activity_priority"] | null
          status: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["activity_priority"] | null
          status?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["activity_priority"] | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          communication_history: Json | null
          created_at: string | null
          custom_fields: Json | null
          engagement_score: number | null
          id: string
          last_contacted: string | null
          last_modified_by: string | null
          lead_id: string | null
          lifecycle_stage: string | null
          metadata: Json | null
          next_follow_up: string | null
          notes: string | null
          preferred_contact_method: string | null
          source: string | null
          status: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          communication_history?: Json | null
          created_at?: string | null
          custom_fields?: Json | null
          engagement_score?: number | null
          id?: string
          last_contacted?: string | null
          last_modified_by?: string | null
          lead_id?: string | null
          lifecycle_stage?: string | null
          metadata?: Json | null
          next_follow_up?: string | null
          notes?: string | null
          preferred_contact_method?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          communication_history?: Json | null
          created_at?: string | null
          custom_fields?: Json | null
          engagement_score?: number | null
          id?: string
          last_contacted?: string | null
          last_modified_by?: string | null
          lead_id?: string | null
          lifecycle_stage?: string | null
          metadata?: Json | null
          next_follow_up?: string | null
          notes?: string | null
          preferred_contact_method?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "agent_lead_progress"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "crm_contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_full_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_settings: {
        Row: {
          created_at: string
          display_preferences: Json | null
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_preferences?: Json | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_preferences?: Json | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      deadlock_logs: {
        Row: {
          details: Json | null
          id: string
          occurred_at: string | null
          operation: string | null
          process_id: number | null
          resolution_details: string | null
          resolved: boolean | null
          resolved_at: string | null
          table_name: string | null
          user_id: string | null
          wait_time_ms: number | null
        }
        Insert: {
          details?: Json | null
          id?: string
          occurred_at?: string | null
          operation?: string | null
          process_id?: number | null
          resolution_details?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          table_name?: string | null
          user_id?: string | null
          wait_time_ms?: number | null
        }
        Update: {
          details?: Json | null
          id?: string
          occurred_at?: string | null
          operation?: string | null
          process_id?: number | null
          resolution_details?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          table_name?: string | null
          user_id?: string | null
          wait_time_ms?: number | null
        }
        Relationships: []
      }
      email_configurations: {
        Row: {
          created_at: string | null
          description: string | null
          email_address: string
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          email_address: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          email_address?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      follow_up_templates: {
        Row: {
          content: string | null
          created_at: string | null
          day_number: number
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string | null
          type: Database["public"]["Enums"]["touchpoint_type"]
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          day_number: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject?: string | null
          type: Database["public"]["Enums"]["touchpoint_type"]
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          day_number?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string | null
          type?: Database["public"]["Enums"]["touchpoint_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      import_marketing_materials: {
        Row: {
          created_at: string | null
          id: string
          import_id: string | null
          material_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          import_id?: string | null
          material_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          import_id?: string | null
          material_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_marketing_materials_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "lead_import_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_marketing_materials_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "lead_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_marketing_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "marketing_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_batches: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          error_count: number | null
          id: string
          name: string
          status: string | null
          success_count: number | null
          total_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          error_count?: number | null
          id?: string
          name: string
          status?: string | null
          success_count?: number | null
          total_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          error_count?: number | null
          id?: string
          name?: string
          status?: string | null
          success_count?: number | null
          total_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invitation_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      invitation_tracking: {
        Row: {
          accepted_at: string | null
          first_viewed_at: string | null
          id: string
          last_resend_at: string | null
          last_sent_at: string | null
          rate_limit_until: string | null
          reminder_sent_at: string | null
          resend_count: number | null
          view_count: number | null
        }
        Insert: {
          accepted_at?: string | null
          first_viewed_at?: string | null
          id: string
          last_resend_at?: string | null
          last_sent_at?: string | null
          rate_limit_until?: string | null
          reminder_sent_at?: string | null
          resend_count?: number | null
          view_count?: number | null
        }
        Update: {
          accepted_at?: string | null
          first_viewed_at?: string | null
          id?: string
          last_resend_at?: string | null
          last_sent_at?: string | null
          rate_limit_until?: string | null
          reminder_sent_at?: string | null
          resend_count?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_tracking_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          batch_id: string | null
          created_at: string | null
          created_by: string | null
          email: string
          expires_at: string
          first_viewed_at: string | null
          id: string
          invitation_type: string | null
          last_resend_at: string | null
          last_sent_at: string | null
          metadata: Json | null
          notes: string | null
          rate_limit_until: string | null
          reminder_sent_at: string | null
          resend_count: number | null
          sent_by: string | null
          status: Database["public"]["Enums"]["invitation_status"]
          template_id: string | null
          token: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          accepted_at?: string | null
          batch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          expires_at?: string
          first_viewed_at?: string | null
          id?: string
          invitation_type?: string | null
          last_resend_at?: string | null
          last_sent_at?: string | null
          metadata?: Json | null
          notes?: string | null
          rate_limit_until?: string | null
          reminder_sent_at?: string | null
          resend_count?: number | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          template_id?: string | null
          token: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          accepted_at?: string | null
          batch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          expires_at?: string
          first_viewed_at?: string | null
          id?: string
          invitation_type?: string | null
          last_resend_at?: string | null
          last_sent_at?: string | null
          metadata?: Json | null
          notes?: string | null
          rate_limit_until?: string | null
          reminder_sent_at?: string | null
          resend_count?: number | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          template_id?: string | null
          token?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_control_settings: {
        Row: {
          archive_instead_of_delete: boolean | null
          auto_assign_enabled: boolean | null
          created_at: string | null
          daily_lead_limit: number | null
          id: string
          lock_version: number | null
          owner_id: string | null
          pause_distribution: boolean | null
          updated_at: string | null
        }
        Insert: {
          archive_instead_of_delete?: boolean | null
          auto_assign_enabled?: boolean | null
          created_at?: string | null
          daily_lead_limit?: number | null
          id?: string
          lock_version?: number | null
          owner_id?: string | null
          pause_distribution?: boolean | null
          updated_at?: string | null
        }
        Update: {
          archive_instead_of_delete?: boolean | null
          auto_assign_enabled?: boolean | null
          created_at?: string | null
          daily_lead_limit?: number | null
          id?: string
          lock_version?: number | null
          owner_id?: string | null
          pause_distribution?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_details: {
        Row: {
          address: string | null
          budget: number | null
          city: string | null
          email_metadata: Json | null
          email_source: string | null
          external_id: string | null
          follow_up_date: string | null
          id: string
          last_contact_date: string | null
          location: string | null
          notes: string | null
          postal_code: string | null
          preferred_contact_method: string | null
          property_address: string | null
          property_type: string | null
          secondary_email: string | null
          secondary_phone: string | null
          source: string | null
          source_details: Json | null
          source_referral_fee: number | null
          source_referral_notes: string | null
          state: string | null
        }
        Insert: {
          address?: string | null
          budget?: number | null
          city?: string | null
          email_metadata?: Json | null
          email_source?: string | null
          external_id?: string | null
          follow_up_date?: string | null
          id: string
          last_contact_date?: string | null
          location?: string | null
          notes?: string | null
          postal_code?: string | null
          preferred_contact_method?: string | null
          property_address?: string | null
          property_type?: string | null
          secondary_email?: string | null
          secondary_phone?: string | null
          source?: string | null
          source_details?: Json | null
          source_referral_fee?: number | null
          source_referral_notes?: string | null
          state?: string | null
        }
        Update: {
          address?: string | null
          budget?: number | null
          city?: string | null
          email_metadata?: Json | null
          email_source?: string | null
          external_id?: string | null
          follow_up_date?: string | null
          id?: string
          last_contact_date?: string | null
          location?: string | null
          notes?: string | null
          postal_code?: string | null
          preferred_contact_method?: string | null
          property_address?: string | null
          property_type?: string | null
          secondary_email?: string | null
          secondary_phone?: string | null
          source?: string | null
          source_details?: Json | null
          source_referral_fee?: number | null
          source_referral_notes?: string | null
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "agent_lead_progress"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "lead_full_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "lead_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_email_communications: {
        Row: {
          content: string
          created_at: string | null
          id: string
          lead_id: string | null
          material_id: string | null
          metadata: Json | null
          sender_id: string | null
          sent_at: string | null
          status: string | null
          subject: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          material_id?: string | null
          metadata?: Json | null
          sender_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          material_id?: string | null
          metadata?: Json | null
          sender_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_email_communications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "agent_lead_progress"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_email_communications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_full_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_email_communications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_email_communications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_email_communications_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "marketing_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_follow_ups: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          notes: string | null
          scheduled_for: string
          status: string | null
          template_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          scheduled_for: string
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          scheduled_for?: string
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "agent_lead_progress"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_full_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_follow_ups_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "follow_up_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_funnel_progress: {
        Row: {
          assigned_agent_id: string | null
          created_at: string | null
          current_stage: Database["public"]["Enums"]["lead_funnel_stage"] | null
          days_in_stage: number | null
          id: string
          last_activity_date: string | null
          lead_id: string | null
          next_action_date: string | null
          notes: string | null
          total_activities: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_agent_id?: string | null
          created_at?: string | null
          current_stage?:
            | Database["public"]["Enums"]["lead_funnel_stage"]
            | null
          days_in_stage?: number | null
          id?: string
          last_activity_date?: string | null
          lead_id?: string | null
          next_action_date?: string | null
          notes?: string | null
          total_activities?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          created_at?: string | null
          current_stage?:
            | Database["public"]["Enums"]["lead_funnel_stage"]
            | null
          days_in_stage?: number | null
          id?: string
          last_activity_date?: string | null
          lead_id?: string | null
          next_action_date?: string | null
          notes?: string | null
          total_activities?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_funnel_progress_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "agent_lead_progress"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_funnel_progress_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_full_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_funnel_progress_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_funnel_progress_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_import_chunks: {
        Row: {
          chunk_number: number
          created_at: string | null
          error_count: number | null
          error_details: Json | null
          id: string
          import_id: string | null
          processed_rows: number | null
          status: string | null
          success_count: number | null
          updated_at: string | null
        }
        Insert: {
          chunk_number: number
          created_at?: string | null
          error_count?: number | null
          error_details?: Json | null
          id?: string
          import_id?: string | null
          processed_rows?: number | null
          status?: string | null
          success_count?: number | null
          updated_at?: string | null
        }
        Update: {
          chunk_number?: number
          created_at?: string | null
          error_count?: number | null
          error_details?: Json | null
          id?: string
          import_id?: string | null
          processed_rows?: number | null
          status?: string | null
          success_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_import_chunks_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "lead_import_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_import_chunks_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "lead_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_import_logs: {
        Row: {
          created_at: string | null
          id: string
          import_id: string | null
          log_type: string
          message: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          import_id?: string | null
          log_type: string
          message: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          import_id?: string | null
          log_type?: string
          message?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_import_logs_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "lead_import_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_import_logs_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "lead_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_import_tracking: {
        Row: {
          batch_size: number | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          deadlock_details: Json | null
          error_count: number | null
          has_deadlock: boolean | null
          id: string
          processed_records: number | null
          started_at: string | null
          success_count: number | null
          total_records: number | null
          updated_at: string | null
        }
        Insert: {
          batch_size?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deadlock_details?: Json | null
          error_count?: number | null
          has_deadlock?: boolean | null
          id?: string
          processed_records?: number | null
          started_at?: string | null
          success_count?: number | null
          total_records?: number | null
          updated_at?: string | null
        }
        Update: {
          batch_size?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deadlock_details?: Json | null
          error_count?: number | null
          has_deadlock?: boolean | null
          id?: string
          processed_records?: number | null
          started_at?: string | null
          success_count?: number | null
          total_records?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_imports: {
        Row: {
          can_retry: boolean | null
          chunk_processing_status: Json | null
          chunk_size: number | null
          column_mapping: Json | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          current_chunk: number | null
          deadlock_count: number | null
          error_count: number | null
          error_details: Json | null
          extended_fields: Json | null
          file_format: string
          file_path: string | null
          filename: string
          header_mapping: Json | null
          id: string
          import_log: Json | null
          last_deadlock_at: string | null
          last_lock_attempt: string | null
          lead_category: string | null
          lock_attempt_count: number | null
          mapping_config: Json | null
          preview_data: Json | null
          preview_status: string | null
          processed_rows: number | null
          retry_count: number | null
          retryable_rows: Json | null
          source: string | null
          source_details: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["import_status_type"]
          storage_path: string | null
          success_count: number | null
          team_id: string | null
          total_rows: number | null
          updated_at: string | null
          validation_errors: Json | null
        }
        Insert: {
          can_retry?: boolean | null
          chunk_processing_status?: Json | null
          chunk_size?: number | null
          column_mapping?: Json | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          current_chunk?: number | null
          deadlock_count?: number | null
          error_count?: number | null
          error_details?: Json | null
          extended_fields?: Json | null
          file_format: string
          file_path?: string | null
          filename: string
          header_mapping?: Json | null
          id?: string
          import_log?: Json | null
          last_deadlock_at?: string | null
          last_lock_attempt?: string | null
          lead_category?: string | null
          lock_attempt_count?: number | null
          mapping_config?: Json | null
          preview_data?: Json | null
          preview_status?: string | null
          processed_rows?: number | null
          retry_count?: number | null
          retryable_rows?: Json | null
          source?: string | null
          source_details?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["import_status_type"]
          storage_path?: string | null
          success_count?: number | null
          team_id?: string | null
          total_rows?: number | null
          updated_at?: string | null
          validation_errors?: Json | null
        }
        Update: {
          can_retry?: boolean | null
          chunk_processing_status?: Json | null
          chunk_size?: number | null
          column_mapping?: Json | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          current_chunk?: number | null
          deadlock_count?: number | null
          error_count?: number | null
          error_details?: Json | null
          extended_fields?: Json | null
          file_format?: string
          file_path?: string | null
          filename?: string
          header_mapping?: Json | null
          id?: string
          import_log?: Json | null
          last_deadlock_at?: string | null
          last_lock_attempt?: string | null
          lead_category?: string | null
          lock_attempt_count?: number | null
          mapping_config?: Json | null
          preview_data?: Json | null
          preview_status?: string | null
          processed_rows?: number | null
          retry_count?: number | null
          retryable_rows?: Json | null
          source?: string | null
          source_details?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["import_status_type"]
          storage_path?: string | null
          success_count?: number | null
          team_id?: string | null
          total_rows?: number | null
          updated_at?: string | null
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_imports_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_magnet_interactions: {
        Row: {
          content_title: string
          created_at: string | null
          downloaded_at: string | null
          id: string
          lead_id: string | null
          magnet_type: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          content_title: string
          created_at?: string | null
          downloaded_at?: string | null
          id?: string
          lead_id?: string | null
          magnet_type: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          content_title?: string
          created_at?: string | null
          downloaded_at?: string | null
          id?: string
          lead_id?: string | null
          magnet_type?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_magnet_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "agent_lead_progress"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_magnet_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_full_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_magnet_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_magnet_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_marketing_materials: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          lead_type: string
          material_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          lead_type: string
          material_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          lead_type?: string
          material_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_marketing_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "marketing_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_messages: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          id: string
          lead_id: string | null
          message: string
          metadata: Json | null
          read_at: string | null
          sender_id: string | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          lead_id?: string | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          lead_id?: string | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "agent_lead_progress"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_full_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_qualifications: {
        Row: {
          budget: number | null
          created_at: string | null
          id: string
          lead_id: string
          need: string | null
          timeline: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          created_at?: string | null
          id?: string
          lead_id: string
          need?: string | null
          timeline?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          created_at?: string | null
          id?: string
          lead_id?: string
          need?: string | null
          timeline?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_qualifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "agent_lead_progress"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_qualifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_full_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_qualifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_qualifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_validations: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          updated_at: string | null
          validation_errors: Json | null
          validation_result: boolean
          validation_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          updated_at?: string | null
          validation_errors?: Json | null
          validation_result: boolean
          validation_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          updated_at?: string | null
          validation_errors?: Json | null
          validation_result?: boolean
          validation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_validations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "agent_lead_progress"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_validations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_full_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_validations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_validations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          agent_id: string | null
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          budget: number | null
          company_area: string | null
          company_id: string | null
          company_name: string | null
          company_type: string | null
          construction_type: string | null
          created_at: string | null
          deal_value: number | null
          distribution_date: string | null
          distribution_status: string | null
          email: string | null
          email_metadata: Json | null
          email_source: string | null
          expected_close_date: string | null
          follow_up_date: string | null
          id: string
          import_errors: string[] | null
          import_id: string | null
          import_row_number: number | null
          last_access_attempt: string | null
          last_contact_date: string | null
          last_edited_at: string | null
          last_edited_by: string | null
          location: string | null
          loss_reason: string | null
          name: string
          notes: string | null
          phone: string | null
          preferred_contact_method: string | null
          probability: number | null
          property_type: string | null
          sales_stage: string | null
          source: string | null
          source_details: Json | null
          source_referral_fee: number | null
          source_referral_notes: string | null
          status: string
          team_id: string | null
          type: string
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          agent_id?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          budget?: number | null
          company_area?: string | null
          company_id?: string | null
          company_name?: string | null
          company_type?: string | null
          construction_type?: string | null
          created_at?: string | null
          deal_value?: number | null
          distribution_date?: string | null
          distribution_status?: string | null
          email?: string | null
          email_metadata?: Json | null
          email_source?: string | null
          expected_close_date?: string | null
          follow_up_date?: string | null
          id?: string
          import_errors?: string[] | null
          import_id?: string | null
          import_row_number?: number | null
          last_access_attempt?: string | null
          last_contact_date?: string | null
          last_edited_at?: string | null
          last_edited_by?: string | null
          location?: string | null
          loss_reason?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          probability?: number | null
          property_type?: string | null
          sales_stage?: string | null
          source?: string | null
          source_details?: Json | null
          source_referral_fee?: number | null
          source_referral_notes?: string | null
          status?: string
          team_id?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          agent_id?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          budget?: number | null
          company_area?: string | null
          company_id?: string | null
          company_name?: string | null
          company_type?: string | null
          construction_type?: string | null
          created_at?: string | null
          deal_value?: number | null
          distribution_date?: string | null
          distribution_status?: string | null
          email?: string | null
          email_metadata?: Json | null
          email_source?: string | null
          expected_close_date?: string | null
          follow_up_date?: string | null
          id?: string
          import_errors?: string[] | null
          import_id?: string | null
          import_row_number?: number | null
          last_access_attempt?: string | null
          last_contact_date?: string | null
          last_edited_at?: string | null
          last_edited_by?: string | null
          location?: string | null
          loss_reason?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          probability?: number | null
          property_type?: string | null
          sales_stage?: string | null
          source?: string | null
          source_details?: Json | null
          source_referral_fee?: number | null
          source_referral_notes?: string | null
          status?: string
          team_id?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "lead_import_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "lead_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      loading_performance_logs: {
        Row: {
          component_path: string
          created_at: string | null
          duration_ms: number | null
          end_time: string | null
          error_message: string | null
          id: string
          page_url: string | null
          query_count: number | null
          start_time: string
          success: boolean | null
          user_id: string | null
        }
        Insert: {
          component_path: string
          created_at?: string | null
          duration_ms?: number | null
          end_time?: string | null
          error_message?: string | null
          id?: string
          page_url?: string | null
          query_count?: number | null
          start_time: string
          success?: boolean | null
          user_id?: string | null
        }
        Update: {
          component_path?: string
          created_at?: string | null
          duration_ms?: number | null
          end_time?: string | null
          error_message?: string | null
          id?: string
          page_url?: string | null
          query_count?: number | null
          start_time?: string
          success?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempt_time: string | null
          email: string
          id: string
          ip_address: string | null
          success: boolean | null
        }
        Insert: {
          attempt_time?: string | null
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean | null
        }
        Update: {
          attempt_time?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean | null
        }
        Relationships: []
      }
      marketing_campaign_performance: {
        Row: {
          conversions: number | null
          end_date: string | null
          engagement_rate: number | null
          id: string
          material_id: string | null
          performance_metrics: Json | null
          start_date: string | null
          views: number | null
        }
        Insert: {
          conversions?: number | null
          end_date?: string | null
          engagement_rate?: number | null
          id?: string
          material_id?: string | null
          performance_metrics?: Json | null
          start_date?: string | null
          views?: number | null
        }
        Update: {
          conversions?: number | null
          end_date?: string | null
          engagement_rate?: number | null
          id?: string
          material_id?: string | null
          performance_metrics?: Json | null
          start_date?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaign_performance_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "marketing_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_materials: {
        Row: {
          analytics: Json | null
          brand_logo_url: string | null
          category: string
          created_at: string | null
          description: string | null
          download_count: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_premium: boolean | null
          scheduled_posts: Json | null
          search_keywords: string[] | null
          target_audience: string[] | null
          template_url: string | null
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          analytics?: Json | null
          brand_logo_url?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_premium?: boolean | null
          scheduled_posts?: Json | null
          search_keywords?: string[] | null
          target_audience?: string[] | null
          template_url?: string | null
          thumbnail_url?: string | null
          title: string
          type: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          analytics?: Json | null
          brand_logo_url?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_premium?: boolean | null
          scheduled_posts?: Json | null
          search_keywords?: string[] | null
          target_audience?: string[] | null
          template_url?: string | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      marketing_templates: {
        Row: {
          category: string
          content: string
          created_at: string | null
          description: string | null
          id: string
          is_customizable: boolean | null
          is_premium: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_customizable?: boolean | null
          is_premium?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_customizable?: boolean | null
          is_premium?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      material_downloads: {
        Row: {
          downloaded_at: string | null
          id: string
          material_id: string | null
          user_id: string | null
        }
        Insert: {
          downloaded_at?: string | null
          id?: string
          material_id?: string | null
          user_id?: string | null
        }
        Update: {
          downloaded_at?: string | null
          id?: string
          material_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_downloads_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "marketing_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_favorites: {
        Row: {
          created_at: string | null
          id: string
          material_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          material_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          material_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_favorites_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "marketing_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          name: string
          priority: number | null
          retry_count: number | null
          sql_statement: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          name: string
          priority?: number | null
          retry_count?: number | null
          sql_statement: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          name?: string
          priority?: number | null
          retry_count?: number | null
          sql_statement?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      mls_feed_configs: {
        Row: {
          configuration: Json | null
          created_at: string | null
          credentials: Json | null
          enabled: boolean | null
          feed_type: string
          id: string
          last_sync_at: string | null
          name: string
          provider: string
          updated_at: string | null
        }
        Insert: {
          configuration?: Json | null
          created_at?: string | null
          credentials?: Json | null
          enabled?: boolean | null
          feed_type: string
          id?: string
          last_sync_at?: string | null
          name: string
          provider: string
          updated_at?: string | null
        }
        Update: {
          configuration?: Json | null
          created_at?: string | null
          credentials?: Json | null
          enabled?: boolean | null
          feed_type?: string
          id?: string
          last_sync_at?: string | null
          name?: string
          provider?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mls_feed_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          feed_config_id: string | null
          id: string
          records_processed: number | null
          status: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          feed_config_id?: string | null
          id?: string
          records_processed?: number | null
          status: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          feed_config_id?: string | null
          id?: string
          records_processed?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mls_feed_logs_feed_config_id_fkey"
            columns: ["feed_config_id"]
            isOneToOne: false
            referencedRelation: "mls_feed_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      negotiations: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          proposal_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          proposal_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          proposal_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negotiations_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      password_resets: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          last_attempt_at: string | null
          token: string
          updated_at: string | null
          user_id: string | null
          verification_attempts: number | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          last_attempt_at?: string | null
          token: string
          updated_at?: string | null
          user_id?: string | null
          verification_attempts?: number | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          last_attempt_at?: string | null
          token?: string
          updated_at?: string | null
          user_id?: string | null
          verification_attempts?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          last_login: string | null
          license_number: string | null
          mfa_enabled: boolean | null
          mfa_secret: string | null
          phone: string | null
          remember_me: boolean | null
          status: string | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          last_login?: string | null
          license_number?: string | null
          mfa_enabled?: boolean | null
          mfa_secret?: string | null
          phone?: string | null
          remember_me?: boolean | null
          status?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          last_login?: string | null
          license_number?: string | null
          mfa_enabled?: boolean | null
          mfa_secret?: string | null
          phone?: string | null
          remember_me?: boolean | null
          status?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          amenities: Json | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string | null
          days_on_market: number | null
          description: string | null
          id: string
          last_list_price: number | null
          location_data: Json | null
          mls_number: string | null
          previous_listing_date: string | null
          previous_listing_price: number | null
          price: number | null
          price_reductions: number | null
          property_type: string | null
          sell_score: number | null
          square_feet: number | null
          status: string | null
          updated_at: string | null
          virtual_tour_url: string | null
          year_built: number | null
          zillow_id: string | null
        }
        Insert: {
          address: string
          amenities?: Json | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string | null
          days_on_market?: number | null
          description?: string | null
          id?: string
          last_list_price?: number | null
          location_data?: Json | null
          mls_number?: string | null
          previous_listing_date?: string | null
          previous_listing_price?: number | null
          price?: number | null
          price_reductions?: number | null
          property_type?: string | null
          sell_score?: number | null
          square_feet?: number | null
          status?: string | null
          updated_at?: string | null
          virtual_tour_url?: string | null
          year_built?: number | null
          zillow_id?: string | null
        }
        Update: {
          address?: string
          amenities?: Json | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string | null
          days_on_market?: number | null
          description?: string | null
          id?: string
          last_list_price?: number | null
          location_data?: Json | null
          mls_number?: string | null
          previous_listing_date?: string | null
          previous_listing_price?: number | null
          price?: number | null
          price_reductions?: number | null
          property_type?: string | null
          sell_score?: number | null
          square_feet?: number | null
          status?: string | null
          updated_at?: string | null
          virtual_tour_url?: string | null
          year_built?: number | null
          zillow_id?: string | null
        }
        Relationships: []
      }
      property_candidate_matches: {
        Row: {
          candidate_id: string | null
          created_at: string | null
          id: string
          match_criteria: Json | null
          match_score: number | null
          notes: string | null
          property_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string | null
          id?: string
          match_criteria?: Json | null
          match_score?: number | null
          notes?: string | null
          property_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          candidate_id?: string | null
          created_at?: string | null
          id?: string
          match_criteria?: Json | null
          match_score?: number | null
          notes?: string | null
          property_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_candidate_matches_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_candidate_matches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_listing_history: {
        Row: {
          created_at: string | null
          days_on_market: number | null
          id: string
          list_date: string | null
          list_price: number | null
          notes: string | null
          price_change: number | null
          property_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          days_on_market?: number | null
          id?: string
          list_date?: string | null
          list_price?: number | null
          notes?: string | null
          price_change?: number | null
          property_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          days_on_market?: number | null
          id?: string
          list_date?: string | null
          list_price?: number | null
          notes?: string | null
          price_change?: number | null
          property_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_listing_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_search_history: {
        Row: {
          created_at: string | null
          id: string
          results_count: number | null
          search_params: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          results_count?: number | null
          search_params: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          results_count?: number | null
          search_params?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      proposals: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          proposal_details: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          proposal_details?: Json | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          proposal_details?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "agent_lead_progress"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_full_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_activities: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          lead_id: string
          outcome: string | null
          scheduled_at: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id: string
          outcome?: string | null
          scheduled_at?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id?: string
          outcome?: string | null
          scheduled_at?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "agent_lead_progress"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "sales_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_full_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_stage_transitions: {
        Row: {
          changed_by: string | null
          id: string
          lead_id: string | null
          metrics: Json | null
          new_stage: Database["public"]["Enums"]["sales_stage_type"] | null
          notes: string | null
          previous_stage: Database["public"]["Enums"]["sales_stage_type"] | null
          transition_date: string | null
        }
        Insert: {
          changed_by?: string | null
          id?: string
          lead_id?: string | null
          metrics?: Json | null
          new_stage?: Database["public"]["Enums"]["sales_stage_type"] | null
          notes?: string | null
          previous_stage?:
            | Database["public"]["Enums"]["sales_stage_type"]
            | null
          transition_date?: string | null
        }
        Update: {
          changed_by?: string | null
          id?: string
          lead_id?: string | null
          metrics?: Json | null
          new_stage?: Database["public"]["Enums"]["sales_stage_type"] | null
          notes?: string | null
          previous_stage?:
            | Database["public"]["Enums"]["sales_stage_type"]
            | null
          transition_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_stage_transitions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "agent_lead_progress"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "sales_stage_transitions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_full_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_stage_transitions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_stage_transitions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_stages: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string | null
          id: string
          name: string
          search_params: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          search_params: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          search_params?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      storage_config: {
        Row: {
          created_at: string | null
          id: string
          key_name: string
          key_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_name: string
          key_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key_name?: string
          key_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          created_at: string | null
          details: string | null
          id: string
          timestamp: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          id?: string
          timestamp?: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          id?: string
          timestamp?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      template_configurations: {
        Row: {
          brand_settings: Json | null
          created_at: string | null
          id: string
          locked_fields: Json | null
          template_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          brand_settings?: Json | null
          created_at?: string | null
          id?: string
          locked_fields?: Json | null
          template_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          brand_settings?: Json | null
          created_at?: string | null
          id?: string
          locked_fields?: Json | null
          template_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      template_data_mappings: {
        Row: {
          created_at: string | null
          data_source: string
          field_name: string
          id: string
          mapping_config: Json | null
          mapping_type: string
          template_id: string
        }
        Insert: {
          created_at?: string | null
          data_source: string
          field_name: string
          id?: string
          mapping_config?: Json | null
          mapping_type: string
          template_id: string
        }
        Update: {
          created_at?: string | null
          data_source?: string
          field_name?: string
          id?: string
          mapping_config?: Json | null
          mapping_type?: string
          template_id?: string
        }
        Relationships: []
      }
      text_messages: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          lead_id: string | null
          message: string
          metadata: Json | null
          sender_id: string | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          lead_id?: string | null
          message: string
          metadata?: Json | null
          sender_id?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          lead_id?: string | null
          message?: string
          metadata?: Json | null
          sender_id?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "text_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "agent_lead_progress"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "text_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_full_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "text_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "text_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      two_factor_recovery_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          used: boolean | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          used?: boolean | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          used?: boolean | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      unauthorized_access_attempts: {
        Row: {
          attempted_at: string | null
          id: string
          ip_address: string | null
          lead_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          attempted_at?: string | null
          id?: string
          ip_address?: string | null
          lead_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          attempted_at?: string | null
          id?: string
          ip_address?: string | null
          lead_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unauthorized_access_attempts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "agent_lead_progress"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "unauthorized_access_attempts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_full_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unauthorized_access_attempts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unauthorized_access_attempts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_deletions: {
        Row: {
          completed_at: string | null
          deleted_by: string | null
          error_message: string | null
          id: string
          initiated_at: string | null
          status: Database["public"]["Enums"]["deletion_status"] | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          deleted_by?: string | null
          error_message?: string | null
          id?: string
          initiated_at?: string | null
          status?: Database["public"]["Enums"]["deletion_status"] | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          deleted_by?: string | null
          error_message?: string | null
          id?: string
          initiated_at?: string | null
          status?: Database["public"]["Enums"]["deletion_status"] | null
          user_id?: string
        }
        Relationships: []
      }
      user_marketing_materials: {
        Row: {
          created_at: string | null
          customized_content: string | null
          downloaded_at: string | null
          id: string
          material_id: string | null
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customized_content?: string | null
          downloaded_at?: string | null
          id?: string
          material_id?: string | null
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customized_content?: string | null
          downloaded_at?: string | null
          id?: string
          material_id?: string | null
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_marketing_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "marketing_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_marketing_materials_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "marketing_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_metadata: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          last_verified_at: string | null
          metadata: Json | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id: string
          last_verified_at?: string | null
          metadata?: Json | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          last_verified_at?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_role_metadata_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          email: string | null
          id: number
          phone: string | null
        }
        Insert: {
          email?: string | null
          id?: never
          phone?: string | null
        }
        Update: {
          email?: string | null
          id?: never
          phone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      active_locks: {
        Row: {
          blocked_pid: number | null
          blocked_statement: string | null
          blocked_user: unknown | null
          blocking_pid: number | null
          blocking_user: unknown | null
        }
        Relationships: []
      }
      agent_lead_progress: {
        Row: {
          activities_count: number | null
          agent_id: string | null
          agent_name: string | null
          follow_up_date: string | null
          follow_ups_count: number | null
          last_activity_date: string | null
          last_contact_date: string | null
          lead_id: string | null
          lead_name: string | null
          lead_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_statistics: {
        Row: {
          active_licenses: number | null
          funnel_contacted: number | null
          funnel_interested: number | null
          funnel_leads: number | null
          funnel_prospects: number | null
          funnel_qualified: number | null
          scanned_candidates: number | null
          states_represented: number | null
          total_candidates: number | null
          unique_specialties: number | null
        }
        Relationships: []
      }
      dashboard_lead_stats: {
        Row: {
          count: number | null
          last_updated: string | null
          status: string | null
        }
        Relationships: []
      }
      lead_full_details: {
        Row: {
          agent_id: string | null
          budget: number | null
          created_at: string | null
          distribution_date: string | null
          distribution_status: string | null
          email: string | null
          email_metadata: Json | null
          email_source: string | null
          follow_up_date: string | null
          id: string | null
          last_contact_date: string | null
          last_edited_at: string | null
          last_edited_by: string | null
          location: string | null
          name: string | null
          notes: string | null
          phone: string | null
          preferred_contact_method: string | null
          property_type: string | null
          source: string | null
          source_details: Json | null
          source_referral_fee: number | null
          source_referral_notes: string | null
          status: string | null
          team_id: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          budget?: number | null
          created_at?: string | null
          distribution_date?: string | null
          distribution_status?: string | null
          email?: string | null
          email_metadata?: Json | null
          email_source?: string | null
          follow_up_date?: string | null
          id?: string | null
          last_contact_date?: string | null
          last_edited_at?: string | null
          last_edited_by?: string | null
          location?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          property_type?: string | null
          source?: string | null
          source_details?: Json | null
          source_referral_fee?: number | null
          source_referral_notes?: string | null
          status?: string | null
          team_id?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          budget?: number | null
          created_at?: string | null
          distribution_date?: string | null
          distribution_status?: string | null
          email?: string | null
          email_metadata?: Json | null
          email_source?: string | null
          follow_up_date?: string | null
          id?: string | null
          last_contact_date?: string | null
          last_edited_at?: string | null
          last_edited_by?: string | null
          location?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          property_type?: string | null
          source?: string | null
          source_details?: Json | null
          source_referral_fee?: number | null
          source_referral_notes?: string | null
          status?: string | null
          team_id?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_import_files: {
        Row: {
          created_at: string | null
          error_count: number | null
          file_format: string | null
          file_path: string | null
          filename: string | null
          id: string | null
          processed_rows: number | null
          status: Database["public"]["Enums"]["import_status_type"] | null
          success_count: number | null
          total_rows: number | null
        }
        Insert: {
          created_at?: string | null
          error_count?: number | null
          file_format?: string | null
          file_path?: string | null
          filename?: string | null
          id?: string | null
          processed_rows?: number | null
          status?: Database["public"]["Enums"]["import_status_type"] | null
          success_count?: number | null
          total_rows?: number | null
        }
        Update: {
          created_at?: string | null
          error_count?: number | null
          file_format?: string | null
          file_path?: string | null
          filename?: string | null
          id?: string | null
          processed_rows?: number | null
          status?: Database["public"]["Enums"]["import_status_type"] | null
          success_count?: number | null
          total_rows?: number | null
        }
        Relationships: []
      }
      lead_summary: {
        Row: {
          agent_id: string | null
          agent_name: string | null
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
          phone: string | null
          status: string | null
          type: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loading_performance_summary: {
        Row: {
          avg_duration_ms: number | null
          component_path: string | null
          failed_loads: number | null
          max_duration_ms: number | null
          min_duration_ms: number | null
          successful_loads: number | null
          total_loads: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_import_processing_safe: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_invitation_rate_limit: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          user_email: string
          user_ip: string
        }
        Returns: boolean
      }
      cleanup_stalled_imports: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      commit_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_invitation: {
        Args: {
          _email: string
          _created_by: string
        }
        Returns: string
      }
      delete_previous_invitations: {
        Args: {
          input_email: string
        }
        Returns: undefined
      }
      delete_user_data: {
        Args: {
          input_user_id: string
        }
        Returns: undefined
      }
      execute_migration_safely: {
        Args: {
          migration_id: string
        }
        Returns: undefined
      }
      generate_agent_credentials: {
        Args: {
          agent_onboarding_id: string
        }
        Returns: string
      }
      get_candidate_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric_name: string
          metric_value: number
        }[]
      }
      get_import_status: {
        Args: {
          _import_id?: string
        }
        Returns: {
          id: string
          filename: string
          status: string
          created_at: string
          updated_at: string
          processed_rows: number
          total_rows: number
          success_count: number
          error_count: number
          file_path: string
          storage_path: string
          error_details: Json
          import_log: Json
        }[]
      }
      get_storage_config: {
        Args: {
          config_name: string
        }
        Returns: string
      }
      get_user_role: {
        Args: {
          user_id: string
        }
        Returns: string
      }
      handle_login_attempt: {
        Args: {
          user_email: string
          user_ip: string
          attempt_successful: boolean
        }
        Returns: undefined
      }
      handle_transaction_with_retry: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      has_full_authority: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      import_candidate_data: {
        Args: {
          _name: string
          _experience: string
          _license_status: string
          _specialty: string
          _email: string
          _phone: string
        }
        Returns: string
      }
      increment_agent_retry_count: {
        Args: {
          agent_id: string
          error_msg: string
        }
        Returns: undefined
      }
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      is_admin_check: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_owner: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      log_import_event: {
        Args: {
          p_import_id: string
          p_log_type: string
          p_message: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      map_candidate_headers: {
        Args: {
          raw_headers: string[]
          mapping_config: Json
        }
        Returns: Json
      }
      migrate_table_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_candidate_import: {
        Args: {
          import_id: string
          row_data: Json
          header_mapping: Json
        }
        Returns: undefined
      }
      resend_invitation: {
        Args: {
          invitation_id: string
        }
        Returns: boolean
      }
      rollback_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      safely_delete_user: {
        Args: {
          user_id_param: string
          deleted_by_param: string
        }
        Returns: undefined
      }
      start_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_invitation_deletion: {
        Args: {
          _email: string
        }
        Returns: {
          invitations_deleted: boolean
          onboarding_deleted: boolean
          tracking_deleted: boolean
          system_log_created: boolean
        }[]
      }
      update_lead_funnel_stage: {
        Args: {
          p_lead_id: string
          p_new_stage: Database["public"]["Enums"]["lead_funnel_stage"]
          p_notes?: string
        }
        Returns: undefined
      }
      validate_candidate_data: {
        Args: {
          data: Json
        }
        Returns: {
          is_valid: boolean
          errors: string[]
        }[]
      }
      validate_invitation: {
        Args: {
          _email: string
        }
        Returns: Json
      }
      validate_lead_import_data: {
        Args: {
          data: Json
        }
        Returns: {
          is_valid: boolean
          validation_errors: string[]
        }[]
      }
      validate_lead_import_row: {
        Args: {
          data: Json
          lead_type: string
        }
        Returns: {
          is_valid: boolean
          errors: string[]
        }[]
      }
    }
    Enums: {
      activity_priority: "low" | "medium" | "high" | "urgent"
      agent_distribution_status:
        | "active"
        | "paused"
        | "blocked"
        | "pending_review"
      app_role: "admin" | "user" | "owner"
      deletion_status: "pending" | "in_progress" | "completed" | "failed"
      import_source_type: "csv" | "feed" | "manual"
      import_status_type: "pending" | "processing" | "completed" | "failed"
      invitation_status: "pending" | "accepted" | "expired" | "revoked"
      lead_funnel_stage:
        | "cold"
        | "contacted"
        | "qualified"
        | "negotiating"
        | "closed_won"
        | "closed_lost"
      lead_import_status: "pending" | "processing" | "completed" | "failed"
      lead_status_enum:
        | "New"
        | "Contacted"
        | "Qualified"
        | "Negotiating"
        | "Closed"
        | "Lost"
      log_type: "system" | "user" | "error" | "warning" | "info"
      onboarding_status: "pending" | "approved" | "rejected" | "suspended"
      reset_status: "pending" | "completed" | "expired" | "failed"
      sales_stage:
        | "prospecting"
        | "qualifying"
        | "needs_analysis"
        | "presentation"
        | "proposal"
        | "negotiation"
        | "closed_won"
        | "closed_lost"
      sales_stage_type:
        | "prospecting"
        | "qualification"
        | "needs_analysis"
        | "proposal"
        | "negotiation"
        | "closed_won"
        | "closed_lost"
      tool_type:
        | "web_search"
        | "data_analysis"
        | "document_processing"
        | "lead_management"
        | "property_search"
      touchpoint_type:
        | "email"
        | "call"
        | "text"
        | "social_media"
        | "direct_mail"
        | "in_person"
        | "video_message"
        | "newsletter"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
