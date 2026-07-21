import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Upload, FileSpreadsheet, Sparkles, Download, Search, Database,
  AlertTriangle, CheckCircle2, X, Filter, Brain, Trash2,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { ReportAIButton } from "@/components/ai/ReportAIButton";
import { CentralReachRequirementsCard } from "@/components/reports/CentralReachRequirementsCard";
import { SourceCoverageBanner } from "@/components/reports/SourceCoverageBanner";
import CanonicalSessionsCard from "@/components/reports/CanonicalSessionsCard";
import {
  getBcbaProductivitySharedRows,
  getBcbaProductivityDatasetStatus,
  type BcbaSharedBillingRow,
} from "@/lib/os/bcbaProductivityV3/adminUploadStore";
import {
  fetchBcbaBillingRowsAsSharedShape,
  fetchCanonicalReportTotals,
  type BcbaSharedBillingRowLike,
} from "@/lib/os/reporting/canonicalReports";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { KpiTile } from "@/components/dashboards/KpiTile";
import { ChartCard } from "@/components/dashboards/ChartCard";
import { parseAnyFile, SUPPORTED_EXTENSIONS } from "@/lib/os/dashboardEngine/excelParser";
import type { KpiSpec, ChartSpec, DrilldownSpec } from "@/lib/os/dashboardEngine/types";

/* ============================================================
 * QA Supervision & Parent Training Dashboard
 * ----------------------------------------------------------------
 * Upload a CentralReach billing/service CSV and instantly compute
 * 97153 / 97155 supervision ratios and 97156 parent training
 * completion per client for a selected month.
 * ============================================================ */

const REQUIRED_FIELDS = [
  { canonical: "DateOfService", any: ["DateOfService", "Date Of Service", "Service Date", "Date"] },
  { canonical: "ClientFirstName", any: ["ClientFirstName", "Client First Name", "Client First"] },
  { canonical: "ClientLastName", any: ["ClientLastName", "Client Last Name", "Client Last"] },
  { canonical: "ProcedureCode", any: ["ProcedureCode", "Procedure Code", "ProcedureCodeDescription", "Procedure Code Description", "Code"] },
  { canonical: "TimeWorkedInHours", any: ["TimeWorkedInHours", "Time Worked In Hours", "Hours", "TimeWorkedHours"] },
];

interface ServiceRow {
  date: Date | null;
  dateRaw: string;
  monthKey: string; // YYYY-MM
  clientId: string;
  clientName: string;
  providerName: string;
  providerId: string;
  procedureCode: string; // normalized 5-digit
  procedureDescription: string;
  hours: number;
  minutes: string;
  timeFrom: string;
  timeTo: string;
  authorizationId: string;
  payorName: string;
  location: string;
  serviceLocation: string;
  units: string;
  charges: string;
  signedByProvider: string;
  signedByClient: string;
  isVoid: boolean;
  isDeleted: boolean;
  isLocked: string;
  raw: Record<string, string>;
}

interface ClientSummary {
  clientId: string;
  clientName: string;
  hours97153: number;
  hours97155: number;
  hours97156: number;
  totalHours: number;
  supervisionPct: number; // 0-1
  supervisionStatus: SupervisionStatus;
  parentTrainingStatus: "Completed" | "Missing Parent Training";
  primaryProvider: string;
  payor: string;
  rows: ServiceRow[];
}

type SupervisionStatus =
  | "Meets Threshold"
  | "Low Supervision"
  | "Critical Low Supervision"
  | "Missing Supervision"
  | "Review Data";

const SUP_STATUS_TONE: Record<SupervisionStatus, "success" | "warn" | "danger" | "default"> = {
  "Meets Threshold": "success",
  "Low Supervision": "warn",
  "Critical Low Supervision": "danger",
  "Missing Supervision": "danger",
  "Review Data": "default",
};

/* ===================== HELPERS ===================== */

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function findHeader(headers: string[], candidates: string[]): string | null {
  const map = new Map(headers.map(h => [normalizeHeader(h), h]));
  for (const c of candidates) {
    const hit = map.get(normalizeHeader(c));
    if (hit) return hit;
  }
  return null;
}
function parseDate(s: string): Date | null {
  if (!s) return null;
  const trimmed = s.trim();
  // ISO YYYY-MM-DD or YYYY-MM-DDTHH...
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(trimmed);
  if (iso) {
    const d = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  // M/D/YYYY or MM/DD/YYYY
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(trimmed);
  if (us) {
    let y = +us[3]; if (y < 100) y += 2000;
    const d = new Date(Date.UTC(y, +us[1] - 1, +us[2]));
    return isNaN(d.getTime()) ? null : d;
  }
  const fallback = new Date(trimmed);
  return isNaN(fallback.getTime()) ? null : fallback;
}
function monthKey(d: Date | null): string {
  if (!d) return "";
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(k: string): string {
  if (!k) return "—";
  const [y, m] = k.split("-");
  return new Date(Date.UTC(+y, +m - 1, 1)).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}
function extractProcedureCode(...candidates: string[]): string {
  for (const c of candidates) {
    if (!c) continue;
    const m = c.match(/\b(\d{5})\b/);
    if (m) return m[1];
  }
  return "";
}
function parseHours(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/[, ]/g, "");
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : 0;
}
function parseBool(s: string): boolean {
  const v = (s || "").toLowerCase().trim();
  return v === "true" || v === "1" || v === "yes" || v === "y" || v === "t";
}
function fmtHrs(n: number): string {
  return n.toFixed(1);
}
function fmtPct(n: number): string {
  if (!isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
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

/* ===================== PAGE ===================== */

export default function QaSupervisionPtDashboard() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const viewParam = (searchParams.get("view") || "").toLowerCase();
  const isParentTraining =
    location.pathname.endsWith("/reports/parent-training") ||
    viewParam === "parent-training" || viewParam === "pt";
  const isSupervision =
    location.pathname.endsWith("/reports/bcba-supervision") ||
    viewParam === "supervision" || viewParam === "bcba-supervision";
  const pageTitle = isParentTraining
    ? "Parent Training"
    : isSupervision
      ? "BCBA Supervision"
      : "Supervision & Parent Training Dashboard";
  const pageSubtitle = isParentTraining
    ? "97156 parent training presence, hours, and gaps by client, provider and payor. Auto-loads the shared admin billing dataset."
    : isSupervision
      ? "97153 vs 97155 supervision ratios, below-threshold clients, and BCBA supervision load. Auto-loads the shared admin billing dataset."
      : "Upload a CentralReach billing CSV for the month you want to review. Blossom OS will calculate supervision percentages and parent training completion automatically.";
  const [fileName, setFileName] = useState<string>("");
  const [allRows, setAllRows] = useState<ServiceRow[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [includeExcluded, setIncludeExcluded] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [sharedRowCount, setSharedRowCount] = useState<number | null>(null);

  // filters
  const [search, setSearch] = useState("");
  const [supStatusFilter, setSupStatusFilter] = useState<string>("all");
  const [ptStatusFilter, setPtStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [payorFilter, setPayorFilter] = useState<string>("all");

  // drilldown
  const [drill, setDrill] = useState<DrilldownSpec | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  /* ---- Auto-load shared admin billing dataset (same source as BCBA V3) ---- */
  function ingestSharedRows(shared: BcbaSharedBillingRow[], label: string) {
    const rows: ServiceRow[] = shared
      .map((r) => {
        const date = r.date ? parseDate(r.date) : null;
        return {
          date,
          dateRaw: r.date,
          monthKey: monthKey(date),
          clientId: r.clientId,
          clientName: r.clientName || "Unknown Client",
          providerName: r.renderingProvider || r.rbt || "—",
          providerId: "",
          procedureCode: extractProcedureCode(r.code),
          procedureDescription: r.code,
          hours: Number(r.hours) || 0,
          minutes: "",
          timeFrom: "",
          timeTo: "",
          authorizationId: "",
          payorName: r.payor || "",
          location: r.state || "",
          serviceLocation: "",
          units: "",
          charges: "",
          signedByProvider: "",
          signedByClient: "",
          isVoid: false,
          isDeleted: false,
          isLocked: "",
          raw: r as unknown as Record<string, string>,
        };
      })
      .filter((r) => r.procedureCode === "97153" || r.procedureCode === "97155" || r.procedureCode === "97156");
    const months = Array.from(new Set(rows.map((r) => r.monthKey).filter(Boolean))).sort();
    setAllRows(rows);
    setAvailableMonths(months);
    setSelectedMonth(months[months.length - 1] || "");
    setMissingFields([]);
    setFileName(label);
    setGenerated(false);
  }

  async function loadSharedAdminDataset(silent = false) {
    setSharedLoading(true);
    try {
      // Primary: RLS-safe canonical RPC over v_cr_canonical_sessions with
      // server-side paging. Manual uploads remain an explicit override.
      const totals = await fetchCanonicalReportTotals();
      setSharedRowCount(totals.totalRows);
      if (!totals.totalRows) {
        // Fall back to legacy storage path if canonical view is empty for any
        // reason (fresh env, indexer catching up, etc.). Legacy is still
        // RLS-safe but reads storage rather than the canonical view.
        const shared = await getBcbaProductivitySharedRows();
        setSharedRowCount(shared.length);
        if (!shared.length) {
          if (!silent) toast.info("No CentralReach rows are available yet. Upload a file above or in Admin → CentralReach Uploads.");
          return;
        }
        ingestSharedRows(shared as BcbaSharedBillingRow[], "Shared admin billing dataset (legacy)");
        if (!silent) toast.success(`Loaded ${shared.length.toLocaleString()} legacy rows`);
        return;
      }
      const shared = await fetchBcbaBillingRowsAsSharedShape({
        pageSize: 2000,
        hardCap: 60000,
      });
      ingestSharedRows(shared as unknown as BcbaSharedBillingRow[], "Canonical CentralReach dataset");
      if (!silent) {
        toast.success(
          `Loaded ${shared.length.toLocaleString()} canonical rows (${totals.h97153.toFixed(0)}h 97153 · ${totals.h97155.toFixed(0)}h 97155 · ${totals.h97156.toFixed(0)}h 97156)`,
        );
      }
    } catch (e: any) {
      if (!silent) toast.error(`Failed to load admin dataset: ${e?.message ?? e}`);
    } finally {
      setSharedLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const status = await getBcbaProductivityDatasetStatus();
        setSharedRowCount(status.activeRowCount);
        if (status.activeRowCount > 0 && !fileName) {
          await loadSharedAdminDataset(true);
        }
      } catch {
        /* silent — user can still upload manually */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      const dateH = findHeader(headers, REQUIRED_FIELDS[0].any);
      const fnH = findHeader(headers, REQUIRED_FIELDS[1].any);
      const lnH = findHeader(headers, REQUIRED_FIELDS[2].any);
      const codeH = findHeader(headers, ["ProcedureCode", "Procedure Code", "Code"]);
      const codeDescH = findHeader(headers, ["ProcedureCodeDescription", "Procedure Code Description"]);
      const hoursH = findHeader(headers, REQUIRED_FIELDS[4].any);
      const clientIdH = findHeader(headers, ["ClientId", "Client Id", "Client ID"]);
      const provFnH = findHeader(headers, ["ProviderFirstName", "Provider First Name"]);
      const provLnH = findHeader(headers, ["ProviderLastName", "Provider Last Name"]);
      const provIdH = findHeader(headers, ["ProviderId", "Provider Id"]);
      const minH = findHeader(headers, ["TimeWorkedInMins", "Time Worked In Mins", "Minutes"]);
      const fromH = findHeader(headers, ["TimeWorkedFrom", "Time From", "Start Time"]);
      const toH = findHeader(headers, ["TimeWorkedTo", "Time To", "End Time"]);
      const authH = findHeader(headers, ["AuthorizationId", "Authorization Id", "Auth Id"]);
      const payorH = findHeader(headers, ["PayorName", "Payor", "Payer", "Insurance"]);
      const locH = findHeader(headers, ["LocationCode", "Location"]);
      const locDescH = findHeader(headers, ["LocationDescription", "Location Description"]);
      const svcLocH = findHeader(headers, ["ServiceLocationName", "Service Location"]);
      const unitsH = findHeader(headers, ["UnitsOfService", "Units"]);
      const chargesH = findHeader(headers, ["ClientChargesTotal", "AmountOwed"]);
      const signProvH = findHeader(headers, ["SignedByProvider"]);
      const signClientH = findHeader(headers, ["SignedByClient"]);
      const lockedH = findHeader(headers, ["IsLocked"]);
      const voidH = findHeader(headers, ["IsVoid"]);
      const delH = findHeader(headers, ["IsDeleted"]);

      const missing: string[] = [];
      if (!dateH) missing.push("DateOfService");
      if (!fnH) missing.push("ClientFirstName");
      if (!lnH) missing.push("ClientLastName");
      if (!codeH && !codeDescH) missing.push("ProcedureCode or ProcedureCodeDescription");
      if (!hoursH) missing.push("TimeWorkedInHours");

      if (missing.length) {
        setMissingFields(missing);
        setAllRows([]);
        setAvailableMonths([]);
        setSelectedMonth("");
        setGenerated(false);
        setFileName(file.name);
        return;
      }
      setMissingFields([]);

      const rows: ServiceRow[] = first.rows.map(r => {
        const date = dateH ? parseDate(r[dateH]) : null;
        const code = extractProcedureCode(codeH ? r[codeH] : "", codeDescH ? r[codeDescH] : "");
        const desc = codeDescH ? r[codeDescH] : (codeH ? r[codeH] : "");
        const clientName = `${fnH ? r[fnH] : ""} ${lnH ? r[lnH] : ""}`.trim() || "Unknown Client";
        const providerName = `${provFnH ? r[provFnH] : ""} ${provLnH ? r[provLnH] : ""}`.trim();
        return {
          date,
          dateRaw: dateH ? r[dateH] : "",
          monthKey: monthKey(date),
          clientId: clientIdH ? r[clientIdH] : "",
          clientName,
          providerName: providerName || "—",
          providerId: provIdH ? r[provIdH] : "",
          procedureCode: code,
          procedureDescription: desc,
          hours: hoursH ? parseHours(r[hoursH]) : 0,
          minutes: minH ? r[minH] : "",
          timeFrom: fromH ? r[fromH] : "",
          timeTo: toH ? r[toH] : "",
          authorizationId: authH ? r[authH] : "",
          payorName: payorH ? r[payorH] : "",
          location: locH ? r[locH] : "",
          serviceLocation: svcLocH ? r[svcLocH] : "",
          units: unitsH ? r[unitsH] : "",
          charges: chargesH ? r[chargesH] : "",
          signedByProvider: signProvH ? r[signProvH] : "",
          signedByClient: signClientH ? r[signClientH] : "",
          isVoid: voidH ? parseBool(r[voidH]) : false,
          isDeleted: delH ? parseBool(r[delH]) : false,
          isLocked: lockedH ? r[lockedH] : "",
          raw: r,
        };
      }).filter(r => r.procedureCode === "97153" || r.procedureCode === "97155" || r.procedureCode === "97156");

      const months = Array.from(new Set(rows.map(r => r.monthKey).filter(Boolean))).sort();
      const defaultMonth = months[months.length - 1] || "";

      setAllRows(rows);
      setAvailableMonths(months);
      setSelectedMonth(defaultMonth);
      setFileName(file.name);
      setGenerated(false);
      toast.success(`Loaded ${rows.length.toLocaleString()} 97153/97155/97156 rows from ${file.name}`);
    } catch (e: any) {
      toast.error(`Failed to parse file: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  function resetUpload() {
    setFileName(""); setAllRows([]); setAvailableMonths([]); setSelectedMonth("");
    setMissingFields([]); setGenerated(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  /* ---- Filtered rows for selected month ---- */
  const monthRows = useMemo(() => {
    return allRows.filter(r => {
      if (selectedMonth && r.monthKey !== selectedMonth) return false;
      if (!includeExcluded && (r.isVoid || r.isDeleted)) return false;
      return true;
    });
  }, [allRows, selectedMonth, includeExcluded]);

  /* ---- Build client summaries ---- */
  const clientSummaries: ClientSummary[] = useMemo(() => {
    if (!generated) return [];
    const map = new Map<string, ClientSummary>();
    for (const r of monthRows) {
      const key = r.clientId || r.clientName;
      let c = map.get(key);
      if (!c) {
        c = {
          clientId: r.clientId, clientName: r.clientName,
          hours97153: 0, hours97155: 0, hours97156: 0, totalHours: 0,
          supervisionPct: 0, supervisionStatus: "Review Data",
          parentTrainingStatus: "Missing Parent Training",
          primaryProvider: "", payor: "", rows: [],
        };
        map.set(key, c);
      }
      c.rows.push(r);
      c.totalHours += r.hours;
      if (r.procedureCode === "97153") c.hours97153 += r.hours;
      if (r.procedureCode === "97155") c.hours97155 += r.hours;
      if (r.procedureCode === "97156") c.hours97156 += r.hours;
    }
    // finalize
    for (const c of map.values()) {
      c.supervisionPct = c.hours97153 > 0 ? c.hours97155 / c.hours97153 : 0;
      if (c.hours97153 === 0 && c.hours97155 > 0) c.supervisionStatus = "Review Data";
      else if (c.hours97153 > 0 && c.hours97155 === 0) c.supervisionStatus = "Missing Supervision";
      else if (c.supervisionPct < 0.05) c.supervisionStatus = "Critical Low Supervision";
      else if (c.supervisionPct < 0.10) c.supervisionStatus = "Low Supervision";
      else c.supervisionStatus = "Meets Threshold";
      c.parentTrainingStatus = c.hours97156 > 0 ? "Completed" : "Missing Parent Training";
      // primary provider = most hours in this month
      const provTotals = new Map<string, number>();
      const payorTotals = new Map<string, number>();
      for (const r of c.rows) {
        provTotals.set(r.providerName, (provTotals.get(r.providerName) || 0) + r.hours);
        if (r.payorName) payorTotals.set(r.payorName, (payorTotals.get(r.payorName) || 0) + r.hours);
      }
      c.primaryProvider = [...provTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
      c.payor = [...payorTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    }
    return [...map.values()].sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [monthRows, generated]);

  /* ---- Filter dropdown options ---- */
  const providers = useMemo(() => {
    return Array.from(new Set(clientSummaries.map(c => c.primaryProvider).filter(p => p && p !== "—"))).sort();
  }, [clientSummaries]);
  const payors = useMemo(() => {
    return Array.from(new Set(clientSummaries.map(c => c.payor).filter(p => p && p !== "—"))).sort();
  }, [clientSummaries]);

  const filteredClients = useMemo(() => {
    return clientSummaries.filter(c => {
      if (search && !c.clientName.toLowerCase().includes(search.toLowerCase()) && !c.clientId.toLowerCase().includes(search.toLowerCase())) return false;
      if (supStatusFilter !== "all" && c.supervisionStatus !== supStatusFilter) return false;
      if (ptStatusFilter !== "all" && c.parentTrainingStatus !== ptStatusFilter) return false;
      if (providerFilter !== "all" && c.primaryProvider !== providerFilter) return false;
      if (payorFilter !== "all" && c.payor !== payorFilter) return false;
      return true;
    });
  }, [clientSummaries, search, supStatusFilter, ptStatusFilter, providerFilter, payorFilter]);

  /* ---- Aggregates / KPIs ---- */
  const totals = useMemo(() => {
    let h53 = 0, h55 = 0, h56 = 0;
    for (const c of clientSummaries) { h53 += c.hours97153; h55 += c.hours97155; h56 += c.hours97156; }
    const overallSup = h53 > 0 ? h55 / h53 : 0;
    const missingSup = clientSummaries.filter(c => c.supervisionStatus === "Missing Supervision").length;
    const lowSup = clientSummaries.filter(c => c.supervisionStatus === "Low Supervision" || c.supervisionStatus === "Critical Low Supervision").length;
    const ptComplete = clientSummaries.filter(c => c.parentTrainingStatus === "Completed").length;
    const ptMissing = clientSummaries.filter(c => c.parentTrainingStatus === "Missing Parent Training").length;
    return { h53, h55, h56, overallSup, missingSup, lowSup, ptComplete, ptMissing };
  }, [clientSummaries]);

  /* ---- Drilldown helpers ---- */
  const SERVICE_COLS = [
    "Date", "Time From", "Time To", "Hours", "Mins", "Units",
    "Code", "Description", "Provider", "Auth Id", "Location",
    "Service Location", "Payor", "Signed Prov", "Signed Client",
    "Locked", "Void", "Deleted",
  ];
  function serviceRow(r: ServiceRow): (string | number)[] {
    return [
      r.dateRaw, r.timeFrom, r.timeTo, r.hours.toFixed(2), r.minutes, r.units,
      r.procedureCode, r.procedureDescription, r.providerName, r.authorizationId,
      r.location, r.serviceLocation, r.payorName, r.signedByProvider, r.signedByClient,
      r.isLocked, r.isVoid ? "Yes" : "No", r.isDeleted ? "Yes" : "No",
    ];
  }
  function openClientDrill(c: ClientSummary) {
    setDrill({
      title: `${c.clientName} · ${monthLabel(selectedMonth)}`,
      columns: SERVICE_COLS,
      rows: c.rows.map(serviceRow),
      emptyMessage: "No service rows for this client.",
    });
  }
  function openRowsDrill(title: string, rows: ServiceRow[]) {
    setDrill({
      title,
      columns: SERVICE_COLS,
      rows: rows.map(serviceRow),
      emptyMessage: "No matching service rows.",
    });
  }
  function openClientListDrill(title: string, list: ClientSummary[]) {
    setDrill({
      title,
      columns: ["Client", "Client ID", "97153 Hrs", "97155 Hrs", "Supervision %", "97156 Hrs", "PT Status", "Provider"],
      rows: list.map(c => [
        c.clientName, c.clientId, fmtHrs(c.hours97153), fmtHrs(c.hours97155),
        fmtPct(c.supervisionPct), fmtHrs(c.hours97156), c.parentTrainingStatus, c.primaryProvider,
      ]),
      emptyMessage: "No clients in this group.",
    });
  }

  /* ---- KPIs ---- */
  const activeClients = clientSummaries.length;
  const kpis: KpiSpec[] = useMemo(() => {
    if (!generated) return [];
    return [
      {
        id: "active", label: "Active Clients", value: String(activeClients), raw: activeClients,
        hint: `${monthRows.length.toLocaleString()} services in ${monthLabel(selectedMonth)}`,
        tone: "default",
      },
      {
        id: "h53", label: "Total 97153 Hours", value: fmtHrs(totals.h53), raw: totals.h53,
        hint: "Direct therapy", tone: "default",
        drilldown: { title: "All 97153 service rows", columns: SERVICE_COLS, rows: monthRows.filter(r => r.procedureCode === "97153").map(serviceRow) },
      },
      {
        id: "h55", label: "Total 97155 Hours", value: fmtHrs(totals.h55), raw: totals.h55,
        hint: "Supervision / protocol mod", tone: "default",
        drilldown: { title: "All 97155 service rows", columns: SERVICE_COLS, rows: monthRows.filter(r => r.procedureCode === "97155").map(serviceRow) },
      },
      {
        id: "sup", label: "Overall Supervision %", value: fmtPct(totals.overallSup), raw: totals.overallSup,
        hint: "97155 ÷ 97153",
        tone: totals.overallSup >= 0.10 ? "success" : totals.overallSup >= 0.05 ? "warn" : "danger",
      },
      {
        id: "missing_sup", label: "Missing Supervision", value: String(totals.missingSup), raw: totals.missingSup,
        hint: "97153 > 0, 97155 = 0",
        tone: totals.missingSup === 0 ? "success" : "danger",
        drilldown: {
          title: "Clients missing supervision",
          columns: ["Client", "Client ID", "97153 Hrs", "Provider", "Payor"],
          rows: clientSummaries.filter(c => c.supervisionStatus === "Missing Supervision")
            .map(c => [c.clientName, c.clientId, fmtHrs(c.hours97153), c.primaryProvider, c.payor]),
          emptyMessage: "Every client with 97153 hours also has 97155 supervision.",
        },
      },
      {
        id: "low_sup", label: "Low Supervision", value: String(totals.lowSup), raw: totals.lowSup,
        hint: "Below 10% threshold",
        tone: totals.lowSup === 0 ? "success" : "warn",
        drilldown: {
          title: "Clients below 10% supervision",
          columns: ["Client", "Client ID", "97153 Hrs", "97155 Hrs", "Supervision %", "Status"],
          rows: clientSummaries.filter(c => c.supervisionStatus === "Low Supervision" || c.supervisionStatus === "Critical Low Supervision")
            .map(c => [c.clientName, c.clientId, fmtHrs(c.hours97153), fmtHrs(c.hours97155), fmtPct(c.supervisionPct), c.supervisionStatus]),
          emptyMessage: "All clients meet the 10% supervision threshold.",
        },
      },
      {
        id: "pt_done", label: "Parent Training Completed", value: String(totals.ptComplete), raw: totals.ptComplete,
        hint: "Clients with 97156 hours",
        tone: "success",
        drilldown: {
          title: "Clients with parent training (97156)",
          columns: ["Client", "Client ID", "97156 Hrs", "Provider", "Payor"],
          rows: clientSummaries.filter(c => c.parentTrainingStatus === "Completed")
            .map(c => [c.clientName, c.clientId, fmtHrs(c.hours97156), c.primaryProvider, c.payor]),
        },
      },
      {
        id: "pt_missing", label: "Missing Parent Training", value: String(totals.ptMissing), raw: totals.ptMissing,
        hint: "No 97156 this month",
        tone: totals.ptMissing === 0 ? "success" : "danger",
        drilldown: {
          title: "Clients missing parent training",
          columns: ["Client", "Client ID", "97153 Hrs", "97155 Hrs", "Provider", "Payor"],
          rows: clientSummaries.filter(c => c.parentTrainingStatus === "Missing Parent Training")
            .map(c => [c.clientName, c.clientId, fmtHrs(c.hours97153), fmtHrs(c.hours97155), c.primaryProvider, c.payor]),
          emptyMessage: "Every active client received parent training this month.",
        },
      },
    ];
  }, [generated, clientSummaries, totals, monthRows, selectedMonth, activeClients]);

  /* ---- Charts ---- */
  const charts: ChartSpec[] = useMemo(() => {
    if (!generated || clientSummaries.length === 0) return [];
    const sortedBySup = [...clientSummaries].filter(c => c.hours97153 > 0)
      .sort((a, b) => a.supervisionPct - b.supervisionPct).slice(0, 12);
    const topByDirect = [...clientSummaries].sort((a, b) => b.hours97153 - a.hours97153).slice(0, 10);

    const breakdown = (["Meets Threshold", "Low Supervision", "Critical Low Supervision", "Missing Supervision", "Review Data"] as SupervisionStatus[])
      .map(s => ({ s, n: clientSummaries.filter(c => c.supervisionStatus === s).length }))
      .filter(x => x.n > 0);

    return [
      {
        id: "sup-by-client", title: "Supervision % by Client", subtitle: "Lowest 12 with direct therapy",
        type: "bar", labels: sortedBySup.map(c => c.clientName),
        series: [{ name: "Supervision %", data: sortedBySup.map(c => +(c.supervisionPct * 100).toFixed(1)) }],
        unit: "%", span: 2,
      },
      {
        id: "sup-breakdown", title: "Supervision Status Breakdown", type: "pie",
        labels: breakdown.map(b => b.s), series: [{ name: "Clients", data: breakdown.map(b => b.n) }],
      },
      {
        id: "pt-completion", title: "Parent Training Completion", type: "pie",
        labels: ["Completed", "Missing"],
        series: [{ name: "Clients", data: [totals.ptComplete, totals.ptMissing] }],
      },
      {
        id: "top-direct", title: "Top Clients by 97153 Hours", type: "bar",
        labels: topByDirect.map(c => c.clientName),
        series: [{ name: "97153 Hrs", data: topByDirect.map(c => +c.hours97153.toFixed(1)) }],
        unit: " hrs", span: 2,
      },
    ];
  }, [generated, clientSummaries, totals]);

  /* ---- AI insights (deterministic) ---- */
  const insights: string[] = useMemo(() => {
    if (!generated) return [];
    const out: string[] = [];
    out.push(`Overall supervision was ${fmtPct(totals.overallSup)} for ${monthLabel(selectedMonth)}.`);
    if (totals.missingSup > 0)
      out.push(`${totals.missingSup} client${totals.missingSup === 1 ? "" : "s"} had 97153 hours but no 97155 supervision this month.`);
    if (totals.lowSup > 0)
      out.push(`${totals.lowSup} client${totals.lowSup === 1 ? "" : "s"} fell below the 10% supervision threshold.`);
    if (activeClients > 0) {
      const pct = Math.round((totals.ptMissing / activeClients) * 100);
      out.push(`${pct}% of active clients were missing 97156 parent training.`);
    }
    const heavyLowSup = clientSummaries.filter(c => c.hours97153 >= 40 && c.supervisionPct < 0.05).length;
    if (heavyLowSup > 0)
      out.push(`${heavyLowSup} client${heavyLowSup === 1 ? "" : "s"} had 40+ direct therapy hours with less than 5% supervision.`);
    return out;
  }, [generated, totals, selectedMonth, activeClients, clientSummaries]);

  /* ---- Exports ---- */
  function exportClientCsv() {
    downloadCsv(`qa-supervision-${selectedMonth}.csv`,
      ["Client", "Client ID", "97153 Hrs", "97155 Hrs", "Supervision %", "Supervision Status", "97156 Hrs", "PT Status", "Provider", "Payor", "Total Hrs"],
      filteredClients.map(c => [
        c.clientName, c.clientId, fmtHrs(c.hours97153), fmtHrs(c.hours97155),
        fmtPct(c.supervisionPct), c.supervisionStatus, fmtHrs(c.hours97156),
        c.parentTrainingStatus, c.primaryProvider, c.payor, fmtHrs(c.totalHours),
      ]));
    toast.success("Client summary exported");
  }
  function exportDetailCsv() {
    downloadCsv(`qa-service-detail-${selectedMonth}.csv`,
      ["Client", "Client ID", ...SERVICE_COLS],
      filteredClients.flatMap(c => c.rows.map(r => [c.clientName, c.clientId, ...serviceRow(r)])));
    toast.success("Service detail exported");
  }
  function copySummary() {
    const lines = [
      `QA Supervision & Parent Training · ${monthLabel(selectedMonth)}`,
      `Active clients: ${activeClients}`,
      `Overall supervision: ${fmtPct(totals.overallSup)} (97155 ${fmtHrs(totals.h55)}h ÷ 97153 ${fmtHrs(totals.h53)}h)`,
      `Missing supervision: ${totals.missingSup} · Low supervision: ${totals.lowSup}`,
      `Parent training: ${totals.ptComplete} completed · ${totals.ptMissing} missing`,
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => toast.success("Summary copied"));
  }

  /* ===================== RENDER ===================== */

  return (
    <OSShell>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
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
        <ReportAIButton preset="supervision-pt" />
      </div>

      <CentralReachRequirementsCard
        exportName="CentralReach Billing / Service export (CSV or XLSX)"
        requiredColumns={[
          "DateOfService", "ClientFirstName", "ClientLastName",
          "ProcedureCode (97153, 97155, 97156)",
          "TimeWorkedInHours", "ProviderFirstName", "ProviderLastName",
          "PayorName",
        ]}
        filterNote="Powers both Parent Training (97156) and BCBA Supervision (97155 ÷ 97153). Uses the shared admin dataset by default — upload a file below only if you want a one-off view."
        adminUploadsHref="/admin/bcba-productivity-uploads"
        adminSourceLabel={sharedRowCount != null ? `Admin dataset: ${sharedRowCount.toLocaleString()} rows` : "Auto-loads from Admin Uploads"}
      />

      <SourceCoverageBanner reportKey={["bcba-supervision", "parent-training-97156"]} />
      <div className="mt-3">
        <CanonicalSessionsCard
          title="Auto-loaded from imported CentralReach (supervision + parent training)"
          scope={{}}
          requireScope={false}
          highlightKinds={["supervision", "parent_training"]}
          showClients={false}
        />
      </div>

      {/* Upload + month selector */}
      <section className="mt-6 rounded-3xl border border-border/60 bg-card p-6 shadow-[0_20px_50px_-30px_hsl(265_60%_50%/0.25)]">
        {!fileName ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12.5px] text-muted-foreground">
                No data loaded. Load the shared admin billing dataset or upload a CentralReach export.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadSharedAdminDataset(false)}
                disabled={sharedLoading}
              >
                <Database className="mr-1.5 h-3.5 w-3.5" />
                {sharedLoading ? "Loading…" : "Load Admin Dataset"}
              </Button>
            </div>
            <UploadDropzone
              inputRef={inputRef}
              dragOver={dragOver}
              setDragOver={setDragOver}
              onFiles={handleFiles}
              loading={loading}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(265_100%_97%)] text-[hsl(265_70%_55%)]">
                  <FileSpreadsheet className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold">{fileName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {allRows.length.toLocaleString()} 97153 / 97155 / 97156 rows · {availableMonths.length} month{availableMonths.length === 1 ? "" : "s"} detected
                  </p>
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
                    <p className="font-semibold">Unable to generate this QA Dashboard because the uploaded CSV is missing: {missingFields.join(", ")}.</p>
                    <p className="mt-1 text-rose-600/80">Please upload a CentralReach billing/service CSV with service dates, client names, procedure codes, and worked hours.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[200px]">
                  <label className="block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Month</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="mt-1 h-9 w-[220px]"><SelectValue placeholder="Select month" /></SelectTrigger>
                    <SelectContent>
                      {availableMonths.map(m => <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2">
                  <Switch checked={includeExcluded} onCheckedChange={setIncludeExcluded} id="incl-excl" />
                  <label htmlFor="incl-excl" className="text-[12px] font-medium">Show excluded rows (void/deleted)</label>
                </div>
                <Button
                  onClick={() => { setGenerated(true); toast.success(`Dashboard built for ${monthLabel(selectedMonth)}`); }}
                  disabled={!selectedMonth}
                  className="h-9 rounded-full bg-[hsl(265_70%_55%)] px-5 text-[12.5px] font-semibold text-white hover:bg-[hsl(265_70%_50%)]"
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Generate QA Dashboard
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Dashboard */}
      {generated && clientSummaries.length > 0 && (
        <>
          {/* KPIs */}
          <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map(k => <KpiTile key={k.id} kpi={k} onClick={(kpi) => kpi.drilldown && setDrill(kpi.drilldown)} />)}
          </section>

          {/* Insights + export bar */}
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
                <Button variant="outline" size="sm" onClick={exportClientCsv}><Download className="mr-1 h-3.5 w-3.5" />Client Summary CSV</Button>
                <Button variant="outline" size="sm" onClick={exportDetailCsv}><Download className="mr-1 h-3.5 w-3.5" />Detail CSV</Button>
                <Button variant="outline" size="sm" onClick={copySummary}><Sparkles className="mr-1 h-3.5 w-3.5" />Copy QA Summary</Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}><Download className="mr-1 h-3.5 w-3.5" />Print / PDF</Button>
              </div>
            </div>
          </section>

          {/* Charts */}
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            {charts.map(c => <ChartCard key={c.id} chart={c} />)}
          </section>

          {/* Client table */}
          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-semibold tracking-tight">Client Summary</h2>
                <p className="text-[11.5px] text-muted-foreground">{filteredClients.length} of {clientSummaries.length} clients · {monthLabel(selectedMonth)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search client…" className="h-8 w-[200px] pl-8 text-[12px]" />
                </div>
                <Select value={supStatusFilter} onValueChange={setSupStatusFilter}>
                  <SelectTrigger className="h-8 w-[170px] text-[12px]"><SelectValue placeholder="Supervision" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All supervision</SelectItem>
                    <SelectItem value="Meets Threshold">Meets Threshold</SelectItem>
                    <SelectItem value="Low Supervision">Low Supervision</SelectItem>
                    <SelectItem value="Critical Low Supervision">Critical Low</SelectItem>
                    <SelectItem value="Missing Supervision">Missing</SelectItem>
                    <SelectItem value="Review Data">Review Data</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={ptStatusFilter} onValueChange={setPtStatusFilter}>
                  <SelectTrigger className="h-8 w-[180px] text-[12px]"><SelectValue placeholder="Parent Training" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All parent training</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Missing Parent Training">Missing</SelectItem>
                  </SelectContent>
                </Select>
                {providers.length > 0 && (
                  <Select value={providerFilter} onValueChange={setProviderFilter}>
                    <SelectTrigger className="h-8 w-[160px] text-[12px]"><SelectValue placeholder="Provider" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All providers</SelectItem>
                      {providers.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {payors.length > 0 && (
                  <Select value={payorFilter} onValueChange={setPayorFilter}>
                    <SelectTrigger className="h-8 w-[150px] text-[12px]"><SelectValue placeholder="Payor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All payors</SelectItem>
                      {payors.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] text-[12.5px]">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-2 py-2">Client</th>
                    <th className="px-2 py-2">Client ID</th>
                    <th className="px-2 py-2 text-right">97153</th>
                    <th className="px-2 py-2 text-right">97155</th>
                    <th className="px-2 py-2 text-right">Sup %</th>
                    <th className="px-2 py-2">Supervision</th>
                    <th className="px-2 py-2 text-right">97156</th>
                    <th className="px-2 py-2">Parent Training</th>
                    <th className="px-2 py-2">Provider</th>
                    <th className="px-2 py-2">Payor</th>
                    <th className="px-2 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map(c => (
                    <tr key={c.clientId + c.clientName}
                        onClick={() => openClientDrill(c)}
                        className="cursor-pointer border-b border-border/40 transition hover:bg-secondary/40">
                      <td className="px-2 py-2 font-medium">{c.clientName}</td>
                      <td className="px-2 py-2 text-muted-foreground">{c.clientId || "—"}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{fmtHrs(c.hours97153)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{fmtHrs(c.hours97155)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{fmtPct(c.supervisionPct)}</td>
                      <td className="px-2 py-2"><StatusBadge tone={SUP_STATUS_TONE[c.supervisionStatus]}>{c.supervisionStatus}</StatusBadge></td>
                      <td className="px-2 py-2 text-right tabular-nums">{fmtHrs(c.hours97156)}</td>
                      <td className="px-2 py-2">
                        <StatusBadge tone={c.parentTrainingStatus === "Completed" ? "success" : "danger"}>
                          {c.parentTrainingStatus === "Completed" ? "Completed" : "Missing"}
                        </StatusBadge>
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">{c.primaryProvider}</td>
                      <td className="px-2 py-2 text-muted-foreground">{c.payor}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{fmtHrs(c.totalHours)}</td>
                    </tr>
                  ))}
                  {filteredClients.length === 0 && (
                    <tr><td colSpan={11} className="px-2 py-8 text-center text-[12px] text-muted-foreground">No clients match the current filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {generated && clientSummaries.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border/60 bg-card p-10 text-center">
          <p className="text-[14px] font-semibold">No 97153 / 97155 / 97156 service rows for {monthLabel(selectedMonth)}.</p>
          <p className="mt-1 text-[12px] text-muted-foreground">Try another month or upload a different CentralReach export.</p>
        </div>
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
        <p className="text-[14px] font-semibold">Upload a CentralReach billing CSV</p>
        <p className="mt-1 text-[11.5px] text-muted-foreground">CSV or XLSX · must include DateOfService, Client name, ProcedureCode and TimeWorkedInHours</p>
      </div>
      <Button
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="rounded-full bg-[hsl(265_70%_55%)] hover:bg-[hsl(265_70%_50%)]"
      >
        {loading ? "Parsing…" : "Choose file"}
      </Button>
      <input
        ref={inputRef} type="file" className="hidden"
        accept={SUPPORTED_EXTENSIONS}
        onChange={(e) => onFiles(e.target.files)}
      />
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