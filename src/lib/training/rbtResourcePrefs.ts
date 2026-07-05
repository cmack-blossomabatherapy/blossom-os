// Per-user RBT resource preferences: bookmarks, recently-viewed, completed.
// Source of truth is the Supabase table public.rbt_resource_prefs.
// localStorage is only a temporary offline cache/fallback until the user's
// session is available or when the write cannot reach the backend.

import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const value = useSyncExternalStore(subscribe, snapshot, empty);
  useEffect(() => { void hydrateFromSupabase(); }, []);
  return value;
}

async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch { return null; }
}

let hydrated = false;
export async function hydrateFromSupabase() {
  if (hydrated) return;
  hydrated = true;
  const uid = await currentUserId();
  if (!uid) return;
  try {
    const { data, error } = await supabase
      .from("rbt_resource_prefs")
      .select("resource_id, bookmarked, completed, viewed, last_viewed_at")
      .eq("user_id", uid);
    if (error || !data) return;
    const cur = read();
    const bookmarked = new Set(cur.bookmarked);
    const completed = new Set(cur.completed);
    const recent = new Map<string, number>();
    cur.recent.forEach((id, i) => recent.set(id, -i));
    for (const row of data as Array<{ resource_id: string; bookmarked: boolean; completed: boolean; viewed: boolean; last_viewed_at: string | null }>) {
      if (row.bookmarked) bookmarked.add(row.resource_id); else bookmarked.delete(row.resource_id);
      if (row.completed) completed.add(row.resource_id); else completed.delete(row.resource_id);
      if (row.viewed && row.last_viewed_at) recent.set(row.resource_id, new Date(row.last_viewed_at).getTime());
    }
    const sortedRecent = Array.from(recent.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
      .slice(0, MAX_RECENT);
    write({
      bookmarked: Array.from(bookmarked),
      completed: Array.from(completed),
      recent: sortedRecent,
    });
  } catch { /* offline fallback */ }
}

async function upsertPref(patch: { resource_id: string; bookmarked?: boolean; completed?: boolean; viewed?: boolean; last_viewed_at?: string }) {
  const uid = await currentUserId();
  if (!uid) return;
  try {
    await supabase
      .from("rbt_resource_prefs")
      .upsert({ user_id: uid, ...patch }, { onConflict: "user_id,resource_id" });
  } catch { /* offline fallback */ }
}

export function toggleBookmark(id: string) {
  const cur = read();
  const has = cur.bookmarked.includes(id);
  const next = has
    ? { ...cur, bookmarked: cur.bookmarked.filter((x) => x !== id) }
    : { ...cur, bookmarked: [id, ...cur.bookmarked] };
  write(next);
  void upsertPref({ resource_id: id, bookmarked: !has });
}

export function toggleComplete(id: string) {
  const cur = read();
  const has = cur.completed.includes(id);
  const next = has
    ? { ...cur, completed: cur.completed.filter((x) => x !== id) }
    : { ...cur, completed: [id, ...cur.completed] };
  write(next);
  void upsertPref({ resource_id: id, completed: !has });
}

export function markViewed(id: string) {
  const cur = read();
  const recent = [id, ...cur.recent.filter((x) => x !== id)].slice(0, MAX_RECENT);
  write({ ...cur, recent });
  void upsertPref({ resource_id: id, viewed: true, last_viewed_at: new Date().toISOString() });
}