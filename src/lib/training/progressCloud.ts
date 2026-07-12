/**
 * Cloud persistence bridge for `academyData` training progress.
 *
 * academyData stores string-id journey modules (e.g. "intake-foundations")
 * whose progress used to live only in localStorage. This module mirrors
 * that store into the `user_training_progress` Supabase table so it is
 * per-user and survives sign-out / device swaps.
 *
 * Callers into academyData remain synchronous — writes are fire-and-forget
 * against Supabase, with the local cache continuing to serve as an offline
 * source of truth.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  trainingProgress,
  setTrainingProgress,
  type TrainingProgress,
} from "@/lib/training/academyData";

type CloudRow = {
  training_id: string;
  status: TrainingProgress["status"];
  progress_percent: number;
  started_at: string | null;
  completed_at: string | null;
};

let currentUserId: string | null = null;
let hydrated = false;

export function getTrainingProgressUserId(): string | null {
  return currentUserId;
}

/** Called by the bridge component whenever auth state changes. */
export async function bindTrainingProgressUser(userId: string | null): Promise<void> {
  currentUserId = userId;
  hydrated = false;
  if (!userId) return;
  await hydrateFromCloud(userId);
  // One-time upward migration: any keys that exist locally but not in cloud
  // get pushed up so long-standing local progress isn't lost.
  await migrateLocalToCloud(userId);
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
    // Cloud is authoritative for known keys.
    setTrainingProgress(row.training_id, {
      status: row.status,
      progressPercent: row.progress_percent ?? 0,
    }, { skipCloud: true });
  }
}

async function migrateLocalToCloud(userId: string): Promise<void> {
  const rows = Object.values(trainingProgress).map((p) => ({
    user_id: userId,
    training_id: p.trainingId,
    status: p.status,
    progress_percent: Math.round(p.progressPercent ?? 0),
    started_at: p.status === "in_progress" || p.status === "completed" ? new Date().toISOString() : null,
    completed_at: p.status === "completed" ? new Date().toISOString() : null,
  }));
  if (!rows.length) return;
  const { error } = await supabase
    .from("user_training_progress")
    .upsert(rows, { onConflict: "user_id,training_id", ignoreDuplicates: true });
  if (error) console.warn("[training-progress] migrate failed", error);
}

/** Fire-and-forget upsert used by `setTrainingProgress`. */
export function pushProgressToCloud(id: string, patch: Partial<TrainingProgress>): void {
  const userId = currentUserId;
  if (!userId) return;
  const merged: TrainingProgress = {
    trainingId: id,
    status: patch.status ?? "in_progress",
    progressPercent: patch.progressPercent ?? 0,
  };
  const row = {
    user_id: userId,
    training_id: id,
    status: merged.status,
    progress_percent: Math.round(merged.progressPercent ?? 0),
    started_at: merged.status === "in_progress" || merged.status === "completed"
      ? new Date().toISOString() : null,
    completed_at: merged.status === "completed" ? new Date().toISOString() : null,
  };
  void supabase
    .from("user_training_progress")
    .upsert(row, { onConflict: "user_id,training_id" })
    .then(({ error }) => {
      if (error) console.warn("[training-progress] upsert failed", error);
    });
}

export function isTrainingProgressHydrated(): boolean {
  return hydrated;
}