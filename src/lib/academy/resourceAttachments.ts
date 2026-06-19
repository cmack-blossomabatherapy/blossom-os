/**
 * Training Academy resource attachments (admin → learner bridge).
 *
 * Admins in Training Management attach existing Resource Library items to
 * journeys, days, and modules. Learner pages read those attachments through
 * the resource resolver and render them on journey/day/module surfaces.
 *
 * Storage: temporary localStorage store (`blossom.training.resourceAttachments.v1`)
 * keyed by attachment id. A Supabase table can replace this without changing
 * the consumer API.
 */
import { useSyncExternalStore } from "react";

export type AttachmentScope = "journey" | "day" | "module";
export type AttachmentRequiredness = "required" | "recommended" | "optional";

export interface TrainingResourceAttachment {
  id: string;
  resourceId: string;
  resourceTitle: string;
  resourceType?: string;
  resourceUrl?: string;
  scope: AttachmentScope;
  journeySlug: string;
  dayId?: string;
  moduleId?: string;
  requiredness: AttachmentRequiredness;
  instructions?: string;
  source?: "resource-library" | "rbt-seeded" | "academy-module" | "sd-sop" | "manual";
  createdAt: string;
  updatedAt: string;
}

const KEY = "blossom.training.resourceAttachments.v1";

type Store = Record<string, TrainingResourceAttachment>;

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
function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }
function snapshot(): Store { return memory; }

function uid() { return "att_" + Math.random().toString(36).slice(2, 10); }

export function listAttachments(): TrainingResourceAttachment[] {
  return Object.values(memory);
}

export function listAttachmentsForJourney(journeySlug: string): TrainingResourceAttachment[] {
  return listAttachments().filter((a) => a.journeySlug === journeySlug);
}

export function listAttachmentsForScope(opts: {
  journeySlug: string;
  dayId?: string;
  moduleId?: string;
}): TrainingResourceAttachment[] {
  return listAttachments().filter((a) => {
    if (a.journeySlug !== opts.journeySlug) return false;
    if (a.scope === "module") return a.moduleId === opts.moduleId;
    if (a.scope === "day") return a.dayId === opts.dayId;
    if (a.scope === "journey") return true;
    return false;
  });
}

export function addAttachment(
  input: Omit<TrainingResourceAttachment, "id" | "createdAt" | "updatedAt">,
): TrainingResourceAttachment {
  const now = new Date().toISOString();
  const att: TrainingResourceAttachment = { ...input, id: uid(), createdAt: now, updatedAt: now };
  write({ ...memory, [att.id]: att });
  return att;
}

export function removeAttachment(id: string) {
  if (!memory[id]) return;
  const next = { ...memory };
  delete next[id];
  write(next);
}

export function updateAttachment(id: string, patch: Partial<TrainingResourceAttachment>) {
  const prev = memory[id];
  if (!prev) return;
  write({ ...memory, [id]: { ...prev, ...patch, id, updatedAt: new Date().toISOString() } });
}

export function useResourceAttachments(): TrainingResourceAttachment[] {
  const store = useSyncExternalStore(subscribe, snapshot, snapshot);
  return Object.values(store);
}