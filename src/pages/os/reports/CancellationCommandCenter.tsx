import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  listRemoteFollowups,
  upsertRemoteFollowup,
} from "@/lib/os/reportPersistence";
import {
  Upload, FileSpreadsheet, Download, Sparkles, AlertTriangle, CheckCircle2,
  Save, Trash2, X, CalendarRange, DollarSign, Clock, MapPin, Users, Stethoscope,
  Printer, TrendingDown, TrendingUp, Search, Database,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { ReportAIButton } from "@/components/ai/ReportAIButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseAnyFile, SUPPORTED_EXTENSIONS } from "@/lib/os/dashboardEngine/excelParser";
import {
  saveCancellationReport, getCancellationSavedReport,
  saveCancellationLastSession, loadCancellationLastSession, clearCancellationLastSession,
} from "@/lib/os/cancellationSavedReports";
import { pushRecent } from "@/lib/os/reportsCatalog";
import { CentralReachRequirementsCard } from "@/components/reports/CentralReachRequirementsCard";
import { SourceCoverageBanner } from "@/components/reports/SourceCoverageBanner";
import {
  loadSharedDataset,
  type SharedDatasetLoadResult,
} from "@/lib/os/reporting/sharedDatasetLoader";
import {
  SharedDatasetStatusPanel,
  type SharedSourceMode,
} from "@/components/reports/SharedDatasetStatusPanel";
import {
  getActiveSharedReportDataset,
  downloadSharedReportDatasetFile,
  type SharedReportKey,
} from "@/lib/os/sharedReportDatasets";

/* ============================================================
 * Cancellation Command Center
 * Three-file upload: Scheduling (required), Billing, Authorization.
 * Mirrors the BCBA Productivity Dashboard architecture:
 *   - Persistent uploads (IndexedDB)
 *   - Saved reports
 *   - Last-session restore
 *   - Filters · Drilldowns · Exports
 * ============================================================ */

/* ----------------------- types ----------------------- */

type CancelStatus =
  | "Rendered" | "Cancelled" | "No Show" | "Client Cancelled" | "Provider Cancelled"
  | "Excused" | "Unexcused" | "Weather" | "Vacation" | "Hospitalization" | "Holiday" | "Other" | "Scheduled";

interface ScheduleRow {
  date: Date | null;
  cancelledOn: Date | null;
  hoursBetween: number | null; // hours between cancellation and session start
  client: string;
  rbt: string;
  bcba: string;
  code: string;
  hours: number;
  state: string;
  location: string;
  payor: string;
  reasonRaw: string;
  status: CancelStatus;
  isCancelled: boolean;
  isExcused: boolean;
  raw: Record<string, string>;
}

interface BillingLite {
  code: string;
  hours: number;
  charge: number;
  perHour: number;
}

interface AuthRecord {
  client: string;
  bcba: string;
  start: number;
  end: number;
}

/* ----------------------- helpers ----------------------- */

const normH = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");
function findH(headers: string[], cands: string[]) {
  const map = new Map(headers.map(h => [normH(h), h]));
  for (const c of cands) { const hit = map.get(normH(c)); if (hit) return hit; }
  return null;
}
const num = (v: any) => {
  if (v === undefined || v === null || v === "") return 0;
  const n = parseFloat(String(v).replace(/[$,%]/g, ""));
  return isFinite(n) ? n : 0;
};
const fmt1 = (n: number) => (isFinite(n) ? n.toFixed(1) : "—");
const fmt0 = (n: number) => (isFinite(n) ? Math.round(n).toLocaleString() : "—");
const fmtMoney = (n: number) =>
  isFinite(n) ? `$${Math.round(n).toLocaleString()}` : "—";
const fmtPct = (n: number) => (isFinite(n) ? `${(n * 100).toFixed(1)}%` : "—");

function parseDate(s: string): Date | null {
  if (!s) return null;
  const t = String(s).trim();
  if (!t) return null;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/.exec(t);
  if (iso) {
    const d = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3], +(iso[4] || 0), +(iso[5] || 0)));
    return isNaN(d.getTime()) ? null : d;
  }
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?:\s*([AP]M))?)?/i.exec(t);
  if (us) {
    let y = +us[3]; if (y < 100) y += 2000;
    let hh = +(us[4] || 0); const mm = +(us[5] || 0);
    if (us[6] && /pm/i.test(us[6]) && hh < 12) hh += 12;
    if (us[6] && /am/i.test(us[6]) && hh === 12) hh = 0;
    const d = new Date(Date.UTC(y, +us[1] - 1, +us[2], hh, mm));
    return isNaN(d.getTime()) ? null : d;
  }
  const fb = new Date(t); return isNaN(fb.getTime()) ? null : fb;
}
function monthKey(d: Date | null) {
  if (!d) return ""; return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function weekKey(d: Date | null) {
  if (!d) return "";
  const day = d.getUTCDay() || 7;
  const monday = new Date(d); monday.setUTCDate(d.getUTCDate() - (day - 1));
  return `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, "0")}-${String(monday.getUTCDate()).padStart(2, "0")}`;
}
function tidyName(raw: string): string {
  let s = (raw || "").trim().replace(/\s+/g, " ");
  if (!s) return "";
  if (s.includes(",")) {
    const [last, rest] = s.split(",", 2).map(x => x.trim());
    if (last && rest) s = `${rest} ${last}`;
  }
  return s.split(" ").map(tok => tok
    ? (tok === tok.toUpperCase() || tok === tok.toLowerCase()
        ? tok[0].toUpperCase() + tok.slice(1).toLowerCase()
        : tok)
    : tok
  ).join(" ");
}
function classifyStatus(
  reasonRaw: string,
  statusRaw: string,
  opts: { explicitCancelled?: boolean; explicitRendered?: boolean } = {},
): { status: CancelStatus; isCancelled: boolean; isExcused: boolean } {
  const r = (reasonRaw || "").toLowerCase();
  const s = (statusRaw || "").toLowerCase();
  const both = `${s} ${r}`;
  // Explicit rendered (e.g. Cancelled=0 + Present=1, or TypeName "Direct Service" with no cancel flag)
  if (opts.explicitRendered && !opts.explicitCancelled) {
    return { status: "Rendered", isCancelled: false, isExcused: false };
  }
  if (/render|complete|attended|kept/.test(s)) return { status: "Rendered", isCancelled: false, isExcused: false };
  if (!opts.explicitCancelled && !s && !r) return { status: "Scheduled", isCancelled: false, isExcused: false };
  if (/no[\s-]?show|nos\b/.test(both)) return { status: "No Show", isCancelled: true, isExcused: false };
  if (/weather|snow|storm|hurricane|ice/.test(both)) return { status: "Weather", isCancelled: true, isExcused: true };
  if (/hospital|admitted|ER\b/i.test(both)) return { status: "Hospitalization", isCancelled: true, isExcused: true };
  if (/holiday/.test(both)) return { status: "Holiday", isCancelled: true, isExcused: true };
  if (/vacation|out of town/.test(both)) return { status: "Vacation", isCancelled: true, isExcused: true };
  if (/provider|bcba|rbt|staff|tech|call[\s-]?out|callout|therapist/.test(both)) {
    return { status: "Provider Cancelled", isCancelled: true, isExcused: false };
  }
  if (/sick|ill|fever|covid|flu|medical/.test(both)) return { status: "Client Cancelled", isCancelled: true, isExcused: true };
  if (/client|parent|guardian|family|caregiver/.test(both)) {
    return { status: "Client Cancelled", isCancelled: true, isExcused: false };
  }
  if (/excused/.test(both)) return { status: "Excused", isCancelled: true, isExcused: true };
  if (/unexcused/.test(both)) return { status: "Unexcused", isCancelled: true, isExcused: false };
  if (/cancel/.test(both)) return { status: "Cancelled", isCancelled: true, isExcused: false };
  if (opts.explicitCancelled) return { status: "Other", isCancelled: true, isExcused: false };
  // No cancellation signal at all — treat as rendered/completed session.
  return { status: "Rendered", isCancelled: false, isExcused: false };
}

function downloadBlob(filename: string, mime: string, data: string) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function toCsv(columns: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.map(esc).join(","), ...rows.map(r => r.map(esc).join(","))].join("\n");
}

/* ----------------------- parsers ----------------------- */

function parseScheduleFile(headers: string[], rows: Record<string, string>[]): ScheduleRow[] {
  const startH = findH(headers, ["StartDateTime", "Start Date Time", "EventStartDateTime", "AppointmentStart", "Appointment Start", "ServiceStart", "Date", "AppointmentDate", "Appointment Date", "Date Of Service", "ServiceDate"]);
  const cancelledOnH = findH(headers, ["CancelledOn", "Cancelled On", "CanceledOn", "Canceled On", "CancellationDate", "Cancellation Date"]);
  const clientFullH = findH(headers, ["ClientName", "Client Name", "Client"]);
  const clientFnH = findH(headers, ["ClientFirstName", "Client First Name"]);
  const clientLnH = findH(headers, ["ClientLastName", "Client Last Name"]);
  const rbtFullH = findH(headers, ["ProviderName", "Provider Name", "Provider", "Staff", "RBT", "Technician"]);
  const rbtFnH = findH(headers, ["ProviderFirstName", "Provider First Name"]);
  const rbtLnH = findH(headers, ["ProviderLastName", "Provider Last Name"]);
  const bcbaH = findH(headers, ["BCBA", "BCBAName", "Supervisor", "Supervising BCBA", "CaseSupervisor", "Case Supervisor"]);
  const codeH = findH(headers, ["ProcedureCode", "Procedure Code", "ServiceCode", "Service Code", "CPTCode", "CPT Code", "BillingCode", "CodeName", "BillingCodeName"]);
  const codeDescH = findH(headers, ["ProcedureCodeDescription", "Service Description", "ServiceDescription", "CodeDesc", "BillingCodeDesc"]);
  const hoursH = findH(headers, ["SegmentHours", "EventHours", "Hours", "ScheduledHours", "Scheduled Hours", "Duration", "DurationHours", "Units"]);
  const minutesH = findH(headers, ["SegmentMins", "EventMins"]);
  const stateH = findH(headers, ["State", "ClientState", "Client State", "LocationStateProvince", "ServiceLocationStateProvince"]);
  const locH = findH(headers, ["LocationDescription", "Location Description", "PlaceOfServiceName", "Location", "ServiceLocation", "Service Location", "LocationName"]);
  const payorH = findH(headers, ["PayorName", "Payor", "Payer", "PayerName", "Insurance"]);
  const reasonH = findH(headers, ["CancellationReason", "Cancellation Reason", "CancelledReason", "Cancel Reason", "CancelReason", "ReasonName", "ReasonComment", "ChangeNote"]);
  const statusH = findH(headers, ["Status", "AppointmentStatus", "Appointment Status", "CancellationType", "Cancellation Type", "Category", "TypeName"]);
  const cancelledFlagH = findH(headers, ["Cancelled", "IsCancelled"]);
  const presentFlagH = findH(headers, ["Present"]);
  const attendanceH = findH(headers, ["Attendance"]);
  const deletedFlagH = findH(headers, ["Deleted", "IsDeleted", "Hidden"]);
  const convertedH = findH(headers, ["ConvertedToTimesheet", "BillingEntry"]);
  // CR-style Principal columns (Principal1 = provider, Principal2 = client typically)
  const p1NameH = findH(headers, ["Principal1Name"]);
  const p2NameH = findH(headers, ["Principal2Name"]);
  const p1EmailH = findH(headers, ["Principal1Email"]);
  const p2EmailH = findH(headers, ["Principal2Email"]);
  const isStaffEmail = (e: string) => !!e && !/withheld/i.test(e) && /@/.test(e);

  return rows.map(r => {
    const date = startH ? parseDate(r[startH]) : null;
    const cancelledOn = cancelledOnH ? parseDate(r[cancelledOnH]) : null;
    const hoursBetween = (date && cancelledOn)
      ? (date.getTime() - cancelledOn.getTime()) / 36e5
      : null;
    let client = clientFullH
      ? r[clientFullH]
      : `${clientFnH ? r[clientFnH] : ""} ${clientLnH ? r[clientLnH] : ""}`.trim();
    let rbt = rbtFullH
      ? r[rbtFullH]
      : `${rbtFnH ? r[rbtFnH] : ""} ${rbtLnH ? r[rbtLnH] : ""}`.trim();
    // Fallback to CR Principal columns
    if ((!client || !rbt) && (p1NameH || p2NameH)) {
      const p1 = p1NameH ? r[p1NameH] : "";
      const p2 = p2NameH ? r[p2NameH] : "";
      const e1 = p1EmailH ? r[p1EmailH] : "";
      const e2 = p2EmailH ? r[p2EmailH] : "";
      // The principal with a real (staff) email is provider; the other is client.
      let provider = "", clientName = "";
      if (isStaffEmail(e1) && !isStaffEmail(e2)) { provider = p1; clientName = p2; }
      else if (isStaffEmail(e2) && !isStaffEmail(e1)) { provider = p2; clientName = p1; }
      else { provider = p1; clientName = p2; } // CR default
      if (!client) client = clientName;
      if (!rbt) rbt = provider;
    }
    let hours = hoursH ? num(r[hoursH]) : 0;
    if (!hours && minutesH) hours = num(r[minutesH]) / 60;
    // Units often come in 15-min units; if value is large integer assume units of 15min.
    const hoursOut = hoursH && /unit/i.test(hoursH) && hours > 12 ? hours / 4 : hours;
    const reasonRaw = reasonH ? r[reasonH] : "";
    let statusRaw = statusH ? r[statusH] : "";
    const truthy = (v: any) => {
      const s = String(v ?? "").trim().toLowerCase();
      return s === "1" || s === "true" || s === "yes" || s === "y";
    };
    const explicitCancelled = cancelledFlagH ? truthy(r[cancelledFlagH]) : false;
    const explicitRendered =
      (presentFlagH ? truthy(r[presentFlagH]) : false) ||
      (attendanceH ? truthy(r[attendanceH]) : false) ||
      (convertedH ? truthy(r[convertedH]) : false);
    const deleted = deletedFlagH ? truthy(r[deletedFlagH]) : false;
    if (explicitCancelled) statusRaw = statusRaw || "Cancelled";
    const { status, isCancelled, isExcused } = deleted
      ? { status: "Other" as CancelStatus, isCancelled: false, isExcused: false }
      : classifyStatus(reasonRaw, statusRaw, { explicitCancelled, explicitRendered });
    const codeRaw = codeH ? r[codeH] : (codeDescH ? r[codeDescH] : "");
    const code = (codeRaw.match(/\b(\d{5})\b/) || [null, codeRaw])[1] || "";
    return {
      date,
      cancelledOn,
      hoursBetween,
      client: tidyName(client) || "Unknown Client",
      rbt: tidyName(rbt) || "—",
      bcba: tidyName(bcbaH ? r[bcbaH] : "") || "",
      code,
      hours: hoursOut || 0,
      state: stateH ? (r[stateH] || "").trim() : "",
      location: locH ? (r[locH] || "").trim() : "",
      payor: payorH ? (r[payorH] || "").trim() : "—",
      reasonRaw,
      status,
      isCancelled,
      isExcused,
      raw: r,
    };
  }).filter((row, i) => {
    if (!deletedFlagH) return true;
    const v = String(rows[i][deletedFlagH] ?? "").trim().toLowerCase();
    return !(v === "1" || v === "true" || v === "yes");
  });
}

function parseBillingFile(headers: string[], rows: Record<string, string>[]): BillingLite[] {
  const codeH = findH(headers, ["ProcedureCode", "Procedure Code", "ServiceCode", "Service Code", "CPTCode", "Code"]);
  const hoursH = findH(headers, ["BillableTime", "Hours", "Units", "Billed Hours", "BilledHours"]);
  const chargeH = findH(headers, ["BilledAmount", "Billed Amount", "ChargeAmount", "Charge", "Amount", "Charges"]);
  return rows.map(r => {
    const code = (codeH ? r[codeH] : "").match(/\b(\d{5})\b/)?.[1] || (codeH ? r[codeH] : "");
    const rawHours = hoursH ? num(r[hoursH]) : 0;
    const hours = hoursH && /unit/i.test(hoursH) && rawHours > 12 ? rawHours / 4 : rawHours;
    const charge = chargeH ? num(r[chargeH]) : 0;
    return { code, hours, charge, perHour: hours > 0 ? charge / hours : 0 };
  }).filter(b => b.code);
}

function parseAuthFile(headers: string[], rows: Record<string, string>[]): AuthRecord[] {
  const clientH = findH(headers, ["ClientFullName", "ClientName", "Client Name", "clientName", "Client", "PatientName"]);
  const bcbaH = findH(headers, ["managerName", "ManagerName", "Manager Name", "BCBA", "BCBAName", "Supervisor", "Assigned BCBA", "Provider"]);
  const startH = findH(headers, ["ActualStartDate", "startDate", "AuthStart", "Authorization Start", "StartDate", "Start Date", "EffectiveDate"]);
  const endH = findH(headers, ["ActualEndDate", "endDate", "AuthEnd", "Authorization End", "EndDate", "End Date", "ExpirationDate", "Expiration Date"]);
  return rows.map(r => ({
    client: tidyName(clientH ? r[clientH] : ""),
    bcba: tidyName(bcbaH ? r[bcbaH] : ""),
    start: startH ? (parseDate(r[startH])?.getTime() ?? 0) : 0,
    end: endH ? (parseDate(r[endH])?.getTime() ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER,
  })).filter(a => a.client);
}

/** Attribute a BCBA to a session via authorization records (active window match). */
function attributeBcba(row: ScheduleRow, authsByClient: Map<string, AuthRecord[]>): string {
  if (row.bcba) return row.bcba;
  const list = authsByClient.get(row.client.toLowerCase());
  if (!list || !list.length) return "Unassigned";
  const t = row.date?.getTime() ?? Date.now();
  const active = list.find(a => t >= a.start && t <= a.end) || list[0];
  return active.bcba || "Unassigned";
}

function estimateRevenuePerHour(code: string, billing: BillingLite[]): number {
  if (!billing.length) return 0;
  const sameCode = billing.filter(b => b.code === code && b.perHour > 0);
  if (sameCode.length) {
    return sameCode.reduce((s, b) => s + b.perHour, 0) / sameCode.length;
  }
  const all = billing.filter(b => b.perHour > 0);
  if (!all.length) return 0;
  return all.reduce((s, b) => s + b.perHour, 0) / all.length;
}

/* ----------------------- AI insights ----------------------- */

function buildInsights(processed: ScheduleRow[], lostRevenue: number): string[] {
  if (!processed.length) return [];
  const cancelled = processed.filter(p => p.isCancelled);
  const cancRate = cancelled.length / processed.length;
  const lostHours = cancelled.reduce((s, p) => s + p.hours, 0);
  const out: string[] = [];
  out.push(`${processed.length.toLocaleString()} sessions analyzed · ${cancelled.length.toLocaleString()} cancelled (${fmtPct(cancRate)}).`);
  out.push(`${fmt1(lostHours)} hours lost${lostRevenue > 0 ? ` · ${fmtMoney(lostRevenue)} estimated lost revenue` : ""}.`);
  const byReason = new Map<string, number>();
  for (const c of cancelled) byReason.set(c.status, (byReason.get(c.status) || 0) + 1);
  const top = [...byReason.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top) out.push(`Top reason: ${top[0]} (${top[1]} sessions).`);
  return out;
}

/* ============================================================
 * PAGE
 * ============================================================ */

export default function CancellationCommandCenter() {
  const [params] = useSearchParams();
  const savedId = params.get("saved");

  // raw uploads
  const [scheduleFileName, setScheduleFileName] = useState("");
  const [billingFileName, setBillingFileName] = useState("");
  const [authFileNames, setAuthFileNames] = useState<string[]>([]);
  const [scheduleRaws, setScheduleRaws] = useState<any[]>([]);
  const [billingRaws, setBillingRaws] = useState<any[]>([]);
  const [authRecords, setAuthRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoredFromSession, setRestoredFromSession] = useState(false);
  // Dashboard is only rendered after the user explicitly clicks Build.
  // Restored sessions are pre-built so users see their last view immediately.
  const [built, setBuilt] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [bcbaFilter, setBcbaFilter] = useState("all");
  const [rbtFilter, setRbtFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [payorFilter, setPayorFilter] = useState("all");
  const [codeFilter, setCodeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Cancellation log: sort + follow-up tracking
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [followUps, setFollowUps] = useState<Record<string, "todo" | "contacted" | "resolved">>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("cancellation-cc-followups") || "{}"); } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem("cancellation-cc-followups", JSON.stringify(followUps)); } catch {}
  }, [followUps]);
  // Hydrate follow-ups from Supabase for logged-in users so state
  // follows across devices. Local values render instantly; remote
  // overlays once loaded.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const remote = await listRemoteFollowups("cancellation_command_center");
      if (cancelled || remote.length === 0) return;
      setFollowUps((prev) => {
        const next = { ...prev };
        for (const r of remote) {
          if (r.status === "todo" || r.status === "contacted" || r.status === "resolved") {
            next[r.rowKey] = r.status;
          }
        }
        return next;
      });
    })();
    return () => { cancelled = true; };
  }, []);
  const rowKey = (r: ScheduleRow) =>
    `${r.date?.toISOString().slice(0,10) || ""}|${r.client}|${r.rbt}|${r.code}`;
  const cycleFollowUp = (key: string) => setFollowUps(prev => {
    const cur = prev[key] || "todo";
    const next: Record<string, "todo" | "contacted" | "resolved"> = {
      todo: "contacted" as const, contacted: "resolved" as const, resolved: "todo" as const,
    } as any;
    const status = next[cur];
    // Persist to Supabase — await through a promise so failures surface to
    // logs. Local state above is the offline fallback.
    (async () => {
      try {
        await upsertRemoteFollowup("cancellation_command_center", key, status);
      } catch (err) {
        console.warn("[CancellationCommandCenter] remote follow-up sync failed", err);
        toast.warning("Follow-up updated locally — cloud sync failed.");
      }
    })();
    return { ...prev, [key]: status };
  });

  const activeFilterCount = [
    stateFilter, bcbaFilter, rbtFilter, clientFilter,
    payorFilter, codeFilter, statusFilter, locationFilter,
  ].filter(f => f !== "all").length + (dateFrom || dateTo ? 1 : 0);

  const clearAllFilters = () => {
    setSearch("");
    setStateFilter("all");
    setBcbaFilter("all");
    setRbtFilter("all");
    setClientFilter("all");
    setPayorFilter("all");
    setCodeFilter("all");
    setStatusFilter("all");
    setLocationFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const scheduleInput = useRef<HTMLInputElement>(null);
  const billingInput = useRef<HTMLInputElement>(null);
  const authInput = useRef<HTMLInputElement>(null);

  /* ---- restore saved or last session ---- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (savedId) {
        const saved = await getCancellationSavedReport(savedId);
        if (!cancelled && saved) {
          setScheduleFileName(saved.scheduleFileName);
          setBillingFileName(saved.billingFileName || "");
          setAuthFileNames(saved.authFileNames);
          setScheduleRaws(saved.scheduleRaws);
          setBillingRaws(saved.billingRaws);
          setAuthRecords(saved.authRecords);
          setRestoredFromSession(true);
          setBuilt(true);
          toast.success(`Restored "${saved.name}"`);
          pushRecent("cancellation-command-center");
        }
        return;
      }
      const last = await loadCancellationLastSession();
      if (!cancelled && last) {
        setScheduleFileName(last.scheduleFileName);
        setBillingFileName(last.billingFileName || "");
        setAuthFileNames(last.authFileNames);
        setScheduleRaws(last.scheduleRaws);
        setBillingRaws(last.billingRaws);
        setAuthRecords(last.authRecords);
        setRestoredFromSession(true);
        setBuilt(true);
      }
    })();
    pushRecent("cancellation-command-center");
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedId]);

  // persist last session whenever uploads change (debounced via microtask)
  useEffect(() => {
    if (!scheduleRaws.length) return;
    saveCancellationLastSession({
      scheduleFileName, billingFileName: billingFileName || undefined, authFileNames,
      scheduleRaws, billingRaws, authRecords,
    }).catch(() => {});
  }, [scheduleFileName, billingFileName, authFileNames, scheduleRaws, billingRaws, authRecords]);

  /* ---- uploads ---- */
  async function handleSchedule(files: FileList | null) {
    if (!files || !files[0]) return;
    const f = files[0];
    setLoading(true);
    try {
      const parsed = await parseAnyFile(f);
      const first = parsed[0];
      if (!first) throw new Error("No data in file.");
      // Validation
      const headers = first.headers;
      const hasDate = !!findH(headers, ["StartDateTime", "Start Date Time", "EventStartDateTime", "AppointmentStart", "Date", "AppointmentDate", "Appointment Date", "ServiceDate"]);
      const hasClient = !!(findH(headers, ["ClientName", "Client Name", "Client"]) ||
        (findH(headers, ["ClientFirstName"]) && findH(headers, ["ClientLastName"])) ||
        findH(headers, ["Principal2Name"]) || findH(headers, ["Principal1Name"]) ||
        findH(headers, ["ParticipantNames"]));
      if (!hasDate || !hasClient) {
        toast.error("Scheduling file missing required columns (date and client).");
        return;
      }
      // Dedup safety
      if (scheduleFileName === f.name && scheduleRaws.length === first.rows.length) {
        toast.info("Same scheduling file already loaded.");
        return;
      }
      setScheduleRaws(first.rows.map(r => ({ __headers: headers, ...r })));
      setScheduleFileName(f.name);
      toast.success(`Loaded ${first.rows.length.toLocaleString()} appointments from ${f.name}`);
    } catch (e: any) {
      toast.error(`Failed to parse: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleBilling(files: FileList | null) {
    if (!files || !files[0]) return;
    const f = files[0];
    setLoading(true);
    try {
      const parsed = await parseAnyFile(f);
      const first = parsed[0];
      if (!first) throw new Error("No data in file.");
      setBillingRaws(first.rows.map(r => ({ __headers: first.headers, ...r })));
      setBillingFileName(f.name);
      toast.success(`Loaded ${first.rows.length.toLocaleString()} billing rows`);
    } catch (e: any) {
      toast.error(`Failed to parse: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuths(files: FileList | null) {
    if (!files || !files.length) return;
    setLoading(true);
    try {
      const names: string[] = [];
      const records: any[] = [];
      for (const f of Array.from(files)) {
        const parsed = await parseAnyFile(f);
        for (const sheet of parsed) {
          records.push({ __fileName: f.name, __headers: sheet.headers, __rows: sheet.rows });
        }
        names.push(f.name);
      }
      setAuthFileNames(prev => Array.from(new Set([...prev, ...names])));
      setAuthRecords(prev => [...prev, ...records]);
      toast.success(`Loaded ${names.length} authorization file${names.length === 1 ? "" : "s"}`);
    } catch (e: any) {
      toast.error(`Failed to parse: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  function resetAll() {
    setScheduleFileName(""); setBillingFileName(""); setAuthFileNames([]);
    setScheduleRaws([]); setBillingRaws([]); setAuthRecords([]);
    setRestoredFromSession(false);
    setBuilt(false);
    clearCancellationLastSession().catch(() => {});
    if (scheduleInput.current) scheduleInput.current.value = "";
    if (billingInput.current) billingInput.current.value = "";
    if (authInput.current) authInput.current.value = "";
  }

  /* ---- Shared admin dataset auto-load ---- */
  const [sharedLoading, setSharedLoading] = useState(false);
  const [sharedAvailable, setSharedAvailable] = useState<{
    scheduling: boolean; billing: boolean; authorization: boolean;
  }>({ scheduling: false, billing: false, authorization: false });

  function emptyRes(key: SharedReportKey): SharedDatasetLoadResult {
    return {
      key,
      status: "idle",
      ageDays: null,
      stale: false,
      dataset: null,
      parsed: null,
      inspection: null,
      missingFields: [],
      errorMessage: null,
    };
  }
  const [sharedResults, setSharedResults] = useState<Record<SharedReportKey, SharedDatasetLoadResult>>({
    "cancellation-scheduling": emptyRes("cancellation-scheduling"),
    "cancellation-billing": emptyRes("cancellation-billing"),
    "cancellation-authorization": emptyRes("cancellation-authorization"),
  } as Record<SharedReportKey, SharedDatasetLoadResult>);
  const [sourceModeByKind, setSourceModeByKind] = useState<Record<SharedReportKey, SharedSourceMode>>({
    "cancellation-scheduling": "none",
    "cancellation-billing": "none",
    "cancellation-authorization": "none",
  } as Record<SharedReportKey, SharedSourceMode>);

  async function loadSharedKind(kind: SharedReportKey, silent = false): Promise<boolean> {
    try {
      const requiredFields =
        kind === "cancellation-scheduling"
          ? ["client_name" as const, "service_date" as const]
          : kind === "cancellation-billing"
            ? ["client_name" as const, "service_date" as const]
            : ["client_name" as const];
      const result = await loadSharedDataset(kind, { requiredFields });
      setSharedResults((prev) => ({ ...prev, [kind]: result }));
      if (result.status !== "ready" || !result.dataset) {
        if (!silent && result.status === "missing") {
          toast.info(`No admin-uploaded ${kind} dataset found.`);
        } else if (!silent && result.errorMessage) {
          toast.error(result.errorMessage);
        }
        return false;
      }
      const file = await downloadSharedReportDatasetFile(result.dataset);
      // Build a FileList-like input by using DataTransfer
      const dt = new DataTransfer();
      dt.items.add(file);
      if (kind === "cancellation-scheduling") await handleSchedule(dt.files);
      else if (kind === "cancellation-billing") await handleBilling(dt.files);
      else if (kind === "cancellation-authorization") await handleAuths(dt.files);
      setSourceModeByKind((prev) => ({ ...prev, [kind]: "shared" }));
      if (!silent) toast.success(`Loaded admin ${kind} dataset: ${result.dataset.fileName}`);
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSharedResults((prev) => ({
        ...prev,
        [kind]: { ...prev[kind], status: "error", errorMessage: msg },
      }));
      if (!silent) toast.error(`Failed to load admin ${kind} dataset: ${msg}`);
      return false;
    }
  }

  async function loadAllAdminDatasets(silent = false) {
    setSharedLoading(true);
    try {
      const [s, b, a] = await Promise.all([
        loadSharedKind("cancellation-scheduling", silent),
        loadSharedKind("cancellation-billing", silent),
        loadSharedKind("cancellation-authorization", silent),
      ]);
      setSharedAvailable({ scheduling: s, billing: b, authorization: a });
      // Scheduling is the only required file — auto-build the dashboard as
      // soon as it loads so admins don't have to click "Build".
      if (s) setBuilt(true);
      if (!silent && !s && !b && !a) {
        toast.info("No admin-uploaded cancellation datasets found yet.");
      }
    } finally {
      setSharedLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, b, a] = await Promise.all([
          getActiveSharedReportDataset("cancellation-scheduling"),
          getActiveSharedReportDataset("cancellation-billing"),
          getActiveSharedReportDataset("cancellation-authorization"),
        ]);
        if (cancelled) return;
        setSharedAvailable({
          scheduling: !!s, billing: !!b, authorization: !!a,
        });
        // Auto-load only when the user has no manually uploaded files yet
        if (!scheduleRaws.length && !billingRaws.length && !authRecords.length) {
          if (s || b || a) await loadAllAdminDatasets(true);
        }
      } catch {
        /* noop */
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- processed data ---- */
  const processedAll: ScheduleRow[] = useMemo(() => {
    if (!scheduleRaws.length) return [];
    const headers: string[] = scheduleRaws[0]?.__headers || Object.keys(scheduleRaws[0] || {});
    const cleanRows = scheduleRaws.map(({ __headers: _h, ...rest }) => rest as Record<string, string>);
    const rows = parseScheduleFile(headers, cleanRows);

    // Build auth lookup
    const authList: AuthRecord[] = [];
    for (const a of authRecords) {
      if (a.__rows) authList.push(...parseAuthFile(a.__headers, a.__rows));
    }
    const authsByClient = new Map<string, AuthRecord[]>();
    for (const a of authList) {
      const k = a.client.toLowerCase();
      const list = authsByClient.get(k) || []; list.push(a); authsByClient.set(k, list);
    }
    return rows.map(r => ({ ...r, bcba: attributeBcba(r, authsByClient) }));
  }, [scheduleRaws, authRecords]);

  const billing: BillingLite[] = useMemo(() => {
    if (!billingRaws.length) return [];
    const headers: string[] = billingRaws[0]?.__headers || Object.keys(billingRaws[0] || {});
    const cleanRows = billingRaws.map(({ __headers: _h, ...rest }) => rest as Record<string, string>);
    return parseBillingFile(headers, cleanRows);
  }, [billingRaws]);

  /* ---- dropdown options ---- */
  const opt = (arr: string[]) => Array.from(new Set(arr.filter(Boolean))).sort();
  const states = useMemo(() => opt(processedAll.map(r => r.state)), [processedAll]);
  const bcbas = useMemo(() => opt(processedAll.map(r => r.bcba)), [processedAll]);
  const rbts = useMemo(() => opt(processedAll.map(r => r.rbt)), [processedAll]);
  const clients = useMemo(() => opt(processedAll.map(r => r.client)), [processedAll]);
  const payors = useMemo(() => opt(processedAll.map(r => r.payor)), [processedAll]);
  const codes = useMemo(() => opt(processedAll.map(r => r.code)), [processedAll]);
  const statuses = useMemo(() => opt(processedAll.map(r => r.status)), [processedAll]);
  const locations = useMemo(() => opt(processedAll.map(r => r.location)), [processedAll]);

  /* ---- filtered rows ---- */
  const rows = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom + "T00:00:00Z").getTime() : 0;
    const to = dateTo ? new Date(dateTo + "T23:59:59Z").getTime() : Number.MAX_SAFE_INTEGER;
    const q = search.trim().toLowerCase();
    return processedAll.filter(r => {
      if (stateFilter !== "all" && r.state !== stateFilter) return false;
      if (bcbaFilter !== "all" && r.bcba !== bcbaFilter) return false;
      if (rbtFilter !== "all" && r.rbt !== rbtFilter) return false;
      if (clientFilter !== "all" && r.client !== clientFilter) return false;
      if (payorFilter !== "all" && r.payor !== payorFilter) return false;
      if (codeFilter !== "all" && r.code !== codeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (locationFilter !== "all" && r.location !== locationFilter) return false;
      const t = r.date?.getTime() ?? 0;
      if (t && (t < from || t > to)) return false;
      if (q && !`${r.client} ${r.rbt} ${r.bcba} ${r.reasonRaw} ${r.code}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [processedAll, search, stateFilter, bcbaFilter, rbtFilter, clientFilter, payorFilter, codeFilter, statusFilter, locationFilter, dateFrom, dateTo]);

  /* ---- aggregations ---- */
  const agg = useMemo(() => {
    const cancelled = rows.filter(r => r.isCancelled);
    const rendered = rows.filter(r => r.status === "Rendered");
    const lostHours = cancelled.reduce((s, r) => s + r.hours, 0);
    const totalHours = rows.reduce((s, r) => s + r.hours, 0);
    const completedHours = rendered.reduce((s, r) => s + r.hours, 0);
    const cancRate = rows.length ? cancelled.length / rows.length : 0;
    const excused = cancelled.filter(r => r.isExcused).length;
    const unexcused = cancelled.length - excused;
    const lostRevenue = cancelled.reduce((s, r) => s + r.hours * estimateRevenuePerHour(r.code, billing), 0);

    // by month for trend
    const monthMap = new Map<string, { sched: number; rendered: number; cancelled: number; lostHours: number; lostRev: number }>();
    for (const r of rows) {
      const k = monthKey(r.date) || "—";
      const e = monthMap.get(k) || { sched: 0, rendered: 0, cancelled: 0, lostHours: 0, lostRev: 0 };
      e.sched++;
      if (r.status === "Rendered") e.rendered++;
      if (r.isCancelled) {
        e.cancelled++;
        e.lostHours += r.hours;
        e.lostRev += r.hours * estimateRevenuePerHour(r.code, billing);
      }
      monthMap.set(k, e);
    }
    const months = [...monthMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const lastTwo = months.slice(-2);
    const momDelta = (lastTwo.length === 2 && lastTwo[0][1].cancelled > 0)
      ? (lastTwo[1][1].cancelled - lastTwo[0][1].cancelled) / lastTwo[0][1].cancelled
      : 0;

    return {
      cancelled, rendered, lostHours, totalHours, completedHours, cancRate,
      excused, unexcused, lostRevenue, months, momDelta,
      avgHoursLost: cancelled.length ? lostHours / cancelled.length : 0,
    };
  }, [rows, billing]);

  // reason breakdown
  const reasonRows = useMemo(() => {
    const m = new Map<string, { sessions: number; hours: number; revenue: number }>();
    for (const r of rows.filter(x => x.isCancelled)) {
      const e = m.get(r.status) || { sessions: 0, hours: 0, revenue: 0 };
      e.sessions++; e.hours += r.hours;
      e.revenue += r.hours * estimateRevenuePerHour(r.code, billing);
      m.set(r.status, e);
    }
    const total = [...m.values()].reduce((s, v) => s + v.sessions, 0);
    return [...m.entries()].map(([reason, v]) => ({ reason, ...v, pct: total ? v.sessions / total : 0 }))
      .sort((a, b) => b.sessions - a.sessions);
  }, [rows, billing]);

  const stateRows = useMemo(() => groupAgg(rows, billing, r => r.state || "—"), [rows, billing]);
  const clientRows = useMemo(() => groupAgg(rows, billing, r => r.client).map(g => ({
    ...g,
    risk: g.cancellations >= 10 || g.cancRate >= 0.25 ? "high" : g.cancRate >= 0.15 ? "medium" : "low",
  })), [rows, billing]);
  const rbtRows = useMemo(() => groupAgg(rows, billing, r => r.rbt).filter(g => g.label !== "—"), [rows, billing]);
  const bcbaRows = useMemo(() => groupAgg(rows, billing, r => r.bcba || "Unassigned"), [rows, billing]);
  const locationRows = useMemo(() => groupAgg(rows, billing, r => r.location || "—"), [rows, billing]);

  const highRiskClients = clientRows.filter(c => c.risk === "high").sort((a, b) => b.lostRevenue - a.lostRevenue);
  const highRiskRbts = rbtRows.filter(r => r.cancRate >= 0.2 && r.cancellations >= 5)
    .sort((a, b) => b.cancRate - a.cancRate);

  // timing analysis
  const timing = useMemo(() => {
    const buckets = { sameDay: 0, under24: 0, h24_48: 0, over48: 0, unknown: 0 };
    for (const r of rows.filter(x => x.isCancelled)) {
      const h = r.hoursBetween;
      if (h === null) buckets.unknown++;
      else if (h < 8) buckets.sameDay++;
      else if (h < 24) buckets.under24++;
      else if (h < 48) buckets.h24_48++;
      else buckets.over48++;
    }
    return buckets;
  }, [rows]);

  /* ---- save ---- */
  async function handleSaveReport() {
    if (!scheduleRaws.length) {
      toast.error("Upload a scheduling file first.");
      return;
    }
    const defaultName = `Cancellation · ${new Date().toLocaleDateString()}`;
    const name = window.prompt("Name this report:", defaultName);
    if (!name) return;
    const insights = buildInsights(processedAll, agg.lostRevenue);
    try {
      const saved = await saveCancellationReport({
        name,
        scheduleFileName,
        billingFileName: billingFileName || undefined,
        authFileNames,
        scheduleRaws,
        billingRaws,
        authRecords,
        insights,
      });
      if (saved.remoteSyncError) {
        toast.warning(`Saved "${saved.name}" locally — cloud sync failed, so it may not appear on other devices yet.`);
      } else {
        toast.success(`Saved "${saved.name}"`);
      }
    } catch {
      toast.error("Couldn't save report — please try again.");
    }
  }

  /* ---- exports ---- */
  function exportCsv() {
    const cols = ["Date", "Status", "Client", "RBT", "BCBA", "Code", "Hours", "State", "Location", "Payor", "Reason", "Cancelled On", "Hours Notice"];
    const data = rows.map(r => [
      r.date ? r.date.toISOString().slice(0, 10) : "",
      r.status, r.client, r.rbt, r.bcba, r.code,
      r.hours.toFixed(2), r.state, r.location, r.payor, r.reasonRaw,
      r.cancelledOn ? r.cancelledOn.toISOString().slice(0, 10) : "",
      r.hoursBetween !== null ? r.hoursBetween.toFixed(1) : "",
    ]);
    downloadBlob(`cancellations-${Date.now()}.csv`, "text/csv;charset=utf-8;", toCsv(cols, data));
  }
  function exportExcel() {
    // Excel can open CSV directly; provide .xls extension TSV for spreadsheet apps.
    const cols = ["Date", "Status", "Client", "RBT", "BCBA", "Code", "Hours", "State", "Reason"];
    const data = rows.map(r => [
      r.date ? r.date.toISOString().slice(0, 10) : "",
      r.status, r.client, r.rbt, r.bcba, r.code,
      r.hours.toFixed(2), r.state, r.reasonRaw,
    ]);
    downloadBlob(`cancellations-${Date.now()}.xls`, "application/vnd.ms-excel", toCsv(cols, data));
  }
  function emailSnapshot() {
    const lines = [
      `Cancellation Command Center Snapshot`,
      ``,
      `Scheduled: ${fmt0(rows.length)}`,
      `Completed: ${fmt0(agg.rendered.length)}`,
      `Cancelled: ${fmt0(agg.cancelled.length)} (${fmtPct(agg.cancRate)})`,
      `Lost Hours: ${fmt1(agg.lostHours)}`,
      `Lost Revenue: ${fmtMoney(agg.lostRevenue)}`,
      `Excused: ${agg.excused} · Unexcused: ${agg.unexcused}`,
    ].join("\n");
    window.location.href = `mailto:?subject=${encodeURIComponent("Cancellation Snapshot")}&body=${encodeURIComponent(lines)}`;
  }

  const hasSchedule = scheduleRaws.length > 0;
  const hasBilling = billingRaws.length > 0;
  const hasAuths = authRecords.length > 0;
  const anyUpload = hasSchedule || hasBilling || hasAuths;
  const allUploaded = hasSchedule && hasBilling && hasAuths;
  const hasData = built && processedAll.length > 0;

  function handleBuild() {
    if (!hasSchedule) {
      toast.error("Upload a Scheduling report to build the dashboard. Billing and Authorization are optional.");
      return;
    }
    setBuilt(true);
    if (allUploaded) toast.success("Dashboard built from Scheduling, Billing, and Authorization reports.");
    else if (hasBilling || hasAuths) toast.success("Dashboard built. Add the remaining optional reports anytime for richer analytics.");
    else toast.success("Dashboard built from Scheduling. Add Billing (revenue) or Authorization (BCBA attribution) anytime.");
  }

  /* ============================================================
   * RENDER
   * ============================================================ */
  return (
    <OSShell>
      {/* HERO */}
      <section className="os-rise relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-[hsl(345_85%_98%)] via-[hsl(15_100%_98%)] to-[hsl(35_100%_98%)] p-7 shadow-[0_30px_70px_-40px_hsl(345_60%_50%/0.4)]">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[hsl(345_85%_92%)] opacity-50 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="secondary" className="rounded-full bg-white/70 text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(345_70%_50%)]">
              Featured Dashboard
            </Badge>
            <h1 className="mt-3 text-[34px] font-semibold tracking-tight md:text-[40px]">Cancellation Command Center</h1>
            <p className="mt-1 max-w-2xl text-[14px] text-muted-foreground">
              Single source of truth for cancellations, lost hours, utilization leakage, staffing issues and revenue impact across every state.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ReportAIButton preset="cancellation-center" />
            <Button variant="outline" size="sm" onClick={() => scheduleInput.current?.click()}>
              <Upload className="mr-1 h-3.5 w-3.5" />Scheduling
            </Button>
            <Button variant="outline" size="sm" onClick={() => billingInput.current?.click()}>
              <Upload className="mr-1 h-3.5 w-3.5" />Billing
            </Button>
            <Button variant="outline" size="sm" onClick={() => authInput.current?.click()}>
              <Upload className="mr-1 h-3.5 w-3.5" />Authorizations
            </Button>
            {hasData && (
              <Button size="sm" className="bg-[hsl(345_70%_50%)] hover:bg-[hsl(345_70%_45%)]" onClick={handleSaveReport}>
                <Save className="mr-1 h-3.5 w-3.5" />Save Report
              </Button>
            )}
            {hasData && (
              <Button variant="ghost" size="sm" onClick={resetAll}>
                <X className="mr-1 h-3.5 w-3.5" />Clear
              </Button>
            )}
          </div>
        </div>

        {/* hidden file inputs */}
        <input ref={scheduleInput} type="file" accept={SUPPORTED_EXTENSIONS} className="hidden"
          onChange={(e) => handleSchedule(e.target.files)} />
        <input ref={billingInput} type="file" accept={SUPPORTED_EXTENSIONS} className="hidden"
          onChange={(e) => handleBilling(e.target.files)} />
        <input ref={authInput} type="file" accept={SUPPORTED_EXTENSIONS} multiple className="hidden"
          onChange={(e) => handleAuths(e.target.files)} />

        <CentralReachRequirementsCard
          exportName="Three CentralReach exports — Scheduling (required), Billing, Authorizations"
          requiredColumns={[
            "Scheduling: StartDateTime, ClientName, Provider, BCBA, Status, CancelledOn, Reason, ProcedureCode, Hours, Location/State, Payor",
            "Billing: DateOfService, ClientName, ProcedureCode, TimeWorkedInHours, ClientChargesTotal",
            "Authorizations: ClientName, BCBA, StartDate, EndDate",
          ]}
          filterNote="Scheduling export is required to run the dashboard. Billing enables lost-revenue math. Authorization export drives coverage/leakage. Uses the shared admin cancellation datasets by default — upload files here only for a one-off view."
          adminUploadsHref="/system/cancellation-uploads"
          adminSourceLabel={
            sharedAvailable.scheduling || sharedAvailable.billing || sharedAvailable.authorization
              ? "Auto-loads from Admin Uploads"
              : "No admin datasets yet"
          }
        />

        <SourceCoverageBanner
          reportKey={["cancellation-scheduling", "cancellation-billing", "cancellation-authorization"]}
        />

        <div className="mt-4 grid gap-3">
          <SharedDatasetStatusPanel
            title="Cancellation — Scheduling"
            result={sharedResults["cancellation-scheduling"]}
            loading={sharedLoading}
            sourceMode={sourceModeByKind["cancellation-scheduling"]}
            adminUploadsHref="/system/cancellation-uploads"
            onReload={() => loadSharedKind("cancellation-scheduling", false)}
            onResetToShared={() => { resetSchedule(); loadSharedKind("cancellation-scheduling", false); }}
            required
          />
          <SharedDatasetStatusPanel
            title="Cancellation — Billing (optional)"
            result={sharedResults["cancellation-billing"]}
            loading={sharedLoading}
            sourceMode={sourceModeByKind["cancellation-billing"]}
            adminUploadsHref="/system/cancellation-uploads"
            onReload={() => loadSharedKind("cancellation-billing", false)}
            onResetToShared={() => { resetBilling(); loadSharedKind("cancellation-billing", false); }}
          />
          <SharedDatasetStatusPanel
            title="Cancellation — Authorization (optional)"
            result={sharedResults["cancellation-authorization"]}
            loading={sharedLoading}
            sourceMode={sourceModeByKind["cancellation-authorization"]}
            adminUploadsHref="/system/cancellation-uploads"
            onReload={() => loadSharedKind("cancellation-authorization", false)}
            onResetToShared={() => { resetAuths(); loadSharedKind("cancellation-authorization", false); }}
          />
        </div>

        {/* upload chips */}
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <UploadChip
            label="Scheduling Report"
            sub="Required · cancellation source"
            fileName={scheduleFileName}
            tone="rose"
            onClick={() => scheduleInput.current?.click()}
          />
          <UploadChip
            label="Billing Report"
            sub="Revenue per code"
            fileName={billingFileName}
            tone="emerald"
            onClick={() => billingInput.current?.click()}
          />
          <UploadChip
            label="Authorization Report(s)"
            sub="BCBA attribution"
            fileName={authFileNames.join(", ")}
            tone="violet"
            onClick={() => authInput.current?.click()}
          />
        </div>
        {restoredFromSession && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Restored your last session — re-upload to refresh.
          </div>
        )}
      </section>

      {loading && (
        <p className="mt-3 text-[12px] text-muted-foreground">Parsing file…</p>
      )}

      {!hasData ? (
        anyUpload ? (
          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Build the Cancellation dashboard</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Scheduling is required. Billing (for lost-revenue math) and Authorization (for BCBA attribution) are optional enhancers.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                {hasSchedule ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <span className="h-4 w-4 rounded-full border border-muted-foreground/40" />}
                <span className={hasSchedule ? "text-foreground" : "text-muted-foreground"}>
                  Scheduling Report <span className="text-[11px] font-medium uppercase tracking-wide text-[hsl(345_70%_50%)]">· Required</span>
                  {hasSchedule && ` · ${scheduleFileName}`}
                </span>
              </li>
              <li className="flex items-center gap-2">
                {hasBilling ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <span className="h-4 w-4 rounded-full border border-muted-foreground/40" />}
                <span className={hasBilling ? "text-foreground" : "text-muted-foreground"}>
                  Billing Report <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">· Optional</span>
                  {hasBilling && ` · ${billingFileName}`}
                </span>
              </li>
              <li className="flex items-center gap-2">
                {hasAuths ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <span className="h-4 w-4 rounded-full border border-muted-foreground/40" />}
                <span className={hasAuths ? "text-foreground" : "text-muted-foreground"}>
                  Authorization Report(s) <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">· Optional</span>
                  {hasAuths && ` · ${authFileNames.join(", ")}`}
                </span>
              </li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                size="sm"
                className="bg-[hsl(345_70%_50%)] hover:bg-[hsl(345_70%_45%)]"
                disabled={!hasSchedule}
                onClick={handleBuild}
              >
                {allUploaded ? "Build Dashboard" : "Build Dashboard (Scheduling only)"}
              </Button>
              <Button size="sm" variant="ghost" onClick={resetAll}>Clear uploads</Button>
            </div>
            {!hasSchedule ? (
              <p className="mt-3 text-[12px] text-muted-foreground">
                Scheduling export is required to build the dashboard. Billing and Authorization are optional and can be added later.
              </p>
            ) : !allUploaded && (
              <p className="mt-3 text-[12px] text-muted-foreground">
                You can build now with Scheduling only. Add Billing for lost-revenue math and Authorization for BCBA attribution anytime.
              </p>
            )}
          </section>
        ) : (
          <EmptyState />
        )
      ) : (
        <>
          {/* FILTERS */}
          <section className="mt-6 rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
            {/* Top bar: search + filter count + actions */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search client, RBT, BCBA, reason…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 w-72 rounded-xl border-border/70 bg-muted/60 pl-9 text-sm placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition hover:bg-primary/20"
                  >
                    <X className="h-3 w-3" />
                    {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportCsv}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />CSV
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportExcel}>
                  <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />Excel
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.print()}>
                  <Printer className="mr-1.5 h-3.5 w-3.5" />Print
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={emailSnapshot}>Email</Button>
              </div>
            </div>

            {/* Divider */}
            <div className="my-4 border-t border-border/60" />

            {/* Filter dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect label="State" value={stateFilter} setValue={setStateFilter} options={states} />
              <FilterSelect label="BCBA" value={bcbaFilter} setValue={setBcbaFilter} options={bcbas} />
              <FilterSelect label="RBT" value={rbtFilter} setValue={setRbtFilter} options={rbts} />
              <FilterSelect label="Client" value={clientFilter} setValue={setClientFilter} options={clients} />
              <FilterSelect label="Payor" value={payorFilter} setValue={setPayorFilter} options={payors} />
              <FilterSelect label="Code" value={codeFilter} setValue={setCodeFilter} options={codes} />
              <FilterSelect label="Reason" value={statusFilter} setValue={setStatusFilter} options={statuses} />
              <FilterSelect label="Location" value={locationFilter} setValue={setLocationFilter} options={locations} />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <CalendarRange className="mr-1.5 h-3.5 w-3.5" />
                    {dateFrom || dateTo ? `${dateFrom || "…"} → ${dateTo || "…"}` : "Date range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72">
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-muted-foreground">From</label>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8" />
                    <label className="text-[11px] font-medium text-muted-foreground">To</label>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8" />
                    <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </section>

          {/* COMPACT KPI STRIP */}
          <section className="mt-4 flex flex-wrap items-center gap-2">
            <KpiPill label="Scheduled" value={fmt0(rows.length)} />
            <KpiPill label="Completed" value={fmt0(agg.rendered.length)} tone="emerald" />
            <KpiPill label="Cancelled" value={fmt0(agg.cancelled.length)} tone="rose" />
            <KpiPill label="Cancel Rate" value={fmtPct(agg.cancRate)} tone={agg.cancRate > 0.2 ? "rose" : "default"} />
            <KpiPill label="Lost Hrs" value={fmt1(agg.lostHours)} tone="rose" />
            <KpiPill label="Lost $" value={fmtMoney(agg.lostRevenue)} tone="rose" />
            <KpiPill label="Unexcused" value={fmt0(agg.unexcused)} tone="rose" />
            <KpiPill
              label="MoM"
              value={agg.momDelta === 0 ? "—" : `${agg.momDelta > 0 ? "+" : ""}${(agg.momDelta * 100).toFixed(1)}%`}
              tone={agg.momDelta > 0 ? "rose" : agg.momDelta < 0 ? "emerald" : "default"}
            />
          </section>

          {/* PRIMARY: CANCELLATION LOG (≈70% of screen) */}
          <section className="mt-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-semibold tracking-tight">Cancellation log</h2>
                <p className="text-[12px] text-muted-foreground">
                  Every cancellation in the selected range. Click any row's status to advance follow-up · click a name to filter.
                </p>
              </div>
              <div className="hidden text-[11px] text-muted-foreground md:flex items-center gap-3">
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Todo</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-500" />Contacted</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Resolved</span>
              </div>
            </div>
            <CancellationLogTable
              rows={rows.filter(r => r.isCancelled)}
              billing={billing}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={(key) => {
                if (sortBy === key) setSortDir(d => d === "asc" ? "desc" : "asc");
                else { setSortBy(key); setSortDir("desc"); }
              }}
              followUps={followUps}
              onFollowUpClick={(r) => cycleFollowUp(rowKey(r))}
              rowKey={rowKey}
              onClientClick={(c) => setClientFilter(c)}
              onRbtClick={(rb) => setRbtFilter(rb)}
              onBcbaClick={(b) => setBcbaFilter(b)}
            />
          </section>

          {/* SECONDARY: tabbed breakdowns */}
          <section className="mt-6">
            <Tabs defaultValue="reason">
              <div className="flex items-center justify-between gap-3">
                <SectionHeader title="Breakdowns" subtitle="Supporting analysis. Click any row to filter the log above." />
                <TabsList className="h-9">
                  <TabsTrigger value="reason" className="text-xs">Reasons</TabsTrigger>
                  <TabsTrigger value="clients" className="text-xs">Clients</TabsTrigger>
                  <TabsTrigger value="rbts" className="text-xs">RBTs</TabsTrigger>
                  <TabsTrigger value="bcbas" className="text-xs">BCBAs</TabsTrigger>
                  <TabsTrigger value="states" className="text-xs">States · Locations</TabsTrigger>
                  <TabsTrigger value="timing" className="text-xs">Timing · Trend</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="reason" className="mt-3">
                <DataTable
                  columns={[
                    { key: "reason", label: "Reason" },
                    { key: "sessions", label: "Sessions Lost", align: "right" },
                    { key: "hours", label: "Hours Lost", align: "right", formatter: fmt1 },
                    { key: "pct", label: "% of Cancels", align: "right", formatter: fmtPct },
                    { key: "revenue", label: "Lost Revenue", align: "right", formatter: fmtMoney },
                  ]}
                  rows={reasonRows}
                  onRowClick={(r) => setStatusFilter(r.reason as string)}
                />
              </TabsContent>

              <TabsContent value="clients" className="mt-3">
                <DataTable
                  columns={[
                    { key: "label", label: "Client" },
                    { key: "scheduled", label: "Scheduled", align: "right" },
                    { key: "cancellations", label: "Cancelled", align: "right" },
                    { key: "cancRate", label: "Cancel %", align: "right", formatter: fmtPct },
                    { key: "lostHours", label: "Hours Lost", align: "right", formatter: fmt1 },
                    { key: "lostRevenue", label: "Lost Revenue", align: "right", formatter: fmtMoney },
                    { key: "risk", label: "Risk", align: "center", formatter: (v) => <RiskBadge level={v as string} /> },
                  ]}
                  rows={clientRows.sort((a, b) => b.cancellations - a.cancellations).slice(0, 100)}
                  onRowClick={(r) => setClientFilter(r.label as string)}
                />
              </TabsContent>

              <TabsContent value="rbts" className="mt-3">
                <DataTable
                  columns={[
                    { key: "label", label: "RBT" },
                    { key: "scheduled", label: "Scheduled", align: "right" },
                    { key: "cancellations", label: "Cancelled", align: "right" },
                    { key: "cancRate", label: "Cancel %", align: "right", formatter: fmtPct },
                    { key: "lostHours", label: "Hours Lost", align: "right", formatter: fmt1 },
                    { key: "providerCancels", label: "Provider Cancels", align: "right" },
                  ]}
                  rows={rbtRows.sort((a, b) => b.cancellations - a.cancellations).slice(0, 100)}
                  onRowClick={(r) => setRbtFilter(r.label as string)}
                />
              </TabsContent>

              <TabsContent value="bcbas" className="mt-3">
                <DataTable
                  columns={[
                    { key: "label", label: "BCBA" },
                    { key: "scheduled", label: "Scheduled", align: "right" },
                    { key: "rendered", label: "Completed", align: "right" },
                    { key: "cancellations", label: "Cancelled", align: "right" },
                    { key: "cancRate", label: "Cancel %", align: "right", formatter: fmtPct },
                    { key: "lostHours", label: "Hours Lost", align: "right", formatter: fmt1 },
                    { key: "lostRevenue", label: "Lost Revenue", align: "right", formatter: fmtMoney },
                    { key: "clientCount", label: "Active Clients", align: "right" },
                  ]}
                  rows={bcbaRows.sort((a, b) => b.lostRevenue - a.lostRevenue).slice(0, 100)}
                  onRowClick={(r) => setBcbaFilter(r.label as string)}
                />
              </TabsContent>

              <TabsContent value="states" className="mt-3 grid gap-4 lg:grid-cols-2">
                <Panel title="State performance">
                  <DataTable
                    compact
                    columns={[
                      { key: "label", label: "State" },
                      { key: "scheduled", label: "Sched.", align: "right" },
                      { key: "cancellations", label: "Cancel", align: "right" },
                      { key: "cancRate", label: "%", align: "right", formatter: fmtPct },
                      { key: "lostHours", label: "Hrs Lost", align: "right", formatter: fmt1 },
                      { key: "lostRevenue", label: "$ Lost", align: "right", formatter: fmtMoney },
                    ]}
                    rows={stateRows.sort((a, b) => b.lostRevenue - a.lostRevenue)}
                    onRowClick={(r) => setStateFilter(r.label as string)}
                  />
                </Panel>
                <Panel title="Location performance">
                  <DataTable
                    compact
                    columns={[
                      { key: "label", label: "Location" },
                      { key: "scheduled", label: "Sched.", align: "right" },
                      { key: "cancellations", label: "Cancel", align: "right" },
                      { key: "cancRate", label: "%", align: "right", formatter: fmtPct },
                      { key: "lostHours", label: "Hrs Lost", align: "right", formatter: fmt1 },
                      { key: "lostRevenue", label: "$ Lost", align: "right", formatter: fmtMoney },
                    ]}
                    rows={locationRows.sort((a, b) => b.lostHours - a.lostHours)}
                    onRowClick={(r) => setLocationFilter(r.label as string)}
                  />
                </Panel>
              </TabsContent>

              <TabsContent value="timing" className="mt-3 grid gap-4 lg:grid-cols-2">
                <Panel title="Cancellation timing">
                  <p className="text-[11px] text-muted-foreground">Hours between cancellation and session start.</p>
                  <div className="mt-3 space-y-2">
                    <TimingBar label="Same day (< 8h)" value={timing.sameDay} tone="rose" />
                    <TimingBar label="Under 24h" value={timing.under24} tone="amber" />
                    <TimingBar label="24–48h" value={timing.h24_48} tone="default" />
                    <TimingBar label="48h+" value={timing.over48} tone="emerald" />
                    <TimingBar label="Unknown" value={timing.unknown} tone="default" />
                  </div>
                </Panel>
                <Panel title="Lost hours by month">
                  <MiniTrend months={agg.months} metric={(m) => m.lostHours} formatter={fmt1} />
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <Stat label="This Month" value={fmt1(agg.months[agg.months.length - 1]?.[1].lostHours || 0)} tone="rose" />
                    <Stat label="Trailing 90d" value={fmt1(agg.months.slice(-3).reduce((s, [, v]) => s + v.lostHours, 0))} tone="rose" />
                    <Stat label="Year-to-date" value={fmt1(agg.lostHours)} tone="rose" />
                  </div>
                </Panel>
              </TabsContent>
            </Tabs>
          </section>

          {/* AI INSIGHTS — compact footer */}
          <section className="mt-6 rounded-2xl border border-[hsl(345_70%_50%/0.18)] bg-[hsl(345_100%_99%)] p-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[hsl(345_70%_50%)]" />
                <span className="text-[12px] font-semibold tracking-tight">Blossom AI</span>
              </div>
              {buildInsights(rows, agg.lostRevenue).map((t, i) => (
                <span key={i} className="text-[12px] text-[hsl(345_30%_30%)]">• {t}</span>
              ))}
            </div>
          </section>
        </>
      )}
    </OSShell>
  );
}

/* ============================================================
 * Helpers — aggregations
 * ============================================================ */
function groupAgg(rows: ScheduleRow[], billing: BillingLite[], keyFn: (r: ScheduleRow) => string) {
  type G = {
    label: string; scheduled: number; rendered: number; cancellations: number;
    lostHours: number; lostRevenue: number; clientCount: number; providerCancels: number;
    cancRate: number; clients: Set<string>;
  };
  const m = new Map<string, G>();
  for (const r of rows) {
    const k = keyFn(r) || "—";
    let g = m.get(k);
    if (!g) {
      g = {
        label: k, scheduled: 0, rendered: 0, cancellations: 0,
        lostHours: 0, lostRevenue: 0, clientCount: 0, providerCancels: 0, cancRate: 0,
        clients: new Set<string>(),
      };
      m.set(k, g);
    }
    g.scheduled++;
    if (r.status === "Rendered") g.rendered++;
    g.clients.add(r.client);
    if (r.isCancelled) {
      g.cancellations++;
      g.lostHours += r.hours;
      g.lostRevenue += r.hours * estimateRevenuePerHour(r.code, billing);
      if (r.status === "Provider Cancelled") g.providerCancels++;
    }
  }
  for (const g of m.values()) {
    g.cancRate = g.scheduled ? g.cancellations / g.scheduled : 0;
    g.clientCount = g.clients.size;
  }
  return [...m.values()];
}

/* ============================================================
 * Presentation components
 * ============================================================ */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-[16px] font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="text-[12px] text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function UploadChip({ label, sub, fileName, tone, onClick }: {
  label: string; sub: string; fileName?: string; tone: "rose" | "emerald" | "violet"; onClick: () => void;
}) {
  const tones: Record<string, string> = {
    rose: "border-rose-200 bg-rose-50/60 text-rose-700",
    emerald: "border-emerald-200 bg-emerald-50/60 text-emerald-700",
    violet: "border-violet-200 bg-violet-50/60 text-violet-700",
  };
  return (
    <button onClick={onClick}
      className={cn(
        "group flex items-start gap-3 rounded-2xl border bg-white/80 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
        fileName ? "border-border/60" : tones[tone],
      )}>
      <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl", tones[tone])}>
        <Upload className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold tracking-tight">{label}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
        {fileName && (
          <p className="mt-1 truncate text-[11px] font-medium text-emerald-700">
            <CheckCircle2 className="mr-1 inline h-3 w-3" />{fileName}
          </p>
        )}
      </div>
    </button>
  );
}

function Kpi({ label, value, tone = "default", icon: Icon }: {
  label: string; value: string; tone?: "default" | "rose" | "emerald"; icon?: any;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />}
      </div>
      <p className={cn(
        "mt-1 text-[22px] font-semibold tabular-nums tracking-tight",
        tone === "rose" && "text-rose-600",
        tone === "emerald" && "text-emerald-600",
      )}>{value}</p>
    </div>
  );
}

function Panel({ title, children, tone }: { title: string; children: React.ReactNode; tone?: "rose" | "emerald" }) {
  return (
    <div className={cn(
      "rounded-2xl border border-border/60 bg-card p-4 shadow-sm",
      tone === "rose" && "border-rose-200/70",
      tone === "emerald" && "border-emerald-200/70",
    )}>
      <h3 className="text-[14px] font-semibold tracking-tight">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "rose" | "emerald" }) {
  return (
    <div className="rounded-xl bg-secondary/40 p-2.5">
      <p className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn(
        "mt-0.5 text-[18px] font-semibold tabular-nums tracking-tight",
        tone === "rose" && "text-rose-600",
        tone === "emerald" && "text-emerald-600",
      )}>{value}</p>
    </div>
  );
}

function FilterSelect({ label, value, setValue, options }: {
  label: string; value: string; setValue: (v: string) => void; options: string[];
}) {
  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger className="h-8 w-auto min-w-[110px] text-xs">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{label}: All</SelectItem>
        {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function RiskBadge({ level }: { level: string }) {
  const tones: Record<string, string> = {
    high: "bg-rose-100 text-rose-700 border-rose-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  return (
    <span className={cn("inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", tones[level])}>
      {level}
    </span>
  );
}

function MiniTrend<T extends { lostHours: number; lostRev: number; cancelled: number }>(
  { months, metric, formatter }: { months: [string, T][]; metric: (m: T) => number; formatter: (n: number) => string }
) {
  if (!months.length) return <p className="text-[11px] text-muted-foreground">No data for selected range.</p>;
  const values = months.map(([, m]) => metric(m));
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1.5">
      {months.map(([k, m], i) => {
        const v = metric(m);
        const h = Math.max(4, (v / max) * 80);
        return (
          <div key={k} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-20 w-full items-end">
              <div
                className="w-full rounded-t bg-[hsl(345_70%_55%)]/70"
                style={{ height: `${h}px` }}
                title={`${k}: ${formatter(v)}`}
              />
            </div>
            <span className="text-[9px] text-muted-foreground">{k.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

function TimingBar({ label, value, tone }: { label: string; value: number; tone: "rose" | "amber" | "emerald" | "default" }) {
  const tones: Record<string, string> = {
    rose: "bg-rose-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    default: "bg-slate-400",
  };
  return (
    <div>
      <div className="flex items-center justify-between text-[11.5px]">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">{value}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary/60">
        <div className={cn("h-full", tones[tone])} style={{ width: `${Math.min(100, value * 4)}%` }} />
      </div>
    </div>
  );
}

interface ColumnDef {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  formatter?: (v: any) => React.ReactNode;
}
function DataTable({ columns, rows, onRowClick, compact }: {
  columns: ColumnDef[]; rows: Record<string, any>[]; onRowClick?: (row: Record<string, any>) => void; compact?: boolean;
}) {
  if (!rows.length) {
    return <p className="rounded-md border border-dashed border-border/60 p-3 text-center text-[12px] text-muted-foreground">No rows.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full text-[12.5px]">
        <thead className="bg-secondary/40 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            {columns.map(c => (
              <th key={c.key} className={cn("px-2.5 py-2 font-semibold", c.align === "right" && "text-right", c.align === "center" && "text-center", !c.align && "text-left")}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((r, i) => (
            <tr
              key={i}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={cn("transition", onRowClick && "cursor-pointer hover:bg-secondary/40", compact && "text-[12px]")}
            >
              {columns.map(c => {
                const raw = r[c.key];
                const out = c.formatter ? c.formatter(raw) : raw;
                return (
                  <td key={c.key} className={cn(
                    "px-2.5 py-1.5",
                    c.align === "right" && "text-right tabular-nums",
                    c.align === "center" && "text-center",
                  )}>{out}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="mt-8 rounded-2xl border border-dashed border-border/60 bg-secondary/20 px-8 py-12 text-center">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(345_85%_92%)] text-[hsl(345_70%_50%)]">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-[16px] font-semibold">Upload your CentralReach scheduling export to begin</h3>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        Scheduling is required. Add Billing for revenue math and Authorizations to attribute cancellations to BCBAs.
      </p>
    </section>
  );
}

/* ============================================================
 * Cancellation Log — primary table (dense, sortable, action-focused)
 * ============================================================ */
function KpiPill({ label, value, tone = "default" }: {
  label: string; value: string; tone?: "default" | "rose" | "emerald";
}) {
  return (
    <div className={cn(
      "inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-sm",
      tone === "rose" && "border-rose-200/70",
      tone === "emerald" && "border-emerald-200/70",
      tone === "default" && "border-border/60",
    )}>
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <span className={cn(
        "text-[13px] font-semibold tabular-nums tracking-tight",
        tone === "rose" && "text-rose-600",
        tone === "emerald" && "text-emerald-600",
      )}>{value}</span>
    </div>
  );
}

function FollowUpChip({ status }: { status: "todo" | "contacted" | "resolved" }) {
  const styles: Record<string, string> = {
    todo: "bg-amber-100 text-amber-700 border-amber-200",
    contacted: "bg-sky-100 text-sky-700 border-sky-200",
    resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  const labels: Record<string, string> = { todo: "Todo", contacted: "Contacted", resolved: "Resolved" };
  return (
    <span className={cn(
      "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition hover:scale-105",
      styles[status],
    )}>{labels[status]}</span>
  );
}

function StatusBadge({ row }: { row: ScheduleRow }) {
  const tone = row.isExcused
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-rose-50 text-rose-700 border-rose-200";
  return (
    <span className={cn("inline-flex rounded-md border px-1.5 py-0.5 text-[10.5px] font-medium", tone)}>
      {row.status}
    </span>
  );
}

function NoticeBadge({ hours }: { hours: number | null }) {
  if (hours === null) return <span className="text-muted-foreground">—</span>;
  let tone = "text-emerald-700";
  if (hours < 8) tone = "text-rose-700 font-semibold";
  else if (hours < 24) tone = "text-amber-700 font-medium";
  else if (hours < 48) tone = "text-foreground";
  const label = hours < 1 ? `<1h` : hours < 48 ? `${hours.toFixed(0)}h` : `${(hours / 24).toFixed(1)}d`;
  return <span className={cn("tabular-nums", tone)}>{label}</span>;
}

function CancellationLogTable({
  rows, billing, sortBy, sortDir, onSort,
  followUps, onFollowUpClick, rowKey,
  onClientClick, onRbtClick, onBcbaClick,
}: {
  rows: ScheduleRow[];
  billing: BillingLite[];
  sortBy: string; sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  followUps: Record<string, "todo" | "contacted" | "resolved">;
  onFollowUpClick: (r: ScheduleRow) => void;
  rowKey: (r: ScheduleRow) => string;
  onClientClick: (c: string) => void;
  onRbtClick: (r: string) => void;
  onBcbaClick: (b: string) => void;
}) {
  const sorted = useMemo(() => {
    const arr = [...rows];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      let av: any, bv: any;
      switch (sortBy) {
        case "date": av = a.date?.getTime() ?? 0; bv = b.date?.getTime() ?? 0; break;
        case "client": av = a.client; bv = b.client; break;
        case "bcba": av = a.bcba; bv = b.bcba; break;
        case "rbt": av = a.rbt; bv = b.rbt; break;
        case "code": av = a.code; bv = b.code; break;
        case "hours": av = a.hours; bv = b.hours; break;
        case "state": av = a.state; bv = b.state; break;
        case "reason": av = a.status; bv = b.status; break;
        case "notice": av = a.hoursBetween ?? Number.MAX_SAFE_INTEGER; bv = b.hoursBetween ?? Number.MAX_SAFE_INTEGER; break;
        case "revenue":
          av = a.hours * estimateRevenuePerHour(a.code, billing);
          bv = b.hours * estimateRevenuePerHour(b.code, billing);
          break;
        default: av = 0; bv = 0;
      }
      if (typeof av === "string") return av.localeCompare(bv) * dir;
      return (av - bv) * dir;
    });
    return arr;
  }, [rows, sortBy, sortDir, billing]);

  const Header = ({ k, label, align = "left" }: { k: string; label: string; align?: "left" | "right" | "center" }) => (
    <th
      onClick={() => onSort(k)}
      className={cn(
        "px-2.5 py-2 font-semibold cursor-pointer select-none hover:text-foreground transition",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortBy === k && <span className="text-[9px]">{sortDir === "asc" ? "▲" : "▼"}</span>}
      </span>
    </th>
  );

  if (!sorted.length) {
    return (
      <div className="mt-3 rounded-2xl border border-dashed border-border/60 bg-secondary/20 p-8 text-center">
        <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />
        <p className="mt-2 text-[13px] font-medium">No cancellations in current filter</p>
        <p className="text-[11.5px] text-muted-foreground">Adjust filters above or clear them to see all cancellations.</p>
      </div>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
      <div className="flex items-center justify-between border-b border-border/60 bg-secondary/30 px-3 py-1.5 text-[11px] text-muted-foreground">
        <span><span className="font-semibold text-foreground tabular-nums">{sorted.length.toLocaleString()}</span> cancellations</span>
        <span className="hidden md:inline">Click any column header to sort · Click the follow-up chip to advance status</span>
      </div>
      <div className="max-h-[68vh] overflow-auto">
        <table className="w-full text-[12.5px]">
          <thead className="sticky top-0 z-10 bg-secondary/60 text-[11px] uppercase tracking-wider text-muted-foreground backdrop-blur">
            <tr>
              <Header k="date" label="Date" />
              <Header k="client" label="Client" />
              <Header k="bcba" label="BCBA (Owner)" />
              <Header k="rbt" label="RBT" />
              <Header k="state" label="State" />
              <Header k="code" label="Code" />
              <Header k="hours" label="Hrs" align="right" />
              <Header k="notice" label="Notice" align="right" />
              <Header k="reason" label="Reason" />
              <th className="px-2.5 py-2 text-left font-semibold">Detail</th>
              <Header k="revenue" label="$ Lost" align="right" />
              <th className="px-2.5 py-2 text-center font-semibold">Follow-up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {sorted.map((r, i) => {
              const k = rowKey(r);
              const fu = followUps[k] || "todo";
              const rev = r.hours * estimateRevenuePerHour(r.code, billing);
              return (
                <tr key={i} className={cn(
                  "transition hover:bg-secondary/30",
                  fu === "resolved" && "opacity-60",
                )}>
                  <td className="whitespace-nowrap px-2.5 py-1.5 tabular-nums text-muted-foreground">
                    {r.date ? r.date.toISOString().slice(0, 10) : "—"}
                  </td>
                  <td className="px-2.5 py-1.5">
                    <button onClick={() => onClientClick(r.client)} className="font-medium hover:underline">
                      {r.client}
                    </button>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <button onClick={() => onBcbaClick(r.bcba)} className="text-[12px] hover:underline">
                      {r.bcba || "Unassigned"}
                    </button>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <button onClick={() => onRbtClick(r.rbt)} className="text-[12px] text-muted-foreground hover:underline hover:text-foreground">
                      {r.rbt}
                    </button>
                  </td>
                  <td className="px-2.5 py-1.5 text-[11.5px] text-muted-foreground">{r.state || "—"}</td>
                  <td className="px-2.5 py-1.5 tabular-nums text-[11.5px] text-muted-foreground">{r.code || "—"}</td>
                  <td className="px-2.5 py-1.5 text-right tabular-nums">{r.hours.toFixed(1)}</td>
                  <td className="px-2.5 py-1.5 text-right"><NoticeBadge hours={r.hoursBetween} /></td>
                  <td className="px-2.5 py-1.5"><StatusBadge row={r} /></td>
                  <td className="px-2.5 py-1.5 max-w-[260px] truncate text-[11.5px] text-muted-foreground" title={r.reasonRaw}>
                    {r.reasonRaw || "—"}
                  </td>
                  <td className="px-2.5 py-1.5 text-right tabular-nums text-rose-700">
                    {rev > 0 ? fmtMoney(rev) : "—"}
                  </td>
                  <td className="px-2.5 py-1.5 text-center">
                    <button onClick={() => onFollowUpClick(r)} className="cursor-pointer">
                      <FollowUpChip status={fu} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}