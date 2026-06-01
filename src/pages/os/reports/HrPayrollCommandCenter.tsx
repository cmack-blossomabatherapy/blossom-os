import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Upload, FileSpreadsheet, Sparkles, Download, Search,
  AlertTriangle, CheckCircle2, Brain, Trash2, Calculator, Plus, X,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { KpiTile } from "@/components/dashboards/KpiTile";
import { ChartCard } from "@/components/dashboards/ChartCard";
import { parseAnyFile, SUPPORTED_EXTENSIONS } from "@/lib/os/dashboardEngine/excelParser";
import type { KpiSpec, ChartSpec, DrilldownSpec } from "@/lib/os/dashboardEngine/types";

/* ============================================================
 * HR · Payroll Command Center
 * Upload payroll / hour / employee exports and instantly see
 * payroll readiness, missing hours, BCBA minimums, exceptions,
 * and state-level payroll risks.
 * ============================================================ */

type ReadinessStatus = "Ready" | "Needs Review" | "Payroll Risk";
type MinimumStatus = "Meets Minimum" | "At Risk" | "Below Minimum" | "Missing Data";
type PayrollCycle = "weekly" | "biweekly" | "monthly" | "custom";

const STATUS_TONE: Record<ReadinessStatus, "success" | "warn" | "danger"> = {
  Ready: "success",
  "Needs Review": "warn",
  "Payroll Risk": "danger",
};
const MIN_TONE: Record<MinimumStatus, "success" | "warn" | "danger" | "default"> = {
  "Meets Minimum": "success",
  "At Risk": "warn",
  "Below Minimum": "danger",
  "Missing Data": "default",
};

interface EmployeeRow {
  id: string;
  name: string;
  role: string;
  department: string;
  state: string;
  manager: string;
  submittedHours: number;
  approvedHours: number;
  regularHours: number;
  overtimeHours: number;
  billableHours: number;
  h97153: number;
  h97155: number;
  h97156: number;
  rate: number;
  earnings: number;
  payrollStatusRaw: string;
  timesheetStatus: string;
  approvalStatus: string;
  hasI9: boolean;
  hasW4: boolean;
  hasDirectDeposit: boolean;
  hasBackground: boolean;
  correctionOpen: boolean;
  payrollHold: boolean;
  raw: Record<string, string>;
  // computed
  exceptions: PayrollException[];
  readiness: ReadinessStatus;
  requiredAction: string;
}

interface PayrollException {
  type: ExceptionType;
  description: string;
  severity: "Critical" | "High" | "Medium" | "Low";
}

type ExceptionType =
  | "Missing Timesheet"
  | "Missing Approval"
  | "Missing Signature"
  | "Missing Session Note"
  | "Missing Payroll Documentation"
  | "Duplicate Time Entry"
  | "Manual Correction Needed"
  | "Negative Adjustment"
  | "Pending Adjustment"
  | "Payroll Hold"
  | "Missing Employee Data"
  | "Missing Rate"
  | "Missing State"
  | "Missing Role"
  | "Unknown Issue";

const SEV_TONE: Record<PayrollException["severity"], "success" | "warn" | "danger" | "default"> = {
  Critical: "danger",
  High: "danger",
  Medium: "warn",
  Low: "default",
};

/* ===================== HELPERS ===================== */

function normalizeHeader(h: string) { return h.toLowerCase().replace(/[^a-z0-9]/g, ""); }
function findHeader(headers: string[], candidates: string[]): string | null {
  const map = new Map(headers.map(h => [normalizeHeader(h), h]));
  for (const c of candidates) { const hit = map.get(normalizeHeader(c)); if (hit) return hit; }
  return null;
}
function num(v: string | undefined | null): number {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[$,]/g, ""));
  return isFinite(n) ? n : 0;
}
function boolish(v: string | undefined | null): boolean {
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return ["y", "yes", "true", "1", "complete", "completed", "on file", "received", "approved"].includes(s);
}
function fmtPct(n: number) { return isFinite(n) ? `${(n * 100).toFixed(1)}%` : "—"; }
function fmtNum(n: number, d = 1) { return isFinite(n) ? n.toFixed(d) : "—"; }
function fmtMoney(n: number) { return isFinite(n) ? `$${n.toFixed(2)}` : "—"; }
function downloadCsv(filename: string, columns: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [columns.map(escape).join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const DEFAULT_BCBA_MIN = 25; // weekly billable baseline if not provided

function isBcba(role: string) {
  const r = (role || "").toLowerCase();
  return r.includes("bcba") || r.includes("board certified");
}
function isRbt(role: string) {
  const r = (role || "").toLowerCase();
  return r.includes("rbt") || r.includes("behavior tech") || r.includes("technician");
}

/* ===================== PAGE ===================== */

export default function HrPayrollCommandCenter() {
  const [fileName, setFileName] = useState("");
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

  // Period
  const [cycle, setCycle] = useState<PayrollCycle>("biweekly");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  // BCBA minimums override
  const [bcbaMin, setBcbaMin] = useState<number>(DEFAULT_BCBA_MIN);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [mgrFilter, setMgrFilter] = useState("all");
  const [exceptionFilter, setExceptionFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [bcbaOnly, setBcbaOnly] = useState(false);
  const [rbtOnly, setRbtOnly] = useState(false);

  // Issue tracker
  type Issue = { id: string; employee: string; state: string; role: string; type: ExceptionType; priority: string; assignedTo: string; openedDate: string; dueDate: string; status: string; notes: string; resolution: string };
  const [issues, setIssues] = useState<Issue[]>([]);

  const [drill, setDrill] = useState<DrilldownSpec | null>(null);
  const [empDrill, setEmpDrill] = useState<EmployeeRow | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  /* ---- Upload ---- */
  async function handleFiles(files: FileList | File[] | null) {
    if (!files || !files[0]) return;
    const file = files[0];
    setLoading(true);
    try {
      const parsed = await parseAnyFile(file);
      const first = parsed[0];
      if (!first) throw new Error("No data in file.");
      const headers = first.headers;

      const nameH = findHeader(headers, ["EmployeeName", "Employee Name", "StaffName", "Staff Name", "ProviderName", "Provider Name", "FullName", "Name"]);
      const fnH = findHeader(headers, ["FirstName", "First Name", "EmployeeFirstName"]);
      const lnH = findHeader(headers, ["LastName", "Last Name", "EmployeeLastName"]);
      const idH = findHeader(headers, ["EmployeeId", "Employee Id", "Employee ID", "ProviderId", "Provider ID", "StaffId"]);
      const roleH = findHeader(headers, ["Role", "JobTitle", "Job Title", "Position", "EmployeeType", "Employee Type", "Title"]);
      const deptH = findHeader(headers, ["Department", "Dept", "Team"]);
      const stateH = findHeader(headers, ["State", "WorkState", "Work State", "Location", "Region"]);
      const mgrH = findHeader(headers, ["Manager", "Supervisor", "DirectManager", "ReportsTo"]);
      const submittedH = findHeader(headers, ["SubmittedHours", "Submitted Hours", "Submitted"]);
      const approvedH = findHeader(headers, ["ApprovedHours", "Approved Hours", "Approved", "WorkedHours", "Worked Hours"]);
      const billableH = findHeader(headers, ["BillableHours", "Billable Hours", "Hours"]);
      const regularH = findHeader(headers, ["RegularHours", "Regular Hours", "Regular"]);
      const otH = findHeader(headers, ["OvertimeHours", "Overtime Hours", "OT", "OTHours"]);
      const h97153H = findHeader(headers, ["97153", "97153Hours", "97153 Hours"]);
      const h97155H = findHeader(headers, ["97155", "97155Hours", "97155 Hours", "SupervisionHours"]);
      const h97156H = findHeader(headers, ["97156", "97156Hours", "97156 Hours", "ParentTrainingHours"]);
      const rateH = findHeader(headers, ["Rate", "HourlyRate", "Hourly Rate", "PayRate", "Pay Rate"]);
      const earningsH = findHeader(headers, ["Earnings", "GrossPay", "Gross Pay", "Pay"]);
      const statusH = findHeader(headers, ["PayrollStatus", "Payroll Status", "Status"]);
      const timesheetH = findHeader(headers, ["TimesheetStatus", "Timesheet Status", "Timesheet"]);
      const approvalH = findHeader(headers, ["ApprovalStatus", "Approval Status", "Approval"]);
      const i9H = findHeader(headers, ["I9", "I-9"]);
      const w4H = findHeader(headers, ["W4", "W-4"]);
      const ddH = findHeader(headers, ["DirectDeposit", "Direct Deposit", "DD"]);
      const bgH = findHeader(headers, ["BackgroundCheck", "Background Check", "Background"]);
      const correctionH = findHeader(headers, ["CorrectionNeeded", "Correction Needed", "Correction"]);
      const holdH = findHeader(headers, ["PayrollHold", "Hold"]);

      const missing: string[] = [];
      if (!nameH && !(fnH && lnH)) missing.push("EmployeeName (or FirstName + LastName)");
      if (!submittedH && !approvedH && !billableH && !regularH) missing.push("Hours field (Submitted, Approved, Billable, or Regular)");

      const warns: string[] = [];
      if (!roleH) warns.push("Role/Job Title not detected — BCBA minimum tracking will be limited.");
      if (!stateH) warns.push("State not detected — state-level summary will be empty.");
      if (!rateH && !earningsH) warns.push("Rate / Earnings not detected — BCBA earnings section will be limited.");
      if (!i9H && !w4H && !ddH && !bgH) warns.push("Documentation columns (I9/W4/Direct Deposit/Background) not detected — missing-doc exceptions can't be flagged.");

      if (missing.length) {
        setMissingFields(missing); setWarnings(warns); setEmployees([]); setGenerated(false); setFileName(file.name);
        return;
      }
      setMissingFields([]); setWarnings(warns);

      // Aggregate by employee (sum hours per row of same employee)
      const map = new Map<string, EmployeeRow>();
      for (const r of first.rows) {
        const name = nameH ? r[nameH] : `${fnH ? r[fnH] : ""} ${lnH ? r[lnH] : ""}`.trim();
        if (!name) continue;
        const id = idH ? r[idH] : name;
        const key = id || name;
        const role = roleH ? r[roleH] : "";
        const existing = map.get(key);
        const row: EmployeeRow = existing ?? {
          id, name, role,
          department: deptH ? r[deptH] : "",
          state: stateH ? r[stateH] : "",
          manager: mgrH ? r[mgrH] : "",
          submittedHours: 0, approvedHours: 0, regularHours: 0, overtimeHours: 0,
          billableHours: 0, h97153: 0, h97155: 0, h97156: 0,
          rate: rateH ? num(r[rateH]) : 0,
          earnings: 0,
          payrollStatusRaw: statusH ? r[statusH] : "",
          timesheetStatus: timesheetH ? r[timesheetH] : "",
          approvalStatus: approvalH ? r[approvalH] : "",
          hasI9: i9H ? boolish(r[i9H]) : true,
          hasW4: w4H ? boolish(r[w4H]) : true,
          hasDirectDeposit: ddH ? boolish(r[ddH]) : true,
          hasBackground: bgH ? boolish(r[bgH]) : true,
          correctionOpen: correctionH ? boolish(r[correctionH]) : false,
          payrollHold: holdH ? boolish(r[holdH]) : false,
          raw: r,
          exceptions: [],
          readiness: "Ready",
          requiredAction: "",
        };
        if (submittedH) row.submittedHours += num(r[submittedH]);
        if (approvedH) row.approvedHours += num(r[approvedH]);
        if (regularH) row.regularHours += num(r[regularH]);
        if (otH) row.overtimeHours += num(r[otH]);
        if (billableH) row.billableHours += num(r[billableH]);
        if (h97153H) row.h97153 += num(r[h97153H]);
        if (h97155H) row.h97155 += num(r[h97155H]);
        if (h97156H) row.h97156 += num(r[h97156H]);
        if (earningsH) row.earnings += num(r[earningsH]);
        map.set(key, row);
      }

      // For each employee, derive billable if missing and approved exists
      const out = [...map.values()].map(e => {
        if (e.billableHours === 0 && e.approvedHours > 0) e.billableHours = e.approvedHours;
        if (e.earnings === 0 && e.rate > 0) e.earnings = e.rate * (e.approvedHours || e.submittedHours);
        return e;
      });

      setEmployees(out);
      setFileName(file.name);
      setGenerated(false);
      toast.success(`Loaded ${out.length.toLocaleString()} employees from ${file.name}`);
    } catch (e: any) {
      toast.error(`Failed to parse file: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  function resetUpload() {
    setFileName(""); setEmployees([]); setMissingFields([]); setWarnings([]); setGenerated(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  /* ---- Compute readiness + exceptions ---- */
  const computed = useMemo<EmployeeRow[]>(() => {
    return employees.map(e => {
      const ex: PayrollException[] = [];
      const submitted = e.submittedHours;
      const approved = e.approvedHours;
      if (submitted <= 0 && approved <= 0 && e.billableHours <= 0)
        ex.push({ type: "Missing Timesheet", description: "No hours submitted for this period.", severity: "Critical" });
      if (submitted > 0 && approved <= 0)
        ex.push({ type: "Missing Approval", description: "Hours submitted but not yet approved.", severity: "High" });
      if (submitted > 0 && approved > 0 && approved < submitted * 0.95)
        ex.push({ type: "Pending Adjustment", description: `Approved hours (${fmtNum(approved)}) below submitted (${fmtNum(submitted)}).`, severity: "Medium" });
      if (!e.hasI9) ex.push({ type: "Missing Payroll Documentation", description: "I-9 not on file.", severity: "Critical" });
      if (!e.hasW4) ex.push({ type: "Missing Payroll Documentation", description: "W-4 not on file.", severity: "High" });
      if (!e.hasDirectDeposit) ex.push({ type: "Missing Payroll Documentation", description: "Direct deposit not set up.", severity: "Medium" });
      if (!e.hasBackground) ex.push({ type: "Missing Payroll Documentation", description: "Background check not on file.", severity: "Medium" });
      if (e.correctionOpen) ex.push({ type: "Manual Correction Needed", description: "Open correction on record.", severity: "High" });
      if (e.payrollHold) ex.push({ type: "Payroll Hold", description: "Payroll hold flagged.", severity: "Critical" });
      if (!e.role) ex.push({ type: "Missing Role", description: "Role/job title missing.", severity: "Low" });
      if (!e.state) ex.push({ type: "Missing State", description: "Work state missing.", severity: "Low" });
      if (!e.rate && !e.earnings) ex.push({ type: "Missing Rate", description: "Pay rate not on file.", severity: "Medium" });

      const hasCritical = ex.some(x => x.severity === "Critical" || x.severity === "High");
      const hasAny = ex.length > 0;
      const readiness: ReadinessStatus = hasCritical ? "Payroll Risk" : hasAny ? "Needs Review" : "Ready";

      const action = !ex.length ? "—" :
        ex.find(x => x.severity === "Critical")?.description
        ?? ex.find(x => x.severity === "High")?.description
        ?? ex[0].description;

      return { ...e, exceptions: ex, readiness, requiredAction: action };
    });
  }, [employees]);

  /* ---- Filter options ---- */
  const states = useMemo(() => Array.from(new Set(computed.map(e => e.state).filter(Boolean))).sort(), [computed]);
  const roles = useMemo(() => Array.from(new Set(computed.map(e => e.role).filter(Boolean))).sort(), [computed]);
  const depts = useMemo(() => Array.from(new Set(computed.map(e => e.department).filter(Boolean))).sort(), [computed]);
  const managers = useMemo(() => Array.from(new Set(computed.map(e => e.manager).filter(Boolean))).sort(), [computed]);

  const filtered = useMemo(() => {
    return computed.filter(e => {
      if (search) {
        const s = search.toLowerCase();
        if (!e.name.toLowerCase().includes(s) && !e.id.toLowerCase().includes(s)) return false;
      }
      if (statusFilter !== "all" && e.readiness !== statusFilter) return false;
      if (stateFilter !== "all" && e.state !== stateFilter) return false;
      if (roleFilter !== "all" && e.role !== roleFilter) return false;
      if (deptFilter !== "all" && e.department !== deptFilter) return false;
      if (mgrFilter !== "all" && e.manager !== mgrFilter) return false;
      if (exceptionFilter !== "all" && !e.exceptions.some(x => x.type === exceptionFilter)) return false;
      if (severityFilter !== "all" && !e.exceptions.some(x => x.severity === severityFilter)) return false;
      if (bcbaOnly && !isBcba(e.role)) return false;
      if (rbtOnly && !isRbt(e.role)) return false;
      return true;
    });
  }, [computed, search, statusFilter, stateFilter, roleFilter, deptFilter, mgrFilter, exceptionFilter, severityFilter, bcbaOnly, rbtOnly]);

  /* ---- Totals ---- */
  const totals = useMemo(() => {
    const total = computed.length;
    const ready = computed.filter(e => e.readiness === "Ready").length;
    const review = computed.filter(e => e.readiness === "Needs Review").length;
    const risk = computed.filter(e => e.readiness === "Payroll Risk").length;
    const missingTs = computed.filter(e => e.exceptions.some(x => x.type === "Missing Timesheet")).length;
    const missingApproval = computed.filter(e => e.exceptions.some(x => x.type === "Missing Approval")).length;
    const missingDoc = computed.filter(e => e.exceptions.some(x => x.type === "Missing Payroll Documentation")).length;
    const corrections = computed.filter(e => e.correctionOpen).length;
    const holds = computed.filter(e => e.payrollHold).length;
    const openIssues = computed.reduce((s, e) => s + e.exceptions.length, 0);
    const submittedTotal = computed.reduce((s, e) => s + e.submittedHours, 0);
    const approvedTotal = computed.reduce((s, e) => s + e.approvedHours, 0);
    const readinessPct = total > 0 ? ready / total : 0;
    const bcbas = computed.filter(e => isBcba(e.role));
    const bcbasBelow = bcbas.filter(e => (e.billableHours || e.approvedHours) < bcbaMin).length;
    return {
      total, ready, review, risk, missingTs, missingApproval, missingDoc, corrections,
      holds, openIssues, submittedTotal, approvedTotal, readinessPct, bcbas, bcbasBelow,
    };
  }, [computed, bcbaMin]);

  /* ---- Drilldown helpers ---- */
  const EMP_COLS = ["Employee", "ID", "Role", "Department", "State", "Manager", "Submitted", "Approved", "Status", "Action"];
  function empRow(e: EmployeeRow): (string | number)[] {
    return [e.name, e.id, e.role || "—", e.department || "—", e.state || "—", e.manager || "—",
            fmtNum(e.submittedHours), fmtNum(e.approvedHours), e.readiness, e.requiredAction];
  }

  /* ---- KPIs ---- */
  const kpis: KpiSpec[] = useMemo(() => {
    if (!generated) return [];
    return [
      { id: "readiness", label: "Payroll Readiness %", value: fmtPct(totals.readinessPct), raw: totals.readinessPct,
        hint: `${totals.ready} of ${totals.total} ready`, tone: totals.readinessPct >= 0.9 ? "success" : totals.readinessPct >= 0.75 ? "warn" : "danger",
        drilldown: { title: "Employees ready for payroll", columns: EMP_COLS, rows: computed.filter(e => e.readiness === "Ready").map(empRow) } },
      { id: "ready", label: "Employees Ready", value: String(totals.ready), raw: totals.ready, hint: "No open issues", tone: "success",
        drilldown: { title: "Ready", columns: EMP_COLS, rows: computed.filter(e => e.readiness === "Ready").map(empRow) } },
      { id: "review", label: "Needs Review", value: String(totals.review), raw: totals.review, hint: "Minor issues", tone: "warn",
        drilldown: { title: "Needs review", columns: EMP_COLS, rows: computed.filter(e => e.readiness === "Needs Review").map(empRow) } },
      { id: "risk", label: "Payroll Risk", value: String(totals.risk), raw: totals.risk, hint: "Blocking issues", tone: "danger",
        drilldown: { title: "Payroll risk", columns: EMP_COLS, rows: computed.filter(e => e.readiness === "Payroll Risk").map(empRow) } },
      { id: "missingTs", label: "Missing Timesheets", value: String(totals.missingTs), raw: totals.missingTs, hint: "No hours submitted", tone: totals.missingTs ? "danger" : "success",
        drilldown: { title: "Missing timesheets", columns: EMP_COLS, rows: computed.filter(e => e.exceptions.some(x => x.type === "Missing Timesheet")).map(empRow) } },
      { id: "missingAppr", label: "Missing Approvals", value: String(totals.missingApproval), raw: totals.missingApproval, hint: "Awaiting manager", tone: totals.missingApproval ? "warn" : "success",
        drilldown: { title: "Missing approvals", columns: EMP_COLS, rows: computed.filter(e => e.exceptions.some(x => x.type === "Missing Approval")).map(empRow) } },
      { id: "missingDoc", label: "Missing Documentation", value: String(totals.missingDoc), raw: totals.missingDoc, hint: "I9/W4/DD/BG", tone: totals.missingDoc ? "warn" : "success",
        drilldown: { title: "Missing docs", columns: EMP_COLS, rows: computed.filter(e => e.exceptions.some(x => x.type === "Missing Payroll Documentation")).map(empRow) } },
      { id: "corrections", label: "Payroll Corrections", value: String(totals.corrections), raw: totals.corrections, hint: "Open corrections", tone: totals.corrections ? "warn" : "success",
        drilldown: { title: "Open corrections", columns: EMP_COLS, rows: computed.filter(e => e.correctionOpen).map(empRow) } },
      { id: "bcbaBelow", label: "BCBAs Below Minimum", value: String(totals.bcbasBelow), raw: totals.bcbasBelow, hint: `< ${bcbaMin} hrs`, tone: totals.bcbasBelow ? "danger" : "success",
        drilldown: { title: `BCBAs below ${bcbaMin} hrs`, columns: ["BCBA", "State", "Required", "Billable", "Approved", "Difference", "Status"],
          rows: totals.bcbas.filter(e => (e.billableHours || e.approvedHours) < bcbaMin).map(e => {
            const worked = e.billableHours || e.approvedHours;
            return [e.name, e.state || "—", bcbaMin, fmtNum(worked), fmtNum(e.approvedHours), fmtNum(worked - bcbaMin), worked < bcbaMin * 0.6 ? "Below Minimum" : "At Risk"];
          }) } },
      { id: "holds", label: "Payroll Holds", value: String(totals.holds), raw: totals.holds, hint: "Flagged on hold", tone: totals.holds ? "danger" : "success" },
      { id: "openIss", label: "Open Payroll Issues", value: String(totals.openIssues), raw: totals.openIssues, hint: "Across all employees", tone: totals.openIssues ? "warn" : "success" },
      { id: "subm", label: "Total Submitted Hours", value: fmtNum(totals.submittedTotal, 0), raw: totals.submittedTotal, hint: "All employees", tone: "default" },
      { id: "appr", label: "Total Approved Hours", value: fmtNum(totals.approvedTotal, 0), raw: totals.approvedTotal, hint: "All employees", tone: "default" },
    ];
  }, [generated, computed, totals, bcbaMin]);

  /* ---- Charts ---- */
  const charts: ChartSpec[] = useMemo(() => {
    if (!generated || computed.length === 0) return [];

    // Readiness by state
    const stateMap = new Map<string, { ready: number; review: number; risk: number; total: number }>();
    for (const e of computed) {
      const k = e.state || "Unknown";
      const cur = stateMap.get(k) || { ready: 0, review: 0, risk: 0, total: 0 };
      cur.total++;
      if (e.readiness === "Ready") cur.ready++;
      else if (e.readiness === "Needs Review") cur.review++;
      else cur.risk++;
      stateMap.set(k, cur);
    }
    const stateRows = [...stateMap.entries()].sort((a, b) => b[1].total - a[1].total);

    // Exceptions by type
    const exMap = new Map<string, number>();
    for (const e of computed) for (const x of e.exceptions) exMap.set(x.type, (exMap.get(x.type) || 0) + 1);
    const exRows = [...exMap.entries()].sort((a, b) => b[1] - a[1]);

    // Missing timesheets by role
    const roleMap = new Map<string, number>();
    for (const e of computed) if (e.exceptions.some(x => x.type === "Missing Timesheet")) {
      const k = e.role || "Unknown"; roleMap.set(k, (roleMap.get(k) || 0) + 1);
    }
    const roleRows = [...roleMap.entries()].sort((a, b) => b[1] - a[1]);

    // BCBA minimum status
    const bcbaMet = totals.bcbas.filter(e => (e.billableHours || e.approvedHours) >= bcbaMin).length;
    const bcbaAtRisk = totals.bcbas.filter(e => {
      const w = e.billableHours || e.approvedHours;
      return w >= bcbaMin * 0.6 && w < bcbaMin;
    }).length;
    const bcbaBelow = totals.bcbas.filter(e => (e.billableHours || e.approvedHours) < bcbaMin * 0.6).length;

    // Submitted vs Approved (top employees)
    const topByHours = [...computed].sort((a, b) => b.submittedHours - a.submittedHours).slice(0, 12);

    return [
      { id: "state", title: "Payroll Readiness by State", type: "bar", span: 2,
        labels: stateRows.map(([k]) => k),
        series: [
          { name: "Ready", data: stateRows.map(([, v]) => v.ready) },
          { name: "Needs Review", data: stateRows.map(([, v]) => v.review) },
          { name: "Payroll Risk", data: stateRows.map(([, v]) => v.risk) },
        ] },
      { id: "exc", title: "Payroll Exceptions by Type", type: "bar",
        labels: exRows.map(([k]) => k),
        series: [{ name: "Count", data: exRows.map(([, n]) => n) }] },
      { id: "missing-role", title: "Missing Timesheets by Role", type: "bar",
        labels: roleRows.map(([k]) => k),
        series: [{ name: "Employees", data: roleRows.map(([, n]) => n) }] },
      { id: "bcba", title: "BCBA Minimum Hours Status", type: "pie",
        labels: ["Meets Minimum", "At Risk", "Below Minimum"],
        series: [{ name: "BCBAs", data: [bcbaMet, bcbaAtRisk, bcbaBelow] }] },
      { id: "subm-appr", title: "Submitted vs Approved Hours", subtitle: "Top 12 employees", type: "bar", span: 2,
        labels: topByHours.map(e => e.name),
        series: [
          { name: "Submitted", data: topByHours.map(e => e.submittedHours) },
          { name: "Approved", data: topByHours.map(e => e.approvedHours) },
        ] },
    ];
  }, [generated, computed, totals, bcbaMin]);

  /* ---- AI Insights ---- */
  const insights = useMemo(() => {
    if (!generated) return [];
    const out: string[] = [];
    out.push(`Payroll is ${fmtPct(totals.readinessPct)} ready for the selected period.`);
    if (totals.review + totals.risk > 0) out.push(`${totals.review + totals.risk} employee${totals.review + totals.risk === 1 ? "" : "s"} require review before payroll can close.`);
    if (totals.bcbasBelow > 0) out.push(`${totals.bcbasBelow} BCBA${totals.bcbasBelow === 1 ? " is" : "s are"} below the ${bcbaMin}-hour minimum.`);
    if (totals.missingTs > 0) out.push(`${totals.missingTs} employee${totals.missingTs === 1 ? "" : "s"} have no submitted timesheet yet.`);
    if (totals.missingApproval > 0) out.push(`${totals.missingApproval} timesheet${totals.missingApproval === 1 ? " is" : "s are"} awaiting manager approval.`);
    // top state with exceptions
    const stateExc = new Map<string, number>();
    for (const e of computed) if (e.state && e.exceptions.length) stateExc.set(e.state, (stateExc.get(e.state) || 0) + e.exceptions.length);
    const topState = [...stateExc.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topState) out.push(`${topState[0]} has the highest number of payroll exceptions (${topState[1]}).`);
    // top exception
    const exMap = new Map<string, number>();
    for (const e of computed) for (const x of e.exceptions) exMap.set(x.type, (exMap.get(x.type) || 0) + 1);
    const topEx = [...exMap.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topEx) out.push(`${topEx[0]} is the most common payroll blocker (${topEx[1]}).`);
    return out;
  }, [generated, computed, totals, bcbaMin]);

  /* ---- Cycle progress (heuristic) ---- */
  const cycleStages = useMemo(() => {
    const total = totals.total || 1;
    const submitted = computed.filter(e => e.submittedHours > 0).length;
    const approved = computed.filter(e => e.approvedHours > 0).length;
    const ready = totals.ready;
    return [
      { name: "Period Open", pct: 1 },
      { name: "Hours Submitted", pct: submitted / total },
      { name: "Manager Review", pct: approved / total },
      { name: "Corrections Completed", pct: 1 - (totals.corrections / total) },
      { name: "Payroll Ready", pct: ready / total },
      { name: "Payroll Locked", pct: ready === total ? 1 : 0 },
    ];
  }, [computed, totals]);

  /* ---- Exceptions list (flat) ---- */
  const exceptionsList = useMemo(() => {
    const out: { emp: EmployeeRow; ex: PayrollException }[] = [];
    for (const e of computed) for (const x of e.exceptions) out.push({ emp: e, ex: x });
    return out;
  }, [computed]);

  /* ---- Exports ---- */
  function exportReadiness() {
    downloadCsv("payroll-readiness.csv",
      ["Employee", "ID", "Role", "Department", "State", "Manager", "Submitted Hours", "Approved Hours", "Regular", "Overtime", "Status", "Action"],
      computed.map(e => [e.name, e.id, e.role, e.department, e.state, e.manager,
        fmtNum(e.submittedHours), fmtNum(e.approvedHours), fmtNum(e.regularHours), fmtNum(e.overtimeHours), e.readiness, e.requiredAction]));
    toast.success("Readiness exported");
  }
  function exportExceptions() {
    downloadCsv("payroll-exceptions.csv",
      ["Employee", "Role", "State", "Issue Type", "Description", "Severity"],
      exceptionsList.map(({ emp, ex }) => [emp.name, emp.role, emp.state, ex.type, ex.description, ex.severity]));
    toast.success("Exceptions exported");
  }
  function exportBcbaMin() {
    downloadCsv("bcba-minimum-hours.csv",
      ["BCBA", "State", "Required Hours", "Submitted", "Approved", "Billable", "97155", "97156", "Difference", "Status"],
      totals.bcbas.map(e => {
        const worked = e.billableHours || e.approvedHours;
        const status: MinimumStatus = worked >= bcbaMin ? "Meets Minimum" : worked >= bcbaMin * 0.6 ? "At Risk" : "Below Minimum";
        return [e.name, e.state, bcbaMin, fmtNum(e.submittedHours), fmtNum(e.approvedHours), fmtNum(e.billableHours), fmtNum(e.h97155), fmtNum(e.h97156), fmtNum(worked - bcbaMin), status];
      }));
    toast.success("BCBA minimum hours exported");
  }
  function exportStateSummary() {
    const stateMap = new Map<string, { total: number; ready: number; review: number; risk: number; exc: number; bcbaBelow: number; submitted: number; approved: number }>();
    for (const e of computed) {
      const k = e.state || "Unknown";
      const cur = stateMap.get(k) || { total: 0, ready: 0, review: 0, risk: 0, exc: 0, bcbaBelow: 0, submitted: 0, approved: 0 };
      cur.total++;
      if (e.readiness === "Ready") cur.ready++;
      else if (e.readiness === "Needs Review") cur.review++;
      else cur.risk++;
      cur.exc += e.exceptions.length;
      if (isBcba(e.role) && (e.billableHours || e.approvedHours) < bcbaMin) cur.bcbaBelow++;
      cur.submitted += e.submittedHours; cur.approved += e.approvedHours;
      stateMap.set(k, cur);
    }
    downloadCsv("state-payroll-summary.csv",
      ["State", "Total", "Ready", "Needs Review", "Risk", "Readiness %", "Open Exceptions", "BCBAs Below Min", "Submitted Hrs", "Approved Hrs"],
      [...stateMap.entries()].map(([s, v]) => [s, v.total, v.ready, v.review, v.risk, fmtPct(v.ready / v.total), v.exc, v.bcbaBelow, fmtNum(v.submitted), fmtNum(v.approved)]));
    toast.success("State summary exported");
  }
  function copyPayrollSummary() {
    const lines = [
      `Payroll Command Center — ${fileName}`,
      `Period: ${cycle}${periodStart ? ` (${periodStart} → ${periodEnd})` : ""}`,
      `Readiness: ${fmtPct(totals.readinessPct)} (${totals.ready}/${totals.total} ready)`,
      `Needs review: ${totals.review} · Payroll risk: ${totals.risk}`,
      `Missing timesheets: ${totals.missingTs} · Missing approvals: ${totals.missingApproval}`,
      `BCBAs below minimum (${bcbaMin}h): ${totals.bcbasBelow}`,
      `Open issues: ${totals.openIssues}`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Payroll summary copied");
  }
  function saveSnapshot() {
    try {
      const key = "blossom.os.hr.payroll.snapshots.v1";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.push({
        id: crypto.randomUUID(), savedAt: new Date().toISOString(),
        fileName, cycle, periodStart, periodEnd, bcbaMin,
        rowCount: computed.length,
        filters: { statusFilter, stateFilter, roleFilter, deptFilter, mgrFilter, exceptionFilter, severityFilter, bcbaOnly, rbtOnly },
        kpis: {
          readinessPct: totals.readinessPct, ready: totals.ready, review: totals.review, risk: totals.risk,
          openIssues: totals.openIssues, bcbasBelow: totals.bcbasBelow,
        },
      });
      localStorage.setItem(key, JSON.stringify(list));
      toast.success("Snapshot saved");
    } catch { toast.error("Could not save snapshot"); }
  }

  /* ---- Issue tracker actions ---- */
  function addIssue(emp?: EmployeeRow, ex?: PayrollException) {
    setIssues(prev => [...prev, {
      id: crypto.randomUUID(),
      employee: emp?.name ?? "",
      state: emp?.state ?? "",
      role: emp?.role ?? "",
      type: ex?.type ?? "Unknown Issue",
      priority: ex?.severity ?? "Medium",
      assignedTo: "HR",
      openedDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      status: "Open",
      notes: ex?.description ?? "",
      resolution: "",
    }]);
    toast.success("Issue added to tracker");
  }
  function removeIssue(id: string) { setIssues(prev => prev.filter(i => i.id !== id)); }

  /* ===================== RENDER ===================== */

  return (
    <OSShell>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/reports" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition hover:-translate-y-0.5 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
        <div>
          <Badge variant="secondary" className="rounded-full bg-[hsl(265_100%_97%)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(265_70%_55%)]">
            HR · Featured Dashboard
          </Badge>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight">Payroll Command Center</h1>
          <p className="text-[12.5px] text-muted-foreground">
            Centralized payroll readiness dashboard for reviewing employee hours, BCBA minimums, payroll exceptions, documentation issues, and payroll cycle status.
          </p>
        </div>
      </div>

      {/* Upload */}
      <section className="mt-6 rounded-3xl border border-border/60 bg-card p-6 shadow-[0_20px_50px_-30px_hsl(265_60%_50%/0.25)]">
        {!fileName ? (
          <UploadDropzone inputRef={inputRef} dragOver={dragOver} setDragOver={setDragOver} onFiles={handleFiles} loading={loading} />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(265_100%_97%)] text-[hsl(265_70%_55%)]">
                  <FileSpreadsheet className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold">{fileName}</p>
                  <p className="text-[11px] text-muted-foreground">{employees.length.toLocaleString()} employee{employees.length === 1 ? "" : "s"} detected</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={resetUpload}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Replace file
              </Button>
            </div>

            {/* Period selector */}
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Payroll Period</label>
                <Select value={cycle} onValueChange={(v: any) => setCycle(v)}>
                  <SelectTrigger className="mt-1 h-9 text-[12.5px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Period Start</label>
                <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="mt-1 h-9 text-[12.5px]" />
              </div>
              <div>
                <label className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Period End</label>
                <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="mt-1 h-9 text-[12.5px]" />
              </div>
              <div>
                <label className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">BCBA Min Hours</label>
                <Input type="number" value={bcbaMin} onChange={(e) => setBcbaMin(Math.max(0, parseFloat(e.target.value) || 0))} className="mt-1 h-9 text-[12.5px]" />
              </div>
            </div>

            {warnings.length > 0 && (
              <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3">
                <div className="flex items-start gap-2 text-amber-800">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <ul className="text-[12px] leading-snug space-y-0.5">
                    {warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {missingFields.length > 0 ? (
              <div className="rounded-xl border border-rose-200/70 bg-rose-50/60 p-4">
                <div className="flex items-start gap-2 text-rose-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <div className="text-[12.5px] leading-snug">
                    <p className="font-semibold">Unable to generate this dashboard. Missing: {missingFields.join(", ")}.</p>
                    <p className="mt-1 text-rose-600/80">Upload a payroll, billing or hours export that includes an employee name and at least one hours column.</p>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => { setGenerated(true); toast.success("Payroll dashboard generated"); }}
                className="h-9 rounded-full bg-[hsl(265_70%_55%)] px-5 text-[12.5px] font-semibold text-white hover:bg-[hsl(265_70%_50%)]"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Generate Payroll Dashboard
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Dashboard */}
      {generated && computed.length > 0 && (
        <>
          {/* KPIs */}
          <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map(k => <KpiTile key={k.id} kpi={k} onClick={(kpi) => kpi.drilldown && setDrill(kpi.drilldown)} />)}
          </section>

          {/* Insights + Export */}
          <section className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)] text-white">
                  <Brain className="h-3.5 w-3.5" />
                </span>
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(265_70%_55%)]">AI Insights</p>
              </div>
              <ul className="mt-3 space-y-1.5 text-[12.5px] leading-snug">
                {insights.map((i, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(265_70%_55%)]" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Export</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={exportReadiness}><Download className="mr-1 h-3.5 w-3.5" />Readiness</Button>
                <Button variant="outline" size="sm" onClick={exportExceptions}><Download className="mr-1 h-3.5 w-3.5" />Exceptions</Button>
                <Button variant="outline" size="sm" onClick={exportBcbaMin}><Download className="mr-1 h-3.5 w-3.5" />BCBA Min</Button>
                <Button variant="outline" size="sm" onClick={exportStateSummary}><Download className="mr-1 h-3.5 w-3.5" />State Summary</Button>
                <Button variant="outline" size="sm" onClick={copyPayrollSummary}><Calculator className="mr-1 h-3.5 w-3.5" />Copy Summary</Button>
                <Button variant="outline" size="sm" onClick={saveSnapshot}><Sparkles className="mr-1 h-3.5 w-3.5" />Save Snapshot</Button>
              </div>
            </div>
          </section>

          {/* Payroll cycle timeline */}
          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight">Payroll Cycle</h2>
                <p className="text-[11.5px] text-muted-foreground">Live progress across stages</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {cycleStages.map(s => (
                <div key={s.name} className="rounded-xl border border-border/50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[12.5px] font-medium">{s.name}</p>
                    <span className="text-[11px] tabular-nums text-muted-foreground">{fmtPct(s.pct)}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-[hsl(265_70%_55%)]" style={{ width: `${Math.min(100, s.pct * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Charts */}
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            {charts.map(c => <ChartCard key={c.id} chart={c} />)}
          </section>

          {/* Payroll Readiness Table */}
          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-semibold tracking-tight">Payroll Readiness</h2>
                <p className="text-[11.5px] text-muted-foreground">{filtered.length} of {computed.length} employees</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee, ID…" className="h-8 w-[220px] pl-8 text-[12px]" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-[150px] text-[12px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Ready">Ready</SelectItem>
                    <SelectItem value="Needs Review">Needs Review</SelectItem>
                    <SelectItem value="Payroll Risk">Payroll Risk</SelectItem>
                  </SelectContent>
                </Select>
                {states.length > 0 && (
                  <Select value={stateFilter} onValueChange={setStateFilter}>
                    <SelectTrigger className="h-8 w-[120px] text-[12px]"><SelectValue placeholder="State" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All states</SelectItem>
                      {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {roles.length > 0 && (
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="h-8 w-[140px] text-[12px]"><SelectValue placeholder="Role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {depts.length > 0 && (
                  <Select value={deptFilter} onValueChange={setDeptFilter}>
                    <SelectTrigger className="h-8 w-[140px] text-[12px]"><SelectValue placeholder="Department" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All departments</SelectItem>
                      {depts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {managers.length > 0 && (
                  <Select value={mgrFilter} onValueChange={setMgrFilter}>
                    <SelectTrigger className="h-8 w-[140px] text-[12px]"><SelectValue placeholder="Manager" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All managers</SelectItem>
                      {managers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Select value={exceptionFilter} onValueChange={setExceptionFilter}>
                  <SelectTrigger className="h-8 w-[170px] text-[12px]"><SelectValue placeholder="Issue type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All issues</SelectItem>
                    {(["Missing Timesheet", "Missing Approval", "Missing Payroll Documentation", "Manual Correction Needed", "Payroll Hold", "Pending Adjustment", "Missing Rate", "Missing Role", "Missing State"] as ExceptionType[])
                      .map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="h-8 w-[130px] text-[12px]"><SelectValue placeholder="Severity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All severities</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant={bcbaOnly ? "default" : "outline"} onClick={() => { setBcbaOnly(v => !v); if (!bcbaOnly) setRbtOnly(false); }} className="h-8 text-[11.5px]">BCBA</Button>
                <Button size="sm" variant={rbtOnly ? "default" : "outline"} onClick={() => { setRbtOnly(v => !v); if (!rbtOnly) setBcbaOnly(false); }} className="h-8 text-[11.5px]">RBT</Button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1200px] text-[12.5px]">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-2 py-2">Employee</th>
                    <th className="px-2 py-2">Role</th>
                    <th className="px-2 py-2">State</th>
                    <th className="px-2 py-2">Manager</th>
                    <th className="px-2 py-2 text-right">Submitted</th>
                    <th className="px-2 py-2 text-right">Approved</th>
                    <th className="px-2 py-2 text-right">Missing</th>
                    <th className="px-2 py-2 text-right">Reg / OT</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Required Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id + e.name} onClick={() => setEmpDrill(e)}
                        className="cursor-pointer border-b border-border/40 transition hover:bg-secondary/40">
                      <td className="px-2 py-2">
                        <div className="font-medium">{e.name}</div>
                        <div className="text-[10.5px] text-muted-foreground">{e.id}</div>
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">{e.role || "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{e.state || "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{e.manager || "—"}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{fmtNum(e.submittedHours)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{fmtNum(e.approvedHours)}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-rose-600">{e.submittedHours > e.approvedHours ? fmtNum(e.submittedHours - e.approvedHours) : "—"}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">{fmtNum(e.regularHours)} / {fmtNum(e.overtimeHours)}</td>
                      <td className="px-2 py-2"><StatusBadge tone={STATUS_TONE[e.readiness]}>{e.readiness}</StatusBadge></td>
                      <td className="px-2 py-2 text-muted-foreground max-w-[260px] truncate" title={e.requiredAction}>{e.requiredAction}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} className="px-2 py-8 text-center text-[12px] text-muted-foreground">No employees match the current filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* BCBA Minimum + Earnings */}
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <BcbaCard title="BCBA Minimum Hours Tracker" subtitle={`Required: ${bcbaMin} hrs`}>
              {totals.bcbas.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">No BCBAs detected. Set the Role column or upload a BCBA roster.</p>
              ) : (
                <ul className="divide-y divide-border/40 rounded-xl border border-border/40">
                  {totals.bcbas.slice(0, 12).map(e => {
                    const worked = e.billableHours || e.approvedHours;
                    const diff = worked - bcbaMin;
                    const status: MinimumStatus = !worked ? "Missing Data" : worked >= bcbaMin ? "Meets Minimum" : worked >= bcbaMin * 0.6 ? "At Risk" : "Below Minimum";
                    return (
                      <li key={e.id + e.name}>
                        <button type="button" onClick={() => setEmpDrill(e)}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[12.5px] transition hover:bg-secondary/40">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{e.name}</p>
                            <p className="text-[10.5px] text-muted-foreground">{e.state || "—"} · {fmtNum(worked)} / {bcbaMin} hrs</p>
                          </div>
                          <span className={cn("shrink-0 tabular-nums text-[11.5px]", diff < 0 ? "text-rose-600" : "text-emerald-600")}>{diff >= 0 ? `+${fmtNum(diff)}` : fmtNum(diff)}</span>
                          <StatusBadge tone={MIN_TONE[status]}>{status}</StatusBadge>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </BcbaCard>
            <BcbaCard title="BCBA Earnings Review" subtitle="Hours × rate · bonus eligibility">
              {totals.bcbas.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">No BCBAs detected.</p>
              ) : (
                <ul className="divide-y divide-border/40 rounded-xl border border-border/40">
                  {totals.bcbas.slice(0, 12).map(e => {
                    const worked = e.billableHours || e.approvedHours;
                    const bonusEligible = worked >= bcbaMin && e.h97155 + e.h97156 > 0;
                    return (
                      <li key={e.id + e.name}>
                        <button type="button" onClick={() => setEmpDrill(e)}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[12.5px] transition hover:bg-secondary/40">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{e.name}</p>
                            <p className="text-[10.5px] text-muted-foreground">97155: {fmtNum(e.h97155)} · 97156: {fmtNum(e.h97156)} · Billable {fmtNum(worked)}h</p>
                          </div>
                          <span className="shrink-0 tabular-nums text-[12px] font-medium">{fmtMoney(e.earnings)}</span>
                          <StatusBadge tone={bonusEligible ? "success" : "default"}>{bonusEligible ? "Bonus eligible" : "Review"}</StatusBadge>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </BcbaCard>
          </section>

          {/* Exceptions section */}
          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-semibold tracking-tight">Payroll Exceptions</h2>
                <p className="text-[11.5px] text-muted-foreground">{exceptionsList.length} open issues across {computed.length} employees</p>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] text-[12.5px]">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-2 py-2">Employee</th>
                    <th className="px-2 py-2">Role</th>
                    <th className="px-2 py-2">State</th>
                    <th className="px-2 py-2">Issue</th>
                    <th className="px-2 py-2">Description</th>
                    <th className="px-2 py-2">Severity</th>
                    <th className="px-2 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptionsList.slice(0, 100).map(({ emp, ex }, i) => (
                    <tr key={i} className="border-b border-border/40 hover:bg-secondary/40">
                      <td className="px-2 py-2 font-medium cursor-pointer" onClick={() => setEmpDrill(emp)}>{emp.name}</td>
                      <td className="px-2 py-2 text-muted-foreground">{emp.role || "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{emp.state || "—"}</td>
                      <td className="px-2 py-2">{ex.type}</td>
                      <td className="px-2 py-2 text-muted-foreground max-w-[300px] truncate" title={ex.description}>{ex.description}</td>
                      <td className="px-2 py-2"><StatusBadge tone={SEV_TONE[ex.severity]}>{ex.severity}</StatusBadge></td>
                      <td className="px-2 py-2 text-right">
                        <Button size="sm" variant="ghost" onClick={() => addIssue(emp, ex)} className="h-7 text-[11px]"><Plus className="mr-1 h-3 w-3" />Track</Button>
                      </td>
                    </tr>
                  ))}
                  {exceptionsList.length === 0 && (
                    <tr><td colSpan={7} className="px-2 py-8 text-center text-[12px] text-emerald-600">No exceptions — payroll is clean.</td></tr>
                  )}
                </tbody>
              </table>
              {exceptionsList.length > 100 && (
                <p className="mt-2 text-[11px] text-muted-foreground">Showing first 100 of {exceptionsList.length}. Export the full list for review.</p>
              )}
            </div>
          </section>

          {/* State Payroll Summary */}
          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="text-[16px] font-semibold tracking-tight">State Payroll Summary</h2>
            <p className="text-[11.5px] text-muted-foreground">Click a state for employee-level drilldown.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(() => {
                const stateMap = new Map<string, { total: number; ready: number; review: number; risk: number; exc: number; bcbaBelow: number; missingTs: number }>();
                for (const e of computed) {
                  const k = e.state || "Unknown";
                  const cur = stateMap.get(k) || { total: 0, ready: 0, review: 0, risk: 0, exc: 0, bcbaBelow: 0, missingTs: 0 };
                  cur.total++;
                  if (e.readiness === "Ready") cur.ready++;
                  else if (e.readiness === "Needs Review") cur.review++;
                  else cur.risk++;
                  cur.exc += e.exceptions.length;
                  if (isBcba(e.role) && (e.billableHours || e.approvedHours) < bcbaMin) cur.bcbaBelow++;
                  if (e.exceptions.some(x => x.type === "Missing Timesheet")) cur.missingTs++;
                  stateMap.set(k, cur);
                }
                return [...stateMap.entries()].sort((a, b) => b[1].total - a[1].total).map(([s, v]) => (
                  <button key={s} onClick={() => setDrill({ title: `${s} · employees`, columns: EMP_COLS, rows: computed.filter(e => (e.state || "Unknown") === s).map(empRow) })}
                    className="rounded-xl border border-border/60 bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-[hsl(265_70%_55%/0.6)] hover:shadow-[0_12px_28px_-18px_hsl(265_60%_50%/0.35)]">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold tracking-tight">{s}</p>
                      <span className="text-[10.5px] text-muted-foreground">{v.total} ppl</span>
                    </div>
                    <p className="mt-1 text-[20px] font-semibold tabular-nums">{fmtPct(v.ready / v.total)}</p>
                    <p className="text-[10.5px] text-muted-foreground">Readiness</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[10.5px]">
                      <div><span className="block font-semibold text-emerald-600">{v.ready}</span><span className="text-muted-foreground">Ready</span></div>
                      <div><span className="block font-semibold text-amber-600">{v.review}</span><span className="text-muted-foreground">Review</span></div>
                      <div><span className="block font-semibold text-rose-600">{v.risk}</span><span className="text-muted-foreground">Risk</span></div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10.5px] text-muted-foreground">
                      <span>Exc: {v.exc}</span><span>BCBA &lt;min: {v.bcbaBelow}</span><span>Missing TS: {v.missingTs}</span>
                    </div>
                  </button>
                ));
              })()}
            </div>
          </section>

          {/* Issue tracker */}
          {issues.length > 0 && (
            <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
              <h2 className="text-[16px] font-semibold tracking-tight">Payroll Issue Tracker</h2>
              <p className="text-[11.5px] text-muted-foreground">{issues.length} tracked issue{issues.length === 1 ? "" : "s"}</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[1000px] text-[12.5px]">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      <th className="px-2 py-2">Employee</th>
                      <th className="px-2 py-2">State</th>
                      <th className="px-2 py-2">Type</th>
                      <th className="px-2 py-2">Priority</th>
                      <th className="px-2 py-2">Assigned</th>
                      <th className="px-2 py-2">Opened</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Notes</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map(i => (
                      <tr key={i.id} className="border-b border-border/40">
                        <td className="px-2 py-2 font-medium">{i.employee}</td>
                        <td className="px-2 py-2 text-muted-foreground">{i.state || "—"}</td>
                        <td className="px-2 py-2">{i.type}</td>
                        <td className="px-2 py-2">{i.priority}</td>
                        <td className="px-2 py-2 text-muted-foreground">{i.assignedTo}</td>
                        <td className="px-2 py-2 text-muted-foreground">{i.openedDate}</td>
                        <td className="px-2 py-2">{i.status}</td>
                        <td className="px-2 py-2 text-muted-foreground max-w-[260px] truncate" title={i.notes}>{i.notes}</td>
                        <td className="px-2 py-2 text-right">
                          <Button size="sm" variant="ghost" onClick={() => removeIssue(i.id)} className="h-7 w-7 p-0"><X className="h-3.5 w-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* Drilldown drawer (generic) */}
      <Sheet open={!!drill} onOpenChange={(o) => !o && setDrill(null)}>
        <SheetContent side="right" className="w-full max-w-4xl overflow-y-auto sm:max-w-4xl">
          <SheetHeader>
            <SheetTitle className="text-[16px]">{drill?.title}</SheetTitle>
          </SheetHeader>
          {drill && (
            <div className="mt-4">
              <p className="text-[11.5px] text-muted-foreground">{drill.rows.length.toLocaleString()} row{drill.rows.length === 1 ? "" : "s"}</p>
              {drill.rows.length === 0 ? (
                <p className="mt-6 text-center text-[12.5px] text-muted-foreground">{drill.emptyMessage ?? "No rows."}</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-[11.5px]">
                    <thead>
                      <tr className="border-b border-border/60 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        {drill.columns.map(c => <th key={c} className="px-2 py-1.5 whitespace-nowrap">{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {drill.rows.map((row, i) => (
                        <tr key={i} className="border-b border-border/30">
                          {row.map((cell, j) => <td key={j} className="px-2 py-1.5 whitespace-nowrap">{String(cell)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Employee drilldown drawer */}
      <Sheet open={!!empDrill} onOpenChange={(o) => !o && setEmpDrill(null)}>
        <SheetContent side="right" className="w-full max-w-3xl overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle className="text-[16px]">{empDrill?.name}</SheetTitle>
          </SheetHeader>
          {empDrill && (
            <div className="mt-4 space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Info label="ID" value={empDrill.id} />
                <Info label="Role" value={empDrill.role || "—"} />
                <Info label="Department" value={empDrill.department || "—"} />
                <Info label="State" value={empDrill.state || "—"} />
                <Info label="Manager" value={empDrill.manager || "—"} />
                <Info label="Status" value={empDrill.readiness} tone={STATUS_TONE[empDrill.readiness]} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Hours</p>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Info label="Submitted" value={fmtNum(empDrill.submittedHours)} />
                  <Info label="Approved" value={fmtNum(empDrill.approvedHours)} />
                  <Info label="Regular" value={fmtNum(empDrill.regularHours)} />
                  <Info label="Overtime" value={fmtNum(empDrill.overtimeHours)} />
                  <Info label="Billable" value={fmtNum(empDrill.billableHours)} />
                  <Info label="97153" value={fmtNum(empDrill.h97153)} />
                  <Info label="97155" value={fmtNum(empDrill.h97155)} />
                  <Info label="97156" value={fmtNum(empDrill.h97156)} />
                </div>
              </div>
              {isBcba(empDrill.role) && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">BCBA Minimums</p>
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Info label="Required" value={`${bcbaMin}h`} />
                    <Info label="Worked" value={fmtNum(empDrill.billableHours || empDrill.approvedHours)} />
                    <Info label="Difference" value={fmtNum((empDrill.billableHours || empDrill.approvedHours) - bcbaMin)} />
                    <Info label="Earnings" value={fmtMoney(empDrill.earnings)} />
                  </div>
                </div>
              )}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Open exceptions ({empDrill.exceptions.length})</p>
                {empDrill.exceptions.length === 0 ? (
                  <p className="mt-2 text-[12px] text-emerald-600">None — this employee is ready.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-border/40 rounded-xl border border-border/40">
                    {empDrill.exceptions.map((x, i) => (
                      <li key={i} className="flex items-start justify-between gap-3 px-3 py-2 text-[12.5px]">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{x.type}</p>
                          <p className="text-[11.5px] text-muted-foreground">{x.description}</p>
                        </div>
                        <StatusBadge tone={SEV_TONE[x.severity]}>{x.severity}</StatusBadge>
                        <Button size="sm" variant="ghost" onClick={() => addIssue(empDrill, x)} className="h-7 text-[11px]"><Plus className="mr-1 h-3 w-3" />Track</Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Raw row</p>
                <pre className="mt-2 max-h-[200px] overflow-auto rounded-xl border border-border/40 bg-secondary/40 p-3 text-[11px]">{JSON.stringify(empDrill.raw, null, 2)}</pre>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </OSShell>
  );
}

/* ===================== sub-components ===================== */

function UploadDropzone({
  inputRef, dragOver, setDragOver, onFiles, loading,
}: {
  inputRef: React.RefObject<HTMLInputElement>;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onFiles: (files: FileList | File[] | null) => void;
  loading: boolean;
}) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition",
        dragOver
          ? "border-[hsl(265_70%_55%)] bg-[hsl(265_100%_98%)]"
          : "border-border/60 bg-secondary/30 hover:border-[hsl(265_70%_55%/0.5)] hover:bg-[hsl(265_100%_99%)]",
      )}
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)] text-white shadow-[0_10px_30px_-10px_hsl(265_70%_55%/0.6)]">
        <Upload className="h-5 w-5" />
      </span>
      <div>
        <p className="text-[14px] font-semibold">Upload payroll, billing or employee-hour export</p>
        <p className="mt-1 text-[11.5px] text-muted-foreground">CSV or XLSX · Viventium, CentralReach billing, timesheet, or roster exports</p>
      </div>
      <Button size="sm" onClick={() => inputRef.current?.click()} disabled={loading}
        className="rounded-full bg-[hsl(265_70%_55%)] hover:bg-[hsl(265_70%_50%)]">
        {loading ? "Parsing…" : "Choose file"}
      </Button>
      <input ref={inputRef} type="file" className="hidden" accept={SUPPORTED_EXTENSIONS} onChange={(e) => onFiles(e.target.files)} />
    </div>
  );
}

function BcbaCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
          {subtitle && <p className="text-[11.5px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function Info({ label, value, tone }: { label: string; value: string; tone?: "success" | "warn" | "danger" | "default" }) {
  return (
    <div className="rounded-xl border border-border/50 bg-secondary/30 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      {tone ? <div className="mt-1"><StatusBadge tone={tone}>{value}</StatusBadge></div> : <p className="mt-0.5 text-[13px] font-medium tabular-nums">{value}</p>}
    </div>
  );
}

function StatusBadge({ tone, children }: { tone: "success" | "warn" | "danger" | "default"; children: React.ReactNode }) {
  const map: Record<string, string> = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    default: "bg-secondary text-muted-foreground border-border/60",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold", map[tone])}>
      {children}
    </span>
  );
}