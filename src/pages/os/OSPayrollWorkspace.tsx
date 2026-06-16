import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Workflow, AlertTriangle, BellRing, Sparkles, KanbanSquare, Wallet,
  Heart, Briefcase, CalendarDays, Search, CheckCircle2, ArrowUpRight, MessageSquare,
  Timer, Plus, ChevronRight, Flame, FileText, UserCircle2,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Card, Pill, HeaderBtn, PageHeader, Empty, fullName, fmtDate } from "./_PayrollAtoms";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TabKey = "issues" | "adjustments" | "pto" | "reminders" | "comms";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "issues", label: "Issues", icon: AlertTriangle },
  { key: "adjustments", label: "Adjustments", icon: Wallet },
  { key: "pto", label: "PTO", icon: Heart },
  { key: "reminders", label: "Reminders", icon: BellRing },
  { key: "comms", label: "Communications", icon: MessageSquare },
];

interface Emp { id: string; first_name: string; last_name: string; preferred_name: string | null; state: string | null; }
interface Issue {
  id: string; title: string; description: string | null; category: string; priority: string;
  status: string; due_date: string | null; employee_id: string | null; owner_role: string | null;
  resolution: string | null; updated_at: string;
}
interface Adj {
  id: string; employee_id: string; adjustment_type: string; amount: number; hours: number;
  reason: string | null; status: string; updated_at: string;
}
interface Pto {
  id: string; user_id: string; pto_type: string; start_date: string; end_date: string;
  hours: number; status: string; reason: string | null;
}
interface Reminder {
  id: string; title: string; cadence: string; status: string;
  scheduled_for: string | null; sent_at: string | null; audience: string;
}
interface Comm {
  id: string; employee_id: string | null; channel: string; category: string;
  subject: string | null; body: string | null; status: string; created_at: string;
}

export default function OSPayrollWorkspace() {
  const [tab, setTab] = useState<TabKey>("issues");
  const [query, setQuery] = useState("");
  const [reload, setReload] = useState(0);
  const refresh = () => setReload((k) => k + 1);

  const [employees, setEmployees] = useState<Emp[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [adjustments, setAdjustments] = useState<Adj[]>([]);
  const [pto, setPto] = useState<Pto[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [comms, setComms] = useState<Comm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [empR, isR, adR, ptR, rmR, cmR] = await Promise.all([
        supabase.from("employees").select("id,first_name,last_name,preferred_name,state").order("last_name"),
        supabase.from("payroll_issues").select("*").order("updated_at", { ascending: false }),
        supabase.from("payroll_adjustments").select("*").order("updated_at", { ascending: false }),
        supabase.from("pto_requests").select("id,user_id,pto_type,start_date,end_date,hours,status,reason").order("start_date", { ascending: false }),
        supabase.from("payroll_reminders").select("*").order("scheduled_for", { ascending: true, nullsFirst: false }),
        supabase.from("payroll_communications").select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      if (cancelled) return;
      setEmployees((empR.data ?? []) as Emp[]);
      setIssues((isR.data ?? []) as Issue[]);
      setAdjustments((adR.data ?? []) as Adj[]);
      setPto((ptR.data ?? []) as Pto[]);
      setReminders((rmR.data ?? []) as Reminder[]);
      setComms((cmR.data ?? []) as Comm[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [reload]);

  const empById = useMemo(() => {
    const m = new Map<string, Emp>();
    employees.forEach((e) => m.set(e.id, e));
    return m;
  }, [employees]);

  const matchEmp = (id: string | null) => {
    if (!query.trim()) return true;
    if (!id) return query.trim() === "";
    const e = empById.get(id);
    if (!e) return false;
    return `${e.first_name} ${e.last_name}`.toLowerCase().includes(query.toLowerCase());
  };

  // Operational rollups
  const openIssues = issues.filter((i) => i.status !== "resolved");
  const escalated = openIssues.filter((i) => i.status === "escalated" || i.priority === "urgent");
  const overdueIssues = openIssues.filter((i) => i.due_date && new Date(i.due_date) < new Date());
  const pendingAdj = adjustments.filter((a) => a.status === "pending");
  const pendingPto = pto.filter((p) => p.status === "submitted" || p.status === "pending_review");
  const scheduledReminders = reminders.filter((r) => r.status === "scheduled");
  const openComms = comms.filter((c) => c.status === "open");

  // Pipeline buckets
  const pipeline: Array<{ key: string; label: string; items: Issue[]; tone: "muted" | "info" | "warn" | "crit" | "ok" }> = [
    { key: "open", label: "New", items: openIssues.filter((i) => i.status === "open"), tone: "info" },
    { key: "in_progress", label: "In progress", items: openIssues.filter((i) => i.status === "in_progress"), tone: "warn" },
    { key: "waiting", label: "Waiting on employee", items: openIssues.filter((i) => i.status === "waiting_on_employee"), tone: "muted" },
    { key: "escalated", label: "Escalated", items: openIssues.filter((i) => i.status === "escalated"), tone: "crit" },
    { key: "resolved", label: "Resolved (recent)", items: issues.filter((i) => i.status === "resolved").slice(0, 6), tone: "ok" },
  ];

  const summaryLine = (() => {
    if (loading) return "Loading payroll operations…";
    if (overdueIssues.length) return `${overdueIssues.length} payroll item${overdueIssues.length === 1 ? "" : "s"} overdue. Start with escalations.`;
    if (openIssues.length || pendingAdj.length) return `${openIssues.length + pendingAdj.length} items in flight. Nothing overdue yet — payroll is on track.`;
    return "Workspace is clear. A calm moment to send weekly reminders or close follow-ups.";
  })();

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        {/* Workspace header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Payroll · Workspace</p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Payroll Workspace</h1>
            <p className="text-[14px] text-muted-foreground mt-1.5 max-w-xl">{summaryLine}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <HeaderBtn icon={Plus} to="/payroll/issues">Log issue</HeaderBtn>
            <HeaderBtn icon={BellRing} to="/payroll/messages">Send reminder</HeaderBtn>
            <HeaderBtn icon={Sparkles} to="/ai/assistant?q=What%20payroll%20items%20need%20attention" primary>Operational Insights</HeaderBtn>
          </div>
        </header>

        {/* Operational metrics strip */}
        <div className="grid gap-3 mb-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <MetricCard label="Active tasks" value={openIssues.length} tone={openIssues.length ? "info" : "ok"} />
          <MetricCard label="Blockers" value={overdueIssues.length} tone={overdueIssues.length ? "crit" : "ok"} hint="Overdue" />
          <MetricCard label="PTO pending" value={pendingPto.length} tone={pendingPto.length ? "warn" : "ok"} />
          <MetricCard label="Missing time" value={0} tone="muted" hint="Connect timesheets" />
          <MetricCard label="Escalated" value={escalated.length} tone={escalated.length ? "crit" : "ok"} />
        </div>

        {/* Active Payroll Operations — pipeline */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight">Active payroll operations</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Live operational pipeline — every payroll task, written down and trackable.</p>
            </div>
            <Link to="/payroll/issues" className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              Full queue <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {pipeline.map((col) => (
              <Card key={col.key} className="p-3 min-h-[160px]">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{col.label}</span>
                  <Pill tone={col.tone}>{col.items.length}</Pill>
                </div>
                <ul className="space-y-1.5">
                  {col.items.slice(0, 4).map((it) => {
                    const emp = it.employee_id ? empById.get(it.employee_id) : null;
                    return (
                      <li key={it.id} className="rounded-lg bg-muted/50 p-2">
                        <p className="text-[12px] font-medium tracking-tight truncate">{it.title}</p>
                        <p className="text-[10.5px] text-muted-foreground truncate">{emp ? fullName(emp) : "Unassigned"}</p>
                      </li>
                    );
                  })}
                  {col.items.length === 0 && <li className="text-[11.5px] text-muted-foreground italic">Empty</li>}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        {/* Main grid: tabbed workspace + side rail */}
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            <Card className="p-2 mb-4">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex flex-wrap gap-1 flex-1">
                  {TABS.map((t) => {
                    const active = tab === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                          "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] transition-colors",
                          active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <t.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                <div className="relative md:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search employees…"
                    className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted/60 border border-border/70 text-[12.5px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-transparent transition"
                  />
                </div>
              </div>
            </Card>

            {loading && <Card className="p-8"><p className="text-sm text-muted-foreground text-center">Loading…</p></Card>}

            {!loading && tab === "issues" && (
              <IssuesPanel rows={issues.filter((i) => matchEmp(i.employee_id))} empById={empById} refresh={refresh} />
            )}
            {!loading && tab === "adjustments" && (
              <AdjustmentsPanel rows={adjustments.filter((a) => matchEmp(a.employee_id))} empById={empById} refresh={refresh} />
            )}
            {!loading && tab === "pto" && (
              <PtoPanel rows={pto} employees={employees} query={query} refresh={refresh} />
            )}
            {!loading && tab === "reminders" && (
              <RemindersPanel rows={reminders} refresh={refresh} />
            )}
            {!loading && tab === "comms" && (
              <CommsPanel rows={comms.filter((c) => matchEmp(c.employee_id))} empById={empById} />
            )}
          </div>

          {/* Side rail */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            {/* Escalations */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-3.5 w-3.5 text-destructive" strokeWidth={1.75} />
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Escalations</h3>
              </div>
              {escalated.length === 0
                ? <p className="text-[12.5px] text-muted-foreground">No active escalations.</p>
                : (
                  <ul className="space-y-2">
                    {escalated.slice(0, 5).map((it) => {
                      const emp = it.employee_id ? empById.get(it.employee_id) : null;
                      return (
                        <li key={it.id} className="rounded-lg bg-destructive/5 border border-destructive/15 p-2.5">
                          <p className="text-[12.5px] font-medium tracking-tight truncate">{it.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{emp ? fullName(emp) : "Unassigned"} · {it.category.replace(/_/g, " ")}</p>
                        </li>
                      );
                    })}
                  </ul>
                )}
            </Card>

            {/* Quick actions */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Plus className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Quick actions</h3>
              </div>
              <ul className="space-y-1">
                <RailLink icon={AlertTriangle} to="/payroll/issues" label="Log payroll issue" />
                <RailLink icon={Wallet} to="/payroll/adjustments" label="Create adjustment" />
                <RailLink icon={BellRing} to="/payroll/messages" label="Send payroll reminder" />
                <RailLink icon={Heart} to="/payroll/pto" label="Review PTO" />
                <RailLink icon={Timer} to="/payroll/time-attendance" label="Request missing time" />
                <RailLink icon={UserCircle2} to="/payroll/employees" label="Open employee profile" />
                <RailLink icon={FileText} to="/payroll/tax-documents" label="Export payroll notes" />
              </ul>
            </Card>

            {/* Operational Insights */}
            <Card className="p-5 bg-muted/40">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Operational Insights — Payroll Operations</h3>
              </div>
              <div className="space-y-1.5">
                {[
                  "What payroll blockers are unresolved?",
                  "Who still has missing time entries?",
                  "What PTO requests impact this payroll cycle?",
                  "Which payroll issues are overdue?",
                  "Summarize this week's payroll follow-ups.",
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

            {/* Workspace summary */}
            <Card className="p-5">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Workspace summary</h3>
              <ul className="space-y-2 text-[12.5px]">
                <li className="flex justify-between"><span className="text-muted-foreground">Open issues</span><span className="font-medium">{openIssues.length}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Pending adjustments</span><span className="font-medium">{pendingAdj.length}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">PTO to review</span><span className="font-medium">{pendingPto.length}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Scheduled reminders</span><span className="font-medium">{scheduledReminders.length}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Open follow-ups</span><span className="font-medium">{openComms.length}</span></li>
              </ul>
            </Card>
          </aside>
        </div>
      </div>
    </OSShell>
  );
}

function MetricCard({ label, value, tone = "muted", hint }: { label: string; value: number | string; tone?: "ok" | "warn" | "crit" | "info" | "muted"; hint?: string }) {
  const accent =
    tone === "crit" ? "text-destructive"
    : tone === "warn" ? "text-amber-700 dark:text-amber-400"
    : tone === "ok" ? "text-emerald-700 dark:text-emerald-400"
    : tone === "info" ? "text-blue-700 dark:text-blue-400"
    : "text-foreground";
  return (
    <Card className="p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-semibold tracking-tight mt-1", accent)}>{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
    </Card>
  );
}

function RailLink({ icon: Icon, to, label }: { icon: any; to: string; label: string }) {
  return (
    <li>
      <Link to={to} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[12.5px] hover:bg-muted transition-colors">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
        <span className="flex-1">{label}</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
      </Link>
    </li>
  );
}

/* -------- panels -------- */

function IssuesPanel({ rows, empById, refresh }: { rows: Issue[]; empById: Map<string, Emp>; refresh: () => void }) {
  if (!rows.length) {
    return (
      <Card className="p-6">
        <Empty
          icon={CheckCircle2}
          title="No open payroll issues."
          hint="New issues from the queue, employee messages, or time/attendance reviews will show up here."
        />
      </Card>
    );
  }
  return (
    <div className="grid gap-3">
      {rows.map((it) => {
        const emp = it.employee_id ? empById.get(it.employee_id) : null;
        const overdue = it.due_date && new Date(it.due_date) < new Date();
        return (
          <Card key={it.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-muted grid place-items-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-medium tracking-tight">{it.title}</p>
                  {it.priority === "urgent" && <Pill tone="crit">Urgent</Pill>}
                  {it.priority === "high" && <Pill tone="warn">High</Pill>}
                  <Pill tone={it.status === "resolved" ? "ok" : it.status === "escalated" ? "crit" : "info"}>
                    {it.status.replace(/_/g, " ")}
                  </Pill>
                  {it.due_date && <Pill tone={overdue ? "crit" : "muted"}>{overdue ? "Overdue · " : "Due "}{fmtDate(it.due_date)}</Pill>}
                </div>
                <p className="text-[12.5px] text-muted-foreground mt-1">
                  {emp ? fullName(emp) : "Unassigned"} · {it.category.replace(/_/g, " ")}
                  {it.owner_role && <> · Owner: {it.owner_role}</>}
                </p>
                {it.description && <p className="text-[12.5px] text-foreground/80 mt-2 leading-relaxed">{it.description}</p>}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <ActionBtn
                  icon={CheckCircle2}
                  label="Resolve"
                  primary
                  onClick={async () => {
                    const resolution = window.prompt("Resolution note (optional):", "");
                    const { error } = await supabase
                      .from("payroll_issues")
                      .update({ status: "resolved", resolution, resolved_at: new Date().toISOString() })
                      .eq("id", it.id);
                    toast[error ? "error" : "success"](error ? "Could not resolve" : "Issue resolved");
                    if (!error) refresh();
                  }}
                />
                <ActionBtn
                  icon={ArrowUpRight}
                  label="Escalate"
                  onClick={async () => {
                    const { error } = await supabase
                      .from("payroll_issues")
                      .update({ status: "escalated", priority: "urgent" })
                      .eq("id", it.id);
                    toast[error ? "error" : "success"](error ? "Could not escalate" : "Issue escalated");
                    if (!error) refresh();
                  }}
                />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function AdjustmentsPanel({ rows, empById, refresh }: { rows: Adj[]; empById: Map<string, Emp>; refresh: () => void }) {
  if (!rows.length) {
    return (
      <Card className="p-6">
        <Empty icon={Wallet} title="No payroll adjustments." hint="Bonuses, corrections, retro pay, and reimbursements will appear here." />
      </Card>
    );
  }
  return (
    <div className="grid gap-3">
      {rows.map((a) => {
        const emp = empById.get(a.employee_id);
        return (
          <Card key={a.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-muted grid place-items-center shrink-0">
                <Wallet className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-medium tracking-tight">{a.adjustment_type.replace(/_/g, " ")}</p>
                  <Pill tone={a.status === "approved" || a.status === "applied" ? "ok" : a.status === "rejected" ? "crit" : "warn"}>
                    {a.status}
                  </Pill>
                </div>
                <p className="text-[12.5px] text-muted-foreground mt-1">
                  {emp ? fullName(emp) : "—"} · {a.hours ? `${a.hours}h · ` : ""}${Number(a.amount).toFixed(2)}
                </p>
                {a.reason && <p className="text-[12.5px] text-foreground/80 mt-2 leading-relaxed">{a.reason}</p>}
              </div>
              {a.status === "pending" && (
                <div className="flex flex-col gap-1.5 shrink-0">
                  <ActionBtn
                    icon={CheckCircle2}
                    label="Approve"
                    primary
                    onClick={async () => {
                      const { error } = await supabase
                        .from("payroll_adjustments")
                        .update({ status: "approved", approved_at: new Date().toISOString() })
                        .eq("id", a.id);
                      toast[error ? "error" : "success"](error ? "Could not approve" : "Adjustment approved");
                      if (!error) refresh();
                    }}
                  />
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function PtoPanel({ rows, employees, query, refresh }: { rows: Pto[]; employees: Emp[]; query: string; refresh: () => void }) {
  // PTO is keyed by user_id, not employee_id. Filter by employee name.
  const empByUser = useMemo(() => {
    // Not all employees have user_id; ignored here as we'll display whatever we can.
    return new Map<string, Emp>();
  }, [employees]);
  const filtered = rows.filter(() => true); // free-text on user names not directly mappable without user_id link
  if (!filtered.length) {
    return <Card className="p-6"><Empty icon={Heart} title="No PTO requests." hint="Submitted requests will appear here for review." /></Card>;
  }
  return (
    <div className="grid gap-3">
      {filtered.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted grid place-items-center shrink-0">
              <Heart className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[14px] font-medium tracking-tight">{r.pto_type.replace(/_/g, " ")}</p>
                <Pill tone={r.status === "approved" ? "ok" : r.status === "denied" || r.status === "cancelled" ? "crit" : "warn"}>
                  {r.status.replace(/_/g, " ")}
                </Pill>
              </div>
              <p className="text-[12.5px] text-muted-foreground mt-1">
                {fmtDate(r.start_date)} → {fmtDate(r.end_date)} · {r.hours}h
              </p>
              {r.reason && <p className="text-[12.5px] text-foreground/80 mt-2 leading-relaxed">{r.reason}</p>}
            </div>
            {(r.status === "submitted" || r.status === "pending_review") && (
              <div className="flex flex-col gap-1.5 shrink-0">
                <ActionBtn
                  icon={CheckCircle2}
                  label="Approve"
                  primary
                  onClick={async () => {
                    const { error } = await supabase
                      .from("pto_requests")
                      .update({ status: "approved", reviewed_at: new Date().toISOString() })
                      .eq("id", r.id);
                    toast[error ? "error" : "success"](error ? "Could not approve" : "PTO approved");
                    if (!error) refresh();
                  }}
                />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function RemindersPanel({ rows, refresh }: { rows: Reminder[]; refresh: () => void }) {
  if (!rows.length) {
    return (
      <Card className="p-6">
        <Empty
          icon={BellRing}
          title="No scheduled reminders."
          hint="Schedule a weekly payroll reminder so the entire team is in sync."
          action={<HeaderBtn icon={BellRing} to="/payroll/messages" primary>Schedule reminder</HeaderBtn>}
        />
      </Card>
    );
  }
  return (
    <div className="grid gap-3">
      {rows.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted grid place-items-center shrink-0">
              <BellRing className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[14px] font-medium tracking-tight">{r.title}</p>
                <Pill tone={r.status === "sent" ? "ok" : r.status === "scheduled" ? "info" : "muted"}>{r.status}</Pill>
                <Pill tone="muted">{r.cadence.replace("_", " ")}</Pill>
                <Pill tone="muted">{r.audience}</Pill>
              </div>
              <p className="text-[12.5px] text-muted-foreground mt-1">
                {r.scheduled_for ? `Scheduled for ${fmtDate(r.scheduled_for)}` : r.sent_at ? `Sent ${fmtDate(r.sent_at)}` : "Draft"}
              </p>
            </div>
            {r.status === "scheduled" && (
              <ActionBtn
                icon={CheckCircle2}
                label="Mark sent"
                primary
                onClick={async () => {
                  const { error } = await supabase
                    .from("payroll_reminders")
                    .update({ status: "sent", sent_at: new Date().toISOString() })
                    .eq("id", r.id);
                  toast[error ? "error" : "success"](error ? "Could not update" : "Marked as sent");
                  if (!error) refresh();
                }}
              />
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function CommsPanel({ rows, empById }: { rows: Comm[]; empById: Map<string, Emp> }) {
  if (!rows.length) {
    return <Card className="p-6"><Empty icon={MessageSquare} title="No payroll communications yet." hint="Every touchpoint — reminders, follow-ups, PTO clarifications, escalations — should be logged here." /></Card>;
  }
  return (
    <div className="grid gap-3">
      {rows.map((c) => {
        const emp = c.employee_id ? empById.get(c.employee_id) : null;
        return (
          <Card key={c.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-muted grid place-items-center shrink-0">
                <MessageSquare className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-medium tracking-tight">{c.subject || c.category.replace(/_/g, " ")}</p>
                  <Pill tone="muted">{c.channel}</Pill>
                  <Pill tone="muted">{c.category.replace(/_/g, " ")}</Pill>
                </div>
                <p className="text-[12.5px] text-muted-foreground mt-1">
                  {emp ? fullName(emp) : "Internal"} · {fmtDate(c.created_at)}
                </p>
                {c.body && <p className="text-[12.5px] text-foreground/80 mt-2 leading-relaxed line-clamp-3">{c.body}</p>}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ActionBtn({
  icon: Icon, label, onClick, primary,
}: { icon: any; label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] transition-colors whitespace-nowrap",
        primary ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-border/70 bg-card hover:bg-muted text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {label}
    </button>
  );
}