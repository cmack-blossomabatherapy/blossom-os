import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { SafeBoundary } from "@/components/common/SafeBoundary";
import { ResourceBulkUploadPanel } from "@/components/resources/ResourceBulkUploadPanel";
import { UploadQAChecklist } from "@/components/resources/UploadQAChecklist";
import {
  UploadBatchSummary,
  computeBatchSummary,
} from "@/components/resources/UploadBatchSummary";
import { resources as seedResources } from "@/lib/resources/resourceData";
import type { Resource, ResourceUploadStatus } from "@/lib/resources/resourceData";
import { useLibraryResources } from "@/hooks/useLibraryResources";
import { useAdminResources } from "@/hooks/useAdminResources";
import {
  computeSdSopCoverageFromResources,
  normalizeSopTitle,
  sopTitleSimilarity,
  SD_SOP_CONNECTED_DEFINITION,
  SD_SOP_BATCHES,
  type SdSopCoverageReport,
  type SdSopCoverageEntry,
} from "@/lib/resources/sdSopCoverage";
import {
  SD_SOP_MANIFEST,
  SD_SOP_FORBIDDEN_ROLES,
} from "@/lib/resources/stateDirectorSopManifest";
import {
  SD_ALL_SCREENSHOTS,
  findScreenshotResource,
  isScreenshotPiiSafe,
} from "@/lib/training/stateDirectorFullTraining";
import { getTraining } from "@/lib/training/academyData";
import { cn } from "@/lib/utils";

type SdMatchLabel = "matched" | "unmatched" | "needs_title_cleanup" | "not_sd";
type FilterTab =
  | "all"
  | "published"
  | "sd_sops"
  | "unmatched"
  | "privacy_review"
  | "vault_excluded"
  | "needs_file_repair"
  | "missing_sd_sops"
  | "needs_title_cleanup"
  | "training_screenshots"
  | "sd_launch_sops";

function classifySdMatch(
  resource: Resource,
  manifestKeys: Set<string>,
  manifestTitles: string[],
): SdMatchLabel {
  const k = normalizeSopTitle(resource.title);
  if (manifestKeys.has(k)) return "matched";
  for (const t of manifestTitles) {
    if (sopTitleSimilarity(t, resource.title) >= 0.6) return "needs_title_cleanup";
  }
  const roles = resource.roles ?? [];
  if (roles.includes("state_director" as any)) return "unmatched";
  return "not_sd";
}

const SD_MATCH_TONE: Record<SdMatchLabel, string> = {
  matched: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  unmatched: "bg-rose-500/10 text-rose-700 border-rose-500/30",
  needs_title_cleanup: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  not_sd: "bg-muted text-muted-foreground border-border/60",
};
const SD_MATCH_LABEL: Record<SdMatchLabel, string> = {
  matched: "Matched",
  unmatched: "Unmatched",
  needs_title_cleanup: "Needs title cleanup",
  not_sd: "Not State Director",
};

export default function ResourceUploadCenter() {
  const uploadRef = useRef<HTMLDivElement | null>(null);
  const { resources: persistedResources } = useLibraryResources();
  const { resources: adminResources, loading: adminLoading } = useAdminResources();
  const [publishedThisSession, setPublishedThisSession] = useState<Resource[]>([]);
  const [queueCounts, setQueueCounts] = useState<Record<ResourceUploadStatus, number> | null>(null);
  const [failedUploads, setFailedUploads] = useState(0);
  const initialFilter: FilterTab =
    typeof window !== "undefined" && window.location.hash === "#sd-launch-sops"
      ? "sd_launch_sops"
      : "all";
  const [filter, setFilter] = useState<FilterTab>(initialFilter);

  const existingResources = useMemo(() => {
    const base = persistedResources.length > 0 ? persistedResources : seedResources;
    return [...publishedThisSession, ...base];
  }, [persistedResources, publishedThisSession]);

  const adminAll = useMemo(
    () => [...publishedThisSession, ...adminResources],
    [adminResources, publishedThisSession],
  );

  const manifestKeys = useMemo(
    () => new Set(SD_SOP_MANIFEST.map((e) => normalizeSopTitle(e.title))),
    [],
  );
  const manifestTitles = useMemo(() => SD_SOP_MANIFEST.map((e) => e.title), []);

  const rows = useMemo(
    () =>
      adminAll.map((r) => ({
        resource: r,
        sdMatch: classifySdMatch(r, manifestKeys, manifestTitles),
      })),
    [adminAll, manifestKeys, manifestTitles],
  );

  const coverage = useMemo(
    () => computeSdSopCoverageFromResources(adminAll),
    [adminAll],
  );

  const publishedLearnerVisible = adminAll.filter(
    (r) => r.uploadStatus === "published" && r.status !== "Archived",
  ).length;
  const heldCount = adminAll.filter(
    (r) =>
      r.uploadStatus === "privacy_review" ||
      r.uploadStatus === "business_review" ||
      r.uploadStatus === "needs_conversion",
  ).length;
  const unmatchedCount = rows.filter((x) => x.sdMatch === "unmatched").length;

  const filtered = useMemo(() => {
    return rows.filter(({ resource: r, sdMatch }) => {
      switch (filter) {
        case "all":
          return true;
        case "published":
          return r.uploadStatus === "published" && r.status !== "Archived";
        case "sd_sops":
          return sdMatch === "matched" || sdMatch === "needs_title_cleanup";
        case "unmatched":
          return sdMatch === "unmatched";
        case "privacy_review":
          return (
            r.uploadStatus === "privacy_review" ||
            r.uploadStatus === "business_review" ||
            r.uploadStatus === "needs_conversion"
          );
        case "vault_excluded":
          return (
            r.uploadStatus === "vault_only" ||
            r.uploadStatus === "excluded" ||
            r.sensitivity === "excluded"
          );
        case "needs_file_repair":
          return (
            r.uploadStatus === "published" &&
            r.status !== "Archived" &&
            !r.url &&
            !r.fileUrl &&
            !r.storagePath
          );
        case "needs_title_cleanup":
          return sdMatch === "needs_title_cleanup";
        case "missing_sd_sops":
          // Handled by dedicated panel; nothing in main table.
          return false;
      }
    });
  }, [rows, filter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const scrollIfRequested = () => {
      if (window.location.hash !== "#bulk-upload") return;
      const tryScroll = (attempt = 0) => {
        const el = uploadRef.current ?? document.getElementById("bulk-upload");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (attempt < 12) {
          window.setTimeout(() => tryScroll(attempt + 1), 75);
        }
      };
      window.setTimeout(() => tryScroll(), 0);
    };
    scrollIfRequested();
    window.addEventListener("hashchange", scrollIfRequested);
    return () => window.removeEventListener("hashchange", scrollIfRequested);
  }, []);

  const vaultExcludedCount = adminAll.filter(
    (r) =>
      r.uploadStatus === "vault_only" ||
      r.uploadStatus === "excluded" ||
      r.sensitivity === "excluded",
  ).length;
  const titleCleanupCount = coverage.needsTitleCleanupEntries.length;

  const tabs: [FilterTab, string][] = [
    ["all", `All (${adminAll.length})`],
    ["published", `Published (${publishedLearnerVisible})`],
    ["sd_launch_sops", `SD Launch SOPs (${coverage.published}/${coverage.total})`],
    ["sd_sops", `State Director SOPs (${coverage.published + coverage.needsFileRepair})`],
    ["missing_sd_sops", `Missing required SD SOPs (${coverage.missing})`],
    ["needs_title_cleanup", `Needs title cleanup (${titleCleanupCount})`],
    ["unmatched", `Unmatched uploads (${unmatchedCount})`],
    ["privacy_review", `Privacy review (${heldCount})`],
    ["vault_excluded", `Vault / excluded (${vaultExcludedCount})`],
    ["needs_file_repair", `Needs file repair (${coverage.needsFileRepair})`],
    ["training_screenshots", `Training screenshots (${SD_ALL_SCREENSHOTS.length})`],
  ];

  return (
    <OSShell>
      <main className="mx-auto max-w-[1400px] space-y-6" data-testid="resource-upload-center">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              HR Suite · Resource Library
            </p>
            <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight text-foreground md:text-[32px]">
              Resource Upload Center
            </h1>
            <p className="mt-2 max-w-3xl text-[14px] text-muted-foreground">
              Uploads here power Resource Library and Training Academy.
            </p>
            <p className="mt-2 max-w-3xl text-[12.5px] text-muted-foreground">
              Training Management only counts a State Director SOP as connected when it is
              published, matched to the required SOP title, and has a working URL or storage file.
            </p>
          </div>
          <Button variant="outline" className="rounded-xl" asChild>
            <Link to="/hr/training-center">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Training Center
            </Link>
          </Button>
        </header>

        <section
          data-testid="resource-upload-status-summary"
          className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8"
        >
          <SummaryTile label="Total uploaded" value={adminAll.length} />
          <SummaryTile label="Published & learner-visible" value={publishedLearnerVisible} tone="emerald" />
          <SummaryTile label="SD SOPs connected" value={coverage.published} tone="emerald" />
          <SummaryTile label="SD SOPs missing" value={coverage.missing} tone="rose" />
          <SummaryTile label="Needs file repair" value={coverage.needsFileRepair} tone="amber" />
          <SummaryTile label="Held / review" value={heldCount} tone="amber" />
          <SummaryTile label="Vault / excluded" value={vaultExcludedCount} />
          <SummaryTile label="Unmatched uploads" value={unmatchedCount} tone="rose" />
        </section>

        <section
          data-testid="resource-upload-filters"
          className="rounded-2xl border border-border/60 bg-card p-2"
        >
          <div className="flex flex-wrap gap-1">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                data-testid={`resource-filter-${id}`}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  filter === id
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:bg-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section
          data-testid="resource-upload-admin-table"
          id="sd-launch-sops"
          className="overflow-hidden rounded-2xl border border-border/60 bg-card"
        >
          {filter === "training_screenshots" ? (
            <TrainingScreenshotsPanel resources={adminAll} />
          ) : filter === "sd_launch_sops" ? (
            <SDLaunchSopsPanel coverage={coverage} />
          ) : filter === "missing_sd_sops" ? (
            <MissingSDSopsPanel coverage={coverage} />
          ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[820px] text-[12.5px]">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5 text-left font-medium">Title</th>
                  <th className="px-3 py-2.5 text-left font-medium">Upload status</th>
                  <th className="px-3 py-2.5 text-left font-medium">Type</th>
                  <th className="px-3 py-2.5 text-left font-medium">Roles</th>
                  <th className="px-3 py-2.5 text-left font-medium">Category</th>
                  <th className="px-3 py-2.5 text-left font-medium">State Director match</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                      {adminLoading ? "Loading resources…" : "No resources match this filter."}
                    </td>
                  </tr>
                ) : (
                  filtered.slice(0, 200).map(({ resource: r, sdMatch }) => (
                    <tr key={r.id} className="border-t border-border/40">
                      <td className="px-3 py-2 text-foreground">{r.title}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.uploadStatus ?? "published"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.resourceType ?? r.type}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {r.roles.length ? r.roles.join(", ") : "All roles"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{r.category}</td>
                      <td className="px-3 py-2">
                        <span
                          data-testid={`sd-match-chip-${sdMatch}`}
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider",
                            SD_MATCH_TONE[sdMatch],
                          )}
                        >
                          {SD_MATCH_LABEL[sdMatch]}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )}
        </section>

        <section
          id="bulk-upload"
          ref={uploadRef}
          aria-label="Bulk upload"
          className="scroll-mt-24 space-y-5"
          data-testid="resource-upload-bulk-section"
        >
          <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Upload className="h-4 w-4" />
            </span>
            Bulk upload
          </div>

          <SafeBoundary label="Upload batch summary" retryHref="/hr/resource-management#bulk-upload">
            <UploadBatchSummary
              counts={computeBatchSummary(existingResources, queueCounts ?? {}, failedUploads)}
            />
          </SafeBoundary>

          <SafeBoundary label="Upload QA checklist" retryHref="/hr/resource-management#bulk-upload">
            <UploadQAChecklist />
          </SafeBoundary>

          <SafeBoundary
            label="Resource upload panel"
            fallbackTitle="Resource upload panel could not load"
            retryHref="/hr/resource-management#bulk-upload"
            showErrorDetails
          >
            <ResourceBulkUploadPanel
              existingResources={existingResources}
              onCountsChange={({ counts, failed }) => {
                setQueueCounts(counts);
                setFailedUploads(failed);
              }}
              onPublish={(added) => setPublishedThisSession((prev) => [...added, ...prev])}
            />
          </SafeBoundary>
        </section>
      </main>
    </OSShell>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "emerald" | "amber" | "rose";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-600"
      : tone === "amber"
      ? "text-amber-600"
      : tone === "rose"
      ? "text-rose-600"
      : "text-foreground";
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3">
      <p className={cn("text-[20px] font-semibold tracking-tight", toneClass)}>{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function statusLabel(e: SdSopCoverageEntry): { label: string; tone: string } {
  switch (e.status) {
    case "published":
      return { label: "Connected", tone: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" };
    case "needs_file_repair":
      return { label: "Needs file repair", tone: "bg-amber-500/10 text-amber-700 border-amber-500/30" };
    case "held":
      return { label: "Held review", tone: "bg-amber-500/10 text-amber-700 border-amber-500/30" };
    case "excluded":
      return { label: "Excluded", tone: "bg-muted text-muted-foreground border-border/60" };
    case "pending":
      return { label: "Pending publish", tone: "bg-muted text-muted-foreground border-border/60" };
    case "missing":
    default:
      return { label: "Missing", tone: "bg-rose-500/10 text-rose-700 border-rose-500/30" };
  }
}

function actionGuidance(e: SdSopCoverageEntry, isCleanup: boolean): string {
  if (isCleanup) return `Rename upload to exactly "${e.entry.title}".`;
  switch (e.status) {
    case "published":
      return "Open resource — also visible in learner library.";
    case "needs_file_repair":
      return "Re-upload file in Resource Upload Center.";
    case "held":
      return "Review before publishing.";
    case "excluded":
      return "Excluded from learner library — review classification.";
    case "pending":
      return "Finish publishing this draft.";
    case "missing":
    default:
      return `Upload this SOP as "${e.entry.title}".`;
  }
}

function SDLaunchSopsPanel({ coverage }: { coverage: SdSopCoverageReport }) {
  const cleanupIds = new Set(
    coverage.needsTitleCleanupEntries.map((c) => c.entry.id),
  );
  const cleanupByEntry = new Map(
    coverage.needsTitleCleanupEntries.map((c) => [c.entry.id, c]),
  );
  const ordered = [...coverage.entries].sort((a, b) => a.sequence - b.sequence);
  const forbidden = SD_SOP_FORBIDDEN_ROLES.join(", ");
  return (
    <div data-testid="sd-launch-sops-panel" className="space-y-4 p-4">
      <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-[12px] text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">Connected definition:</span>{" "}
          {SD_SOP_CONNECTED_DEFINITION}
        </p>
        <p className="mt-1">
          Visible to <span className="font-medium text-foreground">State Director, Operations Leadership, Executive, Super Admin</span>.
          Never visible to <span className="font-medium text-foreground">{forbidden}</span>.
        </p>
      </div>

      <div
        data-testid="sd-launch-batches"
        className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5"
      >
        {coverage.batches.map((b) => (
          <div
            key={b.batch}
            data-testid={`sd-launch-batch-${b.batch}`}
            className="rounded-xl border border-border/60 bg-card p-3"
          >
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Batch {String(b.batch).padStart(2, "0")} · SOPs {String(b.start).padStart(2, "0")}-{String(b.end).padStart(2, "0")}
            </div>
            <div className="mt-1 text-[18px] font-semibold tracking-tight text-foreground">
              {b.connected}/{b.total}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              <span className="text-rose-700">{b.missing} missing</span> ·{" "}
              <span className="text-amber-700">{b.needsFileRepair} repair</span> ·{" "}
              <span className="text-amber-700">{b.held} held</span> ·{" "}
              <span className="text-amber-700">{b.needsTitleCleanup} cleanup</span>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-auto rounded-xl border border-border/60">
        <table className="w-full min-w-[1000px] text-[12.5px]">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium">#</th>
              <th className="px-3 py-2.5 text-left font-medium">Wk / Day</th>
              <th className="px-3 py-2.5 text-left font-medium">Module</th>
              <th className="px-3 py-2.5 text-left font-medium">Required SOP title</th>
              <th className="px-3 py-2.5 text-left font-medium">Matched resource</th>
              <th className="px-3 py-2.5 text-left font-medium">Status</th>
              <th className="px-3 py-2.5 text-left font-medium">Openable</th>
              <th className="px-3 py-2.5 text-left font-medium">Roles</th>
              <th className="px-3 py-2.5 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((e) => {
              const isCleanup = cleanupIds.has(e.entry.id);
              const cleanup = cleanupByEntry.get(e.entry.id);
              const status = statusLabel(e);
              const openable =
                !!(e.resource && (e.resource.url || e.resource.fileUrl || e.resource.storagePath)) &&
                e.status === "published";
              return (
                <tr
                  key={e.entry.id}
                  data-testid={`sd-launch-row-${e.sequence}`}
                  data-batch={e.batch}
                  data-status={e.status}
                  className="border-t border-border/40 align-top"
                >
                  <td className="px-3 py-2 text-muted-foreground">{String(e.sequence).padStart(2, "0")}</td>
                  <td className="px-3 py-2 text-muted-foreground">W{e.entry.week} · D{e.entry.day}</td>
                  <td className="px-3 py-2 text-foreground">
                    {e.entry.matchedTrainingTitles[0] ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-foreground">{e.entry.title}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {e.resource
                      ? e.resource.title
                      : cleanup
                        ? <span className="text-amber-700">{cleanup.candidate.title}</span>
                        : <span>—</span>}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider",
                        isCleanup
                          ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                          : status.tone,
                      )}
                    >
                      {isCleanup ? "Needs title cleanup" : status.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{openable ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{e.entry.roles.join(", ")}</td>
                  <td className="px-3 py-2 text-muted-foreground">{actionGuidance(e, isCleanup)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrainingScreenshotsPanel({
  resources,
}: {
  resources: Resource[];
}) {
  const rows = SD_ALL_SCREENSHOTS.map((asset) => {
    const match = findScreenshotResource(asset, resources);
    const training = getTraining(asset.moduleId);
    const piiSafe = isScreenshotPiiSafe(asset);
    const needsRedaction =
      asset.resourceStatus === "needs_redaction" ||
      asset.sensitivity === "needs_redaction" ||
      !piiSafe;
    return { asset, match, training, needsRedaction };
  });
  const available = rows.filter((r) => r.match && !r.needsRedaction).length;
  const pending = rows.filter((r) => !r.match && !r.needsRedaction).length;
  const redaction = rows.filter((r) => r.needsRedaction).length;
  return (
    <div
      data-testid="training-screenshots-panel"
      className="overflow-auto"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-border/40 px-4 py-3 text-[12px] text-muted-foreground">
        <span><span className="font-semibold text-foreground">{SD_ALL_SCREENSHOTS.length}</span> registered screenshots</span>
        <span className="text-emerald-700"><span className="font-semibold">{available}</span> available</span>
        <span className="text-amber-700"><span className="font-semibold">{pending}</span> pending upload</span>
        <span className="text-rose-700"><span className="font-semibold">{redaction}</span> need redaction</span>
      </div>
      <table className="w-full min-w-[820px] text-[12.5px]">
        <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2.5 text-left font-medium">Expected title</th>
            <th className="px-3 py-2.5 text-left font-medium">Module / day</th>
            <th className="px-3 py-2.5 text-left font-medium">Matched upload</th>
            <th className="px-3 py-2.5 text-left font-medium">Upload status</th>
            <th className="px-3 py-2.5 text-left font-medium">Openable</th>
            <th className="px-3 py-2.5 text-left font-medium">Needs redaction</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ asset, match, training, needsRedaction }) => (
            <tr
              key={asset.id}
              data-testid={`screenshot-row-${asset.id}`}
              className="border-t border-border/40"
            >
              <td className="px-3 py-2 text-foreground">
                <div className="font-medium">{asset.resourceTitle ?? asset.title}</div>
                <div className="text-[11px] text-muted-foreground">{asset.title}</div>
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {training?.title ?? asset.moduleId}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {match ? (
                  <span className="font-medium text-foreground">{match.resource.title}</span>
                ) : (
                  <span className="text-amber-700">Not matched</span>
                )}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {match?.resource.uploadStatus ?? (match ? "published" : "—")}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {match?.openable ? (
                  <span className="text-emerald-700">Yes</span>
                ) : (
                  <span className="text-muted-foreground">No</span>
                )}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {needsRedaction ? (
                  <span className="text-rose-700">Yes</span>
                ) : (
                  <span className="text-muted-foreground">No</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MissingSDSopsPanel({ coverage }: { coverage: SdSopCoverageReport }) {
  const missing = coverage.missingEntries;
  return (
    <div data-testid="missing-sd-sops-panel" className="space-y-3 p-4">
      <p className="text-[12.5px] text-muted-foreground">
        {missing.length} required State Director SOPs have no matching upload yet. Upload each
        file using the exact manifest title so it auto-connects in Training Management.
      </p>
      {missing.length === 0 ? (
        <p className="rounded-xl border border-emerald-300/60 bg-emerald-50/60 px-3 py-2 text-[12.5px] text-emerald-900">
          All required State Director SOPs are accounted for.
        </p>
      ) : (
        <div className="overflow-auto rounded-xl border border-border/60">
          <table className="w-full min-w-[720px] text-[12.5px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">#</th>
                <th className="px-3 py-2.5 text-left font-medium">Wk / Day</th>
                <th className="px-3 py-2.5 text-left font-medium">Module</th>
                <th className="px-3 py-2.5 text-left font-medium">Expected SOP title</th>
                <th className="px-3 py-2.5 text-left font-medium">Business area</th>
              </tr>
            </thead>
            <tbody>
              {missing.map((e) => (
                <tr
                  key={e.entry.id}
                  data-testid={`missing-sop-row-${e.sequence}`}
                  className="border-t border-border/40"
                >
                  <td className="px-3 py-2 text-muted-foreground">
                    {String(e.sequence).padStart(2, "0")}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    W{e.entry.week} · D{e.entry.day}
                  </td>
                  <td className="px-3 py-2 text-foreground">
                    {e.entry.matchedTrainingTitles[0] ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-foreground">{e.entry.title}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {e.entry.businessArea ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
