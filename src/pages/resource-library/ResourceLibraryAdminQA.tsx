import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { OSShell } from "@/pages/os/OSShell";
import { ReportAIButton } from "@/components/ai/ReportAIButton";
import { LibraryTabs } from "@/components/resource-library/LibraryTabs";
import { ResourceListView } from "@/components/resource-library/ResourceListView";
import { useAdminResources } from "@/hooks/useAdminResources";
import { useOSRole } from "@/contexts/OSRoleContext";
import { BlossomAIIngestPanel } from "@/components/resource-library/BlossomAIIngestPanel";

const EXEC_TIER = new Set([
  "executive",
  "executive_leadership",
  "ceo",
  "coo",
  "doo",
  "super_admin",
]);

function KpiTile({ label, value, tone = "slate" }: { label: string; value: number | string; tone?: string }) {
  const toneClass: Record<string, string> = {
    slate: "bg-slate-50 text-slate-800 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    rose: "bg-rose-50 text-rose-800 border-rose-200",
    blue: "bg-blue-50 text-blue-800 border-blue-200",
  };
  return (
    <div className={`rounded-2xl border p-4 ${toneClass[tone]}`}>
      <div className="text-[11px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

export default function ResourceLibraryAdminQA() {
  const { role } = useOSRole();
  const { resources, loading } = useAdminResources();

  const kpis = useMemo(() => {
    const total = resources.length;
    let missing = 0, imported = 0, sensitive = 0, needsAck = 0, untagged = 0, missingExec = 0;
    const bucketCounts = new Map<string, number>();
    const visibilityCounts = new Map<string, number>();
    for (const r of resources) {
      const upload = String(r.uploadStatus ?? "");
      const attach = String(r.attachmentStatus ?? "");
      if (upload === "missing_file") missing++;
      if (attach === "available" || attach === "attached" || r.storagePath) imported++;
      if (r.isSensitive) sensitive++;
      if (r.requiresAcknowledgement) needsAck++;
      const roles = (r.roles ?? []) as string[];
      const nonExec = roles.filter((x) => !EXEC_TIER.has(x));
      if (nonExec.length === 0) untagged++;
      if (!roles.some((x) => EXEC_TIER.has(x))) missingExec++;
      const b = r.storageBucket ?? "—";
      bucketCounts.set(b, (bucketCounts.get(b) ?? 0) + 1);
      const v = r.visibilityLevel ?? "—";
      visibilityCounts.set(v, (visibilityCounts.get(v) ?? 0) + 1);
    }
    return { total, missing, imported, sensitive, needsAck, untagged, missingExec, bucketCounts, visibilityCounts };
  }, [resources]);

  const queues = useMemo(() => {
    const missingStorage = resources.filter(
      (r) => !r.storagePath && String(r.uploadStatus ?? "") === "missing_file",
    );
    const untaggedList = resources.filter((r) => {
      const roles = (r.roles ?? []) as string[];
      return roles.filter((x) => !EXEC_TIER.has(x)).length === 0;
    });
    const missingExecList = resources.filter((r) => {
      const roles = (r.roles ?? []) as string[];
      return !roles.some((x) => EXEC_TIER.has(x));
    });
    return { missingStorage, untaggedList, missingExecList };
  }, [resources]);

  if (role !== "super_admin") {
    return <Navigate to="/resource-library" replace />;
  }

  return (
    <OSShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Resource Library</p>
            <h1 className="text-2xl font-semibold tracking-tight">Import & QA</h1>
            <p className="text-[13px] text-muted-foreground">
              Reconciliation of manifest metadata against storage buckets. Super Admin only.
            </p>
          </div>
          <ReportAIButton
            preset="resource-library-import"
            contextExtra={`Current KPIs — total: ${kpis.total}, imported: ${kpis.imported}, missing_file: ${kpis.missing}, sensitive: ${kpis.sensitive}, ack required: ${kpis.needsAck}.`}
            label="Explain import"
          />
        </header>
        <LibraryTabs />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <KpiTile label="Total records" value={kpis.total} />
          <KpiTile label="Imported / attached" value={kpis.imported} tone="emerald" />
          <KpiTile label="Missing file" value={kpis.missing} tone={kpis.missing > 0 ? "amber" : "slate"} />
          <KpiTile label="Sensitive" value={kpis.sensitive} tone="rose" />
          <KpiTile label="Ack required" value={kpis.needsAck} tone="blue" />
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <KpiTile
            label="Untagged (no role)"
            value={kpis.untagged}
            tone={kpis.untagged > 0 ? "amber" : "emerald"}
          />
          <KpiTile
            label="Missing exec tier"
            value={kpis.missingExec}
            tone={kpis.missingExec > 0 ? "rose" : "emerald"}
          />
          <KpiTile
            label="Missing storage file"
            value={queues.missingStorage.length}
            tone={queues.missingStorage.length > 0 ? "amber" : "emerald"}
          />
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-4 text-[12.5px] text-muted-foreground">
          <span className="font-semibold text-foreground">Phase 5 auto-classification is live.</span>{" "}
          Executive-tier-only records are backfilled with role tags inferred from title, description
          and source (billing, recruiting, HR, RBT, BCBA, scheduling, authorization, QA, marketing,
          intake, credentialing, case management, behavioral support, state operations, business
          development). README noise entries have been deactivated so they no longer surface in the
          library. Use <code className="rounded bg-muted px-1 py-0.5">public.suggest_resource_roles()</code>{" "}
          to preview suggestions for any new upload.
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <h2 className="text-[14px] font-semibold">Bucket distribution</h2>
            <ul className="mt-2 space-y-1 text-[12.5px]">
              {Array.from(kpis.bucketCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([b, n]) => (
                  <li key={b} className="flex justify-between rounded-lg px-2 py-1 hover:bg-muted">
                    <span className="font-mono">{b}</span>
                    <span className="text-muted-foreground">{n}</span>
                  </li>
                ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <h2 className="text-[14px] font-semibold">Visibility levels</h2>
            <ul className="mt-2 space-y-1 text-[12.5px]">
              {Array.from(kpis.visibilityCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([v, n]) => (
                  <li key={v} className="flex justify-between rounded-lg px-2 py-1 hover:bg-muted">
                    <span>{v.replace(/_/g, " ")}</span>
                    <span className="text-muted-foreground">{n}</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        <ResourceListView resources={resources} loading={loading} flat emptyMessage="No records found." />

        {queues.missingStorage.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-[14px] font-semibold">QA queue · Missing storage file ({queues.missingStorage.length})</h2>
            <ResourceListView resources={queues.missingStorage} loading={false} flat emptyMessage="All clear." />
          </section>
        )}
        {queues.untaggedList.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-[14px] font-semibold">QA queue · Untagged roles ({queues.untaggedList.length})</h2>
            <ResourceListView resources={queues.untaggedList} loading={false} flat emptyMessage="All clear." />
          </section>
        )}
        {queues.missingExecList.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-[14px] font-semibold">QA queue · Missing executive tier ({queues.missingExecList.length})</h2>
            <ResourceListView resources={queues.missingExecList} loading={false} flat emptyMessage="All clear." />
          </section>
        )}

        <BlossomAIIngestPanel />
      </div>
    </OSShell>
  );
}
