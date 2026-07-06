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

const CACHE_KEY = "blossom.academy.runtime.cache.v2";

type Store = Record<string, AcademyRuntimeRecord>;

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

async function fetchRuntimeRow(userId: string, moduleId: string, ctx?: RuntimeContext) {
  try {
    let q = supabase
      .from("academy_runtime_progress" as any)
      .select("*")
      .eq("user_id", userId)
      .eq("module_id", moduleId);
    if (ctx?.journeySlug) q = q.eq("journey_slug", ctx.journeySlug);
    const { data } = await q.maybeSingle();
    return data ?? null;
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
    return { ...existing, ...patch } as any;
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
 * Hydrate cache for a given (moduleId, ctx) from Supabase. Safe to call
 * repeatedly; no-op if hydration already produced a record.
 */
export async function hydrateRuntime(moduleId: string, ctx: RuntimeContext): Promise<AcademyRuntimeRecord | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  const row = await fetchRuntimeRow(uid, moduleId, ctx);
  if (!row) return null;
  const rec = rowToRecord(row);
  writeCache({ ...memory, [moduleId]: rec });
  return rec;
}

function pushLocal(moduleId: string, rec: AcademyRuntimeRecord) {
  writeCache({ ...memory, [moduleId]: rec });
}

export function getRuntimeRecord(moduleId: string): AcademyRuntimeRecord {
  return memory[moduleId] ?? {
    moduleId, status: "not_started", elapsedSeconds: 0,
  };
}

export function getRuntimeStatus(moduleId: string): AcademyRuntimeStatus {
  return getRuntimeRecord(moduleId).status;
}

export async function startRuntime(moduleId: string, ctx: RuntimeContext) {
  const now = new Date().toISOString();
  const prev = getRuntimeRecord(moduleId);
  if (prev.status === "completed") return;
  const next: AcademyRuntimeRecord = {
    ...prev,
    moduleId,
    status: "in_progress",
    startedAt: prev.startedAt ?? now,
    lastActiveAt: now,
  };
  pushLocal(moduleId, next);
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
      });
    }
  }
}

/**
 * Increment elapsed time in the local cache. Callers throttle Supabase
 * persistence with `persistRuntimeElapsed` — we do not write on every tick.
 */
export function tickRuntime(moduleId: string, deltaSeconds: number) {
  const prev = getRuntimeRecord(moduleId);
  if (prev.status !== "in_progress") return;
  pushLocal(moduleId, {
    ...prev,
    elapsedSeconds: prev.elapsedSeconds + Math.max(0, Math.floor(deltaSeconds)),
    lastActiveAt: new Date().toISOString(),
  });
}

/** Persist the current cached elapsed value to Supabase (throttled by caller). */
export async function persistRuntimeElapsed(moduleId: string, ctx: RuntimeContext) {
  const rec = getRuntimeRecord(moduleId);
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
  const prev = getRuntimeRecord(moduleId);
  const next: AcademyRuntimeRecord = {
    ...prev,
    moduleId,
    status: "completed",
    startedAt: prev.startedAt ?? now,
    completedAt: now,
    lastActiveAt: now,
  };
  pushLocal(moduleId, next);
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
      });
    }
  }
}

export async function resetRuntime(moduleId: string, ctx?: RuntimeContext) {
  if (memory[moduleId]) {
    const next = { ...memory }; delete next[moduleId]; writeCache(next);
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
      pushLocal(moduleId, rowToRecord(row));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, ctx?.journeySlug, ctx?.trackId, ctx?.sourceModuleId, ctx?.sourceKind]);
  return store[moduleId] ?? { moduleId, status: "not_started", elapsedSeconds: 0 };
}