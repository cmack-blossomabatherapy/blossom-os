import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Upload, FileSpreadsheet, Sparkles, Download, Search,
  AlertTriangle, CheckCircle2, Brain, Trash2,
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
import {
  loadSharedDataset,
  type SharedDatasetLoadResult,
} from "@/lib/os/reporting/sharedDatasetLoader";
import { downloadSharedReportDatasetFile } from "@/lib/os/sharedReportDatasets";
import {
  SharedDatasetStatusPanel,
  type SharedSourceMode,
} from "@/components/reports/SharedDatasetStatusPanel";

/* ============================================================
 * QA Session Cancellation Dashboard
 * Upload a CentralReach Scheduling Cancellation export and
 * instantly analyze cancellation trends, reasons, provider
 * impacts, and client risks.
 * ============================================================ */

type Category =
  | "Client Cancellation"
  | "Provider Cancellation"
  | "No Show"
  | "Transportation"
  | "Illness"
  | "Weather"
  | "Scheduling Conflict"
  | "Holiday"
  | "Other"
  | "Unknown";

const CATEGORY_TONE: Record<Category, "success" | "warn" | "danger" | "default"> = {
  "Client Cancellation": "warn",
  "Provider Cancellation": "danger",
  "No Show": "danger",
  "Transportation": "default",
  "Illness": "warn",
  "Weather": "default",
  "Scheduling Conflict": "warn",
  "Holiday": "default",
  "Other": "default",
  "Unknown": "default",
};

interface CancelRow {
  date: Date | null;
  dateRaw: string;
  weekKey: string;
  monthKey: string;
  clientId: string;
  clientName: string;
  providerName: string;
  procedureCode: string;
  procedureDescription: string;
  state: string;
  location: string;
  payor: string;
  reasonRaw: string;
  category: Category;
  cancelledBy: string;
  notes: string;
  raw: Record<string, string>;
}

/* ===================== HELPERS ===================== */

function normalizeHeader(h: string) { return h.toLowerCase().replace(/[^a-z0-9]/g, ""); }
function findHeader(headers: string[], candidates: string[]): string | null {
  const map = new Map(headers.map(h => [normalizeHeader(h), h]));
  for (const c of candidates) { const hit = map.get(normalizeHeader(c)); if (hit) return hit; }
  return null;
}
function parseDate(s: string): Date | null {
  if (!s) return null;
  const t = s.trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t);
  if (iso) { const d = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3])); return isNaN(d.getTime()) ? null : d; }
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(t);
  if (us) { let y = +us[3]; if (y < 100) y += 2000; const d = new Date(Date.UTC(y, +us[1] - 1, +us[2])); return isNaN(d.getTime()) ? null : d; }
  const fb = new Date(t); return isNaN(fb.getTime()) ? null : fb;
}
function monthKey(d: Date | null) {
  if (!d) return "";
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function weekKey(d: Date | null) {
  if (!d) return "";
  // ISO-ish week starting Monday in UTC
  const day = d.getUTCDay() || 7;
  const monday = new Date(d); monday.setUTCDate(d.getUTCDate() - (day - 1));
  return `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, "0")}-${String(monday.getUTCDate()).padStart(2, "0")}`;
}
function extractProcedureCode(s: string): string {
  if (!s) return "";
  const m = s.match(/\b(\d{5})\b/); return m ? m[1] : "";
}
function fmtDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
function fmtPct(n: number) { return isFinite(n) ? `${(n * 100).toFixed(1)}%` : "—"; }
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

function classify(reasonRaw: string, cancelledBy: string): Category {
  const r = (reasonRaw || "").toLowerCase();
  const by = (cancelledBy || "").toLowerCase();
  if (/no[\s-]?show|nos$/i.test(r) || /no[\s-]?show/.test(by)) return "No Show";
  if (/weather|snow|storm|hurricane|ice|rain/.test(r)) return "Weather";
  if (/ill|sick|fever|covid|flu|hospital|medical/.test(r)) return "Illness";
  if (/transport|ride|car|vehicle|uber|bus/.test(r)) return "Transportation";
  if (/holiday|vacation/.test(r)) return "Holiday";
  if (/conflict|overlap|double[\s-]?book|reschedul/.test(r)) return "Scheduling Conflict";
  if (/provider|bcba|rbt|staff|therapist|tech|call[\s-]?out|callout/.test(r) || /provider|bcba|rbt|staff/.test(by)) return "Provider Cancellation";
  if (/client|parent|guardian|family|caregiver/.test(r) || /client|parent|guardian|family|caregiver/.test(by)) return "Client Cancellation";
  if (!r && !by) return "Unknown";
  return "Other";
}

/* ===================== PAGE ===================== */

export default function QaCancellationDashboard() {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<CancelRow[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [payorFilter, setPayorFilter] = useState("all");
  const [codeFilter, setCodeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [drill, setDrill] = useState<DrilldownSpec | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const [sharedLoading, setSharedLoading] = useState(false);
  const [sourceMode, setSourceMode] = useState<SharedSourceMode>("none");
  const [sharedResult, setSharedResult] = useState<SharedDatasetLoadResult>({
    key: "cancellation-scheduling",
    status: "idle",
    ageDays: null,
    stale: false,
    dataset: null,
    parsed: null,
    inspection: null,
    missingFields: [],
    errorMessage: null,
  });

  /* ---- Upload ---- */
  async function handleFiles(files: FileList | File[] | null, opts?: { fromShared?: boolean }) {
    if (!files || !files[0]) return;
    const file = files[0];
    setLoading(true);
    try {
      const parsed = await parseAnyFile(file);
      const first = parsed[0];
      if (!first) throw new Error("No data in file.");
      const headers = first.headers;

      const dateH = findHeader(headers, ["Date", "AppointmentDate", "Appointment Date", "DateOfService", "Date Of Service", "ServiceDate", "Service Date", "ScheduledDate", "Scheduled Date"]);
      const clientFnH = findHeader(headers, ["ClientFirstName", "Client First Name", "Client First"]);
      const clientLnH = findHeader(headers, ["ClientLastName", "Client Last Name", "Client Last"]);
      const clientFullH = findHeader(headers, ["ClientName", "Client Name", "Client"]);
      const clientIdH = findHeader(headers, ["ClientId", "Client Id", "Client ID"]);
      const provFnH = findHeader(headers, ["ProviderFirstName", "Provider First Name"]);
      const provLnH = findHeader(headers, ["ProviderLastName", "Provider Last Name"]);
      const provFullH = findHeader(headers, ["ProviderName", "Provider Name", "Provider", "StaffName", "Staff"]);
      const codeH = findHeader(headers, ["ProcedureCode", "Procedure Code", "ServiceCode", "Service Code", "CPTCode", "CPT Code", "Code"]);
      const codeDescH = findHeader(headers, ["ProcedureCodeDescription", "Procedure Code Description", "ServiceCodeDescription", "Service Description"]);
      const stateH = findHeader(headers, ["State", "ClientState", "Client State"]);
      const locH = findHeader(headers, ["LocationDescription", "Location Description", "LocationCode", "Location", "ServiceLocationName", "Service Location"]);
      const payorH = findHeader(headers, ["PayorName", "Payor", "Payer", "PayerName", "Insurance"]);
      const reasonH = findHeader(headers, ["CancellationReason", "Cancellation Reason", "Reason", "CancelReason", "Cancel Reason", "ReasonForCancellation"]);
      const categoryH = findHeader(headers, ["CancellationCategory", "Cancellation Category", "Category", "CancellationType", "Cancellation Type"]);
      const cancelByH = findHeader(headers, ["CancelledBy", "Cancelled By", "CanceledBy", "Canceled By", "CancellationBy"]);
      const notesH = findHeader(headers, ["SchedulingNotes", "Scheduling Notes", "Notes", "Comments", "Note"]);

      const missing: string[] = [];
      if (!dateH) missing.push("Date / Appointment Date");
      if (!clientFullH && !(clientFnH && clientLnH)) missing.push("ClientName (or ClientFirstName + ClientLastName)");
      if (!reasonH && !categoryH) missing.push("CancellationReason or CancellationCategory");

      if (missing.length) {
        setMissingFields(missing); setRows([]); setGenerated(false); setFileName(file.name);
        return;
      }
      setMissingFields([]);

      const out: CancelRow[] = first.rows.map(r => {
        const date = dateH ? parseDate(r[dateH]) : null;
        const clientName = clientFullH
          ? r[clientFullH]
          : `${clientFnH ? r[clientFnH] : ""} ${clientLnH ? r[clientLnH] : ""}`.trim();
        const providerName = provFullH
          ? r[provFullH]
          : `${provFnH ? r[provFnH] : ""} ${provLnH ? r[provLnH] : ""}`.trim();
        const reasonRaw = reasonH ? r[reasonH] : (categoryH ? r[categoryH] : "");
        const cancelledBy = cancelByH ? r[cancelByH] : "";
        const categoryRaw = categoryH ? r[categoryH] : "";
        // Prefer explicit category if recognizable, otherwise classify
        const fromExplicit = classify(categoryRaw, cancelledBy);
        const cat = fromExplicit !== "Unknown" && fromExplicit !== "Other"
          ? fromExplicit
          : classify(reasonRaw, cancelledBy);

        const codeRaw = codeH ? r[codeH] : (codeDescH ? r[codeDescH] : "");
        return {
          date,
          dateRaw: dateH ? r[dateH] : "",
          weekKey: weekKey(date),
          monthKey: monthKey(date),
          clientId: clientIdH ? r[clientIdH] : "",
          clientName: clientName || "Unknown Client",
          providerName: providerName || "—",
          procedureCode: extractProcedureCode(codeRaw) || "—",
          procedureDescription: codeDescH ? r[codeDescH] : codeRaw,
          state: stateH ? r[stateH] : "",
          location: locH ? r[locH] : "",
          payor: payorH ? r[payorH] : "—",
          reasonRaw,
          category: cat,
          cancelledBy: cancelledBy || "—",
          notes: notesH ? r[notesH] : "",
          raw: r,
        };
      }).filter(r => r.clientName);

      setRows(out);
      setFileName(file.name);
      setGenerated(false);
      setSourceMode(opts?.fromShared ? "shared" : "manual-override");
      toast.success(`Loaded ${out.length.toLocaleString()} cancellations from ${file.name}`);
    } catch (e: any) {
      toast.error(`Failed to parse file: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  function resetUpload() {
    setFileName(""); setRows([]); setMissingFields([]); setGenerated(false);
    setSourceMode("none");
    if (inputRef.current) inputRef.current.value = "";
  }

  /* ---- Shared admin dataset auto-load ---- */
  async function loadSharedAdminDataset(silent = false) {
    setSharedLoading(true);
    try {
      const result = await loadSharedDataset("cancellation-scheduling", {
        requiredFields: ["client_name", "service_date"],
      });
      setSharedResult(result);
      if (result.status !== "ready" || !result.dataset) {
        if (!silent && result.status === "missing") {
          toast.info("No admin-uploaded cancellation dataset found.");
        } else if (!silent && result.errorMessage) {
          toast.error(result.errorMessage);
        }
        return;
      }
      const file = await downloadSharedReportDatasetFile(result.dataset);
      await handleFiles([file], { fromShared: true });
      setGenerated(true);
      if (!silent) toast.success(`Loaded admin dataset: ${result.dataset.fileName}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSharedResult((prev) => ({ ...prev, status: "error", errorMessage: msg }));
      if (!silent) toast.error(`Failed to load admin dataset: ${msg}`);
    } finally {
      setSharedLoading(false);
    }
  }

  async function resetToShared() {
    resetUpload();
    await loadSharedAdminDataset(false);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSharedLoading(true);
      try {
        const result = await loadSharedDataset("cancellation-scheduling", {
          requiredFields: ["client_name", "service_date"],
        });
        if (cancelled) return;
        setSharedResult(result);
        if (result.status === "ready" && result.dataset && !fileName) {
          await loadSharedAdminDataset(true);
        }
      } catch (err) {
        if (!cancelled) {
          setSharedResult((prev) => ({
            ...prev,
            status: "error",
            errorMessage: err instanceof Error ? err.message : String(err),
          }));
        }
      } finally {
        if (!cancelled) setSharedLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Dropdown options ---- */
  const providers = useMemo(() => Array.from(new Set(rows.map(r => r.providerName).filter(p => p && p !== "—"))).sort(), [rows]);
  const clients = useMemo(() => Array.from(new Set(rows.map(r => r.clientName))).sort(), [rows]);
  const states = useMemo(() => Array.from(new Set(rows.map(r => r.state).filter(Boolean))).sort(), [rows]);
  const payors = useMemo(() => Array.from(new Set(rows.map(r => r.payor).filter(p => p && p !== "—"))).sort(), [rows]);
  const codes = useMemo(() => Array.from(new Set(rows.map(r => r.procedureCode).filter(c => c && c !== "—"))).sort(), [rows]);
  const locations = useMemo(() => Array.from(new Set(rows.map(r => r.location).filter(Boolean))).sort(), [rows]);

  /* ---- Filtered rows ---- */
  const fromDate = useMemo(() => dateFrom ? parseDate(dateFrom) : null, [dateFrom]);
  const toDate = useMemo(() => dateTo ? parseDate(dateTo) : null, [dateTo]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (search) {
        const s = search.toLowerCase();
        if (!r.clientName.toLowerCase().includes(s) && !r.providerName.toLowerCase().includes(s) && !r.reasonRaw.toLowerCase().includes(s)) return false;
      }
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (providerFilter !== "all" && r.providerName !== providerFilter) return false;
      if (clientFilter !== "all" && r.clientName !== clientFilter) return false;
      if (stateFilter !== "all" && r.state !== stateFilter) return false;
      if (payorFilter !== "all" && r.payor !== payorFilter) return false;
      if (codeFilter !== "all" && r.procedureCode !== codeFilter) return false;
      if (locationFilter !== "all" && r.location !== locationFilter) return false;
      if (fromDate && r.date && r.date < fromDate) return false;
      if (toDate && r.date && r.date > toDate) return false;
      return true;
    });
  }, [rows, search, categoryFilter, providerFilter, clientFilter, stateFilter, payorFilter, codeFilter, locationFilter, fromDate, toDate]);

  /* ---- Aggregates ---- */
  function countByCategory(cat: Category) { return rows.filter(r => r.category === cat).length; }
  function clientCounts(): Map<string, number> {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.clientName, (m.get(r.clientName) || 0) + 1);
    return m;
  }
  function providerCounts(): Map<string, number> {
    const m = new Map<string, number>();
    for (const r of rows) if (r.providerName && r.providerName !== "—") m.set(r.providerName, (m.get(r.providerName) || 0) + 1);
    return m;
  }

  const totals = useMemo(() => {
    const clientC = clientCounts();
    const providerC = providerCounts();
    const totalSessions = rows.length;
    const clientCancels = countByCategory("Client Cancellation");
    const providerCancels = countByCategory("Provider Cancellation");
    const noShows = countByCategory("No Show");
    const weather = countByCategory("Weather");
    const illness = countByCategory("Illness");
    const cancellationRate = totalSessions > 0 ? totalSessions / Math.max(totalSessions, 1) : 0; // baseline 100% since file = cancellations
    const mostCancelledClient = [...clientC.entries()].sort((a, b) => b[1] - a[1])[0];
    const mostCancelledProvider = [...providerC.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      totalSessions, clientCancels, providerCancels, noShows, weather, illness,
      cancellationRate,
      mostCancelledClient: mostCancelledClient ? { name: mostCancelledClient[0], count: mostCancelledClient[1] } : null,
      mostCancelledProvider: mostCancelledProvider ? { name: mostCancelledProvider[0], count: mostCancelledProvider[1] } : null,
      uniqueClients: clientC.size,
      uniqueProviders: providerC.size,
      clientC, providerC,
    };
  }, [rows]);

  /* ---- Drilldown helpers ---- */
  const DETAIL_COLS = ["Date", "Client", "Provider", "Code", "State", "Location", "Reason", "Category", "Cancelled By", "Payor", "Notes"];
  function detailRow(r: CancelRow): (string | number)[] {
    return [
      r.dateRaw || fmtDate(r.date), r.clientName, r.providerName, r.procedureCode,
      r.state, r.location, r.reasonRaw, r.category, r.cancelledBy, r.payor, r.notes,
    ];
  }
  function openRowsDrill(title: string, list: CancelRow[]) {
    setDrill({ title, columns: DETAIL_COLS, rows: list.map(detailRow), emptyMessage: "No cancellations in this group." });
  }

  /* ---- KPIs ---- */
  const kpis: KpiSpec[] = useMemo(() => {
    if (!generated) return [];
    const clientList = [...totals.clientC.entries()].sort((a, b) => b[1] - a[1]);
    const providerList = [...totals.providerC.entries()].sort((a, b) => b[1] - a[1]);
    return [
      { id: "total", label: "Total Cancelled Sessions", value: String(totals.totalSessions), raw: totals.totalSessions, hint: "All cancellations", tone: "default",
        drilldown: { title: "All cancellations", columns: DETAIL_COLS, rows: rows.map(detailRow) } },
      { id: "client", label: "Client Cancellations", value: String(totals.clientCancels), raw: totals.clientCancels, hint: "Cancelled by client/parent", tone: totals.clientCancels > 0 ? "warn" : "success",
        drilldown: { title: "Client cancellations", columns: DETAIL_COLS, rows: rows.filter(r => r.category === "Client Cancellation").map(detailRow) } },
      { id: "provider", label: "Provider Cancellations", value: String(totals.providerCancels), raw: totals.providerCancels, hint: "Cancelled by provider/staff", tone: totals.providerCancels > 0 ? "danger" : "success",
        drilldown: { title: "Provider cancellations", columns: DETAIL_COLS, rows: rows.filter(r => r.category === "Provider Cancellation").map(detailRow) } },
      { id: "noshow", label: "No Shows", value: String(totals.noShows), raw: totals.noShows, hint: "Client did not attend", tone: totals.noShows > 0 ? "danger" : "success",
        drilldown: { title: "No shows", columns: DETAIL_COLS, rows: rows.filter(r => r.category === "No Show").map(detailRow) } },
      { id: "weather", label: "Weather Related", value: String(totals.weather), raw: totals.weather, hint: "Weather-driven", tone: "default",
        drilldown: { title: "Weather cancellations", columns: DETAIL_COLS, rows: rows.filter(r => r.category === "Weather").map(detailRow) } },
      { id: "illness", label: "Illness Related", value: String(totals.illness), raw: totals.illness, hint: "Illness/medical", tone: totals.illness > 0 ? "warn" : "default",
        drilldown: { title: "Illness cancellations", columns: DETAIL_COLS, rows: rows.filter(r => r.category === "Illness").map(detailRow) } },
      { id: "top-client", label: "Most Cancelled Client",
        value: totals.mostCancelledClient ? `${totals.mostCancelledClient.count}` : "—",
        raw: totals.mostCancelledClient?.count ?? 0,
        hint: totals.mostCancelledClient?.name ?? "No data", tone: "warn",
        drilldown: totals.mostCancelledClient ? { title: totals.mostCancelledClient.name + " · cancellations", columns: DETAIL_COLS,
          rows: rows.filter(r => r.clientName === totals.mostCancelledClient!.name).map(detailRow) } : undefined },
      { id: "top-provider", label: "Most Cancelled Provider",
        value: totals.mostCancelledProvider ? `${totals.mostCancelledProvider.count}` : "—",
        raw: totals.mostCancelledProvider?.count ?? 0,
        hint: totals.mostCancelledProvider?.name ?? "No data", tone: "danger",
        drilldown: totals.mostCancelledProvider ? { title: totals.mostCancelledProvider.name + " · cancellations", columns: DETAIL_COLS,
          rows: rows.filter(r => r.providerName === totals.mostCancelledProvider!.name).map(detailRow) } : undefined },
      { id: "rate", label: "Cancellation Rate", value: fmtPct(totals.totalSessions > 0 ? totals.cancellationRate : 0),
        raw: totals.cancellationRate, hint: "Of uploaded sessions", tone: "default" },
      { id: "unique-clients", label: "Unique Clients Impacted", value: String(totals.uniqueClients), raw: totals.uniqueClients, hint: "Distinct clients", tone: "default",
        drilldown: { title: "Clients impacted",
          columns: ["Client", "Cancellations"],
          rows: clientList.map(([n, c]) => [n, c] as (string | number)[]) } },
      { id: "unique-providers", label: "Unique Providers Impacted", value: String(totals.uniqueProviders), raw: totals.uniqueProviders, hint: "Distinct providers", tone: "default",
        drilldown: { title: "Providers impacted",
          columns: ["Provider", "Cancellations"],
          rows: providerList.map(([n, c]) => [n, c] as (string | number)[]) } },
    ];
  }, [generated, rows, totals]);

  /* ---- Charts ---- */
  const charts: ChartSpec[] = useMemo(() => {
    if (!generated || rows.length === 0) return [];

    // Trend by week
    const weekMap = new Map<string, number>();
    for (const r of rows) if (r.weekKey) weekMap.set(r.weekKey, (weekMap.get(r.weekKey) || 0) + 1);
    const weeks = [...weekMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    // Trend by month
    const monthMap = new Map<string, number>();
    for (const r of rows) if (r.monthKey) monthMap.set(r.monthKey, (monthMap.get(r.monthKey) || 0) + 1);
    const months = [...monthMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    // Top reasons (by category)
    const CATS: Category[] = ["Client Cancellation", "Provider Cancellation", "No Show", "Illness", "Weather", "Transportation", "Scheduling Conflict", "Holiday", "Other", "Unknown"];
    const reasons = CATS.map(c => ({ c, n: rows.filter(r => r.category === c).length })).filter(x => x.n > 0).sort((a, b) => b.n - a.n);

    // By provider top 10
    const provTop = [...totals.providerC.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    const clientTop = [...totals.clientC.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

    const byState = aggregateCount(rows, r => r.state);
    const byPayor = aggregateCount(rows, r => r.payor);
    const byCode = aggregateCount(rows, r => r.procedureCode);

    return [
      { id: "trend-week", title: "Cancellation Trend by Week", type: "line",
        labels: weeks.map(([k]) => k.slice(5)), series: [{ name: "Cancellations", data: weeks.map(([, n]) => n) }], span: 2 },
      { id: "trend-month", title: "Cancellation Trend by Month", type: "bar",
        labels: months.map(([k]) => k), series: [{ name: "Cancellations", data: months.map(([, n]) => n) }] },
      { id: "reasons", title: "Top Cancellation Reasons", type: "pie",
        labels: reasons.map(x => x.c), series: [{ name: "Cancellations", data: reasons.map(x => x.n) }] },
      { id: "by-provider", title: "Cancellation by Provider", subtitle: "Top 10", type: "bar",
        labels: provTop.map(([n]) => n), series: [{ name: "Cancellations", data: provTop.map(([, n]) => n) }], span: 2 },
      { id: "by-client", title: "Cancellation by Client", subtitle: "Top 10", type: "bar",
        labels: clientTop.map(([n]) => n), series: [{ name: "Cancellations", data: clientTop.map(([, n]) => n) }], span: 2 },
      { id: "by-state", title: "Cancellation by State", type: "bar",
        labels: byState.map(x => x.key), series: [{ name: "Cancellations", data: byState.map(x => x.n) }] },
      { id: "by-payor", title: "Cancellation by Payor", type: "bar",
        labels: byPayor.map(x => x.key), series: [{ name: "Cancellations", data: byPayor.map(x => x.n) }] },
      { id: "by-code", title: "Cancellation by Service Code", type: "bar",
        labels: byCode.map(x => x.key), series: [{ name: "Cancellations", data: byCode.map(x => x.n) }] },
    ];
  }, [generated, rows, totals]);

  /* ---- Risk groups ---- */
  const clientRisks = useMemo(() => {
    if (!generated) return { three: [] as { name: string; count: number }[], five: [] as { name: string; count: number }[], noShow: [] as { name: string; count: number }[] };
    const list = [...totals.clientC.entries()].map(([name, count]) => ({ name, count }));
    const noShowMap = new Map<string, number>();
    for (const r of rows) if (r.category === "No Show") noShowMap.set(r.clientName, (noShowMap.get(r.clientName) || 0) + 1);
    return {
      three: list.filter(x => x.count >= 3 && x.count < 5).sort((a, b) => b.count - a.count),
      five: list.filter(x => x.count >= 5).sort((a, b) => b.count - a.count),
      noShow: [...noShowMap.entries()].filter(([, n]) => n >= 2).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    };
  }, [generated, rows, totals]);

  const providerRisks = useMemo(() => {
    if (!generated) return { top: [] as { name: string; count: number }[], repeated: [] as { name: string; count: number }[] };
    const providerCancelMap = new Map<string, number>();
    for (const r of rows) if (r.category === "Provider Cancellation" && r.providerName && r.providerName !== "—") {
      providerCancelMap.set(r.providerName, (providerCancelMap.get(r.providerName) || 0) + 1);
    }
    const list = [...providerCancelMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    return {
      top: list.slice(0, 10),
      repeated: list.filter(x => x.count >= 3),
    };
  }, [generated, rows]);

  /* ---- AI Insights ---- */
  const insights = useMemo(() => {
    if (!generated) return [];
    const out: string[] = [];
    const total = totals.totalSessions || 1;
    out.push(`${totals.totalSessions.toLocaleString()} total cancellations across ${totals.uniqueClients} client${totals.uniqueClients === 1 ? "" : "s"} and ${totals.uniqueProviders} provider${totals.uniqueProviders === 1 ? "" : "s"}.`);
    if (totals.illness > 0) out.push(`Illness accounted for ${fmtPct(totals.illness / total)} of all cancellations.`);
    if (totals.providerCancels > 0) out.push(`${fmtPct(totals.providerCancels / total)} of cancellations were provider-driven (${totals.providerCancels}).`);
    if (totals.noShows > 0) out.push(`${totals.noShows} no-show${totals.noShows === 1 ? "" : "s"} recorded — review attendance plans.`);
    if (clientRisks.five.length > 0) out.push(`${clientRisks.five.length} client${clientRisks.five.length === 1 ? " has" : "s have"} 5 or more cancellations.`);
    else if (clientRisks.three.length > 0) out.push(`${clientRisks.three.length} client${clientRisks.three.length === 1 ? " has" : "s have"} 3 or more cancellations.`);
    // top state
    const byState = aggregateCount(rows, r => r.state);
    if (byState.length > 0) out.push(`${byState[0].key} generated the highest cancellation volume (${byState[0].n}).`);
    const byCode = aggregateCount(rows, r => r.procedureCode);
    if (byCode.length > 0) out.push(`${byCode[0].key} sessions represented ${fmtPct(byCode[0].n / total)} of all cancelled appointments.`);
    if (totals.mostCancelledProvider) out.push(`${totals.mostCancelledProvider.name} has the highest cancellation count (${totals.mostCancelledProvider.count}).`);
    return out;
  }, [generated, rows, totals, clientRisks]);

  /* ---- Exports ---- */
  function exportSummary() {
    downloadCsv("cancellation-summary.csv",
      ["Category", "Count", "% of Total"],
      (["Client Cancellation", "Provider Cancellation", "No Show", "Illness", "Weather", "Transportation", "Scheduling Conflict", "Holiday", "Other", "Unknown"] as Category[])
        .map(c => {
          const n = rows.filter(r => r.category === c).length;
          return [c, n, fmtPct(n / Math.max(rows.length, 1))];
        }));
    toast.success("Summary exported");
  }
  function exportDetail() {
    downloadCsv("cancellation-detail.csv", DETAIL_COLS, filtered.map(detailRow));
    toast.success("Detail exported");
  }
  function exportAttendanceRisks() {
    const risks = [...clientRisks.five, ...clientRisks.three]
      .map(c => [c.name, c.count, "Client"] as (string | number)[])
      .concat(clientRisks.noShow.map(c => [c.name, c.count, "Repeated No Show"] as (string | number)[]));
    downloadCsv("attendance-risks.csv", ["Client", "Cancellations", "Risk Type"], risks);
    toast.success(`Attendance risks exported (${risks.length})`);
  }
  function exportProviderReport() {
    downloadCsv("provider-cancellation-report.csv",
      ["Provider", "Provider Cancellations"],
      providerRisks.top.map(p => [p.name, p.count] as (string | number)[]));
    toast.success("Provider cancellation report exported");
  }
  function saveSnapshot() {
    try {
      const key = "blossom.os.qa.cancellation.snapshots.v1";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.push({
        id: crypto.randomUUID(), savedAt: new Date().toISOString(),
        fileName,
        totals: {
          total: totals.totalSessions, client: totals.clientCancels, provider: totals.providerCancels,
          noShows: totals.noShows, illness: totals.illness, weather: totals.weather,
          uniqueClients: totals.uniqueClients, uniqueProviders: totals.uniqueProviders,
        },
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
              QA · Featured Dashboard
            </Badge>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight">Session Cancellation Dashboard</h1>
            <p className="text-[12.5px] text-muted-foreground">
              Upload a CentralReach Scheduling Cancellation export to instantly analyze cancellation trends, reasons, provider impacts and client attendance risks.
            </p>
          </div>
        </div>
        <ReportAIButton preset="cancellation" />
      </div>

      <SourceCoverageBanner reportKey="cancellation-scheduling" />

      <SharedDatasetStatusPanel
        title="Cancellation Shared Source"
        result={sharedResult}
        loading={sharedLoading}
        sourceMode={sourceMode}
        adminUploadsHref="/admin/uploads"
        onReload={() => loadSharedAdminDataset(false)}
        onResetToShared={resetToShared}
        required
      />

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
                  <p className="text-[11px] text-muted-foreground">{rows.length.toLocaleString()} cancellation{rows.length === 1 ? "" : "s"} loaded</p>
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
                    <p className="mt-1 text-rose-600/80">Upload a CentralReach Scheduling Cancellation export with date, client name and a cancellation reason or category.</p>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => { setGenerated(true); toast.success("Cancellation dashboard built"); }}
                className="h-9 rounded-full bg-[hsl(265_70%_55%)] px-5 text-[12.5px] font-semibold text-white hover:bg-[hsl(265_70%_50%)]"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Generate Cancellation Dashboard
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
                <Button variant="outline" size="sm" onClick={exportSummary}><Download className="mr-1 h-3.5 w-3.5" />Summary CSV</Button>
                <Button variant="outline" size="sm" onClick={exportDetail}><Download className="mr-1 h-3.5 w-3.5" />Detail CSV</Button>
                <Button variant="outline" size="sm" onClick={exportAttendanceRisks}><Download className="mr-1 h-3.5 w-3.5" />Attendance Risks</Button>
                <Button variant="outline" size="sm" onClick={exportProviderReport}><Download className="mr-1 h-3.5 w-3.5" />Provider Report</Button>
                <Button variant="outline" size="sm" onClick={saveSnapshot} className="col-span-2"><Sparkles className="mr-1 h-3.5 w-3.5" />Save Snapshot</Button>
              </div>
            </div>
          </section>

          {/* Charts */}
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            {charts.map(c => <ChartCard key={c.id} chart={c} />)}
          </section>

          {/* Risk sections */}
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <RiskCard title="Client Attendance Risks" subtitle="Clients with recurring cancellations">
              <RiskGroup label="5+ cancellations" tone="danger" items={clientRisks.five}
                onOpen={(name) => openRowsDrill(`${name} · cancellations`, rows.filter(r => r.clientName === name))} />
              <RiskGroup label="3–4 cancellations" tone="warn" items={clientRisks.three}
                onOpen={(name) => openRowsDrill(`${name} · cancellations`, rows.filter(r => r.clientName === name))} />
              <RiskGroup label="Repeated no-shows (2+)" tone="danger" items={clientRisks.noShow}
                onOpen={(name) => openRowsDrill(`${name} · no shows`, rows.filter(r => r.clientName === name && r.category === "No Show"))} />
            </RiskCard>
            <RiskCard title="Provider Risks" subtitle="Highest cancellation impact">
              <RiskGroup label="Top provider cancellations" tone="danger" items={providerRisks.top}
                onOpen={(name) => openRowsDrill(`${name} · provider cancellations`, rows.filter(r => r.providerName === name && r.category === "Provider Cancellation"))} />
              <RiskGroup label="Repeated provider cancellations (3+)" tone="warn" items={providerRisks.repeated}
                onOpen={(name) => openRowsDrill(`${name} · provider cancellations`, rows.filter(r => r.providerName === name && r.category === "Provider Cancellation"))} />
            </RiskCard>
          </section>

          {/* Cancellation Table */}
          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-semibold tracking-tight">Cancellations</h2>
                <p className="text-[11.5px] text-muted-foreground">{filtered.length} of {rows.length} cancellations</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search client, provider, reason…" className="h-8 w-[240px] pl-8 text-[12px]" />
                </div>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-[140px] text-[12px]" />
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-[140px] text-[12px]" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 w-[170px] text-[12px]"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {(["Client Cancellation", "Provider Cancellation", "No Show", "Illness", "Weather", "Transportation", "Scheduling Conflict", "Holiday", "Other", "Unknown"] as Category[])
                      .map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                {clients.length > 0 && (
                  <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger className="h-8 w-[160px] text-[12px]"><SelectValue placeholder="Client" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All clients</SelectItem>
                      {clients.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                {payors.length > 0 && (
                  <Select value={payorFilter} onValueChange={setPayorFilter}>
                    <SelectTrigger className="h-8 w-[150px] text-[12px]"><SelectValue placeholder="Payor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All payors</SelectItem>
                      {payors.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {codes.length > 0 && (
                  <Select value={codeFilter} onValueChange={setCodeFilter}>
                    <SelectTrigger className="h-8 w-[130px] text-[12px]"><SelectValue placeholder="Code" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All codes</SelectItem>
                      {codes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {locations.length > 0 && (
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="h-8 w-[150px] text-[12px]"><SelectValue placeholder="Location" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1100px] text-[12.5px]">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Client</th>
                    <th className="px-2 py-2">Provider</th>
                    <th className="px-2 py-2">Code</th>
                    <th className="px-2 py-2">State</th>
                    <th className="px-2 py-2">Location</th>
                    <th className="px-2 py-2">Reason</th>
                    <th className="px-2 py-2">Category</th>
                    <th className="px-2 py-2">Cancelled By</th>
                    <th className="px-2 py-2">Payor</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={i}
                        onClick={() => setDrill({ title: `${r.clientName} · ${fmtDate(r.date)}`, columns: DETAIL_COLS, rows: [detailRow(r)] })}
                        className="cursor-pointer border-b border-border/40 transition hover:bg-secondary/40">
                      <td className="px-2 py-2 text-muted-foreground whitespace-nowrap">{fmtDate(r.date)}</td>
                      <td className="px-2 py-2 font-medium">{r.clientName}</td>
                      <td className="px-2 py-2 text-muted-foreground">{r.providerName}</td>
                      <td className="px-2 py-2 text-muted-foreground">{r.procedureCode}</td>
                      <td className="px-2 py-2 text-muted-foreground">{r.state || "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{r.location || "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground max-w-[260px] truncate" title={r.reasonRaw}>{r.reasonRaw || "—"}</td>
                      <td className="px-2 py-2"><StatusBadge tone={CATEGORY_TONE[r.category]}>{r.category}</StatusBadge></td>
                      <td className="px-2 py-2 text-muted-foreground">{r.cancelledBy}</td>
                      <td className="px-2 py-2 text-muted-foreground">{r.payor}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} className="px-2 py-8 text-center text-[12px] text-muted-foreground">No cancellations match the current filters.</td></tr>
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

function aggregateCount(rows: CancelRow[], keyFn: (r: CancelRow) => string) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = keyFn(r);
    if (!k) continue;
    map.set(k, (map.get(k) || 0) + 1);
  }
  return [...map.entries()].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n).slice(0, 12);
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
        <p className="text-[14px] font-semibold">Upload a CentralReach Scheduling Cancellation export</p>
        <p className="mt-1 text-[11.5px] text-muted-foreground">CSV or XLSX · must include date, client name and a cancellation reason</p>
      </div>
      <Button size="sm" onClick={() => inputRef.current?.click()} disabled={loading}
        className="rounded-full bg-[hsl(265_70%_55%)] hover:bg-[hsl(265_70%_50%)]">
        {loading ? "Parsing…" : "Choose file"}
      </Button>
      <input ref={inputRef} type="file" className="hidden" accept={SUPPORTED_EXTENSIONS} onChange={(e) => onFiles(e.target.files)} />
    </div>
  );
}

function RiskCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
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

function RiskGroup({ label, tone, items, onOpen }:
  { label: string; tone: "success" | "warn" | "danger" | "default"; items: { name: string; count: number }[]; onOpen: (name: string) => void }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <StatusBadge tone={tone}>{items.length}</StatusBadge>
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-[12px] text-muted-foreground">None detected.</p>
      ) : (
        <ul className="mt-2 divide-y divide-border/40 rounded-xl border border-border/40">
          {items.slice(0, 8).map(it => (
            <li key={it.name}>
              <button type="button" onClick={() => onOpen(it.name)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[12.5px] transition hover:bg-secondary/40">
                <span className="truncate font-medium">{it.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{it.count}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
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