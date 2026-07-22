import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare, Sparkles, Search, Plus, Send, CheckCircle2, Megaphone,
  ChevronRight, X, Clock, AlertCircle, BellRing, ShieldAlert, GraduationCap,
  UserCheck, Flag, ListChecks, CalendarClock, Mail, ArrowRight, Pin,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { HRIntegrationStatusStrip } from "@/components/hr/HRIntegrationStatusStrip";
import {
  IntegrationReadinessPanel,
  useIntegrationRouteAvailability,
  type OnboardingReadinessRow,
} from "@/components/hr/IntegrationReadinessPanel";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { queueHrMessage, type HrMessageChannel } from "@/lib/hr/activityEvents";
import { HRMessageHistory } from "@/components/hr/HRMessageHistory";

/* ---------------- types ---------------- */
interface Employee {
  id: string; first_name: string; last_name: string; job_title: string;
  state: string; status: string; start_date: string | null;
}
interface Case {
  id: string; employee_id: string; case_type: string; status: string; priority: string;
  title: string; summary: string | null; owner_role: string | null; due_date: string | null;
  opened_at: string; closed_at: string | null; updated_at: string;
}
interface Onboarding extends OnboardingReadinessRow {
  id: string;
  employee_id: string;
  status: string;
  blockers: string[] | null;
}
interface Training { id: string; employee_id: string; status: string; due_date: string | null; course_id: string | null; }
interface Announcement {
  id: string; title: string; body: string; priority: string; audience: string;
  audience_states: string[]; audience_roles: string[];
  pinned: boolean; publish_at: string; expires_at: string | null;
  author_name: string | null; created_at: string;
}
interface OrientationSlot {
  id: string; candidate_id: string | null; scheduled_date: string | null;
  scheduled_time: string | null; status: string | null; format: string | null;
}
interface Candidate {
  id: string; first_name: string; last_name: string; role: string;
  state: string; pipeline_stage: string;
}

/* ---------------- atoms ---------------- */
type Tone = "ok" | "warn" | "crit" | "muted" | "info";

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn(
      "rounded-2xl border border-border/70 bg-card",
      "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]",
      className,
    )}>{children}</div>
  );
}
function Pill({ tone = "muted", children }: { tone?: Tone; children: React.ReactNode }) {
  const cls =
    tone === "crit" ? "bg-destructive/10 text-destructive border-destructive/20"
    : tone === "warn" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
    : tone === "ok"   ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
    : tone === "info" ? "bg-primary/10 text-primary border-primary/20"
    : "bg-muted text-muted-foreground border-border/70";
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", cls)}>{children}</span>;
}
function Empty({ icon: Icon, title, hint }: { icon: React.ElementType; title: string; hint?: string }) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto mb-3 h-10 w-10 rounded-2xl bg-muted grid place-items-center">
        <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium tracking-tight">{title}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
function Kpi({ label, value, tone = "muted", hint, onClick, active }: { label: string; value: string | number; tone?: Tone; hint?: string; onClick?: () => void; active?: boolean }) {
  const accent =
    tone === "crit" ? "text-destructive"
    : tone === "warn" ? "text-amber-700 dark:text-amber-400"
    : tone === "ok" ? "text-emerald-700 dark:text-emerald-400"
    : "text-foreground";
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left rounded-2xl border bg-card p-4 transition-all",
        "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]",
        active ? "border-primary/40 ring-1 ring-primary/20" : "border-border/70 hover:-translate-y-0.5",
      )}
    >
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-semibold tracking-tight mt-1 tabular-nums", accent)}>{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </button>
  );
}
function HeaderBtn({ icon: Icon, children, primary, to = "#" }: { icon: React.ElementType; children: React.ReactNode; primary?: boolean; to?: string }) {
  const cls = primary
    ? "bg-primary text-primary-foreground hover:opacity-90"
    : "text-foreground border border-border/70 bg-card hover:bg-muted";
  return (
    <Link to={to} className={cn("inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] transition-colors", cls)}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {children}
    </Link>
  );
}
function QuickAction({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick?: () => void }) {
  const disabled = !onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Not available" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
        disabled && "opacity-50 cursor-not-allowed hover:text-muted-foreground hover:bg-transparent",
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {label}
    </button>
  );
}

/* ---------------- helpers ---------------- */
const CASE_CATEGORY: Record<string, string> = {
  onboarding_blocker: "Onboarding",
  training_issue: "Training",
  manager_escalation: "Escalation",
  documentation_needed: "Documentation",
  access_issue: "Readiness",
  hr_question: "Employee support",
  attendance_issue: "Employee support",
  benefit_question: "Employee support",
  policy_acknowledgment: "Operational",
  disciplinary_concern: "Evaluation",
  offboarding_case: "Operational",
  payroll_issue: "Employee support",
};
function caseStatusLabel(s: string) {
  if (s === "new") return "Active";
  if (s === "open") return "Active";
  if (s.startsWith("waiting_employee")) return "Waiting on employee";
  if (s.startsWith("waiting")) return "Follow-up needed";
  if (s === "resolved" || s === "closed") return "Resolved";
  return s;
}
function caseStatusTone(s: string, priority: string): Tone {
  if (s === "resolved" || s === "closed") return "ok";
  if (priority === "urgent") return "crit";
  if (s === "waiting_employee") return "warn";
  if (s.startsWith("waiting")) return "muted";
  return "info";
}
function annTone(p: string): Tone {
  if (p === "critical") return "crit";
  if (p === "warning" || p === "high") return "warn";
  if (p === "info") return "info";
  return "muted";
}
function fmtDate(d: string | null) {
  if (!d) return "—";
  try { return new Date(d + (d.length === 10 ? "T00:00:00" : "")).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
  catch { return d; }
}
function relTime(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "1d ago";
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}
function initials(f: string, l: string) {
  return `${(f?.[0] ?? "").toUpperCase()}${(l?.[0] ?? "").toUpperCase()}`;
}

/* ---------------- data ---------------- */
function useData() {
  const [s, set] = useState({
    employees: [] as Employee[],
    cases: [] as Case[],
    onboarding: [] as Onboarding[],
    trainings: [] as Training[],
    announcements: [] as Announcement[],
    slots: [] as OrientationSlot[],
    candidates: [] as Candidate[],
    loading: true,
  });
  useEffect(() => {
    let cancel = false;
    (async () => {
      const [e, c, o, t, a, s2, cd] = await Promise.all([
        supabase.from("employees").select("id,first_name,last_name,job_title,state,status,start_date").order("last_name"),
        supabase.from("employee_cases").select("*").order("updated_at", { ascending: false }),
        supabase.from("employee_onboarding").select("id,employee_id,status,blockers,viventium_status,viventium_synced_at,viventium_notes,stellar_status,stellar_synced_at,stellar_notes,centralreach_status,centralreach_synced_at,centralreach_notes"),
        supabase.from("employee_trainings").select("id,employee_id,status,due_date,course_id"),
        supabase.from("hr_announcements").select("*").order("publish_at", { ascending: false }).limit(20),
        supabase.from("recruiting_orientation_slots").select("id,candidate_id,scheduled_date,scheduled_time,status,format").order("scheduled_date", { ascending: true }),
        supabase.from("recruiting_candidates").select("id,first_name,last_name,role,state,pipeline_stage"),
      ]);
      if (cancel) return;
      set({
        employees: (e.data ?? []) as Employee[],
        cases: (c.data ?? []) as Case[],
        onboarding: (o.data ?? []) as Onboarding[],
        trainings: (t.data ?? []) as Training[],
        announcements: (a.data ?? []) as Announcement[],
        slots: (s2.data ?? []) as OrientationSlot[],
        candidates: (cd.data ?? []) as Candidate[],
        loading: false,
      });
    })();
    return () => { cancel = true; };
  }, []);
  return s;
}

/* ---------------- conversation derivation ----------------
 * Conversations are derived from employee_cases. Each case = one thread.
 * Categories map to operational filters; statuses mirror the spec.
 */
type Conv = {
  id: string; empId: string; who: string; role: string; state: string;
  category: string; preview: string; status: string; statusTone: Tone;
  priority: string; owner: string; lastAt: string; unread: boolean;
  raw: Case;
};

type Tab = "all" | "onboarding" | "orientation" | "training" | "support" | "certifications" | "readiness" | "evaluations" | "escalations";

const TAB_DEF: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "onboarding", label: "Onboarding" },
  { id: "orientation", label: "Orientation" },
  { id: "training", label: "Training" },
  { id: "certifications", label: "Certifications" },
  { id: "readiness", label: "Readiness" },
  { id: "support", label: "Employee support" },
  { id: "evaluations", label: "Evaluations" },
  { id: "escalations", label: "Escalations" },
];

function matchesTab(c: Case, tab: Tab): boolean {
  const txt = (c.title + " " + (c.summary ?? "")).toLowerCase();
  switch (tab) {
    case "all": return true;
    case "onboarding": return c.case_type === "onboarding_blocker";
    case "orientation": return /orient/.test(txt);
    case "training": return c.case_type === "training_issue";
    case "certifications": return /cert|rbt|cpr|bls|license|renew/.test(txt);
    case "support": return ["hr_question","benefit_question","attendance_issue","payroll_issue"].includes(c.case_type);
    case "readiness": return c.case_type === "access_issue" || c.case_type === "documentation_needed" || /readiness|staffing/.test(txt);
    case "evaluations": return c.case_type === "disciplinary_concern" || /eval|review|growth|coach/.test(txt);
    case "escalations": return c.case_type === "manager_escalation" || c.priority === "urgent";
  }
}

/* ---------------- page ---------------- */
export default function OSHRMessages() {
  const d = useData();
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const empById = useMemo(() => Object.fromEntries(d.employees.map(e => [e.id, e])), [d.employees]);
  const candById = useMemo(() => Object.fromEntries(d.candidates.map(c => [c.id, c])), [d.candidates]);
  const onbByEmp = useMemo(() => {
    const m = new Map<string, Onboarding>();
    d.onboarding.forEach(o => m.set(o.employee_id, o));
    return m;
  }, [d.onboarding]);
  const trnByEmp = useMemo(() => {
    const m = new Map<string, Training[]>();
    d.trainings.forEach(t => {
      const arr = m.get(t.employee_id) ?? [];
      arr.push(t); m.set(t.employee_id, arr);
    });
    return m;
  }, [d.trainings]);

  /* derive conversations */
  const conversations: Conv[] = useMemo(() => {
    return d.cases.map(c => {
      const e = empById[c.employee_id];
      const cat = CASE_CATEGORY[c.case_type] ?? "Operational";
      const isOpen = !["resolved","closed"].includes(c.status);
      return {
        id: c.id,
        empId: c.employee_id,
        who: e ? `${e.first_name} ${e.last_name}` : "Unknown employee",
        role: e?.job_title ?? "—",
        state: e?.state ?? "—",
        category: cat,
        preview: c.summary ?? c.title,
        status: caseStatusLabel(c.status),
        statusTone: caseStatusTone(c.status, c.priority),
        priority: c.priority,
        owner: c.owner_role ?? "HR",
        lastAt: c.updated_at,
        unread: isOpen && c.status === "new",
        raw: c,
      };
    });
  }, [d.cases, empById]);

  /* KPIs */
  const stats = useMemo(() => {
    const open = conversations.filter(c => !["Resolved"].includes(c.status));
    const unread = conversations.filter(c => c.unread).length;
    const dueToday = d.cases.filter(c => c.due_date && !["resolved","closed"].includes(c.status)
      && new Date(c.due_date + "T23:59:59").toDateString() === new Date().toDateString()).length;
    const weekAgo = Date.now() - 7 * 86400000;
    const today = new Date().toISOString().slice(0, 10);
    const orientReminders = d.slots.filter(s => s.scheduled_date && s.scheduled_date >= today).length;
    const trainingPending = d.trainings.filter(t => t.status !== "completed").length;
    const annWeek = d.announcements.filter(a => new Date(a.publish_at).getTime() >= weekAgo).length;
    return {
      unread, dueToday, orientReminders, trainingPending,
      openConv: open.length, annWeek,
    };
  }, [conversations, d.cases, d.slots, d.trainings, d.announcements]);

  /* filtered thread list */
  const threads = useMemo(() => {
    let rows = conversations.filter(c => matchesTab(c.raw, tab));
    if (statusFilter === "unread") rows = rows.filter(c => c.unread);
    else if (statusFilter === "waiting") rows = rows.filter(c => c.raw.status === "waiting_employee");
    else if (statusFilter === "escalated") rows = rows.filter(c => c.raw.priority === "urgent" || c.raw.case_type === "manager_escalation");
    else if (statusFilter === "resolved") rows = rows.filter(c => c.status === "Resolved");
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter(r =>
        r.who.toLowerCase().includes(q) ||
        r.preview.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [conversations, tab, statusFilter, query]);

  /* follow-ups: waiting_employee + due_date passed */
  const followups = useMemo(() => {
    return d.cases
      .filter(c => !["resolved","closed"].includes(c.status))
      .filter(c => c.status === "waiting_employee" || (c.due_date && new Date(c.due_date + "T23:59:59").getTime() < Date.now()))
      .slice(0, 8);
  }, [d.cases]);

  /* reminders: upcoming orientation + overdue trainings */
  const reminders = useMemo(() => {
    const items: { id: string; type: string; audience: string; when: string; owner: string; tone: Tone }[] = [];
    d.slots.slice(0, 6).forEach(s => {
      const cand = s.candidate_id ? candById[s.candidate_id] : null;
      if (!s.scheduled_date) return;
      const today = new Date().toISOString().slice(0, 10);
      items.push({
        id: s.id,
        type: "Orientation reminder",
        audience: cand ? `${cand.first_name} ${cand.last_name} · ${cand.role}` : (s.format ?? "Cohort"),
        when: fmtDate(s.scheduled_date) + (s.scheduled_time ? ` · ${s.scheduled_time}` : ""),
        owner: "HR",
        tone: s.scheduled_date < today ? "warn" : "info",
      });
    });
    d.trainings
      .filter(t => t.status !== "completed" && t.due_date)
      .slice(0, 4)
      .forEach(t => {
        const e = empById[t.employee_id];
        const overdue = t.due_date! < new Date().toISOString().slice(0,10);
        items.push({
          id: t.id,
          type: overdue ? "Training overdue reminder" : "Training reminder",
          audience: e ? `${e.first_name} ${e.last_name} · ${e.job_title}` : "Employee",
          when: fmtDate(t.due_date),
          owner: "HR",
          tone: overdue ? "crit" : "muted",
        });
      });
    return items.slice(0, 8);
  }, [d.slots, d.trainings, candById, empById]);

  /* readiness comms: onboarding blockers + onboarding-related open cases */
  const readinessComms = useMemo(() => {
    const items: { who: string; empId: string; blocker: string; last: string; next: string; owner: string }[] = [];
    d.onboarding.forEach(o => {
      const e = empById[o.employee_id]; if (!e) return;
      const hasBlockers = (o.blockers ?? []).length > 0;
      const stuck = !["active","completed"].includes(o.status);
      if (!hasBlockers && !stuck) return;
      items.push({
        who: `${e.first_name} ${e.last_name}`, empId: e.id,
        blocker: hasBlockers ? (o.blockers ?? []).slice(0,2).join(", ") : (o.status ?? "—").replace(/_/g," "),
        last: "—", next: "Schedule check-in", owner: "HR",
      });
    });
    d.cases
      .filter(c => c.case_type === "onboarding_blocker" && !["resolved","closed"].includes(c.status))
      .forEach(c => {
        const e = empById[c.employee_id]; if (!e) return;
        if (items.find(i => i.empId === e.id)) return;
        items.push({
          who: `${e.first_name} ${e.last_name}`, empId: e.id,
          blocker: c.title, last: relTime(c.updated_at),
          next: fmtDate(c.due_date), owner: c.owner_role ?? "HR",
        });
      });
    return items.slice(0, 8);
  }, [d.onboarding, d.cases, empById]);

  const openConv = openId ? conversations.find(c => c.id === openId) ?? null : null;
  const openEmp = openConv ? empById[openConv.empId] : null;
  const openOnb = openConv ? onbByEmp.get(openConv.empId) : undefined;
  const openTrn = openConv ? trnByEmp.get(openConv.empId) ?? [] : [];

  /* honest routing: which providers can this reply actually route through */
  const routeAvailability = useIntegrationRouteAvailability(openOnb ?? null);
  const [replyBody, setReplyBody] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set(["in_app"]));
  const [messageHistoryKey, setMessageHistoryKey] = useState(0);

  // Reset channel selection when switching conversations, and drop any
  // provider channels that are no longer routable for the new employee.
  useEffect(() => {
    setReplyBody("");
    setSelectedChannels(new Set(["in_app"]));
  }, [openId]);
  useEffect(() => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      for (const p of routeAvailability.providers) {
        if (!p.routable && next.has(p.key)) next.delete(p.key);
      }
      return next;
    });
  }, [routeAvailability.providers]);

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        {/* HEADER */}
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
              <MessageSquare className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Messages & Updates</h1>
              <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
                Coordinate onboarding communication, employee reminders, operational updates, and HR follow-ups across Blossom.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <HeaderBtn icon={Plus}>New message</HeaderBtn>
            <HeaderBtn icon={Megaphone}>Send announcement</HeaderBtn>
            <HeaderBtn icon={BellRing}>Schedule reminder</HeaderBtn>
            <HeaderBtn icon={Pin}>Create update</HeaderBtn>
          </div>
        </header>
        <HRIntegrationStatusStrip className="mb-6" />

        {/* KPI snapshot */}
        <div className="grid gap-3 mb-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Kpi label="Unread" value={d.loading ? "—" : stats.unread} tone={stats.unread ? "info" : "muted"} hint="Employee messages" onClick={() => setStatusFilter(statusFilter === "unread" ? null : "unread")} active={statusFilter === "unread"} />
          <Kpi label="Follow-ups today" value={d.loading ? "—" : stats.dueToday} tone={stats.dueToday ? "warn" : "ok"} hint="Due now" />
          <Kpi label="Orientation reminders" value={d.loading ? "—" : stats.orientReminders} hint="Scheduled" onClick={() => setTab("orientation")} />
          <Kpi label="Training reminders" value={d.loading ? "—" : stats.trainingPending} hint="Pending" onClick={() => setTab("training")} />
          <Kpi label="Open conversations" value={d.loading ? "—" : stats.openConv} hint="Active threads" onClick={() => setStatusFilter(null)} />
          <Kpi label="Announcements (7d)" value={d.loading ? "—" : stats.annWeek} tone="ok" hint="Sent this week" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* MAIN */}
          <div className="space-y-6 min-w-0">
            {/* CONVERSATIONS */}
            <section>
              <div className="flex items-end justify-between mb-3 gap-3 flex-wrap">
                <div>
                  <h2 className="text-base font-medium tracking-tight">Conversations</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Onboarding nudges, orientation confirmations, training reminders, support follow-ups — one thread per employee touchpoint.</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by employee, category, message…"
                    className="w-64 h-8 pl-8 pr-3 rounded-lg bg-muted/60 border border-border/70 text-[12.5px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-transparent transition"
                  />
                </div>
              </div>

              <Card>
                {/* segmented tabs */}
                <div className="px-3 pt-3 pb-2 border-b border-border/60 flex flex-wrap gap-1">
                  {TAB_DEF.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={cn(
                        "h-7 px-3 rounded-lg text-[12px] transition-colors",
                        tab === t.id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                      )}
                    >{t.label}</button>
                  ))}
                </div>

                {/* status chips */}
                <div className="px-4 py-2.5 border-b border-border/60 flex flex-wrap gap-1.5">
                  {[
                    { id: null, label: "All" },
                    { id: "unread", label: "Unread" },
                    { id: "waiting", label: "Waiting on employee" },
                    { id: "escalated", label: "Escalated" },
                    { id: "resolved", label: "Resolved" },
                  ].map(s => (
                    <button
                      key={s.label}
                      onClick={() => setStatusFilter(s.id)}
                      className={cn(
                        "h-6 px-2.5 rounded-full text-[11px] border transition-colors",
                        statusFilter === s.id
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-card text-muted-foreground border-border/70 hover:text-foreground",
                      )}
                    >{s.label}</button>
                  ))}
                </div>

                {/* list */}
                <div className="divide-y divide-border/60">
                  {d.loading ? (
                    <Empty icon={MessageSquare} title="Loading conversations…" />
                  ) : threads.length === 0 ? (
                    <Empty
                      icon={CheckCircle2}
                      title="No unresolved employee conversations."
                      hint="When an employee opens a request or HR initiates an onboarding touchpoint, it lands here."
                    />
                  ) : threads.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setOpenId(c.id)}
                      className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors flex items-start gap-3"
                    >
                      <div className="relative shrink-0">
                        <div className="h-9 w-9 rounded-full bg-muted grid place-items-center text-[11px] font-medium text-muted-foreground">
                          {initials(c.who.split(" ")[0] ?? "", c.who.split(" ")[1] ?? "")}
                        </div>
                        {c.unread && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={cn("text-[13.5px] tracking-tight truncate", c.unread ? "font-semibold" : "font-medium")}>{c.who}</p>
                          <span className="text-[11px] text-muted-foreground">· {c.role}</span>
                          <span className="text-[11px] text-muted-foreground">· {c.state}</span>
                          <Pill tone="muted">{c.category}</Pill>
                        </div>
                        <p className="text-[12.5px] text-muted-foreground mt-0.5 line-clamp-1">{c.preview}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Pill tone={c.statusTone}>{c.status}</Pill>
                          {c.raw.priority === "urgent" && <Pill tone="crit">Urgent</Pill>}
                          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" strokeWidth={1.75} />{relTime(c.lastAt)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">· {c.owner}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" strokeWidth={1.75} />
                    </button>
                  ))}
                </div>
              </Card>
            </section>

            {/* ANNOUNCEMENTS */}
            <section>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <h2 className="text-base font-medium tracking-tight">Operational announcements</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">HR updates, orientation schedules, training deadlines, and company changes.</p>
                </div>
                <QuickAction icon={Plus} label="New announcement" />
              </div>
              <Card className="p-3">
                {d.loading ? (
                  <Empty icon={Megaphone} title="Loading announcements…" />
                ) : d.announcements.length === 0 ? (
                  <Empty icon={Megaphone} title="No announcements yet." hint="Operational updates posted here reach the audiences you choose." />
                ) : (
                  <div className="grid gap-2 md:grid-cols-2">
                    {d.announcements.slice(0, 6).map(a => (
                      <div key={a.id} className="rounded-xl border border-border/60 bg-muted/30 p-3 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {a.pinned && <Pin className="h-3 w-3 text-primary" strokeWidth={1.75} />}
                              <p className="text-[13px] font-medium tracking-tight truncate">{a.title}</p>
                            </div>
                            <p className="text-[12px] text-muted-foreground line-clamp-2 mt-0.5">{a.body}</p>
                          </div>
                          <Pill tone={annTone(a.priority)}>{a.priority}</Pill>
                        </div>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="capitalize">{a.audience.replace(/_/g, " ")}</span>
                            <span>·</span>
                            <span>{fmtDate(a.publish_at)}</span>
                            {a.expires_at && (<><span>·</span><span>expires {fmtDate(a.expires_at)}</span></>)}
                          </div>
                          <div className="flex items-center gap-1">
                            <QuickAction icon={Send} label="Send reminder" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </section>

            {/* FOLLOW-UP CENTER + REMINDERS */}
            <div className="grid gap-6 md:grid-cols-2">
              <section>
                <div className="mb-3">
                  <h2 className="text-base font-medium tracking-tight">Follow-up center</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Unanswered employee messages and overdue HR touchpoints.</p>
                </div>
                <Card className="p-2">
                  {d.loading ? <Empty icon={ListChecks} title="Loading…" />
                  : followups.length === 0 ? <Empty icon={CheckCircle2} title="All follow-ups are complete." />
                  : (
                    <div className="divide-y divide-border/60">
                      {followups.map(c => {
                        const e = empById[c.employee_id];
                        const overdue = c.due_date && new Date(c.due_date + "T23:59:59").getTime() < Date.now();
                        return (
                          <button key={c.id} onClick={() => setOpenId(c.id)} className="w-full text-left p-3 hover:bg-muted/40 transition-colors flex items-center gap-3">
                            <div className={cn("h-7 w-7 rounded-lg grid place-items-center shrink-0",
                              overdue ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-700 dark:text-amber-400")}>
                              <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-medium tracking-tight truncate">{e ? `${e.first_name} ${e.last_name}` : "Employee"}</p>
                              <p className="text-[11.5px] text-muted-foreground truncate">{c.title}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[11px] text-muted-foreground">{overdue ? "Overdue" : "Due"} · {fmtDate(c.due_date)}</p>
                              <p className="text-[11px] text-muted-foreground">{c.owner_role ?? "HR"}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </section>

              <section>
                <div className="mb-3">
                  <h2 className="text-base font-medium tracking-tight">Reminders & automations</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Orientation, training, and certification touchpoints.</p>
                </div>
                <Card className="p-2">
                  {d.loading ? <Empty icon={BellRing} title="Loading…" />
                  : reminders.length === 0 ? <Empty icon={BellRing} title="No reminders scheduled." hint="Schedule a reminder to keep onboarding on track." />
                  : (
                    <div className="divide-y divide-border/60">
                      {reminders.map(r => (
                        <div key={r.id} className="p-3 flex items-center gap-3">
                          <div className="h-7 w-7 rounded-lg bg-muted grid place-items-center shrink-0 text-muted-foreground">
                            <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium tracking-tight truncate">{r.type}</p>
                            <p className="text-[11.5px] text-muted-foreground truncate">{r.audience}</p>
                          </div>
                          <div className="text-right shrink-0 flex items-center gap-2">
                            <Pill tone={r.tone}>{r.when}</Pill>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </section>
            </div>

            {/* READINESS COMMS */}
            <section>
              <div className="mb-3">
                <h2 className="text-base font-medium tracking-tight">Readiness communications</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Conversations tied to onboarding blockers, missing documents, and staffing readiness.</p>
              </div>
              <Card className="p-2">
                {d.loading ? <Empty icon={ShieldAlert} title="Loading…" />
                : readinessComms.length === 0 ? <Empty icon={CheckCircle2} title="Everyone is progressing smoothly." hint="No active readiness blockers right now." />
                : (
                  <div className="divide-y divide-border/60">
                    {readinessComms.map((b, i) => (
                      <div key={i} className="p-3 flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 grid place-items-center shrink-0">
                          <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium tracking-tight truncate">{b.who}</p>
                          <p className="text-[11.5px] text-muted-foreground truncate">{b.blocker}</p>
                        </div>
                        <div className="text-right shrink-0 hidden sm:block">
                          <p className="text-[11px] text-muted-foreground">Last · {b.last}</p>
                          <p className="text-[11px] text-muted-foreground">Next · {b.next}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <QuickAction icon={Send} label="Remind" />
                          <QuickAction icon={Flag} label="Escalate" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </section>
          </div>

          {/* ASIDE */}
          <aside className="space-y-6">
            <section>
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 px-1">Priority Actions</h3>
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary grid place-items-center">
                    <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </div>
                  <p className="text-[12.5px] font-medium tracking-tight">Communication follow-ups</p>
                </div>
                <div className="space-y-1.5">
                  {[
                    "Who has unanswered onboarding messages?",
                    "Show overdue follow-ups.",
                    "Which employees need readiness reminders?",
                    "Summarize unresolved communication.",
                    "Who missed orientation reminders?",
                  ].map(p => (
                    <button key={p} className="w-full text-left text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{p}</span>
                    </button>
                  ))}
                </div>
              </Card>
            </section>

            <section>
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 px-1">Lightweight analytics</h3>
              <Card className="p-4 space-y-3">
                {[
                  { label: "Unread messages", value: stats.unread, tone: stats.unread ? "info" : "muted" as Tone },
                  { label: "Follow-ups overdue", value: followups.length, tone: followups.length ? "warn" : "ok" as Tone },
                  { label: "Active conversations", value: stats.openConv, tone: "muted" as Tone },
                  { label: "Reminders scheduled", value: reminders.length, tone: "muted" as Tone },
                  { label: "Announcements (7d)", value: stats.annWeek, tone: "ok" as Tone },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between text-[12.5px]">
                    <span className="text-muted-foreground">{m.label}</span>
                    <Pill tone={m.tone}>{d.loading ? "—" : m.value}</Pill>
                  </div>
                ))}
              </Card>
            </section>

            <section>
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 px-1">Audiences</h3>
              <Card className="p-2">
                {["HR Team","RBTs","BCBAs","Office Staff","State Teams","All Employees"].map(a => (
                  <button key={a} className="w-full text-left px-2.5 py-1.5 rounded-lg text-[12.5px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center justify-between">
                    <span>{a}</span>
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                ))}
              </Card>
            </section>
          </aside>
        </div>
      </div>

      {/* DETAIL PANEL */}
      {openConv && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-foreground/10 backdrop-blur-sm" onClick={() => setOpenId(null)} />
          <div className="w-full max-w-xl h-full bg-card border-l border-border/70 overflow-y-auto">
            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border/60 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-9 w-9 rounded-full bg-muted grid place-items-center text-[11px] font-medium text-muted-foreground shrink-0">
                  {initials(openConv.who.split(" ")[0] ?? "", openConv.who.split(" ")[1] ?? "")}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold tracking-tight truncate">{openConv.who}</p>
                  <p className="text-[11.5px] text-muted-foreground truncate">{openConv.role} · {openConv.state} · {openConv.category}</p>
                </div>
              </div>
              <button onClick={() => setOpenId(null)} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                <X className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* status bar */}
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={openConv.statusTone}>{openConv.status}</Pill>
                {openConv.raw.priority === "urgent" && <Pill tone="crit">Urgent</Pill>}
                <Pill tone="muted">Owner · {openConv.owner}</Pill>
                {openConv.raw.due_date && <Pill tone="muted">Due {fmtDate(openConv.raw.due_date)}</Pill>}
              </div>

              {/* employee context */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Onboarding</p>
                  <p className="text-[12.5px] font-medium tracking-tight mt-1 capitalize">{openOnb?.status?.replace(/_/g," ") ?? "Not started"}</p>
                  {(openOnb?.blockers ?? []).length > 0 && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 truncate">{openOnb!.blockers!.join(", ")}</p>
                  )}
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Training</p>
                  <p className="text-[12.5px] font-medium tracking-tight mt-1">
                    {openTrn.filter(t => t.status === "completed").length}/{openTrn.length} complete
                  </p>
                </div>
              </div>

              {/* integration routing readiness */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Routing readiness</p>
                {openOnb ? (
                  <IntegrationReadinessPanel row={openOnb} />
                ) : (
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-[12px] text-muted-foreground">
                    No onboarding record — outbound reminders can't be routed through Viventium, Stellar, or CentralReach yet.
                  </div>
                )}
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Messages route to a provider only when it shows connected and synced. Otherwise, this reply is delivered in-app only.
                </p>
              </div>

              {/* conversation timeline */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Conversation</p>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                  <div>
                    <p className="text-[12.5px] font-medium tracking-tight">{openConv.raw.title}</p>
                    {openConv.raw.summary && <p className="text-[12px] text-muted-foreground mt-1">{openConv.raw.summary}</p>}
                    <p className="text-[11px] text-muted-foreground mt-1.5">Opened {relTime(openConv.raw.opened_at)} · Updated {relTime(openConv.lastAt)}</p>
                  </div>
                </div>
              </div>

              {/* compose */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Reply</p>

                {/* channel picker — gated by real integration readiness */}
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedChannels(prev => {
                      const n = new Set(prev);
                      n.has("in_app") ? n.delete("in_app") : n.add("in_app");
                      // in-app must always remain as a fallback route
                      if (n.size === 0) n.add("in_app");
                      return n;
                    })}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                      selectedChannels.has("in_app")
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-muted text-muted-foreground border-border/70",
                    )}
                    title="Always available — delivered inside Blossom OS"
                  >
                    In-app
                  </button>
                  {routeAvailability.providers.map((p) => {
                    const on = selectedChannels.has(p.key);
                    return (
                      <button
                        key={p.key}
                        type="button"
                        disabled={!p.routable}
                        onClick={() => setSelectedChannels(prev => {
                          const n = new Set(prev);
                          n.has(p.key) ? n.delete(p.key) : n.add(p.key);
                          return n;
                        })}
                        title={p.routable ? `Route via ${p.label} (synced ${p.syncedAt ? new Date(p.syncedAt).toLocaleDateString() : ""})` : p.reason}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                          !p.routable && "opacity-50 cursor-not-allowed line-through",
                          p.routable && on && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
                          p.routable && !on && "bg-muted text-muted-foreground border-border/70 hover:bg-card",
                        )}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-border/70 bg-card focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring/30 transition">
                  <textarea
                    rows={3}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Write a supportive message…"
                    className="w-full bg-transparent text-[13px] p-3 outline-none resize-none placeholder:text-muted-foreground/70"
                  />
                  <div className="flex items-center justify-between px-2 py-1.5 border-t border-border/60">
                    <div className="flex items-center gap-1">
                      <QuickAction icon={CalendarClock} label="Schedule" />
                      <QuickAction icon={Mail} label="Template" />
                    </div>
                    <button
                      type="button"
                      disabled={!replyBody.trim() || selectedChannels.size === 0}
                      onClick={async () => {
                        // Build durable message record.
                        const channels: HrMessageChannel[] = [];
                        if (selectedChannels.has("in_app")) channels.push("in_app");
                        const routable: Partial<Record<HrMessageChannel, boolean>> = {};
                        for (const p of routeAvailability.providers) {
                          if (selectedChannels.has(p.key)) {
                            const ch = p.key as HrMessageChannel;
                            channels.push(ch);
                            routable[ch] = !!p.routable;
                          }
                        }
                        const res = await queueHrMessage({
                          body: replyBody,
                          employeeId: openEmp?.id ?? null,
                          channels,
                          routable,
                          metadata: { source: "hr_messages_reply" },
                        });
                        const routedLabels = res.routed.map((c) =>
                          c === "in_app" ? "In-app (Blossom OS)" :
                          routeAvailability.providers.find((p) => p.key === c)?.label ?? c,
                        );
                        const blockedLabels = res.blocked.map((c) =>
                          routeAvailability.providers.find((p) => p.key === c)?.label ?? c,
                        );
                        toast({
                          title: res.status === "queued"
                            ? `Queued in Blossom OS${routedLabels.length > 1 ? ` (${routedLabels.join(", ")})` : ""}`
                            : res.status === "blocked"
                              ? "Blocked until integration is connected"
                              : "Could not queue message",
                          description: blockedLabels.length
                            ? `Blocked: ${blockedLabels.join(", ")} — provider not configured or employee not synced.`
                            : undefined,
                        });
                        setReplyBody("");
                        setMessageHistoryKey(k => k + 1);
                      }}
                      className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send className="h-3 w-3" strokeWidth={2} /> Send
                    </button>
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Provider channels are only available when the integration is connected and this employee's onboarding row is synced. In-app is always delivered.
                </p>
              </div>

              {/* actions */}
              <div className="grid grid-cols-3 gap-2">
                <button className="rounded-xl border border-border/70 bg-card hover:bg-muted transition-colors text-[12px] py-2 inline-flex items-center justify-center gap-1.5">
                  <BellRing className="h-3.5 w-3.5" strokeWidth={1.75} /> Schedule reminder
                </button>
                <button className="rounded-xl border border-border/70 bg-card hover:bg-muted transition-colors text-[12px] py-2 inline-flex items-center justify-center gap-1.5">
                  <Flag className="h-3.5 w-3.5" strokeWidth={1.75} /> Escalate
                </button>
                <button className="rounded-xl border border-border/70 bg-card hover:bg-muted transition-colors text-[12px] py-2 inline-flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Resolve
                </button>
              </div>

              <Link to="/hr/employee-support" className="inline-flex items-center gap-1.5 text-[12px] text-primary hover:opacity-80">
                <UserCheck className="h-3.5 w-3.5" strokeWidth={1.75} /> Open employee record <ChevronRight className="h-3 w-3" strokeWidth={1.75} />
              </Link>

              {/* Durable message history from hr_messages */}
              <HRMessageHistory
                employeeId={openEmp?.id ?? null}
                refreshKey={messageHistoryKey}
              />
            </div>
          </div>
        </div>
      )}
    </OSShell>
  );
}