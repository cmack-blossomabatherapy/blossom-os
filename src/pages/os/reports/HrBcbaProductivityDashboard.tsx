import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Upload, FileSpreadsheet, Sparkles, Download, Search,
  AlertTriangle, CheckCircle2, Brain, Trash2, Award, TrendingUp,
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
import { SourceCoverageBanner } from "@/components/reports/SourceCoverageBanner";

/* ============================================================
 * HR · BCBA Productivity & Minimum Hours Dashboard
 * Upload billing / service / payroll / caseload exports and
 * instantly see BCBA productivity, minimum hours compliance,
 * supervision (97155), parent training (97156), earnings,
 * caseload, payroll risk, state comparison and trends.
 * ============================================================ */

type MinimumStatus = "Meets Minimum" | "At Risk" | "Below Minimum" | "Exceeds Minimum" | "Missing Data";
type PayrollStatus = "Ready" | "Review Needed" | "Risk";

const MIN_TONE: Record<MinimumStatus, "success" | "warn" | "danger" | "info" | "default"> = {
  "Meets Minimum": "success",
  "At Risk": "warn",
  "Below Minimum": "danger",
  "Exceeds Minimum": "info",
  "Missing Data": "default",
};
const PAY_TONE: Record<PayrollStatus, "success" | "warn" | "danger"> = {
  Ready: "success",
  "Review Needed": "warn",
  Risk: "danger",
};

interface BcbaRow {
  id: string;
  name: string;
  role: string;
  state: string;
  manager: string;
  caseload: number;
  requiredHours: number;
  workedHours: number;
  billableHours: number;
  h97153: number;
  h97155: number;
  h97156: number;
  rate: number;
  earnings: number;
  clientsSupervised: number;
  clientsParentTraining: number;
  documentationPct: number;
  attendancePct: number;
  payrollStatusRaw: string;
  bonusEligibleRaw: boolean | null;
  raw: Record<string, string>;
  // computed
  projectedHours: number;
  diffFromMin: number;
  minStatus: MinimumStatus;
  payrollStatus: PayrollStatus;
  bonusEligible: boolean;
  bonusAmount: number;
  productivityScore: number;
  supervisionPct: number;
  parentTrainingPct: number;
  risks: string[];
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
  const n = parseFloat(String(v).replace(/[$,%]/g, ""));
  return isFinite(n) ? n : 0;
}
function pct(v: string | undefined | null): number {
  if (!v) return 0;
  const s = String(v);
  const n = parseFloat(s.replace(/[%,]/g, ""));
  if (!isFinite(n)) return 0;
  return s.includes("%") || n > 1 ? n / 100 : n;
}
function boolish(v: string | undefined | null): boolean | null {
  if (v === undefined || v === null || v === "") return null;
  const s = String(v).trim().toLowerCase();
  if (["y", "yes", "true", "1", "eligible"].includes(s)) return true;
  if (["n", "no", "false", "0", "ineligible"].includes(s)) return false;
  return null;
}
function fmtPct(n: number) { return isFinite(n) ? `${(n * 100).toFixed(1)}%` : "—"; }
function fmtNum(n: number, d = 1) { return isFinite(n) ? n.toFixed(d) : "—"; }
function fmtMoney(n: number) { return isFinite(n) ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"; }
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

const DEFAULT_BCBA_MIN = 100; // monthly billable baseline

function isBcbaRole(role: string) {
  const r = (role || "").toLowerCase();
  return r.includes("bcba") || r.includes("board certified") || r.includes("clinical supervisor")
    || r.includes("senior bcba") || r.includes("lead bcba");
}

/* ===================== PAGE ===================== */

export default function HrBcbaProductivityDashboard() {
  const [fileName, setFileName] = useState("");
  const [bcbas, setBcbas] = useState<BcbaRow[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

  // Period & threshold
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [periodElapsedPct, setPeriodElapsedPct] = useState<number>(0.65);
  const [minHours, setMinHours] = useState<number>(DEFAULT_BCBA_MIN);
  const [bonusThreshold, setBonusThreshold] = useState<number>(120);
  const [bonusAmount, setBonusAmount] = useState<number>(500);
  const [includeNonBcba, setIncludeNonBcba] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [mgrFilter, setMgrFilter] = useState("all");
  const [payFilter, setPayFilter] = useState("all");
  const [bonusFilter, setBonusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"score" | "min" | "hours" | "earnings" | "caseload">("score");

  const [drill, setDrill] = useState<DrilldownSpec | null>(null);
  const [empDrill, setEmpDrill] = useState<BcbaRow | null>(null);
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

      const nameH = findHeader(headers, ["BCBAName", "BCBA Name", "EmployeeName", "Employee Name", "ProviderName", "Provider Name", "StaffName", "FullName", "Name"]);
      const fnH = findHeader(headers, ["FirstName", "First Name"]);
      const lnH = findHeader(headers, ["LastName", "Last Name"]);
      const idH = findHeader(headers, ["EmployeeId", "Employee Id", "Employee ID", "ProviderId", "BCBAId", "StaffId"]);
      const roleH = findHeader(headers, ["Role", "JobTitle", "Job Title", "Position", "Title", "Credential"]);
      const stateH = findHeader(headers, ["State", "WorkState", "Work State", "Location", "Region"]);
      const mgrH = findHeader(headers, ["Manager", "Supervisor", "DirectManager", "ReportsTo", "StateDirector"]);
      const reqH = findHeader(headers, ["RequiredHours", "Required Hours", "MinimumHours", "Minimum Hours", "MinHours", "Target Hours"]);
      const workedH = findHeader(headers, ["WorkedHours", "Worked Hours", "ApprovedHours", "Approved Hours", "ActualHours"]);
      const billableH = findHeader(headers, ["BillableHours", "Billable Hours", "Hours"]);
      const h97153H = findHeader(headers, ["97153", "97153Hours", "97153 Hours"]);
      const h97155H = findHeader(headers, ["97155", "97155Hours", "97155 Hours", "SupervisionHours", "Supervision Hours"]);
      const h97156H = findHeader(headers, ["97156", "97156Hours", "97156 Hours", "ParentTrainingHours", "Parent Training Hours"]);
      const caseloadH = findHeader(headers, ["Caseload", "CaseloadSize", "Caseload Size", "ActiveClients", "Active Clients", "Clients"]);
      const supClientsH = findHeader(headers, ["ClientsSupervised", "Clients Supervised", "SupervisedClients"]);
      const ptClientsH = findHeader(headers, ["ClientsParentTraining", "Clients Parent Training", "ParentTrainingClients"]);
      const docH = findHeader(headers, ["DocumentationPct", "Documentation %", "Documentation", "DocCompletion"]);
      const attH = findHeader(headers, ["AttendancePct", "Attendance %", "Attendance"]);
      const rateH = findHeader(headers, ["Rate", "HourlyRate", "Hourly Rate", "PayRate", "Pay Rate"]);
      const earnH = findHeader(headers, ["Earnings", "GrossPay", "Gross Pay", "Pay", "EstimatedEarnings"]);
      const payStatusH = findHeader(headers, ["PayrollStatus", "Payroll Status"]);
      const bonusH = findHeader(headers, ["BonusEligible", "Bonus Eligible", "Bonus"]);

      const missing: string[] = [];
      if (!nameH && !(fnH && lnH)) missing.push("BCBA / Employee Name (or FirstName + LastName)");
      if (!workedH && !billableH && !h97153H && !h97155H && !h97156H)
        missing.push("At least one hours field (Worked / Billable / 97153 / 97155 / 97156)");

      const warns: string[] = [];
      if (!roleH) warns.push("Role / Job Title not detected — BCBA identification will rely on all rows or the manual toggle.");
      if (!stateH) warns.push("State not detected — state comparison will be empty.");
      if (!rateH && !earnH) warns.push("Rate / Earnings not detected — earnings dashboard will be limited.");
      if (!h97155H) warns.push("97155 column not detected — supervision activity will be limited.");
      if (!h97156H) warns.push("97156 column not detected — parent training activity will be limited.");
      if (!caseloadH) warns.push("Caseload column not detected — caseload analytics will be limited.");

      if (missing.length) {
        setMissingFields(missing); setWarnings(warns); setBcbas([]); setGenerated(false); setFileName(file.name);
        return;
      }
      setMissingFields([]); setWarnings(warns);

      // Aggregate rows per employee
      const map = new Map<string, BcbaRow>();
      for (const r of first.rows) {
        const name = nameH ? r[nameH] : `${fnH ? r[fnH] : ""} ${lnH ? r[lnH] : ""}`.trim();
        if (!name) continue;
        const id = idH ? r[idH] : name;
        const key = id || name;
        const role = roleH ? r[roleH] : "";
        const existing = map.get(key);
        const row: BcbaRow = existing ?? {
          id, name, role,
          state: stateH ? r[stateH] : "",
          manager: mgrH ? r[mgrH] : "",
          caseload: caseloadH ? num(r[caseloadH]) : 0,
          requiredHours: reqH ? num(r[reqH]) : 0,
          workedHours: 0,
          billableHours: 0,
          h97153: 0, h97155: 0, h97156: 0,
          rate: rateH ? num(r[rateH]) : 0,
          earnings: 0,
          clientsSupervised: supClientsH ? num(r[supClientsH]) : 0,
          clientsParentTraining: ptClientsH ? num(r[ptClientsH]) : 0,
          documentationPct: docH ? pct(r[docH]) : 0,
          attendancePct: attH ? pct(r[attH]) : 0,
          payrollStatusRaw: payStatusH ? r[payStatusH] : "",
          bonusEligibleRaw: bonusH ? boolish(r[bonusH]) : null,
          raw: r,
          projectedHours: 0, diffFromMin: 0,
          minStatus: "Missing Data", payrollStatus: "Ready",
          bonusEligible: false, bonusAmount: 0,
          productivityScore: 0, supervisionPct: 0, parentTrainingPct: 0,
          risks: [],
        };
        if (workedH) row.workedHours += num(r[workedH]);
        if (billableH) row.billableHours += num(r[billableH]);
        if (h97153H) row.h97153 += num(r[h97153H]);
        if (h97155H) row.h97155 += num(r[h97155H]);
        if (h97156H) row.h97156 += num(r[h97156H]);
        if (earnH) row.earnings += num(r[earnH]);
        map.set(key, row);
      }

      const out = [...map.values()].map(e => {
        if (e.billableHours === 0 && e.workedHours > 0) e.billableHours = e.workedHours;
        if (e.workedHours === 0 && e.billableHours > 0) e.workedHours = e.billableHours;
        if (e.workedHours === 0) e.workedHours = e.h97153 + e.h97155 + e.h97156;
        if (e.earnings === 0 && e.rate > 0) e.earnings = e.rate * e.workedHours;
        return e;
      });

      setBcbas(out);
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
    setFileName(""); setBcbas([]); setMissingFields([]); setWarnings([]); setGenerated(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  /* ---- Compute productivity, min status, risks ---- */
  const computed = useMemo<BcbaRow[]>(() => {
    const pool = bcbas.filter(b => includeNonBcba || !b.role || isBcbaRole(b.role));
    return pool.map(e => {
      const required = e.requiredHours > 0 ? e.requiredHours : minHours;
      const elapsed = Math.max(0.05, Math.min(1, periodElapsedPct));
      const projected = elapsed > 0 ? e.workedHours / elapsed : e.workedHours;
      const diff = e.workedHours - required;
      let minStatus: MinimumStatus = "Missing Data";
      if (e.workedHours > 0 || required > 0) {
        const pace = required > 0 ? e.workedHours / required : 0;
        const projPace = required > 0 ? projected / required : 0;
        if (e.workedHours >= required * 1.15) minStatus = "Exceeds Minimum";
        else if (e.workedHours >= required) minStatus = "Meets Minimum";
        else if (projPace >= 0.95) minStatus = "At Risk";
        else minStatus = "Below Minimum";
      }

      const supervisionPct = e.caseload > 0 ? e.clientsSupervised / e.caseload :
        (e.h97155 > 0 && e.h97153 > 0 ? e.h97155 / (e.h97153 || 1) : 0);
      const parentTrainingPct = e.caseload > 0 ? e.clientsParentTraining / e.caseload : 0;

      const risks: string[] = [];
      if (minStatus === "Below Minimum") risks.push("Below minimum hours");
      if (minStatus === "At Risk") risks.push("Projected below minimum");
      if (e.h97155 === 0 && e.caseload > 0) risks.push("No supervision (97155) activity");
      if (e.h97156 === 0 && e.caseload > 0) risks.push("No parent training (97156) activity");
      if (e.workedHours === 0) risks.push("No hours logged");
      if (e.rate === 0 && e.earnings === 0) risks.push("Missing pay rate");
      if (!e.state) risks.push("Missing state");

      const payrollStatus: PayrollStatus =
        e.payrollStatusRaw && /risk|hold/i.test(e.payrollStatusRaw) ? "Risk" :
        e.payrollStatusRaw && /review|pending/i.test(e.payrollStatusRaw) ? "Review Needed" :
        risks.some(r => /missing pay rate|no hours/i.test(r)) ? "Risk" :
        risks.length > 0 ? "Review Needed" : "Ready";

      const bonusEligible = e.bonusEligibleRaw !== null ? e.bonusEligibleRaw : e.workedHours >= bonusThreshold;
      const bonusAmt = bonusEligible ? bonusAmount : 0;

      // Productivity score 0-100
      const hoursScore = required > 0 ? Math.min(100, (e.workedHours / required) * 60) : 30;
      const supScore = supervisionPct * 100 * 0.15;
      const ptScore = parentTrainingPct * 100 * 0.10;
      const docScore = (e.documentationPct || 0.85) * 100 * 0.075;
      const attScore = (e.attendancePct || 0.9) * 100 * 0.075;
      const productivityScore = Math.max(0, Math.min(100, Math.round(hoursScore + supScore + ptScore + docScore + attScore)));

      return {
        ...e,
        projectedHours: projected,
        diffFromMin: diff,
        minStatus, payrollStatus,
        bonusEligible, bonusAmount: bonusAmt,
        productivityScore, supervisionPct, parentTrainingPct,
        risks,
      };
    });
  }, [bcbas, includeNonBcba, minHours, periodElapsedPct, bonusThreshold, bonusAmount]);

  /* ---- Aggregations ---- */
  const states = useMemo(() => [...new Set(computed.map(b => b.state).filter(Boolean))].sort(), [computed]);
  const managers = useMemo(() => [...new Set(computed.map(b => b.manager).filter(Boolean))].sort(), [computed]);

  const totals = useMemo(() => {
    const c = computed;
    const n = c.length;
    const meeting = c.filter(b => b.minStatus === "Meets Minimum" || b.minStatus === "Exceeds Minimum").length;
    const below = c.filter(b => b.minStatus === "Below Minimum").length;
    const atRisk = c.filter(b => b.minStatus === "At Risk").length;
    const exceeds = c.filter(b => b.minStatus === "Exceeds Minimum").length;
    const avgHours = n ? c.reduce((s, b) => s + b.workedHours, 0) / n : 0;
    const avgWeekly = avgHours / 4.33;
    const totalBillable = c.reduce((s, b) => s + b.billableHours, 0);
    const total97155 = c.reduce((s, b) => s + b.h97155, 0);
    const total97156 = c.reduce((s, b) => s + b.h97156, 0);
    const avgCaseload = n ? c.reduce((s, b) => s + b.caseload, 0) / n : 0;
    const projectedMeeting = c.filter(b => b.projectedHours >= (b.requiredHours > 0 ? b.requiredHours : minHours)).length;
    const projectedPct = n ? projectedMeeting / n : 0;
    const payrollRisk = c.filter(b => b.payrollStatus === "Risk").length;
    const bonusEligible = c.filter(b => b.bonusEligible).length;
    const avgScore = n ? c.reduce((s, b) => s + b.productivityScore, 0) / n : 0;
    return { n, meeting, below, atRisk, exceeds, avgHours, avgWeekly, totalBillable, total97155, total97156, avgCaseload, projectedPct, payrollRisk, bonusEligible, avgScore };
  }, [computed, minHours]);

  /* ---- KPIs ---- */
  function tableDrill(title: string, columns: string[], rows: (string | number)[][], emptyMessage?: string): DrilldownSpec {
    return { title, columns, rows, emptyMessage };
  }

  const kpis: KpiSpec[] = useMemo(() => {
    const c = computed;
    const baseCols = ["BCBA", "State", "Worked", "Required", "Δ", "Status"];
    const baseRows = (rows: BcbaRow[]) => rows.map(b => [b.name, b.state || "—", fmtNum(b.workedHours), fmtNum(b.requiredHours || minHours), fmtNum(b.diffFromMin), b.minStatus]);
    return [
      { id: "total", label: "Total Active BCBAs", value: c.length.toLocaleString(), raw: c.length, tone: "default",
        drilldown: tableDrill("All BCBAs", baseCols, baseRows(c)) },
      { id: "meeting", label: "Meeting Minimum", value: totals.meeting.toLocaleString(), raw: totals.meeting, tone: "success",
        drilldown: tableDrill("BCBAs meeting minimum", baseCols, baseRows(c.filter(b => b.minStatus === "Meets Minimum" || b.minStatus === "Exceeds Minimum"))) },
      { id: "below", label: "Below Minimum", value: totals.below.toLocaleString(), raw: totals.below, tone: "danger",
        drilldown: tableDrill("BCBAs below minimum", baseCols, baseRows(c.filter(b => b.minStatus === "Below Minimum"))) },
      { id: "atrisk", label: "At Risk", value: totals.atRisk.toLocaleString(), raw: totals.atRisk, tone: "warn",
        drilldown: tableDrill("BCBAs at risk", baseCols, baseRows(c.filter(b => b.minStatus === "At Risk"))) },
      { id: "avgHours", label: "Avg BCBA Hours", value: fmtNum(totals.avgHours), raw: totals.avgHours, tone: "default" },
      { id: "avgWeekly", label: "Avg Weekly Hours", value: fmtNum(totals.avgWeekly), raw: totals.avgWeekly, tone: "default" },
      { id: "billable", label: "Total Billable Hours", value: fmtNum(totals.totalBillable, 0), raw: totals.totalBillable, tone: "default" },
      { id: "h155", label: "Total 97155 Hours", value: fmtNum(totals.total97155, 0), raw: totals.total97155, tone: "default",
        drilldown: tableDrill("97155 by BCBA", ["BCBA", "State", "97155 hrs", "Clients Supervised"], c.filter(b => b.h97155 > 0).map(b => [b.name, b.state || "—", fmtNum(b.h97155), b.clientsSupervised])) },
      { id: "h156", label: "Total 97156 Hours", value: fmtNum(totals.total97156, 0), raw: totals.total97156, tone: "default",
        drilldown: tableDrill("97156 by BCBA", ["BCBA", "State", "97156 hrs", "Clients PT"], c.filter(b => b.h97156 > 0).map(b => [b.name, b.state || "—", fmtNum(b.h97156), b.clientsParentTraining])) },
      { id: "caseload", label: "Avg Caseload", value: fmtNum(totals.avgCaseload), raw: totals.avgCaseload, tone: "default" },
      { id: "proj", label: "Projected Compliance", value: fmtPct(totals.projectedPct), raw: totals.projectedPct, tone: totals.projectedPct >= 0.8 ? "success" : totals.projectedPct >= 0.6 ? "warn" : "danger" },
      { id: "payroll", label: "Payroll Risk Count", value: totals.payrollRisk.toLocaleString(), raw: totals.payrollRisk, tone: totals.payrollRisk > 0 ? "danger" : "success",
        drilldown: tableDrill("Payroll risk", ["BCBA", "State", "Worked", "Earnings", "Risks"], c.filter(b => b.payrollStatus === "Risk").map(b => [b.name, b.state || "—", fmtNum(b.workedHours), fmtMoney(b.earnings), b.risks.join("; ")])) },
      { id: "bonus", label: "Bonus Eligible", value: totals.bonusEligible.toLocaleString(), raw: totals.bonusEligible, tone: "info" as any,
        drilldown: tableDrill("Bonus eligible", ["BCBA", "State", "Worked", "Bonus"], c.filter(b => b.bonusEligible).map(b => [b.name, b.state || "—", fmtNum(b.workedHours), fmtMoney(b.bonusAmount)])) },
      { id: "score", label: "Avg Productivity Score", value: fmtNum(totals.avgScore, 0), raw: totals.avgScore, tone: totals.avgScore >= 75 ? "success" : totals.avgScore >= 60 ? "warn" : "danger" },
    ];
  }, [computed, totals, minHours]);

  /* ---- Charts ---- */
  const charts: ChartSpec[] = useMemo(() => {
    const top = [...computed].sort((a, b) => b.workedHours - a.workedHours).slice(0, 12);
    const ranking = [...computed].sort((a, b) => b.productivityScore - a.productivityScore).slice(0, 12);

    const minDist = {
      labels: ["Meets", "Exceeds", "At Risk", "Below", "Missing"],
      data: [
        computed.filter(b => b.minStatus === "Meets Minimum").length,
        computed.filter(b => b.minStatus === "Exceeds Minimum").length,
        computed.filter(b => b.minStatus === "At Risk").length,
        computed.filter(b => b.minStatus === "Below Minimum").length,
        computed.filter(b => b.minStatus === "Missing Data").length,
      ],
    };

    const stateGroups = new Map<string, BcbaRow[]>();
    for (const b of computed) {
      if (!b.state) continue;
      const arr = stateGroups.get(b.state) || [];
      arr.push(b); stateGroups.set(b.state, arr);
    }
    const stateLabels = [...stateGroups.keys()];
    const stateAvgHours = stateLabels.map(s => {
      const arr = stateGroups.get(s)!;
      return arr.reduce((sum, b) => sum + b.workedHours, 0) / (arr.length || 1);
    });
    const stateAvgScore = stateLabels.map(s => {
      const arr = stateGroups.get(s)!;
      return arr.reduce((sum, b) => sum + b.productivityScore, 0) / (arr.length || 1);
    });

    return [
      { id: "hours", title: "Hours by BCBA (Top 12)", type: "bar",
        labels: top.map(b => b.name.split(" ").slice(0, 2).join(" ")),
        series: [{ name: "Worked hours", data: top.map(b => Math.round(b.workedHours)), color: "hsl(265 70% 55%)" }],
        unit: " hrs", span: 2 },
      { id: "ranking", title: "Productivity Ranking (Top 12)", type: "bar",
        labels: ranking.map(b => b.name.split(" ").slice(0, 2).join(" ")),
        series: [{ name: "Score", data: ranking.map(b => b.productivityScore), color: "hsl(285 70% 55%)" }],
        unit: "" },
      { id: "min-dist", title: "Minimum Hours Compliance", type: "pie",
        labels: minDist.labels, series: [{ name: "BCBAs", data: minDist.data }] },
      { id: "97155", title: "97155 Supervision Activity", type: "bar",
        labels: top.map(b => b.name.split(" ").slice(0, 2).join(" ")),
        series: [{ name: "97155 hrs", data: top.map(b => Math.round(b.h97155)), color: "hsl(200 75% 45%)" }],
        unit: " hrs" },
      { id: "97156", title: "97156 Parent Training Activity", type: "bar",
        labels: top.map(b => b.name.split(" ").slice(0, 2).join(" ")),
        series: [{ name: "97156 hrs", data: top.map(b => Math.round(b.h97156)), color: "hsl(28 90% 50%)" }],
        unit: " hrs" },
      ...(stateLabels.length ? [{
        id: "state-compare", title: "State Comparison", type: "bar" as const,
        labels: stateLabels,
        series: [
          { name: "Avg hours", data: stateAvgHours.map(v => Math.round(v)), color: "hsl(265 70% 55%)" },
          { name: "Avg score", data: stateAvgScore.map(v => Math.round(v)), color: "hsl(170 65% 40%)" },
        ],
        span: 2 as const,
      }] : []),
    ];
  }, [computed]);

  /* ---- Insights ---- */
  const insights = useMemo(() => {
    const out: string[] = [];
    if (!computed.length) return out;
    if (totals.below > 0) out.push(`${totals.below} BCBA${totals.below === 1 ? " is" : "s are"} currently below minimum required hours.`);
    if (totals.atRisk > 0) out.push(`${totals.atRisk} BCBA${totals.atRisk === 1 ? " is" : "s are"} projected at risk of missing minimums.`);
    if (totals.exceeds > 0) out.push(`${totals.exceeds} BCBA${totals.exceeds === 1 ? "" : "s"} exceeding minimum hours this period.`);
    if (totals.bonusEligible > 0) out.push(`${totals.bonusEligible} BCBA${totals.bonusEligible === 1 ? " is" : "s are"} bonus-eligible at current pace.`);
    if (totals.payrollRisk > 0) out.push(`${totals.payrollRisk} BCBA${totals.payrollRisk === 1 ? " has" : "s have"} payroll risk flags that should be cleared before close.`);
    // Top state
    const stateMap = new Map<string, BcbaRow[]>();
    for (const b of computed) { if (!b.state) continue; const a = stateMap.get(b.state) || []; a.push(b); stateMap.set(b.state, a); }
    let topState = ""; let topScore = -1;
    for (const [s, arr] of stateMap) {
      const avg = arr.reduce((sum, b) => sum + b.productivityScore, 0) / arr.length;
      if (avg > topScore) { topScore = avg; topState = s; }
    }
    if (topState) out.push(`${topState} has the highest average BCBA productivity score (${fmtNum(topScore, 0)}).`);
    return out;
  }, [computed, totals]);

  /* ---- Filters ---- */
  const filtered = useMemo(() => {
    let rows = computed;
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter(b => b.name.toLowerCase().includes(q) || (b.id || "").toLowerCase().includes(q));
    if (statusFilter !== "all") rows = rows.filter(b => b.minStatus === statusFilter);
    if (stateFilter !== "all") rows = rows.filter(b => b.state === stateFilter);
    if (mgrFilter !== "all") rows = rows.filter(b => b.manager === mgrFilter);
    if (payFilter !== "all") rows = rows.filter(b => b.payrollStatus === payFilter);
    if (bonusFilter === "yes") rows = rows.filter(b => b.bonusEligible);
    if (bonusFilter === "no") rows = rows.filter(b => !b.bonusEligible);
    const sorted = [...rows];
    switch (sortBy) {
      case "score": sorted.sort((a, b) => b.productivityScore - a.productivityScore); break;
      case "min": sorted.sort((a, b) => a.diffFromMin - b.diffFromMin); break;
      case "hours": sorted.sort((a, b) => b.workedHours - a.workedHours); break;
      case "earnings": sorted.sort((a, b) => b.earnings - a.earnings); break;
      case "caseload": sorted.sort((a, b) => b.caseload - a.caseload); break;
    }
    return sorted;
  }, [computed, search, statusFilter, stateFilter, mgrFilter, payFilter, bonusFilter, sortBy]);

  /* ---- Exports ---- */
  function exportProductivity() {
    downloadCsv("bcba-productivity.csv",
      ["BCBA", "State", "Manager", "Caseload", "Required", "Worked", "Projected", "Billable", "97153", "97155", "97156", "Score", "MinStatus", "PayrollStatus", "BonusEligible", "Earnings"],
      filtered.map(b => [b.name, b.state, b.manager, b.caseload, b.requiredHours || minHours, fmtNum(b.workedHours), fmtNum(b.projectedHours), fmtNum(b.billableHours), fmtNum(b.h97153), fmtNum(b.h97155), fmtNum(b.h97156), b.productivityScore, b.minStatus, b.payrollStatus, b.bonusEligible ? "Yes" : "No", fmtMoney(b.earnings)]));
  }
  function exportMinimumHours() {
    downloadCsv("bcba-minimum-hours.csv",
      ["BCBA", "State", "Required", "Worked", "Remaining", "Projected", "Δ", "Status"],
      filtered.map(b => {
        const req = b.requiredHours || minHours;
        return [b.name, b.state, req, fmtNum(b.workedHours), fmtNum(Math.max(0, req - b.workedHours)), fmtNum(b.projectedHours), fmtNum(b.diffFromMin), b.minStatus];
      }));
  }
  function exportPayrollRisk() {
    downloadCsv("bcba-payroll-risk.csv",
      ["BCBA", "State", "Worked", "Earnings", "PayrollStatus", "Risks"],
      filtered.filter(b => b.payrollStatus !== "Ready").map(b => [b.name, b.state, fmtNum(b.workedHours), fmtMoney(b.earnings), b.payrollStatus, b.risks.join("; ")]));
  }
  function exportEarnings() {
    downloadCsv("bcba-earnings.csv",
      ["BCBA", "State", "Worked", "Rate", "Earnings", "BonusEligible", "Bonus", "Projected"],
      filtered.map(b => [b.name, b.state, fmtNum(b.workedHours), fmtMoney(b.rate), fmtMoney(b.earnings), b.bonusEligible ? "Yes" : "No", fmtMoney(b.bonusAmount), fmtMoney(b.earnings + b.bonusAmount)]));
  }
  function exportCaseload() {
    downloadCsv("bcba-caseload.csv",
      ["BCBA", "State", "Caseload", "ClientsSupervised", "ClientsParentTraining", "Supervision %", "PT %"],
      filtered.map(b => [b.name, b.state, b.caseload, b.clientsSupervised, b.clientsParentTraining, fmtPct(b.supervisionPct), fmtPct(b.parentTrainingPct)]));
  }
  function copyExecSummary() {
    const lines = [
      `BCBA Productivity & Minimum Hours — ${new Date().toLocaleDateString()}`,
      `Active BCBAs: ${totals.n} · Meeting min: ${totals.meeting} · Below: ${totals.below} · At risk: ${totals.atRisk}`,
      `Avg hours: ${fmtNum(totals.avgHours)} · Avg score: ${fmtNum(totals.avgScore, 0)}`,
      `Payroll risk: ${totals.payrollRisk} · Bonus eligible: ${totals.bonusEligible}`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Executive summary copied");
  }
  function saveSnapshot() {
    try {
      const key = "blossom.os.hr.bcba.snapshots.v1";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.push({
        id: crypto.randomUUID(), savedAt: new Date().toISOString(),
        fileName, periodStart, periodEnd, minHours,
        rowCount: computed.length,
        kpis: { meeting: totals.meeting, below: totals.below, atRisk: totals.atRisk, avgScore: totals.avgScore, payrollRisk: totals.payrollRisk, bonusEligible: totals.bonusEligible },
      });
      localStorage.setItem(key, JSON.stringify(list));
      toast.success("Snapshot saved");
    } catch { toast.error("Could not save snapshot"); }
  }

  /* ===================== RENDER ===================== */

  return (
    <OSShell>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/reports" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition hover:-translate-y-0.5 hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <div>
            <Badge variant="secondary" className="rounded-full bg-[hsl(265_100%_97%)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(265_70%_55%)]">
              HR · Featured Dashboard
            </Badge>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight">BCBA Productivity &amp; Minimum Hours Dashboard</h1>
            <p className="text-[12.5px] text-muted-foreground">
              Track BCBA productivity, minimum hours compliance, supervision and parent training activity, earnings, caseload, payroll risk and state-level performance.
            </p>
          </div>
        </div>
        <ReportAIButton preset="hr-bcba-productivity" />
      </div>

      <SourceCoverageBanner reportKey="bcba-productivity" />

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
                  <p className="text-[11px] text-muted-foreground">{bcbas.length.toLocaleString()} employee{bcbas.length === 1 ? "" : "s"} detected</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={resetUpload}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Replace file
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-5">
              <div>
                <label className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Period Start</label>
                <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="mt-1 h-9 text-[12.5px]" />
              </div>
              <div>
                <label className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Period End</label>
                <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="mt-1 h-9 text-[12.5px]" />
              </div>
              <div>
                <label className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">% Period Elapsed</label>
                <Input type="number" min={5} max={100} value={Math.round(periodElapsedPct * 100)} onChange={(e) => setPeriodElapsedPct(Math.max(0.05, Math.min(1, (parseFloat(e.target.value) || 0) / 100)))} className="mt-1 h-9 text-[12.5px]" />
              </div>
              <div>
                <label className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Min Hours</label>
                <Input type="number" value={minHours} onChange={(e) => setMinHours(Math.max(0, parseFloat(e.target.value) || 0))} className="mt-1 h-9 text-[12.5px]" />
              </div>
              <div>
                <label className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Bonus Threshold</label>
                <Input type="number" value={bonusThreshold} onChange={(e) => setBonusThreshold(Math.max(0, parseFloat(e.target.value) || 0))} className="mt-1 h-9 text-[12.5px]" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant={includeNonBcba ? "default" : "outline"} onClick={() => setIncludeNonBcba(v => !v)} className="h-8 text-[11.5px]">
                {includeNonBcba ? "Including non-BCBA rows" : "BCBA / Clinical Supervisor only"}
              </Button>
              <span className="text-[11px] text-muted-foreground">Manual override for role detection</span>
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
                    <p className="mt-1 text-rose-600/80">Upload a CR billing, service, payroll, or caseload export that includes a BCBA name and at least one hours column.</p>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => { setGenerated(true); toast.success("BCBA productivity dashboard generated"); }}
                className="h-9 rounded-full bg-[hsl(265_70%_55%)] px-5 text-[12.5px] font-semibold text-white hover:bg-[hsl(265_70%_50%)]"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Generate BCBA Dashboard
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Dashboard */}
      {generated && computed.length > 0 && (
        <>
          {/* KPIs */}
          <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
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
                {insights.length === 0 && <li className="text-muted-foreground">No insights yet — generate the dashboard to see automated findings.</li>}
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
                <Button variant="outline" size="sm" onClick={exportProductivity}><Download className="mr-1 h-3.5 w-3.5" />Productivity</Button>
                <Button variant="outline" size="sm" onClick={exportMinimumHours}><Download className="mr-1 h-3.5 w-3.5" />Min Hours</Button>
                <Button variant="outline" size="sm" onClick={exportPayrollRisk}><Download className="mr-1 h-3.5 w-3.5" />Payroll Risk</Button>
                <Button variant="outline" size="sm" onClick={exportEarnings}><Download className="mr-1 h-3.5 w-3.5" />Earnings</Button>
                <Button variant="outline" size="sm" onClick={exportCaseload}><Download className="mr-1 h-3.5 w-3.5" />Caseload</Button>
                <Button variant="outline" size="sm" onClick={copyExecSummary}><TrendingUp className="mr-1 h-3.5 w-3.5" />Copy Summary</Button>
                <Button variant="outline" size="sm" onClick={saveSnapshot} className="col-span-2"><Sparkles className="mr-1 h-3.5 w-3.5" />Save Snapshot</Button>
              </div>
            </div>
          </section>

          {/* Charts */}
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            {charts.map(c => <ChartCard key={c.id} chart={c} />)}
          </section>

          {/* Productivity Table */}
          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-semibold tracking-tight">BCBA Productivity Scorecard</h2>
                <p className="text-[11.5px] text-muted-foreground">{filtered.length} of {computed.length} BCBAs</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search BCBA…" className="h-8 w-[200px] pl-8 text-[12px]" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-[150px] text-[12px]"><SelectValue placeholder="Min status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Meets Minimum">Meets Minimum</SelectItem>
                    <SelectItem value="Exceeds Minimum">Exceeds Minimum</SelectItem>
                    <SelectItem value="At Risk">At Risk</SelectItem>
                    <SelectItem value="Below Minimum">Below Minimum</SelectItem>
                    <SelectItem value="Missing Data">Missing Data</SelectItem>
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
                {managers.length > 0 && (
                  <Select value={mgrFilter} onValueChange={setMgrFilter}>
                    <SelectTrigger className="h-8 w-[140px] text-[12px]"><SelectValue placeholder="Manager" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All managers</SelectItem>
                      {managers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Select value={payFilter} onValueChange={setPayFilter}>
                  <SelectTrigger className="h-8 w-[140px] text-[12px]"><SelectValue placeholder="Payroll" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All payroll</SelectItem>
                    <SelectItem value="Ready">Ready</SelectItem>
                    <SelectItem value="Review Needed">Review Needed</SelectItem>
                    <SelectItem value="Risk">Risk</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={bonusFilter} onValueChange={setBonusFilter}>
                  <SelectTrigger className="h-8 w-[130px] text-[12px]"><SelectValue placeholder="Bonus" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All bonus</SelectItem>
                    <SelectItem value="yes">Bonus eligible</SelectItem>
                    <SelectItem value="no">Not eligible</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="h-8 w-[140px] text-[12px]"><SelectValue placeholder="Sort" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">Sort: Score</SelectItem>
                    <SelectItem value="min">Sort: Min Δ</SelectItem>
                    <SelectItem value="hours">Sort: Hours</SelectItem>
                    <SelectItem value="earnings">Sort: Earnings</SelectItem>
                    <SelectItem value="caseload">Sort: Caseload</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1200px] text-[12.5px]">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-2 py-2">BCBA</th>
                    <th className="px-2 py-2">State</th>
                    <th className="px-2 py-2 text-right">Caseload</th>
                    <th className="px-2 py-2 text-right">Required</th>
                    <th className="px-2 py-2 text-right">Worked</th>
                    <th className="px-2 py-2 text-right">97155</th>
                    <th className="px-2 py-2 text-right">97156</th>
                    <th className="px-2 py-2 text-right">Billable</th>
                    <th className="px-2 py-2 text-right">Score</th>
                    <th className="px-2 py-2">Min Status</th>
                    <th className="px-2 py-2">Payroll</th>
                    <th className="px-2 py-2">Bonus</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.id} className="cursor-pointer border-b border-border/30 hover:bg-secondary/40" onClick={() => setEmpDrill(b)}>
                      <td className="px-2 py-2 font-medium">{b.name}</td>
                      <td className="px-2 py-2 text-muted-foreground">{b.state || "—"}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{b.caseload || "—"}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{fmtNum(b.requiredHours || minHours)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{fmtNum(b.workedHours)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{fmtNum(b.h97155)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{fmtNum(b.h97156)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{fmtNum(b.billableHours)}</td>
                      <td className="px-2 py-2 text-right tabular-nums font-semibold">{b.productivityScore}</td>
                      <td className="px-2 py-2"><StatusBadge tone={MIN_TONE[b.minStatus]}>{b.minStatus}</StatusBadge></td>
                      <td className="px-2 py-2"><StatusBadge tone={PAY_TONE[b.payrollStatus]}>{b.payrollStatus}</StatusBadge></td>
                      <td className="px-2 py-2">{b.bonusEligible ? <Badge className="rounded-full bg-amber-100 text-amber-800 hover:bg-amber-100"><Award className="mr-1 h-3 w-3" />{fmtMoney(b.bonusAmount)}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={12} className="px-2 py-8 text-center text-muted-foreground">No BCBAs match the current filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Alert Center */}
          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
              <h2 className="text-[15px] font-semibold tracking-tight">Alert Center</h2>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {[
                { label: "Below Minimum Hours", rows: computed.filter(b => b.minStatus === "Below Minimum"), tone: "danger" as const },
                { label: "Projected Below Minimum", rows: computed.filter(b => b.minStatus === "At Risk"), tone: "warn" as const },
                { label: "Missing Supervision (97155)", rows: computed.filter(b => b.h97155 === 0 && b.caseload > 0), tone: "warn" as const },
                { label: "Missing Parent Training (97156)", rows: computed.filter(b => b.h97156 === 0 && b.caseload > 0), tone: "warn" as const },
                { label: "Payroll Risk", rows: computed.filter(b => b.payrollStatus === "Risk"), tone: "danger" as const },
                { label: "Bonus Eligible", rows: computed.filter(b => b.bonusEligible), tone: "success" as const },
              ].map(a => (
                <button key={a.label} className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 px-3 py-2.5 text-left transition hover:border-[hsl(265_70%_55%/0.3)] hover:bg-secondary/50"
                  onClick={() => setDrill(tableDrill(a.label, ["BCBA", "State", "Worked", "97155", "97156", "Status"], a.rows.map(b => [b.name, b.state || "—", fmtNum(b.workedHours), fmtNum(b.h97155), fmtNum(b.h97156), b.minStatus])))}>
                  <span className="text-[12.5px] font-medium">{a.label}</span>
                  <StatusBadge tone={a.tone}>{a.rows.length}</StatusBadge>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {/* KPI / Alert drilldown */}
      <Sheet open={!!drill} onOpenChange={(v) => !v && setDrill(null)}>
        <SheetContent side="right" className="w-full sm:max-w-3xl">
          <SheetHeader><SheetTitle>{drill?.title}</SheetTitle></SheetHeader>
          {drill && (
            <div className="mt-4 overflow-auto">
              {drill.rows.length === 0 ? (
                <p className="text-[12.5px] text-muted-foreground">{drill.emptyMessage || "No rows."}</p>
              ) : (
                <table className="w-full text-[12.5px]">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {drill.columns.map(c => <th key={c} className="px-2 py-2">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {drill.rows.map((r, i) => (
                      <tr key={i} className="border-b border-border/30">
                        {r.map((cell, j) => <td key={j} className="px-2 py-1.5 tabular-nums">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Employee drilldown */}
      <Sheet open={!!empDrill} onOpenChange={(v) => !v && setEmpDrill(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl">
          <SheetHeader><SheetTitle>{empDrill?.name}</SheetTitle></SheetHeader>
          {empDrill && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Info label="State" value={empDrill.state || "—"} />
                <Info label="Manager" value={empDrill.manager || "—"} />
                <Info label="Role" value={empDrill.role || "—"} />
                <Info label="Caseload" value={String(empDrill.caseload || "—")} />
                <Info label="Required Hours" value={fmtNum(empDrill.requiredHours || minHours)} />
                <Info label="Worked Hours" value={fmtNum(empDrill.workedHours)} />
                <Info label="Projected Hours" value={fmtNum(empDrill.projectedHours)} />
                <Info label="Billable Hours" value={fmtNum(empDrill.billableHours)} />
                <Info label="97155 Hours" value={fmtNum(empDrill.h97155)} />
                <Info label="97156 Hours" value={fmtNum(empDrill.h97156)} />
                <Info label="Productivity Score" value={String(empDrill.productivityScore)} />
                <Info label="Min Status" value={empDrill.minStatus} tone={MIN_TONE[empDrill.minStatus] as any} />
                <Info label="Payroll Status" value={empDrill.payrollStatus} tone={PAY_TONE[empDrill.payrollStatus]} />
                <Info label="Bonus" value={empDrill.bonusEligible ? fmtMoney(empDrill.bonusAmount) : "—"} />
                <Info label="Rate" value={fmtMoney(empDrill.rate)} />
                <Info label="Earnings" value={fmtMoney(empDrill.earnings)} />
              </div>

              {empDrill.risks.length > 0 && (
                <div className="rounded-xl border border-rose-200/70 bg-rose-50/50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-700">Risk factors</p>
                  <ul className="mt-1 space-y-0.5 text-[12.5px] text-rose-800">
                    {empDrill.risks.map((r, i) => <li key={i}>• {r}</li>)}
                  </ul>
                </div>
              )}

              <details className="rounded-xl border border-border/60 bg-secondary/30 p-3">
                <summary className="cursor-pointer text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Raw imported data</summary>
                <pre className="mt-2 max-h-72 overflow-auto text-[11px] leading-snug">{JSON.stringify(empDrill.raw, null, 2)}</pre>
              </details>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </OSShell>
  );
}

/* ===================== SMALL COMPONENTS ===================== */

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
        <p className="text-[14px] font-semibold">Upload CR billing / service / payroll / caseload export</p>
        <p className="mt-1 text-[11.5px] text-muted-foreground">CSV or XLSX · CentralReach, Viventium, BCBA Earnings, Caseload, Staffing or Productivity exports</p>
      </div>
      <Button size="sm" onClick={() => inputRef.current?.click()} disabled={loading}
        className="rounded-full bg-[hsl(265_70%_55%)] hover:bg-[hsl(265_70%_50%)]">
        {loading ? "Parsing…" : "Choose file"}
      </Button>
      <input ref={inputRef} type="file" className="hidden" accept={SUPPORTED_EXTENSIONS} onChange={(e) => onFiles(e.target.files)} />
    </div>
  );
}

function Info({ label, value, tone }: { label: string; value: string; tone?: "success" | "warn" | "danger" | "info" | "default" }) {
  return (
    <div className="rounded-xl border border-border/50 bg-secondary/30 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      {tone ? <div className="mt-1"><StatusBadge tone={tone}>{value}</StatusBadge></div> : <p className="mt-0.5 text-[13px] font-medium tabular-nums">{value}</p>}
    </div>
  );
}

function StatusBadge({ tone, children }: { tone: "success" | "warn" | "danger" | "info" | "default"; children: React.ReactNode }) {
  const map: Record<string, string> = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    default: "bg-secondary text-muted-foreground border-border/60",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold", map[tone])}>
      {children}
    </span>
  );
}