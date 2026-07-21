import { supabase } from "@/integrations/supabase/client";

// --------------------------------------------------------------------------
// RBT Training Academy — canonical adapter
// Single source of truth for pathway/step/progress + config, owner, trainer,
// retention, and fellowship-readiness reads/writes. Consumed by:
//   • src/pages/rbt/app/RbtAcademy.tsx and useProgram
//   • src/pages/bcba/BcbaSupervision.tsx (assigned-trainee sign-off)
//   • src/pages/os/OSRBTTrainingManagement.tsx (Training Admin)
//   • Fellowship Explorer gating
// --------------------------------------------------------------------------

export type TrainerKind = "lead_rbt" | "floater_lead_rbt" | "assigned_bcba";

export interface TrainingConfigRow {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
}

export interface OwnerAssignmentRow {
  owner_key: string;
  label: string;
  description: string | null;
  user_id: string | null;
  employee_id: string | null;
  assigned_at: string | null;
}

export interface TraineeAssignmentRow {
  id: string;
  trainee_user_id: string;
  trainer_user_id: string;
  trainer_kind: TrainerKind;
  pathway_id: string | null;
  active: boolean;
  assigned_at: string;
  notes: string | null;
}

export interface RetentionCheckin {
  id: string;
  trainee_user_id: string;
  first_session_at: string | null;
  due_at: string;
  completed_at: string | null;
  status: "due" | "overdue" | "completed" | "escalated" | "cancelled";
  owner_key: string;
  owner_user_id: string | null;
  overall_feeling: string | null;
  family_barriers: string | null;
  bcba_barriers: string | null;
  bcba_supervised: boolean | null;
  bcba_instructions_given: boolean | null;
  confidence_1_5: number | null;
  additional_support_needed: boolean;
  additional_support_notes: string | null;
  escalated_at: string | null;
  escalated_reason: string | null;
}

export interface DevelopingBand {
  min: number;
  max: number;
  action:
    | "repeat_lead_session"
    | "staff_case_lead_first_session"
    | "staff_case_bcba_first_session";
}

export interface PathwaySummary {
  id: string;
  key: string;
  name: string;
  description: string | null;
  metadata: Record<string, any>;
  step_count: number;
  alias_of_key?: string | null;
}

export interface StepSummary {
  id: string;
  pathway_id: string;
  key: string;
  title: string;
  description: string | null;
  kind: string;
  order_index: number;
  estimated_days: number | null;
  delivery_mode: string | null;
  required: boolean;
  metadata: Record<string, any>;
}

/** Non-overlapping bands. Deterministic — lower band wins on ties by min. */
export function classifyDevelopingScore(
  score: number,
  bands: DevelopingBand[],
): DevelopingBand | null {
  const sorted = [...bands].sort((a, b) => a.min - b.min);
  for (const b of sorted) if (score >= b.min && score <= b.max) return b;
  return null;
}

/** Validates that bands are contiguous with no gap or overlap. */
export function validateBands(bands: DevelopingBand[]): {
  ok: boolean;
  error?: string;
} {
  const sorted = [...bands].sort((a, b) => a.min - b.min);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].min > sorted[i].max) return { ok: false, error: `band ${i} min>max` };
    if (i > 0 && sorted[i].min !== sorted[i - 1].max + 1)
      return { ok: false, error: `gap or overlap between band ${i - 1} and ${i}` };
  }
  return { ok: true };
}

/**
 * Resolve an aliased pathway to its canonical key. Never returns the alias itself;
 * this is how the assignment resolver keeps "certified w/o experience" pointing
 * at "under_2_years" without duplicating progress.
 */
export function resolveAliasKey(
  key: string,
  all: Pick<PathwaySummary, "key" | "metadata">[],
): string {
  const p = all.find((x) => x.key === key);
  const alias = p?.metadata?.alias_of_key;
  return typeof alias === "string" && alias.length ? alias : key;
}

// Never infer trainer/BCBA ownership from CentralReach shared clients or billing rows.
// Ownership is *only* rbt_trainee_assignments (active) — enforced by the DB helper
// functions rbt_is_assigned_trainer / rbt_is_assigned_bcba.
export const OWNERSHIP_SOURCE = "rbt_trainee_assignments" as const;

// ---- reads ---------------------------------------------------------------

export async function loadTrainingConfig(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from("rbt_training_config" as any)
    .select("key,value,description,updated_at");
  if (error) throw error;
  const out: Record<string, unknown> = {};
  for (const r of (data as any[]) ?? []) out[r.key] = r.value;
  return out;
}

export async function loadOwnerAssignments(): Promise<OwnerAssignmentRow[]> {
  const { data, error } = await supabase
    .from("rbt_training_owner_assignments" as any)
    .select("owner_key,label,description,user_id,employee_id,assigned_at")
    .order("label");
  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function loadPathways(): Promise<PathwaySummary[]> {
  const { data, error } = await supabase
    .from("rbt_pathways" as any)
    .select("id,key,name,description,metadata")
    .order("name");
  if (error) throw error;
  const rows = (data as any[]) ?? [];
  const { data: sc } = await supabase
    .from("rbt_pathway_steps" as any)
    .select("pathway_id");
  const counts = new Map<string, number>();
  for (const r of (sc as any[]) ?? []) counts.set(r.pathway_id, (counts.get(r.pathway_id) ?? 0) + 1);
  return rows.map((r) => ({
    ...r,
    metadata: r.metadata ?? {},
    step_count: counts.get(r.id) ?? 0,
    alias_of_key: r.metadata?.alias_of_key ?? null,
  }));
}

export async function loadStepsFor(pathwayId: string): Promise<StepSummary[]> {
  const { data, error } = await supabase
    .from("rbt_pathway_steps" as any)
    .select("id,pathway_id,key,title,description,kind,order_index,estimated_days,delivery_mode,required,metadata")
    .eq("pathway_id", pathwayId)
    .order("order_index");
  if (error) throw error;
  return ((data as any[]) ?? []).map((r) => ({ ...r, metadata: r.metadata ?? {} }));
}

export async function loadTraineeAssignmentsFor(
  userId: string,
  role: "trainee" | "trainer",
): Promise<TraineeAssignmentRow[]> {
  const q = supabase.from("rbt_trainee_assignments" as any).select("*").eq("active", true);
  const { data, error } = await (role === "trainee"
    ? q.eq("trainee_user_id", userId)
    : q.eq("trainer_user_id", userId));
  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function loadRetentionCheckinsFor(
  userId: string,
  role: "trainee" | "trainer",
): Promise<RetentionCheckin[]> {
  const q = supabase
    .from("rbt_retention_checkins" as any)
    .select("*")
    .order("due_at", { ascending: true });
  const { data, error } = await (role === "trainee"
    ? q.eq("trainee_user_id", userId)
    : q);
  if (error) throw error;
  return (data as any[]) ?? [];
}

/**
 * Compute the derived status of a check-in without requiring a DB write.
 * The cron/RPC eventually persists `overdue`, but the UI should show the
 * derived state immediately.
 */
export function deriveCheckinStatus(
  row: Pick<RetentionCheckin, "status" | "due_at" | "completed_at">,
  now: Date = new Date(),
): RetentionCheckin["status"] {
  if (row.status === "completed" || row.status === "escalated" || row.status === "cancelled")
    return row.status;
  if (row.completed_at) return "completed";
  return new Date(row.due_at).getTime() < now.getTime() ? "overdue" : "due";
}

/**
 * Returns true when the trainee has completed every required step on their
 * active pathway. Reads the SECURITY DEFINER helper directly.
 */
export async function isReadyForFellowship(employeeId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc(
    "rbt_academy_ready_for_fellowship" as any,
    { _employee: employeeId },
  );
  if (error) return false;
  return Boolean(data);
}

// ---- writes (scoped by RLS) ---------------------------------------------

export async function upsertOwnerAssignment(
  ownerKey: string,
  userId: string | null,
) {
  const { error } = await supabase
    .from("rbt_training_owner_assignments" as any)
    .update({ user_id: userId, assigned_at: new Date().toISOString() })
    .eq("owner_key", ownerKey);
  if (error) throw error;
}

export async function upsertTrainingConfig(
  key: string,
  value: unknown,
  description?: string,
) {
  const { error } = await supabase
    .from("rbt_training_config" as any)
    .upsert({ key, value, description }, { onConflict: "key" });
  if (error) throw error;
}

export async function upsertTraineeAssignment(row: {
  trainee_user_id: string;
  trainer_user_id: string;
  trainer_kind: TrainerKind;
  pathway_id?: string | null;
  notes?: string | null;
}) {
  // Deactivate any existing active assignment for this trainee+kind, then insert.
  await supabase
    .from("rbt_trainee_assignments" as any)
    .update({ active: false, ended_at: new Date().toISOString() })
    .eq("trainee_user_id", row.trainee_user_id)
    .eq("trainer_kind", row.trainer_kind)
    .eq("active", true);
  const { error } = await supabase
    .from("rbt_trainee_assignments" as any)
    .insert({ ...row, active: true });
  if (error) throw error;
}

export async function createRetentionCheckin(row: {
  trainee_user_id: string;
  first_session_at?: string | null;
  due_at: string;
  owner_key?: string;
  owner_user_id?: string | null;
}) {
  const { error } = await supabase
    .from("rbt_retention_checkins" as any)
    .insert({
      ...row,
      owner_key: row.owner_key ?? "floater_lead_rbt",
      status: "due",
    });
  if (error) throw error;
}

export async function completeRetentionCheckin(
  id: string,
  payload: Partial<RetentionCheckin>,
) {
  const escalate = payload.additional_support_needed === true;
  const { error } = await supabase
    .from("rbt_retention_checkins" as any)
    .update({
      ...payload,
      completed_at: new Date().toISOString(),
      status: escalate ? "escalated" : "completed",
      escalated_at: escalate ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw error;
}