import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarClock, Search, Filter, Send, CheckCircle2,
  AlertCircle, ChevronRight, X, Clock, Calendar, MapPin, Users,
  MessageSquare, ArrowRight, UserCheck, Video,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queueHrMessage, logHrEvent } from "@/lib/hr/activityEvents";
import { HRMessageHistory } from "@/components/hr/HRMessageHistory";
import { useOperatorDialogs } from "@/components/os/OperatorDialogs";

/* ---------------- types ---------------- */
interface Slot {
  id: string; scheduled_date: string | null; scheduled_time: string | null;
  format: string | null; status: string | null; notes: string | null;
  candidate_id: string | null;
}
interface Candidate {
  id: string; first_name: string; last_name: string; email: string | null;
  role: string | null; state: string | null; city: string | null;
  pipeline_stage: string | null; recruiter: string | null;
  applied_date: string | null; next_action: string | null; next_action_due: string | null;
}
interface BgCheck {
  id: string; candidate_id: string | null; vendor: string | null; status: string | null;
  initiated_at: string | null; cleared_at: string | null; blocker: string | null;
}
interface Employee {
  id: string; first_name: string; last_name: string; job_title: string;
  state: string; status: string; start_date: string | null;
}
interface Onboarding { id: string; employee_id: string; status: string; blockers: string[] | null; }

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
function Kpi({ label, value, tone = "muted", hint }: { label: string; value: string | number; tone?: Tone; hint?: string }) {
  const accent =
    tone === "crit" ? "text-destructive"
    : tone === "warn" ? "text-amber-700 dark:text-amber-400"
    : tone === "ok" ? "text-emerald-700 dark:text-emerald-400"
    : "text-foreground";
  return (
    <Card className="p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-semibold tracking-tight mt-1 tabular-nums", accent)}>{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </Card>
  );
}
function HeaderBtn({ icon: Icon, children, primary, to, onClick }: { icon: React.ElementType; children: React.ReactNode; primary?: boolean; to?: string; onClick?: () => void }) {
  const cls = primary
    ? "bg-primary text-primary-foreground hover:opacity-90"
    : "text-foreground border border-border/70 bg-card hover:bg-muted";
  if (to) return (
    <Link to={to} className={cn("inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] transition-colors", cls)}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {children}
    </Link>
  );
  return (
    <button onClick={onClick} className={cn("inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] transition-colors", cls)}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {children}
    </button>
  );
}

/* ---------------- helpers ---------------- */
function fmtDate(d: string | null) {
  if (!d) return "—";
  try { return new Date(d + (d.length === 10 ? "T00:00:00" : "")).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); }
  catch { return d; }
}
function daysFromToday(d: string | null) {
  if (!d) return null;
  return Math.round((new Date(d + (d.length === 10 ? "T00:00:00" : "")).getTime() - Date.now()) / 86400000);
}

function slotStatusTone(status: string | null, days: number | null): { tone: Tone; label: string } {
  const s = (status ?? "").toLowerCase();
  if (s === "completed" || s === "attended") return { tone: "ok", label: "Attended" };
  if (s === "missed" || s === "no_show" || s === "no-show") return { tone: "crit", label: "Missed" };
  if (s === "cancelled" || s === "canceled") return { tone: "muted", label: "Cancelled" };
  if (s === "scheduled") {
    if (days != null && days < 0) return { tone: "crit", label: "Past due" };
    if (days != null && days <= 2) return { tone: "warn", label: "Soon" };
    return { tone: "info", label: "Scheduled" };
  }
  return { tone: "muted", label: status ?? "Pending" };
}

function bgTone(s: string | null): Tone {
  const x = (s ?? "").toLowerCase();
  if (x === "cleared") return "ok";
  if (x === "needs review") return "warn";
  if (x === "in progress") return "info";
  return "muted";
}

/* ---------------- data hook ---------------- */
function useData() {
  const [s, set] = useState({
    slots: [] as Slot[],
    candidates: [] as Candidate[],
    bg: [] as BgCheck[],
    employees: [] as Employee[],
    onboarding: [] as Onboarding[],
    loading: true,
  });
  const reload = async () => {
    const [sl, cd, bc, em, ob] = await Promise.all([
      supabase.from("recruiting_orientation_slots").select("*").order("scheduled_date"),
      supabase.from("recruiting_candidates").select("id,first_name,last_name,email,role,state,city,pipeline_stage,recruiter,applied_date,next_action,next_action_due").eq("is_archived", false),
      supabase.from("recruiting_background_checks").select("*"),
      supabase.from("employees").select("id,first_name,last_name,job_title,state,status,start_date").in("status", ["pending_start", "active"]).order("last_name"),
      supabase.from("employee_onboarding").select("id,employee_id,status,blockers"),
    ]);
    set({
      slots: (sl.data ?? []) as Slot[],
      candidates: (cd.data ?? []) as Candidate[],
      bg: (bc.data ?? []) as BgCheck[],
      employees: (em.data ?? []) as Employee[],
      onboarding: (ob.data ?? []) as Onboarding[],
      loading: false,
    });
  };
  useEffect(() => {
    let cancel = false;
    void (async () => { if (!cancel) await reload(); })();
    return () => { cancel = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { ...s, reload };
}

/* ---------------- page ---------------- */
type FilterKey = "all" | "scheduled" | "attended" | "missed" | "needs_schedule" | "ready";

export default function OSHROrientationQueue() {
  const d = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [openCandId, setOpenCandId] = useState<string | null>(null);

  const candById = useMemo(() => Object.fromEntries(d.candidates.map(c => [c.id, c])), [d.candidates]);
  const bgByCand = useMemo(() => {
    const m = new Map<string, BgCheck>();
    d.bg.forEach(b => { if (b.candidate_id) m.set(b.candidate_id, b); });
    return m;
  }, [d.bg]);
  const slotByCand = useMemo(() => {
    const m = new Map<string, Slot>();
    d.slots.forEach(s => { if (s.candidate_id) m.set(s.candidate_id, s); });
    return m;
  }, [d.slots]);

  /* derived stats */
  const stats = useMemo(() => {
    const scheduled = d.slots.filter(s => (s.status ?? "").toLowerCase() === "scheduled").length;
    const completedRecent = d.slots.filter(s => (s.status ?? "").toLowerCase() === "completed").length;
    const missed = d.slots.filter(s => ["missed","no_show","no-show"].includes((s.status ?? "").toLowerCase())).length;
    const needsSchedule = d.candidates.filter(c =>
      ["Offer Accepted", "Background Check", "Orientation Scheduled"].includes(c.pipeline_stage ?? "") && !slotByCand.get(c.id)
    ).length;
    const bgPending = d.bg.filter(b => ["In Progress", "Needs Review"].includes(b.status ?? "")).length;
    const readyForStaffing = d.candidates.filter(c => c.pipeline_stage === "Ready to Staff").length;
    return { scheduled, completedRecent, missed, needsSchedule, bgPending, readyForStaffing };
  }, [d.slots, d.candidates, d.bg, slotByCand]);

  /* queue rows = candidates in orientation/onboarding stages */
  const queueRows = useMemo(() => {
    const RELEVANT = new Set(["Offer Accepted", "Background Check", "Orientation Scheduled", "Onboarding", "Ready to Staff"]);
    let rows = d.candidates
      .filter(c => RELEVANT.has(c.pipeline_stage ?? ""))
      .map(c => {
        const slot = slotByCand.get(c.id);
        const bg = bgByCand.get(c.id);
        const days = daysFromToday(slot?.scheduled_date ?? null);
        const sStatus = slotStatusTone(slot?.status ?? (slot ? null : "not_scheduled"), days);
        return { c, slot, bg, days, sStatus };
      });
    if (filter === "scheduled") rows = rows.filter(r => (r.slot?.status ?? "").toLowerCase() === "scheduled");
    else if (filter === "attended") rows = rows.filter(r => (r.slot?.status ?? "").toLowerCase() === "completed");
    else if (filter === "missed") rows = rows.filter(r => ["missed","no_show","no-show"].includes((r.slot?.status ?? "").toLowerCase()));
    else if (filter === "needs_schedule") rows = rows.filter(r => !r.slot);
    else if (filter === "ready") rows = rows.filter(r => r.c.pipeline_stage === "Ready to Staff");
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter(r =>
        `${r.c.first_name} ${r.c.last_name}`.toLowerCase().includes(q)
        || (r.c.role ?? "").toLowerCase().includes(q)
        || (r.c.state ?? "").toLowerCase().includes(q)
      );
    }
    // sort: scheduled soonest first, then no-slot
    rows.sort((a, b) => {
      const ad = a.slot?.scheduled_date ?? "9999-12-31";
      const bd = b.slot?.scheduled_date ?? "9999-12-31";
      return ad.localeCompare(bd);
    });
    return rows;
  }, [d.candidates, slotByCand, bgByCand, filter, query]);

  /* sessions grouped by date+time */
  const sessions = useMemo(() => {
    const m = new Map<string, { key: string; date: string | null; time: string | null; format: string | null; slots: Slot[] }>();
    d.slots.forEach(s => {
      const key = `${s.scheduled_date ?? ""}|${s.scheduled_time ?? ""}|${s.format ?? ""}`;
      const e = m.get(key) ?? { key, date: s.scheduled_date, time: s.scheduled_time, format: s.format, slots: [] };
      e.slots.push(s);
      m.set(key, e);
    });
    return Array.from(m.values()).sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  }, [d.slots]);

  /* blockers */
  const blockers = useMemo(() => {
    const items: { who: string; role: string | null; kind: string; detail: string; days: number | null; candId?: string }[] = [];
    // No slot in onboarding stages
    d.candidates
      .filter(c => ["Offer Accepted", "Background Check"].includes(c.pipeline_stage ?? "") && !slotByCand.get(c.id))
      .forEach(c => items.push({
        who: `${c.first_name} ${c.last_name}`, role: c.role, candId: c.id,
        kind: "Orientation not scheduled", detail: c.pipeline_stage ?? "—",
        days: daysFromToday(c.next_action_due ?? null),
      }));
    // BG check pending/needs review
    d.bg.filter(b => ["Needs Review", "In Progress"].includes(b.status ?? "")).forEach(b => {
      const c = b.candidate_id ? candById[b.candidate_id] : undefined;
      items.push({
        who: c ? `${c.first_name} ${c.last_name}` : "Candidate",
        role: c?.role ?? null, candId: c?.id,
        kind: b.status === "Needs Review" ? "Background check needs review" : "Background check in progress",
        detail: b.blocker ?? b.vendor ?? "—",
        days: b.initiated_at ? Math.round((Date.now() - new Date(b.initiated_at).getTime()) / 86400000) : null,
      });
    });
    // Missed orientations
    d.slots.filter(s => ["missed","no_show","no-show"].includes((s.status ?? "").toLowerCase())).forEach(s => {
      const c = s.candidate_id ? candById[s.candidate_id] : undefined;
      items.push({
        who: c ? `${c.first_name} ${c.last_name}` : "Candidate",
        role: c?.role ?? null, candId: c?.id,
        kind: "Missed orientation", detail: fmtDate(s.scheduled_date),
        days: null,
      });
    });
    return items.slice(0, 20);
  }, [d.candidates, d.bg, d.slots, slotByCand, candById]);

  /* readiness */
  const readiness = useMemo(() => {
    return d.candidates
      .filter(c => ["Offer Accepted", "Background Check", "Orientation Scheduled", "Onboarding", "Ready to Staff"].includes(c.pipeline_stage ?? ""))
      .map(c => {
        const slot = slotByCand.get(c.id);
        const bg = bgByCand.get(c.id);
        const slotOk = (slot?.status ?? "").toLowerCase() === "completed";
        const bgOk = (bg?.status ?? "").toLowerCase() === "cleared";
        const stageOk = c.pipeline_stage === "Ready to Staff" || c.pipeline_stage === "Onboarding";
        let pct = 0;
        if (slot) pct += 25;
        if (slotOk) pct += 25;
        if (bg) pct += 15;
        if (bgOk) pct += 15;
        if (stageOk) pct += 20;
        let status: { tone: Tone; label: string };
        if (c.pipeline_stage === "Ready to Staff") status = { tone: "ok", label: "Ready" };
        else if (pct >= 70) status = { tone: "info", label: "Almost ready" };
        else if (pct >= 40) status = { tone: "warn", label: "Needs attention" };
        else status = { tone: "crit", label: "Blocked" };
        return { c, pct, status, slot, bg };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [d.candidates, slotByCand, bgByCand]);

  const openCand = openCandId ? candById[openCandId] : null;
  const openSlot = openCand ? slotByCand.get(openCand.id) : undefined;
  const openBg = openCand ? bgByCand.get(openCand.id) : undefined;
  const [scheduleFor, setScheduleFor] = useState<Candidate | null>(null);

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        {/* header */}
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
              <CalendarClock className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Orientation Queue</h1>
              <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
                Schedule new-hire orientations, track attendance, and hand off readiness updates to HR and staffing.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <HeaderBtn icon={Calendar} onClick={() => {
              // Prefer opening scheduler for the selected candidate; otherwise
              // pick the first candidate without a slot.
              const target = openCand
                ?? d.candidates.find((c: any) => !slotByCand.get(c.id)) as Candidate | undefined;
              if (!target) { toast({ title: "No candidate to schedule" }); return; }
              setScheduleFor(target);
            }}>Schedule orientation</HeaderBtn>
            <HeaderBtn icon={Send} onClick={async () => {
              const scheduled = (d.candidates ?? []).filter((c: any) => {
                const slot = (d.slots ?? []).find((s: any) => s.candidate_id === c.id);
                return slot?.status === "Scheduled";
              });
              if (scheduled.length === 0) { toast({ title: "No scheduled orientations to remind" }); return; }
              let queued = 0;
              for (const c of scheduled as any[]) {
                const res = await queueHrMessage({
                  body: "Reminder: your orientation is upcoming.",
                  subject: "Orientation reminder",
                  channels: ["in_app"],
                  metadata: { candidate_id: c.id, source: "orientation_bulk_reminder" },
                });
                if (res.status === "queued") queued++;
              }
              toast({ title: `Queued ${queued} orientation reminder${queued === 1 ? "" : "s"} in Blossom OS` });
            }}>Send reminders</HeaderBtn>
            <HeaderBtn icon={MessageSquare} to="/hr/messages">Message hires</HeaderBtn>
          </div>
        </header>

        {/* KPI snapshot */}
        <div className="grid gap-3 mb-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Kpi label="Scheduled" value={d.loading ? "—" : stats.scheduled} hint="On the calendar" />
          <Kpi label="Completed" value={d.loading ? "—" : stats.completedRecent} tone="ok" hint="Recently attended" />
          <Kpi label="Missing orientation" value={d.loading ? "—" : stats.needsSchedule} tone={stats.needsSchedule ? "warn" : "ok"} hint="No session scheduled" />
          <Kpi label="Background pending" value={d.loading ? "—" : stats.bgPending} tone={stats.bgPending ? "warn" : "ok"} hint="In progress / needs review" />
          <Kpi label="Missed" value={d.loading ? "—" : stats.missed} tone={stats.missed ? "crit" : "ok"} hint="Needs follow-up" />
          <Kpi label="Ready for staffing" value={d.loading ? "—" : stats.readyForStaffing} tone="ok" hint="Cleared to assign" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* MAIN */}
          <div className="space-y-6 min-w-0">

            {/* QUEUE */}
            <section>
              <div className="flex items-end justify-between mb-3 gap-3">
                <div>
                  <h2 className="text-base font-medium tracking-tight">Orientation queue</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Live new hires moving through orientation, background checks, and staffing readiness.</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, role, state…"
                    className="w-56 h-8 pl-8 pr-3 rounded-lg bg-muted/60 border border-border/70 text-[12.5px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-transparent transition"
                  />
                </div>
              </div>
              <Card>
                <div className="flex items-center gap-1.5 p-2 border-b border-border/70 overflow-x-auto">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1 mr-1" strokeWidth={1.75} />
                  {([
                    ["all", `All (${queueRows.length || 0})`],
                    ["needs_schedule", `Not scheduled (${stats.needsSchedule})`],
                    ["scheduled", "Scheduled"],
                    ["attended", "Attended"],
                    ["missed", `Missed (${stats.missed})`],
                    ["ready", "Ready for staffing"],
                  ] as [FilterKey, string][]).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => setFilter(k)}
                      className={cn(
                        "h-7 px-3 rounded-lg text-[12px] transition-colors whitespace-nowrap",
                        filter === k ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
                      )}
                    >{label}</button>
                  ))}
                </div>
                {d.loading ? (
                  <div className="p-6"><p className="text-sm text-muted-foreground">Loading…</p></div>
                ) : queueRows.length === 0 ? (
                  <Empty
                    icon={CheckCircle2}
                    title="All upcoming orientations are ready."
                    hint="No new hires match this filter right now."
                  />
                ) : (
                  <ul className="divide-y divide-border/70">
                    {queueRows.slice(0, 30).map(({ c, slot, bg, sStatus }) => (
                      <li key={c.id}>
                        <button
                          onClick={() => setOpenCandId(c.id)}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors"
                        >
                          <div className="h-8 w-8 rounded-xl bg-muted grid place-items-center shrink-0 text-[11px] font-medium">
                            {c.first_name[0]}{c.last_name[0]}
                          </div>
                          <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-[1.2fr_1.4fr_auto] gap-2 md:gap-4 items-center">
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium tracking-tight truncate">{c.first_name} {c.last_name}</p>
                              <p className="text-[11.5px] text-muted-foreground truncate">{c.role ?? "—"} · {c.state ?? "—"}</p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] truncate">
                                {slot ? `${fmtDate(slot.scheduled_date)} · ${slot.scheduled_time ?? ""}` : "Orientation not scheduled"}
                              </p>
                              <p className="text-[11.5px] text-muted-foreground truncate">
                                Stage: {c.pipeline_stage ?? "—"} · BG: {bg?.status ?? "Not started"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                              <Pill tone={sStatus.tone}>{sStatus.label}</Pill>
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>

            {/* SESSIONS */}
            <section>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <h2 className="text-base font-medium tracking-tight">Orientation sessions</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Upcoming and recent sessions with attendance.</p>
                </div>
              </div>
              {d.loading ? (
                <Card className="p-6"><p className="text-sm text-muted-foreground">Loading…</p></Card>
              ) : sessions.length === 0 ? (
                <Card className="p-6">
                  <Empty icon={Calendar} title="No orientation sessions yet." hint="Create the first session to start coordinating new hires." />
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {sessions.map(sess => {
                    const completed = sess.slots.filter(s => (s.status ?? "").toLowerCase() === "completed").length;
                    const missed = sess.slots.filter(s => ["missed","no_show","no-show"].includes((s.status ?? "").toLowerCase())).length;
                    const total = sess.slots.length;
                    const days = daysFromToday(sess.date);
                    const isPast = days != null && days < 0;
                    return (
                      <Card key={sess.key} className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              {isPast ? "Past session" : days === 0 ? "Today" : "Upcoming"}
                            </p>
                            <h3 className="text-[14.5px] font-medium tracking-tight mt-1 truncate">
                              {fmtDate(sess.date)} · {sess.time ?? ""}
                            </h3>
                            <p className="text-[12px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                              {sess.format?.toLowerCase().includes("virtual")
                                ? <Video className="h-3 w-3" strokeWidth={1.75} />
                                : <MapPin className="h-3 w-3" strokeWidth={1.75} />}
                              {sess.format ?? "—"}
                            </p>
                          </div>
                          <Pill tone={isPast ? "muted" : "info"}>{total} attendee{total === 1 ? "" : "s"}</Pill>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-[11.5px]">
                          <div className="rounded-lg bg-muted/60 px-2 py-1.5">
                            <span className="text-muted-foreground">Attended</span>
                            <p className="font-medium text-emerald-700 dark:text-emerald-400">{completed}</p>
                          </div>
                          <div className="rounded-lg bg-muted/60 px-2 py-1.5">
                            <span className="text-muted-foreground">Missed</span>
                            <p className={cn("font-medium", missed ? "text-destructive" : "")}>{missed}</p>
                          </div>
                          <div className="rounded-lg bg-muted/60 px-2 py-1.5">
                            <span className="text-muted-foreground">Pending</span>
                            <p className="font-medium">{total - completed - missed}</p>
                          </div>
                        </div>
                        <ul className="mt-3 space-y-1.5">
                          {sess.slots.slice(0, 5).map(s => {
                            const c = s.candidate_id ? candById[s.candidate_id] : undefined;
                            const st = slotStatusTone(s.status, null);
                            return (
                              <li key={s.id} className="flex items-center justify-between text-[12.5px]">
                                <button
                                  onClick={() => c && setOpenCandId(c.id)}
                                  className="truncate text-left hover:text-primary transition-colors"
                                >
                                  {c ? `${c.first_name} ${c.last_name}` : "Unknown candidate"}
                                  <span className="text-muted-foreground"> · {c?.role ?? "—"}</span>
                                </button>
                                <Pill tone={st.tone}>{st.label}</Pill>
                              </li>
                            );
                          })}
                          {sess.slots.length > 5 && (
                            <li className="text-[11.5px] text-muted-foreground">+{sess.slots.length - 5} more</li>
                          )}
                        </ul>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {/* READINESS BLOCKERS */}
            <section>
              <h2 className="text-base font-medium tracking-tight mb-3">Readiness blockers</h2>
              <Card>
                {d.loading ? (
                  <div className="p-6"><p className="text-sm text-muted-foreground">Loading…</p></div>
                ) : blockers.length === 0 ? (
                  <Empty icon={CheckCircle2} title="No onboarding blockers right now." hint="Everyone is progressing smoothly." />
                ) : (
                  <ul className="divide-y divide-border/70">
                    {blockers.map((b, i) => (
                      <li key={i} className="px-4 py-3 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 grid place-items-center shrink-0">
                          <AlertCircle className="h-4 w-4" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium tracking-tight truncate">
                            {b.who} <span className="text-muted-foreground font-normal">· {b.role ?? "—"}</span>
                          </p>
                          <p className="text-[11.5px] text-muted-foreground truncate">{b.kind}: {b.detail}</p>
                        </div>
                        {b.days != null && b.days > 0 && <Pill tone="warn">{b.days}d waiting</Pill>}
                        {b.candId && (
                          <button onClick={() => setOpenCandId(b.candId!)} className="h-7 px-2.5 rounded-lg text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            Open
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>

            {/* STAFFING READINESS */}
            <section>
              <div className="flex items-end justify-between mb-3">
                <h2 className="text-base font-medium tracking-tight">Staffing readiness</h2>
                <Link to="/ops/staffing?tab=apploi" className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  Open staffing <ArrowRight className="h-3 w-3" strokeWidth={1.75} />
                </Link>
              </div>
              {d.loading ? (
                <Card className="p-6"><p className="text-sm text-muted-foreground">Loading…</p></Card>
              ) : readiness.length === 0 ? (
                <Card className="p-6">
                  <Empty icon={UserCheck} title="No new hires in flight." hint="Readiness will appear here as candidates progress." />
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {readiness.slice(0, 9).map(r => (
                    <Card key={r.c.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-medium tracking-tight truncate">{r.c.first_name} {r.c.last_name}</p>
                          <p className="text-[11.5px] text-muted-foreground truncate">{r.c.role ?? "—"} · {r.c.state ?? "—"}</p>
                        </div>
                        <Pill tone={r.status.tone}>{r.status.label}</Pill>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                          <span>Readiness</span>
                          <span className="tabular-nums">{r.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              r.status.tone === "ok" ? "bg-emerald-500"
                              : r.status.tone === "info" ? "bg-primary"
                              : r.status.tone === "warn" ? "bg-amber-500"
                              : "bg-destructive",
                            )}
                            style={{ width: `${r.pct}%` }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => setOpenCandId(r.c.id)}
                        className="mt-3 text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        Open <ChevronRight className="h-3 w-3" />
                      </button>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT RAIL */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <CalendarClock className="h-4 w-4 text-primary" strokeWidth={1.75} />
                <h3 className="text-sm font-medium tracking-tight">Priority Actions</h3>
              </div>
              <p className="text-[12px] text-muted-foreground mb-3">
                Focus areas for the orientation queue this week.
              </p>
              <ul className="space-y-1.5">
                {[
                  "Who missed orientation?",
                  "Who is blocked from readiness?",
                  "Show pending orientation follow-ups.",
                  "Which employees are almost staffing ready?",
                  "Who still needs orientation scheduled?",
                ].map(p => (
                  <li key={p}>
                    <button className="w-full text-left text-[12.5px] rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors">{p}</button>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Quick links</h3>
              <nav className="space-y-1">
                {[
                  { label: "New Hire Pipeline", to: "/hr/new-hires", icon: Users },
                  { label: "Scheduling Workspace", to: "/scheduling-workspace", icon: Calendar },
                  { label: "HR Messages", to: "/hr/messages", icon: MessageSquare },
                ].map(l => (
                  <Link key={l.label} to={l.to} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px] hover:bg-muted transition-colors">
                    <span className="inline-flex items-center gap-2">
                      <l.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} /> {l.label}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  </Link>
                ))}
              </nav>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                <h3 className="text-[12px] font-medium tracking-tight">Operational note</h3>
              </div>
              <p className="text-[12px] text-muted-foreground">
                Orientation hands off to Onboarding (Viventium) and Training Academy. Mark attendance to unlock staffing readiness.
              </p>
            </Card>
          </aside>
        </div>
      </div>

      {/* Detail panel */}
      {openCand && (
        <DetailPanel
          cand={openCand}
          slot={openSlot}
          bg={openBg}
          onClose={() => setOpenCandId(null)}
          onChanged={() => { void d.reload(); }}
          onMessage={() => navigate("/hr/messages")}
          toast={toast}
          onSchedule={() => setScheduleFor(openCand)}
        />
      )}

      {scheduleFor && (
        <ScheduleOrientationDialog
          cand={scheduleFor}
          onClose={() => setScheduleFor(null)}
          onSaved={() => { setScheduleFor(null); void d.reload(); }}
          toast={toast}
        />
      )}
    </OSShell>
  );
}

/* ---------------- detail panel ---------------- */
function DetailPanel({
  cand, slot, bg, onClose, onChanged, onMessage, toast, onSchedule,
}: {
  cand: Candidate; slot?: Slot; bg?: BgCheck; onClose: () => void;
  onChanged: () => void; onMessage: () => void;
  toast: ReturnType<typeof useToast>["toast"];
  onSchedule?: () => void;
}) {
  const { promptOperator } = useOperatorDialogs();
  const days = daysFromToday(slot?.scheduled_date ?? null);
  const slotSt = slotStatusTone(slot?.status ?? (slot ? null : "not_scheduled"), days);
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-foreground/10 backdrop-blur-[2px]" />
      <div className="relative w-full max-w-xl h-full bg-card border-l border-border/70 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
        <header className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/70 px-6 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Orientation · {cand.pipeline_stage ?? "—"}</p>
            <h2 className="text-lg font-semibold tracking-tight mt-0.5 truncate">{cand.first_name} {cand.last_name}</h2>
            <p className="text-[12px] text-muted-foreground truncate">{cand.role ?? "—"} · {cand.state ?? "—"} {cand.city ? `· ${cand.city}` : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone={slotSt.tone}>{slotSt.label}</Pill>
            <button onClick={onClose} className="h-8 w-8 rounded-full grid place-items-center hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="px-6 py-5 space-y-5">
          {/* Status grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Orientation</p>
              <p className="text-[13.5px] font-medium mt-0.5">{slot ? `${fmtDate(slot.scheduled_date)} · ${slot.scheduled_time ?? ""}` : "Not scheduled"}</p>
              {slot?.format && <p className="text-[11.5px] text-muted-foreground mt-0.5">{slot.format}</p>}
            </Card>
            <Card className="p-3">
              <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Background check</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <Pill tone={bgTone(bg?.status ?? null)}>{bg?.status ?? "Not started"}</Pill>
              </div>
              {bg?.blocker && <p className="text-[11.5px] text-destructive mt-0.5 truncate">{bg.blocker}</p>}
            </Card>
            <Card className="p-3">
              <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Recruiter</p>
              <p className="text-[13.5px] font-medium mt-0.5 truncate">{cand.recruiter ?? "Unassigned"}</p>
            </Card>
            <Card className="p-3">
              <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Applied</p>
              <p className="text-[13.5px] font-medium mt-0.5">{fmtDate(cand.applied_date)}</p>
            </Card>
          </div>

          {/* Next action */}
          {cand.next_action && (
            <Card className="p-4">
              <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-1">Next action</p>
              <p className="text-[13px]">{cand.next_action}</p>
              {cand.next_action_due && <p className="text-[11.5px] text-muted-foreground mt-1">Due {fmtDate(cand.next_action_due)}</p>}
            </Card>
          )}

          {/* Notes */}
          {(slot?.notes || cand.email) && (
            <Card className="p-4 space-y-2">
              {cand.email && <p className="text-[12.5px] text-muted-foreground truncate">{cand.email}</p>}
              {slot?.notes && <p className="text-[12.5px]">{slot.notes}</p>}
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <ActionBtn icon={Calendar} onClick={async () => {
              if (!slot) {
                if (onSchedule) onSchedule();
                else toast({ title: "No orientation slot yet" });
                return;
              }
              const next = await promptOperator({
                title: "Reschedule orientation",
                label: "New date",
                inputType: "date",
                defaultValue: slot.scheduled_date ?? "",
                submitLabel: "Reschedule",
                required: true,
              });
              if (!next) return;
              const { error } = await supabase.from("recruiting_orientation_slots")
                .update({ scheduled_date: next, status: "Scheduled" }).eq("id", slot.id);
              if (!error) await logHrEvent({ eventType: "orientation_rescheduled", title: `Orientation rescheduled to ${next}`, metadata: { candidate_id: cand.id, slot_id: slot.id, scheduled_date: next } });
              toast({ title: error ? "Could not reschedule" : "Orientation rescheduled" });
              if (!error) onChanged();
            }}>Reschedule</ActionBtn>
            <ActionBtn icon={CheckCircle2} onClick={async () => {
              if (!slot) return toast({ title: "No orientation slot to mark" });
              const { error } = await supabase.from("recruiting_orientation_slots")
                .update({ status: "Completed" }).eq("id", slot.id);
              if (!error) await logHrEvent({ eventType: "orientation_attended", title: `${cand.first_name} ${cand.last_name} attended orientation`, metadata: { candidate_id: cand.id, slot_id: slot.id } });
              toast({ title: error ? "Could not update" : "Marked attended" });
              if (!error) onChanged();
            }}>Mark attended</ActionBtn>
            <ActionBtn icon={AlertCircle} onClick={async () => {
              if (!slot) return toast({ title: "No orientation slot to mark" });
              const { error } = await supabase.from("recruiting_orientation_slots")
                .update({ status: "no_show" }).eq("id", slot.id);
              if (!error) {
                await logHrEvent({
                  eventType: "orientation_no_show",
                  title: `${cand.first_name} ${cand.last_name} did not attend orientation`,
                  metadata: { candidate_id: cand.id, slot_id: slot.id },
                });
                await queueHrMessage({
                  subject: "Missed orientation — follow up",
                  body: `${cand.first_name}, we missed you at orientation. Reply here to reschedule.`,
                  channels: ["in_app"],
                  metadata: { candidate_id: cand.id, slot_id: slot.id, source: "orientation_no_show_followup" },
                });
              }
              toast({ title: error ? "Could not update" : "Marked no-show — follow-up queued" });
              if (!error) onChanged();
            }}>Mark no-show</ActionBtn>
            <ActionBtn icon={Send} onClick={async () => {
              const res = await queueHrMessage({
                body: `Reminder for ${cand.first_name} ${cand.last_name}: your orientation is coming up.`,
                subject: "Orientation reminder",
                channels: ["in_app"],
                metadata: { candidate_id: cand.id, slot_id: slot?.id ?? null, source: "orientation_row_reminder" },
              });
              toast({ title: res.status === "queued" ? "Reminder queued in Blossom OS" : "Could not queue reminder" });
              onChanged();
            }}>Send reminder</ActionBtn>
            <ActionBtn icon={MessageSquare} onClick={onMessage}>Message</ActionBtn>
            <ActionBtn icon={UserCheck} primary onClick={async () => {
              const { error } = await supabase.from("recruiting_candidates")
                .update({ pipeline_stage: "Ready to Staff" }).eq("id", cand.id);
              if (!error) await logHrEvent({ eventType: "candidate_ready_for_staffing", title: `${cand.first_name} ${cand.last_name} moved to Ready to Staff`, metadata: { candidate_id: cand.id } });
              toast({ title: error ? "Could not mark ready" : "Marked ready for staffing" });
              if (!error) { onChanged(); onClose(); }
            }}>Mark ready</ActionBtn>
          </div>

          {/* Reminder history from hr_messages */}
          <div className="pt-2">
            <HRMessageHistory
              title="Recent reminders & messages"
              // hr_messages does not carry a candidate id column — filter is best-effort.
              // Show recent HR messages to keep operators aware; harmless if empty.
              limit={5}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, children, primary, onClick }: { icon: React.ElementType; children: React.ReactNode; primary?: boolean; onClick?: () => void }) {
  const cls = primary
    ? "bg-primary text-primary-foreground hover:opacity-90"
    : "text-foreground border border-border/70 bg-card hover:bg-muted";
  return (
    <button onClick={onClick} className={cn("inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] transition-colors", cls)}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {children}
    </button>
  );
}

/* ---------------- schedule orientation modal ---------------- */
function ScheduleOrientationDialog({
  cand, onClose, onSaved, toast,
}: {
  cand: Candidate; onClose: () => void; onSaved: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [format, setFormat] = useState("virtual");
  const [facilitator, setFacilitator] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!date) { toast({ title: "Pick a date" }); return; }
    setSaving(true);
    const payload: Record<string, unknown> = {
      candidate_id: cand.id,
      scheduled_date: date,
      scheduled_time: time || null,
      format,
      status: "Scheduled",
      notes: notes || null,
    };
    if (facilitator) payload.facilitator = facilitator;
    const { data, error } = await (supabase.from("recruiting_orientation_slots") as any)
      .insert(payload).select("id").maybeSingle();
    setSaving(false);
    if (error) { toast({ title: "Could not schedule", description: "Please try again in a moment." }); return; }
    await logHrEvent({
      eventType: "orientation_scheduled",
      title: `Orientation scheduled for ${cand.first_name} ${cand.last_name}`,
      description: `${date}${time ? " " + time : ""} · ${format}`,
      metadata: { candidate_id: cand.id, slot_id: data?.id ?? null, scheduled_date: date, scheduled_time: time, format, facilitator },
    });
    toast({ title: "Orientation scheduled" });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl border border-border/70 bg-card shadow-2xl p-5 space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Schedule orientation</p>
          <h3 className="text-base font-semibold tracking-tight mt-0.5">{cand.first_name} {cand.last_name}</h3>
          <p className="text-[12px] text-muted-foreground">{cand.role ?? "—"} · {cand.state ?? "—"}</p>
        </div>
        <div className="space-y-3">
          <label className="block text-[11.5px] text-muted-foreground space-y-1">
            <span>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full h-9 rounded-lg border border-border/70 bg-background px-2 text-[13px]" />
          </label>
          <label className="block text-[11.5px] text-muted-foreground space-y-1">
            <span>Time</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="w-full h-9 rounded-lg border border-border/70 bg-background px-2 text-[13px]" />
          </label>
          <label className="block text-[11.5px] text-muted-foreground space-y-1">
            <span>Format</span>
            <select value={format} onChange={(e) => setFormat(e.target.value)}
              className="w-full h-9 rounded-lg border border-border/70 bg-background px-2 text-[13px]">
              <option value="virtual">Virtual</option>
              <option value="in_person">In-person</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
          <label className="block text-[11.5px] text-muted-foreground space-y-1">
            <span>Facilitator (optional)</span>
            <input value={facilitator} onChange={(e) => setFacilitator(e.target.value)}
              placeholder="Owner / facilitator"
              className="w-full h-9 rounded-lg border border-border/70 bg-background px-2 text-[13px]" />
          </label>
          <label className="block text-[11.5px] text-muted-foreground space-y-1">
            <span>Notes (optional)</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full rounded-lg border border-border/70 bg-background px-2 py-1.5 text-[13px]" />
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
          <button onClick={onClose} className="h-9 px-3 rounded-lg text-[13px] border border-border/70 bg-card hover:bg-muted">Cancel</button>
          <button onClick={save} disabled={saving} className="h-9 px-3 rounded-lg text-[13px] bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {saving ? "Scheduling…" : "Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
