/**
 * Per-lesson progress tracker for the Training Academy.
 *
 * Durable per-user store backed by `public.academy_lesson_progress` in
 * Supabase — the localStorage cache is a UI fallback only so lists render
 * instantly and stay usable if the network is briefly unavailable. Also
 * records a "last position" pointer to `public.academy_last_position`
 * whenever a learner opens or completes a lesson so the academy home can
 * surface a "Resume where you left off" card.
 */
import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LessonStatus = "not_started" | "in_progress" | "completed";

export interface LessonRecord {
  status: LessonStatus;
  startedAt?: string;
  completedAt?: string;
  lastSeenAt?: string;
  reflection?: string;
}

export interface LastPosition {
  journeySlug: string;
  trackId?: string | null;
  moduleId: string;
  lessonId?: string | null;
  moduleTitle?: string | null;
  lessonTitle?: string | null;
  updatedAt: string;
}

type Store = Record<string, LessonRecord>;

const KEY = "blossom.academy.lessonProgress.v2";
const LAST_KEY = "blossom.academy.lastPosition.v1";

function read(): Store {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") as Store; } catch { return {}; }
}

let memory: Store = read();
let lastPositionCache: LastPosition | null = readLastLocal();
const listeners = new Set<() => void>();
const lastListeners = new Set<() => void>();

function write(next: Store) {
  memory = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }
function snapshot(): Store { return memory; }

function readLastLocal(): LastPosition | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_KEY);
    return raw ? (JSON.parse(raw) as LastPosition) : null;
  } catch { return null; }
}
function writeLastLocal(next: LastPosition | null) {
  lastPositionCache = next;
  try {
    if (next) localStorage.setItem(LAST_KEY, JSON.stringify(next));
    else localStorage.removeItem(LAST_KEY);
  } catch { /* ignore */ }
  lastListeners.forEach((l) => l());
}
function subscribeLast(cb: () => void) { lastListeners.add(cb); return () => { lastListeners.delete(cb); }; }
function snapshotLast(): LastPosition | null { return lastPositionCache; }

export function lessonKey(moduleId: string, lessonId: string): string {
  return `${moduleId}::${lessonId}`;
}

/* ---------------------------- Supabase I/O ---------------------------- */

async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch { return null; }
}

function rowToRecord(row: any): LessonRecord {
  return {
    status: (row.status ?? "not_started") as LessonStatus,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    lastSeenAt: row.last_seen_at ?? undefined,
    reflection: row.reflection ?? undefined,
  };
}

async function upsertLessonRow(
  userId: string,
  moduleId: string,
  lessonId: string,
  ctx: { journeySlug?: string; trackId?: string | null } | undefined,
  patch: Record<string, unknown>,
) {
  try {
    const row = {
      user_id: userId,
      module_id: moduleId,
      lesson_id: lessonId,
      journey_slug: ctx?.journeySlug ?? null,
      track_id: ctx?.trackId ?? null,
      last_seen_at: new Date().toISOString(),
      ...patch,
    };
    await (supabase as any)
      .from("academy_lesson_progress")
      .upsert(row, { onConflict: "user_id,module_id,lesson_id" });
  } catch { /* offline-tolerant */ }
}

/** Bulk-hydrate all of this learner's lesson progress into the cache. */
export async function hydrateAllLessonProgress(): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  try {
    const { data } = await (supabase as any)
      .from("academy_lesson_progress")
      .select("module_id,lesson_id,status,started_at,completed_at,last_seen_at,reflection")
      .eq("user_id", uid);
    const rows = (data ?? []) as any[];
    const next: Store = { ...memory };
    for (const r of rows) {
      next[lessonKey(r.module_id, r.lesson_id)] = rowToRecord(r);
    }
    write(next);
  } catch { /* ignore */ }
}

/* ---------------------------- Local mutators ---------------------------- */

export function getLessonRecord(moduleId: string, lessonId: string): LessonRecord {
  return memory[lessonKey(moduleId, lessonId)] ?? { status: "not_started" };
}

export function startLesson(
  moduleId: string,
  lessonId: string,
  ctx?: { journeySlug?: string; trackId?: string | null; moduleTitle?: string; lessonTitle?: string },
): void {
  const k = lessonKey(moduleId, lessonId);
  const prev = memory[k];
  const nowIso = new Date().toISOString();
  if (prev?.status === "completed") {
    // Still record the visit for "resume" without downgrading status.
    write({ ...memory, [k]: { ...prev, lastSeenAt: nowIso } });
  } else if (prev?.status === "in_progress") {
    write({ ...memory, [k]: { ...prev, lastSeenAt: nowIso } });
  } else {
    write({
      ...memory,
      [k]: { status: "in_progress", startedAt: nowIso, lastSeenAt: nowIso },
    });
  }
  void (async () => {
    const uid = await currentUserId();
    if (!uid) return;
    const patch: Record<string, unknown> = { last_seen_at: nowIso };
    if (!prev || prev.status === "not_started") {
      patch.status = "in_progress";
      patch.started_at = nowIso;
    }
    await upsertLessonRow(uid, moduleId, lessonId, ctx, patch);
    await recordLastPosition(uid, {
      journeySlug: ctx?.journeySlug ?? "academy",
      trackId: ctx?.trackId ?? null,
      moduleId,
      lessonId,
      moduleTitle: ctx?.moduleTitle ?? null,
      lessonTitle: ctx?.lessonTitle ?? null,
      updatedAt: nowIso,
    });
  })();
}

export function completeLesson(
  moduleId: string,
  lessonId: string,
  reflection?: string,
  ctx?: { journeySlug?: string; trackId?: string | null; moduleTitle?: string; lessonTitle?: string },
): void {
  const k = lessonKey(moduleId, lessonId);
  const prev = memory[k] ?? { status: "not_started" as LessonStatus };
  const nowIso = new Date().toISOString();
  write({
    ...memory,
    [k]: {
      ...prev,
      status: "completed",
      startedAt: prev.startedAt ?? nowIso,
      completedAt: nowIso,
      lastSeenAt: nowIso,
      reflection: reflection ?? prev.reflection,
    },
  });
  void (async () => {
    const uid = await currentUserId();
    if (!uid) return;
    await upsertLessonRow(uid, moduleId, lessonId, ctx, {
      status: "completed",
      started_at: prev.startedAt ?? nowIso,
      completed_at: nowIso,
      last_seen_at: nowIso,
      reflection: reflection ?? prev.reflection ?? null,
    });
    await recordLastPosition(uid, {
      journeySlug: ctx?.journeySlug ?? "academy",
      trackId: ctx?.trackId ?? null,
      moduleId,
      lessonId,
      moduleTitle: ctx?.moduleTitle ?? null,
      lessonTitle: ctx?.lessonTitle ?? null,
      updatedAt: nowIso,
    });
  })();
}

export function resetLesson(moduleId: string, lessonId: string): void {
  const k = lessonKey(moduleId, lessonId);
  if (!memory[k]) return;
  const next = { ...memory };
  delete next[k];
  write(next);
  void (async () => {
    const uid = await currentUserId();
    if (!uid) return;
    try {
      await (supabase as any)
        .from("academy_lesson_progress")
        .delete()
        .eq("user_id", uid).eq("module_id", moduleId).eq("lesson_id", lessonId);
    } catch { /* ignore */ }
  })();
}

/* ------------------------- Last-position pointer ------------------------- */

async function recordLastPosition(userId: string, pos: LastPosition) {
  writeLastLocal(pos);
  try {
    await (supabase as any)
      .from("academy_last_position")
      .upsert({
        user_id: userId,
        journey_slug: pos.journeySlug,
        track_id: pos.trackId ?? null,
        module_id: pos.moduleId,
        lesson_id: pos.lessonId ?? null,
        module_title: pos.moduleTitle ?? null,
        lesson_title: pos.lessonTitle ?? null,
        updated_at: pos.updatedAt,
      }, { onConflict: "user_id" });
  } catch { /* ignore */ }
}

export async function fetchLastPosition(): Promise<LastPosition | null> {
  const uid = await currentUserId();
  if (!uid) return lastPositionCache;
  try {
    const { data } = await (supabase as any)
      .from("academy_last_position")
      .select("journey_slug,track_id,module_id,lesson_id,module_title,lesson_title,updated_at")
      .eq("user_id", uid)
      .maybeSingle();
    if (!data) return lastPositionCache;
    const pos: LastPosition = {
      journeySlug: (data as any).journey_slug,
      trackId: (data as any).track_id ?? null,
      moduleId: (data as any).module_id,
      lessonId: (data as any).lesson_id ?? null,
      moduleTitle: (data as any).module_title ?? null,
      lessonTitle: (data as any).lesson_title ?? null,
      updatedAt: (data as any).updated_at,
    };
    writeLastLocal(pos);
    return pos;
  } catch { return lastPositionCache; }
}

/* ------------------------------- Hooks -------------------------------- */

/** React hook — subscribes to the store and returns the record for one lesson. */
export function useLessonRecord(moduleId: string, lessonId: string): LessonRecord {
  const store = useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => {
    // Best-effort background hydrate so a hard refresh mid-lesson still
    // shows in_progress/completed instantly on the next render.
    let cancelled = false;
    (async () => {
      const uid = await currentUserId();
      if (!uid || cancelled) return;
      try {
        const { data } = await (supabase as any)
          .from("academy_lesson_progress")
          .select("status,started_at,completed_at,last_seen_at,reflection")
          .eq("user_id", uid).eq("module_id", moduleId).eq("lesson_id", lessonId)
          .maybeSingle();
        if (cancelled || !data) return;
        write({ ...memory, [lessonKey(moduleId, lessonId)]: rowToRecord(data) });
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [moduleId, lessonId]);
  return store[lessonKey(moduleId, lessonId)] ?? { status: "not_started" };
}

/** React hook — returns statuses + counts for a set of lesson ids in a module. */
export function useLessonStatuses(moduleId: string, lessonIds: string[]): {
  statuses: Record<string, LessonStatus>;
  completedCount: number;
  inProgressCount: number;
  total: number;
} {
  const store = useSyncExternalStore(subscribe, snapshot, snapshot);
  // Kick off a one-shot bulk hydrate on first use so any list of lessons
  // reflects durable Supabase state without each row hitting the network.
  useEffect(() => { void hydrateAllLessonProgress(); }, []);
  const statuses: Record<string, LessonStatus> = {};
  let completedCount = 0;
  let inProgressCount = 0;
  for (const id of lessonIds) {
    const s = store[lessonKey(moduleId, id)]?.status ?? "not_started";
    statuses[id] = s;
    if (s === "completed") completedCount++;
    else if (s === "in_progress") inProgressCount++;
  }
  return { statuses, completedCount, inProgressCount, total: lessonIds.length };
}

/** React hook — the learner's "resume where you left off" pointer. */
export function useLastAcademyPosition(): LastPosition | null {
  const pos = useSyncExternalStore(subscribeLast, snapshotLast, snapshotLast);
  useEffect(() => { void fetchLastPosition(); }, []);
  return pos;
}
