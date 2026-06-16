// RBT Training Academy — resources system.
// Starter resources are seeded in code; admin edits are persisted to localStorage,
// so a backend can be added later without changing consumer code.

import { useSyncExternalStore } from "react";

export type RBTResourceType =
  | "YouTube Video"
  | "Internal Video"
  | "SOP"
  | "Checklist"
  | "Template"
  | "Quiz"
  | "Mock Form"
  | "Trainer Note";

export const RBT_RESOURCE_TYPES: RBTResourceType[] = [
  "YouTube Video",
  "Internal Video",
  "SOP",
  "Checklist",
  "Template",
  "Quiz",
  "Mock Form",
  "Trainer Note",
];

export interface RBTResource {
  id: string;
  title: string;
  type: RBTResourceType;
  /** External link, internal path, or YouTube URL. Optional for trainer notes. */
  url?: string;
  /** Short description shown under the title. */
  description?: string;
  /** Long-form body — used for trainer notes / inline guides. */
  body?: string;
  /** Module ids this resource is attached to. Empty array = academy-wide. */
  moduleIds: string[];
  /** Estimated minutes to consume. */
  minutes?: number;
  /** True when seeded in code (cannot be hard-deleted, only hidden/overridden). */
  seeded?: boolean;
  updatedAt?: string;
}

// ---------- Starter resources ----------

export const STARTER_RBT_RESOURCES: RBTResource[] = [
  {
    id: "seed-aba-playlist",
    title: "ABA Explained — video playlist",
    type: "YouTube Video",
    url: "https://www.youtube.com/playlist?list=PLABA_EXPLAINED",
    description: "Plain-language intro to ABA concepts for new RBTs.",
    moduleIds: ["nc-c2", "ne-a1", "u2-g2"],
    minutes: 35,
    seeded: true,
  },
  {
    id: "seed-data-quick-guide",
    title: "Data Collection quick guide",
    type: "Checklist",
    url: "/resources/rbt/data-collection-quick-guide",
    description: "Frequency, duration, ABC, and trial-by-trial — the fast version.",
    moduleIds: ["nc-k1", "ne-d1"],
    minutes: 6,
    seeded: true,
  },
  {
    id: "seed-session-notes-guide",
    title: "Session Notes Documentation guide",
    type: "SOP",
    url: "/resources/rbt/session-notes-guide",
    description: "Writing complete, billable, audit-ready session notes.",
    moduleIds: ["nc-k2", "ne-d1", "ex-d1"],
    minutes: 12,
    seeded: true,
  },
  {
    id: "seed-session-note-form",
    title: "Session note training form",
    type: "Mock Form",
    url: "/resources/rbt/mock-session-note-form",
    description: "Practice form — submit for Documentation Reviewer feedback.",
    moduleIds: ["nc-s2"],
    minutes: 20,
    seeded: true,
  },
  {
    id: "seed-competency-checklist",
    title: "Competency checklist",
    type: "Checklist",
    url: "/resources/rbt/competency-checklist",
    description: "Items the BCBA reviews during the client-based competency.",
    moduleIds: ["nc-cp1", "nc-cp2"],
    minutes: 10,
    seeded: true,
  },
  {
    id: "seed-safety-escalation",
    title: "Safety and escalation flow",
    type: "SOP",
    url: "/resources/rbt/safety-escalation-flow",
    description: "De-escalation, incident reporting, and who to call.",
    moduleIds: ["ex-s1"],
    minutes: 8,
    seeded: true,
  },
  {
    id: "seed-parent-comms",
    title: "Parent communication guide",
    type: "SOP",
    url: "/resources/rbt/parent-communication",
    description: "Tone, what to share, what to escalate.",
    moduleIds: ["ex-p1"],
    minutes: 8,
    seeded: true,
  },
  {
    id: "seed-professionalism",
    title: "Professionalism and field standards checklist",
    type: "Checklist",
    url: "/resources/rbt/professionalism-checklist",
    description: "How Blossom RBTs show up — dress, punctuality, boundaries.",
    moduleIds: ["ne-p1"],
    minutes: 5,
    seeded: true,
  },
  {
    id: "seed-os-quick-tour",
    title: "Blossom OS quick tour for RBTs",
    type: "Internal Video",
    url: "/resources/rbt/os-quick-tour",
    description: "My Day, schedule, messages, and where everything lives.",
    moduleIds: ["welcome-3"],
    minutes: 6,
    seeded: true,
  },
];

export function iconForType(type: RBTResourceType): string {
  // Returns a stable key consumers can map to a lucide icon.
  switch (type) {
    case "YouTube Video":
    case "Internal Video": return "video";
    case "SOP":            return "sop";
    case "Checklist":      return "checklist";
    case "Template":       return "template";
    case "Quiz":           return "quiz";
    case "Mock Form":      return "form";
    case "Trainer Note":   return "note";
  }
}

// ---------- Store (localStorage, with React hook) ----------

const STORAGE_KEY = "blossom.rbt.resources.v1";

type StoredShape = {
  // Resources added by admins.
  custom: RBTResource[];
  // Edits applied on top of seeded resources, keyed by id.
  overrides: Record<string, Partial<RBTResource>>;
  // IDs of seeded resources the admin chose to hide.
  hiddenSeedIds: string[];
};

function emptyStore(): StoredShape {
  return { custom: [], overrides: {}, hiddenSeedIds: [] };
}

function readStore(): StoredShape {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    return { ...emptyStore(), ...parsed };
  } catch {
    return emptyStore();
  }
}

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }

function writeStore(next: StoredShape) {
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

function buildResources(store: StoredShape): RBTResource[] {
  const seeded = STARTER_RBT_RESOURCES
    .filter((r) => !store.hiddenSeedIds.includes(r.id))
    .map((r) => ({ ...r, ...(store.overrides[r.id] ?? {}) }));
  return [...seeded, ...store.custom];
}

let cache: { store: StoredShape; resources: RBTResource[] } | null = null;
function getSnapshot(): RBTResource[] {
  const store = readStore();
  if (!cache || cache.store !== store) {
    // Compare by stringification — store reads return new objects.
    const sig = JSON.stringify(store);
    if (!cache || JSON.stringify(cache.store) !== sig) {
      cache = { store, resources: buildResources(store) };
    }
  }
  return cache.resources;
}

export function useRBTResources(): RBTResource[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => STARTER_RBT_RESOURCES);
}

export function getResourcesForModule(all: RBTResource[], moduleId: string): RBTResource[] {
  return all.filter((r) => r.moduleIds.includes(moduleId));
}

// ---------- Admin mutations ----------

function nextId() {
  return `rsrc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function addResource(input: Omit<RBTResource, "id" | "seeded" | "updatedAt">) {
  const store = readStore();
  const resource: RBTResource = {
    ...input,
    id: nextId(),
    seeded: false,
    updatedAt: new Date().toISOString(),
  };
  writeStore({ ...store, custom: [...store.custom, resource] });
  return resource;
}

export function updateResource(id: string, patch: Partial<RBTResource>) {
  const store = readStore();
  const seeded = STARTER_RBT_RESOURCES.find((r) => r.id === id);
  if (seeded) {
    writeStore({
      ...store,
      overrides: {
        ...store.overrides,
        [id]: { ...(store.overrides[id] ?? {}), ...patch, updatedAt: new Date().toISOString() },
      },
    });
    return;
  }
  writeStore({
    ...store,
    custom: store.custom.map((r) =>
      r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r,
    ),
  });
}

export function removeResource(id: string) {
  const store = readStore();
  const seeded = STARTER_RBT_RESOURCES.find((r) => r.id === id);
  if (seeded) {
    if (store.hiddenSeedIds.includes(id)) return;
    writeStore({ ...store, hiddenSeedIds: [...store.hiddenSeedIds, id] });
    return;
  }
  writeStore({ ...store, custom: store.custom.filter((r) => r.id !== id) });
}

export function restoreSeededResource(id: string) {
  const store = readStore();
  writeStore({
    ...store,
    hiddenSeedIds: store.hiddenSeedIds.filter((x) => x !== id),
    overrides: Object.fromEntries(Object.entries(store.overrides).filter(([k]) => k !== id)),
  });
}