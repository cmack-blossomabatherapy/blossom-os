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
} from "@/lib/resources/sdSopCoverage";
import { SD_SOP_MANIFEST } from "@/lib/resources/stateDirectorSopManifest";
import {
  SD_ALL_SCREENSHOTS,
  findScreenshotResource,
  isScreenshotPiiSafe,
  type SDScreenshotAsset,
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
  | "training_screenshots";

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
  const [filter, setFilter] = useState<FilterTab>("all");

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

  const tabs: [FilterTab, string][] = [
    ["all", `All (${adminAll.length})`],
    ["published", `Published (${publishedLearnerVisible})`],
    ["sd_sops", `State Director SOPs (${coverage.published + coverage.needsFileRepair})`],
    ["unmatched", `Unmatched uploads (${unmatchedCount})`],
    ["privacy_review", `Privacy review (${heldCount})`],
    ["vault_excluded", `Vault / excluded`],
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
              A resource must be published, visible to State Director, and matched to a required
              SOP title before it counts as connected in Training Management.
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
          className="grid grid-cols-2 gap-3 md:grid-cols-5"
        >
          <SummaryTile label="Total uploaded" value={adminAll.length} />
          <SummaryTile label="Published & learner-visible" value={publishedLearnerVisible} tone="emerald" />
          <SummaryTile label="State Director matches" value={coverage.published} tone="emerald" />
          <SummaryTile label="Unmatched uploads" value={unmatchedCount} tone="rose" />
          <SummaryTile label="Held / review" value={heldCount} tone="amber" />
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
          className="overflow-hidden rounded-2xl border border-border/60 bg-card"
        >
          {filter === "training_screenshots" ? (
            <TrainingScreenshotsPanel resources={adminAll} />
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
