export type PreboardingStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "approved"
  | "rejected"
  | "waived"
  | "complete";

export interface PreboardingRequirement {
  id: string;
  key: string;
  label: string;
  description: string | null;
  category: string;
  sort_order: number;
  owner_role: string;
  employee_instructions: string | null;
  internal_instructions: string | null;
  is_required: boolean;
  requires_approval: boolean;
  requires_file: boolean;
  external_system: string | null;
  external_action_label: string | null;
  external_action_url: string | null;
  applies_to_stages: string[];
  applies_to_states: string[] | null;
  default_due_offset_days: number | null;
  advances_gate_key: string | null;
  is_active: boolean;
}

export interface PreboardingItem {
  id: string;
  employee_id: string;
  requirement_key: string;
  status: PreboardingStatus;
  owner_role: string;
  assigned_to: string | null;
  due_at: string | null;
  submitted_at: string | null;
  submitted_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  file_path: string | null;
  file_name: string | null;
  metadata: Record<string, unknown>;
  last_reminded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PreboardingComment {
  id: string;
  item_id: string;
  author_id: string;
  author_role: string | null;
  body: string;
  visibility: "all" | "internal";
  created_at: string;
}

export interface PreboardingAudit {
  id: string;
  item_id: string;
  actor_id: string | null;
  action: string;
  from_status: string | null;
  to_status: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export const STATUS_META: Record<PreboardingStatus, { label: string; tone: string }> = {
  not_started: { label: "Not started", tone: "text-muted-foreground" },
  in_progress: { label: "In progress", tone: "text-primary" },
  submitted:   { label: "Submitted", tone: "text-primary" },
  approved:    { label: "Approved", tone: "text-primary" },
  complete:    { label: "Complete", tone: "text-primary" },
  waived:      { label: "Waived", tone: "text-muted-foreground" },
  rejected:    { label: "Needs revision", tone: "text-destructive" },
};

export function isDone(status: PreboardingStatus) {
  return status === "approved" || status === "complete" || status === "waived";
}