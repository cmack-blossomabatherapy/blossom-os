import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Plus, Send, ShieldCheck, Sparkles, Phone, Mail, MessageSquare,
  StickyNote, AlertTriangle, ChevronRight, Loader2, CalendarClock, FileWarning,
  FileCheck2, Users, Activity, BellRing, ListTodo, BookOpen, CheckCircle2,
  Clock, ArrowUpRight, CircleDot, UserCheck, MoreHorizontal,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useLeads } from "@/contexts/LeadsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { scopeLeadsForUser } from "@/lib/leads/scoping";
import {
  getReadinessStatus, getBlockers, primaryBlocker, getUrgency,
  READINESS_STAGES, READINESS_TONE,
} from "@/lib/leads/readiness";
import { LeadDetailDrawer } from "@/components/leads/LeadDetailDrawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Lead } from "@/data/leads";

/* ───────────────── helpers ───────────────── */

function relTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso); if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime(); const day = 86_400_000;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m`;
  if (diff < day) return `${Math.round(diff / 3_600_000)}h`;
  if (diff < 30 * day) return `${Math.round(diff / day)}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const urgencyRing: Record<"low" | "medium" | "high", string> = {
  low: "ring-1 ring-border/60",
  medium: "ring-1 ring-amber-400/40 shadow-[0_0_0_3px_rgba(245,158,11,0.06)]",
  high: "ring-1 ring-red-400/50 shadow-[0_0_0_3px_rgba(239,68,68,0.08)]",
};
const urgencyDot: Record<"low" | "medium" | "high", string> = {
  low: "bg-emerald-500", medium: "bg-amber-500", high: "bg-red-500",
};
const initials = (n: string) =>
  n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

/* ───────────────── page ───────────────── */

export default function OSIntakeWorkspace() {
  const { leads, loading, error, updateLead } = useLeads();
  const { user, roles } = useAuth();
  const [profileState, setProfileState] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [activeQueue, setActiveQueue] = useState<string>("due_today");

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("state, display_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        setProfileState((data?.state as string) ?? null);
        setDisplayName((data?.display_name as string) ?? null);
      });
  }, [user?.id]);

  const scoped = useMemo(
    () => scopeLeadsForUser(leads, { state: profileState, displayName, roles: roles as string[] }),
    [leads, profileState, displayName, roles],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter((l) =>
      [l.childName, l.parentName, l.phone, l.email, l.primaryInsurance, l.state]
        .map((s) => String(s ?? "").toLowerCase()).join(" ").includes(q),
    );
  }, [scoped, query]);

  return (
    <OSShell rightRail={<AskBlossomRail leads={visible} onOpen={setOpenLeadId} />}>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Intake Workspace</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Guide families from inquiry to operational readiness.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/leads"><Users className="mr-1.5 h-4 w-4" /> Open Leads</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/vob-decision-center"><ShieldCheck className="mr-1.5 h-4 w-4" /> VOB Center</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toast("Send Intake Packet — pick a family first")}>
              <Send className="mr-1.5 h-4 w-4" /> Send Packet
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toast("Follow-up created")}>
              <CalendarClock className="mr-1.5 h-4 w-4" /> Follow-Up
            </Button>
            <Button size="sm" onClick={() => toast("Add Inquiry — coming soon")}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Inquiry
            </Button>
          </div>
        </header>

        {/* Search + pulse */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search family, insurance, phone, email…"
              className="h-11 w-full rounded-xl bg-muted/60 border border-border pl-10 pr-4 text-sm placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent transition outline-none"
            />
          </div>
          <OperationalPulse leads={visible} />
        </div>

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" /> {error}
          </div>
        )}

        {loading && leads.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Loading workspace…</p>
          </div>
        ) : (
          <>
            {/* 2-column workflow: LEFT queues, CENTER families */}
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
              <FollowUpQueues
                leads={visible}
                active={activeQueue}
                onChange={setActiveQueue}
                onOpen={setOpenLeadId}
              />
              <FamiliesNeedingAttention
                leads={visible}
                onOpen={setOpenLeadId}
                onMarkPacketSent={(id) => { updateLead(id, { formStatus: "Sent" }); toast.success("Packet marked sent"); }}
              />
            </div>

            <ReadinessBlockers leads={visible} onOpen={setOpenLeadId} />
            <AssessmentCoordination leads={visible} onOpen={setOpenLeadId} />
            <ServiceReadinessPipeline leads={visible} onOpen={setOpenLeadId} />
            <RecentCommunication leads={visible} onOpen={setOpenLeadId} />
          </>
        )}
      </div>

      {openLeadId && <LeadDetailDrawer leadId={openLeadId} onClose={() => setOpenLeadId(null)} />}
    </OSShell>
  );
}

/* ───────────────── Operational Pulse ───────────────── */

function OperationalPulse({ leads }: { leads: Lead[] }) {
  const pulse = useMemo(() => {
    const isDue = (l: Lead) => (l.daysInStage ?? 0) >= 1;
    return {
      newInq: leads.filter((l) => l.status === "New Lead").length,
      followups: leads.filter(isDue).length,
      missing: leads.filter((l) => l.status === "Missing Information" || l.formReviewStatus === "Missing Information").length,
      vob: leads.filter((l) => l.status === "Sent to VOB" || l.vobStatus === "Sent").length,
      assess: leads.filter((l) => l.status === "Needs DX" || l.status === "Getting DX").length,
      ready: leads.filter((l) => getReadinessStatus(l) === "Operationally Ready").length,
    };
  }, [leads]);

  const items = [
    { label: "New Inquiries", value: pulse.newInq, icon: Sparkles, tone: "text-sky-600" },
    { label: "Follow-Ups Due", value: pulse.followups, icon: BellRing, tone: "text-amber-600" },
    { label: "Missing Info", value: pulse.missing, icon: FileWarning, tone: "text-orange-600" },
    { label: "VOB Pending", value: pulse.vob, icon: ShieldCheck, tone: "text-violet-600" },
    { label: "Ready for Assessment", value: pulse.assess, icon: UserCheck, tone: "text-blue-600" },
    { label: "Ready for Next Step", value: pulse.ready, icon: CheckCircle2, tone: "text-emerald-600" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {items.map((it) => (
        <div key={it.label} className="rounded-xl border border-border/60 bg-card px-3 py-2.5 hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{it.label}</p>
            <it.icon className={cn("h-3.5 w-3.5", it.tone)} />
          </div>
          <p className="mt-1 text-xl font-semibold tabular-nums">{it.value}</p>
        </div>
      ))}
    </div>
  );
}

/* ───────────────── Follow-Up Queues (LEFT) ───────────────── */

type QueueKey = "due_today" | "overdue" | "waiting_family" | "missing" | "assessment" | "final" | "vob";
const QUEUES: { key: QueueKey; label: string; match: (l: Lead) => boolean }[] = [
  { key: "due_today",      label: "Due Today",          match: (l) => (l.daysInStage ?? 0) === 1 },
  { key: "overdue",        label: "Overdue",            match: (l) => (l.daysInStage ?? 0) >= 3 },
  { key: "waiting_family", label: "Waiting on Family",  match: (l) => l.status === "Sent Form" || l.formStatus === "Sent" },
  { key: "missing",        label: "Missing Information",match: (l) => l.status === "Missing Information" || l.formReviewStatus === "Missing Information" },
  { key: "assessment",     label: "Assessment Coord.",  match: (l) => l.status === "Needs DX" || l.status === "Getting DX" },
  { key: "final",          label: "Final Attempts",     match: (l) => (l.status === "Can't Reach" || l.status === "Sent Packet - Can't Reach") && (l.daysInStage ?? 0) >= 5 },
  { key: "vob",            label: "Waiting on VOB",     match: (l) => l.status === "Sent to VOB" || l.vobStatus === "Sent" },
];

function FollowUpQueues({
  leads, active, onChange, onOpen,
}: { leads: Lead[]; active: string; onChange: (k: string) => void; onOpen: (id: string) => void }) {
  const counts = useMemo(() => Object.fromEntries(
    QUEUES.map((q) => [q.key, leads.filter(q.match).length]),
  ) as Record<QueueKey, number>, [leads]);

  const activeQ = QUEUES.find((q) => q.key === active) ?? QUEUES[0];
  const items = useMemo(() => leads.filter(activeQ.match).slice(0, 12), [leads, activeQ]);

  return (
    <aside className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold tracking-tight">Follow-Up Queues</h2>
        </div>
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Inbox</span>
      </div>

      <div className="flex flex-col">
        {QUEUES.map((q) => {
          const isActive = q.key === active;
          return (
            <button
              key={q.key}
              onClick={() => onChange(q.key)}
              className={cn(
                "flex items-center justify-between px-4 py-2.5 text-left text-sm transition border-l-2",
                isActive
                  ? "bg-primary/5 border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <span className={cn(isActive && "font-medium")}>{q.label}</span>
              <span className={cn("text-xs tabular-nums", isActive ? "text-foreground" : "text-muted-foreground/80")}>
                {counts[q.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-border/60 max-h-[420px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" />
            <p className="mt-2 text-xs text-muted-foreground">You're all caught up.</p>
          </div>
        ) : items.map((l) => (
          <button
            key={l.id}
            onClick={() => onOpen(l.id)}
            className="w-full text-left px-4 py-3 border-b border-border/40 last:border-b-0 hover:bg-muted/40 transition group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{l.parentName || l.childName}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {l.primaryInsurance || "—"} · {l.state || "—"}
                </p>
              </div>
              <span className={cn("h-1.5 w-1.5 mt-1.5 rounded-full shrink-0", urgencyDot[getUrgency(l)])} />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="truncate">{primaryBlocker(l)?.label ?? getReadinessStatus(l)}</span>
              <span className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-foreground">
                Open <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

/* ───────────────── Families Needing Attention (CENTER) ───────────────── */

function FamiliesNeedingAttention({
  leads, onOpen, onMarkPacketSent,
}: { leads: Lead[]; onOpen: (id: string) => void; onMarkPacketSent: (id: string) => void }) {
  const families = useMemo(() => {
    return leads
      .map((l) => ({ lead: l, blocker: primaryBlocker(l), urgency: getUrgency(l) }))
      .filter((x) => x.blocker)
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 } as const;
        return order[a.urgency] - order[b.urgency] || (b.lead.daysInStage ?? 0) - (a.lead.daysInStage ?? 0);
      })
      .slice(0, 8);
  }, [leads]);

  return (
    <section className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Families Needing Attention</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Blockers preventing service readiness — work top to bottom.</p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{families.length}</span>
      </div>

      {families.length === 0 ? (
        <div className="p-10 text-center">
          <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" />
          <p className="mt-2 text-sm text-muted-foreground">No active blockers. Families are moving.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {families.map(({ lead, blocker, urgency }) => (
            <div
              key={lead.id}
              className={cn(
                "px-5 py-4 hover:bg-muted/30 transition cursor-pointer group",
                urgency === "high" && "bg-red-50/30 dark:bg-red-950/10",
              )}
              onClick={() => onOpen(lead.id)}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0",
                  urgencyRing[urgency], "bg-muted/60",
                )}>
                  {initials(lead.parentName || lead.childName)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {lead.parentName || "—"}
                        <span className="text-muted-foreground font-normal"> · {lead.childName || "—"}</span>
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span>{lead.state || "—"}</span>
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                        <span className={cn("px-1.5 py-0.5 rounded-md", READINESS_TONE[getReadinessStatus(lead)])}>
                          {getReadinessStatus(lead)}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                        <span>{lead.daysInStage ?? 0}d waiting</span>
                        {lead.owner && (<>
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                          <span>{lead.owner}</span>
                        </>)}
                      </div>
                    </div>
                    <span className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", urgencyDot[urgency])} />
                  </div>

                  {blocker && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      <span className="font-medium">{blocker.label}</span>
                      <span className="text-muted-foreground">— {blocker.reason}</span>
                    </div>
                  )}

                  <div
                    className="mt-3 flex flex-wrap items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconAction icon={Phone} label="Call" onClick={() => toast(`Calling ${lead.parentName}…`)} />
                    <IconAction icon={MessageSquare} label="Text" onClick={() => toast("Text drafted")} />
                    <IconAction icon={Mail} label="Email" onClick={() => toast("Email drafted")} />
                    <IconAction icon={Send} label="Send packet" onClick={() => onMarkPacketSent(lead.id)} />
                    <IconAction icon={StickyNote} label="Note" onClick={() => toast("Note added")} />
                    <IconAction icon={AlertTriangle} label="Escalate" onClick={() => toast.error("Escalated to lead")} />
                    <button
                      onClick={() => onOpen(lead.id)}
                      className="ml-auto text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      Open lead <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function IconAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

/* ───────────────── Readiness Blockers ───────────────── */

function ReadinessBlockers({ leads, onOpen }: { leads: Lead[]; onOpen: (id: string) => void }) {
  const blockers = useMemo(() => {
    const map = new Map<string, { label: string; reason: string; items: Lead[] }>();
    leads.forEach((l) => {
      getBlockers(l).forEach((b) => {
        const entry = map.get(b.key) ?? { label: b.label, reason: b.reason, items: [] };
        entry.items.push(l);
        map.set(b.key, entry);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length).slice(0, 6);
  }, [leads]);

  if (blockers.length === 0) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-base font-semibold tracking-tight">Readiness Blockers</h2>
        <p className="text-xs text-muted-foreground">What is preventing services</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {blockers.map((b) => (
          <div key={b.label} className="rounded-2xl border border-border/60 bg-card p-4 hover:shadow-sm transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FileWarning className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-medium">{b.label}</p>
              </div>
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">{b.items.length}</span>
            </div>
            <div className="mt-3 space-y-1.5">
              {b.items.slice(0, 3).map((l) => (
                <button
                  key={l.id}
                  onClick={() => onOpen(l.id)}
                  className="w-full flex items-center justify-between text-left text-xs text-muted-foreground hover:text-foreground group"
                >
                  <span className="truncate">{l.parentName || l.childName}</span>
                  <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
              {b.items.length > 3 && (
                <p className="text-[11px] text-muted-foreground/70">+{b.items.length - 3} more</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────── Assessment Coordination ───────────────── */

function AssessmentCoordination({ leads, onOpen }: { leads: Lead[]; onOpen: (id: string) => void }) {
  const cols = useMemo(() => {
    const dx = leads.filter((l) => l.status === "Needs DX" || l.status === "Getting DX");
    return [
      { key: "needs", label: "Needs Assessment", tone: "text-sky-600", items: dx.filter((l) => l.status === "Needs DX") },
      { key: "scheduled", label: "Scheduled", tone: "text-violet-600", items: dx.filter((l) => l.status === "Getting DX") },
      { key: "waiting", label: "Waiting on Family", tone: "text-amber-600", items: dx.filter((l) => (l.daysInStage ?? 0) >= 3) },
    ];
  }, [leads]);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-base font-semibold tracking-tight">Assessment Coordination</h2>
        <p className="text-xs text-muted-foreground">Initial assessments by stage</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {cols.map((c) => (
          <div key={c.key} className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CircleDot className={cn("h-3.5 w-3.5", c.tone)} />
                <p className="text-sm font-medium">{c.label}</p>
              </div>
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">{c.items.length}</span>
            </div>
            <div className="mt-3 space-y-2">
              {c.items.length === 0 && (
                <p className="text-[11px] text-muted-foreground/70">Nothing here.</p>
              )}
              {c.items.slice(0, 4).map((l) => (
                <button
                  key={l.id}
                  onClick={() => onOpen(l.id)}
                  className="w-full flex items-center justify-between text-left hover:bg-muted/40 rounded-lg px-2 py-1.5 -mx-1"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{l.parentName || l.childName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{l.state} · {l.daysInStage ?? 0}d</p>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────── Service Readiness Pipeline ───────────────── */

function ServiceReadinessPipeline({ leads, onOpen }: { leads: Lead[]; onOpen: (id: string) => void }) {
  const stages = useMemo(() =>
    READINESS_STAGES.slice(0, 10).map((s) => ({
      ...s,
      items: leads.filter(s.match),
    })),
  [leads]);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-base font-semibold tracking-tight">Service Readiness Pipeline</h2>
        <p className="text-xs text-muted-foreground">Inquiry → ready for setup</p>
      </div>
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-3 min-w-max pb-2">
          {stages.map((s) => (
            <div key={s.key} className="w-[180px] shrink-0 rounded-xl border border-border/60 bg-card p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">{s.label}</p>
                <span className="text-xs font-semibold tabular-nums">{s.items.length}</span>
              </div>
              <div className="mt-2 space-y-1">
                {s.items.slice(0, 3).map((l) => (
                  <button
                    key={l.id}
                    onClick={() => onOpen(l.id)}
                    className="w-full text-left text-[11px] hover:bg-muted/40 rounded-md px-1.5 py-1 truncate"
                  >
                    {l.parentName || l.childName}
                  </button>
                ))}
                {s.items.length > 3 && (
                  <p className="text-[10px] text-muted-foreground/70 px-1.5">+{s.items.length - 3}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────── Recent Communication ───────────────── */

function RecentCommunication({ leads, onOpen }: { leads: Lead[]; onOpen: (id: string) => void }) {
  const events = useMemo(() => {
    return leads
      .filter((l) => l.lastContacted)
      .sort((a, b) => new Date(b.lastContacted!).getTime() - new Date(a.lastContacted!).getTime())
      .slice(0, 10);
  }, [leads]);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-base font-semibold tracking-tight">Recent Communication</h2>
        <p className="text-xs text-muted-foreground">Latest touchpoints across families</p>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card divide-y divide-border/50">
        {events.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No recent activity.</div>
        ) : events.map((l) => (
          <button
            key={l.id}
            onClick={() => onOpen(l.id)}
            className="w-full px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition text-left"
          >
            <div className="h-7 w-7 rounded-full bg-muted/60 flex items-center justify-center text-[10px] font-medium">
              {initials(l.parentName || l.childName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate">
                <span className="font-medium">{l.parentName || l.childName}</span>
                <span className="text-muted-foreground"> — {getReadinessStatus(l)}</span>
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {l.primaryInsurance || "—"} · {l.state || "—"}
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{relTime(l.lastContacted)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ───────────────── Ask Blossom Rail ───────────────── */

function AskBlossomRail({ leads, onOpen }: { leads: Lead[]; onOpen: (id: string) => void }) {
  const priorities = useMemo(() => {
    return leads
      .filter((l) => primaryBlocker(l))
      .sort((a, b) => (b.daysInStage ?? 0) - (a.daysInStage ?? 0))
      .slice(0, 4);
  }, [leads]);

  const insights = [
    { icon: FileWarning, text: "Forms are the largest blocker today.", tone: "text-amber-600" },
    { icon: ShieldCheck, text: "Families are stalling at VOB.", tone: "text-violet-600" },
    { icon: CalendarClock, text: "Assessment coordination delays increasing.", tone: "text-orange-600" },
  ];

  const prompts = [
    "Summarize today's priorities.",
    "Which families are stuck?",
    "Find missing documents.",
    "Draft a follow-up message.",
    "What's preventing readiness?",
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 p-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Ask Blossom</p>
            <p className="text-[11px] text-muted-foreground">Your intake copilot</p>
          </div>
        </div>
        <button
          onClick={() => toast("Ask Blossom — coming soon")}
          className="mt-3 w-full text-left text-xs text-muted-foreground rounded-lg border border-border/60 bg-background/60 hover:bg-background px-3 py-2 transition"
        >
          Ask anything about your families…
        </button>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => toast(`Ask Blossom: "${p}"`)}
              className="text-[10px] px-2 py-1 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Priorities */}
      <div>
        <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 px-1">Today's Priorities</h3>
        <div className="space-y-2">
          {priorities.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card p-4 text-center text-xs text-muted-foreground">
              No urgent priorities.
            </div>
          ) : priorities.map((l) => {
            const b = primaryBlocker(l);
            return (
              <button
                key={l.id}
                onClick={() => onOpen(l.id)}
                className="w-full text-left rounded-xl border border-border/60 bg-card p-3 hover:shadow-sm transition group"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium truncate">{l.parentName || l.childName}</p>
                  <span className={cn("h-1.5 w-1.5 mt-1.5 rounded-full shrink-0", urgencyDot[getUrgency(l)])} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{b?.label ?? "Needs attention"}</p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{l.state} · {l.daysInStage ?? 0}d</span>
                  <span className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                    Open <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <div>
        <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 px-1">Insights</h3>
        <div className="space-y-1.5">
          {insights.map((i) => (
            <div key={i.text} className="flex items-start gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5">
              <i.icon className={cn("h-3.5 w-3.5 mt-0.5", i.tone)} />
              <p className="text-xs leading-relaxed">{i.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 px-1">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-1.5">
          <QuickAction icon={Plus} label="Add Inquiry" onClick={() => toast("Add Inquiry")} />
          <QuickAction icon={Send} label="Send Packet" onClick={() => toast("Send Packet")} />
          <QuickAction icon={CalendarClock} label="Follow-Up" onClick={() => toast("Follow-Up created")} />
          <QuickAction icon={ShieldCheck} label="VOB Center" to="/vob-decision-center" />
          <QuickAction icon={StickyNote} label="Add Note" onClick={() => toast("Note added")} />
          <QuickAction icon={BookOpen} label="Open SOP" onClick={() => toast("SOP opened")} />
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon, label, onClick, to,
}: { icon: any; label: string; onClick?: () => void; to?: string }) {
  const inner = (
    <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card hover:bg-muted/40 px-2.5 py-2 text-xs transition">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="truncate">{label}</span>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : <button onClick={onClick} className="text-left">{inner}</button>;
}
