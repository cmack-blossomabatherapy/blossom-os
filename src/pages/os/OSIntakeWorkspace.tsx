import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search, Plus, Phone, Mail, Send, ShieldCheck, AlertCircle, FileCheck2,
  ClipboardList, StickyNote, RefreshCw, ChevronLeft, CheckCircle2, Clock,
  Users, FileWarning, ArrowRight, MapPin, Sparkles,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useLeads } from "@/contexts/LeadsContext";
import { useAuth } from "@/contexts/AuthContext";
import { scopeLeadsForUser } from "@/lib/leads/scoping";
import { supabase } from "@/integrations/supabase/client";
import { IntakeModalsProvider, useIntakeModals } from "@/components/intake/IntakeModals";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/data/leads";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/* ──────────────────────────── helpers ──────────────────────────── */

function relTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const m = 60_000, h = 3_600_000, day = 86_400_000;
  if (diff < m) return "just now";
  if (diff < h) return `${Math.round(diff / m)}m ago`;
  if (diff < day) return `${Math.round(diff / h)}h ago`;
  if (diff < 30 * day) return `${Math.round(diff / day)}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

type AgeBucket = "fresh" | "waiting" | "overdue";
function agingFor(lead: Lead): AgeBucket {
  const days = lead.daysInStage ?? 0;
  if (days <= 1) return "fresh";
  if (days <= 4) return "waiting";
  return "overdue";
}
const ageDot: Record<AgeBucket, string> = {
  fresh: "bg-emerald-500",
  waiting: "bg-amber-500",
  overdue: "bg-red-500",
};
const ageLabel: Record<AgeBucket, string> = {
  fresh: "Fresh",
  waiting: "Waiting",
  overdue: "Overdue",
};

/* ──────────────────────────── tabs ──────────────────────────── */

type TabKey =
  | "all" | "needs_contact" | "in_contact" | "sent_form" | "form_received"
  | "missing_info" | "sent_vob" | "vob_completed" | "stuck" | "completed_today";

const TAB_DEFS: { key: TabKey; label: string; match: (l: Lead) => boolean }[] = [
  { key: "all",             label: "All",              match: () => true },
  { key: "needs_contact",   label: "Needs Contact",    match: (l) => l.status === "New Lead" || l.status === "Can't Reach" },
  { key: "in_contact",      label: "In Contact",       match: (l) => l.status === "In Contact" },
  { key: "sent_form",       label: "Sent Form",        match: (l) => l.status === "Sent Form" || l.formStatus === "Sent" || l.formStatus === "Viewed" },
  { key: "form_received",   label: "Form Received",    match: (l) => l.status === "Form Received" || l.formStatus === "Complete" || l.formStatus === "Completed" },
  { key: "missing_info",    label: "Missing Info",     match: (l) => l.status === "Missing Information" || l.formReviewStatus === "Missing Info" || l.formReviewStatus === "Missing Information" },
  { key: "sent_vob",        label: "Sent to VOB",      match: (l) => l.status === "Sent to VOB" || l.vobStatus === "Sent" },
  { key: "vob_completed",   label: "VOB Completed",    match: (l) => l.status === "VOB Completed" || l.vobStatus === "Received" || l.vobStatus === "Approved" },
  { key: "stuck",           label: "Stuck",            match: (l) => (l.daysInStage ?? 0) >= 5 },
  { key: "completed_today", label: "Completed Today",  match: (l) => l.vobStatus === "Approved" && (l.daysInStage ?? 0) === 0 },
];

/* ──────────────────────────── pipeline ──────────────────────────── */

const PIPELINE: { key: string; label: string; match: (l: Lead) => boolean }[] = [
  { key: "new",        label: "New Lead",        match: (l) => l.status === "New Lead" },
  { key: "contacted",  label: "Contacted",       match: (l) => l.status === "In Contact" },
  { key: "formsSent",  label: "Forms Sent",      match: (l) => l.status === "Sent Form" },
  { key: "formsRecv",  label: "Forms Received",  match: (l) => l.status === "Form Received" },
  { key: "vobSent",    label: "VOB Sent",        match: (l) => l.status === "Sent to VOB" },
  { key: "vobDone",    label: "VOB Completed",   match: (l) => l.status === "VOB Completed" },
  { key: "client",     label: "Client Created",  match: (l) => l.vobStatus === "Approved" && !!l.paymentPlanSigned },
];

function currentPipelineIndex(lead: Lead) {
  // last stage matched, fallback to 0
  let idx = 0;
  PIPELINE.forEach((s, i) => { if (s.match(lead)) idx = i; });
  return idx;
}

/* ──────────────────────────── next-best-action ──────────────────────────── */

function nextBestAction(lead: Lead): { label: string; tone: "primary" | "warning" } {
  if (lead.status === "New Lead" || lead.status === "Can't Reach") return { label: "Log First Contact Attempt", tone: "primary" };
  if (lead.status === "In Contact" && lead.formStatus === "Not Sent") return { label: "Send Intake Form", tone: "primary" };
  if (lead.formStatus === "Sent" || lead.formStatus === "Viewed") return { label: "Follow Up on Intake Form", tone: "warning" };
  if (lead.formReviewStatus === "Missing Info" || lead.formReviewStatus === "Missing Information") return { label: "Request Missing Information", tone: "warning" };
  if (lead.status === "Form Received") return { label: "Review Intake Packet", tone: "primary" };
  if (lead.formReviewStatus === "Complete" && lead.vobStatus === "Not Started") return { label: "Send to VOB", tone: "primary" };
  if (lead.vobStatus === "Sent") return { label: "Awaiting VOB", tone: "warning" };
  if (lead.vobStatus === "Received" || lead.vobStatus === "Approved") return { label: "Move to Client Pipeline", tone: "primary" };
  return { label: "Review Lead", tone: "primary" };
}

/* ──────────────────────────── page ──────────────────────────── */

export default function OSIntakeWorkspace() {
  return (
    <IntakeModalsProvider>
      <WorkspaceInner />
    </IntakeModalsProvider>
  );
}

function WorkspaceInner() {
  const { leads, loading, error, refresh } = useLeads();
  const { user, roles } = useAuth();
  const modals = useIntakeModals();
  const [profileState, setProfileState] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();

  const tab = (params.get("tab") as TabKey) || "all";
  const query = params.get("q") ?? "";
  const selectedId = params.get("lead");

  const setTab = (t: TabKey) => { const n = new URLSearchParams(params); n.set("tab", t); setParams(n, { replace: true }); };
  const setQuery = (q: string) => { const n = new URLSearchParams(params); if (q) n.set("q", q); else n.delete("q"); setParams(n, { replace: true }); };
  const setSelected = (id: string | null) => { const n = new URLSearchParams(params); if (id) n.set("lead", id); else n.delete("lead"); setParams(n, { replace: true }); };

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

  const tabbed = useMemo(() => {
    const def = TAB_DEFS.find((t) => t.key === tab) ?? TAB_DEFS[0];
    return scoped.filter(def.match);
  }, [scoped, tab]);

  const searched = useMemo(() => {
    if (!query.trim()) return tabbed;
    const q = query.toLowerCase();
    return tabbed.filter((l) =>
      l.childName?.toLowerCase().includes(q) ||
      l.parentName?.toLowerCase().includes(q) ||
      l.phone?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.state?.toLowerCase().includes(q),
    );
  }, [tabbed, query]);

  // sort: overdue first, then waiting, then fresh; within each, recently updated first
  const sorted = useMemo(() => {
    const rank: Record<AgeBucket, number> = { overdue: 0, waiting: 1, fresh: 2 };
    return [...searched].sort((a, b) => {
      const r = rank[agingFor(a)] - rank[agingFor(b)];
      if (r !== 0) return r;
      return (new Date(b.updatedAt ?? 0).getTime()) - (new Date(a.updatedAt ?? 0).getTime());
    });
  }, [searched]);

  const selected = useMemo(() => scoped.find((l) => l.id === selectedId) ?? null, [scoped, selectedId]);

  // Auto-select first item when nothing selected and we have results
  useEffect(() => {
    if (!selectedId && sorted.length > 0) setSelected(sorted[0].id);
    if (selectedId && !scoped.find((l) => l.id === selectedId)) setSelected(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted, selectedId]);

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <OSShell>
      <div className="flex flex-col min-h-[calc(100vh-8rem)] -mx-4 md:-mx-6 lg:-mx-8 -my-5 bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <header className="px-6 pt-6 pb-4 border-b border-border bg-background">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Intake Workspace</h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  Intake Coordinator
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and move families through the intake process · {today}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search families, phone, state…"
                  className="h-10 w-72 pl-9 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <Button size="sm" variant="outline" onClick={() => refresh()} title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={() => modals.open({ kind: "addLead" })}>
                <Plus className="h-4 w-4 mr-1.5" /> Add Lead
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex items-center gap-1 overflow-x-auto -mx-1 px-1 pb-1">
            {TAB_DEFS.map((t) => {
              const count = scoped.filter(t.match).length;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "h-8 px-3 rounded-full text-[13px] font-medium transition whitespace-nowrap flex items-center gap-1.5",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  {t.label}
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold",
                    active ? "bg-background/20 text-background" : "bg-muted text-muted-foreground",
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        {/* Split layout */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] max-h-[calc(100vh-10rem)]">
          {/* LEFT: Lead queue */}
          <aside className={cn(
            "border-r border-border bg-muted/30 overflow-y-auto",
            selected && "hidden lg:block",
          )}>
            {loading && <QueueSkeleton />}
            {!loading && error && (
              <div className="p-6 text-center">
                <p className="text-sm text-foreground mb-3">We couldn't load intake data.</p>
                <Button size="sm" variant="outline" onClick={() => refresh()}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
                </Button>
              </div>
            )}
            {!loading && !error && sorted.length === 0 && (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-emerald-100 grid place-items-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-foreground">You're all caught up</p>
                <p className="text-xs text-muted-foreground mt-1">No families match this view.</p>
              </div>
            )}
            {!loading && !error && sorted.length > 0 && (
              <ul className="divide-y divide-border">
                {sorted.map((l) => {
                  const bucket = agingFor(l);
                  const isSel = l.id === selectedId;
                  return (
                    <li key={l.id}>
                      <button
                        onClick={() => setSelected(l.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 transition flex gap-3 items-start",
                          isSel ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted border-l-2 border-l-transparent",
                        )}
                      >
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary text-xs font-semibold grid place-items-center shrink-0">
                          {initials(l.childName || l.parentName || "?")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{l.childName || "Unnamed"}</p>
                            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", ageDot[bucket])} title={ageLabel[bucket]} />
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {l.parentName || "—"} · {l.state || "—"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">
                              {l.status}
                            </span>
                            {(l.formReviewStatus === "Missing Info" || l.formReviewStatus === "Missing Information") && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                Missing info
                              </span>
                            )}
                            <span className="ml-auto text-[10px] text-muted-foreground">
                              {l.daysInStage ?? 0}d
                            </span>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {/* RIGHT: Lead detail workspace */}
          <section className={cn(
            "overflow-y-auto bg-background",
            !selected && "hidden lg:block",
          )}>
            {!selected ? (
              <EmptyDetail />
            ) : (
              <LeadDetailWorkspace
                lead={selected}
                onBack={() => setSelected(null)}
              />
            )}
          </section>
        </div>
      </div>
    </OSShell>
  );
}

/* ──────────────────────────── detail workspace ──────────────────────────── */

function LeadDetailWorkspace({ lead, onBack }: { lead: Lead; onBack: () => void }) {
  const { updateLead } = useLeads();
  const modals = useIntakeModals();
  const nba = nextBestAction(lead);
  const pipeIdx = currentPipelineIndex(lead);

  // Direct tel:/mailto: handoffs have been removed for Intake — communication
  // actions route through the Intake communications adapter. Kept as undefined
  // so any remaining downstream reference is a no-op anchor.
  const callTo = undefined;
  const mailTo = undefined;

  const missing = (lead.formReviewStatus === "Missing Info" || lead.formReviewStatus === "Missing Information");

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Back button mobile */}
      <button
        onClick={onBack}
        className="lg:hidden flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to queue
      </button>

      {/* Summary card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary text-base font-semibold grid place-items-center shrink-0">
            {initials(lead.childName || lead.parentName || "?")}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-foreground truncate">{lead.childName || "Unnamed family"}</h2>
            <p className="text-sm text-muted-foreground truncate">
              Parent: {lead.parentName || "—"} · <MapPin className="inline h-3 w-3 -mt-0.5" /> {lead.state || "—"} · Assigned to {lead.owner || "Unassigned"}
            </p>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Badge tone="neutral">{lead.status}</Badge>
              <Badge tone="neutral">Form: {lead.formStatus}</Badge>
              <Badge tone="neutral">VOB: {lead.vobStatus}</Badge>
              <Badge tone={agingFor(lead) === "overdue" ? "danger" : agingFor(lead) === "waiting" ? "warning" : "success"}>
                {lead.daysInStage ?? 0}d in stage
              </Badge>
            </div>
          </div>
        </div>

        {/* Next best action */}
        <div className={cn(
          "mt-5 rounded-xl border p-4 flex items-center justify-between gap-3",
          nba.tone === "warning" ? "border-amber-200 bg-amber-50" : "border-primary/20 bg-primary/5",
        )}>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground">Recommended next step</p>
            <p className="text-sm font-semibold text-foreground truncate">{nba.label}</p>
          </div>
          <Sparkles className={cn("h-5 w-5 shrink-0", nba.tone === "warning" ? "text-amber-600" : "text-primary")} />
        </div>
      </div>

      {/* Pipeline tracker */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground mb-3">Workflow progress</p>
        <ol className="flex items-center gap-1 overflow-x-auto pb-1">
          {PIPELINE.map((s, i) => {
            const done = i < pipeIdx;
            const active = i === pipeIdx;
            return (
              <li key={s.key} className="flex items-center gap-1 shrink-0">
                <div className={cn(
                  "flex items-center gap-2 h-8 px-3 rounded-full text-xs font-medium whitespace-nowrap",
                  active ? "bg-primary text-primary-foreground" :
                  done ? "bg-emerald-100 text-emerald-700" :
                  "bg-muted text-muted-foreground",
                )}>
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
                  {s.label}
                </div>
                {i < PIPELINE.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Two-col details */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Contact */}
        <Card title="Contact information">
          <Row label="Phone" value={lead.phone} />
          <Row label="Email" value={lead.email} />
          <Row label="Preferred contact" value={(lead as any).preferredContact || "—"} />
          <Row label="Last activity" value={relTime(lead.updatedAt)} />
          <div className="pt-3 flex gap-2">
            <a href={callTo} className={cn("flex-1 h-9 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium flex items-center justify-center gap-1.5 transition", !callTo && "opacity-50 pointer-events-none")}>
              <Phone className="h-3.5 w-3.5" /> Call
            </a>
            <a href={mailTo} className={cn("flex-1 h-9 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium flex items-center justify-center gap-1.5 transition", !mailTo && "opacity-50 pointer-events-none")}>
              <Mail className="h-3.5 w-3.5" /> Email
            </a>
          </div>
        </Card>

        {/* Insurance / VOB */}
        <Card title="Insurance & VOB">
          <Row label="Primary insurance" value={lead.primaryInsurance || lead.insurance} />
          <Row label="Network" value={lead.inNetwork ? "In-network" : "Out-of-network"} />
          <Row label="VOB status" value={lead.vobStatus} />
          <Row label="Payment plan" value={lead.paymentPlanNeeded ? "Required" : "Not required"} />
        </Card>
      </div>

      {/* Missing info */}
      {missing && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <FileWarning className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">Missing information requested</p>
              <p className="text-sm text-amber-800 mt-1">
                This family has incomplete intake details. Reach out to collect what's needed before sending to VOB.
              </p>
              <Button size="sm" variant="outline" className="mt-3 bg-white" onClick={() => modals.open({ kind: "comm", lead, channel: "email" })}>
                Request missing info
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks */}
      <Card title="Intake tasks">
        {(lead.tasks ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No active tasks.</p>
        ) : (
          <ul className="divide-y divide-border -my-3">
            {(lead.tasks ?? []).slice(0, 6).map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <button
                  onClick={() => updateLead(lead.id, { tasks: (lead.tasks ?? []).map((x) => x.id === t.id ? { ...x, completed: !x.completed } : x) })}
                  className={cn("h-5 w-5 rounded-md border grid place-items-center shrink-0",
                    t.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-border bg-background hover:border-primary")}
                >
                  {t.completed && <CheckCircle2 className="h-3 w-3" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", t.completed && "line-through text-muted-foreground")}>{t.title}</p>
                  <p className="text-[11px] text-muted-foreground">{t.owner || "Unassigned"}{t.dueDate ? ` · due ${t.dueDate}` : ""}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Timeline */}
      <Card title="Timeline">
        {(lead.timeline ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No activity yet.</p>
        ) : (
          <ul className="space-y-3 -my-1">
            {(lead.timeline ?? []).slice(0, 8).map((e) => (
              <li key={e.id} className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground grid place-items-center shrink-0">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{e.description}</p>
                  <p className="text-[11px] text-muted-foreground">{relTime(e.timestamp)}{e.user ? ` · ${e.user}` : ""}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Sticky action bar (mobile-friendly) */}
      <div className="sticky bottom-0 -mx-6 px-6 py-3 bg-background/95 backdrop-blur border-t border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <ActionBtn icon={Phone} label="Call Parent" onClick={() => modals.open({ kind: "comm", lead, channel: "call" })} />
          <ActionBtn icon={Send} label="Send form" onClick={() => { updateLead(lead.id, { formStatus: "Sent" }); toast.success("Intake form sent"); }} />
          <ActionBtn icon={AlertCircle} label="Missing info" onClick={() => { updateLead(lead.id, { formReviewStatus: "Missing Information" }); toast("Marked missing info"); }} />
          <ActionBtn icon={ShieldCheck} label="Send to VOB" onClick={() => { updateLead(lead.id, { status: "Sent to VOB" }); toast.success("Sent to VOB"); }} />
          <ActionBtn icon={StickyNote} label="Add note" onClick={() => modals.open({ kind: "note", lead })} className="md:col-span-1" />
          <ActionBtn icon={FileCheck2} label="Send consent" onClick={() => { updateLead(lead.id, { consentStatus: "Sent" }); toast.success("Consent sent"); }} />
          <ActionBtn icon={ClipboardList} label="Follow-up" onClick={() => modals.open({ kind: "followUp", lead })} />
          <ActionBtn icon={Users} label="Open record" onClick={() => window.open(`/leads/${lead.id}`, "_self")} />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── primitives ──────────────────────────── */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium truncate text-right">{value || "—"}</span>
    </div>
  );
}

function Badge({ tone = "neutral", children }: { tone?: "neutral" | "success" | "warning" | "danger"; children: React.ReactNode }) {
  const cls =
    tone === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    tone === "warning" ? "bg-amber-50 text-amber-700 border-amber-200" :
    tone === "danger"  ? "bg-red-50 text-red-700 border-red-200" :
    "bg-muted text-foreground border-border";
  return <span className={cn("text-[11px] px-2 py-0.5 rounded-full border font-medium", cls)}>{children}</span>;
}

function ActionBtn({ icon: Icon, label, onClick, className }: { icon: any; label: string; onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-10 rounded-lg border border-border bg-background hover:bg-muted hover:border-primary/40 text-sm font-medium flex items-center justify-center gap-1.5 transition",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function QueueSkeleton() {
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="px-4 py-3 flex gap-3 items-start">
          <div className="h-9 w-9 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            <div className="h-2.5 w-48 bg-muted rounded animate-pulse" />
            <div className="h-2.5 w-24 bg-muted rounded animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyDetail() {
  return (
    <div className="h-full grid place-items-center p-10">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-primary/10 grid place-items-center">
          <Users className="h-7 w-7 text-primary" />
        </div>
        <p className="text-base font-semibold text-foreground">Select a family</p>
        <p className="text-sm text-muted-foreground mt-1">
          Pick a lead from the queue on the left to start working. We'll surface the next step automatically.
        </p>
      </div>
    </div>
  );
}
