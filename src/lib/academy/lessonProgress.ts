/**
 * Per-lesson progress tracker for the Training Academy.
 *
 * Lightweight localStorage-backed store keyed by `${moduleId}::${lessonId}`.
 * Complements `runtimeStore` (which tracks module-level runtime): lessons
 * are the sub-units inside a module, and completing all lessons in a module
 * should nudge the module toward completion.
 *
 * The store is intentionally simple and per-device — Supabase mirroring can
 * be added later without changing the consumer API.
 */
import { useSyncExternalStore } from "react";

export type LessonStatus = "not_started" | "in_progress" | "completed";

export interface LessonRecord {
  status: LessonStatus;
  startedAt?: string;
  completedAt?: string;
  reflection?: string;
}

type Store = Record<string, LessonRecord>;

const KEY = "blossom.academy.lessonProgress.v1";

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
function subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }
function snapshot(): Store { return memory; }

export function lessonKey(moduleId: string, lessonId: string): string {
  return `${moduleId}::${lessonId}`;
}

export function getLessonRecord(moduleId: string, lessonId: string): LessonRecord {
  return memory[lessonKey(moduleId, lessonId)] ?? { status: "not_started" };
}

export function startLesson(moduleId: string, lessonId: string): void {
  const k = lessonKey(moduleId, lessonId);
  const prev = memory[k];
  if (prev?.status === "completed" || prev?.status === "in_progress") return;
  write({ ...memory, [k]: { status: "in_progress", startedAt: new Date().toISOString() } });
}

export function completeLesson(moduleId: string, lessonId: string, reflection?: string): void {
  const k = lessonKey(moduleId, lessonId);
  const prev = memory[k] ?? { status: "not_started" as LessonStatus };
  write({
    ...memory,
    [k]: {
      ...prev,
      status: "completed",
      startedAt: prev.startedAt ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
      reflection: reflection ?? prev.reflection,
    },
  });
}

export function resetLesson(moduleId: string, lessonId: string): void {
  const k = lessonKey(moduleId, lessonId);
  if (!memory[k]) return;
  const next = { ...memory };
  delete next[k];
  write(next);
}

/** React hook — subscribes to the store and returns the record for one lesson. */
export function useLessonRecord(moduleId: string, lessonId: string): LessonRecord {
  const store = useSyncExternalStore(subscribe, snapshot, snapshot);
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