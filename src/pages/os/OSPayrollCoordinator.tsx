import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Wallet, AlertTriangle, Clock, CalendarDays, Heart, Briefcase, BellRing,
  Sparkles, KanbanSquare, ChevronRight, ShieldCheck, FileCheck2, BookOpen, Inbox,
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

export default function OSPayrollCoordinator() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [empMap, setEmpMap] = useState<Map<string, EmpLite>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [openIssues, overdue, pendingAdjustments, pendingPto, openRuns, draftTimesheets, scheduledReminders] =
        await Promise.all([
          countOpenIssues(), countOverdueIssues(), countPendingAdjustments(), countPendingPto(),
          countOpenRunsToFinalize(), countDraftTimesheets(), countScheduledReminders(),
        ]);
      const issuesRes = await supabase
        .from("payroll_issues")
        .select("id,title,category,priority,status,due_date,employee_id")
        .in("status", ["open", "in_progress"] as never[])
        .order("priority", { ascending: false })
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(8);
      const empRes = await supabase
        .from("employees")
        .select("id,first_name,last_name,preferred_name")
        .order("last_name");

      if (cancelled) return;
      setKpis({ openIssues, overdue, pendingAdjustments, pendingPto, openRuns, draftTimesheets, scheduledReminders });
      setIssues((issuesRes.data ?? []) as IssueRow[]);
      const m = new Map<string, EmpLite>();
      (empRes.data ?? []).forEach((e: any) => m.set(e.id, e as EmpLite));
      setEmpMap(m);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        <PageHeader
          icon={Wallet}
          title="Payroll Coordinator"
          subtitle="Awareness layer for payroll operations: what's blocked, what's overdue, and what needs your attention today."
        >
          <HeaderBtn icon={KanbanSquare} to="/payroll/queue">Payroll queue</HeaderBtn>
          <HeaderBtn icon={BellRing} to="/payroll/messages">Send reminder</HeaderBtn>
          <HeaderBtn icon={Sparkles} to="/ai/assistant?q=Summarize%20payroll%20blockers" primary>Ask Blossom AI</HeaderBtn>
        </PageHeader>

        <div className="grid gap-3 mb-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <KpiCard label="Open issues"          value={loading ? "—" : kpis?.openIssues ?? 0} tone={kpis?.openIssues ? "warn" : "ok"} hint="Need follow-up" />
          <KpiCard label="Overdue"              value={loading ? "—" : kpis?.overdue ?? 0}    tone={kpis?.overdue ? "crit" : "ok"}    hint="Past due date" />
          <KpiCard label="Pending adjustments"  value={loading ? "—" : kpis?.pendingAdjustments ?? 0} tone={kpis?.pendingAdjustments ? "warn" : "ok"} hint="Awaiting approval" />
          <KpiCard label="PTO to review"        value={loading ? "—" : kpis?.pendingPto ?? 0} tone={kpis?.pendingPto ? "warn" : "ok"} hint="Submitted requests" />
          <KpiCard label="Open payroll runs"    value={loading ? "—" : kpis?.openRuns ?? 0}   tone={kpis?.openRuns ? "info" : "muted"} hint="To finalize" />
          <KpiCard label="Draft timesheets"     value={loading ? "—" : kpis?.draftTimesheets ?? 0} tone={kpis?.draftTimesheets ? "warn" : "ok"} hint="Not submitted" />
          <KpiCard label="Scheduled reminders"  value={loading ? "—" : kpis?.scheduledReminders ?? 0} hint="Outgoing this week" />
          <KpiCard label="Employees"            value={loading ? "—" : empMap.size} hint="Active records" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6 min-w-0">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-tight">Attention required</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Open issues, sorted by priority and due date.</p>
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
                      <li key={it.id} className="py-3 flex items-center gap-3">
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
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

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
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                {kpis?.overdue
                  ? `${kpis.overdue} overdue payroll item${kpis.overdue === 1 ? "" : "s"} need${kpis.overdue === 1 ? "s" : ""} immediate attention.`
                  : kpis?.openIssues
                  ? `${kpis.openIssues} open issue${kpis.openIssues === 1 ? "" : "s"} in queue. None overdue yet.`
                  : "All clear. Use this calm moment to send weekly reminders or update SOPs."}
              </p>
            </Card>

            <Card className="p-5 bg-muted/40">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Ask Blossom AI</h3>
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
          </aside>
        </div>
      </div>
    </OSShell>
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