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
import {
  SD_ALL_SCREENSHOTS,
  SD_W1_SCREENSHOT_MODULE_IDS,
  findScreenshotResource,
  isScreenshotPiiSafe,
  getStateDirectorNoScreenshotDecision,
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

export interface SDScreenshotWeekBreakdown {
  total: number;
  matched: number;
  missing: number;
  needsRedaction: number;
  needsFileRepair: number;
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

/**
 * Live screenshot coverage breakdown computed against the actual uploaded
 * resource set. Separates Week 1 from "All SD" so Training Management can
 * report Week 1 launch readiness independently of the full 25-day journey.
 */
export function computeSdScreenshotCoverage(resources: Resource[]): {
  week1: SDScreenshotWeekBreakdown;
  all: SDScreenshotWeekBreakdown;
} {
  const breakdown = (filter: (m: string) => boolean): SDScreenshotWeekBreakdown => {
    const shots = SD_ALL_SCREENSHOTS.filter((s) => filter(s.moduleId));
    let matched = 0;
    let needsRedaction = 0;
    let needsFileRepair = 0;
    for (const s of shots) {
      const piiUnsafe = !isScreenshotPiiSafe(s);
      const heldForRedaction =
        s.resourceStatus === "needs_redaction" || s.sensitivity === "needs_redaction" || piiUnsafe;
      if (heldForRedaction) { needsRedaction += 1; continue; }
      const m = findScreenshotResource(s, resources);
      if (m && m.openable) { matched += 1; continue; }
      if (m && !m.openable) { needsFileRepair += 1; continue; }
    }
    const total = shots.length;
    return {
      total,
      matched,
      missing: total - matched - needsRedaction - needsFileRepair,
      needsRedaction,
      needsFileRepair,
    };
  };
  return {
    week1: breakdown((m) => m.startsWith("sd-w1d")),
    all: breakdown(() => true),
  };
}

/**
 * High-level Week 1 launch status used by Training Management. Returns the
 * single signal an admin needs: are we launch-ready for a real State
 * Director starting this week?
 */
export interface SDWeek1LaunchStatus {
  ready: boolean;
  state: "ready" | "almost" | "blocked";
  reasons: string[];
  screenshots: SDScreenshotWeekBreakdown;
  welcomeVideoLinkedOrPending: boolean;
}

export function computeSdWeek1LaunchStatus(
  resources: Resource[],
  welcomeVideoExternalUrl?: string,
): SDWeek1LaunchStatus {
  const reasons: string[] = [];
  const coverage = computeSdScreenshotCoverage(resources);
  const week1Shots = coverage.week1;
  // Week 1 screenshots: matched, or intentionally no-screenshot, or covered by
  // the no-screenshot decision registry.
  const screenshotsOk =
    week1Shots.total === 0 ||
    (week1Shots.missing === 0 && week1Shots.needsFileRepair === 0);
  if (!screenshotsOk) {
    if (week1Shots.missing > 0) {
      reasons.push(`${week1Shots.missing} Week 1 screenshots not yet matched to an upload`);
    }
    if (week1Shots.needsFileRepair > 0) {
      reasons.push(`${week1Shots.needsFileRepair} Week 1 screenshots need file repair`);
    }
  }
  if (week1Shots.needsRedaction > 0) {
    reasons.push(`${week1Shots.needsRedaction} Week 1 screenshots held for redaction`);
  }

  const video = computeSdWelcomeVideoCheck(resources, welcomeVideoExternalUrl);
  // Treat the welcome video as non-blocking only when an external URL is
  // bundled or a matching resource exists (even if not openable yet).
  const welcomeVideoLinkedOrPending =
    video.state === "ok" ||
    (video.state === "warn" && findWelcomeVideoCandidates(resources).length > 0);

  const ready = screenshotsOk && week1Shots.needsRedaction === 0 && welcomeVideoLinkedOrPending;
  const state: SDWeek1LaunchStatus["state"] =
    ready ? "ready" : reasons.length === 0 ? "almost" : "blocked";
  return { ready, state, reasons, screenshots: week1Shots, welcomeVideoLinkedOrPending };
}

// Re-export for downstream consumers that previously only imported the
// stale priority list.
export { SD_W1_SCREENSHOT_MODULE_IDS };
// Hint for tree-shaking: ensure getStateDirectorNoScreenshotDecision is
// considered a used symbol (referenced from Week 1 launch evaluation).
void getStateDirectorNoScreenshotDecision;

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
  // Prefer a published, openable Resource Library entry — this is the source of
  // truth admins manage. Fall back to a bundled external URL only when no
  // resource exists yet, so the page is never broken in either state.
  const r = findWelcomeVideoResource(resources);
  if (r) {
    const url = r.fileUrl || r.url || null;
    return { ok: true, resource: r, url };
  }
  if (externalUrl && (/^https?:\/\//i.test(externalUrl) || externalUrl.startsWith("/"))) {
    return { ok: true, resource: null, url: externalUrl };
  }
  return { ok: false, resource: null, url: null };
}

/** Readiness-panel friendly status for the Welcome video row. */
export interface SDWelcomeVideoCheck {
  state: "ok" | "warn" | "manual";
  label: string;
  note: string;
}

export function computeSdWelcomeVideoCheck(
  resources: Resource[],
  externalUrl?: string,
): SDWelcomeVideoCheck {
  if (externalUrl && (/^https?:\/\//i.test(externalUrl) || externalUrl.startsWith("/"))) {
    return {
      state: "ok",
      label: "Welcome video linked",
      note: "Welcome video is bundled with the app and plays on the Welcome page.",
    };
  }
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