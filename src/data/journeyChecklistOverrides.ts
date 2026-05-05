import type { JourneyStep, JourneyRole } from "./journey";
import { STEPS_BY_ROLE } from "./journey";

export type JourneyAudienceKey = "rbt" | "bcba";

export interface ChecklistVersion {
  /** 1-based version number; latest is the largest. */
  version: number;
  items: string[];
  savedAt: string; // ISO
  savedBy: string;
  note?: string;
}

export interface JourneyChecklistOverride {
  audience: JourneyAudienceKey;
  /** Step id (matches JourneyStep.id) */
  stepId: string;
  /** Which version is currently published / active. */
  activeVersion: number;
  versions: ChecklistVersion[];
  updatedAt: string;
}

export const JOURNEY_CHECKLIST_OVERRIDES_KEY = "blossom-journey-checklist-overrides";
export const JOURNEY_CHECKLIST_OVERRIDES_EVENT = "blossom-journey-checklist-overrides-updated";

function audienceToRoles(a: JourneyAudienceKey): JourneyRole[] {
  return a === "bcba" ? ["bcba"] : ["rbt-uncertified", "rbt-certified"];
}

/** Get the canonical (default) steps for an audience, deduped by step id. */
export function getDefaultStepsForAudience(audience: JourneyAudienceKey): JourneyStep[] {
  const seen = new Map<string, JourneyStep>();
  for (const role of audienceToRoles(audience)) {
    for (const s of STEPS_BY_ROLE[role]) {
      if (!seen.has(s.id)) seen.set(s.id, s);
    }
  }
  return Array.from(seen.values());
}

export function getStoredChecklistOverrides(): JourneyChecklistOverride[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(JOURNEY_CHECKLIST_OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as JourneyChecklistOverride[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredChecklistOverrides(next: JourneyChecklistOverride[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(JOURNEY_CHECKLIST_OVERRIDES_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(JOURNEY_CHECKLIST_OVERRIDES_EVENT));
}

export function getOverride(
  audience: JourneyAudienceKey,
  stepId: string,
): JourneyChecklistOverride | undefined {
  return getStoredChecklistOverrides().find(
    (o) => o.audience === audience && o.stepId === stepId,
  );
}

/** Publish a brand new version with the given items. */
export function publishChecklistVersion(opts: {
  audience: JourneyAudienceKey;
  stepId: string;
  items: string[];
  savedBy: string;
  note?: string;
}): JourneyChecklistOverride {
  const all = getStoredChecklistOverrides();
  const existing = all.find(
    (o) => o.audience === opts.audience && o.stepId === opts.stepId,
  );
  const nextVersionNumber = existing ? Math.max(...existing.versions.map((v) => v.version)) + 1 : 1;
  const newVersion: ChecklistVersion = {
    version: nextVersionNumber,
    items: opts.items.map((s) => s.trim()).filter(Boolean),
    savedAt: new Date().toISOString(),
    savedBy: opts.savedBy,
    note: opts.note?.trim() || undefined,
  };
  const updated: JourneyChecklistOverride = existing
    ? {
        ...existing,
        activeVersion: newVersion.version,
        versions: [newVersion, ...existing.versions],
        updatedAt: new Date().toISOString(),
      }
    : {
        audience: opts.audience,
        stepId: opts.stepId,
        activeVersion: newVersion.version,
        versions: [newVersion],
        updatedAt: new Date().toISOString(),
      };
  const next = existing
    ? all.map((o) => (o === existing ? updated : o))
    : [...all, updated];
  saveStoredChecklistOverrides(next);
  return updated;
}

/** Switch which version is currently active without losing history. */
export function setActiveChecklistVersion(
  audience: JourneyAudienceKey,
  stepId: string,
  version: number,
) {
  const all = getStoredChecklistOverrides();
  const next = all.map((o) =>
    o.audience === audience && o.stepId === stepId
      ? { ...o, activeVersion: version, updatedAt: new Date().toISOString() }
      : o,
  );
  saveStoredChecklistOverrides(next);
}

/** Remove the override entirely — step reverts to defaults baked into journey.ts. */
export function resetChecklistToDefault(
  audience: JourneyAudienceKey,
  stepId: string,
) {
  const next = getStoredChecklistOverrides().filter(
    (o) => !(o.audience === audience && o.stepId === stepId),
  );
  saveStoredChecklistOverrides(next);
}

/**
 * Resolve the checklist that should actually render for a given step.
 * Returns the active-version items if there's an override, else the default.
 */
export function resolveChecklist(
  audience: JourneyAudienceKey,
  step: JourneyStep,
): { items: string[]; version?: number; isOverride: boolean } {
  const o = getOverride(audience, step.id);
  if (!o) return { items: step.checklist, isOverride: false };
  const active = o.versions.find((v) => v.version === o.activeVersion) ?? o.versions[0];
  return { items: active.items, version: active.version, isOverride: true };
}

/** Apply checklist overrides to a list of steps for rendering. */
export function applyChecklistOverrides(
  steps: JourneyStep[],
  audience: JourneyAudienceKey,
): JourneyStep[] {
  const overrides = getStoredChecklistOverrides().filter((o) => o.audience === audience);
  if (!overrides.length) return steps;
  const map = new Map(overrides.map((o) => [o.stepId, o] as const));
  return steps.map((s) => {
    const o = map.get(s.id);
    if (!o) return s;
    const active = o.versions.find((v) => v.version === o.activeVersion) ?? o.versions[0];
    return { ...s, checklist: active.items };
  });
}
