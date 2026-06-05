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

export default function ResourceUploadCenter() {
  const uploadRef = useRef<HTMLDivElement | null>(null);
  const { resources: persistedResources } = useLibraryResources();
  const [publishedThisSession, setPublishedThisSession] = useState<Resource[]>([]);
  const [queueCounts, setQueueCounts] = useState<Record<ResourceUploadStatus, number> | null>(null);
  const [failedUploads, setFailedUploads] = useState(0);

  const existingResources = useMemo(() => {
    const base = persistedResources.length > 0 ? persistedResources : seedResources;
    return [...publishedThisSession, ...base];
  }, [persistedResources, publishedThisSession]);

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

  return (
    <OSShell>
      <main className="mx-auto max-w-[1180px] space-y-6" data-testid="resource-upload-center">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              HR Suite · Resource Library
            </p>
            <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight text-foreground md:text-[32px]">
              Resource Upload Center
            </h1>
            <p className="mt-2 max-w-3xl text-[14px] text-muted-foreground">
              Upload SOPs, handbooks, policies, templates, videos, guides, checklists, and workflows.
            </p>
          </div>
          <Button variant="outline" className="rounded-xl" asChild>
            <Link to="/hr/training-center">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Training Center
            </Link>
          </Button>
        </header>

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