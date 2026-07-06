/**
 * Executive Leadership operating-layer service.
 *
 * Backs the /executive, /command-center, /operations/escalations,
 * /system/request-intake, and other leadership pages with persistent
 * records instead of toast-only actions.
 *
 * Tables (created in migration 20260706_executive_foundation):
 *   - executive_work_items
 *   - executive_decisions
 *   - executive_briefings
 *   - executive_updates
 *   - executive_risks
 *   - executive_kpi_snapshots
 *   - executive_saved_views
 *   - executive_activity_log
 *   - shared_report_recents
 *
 * RLS: all authenticated users can read leadership records for
 * company-wide visibility; only leadership roles can create/update/delete.
 * Saved views and shared_report_recents are strictly per-user.
 *
 * Pass A (this pass) provides the persistence layer + hooks.
 * Pass B wires each Executive page's actions to these helpers.
 */
import { supabase } from "@/integrations/supabase/client";

export type ExecutiveWorkItem = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  department: string | null;
  state_code: string | null;
  priority: string;
  status: string;
  owner_user_id: string | null;
  owner_name: string | null;
  due_date: string | null;
  source_page: string | null;
  source_system: string | null;
  related_route: string | null;
  related_record_type: string | null;
  related_record_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ExecutiveWorkItemInput = Partial<
  Omit<ExecutiveWorkItem, "id" | "created_at" | "updated_at">
> & { title: string };

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/* ------------------------- Work items ------------------------- */

export async function listExecutiveWorkItems(filters?: {
  status?: string;
  department?: string;
  state_code?: string;
  limit?: number;
}): Promise<ExecutiveWorkItem[]> {
  let q = supabase
    .from("executive_work_items")
    .select("*")
    .order("created_at", { ascending: false });
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.department) q = q.eq("department", filters.department);
  if (filters?.state_code) q = q.eq("state_code", filters.state_code);
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ExecutiveWorkItem[];
}

export async function createExecutiveWorkItem(
  input: ExecutiveWorkItemInput,
): Promise<ExecutiveWorkItem> {
  const uid = await currentUserId();
  const payload = { ...input, created_by: uid, updated_by: uid };
  const { data, error } = await supabase
    .from("executive_work_items")
    .insert(payload as never)
    .select("*")
    .single();
  if (error) throw error;
  await logExecutiveActivity({
    action: "work_item.created",
    entity_type: "executive_work_item",
    entity_id: data.id,
    summary: `Created action item: ${data.title}`,
  });
  return data as ExecutiveWorkItem;
}

export async function updateExecutiveWorkItem(
  id: string,
  patch: Partial<ExecutiveWorkItemInput> & { status?: string },
): Promise<ExecutiveWorkItem> {
  const uid = await currentUserId();
  const payload: Record<string, unknown> = { ...patch, updated_by: uid };
  if (patch.status === "completed" && !("completed_at" in patch)) {
    payload.completed_at = new Date().toISOString();
  }
  const { data, error } = await supabase
    .from("executive_work_items")
    .update(payload as never)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  await logExecutiveActivity({
    action: "work_item.updated",
    entity_type: "executive_work_item",
    entity_id: id,
    summary: patch.status ? `Status → ${patch.status}` : "Updated",
  });
  return data as ExecutiveWorkItem;
}

/* ------------------------- Decisions ------------------------- */

export async function listExecutiveDecisions(limit = 50) {
  const { data, error } = await supabase
    .from("executive_decisions")
    .select("*")
    .order("decision_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function createExecutiveDecision(
  input: {
    title: string;
    summary?: string | null;
    decision_body?: string | null;
    department?: string | null;
    state_code?: string | null;
    related_route?: string | null;
  },
) {
  const uid = await currentUserId();
  const { data, error } = await supabase
    .from("executive_decisions")
    .insert({ ...input, created_by: uid, updated_by: uid } as never)
    .select("*")
    .single();
  if (error) throw error;
  await logExecutiveActivity({
    action: "decision.created",
    entity_type: "executive_decision",
    entity_id: data.id,
    summary: data.title,
  });
  return data;
}

/* ------------------------- Risks ------------------------- */

export async function listExecutiveRisks(status?: string) {
  let q = supabase.from("executive_risks").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createExecutiveRisk(input: {
  title: string;
  description?: string | null;
  category?: string | null;
  department?: string | null;
  state_code?: string | null;
  severity?: string;
  likelihood?: string;
  mitigation_plan?: string | null;
  due_date?: string | null;
  owner_user_id?: string | null;
}) {
  const uid = await currentUserId();
  const { data, error } = await supabase
    .from("executive_risks")
    .insert({ ...input, created_by: uid, updated_by: uid } as never)
    .select("*")
    .single();
  if (error) throw error;
  await logExecutiveActivity({
    action: "risk.created",
    entity_type: "executive_risk",
    entity_id: data.id,
    summary: data.title,
  });
  return data;
}

/* ------------------------- Updates ------------------------- */

export async function listExecutiveUpdates(limit = 20) {
  const { data, error } = await supabase
    .from("executive_updates")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function createExecutiveUpdate(input: {
  title: string;
  body?: string | null;
  audience?: string;
  department?: string | null;
  state_code?: string | null;
  pinned?: boolean;
  publish?: boolean;
}) {
  const uid = await currentUserId();
  const { publish, ...rest } = input;
  const payload = {
    ...rest,
    audience: input.audience ?? "company",
    created_by: uid,
    published_at: publish ? new Date().toISOString() : null,
  };
  const { data, error } = await supabase
    .from("executive_updates")
    .insert(payload as never)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/* ------------------------- Briefings ------------------------- */

export async function createExecutiveBriefing(input: {
  title: string;
  period_start?: string | null;
  period_end?: string | null;
  body?: string | null;
  department?: string | null;
  state_code?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const uid = await currentUserId();
  const { data, error } = await supabase
    .from("executive_briefings")
    .insert({ ...input, created_by: uid } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/* ------------------------- KPI snapshots ------------------------- */

export async function captureExecutiveKpiSnapshot(input: {
  metric_key: string;
  metric_label?: string | null;
  metric_value: number;
  unit?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  department?: string | null;
  state_code?: string | null;
  source?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const uid = await currentUserId();
  const { data, error } = await supabase
    .from("executive_kpi_snapshots")
    .insert({ ...input, captured_by: uid } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/* ------------------------- Activity log ------------------------- */

export async function logExecutiveActivity(input: {
  action: string;
  entity_type?: string;
  entity_id?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}) {
  const uid = await currentUserId();
  if (!uid) return;
  await supabase.from("executive_activity_log").insert({
    actor_user_id: uid,
    action: input.action,
    entity_type: input.entity_type ?? null,
    entity_id: input.entity_id ?? null,
    summary: input.summary ?? null,
    metadata: input.metadata ?? {},
  } as never);
}

export async function listRecentExecutiveActivity(limit = 25) {
  const { data, error } = await supabase
    .from("executive_activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}