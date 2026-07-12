/**
 * Conflict-safe cloud sync for per-user training progress.
 *
 * Guarantees:
 *  - Multi-device: writes go through `merge_user_training_progress`, a
 *    server-side RPC that keeps the "highest" state (completed beats
 *    in_progress beats not_started, and progress_percent only ever
 *    increases). A stale device can never regress a completed module.
 *  - Offline: writes that fail (no network / signed out) are queued in
 *    localStorage and flushed on `online`, sign-in, and tab focus.
 *  - Realtime: postgres_changes on `user_training_progress` for the
 *    current user merge into the local store immediately so completions
 *    on device A appear on device B without a refresh.
 *  - Hydration: cloud vs local are merged by the same rank rule; any
 *    local wins (e.g. offline completions saved before sign-in) are
 *    pushed up.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  trainingProgress,
  setTrainingProgress,
  type TrainingProgress,
  type TrainingStatus,
} from "@/lib/training/academyData";

type CloudRow = {
  training_id: string;
  status: TrainingStatus;
  progress_percent: number;
  started_at: string | null;
  completed_at: string | null;
};

type PendingWrite = {
  training_id: string;
  status: TrainingStatus;
  progress_percent: number;
  started_at: string | null;
  completed_at: string | null;
  queued_at: string;
};

const QUEUE_KEY = "blossom.training.progress.queue.v1";

let currentUserId: string | null = null;
let hydrated = false;
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let listenersBound = false;

function rank(s: TrainingStatus | string | null | undefined): number {
  switch (s) {
    case "completed": return 3;
    case "in_progress": return 2;
    case "overdue": return 1;
    default: return 0;
  }
}

/** Merge two progress snapshots, always keeping the stronger one. */
function mergeProgress(a: TrainingProgress, b: TrainingProgress): TrainingProgress {
  const strongerStatus = rank(b.status) > rank(a.status) ? b.status : a.status;
  return {
    trainingId: a.trainingId,
    status: strongerStatus,
    progressPercent: Math.max(a.progressPercent ?? 0, b.progressPercent ?? 0),
    dueDate: b.dueDate ?? a.dueDate,
  };
}

function rowToProgress(row: CloudRow): TrainingProgress {
  return {
    trainingId: row.training_id,
    status: row.status,
    progressPercent: row.progress_percent ?? 0,
  };
}

function progressToWrite(id: string, p: Partial<TrainingProgress>): PendingWrite {
  const status = (p.status ?? "in_progress") as TrainingStatus;
  const now = new Date().toISOString();
  return {
    training_id: id,
    status,
    progress_percent: Math.round(p.progressPercent ?? 0),
    started_at: status === "in_progress" || status === "completed" ? now : null,
    completed_at: status === "completed" ? now : null,
    queued_at: now,
  };
}

function loadQueue(): PendingWrite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as PendingWrite[]) : [];
  } catch { return []; }
}

function saveQueue(q: PendingWrite[]): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch { /* ignore */ }
}

function enqueue(write: PendingWrite): void {
  const q = loadQueue();
  // Collapse duplicate training_ids — keep the stronger one.
  const idx = q.findIndex((w) => w.training_id === write.training_id);
  if (idx >= 0) {
    const prev = q[idx];
    const merged: PendingWrite = {
      training_id: write.training_id,
      status: rank(write.status) >= rank(prev.status) ? write.status : prev.status,
      progress_percent: Math.max(prev.progress_percent, write.progress_percent),
      started_at: prev.started_at ?? write.started_at,
      completed_at: prev.completed_at ?? write.completed_at,
      queued_at: write.queued_at,
    };
    q[idx] = merged;
  } else {
    q.push(write);
  }
  saveQueue(q);
}

async function sendWrite(write: PendingWrite): Promise<boolean> {
  const { error } = await supabase.rpc("merge_user_training_progress", {
    _training_id: write.training_id,
    _status: write.status,
    _progress_percent: write.progress_percent,
    _started_at: write.started_at,
    _completed_at: write.completed_at,
  });
  if (error) {
    console.warn("[training-progress] merge rpc failed", error.message);
    return false;
  }
  return true;
}

/** Flush any queued writes. Called on sign-in, online, and focus. */
export async function flushTrainingProgressQueue(): Promise<void> {
  if (!currentUserId) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  const q = loadQueue();
  if (q.length === 0) return;
  const remaining: PendingWrite[] = [];
  for (const w of q) {
    const ok = await sendWrite(w);
    if (!ok) remaining.push(w);
  }
  saveQueue(remaining);
}

function bindGlobalListeners(): void {
  if (listenersBound || typeof window === "undefined") return;
  listenersBound = true;
  window.addEventListener("online", () => { void flushTrainingProgressQueue(); });
  window.addEventListener("focus", () => { void flushTrainingProgressQueue(); });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void flushTrainingProgressQueue();
  });
}

function unsubscribeRealtime(): void {
  if (realtimeChannel) {
    void supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}

function subscribeRealtime(userId: string): void {
  unsubscribeRealtime();
  realtimeChannel = supabase
    .channel(`user-training-progress:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_training_progress",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = (payload.new ?? payload.old) as CloudRow | undefined;
        if (!row?.training_id) return;
        const incoming = rowToProgress(row);
        const local = trainingProgress[row.training_id] ?? {
          trainingId: row.training_id, status: "not_started" as const, progressPercent: 0,
        };
        const merged = mergeProgress(local, incoming);
        if (merged.status !== local.status || merged.progressPercent !== local.progressPercent) {
          setTrainingProgress(row.training_id, merged, { skipCloud: true });
        }
      },
    )
    .subscribe();
}

export function getTrainingProgressUserId(): string | null {
  return currentUserId;
}

/** Called by the bridge component whenever auth state changes. */
export async function bindTrainingProgressUser(userId: string | null): Promise<void> {
  currentUserId = userId;
  hydrated = false;
  if (!userId) {
    unsubscribeRealtime();
    return;
  }
  bindGlobalListeners();
  await hydrateFromCloud(userId);
  await migrateLocalToCloud(userId);
  await flushTrainingProgressQueue();
  subscribeRealtime(userId);
  hydrated = true;
}

async function hydrateFromCloud(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from("user_training_progress")
    .select("training_id,status,progress_percent,started_at,completed_at")
    .eq("user_id", userId);
  if (error) {
    console.warn("[training-progress] hydrate failed", error);
    return;
  }
  for (const row of (data ?? []) as CloudRow[]) {
    const cloud = rowToProgress(row);
    const local = trainingProgress[row.training_id];
    if (!local) {
      setTrainingProgress(row.training_id, cloud, { skipCloud: true });
      continue;
    }
    const merged = mergeProgress(local, cloud);
    if (merged.status !== local.status || merged.progressPercent !== local.progressPercent) {
      setTrainingProgress(row.training_id, merged, { skipCloud: true });
    }
    if (rank(local.status) > rank(cloud.status) || (local.progressPercent ?? 0) > (cloud.progressPercent ?? 0)) {
      enqueue(progressToWrite(row.training_id, merged));
    }
  }
}

async function migrateLocalToCloud(userId: string): Promise<void> {
  const { data } = await supabase
    .from("user_training_progress")
    .select("training_id")
    .eq("user_id", userId);
  const cloudIds = new Set((data ?? []).map((r) => r.training_id));
  for (const p of Object.values(trainingProgress)) {
    if (cloudIds.has(p.trainingId)) continue;
    if (p.status === "not_started" && (p.progressPercent ?? 0) === 0) continue;
    enqueue(progressToWrite(p.trainingId, p));
  }
}

/** Called by academyData.setTrainingProgress on every local write. */
export function pushProgressToCloud(id: string, patch: Partial<TrainingProgress>): void {
  const write = progressToWrite(id, patch);
  if (!currentUserId) {
    enqueue(write);
    return;
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    enqueue(write);
    return;
  }
  void sendWrite(write).then((ok) => {
    if (!ok) enqueue(write);
  });
}

export function isTrainingProgressHydrated(): boolean {
  return hydrated;
}

// Exported for tests.
export const __internal = { mergeProgress, rank };
