import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Upload, FileSpreadsheet, Sparkles, Download, Search,
  AlertTriangle, CheckCircle2, Brain, Trash2, Database,
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
import { CentralReachRequirementsCard } from "@/components/reports/CentralReachRequirementsCard";
import { SourceCoverageBanner } from "@/components/reports/SourceCoverageBanner";
import {
  getActiveSharedReportDataset,
  downloadSharedReportDatasetFile,
} from "@/lib/os/sharedReportDatasets";

/* ============================================================
 * QA Authorization Utilization Dashboard
 * ============================================================ */

interface AuthRow {
  clientId: string;
  clientName: string;
  authNumber: string;
  payor: string;
  serviceCode: string;
  authorizedHours: number;
  workedHours: number;
  pendingHours: number;
  remainingHours: number;
  utilization: number; // 0-1
  startDate: Date | null;
  expirationDate: Date | null;
  expirationRaw: string;
  state: string;
  bcba: string;
  status: AuthStatus;
  daysToExpire: number | null;
  missingData: boolean;
  raw: Record<string, string>;
}

type AuthStatus =
  | "Missing Data"
  | "Low Utilization"
  | "Moderate Utilization"
  | "Healthy Utilization"
  | "Near Exhaustion"
  | "Over Utilized"
  | "Expired";

const STATUS_TONE: Record<AuthStatus, "success" | "warn" | "danger" | "default"> = {
  "Missing Data": "default",
  "Low Utilization": "warn",
  "Moderate Utilization": "default",
  "Healthy Utilization": "success",
  "Near Exhaustion": "warn",
  "Over Utilized": "danger",
  "Expired": "danger",
};

/* ===================== HELPERS ===================== */

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function findHeader(headers: string[], candidates: string[]): string | null {
  const map = new Map(headers.map(h => [normalizeHeader(h), h]));
  for (const c of candidates) { const hit = map.get(normalizeHeader(c)); if (hit) return hit; }
  return null;
}
function parseDate(s: string): Date | null {
  if (!s) return null;
  const trimmed = s.trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(trimmed);
  if (iso) { const d = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3])); return isNaN(d.getTime()) ? null : d; }
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(trimmed);
  if (us) { let y = +us[3]; if (y < 100) y += 2000; const d = new Date(Date.UTC(y, +us[1] - 1, +us[2])); return isNaN(d.getTime()) ? null : d; }
  const fb = new Date(trimmed); return isNaN(fb.getTime()) ? null : fb;
}
function parseNum(s: string): number {
  if (s == null) return 0;
  const cleaned = String(s).replace(/[$, ]/g, "");
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : 0;
}
function extractProcedureCode(s: string): string {
  if (!s) return "";
  const m = s.match(/\b(\d{5})\b/);
  return m ? m[1] : s.trim();
}
function fmtHrs(n: number): string { return n.toFixed(1); }
function fmtPct(n: number): string { return isFinite(n) ? `${(n * 100).toFixed(1)}%` : "—"; }
function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
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
function statusFor(authorizedHours: number, workedHours: number, expirationDate: Date | null, now: Date): { status: AuthStatus; missingData: boolean; daysToExpire: number | null } {
  const daysToExpire = expirationDate ? Math.round((expirationDate.getTime() - now.getTime()) / 86_400_000) : null;
  if (expirationDate && daysToExpire !== null && daysToExpire < 0) {
    return { status: "Expired", missingData: false, daysToExpire };
  }
  if (!authorizedHours || authorizedHours <= 0) {
    return { status: "Missing Data", missingData: true, daysToExpire };
  }
  const u = workedHours / authorizedHours;
  if (u > 1.0) return { status: "Over Utilized", missingData: false, daysToExpire };
  if (u >= 0.95) return { status: "Near Exhaustion", missingData: false, daysToExpire };
  if (u >= 0.80) return { status: "Healthy Utilization", missingData: false, daysToExpire };
  if (u >= 0.50) return { status: "Moderate Utilization", missingData: false, daysToExpire };
  return { status: "Low Utilization", missingData: false, daysToExpire };
}

/* ===================== PAGE ===================== */

export default function QaAuthUtilizationDashboard() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const viewParam = (searchParams.get("view") || "").toLowerCase();
  const isAnalysis =
    location.pathname.endsWith("/reports/authorization-analysis") ||
    viewParam === "analysis";
  const isHourBased =
    location.pathname.endsWith("/reports/authorization-utilization-hour-based") ||
    viewParam === "hours" || viewParam === "hour-based";
  const pageTitle = isAnalysis
    ? "Authorization Analysis"
    : isHourBased
      ? "Authorization Utilization — Hour Based"
      : "Authorization Utilization Dashboard";
  const pageSubtitle = isAnalysis
    ? "Per-client authorization health: authorized vs worked vs pending vs remaining hours by client, auth #, payor, and service code."
    : isHourBased
      ? "Hour-based utilization vs authorized (and prorated authorized where available) by client, service code, location/state and date range."
      : "Upload a CentralReach authorization export to instantly identify utilization risks, expiring auths, and client authorization health.";
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<AuthRow[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [sharedAvailable, setSharedAvailable] = useState<boolean | null>(null);

  // filters
  const [search, setSearch] = useState("");
  const [payorFilter, setPayorFilter] = useState("all");
  const [bcbaFilter, setBcbaFilter] = useState("all");
  const [codeFilter, setCodeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expFilter, setExpFilter] = useState("all"); // all | expired | 30 | 60 | 90 | active
  const [stateFilter, setStateFilter] = useState("all");

  const [drill, setDrill] = useState<DrilldownSpec | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  /* ---- File upload ---- */
  async function handleFiles(files: FileList | File[] | null) {
    if (!files || !files[0]) return;
    const file = files[0];
    setLoading(true);
    try {
      const parsed = await parseAnyFile(file);
      const first = parsed[0];
      if (!first) throw new Error("No data in file.");
      const headers = first.headers;

      const clientFnH = findHeader(headers, ["ClientFirstName", "Client First Name", "Client First"]);
      const clientLnH = findHeader(headers, ["ClientLastName", "Client Last Name", "Client Last"]);
      const clientFullH = findHeader(headers, ["ClientFullName", "Client Full Name", "ClientName", "Client Name", "Client", "clientName"]);
      const clientIdH = findHeader(headers, ["ClientId", "Client Id", "Client ID"]);
      const authNumH = findHeader(headers, ["AuthorizationNumber", "Authorization Number", "AuthNumber", "Auth Number", "AuthorizationId", "Authorization Id", "Auth Id"]);
      const payorH = findHeader(headers, ["PayorName", "Payor", "Payer", "PayerName", "Insurance"]);
      const codeH = findHeader(headers, ["ServiceCode", "Service Code", "ServiceCodes", "Service Codes", "ProcedureCode", "Procedure Code", "CPTCode", "CPT Code"]);
      const codeDescH = findHeader(headers, ["ServiceCodeDescription", "ProcedureCodeDescription", "Service Code Description", "Procedure Code Description"]);
      const authHrsH = findHeader(headers, ["AuthorizedHoursAll", "AuthorizedHours", "Authorized Hours", "AuthorizedHoursMonth", "AuthorizedAmountAll", "AuthorizedAmount", "Authorized Amount", "AuthorizedUnitsAll", "AuthorizedUnits", "Authorized Units", "AuthorizedQuantity"]);
      const workedHrsH = findHeader(headers, ["WorkedHoursAll", "WorkedHours", "Worked Hours", "WorkedHoursMonth", "WorkedAmountAll", "WorkedAmount", "Worked Amount", "WorkedUnitsAll", "WorkedUnits", "Worked Units", "UsedHours", "Used Hours"]);
      const pendingHrsH = findHeader(headers, ["PendingHoursAll", "PendingHours", "Pending Hours", "PendingHoursMonth", "PendingAmountAll", "PendingAmount", "Pending Amount", "PendingUnitsAll", "PendingUnits", "Pending Units"]);
      const remainingHrsH = findHeader(headers, ["RemainingHoursAll", "RemainingHours", "Remaining Hours", "RemainingHoursMonth", "RemainingAmountAll", "RemainingAmount", "Remaining Amount", "RemainingUnitsAll", "RemainingUnits", "Remaining Units"]);
      const expH = findHeader(headers, ["ExpirationDate", "Expiration Date", "endDate", "EndDate", "End Date", "AuthorizationEndDate", "ActualEndDate"]);
      const startH = findHeader(headers, ["startDate", "StartDate", "Start Date", "AuthorizationStartDate", "AuthorizationStart", "ActualStartDate"]);
      const stateH = findHeader(headers, ["State", "ClientState", "Client State"]);
      const bcbaH = findHeader(headers, ["BCBA", "AssignedBCBA", "Assigned BCBA", "Supervisor", "PrimaryBCBA", "Primary BCBA", "Provider", "ProviderName", "managerName", "Manager", "ManagerName"]);

      const missing: string[] = [];
      if (!clientFullH && !(clientFnH && clientLnH)) missing.push("ClientName (or ClientFirstName + ClientLastName)");
      if (!authNumH) missing.push("AuthorizationNumber");
      if (!authHrsH) missing.push("AuthorizedHours / Authorized Amount");
      if (!workedHrsH) missing.push("WorkedHours / Worked Amount");

      if (missing.length) {
        setMissingFields(missing);
        setRows([]); setGenerated(false); setFileName(file.name);
        return;
      }
      setMissingFields([]);

      const now = new Date();
      const out: AuthRow[] = first.rows.map(r => {
        const clientName = clientFullH
          ? r[clientFullH]
          : `${clientFnH ? r[clientFnH] : ""} ${clientLnH ? r[clientLnH] : ""}`.trim();
        const authorizedHours = authHrsH ? parseNum(r[authHrsH]) : 0;
        const workedHours = workedHrsH ? parseNum(r[workedHrsH]) : 0;
        const pendingHours = pendingHrsH ? parseNum(r[pendingHrsH]) : 0;
        const remainingHours = remainingHrsH
          ? parseNum(r[remainingHrsH])
          : Math.max(0, authorizedHours - workedHours - pendingHours);
        const expirationDate = expH ? parseDate(r[expH]) : null;
        const startDate = startH ? parseDate(r[startH]) : null;
        const codeRaw = codeH ? r[codeH] : (codeDescH ? r[codeDescH] : "");
        const serviceCode = extractProcedureCode(codeRaw);
        const utilization = authorizedHours > 0 ? workedHours / authorizedHours : 0;
        const { status, missingData, daysToExpire } = statusFor(authorizedHours, workedHours, expirationDate, now);
        return {
          clientId: clientIdH ? r[clientIdH] : "",
          clientName: clientName || "Unknown Client",
          authNumber: authNumH ? r[authNumH] : "",
          payor: payorH ? r[payorH] : "—",
          serviceCode: serviceCode || "—",
          authorizedHours,
          workedHours,
          pendingHours,
          remainingHours,
          utilization,
          startDate,
          expirationDate,
          expirationRaw: expH ? r[expH] : "",
          state: stateH ? r[stateH] : "",
          bcba: bcbaH ? r[bcbaH] : "—",
          status,
          daysToExpire,
          missingData,
          raw: r,
        };
      }).filter(r => r.clientName);

      setRows(out);
      setFileName(file.name);
      setGenerated(false);
      toast.success(`Loaded ${out.length.toLocaleString()} authorizations from ${file.name}`);
    } catch (e: any) {
      toast.error(`Failed to parse file: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  function resetUpload() {
    setFileName(""); setRows([]); setMissingFields([]); setGenerated(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  /* ---- Shared admin dataset auto-load ---- */
  async function loadSharedAdminDataset(silent = false) {
    setSharedLoading(true);
    try {
      const ds = await getActiveSharedReportDataset("authorization");
      if (!ds) {
        setSharedAvailable(false);
        if (!silent) toast.info("No admin-uploaded authorization dataset found. Ask an admin to upload the CentralReach authorization export.");
        return;
      }
      setSharedAvailable(true);
      const file = await downloadSharedReportDatasetFile(ds);
      await handleFiles([file]);
      setGenerated(true);
      if (!silent) toast.success(`Loaded admin dataset: ${ds.fileName}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!silent) toast.error(`Failed to load admin dataset: ${msg}`);
    } finally {
      setSharedLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ds = await getActiveSharedReportDataset("authorization");
        if (cancelled) return;
        setSharedAvailable(!!ds);
        if (ds && !fileName) await loadSharedAdminDataset(true);
      } catch {
        if (!cancelled) setSharedAvailable(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Filter dropdown options ---- */
  const payors = useMemo(() => Array.from(new Set(rows.map(r => r.payor).filter(p => p && p !== "—"))).sort(), [rows]);
  const bcbas = useMemo(() => Array.from(new Set(rows.map(r => r.bcba).filter(b => b && b !== "—"))).sort(), [rows]);
  const codes = useMemo(() => Array.from(new Set(rows.map(r => r.serviceCode).filter(c => c && c !== "—"))).sort(), [rows]);
  const states = useMemo(() => Array.from(new Set(rows.map(r => r.state).filter(Boolean))).sort(), [rows]);

  /* ---- Filtered rows ---- */
  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (search) {
        const s = search.toLowerCase();
        if (!r.clientName.toLowerCase().includes(s) && !r.authNumber.toLowerCase().includes(s)) return false;
      }
      if (payorFilter !== "all" && r.payor !== payorFilter) return false;
      if (bcbaFilter !== "all" && r.bcba !== bcbaFilter) return false;
      if (codeFilter !== "all" && r.serviceCode !== codeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (stateFilter !== "all" && r.state !== stateFilter) return false;
      if (expFilter !== "all") {
        if (expFilter === "expired" && r.status !== "Expired") return false;
        if (expFilter === "30" && (r.daysToExpire == null || r.daysToExpire < 0 || r.daysToExpire > 30)) return false;
        if (expFilter === "60" && (r.daysToExpire == null || r.daysToExpire < 0 || r.daysToExpire > 60)) return false;
        if (expFilter === "90" && (r.daysToExpire == null || r.daysToExpire < 0 || r.daysToExpire > 90)) return false;
        if (expFilter === "active" && r.status === "Expired") return false;
      }
      return true;
    });
  }, [rows, search, payorFilter, bcbaFilter, codeFilter, statusFilter, expFilter, stateFilter]);

  /* ---- Aggregates ---- */
  const totals = useMemo(() => {
    const activeRows = rows.filter(r => r.status !== "Expired");
    let auth = 0, worked = 0, pending = 0, remaining = 0, utilSum = 0, utilCount = 0;
    for (const r of activeRows) {
      auth += r.authorizedHours; worked += r.workedHours;
      pending += r.pendingHours; remaining += r.remainingHours;
      if (r.authorizedHours > 0) { utilSum += r.utilization; utilCount++; }
    }
    const avgUtil = utilCount > 0 ? utilSum / utilCount : 0;
    const highRisks = rows.filter(r => r.status === "Near Exhaustion" || r.status === "Over Utilized").length;
    const lowRisks = rows.filter(r => r.status === "Low Utilization").length;
    const expired = rows.filter(r => r.status === "Expired").length;
    const expiring30 = rows.filter(r => r.status !== "Expired" && r.daysToExpire != null && r.daysToExpire >= 0 && r.daysToExpire <= 30).length;
    const missingData = rows.filter(r => r.missingData).length;
    return {
      activeAuths: activeRows.length, auth, worked, pending, remaining, avgUtil,
      highRisks, lowRisks, expired, expiring30, missingData,
    };
  }, [rows]);

  /* ---- Drilldown helpers ---- */
  const DETAIL_COLS = [
    "Client", "Client ID", "Auth #", "Payor", "Service Code",
    "Authorized", "Worked", "Pending", "Remaining", "Utilization %",
    "Start", "Expiration", "Days Left", "Status", "BCBA", "State",
  ];
  function detailRow(r: AuthRow): (string | number)[] {
    return [
      r.clientName, r.clientId, r.authNumber, r.payor, r.serviceCode,
      fmtHrs(r.authorizedHours), fmtHrs(r.workedHours), fmtHrs(r.pendingHours), fmtHrs(r.remainingHours),
      fmtPct(r.utilization), fmtDate(r.startDate), fmtDate(r.expirationDate),
      r.daysToExpire == null ? "—" : String(r.daysToExpire), r.status, r.bcba, r.state,
    ];
  }
  function openAuthDrill(r: AuthRow) {
    setDrill({
      title: `${r.clientName} · Auth ${r.authNumber}`,
      columns: DETAIL_COLS, rows: [detailRow(r)],
      emptyMessage: "No authorization data.",
    });
  }
  function openRowsDrill(title: string, list: AuthRow[]) {
    setDrill({
      title, columns: DETAIL_COLS, rows: list.map(detailRow),
      emptyMessage: "No authorizations in this group.",
    });
  }

  /* ---- KPIs ---- */
  const kpis: KpiSpec[] = useMemo(() => {
    if (!generated) return [];
    const activeRows = rows.filter(r => r.status !== "Expired");
    return [
      { id: "active", label: "Active Authorizations", value: String(totals.activeAuths), raw: totals.activeAuths,
        hint: "Not expired", tone: "default",
        drilldown: { title: "All active authorizations", columns: DETAIL_COLS, rows: activeRows.map(detailRow) } },
      { id: "auth", label: "Total Authorized Hours", value: fmtHrs(totals.auth), raw: totals.auth, hint: "Across active auths", tone: "default" },
      { id: "worked", label: "Total Worked Hours", value: fmtHrs(totals.worked), raw: totals.worked, hint: "Delivered to date", tone: "default" },
      { id: "pending", label: "Total Pending Hours", value: fmtHrs(totals.pending), raw: totals.pending, hint: "Awaiting billing", tone: "default" },
      { id: "remaining", label: "Total Remaining Hours", value: fmtHrs(totals.remaining), raw: totals.remaining, hint: "Available capacity",
        tone: "default",
        drilldown: { title: "Top remaining authorizations",
          columns: DETAIL_COLS,
          rows: [...activeRows].sort((a, b) => b.remainingHours - a.remainingHours).slice(0, 50).map(detailRow) } },
      { id: "avg-util", label: "Average Utilization %", value: fmtPct(totals.avgUtil), raw: totals.avgUtil,
        hint: "Worked ÷ Authorized",
        tone: totals.avgUtil >= 0.80 ? "success" : totals.avgUtil >= 0.50 ? "warn" : "danger" },
      { id: "high-risk", label: "High Utilization Risks", value: String(totals.highRisks), raw: totals.highRisks,
        hint: "≥95% or over-utilized",
        tone: totals.highRisks === 0 ? "success" : "danger",
        drilldown: { title: "Near exhaustion or over-utilized", columns: DETAIL_COLS,
          rows: rows.filter(r => r.status === "Near Exhaustion" || r.status === "Over Utilized").map(detailRow),
          emptyMessage: "No authorizations near exhaustion." } },
      { id: "low-risk", label: "Low Utilization Risks", value: String(totals.lowRisks), raw: totals.lowRisks,
        hint: "Below 50%",
        tone: totals.lowRisks === 0 ? "success" : "warn",
        drilldown: { title: "Low utilization (<50%)", columns: DETAIL_COLS,
          rows: rows.filter(r => r.status === "Low Utilization").map(detailRow),
          emptyMessage: "No low-utilization authorizations." } },
      { id: "expired", label: "Expired Authorizations", value: String(totals.expired), raw: totals.expired,
        hint: "Past expiration date",
        tone: totals.expired === 0 ? "success" : "danger",
        drilldown: { title: "Expired authorizations", columns: DETAIL_COLS,
          rows: rows.filter(r => r.status === "Expired").map(detailRow),
          emptyMessage: "No expired authorizations." } },
      { id: "expiring", label: "Expiring Within 30 Days", value: String(totals.expiring30), raw: totals.expiring30,
        hint: "Active auths",
        tone: totals.expiring30 === 0 ? "success" : "warn",
        drilldown: { title: "Authorizations expiring within 30 days", columns: DETAIL_COLS,
          rows: rows.filter(r => r.status !== "Expired" && r.daysToExpire != null && r.daysToExpire >= 0 && r.daysToExpire <= 30).map(detailRow),
          emptyMessage: "No authorizations expiring in the next 30 days." } },
      { id: "missing", label: "Missing Authorization Data", value: String(totals.missingData), raw: totals.missingData,
        hint: "Authorized hours missing",
        tone: totals.missingData === 0 ? "success" : "warn",
        drilldown: { title: "Authorizations with missing data", columns: DETAIL_COLS,
          rows: rows.filter(r => r.missingData).map(detailRow),
          emptyMessage: "Every authorization has complete data." } },
    ];
  }, [generated, rows, totals]);

  /* ---- Charts ---- */
  const charts: ChartSpec[] = useMemo(() => {
    if (!generated || rows.length === 0) return [];
    const activeRows = rows.filter(r => r.status !== "Expired");

    // Distribution by status
    const STATUSES: AuthStatus[] = ["Low Utilization", "Moderate Utilization", "Healthy Utilization", "Near Exhaustion", "Over Utilized", "Missing Data", "Expired"];
    const distribution = STATUSES.map(s => ({ s, n: rows.filter(r => r.status === s).length })).filter(x => x.n > 0);

    // Top remaining hours
    const topRemaining = [...activeRows].sort((a, b) => b.remainingHours - a.remainingHours).slice(0, 10);
    // Top exhaustion risk (highest utilization among active with authorized>0)
    const topExhaustion = [...activeRows].filter(r => r.authorizedHours > 0)
      .sort((a, b) => b.utilization - a.utilization).slice(0, 10);

    // Utilization by payor
    const byPayor = aggregateUtil(activeRows, r => r.payor);
    const byBcba = aggregateUtil(activeRows, r => r.bcba);

    // Expiration timeline (buckets)
    const buckets = [
      { label: "Expired", filter: (r: AuthRow) => r.status === "Expired" },
      { label: "≤30 days", filter: (r: AuthRow) => r.status !== "Expired" && r.daysToExpire != null && r.daysToExpire >= 0 && r.daysToExpire <= 30 },
      { label: "31–60 days", filter: (r: AuthRow) => r.daysToExpire != null && r.daysToExpire > 30 && r.daysToExpire <= 60 },
      { label: "61–90 days", filter: (r: AuthRow) => r.daysToExpire != null && r.daysToExpire > 60 && r.daysToExpire <= 90 },
      { label: "91+ days", filter: (r: AuthRow) => r.daysToExpire != null && r.daysToExpire > 90 },
      { label: "No date", filter: (r: AuthRow) => r.daysToExpire == null },
    ].map(b => ({ label: b.label, n: rows.filter(b.filter).length })).filter(b => b.n > 0);

    return [
      { id: "dist", title: "Authorization Utilization Distribution", type: "pie",
        labels: distribution.map(d => d.s), series: [{ name: "Auths", data: distribution.map(d => d.n) }] },
      { id: "exp-timeline", title: "Authorization Expiration Timeline", type: "bar",
        labels: buckets.map(b => b.label), series: [{ name: "Auths", data: buckets.map(b => b.n) }] },
      { id: "top-remaining", title: "Top Remaining Hours", subtitle: "Largest remaining capacity",
        type: "bar", labels: topRemaining.map(r => `${r.clientName} · ${r.authNumber}`),
        series: [{ name: "Remaining hrs", data: topRemaining.map(r => +r.remainingHours.toFixed(1)) }],
        unit: " hrs", span: 2 },
      { id: "top-risk", title: "Top Exhaustion Risks", subtitle: "Highest utilization %",
        type: "bar", labels: topExhaustion.map(r => `${r.clientName} · ${r.authNumber}`),
        series: [{ name: "Utilization %", data: topExhaustion.map(r => +(r.utilization * 100).toFixed(1)) }],
        unit: "%", span: 2 },
      { id: "by-payor", title: "Utilization by Payor", type: "bar",
        labels: byPayor.map(x => x.key), series: [{ name: "Avg Util %", data: byPayor.map(x => +(x.avg * 100).toFixed(1)) }],
        unit: "%" },
      { id: "by-bcba", title: "Utilization by BCBA", type: "bar",
        labels: byBcba.map(x => x.key), series: [{ name: "Avg Util %", data: byBcba.map(x => +(x.avg * 100).toFixed(1)) }],
        unit: "%" },
    ];
  }, [generated, rows]);

  /* ---- AI insights ---- */
  const insights = useMemo(() => {
    if (!generated) return [];
    const out: string[] = [];
    out.push(`Average utilization across active authorizations is ${fmtPct(totals.avgUtil)}.`);
    if (totals.highRisks > 0) out.push(`${totals.highRisks} authorization${totals.highRisks === 1 ? " is" : "s are"} above 95% utilization.`);
    if (totals.expiring30 > 0) out.push(`${totals.expiring30} authorization${totals.expiring30 === 1 ? "" : "s"} expire within 30 days.`);
    if (totals.expired > 0) out.push(`${totals.expired} authorization${totals.expired === 1 ? " is" : "s are"} already expired.`);
    const lowRemaining = rows.filter(r => r.status !== "Expired" && r.remainingHours > 0 && r.remainingHours < 10).length;
    if (lowRemaining > 0) out.push(`${lowRemaining} client${lowRemaining === 1 ? " has" : "s have"} less than 10 remaining hours.`);
    if (totals.lowRisks > 0) out.push(`${totals.lowRisks} authorization${totals.lowRisks === 1 ? " is" : "s are"} under 50% utilized — potential capacity loss.`);
    if (totals.missingData > 0) out.push(`${totals.missingData} authorization${totals.missingData === 1 ? "" : "s"} are missing authorized hours data.`);
    return out;
  }, [generated, totals, rows]);

  /* ---- Exports ---- */
  function exportSummary() {
    downloadCsv("authorization-summary.csv",
      ["Client", "Auth #", "Payor", "Service Code", "Authorized", "Worked", "Pending", "Remaining", "Utilization %", "Expiration", "Status", "BCBA"],
      filtered.map(r => [
        r.clientName, r.authNumber, r.payor, r.serviceCode,
        fmtHrs(r.authorizedHours), fmtHrs(r.workedHours), fmtHrs(r.pendingHours), fmtHrs(r.remainingHours),
        fmtPct(r.utilization), fmtDate(r.expirationDate), r.status, r.bcba,
      ]));
    toast.success("Summary exported");
  }
  function exportRisks() {
    const risks = filtered.filter(r =>
      r.status === "Over Utilized" || r.status === "Near Exhaustion" ||
      r.status === "Expired" || (r.daysToExpire != null && r.daysToExpire >= 0 && r.daysToExpire <= 30));
    downloadCsv("authorization-risks.csv",
      ["Client", "Auth #", "Payor", "Service Code", "Remaining", "Utilization %", "Expiration", "Days Left", "Status", "BCBA"],
      risks.map(r => [
        r.clientName, r.authNumber, r.payor, r.serviceCode,
        fmtHrs(r.remainingHours), fmtPct(r.utilization), fmtDate(r.expirationDate),
        r.daysToExpire == null ? "—" : String(r.daysToExpire), r.status, r.bcba,
      ]));
    toast.success(`Risks exported (${risks.length})`);
  }
  function exportFullDetail() {
    downloadCsv("authorization-full-detail.csv", DETAIL_COLS, filtered.map(detailRow));
    toast.success("Full detail exported");
  }
  function saveSnapshot() {
    try {
      const key = "blossom.os.qa.authUtilization.snapshots.v1";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.push({
        id: crypto.randomUUID(), savedAt: new Date().toISOString(),
        fileName, totals,
        rowCount: rows.length,
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
        <div className="flex items-start gap-3">
          <Link to="/reports" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition hover:-translate-y-0.5 hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <div>
            <Badge variant="secondary" className="rounded-full bg-[hsl(265_100%_97%)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(265_70%_55%)]">
              QA · Featured Dashboard
            </Badge>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight">{pageTitle}</h1>
            <p className="text-[12.5px] text-muted-foreground">{pageSubtitle}</p>
          </div>
        </div>
        <ReportAIButton preset="auth-utilization" />
      </div>

      <CentralReachRequirementsCard
        exportName="CentralReach Authorization export (CSV or XLSX)"
        requiredColumns={[
          "ClientName / ClientId", "AuthorizationNumber", "Payor",
          "ServiceCode / CPT", "AuthorizedHours", "WorkedHours",
          "PendingHours", "RemainingHours", "StartDate", "ExpirationDate",
          "BCBA (optional)", "State (optional)",
        ]}
        filterNote="Powers both Authorization Analysis and Authorization Utilization — Hour Based. Uses the shared admin authorization dataset by default — upload a file below only if you want a one-off view."
        adminUploadsHref="/system/authorization-uploads"
        adminSourceLabel={sharedAvailable ? "Auto-loads from Admin Uploads" : "No admin dataset yet"}
      />

      <SourceCoverageBanner reportKey={["authorization", "hour-based-utilization"]} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card p-4">
        <div className="text-[12px] text-muted-foreground">
          {sharedAvailable === false
            ? "No admin-uploaded authorization dataset found. Ask an admin to upload the CentralReach authorization export via Admin → Authorization Uploads, or upload one below for a one-off view."
            : sharedAvailable
              ? "Shared admin authorization dataset is active for every user."
              : "Checking for shared admin authorization dataset…"}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadSharedAdminDataset(false)}
          disabled={sharedLoading}
        >
          <Database className="mr-1.5 h-3.5 w-3.5" />
          {sharedLoading ? "Loading…" : "Reload Admin Dataset"}
        </Button>
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
                  <p className="text-[11px] text-muted-foreground">{rows.length.toLocaleString()} authorization{rows.length === 1 ? "" : "s"} loaded</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={resetUpload}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Replace file
              </Button>
            </div>

            {missingFields.length > 0 ? (
              <div className="rounded-xl border border-rose-200/70 bg-rose-50/60 p-4">
                <div className="flex items-start gap-2 text-rose-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <div className="text-[12.5px] leading-snug">
                    <p className="font-semibold">Unable to generate this dashboard because the uploaded file is missing: {missingFields.join(", ")}.</p>
                    <p className="mt-1 text-rose-600/80">Please upload a CentralReach authorization export with client names, authorization number, authorized hours, and worked hours.</p>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => { setGenerated(true); toast.success("Authorization dashboard built"); }}
                className="h-9 rounded-full bg-[hsl(265_70%_55%)] px-5 text-[12.5px] font-semibold text-white hover:bg-[hsl(265_70%_50%)]"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Generate Authorization Dashboard
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Dashboard */}
      {generated && rows.length > 0 && (
        <>
          {/* KPIs */}
          <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map(k => <KpiTile key={k.id} kpi={k} onClick={(kpi) => kpi.drilldown && setDrill(kpi.drilldown)} />)}
          </section>

          {/* Insights + export */}
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
                <Button variant="outline" size="sm" onClick={exportSummary}><Download className="mr-1 h-3.5 w-3.5" />Auth Summary CSV</Button>
                <Button variant="outline" size="sm" onClick={exportRisks}><Download className="mr-1 h-3.5 w-3.5" />Auth Risks CSV</Button>
                <Button variant="outline" size="sm" onClick={exportFullDetail}><Download className="mr-1 h-3.5 w-3.5" />Full Drilldown CSV</Button>
                <Button variant="outline" size="sm" onClick={saveSnapshot}><Sparkles className="mr-1 h-3.5 w-3.5" />Save Snapshot</Button>
              </div>
            </div>
          </section>

          {/* Charts */}
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            {charts.map(c => <ChartCard key={c.id} chart={c} />)}
          </section>

          {/* Table */}
          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-semibold tracking-tight">Client Authorizations</h2>
                <p className="text-[11.5px] text-muted-foreground">{filtered.length} of {rows.length} authorizations</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search client or auth…" className="h-8 w-[220px] pl-8 text-[12px]" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-[170px] text-[12px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Healthy Utilization">Healthy</SelectItem>
                    <SelectItem value="Moderate Utilization">Moderate</SelectItem>
                    <SelectItem value="Low Utilization">Low</SelectItem>
                    <SelectItem value="Near Exhaustion">Near Exhaustion</SelectItem>
                    <SelectItem value="Over Utilized">Over Utilized</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Missing Data">Missing Data</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={expFilter} onValueChange={setExpFilter}>
                  <SelectTrigger className="h-8 w-[150px] text-[12px]"><SelectValue placeholder="Expiration" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any expiration</SelectItem>
                    <SelectItem value="active">Active only</SelectItem>
                    <SelectItem value="30">≤30 days</SelectItem>
                    <SelectItem value="60">≤60 days</SelectItem>
                    <SelectItem value="90">≤90 days</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                {payors.length > 0 && (
                  <Select value={payorFilter} onValueChange={setPayorFilter}>
                    <SelectTrigger className="h-8 w-[150px] text-[12px]"><SelectValue placeholder="Payor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All payors</SelectItem>
                      {payors.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {bcbas.length > 0 && (
                  <Select value={bcbaFilter} onValueChange={setBcbaFilter}>
                    <SelectTrigger className="h-8 w-[160px] text-[12px]"><SelectValue placeholder="BCBA" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All BCBAs</SelectItem>
                      {bcbas.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {codes.length > 0 && (
                  <Select value={codeFilter} onValueChange={setCodeFilter}>
                    <SelectTrigger className="h-8 w-[140px] text-[12px]"><SelectValue placeholder="Service code" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All codes</SelectItem>
                      {codes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {states.length > 0 && (
                  <Select value={stateFilter} onValueChange={setStateFilter}>
                    <SelectTrigger className="h-8 w-[110px] text-[12px]"><SelectValue placeholder="State" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All states</SelectItem>
                      {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1100px] text-[12.5px]">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-2 py-2">Client</th>
                    <th className="px-2 py-2">Auth #</th>
                    <th className="px-2 py-2">Payor</th>
                    <th className="px-2 py-2">Code</th>
                    <th className="px-2 py-2 text-right">Authorized</th>
                    <th className="px-2 py-2 text-right">Worked</th>
                    <th className="px-2 py-2 text-right">Pending</th>
                    <th className="px-2 py-2 text-right">Remaining</th>
                    <th className="px-2 py-2 text-right">Util %</th>
                    <th className="px-2 py-2">Expiration</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">BCBA</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={`${r.authNumber}-${i}`}
                        onClick={() => openAuthDrill(r)}
                        className="cursor-pointer border-b border-border/40 transition hover:bg-secondary/40">
                      <td className="px-2 py-2 font-medium">{r.clientName}</td>
                      <td className="px-2 py-2 text-muted-foreground">{r.authNumber || "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{r.payor}</td>
                      <td className="px-2 py-2 text-muted-foreground">{r.serviceCode}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{fmtHrs(r.authorizedHours)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{fmtHrs(r.workedHours)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{fmtHrs(r.pendingHours)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{fmtHrs(r.remainingHours)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{fmtPct(r.utilization)}</td>
                      <td className="px-2 py-2 text-muted-foreground">
                        {fmtDate(r.expirationDate)}
                        {r.daysToExpire != null && r.daysToExpire >= 0 && r.daysToExpire <= 30 && (
                          <span className="ml-1 text-[10px] text-amber-600">({r.daysToExpire}d)</span>
                        )}
                      </td>
                      <td className="px-2 py-2"><StatusBadge tone={STATUS_TONE[r.status]}>{r.status}</StatusBadge></td>
                      <td className="px-2 py-2 text-muted-foreground">{r.bcba}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={12} className="px-2 py-8 text-center text-[12px] text-muted-foreground">No authorizations match the current filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Drilldown drawer */}
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
    </OSShell>
  );
}

/* ===================== sub-components ===================== */

function aggregateUtil(rows: AuthRow[], keyFn: (r: AuthRow) => string) {
  const map = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    if (r.authorizedHours <= 0) continue;
    const k = keyFn(r) || "—";
    const cur = map.get(k) || { sum: 0, count: 0 };
    cur.sum += r.utilization; cur.count += 1;
    map.set(k, cur);
  }
  return [...map.entries()]
    .map(([key, v]) => ({ key, avg: v.count > 0 ? v.sum / v.count : 0, count: v.count }))
    .filter(x => x.key !== "—")
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);
}

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
        <p className="text-[14px] font-semibold">Upload a CentralReach authorization export</p>
        <p className="mt-1 text-[11.5px] text-muted-foreground">CSV or XLSX · must include client name, authorization number, authorized hours and worked hours</p>
      </div>
      <Button size="sm" onClick={() => inputRef.current?.click()} disabled={loading}
        className="rounded-full bg-[hsl(265_70%_55%)] hover:bg-[hsl(265_70%_50%)]">
        {loading ? "Parsing…" : "Choose file"}
      </Button>
      <input ref={inputRef} type="file" className="hidden" accept={SUPPORTED_EXTENSIONS} onChange={(e) => onFiles(e.target.files)} />
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