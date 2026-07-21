/**
 * Blossom OS — Canonical Intake Review Data Layer.
 *
 * Single typed entry point for every Intake surface (Dashboard, Workspace,
 * Operations, Coordinator, Clients, Authorizations, Leads/V2, LeadDetail,
 * LeadDetailDrawer, CTM Admin, CTM Calls, Call Tracking, Lead Source
 * Inbox, Promotion Review Queues) to read primary KPIs, lists and
 * drilldowns.
 *
 * All queries hit canonical Supabase tables/views/RPCs. No mock data, no
 * localStorage authority, no legacy Monday raw as current truth. Legacy
 * Monday raw is only surfaced from the Historical Import fallback path
 * inside LeadDetailDrawer for an already-matched canonical lead.
 *
 * Every list query supports server-side paging and simple filtering so
 * the client never loads full tables into memory.
 */
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────

export interface IntakeReviewStats {
  operating_mode: "INGEST_ONLY" | "FULL" | null;
  leads_total: number;
  leads_by_stage: Record<string, number>;
  leads_by_state: Record<string, number>;
  leads_by_source: Record<string, number>;
  ctm_calls_total: number;
  ctm_calls_linked: number;
  ctm_calls_unmatched: number;
  ctm_unmatched_tracking_numbers: number;
  promotion_states: Record<string, number>;
  normalized_records: Record<string, number>;
  source_events_last_24h: number;
  generated_at: string;
}

export interface CanonicalIntakeLeadRow {
  id: string;
  child_name: string | null;
  parent_name: string | null;
  phone_e164: string | null;
  email_lower: string | null;
  state: string | null;
  lead_source: string | null;
  pipeline_stage: string | null;
  assigned_intake_coordinator: string | null;
  priority: string | null;
  created_at: string;
  updated_at: string;
  stage_entered_at: string | null;
}

export interface CanonicalCtmCallRow {
  id: string;
  ctm_call_id: string;
  direction: string | null;
  status: string | null;
  tracking_number: string | null;
  from_number: string | null;
  caller_city: string | null;
  caller_state: string | null;
  duration_seconds: number | null;
  source_name: string | null;
  campaign_name: string | null;
  called_at: string | null;
  ended_at: string | null;
  matched_lead_id: string | null;
  intake_lead_id: string | null;
  linked_at: string | null;
  link_status: "linked" | "unmatched" | "unmatched_short" | "unmatched_no_tracking";
}

export interface CanonicalSourceEventRow {
  id: string;
  lead_id: string | null;
  provider_key: string | null;
  event_kind: string | null;
  external_id: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export type PromotionState =
  | "pending"
  | "linked_existing"
  | "promoted"
  | "ambiguous"
  | "error";

export interface CanonicalPromotionRow {
  id: string;
  normalized_record_id: string;
  state: PromotionState;
  reason: string | null;
  candidate_lead_ids: string[] | null;
  lead_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderReadinessRow {
  integration_id: string;
  display_name: string | null;
  category: string | null;
  environment: string | null;
  status: string | null;
  enabled: boolean;
  last_success_at: string | null;
  last_error_at: string | null;
  last_error: string | null;
  freshness_seconds: number | null;
}

// ─── Query keys ───────────────────────────────────────────────────────

export const intakeReviewKeys = {
  stats: ["intake", "review", "stats"] as const,
  leads: (opts: LeadsQueryOptions) => ["intake", "review", "leads", opts] as const,
  ctmCalls: (opts: CtmQueryOptions) => ["intake", "review", "ctm", opts] as const,
  sourceEvents: (opts: SourceEventsQueryOptions) =>
    ["intake", "review", "source-events", opts] as const,
  promotions: (opts: PromotionsQueryOptions) =>
    ["intake", "review", "promotions", opts] as const,
  providerReadiness: ["intake", "review", "provider-readiness"] as const,
} as const;

// ─── Options ──────────────────────────────────────────────────────────

export interface LeadsQueryOptions {
  page?: number;
  pageSize?: number;
  stage?: string;
  state?: string;
  source?: string;
  search?: string;
  sort?: "recent" | "oldest" | "stage_entered";
}

export interface CtmQueryOptions {
  page?: number;
  pageSize?: number;
  linkStatus?: "linked" | "unmatched" | "all";
  callerState?: string;
  source?: string;
  search?: string;
  since?: string;
}

export interface SourceEventsQueryOptions {
  page?: number;
  pageSize?: number;
  providerKey?: string;
  leadId?: string;
  since?: string;
}

export interface PromotionsQueryOptions {
  page?: number;
  pageSize?: number;
  state?: PromotionState;
  search?: string;
}

// ─── Fetchers ────────────────────────────────────────────────────────

export async function fetchIntakeReviewStats(): Promise<IntakeReviewStats> {
  const { data, error } = await supabase.rpc("intake_review_stats");
  if (error) throw error;
  return data as unknown as IntakeReviewStats;
}

export interface PageResult<T> {
  rows: T[];
  count: number;
  page: number;
  pageSize: number;
}

export async function fetchCanonicalIntakeLeads(
  opts: LeadsQueryOptions = {},
): Promise<PageResult<CanonicalIntakeLeadRow>> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, opts.pageSize ?? 50));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("intake_leads")
    .select(
      "id, child_name, parent_name, phone_e164, email_lower, state, lead_source, " +
        "pipeline_stage, assigned_intake_coordinator, priority, created_at, updated_at, stage_entered_at",
      { count: "exact" },
    );
  if (opts.stage) q = q.eq("pipeline_stage", opts.stage);
  if (opts.state) q = q.eq("state", opts.state);
  if (opts.source) q = q.eq("lead_source", opts.source);
  if (opts.search) {
    const term = `%${opts.search.trim()}%`;
    q = q.or(
      `child_name.ilike.${term},parent_name.ilike.${term},email_lower.ilike.${term},phone_e164.ilike.${term}`,
    );
  }
  const orderCol =
    opts.sort === "oldest"
      ? { col: "created_at", asc: true }
      : opts.sort === "stage_entered"
        ? { col: "stage_entered_at", asc: false }
        : { col: "updated_at", asc: false };
  q = q.order(orderCol.col, { ascending: orderCol.asc, nullsFirst: false }).range(from, to);

  const { data, count, error } = await q;
  if (error) throw error;
  return {
    rows: (data ?? []) as CanonicalIntakeLeadRow[],
    count: count ?? 0,
    page,
    pageSize,
  };
}

export async function fetchCanonicalCtmCalls(
  opts: CtmQueryOptions = {},
): Promise<PageResult<CanonicalCtmCallRow>> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, opts.pageSize ?? 50));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("v_intake_ctm_calls_safe")
    .select(
      "id, ctm_call_id, direction, status, tracking_number, from_number, caller_city, " +
        "caller_state, duration_seconds, source_name, campaign_name, called_at, ended_at, " +
        "matched_lead_id, intake_lead_id, linked_at, link_status",
      { count: "exact" },
    );
  if (opts.linkStatus === "linked") q = q.eq("link_status", "linked");
  else if (opts.linkStatus === "unmatched") q = q.neq("link_status", "linked");
  if (opts.callerState) q = q.eq("caller_state", opts.callerState);
  if (opts.source) q = q.eq("source_name", opts.source);
  if (opts.since) q = q.gte("called_at", opts.since);
  if (opts.search) {
    const term = `%${opts.search.trim()}%`;
    q = q.or(
      `tracking_number.ilike.${term},from_number.ilike.${term},source_name.ilike.${term},campaign_name.ilike.${term}`,
    );
  }
  q = q.order("called_at", { ascending: false, nullsFirst: false }).range(from, to);

  const { data, count, error } = await q;
  if (error) throw error;
  return {
    rows: (data ?? []) as CanonicalCtmCallRow[],
    count: count ?? 0,
    page,
    pageSize,
  };
}

export async function fetchCanonicalSourceEvents(
  opts: SourceEventsQueryOptions = {},
): Promise<PageResult<CanonicalSourceEventRow>> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, opts.pageSize ?? 50));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("intake_lead_source_events")
    .select("*", { count: "exact" });
  if (opts.providerKey) q = q.eq("provider_key", opts.providerKey);
  if (opts.leadId) q = q.eq("lead_id", opts.leadId);
  if (opts.since) q = q.gte("created_at", opts.since);
  q = q.order("created_at", { ascending: false }).range(from, to);

  const { data, count, error } = await q;
  if (error) throw error;
  return {
    rows: (data ?? []) as unknown as CanonicalSourceEventRow[],
    count: count ?? 0,
    page,
    pageSize,
  };
}

export async function fetchCanonicalPromotions(
  opts: PromotionsQueryOptions = {},
): Promise<PageResult<CanonicalPromotionRow>> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, opts.pageSize ?? 50));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let q = supabase
    .from("intake_promotion_state")
    .select(
      "id, normalized_record_id, state, reason, candidate_lead_ids, lead_id, created_at, updated_at",
      { count: "exact" },
    );
  if (opts.state) q = q.eq("state", opts.state);
  if (opts.search) {
    const term = `%${opts.search.trim()}%`;
    q = q.or(`reason.ilike.${term},normalized_record_id.eq.${opts.search}`);
  }
  q = q.order("updated_at", { ascending: false }).range(from, to);
  const { data, count, error } = await q;
  if (error) throw error;
  return {
    rows: (data ?? []) as CanonicalPromotionRow[],
    count: count ?? 0,
    page,
    pageSize,
  };
}

export async function fetchProviderReadiness(): Promise<ProviderReadinessRow[]> {
  const { data, error } = await supabase.rpc("intake_provider_readiness");
  if (error) throw error;
  return (data ?? []) as unknown as ProviderReadinessRow[];
}

/**
 * Admin-only, idempotent re-trigger of promotion for a single normalized
 * record. Server enforces the admin check via
 * public.intake_admin_reprocess_normalized_record. Never call outside
 * an admin-authorized surface.
 */
export async function reprocessNormalizedRecord(
  normalizedRecordId: string,
): Promise<{ status: string; leadId?: string | null; reason?: string | null }> {
  const { data, error } = await supabase.rpc(
    "intake_admin_reprocess_normalized_record",
    { _record_id: normalizedRecordId },
  );
  if (error) throw error;
  const raw = (data ?? {}) as Record<string, unknown>;
  return {
    status: String(raw.status ?? "unknown"),
    leadId: (raw.lead_id as string | null) ?? null,
    reason: (raw.reason as string | null) ?? null,
  };
}

// ─── React Query hooks ───────────────────────────────────────────────

export function useIntakeReviewStats(
  options?: Omit<UseQueryOptions<IntakeReviewStats>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: intakeReviewKeys.stats,
    queryFn: fetchIntakeReviewStats,
    staleTime: 60_000,
    ...options,
  });
}

export function useCanonicalIntakeLeads(opts: LeadsQueryOptions = {}) {
  return useQuery({
    queryKey: intakeReviewKeys.leads(opts),
    queryFn: () => fetchCanonicalIntakeLeads(opts),
    staleTime: 30_000,
  });
}

export function useCanonicalCtmCalls(opts: CtmQueryOptions = {}) {
  return useQuery({
    queryKey: intakeReviewKeys.ctmCalls(opts),
    queryFn: () => fetchCanonicalCtmCalls(opts),
    staleTime: 30_000,
  });
}

export function useCanonicalSourceEvents(opts: SourceEventsQueryOptions = {}) {
  return useQuery({
    queryKey: intakeReviewKeys.sourceEvents(opts),
    queryFn: () => fetchCanonicalSourceEvents(opts),
    staleTime: 30_000,
  });
}

export function useCanonicalPromotions(opts: PromotionsQueryOptions = {}) {
  return useQuery({
    queryKey: intakeReviewKeys.promotions(opts),
    queryFn: () => fetchCanonicalPromotions(opts),
    staleTime: 15_000,
  });
}

export function useProviderReadiness() {
  return useQuery({
    queryKey: intakeReviewKeys.providerReadiness,
    queryFn: fetchProviderReadiness,
    staleTime: 60_000,
  });
}

// ─── Provider readiness classification ───────────────────────────────

/**
 * Truthful readiness signal derived from live connection status +
 * freshness. Never derives "connected" from catalog display metadata.
 */
export function classifyProviderReadiness(row: ProviderReadinessRow): {
  label: "connected" | "stale" | "error" | "disabled" | "unconfigured";
  detail: string;
} {
  if (!row.enabled) return { label: "disabled", detail: "Disabled by admin" };
  if (row.status && row.status.toLowerCase() === "error") {
    return { label: "error", detail: row.last_error ?? "Provider error" };
  }
  if (!row.last_success_at) {
    return { label: "unconfigured", detail: "No successful sync yet" };
  }
  if (row.freshness_seconds != null && row.freshness_seconds > 24 * 3600) {
    return {
      label: "stale",
      detail: `Last success ${Math.floor(row.freshness_seconds / 3600)}h ago`,
    };
  }
  return { label: "connected", detail: "Live" };
}

/**
 * Providers that are known handoff-only or explicitly disabled by the
 * current release plan. These MUST show as disabled/handoff and never
 * attempt inbound promotion.
 */
export const DISABLED_PROVIDER_KEYS = new Set([
  "centralreach", // EMR handoff only
  "solum",        // benefits disabled
  "eligipro",     // benefits disabled
  "calendar",     // outbound calendar disabled
  "outlook_calendar",
]);

/**
 * Provider-neutral promotion eligibility. Only records whose kind is
 * lead-shaped (an inquiry/lead/call/form) may promote. Everything else
 * stays in the review queue.
 */
export const PROMOTION_ELIGIBLE_RECORD_KINDS = new Set([
  "lead",
  "inquiry",
  "call",
  "form_submission",
  "referral",
  "webform",
]);

export function isPromotionEligible(kind: string | null | undefined): boolean {
  if (!kind) return false;
  return PROMOTION_ELIGIBLE_RECORD_KINDS.has(kind.toLowerCase());
}