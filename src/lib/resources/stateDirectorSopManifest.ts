/**
 * State Director SOP upload manifest — single source of truth for every
 * canonical State Director SOP referenced by the Training Academy.
 *
 * Derived from {@link SD_SOPS_BY_WEEK} so it stays in lockstep with the
 * curriculum. Entries default to `pending_upload` / `pending_review` until a
 * real file is attached in Resource Management. We never fabricate URLs.
 */
import { SD_SOPS_BY_WEEK } from "@/lib/training/academyData";
import type { OSRole } from "@/lib/os/permissions";

export type SDSopUploadStatus =
  | "pending_review"
  | "in_review"
  | "approved"
  | "published"
  | "excluded";

export type SDSopAttachmentStatus =
  | "pending_upload"
  | "uploaded"
  | "needs_redaction";

export interface SDSopManifestEntry {
  id: string;
  title: string;
  fileName: string;
  /** Human-readable note for the admin uploading the SOP. */
  sourceNote: string;
  category: "state-director-launch";
  resourceType: "sop";
  roles: OSRole[];
  departments: string[];
  sensitivity: "role_restricted";
  uploadStatus: SDSopUploadStatus;
  attachmentStatus: SDSopAttachmentStatus;
  week: number;
  day: number;
  position: number;
  /** Corresponding Training Academy module ids that reference this SOP. */
  moduleIds: string[];
  matchedTrainingTitles: string[];
}

const SD_LAUNCH_ROLES: OSRole[] = [
  "state_director",
  "operations_leadership",
  "executive",
  "super_admin",
];

/** Roles that should NEVER see State Director launch SOPs. */
export const SD_SOP_FORBIDDEN_ROLES: OSRole[] = [
  "rbt",
  "bcba",
  "intake",
  "scheduling",
  "billing_finance",
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function fileNameFor(title: string): string {
  return slugify(title.replace(/ SOP$/i, "")) + ".docx";
}

/**
 * Generate the canonical manifest. Each unique SOP becomes one entry, even
 * when referenced across multiple weeks/days.
 */
function buildManifest(): SDSopManifestEntry[] {
  const byTitle = new Map<string, SDSopManifestEntry>();
  for (const [weekStr, days] of Object.entries(SD_SOPS_BY_WEEK)) {
    const week = Number(weekStr);
    for (const [dayStr, list] of Object.entries(days)) {
      const day = Number(dayStr);
      list.forEach((title, position) => {
        const id = "sd-sop-" + slugify(title);
        const moduleId = `sd-w${week}d${day}-pos${position}`;
        const existing = byTitle.get(title);
        if (existing) {
          if (!existing.moduleIds.includes(moduleId)) {
            existing.moduleIds.push(moduleId);
            existing.matchedTrainingTitles.push(title.replace(/ SOP$/i, ""));
          }
          return;
        }
        byTitle.set(title, {
          id,
          title,
          fileName: fileNameFor(title),
          sourceNote:
            "Source-of-truth State Director SOP. Upload via Resource Management → State Director Launch SOPs.",
          category: "state-director-launch",
          resourceType: "sop",
          roles: SD_LAUNCH_ROLES,
          departments: ["state_operations"],
          sensitivity: "role_restricted",
          uploadStatus: "pending_review",
          attachmentStatus: "pending_upload",
          week,
          day,
          position,
          moduleIds: [moduleId],
          matchedTrainingTitles: [title.replace(/ SOP$/i, "")],
        });
      });
    }
  }
  return Array.from(byTitle.values());
}

export const SD_SOP_MANIFEST: SDSopManifestEntry[] = buildManifest();

const SD_SOP_BY_TITLE: Record<string, SDSopManifestEntry> = (() => {
  const m: Record<string, SDSopManifestEntry> = {};
  for (const e of SD_SOP_MANIFEST) m[e.title] = e;
  return m;
})();

/** Resolve the manifest entry for a given SOP title (exact match). */
export function getSdSopEntryByTitle(title: string): SDSopManifestEntry | null {
  return SD_SOP_BY_TITLE[title] ?? null;
}

/** Resolve manifest entries referenced by a given State Director module id. */
export function getSdSopsForModule(moduleId: string): SDSopManifestEntry[] {
  return SD_SOP_MANIFEST.filter((e) => e.moduleIds.includes(moduleId));
}

/** True when the role is permitted to see State Director launch SOPs. */
export function isSdSopVisibleToRole(role: OSRole): boolean {
  if (SD_SOP_FORBIDDEN_ROLES.includes(role)) return false;
  return SD_LAUNCH_ROLES.includes(role);
}

/** Aggregate coverage summary for the Training Management dashboard. */
export interface SDSopCoverage {
  total: number;
  uploaded: number;
  pending: number;
  needsReview: number;
  excluded: number;
}

export function computeSdSopCoverage(
  entries: SDSopManifestEntry[] = SD_SOP_MANIFEST,
): SDSopCoverage {
  const c: SDSopCoverage = {
    total: entries.length,
    uploaded: 0,
    pending: 0,
    needsReview: 0,
    excluded: 0,
  };
  for (const e of entries) {
    if (e.uploadStatus === "excluded") c.excluded += 1;
    else if (e.attachmentStatus === "uploaded" && e.uploadStatus === "published") c.uploaded += 1;
    else if (e.attachmentStatus === "needs_redaction" || e.uploadStatus === "in_review") c.needsReview += 1;
    else c.pending += 1;
  }
  return c;
}