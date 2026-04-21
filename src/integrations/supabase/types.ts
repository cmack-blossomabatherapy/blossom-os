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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
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
    },
  },
} as const
