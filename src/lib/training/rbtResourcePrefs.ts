// Per-user RBT resource preferences: bookmarks, recently-viewed, completed.
// Persisted to localStorage so a backend can replace this later without API changes.

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "blossom.rbt.resource.prefs.v1";
const MAX_RECENT = 12;

export interface ResourcePrefs {
  bookmarked: string[];
  completed: string[];
  recent: string[]; // most-recent first
}

function empty(): ResourcePrefs {
  return { bookmarked: [], completed: [], recent: [] };
}

function read(): ResourcePrefs {
  if (typeof window === "undefined") return empty();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
}

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }

function write(next: ResourcePrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) cb(); };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

let cache: { sig: string; value: ResourcePrefs } | null = null;
function snapshot(): ResourcePrefs {
  const v = read();
  const sig = JSON.stringify(v);
  if (!cache || cache.sig !== sig) cache = { sig, value: v };
  return cache.value;
}

export function useResourcePrefs(): ResourcePrefs {
  return useSyncExternalStore(subscribe, snapshot, empty);
}

export function toggleBookmark(id: string) {
  const cur = read();
  const next = cur.bookmarked.includes(id)
    ? { ...cur, bookmarked: cur.bookmarked.filter((x) => x !== id) }
    : { ...cur, bookmarked: [id, ...cur.bookmarked] };
  write(next);
}

export function toggleComplete(id: string) {
  const cur = read();
  const next = cur.completed.includes(id)
    ? { ...cur, completed: cur.completed.filter((x) => x !== id) }
    : { ...cur, completed: [id, ...cur.completed] };
  write(next);
}

export function markViewed(id: string) {
  const cur = read();
  const recent = [id, ...cur.recent.filter((x) => x !== id)].slice(0, MAX_RECENT);
  write({ ...cur, recent });
}