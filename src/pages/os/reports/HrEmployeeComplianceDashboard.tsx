import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Upload, FileSpreadsheet, Sparkles, Download, Search,
  AlertTriangle, CheckCircle2, Brain, Trash2, ShieldCheck, ShieldAlert,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { ReportAIButton } from "@/components/ai/ReportAIButton";
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
 * HR · Employee Compliance Dashboard
 * Upload Employee Master, Viventium, Monday Employee Board,
 * Certification Tracking, Training Academy, Background Check,
 * I9, or any HR documentation export and instantly review
 * certifications, trainings, documents, expirations, risks
 * and audit readiness across all states.
 * ============================================================ */

type ComplianceStatus =
  | "Fully Compliant" | "Needs Review" | "Action Required" | "High Risk" | "Compliance Hold";

const STATUS_ORDER: ComplianceStatus[] = [
  "Fully Compliant", "Needs Review", "Action Required", "High Risk", "Compliance Hold",
];

const STATUS_TONE: Record<ComplianceStatus, "success" | "warn" | "danger" | "default"> = {
  "Fully Compliant": "success",
  "Needs Review": "warn",
  "Action Required": "warn",
  "High Risk": "danger",
  "Compliance Hold": "danger",
};

type CertStatus = "Valid" | "Expiring Soon" | "Expired" | "Renewal Pending" | "Compliance Hold";

interface EmployeeRow {
  id: string;
  name: string;
  role: string;
  department: string;
  state: string;
  manager: string;
  hireDate: string;
  // raw counts/flags
  missingDocs: string[];
  missingTrainings: string[];
  certs: CertRow[];
  backgroundStatus: string;       // raw
  bgSubmittedDate: string;
  bgCompletedDate: string;
  bgDaysPending: number;
  bgFlagged: boolean;
  orientationComplete: boolean;
  payrollDocsOk: boolean;
  i9Ok: boolean;
  w4Ok: boolean;
  trainingTotal: number;
  trainingComplete: number;
  trainingDueDate: string;
  trainingDaysOverdue: number;
  notes: string;
  raw: Record<string, string>;
  // derived
  status: ComplianceStatus;
  openIssues: string[];
  nextExpirationDate: string;
  nextExpirationDays: number;
}

interface CertRow {
  type: string;
  number: string;
  issued: string;
  expires: string;
  daysToExpire: number;
  status: CertStatus;
  renewalSubmitted: boolean;
}

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
function fmtPct(n: number) { return isFinite(n) ? `${(n * 100).toFixed(1)}%` : "—"; }
function parseDate(v: string | undefined | null): Date | null {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function daysBetween(a: Date | null, b: Date = new Date()) {
  if (!a) return 0;
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}
function isoDate(d: Date | null): string { return d ? d.toISOString().slice(0, 10) : ""; }
function truthy(v: string | undefined | null): boolean {
  if (!v) return false;
  const s = String(v).toLowerCase().trim();
  return ["yes", "y", "true", "1", "complete", "completed", "done", "ok", "valid", "on file", "received", "signed"].includes(s);
}
function falsy(v: string | undefined | null): boolean {
  if (!v) return true;
  const s = String(v).toLowerCase().trim();
  return ["no", "n", "false", "0", "missing", "incomplete", "pending", "needed", "required", "n/a"].includes(s) || s === "";
}
function downloadCsv(filename: string, columns: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [columns.map(escape).join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function certStatusFor(expiresDate: Date | null, renewalSubmitted: boolean): CertStatus {
  if (!expiresDate) return "Compliance Hold";
  const days = daysBetween(expiresDate);
  if (days < 0) return renewalSubmitted ? "Renewal Pending" : "Expired";
  if (days <= 30) return renewalSubmitted ? "Renewal Pending" : "Expiring Soon";
  return "Valid";
}

/* ===================== PAGE ===================== */

export default function HrEmployeeComplianceDashboard() {
  const [files, setFiles] = useState<{ name: string; rows: number; kind: string }[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");

  const [drill, setDrill] = useState<DrilldownSpec | null>(null);
  const [empDrill, setEmpDrill] = useState<EmployeeRow | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  /* ---- Upload ---- */
  async function handleFiles(fileList: FileList | File[] | null) {
    if (!fileList || !fileList.length) return;
    setLoading(true);
    try {
      const newEmps: EmployeeRow[] = [];
      const fileSummaries: { name: string; rows: number; kind: string }[] = [];
      const warns: string[] = [];

      for (const f of Array.from(fileList)) {
        const parsed = await parseAnyFile(f);
        const first = parsed[0];
        if (!first) { warns.push(`${f.name}: no data found.`); continue; }
        const headers = first.headers;

        const nameH = findHeader(headers, ["EmployeeName", "Employee Name", "Name", "FullName", "Full Name"]);
        const fnH = findHeader(headers, ["FirstName", "First Name"]);
        const lnH = findHeader(headers, ["LastName", "Last Name"]);
        if (!nameH && !(fnH && lnH)) {
          warns.push(`${f.name}: no employee name column detected — skipped.`);
          continue;
        }

        const idH = findHeader(headers, ["EmployeeId", "Employee ID", "EmpId", "Emp ID", "Id", "ID"]);
        const roleH = findHeader(headers, ["Role", "Position", "JobTitle", "Job Title", "Title"]);
        const deptH = findHeader(headers, ["Department", "Dept", "Team"]);
        const stateH = findHeader(headers, ["State", "Region", "Location"]);
        const managerH = findHeader(headers, ["Manager", "Supervisor", "DirectManager", "Reports To"]);
        const hireH = findHeader(headers, ["HireDate", "Hire Date", "StartDate", "Start Date"]);

        // Certifications (one row per employee approach — supports multiple cert columns)
        const certPairs: { typeName: string; expH?: string; numH?: string; issuedH?: string; renewH?: string }[] = [
          { typeName: "RBT", expH: findHeader(headers, ["RBTExpiration", "RBT Expiration", "RBTExpDate", "RBT Cert Expiration"]) || undefined, numH: findHeader(headers, ["RBTNumber", "RBT Number", "RBT Cert #"]) || undefined, issuedH: findHeader(headers, ["RBTIssued", "RBT Issued"]) || undefined, renewH: findHeader(headers, ["RBTRenewal", "RBT Renewal Submitted"]) || undefined },
          { typeName: "BCBA", expH: findHeader(headers, ["BCBAExpiration", "BCBA Expiration", "BCBAExpDate"]) || undefined, numH: findHeader(headers, ["BCBANumber", "BCBA Number", "BACBNumber", "BACB Number"]) || undefined },
          { typeName: "BCaBA", expH: findHeader(headers, ["BCaBAExpiration", "BCaBA Expiration"]) || undefined, numH: findHeader(headers, ["BCaBANumber", "BCaBA Number"]) || undefined },
          { typeName: "CPR", expH: findHeader(headers, ["CPRExpiration", "CPR Expiration", "CPR Exp"]) || undefined },
          { typeName: "First Aid", expH: findHeader(headers, ["FirstAidExpiration", "First Aid Expiration", "FirstAidExp"]) || undefined },
          { typeName: "State License", expH: findHeader(headers, ["StateLicenseExpiration", "State License Expiration", "LicenseExpiration"]) || undefined, numH: findHeader(headers, ["StateLicenseNumber", "License Number"]) || undefined },
        ];

        // Documentation
        const i9H = findHeader(headers, ["I9", "I-9", "I9Status", "I-9 Status"]);
        const w4H = findHeader(headers, ["W4", "W-4", "W4Status"]);
        const directDepositH = findHeader(headers, ["DirectDeposit", "Direct Deposit"]);
        const offerH = findHeader(headers, ["OfferLetter", "Offer Letter"]);
        const bgConsentH = findHeader(headers, ["BackgroundConsent", "Background Check Consent"]);
        const handbookH = findHeader(headers, ["Handbook", "Handbook Acknowledgement", "HandbookAck"]);
        const policiesH = findHeader(headers, ["PolicySignatures", "Policies", "PolicyAck"]);
        const agreementH = findHeader(headers, ["EmploymentAgreement", "Employment Agreement"]);
        const payrollFormsH = findHeader(headers, ["PayrollForms", "Payroll Documentation"]);
        const stateFormsH = findHeader(headers, ["StateForms", "State Required Forms"]);

        // Background check
        const bgStatusH = findHeader(headers, ["BackgroundStatus", "Background Status", "BackgroundCheck", "Background Check"]);
        const bgSubH = findHeader(headers, ["BackgroundSubmitted", "BackgroundDate", "Background Submitted Date"]);
        const bgCompH = findHeader(headers, ["BackgroundCompleted", "Background Completed Date"]);
        const bgFlagH = findHeader(headers, ["BackgroundFlagged", "Flagged", "BackgroundResult"]);

        // Orientation
        const orientH = findHeader(headers, ["Orientation", "OrientationStatus", "Orientation Complete"]);

        // Training
        const trainTotalH = findHeader(headers, ["TrainingTotal", "AssignedTrainings", "Assigned Trainings"]);
        const trainDoneH = findHeader(headers, ["TrainingComplete", "CompletedTrainings", "Completed Trainings"]);
        const trainDueH = findHeader(headers, ["TrainingDueDate", "Training Due Date", "TrainingDue"]);

        const notesH = findHeader(headers, ["Notes", "Comments", "Comment", "Note"]);

        let nRows = 0;
        for (const r of first.rows) {
          const name = nameH ? r[nameH] : `${fnH ? r[fnH] : ""} ${lnH ? r[lnH] : ""}`.trim();
          if (!name) continue;
          const id = idH ? r[idH] : `${f.name}:${nRows}`;

          // Certs
          const certs: CertRow[] = [];
          for (const p of certPairs) {
            if (!p.expH) continue;
            const expRaw = r[p.expH];
            if (!expRaw) continue;
            const exp = parseDate(expRaw);
            const renewal = p.renewH ? truthy(r[p.renewH]) : false;
            certs.push({
              type: p.typeName,
              number: p.numH ? r[p.numH] : "",
              issued: p.issuedH ? r[p.issuedH] : "",
              expires: isoDate(exp),
              daysToExpire: daysBetween(exp),
              status: certStatusFor(exp, renewal),
              renewalSubmitted: renewal,
            });
          }

          // Missing documents
          const docChecks: [string, string | null][] = [
            ["I9", i9H], ["W4", w4H], ["Direct Deposit", directDepositH],
            ["Offer Letter", offerH], ["Background Consent", bgConsentH],
            ["Handbook Ack", handbookH], ["Policy Signatures", policiesH],
            ["Employment Agreement", agreementH], ["Payroll Forms", payrollFormsH],
            ["State Forms", stateFormsH],
          ];
          const missingDocs: string[] = [];
          for (const [label, h] of docChecks) {
            if (!h) continue;
            if (!truthy(r[h])) missingDocs.push(label);
          }

          // Background
          const bgRaw = bgStatusH ? r[bgStatusH] : "";
          const bgSub = parseDate(bgSubH ? r[bgSubH] : "");
          const bgComp = parseDate(bgCompH ? r[bgCompH] : "");
          const bgFlagged = bgFlagH ? /flag|fail|issue|hit/i.test(r[bgFlagH] || "") : false;
          const bgDaysPending = bgSub && !bgComp ? Math.max(0, -daysBetween(bgSub)) : 0;

          // Orientation
          const orientationComplete = orientH ? truthy(r[orientH]) : false;

          // Training
          const tt = trainTotalH ? num(r[trainTotalH]) : 0;
          const td = trainDoneH ? num(r[trainDoneH]) : 0;
          const dueDate = parseDate(trainDueH ? r[trainDueH] : "");
          const outstanding = Math.max(0, tt - td);
          const trainingDaysOverdue = (outstanding > 0 && dueDate) ? Math.max(0, -daysBetween(dueDate)) : 0;
          const missingTrainings = outstanding > 0 ? [`${outstanding} outstanding training${outstanding === 1 ? "" : "s"}`] : [];

          // Issues + status
          const issues: string[] = [];
          if (missingDocs.length) issues.push(`Missing docs: ${missingDocs.join(", ")}`);
          if (missingTrainings.length) issues.push(missingTrainings[0]);
          for (const c of certs) {
            if (c.status === "Expired") issues.push(`${c.type} expired`);
            else if (c.status === "Expiring Soon") issues.push(`${c.type} expires in ${c.daysToExpire}d`);
            else if (c.status === "Compliance Hold") issues.push(`${c.type} missing expiration`);
          }
          if (bgFlagged) issues.push("Background flagged");
          if (bgDaysPending >= 14) issues.push(`Background pending ${bgDaysPending}d`);
          if (orientH && !orientationComplete) issues.push("Orientation incomplete");

          let status: ComplianceStatus = "Fully Compliant";
          const hasExpired = certs.some(c => c.status === "Expired");
          const hasExpiringSoon = certs.some(c => c.status === "Expiring Soon");
          const hasHold = certs.some(c => c.status === "Compliance Hold");
          if (bgFlagged) status = "Compliance Hold";
          else if (hasExpired || bgDaysPending >= 14) status = "High Risk";
          else if (missingDocs.length >= 3 || trainingDaysOverdue >= 14 || hasHold) status = "High Risk";
          else if (missingDocs.length > 0 || trainingDaysOverdue > 0 || hasExpiringSoon || (orientH && !orientationComplete)) status = "Action Required";
          else if (outstanding > 0) status = "Needs Review";

          // Next expiration
          const futureCerts = certs.filter(c => c.expires).sort((a, b) => a.daysToExpire - b.daysToExpire);
          const next = futureCerts[0];

          newEmps.push({
            id,
            name,
            role: roleH ? r[roleH] : "",
            department: deptH ? r[deptH] : "",
            state: stateH ? r[stateH] : "",
            manager: managerH ? r[managerH] : "",
            hireDate: isoDate(parseDate(hireH ? r[hireH] : "")),
            missingDocs,
            missingTrainings,
            certs,
            backgroundStatus: bgRaw,
            bgSubmittedDate: isoDate(bgSub),
            bgCompletedDate: isoDate(bgComp),
            bgDaysPending,
            bgFlagged,
            orientationComplete,
            payrollDocsOk: payrollFormsH ? truthy(r[payrollFormsH]) : true,
            i9Ok: i9H ? truthy(r[i9H]) : true,
            w4Ok: w4H ? truthy(r[w4H]) : true,
            trainingTotal: tt,
            trainingComplete: td,
            trainingDueDate: isoDate(dueDate),
            trainingDaysOverdue,
            notes: notesH ? r[notesH] : "",
            raw: r,
            status,
            openIssues: issues,
            nextExpirationDate: next ? next.expires : "",
            nextExpirationDays: next ? next.daysToExpire : 9999,
          });
          nRows++;
        }
        fileSummaries.push({ name: f.name, rows: nRows, kind: "Employees" });
      }

      const missing: string[] = [];
      if (newEmps.length === 0) missing.push("Employee Name column");

      setMissingFields(missing);
      setWarnings(warns);
      setEmployees(prev => [...prev, ...newEmps]);
      setFiles(prev => [...prev, ...fileSummaries]);
      setGenerated(false);
      toast.success(`Loaded ${newEmps.length} employee${newEmps.length === 1 ? "" : "s"}.`);
    } catch (e: any) {
      toast.error(`Failed to parse file: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function resetUpload() {
    setFiles([]); setEmployees([]); setMissingFields([]); setWarnings([]); setGenerated(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  /* ---- Filter options ---- */
  const states = useMemo(() => Array.from(new Set(employees.map(e => e.state).filter(Boolean))).sort(), [employees]);
  const roles = useMemo(() => Array.from(new Set(employees.map(e => e.role).filter(Boolean))).sort(), [employees]);
  const depts = useMemo(() => Array.from(new Set(employees.map(e => e.department).filter(Boolean))).sort(), [employees]);
  const managers = useMemo(() => Array.from(new Set(employees.map(e => e.manager).filter(Boolean))).sort(), [employees]);

  const filtered = useMemo(() => {
    return employees.filter(e => {
      if (search) {
        const s = search.toLowerCase();
        if (!e.name.toLowerCase().includes(s) && !e.id.toLowerCase().includes(s) && !e.role.toLowerCase().includes(s)) return false;
      }
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (stateFilter !== "all" && e.state !== stateFilter) return false;
      if (roleFilter !== "all" && e.role !== roleFilter) return false;
      if (deptFilter !== "all" && e.department !== deptFilter) return false;
      if (managerFilter !== "all" && e.manager !== managerFilter) return false;
      return true;
    });
  }, [employees, search, statusFilter, stateFilter, roleFilter, deptFilter, managerFilter]);

  /* ---- Aggregates ---- */
  const agg = useMemo(() => {
    const total = filtered.length;
    const counts: Record<ComplianceStatus, number> = {
      "Fully Compliant": 0, "Needs Review": 0, "Action Required": 0, "High Risk": 0, "Compliance Hold": 0,
    };
    for (const e of filtered) counts[e.status]++;
    const fullyCompliant = counts["Fully Compliant"];
    const needsAction = counts["Action Required"] + counts["Needs Review"];
    const critical = counts["High Risk"] + counts["Compliance Hold"];
    const allCerts = filtered.flatMap(e => e.certs);
    const expiring = allCerts.filter(c => c.status === "Expiring Soon").length;
    const expired = allCerts.filter(c => c.status === "Expired").length;
    const missingDocsEmps = filtered.filter(e => e.missingDocs.length > 0).length;
    const missingTrainingEmps = filtered.filter(e => e.trainingComplete < e.trainingTotal).length;
    const bgIssues = filtered.filter(e => e.bgFlagged || e.bgDaysPending >= 7).length;
    const payrollIssues = filtered.filter(e => !e.payrollDocsOk || !e.i9Ok || !e.w4Ok).length;
    const orientationIncomplete = filtered.filter(e => e.openIssues.includes("Orientation incomplete")).length;
    const annualDue = allCerts.filter(c => c.daysToExpire >= 0 && c.daysToExpire <= 90).length;
    const holds = counts["Compliance Hold"];
    const readiness = total > 0 ? fullyCompliant / total : 0;
    return {
      total, counts, fullyCompliant, needsAction, critical, expiring, expired,
      missingDocsEmps, missingTrainingEmps, bgIssues, payrollIssues, orientationIncomplete,
      annualDue, holds, readiness,
    };
  }, [filtered]);

  /* ---- KPIs ---- */
  const EMP_COLS = ["Employee", "Role", "State", "Manager", "Status", "Open Issues", "Next Expiration"];
  function empRow(e: EmployeeRow): (string | number)[] {
    return [e.name, e.role || "—", e.state || "—", e.manager || "—", e.status,
      e.openIssues.join("; ") || "—",
      e.nextExpirationDate ? `${e.nextExpirationDate} (${e.nextExpirationDays}d)` : "—"];
  }

  const kpis: KpiSpec[] = useMemo(() => {
    if (!generated) return [];
    return [
      { id: "total", label: "Total Employees", value: String(agg.total), raw: agg.total, hint: "All loaded employees", tone: "default",
        drilldown: { title: "All employees", columns: EMP_COLS, rows: filtered.map(empRow) } },
      { id: "ok", label: "Fully Compliant", value: String(agg.fullyCompliant), raw: agg.fullyCompliant, hint: "No open issues", tone: "success",
        drilldown: { title: "Fully compliant", columns: EMP_COLS, rows: filtered.filter(e => e.status === "Fully Compliant").map(empRow) } },
      { id: "action", label: "Requiring Action", value: String(agg.needsAction), raw: agg.needsAction, hint: "Needs review + action required", tone: agg.needsAction ? "warn" : "success",
        drilldown: { title: "Requiring action", columns: EMP_COLS, rows: filtered.filter(e => e.status === "Needs Review" || e.status === "Action Required").map(empRow) } },
      { id: "critical", label: "Critical Risks", value: String(agg.critical), raw: agg.critical, hint: "High risk + holds", tone: agg.critical ? "danger" : "success",
        drilldown: { title: "Critical compliance risks", columns: EMP_COLS, rows: filtered.filter(e => e.status === "High Risk" || e.status === "Compliance Hold").map(empRow) } },
      { id: "exp", label: "Expiring Certs (≤30d)", value: String(agg.expiring), raw: agg.expiring, hint: "Across all employees", tone: agg.expiring ? "warn" : "success",
        drilldown: { title: "Certifications expiring within 30 days", columns: ["Employee", "Cert", "Expires", "Days"],
          rows: filtered.flatMap(e => e.certs.filter(c => c.status === "Expiring Soon").map(c => [e.name, c.type, c.expires, c.daysToExpire])) } },
      { id: "expired", label: "Expired Certs", value: String(agg.expired), raw: agg.expired, hint: "Renewal overdue", tone: agg.expired ? "danger" : "success",
        drilldown: { title: "Expired certifications", columns: ["Employee", "Cert", "Expires", "Days Past"],
          rows: filtered.flatMap(e => e.certs.filter(c => c.status === "Expired").map(c => [e.name, c.type, c.expires, -c.daysToExpire])) } },
      { id: "miss", label: "Missing Documents", value: String(agg.missingDocsEmps), raw: agg.missingDocsEmps, hint: "Employees w/ doc gaps", tone: agg.missingDocsEmps ? "warn" : "success",
        drilldown: { title: "Missing documentation", columns: ["Employee", "Role", "State", "Missing"],
          rows: filtered.filter(e => e.missingDocs.length > 0).map(e => [e.name, e.role || "—", e.state || "—", e.missingDocs.join(", ")]) } },
      { id: "train", label: "Missing Training", value: String(agg.missingTrainingEmps), raw: agg.missingTrainingEmps, hint: "Outstanding assignments", tone: agg.missingTrainingEmps ? "warn" : "success",
        drilldown: { title: "Training compliance gaps", columns: ["Employee", "Role", "Complete", "Total", "Days Overdue"],
          rows: filtered.filter(e => e.trainingComplete < e.trainingTotal).map(e => [e.name, e.role || "—", e.trainingComplete, e.trainingTotal, e.trainingDaysOverdue]) } },
      { id: "bg", label: "Background Issues", value: String(agg.bgIssues), raw: agg.bgIssues, hint: "Flagged or pending >7d", tone: agg.bgIssues ? "danger" : "success",
        drilldown: { title: "Background check issues", columns: ["Employee", "Status", "Submitted", "Pending Days", "Flagged"],
          rows: filtered.filter(e => e.bgFlagged || e.bgDaysPending >= 7).map(e => [e.name, e.backgroundStatus || "—", e.bgSubmittedDate || "—", e.bgDaysPending, e.bgFlagged ? "Yes" : "No"]) } },
      { id: "pay", label: "Payroll Doc Issues", value: String(agg.payrollIssues), raw: agg.payrollIssues, hint: "I9 / W4 / Payroll forms", tone: agg.payrollIssues ? "warn" : "success" },
      { id: "orient", label: "Orientation Incomplete", value: String(agg.orientationIncomplete), raw: agg.orientationIncomplete, hint: "Onboarding gap", tone: agg.orientationIncomplete ? "warn" : "success" },
      { id: "annual", label: "Renewals Due (≤90d)", value: String(agg.annualDue), raw: agg.annualDue, hint: "Across all certs", tone: agg.annualDue ? "warn" : "default" },
      { id: "hold", label: "Compliance Holds", value: String(agg.holds), raw: agg.holds, hint: "Blocked employees", tone: agg.holds ? "danger" : "success" },
      { id: "ready", label: "Compliance Readiness", value: fmtPct(agg.readiness), raw: agg.readiness, hint: "Fully compliant ÷ total", tone: agg.readiness >= 0.9 ? "success" : agg.readiness >= 0.75 ? "warn" : "danger" },
    ];
  }, [generated, filtered, agg]);

  /* ---- Charts ---- */
  const charts: ChartSpec[] = useMemo(() => {
    if (!generated || filtered.length === 0) return [];

    // Status distribution
    const statusRows = STATUS_ORDER.filter(s => agg.counts[s] > 0);

    // Expiration timeline buckets
    const buckets: { label: string; min: number; max: number }[] = [
      { label: "Expired", min: -99999, max: -1 },
      { label: "0-30 days", min: 0, max: 30 },
      { label: "31-60 days", min: 31, max: 60 },
      { label: "61-90 days", min: 61, max: 90 },
      { label: "90+ days", min: 91, max: 99999 },
    ];
    const allCerts = filtered.flatMap(e => e.certs);
    const bucketCounts = buckets.map(b => allCerts.filter(c => c.daysToExpire >= b.min && c.daysToExpire <= b.max).length);

    // By state
    const stateMap = new Map<string, { total: number; ok: number }>();
    for (const e of filtered) {
      const k = e.state || "Unknown";
      const cur = stateMap.get(k) || { total: 0, ok: 0 };
      cur.total++;
      if (e.status === "Fully Compliant") cur.ok++;
      stateMap.set(k, cur);
    }
    const stateRows = [...stateMap.entries()].sort((a, b) => b[1].total - a[1].total);

    // By role
    const roleMap = new Map<string, { total: number; ok: number }>();
    for (const e of filtered) {
      const k = e.role || "Unknown";
      const cur = roleMap.get(k) || { total: 0, ok: 0 };
      cur.total++;
      if (e.status === "Fully Compliant") cur.ok++;
      roleMap.set(k, cur);
    }
    const roleRows = [...roleMap.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 10);

    return [
      { id: "status", title: "Compliance Status Distribution", type: "pie",
        labels: statusRows, series: [{ name: "Employees", data: statusRows.map(s => agg.counts[s]) }] },
      { id: "exp", title: "Certification Expiration Timeline", type: "bar",
        labels: buckets.map(b => b.label), series: [{ name: "Certifications", data: bucketCounts }] },
      { id: "state", title: "Compliance by State", type: "bar",
        labels: stateRows.map(([k]) => k),
        series: [
          { name: "Employees", data: stateRows.map(([, v]) => v.total) },
          { name: "Fully Compliant", data: stateRows.map(([, v]) => v.ok) },
        ] },
      { id: "role", title: "Compliance by Role", type: "bar",
        labels: roleRows.map(([k]) => k),
        series: [
          { name: "Employees", data: roleRows.map(([, v]) => v.total) },
          { name: "Fully Compliant", data: roleRows.map(([, v]) => v.ok) },
        ] },
    ];
  }, [generated, filtered, agg]);

  /* ---- Alerts ---- */
  const alerts = useMemo(() => {
    const items: { title: string; count: number; tone: "warn" | "danger"; rows: EmployeeRow[] }[] = [];
    const expired = filtered.filter(e => e.certs.some(c => c.status === "Expired"));
    if (expired.length) items.push({ title: "Expired certifications", count: expired.length, tone: "danger", rows: expired });
    const expiring = filtered.filter(e => e.certs.some(c => c.status === "Expiring Soon"));
    if (expiring.length) items.push({ title: "Expiring within 30 days", count: expiring.length, tone: "warn", rows: expiring });
    const missDoc = filtered.filter(e => e.missingDocs.length > 0);
    if (missDoc.length) items.push({ title: "Missing documentation", count: missDoc.length, tone: "warn", rows: missDoc });
    const missTrain = filtered.filter(e => e.trainingDaysOverdue > 0);
    if (missTrain.length) items.push({ title: "Training overdue", count: missTrain.length, tone: "warn", rows: missTrain });
    const bgIssue = filtered.filter(e => e.bgFlagged || e.bgDaysPending >= 14);
    if (bgIssue.length) items.push({ title: "Background check critical", count: bgIssue.length, tone: "danger", rows: bgIssue });
    const holds = filtered.filter(e => e.status === "Compliance Hold");
    if (holds.length) items.push({ title: "Compliance holds", count: holds.length, tone: "danger", rows: holds });
    return items;
  }, [filtered]);

  /* ---- AI Insights ---- */
  const insights = useMemo(() => {
    if (!generated) return [];
    const out: string[] = [];
    out.push(`${agg.total} employee${agg.total === 1 ? "" : "s"} currently in scope.`);
    out.push(`Compliance readiness is ${fmtPct(agg.readiness)} (${agg.fullyCompliant} fully compliant).`);
    if (agg.expiring) out.push(`${agg.expiring} certification${agg.expiring === 1 ? "" : "s"} expiring within 30 days.`);
    if (agg.expired) out.push(`${agg.expired} certification${agg.expired === 1 ? " is" : "s are"} already expired.`);
    if (agg.missingDocsEmps) out.push(`${agg.missingDocsEmps} employee${agg.missingDocsEmps === 1 ? " has" : "s have"} missing documentation.`);
    if (agg.missingTrainingEmps) out.push(`${agg.missingTrainingEmps} employee${agg.missingTrainingEmps === 1 ? " is" : "s are"} missing required training.`);
    if (agg.bgIssues) out.push(`${agg.bgIssues} background check${agg.bgIssues === 1 ? "" : "s"} require${agg.bgIssues === 1 ? "s" : ""} attention.`);
    if (agg.holds) out.push(`${agg.holds} employee${agg.holds === 1 ? " is" : "s are"} currently on compliance hold.`);
    // top state
    const m = new Map<string, { tot: number; ok: number }>();
    for (const e of filtered) {
      const k = e.state || "Unknown";
      const cur = m.get(k) || { tot: 0, ok: 0 };
      cur.tot++;
      if (e.status === "Fully Compliant") cur.ok++;
      m.set(k, cur);
    }
    const ranked = [...m.entries()].filter(([, v]) => v.tot >= 3)
      .map(([k, v]) => [k, v.ok / v.tot] as [string, number]).sort((a, b) => b[1] - a[1]);
    if (ranked.length) out.push(`${ranked[0][0]} currently has the highest compliance score (${fmtPct(ranked[0][1])}).`);
    if (ranked.length > 1) out.push(`${ranked[ranked.length - 1][0]} has the lowest compliance score (${fmtPct(ranked[ranked.length - 1][1])}).`);
    return out;
  }, [generated, filtered, agg]);

  /* ---- Exports ---- */
  function exportAudit() {
    downloadCsv("compliance-audit.csv",
      ["Employee", "ID", "Role", "Department", "State", "Manager", "Status", "Open Issues", "Next Expiration", "Days"],
      filtered.map(e => [e.name, e.id, e.role, e.department, e.state, e.manager, e.status, e.openIssues.join("; "), e.nextExpirationDate, e.nextExpirationDays]));
    toast.success("Audit report exported");
  }
  function exportCerts() {
    downloadCsv("certifications.csv",
      ["Employee", "Role", "State", "Cert", "Number", "Issued", "Expires", "Days", "Status", "Renewal Submitted"],
      filtered.flatMap(e => e.certs.map(c => [e.name, e.role, e.state, c.type, c.number, c.issued, c.expires, c.daysToExpire, c.status, c.renewalSubmitted ? "Yes" : "No"])));
    toast.success("Certification report exported");
  }
  function exportTraining() {
    downloadCsv("training-compliance.csv",
      ["Employee", "Role", "State", "Assigned", "Complete", "Outstanding", "Completion %", "Due Date", "Days Overdue"],
      filtered.map(e => [e.name, e.role, e.state, e.trainingTotal, e.trainingComplete,
        Math.max(0, e.trainingTotal - e.trainingComplete),
        e.trainingTotal > 0 ? fmtPct(e.trainingComplete / e.trainingTotal) : "—",
        e.trainingDueDate, e.trainingDaysOverdue]));
    toast.success("Training report exported");
  }
  function exportMissingDocs() {
    downloadCsv("missing-documentation.csv",
      ["Employee", "Role", "State", "Manager", "Missing Documents"],
      filtered.filter(e => e.missingDocs.length).map(e => [e.name, e.role, e.state, e.manager, e.missingDocs.join(", ")]));
    toast.success("Missing documentation exported");
  }
  function exportRisks() {
    downloadCsv("compliance-risks.csv",
      ["Employee", "Role", "State", "Status", "Open Issues"],
      filtered.filter(e => e.status === "High Risk" || e.status === "Compliance Hold").map(e => [e.name, e.role, e.state, e.status, e.openIssues.join("; ")]));
    toast.success("Compliance risks exported");
  }
  function copyComplianceSummary() {
    const lines = [
      `Employee Compliance Dashboard — ${files.map(f => f.name).join(", ")}`,
      `Employees: ${agg.total} · Fully compliant: ${agg.fullyCompliant} (${fmtPct(agg.readiness)})`,
      `Critical risks: ${agg.critical} · Holds: ${agg.holds}`,
      `Expiring (≤30d): ${agg.expiring} · Expired: ${agg.expired}`,
      `Missing docs: ${agg.missingDocsEmps} · Missing training: ${agg.missingTrainingEmps}`,
      `Background issues: ${agg.bgIssues}`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Compliance summary copied");
  }
  function saveSnapshot() {
    try {
      const key = "blossom.os.hr.compliance.snapshots.v1";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.push({
        id: crypto.randomUUID(), savedAt: new Date().toISOString(),
        files: files.map(f => f.name),
        filters: { statusFilter, stateFilter, roleFilter, deptFilter, managerFilter },
        kpis: {
          total: agg.total, fullyCompliant: agg.fullyCompliant, critical: agg.critical,
          expiring: agg.expiring, expired: agg.expired, readiness: agg.readiness, holds: agg.holds,
        },
      });
      localStorage.setItem(key, JSON.stringify(list));
      toast.success("Snapshot saved");
    } catch { toast.error("Could not save snapshot"); }
  }

  /* ---- Expiration buckets table ---- */
  const expirationBuckets = useMemo(() => {
    const buckets: { label: string; tone: "danger" | "warn" | "default"; rows: { emp: EmployeeRow; cert: CertRow }[] }[] = [
      { label: "Expired", tone: "danger", rows: [] },
      { label: "0-30 days", tone: "danger", rows: [] },
      { label: "31-60 days", tone: "warn", rows: [] },
      { label: "61-90 days", tone: "warn", rows: [] },
      { label: "90+ days", tone: "default", rows: [] },
    ];
    for (const e of filtered) {
      for (const c of e.certs) {
        if (c.daysToExpire < 0) buckets[0].rows.push({ emp: e, cert: c });
        else if (c.daysToExpire <= 30) buckets[1].rows.push({ emp: e, cert: c });
        else if (c.daysToExpire <= 60) buckets[2].rows.push({ emp: e, cert: c });
        else if (c.daysToExpire <= 90) buckets[3].rows.push({ emp: e, cert: c });
        else buckets[4].rows.push({ emp: e, cert: c });
      }
    }
    return buckets;
  }, [filtered]);

  /* ===================== RENDER ===================== */

  return (
    <OSShell>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/reports" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition hover:-translate-y-0.5 hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <div>
            <Badge variant="secondary" className="rounded-full bg-[hsl(265_100%_97%)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(265_70%_55%)]">
              HR · Featured Dashboard
            </Badge>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight">Employee Compliance Dashboard</h1>
            <p className="text-[12.5px] text-muted-foreground">
              Certifications, trainings, onboarding, documentation, background checks and workforce readiness across every state.
            </p>
          </div>
        </div>
        <ReportAIButton preset="hr-compliance" />
      </div>

      {/* Upload */}
      <section className="mt-6 rounded-3xl border border-border/60 bg-card p-6 shadow-[0_20px_50px_-30px_hsl(265_60%_50%/0.25)]">
        {files.length === 0 ? (
          <UploadDropzone inputRef={inputRef} dragOver={dragOver} setDragOver={setDragOver} onFiles={handleFiles} loading={loading} />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {files.map(f => (
                  <span key={f.name} className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 px-3 py-1.5 text-[11.5px]">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
                    <span className="font-medium">{f.name}</span>
                    <Badge variant="secondary" className="rounded-full bg-card text-[10px]">{f.kind} · {f.rows}</Badge>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                  <Upload className="mr-1 h-3.5 w-3.5" /> Add file
                </Button>
                <Button variant="ghost" size="sm" onClick={resetUpload}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear all
                </Button>
                <input ref={inputRef} type="file" multiple className="hidden" accept={SUPPORTED_EXTENSIONS} onChange={(e) => handleFiles(e.target.files)} />
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
                    <p className="font-semibold">Unable to generate. Missing: {missingFields.join(", ")}.</p>
                    <p className="mt-1 text-rose-600/80">Upload an employee master list, Viventium export, Monday Employee Board, or compliance tracking sheet.</p>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => { setGenerated(true); toast.success("Compliance dashboard generated"); }}
                className="h-9 rounded-full bg-[hsl(265_70%_55%)] px-5 text-[12.5px] font-semibold text-white hover:bg-[hsl(265_70%_50%)]"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Generate Compliance Dashboard
              </Button>
            )}
          </div>
        )}
      </section>

      {generated && filtered.length > 0 && (
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
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(265_70%_55%)]">Operational Insights</p>
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
                <Button variant="outline" size="sm" onClick={exportAudit}><Download className="mr-1 h-3.5 w-3.5" />Audit Report</Button>
                <Button variant="outline" size="sm" onClick={exportCerts}><Download className="mr-1 h-3.5 w-3.5" />Certifications</Button>
                <Button variant="outline" size="sm" onClick={exportTraining}><Download className="mr-1 h-3.5 w-3.5" />Training</Button>
                <Button variant="outline" size="sm" onClick={exportMissingDocs}><Download className="mr-1 h-3.5 w-3.5" />Missing Docs</Button>
                <Button variant="outline" size="sm" onClick={exportRisks}><Download className="mr-1 h-3.5 w-3.5" />Risks</Button>
                <Button variant="outline" size="sm" onClick={copyComplianceSummary}><ShieldCheck className="mr-1 h-3.5 w-3.5" />Copy Summary</Button>
                <Button variant="outline" size="sm" onClick={saveSnapshot} className="col-span-2"><Sparkles className="mr-1 h-3.5 w-3.5" />Save Snapshot</Button>
              </div>
            </div>
          </section>

          {/* Charts */}
          {charts.length > 0 && (
            <section className="mt-6 grid gap-4 lg:grid-cols-2">
              {charts.map(c => <ChartCard key={c.id} chart={c} />)}
            </section>
          )}

          {/* Alerts */}
          {alerts.length > 0 && (
            <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {alerts.map((a, i) => (
                <button key={i} onClick={() => a.rows.length && setDrill({ title: a.title, columns: EMP_COLS, rows: a.rows.map(empRow) })}
                  className={cn("rounded-2xl border bg-card p-4 text-left transition hover:-translate-y-0.5",
                    a.tone === "danger" ? "border-rose-200/70 hover:shadow-[0_12px_28px_-18px_hsl(0_70%_50%/0.4)]" : "border-amber-200/70 hover:shadow-[0_12px_28px_-18px_hsl(40_80%_50%/0.4)]")}>
                  <div className="flex items-center gap-2">
                    <ShieldAlert className={cn("h-3.5 w-3.5", a.tone === "danger" ? "text-rose-600" : "text-amber-600")} />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Alert</p>
                  </div>
                  <p className="mt-2 text-[13px] font-medium tracking-tight">{a.title}</p>
                  <p className="mt-1 text-[22px] font-semibold tabular-nums">{a.count}</p>
                </button>
              ))}
            </section>
          )}

          {/* Expiration Tracker */}
          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="text-[16px] font-semibold tracking-tight">Expiration Tracker</h2>
            <p className="text-[11.5px] text-muted-foreground">Click a bucket to view affected certifications.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {expirationBuckets.map(b => (
                <button key={b.label} onClick={() => setDrill({
                  title: `Certifications · ${b.label}`,
                  columns: ["Employee", "Cert", "State", "Manager", "Expires", "Days"],
                  rows: b.rows.map(({ emp, cert }) => [emp.name, cert.type, emp.state || "—", emp.manager || "—", cert.expires, cert.daysToExpire]),
                })} className={cn(
                  "rounded-xl border bg-card p-4 text-left transition hover:-translate-y-0.5",
                  b.tone === "danger" ? "border-rose-200/70" : b.tone === "warn" ? "border-amber-200/70" : "border-border/60",
                )}>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{b.label}</p>
                  <p className="mt-2 text-[24px] font-semibold tabular-nums">{b.rows.length}</p>
                  <p className="mt-1 text-[10.5px] text-muted-foreground">certification{b.rows.length === 1 ? "" : "s"}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Employee table */}
          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-semibold tracking-tight">Employee Compliance</h2>
                <p className="text-[11.5px] text-muted-foreground">{filtered.length} of {employees.length} employees</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, role…" className="h-8 w-[220px] pl-8 text-[12px]" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-[170px] text-[12px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {STATUS_ORDER.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                  <Select value={managerFilter} onValueChange={setManagerFilter}>
                    <SelectTrigger className="h-8 w-[140px] text-[12px]"><SelectValue placeholder="Manager" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All managers</SelectItem>
                      {managers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1200px] text-[12.5px]">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-2 py-2">Employee</th>
                    <th className="px-2 py-2">Role</th>
                    <th className="px-2 py-2">Dept</th>
                    <th className="px-2 py-2">State</th>
                    <th className="px-2 py-2">Manager</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2 text-right">Docs Missing</th>
                    <th className="px-2 py-2 text-right">Training</th>
                    <th className="px-2 py-2">Background</th>
                    <th className="px-2 py-2">Next Expiration</th>
                    <th className="px-2 py-2 text-right">Open Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 400).map(e => (
                    <tr key={e.id + e.name} onClick={() => setEmpDrill(e)}
                        className="cursor-pointer border-b border-border/40 transition hover:bg-secondary/40">
                      <td className="px-2 py-2"><div className="font-medium">{e.name}</div><div className="text-[10.5px] text-muted-foreground">{e.id}</div></td>
                      <td className="px-2 py-2 text-muted-foreground">{e.role || "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{e.department || "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{e.state || "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{e.manager || "—"}</td>
                      <td className="px-2 py-2"><StatusBadge tone={STATUS_TONE[e.status]}>{e.status}</StatusBadge></td>
                      <td className="px-2 py-2 text-right tabular-nums">{e.missingDocs.length || "—"}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{e.trainingTotal > 0 ? `${e.trainingComplete}/${e.trainingTotal}` : "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{e.backgroundStatus || (e.bgFlagged ? "Flagged" : "—")}</td>
                      <td className="px-2 py-2 text-muted-foreground">{e.nextExpirationDate ? `${e.nextExpirationDate} (${e.nextExpirationDays}d)` : "—"}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{e.openIssues.length || "—"}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={11} className="px-2 py-8 text-center text-[12px] text-muted-foreground">No employees match the current filters.</td></tr>
                  )}
                </tbody>
              </table>
              {filtered.length > 400 && (
                <p className="mt-2 text-[11px] text-muted-foreground">Showing first 400 of {filtered.length}. Export for the full list.</p>
              )}
            </div>
          </section>

          {/* State + Role compliance grid */}
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <CompCard
              title="State Compliance"
              rows={(() => {
                const m = new Map<string, { total: number; ok: number; risk: number; expiring: number }>();
                for (const e of filtered) {
                  const k = e.state || "Unknown";
                  const cur = m.get(k) || { total: 0, ok: 0, risk: 0, expiring: 0 };
                  cur.total++;
                  if (e.status === "Fully Compliant") cur.ok++;
                  if (e.status === "High Risk" || e.status === "Compliance Hold") cur.risk++;
                  cur.expiring += e.certs.filter(c => c.status === "Expiring Soon").length;
                  m.set(k, cur);
                }
                return [...m.entries()].sort((a, b) => b[1].total - a[1].total);
              })()}
              onClick={(label) => setDrill({ title: `${label} · employees`, columns: EMP_COLS, rows: filtered.filter(e => (e.state || "Unknown") === label).map(empRow) })}
            />
            <CompCard
              title="Role Compliance"
              rows={(() => {
                const m = new Map<string, { total: number; ok: number; risk: number; expiring: number }>();
                for (const e of filtered) {
                  const k = e.role || "Unknown";
                  const cur = m.get(k) || { total: 0, ok: 0, risk: 0, expiring: 0 };
                  cur.total++;
                  if (e.status === "Fully Compliant") cur.ok++;
                  if (e.status === "High Risk" || e.status === "Compliance Hold") cur.risk++;
                  cur.expiring += e.certs.filter(c => c.status === "Expiring Soon").length;
                  m.set(k, cur);
                }
                return [...m.entries()].sort((a, b) => b[1].total - a[1].total);
              })()}
              onClick={(label) => setDrill({ title: `${label} · employees`, columns: EMP_COLS, rows: filtered.filter(e => (e.role || "Unknown") === label).map(empRow) })}
            />
          </section>
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

      {/* Employee drilldown */}
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
                <Info label="Hire Date" value={empDrill.hireDate || "—"} />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Compliance</p>
                <div className="mt-2"><StatusBadge tone={STATUS_TONE[empDrill.status]}>{empDrill.status}</StatusBadge></div>
                {empDrill.openIssues.length > 0 && (
                  <ul className="mt-3 space-y-1 text-[12.5px]">
                    {empDrill.openIssues.map((i, idx) => (
                      <li key={idx} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" /><span>{i}</span></li>
                    ))}
                  </ul>
                )}
              </div>

              {empDrill.certs.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Certifications</p>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-border/60 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                          <th className="px-2 py-1.5">Cert</th>
                          <th className="px-2 py-1.5">Number</th>
                          <th className="px-2 py-1.5">Expires</th>
                          <th className="px-2 py-1.5 text-right">Days</th>
                          <th className="px-2 py-1.5">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empDrill.certs.map((c, i) => (
                          <tr key={i} className="border-b border-border/30">
                            <td className="px-2 py-1.5">{c.type}</td>
                            <td className="px-2 py-1.5 text-muted-foreground">{c.number || "—"}</td>
                            <td className="px-2 py-1.5">{c.expires}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{c.daysToExpire}</td>
                            <td className="px-2 py-1.5"><StatusBadge tone={c.status === "Valid" ? "success" : c.status === "Expired" || c.status === "Compliance Hold" ? "danger" : "warn"}>{c.status}</StatusBadge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Documentation</p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Info label="I9" value={empDrill.i9Ok ? "On file" : "Missing"} />
                  <Info label="W4" value={empDrill.w4Ok ? "On file" : "Missing"} />
                  <Info label="Payroll Forms" value={empDrill.payrollDocsOk ? "On file" : "Missing"} />
                  <Info label="Orientation" value={empDrill.orientationComplete ? "Complete" : "Incomplete"} />
                  <Info label="Background" value={empDrill.backgroundStatus || (empDrill.bgFlagged ? "Flagged" : "—")} />
                  <Info label="Training" value={empDrill.trainingTotal > 0 ? `${empDrill.trainingComplete}/${empDrill.trainingTotal}` : "—"} />
                </div>
                {empDrill.missingDocs.length > 0 && (
                  <p className="mt-2 text-[12px] text-rose-700">Missing: {empDrill.missingDocs.join(", ")}</p>
                )}
              </div>

              {empDrill.notes && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Notes</p>
                  <p className="mt-2 whitespace-pre-wrap text-[12.5px]">{empDrill.notes}</p>
                </div>
              )}
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
        <p className="text-[14px] font-semibold">Upload compliance exports</p>
        <p className="mt-1 text-[11.5px] text-muted-foreground">CSV or XLSX · Employee Master, Viventium, Monday Employee Board, Certification Tracker, Training Academy, I9, Background Checks · multiple files supported</p>
      </div>
      <Button size="sm" onClick={() => inputRef.current?.click()} disabled={loading}
        className="rounded-full bg-[hsl(265_70%_55%)] hover:bg-[hsl(265_70%_50%)]">
        {loading ? "Parsing…" : "Choose files"}
      </Button>
      <input ref={inputRef} type="file" multiple className="hidden" accept={SUPPORTED_EXTENSIONS} onChange={(e) => onFiles(e.target.files)} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-secondary/30 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[13px] font-medium tabular-nums">{value}</p>
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

function CompCard({ title, rows, onClick }: {
  title: string;
  rows: [string, { total: number; ok: number; risk: number; expiring: number }][];
  onClick: (label: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <h2 className="text-[16px] font-semibold tracking-tight">{title}</h2>
      <p className="text-[11.5px] text-muted-foreground">Click a row to drill into employees.</p>
      <div className="mt-4 space-y-2">
        {rows.map(([label, v]) => {
          const pct = v.total > 0 ? v.ok / v.total : 0;
          return (
            <button key={label} onClick={() => onClick(label)}
              className="w-full rounded-xl border border-border/50 p-3 text-left transition hover:-translate-y-0.5 hover:border-[hsl(265_70%_55%/0.6)]">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="font-medium">{label}</span>
                <div className="flex items-center gap-4 text-[11.5px] text-muted-foreground">
                  <span className="tabular-nums text-foreground font-semibold">{v.total}</span>
                  <span>OK {v.ok}</span>
                  <span className="text-rose-600">Risk {v.risk}</span>
                  <span className="text-amber-600">Exp {v.expiring}</span>
                  <span className="tabular-nums">{fmtPct(pct)}</span>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-[hsl(265_70%_55%)]" style={{ width: `${Math.min(100, pct * 100)}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}