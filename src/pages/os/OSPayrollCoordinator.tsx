import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Wallet, AlertTriangle, Clock, CalendarDays, Heart, Briefcase, BellRing,
  Sparkles, KanbanSquare, ChevronRight, ShieldCheck, FileCheck2, BookOpen, Inbox,
  CheckCircle2, MessageSquare, Plus, FileText, TrendingUp, Timer,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Card, KpiCard, HeaderBtn, PageHeader, Empty, Pill, fullName, fmtDate } from "./_PayrollAtoms";
import { supabase } from "@/integrations/supabase/client";
import {
  countOpenIssues, countOverdueIssues, countPendingAdjustments, countPendingPto,
  countOpenRunsToFinalize, countDraftTimesheets, countScheduledReminders,
} from "@/lib/os/payroll/queries";

interface Kpis {
  openIssues: number; overdue: number; pendingAdjustments: number;
  pendingPto: number; openRuns: number; draftTimesheets: number; scheduledReminders: number;
}

interface IssueRow {
  id: string; title: string; category: string; priority: string; status: string;
  due_date: string | null; employee_id: string | null;
}

interface EmpLite { id: string; first_name: string; last_name: string; preferred_name: string | null; }

interface PtoRow { id: string; user_id: string; pto_type: string; start_date: string; end_date: string; hours: number; status: string; submitted_at: string | null; }
interface ReminderRow { id: string; title: string; cadence: string; status: string; scheduled_for: string | null; sent_at: string | null; }
interface CommRow { id: string; employee_id: string | null; category: string; subject: string | null; status: string; created_at: string; }
interface TimesheetRow { id: string; employee_id: string; period_start: string; period_end: string; status: string; total_hours: number; }

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function currentPayWeek() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now); monday.setDate(now.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

export default function OSPayrollCoordinator() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [empMap, setEmpMap] = useState<Map<string, EmpLite>>(new Map());
  const [pto, setPto] = useState<PtoRow[]>([]);
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [comms, setComms] = useState<CommRow[]>([]);
  const [drafts, setDrafts] = useState<TimesheetRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [openIssues, overdue, pendingAdjustments, pendingPto, openRuns, draftTimesheets, scheduledReminders] =
        await Promise.all([
          countOpenIssues(), countOverdueIssues(), countPendingAdjustments(), countPendingPto(),
          countOpenRunsToFinalize(), countDraftTimesheets(), countScheduledReminders(),
        ]);
      const [issuesRes, empRes, ptoRes, remRes, commRes, draftRes] = await Promise.all([
        supabase.from("payroll_issues")
          .select("id,title,category,priority,status,due_date,employee_id")
          .in("status", ["open", "in_progress"] as never[])
          .order("priority", { ascending: false })
          .order("due_date", { ascending: true, nullsFirst: false })
          .limit(8),
        supabase.from("employees").select("id,first_name,last_name,preferred_name").order("last_name"),
        supabase.from("pto_requests")
          .select("id,user_id,pto_type,start_date,end_date,hours,status,submitted_at")
          .in("status", ["submitted", "pending_review"] as never[])
          .order("start_date", { ascending: true })
          .limit(6),
        supabase.from("payroll_reminders")
          .select("id,title,cadence,status,scheduled_for,sent_at")
          .order("scheduled_for", { ascending: false, nullsFirst: false })
          .limit(6),
        supabase.from("payroll_communications")
          .select("id,employee_id,category,subject,status,created_at")
          .eq("status", "open" as never)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("hours_timesheets")
          .select("id,employee_id,period_start,period_end,status,total_hours")
          .eq("status", "draft" as never)
          .order("period_end", { ascending: false })
          .limit(6),
      ]);

      if (cancelled) return;
      setKpis({ openIssues, overdue, pendingAdjustments, pendingPto, openRuns, draftTimesheets, scheduledReminders });
      setIssues((issuesRes.data ?? []) as IssueRow[]);
      const m = new Map<string, EmpLite>();
      (empRes.data ?? []).forEach((e: any) => m.set(e.id, e as EmpLite));
      setEmpMap(m);
      setPto((ptoRes.data ?? []) as PtoRow[]);
      setReminders((remRes.data ?? []) as ReminderRow[]);
      setComms((commRes.data ?? []) as CommRow[]);
      setDrafts((draftRes.data ?? []) as TimesheetRow[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Payroll readiness — heuristic from operational signals
  const readiness = (() => {
    if (!kpis) return { pct: 100, status: "Ready" as const, tone: "ok" as const };
    const blockers = kpis.overdue * 3 + kpis.pendingAdjustments + kpis.draftTimesheets + kpis.openIssues * 0.5;
    const pct = Math.max(0, Math.min(100, Math.round(100 - blockers * 4)));
    const status = pct >= 90 ? "Ready" : pct >= 70 ? "Attention needed" : pct >= 40 ? "At risk" : "Blocked";
    const tone = pct >= 90 ? "ok" : pct >= 70 ? "warn" : pct >= 40 ? "warn" : "crit";
    return { pct, status, tone: tone as "ok" | "warn" | "crit" };
  })();

  const summaryLine = (() => {
    if (loading || !kpis) return "Loading today's payroll snapshot…";
    if (kpis.overdue) return `${kpis.overdue} payroll item${kpis.overdue === 1 ? "" : "s"} overdue — start there.`;
    if (kpis.openIssues || kpis.pendingAdjustments) return `${kpis.openIssues + kpis.pendingAdjustments} item${kpis.openIssues + kpis.pendingAdjustments === 1 ? "" : "s"} need your review. Nothing overdue yet.`;
    return "Payroll is on track. A calm moment to send weekly reminders.";
  })();

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        {/* Welcome / snapshot header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Payroll · {currentPayWeek()}</p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{greeting()}, Baila</h1>
            <p className="text-[14px] text-muted-foreground mt-1.5 max-w-xl">{summaryLine}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <HeaderBtn icon={KanbanSquare} to="/payroll/workspace">Open workspace</HeaderBtn>
            <HeaderBtn icon={BellRing} to="/payroll/messages">Send reminder</HeaderBtn>
            <HeaderBtn icon={Sparkles} to="/ai/assistant?q=Summarize%20payroll%20blockers%20this%20week" primary>Operational Insights</HeaderBtn>
          </div>
        </header>

        {/* Snapshot strip */}
        <div className="grid gap-3 mb-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard label="Current pay week" value={currentPayWeek()} tone="muted" hint="Mon – Sun" />
          <KpiCard label="Pending issues"   value={loading ? "—" : kpis?.openIssues ?? 0} tone={kpis?.overdue ? "crit" : kpis?.openIssues ? "warn" : "ok"} hint={kpis?.overdue ? `${kpis.overdue} overdue` : "All on track"} />
          <KpiCard label="PTO to review"    value={loading ? "—" : kpis?.pendingPto ?? 0} tone={kpis?.pendingPto ? "warn" : "ok"} hint="Awaiting approval" />
          <KpiCard label="Missing time"     value={loading ? "—" : kpis?.draftTimesheets ?? 0} tone={kpis?.draftTimesheets ? "warn" : "ok"} hint="Draft timesheets" />
          <KpiCard label="Adjustments"      value={loading ? "—" : kpis?.pendingAdjustments ?? 0} tone={kpis?.pendingAdjustments ? "warn" : "ok"} hint="Awaiting approval" />
        </div>

        {/* Priority cards */}
        <section className="mb-8">
          <h2 className="text-[15px] font-semibold tracking-tight mb-3">Needs attention</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <PriorityCard
              icon={Timer} title="Missing time entries" count={kpis?.draftTimesheets ?? 0}
              hint="Employees with draft or incomplete timesheets."
              to="/payroll/time-attendance" cta="Review timesheets"
            />
            <PriorityCard
              icon={Wallet} title="Payroll adjustments" count={kpis?.pendingAdjustments ?? 0}
              hint="Corrections and reimbursements awaiting approval."
              to="/payroll/adjustments" cta="Open queue"
            />
            <PriorityCard
              icon={Heart} title="PTO requests" count={kpis?.pendingPto ?? 0}
              hint="Submitted PTO that may impact this payroll."
              to="/payroll/pto" cta="Review PTO"
            />
            <PriorityCard
              icon={AlertTriangle} title="Escalated issues" count={kpis?.overdue ?? 0}
              hint="Overdue payroll issues needing immediate follow-up."
              to="/payroll/issues" cta="View issues" tone={kpis?.overdue ? "crit" : "ok"}
            />
            <PriorityCard
              icon={Briefcase} title="Benefits & deductions" count={null}
              hint="Recent changes and deduction follow-ups."
              to="/payroll/benefits" cta="Open benefits"
            />
            <PriorityCard
              icon={BellRing} title="Reminders due" count={kpis?.scheduledReminders ?? 0}
              hint="Weekly reminders scheduled or unsent."
              to="/payroll/messages" cta="Open communication"
            />
          </div>
        </section>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6 min-w-0">
            {/* Operational Attention Center */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-tight">Operational Attention Center</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Blockers and tasks sorted by priority and due date.</p>
                </div>
                <Link to="/payroll/issues" className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">
                  See all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {loading ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
              ) : issues.length === 0 ? (
                <Empty icon={Wallet} title="You're all caught up." hint="No open payroll issues. New blockers will appear here automatically." />
              ) : (
                <ul className="divide-y divide-border/60">
                  {issues.map((it) => {
                    const emp = it.employee_id ? empMap.get(it.employee_id) : null;
                    const overdue = it.due_date && new Date(it.due_date) < new Date();
                    return (
                      <Link key={it.id} to="/payroll/issues" className="py-3 flex items-center gap-3 group -mx-2 px-2 rounded-lg hover:bg-muted/60 transition-colors">
                        <div className="h-8 w-8 rounded-xl bg-muted grid place-items-center shrink-0">
                          <AlertTriangle className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13.5px] font-medium tracking-tight truncate">{it.title}</p>
                          <p className="text-[11.5px] text-muted-foreground truncate">
                            {emp ? fullName(emp) : "Unassigned"} · {it.category.replace(/_/g, " ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {it.priority === "urgent" && <Pill tone="crit">Urgent</Pill>}
                          {it.priority === "high" && <Pill tone="warn">High</Pill>}
                          {it.due_date && <Pill tone={overdue ? "crit" : "muted"}>{overdue ? "Overdue · " : ""}{fmtDate(it.due_date)}</Pill>}
                        </div>
                      </Link>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* Payroll Readiness */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-tight">Payroll readiness</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Real-time status of this pay cycle.</p>
                </div>
                <Pill tone={readiness.tone}>{readiness.status}</Pill>
              </div>
              <div className="mb-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-3xl font-semibold tracking-tight">{readiness.pct}%</span>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Ready to process</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${readiness.tone === "crit" ? "bg-destructive" : readiness.tone === "warn" ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${readiness.pct}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <ReadinessStat label="Blockers" value={(kpis?.overdue ?? 0) + (kpis?.openIssues ?? 0)} tone={kpis?.overdue ? "crit" : kpis?.openIssues ? "warn" : "ok"} />
                <ReadinessStat label="Missing time" value={kpis?.draftTimesheets ?? 0} tone={kpis?.draftTimesheets ? "warn" : "ok"} />
                <ReadinessStat label="Adjustments" value={kpis?.pendingAdjustments ?? 0} tone={kpis?.pendingAdjustments ? "warn" : "ok"} />
                <ReadinessStat label="Open runs" value={kpis?.openRuns ?? 0} tone={kpis?.openRuns ? "info" : "ok"} />
              </div>
            </Card>

            {/* PTO & Attendance Overview */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13.5px] font-semibold tracking-tight">PTO & upcoming absences</h3>
                  <Link to="/payroll/pto" className="text-[11.5px] text-muted-foreground hover:text-foreground">View all</Link>
                </div>
                {loading ? <p className="text-xs text-muted-foreground py-6 text-center">Loading…</p>
                  : pto.length === 0 ? <Empty icon={Heart} title="No pending PTO" hint="New requests will appear here." />
                  : (
                    <ul className="space-y-2.5">
                      {pto.map((p) => {
                        const emp = empMap.get(p.user_id);
                        return (
                          <li key={p.id} className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-muted grid place-items-center shrink-0">
                              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium tracking-tight truncate">{emp ? fullName(emp) : "Employee"}</p>
                              <p className="text-[11.5px] text-muted-foreground truncate">{p.pto_type.replace(/_/g, " ")} · {fmtDate(p.start_date)} → {fmtDate(p.end_date)}</p>
                            </div>
                            <Pill tone="warn">{p.hours}h</Pill>
                          </li>
                        );
                      })}
                    </ul>
                  )}
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13.5px] font-semibold tracking-tight">Time & attendance</h3>
                  <Link to="/payroll/time-attendance" className="text-[11.5px] text-muted-foreground hover:text-foreground">View all</Link>
                </div>
                {loading ? <p className="text-xs text-muted-foreground py-6 text-center">Loading…</p>
                  : drafts.length === 0 ? <Empty icon={CheckCircle2} title="All timesheets in." hint="Every employee has submitted hours." />
                  : (
                    <ul className="space-y-2.5">
                      {drafts.map((t) => {
                        const emp = empMap.get(t.employee_id);
                        return (
                          <li key={t.id} className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-muted grid place-items-center shrink-0">
                              <Timer className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium tracking-tight truncate">{emp ? fullName(emp) : "Employee"}</p>
                              <p className="text-[11.5px] text-muted-foreground truncate">{fmtDate(t.period_start)} → {fmtDate(t.period_end)}</p>
                            </div>
                            <Pill tone="warn">Draft · {Number(t.total_hours).toFixed(1)}h</Pill>
                          </li>
                        );
                      })}
                    </ul>
                  )}
              </Card>
            </div>

            {/* Communication & Reminder Center */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-tight">Communication & reminders</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Weekly cadence — every follow-up is recorded.</p>
                </div>
                <Link to="/payroll/messages" className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  Open <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Reminders</h4>
                  {reminders.length === 0
                    ? <p className="text-[12.5px] text-muted-foreground">No reminders scheduled.</p>
                    : (
                      <ul className="space-y-2">
                        {reminders.slice(0, 4).map((r) => (
                          <li key={r.id} className="flex items-center gap-2.5">
                            <BellRing className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.75} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] truncate">{r.title}</p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {r.status === "sent" && r.sent_at ? `Sent ${fmtDate(r.sent_at)}` : r.scheduled_for ? `Scheduled ${fmtDate(r.scheduled_for)}` : "Draft"} · {r.cadence}
                              </p>
                            </div>
                            <Pill tone={r.status === "sent" ? "ok" : r.status === "scheduled" ? "info" : "muted"}>{r.status}</Pill>
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
                <div>
                  <h4 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Open follow-ups</h4>
                  {comms.length === 0
                    ? <p className="text-[12.5px] text-muted-foreground">No open employee follow-ups.</p>
                    : (
                      <ul className="space-y-2">
                        {comms.map((c) => {
                          const emp = c.employee_id ? empMap.get(c.employee_id) : null;
                          return (
                            <li key={c.id} className="flex items-center gap-2.5">
                              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.75} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] truncate">{c.subject || c.category.replace(/_/g, " ")}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{emp ? fullName(emp) : "Team"} · {fmtDate(c.created_at)}</p>
                              </div>
                              <Pill tone="warn">Open</Pill>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                </div>
              </div>
            </Card>

            {/* Quick links */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-5">
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">This week</h3>
                <ul className="space-y-2">
                  <QuickLink icon={KanbanSquare} label="Run the payroll queue" to="/payroll/queue" />
                  <QuickLink icon={CalendarDays} label="Review time & attendance" to="/payroll/time-attendance" />
                  <QuickLink icon={Wallet} label="Approve pending adjustments" to="/payroll/adjustments" />
                  <QuickLink icon={Heart} label="Review PTO requests" to="/payroll/pto" />
                  <QuickLink icon={BellRing} label="Send weekly payroll reminder" to="/payroll/messages" />
                </ul>
              </Card>
              <Card className="p-5">
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Operational hubs</h3>
                <ul className="space-y-2">
                  <QuickLink icon={Briefcase} label="Benefits & deductions" to="/payroll/benefits" />
                  <QuickLink icon={ShieldCheck} label="Payroll compliance" to="/payroll/compliance" />
                  <QuickLink icon={FileCheck2} label="Tax documents & records" to="/payroll/tax-documents" />
                  <QuickLink icon={Inbox} label="Payroll messages" to="/payroll/messages" />
                  <QuickLink icon={BookOpen} label="Resource library" to="/payroll/resources" />
                </ul>
              </Card>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Today's focus</h3>
              </div>
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">{summaryLine}</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Plus className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Quick actions</h3>
              </div>
              <ul className="space-y-1">
                <QuickLink icon={Wallet} label="Create payroll adjustment" to="/payroll/adjustments" />
                <QuickLink icon={BellRing} label="Send payroll reminder" to="/payroll/messages" />
                <QuickLink icon={Heart} label="Review PTO requests" to="/payroll/pto" />
                <QuickLink icon={AlertTriangle} label="Log payroll issue" to="/payroll/issues" />
                <QuickLink icon={Timer} label="Review missing time" to="/payroll/time-attendance" />
                <QuickLink icon={KanbanSquare} label="Open payroll workspace" to="/payroll/workspace" />
                <QuickLink icon={FileText} label="Export payroll notes" to="/payroll/tax-documents" />
              </ul>
            </Card>

            <Card className="p-5 bg-muted/40">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Operational Insights — payroll insights</h3>
              </div>
              <div className="space-y-1.5">
                {[
                  "Summarize payroll blockers this week.",
                  "Which employees have missing timesheets?",
                  "Show pending PTO requests by state.",
                  "Draft the weekly payroll reminder.",
                  "What payroll adjustments are unresolved?",
                ].map((p) => (
                  <Link
                    key={p}
                    to={`/ai/assistant?q=${encodeURIComponent(p)}`}
                    className="block w-full text-left rounded-lg px-2 py-1.5 text-[12.5px] text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
                  >
                    {p}
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">This week at a glance</h3>
              </div>
              <ul className="space-y-2 text-[12.5px]">
                <li className="flex justify-between"><span className="text-muted-foreground">Active employees</span><span className="font-medium">{loading ? "—" : empMap.size}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Open payroll runs</span><span className="font-medium">{loading ? "—" : kpis?.openRuns ?? 0}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Reminders scheduled</span><span className="font-medium">{loading ? "—" : kpis?.scheduledReminders ?? 0}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Open issues</span><span className="font-medium">{loading ? "—" : kpis?.openIssues ?? 0}</span></li>
              </ul>
            </Card>
          </aside>
        </div>
      </div>
    </OSShell>
  );
}

function PriorityCard({
  icon: Icon, title, count, hint, to, cta, tone,
}: { icon: any; title: string; count: number | null; hint: string; to: string; cta: string; tone?: "ok" | "warn" | "crit" }) {
  const accent = tone === "crit" ? "text-destructive" : tone === "warn" ? "text-amber-700 dark:text-amber-400" : count ? "text-foreground" : "text-muted-foreground";
  return (
    <Link
      to={to}
      className="group block rounded-2xl border border-border/70 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-border shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="h-9 w-9 rounded-xl bg-muted grid place-items-center">
          <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
        </div>
        {count !== null && <span className={`text-2xl font-semibold tracking-tight ${accent}`}>{count}</span>}
      </div>
      <p className="text-[13.5px] font-medium tracking-tight">{title}</p>
      <p className="text-[11.5px] text-muted-foreground mt-0.5 mb-3">{hint}</p>
      <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">
        {cta} <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

function ReadinessStat({ label, value, tone }: { label: string; value: number; tone: "ok" | "warn" | "crit" | "info" }) {
  const accent = tone === "crit" ? "text-destructive" : tone === "warn" ? "text-amber-700 dark:text-amber-400" : tone === "info" ? "text-blue-700 dark:text-blue-400" : "text-emerald-700 dark:text-emerald-400";
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <p className={`text-xl font-semibold tracking-tight ${accent}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function QuickLink({ icon: Icon, label, to }: { icon: any; label: string; to: string }) {
  return (
    <li>
      <Link to={to} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] hover:bg-muted transition-colors">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
        <span className="flex-1">{label}</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
      </Link>
    </li>
  );
}