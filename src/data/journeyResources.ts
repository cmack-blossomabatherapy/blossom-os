import {
  Award, BookOpen, ClipboardCheck, ExternalLink, FileText, FolderOpen,
  GraduationCap, Link2, Settings2, Stethoscope, Video,
  type LucideIcon,
} from "lucide-react";
import {
  DEFAULT_BCBA_RESOURCES, DEFAULT_RBT_RESOURCES,
  type JourneyResource,
} from "./journey";

export type JourneyAudience = "rbt" | "bcba" | "both";
export const JOURNEY_RESOURCE_CATEGORIES = [
  "Drive", "BACB", "Guide", "Examples", "System",
] as const;
export type JourneyResourceCategory = (typeof JOURNEY_RESOURCE_CATEGORIES)[number];

export const JOURNEY_RESOURCE_ICONS: Record<string, LucideIcon> = {
  BookOpen, Award, ClipboardCheck, FileText, FolderOpen, GraduationCap,
  Link2, Settings2, Stethoscope, Video, ExternalLink,
};
export const JOURNEY_RESOURCE_ICON_NAMES = Object.keys(JOURNEY_RESOURCE_ICONS);

export interface StoredJourneyResource {
  id: string;
  audience: JourneyAudience;
  title: string;
  description: string;
  url: string;
  category: JourneyResourceCategory;
  iconName: string;
  internalRoute?: string;
  pinned?: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export const JOURNEY_RESOURCES_STORAGE_KEY = "blossom-journey-resources";
export const JOURNEY_RESOURCES_UPDATED_EVENT = "blossom-journey-resources-updated";

const iconNameFor = (icon: LucideIcon): string => {
  const match = Object.entries(JOURNEY_RESOURCE_ICONS).find(([, v]) => v === icon);
  return match?.[0] ?? "BookOpen";
};

const seedFromDefaults = (): StoredJourneyResource[] => {
  const now = new Date().toISOString();
  const map = (audience: JourneyAudience, list: JourneyResource[]) =>
    list.map((r, i) => ({
      id: `${audience}-${r.id}`,
      audience,
      title: r.title,
      description: r.description,
      url: r.url,
      category: r.category as JourneyResourceCategory,
      iconName: iconNameFor(r.icon),
      internalRoute: r.internalRoute,
      pinned: i === 0,
      position: i,
      createdAt: now,
      updatedAt: now,
    }));
  return [
    ...map("rbt", DEFAULT_RBT_RESOURCES),
    ...map("bcba", DEFAULT_BCBA_RESOURCES),
  ];
};

export function getStoredJourneyResources(): StoredJourneyResource[] {
  if (typeof window === "undefined") return seedFromDefaults();
  try {
    const raw = window.localStorage.getItem(JOURNEY_RESOURCES_STORAGE_KEY);
    if (!raw) {
      const seed = seedFromDefaults();
      window.localStorage.setItem(JOURNEY_RESOURCES_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as StoredJourneyResource[];
  } catch {
    return seedFromDefaults();
  }
}

export function saveStoredJourneyResources(next: StoredJourneyResource[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(JOURNEY_RESOURCES_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(JOURNEY_RESOURCES_UPDATED_EVENT));
}

/** Convert a stored resource to the JourneyResource shape used by the UI. */
export function toJourneyResource(r: StoredJourneyResource): JourneyResource {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    url: r.url,
    category: r.category as JourneyResource["category"],
    icon: JOURNEY_RESOURCE_ICONS[r.iconName] ?? BookOpen,
    internalRoute: r.internalRoute,
  };
}

/** Returns admin-managed resources for an audience, sorted (pinned first, then position). */
export function getJourneyResourcesFor(audience: "rbt" | "bcba"): JourneyResource[] {
  const all = getStoredJourneyResources();
  return all
    .filter((r) => r.audience === audience || r.audience === "both")
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || a.position - b.position)
    .map(toJourneyResource);
}