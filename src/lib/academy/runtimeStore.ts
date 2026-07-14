/**
 * Academy module runtime progress — durable, per-user, per-module runtime state.
 *
 * Source of truth: `public.academy_runtime_progress` in Supabase. Every
 * write goes through the Supabase client for the logged-in user and is
 * mirrored into an in-memory + localStorage cache so the UI can render
 * instantly and stay usable if the network is briefly unavailable. The
 * cache is NOT the source of truth — a full refresh always re-hydrates
 * from Supabase.
 *
 * Cache is keyed by (journeySlug, trackId, moduleId) so the same
 * moduleId under different tracks/journeys never collides.
 *
 * academyData modules continue to use `academyData.getProgress` and
 * `markTrainingStarted` / `markTrainingComplete`.
 */
import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { syncReadinessModuleProgress } from "@/lib/training/rbtReadinessSync";

export interface RuntimeContext {
  journeySlug: string;                 // e.g. "rbt", "bcba"
  trackId?: string | null;             // e.g. "not_certified"
  sourceModuleId?: string;             // original RBT/BCBA module id
  sourceKind?: "rbt" | "bcba" | "academyData";
}

export type AcademyRuntimeStatus = "not_started" | "in_progress" | "completed";

export interface AcademyRuntimeRecord {
  moduleId: string;
  status: AcademyRuntimeStatus;
  elapsedSeconds: number;
  startedAt?: string;
  completedAt?: string;
  lastActiveAt?: string;
}

const CACHE_KEY = "blossom.academy.runtime.cache.v3";

type Store = Record<string, AcademyRuntimeRecord>;

/**
 * Stable cache key. `journeySlug + trackId + moduleId` so the same
 * moduleId under different tracks/journeys does not collide. Callers
 * without a track pass `null` — normalized to the string "default".
 */
export function runtimeKey(moduleId: string, ctx?: Partial<RuntimeContext> | null): string {
  const journey = ctx?.journeySlug || "academy";
  const track = ctx?.trackId || "default";
  return `${journey}::${track}::${moduleId}`;
}

function readCache(): Store {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}") as Store; } catch { return {}; }
}

let memory: Store = readCache();
const listeners = new Set<() => void>();

function writeCache(next: Store) {
  memory = next;
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
function snapshot(): Store { return memory; }

/* ------------------------------ Supabase I/O ------------------------------ */

async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch { return null; }
}

function rowToRecord(row: any): AcademyRuntimeRecord {
  return {
    moduleId: row.module_id,
    status: (row.status ?? "not_started") as AcademyRuntimeStatus,
    elapsedSeconds: Number(row.elapsed_seconds ?? 0),
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    lastActiveAt: row.last_active_at ?? undefined,
  };
}

/**
 * Fetch the single row that matches (user_id, journey_slug, track_id, module_id).
 * We filter by track_id explicitly (including NULL) so multiple tracks in the
 * same journey never return an ambiguous row.
 */
async function fetchRuntimeRow(userId: string, moduleId: string, ctx?: RuntimeContext) {
  try {
    let q = supabase
      .from("academy_runtime_progress" as any)
      .select("*")
      .eq("user_id", userId)
      .eq("module_id", moduleId);
    if (ctx?.journeySlug) q = q.eq("journey_slug", ctx.journeySlug);
    if (ctx && "trackId" in ctx) {
      if (ctx.trackId == null || ctx.trackId === "") {
        q = q.is("track_id", null);
      } else {
        q = q.eq("track_id", ctx.trackId);
      }
    }
    // Use limit(1) instead of maybeSingle so leftover legacy rows never throw.
    const { data } = await q.order("updated_at", { ascending: false }).limit(1);
    const rows = (data ?? []) as any[];
    return rows[0] ?? null;
  } catch { return null; }
}

async function upsertRuntimeRow(
  userId: string,
  moduleId: string,
  ctx: RuntimeContext,
  patch: Record<string, unknown>,
) {
  const existing = await fetchRuntimeRow(userId, moduleId, ctx);
  if (existing) {
    await (supabase as any)
      .from("academy_runtime_progress")
      .update(patch)
      .eq("id", (existing as any).id);
    return { ...(existing as any), ...patch };
  }
  const insert = {
    user_id: userId,
    module_id: moduleId,
    journey_slug: ctx.journeySlug,
    track_id: ctx.trackId ?? null,
    source_module_id: ctx.sourceModuleId ?? null,
    source_kind: ctx.sourceKind ?? null,
    status: "not_started",
    elapsed_seconds: 0,
    ...patch,
  };
  const { data } = await (supabase as any)
    .from("academy_runtime_progress")
    .insert(insert)
    .select("*")
    .maybeSingle();
  return data;
}

/**
 * Hydrate cache for a given (moduleId, ctx) from Supabase.
 */
export async function hydrateRuntime(moduleId: string, ctx: RuntimeContext): Promise<AcademyRuntimeRecord | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  const row = await fetchRuntimeRow(uid, moduleId, ctx);
  if (!row) return null;
  const rec = rowToRecord(row);
  writeCache({ ...memory, [runtimeKey(moduleId, ctx)]: rec });
  return rec;
}

function pushLocal(moduleId: string, ctx: RuntimeContext | undefined, rec: AcademyRuntimeRecord) {
  writeCache({ ...memory, [runtimeKey(moduleId, ctx)]: rec });
}

export function getRuntimeRecord(moduleId: string, ctx?: RuntimeContext): AcademyRuntimeRecord {
  const primary = memory[runtimeKey(moduleId, ctx)];
  if (primary) return primary;
  // Fallback: if no ctx (or a different ctx) was passed, look up any cached
  // record that ends with `::${moduleId}`. This keeps aggregated journey
  // progress in sync with writes that happened under a specific journeySlug
  // (e.g. TrainingModuleRuntime writes with journeySlug: "intake" while
  // journeyContent.unifiedStatus reads without ctx).
  for (const key of Object.keys(memory)) {
    if (key.endsWith(`::${moduleId}`)) return memory[key];
  }
  return { moduleId, status: "not_started", elapsedSeconds: 0 };
}

export function getRuntimeStatus(moduleId: string, ctx?: RuntimeContext): AcademyRuntimeStatus {
  return getRuntimeRecord(moduleId, ctx).status;
}

/**
 * Subscribe to any runtime store change. Journey/day detail screens use
 * this so completing a module in TrainingModuleRuntime instantly rolls up
 * into aggregate progress without a page refresh.
 */
export function useRuntimeVersion(): number {
  return useSyncExternalStore(subscribe, () => memory as unknown as number, () => memory as unknown as number) as unknown as number;
}

export async function startRuntime(moduleId: string, ctx: RuntimeContext) {
  const now = new Date().toISOString();
  const prev = getRuntimeRecord(moduleId, ctx);
  if (prev.status === "completed") return;
  const next: AcademyRuntimeRecord = {
    ...prev,
    moduleId,
    status: "in_progress",
    startedAt: prev.startedAt ?? now,
    lastActiveAt: now,
  };
  pushLocal(moduleId, ctx, next);
  const uid = await currentUserId();
  if (uid) {
    await upsertRuntimeRow(uid, moduleId, ctx, {
      status: "in_progress",
      started_at: next.startedAt,
      last_active_at: now,
      sync_status: "synced",
    });
    if (ctx.sourceKind === "rbt" && ctx.sourceModuleId) {
      await syncReadinessModuleProgress(uid, ctx.sourceModuleId, {
        status: "in_progress",
        elapsedSeconds: next.elapsedSeconds,
        startedAt: next.startedAt,
        lastActiveAt: now,
      }, ctx.trackId ?? null);
    }
  }
}

export function tickRuntime(moduleId: string, deltaSecondsOrCtx: number | RuntimeContext, maybeCtx?: RuntimeContext) {
  // Backwards compat: legacy callers passed (moduleId, deltaSeconds). New
  // callers can pass (moduleId, deltaSeconds, ctx) or (moduleId, ctx, delta) —
  // we accept both because ctx is optional in the on-disk cache lookup.
  const delta = typeof deltaSecondsOrCtx === "number" ? deltaSecondsOrCtx : 0;
  const ctx = typeof deltaSecondsOrCtx === "number" ? maybeCtx : deltaSecondsOrCtx;
  const prev = getRuntimeRecord(moduleId, ctx);
  if (prev.status !== "in_progress") return;
  pushLocal(moduleId, ctx, {
    ...prev,
    elapsedSeconds: prev.elapsedSeconds + Math.max(0, Math.floor(delta)),
    lastActiveAt: new Date().toISOString(),
  });
}

export async function persistRuntimeElapsed(moduleId: string, ctx: RuntimeContext) {
  const rec = getRuntimeRecord(moduleId, ctx);
  const uid = await currentUserId();
  if (!uid) return;
  await upsertRuntimeRow(uid, moduleId, ctx, {
    elapsed_seconds: rec.elapsedSeconds,
    last_active_at: rec.lastActiveAt ?? new Date().toISOString(),
    status: rec.status,
    sync_status: "synced",
  });
}

export async function completeRuntime(moduleId: string, ctx: RuntimeContext) {
  const now = new Date().toISOString();
  const prev = getRuntimeRecord(moduleId, ctx);
  const next: AcademyRuntimeRecord = {
    ...prev,
    moduleId,
    status: "completed",
    startedAt: prev.startedAt ?? now,
    completedAt: now,
    lastActiveAt: now,
  };
  pushLocal(moduleId, ctx, next);
  const uid = await currentUserId();
  if (uid) {
    await upsertRuntimeRow(uid, moduleId, ctx, {
      status: "completed",
      started_at: next.startedAt,
      completed_at: now,
      last_active_at: now,
      elapsed_seconds: next.elapsedSeconds,
      sync_status: "synced",
    });
    if (ctx.sourceKind === "rbt" && ctx.sourceModuleId) {
      await syncReadinessModuleProgress(uid, ctx.sourceModuleId, {
        status: "completed",
        elapsedSeconds: next.elapsedSeconds,
        startedAt: next.startedAt,
        completedAt: now,
        lastActiveAt: now,
      }, ctx.trackId ?? null);
    }
  }
}

export async function resetRuntime(moduleId: string, ctx?: RuntimeContext) {
  const key = runtimeKey(moduleId, ctx);
  if (memory[key]) {
    const next = { ...memory }; delete next[key]; writeCache(next);
  }
  const uid = await currentUserId();
  if (!uid || !ctx) return;
  const row = await fetchRuntimeRow(uid, moduleId, ctx);
  if (row) {
    await (supabase as any).from("academy_runtime_progress").delete().eq("id", (row as any).id);
  }
}

export function useRuntimeRecord(moduleId: string, ctx?: RuntimeContext): AcademyRuntimeRecord {
  const store = useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => {
    if (!ctx) return;
    let cancelled = false;
    (async () => {
      const uid = await currentUserId();
      if (cancelled || !uid) return;
      const row = await fetchRuntimeRow(uid, moduleId, ctx);
      if (cancelled || !row) return;
      pushLocal(moduleId, ctx, rowToRecord(row));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, ctx?.journeySlug, ctx?.trackId, ctx?.sourceModuleId, ctx?.sourceKind]);
  return store[runtimeKey(moduleId, ctx)] ?? { moduleId, status: "not_started", elapsedSeconds: 0 };
}
