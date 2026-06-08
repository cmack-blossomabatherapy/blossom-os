/**
 * Runtime readiness computations for the State Director Training Academy.
 *
 * Centralises the logic that powers the launch readiness panel + tests so
 * we never hard-code green checks for content/resources/screenshots/video.
 */
import {
  SD_JOURNEY_MODULE_IDS,
  getTraining,
  type Training,
} from "./academyData";
import {
  getStateDirectorFullContent,
  getStateDirectorScreenshots,
  SD_PRIORITY_SCREENSHOT_MODULES,
} from "./stateDirectorFullTraining";
import type { Resource } from "@/lib/resources/resourceData";
import { normalizeSopTitle } from "@/lib/resources/sdSopCoverage";

export interface SDContentReadiness {
  total: number;
  complete: number;
  missing: { id: string; title: string; reason: string }[];
  ok: boolean;
}

export interface SDScreenshotReadiness {
  totalRegistered: number;
  available: number;
  pending: number;
  needsRedaction: number;
  ok: boolean;
}

/** Verifies every SD module exposes the required learner-facing fields. */
export function computeSdContentReadiness(): SDContentReadiness {
  const missing: { id: string; title: string; reason: string }[] = [];
  let complete = 0;
  for (const id of SD_JOURNEY_MODULE_IDS) {
    const t = getTraining(id);
    if (!t) {
      missing.push({ id, title: id, reason: "Module not found in academy data." });
      continue;
    }
    const reasons: string[] = [];
    if (!t.whyItMatters) reasons.push("whyItMatters");
    if (!t.whatToDo) reasons.push("whatToDo");
    if (!t.completionEvidence) reasons.push("completionEvidence");
    const full = getStateDirectorFullContent(t);
    if (!full) reasons.push("fullContent");
    if (full && (!full.knowledgeCheck || full.knowledgeCheck.length === 0)) {
      reasons.push("knowledgeCheck");
    }
    if (reasons.length === 0) {
      complete += 1;
    } else {
      missing.push({ id: t.id, title: t.title, reason: `Missing: ${reasons.join(", ")}` });
    }
  }
  return {
    total: SD_JOURNEY_MODULE_IDS.length,
    complete,
    missing,
    ok: missing.length === 0 && complete > 0,
  };
}

/** Per-module screenshot availability across the registered SD priority set. */
export function computeSdScreenshotReadiness(): SDScreenshotReadiness {
  let available = 0;
  let pending = 0;
  let needsRedaction = 0;
  for (const moduleId of SD_PRIORITY_SCREENSHOT_MODULES) {
    for (const shot of getStateDirectorScreenshots(moduleId)) {
      if (shot.resourceStatus === "available") available += 1;
      else if (shot.resourceStatus === "needs_redaction") needsRedaction += 1;
      else pending += 1;
    }
  }
  const totalRegistered = available + pending + needsRedaction;
  return {
    totalRegistered,
    available,
    pending,
    needsRedaction,
    // Green only when every registered screenshot resolves to an available asset.
    ok: totalRegistered > 0 && pending === 0 && needsRedaction === 0,
  };
}

const WELCOME_VIDEO_TITLES = [
  "Welcome Video from Blossom",
  "Welcome to Blossom Video",
  "Blossom Welcome Video",
  "Welcome from Chad and Shira",
  "Welcome from Chad Kaufman",
  "Welcome from Chad",
  "A Note from Shira Lasry",
];

const WELCOME_KEYS = new Set(WELCOME_VIDEO_TITLES.map((t) => normalizeSopTitle(t)));

/** Returns every resource whose title matches the welcome-video naming set. */
export function findWelcomeVideoCandidates(resources: Resource[]): Resource[] {
  return resources.filter((r) => WELCOME_KEYS.has(normalizeSopTitle(r.title)));
}

/** Returns the first published+openable resource that represents the welcome video. */
export function findWelcomeVideoResource(resources: Resource[]): Resource | null {
  for (const r of resources) {
    if (!WELCOME_KEYS.has(normalizeSopTitle(r.title))) continue;
    if (r.status === "Archived") continue;
    if (r.uploadStatus && r.uploadStatus !== "published") continue;
    if (r.sensitivity === "excluded") continue;
    const hasUrl = !!(r.url && /^https?:\/\//i.test(r.url)) || !!r.fileUrl;
    const hasStorage = !!(r as Resource & { storagePath?: string }).storagePath;
    if (hasUrl || hasStorage) return r;
  }
  return null;
}

/** Resolved welcome video state — used by the readiness panel and welcome page. */
export interface SDWelcomeVideoState {
  ok: boolean;
  resource: Resource | null;
  url: string | null;
}

export function computeSdWelcomeVideoState(
  resources: Resource[],
  externalUrl?: string,
): SDWelcomeVideoState {
  if (externalUrl && /^https?:\/\//i.test(externalUrl)) {
    return { ok: true, resource: null, url: externalUrl };
  }
  const r = findWelcomeVideoResource(resources);
  if (!r) return { ok: false, resource: null, url: null };
  const url = r.fileUrl || r.url || null;
  // Storage-path-only resources resolve at click-time; treat as ok for the panel.
  return { ok: true, resource: r, url };
}

/** Readiness-panel friendly status for the Welcome video row. */
export interface SDWelcomeVideoCheck {
  state: "ok" | "warn" | "manual";
  label: string;
  note: string;
}

export function computeSdWelcomeVideoCheck(
  resources: Resource[],
): SDWelcomeVideoCheck {
  const openable = findWelcomeVideoResource(resources);
  if (openable) {
    return {
      state: "ok",
      label: "Welcome video linked",
      note: `Published resource "${openable.title}" is openable from the Welcome page.`,
    };
  }
  const candidates = findWelcomeVideoCandidates(resources);
  if (candidates.length > 0) {
    return {
      state: "warn",
      label: "Welcome video linked",
      note: "A matching resource exists but is not openable — finish publishing or attach a file.",
    };
  }
  return {
    state: "manual",
    label: "Welcome video linked",
    note: "Confirm a published Welcome video resource (e.g. 'Welcome Video from Blossom') exists before launch.",
  };
}

// Helper re-export for tests.
export function _onlySdTrainings(): Training[] {
  return SD_JOURNEY_MODULE_IDS
    .map((id) => getTraining(id))
    .filter((t): t is Training => !!t);
}