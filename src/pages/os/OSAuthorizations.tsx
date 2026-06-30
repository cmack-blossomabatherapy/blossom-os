import { useEffect, useMemo, useRef, useState } from "react";
import { AuthPromptDialog } from "@/components/authorizations/AuthPromptDialog";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search, Plus, Sparkles, AlertTriangle, ChevronRight, ClipboardCheck,
  MessageSquare, StickyNote, Download, X, Wand2, FileWarning, Send,
  Users, Bookmark, Rows3, LayoutGrid, Filter, CalendarClock,
  ShieldAlert, UserCog, FileCheck2, CircleDot, ArrowUpRight,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  type Authorization, type AuthStage,
  daysUntil, getAuthAlert,
} from "@/data/authorizations";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import {
  NewAuthorizationDialog,
  SavedViewsMenu,
  SourceBadge,
} from "@/components/authorizations/AuthorizationActionUI";
import {
  useAuthorizationActions,
  type EnsureOverlayInput,
} from "@/hooks/useAuthorizationActions";
import type { SavedView } from "@/hooks/useAuthorizationSavedViews";
import { useAuth } from "@/contexts/AuthContext";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function safeNameLabel(value: string | null | undefined, fallback = "Unassigned"): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (UUID_RE.test(trimmed)) return "Assigned coordinator";
  return trimmed;
}

/* ------------------------------ helpers ------------------------------ */
function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
function supervisionPct(a: Authorization) { return 55 + (hash(a.id) % 45); }
function lastPRDays(a: Authorization) { return hash(a.id + "pr") % 95; }
function bcbaName(a: Authorization, liveBcba?: string | null) {
  if (liveBcba) return liveBcba;
  return "Unassigned BCBA";
}
function requestType(a: Authorization): "Initial" | "Treatment Auth" | "Reassessment" | "Parent Training 97156" {
  if (a.authType === "Initial") return "Initial";
  if (a.authType === "Reauth") return "Reassessment";
  if (hash(a.id + "rt") % 7 === 0) return "Parent Training 97156";
  return "Treatment Auth";
}
function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86_400_000;
  if (diff < 3_600_000) return `${Math.max(1, Math.round(diff / 60_000))}m ago`;
  if (diff < day) return `${Math.round(diff / 3_600_000)}h ago`;
  if (diff < 30 * day) return `${Math.round(diff / day)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type EnrichedAuth = Authorization & {
  bcba: string;
  supervisionPct: number;
  lastPRDays: number;
  daysToExpire: number | null;
  alert: ReturnType<typeof getAuthAlert>;
  urgency: "low" | "medium" | "high";
  primaryBlocker: string | null;
  requestType: ReturnType<typeof requestType>;
};

function buildOverlayFromAuth(
  a: Authorization,
  source: "monday" | "manual" | "centralreach" = "monday",
  overlayId?: string | null,
  liveBcba?: string | null,
): EnsureOverlayInput {
  return {
    source_system: source,
    overlay_id: overlayId ?? null,
    monday_item_id: source === "monday" ? a.id : null,
    centralreach_authorization_id: source === "centralreach" ? a.id : null,
    source_id: a.id,
    client_name: a.clientName,
    state: a.state,
    payer: a.payor,
    auth_type: a.authType,
    status: a.stage,
    workflow_stage: a.stage,
    assigned_owner: a.coordinator ?? null,
    assigned_bcba: liveBcba ?? null,
    expiration_date: a.expirationDate ?? null,
  };
}

function enrich(a: Authorization, liveBcba?: string | null): EnrichedAuth {
  const days = daysUntil(a.expirationDate);
  const alert = getAuthAlert(a);
  const sup = supervisionPct(a);
  const pr = lastPRDays(a);
  let urgency: "low" | "medium" | "high" = "low";
  if (alert?.type === "red" || (days !== null && days < 15) || sup < 70 || pr > 45) urgency = "high";
  else if (alert?.type === "yellow" || (days !== null && days < 45) || sup < 80 || pr > 30) urgency = "medium";

  let blocker: string | null = null;
  if (a.missingInfo) blocker = "Missing documentation";
  else if (days !== null && days < 15) blocker = "Expiring < 15 days";
  else if (sup < 70) blocker = "Supervision < 70%";
  else if (pr > 45) blocker = "PR overdue 45d+";
  else if (a.stage === "In QA Review" && a.daysInStage >= 3) blocker = "QA review pending";
  else if (!a.treatmentPlanReceived && a.stage !== "Approved") blocker = "Treatment plan missing";
  else if (a.stage === "Awaiting Submission" && a.daysInStage >= 2) blocker = "Awaiting submission";
  else if (days !== null && days < 45) blocker = "Expiring soon";

  return {
    ...a, bcba: bcbaName(a, liveBcba), supervisionPct: sup, lastPRDays: pr,
    daysToExpire: days, alert, urgency, primaryBlocker: blocker,
    requestType: requestType(a),
  };
}

/* stage chip colors */
const STAGE_STYLES: Record<AuthStage, string> = {
  "Awaiting Submission": "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
  "Submitted": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
  "Approved": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  "Expiring Soon": "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  "In QA Review": "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
  "Denied": "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
  "Flaked Client": "bg-muted text-muted-foreground border-border",
};

function StageChip({ stage }: { stage: AuthStage }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
      STAGE_STYLES[stage] || "bg-muted text-muted-foreground border-border")}>
      <CircleDot className="h-2.5 w-2.5" />
      {stage}
    </span>
  );
}

/* ------------------------------ views & filters ------------------------------ */
const VIEW_GROUPS = [
  {
    label: "Default",
    views: [
      { id: "all", name: "All Authorizations" },
      { id: "awaiting", name: "Awaiting Submission" },
      { id: "submitted", name: "Submitted" },
      { id: "approved", name: "Approved" },
      { id: "expiring", name: "Expiring Soon" },
      { id: "qa", name: "QA Review" },
      { id: "denied", name: "Denied" },
      { id: "missing", name: "Missing Information" },
    ],
  },
  {
    label: "Workflow",
    views: [
      { id: "initial", name: "Initial Authorizations" },
      { id: "treatment", name: "Treatment Authorizations" },
      { id: "reassessment", name: "Reassessments" },
      { id: "pt97156", name: "Parent Training 97156" },
    ],
  },
  {
    label: "Escalation",
    views: [
      { id: "needs_pr", name: "Needs PR" },
      { id: "pr_overdue", name: "PR Overdue" },
      { id: "needs_qa", name: "Needs QA" },
      { id: "missing_docs", name: "Missing Documentation" },
      { id: "needs_sd", name: "Needs State Director" },
      { id: "high_risk", name: "High Risk" },
    ],
  },
  {
    label: "Personal",
    views: [
      { id: "mine", name: "Assigned to Me" },
      { id: "recent", name: "Recently Updated" },
    ],
  },
] as const;

type ViewId = (typeof VIEW_GROUPS)[number]["views"][number]["id"];

function applyView(items: EnrichedAuth[], v: ViewId, me: string | null = null): EnrichedAuth[] {
  switch (v) {
    case "all": return items;
    case "awaiting": return items.filter(a => a.stage === "Awaiting Submission");
    case "submitted": return items.filter(a => a.stage === "Submitted");
    case "approved": return items.filter(a => a.stage === "Approved");
    case "expiring": return items.filter(a => a.daysToExpire !== null && a.daysToExpire >= 0 && a.daysToExpire < 45);
    case "qa": return items.filter(a => a.stage === "In QA Review");
    case "denied": return items.filter(a => a.stage === "Denied");
    case "missing": return items.filter(a => a.missingInfo || a.missingRequirements.length > 0);
    case "initial": return items.filter(a => a.authType === "Initial");
    case "treatment": return items.filter(a => a.authType === "Treatment");
    case "reassessment": return items.filter(a => a.authType === "Reauth");
    case "pt97156": return items.filter(a => a.requestType === "Parent Training 97156");
    case "needs_pr": return items.filter(a => a.lastPRDays > 30);
    case "pr_overdue": return items.filter(a => a.lastPRDays > 45);
    case "needs_qa": return items.filter(a => a.stage === "In QA Review" || a.qaStatus === "In Review");
    case "missing_docs": return items.filter(a => a.missingInfo || a.missingRequirements.length > 0 || !a.treatmentPlanReceived);
    case "needs_sd": return items.filter(a => a.urgency === "high" && (a.lastPRDays > 45 || a.stage === "Denied"));
    case "high_risk": return items.filter(a => a.urgency === "high");
    case "mine": return me ? items.filter(a => a.coordinator === me) : [];
    case "recent": return [...items].sort((x, y) => new Date(y.lastActivity ?? 0).getTime() - new Date(x.lastActivity ?? 0).getTime()).slice(0, 25);
    default: return items;
  }
}

type Filters = {
  state: string | null;
  payor: string | null;
  coordinator: string | null;
};

/* ------------------------------ page ------------------------------ */
const STAGE_TO_VIEW: Record<string, ViewId> = {
  awaiting: "awaiting", submitted: "submitted", approved: "approved",
  expiring: "expiring", qa: "qa", denied: "denied", missing: "missing",
  pr: "needs_pr", high_risk: "high_risk", mine: "mine", recent: "recent",
};
function paramToView(params: URLSearchParams): ViewId | null {
  const v = params.get("view");
  if (v && (v as ViewId)) return v as ViewId;
  const s = params.get("stage");
  if (s && STAGE_TO_VIEW[s]) return STAGE_TO_VIEW[s];
  return null;
}

export default function OSAuthorizations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewId>(() => paramToView(searchParams) || "all");
  const [openId, setOpenId] = useState<string | null>(() => searchParams.get("authId"));
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [newAuthOpen, setNewAuthOpen] = useState(false);
  const actions = useAuthorizationActions();
  const { displayName } = useAuth();

  const [filters, setFilters] = useState<Filters>({
    state: searchParams.get("state"),
    payor: searchParams.get("payor"),
    coordinator: searchParams.get("coordinator"),
  });

  const applySavedView = (v: SavedView) => {
    const cfg = v.config as { view?: ViewId; query?: string; density?: "comfortable" | "compact"; filters?: Filters };
    if (cfg.view) setView(cfg.view);
    if (typeof cfg.query === "string") setQuery(cfg.query);
    if (cfg.density) setDensity(cfg.density);
    if (cfg.filters) setFilters(cfg.filters);
  };

  // React to deep-link changes coming from other pages (Risk Center, Supervision, etc.)
  useEffect(() => {
    const id = searchParams.get("authId");
    if (id) setOpenId(id);
    const v = paramToView(searchParams);
    if (v) setView(v);
  }, [searchParams]);

  // Keep the URL clean when the drawer closes so back-nav stays sensible.
  const closeDrawer = () => {
    setOpenId(null);
    if (searchParams.get("authId")) {
      const next = new URLSearchParams(searchParams);
      next.delete("authId");
      setSearchParams(next, { replace: true });
    }
  };

  const live = useLiveAuthorizations();
  const enriched = useMemo(
    () => live.items.map((a) => {
      const e = enrich(a, live.bcbaById.get(a.id));
      return { ...e, coordinator: safeNameLabel(e.coordinator) };
    }),
    [live.items, live.bcbaById],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = applyView(enriched, view, displayName || null);
    if (filters.state) arr = arr.filter(a => a.state === filters.state);
    if (filters.payor) arr = arr.filter(a => a.payor === filters.payor);
    if (filters.coordinator) arr = arr.filter(a => a.coordinator === filters.coordinator);
    if (q) arr = arr.filter(a => [a.clientName, a.id, a.bcba, a.payor, a.stage, a.requestType, a.state, a.coordinator]
      .map(s => String(s ?? "").toLowerCase()).join(" ").includes(q));
    // Stable, deterministic sort: urgency desc → days-to-expire asc (nulls last) → id asc
    const urgencyRank = { high: 0, medium: 1, low: 2 } as const;
    return [...arr].sort((x, y) => {
      const u = urgencyRank[x.urgency] - urgencyRank[y.urgency];
      if (u !== 0) return u;
      const dx = x.daysToExpire ?? Number.POSITIVE_INFINITY;
      const dy = y.daysToExpire ?? Number.POSITIVE_INFINITY;
      if (dx !== dy) return dx - dy;
      return x.id.localeCompare(y.id);
    });
  }, [enriched, view, filters, query]);

  const states = useMemo(() => Array.from(new Set(enriched.map(a => a.state))).sort(), [enriched]);
  const payors = useMemo(() => Array.from(new Set(enriched.map(a => a.payor))).sort(), [enriched]);
  const coordinators = useMemo(() => Array.from(new Set(enriched.map(a => a.coordinator))).sort(), [enriched]);

  return (
    <OSShell rightRail={<AskBlossomAuthRail auths={visible} onOpen={setOpenId} />}>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Authorizations</h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
              Manage authorization records, progression, expiration readiness, QA coordination, and payer workflows.
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-1.5">
              {live.loading ? "Loading from Monday import…"
                : live.error ? `Live load failed: ${live.error}`
                : `Live · ${live.totalRows.toLocaleString()} records from monday_authorizations_raw`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SavedViewsMenu
              scope="authorizations"
              currentConfig={{ view, query, density, filters }}
              onApply={applySavedView}
              triggerClassName="h-8 rounded-md border-0 bg-transparent px-2"
            />
            <Button variant="ghost" size="sm" onClick={() => toast("Export — coming soon")}>
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/ai/assistant"><Sparkles className="mr-1.5 h-4 w-4" /> Operational Insights</Link>
            </Button>
            <Button size="sm" onClick={() => setNewAuthOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> New Authorization
            </Button>
          </div>
        </header>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search client, auth ID, payer, BCBA, coordinator, state…"
            className="h-11 w-full rounded-xl bg-muted/60 border border-border pl-10 pr-4 text-sm placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent transition outline-none"
          />
        </div>

        {/* Views */}
        <ViewTabs current={view} onChange={setView} counts={enriched} />

        {/* Filters + density */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground mr-0.5" />
            <FilterChip label="State" value={filters.state} options={states} onChange={(v) => setFilters(f => ({ ...f, state: v }))} />
            <FilterChip label="Payer" value={filters.payor} options={payors} onChange={(v) => setFilters(f => ({ ...f, payor: v }))} />
            <FilterChip label="Coordinator" value={filters.coordinator} options={coordinators} onChange={(v) => setFilters(f => ({ ...f, coordinator: v }))} />
            {(filters.state || filters.payor || filters.coordinator) && (
              <button onClick={() => setFilters({ state: null, payor: null, coordinator: null })}
                className="text-[11px] text-muted-foreground hover:text-foreground ml-1">Clear</button>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-full border border-border bg-muted/50 p-0.5">
            <DensityBtn icon={LayoutGrid} active={density === "comfortable"} onClick={() => setDensity("comfortable")} />
            <DensityBtn icon={Rows3} active={density === "compact"} onClick={() => setDensity("compact")} />
          </div>
        </div>

        {/* Records */}
        <AuthRecords
          auths={visible}
          density={density}
          onOpen={setOpenId}
          sourceById={live.sourceById}
          overlayIdByAuthId={live.overlayIdByAuthId}
          bcbaById={live.bcbaById}
        />
      </div>

      {openId && (
        <AuthDrawer
          auth={live.items.find((x) => x.id === openId) ?? null}
          liveBcba={live.bcbaById.get(openId) ?? null}
          sourceSystem={live.sourceById.get(openId) ?? "manual"}
          overlayId={live.overlayIdByAuthId.get(openId) ?? null}
          onClose={closeDrawer}
        />
      )}
      <NewAuthorizationDialog
        open={newAuthOpen}
        onOpenChange={setNewAuthOpen}
        onCreated={() => { void live.refresh(); }}
      />
    </OSShell>
  );
}

/* ------------------------------ view tabs ------------------------------ */
function ViewTabs({ current, onChange, counts }: { current: ViewId; onChange: (v: ViewId) => void; counts: EnrichedAuth[] }) {
  return (
    <div className="space-y-2.5">
      {VIEW_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground w-20 shrink-0">{group.label}</span>
          {group.views.map((v) => {
            const n = applyView(counts, v.id).length;
            const active = current === v.id;
            return (
              <button key={v.id} onClick={() => onChange(v.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] transition border",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border/70 hover:text-foreground hover:bg-muted"
                )}>
                {v.name}
                <span className={cn("tabular-nums text-[10px]", active ? "text-primary-foreground/80" : "text-muted-foreground/70")}>{n}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function FilterChip({ label, value, options, onChange }: {
  label: string; value: string | null; options: string[]; onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] transition border",
          value ? "bg-primary/10 text-primary border-primary/30" : "bg-card text-muted-foreground border-border/70 hover:text-foreground",
        )}>
        {label}{value ? `: ${value}` : ""}
        <ChevronRight className={cn("h-3 w-3 transition", open && "rotate-90")} />
      </button>
      {open && (
        <div className="absolute z-30 top-9 left-0 min-w-[12rem] max-h-72 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg p-1">
          <button onClick={() => { onChange(null); setOpen(false); }}
            className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg hover:bg-muted text-muted-foreground">Any</button>
          {options.map((o) => (
            <button key={o} onClick={() => { onChange(o); setOpen(false); }}
              className={cn("w-full text-left text-xs px-2.5 py-1.5 rounded-lg hover:bg-muted",
                value === o && "bg-muted font-medium")}>{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function DensityBtn({ icon: Icon, active, onClick }: { icon: any; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("grid place-items-center h-7 w-7 rounded-full transition",
        active ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

/* ------------------------------ records list ------------------------------ */
const PAGE_SIZE = 25;

function AuthRecords({
  auths,
  density,
  onOpen,
  sourceById,
  overlayIdByAuthId,
  bcbaById,
}: {
  auths: EnrichedAuth[];
  density: "comfortable" | "compact";
  onOpen: (id: string) => void;
  sourceById: Map<string, "monday" | "manual" | "centralreach">;
  overlayIdByAuthId: Map<string, string>;
  bcbaById: Map<string, string>;
}) {
  const [count, setCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Build a stable signature of the current filtered+sorted result so we reset
  // pagination whenever the underlying result set changes (filters, view, search).
  // Combines length + head + tail ids so any change to filters/sort/search that
  // alters the result set forces a reset back to page 1, even when the visible
  // top of the list happens to overlap.
  const signature = useMemo(() => {
    const n = auths.length;
    if (n === 0) return "empty";
    const head = auths.slice(0, 4).map(a => a.id).join("|");
    const tail = auths.slice(-4).map(a => a.id).join("|");
    return `${n}::${head}::${tail}`;
  }, [auths]);

  // Reset to first page whenever the result set identity changes.
  useEffect(() => { setCount(PAGE_SIZE); }, [signature]);

  const shown = auths.slice(0, count);
  const hasMore = count < auths.length;

  // Infinite scroll via IntersectionObserver — load next page as sentinel enters viewport.
  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        setCount(c => Math.min(c + PAGE_SIZE, auths.length));
      }
    }, { rootMargin: "400px 0px" });
    io.observe(node);
    return () => io.disconnect();
  }, [hasMore, auths.length, signature]);

  if (auths.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-16 text-center">
        <p className="text-sm text-muted-foreground">No authorizations found in this view.</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Try clearing filters or selecting a different view.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground tabular-nums">
          Showing {shown.length} of {auths.length} record{auths.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className={cn("rounded-2xl border border-border/70 bg-card overflow-hidden divide-y divide-border/50")}>
        {shown.map((a) => (
          <AuthRow
            key={a.id}
            a={a}
            density={density}
            onOpen={() => onOpen(a.id)}
            source={sourceById.get(a.id) ?? "manual"}
            overlayId={overlayIdByAuthId.get(a.id) ?? null}
            liveBcba={bcbaById.get(a.id) ?? null}
          />
        ))}
      </div>
      {hasMore ? (
        <div ref={sentinelRef} className="flex items-center justify-center py-4">
          <button
            onClick={() => setCount(c => Math.min(c + PAGE_SIZE, auths.length))}
            className="text-xs text-muted-foreground hover:text-foreground transition rounded-full border border-border/70 bg-card px-3 py-1.5"
          >
            Loading more… (show {Math.min(PAGE_SIZE, auths.length - count)} more)
          </button>
        </div>
      ) : (
        auths.length > PAGE_SIZE && (
          <div className="text-center text-[11px] text-muted-foreground/70 py-3">
            End of results
          </div>
        )
      )}
    </div>
  );
}

function AuthRow({
  a,
  density,
  onOpen,
  source = "manual",
  overlayId = null,
  liveBcba = null,
}: {
  a: EnrichedAuth;
  density: "comfortable" | "compact";
  onOpen: () => void;
  source?: "monday" | "manual" | "centralreach";
  overlayId?: string | null;
  liveBcba?: string | null;
}) {
  const compact = density === "compact";
  const actions = useAuthorizationActions();
  const overlay = buildOverlayFromAuth(a, source, overlayId, liveBcba);
  const expTone = a.daysToExpire === null ? "text-muted-foreground"
    : a.daysToExpire < 15 ? "text-rose-600"
    : a.daysToExpire < 45 ? "text-amber-600"
    : "text-emerald-600";

  return (
    <div onClick={onOpen}
      className={cn(
        "group grid grid-cols-1 lg:grid-cols-[1.6fr_1.4fr_1fr_auto] gap-4 px-5 hover:bg-muted/40 cursor-pointer transition",
        compact ? "py-2.5" : "py-4",
      )}>
      {/* LEFT — identity */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[15px] font-medium truncate">{a.clientName}</p>
          <span className="text-[10px] font-mono text-muted-foreground/70">{a.id}</span>
          <SourceBadge source={source} />
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {a.state} · {a.payor} · <span className="text-foreground/70">{a.requestType}</span>
        </p>
      </div>

      {/* CENTER — workflow status */}
      <div className="min-w-0 flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <StageChip stage={a.stage} />
          {a.qaStatus !== "Not Started" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/8 text-violet-700 dark:text-violet-300 border border-violet-500/15 px-2 py-0.5 text-[10px]">
              QA · {a.qaStatus}
            </span>
          )}
          {a.lastPRDays > 30 && (
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] border",
              a.lastPRDays > 45 ? "bg-rose-500/8 text-rose-700 dark:text-rose-300 border-rose-500/20"
                : "bg-amber-500/8 text-amber-700 dark:text-amber-300 border-amber-500/20")}>
              PR · {a.lastPRDays}d
            </span>
          )}
        </div>
        {!compact && (
          <p className="text-[11px] text-muted-foreground truncate">
            Coord: <span className="text-foreground/80">{a.coordinator}</span> · BCBA: <span className="text-foreground/80">{a.bcba}</span>
          </p>
        )}
      </div>

      {/* RIGHT — expiration + risk */}
      <div className="flex items-center gap-5">
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
            {a.daysToExpire !== null ? "Expires" : "In stage"}
          </p>
          <p className={cn("text-sm font-semibold tabular-nums", expTone)}>
            {a.daysToExpire !== null ? `${a.daysToExpire}d` : `${a.daysInStage}d`}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={cn(
            "inline-block h-1.5 w-1.5 rounded-full",
            a.urgency === "high" ? "bg-rose-500" : a.urgency === "medium" ? "bg-amber-500" : "bg-emerald-500",
          )} />
          <span className="capitalize">{a.urgency}</span>
        </div>
      </div>

      {/* Far right — open arrow + quick actions on hover */}
      <div className="flex items-center justify-end gap-1">
        <div className="hidden xl:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
          <IconAction icon={Send} title="Request PR" onClick={() => void actions.requestPR(overlay, { dueInDays: 3 })} />
          <IconAction icon={ClipboardCheck} title="Send to QA" onClick={() => void actions.sendToQA(overlay)} />
          <IconAction icon={AlertTriangle} title="Escalate" onClick={() => void actions.escalate(overlay)} />
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
}

function IconAction({ icon: Icon, title, onClick }: { icon: any; title: string; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick}
      className="grid place-items-center h-7 w-7 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition">
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

/* ------------------------------ drawer ------------------------------ */
function AuthDrawer({
  auth,
  liveBcba,
  sourceSystem = "manual",
  overlayId = null,
  onClose,
}: {
  auth: Authorization | null;
  liveBcba: string | null;
  sourceSystem?: "monday" | "manual" | "centralreach";
  overlayId?: string | null;
  onClose: () => void;
}) {
  const actions = useAuthorizationActions();
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  if (!auth) return null;
  const a = auth;
  const e = enrich(a, liveBcba);
  const overlay = buildOverlayFromAuth(a, sourceSystem, overlayId, liveBcba);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-2xl bg-card border-l border-border overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border/60 px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold truncate">{a.clientName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {a.id} · {e.requestType} · {a.payor} · {a.state}
              </p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <StageChip stage={a.stage} />
            <span className={cn("rounded-full border px-2 py-0.5 text-[11px]",
              e.urgency === "high" ? "border-rose-500/30 text-rose-600 bg-rose-500/5"
                : e.urgency === "medium" ? "border-amber-500/30 text-amber-600 bg-amber-500/5"
                : "border-emerald-500/30 text-emerald-600 bg-emerald-500/5",
            )}>{e.urgency} risk</span>
            {e.daysToExpire !== null && (
              <span className="text-[11px] text-muted-foreground">
                Expires {a.expirationDate} ({e.daysToExpire}d)
              </span>
            )}
          </div>
        </div>

        {/* Quick action bar */}
        <div className="px-6 py-3 border-b border-border/60 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void actions.requestPR(overlay, { dueInDays: 3 })}>
            <Send className="mr-1.5 h-3.5 w-3.5" /> Request PR
          </Button>
          <Button size="sm" variant="outline" onClick={() => void actions.sendToQA(overlay)}>
            <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" /> Send to QA
          </Button>
          <Button
            size="sm"
            variant="outline"
            title="Outbound email/SMS integration is pending — message is logged to the activity feed."
            onClick={() => {
              void actions.queueExternalSend(overlay, { channel: "email", summary: `Message BCBA ${e.bcba}` });
              toast.info("Message queued", { description: "External send integration pending — logged to activity feed." });
            }}
          >
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Message BCBA
            <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700">Queued</span>
          </Button>
          <Button size="sm" variant="outline" onClick={() => setNoteDialogOpen(true)}>
            <StickyNote className="mr-1.5 h-3.5 w-3.5" /> Note
          </Button>
          <Button size="sm" variant="outline" onClick={() => void actions.escalate(overlay)}>
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Escalate
          </Button>
        </div>

        <AuthPromptDialog
          open={noteDialogOpen}
          title="Add note"
          description={`Add a note to ${a.clientName}'s authorization activity timeline.`}
          label="Note"
          multiline
          placeholder="What happened? Who did what?"
          submitLabel="Add note"
          pending={actions.pending}
          onCancel={() => setNoteDialogOpen(false)}
          onSubmit={async (val) => {
            await actions.addNote(overlay, val).catch(() => undefined);
            setNoteDialogOpen(false);
          }}
        />

        <div className="p-6 space-y-7">
          {/* 1 — Auth summary */}
          <DrawerSection title="Authorization Summary">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <KV label="Auth ID" value={a.id} />
              <KV label="Client" value={a.clientName} />
              <KV label="Payer" value={a.payor} />
              <KV label="State" value={a.state} />
              <KV label="Authorization Type" value={a.authType} />
              <KV label="Request Type" value={e.requestType} />
              <KV label="Hours" value={a.hours ?? "—"} />
              <KV label="Submitted" value={a.submittedDate ?? "—"} />
              <KV label="Approved" value={a.approvedDate ?? "—"} />
              <KV label="Expiration" value={a.expirationDate ?? "—"} />
              <KV label="Coordinator" value={a.coordinator} />
              <KV label="BCBA" value={e.bcba} />
              <KV label="QA Reviewer" value={a.qaOwner ?? "—"} />
              <KV label="State Director" value="—" />
            </div>
          </DrawerSection>

          {/* 2 — Timeline */}
          <DrawerSection title="Authorization Timeline">
            <ol className="relative border-l border-border/70 ml-2 space-y-3">
              {a.timeline.map((t) => (
                <li key={t.id} className="pl-4 relative">
                  <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                  <p className="text-xs">{t.description}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {relTime(t.timestamp)} · {t.user ?? "System"}
                  </p>
                </li>
              ))}
            </ol>
          </DrawerSection>

          {/* 3 — PR Tracking */}
          <DrawerSection title="PR Tracking" icon={UserCog}>
            <PRTracking a={e} />
          </DrawerSection>

          {/* 4 — QA Coordination */}
          <DrawerSection title="QA Coordination" icon={FileCheck2}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <KV label="Treatment plan" value={a.treatmentPlanReceived ? "Received" : "Missing"} />
              <KV label="QA Reviewer" value={a.qaOwner ?? "—"} />
              <KV label="QA Status" value={a.qaStatus} />
              <KV label="Ready to submit" value={!a.missingInfo && a.treatmentPlanReceived ? "Yes" : "No"} />
            </div>
            {a.qaNotes && (
              <p className="mt-3 text-xs text-muted-foreground rounded-xl bg-muted/60 px-3 py-2">{a.qaNotes}</p>
            )}
          </DrawerSection>

          {/* 5 — Missing documentation */}
          {(a.missingRequirements.length > 0 || !a.treatmentPlanReceived || a.missingInfo) && (
            <DrawerSection title="Missing Documentation" icon={ShieldAlert}>
              <ul className="space-y-1.5">
                {!a.treatmentPlanReceived && <MissingItem label="Treatment Plan" owner="BCBA" next="Request from BCBA" />}
                {a.missingRequirements.map((m) => (
                  <MissingItem key={m} label={m} owner="Authorization Coordinator" next="Resolve before submission" />
                ))}
                {a.documents.filter(d => d.required && !d.received).map((d) => (
                  <MissingItem key={d.name} label={d.name} owner="Intake" next="Collect from family" />
                ))}
              </ul>
            </DrawerSection>
          )}

          {/* 6 — Operational notes */}
          <DrawerSection title="Operational Notes">
            <ul className="space-y-2">
              {a.automationLog.slice(0, 5).map((log, i) => (
                <li key={i} className="text-xs flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                  <span className="text-muted-foreground">{log}</span>
                </li>
              ))}
            </ul>
          </DrawerSection>

          {/* 7 — Operational Insights */}
          <DrawerSection title="Operational Insights" icon={Sparkles}>
            <AskBlossomAuthPanel a={e} />
          </DrawerSection>
        </div>
      </aside>
    </div>
  );
}

/* PR escalation logic — GA vs multi-state */
function PRTracking({ a }: { a: EnrichedAuth }) {
  const weeksSincePR = Math.floor(a.lastPRDays / 7);
  const isGA = a.state === "GA";

  const milestones = isGA
    ? [
        { week: 9, owner: "GA Outreach Owner", action: "Begins parent outreach", hit: weeksSincePR >= 9 },
        { week: 6, owner: "GA State Director", action: "Looped in for SD escalation", hit: weeksSincePR >= (9 + 6) },
        { week: 0, owner: "QA", action: "Ready for QA submission", hit: a.treatmentPlanReceived },
      ]
    : [
        { week: 9, owner: "Multi-state Outreach Owner", action: "Weekly outreach begins", hit: weeksSincePR >= 9 },
        { week: 8, owner: "State Director", action: "CC'd on weekly outreach", hit: weeksSincePR >= 9 },
        { week: 6, owner: "State Director", action: "Escalation activated", hit: weeksSincePR >= (9 + 3) },
        { week: 0, owner: "QA", action: "Ready for QA submission", hit: a.treatmentPlanReceived },
      ];

  return (
    <>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-3">
        <KV label="Last PR received" value={`${a.lastPRDays}d ago`} />
        <KV label="Weeks since PR" value={`${weeksSincePR}w`} />
        <KV label="Outreach owner" value={isGA ? "GA outreach owner" : "Multi-state outreach owner"} />
        <KV label="SD escalation" value="State Director" />
      </div>
      <ol className="relative border-l border-border/70 ml-2 space-y-2.5">
        {milestones.map((m, i) => (
          <li key={i} className="pl-4 relative">
            <span className={cn("absolute -left-[5px] top-1.5 h-2 w-2 rounded-full",
              m.hit ? "bg-emerald-500" : "bg-muted-foreground/30")} />
            <p className="text-xs">
              <span className="font-medium">{m.owner}</span>
              <span className="text-muted-foreground"> · {m.action}</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {m.hit ? "Triggered" : "Pending"}
            </p>
          </li>
        ))}
      </ol>
    </>
  );
}

function MissingItem({ label, owner, next }: { label: string; owner: string; next: string }) {
  return (
    <li className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2.5 flex items-start gap-2.5">
      <FileWarning className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Owner: <span className="text-foreground/70">{owner}</span> · Next: {next}
        </p>
      </div>
    </li>
  );
}

function DrawerSection({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-1.5 mb-3">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{title}</p>
      </div>
      {children}
    </section>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-xs">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">{label}</p>
      <p className="text-foreground mt-0.5 truncate">{value}</p>
    </div>
  );
}

/* ------------------------------ Insights — drawer panel ------------------------------ */
type PromptKey = "blockers" | "next" | "missing" | "summary";

const PROMPT_CATALOG: { key: PromptKey; label: string; icon: any }[] = [
  { key: "blockers", label: "Summarize blockers and risks", icon: ShieldAlert },
  { key: "next", label: "What are the next steps?", icon: ArrowUpRight },
  { key: "missing", label: "What documentation is missing?", icon: FileWarning },
  { key: "summary", label: "Give me a 30-second summary", icon: Sparkles },
];

function buildAnswer(a: EnrichedAuth, key: PromptKey): { headline: string; bullets: string[]; nextAction?: string } {
  const exp = a.daysToExpire;
  const isGA = a.state === "GA";
  const sd = "State Director";
  const outreach = isGA ? "GA outreach owner" : "Multi-state outreach owner";
  const lastEvent = a.timeline[a.timeline.length - 1];
  const missingDocs = [
    !a.treatmentPlanReceived && "Treatment plan",
    ...a.missingRequirements,
    ...a.documents.filter(d => d.required && !d.received).map(d => d.name),
  ].filter(Boolean) as string[];

  if (key === "blockers") {
    const bullets: string[] = [];
    if (a.missingInfo || missingDocs.length) bullets.push(`Documentation gap — ${missingDocs.length} item${missingDocs.length === 1 ? "" : "s"} outstanding (${missingDocs.slice(0, 3).join(", ") || "see missing docs"}).`);
    if (exp !== null && exp < 15) bullets.push(`Expiration risk — ${exp} day${exp === 1 ? "" : "s"} until expiration on ${a.expirationDate}.`);
    else if (exp !== null && exp < 45) bullets.push(`Expiring soon — ${exp} days out, inside the 45-day window.`);
    if (a.lastPRDays > 45) bullets.push(`PR overdue ${a.lastPRDays} days — escalation to ${sd} required.`);
    else if (a.lastPRDays > 30) bullets.push(`PR aging at ${a.lastPRDays} days — ${outreach} should begin outreach.`);
    if (a.stage === "In QA Review" && a.daysInStage >= 3) bullets.push(`Stuck in QA for ${a.daysInStage} days — ${a.qaOwner ?? "QA owner"} needs nudge.`);
    if (a.stage === "Awaiting Submission" && a.daysInStage >= 2) bullets.push(`Awaiting submission for ${a.daysInStage} days — coordinator ${a.coordinator} to submit.`);
    if (a.stage === "Denied") bullets.push(`Denied — payer review and appeal path required.`);
    if (a.supervisionPct < 70) bullets.push(`Supervision at ${a.supervisionPct}% — below 70% threshold, BCBA ${a.bcba} follow-up needed.`);
    if (bullets.length === 0) bullets.push("No active blockers detected. Record is operationally clear.");
    return {
      headline: `Risk: ${a.urgency.toUpperCase()} · ${bullets.length} blocker${bullets.length === 1 ? "" : "s"}`,
      bullets,
      nextAction: a.primaryBlocker ?? undefined,
    };
  }

  if (key === "next") {
    const steps: string[] = [];
    if (!a.treatmentPlanReceived) steps.push(`Request treatment plan from ${a.bcba}.`);
    if (missingDocs.length) steps.push(`Collect ${missingDocs.length} missing document${missingDocs.length === 1 ? "" : "s"} (${missingDocs.slice(0, 2).join(", ")}${missingDocs.length > 2 ? "…" : ""}).`);
    if (a.lastPRDays > 45) steps.push(`Escalate to ${sd} — PR ${a.lastPRDays} days overdue.`);
    else if (a.lastPRDays > 30) steps.push(`${outreach} begins parent outreach for PR.`);
    if (a.stage === "In QA Review") steps.push(`Follow up with ${a.qaOwner ?? "QA"} on review completion.`);
    if (a.stage === "Awaiting Submission" && !a.missingInfo && a.treatmentPlanReceived) steps.push(`Submit to ${a.payor} — record is ready.`);
    if (exp !== null && exp < 30 && a.stage !== "Approved") steps.push(`Prioritize ${a.payor} submission — ${exp} days until expiration.`);
    if (a.stage === "Denied") steps.push(`Open appeal workflow with ${a.payor}; loop in ${sd}.`);
    if (steps.length === 0) steps.push(`Monitor; no operational action required this week.`);
    return {
      headline: `${steps.length} recommended step${steps.length === 1 ? "" : "s"}`,
      bullets: steps,
      nextAction: steps[0],
    };
  }

  if (key === "missing") {
    if (missingDocs.length === 0) {
      return { headline: "All required documentation received.", bullets: ["Treatment plan: received.", "All required intake documents: received.", "No outstanding requirements logged."] };
    }
    const bullets = missingDocs.map((d) => {
      if (d === "Treatment plan") return `${d} — owner: ${a.bcba} (BCBA).`;
      if (a.missingRequirements.includes(d)) return `${d} — owner: ${a.coordinator} (Coordinator).`;
      return `${d} — owner: Intake team (collect from family).`;
    });
    return {
      headline: `${missingDocs.length} document${missingDocs.length === 1 ? "" : "s"} outstanding`,
      bullets,
      nextAction: `Request "${missingDocs[0]}" first.`,
    };
  }

  // summary
  const bullets = [
    `${a.clientName} · ${a.authType} authorization with ${a.payor} (${a.state}).`,
    `Stage: ${a.stage} for ${a.daysInStage} day${a.daysInStage === 1 ? "" : "s"}.`,
    exp !== null ? `Expires ${a.expirationDate} (${exp}d).` : `No expiration on record.`,
    `PR ${a.lastPRDays}d ago · Supervision ${a.supervisionPct}%.`,
    lastEvent ? `Last activity: ${lastEvent.description} (${relTime(lastEvent.timestamp)}).` : `No timeline activity logged.`,
    missingDocs.length ? `${missingDocs.length} missing doc${missingDocs.length === 1 ? "" : "s"}.` : `Documentation complete.`,
  ];
  return {
    headline: `${a.urgency.toUpperCase()} risk · ${a.primaryBlocker ?? "No active blocker"}`,
    bullets,
  };
}

function AskBlossomAuthPanel({ a }: { a: EnrichedAuth }) {
  const [active, setActive] = useState<PromptKey | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset when switching records
  useEffect(() => { setActive(null); setLoading(false); }, [a.id]);

  const answer = useMemo(() => (active ? buildAnswer(a, active) : null), [a, active]);

  const run = (key: PromptKey) => {
    setActive(key);
    setLoading(true);
    // Simulate brief assistant thinking for premium feel
    window.setTimeout(() => setLoading(false), 320);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {PROMPT_CATALOG.map((p) => {
          const isActive = active === p.key;
          return (
            <button
              key={p.key}
              onClick={() => run(p.key)}
              className={cn(
                "text-left rounded-xl border px-3 py-2 text-xs transition flex items-center justify-between gap-2",
                isActive
                  ? "border-primary/40 bg-primary/5 text-foreground"
                  : "border-border/60 bg-muted/40 hover:bg-muted text-foreground/80",
              )}
            >
              <span className="flex items-center gap-2">
                <p.icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                {p.label}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      {active && (
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.04] via-card to-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="grid place-items-center h-6 w-6 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-3 w-3" />
            </div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Blossom AI</p>
            {loading && (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" />
                analyzing record…
              </span>
            )}
          </div>

          {loading || !answer ? (
            <div className="space-y-2">
              <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
              <div className="h-2.5 w-full rounded bg-muted/70 animate-pulse" />
              <div className="h-2.5 w-5/6 rounded bg-muted/70 animate-pulse" />
              <div className="h-2.5 w-3/4 rounded bg-muted/70 animate-pulse" />
            </div>
          ) : (
            <>
              <p className="text-xs font-medium text-foreground mb-2">{answer.headline}</p>
              <ul className="space-y-1.5">
                {answer.bullets.map((b, i) => (
                  <li key={i} className="text-xs text-foreground/85 flex gap-2 leading-relaxed">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-primary/70 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {answer.nextAction && (
                <div className="mt-3 rounded-lg border border-primary/20 bg-primary/[0.06] px-2.5 py-2 text-[11px] text-foreground/80 flex items-start gap-2">
                  <ArrowUpRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                  <span><span className="text-muted-foreground">Suggested next action — </span>{answer.nextAction}</span>
                </div>
              )}
              <p className="mt-3 text-[10px] text-muted-foreground/70">
                Derived from this record's timeline, stage, PR cadence, supervision %, and documentation status. AI assists — coordinator confirms.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ AI rail ------------------------------ */
function AskBlossomAuthRail({ auths, onOpen }: { auths: EnrichedAuth[]; onOpen: (id: string) => void }) {
  const priorities = useMemo(() => auths
    .filter(a => a.urgency === "high")
    .sort((x, y) => (x.daysToExpire ?? 999) - (y.daysToExpire ?? 999))
    .slice(0, 5), [auths]);

  const insights = useMemo(() => {
    const expiring = auths.filter(a => a.daysToExpire !== null && a.daysToExpire >= 0 && a.daysToExpire < 30).length;
    const prOverdue = auths.filter(a => a.lastPRDays > 45).length;
    const blocked = auths.filter(a => a.missingInfo).length;
    return [
      expiring > 0 && { icon: CalendarClock, text: `${expiring} auth${expiring === 1 ? "" : "s"} expiring within 30 days.` },
      prOverdue > 0 && { icon: UserCog, text: `${prOverdue} PR${prOverdue === 1 ? "" : "s"} overdue 45 days or more.` },
      blocked > 0 && { icon: ShieldAlert, text: `${blocked} record${blocked === 1 ? "" : "s"} blocked on missing documentation.` },
    ].filter(Boolean) as { icon: any; text: string }[];
  }, [auths]);

  const prompts = [
    "Which auths are at risk this week?",
    "Show me PRs overdue 45+ days",
    "Which records are missing documentation?",
    "Summarize expiring authorizations by state",
    "Who needs State Director escalation?",
  ];

  return (
    <div className="p-5 space-y-6">
      <div className="flex items-center gap-2">
        <div className="grid place-items-center h-8 w-8 rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium">Insights</p>
          <p className="text-[11px] text-muted-foreground">Authorization records assistant</p>
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Try asking</p>
        <div className="space-y-1.5">
          {prompts.map((p) => (
            <button key={p} onClick={() => toast(`"${p}" — assistant coming soon`)}
              className="w-full text-left text-[12px] px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition">
              {p}
            </button>
          ))}
        </div>
      </div>

      {insights.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <Wand2 className="h-3 w-3" /> Insights
          </p>
          <div className="space-y-2">
            {insights.map((i) => (
              <div key={i.text} className="rounded-xl border border-border/60 bg-card p-3 flex gap-2.5">
                <i.icon className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                <p className="text-xs leading-snug">{i.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Priority records</p>
        {priorities.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing urgent in this view.</p>
        ) : (
          <div className="space-y-1">
            {priorities.map((a, i) => (
              <button key={a.id} onClick={() => onOpen(a.id)}
                className="w-full text-left rounded-xl p-2.5 hover:bg-muted transition flex items-center gap-2.5">
                <span className="grid place-items-center h-6 w-6 rounded-full bg-muted text-[11px] font-medium shrink-0">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{a.clientName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {a.primaryBlocker} · {a.daysToExpire !== null ? `${a.daysToExpire}d` : a.stage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-border/60">
        <Link to="/clients" className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <Users className="h-3 w-3" /> Open client directory
        </Link>
      </div>
    </div>
  );
}
