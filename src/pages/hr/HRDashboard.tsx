import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, Bell, Briefcase, CalendarCheck, CheckCircle2, Clock, Download, FileText,
  Filter, GraduationCap, HeartHandshake, ListChecks, RefreshCw, Search, Send, SlidersHorizontal,
  UserCheck, UserCog, UserPlus, Users, Wallet, ChevronDown,
  ExternalLink, Upload, MessageSquare, Plus, Mail, Phone, MapPin, Calendar, Activity,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const activeFilterCount = [stateFilter, departmentFilter, roleFilter, managerFilter, statusFilter, trainingFilter, reviewFilter].filter((v) => v !== ALL).length + (query ? 1 : 0);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />HR Operations
            </div>
            <h1 className="text-[28px] font-semibold tracking-tight text-foreground">HR Dashboard</h1>
            <p className="text-sm text-muted-foreground">Lifecycle, onboarding, training, reviews and workforce health — at a glance.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employees…" className="h-9 w-[260px] pl-9" />
            </div>
            <Button variant="outline" size="sm" className="h-9" onClick={() => setFiltersOpen((v) => !v)}>
              <SlidersHorizontal className="mr-2 h-4 w-4" />Filters{activeFilterCount > 0 && <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{activeFilterCount}</span>}
              <ChevronDown className={cn("ml-1 h-3.5 w-3.5 transition-transform", filtersOpen && "rotate-180")} />
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => toast.success("HR dashboard export prepared")}><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button size="sm" className="h-9 shadow-sm" onClick={() => void loadDashboard()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          </div>
        </div>
        {filtersOpen && (
          <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-xl animate-fade-in">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
              <Select value={dateRange} onValueChange={setDateRange}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{["Today", "This Week", "This Month", "Quarter to Date", "Year to Date", "Custom Range"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
              <FilterSelect value={stateFilter} setValue={setStateFilter} items={states} allLabel="All States" />
              <FilterSelect value={departmentFilter} setValue={setDepartmentFilter} items={departments} allLabel="All Departments" />
              <FilterSelect value={roleFilter} setValue={setRoleFilter} items={roles} allLabel="All Roles" />
              <FilterSelect value={managerFilter} setValue={setManagerFilter} items={managers} allLabel="All Managers" />
              <FilterSelect value={statusFilter} setValue={setStatusFilter} items={statuses} allLabel="All Statuses" />
              <FilterSelect value={trainingFilter} setValue={setTrainingFilter} items={trainingStatuses} allLabel="All Training" />
              <FilterSelect value={reviewFilter} setValue={setReviewFilter} items={reviewStatuses} allLabel="All Reviews" />
            </div>
          </div>
        )}
      </header>

      {loading ? <Skeleton className="h-[520px] rounded-2xl" /> : (
        <>
          <section className="grid gap-3 grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
            {kpis.map((kpi) => (
              <button key={kpi.key} type="button" onClick={() => setActiveKpi(kpi.key)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-card px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
                  activeKpi === kpi.key ? "border-primary/40 shadow-[0_8px_28px_-12px_hsl(var(--primary)/0.35)] ring-1 ring-primary/20" : "border-border/60 shadow-sm"
                )}
              >
                {activeKpi === kpi.key && <span className="absolute inset-x-0 top-0 h-0.5 bg-primary" />}
                <div className="flex items-center justify-between">
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", toneClass(kpi.tone))}>
                    <kpi.icon className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{kpi.tone === "critical" ? "Action" : kpi.tone === "warning" ? "Watch" : "Healthy"}</span>
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground tabular-nums">{kpi.value}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{kpi.title}</p>
                <p className="mt-1.5 text-xs text-muted-foreground/80 line-clamp-1">{kpi.subtext}</p>
              </button>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
            <Card title="HR Action Queue" icon={ListChecks} subtitle="Prioritized work needing attention today">
              <div className="grid gap-4 lg:grid-cols-3">
                <QueueColumn title="Urgent Now" tone="critical" rows={queue.urgent} onSelect={setSelectedEmployee} onReady={markReady} />
                <QueueColumn title="Follow-Up Today" tone="warning" rows={queue.today} onSelect={setSelectedEmployee} onReady={markReady} />
                <QueueColumn title="Workforce Risks" tone="info" rows={queue.risks} onSelect={setSelectedEmployee} onReady={markReady} />
              </div>
            </Card>
            <Card title="Workforce Health" icon={HeartHandshake} subtitle="Live snapshot across your filtered cohort">
              <HealthSnapshot rows={filtered} />
            </Card>
          </section>

          <Card title="Employee Lifecycle" icon={Briefcase} subtitle="Stage distribution and aging across the workforce">
            <LifecycleBoard rows={filtered} />
          </Card>

          <section className="grid gap-5 xl:grid-cols-3">
            <Card title="Onboarding Readiness" icon={UserCheck}><OnboardingPanel rows={filtered} /></Card>
            <Card title="Training & Compliance" icon={GraduationCap}><TrainingPanel rows={filtered} /></Card>
            <Card title="Reviews & Performance" icon={CalendarCheck}><ReviewsPanel rows={filtered} /></Card>
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
            <Card title="Workforce Structure" icon={UserCog}><StructureSnapshot rows={filtered} /></Card>
            <Card title="HR Worklist" icon={Users} subtitle={`${kpiRows.length} employees · ${kpis.find((k) => k.key === activeKpi)?.title ?? ""}`}>
              <Worklist rows={kpiRows} onSelect={setSelectedEmployee} />
            </Card>
          </section>
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
function Card({ title, icon: Icon, subtitle, children }: { title: string; icon: typeof Users; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-3.5 w-3.5" /></span>
            {title}
          </h2>
          {subtitle && <p className="pl-9 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
function toneClass(tone: Tone) { return tone === "success" ? "bg-success/10 text-success" : tone === "warning" ? "bg-warning/15 text-warning" : tone === "critical" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"; }
function StatusPill({ label, tone }: { label: string; tone: Tone }) { return <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold", toneClass(tone))}>{label}</span>; }
function employeeIssue(employee: HrEmployee) { return issueText(employee); }
function QueueColumn({ title, tone = "info", rows, onSelect, onReady }: { title: string; tone?: Tone; rows: HrEmployee[]; onSelect: (employee: HrEmployee) => void; onReady: (employee: HrEmployee) => void }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/60 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5 rounded-full", tone === "critical" ? "bg-destructive" : tone === "warning" ? "bg-warning" : "bg-primary")} />
          <p className="text-[13px] font-semibold text-foreground">{title}</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground tabular-nums">{rows.length}</span>
      </div>
      <div className="space-y-2">
        {rows.slice(0, 5).map((employee) => (
          <div key={`${title}-${employee.id}`} className="group rounded-xl border border-border/50 bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm">
            <button type="button" onClick={() => onSelect(employee)} className="w-full text-left">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-sm font-medium text-foreground">{employee.employee}</p>
                <StatusPill label={employee.riskLevel} tone={healthTone(employee.riskLevel)} />
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{employee.role} · {employee.state}</p>
              <p className="mt-2 line-clamp-2 text-xs font-medium text-foreground/90">{employeeIssue(employee)}</p>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">Manager · {employee.manager ?? "Unassigned"}</p>
            </button>
            <div className="mt-2.5 flex items-center gap-1 opacity-80 transition-opacity group-hover:opacity-100">
              <QuickAction label="Open" icon={ArrowRight} onClick={() => onSelect(employee)} />
              <QuickAction label="Remind" icon={Send} onClick={() => toast.success(`Reminder queued for ${employee.employee}`)} />
              {employee.onboardingStatus !== "Ready For Start" && (
                <Button variant="outline" size="sm" className="ml-auto h-7 px-2.5 text-[11px]" onClick={() => void onReady(employee)}>
                  <CheckCircle2 className="mr-1 h-3 w-3" />Mark Ready
                </Button>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/60 bg-muted/30 px-3 py-8 text-center">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <p className="text-xs font-medium text-muted-foreground">All clear</p>
          </div>
        )}
      </div>
    </div>
  );
}
function QuickAction({ label, icon: Icon, onClick }: { label: string; icon: typeof ArrowRight; onClick: () => void }) { return <Button type="button" variant="ghost" size="sm" className="h-8 justify-start gap-1.5 px-2 text-xs" onClick={onClick}><Icon className="h-3.5 w-3.5" />{label}</Button>; }
function HealthSnapshot({ rows }: { rows: HrEmployee[] }) {
  const items = [
    ["Ready for assignment", rows.filter((e) => e.staffingReady).length, "success"],
    ["Onboarding blocked", rows.filter((e) => e.onboardingStatus === "Missing Docs" || !e.onboarding.backgroundCheck || !e.onboarding.i9).length, "critical"],
    ["Reviews due", rows.filter((e) => ["Due Soon", "Overdue"].includes(e.reviewStatus)).length, "warning"],
    ["Training overdue", rows.filter((e) => e.trainingStatus === "Overdue").length, "critical"],
    ["Payroll exceptions", rows.filter((e) => e.payrollStatus !== "Ready").length, "critical"],
    ["Manager gaps", rows.filter((e) => !e.manager).length, "warning"],
  ] as const;
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {items.map(([label, value, tone]) => (
        <div key={label} className="rounded-xl border border-border/60 bg-background/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className={cn("h-1.5 w-1.5 rounded-full", tone === "critical" ? "bg-destructive" : tone === "warning" ? "bg-warning" : "bg-success")} />
            <p className={cn("text-xl font-semibold tabular-nums", tone === "critical" && value > 0 ? "text-destructive" : "text-foreground")}>{value}</p>
          </div>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}
function LifecycleBoard({ rows }: { rows: HrEmployee[] }) {
  const stages: DashboardStatus[] = ["Pre-Hire", "Onboarding", "Training", "Active", "Review Due", "At Risk", "Inactive", "Terminated"];
  return (
    <div className="grid gap-2.5 grid-cols-2 md:grid-cols-4 2xl:grid-cols-8">
      {stages.map((stage) => {
        const matching = rows.filter((employee) => employee.status === stage);
        const oldest = matching.length ? Math.max(...matching.map((employee) => daysSince(employee.stageEnteredAt))) : 0;
        const average = avg(matching.map((employee) => daysSince(employee.stageEnteredAt)));
        const tone: Tone = stage === "At Risk" || oldest > 21 ? "critical" : oldest > 10 ? "warning" : "success";
        return (
          <div key={stage} className="relative overflow-hidden rounded-xl border border-border/60 bg-background/60 p-3.5">
            <span className={cn("absolute left-0 top-0 h-full w-0.5", tone === "critical" ? "bg-destructive" : tone === "warning" ? "bg-warning" : "bg-success")} />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{stage}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{matching.length}</p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">Oldest <span className="text-foreground/80 tabular-nums">{oldest}d</span> · Avg <span className="text-foreground/80 tabular-nums">{average}d</span></p>
          </div>
        );
      })}
    </div>
  );
}
function OnboardingPanel({ rows }: { rows: HrEmployee[] }) { const statuses = ["Not Started", "In Progress", "Missing Docs", "Ready For Orientation", "Ready For Start", "Active"]; const checklist = ["viventium", "backgroundCheck", "i9", "orientation", "stateTraining", "centralReach", "complianceDocs"] as const; const labels: Record<(typeof checklist)[number], string> = { viventium: "Viventium onboarding", backgroundCheck: "Background check", i9: "I-9 / E-Verify", orientation: "Orientation", stateTraining: "State training", centralReach: "CentralReach account", complianceDocs: "Compliance documents" }; return <div className="space-y-4"><div className="grid grid-cols-2 gap-2">{statuses.map((status) => <div key={status} className="rounded-lg bg-background p-3 ring-1 ring-border/60"><p className="text-xs text-muted-foreground">{status}</p><p className="text-xl font-semibold text-foreground">{rows.filter((e) => e.onboardingStatus === status).length}</p></div>)}</div><Separator />{checklist.map((key) => { const complete = rows.filter((employee) => employee.onboarding[key]).length; return <div key={key} className="space-y-1"><div className="flex justify-between text-sm"><span className="text-foreground">{labels[key]}</span><span className="text-muted-foreground">{pct(rows.length ? (complete / rows.length) * 100 : 0)}</span></div><Progress value={rows.length ? (complete / rows.length) * 100 : 0} className="h-2" /></div>; })}</div>; }
function TrainingPanel({ rows }: { rows: HrEmployee[] }) { const assigned = rows.flatMap((e) => e.trainings).length; const complete = rows.flatMap((e) => e.trainings).filter((t) => t.status === "Complete").length; const overdue = rows.flatMap((e) => e.trainings).filter((t) => t.status === "Overdue").length; return <div className="space-y-4"><div className="grid grid-cols-3 gap-2 text-center"><Metric label="Assigned" value={assigned} /><Metric label="Complete" value={complete} /><Metric label="Overdue" value={overdue} critical={overdue > 0} /></div><Breakdown title="By Department" rows={groupCount(rows, (e) => e.department)} /><Breakdown title="By Role" rows={groupCount(rows, (e) => e.role)} /><Breakdown title="By State" rows={groupCount(rows, (e) => e.state)} /></div>; }
function ReviewsPanel({ rows }: { rows: HrEmployee[] }) { const reviews = rows.flatMap((e) => e.reviews); const due = reviews.filter((review) => review.status === "Due Soon").length; const overdue = reviews.filter((review) => review.status === "Overdue").length; const completed = reviews.filter((review) => review.status === "Completed").length; return <div className="space-y-4"><div className="grid grid-cols-3 gap-2 text-center"><Metric label="Due soon" value={due} /><Metric label="Overdue" value={overdue} critical={overdue > 0} /><Metric label="Completed" value={completed} /></div>{["30-day", "60-day", "90-day", "Annual"].map((label) => <div key={label} className="flex items-center justify-between rounded-lg bg-background p-3 ring-1 ring-border/60"><span className="text-sm text-foreground">{label} reviews</span><span className="text-sm font-semibold text-foreground">{reviews.filter((review) => review.name.toLowerCase().includes(label.toLowerCase().split("-")[0])).length}</span></div>)}<p className="rounded-lg bg-success/10 p-3 text-sm text-success">{reviews.filter((r) => r.bonusEligible).length} employees currently bonus eligible.</p></div>; }
function Metric({ label, value, critical }: { label: string; value: number; critical?: boolean }) { return <div className="rounded-lg bg-background p-3 ring-1 ring-border/60"><p className="text-xs text-muted-foreground">{label}</p><p className={cn("text-xl font-semibold", critical ? "text-destructive" : "text-foreground")}>{value}</p></div>; }
function groupCount<T extends string>(rows: HrEmployee[], get: (employee: HrEmployee) => T) { return Object.entries(rows.reduce<Record<string, number>>((acc, employee) => ({ ...acc, [get(employee)]: (acc[get(employee)] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 5); }
function Breakdown({ title, rows }: { title: string; rows: [string, number][] }) { return <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p><div className="space-y-2">{rows.map(([label, count]) => <div key={label} className="flex items-center justify-between text-sm"><span className="text-foreground">{label}</span><span className="font-medium text-muted-foreground">{count}</span></div>)}</div></div>; }
function StructureSnapshot({ rows }: { rows: HrEmployee[] }) { return <div className="space-y-5"><Breakdown title="Headcount by State" rows={groupCount(rows, (e) => e.state)} /><Breakdown title="Headcount by Department" rows={groupCount(rows, (e) => e.department)} /><Breakdown title="Headcount by Role" rows={groupCount(rows, (e) => e.role)} /><div className="rounded-lg border border-warning/30 bg-warning/10 p-3"><p className="text-sm font-semibold text-foreground">Reporting gaps</p><p className="mt-1 text-sm text-muted-foreground">{rows.filter((e) => !e.manager).length} employees without manager assigned.</p></div></div>; }
function Worklist({ rows, onSelect }: { rows: HrEmployee[]; onSelect: (employee: HrEmployee) => void }) {
  return (
    <div className="-mx-2 overflow-x-auto">
      <table className="w-full min-w-[920px] text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {["Employee", "Role / Dept", "Manager", "Status", "Training", "Review", "Next Action", "Risk"].map((header) => (
              <th key={header} className="px-3 py-2.5 font-semibold">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {rows.slice(0, 25).map((employee) => (
            <tr key={employee.id} onClick={() => onSelect(employee)} className="cursor-pointer transition-colors hover:bg-muted/40">
              <td className="px-3 py-3">
                <p className="font-medium text-foreground">{employee.employee}</p>
                <p className="text-xs text-muted-foreground">{employee.email}</p>
              </td>
              <td className="px-3 py-3">
                <p className="text-foreground">{employee.role}</p>
                <p className="text-xs text-muted-foreground">{employee.department} · {employee.state}</p>
              </td>
              <td className="px-3 py-3 text-muted-foreground">{employee.manager ?? "—"}</td>
              <td className="px-3 py-3"><StatusPill label={employee.status} tone={employee.status === "At Risk" ? "critical" : employee.status === "Onboarding" || employee.status === "Training" ? "warning" : "success"} /></td>
              <td className="px-3 py-3 text-xs text-muted-foreground">{employee.trainingStatus}</td>
              <td className="px-3 py-3 text-xs text-muted-foreground">{employee.reviewStatus}</td>
              <td className="px-3 py-3 text-xs text-foreground/80">{employee.nextAction}</td>
              <td className="px-3 py-3"><StatusPill label={employee.riskLevel} tone={healthTone(employee.riskLevel)} /></td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={8} className="px-3 py-12 text-center text-sm text-muted-foreground">No employees match this filter.</td></tr>
          )}
        </tbody>
      </table>
      {rows.length > 25 && <p className="px-3 py-3 text-xs text-muted-foreground">Showing first 25 of {rows.length}.</p>}
    </div>
  );
}
function EmployeePanel({ employee, onOpenChange, onReady }: { employee: HrEmployee | null; onOpenChange: (open: boolean) => void; onReady: (employee: HrEmployee) => void }) {
  return (
    <Sheet open={!!employee} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-2xl">
        {employee && <EmployeePanelContent employee={employee} onReady={onReady} />}
      </SheetContent>
    </Sheet>
  );
}

function EmployeePanelContent({ employee, onReady }: { employee: HrEmployee; onReady: (employee: HrEmployee) => void }) {
  const [comms, setComms] = useState<HrCommunication[]>(employee.communications);
  const [tasks, setTasks] = useState<HrTask[]>(employee.tasks);
  const [docs, setDocs] = useState<HrDocument[]>(employee.documents);
  const [timeline, setTimeline] = useState<HrTimelineEvent[]>(employee.timeline);
  const [newComm, setNewComm] = useState("");
  const [newTask, setNewTask] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setComms(employee.communications);
    setTasks(employee.tasks);
    setDocs(employee.documents);
    setTimeline(employee.timeline);
  }, [employee.id]);

  const initials = employee.employee.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const openHours = tasks.filter((t) => !t.completed).length;
  const totalHours = employee.timeEntries.reduce((s, e) => s + e.hours, 0);
  const exceptions = employee.timeEntries.filter((e) => e.status !== "Clean").length;

  function addTimeline(title: string, detail: string) {
    setTimeline((prev) => [{ title, date: new Date().toISOString().slice(0, 10), detail }, ...prev]);
  }

  function addComm() {
    if (!newComm.trim()) return;
    const entry: HrCommunication = { author: "You", note: newComm.trim(), date: new Date().toISOString().slice(0, 10), type: "HR" };
    setComms((prev) => [entry, ...prev]);
    addTimeline("Note added", entry.note);
    setNewComm("");
    toast.success("Note logged");
  }

  function addTask() {
    if (!newTask.trim()) return;
    const t: HrTask = { id: crypto.randomUUID(), title: newTask.trim(), owner: "You", dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10), completed: false, type: "Manual" };
    setTasks((prev) => [t, ...prev]);
    addTimeline("Task created", t.title);
    setNewTask("");
    toast.success("Task added");
  }

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const doc: HrDocument = { name: file.name, category: "Uploaded", status: "Complete" };
    setDocs((prev) => [doc, ...prev]);
    addTimeline("Document uploaded", file.name);
    toast.success(`${file.name} uploaded`);
    e.target.value = "";
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border/60 bg-gradient-to-br from-primary/5 via-background to-background p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm">{initials}</div>
          <div className="flex-1 min-w-0">
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="text-xl">{employee.employee}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{employee.role}</span>
                <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{employee.department}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{employee.state}</span>
              </SheetDescription>
            </SheetHeader>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-[10px]">{employee.status}</Badge>
              <Badge variant="outline" className="text-[10px]">Risk: {employee.riskLevel}</Badge>
              {employee.manager && <Badge variant="outline" className="text-[10px]">Mgr: {employee.manager}</Badge>}
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button asChild size="sm" className="h-9 justify-start gap-2 shadow-sm">
            <Link to={`/hr/employees/${employee.id}`}><ExternalLink className="h-4 w-4" />Open File</Link>
          </Button>
          <Button size="sm" variant="outline" className="h-9 justify-start gap-2" onClick={() => void onReady(employee)}>
            <UserCheck className="h-4 w-4" />Mark Ready
          </Button>
          <Button size="sm" variant="outline" className="h-9 justify-start gap-2" onClick={() => { window.location.href = `mailto:${employee.email}`; }}>
            <Mail className="h-4 w-4" />Email
          </Button>
          <Button size="sm" variant="outline" className="h-9 justify-start gap-2" onClick={() => { toast.success(`Reminder queued for ${employee.employee}`); addTimeline("Reminder sent", "HR sent a reminder"); }}>
            <Bell className="h-4 w-4" />Remind
          </Button>
        </div>

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            { label: "Tasks", value: openHours, sub: "open" },
            { label: "Hours", value: totalHours, sub: "this period" },
            { label: "Trainings", value: employee.trainings.length, sub: employee.trainingStatus.toLowerCase() },
            { label: "Issues", value: exceptions, sub: "exceptions" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border/60 bg-background/80 px-2 py-2">
              <p className="text-lg font-semibold tabular-nums text-foreground">{s.value}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="text-[10px] text-muted-foreground/70">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-y-auto p-6 pt-4">
        <Tabs defaultValue="overview">
          <TabsList className="grid h-auto w-full grid-cols-4 gap-1 bg-muted/50 p-1 lg:grid-cols-7">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="training" className="text-xs">Training</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs">Docs</TabsTrigger>
            <TabsTrigger value="comms" className="text-xs">Comms</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">Tasks</TabsTrigger>
            <TabsTrigger value="time" className="text-xs">Time</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-3">
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next Action</p>
              <p className="mt-1 text-sm font-medium text-foreground">{employee.nextAction || "All caught up"}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["Email", employee.email],
                ["Start date", formatShortDate(employee.startDate)],
                ["Manager", employee.manager ?? "Unassigned"],
                ["Onboarding", employee.onboardingStatus],
                ["Training", employee.trainingStatus],
                ["Reviews", employee.reviewStatus],
                ["Time clock", employee.timeClockStatus],
                ["Payroll", employee.payrollStatus],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-lg border border-border/60 bg-card px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-0.5 truncate text-sm font-medium text-foreground">{value as string}</p>
                </div>
              ))}
            </div>
            <Checklist employee={employee} />
          </TabsContent>

          <TabsContent value="training" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Assigned Trainings</p>
              <Button asChild variant="outline" size="sm" className="h-8 gap-1.5"><Link to="/hr/training"><GraduationCap className="h-3.5 w-3.5" />Training Admin</Link></Button>
            </div>
            {employee.trainings.length ? employee.trainings.map((t, i) => (
              <div key={i} className="rounded-lg border border-border/60 bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.category} · Due {formatShortDate(t.dueDate)}{t.certificate ? ` · ${t.certificate}` : ""}</p>
                  </div>
                  <Badge variant={t.status === "Overdue" ? "destructive" : t.status === "Complete" ? "secondary" : "outline"} className="shrink-0 text-[10px]">{t.status}</Badge>
                </div>
              </div>
            )) : <EmptyState icon={GraduationCap} message="No trainings assigned" />}
          </TabsContent>

          <TabsContent value="documents" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Documents</p>
              <input ref={fileRef} type="file" className="hidden" onChange={onUpload} />
              <Button size="sm" className="h-8 gap-1.5" onClick={() => fileRef.current?.click()}><Upload className="h-3.5 w-3.5" />Upload</Button>
            </div>
            {docs.length ? docs.map((d, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.category}</p>
                  </div>
                </div>
                <Badge variant={d.status === "Missing" || d.status === "Expired" ? "destructive" : "secondary"} className="text-[10px]">{d.status}</Badge>
              </div>
            )) : <EmptyState icon={FileText} message="No documents on file" />}
          </TabsContent>

          <TabsContent value="comms" className="mt-4 space-y-3">
            <div className="rounded-lg border border-border/60 bg-card p-3">
              <Textarea value={newComm} onChange={(e) => setNewComm(e.target.value)} placeholder={`Log a note about ${employee.employee.split(" ")[0]}…`} className="min-h-[72px] resize-none border-0 p-0 shadow-none focus-visible:ring-0" />
              <div className="mt-2 flex justify-end">
                <Button size="sm" className="h-8 gap-1.5" onClick={addComm} disabled={!newComm.trim()}><MessageSquare className="h-3.5 w-3.5" />Add Note</Button>
              </div>
            </div>
            {comms.length ? comms.map((c, i) => (
              <div key={i} className="rounded-lg border border-border/60 bg-card p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground"><span className="font-medium text-foreground">{c.author}</span><span>{formatShortDate(c.date)} · {c.type}</span></div>
                <p className="mt-1 text-sm text-foreground">{c.note}</p>
              </div>
            )) : <EmptyState icon={MessageSquare} message="No communications yet" />}
          </TabsContent>

          <TabsContent value="tasks" className="mt-4 space-y-3">
            <div className="flex gap-2">
              <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a task…" className="h-9" onKeyDown={(e) => { if (e.key === "Enter") addTask(); }} />
              <Button size="sm" className="h-9 gap-1.5" onClick={addTask} disabled={!newTask.trim()}><Plus className="h-3.5 w-3.5" />Add</Button>
            </div>
            {tasks.length ? tasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-3">
                <button type="button" onClick={() => toggleTask(t.id)} className="flex items-center gap-2.5 text-left min-w-0">
                  <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", t.completed ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30")}>
                    {t.completed && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className={cn("truncate text-sm", t.completed ? "text-muted-foreground line-through" : "font-medium text-foreground")}>{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.owner} · Due {formatShortDate(t.dueDate)}</p>
                  </div>
                </button>
                <Badge variant="outline" className="shrink-0 text-[10px]">{t.type}</Badge>
              </div>
            )) : <EmptyState icon={ListChecks} message="No open tasks" />}
          </TabsContent>

          <TabsContent value="time" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[["Status", employee.timeClockStatus], ["Payroll", employee.payrollStatus], ["Hours", `${totalHours}h`], ["Exceptions", String(exceptions)]].map(([l, v]) => (
                <div key={l} className="rounded-lg border border-border/60 bg-card px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{l}</p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">{v}</p>
                </div>
              ))}
            </div>
            {employee.timeEntries.length ? employee.timeEntries.map((e, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-3">
                <div><p className="text-sm font-medium text-foreground">{formatShortDate(e.date)} · {e.hours}h</p><p className="text-xs text-muted-foreground">{e.note}</p></div>
                <Badge variant={e.status === "Clean" ? "secondary" : "destructive"} className="text-[10px]">{e.status}</Badge>
              </div>
            )) : <EmptyState icon={Clock} message="No time entries this period" />}
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            {timeline.length ? (
              <div className="relative space-y-0 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
                {timeline.map((event, index) => (
                  <div key={`${event.title}-${index}`} className="relative pb-4">
                    <span className="absolute -left-[18px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary ring-4 ring-background" />
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{formatShortDate(event.date)} · {event.detail}</p>
                  </div>
                ))}
              </div>
            ) : <EmptyState icon={Activity} message="No activity yet" />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: typeof Activity; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/20 py-10 text-center">
      <Icon className="h-6 w-6 text-muted-foreground/60" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
function PanelBlock({ items }: { items: Array<[string, string]> }) { return <div className="mt-4 grid gap-3 sm:grid-cols-2">{items.map(([label, value]) => <div key={label} className="rounded-lg border border-border/60 bg-background p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium text-foreground">{value}</p></div>)}<Separator className="sm:col-span-2" /></div>; }
function List({ items }: { items: string[] }) { return <div className="mt-4 space-y-2">{items.length ? items.map((item) => <p key={item} className="rounded-lg bg-background p-3 text-sm text-foreground ring-1 ring-border/60">{item}</p>) : <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">No records yet.</p>}</div>; }
function Checklist({ employee }: { employee: HrEmployee }) { const items = [["viventium", "Viventium status"], ["backgroundCheck", "Background check"], ["i9", "I-9 / E-Verify"], ["orientation", "Orientation"], ["centralReach", "CentralReach account"], ["complianceDocs", "Required documents"]] as const; return <div className="mt-4 space-y-2">{items.map(([key, label]) => <div key={key} className="flex w-full items-center justify-between rounded-lg bg-background p-3 text-left ring-1 ring-border/60"><span className="text-sm font-medium text-foreground">{label}</span>{employee.onboarding[key] ? <CheckCircle2 className="h-4 w-4 text-success" /> : <AlertTriangle className="h-4 w-4 text-warning" />}</div>)}</div>; }
