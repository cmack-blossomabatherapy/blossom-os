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
      academy_audit_log: {
        Row: {
          bypass: boolean | null
          complete: boolean | null
          created_at: string
          details: Json
          employee_id: string | null
          enrollment_id: string | null
          event_type: string
          id: string
          route: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          bypass?: boolean | null
          complete?: boolean | null
          created_at?: string
          details?: Json
          employee_id?: string | null
          enrollment_id?: string | null
          event_type: string
          id?: string
          route?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          bypass?: boolean | null
          complete?: boolean | null
          created_at?: string
          details?: Json
          employee_id?: string | null
          enrollment_id?: string | null
          event_type?: string
          id?: string
          route?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      academy_checkins: {
        Row: {
          action_items: string | null
          agenda: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          enrollment_id: string
          id: string
          leader_rating: number | null
          meeting_date: string
          module_id: string | null
          notes: string | null
          with_employee_id: string | null
          with_name: string | null
        }
        Insert: {
          action_items?: string | null
          agenda?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          enrollment_id: string
          id?: string
          leader_rating?: number | null
          meeting_date?: string
          module_id?: string | null
          notes?: string | null
          with_employee_id?: string | null
          with_name?: string | null
        }
        Update: {
          action_items?: string | null
          agenda?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          enrollment_id?: string
          id?: string
          leader_rating?: number | null
          meeting_date?: string
          module_id?: string | null
          notes?: string | null
          with_employee_id?: string | null
          with_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_checkins_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "academy_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_checkins_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_checkins_with_employee_id_fkey"
            columns: ["with_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_enrollment_audit: {
        Row: {
          action: string
          actor_email: string | null
          actor_name: string | null
          actor_user_id: string | null
          created_at: string
          details: Json
          employee_id: string
          employee_name: string | null
          enrollment_id: string | null
          id: string
          track_id: string | null
          track_name: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_name?: string | null
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          employee_id: string
          employee_name?: string | null
          enrollment_id?: string | null
          id?: string
          track_id?: string | null
          track_name?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_name?: string | null
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          employee_id?: string
          employee_name?: string | null
          enrollment_id?: string | null
          id?: string
          track_id?: string | null
          track_name?: string | null
        }
        Relationships: []
      }
      academy_enrollments: {
        Row: {
          assigned_state: string | null
          created_at: string
          current_week_id: string | null
          employee_id: string
          id: string
          mentor_employee_id: string | null
          notes: string | null
          path: Database["public"]["Enums"]["academy_path"]
          start_date: string
          status: Database["public"]["Enums"]["academy_enrollment_status"]
          track_id: string
          updated_at: string
        }
        Insert: {
          assigned_state?: string | null
          created_at?: string
          current_week_id?: string | null
          employee_id: string
          id?: string
          mentor_employee_id?: string | null
          notes?: string | null
          path?: Database["public"]["Enums"]["academy_path"]
          start_date?: string
          status?: Database["public"]["Enums"]["academy_enrollment_status"]
          track_id: string
          updated_at?: string
        }
        Update: {
          assigned_state?: string | null
          created_at?: string
          current_week_id?: string | null
          employee_id?: string
          id?: string
          mentor_employee_id?: string | null
          notes?: string | null
          path?: Database["public"]["Enums"]["academy_path"]
          start_date?: string
          status?: Database["public"]["Enums"]["academy_enrollment_status"]
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_enrollments_current_week_id_fkey"
            columns: ["current_week_id"]
            isOneToOne: false
            referencedRelation: "academy_weeks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_enrollments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_enrollments_mentor_employee_id_fkey"
            columns: ["mentor_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_enrollments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "academy_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_module_resources: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          is_archived: boolean
          is_pinned: boolean
          kind: string
          label: string
          module_id: string
          pinned_at: string | null
          url: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          kind?: string
          label: string
          module_id: string
          pinned_at?: string | null
          url?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          kind?: string
          label?: string
          module_id?: string
          pinned_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_module_resources_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_modules: {
        Row: {
          applies_to: Database["public"]["Enums"]["academy_path"]
          applies_to_new_state_only: boolean
          archived_at: string | null
          created_at: string
          department: string | null
          description: string | null
          duration_label: string | null
          id: string
          is_archived: boolean
          is_pinned: boolean
          is_required: boolean
          leader_name: string | null
          module_type: Database["public"]["Enums"]["academy_module_type"]
          pinned_at: string | null
          position: number
          quiz: Json | null
          title: string
          week_id: string
        }
        Insert: {
          applies_to?: Database["public"]["Enums"]["academy_path"]
          applies_to_new_state_only?: boolean
          archived_at?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          duration_label?: string | null
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          is_required?: boolean
          leader_name?: string | null
          module_type: Database["public"]["Enums"]["academy_module_type"]
          pinned_at?: string | null
          position?: number
          quiz?: Json | null
          title: string
          week_id: string
        }
        Update: {
          applies_to?: Database["public"]["Enums"]["academy_path"]
          applies_to_new_state_only?: boolean
          archived_at?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          duration_label?: string | null
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          is_required?: boolean
          leader_name?: string | null
          module_type?: Database["public"]["Enums"]["academy_module_type"]
          pinned_at?: string | null
          position?: number
          quiz?: Json | null
          title?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_modules_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "academy_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_phases: {
        Row: {
          archived_at: string | null
          color_token: string
          created_at: string
          id: string
          is_archived: boolean
          is_pinned: boolean
          name: string
          pinned_at: string | null
          position: number
          tagline: string | null
          track_id: string
        }
        Insert: {
          archived_at?: string | null
          color_token?: string
          created_at?: string
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          name: string
          pinned_at?: string | null
          position: number
          tagline?: string | null
          track_id: string
        }
        Update: {
          archived_at?: string | null
          color_token?: string
          created_at?: string
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          name?: string
          pinned_at?: string | null
          position?: number
          tagline?: string | null
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_phases_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "academy_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          enrollment_id: string
          id: string
          module_id: string
          reflection: string | null
          score: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["academy_module_status"]
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          verified_by_name: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          module_id: string
          reflection?: string | null
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["academy_module_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          verified_by_name?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          module_id?: string
          reflection?: string | null
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["academy_module_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          verified_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "academy_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_quiz_attempts: {
        Row: {
          answers: Json
          created_at: string
          enrollment_id: string
          id: string
          module_id: string
          passed: boolean
          score: number
        }
        Insert: {
          answers?: Json
          created_at?: string
          enrollment_id: string
          id?: string
          module_id: string
          passed?: boolean
          score?: number
        }
        Update: {
          answers?: Json
          created_at?: string
          enrollment_id?: string
          id?: string
          module_id?: string
          passed?: boolean
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "academy_quiz_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "academy_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_quiz_attempts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_shadow_sessions: {
        Row: {
          created_at: string
          department: string | null
          enrollment_id: string
          hours: number
          id: string
          mentor_signoff: boolean
          module_id: string | null
          notes: string | null
          session_date: string
          shadowed_employee_id: string | null
          shadowed_name: string | null
          signoff_at: string | null
          signoff_by: string | null
          signoff_by_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          enrollment_id: string
          hours?: number
          id?: string
          mentor_signoff?: boolean
          module_id?: string | null
          notes?: string | null
          session_date?: string
          shadowed_employee_id?: string | null
          shadowed_name?: string | null
          signoff_at?: string | null
          signoff_by?: string | null
          signoff_by_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          enrollment_id?: string
          hours?: number
          id?: string
          mentor_signoff?: boolean
          module_id?: string | null
          notes?: string | null
          session_date?: string
          shadowed_employee_id?: string | null
          shadowed_name?: string | null
          signoff_at?: string | null
          signoff_by?: string | null
          signoff_by_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_shadow_sessions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "academy_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_shadow_sessions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_shadow_sessions_shadowed_employee_id_fkey"
            columns: ["shadowed_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_tracks: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_archived: boolean
          is_pinned: boolean
          name: string
          pinned_at: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean
          is_pinned?: boolean
          name: string
          pinned_at?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean
          is_pinned?: boolean
          name?: string
          pinned_at?: string | null
        }
        Relationships: []
      }
      academy_weeks: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          is_archived: boolean
          is_pinned: boolean
          objective: string | null
          outcomes: string[]
          phase_id: string
          pinned_at: string | null
          title: string
          week_number: number
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          objective?: string | null
          outcomes?: string[]
          phase_id: string
          pinned_at?: string | null
          title: string
          week_number: number
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          objective?: string | null
          outcomes?: string[]
          phase_id?: string
          pinned_at?: string | null
          title?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "academy_weeks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "academy_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_documents: {
        Row: {
          assessment_id: string
          client_id: string
          created_at: string
          document_type: Database["public"]["Enums"]["assessment_document_type"]
          id: string
          name: string
          qa_visible: boolean
          storage_path: string | null
          uploaded_by: string | null
          uploaded_by_name: string | null
          version: number
        }
        Insert: {
          assessment_id: string
          client_id: string
          created_at?: string
          document_type: Database["public"]["Enums"]["assessment_document_type"]
          id?: string
          name: string
          qa_visible?: boolean
          storage_path?: string | null
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          version?: number
        }
        Update: {
          assessment_id?: string
          client_id?: string
          created_at?: string
          document_type?: Database["public"]["Enums"]["assessment_document_type"]
          id?: string
          name?: string
          qa_visible?: boolean
          storage_path?: string | null
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          version?: number
        }
        Relationships: []
      }
      attendance_exceptions: {
        Row: {
          clinic: string | null
          created_at: string
          detail: string | null
          employee_id: string
          id: string
          kind: Database["public"]["Enums"]["attendance_exception_kind"]
          occurred_on: string
          related_punch_id: string | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolved_by_name: string | null
          status: Database["public"]["Enums"]["attendance_exception_status"]
          updated_at: string
        }
        Insert: {
          clinic?: string | null
          created_at?: string
          detail?: string | null
          employee_id: string
          id?: string
          kind: Database["public"]["Enums"]["attendance_exception_kind"]
          occurred_on?: string
          related_punch_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_by_name?: string | null
          status?: Database["public"]["Enums"]["attendance_exception_status"]
          updated_at?: string
        }
        Update: {
          clinic?: string | null
          created_at?: string
          detail?: string | null
          employee_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["attendance_exception_kind"]
          occurred_on?: string
          related_punch_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_by_name?: string | null
          status?: Database["public"]["Enums"]["attendance_exception_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_exceptions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_exceptions_related_punch_id_fkey"
            columns: ["related_punch_id"]
            isOneToOne: false
            referencedRelation: "time_clock_punches"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_assessments: {
        Row: {
          alerts: string[]
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          assigned_bcba: string | null
          blockers: string[]
          client_id: string
          completed_date: string | null
          created_at: string
          id: string
          location: Database["public"]["Enums"]["assessment_location"]
          next_action: string
          notes: string | null
          qa_owner: string | null
          scheduled_date: string | null
          scheduler: string | null
          stage_entered_at: string
          status: Database["public"]["Enums"]["assessment_status"]
          treatment_plan_completed_date: string | null
          treatment_plan_due_date: string | null
          updated_at: string
        }
        Insert: {
          alerts?: string[]
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          assigned_bcba?: string | null
          blockers?: string[]
          client_id: string
          completed_date?: string | null
          created_at?: string
          id?: string
          location?: Database["public"]["Enums"]["assessment_location"]
          next_action?: string
          notes?: string | null
          qa_owner?: string | null
          scheduled_date?: string | null
          scheduler?: string | null
          stage_entered_at?: string
          status?: Database["public"]["Enums"]["assessment_status"]
          treatment_plan_completed_date?: string | null
          treatment_plan_due_date?: string | null
          updated_at?: string
        }
        Update: {
          alerts?: string[]
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          assigned_bcba?: string | null
          blockers?: string[]
          client_id?: string
          completed_date?: string | null
          created_at?: string
          id?: string
          location?: Database["public"]["Enums"]["assessment_location"]
          next_action?: string
          notes?: string | null
          qa_owner?: string | null
          scheduled_date?: string | null
          scheduler?: string | null
          stage_entered_at?: string
          status?: Database["public"]["Enums"]["assessment_status"]
          treatment_plan_completed_date?: string | null
          treatment_plan_due_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      client_authorizations: {
        Row: {
          approval_letter_received: boolean
          approved_date: string | null
          approved_hours: number | null
          assigned_auth_coordinator: string | null
          authorization_period: string | null
          blockers: string[]
          client_id: string
          created_at: string
          escalation_owner: string | null
          expiration_date: string | null
          frequency: string | null
          hours: string | null
          id: string
          kind: Database["public"]["Enums"]["auth_kind"]
          missing_docs: string[]
          next_action: string
          notes: string | null
          partial_approval: boolean
          payor: string | null
          progress_report_status: Database["public"]["Enums"]["progress_report_status"]
          qa_notes: string | null
          qa_owner: string | null
          qa_status: Database["public"]["Enums"]["qa_status"]
          reauth_source_id: string | null
          required_docs_received: boolean
          service_type: string | null
          stage_entered_at: string
          state: string | null
          status: Database["public"]["Enums"]["auth_status"]
          submission_history: Json
          submitted_date: string | null
          treatment_plan_linked: boolean
          treatment_plan_received: boolean
          updated_at: string
        }
        Insert: {
          approval_letter_received?: boolean
          approved_date?: string | null
          approved_hours?: number | null
          assigned_auth_coordinator?: string | null
          authorization_period?: string | null
          blockers?: string[]
          client_id: string
          created_at?: string
          escalation_owner?: string | null
          expiration_date?: string | null
          frequency?: string | null
          hours?: string | null
          id?: string
          kind: Database["public"]["Enums"]["auth_kind"]
          missing_docs?: string[]
          next_action?: string
          notes?: string | null
          partial_approval?: boolean
          payor?: string | null
          progress_report_status?: Database["public"]["Enums"]["progress_report_status"]
          qa_notes?: string | null
          qa_owner?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status"]
          reauth_source_id?: string | null
          required_docs_received?: boolean
          service_type?: string | null
          stage_entered_at?: string
          state?: string | null
          status?: Database["public"]["Enums"]["auth_status"]
          submission_history?: Json
          submitted_date?: string | null
          treatment_plan_linked?: boolean
          treatment_plan_received?: boolean
          updated_at?: string
        }
        Update: {
          approval_letter_received?: boolean
          approved_date?: string | null
          approved_hours?: number | null
          assigned_auth_coordinator?: string | null
          authorization_period?: string | null
          blockers?: string[]
          client_id?: string
          created_at?: string
          escalation_owner?: string | null
          expiration_date?: string | null
          frequency?: string | null
          hours?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["auth_kind"]
          missing_docs?: string[]
          next_action?: string
          notes?: string | null
          partial_approval?: boolean
          payor?: string | null
          progress_report_status?: Database["public"]["Enums"]["progress_report_status"]
          qa_notes?: string | null
          qa_owner?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status"]
          reauth_source_id?: string | null
          required_docs_received?: boolean
          service_type?: string | null
          stage_entered_at?: string
          state?: string | null
          status?: Database["public"]["Enums"]["auth_status"]
          submission_history?: Json
          submitted_date?: string | null
          treatment_plan_linked?: boolean
          treatment_plan_received?: boolean
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
      client_compliance_flags: {
        Row: {
          client_id: string
          created_at: string
          detail: string | null
          due_date: string | null
          id: string
          owner: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["compliance_flag_severity"]
          source: Database["public"]["Enums"]["compliance_flag_source"]
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          detail?: string | null
          due_date?: string | null
          id?: string
          owner?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["compliance_flag_severity"]
          source: Database["public"]["Enums"]["compliance_flag_source"]
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          detail?: string | null
          due_date?: string | null
          id?: string
          owner?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["compliance_flag_severity"]
          source?: Database["public"]["Enums"]["compliance_flag_source"]
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      client_qa_reviews: {
        Row: {
          alerts: string[]
          assessment_id: string | null
          assigned_bcba: string | null
          assigned_qa_owner: string | null
          blockers: string[]
          client_id: string
          created_at: string
          documentation_complete: boolean
          error_types: Database["public"]["Enums"]["qa_error_type"][]
          errors_found: boolean
          id: string
          next_action: string
          notes: string | null
          notes_verified: boolean
          qa_completed_date: string | null
          qa_start_date: string | null
          stage_entered_at: string
          status: Database["public"]["Enums"]["qa_review_status"]
          treatment_plan_received: boolean
          treatment_plan_submitted_date: string | null
          updated_at: string
        }
        Insert: {
          alerts?: string[]
          assessment_id?: string | null
          assigned_bcba?: string | null
          assigned_qa_owner?: string | null
          blockers?: string[]
          client_id: string
          created_at?: string
          documentation_complete?: boolean
          error_types?: Database["public"]["Enums"]["qa_error_type"][]
          errors_found?: boolean
          id?: string
          next_action?: string
          notes?: string | null
          notes_verified?: boolean
          qa_completed_date?: string | null
          qa_start_date?: string | null
          stage_entered_at?: string
          status?: Database["public"]["Enums"]["qa_review_status"]
          treatment_plan_received?: boolean
          treatment_plan_submitted_date?: string | null
          updated_at?: string
        }
        Update: {
          alerts?: string[]
          assessment_id?: string | null
          assigned_bcba?: string | null
          assigned_qa_owner?: string | null
          blockers?: string[]
          client_id?: string
          created_at?: string
          documentation_complete?: boolean
          error_types?: Database["public"]["Enums"]["qa_error_type"][]
          errors_found?: boolean
          id?: string
          next_action?: string
          notes?: string | null
          notes_verified?: boolean
          qa_completed_date?: string | null
          qa_start_date?: string | null
          stage_entered_at?: string
          status?: Database["public"]["Enums"]["qa_review_status"]
          treatment_plan_received?: boolean
          treatment_plan_submitted_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      client_reauth_cycles: {
        Row: {
          alerts: string[]
          approval_date: string | null
          assigned_bcba: string | null
          authorization_coordinator: string | null
          bcba_6_week_notification_date: string | null
          bcba_9_week_notification_date: string | null
          blockers: string[]
          client_id: string
          created_at: string
          current_auth_expiration_date: string
          id: string
          linked_authorization_id: string | null
          notes: string | null
          payor: string
          progress_report_due_date: string | null
          progress_report_received_date: string | null
          qa_completed_date: string | null
          qa_owner: string | null
          qa_review_started_date: string | null
          qa_status: Database["public"]["Enums"]["reauth_qa_status"]
          reauth_trigger_date: string
          stage_entered_at: string
          state_director: string | null
          status: Database["public"]["Enums"]["reauth_cycle_status"]
          submission_date: string | null
          submission_status: Database["public"]["Enums"]["reauth_submission_status"]
          updated_at: string
        }
        Insert: {
          alerts?: string[]
          approval_date?: string | null
          assigned_bcba?: string | null
          authorization_coordinator?: string | null
          bcba_6_week_notification_date?: string | null
          bcba_9_week_notification_date?: string | null
          blockers?: string[]
          client_id: string
          created_at?: string
          current_auth_expiration_date: string
          id?: string
          linked_authorization_id?: string | null
          notes?: string | null
          payor?: string
          progress_report_due_date?: string | null
          progress_report_received_date?: string | null
          qa_completed_date?: string | null
          qa_owner?: string | null
          qa_review_started_date?: string | null
          qa_status?: Database["public"]["Enums"]["reauth_qa_status"]
          reauth_trigger_date: string
          stage_entered_at?: string
          state_director?: string | null
          status?: Database["public"]["Enums"]["reauth_cycle_status"]
          submission_date?: string | null
          submission_status?: Database["public"]["Enums"]["reauth_submission_status"]
          updated_at?: string
        }
        Update: {
          alerts?: string[]
          approval_date?: string | null
          assigned_bcba?: string | null
          authorization_coordinator?: string | null
          bcba_6_week_notification_date?: string | null
          bcba_9_week_notification_date?: string | null
          blockers?: string[]
          client_id?: string
          created_at?: string
          current_auth_expiration_date?: string
          id?: string
          linked_authorization_id?: string | null
          notes?: string | null
          payor?: string
          progress_report_due_date?: string | null
          progress_report_received_date?: string | null
          qa_completed_date?: string | null
          qa_owner?: string | null
          qa_review_started_date?: string | null
          qa_status?: Database["public"]["Enums"]["reauth_qa_status"]
          reauth_trigger_date?: string
          stage_entered_at?: string
          state_director?: string | null
          status?: Database["public"]["Enums"]["reauth_cycle_status"]
          submission_date?: string | null
          submission_status?: Database["public"]["Enums"]["reauth_submission_status"]
          updated_at?: string
        }
        Relationships: []
      }
      client_schedule_slots: {
        Row: {
          client_id: string
          created_at: string
          day: Database["public"]["Enums"]["schedule_day"]
          end_time: string
          id: string
          location: string
          notes: string | null
          rbt: string | null
          start_time: string
        }
        Insert: {
          client_id: string
          created_at?: string
          day: Database["public"]["Enums"]["schedule_day"]
          end_time: string
          id?: string
          location?: string
          notes?: string | null
          rbt?: string | null
          start_time: string
        }
        Update: {
          client_id?: string
          created_at?: string
          day?: Database["public"]["Enums"]["schedule_day"]
          end_time?: string
          id?: string
          location?: string
          notes?: string | null
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
      client_service_sessions: {
        Row: {
          bcba: string | null
          billing_issue: string | null
          claim_status: Database["public"]["Enums"]["service_claim_status"]
          client_id: string
          created_at: string
          delivered_hours: number
          delivery_status: Database["public"]["Enums"]["session_delivery_status"]
          id: string
          location: string
          note_status: Database["public"]["Enums"]["service_note_status"]
          notes: string | null
          rbt: string | null
          scheduled_hours: number
          session_date: string
          updated_at: string
        }
        Insert: {
          bcba?: string | null
          billing_issue?: string | null
          claim_status?: Database["public"]["Enums"]["service_claim_status"]
          client_id: string
          created_at?: string
          delivered_hours?: number
          delivery_status?: Database["public"]["Enums"]["session_delivery_status"]
          id?: string
          location?: string
          note_status?: Database["public"]["Enums"]["service_note_status"]
          notes?: string | null
          rbt?: string | null
          scheduled_hours?: number
          session_date?: string
          updated_at?: string
        }
        Update: {
          bcba?: string | null
          billing_issue?: string | null
          claim_status?: Database["public"]["Enums"]["service_claim_status"]
          client_id?: string
          created_at?: string
          delivered_hours?: number
          delivery_status?: Database["public"]["Enums"]["session_delivery_status"]
          id?: string
          location?: string
          note_status?: Database["public"]["Enums"]["service_note_status"]
          notes?: string | null
          rbt?: string | null
          scheduled_hours?: number
          session_date?: string
          updated_at?: string
        }
        Relationships: []
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
          active_alerts: string[]
          active_notes: string | null
          active_service_status: Database["public"]["Enums"]["active_service_status"]
          active_staffing_status: Database["public"]["Enums"]["active_staffing_status"]
          amerigroup_status: string
          approved_weekly_hours: number
          assessment_date: string | null
          auth_status: Database["public"]["Enums"]["auth_status"]
          automation_log: string[]
          bcba: string | null
          billing_status: Database["public"]["Enums"]["billing_claim_status"]
          blockers: string[]
          case_coordination_document_generated: boolean
          centralreach_sync_status: string
          child_age: string | null
          child_name: string
          claims_issues: number
          claims_submitted: number
          clinic: string
          consent_complete: boolean
          consent_required: boolean
          created_at: string
          created_by: string | null
          delivered_weekly_hours: number
          early_rbt_issues: string[]
          email: string | null
          id: string
          insurance: string | null
          intake_owner: string | null
          lead_id: string | null
          new_rbt_start_date: string | null
          next_action: string | null
          next_reauth_date: string | null
          next_task_due: string | null
          noteguard_flags: number
          notes_compliance_status: Database["public"]["Enums"]["notes_compliance_status"]
          pairing_email_sent: boolean
          parent_name: string
          payment_plan_required: boolean
          payment_plan_signed: boolean
          payment_plan_status: string
          payor: string
          phone: string | null
          qa_status: Database["public"]["Enums"]["qa_status"]
          rbt: string | null
          rbt_check_in_status: string
          ready_for_auth: boolean
          scheduled_weekly_hours: number
          scheduling_notes: string | null
          scheduling_status: Database["public"]["Enums"]["scheduling_status"]
          service_location: string
          sessions_logged: number
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
          active_alerts?: string[]
          active_notes?: string | null
          active_service_status?: Database["public"]["Enums"]["active_service_status"]
          active_staffing_status?: Database["public"]["Enums"]["active_staffing_status"]
          amerigroup_status?: string
          approved_weekly_hours?: number
          assessment_date?: string | null
          auth_status?: Database["public"]["Enums"]["auth_status"]
          automation_log?: string[]
          bcba?: string | null
          billing_status?: Database["public"]["Enums"]["billing_claim_status"]
          blockers?: string[]
          case_coordination_document_generated?: boolean
          centralreach_sync_status?: string
          child_age?: string | null
          child_name: string
          claims_issues?: number
          claims_submitted?: number
          clinic: string
          consent_complete?: boolean
          consent_required?: boolean
          created_at?: string
          created_by?: string | null
          delivered_weekly_hours?: number
          early_rbt_issues?: string[]
          email?: string | null
          id?: string
          insurance?: string | null
          intake_owner?: string | null
          lead_id?: string | null
          new_rbt_start_date?: string | null
          next_action?: string | null
          next_reauth_date?: string | null
          next_task_due?: string | null
          noteguard_flags?: number
          notes_compliance_status?: Database["public"]["Enums"]["notes_compliance_status"]
          pairing_email_sent?: boolean
          parent_name: string
          payment_plan_required?: boolean
          payment_plan_signed?: boolean
          payment_plan_status?: string
          payor?: string
          phone?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status"]
          rbt?: string | null
          rbt_check_in_status?: string
          ready_for_auth?: boolean
          scheduled_weekly_hours?: number
          scheduling_notes?: string | null
          scheduling_status?: Database["public"]["Enums"]["scheduling_status"]
          service_location?: string
          sessions_logged?: number
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
          active_alerts?: string[]
          active_notes?: string | null
          active_service_status?: Database["public"]["Enums"]["active_service_status"]
          active_staffing_status?: Database["public"]["Enums"]["active_staffing_status"]
          amerigroup_status?: string
          approved_weekly_hours?: number
          assessment_date?: string | null
          auth_status?: Database["public"]["Enums"]["auth_status"]
          automation_log?: string[]
          bcba?: string | null
          billing_status?: Database["public"]["Enums"]["billing_claim_status"]
          blockers?: string[]
          case_coordination_document_generated?: boolean
          centralreach_sync_status?: string
          child_age?: string | null
          child_name?: string
          claims_issues?: number
          claims_submitted?: number
          clinic?: string
          consent_complete?: boolean
          consent_required?: boolean
          created_at?: string
          created_by?: string | null
          delivered_weekly_hours?: number
          early_rbt_issues?: string[]
          email?: string | null
          id?: string
          insurance?: string | null
          intake_owner?: string | null
          lead_id?: string | null
          new_rbt_start_date?: string | null
          next_action?: string | null
          next_reauth_date?: string | null
          next_task_due?: string | null
          noteguard_flags?: number
          notes_compliance_status?: Database["public"]["Enums"]["notes_compliance_status"]
          pairing_email_sent?: boolean
          parent_name?: string
          payment_plan_required?: boolean
          payment_plan_signed?: boolean
          payment_plan_status?: string
          payor?: string
          phone?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status"]
          rbt?: string | null
          rbt_check_in_status?: string
          ready_for_auth?: boolean
          scheduled_weekly_hours?: number
          scheduling_notes?: string | null
          scheduling_status?: Database["public"]["Enums"]["scheduling_status"]
          service_location?: string
          sessions_logged?: number
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
      employee_bonuses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          bonus_type: Database["public"]["Enums"]["bonus_type"]
          created_at: string
          created_by: string | null
          effective_date: string | null
          employee_id: string
          id: string
          notes: string | null
          paid_date: string | null
          payroll_run_id: string | null
          reason: string | null
          status: Database["public"]["Enums"]["bonus_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          bonus_type?: Database["public"]["Enums"]["bonus_type"]
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          payroll_run_id?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["bonus_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          bonus_type?: Database["public"]["Enums"]["bonus_type"]
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          payroll_run_id?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["bonus_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_bonuses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
      employee_pay_changes: {
        Row: {
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          created_at: string
          created_by: string | null
          effective_date: string
          employee_id: string
          id: string
          kind: Database["public"]["Enums"]["pay_change_kind"]
          new_pay_type: Database["public"]["Enums"]["pay_type"] | null
          new_rate: number
          new_title: string | null
          notes: string | null
          previous_pay_type: Database["public"]["Enums"]["pay_type"] | null
          previous_rate: number | null
          previous_title: string | null
          reason: string | null
          status: Database["public"]["Enums"]["pay_change_status"]
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          created_at?: string
          created_by?: string | null
          effective_date: string
          employee_id: string
          id?: string
          kind?: Database["public"]["Enums"]["pay_change_kind"]
          new_pay_type?: Database["public"]["Enums"]["pay_type"] | null
          new_rate: number
          new_title?: string | null
          notes?: string | null
          previous_pay_type?: Database["public"]["Enums"]["pay_type"] | null
          previous_rate?: number | null
          previous_title?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["pay_change_status"]
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          created_at?: string
          created_by?: string | null
          effective_date?: string
          employee_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["pay_change_kind"]
          new_pay_type?: Database["public"]["Enums"]["pay_type"] | null
          new_rate?: number
          new_title?: string | null
          notes?: string | null
          previous_pay_type?: Database["public"]["Enums"]["pay_type"] | null
          previous_rate?: number | null
          previous_title?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["pay_change_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_pay_changes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
      employee_reviews: {
        Row: {
          acknowledged_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          employee_comments: string | null
          employee_id: string
          goals: string | null
          growth_areas: string | null
          id: string
          manager_comments: string | null
          overall_rating: Database["public"]["Enums"]["review_rating"] | null
          period_end: string | null
          period_start: string | null
          review_type: Database["public"]["Enums"]["review_type"]
          reviewer_id: string | null
          reviewer_name: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["review_status"]
          strengths: string | null
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          employee_comments?: string | null
          employee_id: string
          goals?: string | null
          growth_areas?: string | null
          id?: string
          manager_comments?: string | null
          overall_rating?: Database["public"]["Enums"]["review_rating"] | null
          period_end?: string | null
          period_start?: string | null
          review_type?: Database["public"]["Enums"]["review_type"]
          reviewer_id?: string | null
          reviewer_name?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          strengths?: string | null
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          employee_comments?: string | null
          employee_id?: string
          goals?: string | null
          growth_areas?: string | null
          id?: string
          manager_comments?: string | null
          overall_rating?: Database["public"]["Enums"]["review_rating"] | null
          period_end?: string | null
          period_start?: string | null
          review_type?: Database["public"]["Enums"]["review_type"]
          reviewer_id?: string | null
          reviewer_name?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          strengths?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
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
      employee_trainings: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          certificate_url: string | null
          completed_at: string | null
          course_id: string
          created_at: string
          due_date: string | null
          employee_id: string
          expires_on: string | null
          id: string
          notes: string | null
          score: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["training_status"]
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          certificate_url?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string
          due_date?: string | null
          employee_id: string
          expires_on?: string | null
          id?: string
          notes?: string | null
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["training_status"]
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          certificate_url?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string
          due_date?: string | null
          employee_id?: string
          expires_on?: string | null
          id?: string
          notes?: string | null
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["training_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_trainings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_trainings_employee_id_fkey"
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
          grandfathered: boolean
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
          grandfathered?: boolean
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
          grandfathered?: boolean
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
      hours_timesheet_entries: {
        Row: {
          category: string | null
          clinic: string | null
          created_at: string
          hours: number
          id: string
          notes: string | null
          timesheet_id: string
          updated_at: string
          work_date: string
        }
        Insert: {
          category?: string | null
          clinic?: string | null
          created_at?: string
          hours?: number
          id?: string
          notes?: string | null
          timesheet_id: string
          updated_at?: string
          work_date: string
        }
        Update: {
          category?: string | null
          clinic?: string | null
          created_at?: string
          hours?: number
          id?: string
          notes?: string | null
          timesheet_id?: string
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "hours_timesheet_entries_timesheet_id_fkey"
            columns: ["timesheet_id"]
            isOneToOne: false
            referencedRelation: "hours_timesheets"
            referencedColumns: ["id"]
          },
        ]
      }
      hours_timesheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          created_at: string
          employee_id: string
          id: string
          locked_at: string | null
          notes: string | null
          overtime_hours: number
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["timesheet_status"]
          submitted_at: string | null
          submitted_by: string | null
          total_hours: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          created_at?: string
          employee_id: string
          id?: string
          locked_at?: string | null
          notes?: string | null
          overtime_hours?: number
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["timesheet_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          total_hours?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          locked_at?: string | null
          notes?: string | null
          overtime_hours?: number
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["timesheet_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          total_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hours_timesheets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "hr_announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_announcements: {
        Row: {
          audience: Database["public"]["Enums"]["hr_announcement_audience"]
          audience_clinics: string[]
          audience_departments: string[]
          audience_roles: string[]
          audience_states: string[]
          author_id: string | null
          author_name: string | null
          body: string
          created_at: string
          expires_at: string | null
          id: string
          pinned: boolean
          priority: Database["public"]["Enums"]["hr_announcement_priority"]
          publish_at: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["hr_announcement_audience"]
          audience_clinics?: string[]
          audience_departments?: string[]
          audience_roles?: string[]
          audience_states?: string[]
          author_id?: string | null
          author_name?: string | null
          body: string
          created_at?: string
          expires_at?: string | null
          id?: string
          pinned?: boolean
          priority?: Database["public"]["Enums"]["hr_announcement_priority"]
          publish_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["hr_announcement_audience"]
          audience_clinics?: string[]
          audience_departments?: string[]
          audience_roles?: string[]
          audience_states?: string[]
          author_id?: string | null
          author_name?: string | null
          body?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          pinned?: boolean
          priority?: Database["public"]["Enums"]["hr_announcement_priority"]
          publish_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      hr_resources: {
        Row: {
          category: Database["public"]["Enums"]["hr_resource_category"]
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_pinned: boolean
          kind: Database["public"]["Enums"]["hr_resource_kind"]
          parent_id: string | null
          position: number
          storage_path: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
          uploaded_by_name: string | null
          url: string | null
          visibility_clinics: string[]
          visibility_roles: string[]
          visibility_states: string[]
        }
        Insert: {
          category?: Database["public"]["Enums"]["hr_resource_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_pinned?: boolean
          kind?: Database["public"]["Enums"]["hr_resource_kind"]
          parent_id?: string | null
          position?: number
          storage_path?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          url?: string | null
          visibility_clinics?: string[]
          visibility_roles?: string[]
          visibility_states?: string[]
        }
        Update: {
          category?: Database["public"]["Enums"]["hr_resource_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_pinned?: boolean
          kind?: Database["public"]["Enums"]["hr_resource_kind"]
          parent_id?: string | null
          position?: number
          storage_path?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          url?: string | null
          visibility_clinics?: string[]
          visibility_roles?: string[]
          visibility_states?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "hr_resources_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "hr_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_saved_reports: {
        Row: {
          category: string
          config: Json
          created_at: string
          created_by: string | null
          created_by_name: string | null
          description: string | null
          id: string
          is_shared: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      hr_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          updated_by_name: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          updated_by_name?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          updated_by_name?: string | null
          value?: Json
        }
        Relationships: []
      }
      intake_communications: {
        Row: {
          call_outcome: Database["public"]["Enums"]["intake_call_status"] | null
          communication_type: Database["public"]["Enums"]["intake_communication_type"]
          created_at: string
          direction: string
          duration_seconds: number | null
          id: string
          lead_id: string
          logged_by: string | null
          logged_by_name: string | null
          preview: string
          subject: string | null
        }
        Insert: {
          call_outcome?:
            | Database["public"]["Enums"]["intake_call_status"]
            | null
          communication_type: Database["public"]["Enums"]["intake_communication_type"]
          created_at?: string
          direction?: string
          duration_seconds?: number | null
          id?: string
          lead_id: string
          logged_by?: string | null
          logged_by_name?: string | null
          preview: string
          subject?: string | null
        }
        Update: {
          call_outcome?:
            | Database["public"]["Enums"]["intake_call_status"]
            | null
          communication_type?: Database["public"]["Enums"]["intake_communication_type"]
          created_at?: string
          direction?: string
          duration_seconds?: number | null
          id?: string
          lead_id?: string
          logged_by?: string | null
          logged_by_name?: string | null
          preview?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intake_communications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "intake_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_documents: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["intake_document_type"]
          id: string
          lead_id: string
          missing_flag: boolean
          name: string
          storage_path: string | null
          uploaded_by: string | null
          uploaded_by_name: string | null
          version: number
        }
        Insert: {
          created_at?: string
          document_type: Database["public"]["Enums"]["intake_document_type"]
          id?: string
          lead_id: string
          missing_flag?: boolean
          name: string
          storage_path?: string | null
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["intake_document_type"]
          id?: string
          lead_id?: string
          missing_flag?: boolean
          name?: string
          storage_path?: string | null
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "intake_documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "intake_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_leads: {
        Row: {
          assigned_intake_coordinator: string | null
          blockers: string[]
          call_status: Database["public"]["Enums"]["intake_call_status"]
          child_name: string
          coinsurance_percent: number
          consent_form_status: Database["public"]["Enums"]["intake_consent_status"]
          contact_attempts_count: number
          copay: number
          created_at: string
          created_by: string | null
          deductible_amount: number
          deductible_remaining: number
          email: string
          email_sent: boolean
          estimated_client_responsibility: number
          estimated_insurance_coverage_percent: number
          estimated_monthly_revenue: number
          expected_weekly_hours: number
          financial_blockers: string[]
          financial_decision_notes: string | null
          financial_owner: string
          financial_stage_entered_at: string
          financial_status: Database["public"]["Enums"]["financial_review_status"]
          form_review_status: Database["public"]["Enums"]["intake_form_review_status"]
          form_status: Database["public"]["Enums"]["intake_form_status"]
          id: string
          in_network: boolean
          initial_form_link: string | null
          insurance: string | null
          insurance_type: string | null
          last_contacted_at: string | null
          lead_source: string
          max_out_of_pocket: number
          next_action: string
          next_task_due: string | null
          non_qualified_reason: string | null
          notes: string | null
          out_of_network: boolean
          parent_name: string
          payment_plan_amount: number
          payment_plan_needed: boolean
          payment_plan_sent: boolean
          payment_plan_signed: boolean
          payment_plan_status: Database["public"]["Enums"]["payment_plan_status"]
          phone: string
          pipeline_stage: Database["public"]["Enums"]["intake_pipeline_stage"]
          primary_insurance: string | null
          priority: Database["public"]["Enums"]["intake_priority"]
          ready_for_client_conversion: boolean
          secondary_insurance: string | null
          sms_sent: boolean
          stage_entered_at: string
          state: string
          updated_at: string
          vob_file_path: string | null
          vob_status: Database["public"]["Enums"]["intake_vob_status"]
        }
        Insert: {
          assigned_intake_coordinator?: string | null
          blockers?: string[]
          call_status?: Database["public"]["Enums"]["intake_call_status"]
          child_name: string
          coinsurance_percent?: number
          consent_form_status?: Database["public"]["Enums"]["intake_consent_status"]
          contact_attempts_count?: number
          copay?: number
          created_at?: string
          created_by?: string | null
          deductible_amount?: number
          deductible_remaining?: number
          email: string
          email_sent?: boolean
          estimated_client_responsibility?: number
          estimated_insurance_coverage_percent?: number
          estimated_monthly_revenue?: number
          expected_weekly_hours?: number
          financial_blockers?: string[]
          financial_decision_notes?: string | null
          financial_owner?: string
          financial_stage_entered_at?: string
          financial_status?: Database["public"]["Enums"]["financial_review_status"]
          form_review_status?: Database["public"]["Enums"]["intake_form_review_status"]
          form_status?: Database["public"]["Enums"]["intake_form_status"]
          id?: string
          in_network?: boolean
          initial_form_link?: string | null
          insurance?: string | null
          insurance_type?: string | null
          last_contacted_at?: string | null
          lead_source?: string
          max_out_of_pocket?: number
          next_action?: string
          next_task_due?: string | null
          non_qualified_reason?: string | null
          notes?: string | null
          out_of_network?: boolean
          parent_name: string
          payment_plan_amount?: number
          payment_plan_needed?: boolean
          payment_plan_sent?: boolean
          payment_plan_signed?: boolean
          payment_plan_status?: Database["public"]["Enums"]["payment_plan_status"]
          phone: string
          pipeline_stage?: Database["public"]["Enums"]["intake_pipeline_stage"]
          primary_insurance?: string | null
          priority?: Database["public"]["Enums"]["intake_priority"]
          ready_for_client_conversion?: boolean
          secondary_insurance?: string | null
          sms_sent?: boolean
          stage_entered_at?: string
          state: string
          updated_at?: string
          vob_file_path?: string | null
          vob_status?: Database["public"]["Enums"]["intake_vob_status"]
        }
        Update: {
          assigned_intake_coordinator?: string | null
          blockers?: string[]
          call_status?: Database["public"]["Enums"]["intake_call_status"]
          child_name?: string
          coinsurance_percent?: number
          consent_form_status?: Database["public"]["Enums"]["intake_consent_status"]
          contact_attempts_count?: number
          copay?: number
          created_at?: string
          created_by?: string | null
          deductible_amount?: number
          deductible_remaining?: number
          email?: string
          email_sent?: boolean
          estimated_client_responsibility?: number
          estimated_insurance_coverage_percent?: number
          estimated_monthly_revenue?: number
          expected_weekly_hours?: number
          financial_blockers?: string[]
          financial_decision_notes?: string | null
          financial_owner?: string
          financial_stage_entered_at?: string
          financial_status?: Database["public"]["Enums"]["financial_review_status"]
          form_review_status?: Database["public"]["Enums"]["intake_form_review_status"]
          form_status?: Database["public"]["Enums"]["intake_form_status"]
          id?: string
          in_network?: boolean
          initial_form_link?: string | null
          insurance?: string | null
          insurance_type?: string | null
          last_contacted_at?: string | null
          lead_source?: string
          max_out_of_pocket?: number
          next_action?: string
          next_task_due?: string | null
          non_qualified_reason?: string | null
          notes?: string | null
          out_of_network?: boolean
          parent_name?: string
          payment_plan_amount?: number
          payment_plan_needed?: boolean
          payment_plan_sent?: boolean
          payment_plan_signed?: boolean
          payment_plan_status?: Database["public"]["Enums"]["payment_plan_status"]
          phone?: string
          pipeline_stage?: Database["public"]["Enums"]["intake_pipeline_stage"]
          primary_insurance?: string | null
          priority?: Database["public"]["Enums"]["intake_priority"]
          ready_for_client_conversion?: boolean
          secondary_insurance?: string | null
          sms_sent?: boolean
          stage_entered_at?: string
          state?: string
          updated_at?: string
          vob_file_path?: string | null
          vob_status?: Database["public"]["Enums"]["intake_vob_status"]
        }
        Relationships: []
      }
      intake_tasks: {
        Row: {
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          lead_id: string
          notes: string | null
          owner: string | null
          status: Database["public"]["Enums"]["intake_task_status"]
          task_type: Database["public"]["Enums"]["intake_task_type"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          owner?: string | null
          status?: Database["public"]["Enums"]["intake_task_status"]
          task_type: Database["public"]["Enums"]["intake_task_type"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          owner?: string | null
          status?: Database["public"]["Enums"]["intake_task_status"]
          task_type?: Database["public"]["Enums"]["intake_task_type"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "intake_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_email_logs: {
        Row: {
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          invited_user_id: string | null
          recipient_email: string
          resend_message_id: string | null
          roles: string[]
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          invited_user_id?: string | null
          recipient_email: string
          resend_message_id?: string | null
          roles?: string[]
          status: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          invited_user_id?: string | null
          recipient_email?: string
          resend_message_id?: string | null
          roles?: string[]
          status?: string
        }
        Relationships: []
      }
      journey_step_attachments: {
        Row: {
          created_at: string
          file_name: string
          id: string
          journey_key: string
          mime_type: string | null
          notes: string | null
          size_bytes: number | null
          step_id: string
          storage_path: string
          updated_at: string
          uploaded_by: string
          uploaded_by_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          journey_key: string
          mime_type?: string | null
          notes?: string | null
          size_bytes?: number | null
          step_id: string
          storage_path: string
          updated_at?: string
          uploaded_by: string
          uploaded_by_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          journey_key?: string
          mime_type?: string | null
          notes?: string | null
          size_bytes?: number | null
          step_id?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
          uploaded_by_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          id: string
          metadata: Json
          search: unknown
          source_id: string | null
          source_title: string
          source_type: string
          source_url: string | null
        }
        Insert: {
          chunk_index?: number
          content: string
          created_at?: string
          id?: string
          metadata?: Json
          search?: unknown
          source_id?: string | null
          source_title: string
          source_type: string
          source_url?: string | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          id?: string
          metadata?: Json
          search?: unknown
          source_id?: string | null
          source_title?: string
          source_type?: string
          source_url?: string | null
        }
        Relationships: []
      }
      onboarding_milestone_progress: {
        Row: {
          completed: boolean
          completed_at: string
          created_at: string
          id: string
          item: string
          phase: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string
          created_at?: string
          id?: string
          item: string
          phase: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string
          created_at?: string
          id?: string
          item?: string
          phase?: string
          updated_at?: string
          user_id?: string
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
      payroll_run_items: {
        Row: {
          bonus_total: number
          created_at: string
          employee_id: string
          gross_pay: number
          id: string
          notes: string | null
          overtime_hours: number
          payroll_run_id: string
          pto_hours: number
          regular_hours: number
          status: string
          timesheet_id: string | null
          updated_at: string
        }
        Insert: {
          bonus_total?: number
          created_at?: string
          employee_id: string
          gross_pay?: number
          id?: string
          notes?: string | null
          overtime_hours?: number
          payroll_run_id: string
          pto_hours?: number
          regular_hours?: number
          status?: string
          timesheet_id?: string | null
          updated_at?: string
        }
        Update: {
          bonus_total?: number
          created_at?: string
          employee_id?: string
          gross_pay?: number
          id?: string
          notes?: string | null
          overtime_hours?: number
          payroll_run_id?: string
          pto_hours?: number
          regular_hours?: number
          status?: string
          timesheet_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_run_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_run_items_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_run_items_timesheet_id_fkey"
            columns: ["timesheet_id"]
            isOneToOne: false
            referencedRelation: "hours_timesheets"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          closed_at: string | null
          created_at: string
          created_by: string | null
          employee_count: number
          id: string
          name: string
          notes: string | null
          pay_date: string | null
          period_end: string
          period_start: string
          posted_at: string | null
          posted_by: string | null
          status: Database["public"]["Enums"]["payroll_run_status"]
          submitted_at: string | null
          submitted_by: string | null
          submitted_by_name: string | null
          total_gross: number
          total_hours: number
          updated_at: string
          viventium_batch_id: string | null
          viventium_synced_at: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          employee_count?: number
          id?: string
          name: string
          notes?: string | null
          pay_date?: string | null
          period_end: string
          period_start: string
          posted_at?: string | null
          posted_by?: string | null
          status?: Database["public"]["Enums"]["payroll_run_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          submitted_by_name?: string | null
          total_gross?: number
          total_hours?: number
          updated_at?: string
          viventium_batch_id?: string | null
          viventium_synced_at?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          employee_count?: number
          id?: string
          name?: string
          notes?: string | null
          pay_date?: string | null
          period_end?: string
          period_start?: string
          posted_at?: string | null
          posted_by?: string | null
          status?: Database["public"]["Enums"]["payroll_run_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          submitted_by_name?: string | null
          total_gross?: number
          total_hours?: number
          updated_at?: string
          viventium_batch_id?: string | null
          viventium_synced_at?: string | null
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
          active: boolean
          avatar_url: string | null
          clinic: string | null
          created_at: string
          dashboard_access: string
          department: string | null
          display_name: string | null
          email: string | null
          id: string
          job_title: string | null
          must_change_password: boolean
          part_of_leadership: boolean
          responsibilities: string | null
          state: string | null
          updated_at: string
          user_id: string
          welcome_sent_at: string | null
          welcome_sent_by: string | null
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          clinic?: string | null
          created_at?: string
          dashboard_access?: string
          department?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          job_title?: string | null
          must_change_password?: boolean
          part_of_leadership?: boolean
          responsibilities?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          welcome_sent_at?: string | null
          welcome_sent_by?: string | null
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          clinic?: string | null
          created_at?: string
          dashboard_access?: string
          department?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          job_title?: string | null
          must_change_password?: boolean
          part_of_leadership?: boolean
          responsibilities?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          welcome_sent_at?: string | null
          welcome_sent_by?: string | null
        }
        Relationships: []
      }
      qa_note_monitoring: {
        Row: {
          alerts: string[]
          bcba_name: string | null
          check_in_due: string | null
          client_id: string | null
          created_at: string
          errors_found: number
          flagged_notes: number
          id: string
          monitoring_type: Database["public"]["Enums"]["qa_monitoring_type"]
          new_rbt_monitoring: boolean
          next_action: string
          notes: string | null
          notes_checked: number
          owner: string | null
          rbt_name: string | null
          repeat_issue: boolean
          status: Database["public"]["Enums"]["qa_monitoring_status"]
          updated_at: string
        }
        Insert: {
          alerts?: string[]
          bcba_name?: string | null
          check_in_due?: string | null
          client_id?: string | null
          created_at?: string
          errors_found?: number
          flagged_notes?: number
          id?: string
          monitoring_type?: Database["public"]["Enums"]["qa_monitoring_type"]
          new_rbt_monitoring?: boolean
          next_action?: string
          notes?: string | null
          notes_checked?: number
          owner?: string | null
          rbt_name?: string | null
          repeat_issue?: boolean
          status?: Database["public"]["Enums"]["qa_monitoring_status"]
          updated_at?: string
        }
        Update: {
          alerts?: string[]
          bcba_name?: string | null
          check_in_due?: string | null
          client_id?: string | null
          created_at?: string
          errors_found?: number
          flagged_notes?: number
          id?: string
          monitoring_type?: Database["public"]["Enums"]["qa_monitoring_type"]
          new_rbt_monitoring?: boolean
          next_action?: string
          notes?: string | null
          notes_checked?: number
          owner?: string | null
          rbt_name?: string | null
          repeat_issue?: boolean
          status?: Database["public"]["Enums"]["qa_monitoring_status"]
          updated_at?: string
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_name: string | null
          actor_user_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          source: string | null
          target_user_email: string | null
          target_user_id: string
          target_user_name: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_name?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          source?: string | null
          target_user_email?: string | null
          target_user_id: string
          target_user_name?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_name?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          source?: string | null
          target_user_email?: string | null
          target_user_id?: string
          target_user_name?: string | null
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
      staffing_matches: {
        Row: {
          availability_overlap: string[]
          capacity_remaining: number | null
          client_id: string
          created_at: string
          created_by: string | null
          distance_miles: number | null
          id: string
          match_score: number
          notes: string | null
          rbt_id: string
          rbt_name: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["staffing_match_status"]
          updated_at: string
        }
        Insert: {
          availability_overlap?: string[]
          capacity_remaining?: number | null
          client_id: string
          created_at?: string
          created_by?: string | null
          distance_miles?: number | null
          id?: string
          match_score?: number
          notes?: string | null
          rbt_id: string
          rbt_name: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["staffing_match_status"]
          updated_at?: string
        }
        Update: {
          availability_overlap?: string[]
          capacity_remaining?: number | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          distance_miles?: number | null
          id?: string
          match_score?: number
          notes?: string | null
          rbt_id?: string
          rbt_name?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["staffing_match_status"]
          updated_at?: string
        }
        Relationships: []
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
      time_clock_punches: {
        Row: {
          clinic: string | null
          created_at: string
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          employee_id: string
          id: string
          kind: Database["public"]["Enums"]["punch_kind"]
          notes: string | null
          pay_period_start: string | null
          punch_at: string
          recorded_by: string | null
          recorded_by_name: string | null
          scheduled_at: string | null
          source: Database["public"]["Enums"]["punch_source"]
          status: Database["public"]["Enums"]["punch_status"]
          updated_at: string
        }
        Insert: {
          clinic?: string | null
          created_at?: string
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          employee_id: string
          id?: string
          kind: Database["public"]["Enums"]["punch_kind"]
          notes?: string | null
          pay_period_start?: string | null
          punch_at?: string
          recorded_by?: string | null
          recorded_by_name?: string | null
          scheduled_at?: string | null
          source?: Database["public"]["Enums"]["punch_source"]
          status?: Database["public"]["Enums"]["punch_status"]
          updated_at?: string
        }
        Update: {
          clinic?: string | null
          created_at?: string
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          employee_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["punch_kind"]
          notes?: string | null
          pay_period_start?: string | null
          punch_at?: string
          recorded_by?: string | null
          recorded_by_name?: string | null
          scheduled_at?: string | null
          source?: Database["public"]["Enums"]["punch_source"]
          status?: Database["public"]["Enums"]["punch_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_clock_punches_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      training_assignments: {
        Row: {
          assigned_by: string | null
          assigned_to_department: string | null
          assigned_to_role: string | null
          assigned_to_user_id: string | null
          course_id: string
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          required: boolean
        }
        Insert: {
          assigned_by?: string | null
          assigned_to_department?: string | null
          assigned_to_role?: string | null
          assigned_to_user_id?: string | null
          course_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          required?: boolean
        }
        Update: {
          assigned_by?: string | null
          assigned_to_department?: string | null
          assigned_to_role?: string | null
          assigned_to_user_id?: string | null
          course_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "training_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      training_badges: {
        Row: {
          course_id: string | null
          created_at: string
          description: string
          icon: string
          id: string
          title: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          description?: string
          icon?: string
          id?: string
          title: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          description?: string
          icon?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_badges_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      training_courses: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string | null
          difficulty: string
          duration_minutes: number | null
          estimated_minutes: number
          external_url: string | null
          id: string
          is_active: boolean
          is_pinned: boolean
          name: string
          pinned_at: string | null
          provider: string | null
          renewal_months: number | null
          required_default: boolean
          required_for_roles: string[]
          role_visibility: string[]
          status: string
          title: string
          training_type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          difficulty?: string
          duration_minutes?: number | null
          estimated_minutes: number
          external_url?: string | null
          id?: string
          is_active?: boolean
          is_pinned?: boolean
          name: string
          pinned_at?: string | null
          provider?: string | null
          renewal_months?: number | null
          required_default?: boolean
          required_for_roles?: string[]
          role_visibility?: string[]
          status?: string
          title: string
          training_type?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          difficulty?: string
          duration_minutes?: number | null
          estimated_minutes?: number
          external_url?: string | null
          id?: string
          is_active?: boolean
          is_pinned?: boolean
          name?: string
          pinned_at?: string | null
          provider?: string | null
          renewal_months?: number | null
          required_default?: boolean
          required_for_roles?: string[]
          role_visibility?: string[]
          status?: string
          title?: string
          training_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_courses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "training_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      training_departments: {
        Row: {
          color: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      training_followups: {
        Row: {
          audience: Database["public"]["Enums"]["training_audience"]
          completed_at: string | null
          coordinator_email: string | null
          coordinator_name: string | null
          created_at: string
          created_by: string | null
          due_date: string
          employee_id: string | null
          id: string
          last_reminder_sent_at: string | null
          module_id: string
          module_title: string
          notes: string | null
          reminder_log: Json
          reminder_offsets_days: number[]
          status: Database["public"]["Enums"]["training_followup_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["training_audience"]
          completed_at?: string | null
          coordinator_email?: string | null
          coordinator_name?: string | null
          created_at?: string
          created_by?: string | null
          due_date: string
          employee_id?: string | null
          id?: string
          last_reminder_sent_at?: string | null
          module_id: string
          module_title: string
          notes?: string | null
          reminder_log?: Json
          reminder_offsets_days?: number[]
          status?: Database["public"]["Enums"]["training_followup_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["training_audience"]
          completed_at?: string | null
          coordinator_email?: string | null
          coordinator_name?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string
          employee_id?: string | null
          id?: string
          last_reminder_sent_at?: string | null
          module_id?: string
          module_title?: string
          notes?: string | null
          reminder_log?: Json
          reminder_offsets_days?: number[]
          status?: Database["public"]["Enums"]["training_followup_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      training_lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "training_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      training_lessons: {
        Row: {
          content: string
          course_id: string
          created_at: string
          description: string
          id: string
          is_required: boolean
          lesson_type: string
          resource_url: string | null
          sort_order: number
          tango_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string
          course_id: string
          created_at?: string
          description?: string
          id?: string
          is_required?: boolean
          lesson_type?: string
          resource_url?: string | null
          sort_order?: number
          tango_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          description?: string
          id?: string
          is_required?: boolean
          lesson_type?: string
          resource_url?: string | null
          sort_order?: number
          tango_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      training_module_defaults: {
        Row: {
          active: boolean
          audience: Database["public"]["Enums"]["training_audience"]
          coordinator_email: string | null
          coordinator_name: string | null
          coordinator_role: string | null
          created_at: string
          default_offset_days: number
          id: string
          module_id: string
          module_title: string
          reminder_offsets_days: number[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          audience?: Database["public"]["Enums"]["training_audience"]
          coordinator_email?: string | null
          coordinator_name?: string | null
          coordinator_role?: string | null
          created_at?: string
          default_offset_days?: number
          id?: string
          module_id: string
          module_title: string
          reminder_offsets_days?: number[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          audience?: Database["public"]["Enums"]["training_audience"]
          coordinator_email?: string | null
          coordinator_name?: string | null
          coordinator_role?: string | null
          created_at?: string
          default_offset_days?: number
          id?: string
          module_id?: string
          module_title?: string
          reminder_offsets_days?: number[]
          updated_at?: string
        }
        Relationships: []
      }
      training_progress: {
        Row: {
          assigned_by: string | null
          completed_at: string | null
          course_id: string
          created_at: string
          due_date: string | null
          id: string
          last_opened_at: string | null
          progress_percentage: number
          quiz_score: number | null
          required: boolean
          started_at: string | null
          status: string
          time_spent_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          last_opened_at?: string | null
          progress_percentage?: number
          quiz_score?: number | null
          required?: boolean
          started_at?: string | null
          status?: string
          time_spent_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          last_opened_at?: string | null
          progress_percentage?: number
          quiz_score?: number | null
          required?: boolean
          started_at?: string | null
          status?: string
          time_spent_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      training_quiz_attempts: {
        Row: {
          answers: Json
          attempted_at: string
          id: string
          passed: boolean
          quiz_id: string
          score: number
          user_id: string
        }
        Insert: {
          answers?: Json
          attempted_at?: string
          id?: string
          passed?: boolean
          quiz_id: string
          score?: number
          user_id: string
        }
        Update: {
          answers?: Json
          attempted_at?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "training_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      training_quiz_questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          id: string
          options: Json
          question: string
          question_type: string
          quiz_id: string
          sort_order: number
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          options?: Json
          question: string
          question_type?: string
          quiz_id: string
          sort_order?: number
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          options?: Json
          question?: string
          question_type?: string
          quiz_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "training_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      training_quizzes: {
        Row: {
          course_id: string
          created_at: string
          id: string
          passing_score: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          passing_score?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          passing_score?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      training_track_courses: {
        Row: {
          course_id: string
          created_at: string
          due_after_days: number | null
          id: string
          required: boolean
          sort_order: number
          track_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          due_after_days?: number | null
          id?: string
          required?: boolean
          sort_order?: number
          track_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          due_after_days?: number | null
          id?: string
          required?: boolean
          sort_order?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_track_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_track_courses_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "training_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      training_track_enrollments: {
        Row: {
          assigned_by: string | null
          completed_at: string | null
          created_at: string
          due_date: string | null
          employee_id: string
          id: string
          notes: string | null
          started_at: string | null
          status: string
          track_id: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string
          track_id: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_track_enrollments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_track_enrollments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "training_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      training_tracks: {
        Row: {
          auto_assign_on_hire: boolean
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          role_targets: string[]
          updated_at: string
        }
        Insert: {
          auto_assign_on_hire?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          role_targets?: string[]
          updated_at?: string
        }
        Update: {
          auto_assign_on_hire?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          role_targets?: string[]
          updated_at?: string
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
      user_training_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_training_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "training_badges"
            referencedColumns: ["id"]
          },
        ]
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
      is_academy_trainee: { Args: { _enrollment_id: string }; Returns: boolean }
      log_employee_timeline_event: {
        Args: {
          _description: string
          _employee_id: string
          _event_type: string
          _metadata?: Json
        }
        Returns: undefined
      }
      owns_stage: {
        Args: { _stage_kind: string; _stage_value: string; _user_id: string }
        Returns: boolean
      }
      recalc_course_progress: {
        Args: { _course_id: string; _user_id: string }
        Returns: undefined
      }
      refresh_quiz_knowledge: { Args: { _quiz_id: string }; Returns: undefined }
      upsert_knowledge_chunk: {
        Args: {
          _content: string
          _metadata: Json
          _source_id: string
          _source_title: string
          _source_type: string
          _source_url: string
        }
        Returns: undefined
      }
    }
    Enums: {
      academy_enrollment_status:
        | "not_started"
        | "active"
        | "paused"
        | "completed"
        | "withdrawn"
      academy_module_status:
        | "locked"
        | "available"
        | "in_progress"
        | "submitted"
        | "completed"
        | "waived"
      academy_module_type:
        | "training"
        | "shadowing"
        | "meeting"
        | "video"
        | "sop"
        | "quiz"
        | "reflection"
        | "task"
      academy_path: "new_state" | "existing_state" | "either"
      active_service_status:
        | "Active"
        | "Services on Pause"
        | "Flaked"
        | "Discharged"
      active_staffing_status: "Stable" | "Needs Restaffing" | "In Transition"
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
        | "training_admin"
        | "rbt"
        | "bcba"
      assessment_document_type: "Assessment Notes" | "Treatment Plan"
      assessment_location: "Home" | "School" | "Clinic"
      assessment_status:
        | "Needs Scheduling"
        | "Scheduled"
        | "Completed"
        | "Treatment Plan Pending"
        | "Treatment Plan Submitted"
      assessment_type: "Initial" | "Reassessment" | "Update"
      attendance_exception_kind:
        | "missed_clock_in"
        | "missed_clock_out"
        | "late_arrival"
        | "early_departure"
        | "long_break"
        | "overtime_risk"
        | "manual_edit_pending"
        | "duplicate_punch"
        | "outside_clinic"
      attendance_exception_status:
        | "open"
        | "acknowledged"
        | "resolved"
        | "dismissed"
      auth_kind: "Initial" | "Treatment" | "Reauth"
      auth_status:
        | "Not Submitted"
        | "Submitted"
        | "Approved"
        | "Denied"
        | "Expired"
        | "Expiring Soon"
      billing_claim_status:
        | "Current"
        | "Missing Sessions"
        | "Claims Issue"
        | "Delayed Billing"
      bonus_status: "pending_approval" | "approved" | "paid" | "cancelled"
      bonus_type:
        | "signing"
        | "retention"
        | "referral"
        | "performance"
        | "spot"
        | "holiday"
        | "other"
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
        | "New Lead"
        | "In Contact"
        | "Sent Form"
        | "Missing Information"
        | "Form Received"
        | "Sent to VOB"
        | "VOB Pending"
        | "VOB Received"
        | "Financial Review"
        | "Payment Plan Required"
        | "Payment Plan Received"
        | "Approved for Services"
        | "Not Qualified"
        | "Converted to Client"
        | "Initial Auth – Awaiting Submission"
        | "Initial Auth – Submitted"
        | "Initial Auth – Approved"
        | "Waiting on Consent"
        | "Assessment Completed"
        | "Treatment Plan Pending"
        | "QA Review"
        | "QA Issues / Fix Required"
        | "QA Approved"
        | "Treatment Auth – Awaiting Submission"
        | "Treatment Auth – Submitted"
        | "Treatment Auth – Approved"
        | "Treatment Auth – Denied"
        | "Matching in Progress"
        | "RBT Assigned"
        | "Pending Schedule"
        | "Schedule Created"
        | "Reauth Triggered"
        | "Progress Report Needed"
        | "Progress Report Received"
        | "Reauth Submitted"
        | "Reauth Approved"
        | "Pending Initial Authorization"
        | "Can Not Submit Auth"
      compliance_flag_severity: "Yellow" | "Red"
      compliance_flag_source:
        | "NoteGuard"
        | "Amerigroup"
        | "Billing"
        | "Staffing"
        | "Utilization"
        | "Reauth"
      employee_status:
        | "pending_start"
        | "active"
        | "on_leave"
        | "on_hold"
        | "terminated"
        | "resigned"
      employment_type: "full_time" | "part_time" | "contractor" | "prn"
      financial_review_status:
        | "Pending Review"
        | "Approved"
        | "Payment Plan Required"
        | "Not Viable"
      hr_announcement_audience:
        | "all"
        | "by_state"
        | "by_clinic"
        | "by_department"
        | "by_role"
      hr_announcement_priority: "info" | "important" | "urgent"
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
      hr_resource_category:
        | "handbook"
        | "payroll"
        | "training"
        | "clinical"
        | "it"
        | "benefits"
        | "onboarding"
        | "general"
      hr_resource_kind:
        | "document"
        | "link"
        | "video"
        | "policy"
        | "form"
        | "folder"
      intake_call_status:
        | "Not Attempted"
        | "Attempted"
        | "Contacted"
        | "Connected"
        | "Left Voicemail"
        | "Wrong Number"
        | "Final Attempt"
      intake_communication_type: "call" | "sms" | "email" | "note"
      intake_consent_status: "Not Sent" | "Sent" | "Complete"
      intake_document_type:
        | "Initial Form"
        | "Insurance Card"
        | "VOB File"
        | "Consent Form"
        | "DX Document"
        | "Other"
      intake_form_review_status: "Pending" | "Complete" | "Missing Info"
      intake_form_status: "Not Sent" | "Sent" | "Viewed" | "Complete"
      intake_pipeline_stage:
        | "New Lead"
        | "In Contact"
        | "Sent Form"
        | "Missing Information"
        | "Form Received"
        | "Sent to VOB"
        | "VOB Completed"
        | "Can't Reach"
        | "Can Not Submit Auth"
        | "Sent Packet - Can't Reach"
        | "Non-Qualified"
        | "Needs DX"
      intake_priority: "Hot" | "Warm" | "Cold"
      intake_task_status: "Open" | "In Progress" | "Completed" | "Blocked"
      intake_task_type:
        | "Contact Lead"
        | "Follow Up"
        | "Send Form"
        | "Collect Missing Info"
        | "Review Intake Packet"
        | "Set Insurance"
        | "Set Form Review Status"
        | "Add to Eligipro"
        | "Add to CentralReach"
        | "Collect Missing Documentation"
        | "Submit to Solum"
        | "Send Payment Plan"
        | "Follow Up with Family"
        | "Confirm Payment Plan Signed"
      intake_vob_status:
        | "Not Sent"
        | "Sent"
        | "Received"
        | "Approved"
        | "Payment Plan Required"
      notes_compliance_status:
        | "Compliant"
        | "Needs Review"
        | "Flagged"
        | "Repeated Errors"
      pay_change_kind:
        | "raise"
        | "promotion"
        | "demotion"
        | "adjustment"
        | "rate_correction"
        | "title_change"
      pay_change_status: "proposed" | "approved" | "effective" | "reverted"
      pay_type: "hourly" | "salaried"
      payment_plan_status:
        | "Not Required"
        | "Sent"
        | "Awaiting Signature"
        | "Signed"
        | "Approved"
        | "Declined"
        | "Not Qualified"
      payroll_run_status:
        | "open"
        | "ready"
        | "submitted"
        | "posted"
        | "closed"
        | "rejected"
      progress_report_status: "Not Started" | "In Progress" | "Received"
      punch_kind: "clock_in" | "clock_out" | "break_start" | "break_end"
      punch_source: "kiosk" | "manual" | "manager_edit" | "import"
      punch_status: "pending" | "approved" | "rejected" | "locked"
      qa_error_type:
        | "Missing Treatment Plan"
        | "Missing Supporting Docs"
        | "Formatting Error"
        | "Clinical Accuracy"
        | "Incomplete Notes"
        | "Billing Risk"
        | "Other"
      qa_monitoring_status: "Open" | "In Progress" | "Resolved"
      qa_monitoring_type: "NoteGuard" | "Amerigroup" | "RBT Check-In"
      qa_review_status:
        | "Awaiting Review"
        | "In Review"
        | "Issues Found"
        | "Ready for Submission"
        | "Submitted to Auth"
      qa_status: "Not Started" | "In Review" | "Complete"
      reauth_cycle_status:
        | "Not Started"
        | "BCBA Notified"
        | "In Progress"
        | "Report Received"
        | "QA Review"
        | "Submitted"
        | "Approved"
        | "Failed / Delayed"
      reauth_qa_status: "Not Started" | "In Review" | "Passed" | "Failed"
      reauth_submission_status:
        | "Not Submitted"
        | "Ready"
        | "Submitted"
        | "Approved"
        | "Denied"
      review_rating:
        | "exceeds"
        | "meets"
        | "developing"
        | "needs_improvement"
        | "unsatisfactory"
      review_status:
        | "draft"
        | "manager_review"
        | "employee_acknowledge"
        | "completed"
        | "cancelled"
      review_type:
        | "30_day"
        | "60_day"
        | "90_day"
        | "annual"
        | "probationary"
        | "ad_hoc"
      schedule_day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
      scheduling_status:
        | "Pending Schedule"
        | "Schedule Created"
        | "Pending Start"
        | "Active"
      service_claim_status: "Not Submitted" | "Submitted" | "Paid" | "Issue"
      service_note_status: "Pending" | "Submitted" | "Flagged" | "Corrected"
      session_delivery_status:
        | "Scheduled"
        | "Delivered"
        | "Missed"
        | "Cancelled"
      staffing_match_status: "Suggested" | "Pending" | "Assigned" | "Rejected"
      staffing_status: "Not Needed" | "Needed" | "In Progress" | "Assigned"
      timeline_event_type:
        | "system"
        | "auth"
        | "staffing"
        | "schedule"
        | "qa"
        | "note"
        | "stage"
      timesheet_status:
        | "draft"
        | "submitted"
        | "approved"
        | "rejected"
        | "locked"
      training_audience: "rbt" | "bcba" | "both"
      training_followup_status: "pending" | "completed" | "snoozed" | "skipped"
      training_status:
        | "assigned"
        | "in_progress"
        | "completed"
        | "expired"
        | "waived"
      work_setting:
        | "clinic"
        | "home"
        | "hybrid"
        | "admin"
        | "field"
        | "office"
        | "leadership"
        | "intake"
        | "recruiting"
        | "scheduling"
        | "state_director"
        | "operations"
        | "systems"
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
      academy_enrollment_status: [
        "not_started",
        "active",
        "paused",
        "completed",
        "withdrawn",
      ],
      academy_module_status: [
        "locked",
        "available",
        "in_progress",
        "submitted",
        "completed",
        "waived",
      ],
      academy_module_type: [
        "training",
        "shadowing",
        "meeting",
        "video",
        "sop",
        "quiz",
        "reflection",
        "task",
      ],
      academy_path: ["new_state", "existing_state", "either"],
      active_service_status: [
        "Active",
        "Services on Pause",
        "Flaked",
        "Discharged",
      ],
      active_staffing_status: ["Stable", "Needs Restaffing", "In Transition"],
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
        "training_admin",
        "rbt",
        "bcba",
      ],
      assessment_document_type: ["Assessment Notes", "Treatment Plan"],
      assessment_location: ["Home", "School", "Clinic"],
      assessment_status: [
        "Needs Scheduling",
        "Scheduled",
        "Completed",
        "Treatment Plan Pending",
        "Treatment Plan Submitted",
      ],
      assessment_type: ["Initial", "Reassessment", "Update"],
      attendance_exception_kind: [
        "missed_clock_in",
        "missed_clock_out",
        "late_arrival",
        "early_departure",
        "long_break",
        "overtime_risk",
        "manual_edit_pending",
        "duplicate_punch",
        "outside_clinic",
      ],
      attendance_exception_status: [
        "open",
        "acknowledged",
        "resolved",
        "dismissed",
      ],
      auth_kind: ["Initial", "Treatment", "Reauth"],
      auth_status: [
        "Not Submitted",
        "Submitted",
        "Approved",
        "Denied",
        "Expired",
        "Expiring Soon",
      ],
      billing_claim_status: [
        "Current",
        "Missing Sessions",
        "Claims Issue",
        "Delayed Billing",
      ],
      bonus_status: ["pending_approval", "approved", "paid", "cancelled"],
      bonus_type: [
        "signing",
        "retention",
        "referral",
        "performance",
        "spot",
        "holiday",
        "other",
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
        "New Lead",
        "In Contact",
        "Sent Form",
        "Missing Information",
        "Form Received",
        "Sent to VOB",
        "VOB Pending",
        "VOB Received",
        "Financial Review",
        "Payment Plan Required",
        "Payment Plan Received",
        "Approved for Services",
        "Not Qualified",
        "Converted to Client",
        "Initial Auth – Awaiting Submission",
        "Initial Auth – Submitted",
        "Initial Auth – Approved",
        "Waiting on Consent",
        "Assessment Completed",
        "Treatment Plan Pending",
        "QA Review",
        "QA Issues / Fix Required",
        "QA Approved",
        "Treatment Auth – Awaiting Submission",
        "Treatment Auth – Submitted",
        "Treatment Auth – Approved",
        "Treatment Auth – Denied",
        "Matching in Progress",
        "RBT Assigned",
        "Pending Schedule",
        "Schedule Created",
        "Reauth Triggered",
        "Progress Report Needed",
        "Progress Report Received",
        "Reauth Submitted",
        "Reauth Approved",
        "Pending Initial Authorization",
        "Can Not Submit Auth",
      ],
      compliance_flag_severity: ["Yellow", "Red"],
      compliance_flag_source: [
        "NoteGuard",
        "Amerigroup",
        "Billing",
        "Staffing",
        "Utilization",
        "Reauth",
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
      financial_review_status: [
        "Pending Review",
        "Approved",
        "Payment Plan Required",
        "Not Viable",
      ],
      hr_announcement_audience: [
        "all",
        "by_state",
        "by_clinic",
        "by_department",
        "by_role",
      ],
      hr_announcement_priority: ["info", "important", "urgent"],
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
      hr_resource_category: [
        "handbook",
        "payroll",
        "training",
        "clinical",
        "it",
        "benefits",
        "onboarding",
        "general",
      ],
      hr_resource_kind: [
        "document",
        "link",
        "video",
        "policy",
        "form",
        "folder",
      ],
      intake_call_status: [
        "Not Attempted",
        "Attempted",
        "Contacted",
        "Connected",
        "Left Voicemail",
        "Wrong Number",
        "Final Attempt",
      ],
      intake_communication_type: ["call", "sms", "email", "note"],
      intake_consent_status: ["Not Sent", "Sent", "Complete"],
      intake_document_type: [
        "Initial Form",
        "Insurance Card",
        "VOB File",
        "Consent Form",
        "DX Document",
        "Other",
      ],
      intake_form_review_status: ["Pending", "Complete", "Missing Info"],
      intake_form_status: ["Not Sent", "Sent", "Viewed", "Complete"],
      intake_pipeline_stage: [
        "New Lead",
        "In Contact",
        "Sent Form",
        "Missing Information",
        "Form Received",
        "Sent to VOB",
        "VOB Completed",
        "Can't Reach",
        "Can Not Submit Auth",
        "Sent Packet - Can't Reach",
        "Non-Qualified",
        "Needs DX",
      ],
      intake_priority: ["Hot", "Warm", "Cold"],
      intake_task_status: ["Open", "In Progress", "Completed", "Blocked"],
      intake_task_type: [
        "Contact Lead",
        "Follow Up",
        "Send Form",
        "Collect Missing Info",
        "Review Intake Packet",
        "Set Insurance",
        "Set Form Review Status",
        "Add to Eligipro",
        "Add to CentralReach",
        "Collect Missing Documentation",
        "Submit to Solum",
        "Send Payment Plan",
        "Follow Up with Family",
        "Confirm Payment Plan Signed",
      ],
      intake_vob_status: [
        "Not Sent",
        "Sent",
        "Received",
        "Approved",
        "Payment Plan Required",
      ],
      notes_compliance_status: [
        "Compliant",
        "Needs Review",
        "Flagged",
        "Repeated Errors",
      ],
      pay_change_kind: [
        "raise",
        "promotion",
        "demotion",
        "adjustment",
        "rate_correction",
        "title_change",
      ],
      pay_change_status: ["proposed", "approved", "effective", "reverted"],
      pay_type: ["hourly", "salaried"],
      payment_plan_status: [
        "Not Required",
        "Sent",
        "Awaiting Signature",
        "Signed",
        "Approved",
        "Declined",
        "Not Qualified",
      ],
      payroll_run_status: [
        "open",
        "ready",
        "submitted",
        "posted",
        "closed",
        "rejected",
      ],
      progress_report_status: ["Not Started", "In Progress", "Received"],
      punch_kind: ["clock_in", "clock_out", "break_start", "break_end"],
      punch_source: ["kiosk", "manual", "manager_edit", "import"],
      punch_status: ["pending", "approved", "rejected", "locked"],
      qa_error_type: [
        "Missing Treatment Plan",
        "Missing Supporting Docs",
        "Formatting Error",
        "Clinical Accuracy",
        "Incomplete Notes",
        "Billing Risk",
        "Other",
      ],
      qa_monitoring_status: ["Open", "In Progress", "Resolved"],
      qa_monitoring_type: ["NoteGuard", "Amerigroup", "RBT Check-In"],
      qa_review_status: [
        "Awaiting Review",
        "In Review",
        "Issues Found",
        "Ready for Submission",
        "Submitted to Auth",
      ],
      qa_status: ["Not Started", "In Review", "Complete"],
      reauth_cycle_status: [
        "Not Started",
        "BCBA Notified",
        "In Progress",
        "Report Received",
        "QA Review",
        "Submitted",
        "Approved",
        "Failed / Delayed",
      ],
      reauth_qa_status: ["Not Started", "In Review", "Passed", "Failed"],
      reauth_submission_status: [
        "Not Submitted",
        "Ready",
        "Submitted",
        "Approved",
        "Denied",
      ],
      review_rating: [
        "exceeds",
        "meets",
        "developing",
        "needs_improvement",
        "unsatisfactory",
      ],
      review_status: [
        "draft",
        "manager_review",
        "employee_acknowledge",
        "completed",
        "cancelled",
      ],
      review_type: [
        "30_day",
        "60_day",
        "90_day",
        "annual",
        "probationary",
        "ad_hoc",
      ],
      schedule_day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      scheduling_status: [
        "Pending Schedule",
        "Schedule Created",
        "Pending Start",
        "Active",
      ],
      service_claim_status: ["Not Submitted", "Submitted", "Paid", "Issue"],
      service_note_status: ["Pending", "Submitted", "Flagged", "Corrected"],
      session_delivery_status: [
        "Scheduled",
        "Delivered",
        "Missed",
        "Cancelled",
      ],
      staffing_match_status: ["Suggested", "Pending", "Assigned", "Rejected"],
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
      timesheet_status: [
        "draft",
        "submitted",
        "approved",
        "rejected",
        "locked",
      ],
      training_audience: ["rbt", "bcba", "both"],
      training_followup_status: ["pending", "completed", "snoozed", "skipped"],
      training_status: [
        "assigned",
        "in_progress",
        "completed",
        "expired",
        "waived",
      ],
      work_setting: [
        "clinic",
        "home",
        "hybrid",
        "admin",
        "field",
        "office",
        "leadership",
        "intake",
        "recruiting",
        "scheduling",
        "state_director",
        "operations",
        "systems",
      ],
    },
  },
} as const
