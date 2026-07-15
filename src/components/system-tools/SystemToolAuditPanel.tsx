import { useMemo, useState } from "react";
import { History, Filter, RefreshCw, ChevronRight, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  useSystemToolAuditLogs,
  type SystemToolArea,
  type SystemToolAuditLog,
} from "@/hooks/useSystemTools";

const AREA_LABELS: Record<SystemToolArea, string> = {
  workflow_inventory: "Workflow Inventory",
  issue_tracker: "Issue Tracker",
  request_intake: "Request Intake",
  bcba_productivity_uploads: "BCBA Productivity Uploads",
  centralreach_uploads: "CentralReach Uploads",
  integrations: "Integrations",
};

const ACTION_TONES: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  update: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  status_change: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  delete: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

function ActionBadge({ action }: { action: string }) {
  const cls = ACTION_TONES[action] ?? "bg-muted text-muted-foreground border-border/60";
  return (
    <Badge variant="outline" className={cn("rounded-full text-[11px] font-medium", cls)}>
      {action.replace(/_/g, " ")}
    </Badge>
  );
}

function formatWhen(ts: string) {
  try { return new Date(ts).toLocaleString(); } catch { return ts; }
}

function DiffBlock({ label, value }: { label: string; value: Record<string, unknown> }) {
  const entries = Object.entries(value ?? {});
  if (entries.length === 0) {
    return (
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
        <div className="text-xs text-muted-foreground italic">Empty</div>
      </div>
    );
  }
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

function AuditDetailSheet({
  entry, onOpenChange,
}: {
  entry: SystemToolAuditLog | null;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Sheet open={!!entry} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        {entry ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <ActionBadge action={entry.action} />
                <span className="truncate">{AREA_LABELS[entry.tool_area as SystemToolArea] ?? entry.tool_area}</span>
              </SheetTitle>
              <SheetDescription>
                {formatWhen(entry.created_at)} · {entry.actor_email ?? "system"}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="uppercase tracking-wider text-muted-foreground">Entity</div>
                  <div className="font-mono text-foreground break-all">
                    {entry.entity_table ?? "—"}{entry.entity_id ? ` #${entry.entity_id.slice(0, 8)}` : ""}
                  </div>
                </div>
                <div>
                  <div className="uppercase tracking-wider text-muted-foreground">Actor</div>
                  <div className="text-foreground break-all">{entry.actor_email ?? "—"}</div>
                </div>
              </div>
              <DiffBlock label="Previous value" value={entry.previous_value ?? {}} />
              <DiffBlock label="New value" value={entry.new_value ?? {}} />
              {Object.keys(entry.metadata ?? {}).length > 0 && (
                <DiffBlock label="Metadata" value={entry.metadata ?? {}} />
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export interface SystemToolAuditPanelProps {
  /** Restrict to a single tool area. Omit to show all areas. */
  toolArea?: SystemToolArea;
  /** Restrict to a single entity id (per-record history). */
  entityId?: string | null;
  /** Panel title. Defaults based on scope. */
  title?: string;
  /** Compact mode used inside per-row drawer. */
  compact?: boolean;
  /** Max rows to fetch (default 100). */
  limit?: number;
}

export function SystemToolAuditPanel({
  toolArea, entityId, title, compact = false, limit = 100,
}: SystemToolAuditPanelProps) {
  const { rows, loading, error, refresh } = useSystemToolAuditLogs({
    toolArea, entityId, limit,
  });
  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [detail, setDetail] = useState<SystemToolAuditLog | null>(null);

  const actions = useMemo(() => {
    const s = new Set(rows.map((r) => r.action));
    return Array.from(s).sort();
  }, [rows]);

  const areas = useMemo(() => {
    const s = new Set(rows.map((r) => r.tool_area));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (actionFilter !== "all" && r.action !== actionFilter) return false;
      if (areaFilter !== "all" && r.tool_area !== areaFilter) return false;
      if (!needle) return true;
      const hay = [
        r.actor_email, r.entity_table, r.entity_id, r.action,
        JSON.stringify(r.previous_value ?? {}),
        JSON.stringify(r.new_value ?? {}),
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q, actionFilter, areaFilter]);

  const resolvedTitle = title
    ?? (entityId ? "Record history" : toolArea ? `${AREA_LABELS[toolArea]} audit log` : "System tools audit log");

  return (
    <Card className={cn("rounded-2xl border-border/60 p-5", compact && "p-4")}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-muted/60 p-2 text-muted-foreground">
            <History className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">{resolvedTitle}</h3>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading…" : `${filtered.length} of ${rows.length} entr${rows.length === 1 ? "y" : "ies"}`}
              {error ? ` · ${error}` : ""}
            </p>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => refresh()} className="h-8 gap-1.5 text-xs">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {!compact && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Filter className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search actor, field, or value…"
              className="pl-9 h-9 text-sm"
            />
          </div>
          {!toolArea && areas.length > 1 && (
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="h-9 w-[180px] text-sm"><SelectValue placeholder="Area" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All areas</SelectItem>
                {areas.map((a) => (
                  <SelectItem key={a} value={a}>{AREA_LABELS[a as SystemToolArea] ?? a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {actions.length > 1 && (
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-9 w-[160px] text-sm"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {actions.map((a) => (
                  <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {(q || actionFilter !== "all" || areaFilter !== "all") && (
            <Button
              size="sm" variant="ghost"
              onClick={() => { setQ(""); setActionFilter("all"); setAreaFilter("all"); }}
              className="h-9 gap-1 text-xs text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border/60 divide-y divide-border/60 overflow-hidden">
        {loading ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "No audit activity yet." : "No entries match those filters."}
          </div>
        ) : (
          filtered.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setDetail(r)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 text-left transition-colors"
            >
              <ActionBadge action={r.action} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground truncate">
                  {AREA_LABELS[r.tool_area as SystemToolArea] ?? r.tool_area}
                  {r.entity_table ? <span className="text-muted-foreground"> · {r.entity_table}</span> : null}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {r.actor_email ?? "system"} · {formatWhen(r.created_at)}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))
        )}
      </div>

      <AuditDetailSheet entry={detail} onOpenChange={(v) => !v && setDetail(null)} />
    </Card>
  );
}

/**
 * Small ghost button that opens a per-entity audit history drawer.
 * Use inline in table row actions.
 */
export function AuditHistoryButton({
  toolArea, entityId, entityLabel,
}: {
  toolArea: SystemToolArea;
  entityId: string;
  entityLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"
        onClick={() => setOpen(true)}
        title="View audit history"
      >
        <History className="h-4 w-4" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Audit history</SheetTitle>
            <SheetDescription>
              {entityLabel ?? "Every recorded change for this record"}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <SystemToolAuditPanel
              toolArea={toolArea}
              entityId={entityId}
              compact
              title="Change history"
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}