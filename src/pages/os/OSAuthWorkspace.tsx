import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import type { Authorization } from "@/data/authorizations";
import {
  Search, Bell, Sparkles, Plus, ChevronRight, X, Inbox, CalendarClock,
  FileText, ClipboardCheck, FileWarning, ShieldAlert, AlertTriangle,
  CheckCircle2, Send, FileSignature, Flame, Brain, MapPin, ListFilter,
  Stamp, ArrowUpRight, BadgeCheck, BookOpen, Activity, UserCog, MessageSquare,
  Star, Eye, Users, Workflow, RefreshCw,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  NewAuthorizationDialog,
  SavedViewsMenu,
  SourceBadge,
  type AuthSourceTag,
} from "@/components/authorizations/AuthorizationActionUI";
import { AuthPromptDialog } from "@/components/authorizations/AuthPromptDialog";
import {
  useAuthorizationActions,
  type EnsureOverlayInput,
} from "@/hooks/useAuthorizationActions";
import type { SavedView } from "@/hooks/useAuthorizationSavedViews";

/* ─────────── tone palette (calm, restrained) ─────────── */

type Tone = "ok" | "info" | "warn" | "crit" | "neutral";

const toneChip: Record<Tone, string> = {
  ok:      "bg-[hsl(150_60%_94%)] text-[hsl(155_50%_32%)]",
  info:    "bg-[hsl(220_80%_96%)] text-[hsl(220_60%_42%)]",
  warn:    "bg-[hsl(38_100%_94%)] text-[hsl(30_75%_40%)]",
  crit:    "bg-[hsl(355_90%_96%)] text-[hsl(355_65%_48%)]",
  neutral: "bg-foreground/[0.05] text-foreground/65",
};
const toneDot: Record<Tone, string> = {
  ok:      "bg-[hsl(155_55%_48%)]",
  info:    "bg-[hsl(220_70%_55%)]",
  warn:    "bg-[hsl(35_85%_52%)]",
  crit:    "bg-[hsl(355_70%_55%)]",
  neutral: "bg-foreground/30",
};
const toneAccentBar: Record<Tone, string> = {
  ok:      "bg-[hsl(155_55%_48%)]",
  info:    "bg-[hsl(220_70%_55%)]",
  warn:    "bg-[hsl(35_85%_52%)]",
  crit:    "bg-[hsl(355_70%_55%)]",
  neutral: "bg-foreground/15",
};

/* ─────────── queue model ─────────── */

type QueueKey =
  | "all" | "attention" | "due_today" | "expiring" | "awaiting" | "pr" | "qa_ready"
  | "missing" | "denied" | "recent"
  | "initial" | "treatment" | "reassessment" | "pt97156" | "secondary" | "multipayor"
  | "esc_sd" | "esc_bcba" | "esc_qa" | "parent_sig" | "high_risk"
  | "ga" | "nc" | "tn" | "va" | "md"
  | "mine" | "unassigned" | "viewed" | "following";

type QueueGroup = { title: string; items: { key: QueueKey; label: string; count: number; tone?: Tone }[] };

const QUEUE_GROUPS: QueueGroup[] = [
  {
    title: "Today",
    items: [
      { key: "attention",  label: "Needs Attention",       count: 9, tone: "crit" },
      { key: "due_today",  label: "Due Today",             count: 6, tone: "warn" },
      { key: "expiring",   label: "Expiring Soon",         count: 6, tone: "crit" },
      { key: "awaiting",   label: "Awaiting Submission",   count: 7, tone: "info" },
      { key: "pr",         label: "PR Follow-Up",          count: 8, tone: "warn" },
      { key: "qa_ready",   label: "QA Ready",              count: 3, tone: "ok" },
      { key: "missing",    label: "Missing Documentation", count: 4, tone: "warn" },
      { key: "denied",     label: "Denials",               count: 3, tone: "warn" },
      { key: "recent",     label: "Recently Updated",      count: 12 },
    ],
  },
  {
    title: "Workflow",
    items: [
      { key: "initial",      label: "Initial Authorizations", count: 5 },
      { key: "treatment",    label: "Treatment Authorizations", count: 18 },
      { key: "reassessment", label: "Reassessments",         count: 7 },
      { key: "pt97156",      label: "Parent Training 97156",  count: 4 },
      { key: "secondary",    label: "Secondary Insurance",    count: 3 },
      { key: "multipayor",   label: "Multi-Payor Cases",      count: 2 },
    ],
  },
  {
    title: "Escalations",
    items: [
      { key: "esc_sd",     label: "Needs State Director",  count: 2, tone: "crit" },
      { key: "esc_bcba",   label: "Needs BCBA",            count: 3, tone: "warn" },
      { key: "esc_qa",     label: "Needs QA",              count: 2, tone: "warn" },
      { key: "parent_sig", label: "Parent Signature Needed", count: 2, tone: "warn" },
      { key: "high_risk",  label: "High Operational Risk", count: 4, tone: "crit" },
    ],
  },
  {
    title: "States",
    items: [
      { key: "ga", label: "Georgia",        count: 14 },
      { key: "nc", label: "North Carolina", count: 11 },
      { key: "tn", label: "Tennessee",      count: 6 },
      { key: "va", label: "Virginia",       count: 5 },
      { key: "md", label: "Maryland",       count: 3 },
    ],
  },
  {
    title: "My Work",
    items: [
      { key: "mine",       label: "Assigned to Me",   count: 18 },
      { key: "unassigned", label: "Unassigned",       count: 2, tone: "warn" },
      { key: "viewed",     label: "Recently Viewed",  count: 5 },
      { key: "following",  label: "Following",        count: 3 },
    ],
  },
];

/* ─────────── authorization model ─────────── */

type AuthState = "awaiting" | "expiring" | "denied" | "missing" | "qa" | "approved";
type AuthCard = {
  id: string;
  client: string;
  state: "GA" | "NC" | "VA" | "TN" | "MD" | "NJ";
  payer: string;
  authType: "Initial Auth" | "Treatment Auth" | "Reassessment" | "Parent Training 97156";
  requestType: string;
  coordinator: string;
  bcba: string;
  status: string;
  stateTone: AuthState;
  risk: Tone;
  expiresInDays: number | null;
  prStatus: { label: string; tone: Tone };
  qaStatus: { label: string; tone: Tone };
  missingDocs: string[];
  parentSig: "Signed" | "Pending" | "Not required";
  treatmentPlan: { label: string; tone: Tone };
  lastActivity: string;
  queues: QueueKey[];
  source?: AuthSourceTag;
  mondayItemId?: string | null;
  expirationISO?: string | null;
};

/* ─────────── live ↔ card mapping ─────────── */

function daysUntilISO(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((t - Date.now()) / 86_400_000);
}

function liveAuthToCard(a: Authorization): AuthCard {
  const expiresInDays = daysUntilISO(a.expirationDate);
  const stateTone: AuthState =
    a.stage === "Approved" ? "approved"
    : a.stage === "Denied" ? "denied"
    : a.stage === "Expiring Soon" ? "expiring"
    : a.stage === "In QA Review" ? "qa"
    : a.missingInfo ? "missing"
    : "awaiting";

  const risk: Tone = a.riskLevel === "High" ? "crit" : a.riskLevel === "Medium" ? "warn" : "info";

  // Snap state to one of the dashboard's known buckets.
  const stateCode = (() => {
    const s = (a.state || "").toUpperCase();
    if (["GA","NC","VA","TN","MD","NJ"].includes(s)) return s as AuthCard["state"];
    return "GA";
  })();

  // Snap auth type into the card's enum.
  const authType: AuthCard["authType"] =
    a.authType === "Initial" ? "Initial Auth"
    : a.authType === "Reauth" ? "Reassessment"
    : "Treatment Auth";

  const queues: QueueKey[] = ["all"];
  if (a.riskLevel === "High") queues.push("attention", "high_risk");
  if (stateTone === "expiring") queues.push("expiring");
  if (stateTone === "awaiting") queues.push("awaiting");
  if (stateTone === "qa") queues.push("qa_ready");
  if (stateTone === "missing") queues.push("missing");
  if (stateTone === "denied") queues.push("denied");
  if (a.missingInfo) queues.push("missing");
  if (a.nextTaskDue) queues.push("due_today");
  if (authType === "Initial Auth") queues.push("initial");
  if (authType === "Treatment Auth") queues.push("treatment");
  if (authType === "Reassessment") queues.push("reassessment");
  if (stateCode === "GA") queues.push("ga");
  if (stateCode === "NC") queues.push("nc");
  if (stateCode === "TN") queues.push("tn");
  if (stateCode === "VA") queues.push("va");
  if (stateCode === "MD") queues.push("md");
  queues.push("recent");
  if (!a.coordinator || a.coordinator === "Unassigned") queues.push("unassigned");

  return {
    id: a.id,
    client: a.clientName,
    state: stateCode,
    payer: a.payor,
    authType,
    requestType: a.nextAction ?? a.stage,
    coordinator: a.coordinator || "Unassigned",
    bcba: a.qaOwner || "—",
    status: a.stage,
    stateTone,
    risk,
    expiresInDays,
    prStatus: a.missingInfo
      ? { label: "PR follow-up needed", tone: "warn" }
      : { label: "PR on track", tone: "ok" },
    qaStatus: a.stage === "In QA Review"
      ? { label: "QA reviewing", tone: "info" }
      : a.stage === "Approved"
        ? { label: "QA complete", tone: "ok" }
        : { label: "Not started", tone: "neutral" },
    missingDocs: a.missingRequirements ?? [],
    parentSig: "Signed",
    treatmentPlan: a.treatmentPlanReceived
      ? { label: "Received", tone: "ok" }
      : { label: "Pending", tone: "warn" },
    lastActivity: a.lastActivity ? `Updated · ${new Date(a.lastActivity).toLocaleDateString()}` : "—",
    queues,
    source: "monday",
    mondayItemId: a.id,
    expirationISO: a.expirationDate ?? null,
  };
}

/* ─────────── small ui atoms ─────────── */

function CountPill({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums", toneChip[tone])}>
      {children}
    </span>
  );
}

function StatusChip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", toneChip[tone])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", toneDot[tone])} />
      {children}
    </span>
  );
}

/* ─────────── page ─────────── */

export default function OSAuthWorkspace() {
  const [activeQueue, setActiveQueue] = useState<QueueKey>("attention");
  const [openId, setOpenId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [newAuthOpen, setNewAuthOpen] = useState(false);
  const actions = useAuthorizationActions();

  const live = useLiveAuthorizations();
  const { items: liveItems, loading, error, refresh } = live;

  // Live recent activity for the right rail.
  type RailActivity = { id: string; who: string; what: string; when: string };
  const [liveActivityForRail, setLiveActivityForRail] = useState<RailActivity[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("authorization_activity")
        .select("id, activity_type, title, body, created_at, created_by")
        .order("created_at", { ascending: false })
        .limit(8);
      if (cancelled || !data) return;
      setLiveActivityForRail(
        data.map((row) => ({
          id: row.id,
          who: prettyActivityType(row.activity_type),
          what: row.title ?? row.body ?? "",
          when: relTimeShort(row.created_at),
        })),
      );
    })();
    return () => { cancelled = true; };
  }, [liveItems.length]);

  // Prompt-dialog state (replaces window.prompt)
  const [promptKind, setPromptKind] = useState<null | "assign" | "status" | "note">(null);
  const [noteForId, setNoteForId] = useState<string | null>(null);

  const AUTHS: AuthCard[] = useMemo(() => {
    if (loading || error) return [];
    // No fallback demo data — show empty state instead.
    return liveItems.map(liveAuthToCard);
  }, [liveItems, loading, error]);

  // Dynamic queue counts based on live data.
  const liveQueueGroups: QueueGroup[] = useMemo(() => {
    return QUEUE_GROUPS.map((g) => ({
      ...g,
      items: g.items.map((q) => ({
        ...q,
        count: q.key === "all" ? AUTHS.length : AUTHS.filter((a) => a.queues.includes(q.key)).length,
      })),
    }));
  }, [AUTHS]);

  const activeMeta = useMemo(() => {
    for (const g of liveQueueGroups) {
      const found = g.items.find((i) => i.key === activeQueue);
      if (found) return { group: g.title, ...found };
    }
    return { group: "Today", key: activeQueue, label: "All", count: AUTHS.length };
  }, [activeQueue, liveQueueGroups, AUTHS.length]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return AUTHS.filter((a) => {
      if (activeQueue !== "all" && !a.queues.includes(activeQueue)) return false;
      if (!q) return true;
      return [a.client, a.payer, a.id, a.bcba, a.coordinator, a.state, a.authType]
        .some((s) => s.toLowerCase().includes(q));
    });
  }, [activeQueue, search, AUTHS]);

  const openAuth = visible.find((a) => a.id === openId) ?? null;

  const toggleSel = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const buildOverlay = (a: AuthCard): EnsureOverlayInput => ({
    source_system: (a.source === "monday" || a.source === "manual" || a.source === "centralreach") ? a.source : "manual",
    monday_item_id: a.mondayItemId ?? null,
    source_id: a.id,
    client_name: a.client,
    state: a.state,
    payer: a.payer,
    auth_type: a.authType,
    status: a.status,
    workflow_stage: a.status,
    assigned_owner: a.coordinator,
    assigned_bcba: a.bcba,
    expiration_date: a.expirationISO ?? null,
  });

  const selectedAuths = visible.filter((a) => selected.has(a.id));

  const handleBulk = async (kind: "assign" | "status" | "escalate" | "qa" | "followup" | "request_docs") => {
    if (!selectedAuths.length) return;
    const overlays = selectedAuths.map(buildOverlay);
    try {
      if (kind === "assign") {
        setPromptKind("assign");
        return;
      } else if (kind === "status") {
        setPromptKind("status");
        return;
      } else if (kind === "escalate") {
        for (const o of overlays) await actions.escalate(o);
      } else if (kind === "qa") {
        for (const o of overlays) await actions.sendToQA(o);
      } else if (kind === "followup") {
        for (const o of overlays) await actions.requestPR(o, { dueInDays: 2 });
      } else if (kind === "request_docs") {
        for (const o of overlays) await actions.addNote(o, "Documentation request sent to BCBA.");
      }
      setSelected(new Set());
    } catch { /* hook surfaces toast */ }
  };

  const applySavedView = (v: SavedView) => {
    const cfg = v.config as { activeQueue?: QueueKey; search?: string };
    if (cfg.activeQueue) setActiveQueue(cfg.activeQueue);
    if (typeof cfg.search === "string") setSearch(cfg.search);
    setSelected(new Set());
  };

  return (
    <OSShell
      rightRail={
        <RightContextPanel
          queueLabel={activeMeta.label}
          auths={AUTHS}
          activity={liveActivityForRail}
        />
      }
    >
      {/* HEADER */}
      <header className="os-rise flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-muted-foreground backdrop-blur">
            <Stamp className="h-3 w-3 text-[hsl(265_70%_55%)]" /> Authorization Workspace
          </div>
          <h1 className="mt-2 text-[24px] font-semibold tracking-tight md:text-[28px]">Authorization Workspace</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Manage authorization progression, PR coordination, expiration readiness, and operational blockers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search client, payer, auth ID…"
              className="h-9 w-[260px] rounded-xl border border-white/70 bg-white/70 pl-8 pr-3 text-[12.5px] backdrop-blur transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[hsl(265_70%_55%/0.4)]"
            />
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-xl border border-white/70 bg-white/70 text-muted-foreground transition hover:text-foreground" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </button>
          <SavedViewsMenu
            scope="auth_workspace"
            currentConfig={{ activeQueue, search }}
            onApply={applySavedView}
          />
          <button className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/70 bg-white/70 px-3 text-[12.5px] font-semibold text-foreground/85 transition hover:text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" /> Operational Insights
          </button>
          <button
            onClick={() => setNewAuthOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[hsl(265_85%_62%)] to-[hsl(285_85%_68%)] px-3 text-[12.5px] font-semibold text-white shadow-[0_10px_24px_-14px_hsl(265_85%_55%/0.5)] transition hover:opacity-95"
          >
            <Plus className="h-3.5 w-3.5" /> New Authorization
          </button>
        </div>
      </header>

      {/* live data status banner */}
      {(loading || error || (!liveItems.length && !loading)) && (
        <div className={cn(
          "os-card flex items-center justify-between gap-3 p-3 text-[12px]",
          error ? "border-rose-200 bg-rose-50/70 text-rose-700" :
          loading ? "text-muted-foreground" :
          "text-muted-foreground",
        )}>
          <span>
            {error ? `Live data error: ${error}` :
             loading ? "Loading live authorizations…" :
             "No imported authorizations yet — showing sample queue layout."}
          </span>
          <Link to="/authorizations" className="font-semibold hover:underline">
            Open Authorizations workspace →
          </Link>
        </div>
      )}

      {/* THREE-ZONE LAYOUT */}
      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* LEFT — operational queues */}
        <aside className="os-card max-h-[calc(100vh-220px)] overflow-y-auto p-3 lg:sticky lg:top-4">
          <nav className="space-y-4">
            {liveQueueGroups.map((group) => (
              <div key={group.title}>
                <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((q) => {
                    const active = activeQueue === q.key;
                    return (
                      <li key={q.key}>
                        <button
                          onClick={() => { setActiveQueue(q.key); setSelected(new Set()); }}
                          className={cn(
                            "group flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left transition",
                            active
                              ? "bg-gradient-to-r from-[hsl(265_100%_96%)] to-[hsl(220_100%_97%)] text-foreground shadow-[inset_0_0_0_1px_hsl(265_85%_85%/0.7)]"
                              : "text-foreground/75 hover:bg-foreground/[0.04] hover:text-foreground"
                          )}
                        >
                          <span className={cn("flex items-center gap-2 text-[12.5px] font-medium", active && "font-semibold")}>
                            {q.tone && <span className={cn("h-1.5 w-1.5 rounded-full", toneDot[q.tone])} />}
                            <span className="truncate">{q.label}</span>
                          </span>
                          <CountPill tone={active ? "info" : (q.tone ?? "neutral")}>{q.count}</CountPill>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* CENTER — active work queue */}
        <section className="min-w-0 space-y-3">
          {/* Queue header + toolbar */}
          <div className="os-card flex flex-wrap items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{activeMeta.group}</p>
              <h2 className="text-[16px] font-semibold tracking-tight">{activeMeta.label}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterChip icon={MapPin}        label="State" />
              <FilterChip icon={AlertTriangle} label="Risk" />
              <FilterChip icon={CalendarClock} label="Expiring" />
              <FilterChip icon={FileText}      label="PR" />
              <FilterChip icon={ClipboardCheck}label="QA" />
              <FilterChip icon={UserCog}       label="Assigned" />
              <button className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-foreground/[0.05] hover:text-foreground" aria-label="More filters">
                <ListFilter className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Selection toolbar (appears only when items selected) */}
          {selected.size > 0 && (
            <div className="os-card flex flex-wrap items-center justify-between gap-2 border border-[hsl(265_85%_85%/0.7)] bg-gradient-to-r from-[hsl(265_100%_98%)] to-[hsl(220_100%_98%)] p-3">
              <div className="text-[12.5px] font-semibold">
                {selected.size} selected
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <BulkAction icon={UserCog}        label="Assign"          onClick={() => handleBulk("assign")} />
                <BulkAction icon={MessageSquare}  label="Follow-Up"       onClick={() => handleBulk("followup")} />
                <BulkAction icon={Flame}          label="Escalate"        onClick={() => handleBulk("escalate")} />
                <BulkAction icon={FileWarning}    label="Request Docs"    onClick={() => handleBulk("request_docs")} />
                <BulkAction icon={ClipboardCheck} label="Send to QA"      onClick={() => handleBulk("qa")} />
                <BulkAction icon={Workflow}       label="Change Status"   onClick={() => handleBulk("status")} />
                <button
                  onClick={() => setSelected(new Set())}
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-foreground/[0.05] hover:text-foreground"
                  aria-label="Clear selection"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Work cards */}
          {visible.length === 0 ? (
            <EmptyState queue={activeMeta.label} />
          ) : (
            <ul className="space-y-3">
              {visible.map((a) => (
                <AuthWorkCard
                  key={a.id}
                  auth={a}
                  selected={selected.has(a.id)}
                  onToggleSelect={() => toggleSel(a.id)}
                  onOpen={() => setOpenId(a.id)}
                  onAction={(kind) => {
                    const o = buildOverlay(a);
                    if (kind === "submit") return actions.submitAuth(o).catch(() => undefined);
                    if (kind === "request_pr") return actions.requestPR(o, { dueInDays: 3 }).catch(() => undefined);
                    if (kind === "send_qa") return actions.sendToQA(o).catch(() => undefined);
                    if (kind === "escalate") return actions.escalate(o).catch(() => undefined);
                    if (kind === "review_denial") return actions.reviewDenial(o).catch(() => undefined);
                    if (kind === "resolve_docs") return actions.resolveDocs(o).catch(() => undefined);
                    if (kind === "mark_reviewed") return actions.markReviewed(o).catch(() => undefined);
                    if (kind === "note") {
                      setNoteForId(a.id);
                    }
                  }}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* DETAIL DRAWER */}
      <Sheet open={!!openAuth} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-xl">
          {openAuth && (
            <AuthDetailDrawer
              auth={openAuth}
              onAction={(kind) => {
                const o = buildOverlay(openAuth);
                if (kind === "submit") return actions.submitAuth(o).catch(() => undefined);
                if (kind === "request_pr") return actions.requestPR(o, { dueInDays: 3 }).catch(() => undefined);
                if (kind === "send_qa") return actions.sendToQA(o).catch(() => undefined);
                if (kind === "escalate") return actions.escalate(o).catch(() => undefined);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      <NewAuthorizationDialog
        open={newAuthOpen}
        onOpenChange={setNewAuthOpen}
        onCreated={() => { void refresh(); }}
      />

      {/* Bulk Assign prompt */}
      <AuthPromptDialog
        open={promptKind === "assign"}
        title="Bulk assign"
        description={`Assign ${selectedAuths.length} authorization${selectedAuths.length === 1 ? "" : "s"} to a coordinator.`}
        label="Assign to"
        placeholder="e.g. Coordinator name"
        submitLabel="Assign"
        pending={actions.pending}
        onCancel={() => setPromptKind(null)}
        onSubmit={async (val) => {
          await actions.bulkAssign(selectedAuths.map(buildOverlay), val).catch(() => undefined);
          setPromptKind(null);
          setSelected(new Set());
        }}
      />

      {/* Bulk Status prompt */}
      <AuthPromptDialog
        open={promptKind === "status"}
        title="Change status"
        description={`Change status for ${selectedAuths.length} authorization${selectedAuths.length === 1 ? "" : "s"}.`}
        label="New status"
        options={["Awaiting Submission", "Submitted", "In QA Review", "Approved", "Denied", "Expiring Soon", "Denial Review"]}
        submitLabel="Update status"
        pending={actions.pending}
        onCancel={() => setPromptKind(null)}
        onSubmit={async (val) => {
          await actions.bulkChangeStatus(selectedAuths.map(buildOverlay), val).catch(() => undefined);
          setPromptKind(null);
          setSelected(new Set());
        }}
      />

      {/* Add Note prompt */}
      <AuthPromptDialog
        open={!!noteForId}
        title="Add note"
        description="Adds a note to this authorization's activity timeline."
        label="Note"
        multiline
        placeholder="What happened? Who did what?"
        submitLabel="Add note"
        pending={actions.pending}
        onCancel={() => setNoteForId(null)}
        onSubmit={async (val) => {
          const target = visible.find((a) => a.id === noteForId);
          if (target) {
            await actions.addNote(buildOverlay(target), val).catch(() => undefined);
          }
          setNoteForId(null);
        }}
      />
    </OSShell>
  );
}

/* ─────────── center: work card ─────────── */

type CardActionKind =
  | "submit" | "request_pr" | "send_qa" | "escalate"
  | "review_denial" | "resolve_docs" | "mark_reviewed" | "note";

function AuthWorkCard({
  auth, selected, onToggleSelect, onOpen, onAction,
}: {
  auth: AuthCard;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
  onAction?: (kind: CardActionKind) => void;
}) {
  const stateToToneKey: Record<AuthState, Tone> = {
    awaiting: "info", expiring: "crit", denied: "warn",
    missing: "warn", qa: "info", approved: "ok",
  };
  const accent = stateToToneKey[auth.stateTone];

  return (
    <li className={cn(
      "os-rise group relative overflow-hidden rounded-2xl border bg-white/75 backdrop-blur transition",
      selected
        ? "border-[hsl(265_85%_75%)] shadow-[0_0_0_1px_hsl(265_85%_85%/0.8),0_16px_36px_-22px_hsl(265_60%_50%/0.3)]"
        : "border-white/70 shadow-[0_1px_0_hsl(0_0%_100%/0.7)_inset,0_10px_28px_-18px_hsl(220_50%_30%/0.16)] hover:-translate-y-0.5 hover:shadow-[0_1px_0_hsl(0_0%_100%/0.7)_inset,0_18px_38px_-22px_hsl(220_50%_30%/0.22)]"
    )}>
      {/* left accent rail */}
      <span className={cn("absolute inset-y-0 left-0 w-[3px]", toneAccentBar[accent])} />

      <div className="p-4 pl-5">
        {/* TOP */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 h-3.5 w-3.5 rounded border-foreground/30 text-[hsl(265_85%_60%)] focus:ring-[hsl(265_85%_60%/0.4)]"
            aria-label={`Select ${auth.client}`}
          />

          <button onClick={onOpen} className="min-w-0 flex-1 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-[14.5px] font-semibold tracking-tight">{auth.client}</h3>
              <span className="text-[11px] text-muted-foreground">{auth.id}</span>
              <StatusChip tone={accent}>{auth.status}</StatusChip>
              {auth.risk === "crit" && <StatusChip tone="crit">High risk</StatusChip>}
              <SourceBadge source={auth.source ?? "sample"} />
            </div>
            <p className="mt-1 truncate text-[11.5px] text-muted-foreground">
              {auth.state} · {auth.payer} · {auth.authType} · {auth.requestType}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              Coordinator <span className="text-foreground/80">{auth.coordinator}</span> · BCBA <span className="text-foreground/80">{auth.bcba}</span>
            </p>
          </button>

          {auth.expiresInDays !== null && (
            <div className="hidden shrink-0 text-right sm:block">
              <p className={cn("text-[18px] font-semibold tabular-nums leading-none", auth.expiresInDays <= 14 ? "text-[hsl(355_65%_48%)]" : auth.expiresInDays <= 30 ? "text-[hsl(30_75%_40%)]" : "text-foreground/80")}>
                {auth.expiresInDays}d
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">to expire</p>
            </div>
          )}
        </div>

        {/* MIDDLE */}
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11.5px] sm:grid-cols-4">
          <MetaRow label="PR" tone={auth.prStatus.tone}>{auth.prStatus.label}</MetaRow>
          <MetaRow label="QA" tone={auth.qaStatus.tone}>{auth.qaStatus.label}</MetaRow>
          <MetaRow label="Plan" tone={auth.treatmentPlan.tone}>{auth.treatmentPlan.label}</MetaRow>
          <MetaRow label="Signature" tone={auth.parentSig === "Signed" ? "ok" : auth.parentSig === "Pending" ? "warn" : "neutral"}>
            {auth.parentSig}
          </MetaRow>
        </div>

        {auth.missingDocs.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Missing</span>
            {auth.missingDocs.map((d) => (
              <span key={d} className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", toneChip.warn)}>{d}</span>
            ))}
          </div>
        )}

        {/* BOTTOM — actions */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-foreground/[0.06] pt-3">
          <p className="text-[10.5px] text-muted-foreground">{auth.lastActivity}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <CardAction icon={Eye}             label="Open" onClick={onOpen} primary />
            <PrimaryActionFor auth={auth} onOpen={onOpen} onAction={onAction} />
            <CardAction icon={Flame}           label="Escalate" onClick={() => onAction?.("escalate")} />
            <CardAction icon={MessageSquare}   label="Note"     onClick={() => onAction?.("note")} />
          </div>
        </div>
      </div>
    </li>
  );
}

function MetaRow({ label, tone, children }: { label: string; tone: Tone; children: React.ReactNode }) {
  return (
    <div className="min-w-0 flex items-center gap-1.5">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", toneDot[tone])} />
      <span className="truncate">
        <span className="text-muted-foreground">{label} · </span>
        <span className="text-foreground/85">{children}</span>
      </span>
    </div>
  );
}

function PrimaryActionFor({
  auth, onOpen, onAction,
}: { auth: AuthCard; onOpen: () => void; onAction?: (k: CardActionKind) => void }) {
  switch (auth.stateTone) {
    case "awaiting":  return <CardAction icon={Send}            label="Submit"        onClick={() => onAction?.("submit")} />;
    case "expiring":  return <CardAction icon={FileText}        label="Request PR"    onClick={() => onAction?.("request_pr")} />;
    case "denied":    return <CardAction icon={ShieldAlert}     label="Review Denial" onClick={() => onAction?.("review_denial")} />;
    case "missing":   return <CardAction icon={FileWarning}     label="Resolve Docs"  onClick={() => { onAction?.("resolve_docs"); onOpen(); }} />;
    case "qa":        return <CardAction icon={ClipboardCheck}  label="Send to QA"    onClick={() => onAction?.("send_qa")} />;
    case "approved":  return <CardAction icon={CheckCircle2}    label="Mark Reviewed" onClick={() => onAction?.("mark_reviewed")} />;
  }
}

function CardAction({
  icon: Icon, label, onClick, primary,
}: { icon: React.ElementType; label: string; onClick?: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11.5px] font-semibold transition",
        primary
          ? "bg-foreground text-background hover:opacity-90"
          : "border border-white/70 bg-white/70 text-foreground/80 hover:text-foreground"
      )}
    >
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}

function FilterChip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <button className="inline-flex h-7 items-center gap-1 rounded-full border border-white/70 bg-white/70 px-2.5 text-[11px] font-medium text-foreground/75 transition hover:text-foreground">
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}

function BulkAction({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-7 items-center gap-1 rounded-lg border border-white/70 bg-white/80 px-2 text-[11.5px] font-semibold text-foreground/80 transition hover:text-foreground"
    >
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}

function EmptyState({ queue }: { queue: string }) {
  return (
    <div className="os-card flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[hsl(150_60%_94%)] text-[hsl(155_50%_32%)]">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <p className="text-[14px] font-semibold tracking-tight">All clear in “{queue}”</p>
      <p className="text-[12.5px] text-muted-foreground">No authorization work needs attention here right now.</p>
    </div>
  );
}

/* ─────────── right context panel ─────────── */

function RightContextPanel({ queueLabel }: { queueLabel: string }) {
  return (
    <>
      {/* Operational Summary */}
      <section className="os-card">
        <header className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Today</p>
          <h3 className="text-[14px] font-semibold tracking-tight">Operational Summary</h3>
        </header>
        <dl className="grid grid-cols-2 gap-2 text-[12px]">
          <SummaryCell label="Worked today" value="11" tone="info" />
          <SummaryCell label="Overdue"      value="6"  tone="crit" />
          <SummaryCell label="Ready to submit" value="4" tone="ok" />
          <SummaryCell label="PR escalations"  value="2" tone="warn" />
        </dl>
      </section>

      {/* Workflow Guidance */}
      <section className="os-card">
        <header className="mb-2 flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
          <h3 className="text-[14px] font-semibold tracking-tight">Workflow Guidance</h3>
        </header>
        <p className="text-[11px] text-muted-foreground">Context for <span className="text-foreground/80 font-medium">{queueLabel}</span></p>
        <ul className="mt-2.5 space-y-1.5 text-[12px]">
          {[
            "3 auths need PR follow-up before expiration.",
            "2 cases require State Director escalation (≤6 weeks).",
            "1 reassessment is waiting on treatment plan from QA.",
          ].map((g) => (
            <li key={g} className="flex items-start gap-2 rounded-xl border border-white/60 bg-white/60 px-2.5 py-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(35_85%_52%)]" />
              <span className="text-foreground/85">{g}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Operational Insights */}
      <section className="os-card relative overflow-hidden">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.22)] to-transparent blur-2xl" />
        <header className="mb-3 flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
            <Brain className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold tracking-tight">Operational Insights</h3>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Auth operations</p>
          </div>
        </header>
        <div className="rounded-xl border border-white/70 bg-white/70 p-2">
          <input
            placeholder="Ask about an auth, PR risk, or blocker…"
            className="h-8 w-full rounded-lg bg-transparent px-2 text-[12px] placeholder:text-muted-foreground/70 focus:outline-none"
          />
        </div>
        <ul className="mt-2 space-y-1">
          {[
            "Why is this auth at risk?",
            "What's blocking submission?",
            "Summarize today's PR escalations.",
            "What should I work on first?",
          ].map((p) => (
            <li key={p}>
              <button className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] text-foreground/75 transition hover:bg-foreground/[0.04] hover:text-foreground">
                <span className="truncate">{p}</span>
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* SOP / Workflow Reference */}
      <section className="os-card">
        <header className="mb-2 flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
          <h3 className="text-[14px] font-semibold tracking-tight">SOP & Workflows</h3>
        </header>
        <ul className="space-y-1.5">
          {[
            "PR Escalation Process",
            "Missing Documentation Process",
            "QA Submission Process",
            "Reassessment Timing Logic",
          ].map((s) => (
            <li key={s}>
              <a className="flex items-center justify-between gap-2 rounded-xl border border-white/60 bg-white/60 px-3 py-2 text-[12px] text-foreground/85 transition hover:bg-white/80" href="/training">
                <span className="truncate">{s}</span>
                <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Recent Activity */}
      <section className="os-card">
        <header className="mb-2 flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
          <h3 className="text-[14px] font-semibold tracking-tight">Recent Activity</h3>
        </header>
        <ul className="space-y-2.5">
          {[
            { who: "Payer",      what: "approved auth · Sample",         when: "12m" },
            { who: "BCBA",       what: "uploaded PR · Sample",           when: "35m" },
            { who: "QA",         what: "reviewed plan · Sample",         when: "2h" },
            { who: "Payer",      what: "denied auth · Sample",           when: "3h" },
            { who: "Parent",     what: "signed consent · Sample",        when: "4h" },
          ].map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px]">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(220_70%_55%)]" />
              <p className="min-w-0">
                <span className="font-semibold">{a.who}</span>{" "}
                <span className="text-muted-foreground">{a.what}</span>
                <span className="ml-1 text-[10.5px] text-muted-foreground">· {a.when}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function SummaryCell({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <div className="rounded-xl border border-white/60 bg-white/60 px-2.5 py-2">
      <p className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
        <span className={cn("h-1.5 w-1.5 rounded-full", toneDot[tone])} /> {label}
      </p>
      <p className="mt-1 text-[18px] font-semibold tabular-nums leading-none">{value}</p>
    </div>
  );
}

/* ─────────── detail drawer ─────────── */

function AuthDetailDrawer({
  auth,
  onAction,
}: { auth: AuthCard; onAction?: (kind: "submit" | "request_pr" | "send_qa" | "escalate") => void }) {
  const stateToToneKey: Record<AuthState, Tone> = {
    awaiting: "info", expiring: "crit", denied: "warn",
    missing: "warn", qa: "info", approved: "ok",
  };
  const tone = stateToToneKey[auth.stateTone];

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[hsl(220_100%_99%)] via-white to-[hsl(265_100%_99%)]">
      {/* header */}
      <div className="border-b border-foreground/[0.06] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{auth.id}</p>
        <div className="mt-1 flex items-center gap-2">
          <h2 className="truncate text-[20px] font-semibold tracking-tight">{auth.client}</h2>
          <StatusChip tone={tone}>{auth.status}</StatusChip>
        </div>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          {auth.state} · {auth.payer} · {auth.authType} · {auth.requestType}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <DrawerAction icon={Send}            label="Submit"     primary onClick={() => onAction?.("submit")} />
          <DrawerAction icon={FileText}        label="Request PR"         onClick={() => onAction?.("request_pr")} />
          <DrawerAction icon={ClipboardCheck}  label="Send to QA"         onClick={() => onAction?.("send_qa")} />
          <DrawerAction icon={Flame}           label="Escalate"           onClick={() => onAction?.("escalate")} />
          <DrawerAction icon={MessageSquare}   label="Note" />
          <DrawerAction icon={Star}            label="Follow" />
        </div>
      </div>

      {/* sections */}
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {/* Summary */}
        <DrawerSection title="Authorization Summary">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
            <KV label="Payer">{auth.payer}</KV>
            <KV label="Auth type">{auth.authType}</KV>
            <KV label="Request">{auth.requestType}</KV>
            <KV label="Expires in">{auth.expiresInDays !== null ? `${auth.expiresInDays} days` : "—"}</KV>
            <KV label="Coordinator">{auth.coordinator}</KV>
            <KV label="BCBA">{auth.bcba}</KV>
            <KV label="State Director">—</KV>
            <KV label="QA Reviewer">—</KV>
          </div>
        </DrawerSection>

        {/* Timeline */}
        <DrawerSection title="Timeline">
          <ol className="space-y-2">
            {[
              { t: "3d", text: "Authorization created", dot: "info" as Tone },
              { t: "2d", text: "PR requested from BCBA", dot: "warn" as Tone },
              { t: "1d", text: "Escalated to State Director", dot: "crit" as Tone },
              { t: "4h", text: "Parent contacted for signature", dot: "warn" as Tone },
              { t: "2h", text: "Last update from coordinator", dot: "info" as Tone },
            ].map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px]">
                <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", toneDot[e.dot])} />
                <span className="text-foreground/85">{e.text}</span>
                <span className="ml-auto text-[11px] text-muted-foreground">{e.t} ago</span>
              </li>
            ))}
          </ol>
        </DrawerSection>

        {/* Missing Documentation */}
        <DrawerSection title="Missing Documentation">
          {auth.missingDocs.length === 0 ? (
            <p className="text-[12.5px] text-muted-foreground">All required documents on file.</p>
          ) : (
            <ul className="space-y-1.5">
              {auth.missingDocs.map((d) => (
                <li key={d} className="flex items-center justify-between gap-2 rounded-xl border border-white/60 bg-white/60 px-3 py-2 text-[12.5px]">
                  <span className="flex items-center gap-2">
                    <FileWarning className="h-3.5 w-3.5 text-[hsl(30_75%_40%)]" />
                    <span className="font-medium">{d}</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">Owner: {d === "Parent signature" ? "Parent" : "BCBA"}</span>
                </li>
              ))}
            </ul>
          )}
        </DrawerSection>

        {/* PR Tracking */}
        <DrawerSection title="Progress Report Tracking">
          <ul className="space-y-1.5 text-[12.5px]">
            <RowKv label="PR requested">10 days ago</RowKv>
            <RowKv label="PR due">In 4 days</RowKv>
            <RowKv label="BCBA contacted">3 pings · last 4h</RowKv>
            <RowKv label="State Director">—</RowKv>
            <RowKv label="Parent signature">{auth.parentSig}</RowKv>
            <RowKv label="QA review">{auth.qaStatus.label}</RowKv>
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Outreach cadence and escalation owners are configured per state. Update state ownership in admin to populate.
          </p>
        </DrawerSection>

        {/* QA */}
        <DrawerSection title="QA Coordination">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12.5px]">
            <KV label="Treatment plan">{auth.treatmentPlan.label}</KV>
            <KV label="QA reviewer">Rachel</KV>
            <KV label="QA status">{auth.qaStatus.label}</KV>
            <KV label="Ready to submit">{auth.qaStatus.tone === "ok" ? "Yes" : "No"}</KV>
          </div>
        </DrawerSection>

        {/* Notes */}
        <DrawerSection title="Notes & Activity">
          <textarea
            placeholder="Add an internal note…"
            className="h-20 w-full resize-none rounded-xl border border-white/70 bg-white/70 p-2.5 text-[12.5px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-[hsl(265_85%_60%/0.4)]"
          />
          <p className="mt-2 rounded-xl border border-dashed border-white/60 bg-white/40 px-3 py-2 text-[12px] text-muted-foreground">
            Notes will appear here as coordinators add them to this authorization.
          </p>
        </DrawerSection>

        {/* AI */}
        <DrawerSection title="Operational Insights about this authorization">
          <ul className="space-y-1">
            {[
              "Why is this auth at risk?",
              "What is blocking submission?",
              "Summarize this auth.",
              "What should happen next?",
              "What escalation steps are needed?",
            ].map((p) => (
              <li key={p}>
                <button className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/60 bg-white/60 px-3 py-2 text-left text-[12px] text-foreground/85 transition hover:bg-white/80">
                  <span className="truncate">{p}</span>
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </DrawerSection>
      </div>
    </div>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/70 bg-white/70 p-4">
      <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</h4>
      {children}
    </section>
  );
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="truncate text-foreground/90">{children}</p>
    </div>
  );
}

function RowKv({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-xl border border-white/60 bg-white/60 px-3 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground/90">{children}</span>
    </li>
  );
}

function DrawerAction({ icon: Icon, label, primary, onClick }: { icon: React.ElementType; label: string; primary?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-[12px] font-semibold transition",
        primary
          ? "bg-foreground text-background hover:opacity-90"
          : "border border-white/70 bg-white/70 text-foreground/80 hover:text-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
