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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          new_value: string | null
          old_value: string | null
          target_id: string | null
          target_name: string | null
          target_type: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          new_value?: string | null
          old_value?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          new_value?: string | null
          old_value?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      briefing_modules: {
        Row: {
          briefing_id: string
          content: string | null
          created_at: string
          id: string
          level: number
          module_type: string | null
          parent_id: string | null
          position: number
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          briefing_id: string
          content?: string | null
          created_at?: string
          id?: string
          level?: number
          module_type?: string | null
          parent_id?: string | null
          position?: number
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          briefing_id?: string
          content?: string | null
          created_at?: string
          id?: string
          level?: number
          module_type?: string | null
          parent_id?: string | null
          position?: number
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefing_modules_briefing_id_fkey"
            columns: ["briefing_id"]
            isOneToOne: false
            referencedRelation: "project_briefings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefing_modules_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "briefing_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_alerts: {
        Row: {
          alert_type: string
          created_at: string
          current_percentage: number | null
          id: string
          is_read: boolean
          is_resolved: boolean
          message: string
          project_id: string
          resolved_at: string | null
          resolved_by: string | null
          threshold_percentage: number | null
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          current_percentage?: number | null
          id?: string
          is_read?: boolean
          is_resolved?: boolean
          message: string
          project_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          threshold_percentage?: number | null
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          current_percentage?: number | null
          id?: string
          is_read?: boolean
          is_resolved?: boolean
          message?: string
          project_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          threshold_percentage?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_entries: {
        Row: {
          actual_amount: number
          approved_at: string | null
          approved_by: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string
          entry_date: string
          id: string
          invoice_number: string | null
          notes: string | null
          phase_name: string | null
          planned_amount: number
          project_id: string
          status: string
          supplier: string | null
          task_id: string | null
          updated_at: string
        }
        Insert: {
          actual_amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          entry_date?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          phase_name?: string | null
          planned_amount?: number
          project_id: string
          status?: string
          supplier?: string | null
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          entry_date?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          phase_name?: string | null
          planned_amount?: number
          project_id?: string
          status?: string
          supplier?: string | null
          task_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cost_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_snapshots: {
        Row: {
          category_breakdown: Json | null
          created_at: string
          id: string
          notes: string | null
          period_type: string
          phase_breakdown: Json | null
          project_id: string
          snapshot_date: string
          total_actual: number
          total_planned: number
          variance: number
          variance_percentage: number
        }
        Insert: {
          category_breakdown?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          period_type?: string
          phase_breakdown?: Json | null
          project_id: string
          snapshot_date: string
          total_actual?: number
          total_planned?: number
          variance?: number
          variance_percentage?: number
        }
        Update: {
          category_breakdown?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          period_type?: string
          phase_breakdown?: Json | null
          project_id?: string
          snapshot_date?: string
          total_actual?: number
          total_planned?: number
          variance?: number
          variance_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      change_requests: {
        Row: {
          change_type: string | null
          created_at: string
          description: string | null
          id: string
          impact_budget: number | null
          impact_description: string | null
          impact_schedule: string | null
          impact_scope: string | null
          implemented_at: string | null
          justification: string | null
          priority: string | null
          project_id: string
          requested_by: string | null
          requested_by_name: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewed_by_name: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          change_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impact_budget?: number | null
          impact_description?: string | null
          impact_schedule?: string | null
          impact_scope?: string | null
          implemented_at?: string | null
          justification?: string | null
          priority?: string | null
          project_id: string
          requested_by?: string | null
          requested_by_name?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_name?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          change_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          impact_budget?: number | null
          impact_description?: string | null
          impact_schedule?: string | null
          impact_scope?: string | null
          implemented_at?: string | null
          justification?: string | null
          priority?: string | null
          project_id?: string
          requested_by?: string | null
          requested_by_name?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_name?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          amount: number | null
          contract_number: string | null
          contract_type: string
          created_at: string
          created_by: string | null
          currency: string | null
          deliverables: string | null
          description: string | null
          end_date: string | null
          id: string
          notes: string | null
          payment_terms: string | null
          penalties: string | null
          procurement_plan_id: string | null
          project_id: string
          signed_date: string | null
          start_date: string | null
          status: string
          supplier_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          contract_number?: string | null
          contract_type?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deliverables?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          penalties?: string | null
          procurement_plan_id?: string | null
          project_id: string
          signed_date?: string | null
          start_date?: string | null
          status?: string
          supplier_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          contract_number?: string | null
          contract_type?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deliverables?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          penalties?: string | null
          procurement_plan_id?: string | null
          project_id?: string
          signed_date?: string | null
          start_date?: string | null
          status?: string
          supplier_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_procurement_plan_id_fkey"
            columns: ["procurement_plan_id"]
            isOneToOne: false
            referencedRelation: "procurement_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
          user_initials: string | null
          user_name: string | null
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
          user_initials?: string | null
          user_name?: string | null
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
          user_initials?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string | null
          organization_id: string | null
          project_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name?: string | null
          organization_id?: string | null
          project_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string | null
          organization_id?: string | null
          project_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_categories: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cost_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      document_comments: {
        Row: {
          content: string
          created_at: string
          document_id: string
          id: string
          is_resolved: boolean
          parent_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          updated_at: string
          user_id: string | null
          user_name: string | null
          version_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          document_id: string
          id?: string
          is_resolved?: boolean
          parent_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
          version_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          document_id?: string
          id?: string
          is_resolved?: boolean
          parent_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_comments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      document_history: {
        Row: {
          action: string
          action_details: Json | null
          created_at: string
          document_id: string
          id: string
          ip_address: string | null
          performed_by: string | null
          performed_by_name: string | null
          version_id: string | null
        }
        Insert: {
          action: string
          action_details?: Json | null
          created_at?: string
          document_id: string
          id?: string
          ip_address?: string | null
          performed_by?: string | null
          performed_by_name?: string | null
          version_id?: string | null
        }
        Update: {
          action?: string
          action_details?: Json | null
          created_at?: string
          document_id?: string
          id?: string
          ip_address?: string | null
          performed_by?: string | null
          performed_by_name?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_history_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_history_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          change_summary: string | null
          created_at: string
          document_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          hash_sha256: string | null
          id: string
          uploaded_by: string | null
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          created_at?: string
          document_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          hash_sha256?: string | null
          id?: string
          uploaded_by?: string | null
          version_number: number
        }
        Update: {
          change_summary?: string | null
          created_at?: string
          document_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          hash_sha256?: string | null
          id?: string
          uploaded_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_workflows: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          document_id: string
          due_date: string | null
          id: string
          notes: string | null
          priority: string | null
          requested_by: string | null
          status: string
          updated_at: string
          version_id: string | null
          workflow_type: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          document_id: string
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
          version_id?: string | null
          workflow_type?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          document_id?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
          version_id?: string | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_workflows_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_workflows_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          created_by: string | null
          current_version: number
          description: string | null
          document_type: string
          id: string
          phase_name: string | null
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_version?: number
          description?: string | null
          document_type?: string
          id?: string
          phase_name?: string | null
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_version?: number
          description?: string | null
          document_type?: string
          id?: string
          phase_name?: string | null
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      funders: {
        Row: {
          acronym: string | null
          country: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          type: string | null
        }
        Insert: {
          acronym?: string | null
          country?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          type?: string | null
        }
        Update: {
          acronym?: string | null
          country?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: []
      }
      kpi_definitions: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          critical_threshold: number | null
          description: string | null
          direction: string
          frequency: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          project_id: string | null
          target_value: number | null
          unit: string | null
          updated_at: string
          warning_threshold: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          critical_threshold?: number | null
          description?: string | null
          direction?: string
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          project_id?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
          warning_threshold?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          critical_threshold?: number | null
          description?: string | null
          direction?: string
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          project_id?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
          warning_threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_definitions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_definitions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_measurements: {
        Row: {
          created_at: string
          id: string
          kpi_id: string
          measured_at: string
          measured_by: string | null
          notes: string | null
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          kpi_id: string
          measured_at?: string
          measured_by?: string | null
          notes?: string | null
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          kpi_id?: string
          measured_at?: string
          measured_by?: string | null
          notes?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_measurements_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons_learned: {
        Row: {
          author_id: string | null
          author_name: string | null
          created_at: string
          description: string | null
          id: string
          lesson_type: string
          project_id: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lesson_type?: string
          project_id: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lesson_type?: string
          project_id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_learned_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      logframe_indicators: {
        Row: {
          baseline_date: string | null
          baseline_value: number | null
          created_at: string
          current_value: number | null
          data_source: string | null
          description: string | null
          frequency: string | null
          id: string
          level_id: string
          name: string
          responsible: string | null
          target_date: string | null
          target_value: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          baseline_date?: string | null
          baseline_value?: number | null
          created_at?: string
          current_value?: number | null
          data_source?: string | null
          description?: string | null
          frequency?: string | null
          id?: string
          level_id: string
          name: string
          responsible?: string | null
          target_date?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          baseline_date?: string | null
          baseline_value?: number | null
          created_at?: string
          current_value?: number | null
          data_source?: string | null
          description?: string | null
          frequency?: string | null
          id?: string
          level_id?: string
          name?: string
          responsible?: string | null
          target_date?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "logframe_indicators_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "logframe_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      logframe_levels: {
        Row: {
          assumptions: string | null
          created_at: string
          created_by: string | null
          id: string
          level_type: string
          means_of_verification: string | null
          narrative: string
          parent_id: string | null
          position: number
          project_id: string
          updated_at: string
        }
        Insert: {
          assumptions?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          level_type: string
          means_of_verification?: string | null
          narrative: string
          parent_id?: string | null
          position?: number
          project_id: string
          updated_at?: string
        }
        Update: {
          assumptions?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          level_type?: string
          means_of_verification?: string | null
          narrative?: string
          parent_id?: string | null
          position?: number
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "logframe_levels_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "logframe_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logframe_levels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
          sender_initials: string | null
          sender_name: string | null
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
          sender_initials?: string | null
          sender_name?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_initials?: string | null
          sender_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          invited_by: string | null
          is_primary: boolean | null
          joined_at: string
          organization_id: string
          role: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          is_primary?: boolean | null
          joined_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          is_primary?: boolean | null
          joined_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_subscriptions: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          organization_id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          organization_id: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          organization_id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          country: string | null
          created_at: string
          created_by: string | null
          description: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          logo_url: string | null
          name: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
          province_id: string | null
          sector_id: string | null
          settings: Json | null
          size: Database["public"]["Enums"]["organization_size"] | null
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          province_id?: string | null
          sector_id?: string | null
          settings?: Json | null
          size?: Database["public"]["Enums"]["organization_size"] | null
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          province_id?: string | null
          sector_id?: string | null
          settings?: Json | null
          size?: Database["public"]["Enums"]["organization_size"] | null
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          created_at: string
          description: string | null
          id: string
          manager_id: string | null
          name: string
          organization_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
          organization_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          organization_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      procurement_plans: {
        Row: {
          actual_end_date: string | null
          actual_start_date: string | null
          category: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          estimated_amount: number | null
          funding_source: string | null
          id: string
          notes: string | null
          planned_end_date: string | null
          planned_start_date: string | null
          procurement_method: string
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          estimated_amount?: number | null
          funding_source?: string | null
          id?: string
          notes?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          procurement_method?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          estimated_amount?: number | null
          funding_source?: string | null
          id?: string
          notes?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          procurement_method?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procurement_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          manager_id: string | null
          name: string
          portfolio_id: string
          sector: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          manager_id?: string | null
          name: string
          portfolio_id: string
          sector?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          portfolio_id?: string
          sector?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      project_baselines: {
        Row: {
          baseline_date: string
          baseline_number: number
          budget_snapshot: Json | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          project_id: string
          schedule_snapshot: Json | null
          scope_snapshot: Json | null
        }
        Insert: {
          baseline_date?: string
          baseline_number?: number
          budget_snapshot?: Json | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          project_id: string
          schedule_snapshot?: Json | null
          scope_snapshot?: Json | null
        }
        Update: {
          baseline_date?: string
          baseline_number?: number
          budget_snapshot?: Json | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          project_id?: string
          schedule_snapshot?: Json | null
          scope_snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "project_baselines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_briefings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_briefings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_scrum_config: {
        Row: {
          created_at: string
          daily_standup_duration_minutes: number | null
          default_sprint_duration_days: number
          definition_of_done: string[] | null
          id: string
          project_id: string
          retrospective_duration_hours: number | null
          sprint_planning_duration_hours: number | null
          sprint_review_duration_hours: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_standup_duration_minutes?: number | null
          default_sprint_duration_days?: number
          definition_of_done?: string[] | null
          id?: string
          project_id: string
          retrospective_duration_hours?: number | null
          sprint_planning_duration_hours?: number | null
          sprint_review_duration_hours?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_standup_duration_minutes?: number | null
          default_sprint_duration_days?: number
          definition_of_done?: string[] | null
          id?: string
          project_id?: string
          retrospective_duration_hours?: number | null
          sprint_planning_duration_hours?: number | null
          sprint_review_duration_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_scrum_config_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_scrum_roles: {
        Row: {
          created_at: string
          id: string
          project_id: string
          scrum_role: Database["public"]["Enums"]["scrum_role"]
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          scrum_role: Database["public"]["Enums"]["scrum_role"]
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          scrum_role?: Database["public"]["Enums"]["scrum_role"]
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_scrum_roles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_sdgs: {
        Row: {
          created_at: string
          id: string
          project_id: string
          sdg_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          sdg_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          sdg_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_sdgs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_sdgs_sdg_id_fkey"
            columns: ["sdg_id"]
            isOneToOne: false
            referencedRelation: "sdgs"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          sector_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          sector_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          sector_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_templates_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          client: string | null
          created_at: string
          description: string | null
          end_date: string | null
          funder_id: string | null
          id: string
          methodology: Database["public"]["Enums"]["project_methodology"]
          name: string
          organization_id: string | null
          program_id: string | null
          progress: number
          province_id: string | null
          sector_id: string | null
          spent: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          template_id: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          client?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          funder_id?: string | null
          id?: string
          methodology?: Database["public"]["Enums"]["project_methodology"]
          name: string
          organization_id?: string | null
          program_id?: string | null
          progress?: number
          province_id?: string | null
          sector_id?: string | null
          spent?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          client?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          funder_id?: string | null
          id?: string
          methodology?: Database["public"]["Enums"]["project_methodology"]
          name?: string
          organization_id?: string | null
          program_id?: string | null
          progress?: number
          province_id?: string | null
          sector_id?: string | null
          spent?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "funders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "project_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      provinces: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          region: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          region?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          region?: string | null
        }
        Relationships: []
      }
      retrospective_actions: {
        Row: {
          assignee_id: string | null
          assignee_name: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          retrospective_id: string
          status: string
        }
        Insert: {
          assignee_id?: string | null
          assignee_name?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          retrospective_id: string
          status?: string
        }
        Update: {
          assignee_id?: string | null
          assignee_name?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          retrospective_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "retrospective_actions_retrospective_id_fkey"
            columns: ["retrospective_id"]
            isOneToOne: false
            referencedRelation: "sprint_retrospectives"
            referencedColumns: ["id"]
          },
        ]
      }
      retrospective_feedback: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          retrospective_id: string
          satisfaction_rating: number | null
          user_id: string
          user_name: string | null
          velocity_rating: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          retrospective_id: string
          satisfaction_rating?: number | null
          user_id: string
          user_name?: string | null
          velocity_rating?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          retrospective_id?: string
          satisfaction_rating?: number | null
          user_id?: string
          user_name?: string | null
          velocity_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "retrospective_feedback_retrospective_id_fkey"
            columns: ["retrospective_id"]
            isOneToOne: false
            referencedRelation: "sprint_retrospectives"
            referencedColumns: ["id"]
          },
        ]
      }
      retrospective_items: {
        Row: {
          author_id: string | null
          author_name: string | null
          category: string
          content: string
          created_at: string
          id: string
          retrospective_id: string
          votes_count: number | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          category: string
          content: string
          created_at?: string
          id?: string
          retrospective_id: string
          votes_count?: number | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          category?: string
          content?: string
          created_at?: string
          id?: string
          retrospective_id?: string
          votes_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "retrospective_items_retrospective_id_fkey"
            columns: ["retrospective_id"]
            isOneToOne: false
            referencedRelation: "sprint_retrospectives"
            referencedColumns: ["id"]
          },
        ]
      }
      retrospective_votes: {
        Row: {
          created_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retrospective_votes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "retrospective_items"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          category: string | null
          contingency: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          impact: string
          mitigation: string | null
          owner_id: string | null
          owner_name: string | null
          probability: string
          project_id: string
          status: string
          title: string
          trigger_conditions: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          contingency?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          impact?: string
          mitigation?: string | null
          owner_id?: string | null
          owner_name?: string | null
          probability?: string
          project_id: string
          status?: string
          title: string
          trigger_conditions?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          contingency?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          impact?: string
          mitigation?: string | null
          owner_id?: string | null
          owner_name?: string | null
          probability?: string
          project_id?: string
          status?: string
          title?: string
          trigger_conditions?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      sdgs: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          number: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          number: number
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          number?: number
        }
        Relationships: []
      }
      sectors: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      sprint_retrospectives: {
        Row: {
          completed_at: string | null
          created_at: string
          facilitator_id: string | null
          facilitator_name: string | null
          id: string
          project_id: string
          sprint_id: string
          status: string
          summary: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          facilitator_id?: string | null
          facilitator_name?: string | null
          id?: string
          project_id: string
          sprint_id: string
          status?: string
          summary?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          facilitator_id?: string | null
          facilitator_name?: string | null
          id?: string
          project_id?: string
          sprint_id?: string
          status?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sprint_retrospectives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sprint_retrospectives_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string
          goal: string | null
          id: string
          name: string
          project_id: string
          start_date: string
          status: string
          updated_at: string
          velocity: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date: string
          goal?: string | null
          id?: string
          name: string
          project_id: string
          start_date: string
          status?: string
          updated_at?: string
          velocity?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string
          goal?: string | null
          id?: string
          name?: string
          project_id?: string
          start_date?: string
          status?: string
          updated_at?: string
          velocity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sprints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      stakeholders: {
        Row: {
          category: string | null
          communication_frequency: string | null
          created_at: string
          created_by: string | null
          email: string | null
          engagement_strategy: string | null
          id: string
          influence: number | null
          interest: number | null
          name: string
          notes: string | null
          organization_id: string | null
          organization_name: string | null
          phone: string | null
          project_id: string
          role: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          communication_frequency?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          engagement_strategy?: string | null
          id?: string
          influence?: number | null
          interest?: number | null
          name: string
          notes?: string | null
          organization_id?: string | null
          organization_name?: string | null
          phone?: string | null
          project_id: string
          role?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          communication_frequency?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          engagement_strategy?: string | null
          id?: string
          influence?: number | null
          interest?: number | null
          name?: string
          notes?: string | null
          organization_id?: string | null
          organization_name?: string | null
          phone?: string | null
          project_id?: string
          role?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stakeholders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakeholders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          max_members: number
          max_portfolios: number
          max_projects: number
          max_storage_gb: number
          name: string
          price_monthly: number
          price_yearly: number
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_members?: number
          max_portfolios?: number
          max_projects?: number
          max_storage_gb?: number
          name: string
          price_monthly?: number
          price_yearly?: number
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_members?: number
          max_portfolios?: number
          max_projects?: number
          max_storage_gb?: number
          name?: string
          price_monthly?: number
          price_yearly?: number
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          position: number
          task_id: string
          title: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          position?: number
          task_id: string
          title: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          position?: number
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          category: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          organization_id: string | null
          rating: number | null
          status: string
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          organization_id?: string | null
          rating?: number | null
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string | null
          rating?: number | null
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          dependency_type: Database["public"]["Enums"]["dependency_type"]
          id: string
          lag_days: number
          predecessor_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          dependency_type?: Database["public"]["Enums"]["dependency_type"]
          id?: string
          lag_days?: number
          predecessor_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          dependency_type?: Database["public"]["Enums"]["dependency_type"]
          id?: string
          lag_days?: number
          predecessor_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_predecessor_id_fkey"
            columns: ["predecessor_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_initials: string | null
          assignee_name: string | null
          attachments_count: number | null
          column_id: string
          comments_count: number | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          item_type: string
          labels: string[] | null
          parent_id: string | null
          phase_name: string | null
          position: number
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string
          sprint_id: string | null
          story_points: number | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_initials?: string | null
          assignee_name?: string | null
          attachments_count?: number | null
          column_id?: string
          comments_count?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          item_type?: string
          labels?: string[] | null
          parent_id?: string | null
          phase_name?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id: string
          sprint_id?: string | null
          story_points?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_initials?: string | null
          assignee_name?: string | null
          attachments_count?: number | null
          column_id?: string
          comments_count?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          item_type?: string
          labels?: string[] | null
          parent_id?: string | null
          phase_name?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string
          sprint_id?: string | null
          story_points?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          id: string
          initials: string
          name: string
          organization_id: string | null
          phone: string | null
          project_id: string
          role: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          initials: string
          name: string
          organization_id?: string | null
          phone?: string | null
          project_id: string
          role?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          initials?: string
          name?: string
          organization_id?: string | null
          phone?: string | null
          project_id?: string
          role?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      template_deliverables: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_mandatory: boolean | null
          name: string
          phase_id: string
          position: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          name: string
          phase_id: string
          position?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          name?: string
          phase_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_deliverables_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "template_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      template_documents: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          phase_id: string | null
          template_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          phase_id?: string | null
          template_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          phase_id?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_documents_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "template_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "project_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_phases: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number | null
          id: string
          name: string
          position: number
          template_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          name: string
          position?: number
          template_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          name?: string
          position?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_phases_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "project_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permission_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          granted: boolean
          id: string
          permission_id: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          granted?: boolean
          id?: string
          permission_id: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          granted?: boolean
          id?: string
          permission_id?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permission_overrides_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permission_overrides_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_task_start: { Args: { p_task_id: string }; Returns: boolean }
      check_circular_dependency: {
        Args: { p_predecessor_id: string; p_task_id: string }
        Returns: boolean
      }
      check_org_quota: {
        Args: { _org_id: string; _resource_type: string }
        Returns: Json
      }
      get_user_org_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: {
          category: string
          granted: boolean
          permission_name: string
        }[]
      }
      get_user_primary_organization: {
        Args: { _user_id: string }
        Returns: string
      }
      get_user_project_org_ids: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_permission: {
        Args: { _permission: string; _project_id?: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      user_needs_onboarding: { Args: { _user_id: string }; Returns: boolean }
      validate_plan_downgrade: {
        Args: { _new_plan_id: string; _org_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "manager"
        | "member"
        | "portfolio_manager"
        | "project_manager"
        | "observer"
      dependency_type: "FS" | "SS" | "FF" | "SF"
      entity_type: "public" | "private" | "ngo"
      org_member_role: "owner" | "admin" | "manager" | "member" | "viewer"
      organization_size: "small" | "medium" | "large" | "enterprise"
      project_methodology: "waterfall" | "scrum" | "kanban" | "hybrid"
      project_status: "active" | "delayed" | "completed" | "on_hold"
      scrum_role: "product_owner" | "scrum_master" | "dev_team"
      subscription_status:
        | "trial"
        | "active"
        | "past_due"
        | "cancelled"
        | "expired"
      task_priority: "low" | "medium" | "high"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "manager",
        "member",
        "portfolio_manager",
        "project_manager",
        "observer",
      ],
      dependency_type: ["FS", "SS", "FF", "SF"],
      entity_type: ["public", "private", "ngo"],
      org_member_role: ["owner", "admin", "manager", "member", "viewer"],
      organization_size: ["small", "medium", "large", "enterprise"],
      project_methodology: ["waterfall", "scrum", "kanban", "hybrid"],
      project_status: ["active", "delayed", "completed", "on_hold"],
      scrum_role: ["product_owner", "scrum_master", "dev_team"],
      subscription_status: [
        "trial",
        "active",
        "past_due",
        "cancelled",
        "expired",
      ],
      task_priority: ["low", "medium", "high"],
    },
  },
} as const
