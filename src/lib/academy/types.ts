export type AcademyModuleType = "training" | "shadowing" | "meeting" | "video" | "sop" | "quiz" | "reflection" | "task";
export type AcademyModuleStatus = "locked" | "available" | "in_progress" | "submitted" | "completed" | "waived";
export type AcademyEnrollmentStatus = "not_started" | "active" | "paused" | "completed" | "withdrawn";
export type AcademyPath = "new_state" | "existing_state" | "either";

export interface AcademyTrack { id: string; name: string; description: string | null; is_active: boolean; }
export interface AcademyPhase { id: string; track_id: string; position: number; name: string; tagline: string | null; color_token: string; }
export interface AcademyWeek { id: string; phase_id: string; week_number: number; title: string; objective: string | null; outcomes: string[]; }
export interface AcademyModule {
  id: string; week_id: string; position: number; title: string; description: string | null;
  module_type: AcademyModuleType; duration_label: string | null; leader_name: string | null;
  department: string | null; is_required: boolean; applies_to: AcademyPath;
  applies_to_new_state_only: boolean; quiz: any;
  link_url?: string | null; cover_image_url?: string | null; video_url?: string | null;
}
export interface AcademyEnrollment {
  id: string; employee_id: string; track_id: string; start_date: string;
  status: AcademyEnrollmentStatus; path: AcademyPath; assigned_state: string | null;
  mentor_employee_id: string | null; current_week_id: string | null; notes: string | null;
}
export interface AcademyProgress {
  id: string; enrollment_id: string; module_id: string; status: AcademyModuleStatus;
  score: number | null; reflection: string | null; verified_by_name: string | null;
  verified_at: string | null; started_at: string | null; completed_at: string | null;
}
export interface AcademyShadowSession {
  id: string; enrollment_id: string; module_id: string | null; shadowed_employee_id: string | null;
  shadowed_name: string | null; department: string | null; session_date: string; hours: number;
  notes: string | null; mentor_signoff: boolean; signoff_by_name: string | null; signoff_at: string | null;
}
export interface AcademyCheckin {
  id: string; enrollment_id: string; module_id: string | null; with_employee_id: string | null;
  with_name: string | null; meeting_date: string; agenda: string | null; notes: string | null;
  action_items: string | null; leader_rating: number | null; created_by_name: string | null; created_at: string;
}

export const MODULE_TYPE_META: Record<AcademyModuleType, { label: string; tone: string; icon: string }> = {
  training: { label: "Training", tone: "bg-primary/10 text-primary border-primary/20", icon: "BookOpen" },
  shadowing: { label: "Shadowing", tone: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", icon: "Eye" },
  meeting: { label: "Meeting", tone: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20", icon: "Users" },
  video: { label: "Video", tone: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20", icon: "PlayCircle" },
  sop: { label: "SOP", tone: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20", icon: "FileText" },
  quiz: { label: "Quiz", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20", icon: "ClipboardCheck" },
  reflection: { label: "Reflection", tone: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20", icon: "Pencil" },
  task: { label: "Task", tone: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20", icon: "CheckSquare" },
};

export const PHASE_COLORS: Record<string, { bar: string; chip: string; soft: string }> = {
  primary: { bar: "bg-primary", chip: "bg-primary/10 text-primary border-primary/20", soft: "from-primary/10 to-primary/0" },
  teal: { bar: "bg-teal-500", chip: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20", soft: "from-teal-500/10 to-teal-500/0" },
  amber: { bar: "bg-amber-500", chip: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", soft: "from-amber-500/10 to-amber-500/0" },
  violet: { bar: "bg-violet-500", chip: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20", soft: "from-violet-500/10 to-violet-500/0" },
};