import { useMemo, useState } from "react";
import { History, RefreshCw, Filter, X, ChevronRight, ChevronDown } from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  type SystemToolArea,
  type SystemToolAuditLog,
} from "@/hooks/useSystemTools";
import { useAuditLogSearch } from "@/hooks/useAuditLogSearch";

const AREA_LABELS: Record<SystemToolArea, string> = {
  workflow_inventory: "Workflow Inventory",
  issue_tracker: "Issue Tracker",
  request_intake: "Request Intake",
  bcba_productivity_uploads: "BCBA Productivity Uploads",
  centralreach_uploads: "CentralReach Uploads",
  integrations: "Integrations",
};

/**
 * Canonical action names we emit for Workflow Inventory and Issue Tracker so
 * admins can slice audit history by real operational events, not just
 * create/update/delete.
 */
const WORKFLOW_ACTIONS = [
  "create",
  "update",
  "delete",
  "status_change",
  "workflow_mark_active",
  "workflow_mark_paused",
  "workflow_mark_retired",
  "workflow_verified",
  "workflow_reassigned",
];

const ISSUE_ACTIONS = [
  "create",
  "update",
  "delete",
  "status_change",
  "issue_opened",
  "issue_in_progress",
  "issue_resolved",
  "issue_closed",
  "issue_reassigned",
  "request_converted_to_tracked_issue",
  "system_request_converted_to_work_item",
];

function actionsForArea(area: string): string[] {
  if (area === "workflow_inventory") return WORKFLOW_ACTIONS;
  if (area === "issue_tracker" || area === "request_intake") return ISSUE_ACTIONS;
  return [];
}

function ActionBadge({ action }: { action: string }) {
  const tone =
    action.includes("delete") || action.includes("closed") || action.includes("retired")
      ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
      : action.includes("resolved") || action.includes("active") || action === "create"
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      : action.includes("status") || action.includes("progress")
      ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
      : "bg-sky-500/10 text-sky-600 border-sky-500/20";
  return (
    <Badge variant="outline" className={cn("rounded-full text-[11px] font-medium whitespace-nowrap", tone)}>
      {action.replace(/_/g, " ")}
    </Badge>
  );
}

function formatWhen(ts: string) {
  try { return new Date(ts).toLocaleString(); } catch { return ts; }
}

function DiffBlock({ label, value }: { label: string; value: Record<string, unknown> }) {
  const entries = Object.entries(value ?? {});
  if (entries.length === 0) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1 text-xs font-mono">
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <span className="text-muted-foreground min-w-[120px] truncate">{k}</span>
            <span className="text-foreground break-all">
              {v === null || v === undefined
                ? "—"
                : typeof v === "object"
                ? JSON.stringify(v)
                : String(v)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AuditLogPage() {
  const [pageSize, setPageSize] = useState(100);
  const [areaFilter, setAreaFilter] = useState<SystemToolArea | "all">("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [userQ, setUserQ] = useState("");
  const [recordQ, setRecordQ] = useState("");
  const [freeQ, setFreeQ] = useState("");
  const [detail, setDetail] = useState<SystemToolAuditLog | null>(null);

  const {
    rows, loading, loadingMore, error, hasMore, loadMore, refresh,
  } = useAuditLogSearch({
    toolArea: areaFilter,
    action: actionFilter,
    actorQuery: userQ,
    recordQuery: recordQ,
    freeText: freeQ,
    pageSize,
  });

  const availableActions = useMemo(() => {
    const suggested = areaFilter === "all"
      ? Array.from(new Set([...WORKFLOW_ACTIONS, ...ISSUE_ACTIONS]))
      : actionsForArea(areaFilter);
    const observed = Array.from(new Set(rows.map((r) => r.action)));
    return Array.from(new Set([...suggested, ...observed])).sort();
  }, [rows, areaFilter]);

  // Server-side filtering handles the coarse cut. We still grep JSON
  // blobs (previous_value/new_value/metadata) locally against the
  // currently loaded page when the user typed free-text, since those
  // columns can't be efficiently searched in PostgREST.
  const filtered = useMemo(() => {
    const fq = freeQ.trim().toLowerCase();
    if (!fq) return rows;
    return rows.filter((r) => {
      const hay = [
        r.actor_email, r.entity_table, r.entity_id, r.action,
        JSON.stringify(r.previous_value ?? {}),
        JSON.stringify(r.new_value ?? {}),
        JSON.stringify(r.metadata ?? {}),
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(fq);
    });
  }, [rows, freeQ]);

  const clear = () => {
    setAreaFilter("all");
    setActionFilter("all");
    setUserQ("");
    setRecordQ("");
    setFreeQ("");
  };

  const hasFilters =
    areaFilter !== "all" || actionFilter !== "all" || userQ || recordQ || freeQ;

  return (
    <OSShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
              <History className="h-3.5 w-3.5" /> System Tools
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Audit Log Viewer
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
              Every recorded action across Workflow Inventory, Issue Tracker, Request Intake,
              Integrations, and BCBA Productivity Uploads. Search by user, record ID, or
              specific action name.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-9 w-[140px] text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
                <SelectItem value="200">200 / page</SelectItem>
                <SelectItem value="500">500 / page</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => refresh()} className="h-9 gap-1.5 text-xs">
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
            </Button>
          </div>
        </header>

        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Area</Label>
              <Select
                value={areaFilter}
                onValueChange={(v) => {
                  setAreaFilter(v as SystemToolArea | "all");
                  setActionFilter("all");
                }}
              >
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All areas</SelectItem>
                  {Object.entries(AREA_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-[320px]">
                  <SelectItem value="all">All actions</SelectItem>
                  {availableActions.map((a) => (
                    <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">User (email or id)</Label>
              <Input
                value={userQ}
                onChange={(e) => setUserQ(e.target.value)}
                placeholder="alex@blossom.co"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Record ID / table</Label>
              <Input
                value={recordQ}
                onChange={(e) => setRecordQ(e.target.value)}
                placeholder="entity id or table"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Free-text</Label>
              <div className="relative">
                <Filter className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={freeQ}
                  onChange={(e) => setFreeQ(e.target.value)}
                  placeholder="any field or value"
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {loading
                ? "Loading…"
                : freeQ.trim()
                ? `${filtered.length} matched · ${rows.length} loaded${hasMore ? "+" : ""}`
                : `${rows.length} loaded${hasMore ? "+" : ""}`}
              {error ? ` · ${error}` : ""}
            </span>
            {hasFilters && (
              <Button size="sm" variant="ghost" onClick={clear} className="h-7 gap-1 text-xs">
                <X className="h-3.5 w-3.5" /> Clear filters
              </Button>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              {rows.length === 0
                ? "No audit activity yet."
                : "No entries match those filters."}
            </div>
          ) : (
            <>
            <div className="divide-y divide-border/60">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setDetail(r)}
                  className="w-full grid grid-cols-[140px_180px_1fr_auto] items-center gap-3 px-4 py-3 hover:bg-muted/40 text-left transition-colors"
                >
                  <div className="text-xs text-muted-foreground">{formatWhen(r.created_at)}</div>
                  <ActionBadge action={r.action} />
                  <div className="min-w-0">
                    <div className="text-sm text-foreground truncate">
                      {AREA_LABELS[r.tool_area as SystemToolArea] ?? r.tool_area}
                      {r.entity_table ? (
                        <span className="text-muted-foreground"> · {r.entity_table}</span>
                      ) : null}
                      {r.entity_id ? (
                        <span className="text-muted-foreground font-mono"> #{r.entity_id.slice(0, 8)}</span>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {r.actor_email ?? r.actor_user_id ?? "system"}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
            {hasMore && (
              <div className="border-t border-border/60 p-3 flex justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="h-8 gap-1.5 text-xs"
                >
                  <ChevronDown className={cn("h-3.5 w-3.5", loadingMore && "animate-pulse")} />
                  {loadingMore ? "Loading…" : `Load next ${pageSize}`}
                </Button>
              </div>
            )}
            </>
          )}
        </Card>
      </div>

      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {detail ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <ActionBadge action={detail.action} />
                  <span className="truncate">
                    {AREA_LABELS[detail.tool_area as SystemToolArea] ?? detail.tool_area}
                  </span>
                </SheetTitle>
                <SheetDescription>
                  {formatWhen(detail.created_at)} · {detail.actor_email ?? detail.actor_user_id ?? "system"}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="uppercase tracking-wider text-muted-foreground">Entity</div>
                    <div className="font-mono text-foreground break-all">
                      {detail.entity_table ?? "—"}
                      {detail.entity_id ? ` #${detail.entity_id}` : ""}
                    </div>
                  </div>
                  <div>
                    <div className="uppercase tracking-wider text-muted-foreground">Actor</div>
                    <div className="text-foreground break-all">
                      {detail.actor_email ?? "—"}
                    </div>
                    <div className="text-muted-foreground break-all font-mono text-[11px]">
                      {detail.actor_user_id ?? ""}
                    </div>
                  </div>
                </div>
                <DiffBlock label="Previous value" value={detail.previous_value ?? {}} />
                <DiffBlock label="New value" value={detail.new_value ?? {}} />
                <DiffBlock label="Metadata" value={detail.metadata ?? {}} />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </OSShell>
  );
}