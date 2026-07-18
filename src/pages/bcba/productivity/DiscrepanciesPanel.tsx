import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Flag, Search, ChevronRight, Loader2 } from "lucide-react";
import { useDiscrepancies, type DiscrepancyRow } from "./useProductivity";
import { findDefinition } from "./pipeline";
import ReportDiscrepancyDialog from "./ReportDiscrepancyDialog";

type StatusFilter = "all" | "open" | "investigating" | "resolved" | "rejected" | "reopened";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "investigating", label: "Investigating" },
  { key: "resolved", label: "Resolved" },
  { key: "reopened", label: "Reopened" },
  { key: "rejected", label: "Rejected" },
];

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  investigating: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  reopened: "bg-violet-50 text-violet-700 border-violet-200",
};

/**
 * A filterable list of discrepancies with quick links into the detail drawer.
 * "Reopened" is inferred: a row currently `open` that was previously resolved.
 */
export default function DiscrepanciesPanel({
  bcbaId,
  scope = "mine",
}: {
  bcbaId?: string | null;
  scope?: "mine" | "all";
}) {
  const { data, isLoading } = useDiscrepancies({
    bcbaId: scope === "mine" ? bcbaId ?? null : null,
  });
  const [status, setStatus] = useState<StatusFilter>("all");
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const list = (data ?? []).map((d) => ({
      ...d,
      // Any row that returned to open after having a resolved_at is a reopen.
      // We treat resolved_at absence + status open as "reopened" only when
      // an event history exists — the list view can't see events, so use
      // status + updated_at heuristic and let the drawer show the timeline.
      derivedReopened:
        d.status === "open" &&
        Boolean((d as any).resolved_at === null) &&
        d.updated_at !== d.created_at,
    }));
    const term = q.trim().toLowerCase();
    return list.filter((r) => {
      if (status === "reopened") {
        if (!r.derivedReopened) return false;
      } else if (status !== "all") {
        if (r.status !== status) return false;
      }
      if (!term) return true;
      const hay = [
        r.metric_key,
        ...(r.impacted_metric_keys ?? []),
        r.detail ?? "",
        r.reported_value ?? "",
        r.expected_value ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [data, status, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0, open: 0, investigating: 0, resolved: 0, rejected: 0, reopened: 0 };
    for (const d of data ?? []) {
      c.all += 1;
      if (d.status in c) c[d.status] += 1;
      if (d.status === "open" && d.updated_at !== d.created_at) c.reopened += 1;
    }
    return c;
  }, [data]);

  return (
    <div className="space-y-4" data-testid="discrepancies-panel">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setStatus(t.key)}
                  className={`text-xs rounded-full border px-2.5 py-1 transition ${
                    status === t.key
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t.label}
                  <span className="ml-1.5 text-[10px] opacity-70">{counts[t.key] ?? 0}</span>
                </button>
              ))}
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search metric, note, values…"
                className="pl-7 h-8 text-sm"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading discrepancies…
            </div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground border border-dashed rounded-md py-8 text-center">
              {status === "all"
                ? "No discrepancies reported yet. You're all clear."
                : `No ${status} discrepancies.`}
            </div>
          ) : (
            <ul className="divide-y rounded-md border">
              {rows.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => setActiveId(r.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition"
                    data-testid="discrepancy-row"
                  >
                    <Flag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {findDefinition(r.metric_key)?.label ?? r.metric_key}
                        </span>
                        {(r.impacted_metric_keys ?? [])
                          .filter((k) => k !== r.metric_key)
                          .slice(0, 2)
                          .map((k) => (
                            <Badge key={k} variant="secondary" className="text-[10px] font-normal">
                              +{findDefinition(k)?.label ?? k}
                            </Badge>
                          ))}
                        {(r.impacted_metric_keys?.length ?? 0) > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{(r.impacted_metric_keys?.length ?? 0) - 3} more
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {r.detail || "No note provided"} · updated {new Date(r.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <StatusChip
                      status={r.derivedReopened && r.status === "open" ? "reopened" : r.status}
                    />
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ReportDiscrepancyDialog
        open={!!activeId}
        onOpenChange={(o) => !o && setActiveId(null)}
        discrepancyId={activeId ?? undefined}
      />
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground border-border"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}