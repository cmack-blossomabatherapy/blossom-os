import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, Bookmark, BookmarkPlus, Filter, RefreshCw, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCaseload, type CaseloadRow } from "./useCaseload";
import { useSavedViews, type CaseloadFilters } from "./useSavedViews";
import { CaseDetailDrawer } from "./CaseDetailDrawer";
import { HEALTH_LABEL, HEALTH_TONE, type CaseHealthStatus } from "./caseHealth";

/* -------------------------------------------------------------------------- */

const HEALTH_OPTIONS: CaseHealthStatus[] = [
  "on_track", "needs_attention", "authorization_risk", "staffing_risk",
  "underutilized", "progress_report_due", "parent_training_overdue",
  "documentation_issue", "family_engagement_concern", "on_hold", "discharge_pending",
];

function applyFilters(rows: CaseloadRow[], f: CaseloadFilters) {
  return rows.filter((r) => {
    if (f.search && !r.approvedIdentifier.toLowerCase().includes(f.search.toLowerCase())) return false;
    if (f.health?.length && !f.health.includes(r.health.primary)) return false;
    if (f.serviceSetting?.length && !f.serviceSetting.includes(r.serviceSetting ?? "")) return false;
    if (f.staffing?.length && !f.staffing.includes(r.staffingStatus ?? "")) return false;
    if (f.hasOpenConcerns && r.openSupportConcerns === 0) return false;
    return true;
  });
}

/* -------------------------------------------------------------------------- */

function CaseCard({ row, onOpen }: { row: CaseloadRow; onOpen: () => void }) {
  const h = row.health;
  return (
    <button onClick={onOpen}
      className="w-full text-left rounded-xl border bg-card/70 backdrop-blur-sm hover:border-primary/40 hover:shadow-sm transition p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{row.approvedIdentifier}</div>
          <div className="text-xs text-muted-foreground truncate">
            {row.serviceSetting ?? "—"} · {row.serviceStatus ?? "active"}
          </div>
        </div>
        <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border shrink-0 ${HEALTH_TONE[h.primary]}`}>
          {HEALTH_LABEL[h.primary]}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div><div className="text-muted-foreground">Weekly</div>
          <div className="font-medium">{row.deliveredHours ?? 0}h / {row.weeklyScheduledHours ?? 0}h</div></div>
        <div><div className="text-muted-foreground">Utilization</div>
          <div className="font-medium">{row.utilizationPct != null ? `${row.utilizationPct}%` : "—"}</div></div>
        <div><div className="text-muted-foreground">Auth end</div>
          <div className="font-medium">{row.authEnd ? new Date(row.authEnd).toLocaleDateString() : "—"}</div></div>
      </div>

      {h.reasons.length > 0 && h.primary !== "on_track" && (
        <div className="flex flex-wrap gap-1 pt-1">
          {h.reasons.slice(0, 3).map((r, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] font-normal">
              {r.label}{r.detail ? ` · ${r.detail}` : ""}
            </Badge>
          ))}
        </div>
      )}

      {row.sourceStale && (
        <div className="text-[10px] text-amber-700 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> CentralReach data is stale
        </div>
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */

export default function CaseloadPage() {
  const isMobile = useIsMobile();
  const { data: rows, isLoading, error, refetch, isRefetching } = useCaseload();
  const { views, save, remove } = useSavedViews();
  const [params, setParams] = useSearchParams();

  const [filters, setFilters] = useState<CaseloadFilters>({});
  const filtered = useMemo(() => applyFilters(rows ?? [], filters), [rows, filters]);

  const activeClientId = params.get("client");
  const activeRow = filtered.find((r) => r.clientId === activeClientId) ?? null;

  function toggleHealth(h: CaseHealthStatus) {
    setFilters((f) => {
      const set = new Set(f.health ?? []);
      set.has(h) ? set.delete(h) : set.add(h);
      return { ...f, health: Array.from(set) };
    });
  }

  function saveCurrent() {
    const name = prompt("Name this view");
    if (!name) return;
    save.mutate({ name, filters });
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-2 md:px-4 py-4 md:py-8 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className={isMobile ? "text-2xl font-semibold" : "text-3xl font-semibold tracking-tight"}>Caseload</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your assigned cases. Every field shows source and freshness.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Filter bar */}
      <Card className="border-border/60 bg-card/70 backdrop-blur-sm">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search client…" className="pl-8 h-9"
                value={filters.search ?? ""} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-3.5 w-3.5" /> Health
                  {filters.health?.length ? <Badge variant="secondary" className="text-[10px]">{filters.health.length}</Badge> : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64">
                <div className="text-xs font-medium mb-2">Filter by health</div>
                <div className="space-y-1 max-h-64 overflow-auto">
                  {HEALTH_OPTIONS.map((h) => (
                    <label key={h} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted rounded px-1.5 py-1">
                      <input type="checkbox" checked={filters.health?.includes(h) ?? false}
                        onChange={() => toggleHealth(h)} />
                      <span>{HEALTH_LABEL[h]}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={!!filters.hasOpenConcerns}
                onChange={(e) => setFilters((f) => ({ ...f, hasOpenConcerns: e.target.checked }))} />
              Open concerns only
            </label>

            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setFilters({})} className="gap-1 text-xs">
                <X className="h-3 w-3" /> Clear
              </Button>
              <Button variant="outline" size="sm" onClick={saveCurrent} className="gap-1 text-xs">
                <BookmarkPlus className="h-3.5 w-3.5" /> Save view
              </Button>
            </div>
          </div>

          {views.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/50">
              <Bookmark className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Saved:</span>
              {views.map((v) => (
                <span key={v.id} className="inline-flex items-center gap-1">
                  <button onClick={() => setFilters((v.filters ?? {}) as CaseloadFilters)}
                    className="text-xs px-2 py-0.5 rounded-full border hover:bg-muted">
                    {v.name}
                  </button>
                  <button onClick={() => remove.mutate(v.id)} className="text-muted-foreground hover:text-destructive text-xs">×</button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : error ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
          Couldn't load your caseload.
        </CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
          {rows?.length === 0
            ? "No clients assigned to you yet."
            : "No cases match these filters."}
        </CardContent></Card>
      ) : (
        <div className={isMobile ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 gap-3"}>
          {filtered.map((r) => (
            <CaseCard key={r.clientId} row={r}
              onOpen={() => setParams((p) => { p.set("client", r.clientId); return p; }, { replace: true })} />
          ))}
        </div>
      )}

      <CaseDetailDrawer
        row={activeRow}
        open={!!activeRow}
        onOpenChange={(v) => { if (!v) setParams((p) => { p.delete("client"); return p; }, { replace: true }); }}
        onRefresh={() => refetch()}
      />
    </div>
  );
}