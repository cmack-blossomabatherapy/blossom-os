import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ClipboardCheck, Search, Sparkles, AlertTriangle, CheckCircle2,
  Send, PlayCircle, ArrowUpRight, MapPin, Clock, UserCheck,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQAReviews, type QAReviewItem, type QAReviewStatus } from "@/hooks/useQAReviews";

type LaneKey = "suggested" | "in_review" | "issues" | "ready" | "submitted";

const STATUS_TO_LANE: Record<QAReviewStatus, LaneKey> = {
  "Awaiting Review": "suggested",
  "In Review": "in_review",
  "Issues Found": "issues",
  "Ready for Submission": "ready",
  "Submitted to Auth": "submitted",
};

const LANE_ORDER: LaneKey[] = ["suggested", "in_review", "issues", "ready", "submitted"];

const LANE_LABEL: Record<LaneKey, string> = {
  suggested: "Suggested · Awaiting QA",
  in_review: "In Review",
  issues: "Issues Found",
  ready: "Ready for Submission",
  submitted: "Submitted to Auth",
};

const LANE_TONE: Record<LaneKey, string> = {
  suggested: "border-primary/50 bg-primary/5",
  in_review: "border-info/40 bg-info/5",
  issues: "border-destructive/40 bg-destructive/5",
  ready: "border-amber-500/40 bg-amber-500/5",
  submitted: "border-success/40 bg-success/5",
};

export default function OSQAReviewBoard() {
  const { items, loading, error, updateStatus } = useQAReviews();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [stateFilter, setStateFilter] = useState(params.get("state") ?? "all");
  const [ownerFilter, setOwnerFilter] = useState(params.get("owner") ?? "all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const states = useMemo(
    () => Array.from(new Set(items.map((i) => i.clientState).filter(Boolean) as string[])).sort(),
    [items],
  );
  const owners = useMemo(
    () => Array.from(new Set(items.map((i) => i.assigned_qa_owner).filter(Boolean) as string[])).sort(),
    [items],
  );

  const lanes = useMemo(() => {
    const grouped: Record<LaneKey, QAReviewItem[]> = {
      suggested: [], in_review: [], issues: [], ready: [], submitted: [],
    };
    const q = query.trim().toLowerCase();
    for (const item of items) {
      const lane = STATUS_TO_LANE[item.status];
      if (!lane) continue;
      if (stateFilter !== "all" && item.clientState !== stateFilter) continue;
      if (ownerFilter !== "all" && item.assigned_qa_owner !== ownerFilter) continue;
      if (q) {
        const hay = `${item.clientName} ${item.bcba ?? ""} ${item.assigned_qa_owner ?? ""} ${item.next_action ?? ""}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      grouped[lane].push(item);
    }
    grouped.suggested.sort((a, b) => b.daysInStage - a.daysInStage);
    grouped.in_review.sort((a, b) => b.daysInStage - a.daysInStage);
    grouped.issues.sort((a, b) => b.daysInStage - a.daysInStage);
    grouped.ready.sort((a, b) => b.daysInStage - a.daysInStage);
    grouped.submitted.sort((a, b) => (b.qa_completed_date ?? "").localeCompare(a.qa_completed_date ?? ""));
    return grouped;
  }, [items, query, stateFilter, ownerFilter]);

  const syncParams = (next: { q?: string; state?: string; owner?: string }) => {
    const p = new URLSearchParams(params);
    if (next.q !== undefined) { next.q ? p.set("q", next.q) : p.delete("q"); }
    if (next.state !== undefined) { next.state !== "all" ? p.set("state", next.state) : p.delete("state"); }
    if (next.owner !== undefined) { next.owner !== "all" ? p.set("owner", next.owner) : p.delete("owner"); }
    setParams(p, { replace: true });
  };

  const advance = async (item: QAReviewItem, next: QAReviewStatus) => {
    setBusyId(item.id);
    try {
      await updateStatus(item.id, next);
      toast.success(`Moved ${item.clientName} → ${next}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update review");
    } finally {
      setBusyId(null);
    }
  };

  const totalSuggested = lanes.suggested.length;
  const totalIssues = lanes.issues.length;

  return (
    <OSShell>
      <div className="mx-auto max-w-[1600px] px-6 md:px-10 py-8 space-y-6">
        <header className="space-y-4">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground inline-flex items-center gap-3">
                <ClipboardCheck className="size-7 text-primary" /> QA Review Board
              </h1>
              <p className="mt-2 text-[15px] text-muted-foreground max-w-2xl">
                Live QA reviews moving from awaiting QA through submission. The Suggested lane surfaces every client awaiting a QA owner to begin review.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/qa-queue" className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition text-sm font-medium">
                QA Queue
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LaneChip label="Suggested" value={totalSuggested} tone="primary" />
            <LaneChip label="In Review" value={lanes.in_review.length} tone="info" />
            <LaneChip label="Issues Found" value={totalIssues} tone="destructive" />
            <LaneChip label="Ready" value={lanes.ready.length} tone="warning" />
            <LaneChip label="Submitted" value={lanes.submitted.length} tone="success" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); syncParams({ q: e.target.value }); }}
                placeholder="Search client, BCBA, QA owner, next action"
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/60 border border-border text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            <select
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value); syncParams({ state: e.target.value }); }}
              className="h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm text-foreground"
            >
              <option value="all">All states</option>
              {states.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={ownerFilter}
              onChange={(e) => { setOwnerFilter(e.target.value); syncParams({ owner: e.target.value }); }}
              className="h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm text-foreground"
            >
              <option value="all">All QA owners</option>
              <option value="">Unassigned</option>
              {owners.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Failed to load QA reviews: {error}
          </div>
        )}

        {loading && items.length === 0 ? (
          <div className="rounded-2xl border border-border/70 bg-card p-12 text-center text-sm text-muted-foreground">
            Loading QA reviews…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card p-12 text-center">
            <ClipboardCheck className="size-8 mx-auto text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium text-foreground">No QA reviews yet</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
              QA reviews are created automatically when an assessment is completed. They will appear here as soon as records are added.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
            {LANE_ORDER.map((lane) => (
              <LaneColumn
                key={lane}
                lane={lane}
                items={lanes[lane]}
                busyId={busyId}
                onAdvance={advance}
              />
            ))}
          </div>
        )}
      </div>
    </OSShell>
  );
}

function LaneColumn({
  lane, items, busyId, onAdvance,
}: {
  lane: LaneKey;
  items: QAReviewItem[];
  busyId: string | null;
  onAdvance: (i: QAReviewItem, next: QAReviewStatus) => void;
}) {
  return (
    <div className={cn(
      "rounded-2xl border bg-card shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)] overflow-hidden",
      LANE_TONE[lane],
    )}>
      <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between bg-card">
        <h2 className="text-sm font-semibold tracking-tight text-foreground inline-flex items-center gap-2">
          {lane === "suggested" && <Sparkles className="size-4 text-primary" />}
          {lane === "issues" && <AlertTriangle className="size-4 text-destructive" />}
          {lane === "submitted" && <CheckCircle2 className="size-4 text-success" />}
          {LANE_LABEL[lane]}
        </h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md tabular-nums">{items.length}</span>
      </div>
      <div className="max-h-[760px] overflow-y-auto divide-y divide-border/50">
        {items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            {lane === "suggested" ? "No QA reviews awaiting pickup." : "Nothing here."}
          </p>
        ) : (
          items.map((item) => (
            <BoardCard key={item.id} item={item} lane={lane} busy={busyId === item.id} onAdvance={onAdvance} />
          ))
        )}
      </div>
    </div>
  );
}

function BoardCard({
  item, lane, busy, onAdvance,
}: {
  item: QAReviewItem;
  lane: LaneKey;
  busy: boolean;
  onAdvance: (i: QAReviewItem, next: QAReviewStatus) => void;
}) {
  const aging = item.daysInStage;
  const blockers = item.blockers ?? [];
  const alerts = item.alerts ?? [];
  return (
    <div className="p-3.5 hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground truncate">{item.clientName}</p>
            {aging > 7 && lane !== "submitted" && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive">
                {aging}d in stage
              </span>
            )}
            {item.errors_found && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive">
                errors
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
            {item.clientState && (
              <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{item.clientState}</span>
            )}
            <span className="inline-flex items-center gap-1"><Clock className="size-3" />{aging}d</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
            <span className="text-muted-foreground">BCBA: <span className="text-foreground">{item.bcba ?? "—"}</span></span>
            <span className="text-muted-foreground inline-flex items-center gap-1">
              <UserCheck className="size-3" /> QA: <span className="text-foreground">{item.assigned_qa_owner ?? "Unassigned"}</span>
            </span>
          </div>
          {item.next_action && (
            <p className="mt-1.5 text-[11px] text-foreground/80">
              <span className="text-muted-foreground">Next:</span> {item.next_action}
            </p>
          )}
          {blockers.length > 0 && (
            <p className="mt-1 text-[11px] text-destructive inline-flex items-start gap-1">
              <AlertTriangle className="size-3 mt-0.5 shrink-0" />
              <span className="truncate">{blockers[0]}{blockers.length > 1 ? ` +${blockers.length - 1}` : ""}</span>
            </p>
          )}
          {alerts.length > 0 && (
            <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400 truncate">{alerts[0]}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {lane === "suggested" && (
            <button
              onClick={() => onAdvance(item, "In Review")}
              disabled={busy}
              className="h-7 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition inline-flex items-center gap-1 disabled:opacity-50"
            >
              <PlayCircle className="size-3" /> Start Review
            </button>
          )}
          {lane === "in_review" && (
            <>
              <button
                onClick={() => onAdvance(item, "Ready for Submission")}
                disabled={busy}
                className="h-7 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition inline-flex items-center gap-1 disabled:opacity-50"
              >
                <CheckCircle2 className="size-3" /> Mark Ready
              </button>
              <button
                onClick={() => onAdvance(item, "Issues Found")}
                disabled={busy}
                className="h-6 px-2 rounded-md text-[11px] text-destructive hover:bg-destructive/10 transition"
              >
                Flag Issues
              </button>
            </>
          )}
          {lane === "issues" && (
            <button
              onClick={() => onAdvance(item, "In Review")}
              disabled={busy}
              className="h-7 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition inline-flex items-center gap-1 disabled:opacity-50"
            >
              <PlayCircle className="size-3" /> Resume Review
            </button>
          )}
          {lane === "ready" && (
            <button
              onClick={() => onAdvance(item, "Submitted to Auth")}
              disabled={busy}
              className="h-7 px-3 rounded-lg bg-success text-success-foreground text-xs font-medium hover:opacity-90 transition inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Send className="size-3" /> Submit to Auth
            </button>
          )}
          {lane === "submitted" && item.qa_completed_date && (
            <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
              <CheckCircle2 className="size-3 text-success" /> {item.qa_completed_date}
            </span>
          )}
          <Link
            to={`/clients/${item.client_id}`}
            className="text-[11px] text-primary inline-flex items-center gap-1 hover:underline"
          >
            Open <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function LaneChip({
  label, value, tone,
}: {
  label: string;
  value: number;
  tone: "primary" | "info" | "destructive" | "warning" | "success";
}) {
  const toneClass =
    tone === "primary" ? "text-primary"
    : tone === "info" ? "text-info"
    : tone === "destructive" ? "text-destructive"
    : tone === "warning" ? "text-amber-600 dark:text-amber-400"
    : "text-success";
  return (
    <div className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-card border border-border/70 text-sm">
      <span className={cn("font-semibold tabular-nums", toneClass)}>{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}