import type { TrainingModule } from "./journey";

export type JourneyAudienceKey = "rbt" | "bcba";

export interface ModuleLinkOverride {
  label: string;
  url: string;
  description?: string;
}

export interface JourneyModuleOverride {
  /** Module id (matches TrainingModule.id) */
  id: string;
  audience: JourneyAudienceKey;
  links?: ModuleLinkOverride[];
  coordinatorName?: string;
  coordinatorEmail?: string;
  coordinatorRole?: string;
  moreInfo?: string;
  updatedAt: string;
}

export const JOURNEY_MODULE_OVERRIDES_KEY = "blossom-journey-module-overrides";
export const JOURNEY_MODULE_OVERRIDES_EVENT = "blossom-journey-module-overrides-updated";

export function getStoredModuleOverrides(): JourneyModuleOverride[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(JOURNEY_MODULE_OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as JourneyModuleOverride[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredModuleOverrides(next: JourneyModuleOverride[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(JOURNEY_MODULE_OVERRIDES_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(JOURNEY_MODULE_OVERRIDES_EVENT));
}

export function upsertModuleOverride(o: JourneyModuleOverride) {
  const all = getStoredModuleOverrides();
  const idx = all.findIndex((x) => x.id === o.id && x.audience === o.audience);
  const next = idx === -1 ? [...all, o] : all.map((x, i) => (i === idx ? o : x));
  saveStoredModuleOverrides(next);
}

export function deleteModuleOverride(id: string, audience: JourneyAudienceKey) {
  const next = getStoredModuleOverrides().filter(
    (x) => !(x.id === id && x.audience === audience),
  );
  saveStoredModuleOverrides(next);
}

export function applyModuleOverrides(
  modules: TrainingModule[],
  audience: JourneyAudienceKey,
): TrainingModule[] {
  const overrides = getStoredModuleOverrides().filter((o) => o.audience === audience);
  if (!overrides.length) return modules;
  const map = new Map(overrides.map((o) => [o.id, o] as const));
  return modules.map((m) => {
    const o = map.get(m.id);
    if (!o) return m;
    return {
      ...m,
      links: o.links && o.links.length ? o.links : m.links,
      coordinatorName: o.coordinatorName ?? m.coordinatorName,
      coordinatorEmail: o.coordinatorEmail ?? m.coordinatorEmail,
      coordinatorRole: o.coordinatorRole ?? m.coordinatorRole,
      moreInfo: o.moreInfo ?? m.moreInfo,
    };
  });
}