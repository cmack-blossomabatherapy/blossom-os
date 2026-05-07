import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, ArrowRight, Bell, Briefcase, CalendarCheck, CheckCircle2, Clock, Download, FileText,
  Filter, GraduationCap, HeartHandshake, ListChecks, RefreshCw, Search, Send, UserCheck,
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
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { employeeFullName, type Department, type Employee } from "@/lib/hr/types";

type KpiKey = "active" | "onboarding" | "training" | "reviews" | "documents" | "time" | "payroll" | "risk";
type DashboardStatus = "Pre-Hire" | "Onboarding" | "Training" | "Active" | "Review Due" | "At Risk" | "Inactive" | "Terminated";
type DashboardTrainingStatus = "Complete" | "In Progress" | "Overdue" | "Not Assigned";
type DashboardReviewStatus = "Current" | "Due Soon" | "Overdue" | "Completed";
type TimeClockStatus = "Clean" | "Missing Punch" | "Late Approval" | "Exception";
type PayrollStatus = "Ready" | "Exception" | "Needs Review";
type RiskLevel = "Low" | "Medium" | "High" | "Critical";
type Tone = "success" | "warning" | "critical" | "info";

interface HrTask { id: string; title: string; owner: string; dueDate: string; completed: boolean; type: string; }
interface HrTraining { name: string; category: string; status: DashboardTrainingStatus; dueDate: string; certificate?: string; }
interface HrReview { name: string; status: DashboardReviewStatus; dueDate: string; score?: number; bonusEligible?: boolean; notes: string; }
interface HrDocument { name: string; category: string; status: "Complete" | "Missing" | "Requested" | "Expired"; }
interface HrTimeEntry { date: string; hours: number; status: TimeClockStatus; note: string; }
interface HrCommunication { author: string; note: string; date: string; type: "HR" | "Manager" | "Employee"; }
interface HrTimelineEvent { title: string; date: string; detail: string; }
interface HrEmployee {
  id: string;
  employee: string;
  email: string;
  role: string;
  state: string;
  department: string;
  manager: string | null;
  status: DashboardStatus;
  onboardingStatus: string;
  onboardingRecordId: string | null;
  trainingStatus: DashboardTrainingStatus;
  reviewStatus: DashboardReviewStatus;
  timeClockStatus: TimeClockStatus;
  payrollStatus: PayrollStatus;
  startDate: string;
  stageEnteredAt: string;
  workload: number;
  riskLevel: RiskLevel;
  staffingReady: boolean;
  grandfathered: boolean;
  nextAction: string;
  onboarding: { viventium: boolean; backgroundCheck: boolean; i9: boolean; orientation: boolean; stateTraining: boolean; centralReach: boolean; complianceDocs: boolean; };
  trainings: HrTraining[];
  reviews: HrReview[];
  documents: HrDocument[];
  timeEntries: HrTimeEntry[];
  communications: HrCommunication[];
  tasks: HrTask[];
  timeline: HrTimelineEvent[];
}

const ALL = "All";
const dayMs = 1000 * 60 * 60 * 24;
const today = new Date();
const pct = (value: number) => `${Math.round(value)}%`;
const avg = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
const daysSince = (date: string) => Math.max(0, Math.floor((today.getTime() - new Date(date).getTime()) / dayMs));
const formatShortDate = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value)) : "—";
const isoToday = () => new Date().toISOString().slice(0, 10);

const healthTone = (value: RiskLevel | "good" | "watch" | "bad"): Tone => {
  if (value === "Low" || value === "good") return "success";
  if (value === "Medium" || value === "watch") return "warning";
  return "critical";
};

function toTitle(value: string | null | undefined) {
  return (value ?? "").split("_").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") || "—";
}

function displayStatus(status: string, hasOverdueReview: boolean, highRisk: boolean): DashboardStatus {
  if (status === "terminated" || status === "resigned") return "Terminated";
  if (status === "pending_start") return "Pre-Hire";
  if (status === "on_leave" || status === "on_hold") return "Inactive";
  if (highRisk) return "At Risk";
  if (hasOverdueReview) return "Review Due";
  return "Active";
}

function trainingStatus(rows: any[]): DashboardTrainingStatus {
  if (!rows.length) return "Not Assigned";
  if (rows.some((r) => r.status === "expired" || (r.due_date && r.due_date < isoToday() && r.status !== "completed" && r.status !== "waived"))) return "Overdue";
  if (rows.some((r) => r.status === "assigned" || r.status === "in_progress")) return "In Progress";
  return "Complete";
}

function reviewStatus(rows: any[]): DashboardReviewStatus {
  const open = rows.filter((r) => !["completed", "cancelled"].includes(r.status));
  if (rows.length && open.length === 0) return "Completed";
  if (open.some((r) => r.due_date && r.due_date < isoToday())) return "Overdue";
  if (open.some((r) => r.due_date && daysSince(r.due_date) >= -30)) return "Due Soon";
  return "Current";
}

function payrollStatus(timesheets: any[], bonuses: any[], payChanges: any[]): PayrollStatus {
  if (timesheets.some((r) => ["rejected"].includes(r.status)) || bonuses.some((r) => r.status === "pending_approval") || payChanges.some((r) => r.status === "proposed")) return "Exception";
  if (timesheets.some((r) => ["draft", "submitted"].includes(r.status))) return "Needs Review";
  return "Ready";
}

function timeStatus(exceptions: any[], punches: any[]): TimeClockStatus {
  if (exceptions.some((e) => e.status === "open" && ["missed_clock_in", "missed_clock_out"].includes(e.kind))) return "Missing Punch";
  if (exceptions.some((e) => e.status === "open")) return "Exception";
  if (punches.some((p) => p.status === "pending")) return "Late Approval";
  return "Clean";
}

function riskLevel(employeeStatus: DashboardStatus, training: DashboardTrainingStatus, review: DashboardReviewStatus, time: TimeClockStatus, payroll: PayrollStatus, manager: string | null, missingDocs: boolean): RiskLevel {
  if (employeeStatus === "At Risk" || training === "Overdue" || review === "Overdue" || payroll === "Exception" || missingDocs) return "Critical";
  if (!manager || time !== "Clean" || payroll === "Needs Review") return "High";
  if (employeeStatus === "Pre-Hire" || employeeStatus === "Onboarding" || training === "In Progress" || review === "Due Soon") return "Medium";
  return "Low";
}

function issueText(employee: HrEmployee) {
  if (employee.documents.some((doc) => doc.status === "Missing") || !employee.onboarding.i9) return "Missing onboarding document";
  if (!employee.onboarding.backgroundCheck) return "Background check not complete";
  if (!employee.onboarding.orientation) return "Orientation not scheduled";
  if (employee.trainingStatus === "Overdue") return "Training overdue";
  if (employee.reviewStatus === "Overdue") return "Review overdue";
  if (!employee.manager) return "No manager assigned";
  if (employee.timeClockStatus !== "Clean") return "Time clock exception";
  if (employee.payrollStatus !== "Ready") return "Payroll exception";
  return employee.nextAction;
}

export default function HRDashboard() {
  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [selectedEmployee, setSelectedEmployee] = useState<HrEmployee | null>(null);

  useEffect(() => { void loadDashboard(); }, []);

  async function loadDashboard() {
    setLoading(true);
    const [emp, dept, rel, onb, onbTasks, docs, trainings, reviews, punches, exceptions, timesheets, bonuses, payChanges, cases, notes, timeline] = await Promise.all([
      supabase.from("employees").select("*").order("last_name"),
      supabase.from("hr_departments").select("*"),
      supabase.from("employee_relationships").select("*, related:employees!employee_relationships_related_employee_id_fkey(id, first_name, last_name, preferred_name)").eq("kind", "direct_manager"),
      supabase.from("employee_onboarding").select("*"),
      supabase.from("employee_onboarding_tasks").select("*"),
      supabase.from("employee_documents_hr").select("*"),
      supabase.from("employee_trainings").select("*, course:training_courses(name, category, renewal_months)").order("due_date", { ascending: true, nullsFirst: false }),
      supabase.from("employee_reviews").select("*").order("due_date", { ascending: true, nullsFirst: false }),
      supabase.from("time_clock_punches").select("*").gte("punch_at", new Date(Date.now() - 14 * dayMs).toISOString()),
      supabase.from("attendance_exceptions").select("*"),
      supabase.from("hours_timesheets").select("*").gte("period_start", new Date(Date.now() - 45 * dayMs).toISOString().slice(0, 10)),
      supabase.from("employee_bonuses").select("*"),
      supabase.from("employee_pay_changes").select("*"),
      supabase.from("employee_cases").select("*"),
      supabase.from("employee_notes").select("*"),
      supabase.from("employee_timeline").select("*").order("created_at", { ascending: false }),
    ]);

    const errors = [emp, dept, rel, onb, onbTasks, docs, trainings, reviews, punches, exceptions, timesheets, bonuses, payChanges, cases, notes, timeline].map((r) => r.error).filter(Boolean);
    if (errors.length) toast.error(errors[0]?.message ?? "HR dashboard data could not load.");

    const departments = new Map(((dept.data ?? []) as Department[]).map((d) => [d.id, d]));
    const relationships = (rel.data ?? []) as any[];
    const dashboardRows = ((emp.data ?? []) as Employee[]).map((employee) => {
      const id = employee.id;
      const employeeOnboarding = ((onb.data ?? []) as any[]).find((r) => r.employee_id === id);
      const employeeOnboardingTasks = ((onbTasks.data ?? []) as any[]).filter((r) => r.onboarding_id === employeeOnboarding?.id);
      const employeeDocs = ((docs.data ?? []) as any[]).filter((r) => r.employee_id === id);
      const employeeTrainings = ((trainings.data ?? []) as any[]).filter((r) => r.employee_id === id);
      const employeeReviews = ((reviews.data ?? []) as any[]).filter((r) => r.employee_id === id);
      const employeePunches = ((punches.data ?? []) as any[]).filter((r) => r.employee_id === id);
      const employeeExceptions = ((exceptions.data ?? []) as any[]).filter((r) => r.employee_id === id);
      const employeeTimesheets = ((timesheets.data ?? []) as any[]).filter((r) => r.employee_id === id);
      const employeeBonuses = ((bonuses.data ?? []) as any[]).filter((r) => r.employee_id === id);
      const employeePayChanges = ((payChanges.data ?? []) as any[]).filter((r) => r.employee_id === id);
      const employeeCases = ((cases.data ?? []) as any[]).filter((r) => r.employee_id === id);
      const employeeNotes = ((notes.data ?? []) as any[]).filter((r) => r.employee_id === id);
      const employeeTimeline = ((timeline.data ?? []) as any[]).filter((r) => r.employee_id === id);
      const managerRel = relationships.find((r) => r.employee_id === id && r.related);
      const manager = managerRel?.related ? employeeFullName(managerRel.related as Employee) : null;
      const training = trainingStatus(employeeTrainings);
      const review = reviewStatus(employeeReviews);
      const time = timeStatus(employeeExceptions, employeePunches);
      const payroll = payrollStatus(employeeTimesheets, employeeBonuses, employeePayChanges);
      const documents: HrDocument[] = employeeDocs.map((d) => ({ name: d.name, category: toTitle(d.doc_type), status: d.status === "verified" || d.status === "uploaded" ? "Complete" : d.status === "missing" ? "Missing" : d.status === "expired" ? "Expired" : "Requested" }));
      const missingRequiredDocs = documents.some((d) => ["Missing", "Requested", "Expired"].includes(d.status));
      const highRisk = employeeCases.some((c) => ["high", "urgent"].includes(c.priority) && !["resolved", "closed"].includes(c.status));
      const status = displayStatus(employee.status, review === "Overdue", highRisk);
      const risk = riskLevel(status, training, review, time, payroll, manager, missingRequiredDocs);
      const onboardingStatus = employeeOnboarding ? toTitle(employeeOnboarding.status) : status === "Pre-Hire" ? "Not Started" : "Active";
      const nextAction = issueText({
        id, employee: employeeFullName(employee), email: employee.email ?? "", role: employee.job_title, state: employee.state, department: departments.get(employee.department_id ?? "")?.name ?? "Unassigned", manager, status, onboardingStatus, onboardingRecordId: employeeOnboarding?.id ?? null, trainingStatus: training, reviewStatus: review, timeClockStatus: time, payrollStatus: payroll, startDate: employee.start_date ?? employee.hire_date ?? "—", stageEnteredAt: employeeOnboarding?.stage_entered_at ?? employee.updated_at, workload: employeeTimesheets.reduce((sum, sheet) => sum + Number(sheet.total_hours || 0), 0), riskLevel: risk, staffingReady: false, grandfathered: !!(employee as any).grandfathered, nextAction: "Review employee record", onboarding: { viventium: !!employee.viventium_employee_id, backgroundCheck: !employeeDocs.some((d) => d.doc_type?.includes("background") && d.status !== "verified"), i9: employeeDocs.some((d) => d.doc_type?.toLowerCase().includes("i9") && ["uploaded", "verified"].includes(d.status)), orientation: employeeOnboardingTasks.some((t) => t.title?.toLowerCase().includes("orientation") && t.completed), stateTraining: employeeTrainings.some((t) => t.course?.category?.toLowerCase().includes("state") && t.status === "completed"), centralReach: !employeeOnboardingTasks.some((t) => t.title?.toLowerCase().includes("centralreach") && !t.completed), complianceDocs: !missingRequiredDocs }, trainings: [], reviews: [], documents, timeEntries: [], communications: [], tasks: [], timeline: []
      });

      return {
        id,
        employee: employeeFullName(employee),
        email: employee.email ?? "—",
        role: employee.job_title,
        state: employee.state,
        department: departments.get(employee.department_id ?? "")?.name ?? "Unassigned",
        manager,
        status,
        onboardingStatus,
        onboardingRecordId: employeeOnboarding?.id ?? null,
        trainingStatus: training,
        reviewStatus: review,
        timeClockStatus: time,
        payrollStatus: payroll,
        startDate: employee.start_date ?? employee.hire_date ?? "—",
        stageEnteredAt: employeeOnboarding?.stage_entered_at ?? employee.updated_at,
        workload: employeeTimesheets.reduce((sum, sheet) => sum + Number(sheet.total_hours || 0), 0),
        riskLevel: risk,
        staffingReady: employee.status === "active" && !missingRequiredDocs && training !== "Overdue" && review !== "Overdue",
        grandfathered: !!(employee as any).grandfathered,
        nextAction,
        onboarding: {
          viventium: !!employee.viventium_employee_id,
          backgroundCheck: !employeeDocs.some((d) => d.doc_type?.includes("background") && d.status !== "verified"),
          i9: employeeDocs.some((d) => d.doc_type?.toLowerCase().includes("i9") && ["uploaded", "verified"].includes(d.status)),
          orientation: employeeOnboardingTasks.some((t) => t.title?.toLowerCase().includes("orientation") && t.completed),
          stateTraining: employeeTrainings.some((t) => t.course?.category?.toLowerCase().includes("state") && t.status === "completed"),
          centralReach: !employeeOnboardingTasks.some((t) => t.title?.toLowerCase().includes("centralreach") && !t.completed),
          complianceDocs: !missingRequiredDocs,
        },
        trainings: employeeTrainings.map((t) => ({ name: t.course?.name ?? "Training", category: t.course?.category ?? "Training", status: t.status === "completed" ? "Complete" : t.status === "expired" || (t.due_date && t.due_date < isoToday() && t.status !== "waived") ? "Overdue" : t.status === "in_progress" ? "In Progress" : "Not Assigned", dueDate: formatShortDate(t.due_date), certificate: t.certificate_url ?? undefined })),
        reviews: employeeReviews.map((r) => ({ name: REVIEW_LABELS[r.review_type as keyof typeof REVIEW_LABELS] ?? toTitle(r.review_type), status: r.status === "completed" ? "Completed" : r.due_date && r.due_date < isoToday() ? "Overdue" : r.due_date ? "Due Soon" : "Current", dueDate: formatShortDate(r.due_date), score: r.overall_rating ? REVIEW_SCORE[r.overall_rating as keyof typeof REVIEW_SCORE] : undefined, bonusEligible: r.overall_rating === "exceeds" || r.overall_rating === "meets", notes: r.manager_comments ?? r.strengths ?? "" })),
        documents,
        timeEntries: employeeTimesheets.map((sheet) => ({ date: formatShortDate(sheet.period_start), hours: Number(sheet.total_hours || 0), status: sheet.status === "rejected" ? "Exception" : sheet.status === "submitted" ? "Late Approval" : "Clean", note: toTitle(sheet.status) })),
        communications: employeeNotes.slice(0, 5).map((note) => ({ author: note.author_name ?? "HR", note: note.body, date: formatShortDate(note.created_at), type: "HR" as const })),
        tasks: [
          ...employeeOnboardingTasks.map((task) => ({ id: task.id, title: task.title, owner: toTitle(task.owner_role), dueDate: formatShortDate(task.due_date), completed: task.completed, type: toTitle(task.category) })),
          ...employeeCases.filter((c) => !["resolved", "closed"].includes(c.status)).map((c) => ({ id: c.id, title: c.title, owner: toTitle(c.owner_role), dueDate: formatShortDate(c.due_date), completed: false, type: toTitle(c.case_type) })),
        ],
        timeline: employeeTimeline.slice(0, 8).map((event) => ({ title: toTitle(event.event_type), date: formatShortDate(event.created_at), detail: event.description })),
      } satisfies HrEmployee;
    });
    setEmployees(dashboardRows);
    setLoading(false);
  }

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
  const riskRows = filtered.filter((employee) => !employee.grandfathered && (["High", "Critical"].includes(employee.riskLevel) || !employee.manager || (employee.status === "Inactive" && employee.staffingReady)));
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

  const kpis: Array<{ key: KpiKey; title: string; value: number; subtext: string; icon: typeof Users; tone: Tone }> = [
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
    risks: filtered.filter((employee) => !employee.grandfathered && (["High", "Critical"].includes(employee.riskLevel) || !employee.manager || employee.workload >= 40 || (employee.role.includes("RBT") && !employee.staffingReady && employee.status !== "Terminated"))),
  };

  async function markReady(employee: HrEmployee) {
    const { error: employeeError } = await supabase.from("employees").update({ status: "active" }).eq("id", employee.id);
    if (employeeError) { toast.error(employeeError.message); return; }
    if (employee.onboardingRecordId) await supabase.from("employee_onboarding").update({ status: "ready_for_start", stage_entered_at: new Date().toISOString() }).eq("id", employee.onboardingRecordId);
    await supabase.from("employee_timeline").insert({ employee_id: employee.id, event_type: "status_changed", description: "Marked ready from HR Dashboard" });
    toast.success(`${employee.employee} marked ready for assignment`);
    await loadDashboard();
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
            <Button size="sm" className="shadow-sm" onClick={() => void loadDashboard()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
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

      {loading ? <Skeleton className="h-[520px] rounded-xl" /> : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => <button key={kpi.key} type="button" onClick={() => setActiveKpi(kpi.key)} className={cn("rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md", activeKpi === kpi.key ? "border-primary ring-2 ring-primary/15" : "border-border/60")}>
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{kpi.title}</p><p className="mt-2 text-2xl font-semibold text-foreground">{kpi.value}</p></div><span className={cn("rounded-lg p-2", toneClass(kpi.tone))}><kpi.icon className="h-4 w-4" /></span></div>
              <p className="mt-3 text-xs text-muted-foreground">{kpi.subtext}</p>
            </button>)}
          </section>
          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"><Card title="HR Action Queue" icon={ListChecks}><div className="grid gap-3 lg:grid-cols-3"><QueueColumn title="Urgent Now" rows={queue.urgent} onSelect={setSelectedEmployee} onReady={markReady} /><QueueColumn title="Follow-Up Today" rows={queue.today} onSelect={setSelectedEmployee} onReady={markReady} /><QueueColumn title="Workforce Risks" rows={queue.risks} onSelect={setSelectedEmployee} onReady={markReady} /></div></Card><Card title="Workforce Health Snapshot" icon={HeartHandshake}><HealthSnapshot rows={filtered} /></Card></section>
          <Card title="Employee Lifecycle Board" icon={Briefcase}><LifecycleBoard rows={filtered} /></Card>
          <section className="grid gap-6 xl:grid-cols-3"><Card title="Onboarding Readiness" icon={UserCheck}><OnboardingPanel rows={filtered} /></Card><Card title="Training & Compliance" icon={GraduationCap}><TrainingPanel rows={filtered} /></Card><Card title="Reviews & Performance" icon={CalendarCheck}><ReviewsPanel rows={filtered} /></Card></section>
          <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]"><Card title="Workforce Structure Snapshot" icon={UserCog}><StructureSnapshot rows={filtered} /></Card><Card title="HR Worklist" icon={Users}><Worklist rows={kpiRows} onSelect={setSelectedEmployee} /></Card></section>
        </>
      )}
      <EmployeePanel employee={selectedEmployee} onOpenChange={(open) => !open && setSelectedEmployee(null)} onReady={markReady} />
    </div>
  );
}

const REVIEW_LABELS = { "30_day": "30-Day review", "60_day": "60-Day review", "90_day": "90-Day review", annual: "Annual review", probationary: "Probationary review", ad_hoc: "Ad-hoc review" };
const REVIEW_SCORE = { exceeds: 95, meets: 85, developing: 70, needs_improvement: 60, unsatisfactory: 45 };

function FilterSelect({ value, setValue, items, allLabel }: { value: string; setValue: (value: string) => void; items: string[]; allLabel: string }) {
  return <Select value={value} onValueChange={setValue}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{items.map((item) => <SelectItem key={item} value={item}>{item === ALL ? allLabel : item}</SelectItem>)}</SelectContent></Select>;
}
function Card({ title, icon: Icon, children }: { title: string; icon: typeof Users; children: React.ReactNode }) { return <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-base font-semibold text-foreground"><Icon className="h-4 w-4 text-primary" />{title}</h2></div>{children}</section>; }
function toneClass(tone: Tone) { return tone === "success" ? "bg-success/10 text-success" : tone === "warning" ? "bg-warning/15 text-warning" : tone === "critical" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"; }
function StatusPill({ label, tone }: { label: string; tone: Tone }) { return <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold", toneClass(tone))}>{label}</span>; }
function employeeIssue(employee: HrEmployee) { return issueText(employee); }
function QueueColumn({ title, rows, onSelect, onReady }: { title: string; rows: HrEmployee[]; onSelect: (employee: HrEmployee) => void; onReady: (employee: HrEmployee) => void }) { return <div className="rounded-lg border border-border/60 bg-background p-3"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold text-foreground">{title}</p><span className="text-xs text-muted-foreground">{rows.length}</span></div><div className="space-y-2">{rows.slice(0, 5).map((employee) => <div key={`${title}-${employee.id}`} className="rounded-lg border border-border/50 bg-card p-3"><button type="button" onClick={() => onSelect(employee)} className="w-full text-left"><div className="flex items-start justify-between gap-2"><p className="text-sm font-medium text-foreground">{employee.employee}</p><StatusPill label={employee.riskLevel} tone={healthTone(employee.riskLevel)} /></div><p className="mt-1 text-xs text-muted-foreground">{employee.role} · {employee.state} · {employee.department}</p><p className="mt-2 text-xs font-medium text-foreground">{employeeIssue(employee)}</p><p className="mt-1 text-xs text-muted-foreground">Manager: {employee.manager ?? "Unassigned"}</p></button><div className="mt-3 grid grid-cols-2 gap-1.5"><QuickAction label="Open" icon={ArrowRight} onClick={() => onSelect(employee)} /><QuickAction label="Training" icon={GraduationCap} onClick={() => toast.success(`Open Training Admin to assign ${employee.employee}`)} /><QuickAction label="Review" icon={CalendarCheck} onClick={() => toast.success(`Open Reviews to schedule ${employee.employee}`)} /><QuickAction label="Doc" icon={FileText} onClick={() => toast.success(`Open profile documents for ${employee.employee}`)} /><QuickAction label="Done" icon={CheckCircle2} onClick={() => toast.success(`Use the source workflow to complete ${employee.employee}'s task`)} /><QuickAction label="Remind" icon={Send} onClick={() => toast.success(`Reminder queued for ${employee.employee}`)} /></div>{employee.onboardingStatus !== "Ready For Start" && <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => void onReady(employee)}>Mark Ready</Button>}</div>)}{rows.length === 0 && <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">No current items.</p>}</div></div>; }
function QuickAction({ label, icon: Icon, onClick }: { label: string; icon: typeof ArrowRight; onClick: () => void }) { return <Button type="button" variant="ghost" size="sm" className="h-8 justify-start gap-1.5 px-2 text-xs" onClick={onClick}><Icon className="h-3.5 w-3.5" />{label}</Button>; }
function HealthSnapshot({ rows }: { rows: HrEmployee[] }) { const items = [["Ready for assignment", rows.filter((e) => e.staffingReady).length, "success"], ["Onboarding blocked", rows.filter((e) => e.onboardingStatus === "Missing Docs" || !e.onboarding.backgroundCheck || !e.onboarding.i9).length, "critical"], ["Reviews due", rows.filter((e) => ["Due Soon", "Overdue"].includes(e.reviewStatus)).length, "warning"], ["Training overdue", rows.filter((e) => e.trainingStatus === "Overdue").length, "critical"], ["Payroll exceptions", rows.filter((e) => e.payrollStatus !== "Ready").length, "critical"], ["Manager gaps", rows.filter((e) => !e.manager).length, "warning"]] as const; return <div className="grid gap-3 sm:grid-cols-2">{items.map(([label, value, tone]) => <div key={label} className="rounded-lg border border-border/60 bg-background p-4"><StatusPill label={label} tone={tone} /><p className="mt-3 text-2xl font-semibold text-foreground">{value}</p></div>)}</div>; }
function LifecycleBoard({ rows }: { rows: HrEmployee[] }) { const stages: DashboardStatus[] = ["Pre-Hire", "Onboarding", "Training", "Active", "Review Due", "At Risk", "Inactive", "Terminated"]; return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">{stages.map((stage) => { const matching = rows.filter((employee) => employee.status === stage); const oldest = matching.length ? Math.max(...matching.map((employee) => daysSince(employee.stageEnteredAt))) : 0; const average = avg(matching.map((employee) => daysSince(employee.stageEnteredAt))); const tone = stage === "At Risk" || oldest > 21 ? "critical" : oldest > 10 ? "warning" : "success"; return <div key={stage} className="rounded-lg border border-border/60 bg-background p-4"><div className="flex items-start justify-between"><p className="text-sm font-semibold text-foreground">{stage}</p><StatusPill label={tone === "success" ? "Green" : tone === "warning" ? "Yellow" : "Red"} tone={tone} /></div><p className="mt-3 text-2xl font-semibold text-foreground">{matching.length}</p><p className="mt-2 text-xs text-muted-foreground">Oldest {oldest}d · Avg {average}d</p></div>; })}</div>; }
function OnboardingPanel({ rows }: { rows: HrEmployee[] }) { const statuses = ["Not Started", "In Progress", "Missing Docs", "Ready For Orientation", "Ready For Start", "Active"]; const checklist = ["viventium", "backgroundCheck", "i9", "orientation", "stateTraining", "centralReach", "complianceDocs"] as const; const labels: Record<(typeof checklist)[number], string> = { viventium: "Viventium onboarding", backgroundCheck: "Background check", i9: "I-9 / E-Verify", orientation: "Orientation", stateTraining: "State training", centralReach: "CentralReach account", complianceDocs: "Compliance documents" }; return <div className="space-y-4"><div className="grid grid-cols-2 gap-2">{statuses.map((status) => <div key={status} className="rounded-lg bg-background p-3 ring-1 ring-border/60"><p className="text-xs text-muted-foreground">{status}</p><p className="text-xl font-semibold text-foreground">{rows.filter((e) => e.onboardingStatus === status).length}</p></div>)}</div><Separator />{checklist.map((key) => { const complete = rows.filter((employee) => employee.onboarding[key]).length; return <div key={key} className="space-y-1"><div className="flex justify-between text-sm"><span className="text-foreground">{labels[key]}</span><span className="text-muted-foreground">{pct(rows.length ? (complete / rows.length) * 100 : 0)}</span></div><Progress value={rows.length ? (complete / rows.length) * 100 : 0} className="h-2" /></div>; })}</div>; }
function TrainingPanel({ rows }: { rows: HrEmployee[] }) { const assigned = rows.flatMap((e) => e.trainings).length; const complete = rows.flatMap((e) => e.trainings).filter((t) => t.status === "Complete").length; const overdue = rows.flatMap((e) => e.trainings).filter((t) => t.status === "Overdue").length; return <div className="space-y-4"><div className="grid grid-cols-3 gap-2 text-center"><Metric label="Assigned" value={assigned} /><Metric label="Complete" value={complete} /><Metric label="Overdue" value={overdue} critical={overdue > 0} /></div><Breakdown title="By Department" rows={groupCount(rows, (e) => e.department)} /><Breakdown title="By Role" rows={groupCount(rows, (e) => e.role)} /><Breakdown title="By State" rows={groupCount(rows, (e) => e.state)} /></div>; }
function ReviewsPanel({ rows }: { rows: HrEmployee[] }) { const reviews = rows.flatMap((e) => e.reviews); const due = reviews.filter((review) => review.status === "Due Soon").length; const overdue = reviews.filter((review) => review.status === "Overdue").length; const completed = reviews.filter((review) => review.status === "Completed").length; return <div className="space-y-4"><div className="grid grid-cols-3 gap-2 text-center"><Metric label="Due soon" value={due} /><Metric label="Overdue" value={overdue} critical={overdue > 0} /><Metric label="Completed" value={completed} /></div>{["30-day", "60-day", "90-day", "Annual"].map((label) => <div key={label} className="flex items-center justify-between rounded-lg bg-background p-3 ring-1 ring-border/60"><span className="text-sm text-foreground">{label} reviews</span><span className="text-sm font-semibold text-foreground">{reviews.filter((review) => review.name.toLowerCase().includes(label.toLowerCase().split("-")[0])).length}</span></div>)}<p className="rounded-lg bg-success/10 p-3 text-sm text-success">{reviews.filter((r) => r.bonusEligible).length} employees currently bonus eligible.</p></div>; }
function Metric({ label, value, critical }: { label: string; value: number; critical?: boolean }) { return <div className="rounded-lg bg-background p-3 ring-1 ring-border/60"><p className="text-xs text-muted-foreground">{label}</p><p className={cn("text-xl font-semibold", critical ? "text-destructive" : "text-foreground")}>{value}</p></div>; }
function groupCount<T extends string>(rows: HrEmployee[], get: (employee: HrEmployee) => T) { return Object.entries(rows.reduce<Record<string, number>>((acc, employee) => ({ ...acc, [get(employee)]: (acc[get(employee)] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 5); }
function Breakdown({ title, rows }: { title: string; rows: [string, number][] }) { return <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p><div className="space-y-2">{rows.map(([label, count]) => <div key={label} className="flex items-center justify-between text-sm"><span className="text-foreground">{label}</span><span className="font-medium text-muted-foreground">{count}</span></div>)}</div></div>; }
function StructureSnapshot({ rows }: { rows: HrEmployee[] }) { return <div className="space-y-5"><Breakdown title="Headcount by State" rows={groupCount(rows, (e) => e.state)} /><Breakdown title="Headcount by Department" rows={groupCount(rows, (e) => e.department)} /><Breakdown title="Headcount by Role" rows={groupCount(rows, (e) => e.role)} /><div className="rounded-lg border border-warning/30 bg-warning/10 p-3"><p className="text-sm font-semibold text-foreground">Reporting gaps</p><p className="mt-1 text-sm text-muted-foreground">{rows.filter((e) => !e.manager).length} employees without manager assigned.</p></div></div>; }
function Worklist({ rows, onSelect }: { rows: HrEmployee[]; onSelect: (employee: HrEmployee) => void }) { return <div className="overflow-x-auto"><table className="w-full min-w-[1320px] text-sm"><thead className="text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{["Employee", "Role", "State", "Department", "Manager", "Status", "Onboarding", "Training", "Review", "Time Clock", "Payroll", "Next Action", "Alerts"].map((header) => <th key={header} className="px-3 py-2 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-border/50">{rows.map((employee) => <tr key={employee.id} onClick={() => onSelect(employee)} className="cursor-pointer hover:bg-muted/30"><td className="px-3 py-3 font-medium text-foreground">{employee.employee}<p className="text-xs text-muted-foreground">{employee.email}</p></td><td className="px-3 py-3">{employee.role}</td><td className="px-3 py-3">{employee.state}</td><td className="px-3 py-3">{employee.department}</td><td className="px-3 py-3">{employee.manager ?? "—"}</td><td className="px-3 py-3"><StatusPill label={employee.status} tone={employee.status === "At Risk" ? "critical" : employee.status === "Onboarding" || employee.status === "Training" ? "warning" : "success"} /></td><td className="px-3 py-3">{employee.onboardingStatus}</td><td className="px-3 py-3">{employee.trainingStatus}</td><td className="px-3 py-3">{employee.reviewStatus}</td><td className="px-3 py-3">{employee.timeClockStatus}</td><td className="px-3 py-3">{employee.payrollStatus}</td><td className="px-3 py-3">{employee.nextAction}</td><td className="px-3 py-3"><StatusPill label={employee.riskLevel} tone={healthTone(employee.riskLevel)} /></td></tr>)}</tbody></table></div>; }
function EmployeePanel({ employee, onOpenChange, onReady }: { employee: HrEmployee | null; onOpenChange: (open: boolean) => void; onReady: (employee: HrEmployee) => void }) { return <Sheet open={!!employee} onOpenChange={onOpenChange}><SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl"><SheetHeader>{employee && <><SheetTitle>{employee.employee}</SheetTitle><SheetDescription>{employee.role} · {employee.department} · {employee.state}</SheetDescription></>}</SheetHeader>{employee && <div className="mt-4 space-y-4"><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => void onReady(employee)}><UserCheck className="mr-2 h-4 w-4" />Mark Ready</Button><Button size="sm" variant="outline" onClick={() => toast.success(`Reminder queued for ${employee.employee}`)}><Bell className="mr-2 h-4 w-4" />Send Reminder</Button></div><Tabs defaultValue="overview"><TabsList className="grid h-auto grid-cols-3 gap-1 md:grid-cols-5">{["overview", "onboarding", "training", "reviews", "time", "documents", "communications", "tasks", "timeline"].map((tab) => <TabsTrigger key={tab} value={tab} className="capitalize">{tab === "time" ? "Time" : tab}</TabsTrigger>)}</TabsList><TabsContent value="overview"><PanelBlock items={[["Employee", employee.employee], ["Role", employee.role], ["State", employee.state], ["Department", employee.department], ["Manager", employee.manager ?? "Unassigned"], ["Status", employee.status], ["Start date", employee.startDate], ["Risk level", employee.riskLevel]]} /></TabsContent><TabsContent value="onboarding"><Checklist employee={employee} /></TabsContent><TabsContent value="training"><List items={employee.trainings.map((t) => `${t.name} · ${t.status} · Due ${t.dueDate}${t.certificate ? ` · ${t.certificate}` : ""}`)} /></TabsContent><TabsContent value="reviews"><List items={employee.reviews.map((r) => `${r.name} · ${r.status} · ${r.dueDate} · ${r.score ? `${r.score}/100` : "not scored"} · ${r.bonusEligible ? "bonus eligible" : "no bonus"}`)} /></TabsContent><TabsContent value="time"><PanelBlock items={[["Time clock", employee.timeClockStatus], ["Payroll readiness", employee.payrollStatus], ["Hours this period", String(employee.timeEntries.reduce((s, e) => s + e.hours, 0))], ["Exceptions", String(employee.timeEntries.filter((e) => e.status !== "Clean").length)]]} /><List items={employee.timeEntries.map((entry) => `${entry.date} · ${entry.hours}h · ${entry.status} · ${entry.note}`)} /></TabsContent><TabsContent value="documents"><List items={employee.documents.map((d) => `${d.name} · ${d.category} · ${d.status}`)} /></TabsContent><TabsContent value="communications"><List items={employee.communications.map((c) => `${c.date} · ${c.author} · ${c.type}: ${c.note}`)} /></TabsContent><TabsContent value="tasks"><List items={employee.tasks.map((t) => `${t.completed ? "Complete" : "Open"} · ${t.title} · ${t.owner} · ${t.dueDate}`)} /></TabsContent><TabsContent value="timeline"><div className="space-y-3">{employee.timeline.map((event, index) => <div key={`${event.title}-${index}`} className="flex gap-3"><span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span><div className="rounded-lg bg-background p-3 ring-1 ring-border/60"><p className="text-sm font-medium text-foreground">{event.title}</p><p className="text-xs text-muted-foreground">{event.date} · {event.detail}</p></div></div>)}</div></TabsContent></Tabs></div>}</SheetContent></Sheet>; }
function PanelBlock({ items }: { items: Array<[string, string]> }) { return <div className="mt-4 grid gap-3 sm:grid-cols-2">{items.map(([label, value]) => <div key={label} className="rounded-lg border border-border/60 bg-background p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium text-foreground">{value}</p></div>)}<Separator className="sm:col-span-2" /></div>; }
function List({ items }: { items: string[] }) { return <div className="mt-4 space-y-2">{items.length ? items.map((item) => <p key={item} className="rounded-lg bg-background p-3 text-sm text-foreground ring-1 ring-border/60">{item}</p>) : <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">No records yet.</p>}</div>; }
function Checklist({ employee }: { employee: HrEmployee }) { const items = [["viventium", "Viventium status"], ["backgroundCheck", "Background check"], ["i9", "I-9 / E-Verify"], ["orientation", "Orientation"], ["centralReach", "CentralReach account"], ["complianceDocs", "Required documents"]] as const; return <div className="mt-4 space-y-2">{items.map(([key, label]) => <div key={key} className="flex w-full items-center justify-between rounded-lg bg-background p-3 text-left ring-1 ring-border/60"><span className="text-sm font-medium text-foreground">{label}</span>{employee.onboarding[key] ? <CheckCircle2 className="h-4 w-4 text-success" /> : <AlertTriangle className="h-4 w-4 text-warning" />}</div>)}</div>; }
