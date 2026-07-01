import { useMemo, useState } from "react";
import { Upload, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MktgCard, EmptyRow } from "@/pages/os/marketing/_shared";
import { useMarketingWebMetrics } from "@/hooks/useMarketingWebMetrics";
import { BulkWebMetricsImportDialog } from "./BulkWebMetricsImportDialog";

interface Props {
  title?: string;
  defaultSourceSystem?: string;
  /** When set, filter rows to a specific source_system for display. */
  filterSourceSystem?: string;
  limit?: number;
}

/**
 * Shared operational panel for marketing_web_metrics.
 * Renders totals + recent rows and exposes a bulk import dialog.
 */
export function WebMetricsPanel({
  title = "Web metrics",
  defaultSourceSystem = "google_analytics",
  filterSourceSystem,
  limit = 50,
}: Props) {
  const { rows, loading, refetch } = useMarketingWebMetrics({
    limit,
    sourceSystem: filterSourceSystem,
  });
  const [importOpen, setImportOpen] = useState(false);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        sessions: acc.sessions + (r.sessions ?? 0),
        users: acc.users + (r.users ?? 0),
        clicks: acc.clicks + (r.clicks ?? 0),
        impressions: acc.impressions + (r.impressions ?? 0),
        conversions: acc.conversions + (r.conversions ?? 0),
      }),
      { sessions: 0, users: 0, clicks: 0, impressions: 0, conversions: 0 },
    );
  }, [rows]);

  const bySource = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(r.source_system, (m.get(r.source_system) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  return (
    <MktgCard
      title={title}
      hint={
        rows.length
          ? `${rows.length} row${rows.length === 1 ? "" : "s"} from ${bySource.map(([s]) => s).join(", ")}`
          : "No live web metrics yet"
      }
    >
      <div className="mb-3 flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="mr-1.5 h-4 w-4" /> Bulk Import
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {([
          ["Sessions", totals.sessions],
          ["Users", totals.users],
          ["Clicks", totals.clicks],
          ["Impressions", totals.impressions],
          ["Conversions", totals.conversions],
        ] as const).map(([label, val]) => (
          <div key={label} className="rounded-lg border border-border/60 bg-card/50 p-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-xl font-semibold tabular-nums">{val || "-"}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Page / Query</th>
              <th className="px-3 py-2 text-right">Sessions</th>
              <th className="px-3 py-2 text-right">Clicks</th>
              <th className="px-3 py-2 text-right">Impr.</th>
              <th className="px-3 py-2 text-right">Conv.</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-xs text-muted-foreground">
                  Loading metrics...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6">
                  <EmptyRow>
                    <span className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      No web metrics yet. Use Bulk Import to load a GA / Search Console export.
                    </span>
                  </EmptyRow>
                </td>
              </tr>
            ) : (
              rows.slice(0, 15).map((r) => (
                <tr key={r.id} className="border-t border-border/40">
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                    {new Date(r.metric_date).toLocaleDateString("en-US")}
                  </td>
                  <td className="px-3 py-2">{r.source_system}</td>
                  <td className="px-3 py-2 truncate max-w-[280px]">{r.page_path || r.query || "-"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.sessions ?? "-"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.clicks ?? "-"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.impressions ?? "-"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.conversions ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <BulkWebMetricsImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        defaultSourceSystem={defaultSourceSystem}
        onImported={() => refetch()}
      />
    </MktgCard>
  );
}