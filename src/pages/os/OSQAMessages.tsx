import { useMemo, useState } from "react";
import { useSlideout } from "@/hooks/useSlideout";
import { Link } from "react-router-dom";
import {
  Search, Flame, Sparkles, CheckCircle2, Send, ExternalLink, StickyNote,
  Brain, AlertTriangle, ChevronRight, FileText, ShieldAlert,
  X, Clock, Activity, MapPin, UserCheck, ClipboardList,
  Calendar, MessageCircle, Inbox, AtSign, Reply, BellRing,
  Paperclip, MailCheck, ArrowUpRight,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { QAActionsPanel } from "@/components/qa/QAActionsPanel";
import type { Authorization } from "@/data/authorizations";
import { cn } from "@/lib/utils";
import { useQAWorkflow } from "@/hooks/useQAWorkflow";
import { toQAWorkItemRef } from "@/lib/os/qa/qaRefs";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

// QA → Messages & Updates.
// Real data only — operational threads derived from live authorization workflows
// (PR follow-ups, missing info, escalations, treatment plan coordination,
// expiration readiness). No fake conversations.

type Tone = "ok" | "warn" | "crit";
type Category =
  | "qa_update"
  | "bcba_followup"
  | "pr_workflow"
  | "escalation"
  | "missing_info"
  | "auth_review"
  | "notification";

type TabKey = "all" | "unread" | "followup" | "escalation" | "pr" | "missing" | "notifications";

const QA_TEAM = [
  "Rochel Walzman", "Amanda Avalos", "Julianne Rodriguez", "Anje Grobler", "Raizy Folger",
];

const PR_KW = /progress report|\bpr\b/i;
const TP_KW = /treatment plan|\btp\b/i;
const SIG_KW = /sign|signature|consent/i;

function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86_400_000);
}
function toneClasses(t: Tone) {
  switch (t) {
    case "crit": return "bg-destructive/10 text-destructive border-destructive/20";
    case "warn": return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    default:    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  }
}
function outreachOwner(state: string, weeksOut: number | null): string {
  if (weeksOut === null) return state === "GA" ? "Rivky Weissman" : "Rikki Wallach";
  const ga = state === "GA";
  if (weeksOut <= 6) return ga ? "Shira + Rachel (SD)" : "SD escalation";
  if (weeksOut <= 9) return ga ? "Rivky Weissman" : "Rikki Wallach";
  return ga ? "Rivky Weissman" : "Rikki Wallach";
}
function initials(name: string) {
  return name.split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}
function relTimeFromDays(days: number) {
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  const w = Math.round(days / 7);
  return `${w}w ago`;
}

// ---------- thread derivation ----------

type MessageItem = {
  id: string;
  sender: string;
  role: string;
  body: string;
  daysAgo: number;
  type: "Follow-Up Request" | "Escalation Notice" | "Workflow Update" | "Missing Information Request"
      | "PR Reminder" | "Treatment Plan Coordination" | "Authorization Readiness Update" | "QA Note";
};

type Thread = {
  id: string;
  category: Category;
  subject: string;
  client: string;
  state: string;
  bcba: string;
  qaOwner: string | null;
  auth: Authorization;
  urgency: Tone;
  escalated: boolean;
  unread: boolean;
  daysAgo: number;
  expirationDays: number | null;
  preview: string;
  messages: MessageItem[];
  participants: string[];
  blockerSummary: string;
  needsResponse: boolean;
};

const CATEGORY_LABEL: Record<Category, string> = {
  qa_update: "QA Update",
  bcba_followup: "BCBA Follow-Up",
  pr_workflow: "PR Workflow",
  escalation: "Escalation",
  missing_info: "Missing Information",
  auth_review: "Authorization Review",
  notification: "Workflow Notification",
};

function buildThreads(items: Authorization[]): Thread[] {
  const out: Thread[] = [];
  for (const a of items) {
    if (a.stage === "Flaked Client") continue;

    const expDays = daysUntil(a.expirationDate);
    const hasPR = a.missingRequirements.some(r => PR_KW.test(r));
    const hasTP = a.missingRequirements.some(r => TP_KW.test(r));
    const hasSig = a.missingRequirements.some(r => SIG_KW.test(r));
    const denied = a.stage === "Denied";

    // Decide if this auth warrants an operational thread.
    const generatesThread =
      denied ||
      a.missingInfo ||
      hasPR || hasTP || hasSig ||
      (expDays !== null && expDays >= 0 && expDays <= 30) ||
      a.stage === "In QA Review" ||
      a.daysInStage >= 7;
    if (!generatesThread) continue;

    // Category
    let category: Category = "qa_update";
    if (denied || (expDays !== null && expDays >= 0 && expDays <= 7 && (hasPR || hasTP || a.missingInfo))) category = "escalation";
    else if (hasPR) category = "pr_workflow";
    else if (a.missingInfo || hasTP || hasSig) category = "missing_info";
    else if (a.stage === "In QA Review") category = "auth_review";
    else if (a.daysInStage >= 7) category = "bcba_followup";
    else category = "notification";

    // Urgency / escalation
    let urgency: Tone = "ok";
    if (denied || (expDays !== null && expDays >= 0 && expDays <= 7) || a.daysInStage > 14) urgency = "crit";
    else if (a.missingInfo || (expDays !== null && expDays >= 0 && expDays <= 30) || a.daysInStage > 7) urgency = "warn";
    const escalated = category === "escalation" || urgency === "crit";

    const weeksOut = expDays !== null ? Math.max(0, Math.round(expDays / 7)) : null;
    const owner = outreachOwner(a.state, weeksOut);
    const qaOwner = a.qaOwner ?? null;

    const blockerBits: string[] = [];
    if (denied) blockerBits.push(a.denialReason ? `Denied · ${a.denialReason}` : "Authorization denied");
    if (hasPR) blockerBits.push("Progress report outstanding");
    if (hasTP) blockerBits.push("Treatment plan outstanding");
    if (hasSig) blockerBits.push("Signature outstanding");
    if (a.missingInfo && !hasPR && !hasTP && !hasSig) blockerBits.push("Missing operational info");
    if (expDays !== null && expDays >= 0 && expDays <= 14) blockerBits.push(`Auth expires in ${expDays}d`);
    const blockerSummary = blockerBits.join(" · ") || a.nextAction || "Pending review";

    // Subject + preview
    const subjectByCategory: Record<Category, string> = {
      escalation:     `Escalation · ${a.clientName}`,
      pr_workflow:    `PR follow-up · ${a.clientName}`,
      missing_info:   `Missing information · ${a.clientName}`,
      auth_review:    `QA review · ${a.clientName}`,
      bcba_followup:  `BCBA follow-up · ${a.clientName}`,
      auth_review_2:  ``, // unused
      notification:   `Workflow update · ${a.clientName}`,
      qa_update:      `QA update · ${a.clientName}`,
    } as unknown as Record<Category, string>;
    const subject = subjectByCategory[category];

    const preview =
      category === "escalation"     ? blockerSummary :
      category === "pr_workflow"    ? `PR requested from ${a.coordinator}${weeksOut !== null ? ` · ${weeksOut}w to expiration` : ""}` :
      category === "missing_info"   ? `Awaiting: ${a.missingRequirements.slice(0,2).join(", ") || "missing items"}` :
      category === "auth_review"    ? `In QA review · ${a.nextAction || "Awaiting review notes"}` :
      category === "bcba_followup"  ? `${a.coordinator} · ${a.nextAction || "Follow up on workflow"}` :
                                      `${a.stage} · ${a.nextAction || "Workflow updated"}`;

    // Build a small synthetic but workflow-grounded message log from real
    // timeline entries + the next-action prompt. We do NOT invent conversation.
    const messages: MessageItem[] = [];
    const tl = (a.timeline ?? []).slice(0, 4);
    tl.forEach((t, i) => {
      const isQa = t.type === "qa" || (t.user && QA_TEAM.includes(t.user));
      messages.push({
        id: `${a.id}-tl-${i}`,
        sender: t.user || "Workflow system",
        role: isQa ? "QA" : t.user ? "BCBA" : "System",
        body: t.description,
        daysAgo: Math.max(0, a.daysInStage - i * 2),
        type: "Workflow Update",
      });
    });
    // Anchor message reflecting the live operational state
    const anchorType: MessageItem["type"] =
      category === "escalation"    ? "Escalation Notice" :
      category === "pr_workflow"   ? "PR Reminder" :
      category === "missing_info"  ? "Missing Information Request" :
      category === "auth_review"   ? "Authorization Readiness Update" :
      category === "bcba_followup" ? "Follow-Up Request" :
                                     "Workflow Update";
    messages.push({
      id: `${a.id}-anchor`,
      sender: qaOwner ?? owner,
      role: qaOwner ? "QA" : "Outreach",
      body:
        category === "pr_workflow"
          ? `Following up on the progress report for ${a.clientName}.${weeksOut !== null ? ` Authorization expires in ${expDays} days (${weeksOut}w).` : ""} Outreach owner: ${owner}.`
          : category === "missing_info"
          ? `Still awaiting: ${a.missingRequirements.join(", ") || "missing operational items"}. Coordinator: ${a.coordinator}.`
          : category === "escalation"
          ? `Escalating ${a.clientName} — ${blockerSummary}. Next action: ${a.nextAction || "review and reassign"}.`
          : category === "auth_review"
          ? `In QA review. ${a.qaNotes ?? a.nextAction ?? "Pending review notes."}`
          : category === "bcba_followup"
          ? `${a.coordinator}: ${a.nextAction || "Please confirm next steps on this workflow."}`
          : `${a.stage} · ${a.nextAction || "Workflow updated."}`,
      daysAgo: 0,
      type: anchorType,
    });

    const participants = Array.from(new Set([
      a.coordinator,
      qaOwner ?? owner,
      ...messages.map(m => m.sender),
    ].filter(Boolean) as string[]));

    // Unread / needs response heuristics from real workflow state
    const unread =
      a.daysInStage <= 3 ||
      category === "escalation" ||
      (a.missingInfo && a.daysInStage > 5);
    const needsResponse =
      category === "escalation" ||
      category === "pr_workflow" ||
      category === "missing_info" ||
      category === "bcba_followup";

    out.push({
      id: a.id,
      category,
      subject,
      client: a.clientName,
      state: a.state,
      bcba: a.coordinator,
      qaOwner,
      auth: a,
      urgency,
      escalated,
      unread,
      daysAgo: Math.max(0, Math.min(a.daysInStage, 60)),
      expirationDays: expDays,
      preview,
      messages,
      participants,
      blockerSummary,
      needsResponse,
    });
  }

  return out.sort((a, b) => {
    const rank = (z: Thread) => (z.escalated ? 2 : 0) + (z.urgency === "crit" ? 2 : z.urgency === "warn" ? 1 : 0) + (z.unread ? 1 : 0);
    const r = rank(b) - rank(a);
    if (r !== 0) return r;
    return (a.expirationDays ?? 9999) - (b.expirationDays ?? 9999);
  });
}

// ---------- templates ----------

const TEMPLATES: { id: string; label: string; body: string }[] = [
  { id: "pr",   label: "PR Follow-Up Reminder",       body: "Hi {bcba}, following up on the outstanding progress report for {client}. Authorization expires in {days} days — please share the latest PR." },
  { id: "miss", label: "Missing Documentation",       body: "Hi {bcba}, we still need {items} for {client}. Please send today so QA can move this workflow forward." },
  { id: "esc",  label: "Escalation Notice",           body: "Escalating {client} — {blocker}. Routing to {owner} for immediate follow-up." },
  { id: "bcba", label: "BCBA Follow-Up",              body: "Hi {bcba}, checking in on {client}. {next}. Please respond so we can keep this workflow on track." },
  { id: "sig",  label: "Signature Reminder",          body: "{bcba}, signature still outstanding for {client}. Sharing the document link again — please sign today." },
  { id: "rdy",  label: "Authorization Readiness",     body: "{client} is ready for submission pending final QA review. No outstanding blockers." },
];

function fillTemplate(body: string, t: Thread): string {
  const items = t.auth.missingRequirements.join(", ") || "the outstanding items";
  return body
    .replace(/\{bcba\}/g, t.bcba)
    .replace(/\{client\}/g, t.client)
    .replace(/\{days\}/g, t.expirationDays !== null ? String(t.expirationDays) : "—")
    .replace(/\{items\}/g, items)
    .replace(/\{blocker\}/g, t.blockerSummary)
    .replace(/\{owner\}/g, t.qaOwner ?? outreachOwner(t.state, t.expirationDays !== null ? Math.round(t.expirationDays / 7) : null))
    .replace(/\{next\}/g, t.auth.nextAction || "Please confirm next steps");
}

// ---------- page ----------

export default function OSQAMessages() {
  const { qaItems: items, loading, refresh, sourceById } = useLiveAuthorizations();
  const wf = useQAWorkflow();
  const { toast } = useToast();
  const threads = useMemo(() => buildThreads(items), [items]);

  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState<"all" | Category>("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [bcbaFilter, setBcbaFilter] = useState("all");
  const [escFilter, setEscFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<"resolve" | "escalate" | "send" | null>(null);

  // QA Pass 5 — deep links: ?id=/?focus= open thread by auth id; ?bcba= filters; ?client= searches.
  const [searchParams, setSearchParams] = useSearchParams();
  const consumedRef = useRef(false);
  useEffect(() => {
    if (consumedRef.current || loading || threads.length === 0) return;
    const idP = searchParams.get("id") ?? searchParams.get("focus");
    const bcbaP = searchParams.get("bcba");
    const clientP = searchParams.get("client");
    if (!idP && !bcbaP && !clientP) { consumedRef.current = true; return; }
    const missed: string[] = [];
    if (idP) {
      const t = threads.find(x => x.auth.id === idP);
      if (t) setOpenId(t.id); else missed.push(`record ${idP}`);
    }
    if (bcbaP) {
      if (threads.some(x => (x.bcba ?? "").toLowerCase() === bcbaP.toLowerCase())) setBcbaFilter(bcbaP);
      else { setQuery(bcbaP); missed.push(`BCBA "${bcbaP}"`); }
    }
    if (clientP) {
      setQuery(clientP);
      const t = threads.find(x => x.client?.toLowerCase() === clientP.toLowerCase());
      if (t && !idP) setOpenId(t.id);
    }
    if (missed.length) {
      toast({ title: "Deep link partially resolved", description: `Could not locate ${missed.join(", ")}.` });
    }
    const next = new URLSearchParams(searchParams);
    ["id", "focus", "bcba", "client"].forEach(k => next.delete(k));
    setSearchParams(next, { replace: true });
    consumedRef.current = true;
  }, [threads, loading, searchParams, setSearchParams, toast]);

  const states = useMemo(() => Array.from(new Set(threads.map(t => t.state).filter(Boolean))).sort(), [threads]);
  const bcbas  = useMemo(() => Array.from(new Set(threads.map(t => t.bcba).filter(Boolean))).sort(), [threads]);
  const owners = useMemo(() => Array.from(new Set(threads.map(t => t.qaOwner).filter((v): v is string => !!v))).sort(), [threads]);

  const aware = useMemo(() => ({
    unread:    threads.filter(t => t.unread).length,
    followups: threads.filter(t => t.needsResponse).length,
    escalated: threads.filter(t => t.escalated).length,
    missing:   threads.filter(t => t.category === "missing_info").length,
    pr:        threads.filter(t => t.category === "pr_workflow").length,
  }), [threads]);

  const tabbed = useMemo(() => ({
    all:           threads,
    unread:        threads.filter(t => t.unread),
    followup:      threads.filter(t => t.needsResponse),
    escalation:    threads.filter(t => t.category === "escalation"),
    pr:            threads.filter(t => t.category === "pr_workflow"),
    missing:       threads.filter(t => t.category === "missing_info"),
    notifications: threads.filter(t => t.category === "notification" || t.category === "qa_update" || t.category === "auth_review"),
  } as Record<TabKey, Thread[]>), [threads]);

  const counts = {
    all: tabbed.all.length,
    unread: tabbed.unread.length,
    followup: tabbed.followup.length,
    escalation: tabbed.escalation.length,
    pr: tabbed.pr.length,
    missing: tabbed.missing.length,
    notifications: tabbed.notifications.length,
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tabbed[tab].filter(t => {
      if (workflowFilter !== "all" && t.category !== workflowFilter) return false;
      if (stateFilter !== "all" && t.state !== stateFilter) return false;
      if (ownerFilter !== "all" && t.qaOwner !== ownerFilter) return false;
      if (bcbaFilter !== "all" && t.bcba !== bcbaFilter) return false;
      if (escFilter === "escalated" && !t.escalated) return false;
      if (escFilter === "normal" && t.escalated) return false;
      if (urgencyFilter !== "all" && t.urgency !== urgencyFilter) return false;
      if (unreadOnly && !t.unread) return false;
      if (q) {
        const hay = [t.subject, t.client, t.state, t.bcba, t.qaOwner ?? "", t.preview, t.blockerSummary, CATEGORY_LABEL[t.category]].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tabbed, tab, query, workflowFilter, stateFilter, ownerFilter, bcbaFilter, escFilter, urgencyFilter, unreadOnly]);

  // Active thread (auto-select first visible)
  const activeId = openId ?? visible[0]?.id ?? null;
  const active = useMemo(() => threads.find(t => t.id === activeId) ?? null, [threads, activeId]);

  // Today's follow-ups (sidebar)
  const todayFollowups = useMemo(() => {
    return threads
      .filter(t => t.needsResponse && (t.urgency !== "ok" || t.unread))
      .slice(0, 6);
  }, [threads]);

  // QA team activity
  const teamActivity = useMemo(() => {
    return QA_TEAM.map(name => {
      const owned = threads.filter(t => t.qaOwner === name);
      return {
        name,
        active:       owned.length,
        unresolved:   owned.filter(t => t.needsResponse).length,
        escalations:  owned.filter(t => t.escalated).length,
      };
    });
  }, [threads]);

  // Updates & notifications feed (light operational events)
  const updates = useMemo(() => {
    return threads
      .filter(t => t.category === "notification" || t.category === "auth_review" || t.category === "qa_update")
      .slice(0, 6);
  }, [threads]);

  const TABS: { key: TabKey; label: string; count: number; tone?: Tone }[] = [
    { key: "all",           label: "All threads",     count: counts.all },
    { key: "unread",        label: "Unread",          count: counts.unread,        tone: "warn" },
    { key: "followup",      label: "Follow-Ups",      count: counts.followup,      tone: "warn" },
    { key: "escalation",    label: "Escalations",     count: counts.escalation,    tone: "crit" },
    { key: "pr",            label: "PR",              count: counts.pr },
    { key: "missing",       label: "Missing Info",    count: counts.missing,       tone: "warn" },
    { key: "notifications", label: "Updates",         count: counts.notifications },
  ];

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8 pb-24 pt-6 md:pt-10 space-y-6">
        {/* HEADER */}
        <header>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{todayLabel()}</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Messages &amp; Updates</h1>
              <p className="mt-1.5 text-[15px] text-muted-foreground max-w-2xl">
                Coordinate QA workflows, follow-ups, escalations, and operational communication.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full border border-border/70 bg-card text-xs font-medium text-foreground">
                <Inbox className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                {aware.unread} unread
              </span>
              {aware.followups > 0 && (
                <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-medium">
                  <Reply className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {aware.followups} need response
                </span>
              )}
              {aware.escalated > 0 && (
                <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium">
                  <Flame className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {aware.escalated} escalated
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search messages, workflows, clients, BCBA updates, or escalations..."
              className="w-full h-11 rounded-xl bg-muted/60 border border-border pl-11 pr-4 text-[15px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <FilterSelect value={workflowFilter} onChange={(v) => setWorkflowFilter(v as "all" | Category)} label="Workflow type"
              options={[
                { value: "all", label: "All workflow types" },
                { value: "pr_workflow", label: "PR workflows" },
                { value: "missing_info", label: "Missing information" },
                { value: "escalation", label: "Escalations" },
                { value: "auth_review", label: "Authorization reviews" },
                { value: "bcba_followup", label: "BCBA follow-ups" },
                { value: "notification", label: "Notifications" },
              ]} />
            <FilterSelect value={stateFilter} onChange={setStateFilter} label="State"
              options={[{ value: "all", label: "All states" }, ...states.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={ownerFilter} onChange={setOwnerFilter} label="Assigned owner"
              options={[{ value: "all", label: "All QA owners" }, ...owners.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={bcbaFilter} onChange={setBcbaFilter} label="BCBA"
              options={[{ value: "all", label: "All BCBAs" }, ...bcbas.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={escFilter} onChange={setEscFilter} label="Escalation"
              options={[
                { value: "all", label: "All escalation" },
                { value: "escalated", label: "Escalated" },
                { value: "normal", label: "Normal" },
              ]} />
            <FilterSelect value={urgencyFilter} onChange={setUrgencyFilter} label="Urgency"
              options={[
                { value: "all", label: "All urgency" },
                { value: "crit", label: "Critical" },
                { value: "warn", label: "High" },
                { value: "ok",   label: "Normal" },
              ]} />
            <button
              onClick={() => setUnreadOnly(v => !v)}
              className={cn(
                "h-9 px-3 rounded-full text-xs border transition inline-flex items-center gap-1.5",
                unreadOnly ? "bg-primary/10 border-primary/30 text-primary" : "bg-card border-border/70 text-foreground hover:bg-muted",
              )}>
              <BellRing className="h-3.5 w-3.5" strokeWidth={1.75} />
              Unread only
            </button>
          </div>
        </header>

        {/* AWARENESS CARDS */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <AwareCard icon={Inbox}         label="Unread Updates"      value={aware.unread}    tone="warn" />
          <AwareCard icon={Reply}         label="Needs Response"      value={aware.followups} tone="warn" />
          <AwareCard icon={Flame}         label="Escalations"         value={aware.escalated} tone="crit" />
          <AwareCard icon={ShieldAlert}   label="Missing Info"        value={aware.missing}   tone="warn" />
          <AwareCard icon={FileText}      label="PR Workflows"        value={aware.pr} />
        </section>

        {/* TABS */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          {TABS.map(t => {
            const activeTab = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-sm font-medium transition whitespace-nowrap border",
                  activeTab
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-foreground border-border/70 hover:bg-muted",
                )}>
                {t.label}
                <span className={cn(
                  "tabular-nums text-[11px] px-1.5 py-0.5 rounded-full",
                  activeTab ? "bg-primary-foreground/15 text-primary-foreground" : "bg-muted text-muted-foreground",
                )}>{t.count}</span>
                {t.tone === "crit" && !activeTab && t.count > 0 && <span className="h-1.5 w-1.5 rounded-full bg-destructive" />}
              </button>
            );
          })}
        </div>

        {/* 3-COL LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr_320px] gap-5">
          {/* LEFT — feed */}
          <aside className="space-y-3 min-w-0">
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between">
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Threads</div>
                <span className="text-[11px] text-muted-foreground tabular-nums">{visible.length}</span>
              </div>
              {loading ? (
                <div className="p-3 space-y-2">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
                </div>
              ) : visible.length === 0 ? (
                <EmptyState icon={CheckCircle2} title={
                  tab === "escalation" ? "No escalations requiring attention." :
                  tab === "followup"   ? "No unresolved follow-ups right now." :
                  tab === "unread"     ? "No unread workflow updates." :
                  tab === "pr"         ? "No open PR workflows." :
                  tab === "missing"    ? "No outstanding missing information." :
                                         "No threads match these filters."
                } />
              ) : (
                <ul className="divide-y divide-border/60 max-h-[720px] overflow-y-auto">
                  {visible.map(t => (
                    <li key={t.id}>
                      <button
                        onClick={() => { setOpenId(t.id); setComposer(""); setActiveTemplate(null); }}
                        className={cn(
                          "w-full text-left px-4 py-3 transition flex items-start gap-3",
                          activeId === t.id ? "bg-muted/60" : "hover:bg-muted/40",
                        )}>
                        <div className={cn("h-9 w-9 rounded-xl grid place-items-center shrink-0 border", toneClasses(t.urgency))}>
                          <CategoryIcon category={t.category} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-sm truncate", t.unread ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                              {t.client}
                            </span>
                            {t.unread && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                            <span className="ml-auto text-[10px] text-muted-foreground tabular-nums shrink-0">{relTimeFromDays(t.daysAgo)}</span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-muted-foreground truncate">
                            {CATEGORY_LABEL[t.category]} · {t.state} · {t.bcba}
                          </div>
                          <div className="mt-1 text-[12px] text-foreground/80 line-clamp-2">{t.preview}</div>
                          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            {t.escalated && <Pill tone="crit"><Flame className="h-3 w-3" strokeWidth={1.75} /> Escalated</Pill>}
                            {t.expirationDays !== null && t.expirationDays >= 0 && t.expirationDays <= 14 && (
                              <Pill tone="crit"><Calendar className="h-3 w-3" strokeWidth={1.75} /> Exp {t.expirationDays}d</Pill>
                            )}
                            {t.needsResponse && <Pill tone="warn"><Reply className="h-3 w-3" strokeWidth={1.75} /> Needs reply</Pill>}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* UPDATES feed (compact) */}
            <Card className="p-0">
              <div className="px-4 py-2.5 border-b border-border/60 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Workflow updates
              </div>
              {updates.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="No new workflow updates." />
              ) : (
                <ul className="divide-y divide-border/60">
                  {updates.map(u => (
                    <li key={u.id}>
                      <button onClick={() => setOpenId(u.id)} className="w-full text-left p-3 hover:bg-muted/40 transition flex items-start gap-3">
                        <div className="h-7 w-7 rounded-lg bg-muted grid place-items-center shrink-0">
                          <Activity className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] text-foreground truncate">{u.subject}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{u.preview}</div>
                        </div>
                        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{relTimeFromDays(u.daysAgo)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </aside>

          {/* CENTER — active conversation */}
          <main className="min-w-0">
            {active ? (
              <Card className="p-0 flex flex-col h-[820px] max-h-[calc(100vh-260px)]">
                {/* Conversation header */}
                <div className="px-5 py-4 border-b border-border/60 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-semibold tracking-tight text-foreground truncate">{active.subject}</h2>
                      <Pill tone={active.urgency}>{CATEGORY_LABEL[active.category]}</Pill>
                      {active.escalated && <Pill tone="crit">Escalated</Pill>}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground truncate">
                      {active.state} · BCBA {active.bcba} · QA {active.qaOwner ?? "Unassigned"}
                      {active.expirationDays !== null && active.expirationDays >= 0 && ` · Auth expires in ${active.expirationDays}d`}
                    </div>
                  </div>
                  <button
                    onClick={() => setOpenId(active.id)}
                    className="hidden md:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/70 text-xs text-foreground hover:bg-muted transition">
                    Workflow detail <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                  {active.messages.map((m, i) => {
                    const isQa = m.role === "QA" || m.role === "Outreach";
                    return (
                      <div key={m.id} className={cn("flex gap-3", isQa ? "justify-end" : "justify-start")}>
                        {!isQa && <Avatar name={m.sender} />}
                        <div className={cn(
                          "max-w-[78%] rounded-2xl border px-4 py-3",
                          isQa
                            ? "bg-primary/10 border-primary/20 text-foreground"
                            : "bg-muted/40 border-border/60 text-foreground",
                        )}>
                          <div className="flex items-center gap-2 mb-1 text-[11px] text-muted-foreground">
                            <span className="font-medium text-foreground">{m.sender}</span>
                            <span>·</span>
                            <span>{m.role}</span>
                            <span>·</span>
                            <span>{m.type}</span>
                            <span className="ml-auto tabular-nums">{relTimeFromDays(m.daysAgo)}</span>
                          </div>
                          <div className="text-[14px] leading-relaxed whitespace-pre-line">{m.body}</div>
                          {i === active.messages.length - 1 && (
                            <div className="mt-2 text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
                              <Paperclip className="h-3 w-3" strokeWidth={1.75} />
                              <Link to={`/authorization-reviews?id=${encodeURIComponent(active.auth.id)}`} className="hover:text-foreground transition underline-offset-2 hover:underline">
                                Workflow #{active.auth.id} · {active.client}
                              </Link>
                            </div>
                          )}
                        </div>
                        {isQa && <Avatar name={m.sender} primary />}
                      </div>
                    );
                  })}
                </div>

                {/* Templates */}
                <div className="px-5 pt-3 border-t border-border/60">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                    {TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { setActiveTemplate(t.id); setComposer(fillTemplate(t.body, active)); }}
                        className={cn(
                          "shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[11px] border transition",
                          activeTemplate === t.id
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "bg-card border-border/70 text-foreground hover:bg-muted",
                        )}>
                        <Sparkles className="h-3 w-3" strokeWidth={1.75} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Composer */}
                <div className="px-5 pb-4">
                  <div className="rounded-2xl border border-border/70 bg-muted/30 focus-within:ring-2 focus-within:ring-ring transition">
                    <textarea
                      value={composer}
                      onChange={e => setComposer(e.target.value)}
                      placeholder={`Reply to ${active.bcba}… use @ to mention, # to reference workflows`}
                      rows={3}
                      className="block w-full bg-transparent resize-none px-4 py-3 text-[14px] placeholder:text-muted-foreground/70 focus:outline-none"
                    />
                    <div className="flex items-center justify-between gap-2 px-2 pb-2">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ComposerIcon icon={AtSign} title="Mention" />
                        <ComposerIcon icon={Paperclip} title="Attach workflow reference" />
                        <ComposerIcon icon={StickyNote} title="Add internal QA note" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ActionPill
                          icon={MailCheck}
                          label="Mark resolved"
                          title="Persist a 'resolved' workflow update for this thread's authorization"
                          disabled={actionBusy !== null}
                          loading={actionBusy === "resolve"}
                          onClick={async () => {
                            if (!active) return;
                            setActionBusy("resolve");
                            try {
                              await wf.markResolved(
                                toQAWorkItemRef(active.auth, sourceById.get(active.auth.id)),
                                composer.trim() || undefined,
                              );
                              await refresh();
                            } finally { setActionBusy(null); }
                          }}
                        />
                        <ActionPill
                          icon={Flame}
                          label="Escalate"
                          tone="crit"
                          title="Escalate this thread's authorization to leadership"
                          disabled={actionBusy !== null}
                          loading={actionBusy === "escalate"}
                          onClick={async () => {
                            if (!active) return;
                            const reason = composer.trim() || `Escalated from messages: ${active.subject}`;
                            setActionBusy("escalate");
                            try {
                              await wf.escalate(
                                toQAWorkItemRef(active.auth, sourceById.get(active.auth.id)),
                                reason,
                              );
                              await refresh();
                            } finally { setActionBusy(null); }
                          }}
                        />
                        <button
                          type="button"
                          title="Send a follow-up note that persists to the QA workflow"
                          disabled={!active || actionBusy !== null || composer.trim().length === 0}
                          aria-label="Send follow-up"
                          onClick={async () => {
                            if (!active) return;
                            const note = composer.trim();
                            if (!note) {
                              toast({ title: "Add a note", description: "Type a follow-up message before sending." });
                              return;
                            }
                            setActionBusy("send");
                            try {
                              await wf.sendFollowUp(
                                toQAWorkItemRef(active.auth, sourceById.get(active.auth.id)),
                                note,
                              );
                              setComposer("");
                              await refresh();
                            } finally { setActionBusy(null); }
                          }}
                          className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="h-4 w-4" strokeWidth={1.75} />
                          {actionBusy === "send" ? "Sending…" : "Send follow-up"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-[600px] grid place-items-center">
                <EmptyState icon={MessageCircle} title="Select a thread to view operational communication." />
              </Card>
            )}
          </main>

          {/* RIGHT — workflow context + sidebar */}
          <aside className="space-y-5 min-w-0">
            {active && (
              <section>
                <SectionLabel>Workflow context</SectionLabel>
                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("h-9 w-9 rounded-xl grid place-items-center border shrink-0", toneClasses(active.urgency))}>
                      <UserCheck className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{active.client}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{active.state} · {active.auth.payor}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <ContextCell label="Workflow" value={CATEGORY_LABEL[active.category]} />
                    <ContextCell label="QA status" value={active.auth.qaStatus} />
                    <ContextCell label="Stage" value={active.auth.stage} />
                    <ContextCell label="PR" value={active.auth.missingRequirements.some(r => PR_KW.test(r)) ? "Outstanding" : "Clear"} tone={active.auth.missingRequirements.some(r => PR_KW.test(r)) ? "warn" : "ok"} />
                    <ContextCell label="TP" value={active.auth.missingRequirements.some(r => TP_KW.test(r)) || active.auth.treatmentPlanReceived === false ? "Pending" : "Ready"} tone={active.auth.missingRequirements.some(r => TP_KW.test(r)) || active.auth.treatmentPlanReceived === false ? "warn" : "ok"} />
                    <ContextCell label="Expires" value={active.expirationDays !== null ? `${active.expirationDays}d` : "—"} tone={active.expirationDays !== null && active.expirationDays <= 14 ? "crit" : active.expirationDays !== null && active.expirationDays <= 30 ? "warn" : "ok"} />
                    <ContextCell label="BCBA" value={active.bcba} />
                    <ContextCell label="Escalation" value={active.escalated ? "Active" : "None"} tone={active.escalated ? "crit" : "ok"} />
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Latest blocker</div>
                    <div className="text-[12px] text-foreground">{active.blockerSummary}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <CtxBtn icon={ExternalLink}  label="Open client"          to={`/qa-clients?client=${encodeURIComponent(active.client)}`} />
                    <CtxBtn icon={ClipboardList} label="Open authorization"   to={`/authorization-reviews?id=${encodeURIComponent(active.auth.id)}`} />
                    <CtxBtn icon={FileText}      label="Open PR workflow"     to="/reports" />
                    <CtxBtn icon={ShieldAlert}   label="Open TP review"       to="/treatment-plan-reviews" />
                  </div>
                </Card>
              </section>
            )}

            <section>
              <SectionLabel>Today's follow-ups</SectionLabel>
              <Card>
                {todayFollowups.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="No unresolved follow-ups right now." />
                ) : (
                  <ul className="divide-y divide-border/60">
                    {todayFollowups.map(t => (
                      <li key={t.id}>
                        <button onClick={() => setOpenId(t.id)} className="w-full text-left p-3 hover:bg-muted/40 transition">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{t.client}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{CATEGORY_LABEL[t.category]} · {t.bcba}</div>
                            </div>
                            <Pill tone={t.urgency}>
                              {t.expirationDays !== null && t.expirationDays >= 0 && t.expirationDays <= 14 ? `${t.expirationDays}d` : t.escalated ? "Esc" : "Reply"}
                            </Pill>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>

            <section>
              <SectionLabel>QA team activity</SectionLabel>
              <Card>
                <ul className="divide-y divide-border/60">
                  {teamActivity.map(w => (
                    <li key={w.name} className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary grid place-items-center text-[10px] font-semibold shrink-0">
                            {initials(w.name)}
                          </div>
                          <span className="text-sm font-medium text-foreground truncate">{w.name}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground tabular-nums">{w.active}</span>
                      </div>
                      {(w.unresolved > 0 || w.escalations > 0) && (
                        <div className="mt-1.5 flex items-center gap-1.5 pl-9 flex-wrap">
                          {w.escalations > 0 && <Pill tone="crit">{w.escalations} escalated</Pill>}
                          {w.unresolved > 0 && <Pill tone="warn">{w.unresolved} unresolved</Pill>}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            </section>

            <section>
              <SectionLabel>Operational Insights</SectionLabel>
              <Card className="p-4 bg-gradient-to-br from-primary/5 via-card to-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary grid place-items-center">
                    <Brain className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </div>
                  <div className="text-xs text-muted-foreground">Communication copilot</div>
                </div>
                <div className="space-y-1">
                  {[
                    "Which follow-ups are overdue?",
                    "Which workflows need escalation?",
                    "Which BCBAs have not responded?",
                    "Summarize this communication thread.",
                    "Show unresolved PR follow-ups.",
                  ].map(p => (
                    <Link key={p} to={`/ai/assistant?q=${encodeURIComponent(p)}`}
                      className="block text-[12px] px-2.5 py-1.5 rounded-lg bg-muted/60 hover:bg-muted transition text-foreground">
                      <Sparkles className="h-3 w-3 inline mr-1.5 text-primary" strokeWidth={2} />
                      {p}
                    </Link>
                  ))}
                </div>
              </Card>
            </section>
          </aside>
        </div>
      </div>

      {/* Workflow detail slideout for any thread */}
      {active && openId === active.id && (
        <ThreadSlideout t={active} onClose={() => setOpenId(null)} onChanged={refresh} sourceSystem={sourceById.get(active.auth.id)} />
      )}
    </OSShell>
  );
}

// ---------- sub-components ----------

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn(
      "rounded-2xl border border-border/70 bg-card",
      "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]",
      className,
    )}>{children}</div>
  );
}
function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap",
      toneClasses(tone),
    )}>{children}</span>
  );
}
function EmptyState({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="h-10 w-10 rounded-full bg-muted grid place-items-center mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-2 mb-2">{children}</div>;
}
function FilterSelect({
  value, onChange, label, options,
}: { value: string; onChange: (v: string) => void; label: string; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className={cn(
          "h-9 rounded-full pl-3 pr-8 text-xs border transition appearance-none cursor-pointer",
          value === "all"
            ? "bg-card border-border/70 text-foreground hover:bg-muted"
            : "bg-primary/10 border-primary/30 text-primary",
        )}
        aria-label={label}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground rotate-90 pointer-events-none" />
    </div>
  );
}
function AwareCard({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number; tone?: Tone }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2.5">
        <div className={cn("h-9 w-9 rounded-xl grid place-items-center border", toneClasses(tone ?? "ok"))}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">{label}</div>
          <div className="text-xl font-semibold tracking-tight text-foreground tabular-nums">{value}</div>
        </div>
      </div>
    </Card>
  );
}
function ComposerIcon({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <button title={title} className="h-8 w-8 rounded-lg grid place-items-center hover:bg-muted hover:text-foreground transition">
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}
function ActionPill({
  icon: Icon, label, tone, onClick, disabled, loading, title,
}: {
  icon: React.ElementType;
  label: string;
  tone?: Tone;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
}) {
  const cls = cn(
    "h-9 px-3 rounded-xl border text-xs font-medium inline-flex items-center gap-1.5 transition",
    tone === "crit"
      ? "border-destructive/20 text-destructive hover:bg-destructive/5"
      : "border-border/70 text-foreground hover:bg-muted",
    (disabled || loading) && "opacity-50 cursor-not-allowed hover:bg-transparent",
  );
  return (
    <button
      type="button"
      className={cls}
      onClick={onClick}
      disabled={disabled || loading}
      title={title ?? label}
      aria-label={label}
    >
      <Icon className={cn("h-3.5 w-3.5", loading && "animate-pulse")} strokeWidth={1.75} />
      {loading ? "Saving…" : label}
    </button>
  );
}
function Avatar({ name, primary }: { name: string; primary?: boolean }) {
  return (
    <div className={cn(
      "h-8 w-8 rounded-full grid place-items-center text-[10px] font-semibold shrink-0",
      primary ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
    )}>{initials(name) || "—"}</div>
  );
}
function ContextCell({ label, value, tone }: { label: string; value: string; tone?: Tone }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn(
        "mt-0.5 text-[12px] font-medium truncate",
        tone === "crit" ? "text-destructive" :
        tone === "warn" ? "text-amber-700 dark:text-amber-400" :
        "text-foreground",
      )}>{value}</div>
    </div>
  );
}
function CtxBtn({ icon: Icon, label, to }: { icon: React.ElementType; label: string; to: string }) {
  return (
    <Link to={to} className="h-9 rounded-xl border border-border/70 px-3 text-xs font-medium inline-flex items-center justify-center gap-1.5 text-foreground hover:bg-muted transition">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      <span className="truncate">{label}</span>
    </Link>
  );
}
function CategoryIcon({ category }: { category: Category }) {
  const cls = "h-4 w-4";
  const sw = 1.75;
  switch (category) {
    case "escalation":     return <Flame className={cls} strokeWidth={sw} />;
    case "pr_workflow":    return <FileText className={cls} strokeWidth={sw} />;
    case "missing_info":   return <ShieldAlert className={cls} strokeWidth={sw} />;
    case "auth_review":    return <ClipboardList className={cls} strokeWidth={sw} />;
    case "bcba_followup":  return <UserCheck className={cls} strokeWidth={sw} />;
    case "notification":   return <BellRing className={cls} strokeWidth={sw} />;
    default:               return <MessageCircle className={cls} strokeWidth={sw} />;
  }
}

function ThreadSlideout({ t, onClose, onChanged, sourceSystem }: { t: Thread; onClose: () => void; onChanged?: () => void | Promise<void>; sourceSystem?: "monday" | "manual" | "centralreach" }) {
  useSlideout(true, onClose);
  return (
    <>
      <div className="fixed inset-0 bg-foreground/10 backdrop-blur-[2px] z-40" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 w-full max-w-[520px] bg-card border-l border-border/70 z-50 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-card/95 backdrop-blur-md border-b border-border/70 px-5 py-4 flex items-start justify-between gap-3 z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold tracking-tight text-foreground truncate">{t.client}</h2>
              <Pill tone={t.urgency}>{CATEGORY_LABEL[t.category]}</Pill>
              {t.escalated && <Pill tone="crit">Escalated</Pill>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {t.state} · BCBA {t.bcba} · QA {t.qaOwner ?? "Unassigned"}
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-muted grid place-items-center shrink-0">
            <X className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <section>
            <SectionLabel>Workflow snapshot</SectionLabel>
            <Card className="p-4 grid grid-cols-2 gap-3">
              <ContextCell label="Stage" value={t.auth.stage} />
              <ContextCell label="QA status" value={t.auth.qaStatus} />
              <ContextCell label="Days in stage" value={String(t.auth.daysInStage)} tone={t.auth.daysInStage > 10 ? "crit" : t.auth.daysInStage > 5 ? "warn" : "ok"} />
              <ContextCell label="Expires" value={t.expirationDays !== null ? `${t.expirationDays}d` : "—"} tone={t.expirationDays !== null && t.expirationDays <= 14 ? "crit" : t.expirationDays !== null && t.expirationDays <= 30 ? "warn" : "ok"} />
              <ContextCell label="Missing" value={t.auth.missingRequirements.length ? `${t.auth.missingRequirements.length} items` : "None"} tone={t.auth.missingRequirements.length ? "warn" : "ok"} />
              <ContextCell label="Next action" value={t.auth.nextAction || "—"} />
            </Card>
          </section>

          <section>
            <SectionLabel>Communication history</SectionLabel>
            <Card>
              <ul className="divide-y divide-border/60">
                {t.messages.map(m => (
                  <li key={m.id} className="p-3 flex items-start gap-3">
                    <Avatar name={m.sender} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-muted-foreground">
                        <span className="text-foreground font-medium">{m.sender}</span> · {m.role} · {m.type} · <span className="tabular-nums">{relTimeFromDays(m.daysAgo)}</span>
                      </div>
                      <div className="mt-0.5 text-[13px] text-foreground">{m.body}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {t.auth.timeline && t.auth.timeline.length > 0 && (
            <section>
              <SectionLabel>Workflow timeline</SectionLabel>
              <Card>
                <ul className="divide-y divide-border/60">
                  {t.auth.timeline.slice(0, 6).map(ev => (
                    <li key={ev.id} className="p-3 flex items-start gap-3">
                      <div className="h-7 w-7 rounded-lg bg-muted grid place-items-center shrink-0">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] text-foreground truncate">{ev.description}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{ev.timestamp}{ev.user ? ` · ${ev.user}` : ""}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          )}

          <section className="space-y-2">
            <SectionLabel>Quick actions</SectionLabel>
            <QAActionsPanel auth={t.auth} sourceSystem={sourceSystem} onChanged={onChanged} />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <CtxBtn icon={ExternalLink}  label="Open client"          to={`/qa-clients?client=${encodeURIComponent(t.client)}`} />
              <CtxBtn icon={ClipboardList} label="Open authorization"   to={`/authorization-reviews?id=${encodeURIComponent(t.auth.id)}`} />
              <CtxBtn icon={FileText}      label="Open PR workflow"     to="/reports" />
              <CtxBtn icon={ShieldAlert}   label="Open TP review"       to="/treatment-plan-reviews" />
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}