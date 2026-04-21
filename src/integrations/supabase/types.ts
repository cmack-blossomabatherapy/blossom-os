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
      client_authorizations: {
        Row: {
          approved_date: string | null
          client_id: string
          created_at: string
          expiration_date: string | null
          hours: string | null
          id: string
          kind: Database["public"]["Enums"]["auth_kind"]
          notes: string | null
          status: Database["public"]["Enums"]["auth_status"]
          submitted_date: string | null
          updated_at: string
        }
        Insert: {
          approved_date?: string | null
          client_id: string
          created_at?: string
          expiration_date?: string | null
          hours?: string | null
          id?: string
          kind: Database["public"]["Enums"]["auth_kind"]
          notes?: string | null
          status?: Database["public"]["Enums"]["auth_status"]
          submitted_date?: string | null
          updated_at?: string
        }
        Update: {
          approved_date?: string | null
          client_id?: string
          created_at?: string
          expiration_date?: string | null
          hours?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["auth_kind"]
          notes?: string | null
          status?: Database["public"]["Enums"]["auth_status"]
          submitted_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_authorizations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          client_id: string
          created_at: string
          id: string
          name: string
          storage_path: string | null
          type: string
          uploaded_by: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          name: string
          storage_path?: string | null
          type?: string
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          name?: string
          storage_path?: string | null
          type?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_schedule_slots: {
        Row: {
          client_id: string
          created_at: string
          day: Database["public"]["Enums"]["schedule_day"]
          end_time: string
          id: string
          rbt: string | null
          start_time: string
        }
        Insert: {
          client_id: string
          created_at?: string
          day: Database["public"]["Enums"]["schedule_day"]
          end_time: string
          id?: string
          rbt?: string | null
          start_time: string
        }
        Update: {
          client_id?: string
          created_at?: string
          day?: Database["public"]["Enums"]["schedule_day"]
          end_time?: string
          id?: string
          rbt?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_schedule_slots_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tasks: {
        Row: {
          client_id: string
          completed: boolean
          created_at: string
          due_date: string | null
          id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          completed?: boolean
          created_at?: string
          due_date?: string | null
          id?: string
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed?: boolean
          created_at?: string
          due_date?: string | null
          id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_timeline: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          description: string
          event_type: Database["public"]["Enums"]["timeline_event_type"]
          id: string
          user_name: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          description: string
          event_type?: Database["public"]["Enums"]["timeline_event_type"]
          id?: string
          user_name?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          event_type?: Database["public"]["Enums"]["timeline_event_type"]
          id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_timeline_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          assessment_date: string | null
          auth_status: Database["public"]["Enums"]["auth_status"]
          automation_log: string[]
          bcba: string | null
          blockers: string[]
          child_age: string | null
          child_name: string
          clinic: string
          created_at: string
          created_by: string | null
          id: string
          intake_owner: string | null
          next_action: string | null
          next_task_due: string | null
          parent_name: string
          payor: string
          qa_status: Database["public"]["Enums"]["qa_status"]
          rbt: string | null
          staffing_history: Json
          staffing_status: Database["public"]["Enums"]["staffing_status"]
          stage: Database["public"]["Enums"]["client_stage"]
          stage_entered_at: string
          start_date: string | null
          state: string
          updated_at: string
          vob_completed_at: string | null
        }
        Insert: {
          assessment_date?: string | null
          auth_status?: Database["public"]["Enums"]["auth_status"]
          automation_log?: string[]
          bcba?: string | null
          blockers?: string[]
          child_age?: string | null
          child_name: string
          clinic: string
          created_at?: string
          created_by?: string | null
          id?: string
          intake_owner?: string | null
          next_action?: string | null
          next_task_due?: string | null
          parent_name: string
          payor?: string
          qa_status?: Database["public"]["Enums"]["qa_status"]
          rbt?: string | null
          staffing_history?: Json
          staffing_status?: Database["public"]["Enums"]["staffing_status"]
          stage?: Database["public"]["Enums"]["client_stage"]
          stage_entered_at?: string
          start_date?: string | null
          state: string
          updated_at?: string
          vob_completed_at?: string | null
        }
        Update: {
          assessment_date?: string | null
          auth_status?: Database["public"]["Enums"]["auth_status"]
          automation_log?: string[]
          bcba?: string | null
          blockers?: string[]
          child_age?: string | null
          child_name?: string
          clinic?: string
          created_at?: string
          created_by?: string | null
          id?: string
          intake_owner?: string | null
          next_action?: string | null
          next_task_due?: string | null
          parent_name?: string
          payor?: string
          qa_status?: Database["public"]["Enums"]["qa_status"]
          rbt?: string | null
          staffing_history?: Json
          staffing_status?: Database["public"]["Enums"]["staffing_status"]
          stage?: Database["public"]["Enums"]["client_stage"]
          stage_entered_at?: string
          start_date?: string | null
          state?: string
          updated_at?: string
          vob_completed_at?: string | null
        }
        Relationships: []
      }
      employee_cases: {
        Row: {
          case_type: Database["public"]["Enums"]["hr_case_type"]
          closed_at: string | null
          created_at: string
          due_date: string | null
          employee_id: string
          id: string
          opened_at: string
          opened_by: string | null
          owner_role: string | null
          owner_user_id: string | null
          priority: Database["public"]["Enums"]["hr_case_priority"]
          resolution: string | null
          status: Database["public"]["Enums"]["hr_case_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          case_type: Database["public"]["Enums"]["hr_case_type"]
          closed_at?: string | null
          created_at?: string
          due_date?: string | null
          employee_id: string
          id?: string
          opened_at?: string
          opened_by?: string | null
          owner_role?: string | null
          owner_user_id?: string | null
          priority?: Database["public"]["Enums"]["hr_case_priority"]
          resolution?: string | null
          status?: Database["public"]["Enums"]["hr_case_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          case_type?: Database["public"]["Enums"]["hr_case_type"]
          closed_at?: string | null
          created_at?: string
          due_date?: string | null
          employee_id?: string
          id?: string
          opened_at?: string
          opened_by?: string | null
          owner_role?: string | null
          owner_user_id?: string | null
          priority?: Database["public"]["Enums"]["hr_case_priority"]
          resolution?: string | null
          status?: Database["public"]["Enums"]["hr_case_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_cases_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents_hr: {
        Row: {
          created_at: string
          doc_type: string
          employee_id: string
          expires_on: string | null
          id: string
          name: string
          notes: string | null
          required: boolean
          status: Database["public"]["Enums"]["hr_doc_status"]
          storage_path: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          doc_type: string
          employee_id: string
          expires_on?: string | null
          id?: string
          name: string
          notes?: string | null
          required?: boolean
          status?: Database["public"]["Enums"]["hr_doc_status"]
          storage_path?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          doc_type?: string
          employee_id?: string
          expires_on?: string | null
          id?: string
          name?: string
          notes?: string | null
          required?: boolean
          status?: Database["public"]["Enums"]["hr_doc_status"]
          storage_path?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_hr_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_notes: {
        Row: {
          author_id: string | null
          author_name: string | null
          body: string
          created_at: string
          employee_id: string
          id: string
          visibility: Database["public"]["Enums"]["hr_note_visibility"]
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          body: string
          created_at?: string
          employee_id: string
          id?: string
          visibility?: Database["public"]["Enums"]["hr_note_visibility"]
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          body?: string
          created_at?: string
          employee_id?: string
          id?: string
          visibility?: Database["public"]["Enums"]["hr_note_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "employee_notes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_onboarding: {
        Row: {
          blockers: string[]
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          stage_entered_at: string
          status: Database["public"]["Enums"]["hr_onboarding_status"]
          template_id: string | null
          updated_at: string
        }
        Insert: {
          blockers?: string[]
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          stage_entered_at?: string
          status?: Database["public"]["Enums"]["hr_onboarding_status"]
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          blockers?: string[]
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          stage_entered_at?: string
          status?: Database["public"]["Enums"]["hr_onboarding_status"]
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_onboarding_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_onboarding_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_onboarding_tasks: {
        Row: {
          category: string
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_required: boolean
          notes: string | null
          onboarding_id: string
          owner_role: string | null
          owner_user_id: string | null
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_required?: boolean
          notes?: string | null
          onboarding_id: string
          owner_role?: string | null
          owner_user_id?: string | null
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_required?: boolean
          notes?: string | null
          onboarding_id?: string
          owner_role?: string | null
          owner_user_id?: string | null
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_onboarding_tasks_onboarding_id_fkey"
            columns: ["onboarding_id"]
            isOneToOne: false
            referencedRelation: "employee_onboarding"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_relationships: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          kind: Database["public"]["Enums"]["hr_relationship_kind"]
          related_employee_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          kind: Database["public"]["Enums"]["hr_relationship_kind"]
          related_employee_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["hr_relationship_kind"]
          related_employee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_relationships_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_relationships_related_employee_id_fkey"
            columns: ["related_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_timeline: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_name: string | null
          description: string
          employee_id: string
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          description: string
          employee_id: string
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          description?: string
          employee_id?: string
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_timeline_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          avatar_url: string | null
          clinic: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          email: string | null
          employee_code: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          first_name: string
          hire_date: string | null
          id: string
          job_title: string
          kiosk_enabled: boolean
          kiosk_pin: string | null
          last_name: string
          last_review_date: string | null
          next_review_date: string | null
          notes: string | null
          pay_rate: number | null
          pay_type: Database["public"]["Enums"]["pay_type"]
          phone: string | null
          preferred_name: string | null
          resource_hub_access: boolean
          start_date: string | null
          state: string
          status: Database["public"]["Enums"]["employee_status"]
          termination_date: string | null
          updated_at: string
          user_id: string | null
          viventium_employee_id: string | null
          viventium_last_sync: string | null
          viventium_sync_status: string | null
          work_setting: Database["public"]["Enums"]["work_setting"]
        }
        Insert: {
          avatar_url?: string | null
          clinic?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          email?: string | null
          employee_code?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          first_name: string
          hire_date?: string | null
          id?: string
          job_title: string
          kiosk_enabled?: boolean
          kiosk_pin?: string | null
          last_name: string
          last_review_date?: string | null
          next_review_date?: string | null
          notes?: string | null
          pay_rate?: number | null
          pay_type?: Database["public"]["Enums"]["pay_type"]
          phone?: string | null
          preferred_name?: string | null
          resource_hub_access?: boolean
          start_date?: string | null
          state: string
          status?: Database["public"]["Enums"]["employee_status"]
          termination_date?: string | null
          updated_at?: string
          user_id?: string | null
          viventium_employee_id?: string | null
          viventium_last_sync?: string | null
          viventium_sync_status?: string | null
          work_setting?: Database["public"]["Enums"]["work_setting"]
        }
        Update: {
          avatar_url?: string | null
          clinic?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          email?: string | null
          employee_code?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          first_name?: string
          hire_date?: string | null
          id?: string
          job_title?: string
          kiosk_enabled?: boolean
          kiosk_pin?: string | null
          last_name?: string
          last_review_date?: string | null
          next_review_date?: string | null
          notes?: string | null
          pay_rate?: number | null
          pay_type?: Database["public"]["Enums"]["pay_type"]
          phone?: string | null
          preferred_name?: string | null
          resource_hub_access?: boolean
          start_date?: string | null
          state?: string
          status?: Database["public"]["Enums"]["employee_status"]
          termination_date?: string | null
          updated_at?: string
          user_id?: string | null
          viventium_employee_id?: string | null
          viventium_last_sync?: string | null
          viventium_sync_status?: string | null
          work_setting?: Database["public"]["Enums"]["work_setting"]
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_audit_logs: {
        Row: {
          action: string
          actor_name: string | null
          actor_user_id: string | null
          created_at: string
          diff: Json | null
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_name?: string | null
          actor_user_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_name?: string | null
          actor_user_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      hr_departments: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      onboarding_template_tasks: {
        Row: {
          category: string
          created_at: string
          default_owner_role: string | null
          description: string | null
          due_offset_days: number | null
          id: string
          is_required: boolean
          position: number
          template_id: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          default_owner_role?: string | null
          description?: string | null
          due_offset_days?: number | null
          id?: string
          is_required?: boolean
          position?: number
          template_id: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          default_owner_role?: string | null
          description?: string | null
          due_offset_days?: number | null
          id?: string
          is_required?: boolean
          position?: number
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_template_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          role_target: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          role_target: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          role_target?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          key: string
          label: string
          module: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          label: string
          module: string
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          label?: string
          module?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          must_change_password: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          must_change_password?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          must_change_password?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_key?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
        ]
      }
      stage_ownership: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          stage_kind: string
          stage_value: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          stage_kind: string
          stage_value: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          stage_kind?: string
          stage_value?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit: { Args: { _user_id: string }; Returns: boolean }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_permission: {
        Args: { _perm: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_stage: {
        Args: { _stage_kind: string; _stage_value: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "staff"
        | "viewer"
        | "exec"
        | "ops_manager"
        | "intake"
        | "auth_team"
        | "qa"
        | "scheduling"
        | "staffing"
        | "clinic"
        | "finance"
        | "hr"
        | "phone_support"
        | "hr_admin"
        | "hr_manager"
        | "recruiting_assistant"
        | "payroll_admin"
        | "state_director"
        | "clinic_director"
        | "dept_manager"
      auth_kind: "Initial" | "Treatment"
      auth_status:
        | "Not Submitted"
        | "Submitted"
        | "Approved"
        | "Denied"
        | "Expired"
      client_stage:
        | "BCBA Assignment"
        | "Pending Initial Auth"
        | "Waiting on Consent Forms"
        | "Schedule Assessment"
        | "Assessment Scheduled"
        | "In QA"
        | "Pending Treatment Auth"
        | "Staffing Needed"
        | "Restaffing Needed"
        | "Pending Start Date"
        | "Active"
        | "Flaked"
        | "Discharged"
        | "Services on Pause"
      employee_status:
        | "pending_start"
        | "active"
        | "on_leave"
        | "on_hold"
        | "terminated"
        | "resigned"
      employment_type: "full_time" | "part_time" | "contractor" | "prn"
      hr_case_priority: "low" | "medium" | "high" | "urgent"
      hr_case_status:
        | "new"
        | "open"
        | "waiting_employee"
        | "waiting_manager"
        | "waiting_payroll"
        | "waiting_hr"
        | "resolved"
        | "closed"
      hr_case_type:
        | "payroll_issue"
        | "attendance_issue"
        | "benefit_question"
        | "hr_question"
        | "onboarding_blocker"
        | "training_issue"
        | "manager_escalation"
        | "documentation_needed"
        | "access_issue"
        | "policy_acknowledgment"
        | "disciplinary_concern"
        | "offboarding_case"
      hr_doc_status:
        | "missing"
        | "requested"
        | "uploaded"
        | "verified"
        | "expired"
      hr_note_visibility: "hr_only" | "managers" | "restricted"
      hr_onboarding_status:
        | "new_hire_pending"
        | "documents_needed"
        | "payroll_setup"
        | "training_assigned"
        | "systems_setup"
        | "manager_assignment"
        | "ready_for_start"
        | "active"
        | "on_hold"
        | "incomplete"
      hr_relationship_kind:
        | "direct_manager"
        | "dotted_line_manager"
        | "state_director"
        | "department_owner"
        | "clinic_leader"
        | "onboarding_owner"
        | "operational_owner"
      pay_type: "hourly" | "salaried"
      qa_status: "Not Started" | "In Review" | "Complete"
      schedule_day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
      staffing_status: "Not Needed" | "Needed" | "In Progress" | "Assigned"
      timeline_event_type:
        | "system"
        | "auth"
        | "staffing"
        | "schedule"
        | "qa"
        | "note"
        | "stage"
      work_setting: "clinic" | "home" | "hybrid" | "admin" | "field"
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
        "staff",
        "viewer",
        "exec",
        "ops_manager",
        "intake",
        "auth_team",
        "qa",
        "scheduling",
        "staffing",
        "clinic",
        "finance",
        "hr",
        "phone_support",
        "hr_admin",
        "hr_manager",
        "recruiting_assistant",
        "payroll_admin",
        "state_director",
        "clinic_director",
        "dept_manager",
      ],
      auth_kind: ["Initial", "Treatment"],
      auth_status: [
        "Not Submitted",
        "Submitted",
        "Approved",
        "Denied",
        "Expired",
      ],
      client_stage: [
        "BCBA Assignment",
        "Pending Initial Auth",
        "Waiting on Consent Forms",
        "Schedule Assessment",
        "Assessment Scheduled",
        "In QA",
        "Pending Treatment Auth",
        "Staffing Needed",
        "Restaffing Needed",
        "Pending Start Date",
        "Active",
        "Flaked",
        "Discharged",
        "Services on Pause",
      ],
      employee_status: [
        "pending_start",
        "active",
        "on_leave",
        "on_hold",
        "terminated",
        "resigned",
      ],
      employment_type: ["full_time", "part_time", "contractor", "prn"],
      hr_case_priority: ["low", "medium", "high", "urgent"],
      hr_case_status: [
        "new",
        "open",
        "waiting_employee",
        "waiting_manager",
        "waiting_payroll",
        "waiting_hr",
        "resolved",
        "closed",
      ],
      hr_case_type: [
        "payroll_issue",
        "attendance_issue",
        "benefit_question",
        "hr_question",
        "onboarding_blocker",
        "training_issue",
        "manager_escalation",
        "documentation_needed",
        "access_issue",
        "policy_acknowledgment",
        "disciplinary_concern",
        "offboarding_case",
      ],
      hr_doc_status: [
        "missing",
        "requested",
        "uploaded",
        "verified",
        "expired",
      ],
      hr_note_visibility: ["hr_only", "managers", "restricted"],
      hr_onboarding_status: [
        "new_hire_pending",
        "documents_needed",
        "payroll_setup",
        "training_assigned",
        "systems_setup",
        "manager_assignment",
        "ready_for_start",
        "active",
        "on_hold",
        "incomplete",
      ],
      hr_relationship_kind: [
        "direct_manager",
        "dotted_line_manager",
        "state_director",
        "department_owner",
        "clinic_leader",
        "onboarding_owner",
        "operational_owner",
      ],
      pay_type: ["hourly", "salaried"],
      qa_status: ["Not Started", "In Review", "Complete"],
      schedule_day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      staffing_status: ["Not Needed", "Needed", "In Progress", "Assigned"],
      timeline_event_type: [
        "system",
        "auth",
        "staffing",
        "schedule",
        "qa",
        "note",
        "stage",
      ],
      work_setting: ["clinic", "home", "hybrid", "admin", "field"],
    },
  },
} as const
