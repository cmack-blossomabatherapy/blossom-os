import { useMemo, useState } from "react";
import {
  AlertTriangle, ArrowRight, BarChart3, Bell, Briefcase, CalendarCheck, CheckCircle2, Clock, Download, FileText,
  Filter, GraduationCap, HeartHandshake, ListChecks, MessageSquare, RefreshCw, Search, Send, ShieldCheck, UserCheck,
  UserCog, UserPlus, Users, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { hrEmployees, type EmployeeStatus, type HrDepartment, type HrEmployee, type HrRole, type HrState, type ReviewStatus, type TrainingStatus } from "@/data/hrDashboard";

type KpiKey = "active" | "onboarding" | "training" | "reviews" | "documents" | "time" | "payroll" | "risk";
const ALL = "All";
const dayMs = 1000 * 60 * 60 * 24;
const today = new Date("2026-04-27T12:00:00Z");
const pct = (value: number) => `${Math.round(value)}%`;
const avg = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
const daysSince = (date: string) => Math.max(0, Math.floor((today.getTime() - new Date(date).getTime()) / dayMs));

const healthTone = (value: "Low" | "Medium" | "High" | "Critical" | "good" | "watch" | "bad") => {
  if (value === "Low" || value === "good") return "success";
  if (value === "Medium" || value === "watch") return "warning";
  return "critical";
};

export default function HRDashboard() {
  const [employees, setEmployees] = useState<HrEmployee[]>(hrEmployees);
  const [dateRange, setDateRange] = useState("This Month");
  const [stateFilter, setStateFilter] = useState<string>(ALL);
  const [departmentFilter, setDepartmentFilter] = useState<string>(ALL);
  const [roleFilter, setRoleFilter] = useState<string>(ALL);
  const [managerFilter, setManagerFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [trainingFilter, setTrainingFilter] = useState<string>(ALL);
  const [reviewFilter, setReviewFilter] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  const [activeKpi, setActiveKpi] = useState<KpiKey>("active");
  const [selectedEmployee, setSelectedEmployee] = useState<HrEmployee | null>(employees[0]);

  const states = [ALL, ...Array.from(new Set(employees.map((employee) => employee.state)))];
  const departments = [ALL, ...Array.from(new Set(employees.map((employee) => employee.department)))];
  const roles = [ALL, ...Array.from(new Set(employees.map((employee) => employee.role)))];
  const managers = [ALL, "Unassigned", ...Array.from(new Set(employees.map((employee) => employee.manager).filter(Boolean) as string[]))];
  const statuses = [ALL, ...Array.from(new Set(employees.map((employee) => employee.status)))];
  const trainingStatuses = [ALL, ...Array.from(new Set(employees.map((employee) => employee.trainingStatus)))];
  const reviewStatuses = [ALL, ...Array.from(new Set(employees.map((employee) => employee.reviewStatus)))];

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return employees
      .filter((employee) => stateFilter === ALL || employee.state === stateFilter)
      .filter((employee) => departmentFilter === ALL || employee.department === departmentFilter)
      .filter((employee) => roleFilter === ALL || employee.role === roleFilter)
      .filter((employee) => managerFilter === ALL || (managerFilter === "Unassigned" ? !employee.manager : employee.manager === managerFilter))
      .filter((employee) => statusFilter === ALL || employee.status === statusFilter)
      .filter((employee) => trainingFilter === ALL || employee.trainingStatus === trainingFilter)
      .filter((employee) => reviewFilter === ALL || employee.reviewStatus === reviewFilter)
      .filter((employee) => !q || [employee.employee, employee.email, employee.role, employee.department, employee.manager ?? "", employee.nextAction].some((field) => field.toLowerCase().includes(q)));
  }, [departmentFilter, employees, managerFilter, query, reviewFilter, roleFilter, stateFilter, statusFilter, trainingFilter]);

  const missingDocsRows = filtered.filter((employee) => employee.documents.some((doc) => ["Missing", "Requested", "Expired"].includes(doc.status)) || !employee.onboarding.i9 || !employee.onboarding.complianceDocs);
  const trainingOverdueRows = filtered.filter((employee) => employee.trainingStatus === "Overdue" || employee.trainings.some((training) => training.status === "Overdue"));
  const reviewsDueRows = filtered.filter((employee) => ["Due Soon", "Overdue"].includes(employee.reviewStatus));
  const timeIssueRows = filtered.filter((employee) => employee.timeClockStatus !== "Clean");
  const payrollExceptionRows = filtered.filter((employee) => employee.payrollStatus !== "Ready");
  const riskRows = filtered.filter((employee) => ["High", "Critical"].includes(employee.riskLevel) || !employee.manager || (employee.status === "Inactive" && employee.staffingReady));
  const onboardingRows = filtered.filter((employee) => ["Pre-Hire", "Onboarding", "Training"].includes(employee.status));
  const activeRows = filtered.filter((employee) => employee.status === "Active" || employee.status === "Review Due");

  const kpiRows = useMemo(() => {
    if (activeKpi === "active") return activeRows;
    if (activeKpi === "onboarding") return onboardingRows;
    if (activeKpi === "training") return trainingOverdueRows;
    if (activeKpi === "reviews") return reviewsDueRows;
    if (activeKpi === "documents") return missingDocsRows;
    if (activeKpi === "time") return timeIssueRows;
    if (activeKpi === "payroll") return payrollExceptionRows;
    return riskRows;
  }, [activeKpi, activeRows, onboardingRows, trainingOverdueRows, reviewsDueRows, missingDocsRows, timeIssueRows, payrollExceptionRows, riskRows]);

  const kpis: Array<{ key: KpiKey; title: string; value: number; subtext: string; icon: typeof Users; tone: "success" | "warning" | "critical" | "info" }> = [
    { key: "active", title: "Active Employees", value: activeRows.length, subtext: `${filtered.filter((e) => e.staffingReady).length} ready for assignment`, icon: Users, tone: "success" },
    { key: "onboarding", title: "Onboarding Employees", value: onboardingRows.length, subtext: `${onboardingRows.filter((e) => e.onboardingStatus === "Missing Docs").length} blocked by docs`, icon: UserPlus, tone: onboardingRows.some((e) => e.onboardingStatus === "Missing Docs") ? "warning" : "info" },
    { key: "training", title: "Training Overdue", value: trainingOverdueRows.length, subtext: "Compliance completion needed", icon: GraduationCap, tone: trainingOverdueRows.length ? "critical" : "success" },
    { key: "reviews", title: "Reviews Due", value: reviewsDueRows.length, subtext: `${reviewsDueRows.filter((e) => e.reviewStatus === "Overdue").length} overdue`, icon: CalendarCheck, tone: reviewsDueRows.some((e) => e.reviewStatus === "Overdue") ? "critical" : "warning" },
    { key: "documents", title: "Missing Documents", value: missingDocsRows.length, subtext: "HR and compliance forms", icon: FileText, tone: missingDocsRows.length ? "critical" : "success" },
    { key: "time", title: "Time Clock Issues", value: timeIssueRows.length, subtext: "Punches or approvals", icon: Clock, tone: timeIssueRows.length ? "warning" : "success" },
    { key: "payroll", title: "Payroll Exceptions", value: payrollExceptionRows.length, subtext: "Needs review before payroll", icon: Wallet, tone: payrollExceptionRows.length ? "critical" : "success" },
    { key: "risk", title: "Employee Risk Alerts", value: riskRows.length, subtext: "High-risk people ops items", icon: AlertTriangle, tone: riskRows.length ? "critical" : "success" },
  ];

  const queue = {
    urgent: filtered.filter((employee) => employee.riskLevel === "Critical" || employee.trainingStatus === "Overdue" || employee.reviewStatus === "Overdue" || employee.payrollStatus === "Exception" || employee.documents.some((doc) => doc.status === "Missing")),
    today: filtered.filter((employee) => employee.tasks.some((task) => !task.completed && ["Today", "Tomorrow"].includes(task.dueDate)) || employee.reviews.some((review) => ["Due Soon", "Overdue"].includes(review.status))),
    risks: filtered.filter((employee) => ["High", "Critical"].includes(employee.riskLevel) || !employee.manager || employee.workload >= 90 || (employee.role === "RBT" && !employee.staffingReady && employee.status !== "Terminated")),
  };

  function updateEmployee(updated: HrEmployee) {
    setEmployees((current) => current.map((employee) => employee.id === updated.id ? updated : employee));
    setSelectedEmployee(updated);
  }

  function markReady(employee: HrEmployee) {
    const updated: HrEmployee = {
      ...employee,
      status: employee.status === "Terminated" ? employee.status : "Active",
      onboardingStatus: "Ready for Assignment",
      staffingReady: employee.role === "RBT" || employee.staffingReady,
      riskLevel: employee.role === "RBT" ? "Low" : employee.riskLevel,
      nextAction: employee.role === "RBT" ? "Available for staffing assignment" : "Ready for department assignment",
      timeline: [{ title: "Marked ready for assignment", date: "Apr 27", detail: employee.role === "RBT" ? "RBT is now available in staffing demo data." : "Employee is ready for assignment." }, ...employee.timeline],
    };
    updateEmployee(updated);
    toast.success(`${employee.employee} marked ready for assignment`);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">HR Dashboard</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Employee lifecycle, onboarding, training, reviews, and workforce health.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.success("HR dashboard export prepared")}><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button size="sm" className="shadow-sm" onClick={() => toast.success("HR dashboard refreshed")}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          </div>
        </div>
        <div className="sticky top-0 z-20 rounded-xl border border-border/60 bg-card/95 p-4 shadow-sm backdrop-blur-xl">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Filter className="h-4 w-4 text-primary" />HR Filters</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-9">
            <Select value={dateRange} onValueChange={setDateRange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Today", "This Week", "This Month", "Quarter to Date", "Year to Date", "Custom Range"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            <FilterSelect value={stateFilter} setValue={setStateFilter} items={states} allLabel="All States" />
            <FilterSelect value={departmentFilter} setValue={setDepartmentFilter} items={departments} allLabel="All Departments" />
            <FilterSelect value={roleFilter} setValue={setRoleFilter} items={roles} allLabel="All Roles" />
            <FilterSelect value={managerFilter} setValue={setManagerFilter} items={managers} allLabel="All Managers" />
            <FilterSelect value={statusFilter} setValue={setStatusFilter} items={statuses} allLabel="All Statuses" />
            <FilterSelect value={trainingFilter} setValue={setTrainingFilter} items={trainingStatuses} allLabel="All Training" />
            <FilterSelect value={reviewFilter} setValue={setReviewFilter} items={reviewStatuses} allLabel="All Reviews" />
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employees…" className="pl-9" /></div>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => <button key={kpi.key} type="button" onClick={() => setActiveKpi(kpi.key)} className={cn("rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md", activeKpi === kpi.key ? "border-primary ring-2 ring-primary/15" : "border-border/60")}>
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{kpi.title}</p><p className="mt-2 text-2xl font-semibold text-foreground">{kpi.value}</p></div><span className={cn("rounded-lg p-2", toneClass(kpi.tone))}><kpi.icon className="h-4 w-4" /></span></div>
          <p className="mt-3 text-xs text-muted-foreground">{kpi.subtext}</p>
        </button>)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card title="HR Action Queue" icon={ListChecks}>
          <div className="grid gap-3 lg:grid-cols-3">
            <QueueColumn title="Urgent Now" rows={queue.urgent} onSelect={setSelectedEmployee} onReady={markReady} />
            <QueueColumn title="Follow-Up Today" rows={queue.today} onSelect={setSelectedEmployee} onReady={markReady} />
            <QueueColumn title="Workforce Risks" rows={queue.risks} onSelect={setSelectedEmployee} onReady={markReady} />
          </div>
        </Card>
        <Card title="Workforce Health Snapshot" icon={HeartHandshake}>
          <HealthSnapshot rows={filtered} />
        </Card>
      </section>

      <Card title="Employee Lifecycle Board" icon={Briefcase}>
        <LifecycleBoard rows={filtered} />
      </Card>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card title="Onboarding Readiness" icon={UserCheck}><OnboardingPanel rows={filtered} /></Card>
        <Card title="Training & Compliance" icon={GraduationCap}><TrainingPanel rows={filtered} /></Card>
        <Card title="Reviews & Performance" icon={CalendarCheck}><ReviewsPanel rows={filtered} /></Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card title="Workforce Structure Snapshot" icon={UserCog}><StructureSnapshot rows={filtered} /></Card>
        <Card title="HR Worklist" icon={Users}><Worklist rows={kpiRows} onSelect={setSelectedEmployee} /></Card>
      </section>

      <EmployeePanel employee={selectedEmployee} onOpenChange={(open) => !open && setSelectedEmployee(null)} onReady={markReady} onUpdate={updateEmployee} />
    </div>
  );
}

function FilterSelect({ value, setValue, items, allLabel }: { value: string; setValue: (value: string) => void; items: string[]; allLabel: string }) {
  return <Select value={value} onValueChange={setValue}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{items.map((item) => <SelectItem key={item} value={item}>{item === ALL ? allLabel : item}</SelectItem>)}</SelectContent></Select>;
}

function Card({ title, icon: Icon, children }: { title: string; icon: typeof Users; children: React.ReactNode }) {
  return <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-base font-semibold text-foreground"><Icon className="h-4 w-4 text-primary" />{title}</h2></div>{children}</section>;
}

function toneClass(tone: "success" | "warning" | "critical" | "info") {
  return tone === "success" ? "bg-success/10 text-success" : tone === "warning" ? "bg-warning/15 text-warning" : tone === "critical" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary";
}

function StatusPill({ label, tone }: { label: string; tone: "success" | "warning" | "critical" | "info" }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold", toneClass(tone))}>{label}</span>;
}

function employeeIssue(employee: HrEmployee) {
  if (employee.documents.some((doc) => doc.status === "Missing") || !employee.onboarding.i9) return "Missing onboarding document";
  if (!employee.onboarding.backgroundCheck) return "Background check not complete";
  if (!employee.onboarding.orientation) return "Orientation not scheduled";
  if (employee.trainingStatus === "Overdue") return "Training overdue";
  if (employee.reviewStatus === "Overdue") return "Review overdue";
  if (!employee.manager) return "No manager assigned";
  if (employee.timeClockStatus !== "Clean") return "Time clock exception";
  if (employee.payrollStatus !== "Ready") return "Payroll exception";
  if (!employee.onboarding.centralReach) return "CentralReach account missing";
  if (employee.role === "RBT" && !employee.staffingReady && employee.status !== "Terminated") return "RBT not ready for staffing";
  return employee.nextAction;
}

function QueueColumn({ title, rows, onSelect, onReady }: { title: string; rows: HrEmployee[]; onSelect: (employee: HrEmployee) => void; onReady: (employee: HrEmployee) => void }) {
  return <div className="rounded-lg border border-border/60 bg-background p-3"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold text-foreground">{title}</p><span className="text-xs text-muted-foreground">{rows.length}</span></div><div className="space-y-2">{rows.slice(0, 5).map((employee) => <div key={`${title}-${employee.id}`} className="rounded-lg border border-border/50 bg-card p-3"><button type="button" onClick={() => onSelect(employee)} className="w-full text-left"><div className="flex items-start justify-between gap-2"><p className="text-sm font-medium text-foreground">{employee.employee}</p><StatusPill label={employee.riskLevel} tone={healthTone(employee.riskLevel)} /></div><p className="mt-1 text-xs text-muted-foreground">{employee.role} · {employee.state} · {employee.department}</p><p className="mt-2 text-xs font-medium text-foreground">{employeeIssue(employee)}</p><p className="mt-1 text-xs text-muted-foreground">Manager: {employee.manager ?? "Unassigned"}</p></button><div className="mt-3 grid grid-cols-2 gap-1.5"><QuickAction label="Open" icon={ArrowRight} onClick={() => onSelect(employee)} /><QuickAction label="Training" icon={GraduationCap} onClick={() => toast.success(`Training assigned to ${employee.employee}`)} /><QuickAction label="Review" icon={CalendarCheck} onClick={() => toast.success(`Review scheduled for ${employee.employee}`)} /><QuickAction label="Doc" icon={FileText} onClick={() => toast.success(`Document requested from ${employee.employee}`)} /><QuickAction label="Done" icon={CheckCircle2} onClick={() => toast.success(`Task marked complete for ${employee.employee}`)} /><QuickAction label="Remind" icon={Send} onClick={() => toast.success(`Reminder sent to ${employee.employee}`)} /></div>{employee.onboardingStatus !== "Ready for Assignment" && <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => onReady(employee)}>Mark Ready</Button>}</div>)}{rows.length === 0 && <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">No current items.</p>}</div></div>;
}

function QuickAction({ label, icon: Icon, onClick }: { label: string; icon: typeof ArrowRight; onClick: () => void }) {
  return <Button type="button" variant="ghost" size="sm" className="h-8 justify-start gap-1.5 px-2 text-xs" onClick={onClick}><Icon className="h-3.5 w-3.5" />{label}</Button>;
}

function HealthSnapshot({ rows }: { rows: HrEmployee[] }) {
  const items = [
    ["Ready for assignment", rows.filter((e) => e.staffingReady).length, "success"],
    ["Onboarding blocked", rows.filter((e) => e.onboardingStatus === "Missing Docs" || !e.onboarding.backgroundCheck || !e.onboarding.i9).length, "critical"],
    ["Reviews due", rows.filter((e) => ["Due Soon", "Overdue"].includes(e.reviewStatus)).length, "warning"],
    ["Training overdue", rows.filter((e) => e.trainingStatus === "Overdue").length, "critical"],
    ["Payroll exceptions", rows.filter((e) => e.payrollStatus !== "Ready").length, "critical"],
    ["Manager gaps", rows.filter((e) => !e.manager).length, "warning"],
  ] as const;
  return <div className="grid gap-3 sm:grid-cols-2">{items.map(([label, value, tone]) => <div key={label} className="rounded-lg border border-border/60 bg-background p-4"><StatusPill label={label} tone={tone} /><p className="mt-3 text-2xl font-semibold text-foreground">{value}</p></div>)}</div>;
}

function LifecycleBoard({ rows }: { rows: HrEmployee[] }) {
  const stages: EmployeeStatus[] = ["Pre-Hire", "Onboarding", "Training", "Active", "Review Due", "At Risk", "Inactive", "Terminated"];
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">{stages.map((stage) => { const matching = rows.filter((employee) => employee.status === stage); const oldest = matching.length ? Math.max(...matching.map((employee) => daysSince(employee.stageEnteredAt))) : 0; const average = avg(matching.map((employee) => daysSince(employee.stageEnteredAt))); const tone = stage === "At Risk" || oldest > 21 ? "critical" : oldest > 10 ? "warning" : "success"; return <div key={stage} className="rounded-lg border border-border/60 bg-background p-4"><div className="flex items-start justify-between"><p className="text-sm font-semibold text-foreground">{stage}</p><StatusPill label={tone === "success" ? "Green" : tone === "warning" ? "Yellow" : "Red"} tone={tone} /></div><p className="mt-3 text-2xl font-semibold text-foreground">{matching.length}</p><p className="mt-2 text-xs text-muted-foreground">Oldest {oldest}d · Avg {average}d</p></div>; })}</div>;
}

function OnboardingPanel({ rows }: { rows: HrEmployee[] }) {
  const statuses = ["Not Started", "In Progress", "Missing Docs", "Ready for Orientation", "Ready for Assignment", "Active"];
  const checklist = ["viventium", "backgroundCheck", "i9", "orientation", "stateTraining", "centralReach", "complianceDocs"] as const;
  const labels: Record<(typeof checklist)[number], string> = { viventium: "Viventium onboarding", backgroundCheck: "Background check", i9: "I-9 / E-Verify", orientation: "Orientation", stateTraining: "State training", centralReach: "CentralReach account", complianceDocs: "Compliance documents" };
  return <div className="space-y-4"><div className="grid grid-cols-2 gap-2">{statuses.map((status) => <div key={status} className="rounded-lg bg-background p-3 ring-1 ring-border/60"><p className="text-xs text-muted-foreground">{status}</p><p className="text-xl font-semibold text-foreground">{rows.filter((e) => e.onboardingStatus === status).length}</p></div>)}</div><Separator />{checklist.map((key) => { const complete = rows.filter((employee) => employee.onboarding[key]).length; return <div key={key} className="space-y-1"><div className="flex justify-between text-sm"><span className="text-foreground">{labels[key]}</span><span className="text-muted-foreground">{pct(rows.length ? (complete / rows.length) * 100 : 0)}</span></div><Progress value={rows.length ? (complete / rows.length) * 100 : 0} className="h-2" /></div>; })}</div>;
}

function TrainingPanel({ rows }: { rows: HrEmployee[] }) {
  const assigned = rows.flatMap((e) => e.trainings).length;
  const complete = rows.flatMap((e) => e.trainings).filter((t) => t.status === "Complete").length;
  const overdue = rows.flatMap((e) => e.trainings).filter((t) => t.status === "Overdue").length;
  return <div className="space-y-4"><div className="grid grid-cols-3 gap-2 text-center"><Metric label="Assigned" value={assigned} /><Metric label="Complete" value={complete} /><Metric label="Overdue" value={overdue} critical={overdue > 0} /></div><Breakdown title="By Department" rows={groupCount(rows, (e) => e.department)} /><Breakdown title="By Role" rows={groupCount(rows, (e) => e.role)} /><Breakdown title="By State" rows={groupCount(rows, (e) => e.state)} /></div>;
}

function ReviewsPanel({ rows }: { rows: HrEmployee[] }) {
  const reviews = rows.flatMap((e) => e.reviews);
  const due = reviews.filter((review) => review.status === "Due Soon").length;
  const overdue = reviews.filter((review) => review.status === "Overdue").length;
  const completed = reviews.filter((review) => review.status === "Completed").length;
  return <div className="space-y-4"><div className="grid grid-cols-3 gap-2 text-center"><Metric label="Due soon" value={due} /><Metric label="Overdue" value={overdue} critical={overdue > 0} /><Metric label="Completed" value={completed} /></div>{["30-day", "60-day", "90-day", "3-month", "6-month", "Annual"].map((label) => <div key={label} className="flex items-center justify-between rounded-lg bg-background p-3 ring-1 ring-border/60"><span className="text-sm text-foreground">{label} reviews</span><span className="text-sm font-semibold text-foreground">{reviews.filter((review) => review.name.toLowerCase().includes(label.toLowerCase().split("-")[0])).length}</span></div>)}<p className="rounded-lg bg-success/10 p-3 text-sm text-success">{reviews.filter((r) => r.bonusEligible).length} employees currently bonus eligible.</p></div>;
}

function Metric({ label, value, critical }: { label: string; value: number; critical?: boolean }) {
  return <div className="rounded-lg bg-background p-3 ring-1 ring-border/60"><p className="text-xs text-muted-foreground">{label}</p><p className={cn("text-xl font-semibold", critical ? "text-destructive" : "text-foreground")}>{value}</p></div>;
}

function groupCount<T extends string>(rows: HrEmployee[], get: (employee: HrEmployee) => T) {
  return Object.entries(rows.reduce<Record<string, number>>((acc, employee) => ({ ...acc, [get(employee)]: (acc[get(employee)] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
}

function Breakdown({ title, rows }: { title: string; rows: [string, number][] }) {
  return <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p><div className="space-y-2">{rows.map(([label, count]) => <div key={label} className="flex items-center justify-between text-sm"><span className="text-foreground">{label}</span><span className="font-medium text-muted-foreground">{count}</span></div>)}</div></div>;
}

function StructureSnapshot({ rows }: { rows: HrEmployee[] }) {
  return <div className="space-y-5"><Breakdown title="Headcount by State" rows={groupCount(rows, (e) => e.state)} /><Breakdown title="Headcount by Department" rows={groupCount(rows, (e) => e.department)} /><Breakdown title="Headcount by Role" rows={groupCount(rows, (e) => e.role)} /><div className="rounded-lg border border-warning/30 bg-warning/10 p-3"><p className="text-sm font-semibold text-foreground">Reporting gaps</p><p className="mt-1 text-sm text-muted-foreground">{rows.filter((e) => !e.manager).length} employees without manager assigned.</p></div></div>;
}

function Worklist({ rows, onSelect }: { rows: HrEmployee[]; onSelect: (employee: HrEmployee) => void }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[1320px] text-sm"><thead className="text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{["Employee", "Role", "State", "Department", "Manager", "Status", "Onboarding", "Training", "Review", "Time Clock", "Payroll", "Next Action", "Alerts"].map((header) => <th key={header} className="px-3 py-2 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-border/50">{rows.map((employee) => <tr key={employee.id} onClick={() => onSelect(employee)} className="cursor-pointer hover:bg-muted/30"><td className="px-3 py-3 font-medium text-foreground">{employee.employee}<p className="text-xs text-muted-foreground">{employee.email}</p></td><td className="px-3 py-3">{employee.role}</td><td className="px-3 py-3">{employee.state}</td><td className="px-3 py-3">{employee.department}</td><td className="px-3 py-3">{employee.manager ?? "—"}</td><td className="px-3 py-3"><StatusPill label={employee.status} tone={employee.status === "At Risk" ? "critical" : employee.status === "Onboarding" || employee.status === "Training" ? "warning" : "success"} /></td><td className="px-3 py-3">{employee.onboardingStatus}</td><td className="px-3 py-3">{employee.trainingStatus}</td><td className="px-3 py-3">{employee.reviewStatus}</td><td className="px-3 py-3">{employee.timeClockStatus}</td><td className="px-3 py-3">{employee.payrollStatus}</td><td className="px-3 py-3">{employee.nextAction}</td><td className="px-3 py-3"><StatusPill label={employee.riskLevel} tone={healthTone(employee.riskLevel)} /></td></tr>)}</tbody></table></div>;
}

function EmployeePanel({ employee, onOpenChange, onReady, onUpdate }: { employee: HrEmployee | null; onOpenChange: (open: boolean) => void; onReady: (employee: HrEmployee) => void; onUpdate: (employee: HrEmployee) => void }) {
  return <Sheet open={!!employee} onOpenChange={onOpenChange}><SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl"><SheetHeader>{employee && <><SheetTitle>{employee.employee}</SheetTitle><SheetDescription>{employee.role} · {employee.department} · {employee.state}</SheetDescription></>}</SheetHeader>{employee && <div className="mt-4 space-y-4"><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => onReady(employee)}><UserCheck className="mr-2 h-4 w-4" />Mark Ready</Button><Button size="sm" variant="outline" onClick={() => toast.success(`Reminder sent to ${employee.employee}`)}><Bell className="mr-2 h-4 w-4" />Send Reminder</Button></div><Tabs defaultValue="overview"><TabsList className="grid h-auto grid-cols-3 gap-1 md:grid-cols-5">{["overview", "onboarding", "training", "reviews", "time", "documents", "communications", "tasks", "timeline"].map((tab) => <TabsTrigger key={tab} value={tab} className="capitalize">{tab === "time" ? "Time" : tab}</TabsTrigger>)}</TabsList><TabsContent value="overview"><PanelBlock items={[["Employee", employee.employee], ["Role", employee.role], ["State", employee.state], ["Department", employee.department], ["Manager", employee.manager ?? "Unassigned"], ["Status", employee.status], ["Start date", employee.startDate], ["Risk level", employee.riskLevel]]} /></TabsContent><TabsContent value="onboarding"><Checklist employee={employee} onUpdate={onUpdate} /></TabsContent><TabsContent value="training"><List items={employee.trainings.map((t) => `${t.name} · ${t.status} · Due ${t.dueDate}${t.certificate ? ` · ${t.certificate}` : ""}`)} /></TabsContent><TabsContent value="reviews"><List items={employee.reviews.map((r) => `${r.name} · ${r.status} · ${r.dueDate} · ${r.score ? `${r.score}/100` : "not scored"} · ${r.bonusEligible ? "bonus eligible" : "no bonus"}`)} /></TabsContent><TabsContent value="time"><PanelBlock items={[["Time clock", employee.timeClockStatus], ["Payroll readiness", employee.payrollStatus], ["Hours this sample", String(employee.timeEntries.reduce((s, e) => s + e.hours, 0))], ["Exceptions", String(employee.timeEntries.filter((e) => e.status !== "Clean").length)]]} /><List items={employee.timeEntries.map((entry) => `${entry.date} · ${entry.hours}h · ${entry.status} · ${entry.note}`)} /></TabsContent><TabsContent value="documents"><List items={employee.documents.map((d) => `${d.name} · ${d.category} · ${d.status}`)} /></TabsContent><TabsContent value="communications"><List items={employee.communications.map((c) => `${c.date} · ${c.author} · ${c.type}: ${c.note}`)} /></TabsContent><TabsContent value="tasks"><List items={employee.tasks.map((t) => `${t.completed ? "Complete" : "Open"} · ${t.title} · ${t.owner} · ${t.dueDate}`)} /></TabsContent><TabsContent value="timeline"><div className="space-y-3">{employee.timeline.map((event, index) => <div key={`${event.title}-${index}`} className="flex gap-3"><span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span><div className="rounded-lg bg-background p-3 ring-1 ring-border/60"><p className="text-sm font-medium text-foreground">{event.title}</p><p className="text-xs text-muted-foreground">{event.date} · {event.detail}</p></div></div>)}</div></TabsContent></Tabs></div>}</SheetContent></Sheet>;
}

function PanelBlock({ items }: { items: Array<[string, string]> }) {
  return <div className="mt-4 grid gap-3 sm:grid-cols-2">{items.map(([label, value]) => <div key={label} className="rounded-lg border border-border/60 bg-background p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium text-foreground">{value}</p></div>)}<Separator className="sm:col-span-2" /></div>;
}

function List({ items }: { items: string[] }) {
  return <div className="mt-4 space-y-2">{items.map((item) => <p key={item} className="rounded-lg bg-background p-3 text-sm text-foreground ring-1 ring-border/60">{item}</p>)}</div>;
}

function Checklist({ employee, onUpdate }: { employee: HrEmployee; onUpdate: (employee: HrEmployee) => void }) {
  const items = [
    ["viventium", "Viventium status"], ["backgroundCheck", "Background check"], ["i9", "I-9 / E-Verify"], ["orientation", "Orientation"], ["centralReach", "CentralReach account"], ["complianceDocs", "Required documents"],
  ] as const;
  return <div className="mt-4 space-y-2">{items.map(([key, label]) => <button key={key} type="button" onClick={() => onUpdate({ ...employee, onboarding: { ...employee.onboarding, [key]: !employee.onboarding[key] }, timeline: [{ title: `${label} updated`, date: "Apr 27", detail: "Checklist changed from HR detail panel." }, ...employee.timeline] })} className="flex w-full items-center justify-between rounded-lg bg-background p-3 text-left ring-1 ring-border/60 hover:bg-secondary"><span className="text-sm font-medium text-foreground">{label}</span>{employee.onboarding[key] ? <CheckCircle2 className="h-4 w-4 text-success" /> : <AlertTriangle className="h-4 w-4 text-warning" />}</button>)}</div>;
}
