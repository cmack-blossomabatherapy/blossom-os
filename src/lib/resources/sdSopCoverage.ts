/**
 * Compare the canonical State Director SOP manifest against the live
 * `hr_resources` rows surfaced through `useAdminResources` /
 * `useLibraryResources`. Title match is primary (normalized).
 *
 * Status mapping for each manifest entry:
 *   published — resource exists, upload_status = published, attachment available
 *   pending   — resource exists but still pending review / awaiting upload
 *   held      — resource is in privacy_review / business_review / needs_conversion
 *   excluded  — resource is vault_only / excluded / sensitivity=excluded
 *   missing   — no matching resource exists yet
 */
import {
  SD_SOP_MANIFEST,
  type SDSopManifestEntry,
} from "./stateDirectorSopManifest";
import type { Resource } from "./resourceData";

export function normalizeSopTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\bsop\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export type SdSopRealStatus =
  | "published"
  | "pending"
  | "held"
  | "missing"
  | "excluded"
  | "needs_file_repair";

export interface SdSopCoverageEntry {
  entry: SDSopManifestEntry;
  status: SdSopRealStatus;
  resource: Resource | null;
}

export interface SdSopCoverageReport {
  total: number;
  published: number;
  pending: number;
  held: number;
  missing: number;
  excluded: number;
  needsFileRepair: number;
  entries: SdSopCoverageEntry[];
  publishedEntries: SdSopCoverageEntry[];
  missingEntries: SdSopCoverageEntry[];
  needsFileRepairEntries: SdSopCoverageEntry[];
}

function classify(resource: Resource | null): SdSopRealStatus {
  if (!resource) return "missing";
  if (
    resource.sensitivity === "excluded" ||
    resource.uploadStatus === "excluded" ||
    resource.uploadStatus === "vault_only"
  ) {
    return "excluded";
  }
  if (
    resource.uploadStatus === "privacy_review" ||
    resource.uploadStatus === "business_review" ||
    resource.uploadStatus === "needs_conversion"
  ) {
    return "held";
  }
  if (
    resource.uploadStatus === "published" &&
    resource.status !== "Archived" &&
    resource.attachmentStatus !== "pending_upload"
  ) {
    const hasUsableUrl = !!(resource.url || resource.fileUrl);
    const hasStoragePath = !!resource.storagePath;
    if (hasUsableUrl || hasStoragePath) return "published";
    return "needs_file_repair";
  }
  return "pending";
}

export function computeSdSopCoverageFromResources(
  resources: Resource[],
  manifest: SDSopManifestEntry[] = SD_SOP_MANIFEST,
): SdSopCoverageReport {
  const byNorm = new Map<string, Resource>();
  for (const r of resources) {
    const k = normalizeSopTitle(r.title);
    // Earliest wins; admin can dedupe in Resource Management.
    if (!byNorm.has(k)) byNorm.set(k, r);
  }
  const entries: SdSopCoverageEntry[] = manifest.map((e) => {
    const r = byNorm.get(normalizeSopTitle(e.title)) ?? null;
    return { entry: e, status: classify(r), resource: r };
  });
  const counts = entries.reduce(
    (acc, e) => {
      acc[e.status] += 1;
      return acc;
    },
    { published: 0, pending: 0, held: 0, missing: 0, excluded: 0, needs_file_repair: 0 } as Record<
      SdSopRealStatus,
      number
    >,
  );
  return {
    total: manifest.length,
    published: counts.published,
    pending: counts.pending,
    held: counts.held,
    missing: counts.missing,
    excluded: counts.excluded,
    needsFileRepair: counts.needs_file_repair,
    entries,
    publishedEntries: entries.filter((e) => e.status === "published"),
    missingEntries: entries.filter((e) => e.status === "missing"),
    needsFileRepairEntries: entries.filter((e) => e.status === "needs_file_repair"),
  };
}

/** Lookup the resource matched to a given SOP title (or null when missing). */
export function findResourceForSopTitle(
  resources: Resource[],
  sopTitle: string,
): Resource | null {
  const k = normalizeSopTitle(sopTitle);
  for (const r of resources) {
    if (normalizeSopTitle(r.title) === k) return r;
  }
  return null;
}