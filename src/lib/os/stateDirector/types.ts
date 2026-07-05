/**
 * State Director operating layer — typed contracts.
 *
 * These types are intentionally decoupled from any specific persistence
 * mechanism (localStorage today, Supabase tables tomorrow) and from any
 * specific integration source (CentralReach, CTM, Apploi, etc). Adapters
 * mapped in `integrationAdapters.ts` normalize external data into these
 * shapes so the UI never depends on a source-of-truth vendor.
 */

export type StateCode = "GA" | "NC" | "TN" | "VA" | "MD" | string;

export type HealthLabel = "Healthy" | "Stable" | "Watch" | "Risk" | "Critical";

export type Priority = "urgent" | "high" | "medium" | "low";

export type EscalationStatus =
  | "open"
  | "in_review"
  | "waiting"
  | "escalated"
  | "resolved";

export type TaskStatus =
  | "open"
  | "in_progress"
  | "waiting"
  | "blocked"
  | "completed"
  | "escalated";

export type Department =
  | "Intake"
  | "Authorizations"
  | "Staffing"
  | "Scheduling"
  | "Clinical"
  | "QA"
  | "Recruiting"
  | "HR"
  | "Billing"
  | "Growth"
  | "Operations";

export interface StateProfile {
  code: StateCode;
  name: string;
  active: boolean;
  stateDirector?: string;
  assistantStateDirector?: string;
  stateVa?: string;
  bdRep?: string;
  regions: string[];
}

export interface StateMetrics {
  code: StateCode;
  healthScore: number;              // 0-100
  healthLabel: HealthLabel;
  activeClients: number;
  authorizedHours: number;
  scheduledHours: number;
  deliveredHours: number;
  staffingGaps: number;
  intakePipeline: number;
  authsExpiring30d: number;
  clinicalRisks: number;
  recruitingNeeds: number;
  cancellationRisk: number;         // % or count
  openEscalations: number;
  openTasks: number;
  agingBlockers: number;
  updatedAt: string;
}

export interface EscalationNote {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface Escalation {
  id: string;
  state: StateCode;
  title: string;
  description?: string;
  department: Department;
  assignedTo?: string;
  priority: Priority;
  status: EscalationStatus;
  dueAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  linkedClientId?: string;
  linkedLeadId?: string;
  linkedCandidateId?: string;
  linkedAuthorizationId?: string;
  linkedSchedulingItemId?: string;
  sourceModule?: string;
  metadata?: Record<string, unknown>;
  notes: EscalationNote[];
  resolution?: string;
  centralreachSyncStatus?: string;
}

export interface OpsTask {
  id: string;
  state: StateCode;
  title: string;
  description?: string;
  department: Department;
  owner?: string;
  priority: Priority;
  status: TaskStatus;
  dueAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  relatedEscalationId?: string;
  linkedClientId?: string;
  linkedLeadId?: string;
  linkedCandidateId?: string;
  linkedAuthorizationId?: string;
  linkedSchedulingItemId?: string;
  sourceModule?: string;
  metadata?: Record<string, unknown>;
  notes: EscalationNote[];
  completedAt?: string;
  centralreachSyncStatus?: string;
}

export type ActivityKind =
  | "escalation_created"
  | "escalation_updated"
  | "escalation_assigned"
  | "escalation_resolved"
  | "escalation_reopened"
  | "task_created"
  | "task_updated"
  | "task_assigned"
  | "task_completed"
  | "task_escalated"
  | "note_added"
  | "health_changed"
  | "snapshot_opened"
  | "handoff";

export interface ActivityEvent {
  id: string;
  state?: StateCode;
  kind: ActivityKind;
  message: string;
  actor: string;
  createdAt: string;
  relatedId?: string;
}

export interface StateDirectorSnapshot {
  profiles: StateProfile[];
  metrics: Record<StateCode, StateMetrics>;
  escalations: Escalation[];
  tasks: OpsTask[];
  activity: ActivityEvent[];
}

/** Adapter contract — any persistence layer must satisfy this. */
export interface StateDirectorAdapter {
  read(): StateDirectorSnapshot;
  write(next: StateDirectorSnapshot): void;
  subscribe(cb: (snap: StateDirectorSnapshot) => void): () => void;
}