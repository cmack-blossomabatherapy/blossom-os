/**
 * Academy module runtime progress — small client-side bridge.
 *
 * Persists per-module status (not_started | in_progress | completed),
 * elapsed seconds, and the most recent start timestamp into localStorage.
 * This is intentionally a temporary bridge so RBT and BCBA module runtimes
 * have working Start / Continue / Complete and a real timer until a
 * Supabase-backed `academy_progress`-style table is wired for those sources.
 *
 * Existing academyData modules continue to use `academyData.getProgress` and
 * `markTrainingStarted` / `markTrainingComplete`.
 */
import { useSyncExternalStore } from "react";

export type AcademyRuntimeStatus = "not_started" | "in_progress" | "completed";

export interface AcademyRuntimeRecord {
  moduleId: string;
  status: AcademyRuntimeStatus;
  elapsedSeconds: number;
  startedAt?: string;
  completedAt?: string;
  lastActiveAt?: string;
}

const KEY = "blossom.academy.runtime.v1";

type Store = Record<string, AcademyRuntimeRecord>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") as Store; } catch { return {}; }
}

let memory: Store = read();
const listeners = new Set<() => void>();

function write(next: Store) {
  memory = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
function snapshot(): Store { return memory; }

export function getRuntimeRecord(moduleId: string): AcademyRuntimeRecord {
  return memory[moduleId] ?? {
    moduleId, status: "not_started", elapsedSeconds: 0,
  };
}

export function getRuntimeStatus(moduleId: string): AcademyRuntimeStatus {
  return getRuntimeRecord(moduleId).status;
}

export function startRuntime(moduleId: string) {
  const now = new Date().toISOString();
  const prev = getRuntimeRecord(moduleId);
  if (prev.status === "completed") return;
  write({
    ...memory,
    [moduleId]: {
      ...prev,
      moduleId,
      status: "in_progress",
      startedAt: prev.startedAt ?? now,
      lastActiveAt: now,
    },
  });
}

export function tickRuntime(moduleId: string, deltaSeconds: number) {
  const prev = getRuntimeRecord(moduleId);
  if (prev.status !== "in_progress") return;
  write({
    ...memory,
    [moduleId]: {
      ...prev,
      elapsedSeconds: prev.elapsedSeconds + Math.max(0, Math.floor(deltaSeconds)),
      lastActiveAt: new Date().toISOString(),
    },
  });
}

export function completeRuntime(moduleId: string) {
  const now = new Date().toISOString();
  const prev = getRuntimeRecord(moduleId);
  write({
    ...memory,
    [moduleId]: {
      ...prev,
      moduleId,
      status: "completed",
      startedAt: prev.startedAt ?? now,
      completedAt: now,
      lastActiveAt: now,
    },
  });
}

export function resetRuntime(moduleId: string) {
  if (!memory[moduleId]) return;
  const next = { ...memory };
  delete next[moduleId];
  write(next);
}

export function useRuntimeRecord(moduleId: string): AcademyRuntimeRecord {
  const store = useSyncExternalStore(subscribe, snapshot, snapshot);
  return store[moduleId] ?? { moduleId, status: "not_started", elapsedSeconds: 0 };
}