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

/**
 * Human-readable, copy-pasteable definition of what "connected" means for a
 * State Director launch SOP. Surfaced as helper text in Resource Upload
 * Center and Training Management so admins read the same rule everywhere.
 */
export const SD_SOP_CONNECTED_DEFINITION =
  "A State Director SOP counts as connected only when a Resource record exists, " +
  "is published (not archived, not vault/excluded, not in privacy/business review " +
  "or needs_conversion), is not pending upload, has an openable URL or storage file, " +
  "and its normalized title exactly matches the State Director SOP manifest title.";

/** Static batch layout (SOPs 01-20, 21-40, 41-60, 61-80, 81-97). */
export const SD_SOP_BATCHES: { batch: number; start: number; end: number }[] = [
  { batch: 1, start: 1, end: 20 },
  { batch: 2, start: 21, end: 40 },
  { batch: 3, start: 41, end: 60 },
  { batch: 4, start: 61, end: 80 },
  { batch: 5, start: 81, end: 97 },
];

/** Sort the manifest into the canonical week → day → position order. */
function sortedManifest(
  manifest: SDSopManifestEntry[] = SD_SOP_MANIFEST,
): SDSopManifestEntry[] {
  return [...manifest].sort(
    (a, b) =>
      a.week - b.week || a.day - b.day || a.position - b.position ||
      a.title.localeCompare(b.title),
  );
}

/** Compute the 1-indexed global sequence for each manifest entry. */
export function getSdSopSequenceMap(
  manifest: SDSopManifestEntry[] = SD_SOP_MANIFEST,
): Map<string, number> {
  const map = new Map<string, number>();
  sortedManifest(manifest).forEach((e, idx) => map.set(e.id, idx + 1));
  return map;
}

export function getSdSopBatchFor(sequence: number): number {
  for (const b of SD_SOP_BATCHES) {
    if (sequence >= b.start && sequence <= b.end) return b.batch;
  }
  return SD_SOP_BATCHES.length;
}

export function normalizeSopTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\bsop\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Token-level Jaccard similarity over normalized titles. 0..1. */
export function sopTitleSimilarity(a: string, b: string): number {
  const ta = new Set(normalizeSopTitle(a).split(" ").filter(Boolean));
  const tb = new Set(normalizeSopTitle(b).split(" ").filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter += 1;
  return inter / (ta.size + tb.size - inter);
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
  sequence: number;
  batch: number;
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
  /** SD manifest entries with no exact match but a close-by uploaded title. */
  needsTitleCleanupEntries: SdSopCoverageCleanupEntry[];
  /** Uploaded hr_resources rows that don't match any manifest title. */
  unmatchedResources: Resource[];
  /** Per-batch breakdown for the SD Launch upload tracker. */
  batches: SdSopBatchSummary[];
}

export interface SdSopBatchSummary {
  batch: number;
  start: number;
  end: number;
  total: number;
  connected: number;
  missing: number;
  needsFileRepair: number;
  held: number;
  needsTitleCleanup: number;
}

export interface SdSopCoverageCleanupEntry {
  entry: SDSopManifestEntry;
  candidate: Resource;
  similarity: number;
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
  const sequenceMap = getSdSopSequenceMap(manifest);
  const entries: SdSopCoverageEntry[] = manifest.map((e) => {
    const r = byNorm.get(normalizeSopTitle(e.title)) ?? null;
    const sequence = sequenceMap.get(e.id) ?? 0;
    return { entry: e, status: classify(r), resource: r, sequence, batch: getSdSopBatchFor(sequence) };
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
  // Resources that don't exact-match any manifest title.
  const manifestKeys = new Set(manifest.map((e) => normalizeSopTitle(e.title)));
  const unmatchedResources = resources.filter((r) => {
    if (manifestKeys.has(normalizeSopTitle(r.title))) return false;
    // Hide excluded/vault to keep admin attention on actionable rows.
    if (r.sensitivity === "excluded") return false;
    if (r.uploadStatus === "excluded" || r.uploadStatus === "vault_only") return false;
    if (r.status === "Archived") return false;
    return true;
  });
  // Close-but-not-exact matches for missing entries (admin can rename).
  const needsTitleCleanupEntries: SdSopCoverageCleanupEntry[] = [];
  for (const e of entries) {
    if (e.status !== "missing") continue;
    let best: { r: Resource; s: number } | null = null;
    for (const r of unmatchedResources) {
      const s = sopTitleSimilarity(e.entry.title, r.title);
      if (s >= 0.6 && (!best || s > best.s)) best = { r, s };
    }
    if (best) {
      needsTitleCleanupEntries.push({
        entry: e.entry,
        candidate: best.r,
        similarity: best.s,
      });
    }
  }

  // Per-batch summary.
  const titleCleanupIds = new Set(needsTitleCleanupEntries.map((c) => c.entry.id));
  const batches: SdSopBatchSummary[] = SD_SOP_BATCHES.map((b) => {
    const inBatch = entries.filter((e) => e.batch === b.batch);
    return {
      batch: b.batch,
      start: b.start,
      end: b.end,
      total: inBatch.length,
      connected: inBatch.filter((e) => e.status === "published").length,
      missing: inBatch.filter((e) => e.status === "missing").length,
      needsFileRepair: inBatch.filter((e) => e.status === "needs_file_repair").length,
      held: inBatch.filter((e) => e.status === "held").length,
      needsTitleCleanup: inBatch.filter((e) => titleCleanupIds.has(e.entry.id)).length,
    };
  });

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
    needsTitleCleanupEntries,
    unmatchedResources,
    batches,
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