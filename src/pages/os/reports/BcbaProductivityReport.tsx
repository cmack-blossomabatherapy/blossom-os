import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Upload, FileSpreadsheet, Download, Search, Sparkles, ChevronRight, ChevronDown,
  Users, Stethoscope, GraduationCap, AlertTriangle, CheckCircle2, Printer, Trash2,
  ShieldCheck, FileWarning, ArrowUpDown, Save, CalendarRange, SlidersHorizontal, X,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseAnyFile, SUPPORTED_EXTENSIONS } from "@/lib/os/dashboardEngine/excelParser";
import {
  BCBA_LAST_SESSION_KEY, getSavedReport, saveReport,
} from "@/lib/os/bcbaSavedReports";
import { pushRecent } from "@/lib/os/reportsCatalog";

/* ---- Lightweight insights computed at save time for the Blossom AI Today panel ---- */
function computeBcbaInsights(billingRaws: BillingRaw[], authRecords: AuthRecord[]): string[] {
  if (!billingRaws.length) return [];
  const bcbaSet = new Set<string>();
  const clientSet = new Set<string>();
  const hoursByBcba = new Map<string, number>();
  let totalHours = 0;
  let h97155 = 0;
  let h97156 = 0;
  let ptClients = new Set<string>();
  let allPtClients = new Set<string>();
  for (const b of billingRaws) {
    if (b.provider) { bcbaSet.add(b.provider); hoursByBcba.set(b.provider, (hoursByBcba.get(b.provider) || 0) + (b.hours || 0)); }
    if (b.clientKey) {
      clientSet.add(b.clientKey);
      allPtClients.add(b.clientKey);
      if (b.pt) ptClients.add(b.clientKey);
    }
    totalHours += b.hours || 0;
    if (b.code === "97155") h97155 += b.hours || 0;
    if (b.code === "97156") h97156 += b.hours || 0;
  }
  const topBcba = [...hoursByBcba.entries()].sort((a, b) => b[1] - a[1])[0];
  const insights: string[] = [];
  insights.push(`${bcbaSet.size} BCBA${bcbaSet.size === 1 ? "" : "s"} across ${clientSet.size} client${clientSet.size === 1 ? "" : "s"} · ${totalHours.toFixed(1)} hrs analyzed.`);
  if (h97155 || h97156) insights.push(`Supervision ${h97155.toFixed(1)} hrs · Parent training ${h97156.toFixed(1)} hrs.`);
  if (topBcba) insights.push(`Top BCBA by hours: ${topBcba[0]} (${topBcba[1].toFixed(1)} hrs).`);
  if (allPtClients.size) {
    const pct = Math.round((ptClients.size / allPtClients.size) * 100);
    insights.push(`Parent training completed for ${ptClients.size}/${allPtClients.size} clients (${pct}%).`);
  }
  if (authRecords.length) insights.push(`${authRecords.length} authorization record${authRecords.length === 1 ? "" : "s"} cross-referenced.`);
  return insights;
}

/* ============================================================
 * BCBA Productivity Report (Standard Report)
 * A simple, table-first monthly productivity report.
 * Upload a CR billing/service export (one row per session)
 * OR a pre-aggregated BCBA roll-up.
 * ============================================================ */

type MinStatus = "Meets" | "Below" | "At Risk" | "Exceeds" | "—";

interface SessionRow {
  bcba: string;
  client: string;
  rbt: string;
  code: string;
  hours: number;
  date: string; // raw
  state: string;
  director: string;
  payor: string;
  parentTrainingCompleted: boolean;
  raw: Record<string, string>;
}

interface ClientAgg {
  name: string;
  h97155: number; h97156: number; total: number;
  parentTrainingCompleted: boolean;
  rbts: Set<string>;
  payor: string;
}

interface RbtAgg {
  name: string;
  clients: Set<string>;
  h97155Related: number;
  primaryClientCount: number; // unique clients where RBT appears
  status: string;
}

interface BcbaAgg {
  name: string;
  state: string;
  director: string;
  payors: Set<string>;
  h97155: number;
  h97156: number;
  h97151: number; // assessment
  h97153: number; // RBT direct (attributed via auth)
  hOther: number;
  total: number;
  payrollHours: number;
  clients: Map<string, ClientAgg>;
  rbts: Map<string, RbtAgg>;
  newClients: number;
  discharged: number;
  minimumHours: number;
  // computed
  activeClients: number;
  assignedRbts: number;
  avgHoursPerClient: number;
  avgHoursPerRbt: number;
  missingPT: number;
  missingSup: number;
  minStatus: MinStatus;
  flags: string[];
}

/* ----------- helpers ----------- */
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
const boolish = (v: any) => {
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return ["y", "yes", "true", "1", "complete", "completed", "done"].includes(s);
};
const fmt1 = (n: number) => (isFinite(n) ? n.toFixed(1) : "—");
const fmt0 = (n: number) => (isFinite(n) ? Math.round(n).toLocaleString() : "—");

function monthOf(d: string): string {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d.slice(0, 7);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}
function classifyCode(code: string) {
  const c = (code || "").trim();
  if (c.startsWith("97155")) return "97155";
  if (c.startsWith("97156")) return "97156";
  if (c.startsWith("97151") || c.startsWith("97152")) return "97151";
  if (c.startsWith("97153") || c.startsWith("97154")) return "97153";
  return c ? "other" : "other";
}

/* Date helpers for authorization attribution. */
function parseDate(v: string): number {
  if (!v) return NaN;
  const t = new Date(v).getTime();
  return isFinite(t) ? t : NaN;
}
function normName(s: string) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

/* ------- Authorization records (separate upload) ------- */
interface AuthRecord {
  client: string;
  clientKey: string; // normalized client name
  clientId: string;
  authNumber: string;
  startMs: number;
  endMs: number;
  startRaw: string;
  endRaw: string;
  code: string;
  bucket: string; // classified code
  bcba: string;
  payor: string;
  status: string;
  resourceId: string;
  managerId: string;
  followUpAuthNumber: string;
}

interface BillingRaw {
  provider: string;
  client: string;
  clientKey: string;
  clientId: string;
  code: string;
  bucket: string;
  hours: number;
  date: string;
  dateMs: number;
  state: string;
  director: string;
  payor: string;
  pt: boolean;
  raw: Record<string, string>;
  authId: string;
  authResourceId: string;
}

interface AttributionException {
  client: string;
  clientId: string;
  date: string;
  code: string;
  hours: number;
  provider: string;
  reason: string;
  authId?: string;
  authResourceId?: string;
  payor?: string;
  suggested?: string;
}

function downloadBlob(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime + ";charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function toCsv(columns: string[], rows: (string | number)[][]) {
  const esc = (v: any) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.map(esc).join(","), ...rows.map(r => r.map(esc).join(","))].join("\n");
}

/* ============================================================ */

const DEFAULT_MIN = 100;

export default function BcbaProductivityReport() {
  const [billingFileName, setBillingFileName] = useState("");
  const [authFileNames, setAuthFileNames] = useState<string[]>([]);
  const [billingRaws, setBillingRaws] = useState<BillingRaw[]>([]);
  const [authRecords, setAuthRecords] = useState<AuthRecord[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [authMissing, setAuthMissing] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(false);

  const [month, setMonth] = useState("all");
  const [stateF, setStateF] = useState("all");
  const [bcbaF, setBcbaF] = useState("all");
  const [dirF, setDirF] = useState("all");
  const [payorF, setPayorF] = useState("all");
  const [codesF, setCodesF] = useState<string[]>([]); // empty = all
  const [search, setSearch] = useState("");
  const [minHours, setMinHours] = useState(DEFAULT_MIN);
  const [dateFrom, setDateFrom] = useState<string>(""); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState<string>("");     // YYYY-MM-DD
  const [datePreset, setDatePreset] = useState<string>("all");

  function applyDatePreset(preset: string) {
    setDatePreset(preset);
    if (!dataRange) { setDateFrom(""); setDateTo(""); return; }
    const hi = new Date(dataRange.hiMs);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    if (preset === "all") { setDateFrom(""); setDateTo(""); return; }
    if (preset === "latest-month") {
      const start = new Date(hi.getFullYear(), hi.getMonth(), 1);
      const end = new Date(hi.getFullYear(), hi.getMonth() + 1, 0);
      setDateFrom(iso(start)); setDateTo(iso(end)); return;
    }
    if (preset === "last-3" || preset === "last-6") {
      const months = preset === "last-3" ? 3 : 6;
      const start = new Date(hi.getFullYear(), hi.getMonth() - (months - 1), 1);
      const end = new Date(hi.getFullYear(), hi.getMonth() + 1, 0);
      setDateFrom(iso(start)); setDateTo(iso(end)); return;
    }
    if (preset === "ytd") {
      const start = new Date(hi.getFullYear(), 0, 1);
      setDateFrom(iso(start)); setDateTo(iso(hi)); return;
    }
    if (preset === "full") {
      setDateFrom(iso(new Date(dataRange.loMs))); setDateTo(iso(hi)); return;
    }
  }

  const [sortKey, setSortKey] = useState<keyof BcbaAgg | "">("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (key: keyof BcbaAgg | "") => {
    if (!key) return;
    if (sortKey === key) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dragOver, setDragOver] = useState(false);
  const [authDragOver, setAuthDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const authInputRef = useRef<HTMLInputElement>(null);

  /* ---- parse billing report ---- */
  async function handleFiles(files: FileList | File[] | null) {
    if (!files || !files[0]) return;
    const file = files[0];
    setLoading(true);
    try {
      const parsed = await parseAnyFile(file);
      const first = parsed[0];
      if (!first) throw new Error("No data in file.");
      const headers = first.headers;

      const bcbaH = findH(headers, ["BCBA", "BCBA Name", "Provider", "Provider Name", "Supervisor", "Staff"]);
      const provFirstH = findH(headers, ["ProviderFirstName", "Provider First Name"]);
      const provLastH = findH(headers, ["ProviderLastName", "Provider Last Name"]);
      const clientH = findH(headers, ["Client", "Client Name", "Patient", "Patient Name"]);
      const cliFirstH = findH(headers, ["ClientFirstName", "Client First Name"]);
      const cliLastH = findH(headers, ["ClientLastName", "Client Last Name"]);
      const cliIdH = findH(headers, ["ClientId", "Client ID", "ClientNumber", "Client Number", "PatientId", "Patient ID", "MRN"]);
      const rbtH = findH(headers, ["RBT", "RBT Name", "Tech", "Technician", "BehaviorTechnician"]);
      const codeH = findH(headers, ["ProcedureCode", "Code", "CPT", "CPT Code", "ServiceCode", "Service Code", "Procedure", "Procedure Code"]);
      const hoursH = findH(headers, ["TimeWorkedInHours", "Hours", "BillableHours", "Worked Hours", "ServiceHours", "UnitsOfService", "Units"]);
      const dateH = findH(headers, ["DateOfService", "Date", "ServiceDate", "Service Date", "SessionDate", "DOS"]);
      const stateH = findH(headers, ["ClientLocationStateProvince", "ProviderLocationStateProvince", "ServiceLocationStateProvince", "State", "WorkState", "Location"]);
      const dirH = findH(headers, ["StateDirector", "Director", "RegionalDirector"]);
      const payorH = findH(headers, ["PayorName", "PayorNickname", "Payor", "Payer", "Insurance", "Funder"]);
      const ptH = findH(headers, ["ParentTrainingCompleted", "PT Completed", "ParentTraining"]);
      const authIdH = findH(headers, ["AuthorizationId", "Authorization Id", "AuthId", "AuthorizationID"]);
      const authResIdH = findH(headers, ["AuthorizationResourceId", "Authorization Resource Id", "AuthResourceId", "AuthorizationResourceID"]);

      const composeProv = (r: Record<string, string>) => {
        if (bcbaH) {
          const v = (r[bcbaH] || "").trim();
          if (v) return v;
        }
        const fn = provFirstH ? (r[provFirstH] || "").trim() : "";
        const ln = provLastH ? (r[provLastH] || "").trim() : "";
        return [fn, ln].filter(Boolean).join(" ").trim();
      };
      const composeClient = (r: Record<string, string>) => {
        if (clientH) {
          const v = (r[clientH] || "").trim();
          if (v) return v;
        }
        const fn = cliFirstH ? (r[cliFirstH] || "").trim() : "";
        const ln = cliLastH ? (r[cliLastH] || "").trim() : "";
        return [fn, ln].filter(Boolean).join(" ").trim();
      };

      const miss: string[] = [];
      if (!bcbaH && !(provFirstH || provLastH)) miss.push("BCBA / Provider name column");
      if (!clientH && !(cliFirstH || cliLastH)) miss.push("Client column");
      if (!codeH) miss.push("CPT / Service Code column");
      if (!hoursH) miss.push("Hours / Units column");

      if (miss.length) {
        setMissing(miss); setBillingRaws([]); setBillingFileName(file.name); return;
      }
      setMissing([]);

      const raws: BillingRaw[] = [];
      for (const r of first.rows) {
        const provider = composeProv(r);
        const client = composeClient(r);
        if (!provider) continue;
        const code = codeH ? (r[codeH] || "").trim() : "";
        const date = dateH ? (r[dateH] || "") : "";
        raws.push({
          provider, client, clientKey: normName(client),
          clientId: cliIdH ? (r[cliIdH] || "").trim() : "",
          code, bucket: classifyCode(code),
          hours: hoursH ? num(r[hoursH]) : 0,
          date, dateMs: parseDate(date),
          state: stateH ? (r[stateH] || "") : "",
          director: dirH ? (r[dirH] || "") : "",
          payor: payorH ? (r[payorH] || "") : "",
          pt: ptH ? boolish(r[ptH]) : false,
          raw: r,
          authId: authIdH ? (r[authIdH] || "").trim() : "",
          authResourceId: authResIdH ? (r[authResIdH] || "").trim() : "",
        });
      }
      setBillingRaws(raws);
      setBillingFileName(file.name);
      toast.success(`Loaded ${raws.length.toLocaleString()} billing rows`);
    } catch (e: any) {
      toast.error(`Failed to parse: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  /* ---- parse authorization report ---- */
  async function handleAuthFiles(files: FileList | File[] | null) {
    if (!files || !files.length) return;
    const fileList = Array.from(files as ArrayLike<File>);
    setLoadingAuth(true);
    const allMissing: string[] = [];
    const newRecs: AuthRecord[] = [];
    const loadedNames: string[] = [];
    try {
      for (const file of fileList) {
        try {
          const parsed = await parseAnyFile(file);
          const first = parsed[0];
          if (!first) { allMissing.push(`${file.name}: no data`); continue; }
          const headers = first.headers;

      const clientH = findH(headers, ["clientName", "ClientFullName", "Client", "Client Name", "Patient", "Patient Name", "Name"]);
      const cliFirstH = findH(headers, ["ClientFirstName", "Client First Name"]);
      const cliLastH = findH(headers, ["ClientLastName", "Client Last Name"]);
      const cliIdH = findH(headers, ["ClientId", "Client ID", "ClientNumber", "PatientId", "Patient ID", "MRN"]);
      const authNumH = findH(headers, ["AuthorizationNumber", "Auth Number", "Authorization #", "Auth #", "AuthId"]);
      const followUpH = findH(headers, ["FollowUpAuthorizationNumber", "Follow Up Authorization Number", "FollowUpAuthNumber", "FollowUp Auth Number"]);
      const actualStartH = findH(headers, ["ActualStartDate", "Actual Start Date"]);
      const actualEndH = findH(headers, ["ActualEndDate", "Actual End Date"]);
      const startH = findH(headers, ["AuthorizationStartDate", "Auth Start", "Auth Start Date", "Start Date", "startDate", "EffectiveDate", "Effective Date", "From"]);
      const endH = findH(headers, ["AuthorizationEndDate", "Auth End", "Auth End Date", "End Date", "endDate", "ExpirationDate", "Expiration Date", "Auth Exp. Date", "To"]);
      const codeH = findH(headers, ["ServiceCodes", "ProcedureCode", "Code", "CPT", "CPT Code", "ServiceCode", "Service Code", "Procedure"]);
      const bcbaH = findH(headers, ["BCBA", "BCBA Name", "Active BCBA", "managerName", "Manager Name", "Manager", "Provider", "Provider Name", "Supervisor", "AuthorizedProvider", "Authorized Provider"]);
      const managerIdH = findH(headers, ["managerId", "Manager Id", "ManagerID", "ManagerId"]);
      const resourceIdH = findH(headers, ["ResourceId", "Resource Id", "ResourceID"]);
      const payorH = findH(headers, ["PayorName", "Payor", "Payer", "Insurance", "Funder"]);
      const statusH = findH(headers, ["Status", "AuthorizationStatus", "Auth Status"]);

      const miss: string[] = [];
      if (!clientH && !(cliFirstH || cliLastH)) miss.push("Client column");
      if (!actualStartH && !startH) miss.push("Authorization Start Date column");
      if (!actualEndH && !endH) miss.push("Authorization End Date column");
      if (!bcbaH) miss.push("BCBA column");

          if (miss.length) {
            allMissing.push(`${file.name}: missing ${miss.join(", ")}`);
            continue;
          }

      const composeClient = (r: Record<string, string>) => {
        if (clientH) { const v = (r[clientH] || "").trim(); if (v) return v; }
        const fn = cliFirstH ? (r[cliFirstH] || "").trim() : "";
        const ln = cliLastH ? (r[cliLastH] || "").trim() : "";
        return [fn, ln].filter(Boolean).join(" ").trim();
      };

      for (const r of first.rows) {
        const client = composeClient(r);
        if (!client) continue;
        const code = codeH ? (r[codeH] || "").trim() : "";
        const actualStartRaw = actualStartH ? (r[actualStartH] || "").trim() : "";
        const actualEndRaw = actualEndH ? (r[actualEndH] || "").trim() : "";
        const fbStartRaw = startH ? (r[startH] || "").trim() : "";
        const fbEndRaw = endH ? (r[endH] || "").trim() : "";
        const startRaw = actualStartRaw || fbStartRaw;
        const endRaw = actualEndRaw || fbEndRaw;
        const bcba = bcbaH ? (r[bcbaH] || "").trim() : "";
        if (!bcba) continue;
            newRecs.push({
          client, clientKey: normName(client),
          clientId: cliIdH ? (r[cliIdH] || "").trim() : "",
          authNumber: authNumH ? (r[authNumH] || "").trim() : "",
          startRaw, endRaw,
          startMs: parseDate(startRaw),
          endMs: parseDate(endRaw),
          code, bucket: classifyCode(code),
          bcba,
          payor: payorH ? (r[payorH] || "").trim() : "",
          status: statusH ? (r[statusH] || "").trim() : "",
          resourceId: resourceIdH ? (r[resourceIdH] || "").trim() : "",
          managerId: managerIdH ? (r[managerIdH] || "").trim() : "",
          followUpAuthNumber: followUpH ? (r[followUpH] || "").trim() : "",
        });
      }
          loadedNames.push(file.name);
        } catch (err: any) {
          allMissing.push(`${file.name}: ${err?.message ?? err}`);
        }
      }

      // Merge with existing records, deduping by key.
      setAuthRecords(prev => {
        const seen = new Set<string>();
        const keyOf = (a: AuthRecord) =>
          [
            a.resourceId || `${a.clientKey}:${a.authNumber}`,
            a.clientId || a.clientKey,
            a.code,
            a.startRaw,
            a.endRaw,
            a.managerId || normName(a.bcba),
            (a.payor || "").toLowerCase(),
          ].join("|");
        const merged: AuthRecord[] = [];
        for (const a of [...prev, ...newRecs]) {
          const k = keyOf(a);
          if (seen.has(k)) continue;
          seen.add(k);
          merged.push(a);
        }
        return merged;
      });
      setAuthFileNames(prev => Array.from(new Set([...prev, ...loadedNames])));
      setAuthMissing(allMissing);
      if (loadedNames.length) {
        toast.success(
          `Loaded ${newRecs.length.toLocaleString()} records from ${loadedNames.length} file${loadedNames.length === 1 ? "" : "s"}`,
        );
      }
      if (allMissing.length && !loadedNames.length) {
        toast.error("No authorization files could be parsed");
      }
    } catch (e: any) {
      toast.error(`Failed to parse: ${e?.message ?? e}`);
    } finally {
      setLoadingAuth(false);
      if (authInputRef.current) authInputRef.current.value = "";
    }
  }

  function resetUpload() {
    setBillingFileName(""); setBillingRaws([]); setMissing([]);
    setAuthFileNames([]); setAuthRecords([]); setAuthMissing([]);
    if (inputRef.current) inputRef.current.value = "";
    if (authInputRef.current) authInputRef.current.value = "";
    try { localStorage.removeItem(BCBA_LAST_SESSION_KEY); } catch {}
  }

  /* ---- Load saved report from ?saved=<id>, otherwise auto-restore last session ---- */
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    pushRecent("bcba-productivity-report");
    const savedId = searchParams.get("saved");
    try {
      if (savedId) {
        const r = getSavedReport(savedId);
        if (r) {
          setBillingFileName(r.billingFileName);
          setAuthFileNames(r.authFileNames);
          setBillingRaws(r.billingRaws as BillingRaw[]);
          setAuthRecords(r.authRecords as AuthRecord[]);
          toast.success(`Loaded saved report: ${r.name}`);
          return;
        }
        toast.error("Saved report not found");
      }
      const raw = localStorage.getItem(BCBA_LAST_SESSION_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d?.billingRaws?.length) {
          setBillingFileName(d.billingFileName || "");
          setAuthFileNames(d.authFileNames || []);
          setBillingRaws(d.billingRaws);
          setAuthRecords(d.authRecords || []);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Auto-persist current session so leaving the page doesn't lose work ---- */
  useEffect(() => {
    if (!billingRaws.length && !authRecords.length) return;
    try {
      localStorage.setItem(BCBA_LAST_SESSION_KEY, JSON.stringify({
        billingFileName, authFileNames, billingRaws, authRecords,
      }));
    } catch {}
  }, [billingFileName, authFileNames, billingRaws, authRecords]);

  /* ---- Save current report under a name ---- */
  function handleSaveReport() {
    if (!billingRaws.length) {
      toast.error("Upload a billing report before saving");
      return;
    }
    const defaultName = billingFileName
      ? `BCBA Productivity · ${billingFileName.replace(/\.[^.]+$/, "")}`
      : `BCBA Productivity · ${new Date().toLocaleDateString()}`;
    const name = typeof window !== "undefined" ? window.prompt("Name this saved report", defaultName) : defaultName;
    if (!name) return;
    const insights = computeBcbaInsights(billingRaws, authRecords);
    const rec = saveReport({
      name: name.trim(),
      billingFileName, authFileNames, billingRaws, authRecords, insights,
    });
    pushRecent("bcba-productivity-report");
    setSearchParams({ saved: rec.id }, { replace: true });
    toast.success(`Saved "${rec.name}" to Saved Reports`);
  }

  /* ---- Attribution: build sessions + exceptions from billing + auths ---- */
  const { sessions, exceptions } = useMemo(() => {
    const exc: AttributionException[] = [];
    const rows: SessionRow[] = [];

    // Index auths by clientId AND by normalized client name so we can match
    // even when the billing export uses one but not the other.
    const authsByClientId = new Map<string, AuthRecord[]>();
    const authsByClientName = new Map<string, AuthRecord[]>();
    const authsByResourceId = new Map<string, AuthRecord>();
    const authsByAuthNumber = new Map<string, AuthRecord[]>();
    for (const a of authRecords) {
      if (a.resourceId) authsByResourceId.set(a.resourceId, a);
      if (a.clientId) {
        let arr = authsByClientId.get(a.clientId);
        if (!arr) { arr = []; authsByClientId.set(a.clientId, arr); }
        arr.push(a);
      }
      if (a.clientKey) {
        let arr = authsByClientName.get(a.clientKey);
        if (!arr) { arr = []; authsByClientName.set(a.clientKey, arr); }
        arr.push(a);
      }
      if (a.authNumber) {
        let arr = authsByAuthNumber.get(a.authNumber);
        if (!arr) { arr = []; authsByAuthNumber.set(a.authNumber, arr); }
        arr.push(a);
      }
    }

    const authsForBilling = (b: BillingRaw): AuthRecord[] => {
      if (b.clientId && authsByClientId.has(b.clientId)) return authsByClientId.get(b.clientId)!;
      if (b.clientKey && authsByClientName.has(b.clientKey)) return authsByClientName.get(b.clientKey)!;
      return [];
    };
    const codeMatches = (authBucket: string, billBucket: string) => {
      if (!authBucket || authBucket === "other") return true;
      return authBucket === billBucket;
    };
    const inRange = (b: BillingRaw, a: AuthRecord) =>
      isFinite(b.dateMs) && isFinite(a.startMs) && isFinite(a.endMs) &&
      b.dateMs >= a.startMs && b.dateMs <= a.endMs;
    const DAY = 86_400_000;

    /**
     * Matching waterfall for a 97153 row.
     * Returns the BCBA + optional flag, or empty bcba with exception detail.
     */
    const matchAuth = (b: BillingRaw): { bcba: string; flag?: string; reason?: string; suggested?: string } => {
      // --- LEVEL 1: Exact AuthorizationResourceId → ResourceId ---
      if (b.authResourceId) {
        const hit = authsByResourceId.get(b.authResourceId);
        if (hit && hit.bcba) return { bcba: hit.bcba };
        // If matched but no manager on the auth, fall through to next levels.
      }

      const pool = authsForBilling(b);

      // --- LEVEL 2: Historical date match (client + code + DOS in range) ---
      const lvl2 = pool.filter(a => codeMatches(a.bucket, b.bucket) && inRange(b, a));
      if (lvl2.length) {
        const pick = lvl2.slice().sort((x, y) => y.startMs - x.startMs)[0];
        if (pick.bcba) return { bcba: pick.bcba };
      }

      // --- LEVEL 3: Follow-up authorization bridge ---
      // Build a chain via FollowUpAuthorizationNumber from any auth in the
      // billing's pool, then check whether the DOS lands inside the bridged
      // auth's range or a small gap between two linked auths for the same
      // client/code/payor/BCBA.
      if (isFinite(b.dateMs)) {
        const samePayor = (a: AuthRecord) =>
          !b.payor || !a.payor ||
          a.payor.toLowerCase() === b.payor.toLowerCase();
        const sameCode = (a: AuthRecord) => codeMatches(a.bucket, b.bucket);
        const bridged = new Set<AuthRecord>();
        for (const seed of pool) {
          if (!sameCode(seed)) continue;
          // Walk follow-up chain forward.
          let cur: AuthRecord | undefined = seed;
          const visited = new Set<string>();
          while (cur) {
            if (visited.has(cur.authNumber || cur.resourceId)) break;
            visited.add(cur.authNumber || cur.resourceId);
            bridged.add(cur);
            const next = cur.followUpAuthNumber
              ? (authsByAuthNumber.get(cur.followUpAuthNumber) || []).find(a => a.clientKey === cur!.clientKey)
              : undefined;
            cur = next;
          }
        }
        // Find bridge candidate: DOS in range OR within a small gap (<=14d)
        // between two consecutive linked auths.
        const list = [...bridged].filter(samePayor).sort((x, y) => x.startMs - y.startMs);
        for (let i = 0; i < list.length; i++) {
          const a = list[i];
          if (inRange(b, a) && a.bcba) {
            return { bcba: a.bcba, flag: "Matched by follow-up bridge / date gap." };
          }
        }
        for (let i = 0; i < list.length - 1; i++) {
          const a = list[i], next = list[i + 1];
          if (!isFinite(a.endMs) || !isFinite(next.startMs)) continue;
          if (b.dateMs > a.endMs && b.dateMs < next.startMs &&
              (next.startMs - a.endMs) <= 14 * DAY) {
            const bcba = next.bcba || a.bcba;
            if (bcba) return { bcba, flag: "Matched by follow-up bridge / date gap." };
          }
        }
      }

      // --- LEVEL 4: Closest same client + code + payor within ±30d ---
      if (isFinite(b.dateMs)) {
        const samePayor = (a: AuthRecord) =>
          !b.payor || !a.payor ||
          a.payor.toLowerCase() === b.payor.toLowerCase();
        const candidates = pool.filter(a =>
          codeMatches(a.bucket, b.bucket) && samePayor(a) && a.bcba &&
          isFinite(a.startMs) && isFinite(a.endMs),
        );
        let best: { a: AuthRecord; dist: number } | null = null;
        for (const a of candidates) {
          const dist = b.dateMs < a.startMs
            ? a.startMs - b.dateMs
            : b.dateMs > a.endMs ? b.dateMs - a.endMs : 0;
          if (dist <= 30 * DAY && (!best || dist < best.dist)) {
            best = { a, dist };
          }
        }
        if (best) {
          return { bcba: best.a.bcba, flag: "Matched by closest auth — review needed." };
        }
      }

      // --- LEVEL 5: Exception ---
      const suggested = pool
        .filter(a => codeMatches(a.bucket, b.bucket))
        .slice(0, 3)
        .map(a => `${a.authNumber || a.resourceId || "—"} (${a.startRaw}→${a.endRaw}, ${a.bcba || "no BCBA"})`)
        .join("; ");
      return {
        bcba: "",
        reason: pool.length
          ? "No authorization overlaps DOS / service code / payor"
          : "No authorization on file for client",
        suggested: suggested || undefined,
      };
    };

    const hasAuths = authRecords.length > 0;

    for (const x of billingRaws) {
      let bcba = "";
      let isRbtDirect = false;

      if (x.bucket === "97153") {
        // 97153 is performed by RBTs; productivity always goes to authorization BCBA.
        isRbtDirect = true;
        if (hasAuths) {
          const r = matchAuth(x);
          if (r.bcba) bcba = r.bcba;
          else {
            exc.push({
              client: x.client, clientId: x.clientId, date: x.date,
              code: x.code, hours: x.hours, provider: x.provider,
              reason: r.reason || "No authorization match",
              authId: x.authId, authResourceId: x.authResourceId,
              payor: x.payor, suggested: r.suggested,
            });
            continue;
          }
        } else {
          // No auths uploaded — fall back to rendering provider so we don't drop rows.
          bcba = x.provider;
        }
      } else if (x.bucket === "97155" || x.bucket === "97156" || x.bucket === "97151") {
        // BCBA codes: rendering provider is the BCBA when present.
        bcba = x.provider;
        if (!bcba && hasAuths) {
          const r = matchAuth(x);
          if (r.bcba) bcba = r.bcba;
        }
      } else {
        // Other codes: use rendering provider.
        bcba = x.provider;
      }

      if (!bcba) continue;
      rows.push({
        bcba,
        client: x.client,
        rbt: isRbtDirect ? x.provider : "",
        code: x.code,
        hours: x.hours,
        date: x.date,
        state: x.state,
        director: x.director,
        payor: x.payor,
        parentTrainingCompleted: x.pt,
        raw: x.raw,
      });
    }

    return { sessions: rows, exceptions: exc };
  }, [billingRaws, authRecords]);

  /* ---- filter options ---- */
  const months = useMemo(() => [...new Set(sessions.map(s => monthOf(s.date)).filter(Boolean))].sort(), [sessions]);
  const states = useMemo(() => [...new Set(sessions.map(s => s.state).filter(Boolean))].sort(), [sessions]);
  const bcbas = useMemo(() => [...new Set(sessions.map(s => s.bcba).filter(Boolean))].sort(), [sessions]);
  const directors = useMemo(() => [...new Set(sessions.map(s => s.director).filter(Boolean))].sort(), [sessions]);
  const payors = useMemo(() => [...new Set(sessions.map(s => s.payor).filter(Boolean))].sort(), [sessions]);

  /* ---- dataset's natural date range (drives smart presets) ---- */
  const dataRange = useMemo(() => {
    let lo = Infinity, hi = -Infinity;
    for (const s of sessions) {
      const t = parseDate(s.date);
      if (!isFinite(t)) continue;
      if (t < lo) lo = t;
      if (t > hi) hi = t;
    }
    if (!isFinite(lo) || !isFinite(hi)) return null;
    return { loMs: lo, hiMs: hi, lo: new Date(lo), hi: new Date(hi) };
  }, [sessions]);

  const dateFromMs = useMemo(() => dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : NaN, [dateFrom]);
  const dateToMs = useMemo(() => dateTo ? new Date(dateTo + "T23:59:59").getTime() : NaN, [dateTo]);

  const filteredSessions = useMemo(() => sessions.filter(s => {
    if (month !== "all" && monthOf(s.date) !== month) return false;
    if (stateF !== "all" && s.state !== stateF) return false;
    if (bcbaF !== "all" && s.bcba !== bcbaF) return false;
    if (dirF !== "all" && s.director !== dirF) return false;
    if (payorF !== "all" && s.payor !== payorF) return false;
    if (codesF.length > 0 && !codesF.includes(classifyCode(s.code))) return false;
    if (isFinite(dateFromMs) || isFinite(dateToMs)) {
      const t = parseDate(s.date);
      if (!isFinite(t)) return false;
      if (isFinite(dateFromMs) && t < dateFromMs) return false;
      if (isFinite(dateToMs) && t > dateToMs) return false;
    }
    return true;
  }), [sessions, month, stateF, bcbaF, dirF, payorF, codesF, dateFromMs, dateToMs]);

  /* ---- period summary for KPI clarity ---- */
  const periodInfo = useMemo(() => {
    const monthsInView = new Set<string>();
    let lo = Infinity, hi = -Infinity;
    for (const s of filteredSessions) {
      const m = monthOf(s.date);
      if (m) monthsInView.add(m);
      const t = parseDate(s.date);
      if (isFinite(t)) { if (t < lo) lo = t; if (t > hi) hi = t; }
    }
    const nMonths = monthsInView.size || 1;
    const fmt = (ms: number) => new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    return {
      nMonths,
      label: isFinite(lo) && isFinite(hi) ? `${fmt(lo)} – ${fmt(hi)}` : "—",
      span: nMonths === 1 ? "1 month" : `${nMonths} months`,
    };
  }, [filteredSessions]);

  /* ---- aggregate ---- */
  const aggregates = useMemo<BcbaAgg[]>(() => {
    const map = new Map<string, BcbaAgg>();
    for (const s of filteredSessions) {
      let agg = map.get(s.bcba);
      if (!agg) {
        agg = {
          name: s.bcba, state: s.state, director: s.director, payors: new Set(),
          h97155: 0, h97156: 0, h97151: 0, h97153: 0, hOther: 0, total: 0, payrollHours: 0,
          clients: new Map(), rbts: new Map(),
          newClients: 0, discharged: 0, minimumHours: minHours,
          activeClients: 0, assignedRbts: 0,
          avgHoursPerClient: 0, avgHoursPerRbt: 0,
          missingPT: 0, missingSup: 0,
          minStatus: "—", flags: [],
        };
        map.set(s.bcba, agg);
      }
      if (s.payor) agg.payors.add(s.payor);
      if ((!agg.state || agg.state === "—") && s.state) agg.state = s.state;
      if ((!agg.director || agg.director === "—") && s.director) agg.director = s.director;
      const bucket = classifyCode(s.code);
      if (bucket === "97155") agg.h97155 += s.hours;
      else if (bucket === "97156") agg.h97156 += s.hours;
      else if (bucket === "97151") agg.h97151 += s.hours;
      else if (bucket === "97153") agg.h97153 += s.hours;
      else agg.hOther += s.hours;
      agg.total += s.hours;
      agg.payrollHours += s.hours;

      if (s.client) {
        let c = agg.clients.get(s.client);
        if (!c) {
          c = { name: s.client, h97155: 0, h97156: 0, total: 0, parentTrainingCompleted: false, rbts: new Set(), payor: s.payor };
          agg.clients.set(s.client, c);
        }
        if (bucket === "97155") c.h97155 += s.hours;
        if (bucket === "97156") c.h97156 += s.hours;
        c.total += s.hours;
        if (s.parentTrainingCompleted || bucket === "97156") c.parentTrainingCompleted = true;
        if (s.rbt) c.rbts.add(s.rbt);
        if (s.payor && !c.payor) c.payor = s.payor;
      }
      if (s.rbt) {
        let r = agg.rbts.get(s.rbt);
        if (!r) {
          r = { name: s.rbt, clients: new Set(), h97155Related: 0, primaryClientCount: 0, status: "Active" };
          agg.rbts.set(s.rbt, r);
        }
        if (s.client) r.clients.add(s.client);
        if (bucket === "97155") r.h97155Related += s.hours;
      }
    }
    const totalHoursAvg = (() => {
      const arr = [...map.values()];
      if (!arr.length) return 0;
      return arr.reduce((a, b) => a + b.total, 0) / arr.length;
    })();

    return [...map.values()].map(a => {
      const clientList = [...a.clients.values()];
      const rbtList = [...a.rbts.values()];
      a.activeClients = clientList.length;
      a.assignedRbts = rbtList.length;
      a.avgHoursPerClient = a.activeClients ? a.total / a.activeClients : 0;
      a.avgHoursPerRbt = a.assignedRbts ? a.total / a.assignedRbts : 0;
      a.missingPT = clientList.filter(c => c.h97156 === 0).length;
      a.missingSup = clientList.filter(c => c.h97155 === 0).length;
      rbtList.forEach(r => { r.primaryClientCount = r.clients.size; });

      const req = a.minimumHours;
      const total = a.total;
      a.minStatus = total >= req * 1.15 ? "Exceeds" :
        total >= req ? "Meets" :
        total >= req * 0.85 ? "At Risk" :
        total > 0 ? "Below" : "—";

      const flags: string[] = [];
      if (a.h97155 < req * 0.10) flags.push("Low 97155 activity");
      if (a.h97156 === 0) flags.push("No 97156 (parent training)");
      else if (a.h97156 < req * 0.05) flags.push("Low parent training");
      if (a.activeClients >= 16) flags.push("Large caseload");
      else if (a.activeClients > 0 && a.activeClients <= 4) flags.push("Small caseload");
      if (a.missingPT > 0) flags.push(`${a.missingPT} clients missing PT`);
      if (a.missingSup > 0) flags.push(`${a.missingSup} clients missing supervision`);
      if (a.minStatus === "Below" || a.minStatus === "At Risk") flags.push("Below minimum hours");
      if (totalHoursAvg > 0 && total >= totalHoursAvg * 1.2) flags.push("Above-average productivity");
      a.flags = flags;
      return a;
    }).sort((a, b) => b.total - a.total);
  }, [filteredSessions, minHours]);

  const visible = useMemo(() => {
    let rows = aggregates;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.state.toLowerCase().includes(q) ||
        a.director.toLowerCase().includes(q),
      );
    }
    if (!sortKey) return rows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }
      return String(av || "").localeCompare(String(bv || ""), undefined, { numeric: true }) * dir;
    });
  }, [aggregates, search, sortKey, sortDir]);

  /* ---- KPIs ---- */
  const kpis = useMemo(() => {
    const n = aggregates.length;
    const totalClients = new Set(filteredSessions.map(s => s.client).filter(Boolean)).size;
    const totalRbts = new Set(filteredSessions.map(s => s.rbt).filter(Boolean)).size;
    const t97155 = aggregates.reduce((s, a) => s + a.h97155, 0);
    const t97156 = aggregates.reduce((s, a) => s + a.h97156, 0);
    const t97153 = aggregates.reduce((s, a) => s + a.h97153, 0);
    const totalCases = aggregates.reduce((s, a) => s + a.activeClients, 0);
    return {
      totalBcbas: n,
      totalClients,
      totalRbts,
      t97155, t97156, t97153,
      avgCaseload: n ? totalCases / n : 0,
      avg97155: n ? t97155 / n : 0,
      avg97156: n ? t97156 / n : 0,
      avg97153: n ? t97153 / n : 0,
      avgClientsPerBcba: n ? totalClients / n : 0,
    };
  }, [aggregates, filteredSessions]);

  /* ---- AI summary ---- */
  const aiBullets = useMemo<string[]>(() => {
    if (!aggregates.length) return [];
    const bullets: string[] = [];
    const top = aggregates[0];
    if (top) bullets.push(`${top.name} led the period with ${fmt1(top.total)}h across ${top.activeClients} clients and ${top.assignedRbts} RBTs.`);
    const noPt = aggregates.filter(a => a.h97156 === 0).length;
    if (noPt > 0) bullets.push(`${noPt} BCBA${noPt > 1 ? "s" : ""} had no 97156 parent training activity.`);
    bullets.push(`Average BCBA caseload was ${fmt1(kpis.avgCaseload)} clients.`);
    const below = aggregates.filter(a => a.minStatus === "Below" || a.minStatus === "At Risk").length;
    if (below > 0) bullets.push(`${below} BCBA${below > 1 ? "s" : ""} fell below minimum required hours (${minHours}h).`);
    const lowSup = aggregates.filter(a => a.h97155 < minHours * 0.1).length;
    if (lowSup > 0) bullets.push(`${lowSup} BCBA${lowSup > 1 ? "s" : ""} had unusually low 97155 supervision activity.`);
    return bullets.slice(0, 5);
  }, [aggregates, kpis.avgCaseload, minHours]);

  /* ---- Export ---- */
  function buildExportRows() {
    const cols = [
      "BCBA", "State", "State Director", "Active Clients", "Assigned RBTs",
      "97153", "97155", "97156", "97151", "Other", "Total", "Payroll Hours",
      "Avg/Client", "Avg/RBT", "Min Hours", "Status", "Flags",
    ];
    const rows = visible.map(a => [
      a.name, a.state, a.director, a.activeClients, a.assignedRbts,
      fmt1(a.h97153), fmt1(a.h97155), fmt1(a.h97156), fmt1(a.h97151), fmt1(a.hOther), fmt1(a.total),
      fmt1(a.payrollHours), fmt1(a.avgHoursPerClient), fmt1(a.avgHoursPerRbt),
      a.minimumHours, a.minStatus, a.flags.join("; "),
    ] as (string | number)[]);
    return { cols, rows };
  }
  function exportAs(kind: "csv" | "excel" | "pdf") {
    if (!visible.length) { toast.error("No data to export."); return; }
    if (kind === "pdf") { window.print(); return; }
    const { cols, rows } = buildExportRows();
    const csv = toCsv(cols, rows);
    if (kind === "excel") downloadBlob("bcba-productivity-report.xls", "application/vnd.ms-excel", csv);
    else downloadBlob("bcba-productivity-report.csv", "text/csv", csv);
    toast.success(`Exported ${kind.toUpperCase()}`);
  }

  const billingLoaded = billingRaws.length > 0;
  const authsLoaded = authRecords.length > 0;
  const ready = billingLoaded && authsLoaded;
  const empty = !ready;

  return (
    <OSShell>
      {/* ===== Header ===== */}
      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge variant="secondary" className="rounded-full text-[10px] uppercase tracking-[0.14em]">Standard Report</Badge>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">BCBA Productivity Report</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monthly breakdown of each BCBA's productivity, supervision, parent training, caseload, and RBT support.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={handleSaveReport} disabled={!billingRaws.length}>
              <Save className="mr-1.5 h-3.5 w-3.5" />Save Report
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportAs("csv")}>
              <Download className="mr-1.5 h-3.5 w-3.5" />CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportAs("excel")}>
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportAs("pdf")}>
              <Printer className="mr-1.5 h-3.5 w-3.5" />PDF
            </Button>
          </div>
        </div>
      </section>

      {/* ===== Upload ===== */}
      {empty && (
        <section className="mt-4 print:hidden">
          <div className="mb-3 rounded-xl border border-border/60 bg-secondary/30 p-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Both reports required.</span>{" "}
            Upload the Billing Report <span className="text-foreground">and</span> the Authorization Report
            before the dashboard is generated. Auths drive historical BCBA attribution for 97153/97154 hours.
          </div>
          <div className="grid gap-4 md:grid-cols-2">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            className={cn(
              "rounded-2xl border-2 border-dashed p-10 text-center transition",
              dragOver ? "border-primary bg-primary/5" : "border-border/60 bg-secondary/20",
            )}
          >
            <Upload className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">1. Upload Billing Report</p>
            <p className="text-xs text-muted-foreground">
              CR billing/service export · one row per session with Client, CPT, hours, provider, DOS.
            </p>
            <div className="mt-4">
              <Button onClick={() => inputRef.current?.click()} disabled={loading}>
                {loading ? "Parsing…" : "Choose file"}
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept={SUPPORTED_EXTENSIONS}
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
            </div>
            {billingLoaded && (
              <p className="mt-3 text-[11px] text-emerald-700">
                ✓ Loaded {billingRaws.length.toLocaleString()} rows from {billingFileName}
              </p>
            )}
            {missing.length > 0 && (
              <div className="mx-auto mt-4 max-w-lg rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-left text-xs text-destructive">
                <p className="font-semibold">Missing required columns:</p>
                <ul className="ml-4 mt-1 list-disc">
                  {missing.map(m => <li key={m}>{m}</li>)}
                </ul>
              </div>
            )}
          </div>
          <div
            onDragOver={(e) => { e.preventDefault(); setAuthDragOver(true); }}
            onDragLeave={() => setAuthDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setAuthDragOver(false); handleAuthFiles(e.dataTransfer.files); }}
            className={cn(
              "rounded-2xl border-2 border-dashed p-10 text-center transition",
              authDragOver ? "border-primary bg-primary/5" : "border-border/60 bg-secondary/20",
            )}
          >
            <ShieldCheck className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">2. Upload Authorization Report</p>
            <p className="text-xs text-muted-foreground">
              Source of BCBA ownership · Client, Auth Start, Auth End, Service Code, BCBA.
            </p>
            <div className="mt-4">
              <Button variant="outline" onClick={() => authInputRef.current?.click()} disabled={loadingAuth}>
                {loadingAuth ? "Parsing…" : "Choose file(s)"}
              </Button>
              <input
                ref={authInputRef}
                type="file"
                multiple
                accept={SUPPORTED_EXTENSIONS}
                onChange={(e) => handleAuthFiles(e.target.files)}
                className="hidden"
              />
            </div>
            {authFileNames.length > 0 && (
              <p className="mt-3 text-[11px] text-emerald-700">
                Loaded {authRecords.length.toLocaleString()} records from {authFileNames.length} file
                {authFileNames.length === 1 ? "" : "s"}: {authFileNames.join(", ")}
              </p>
            )}
            {authMissing.length > 0 && (
              <div className="mx-auto mt-4 max-w-lg rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-left text-xs text-destructive">
                <p className="font-semibold">Missing required columns:</p>
                <ul className="ml-4 mt-1 list-disc">
                  {authMissing.map(m => <li key={m}>{m}</li>)}
                </ul>
              </div>
            )}
          </div>
          </div>
        </section>
      )}

      {!empty && (
        <>
          {/* ===== Filters ===== */}
          <section className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_8px_24px_-16px_hsl(265_60%_50%/0.18)] print:hidden">
            {/* header strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-[hsl(265_100%_99%)] via-card to-[hsl(225_100%_99%)] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[hsl(265_100%_96%)] text-[hsl(265_70%_55%)]">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </span>
                <p className="text-[12px] font-semibold tracking-tight">Filters</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/60 px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                  <CalendarRange className="h-3 w-3" />
                  {periodInfo.label} · {periodInfo.span}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{filteredSessions.length.toLocaleString()} sessions</span>
                <span>·</span>
                <span>{exceptions.length.toLocaleString()} exception{exceptions.length === 1 ? "" : "s"}</span>
                <Button variant="ghost" size="sm" onClick={resetUpload} className="h-7 text-[11px]">
                  <Trash2 className="mr-1 h-3 w-3" />Reset
                </Button>
              </div>
            </div>

            {/* date range row */}
            <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Date range</span>
              {[
                { id: "all", label: "All data" },
                { id: "latest-month", label: "Latest month" },
                { id: "last-3", label: "Last 3 mo (quarter)" },
                { id: "last-6", label: "Last 6 mo" },
                { id: "ytd", label: "YTD" },
              ].map(p => {
                const active = datePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyDatePreset(p.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] font-medium transition",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-card text-foreground hover:border-primary/40",
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition",
                      datePreset === "custom" || (dateFrom || dateTo)
                        ? "border-primary/70 bg-primary/5 text-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/40",
                    )}
                  >
                    <CalendarRange className="h-3 w-3" />
                    {dateFrom || dateTo ? `${dateFrom || "…"} → ${dateTo || "…"}` : "Custom"}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Custom range</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="text-[11px] text-muted-foreground">
                      From
                      <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setDatePreset("custom"); }} className="mt-1 h-8 text-xs" />
                    </label>
                    <label className="text-[11px] text-muted-foreground">
                      To
                      <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setDatePreset("custom"); }} className="mt-1 h-8 text-xs" />
                    </label>
                  </div>
                  {dataRange && (
                    <p className="mt-2 text-[10.5px] text-muted-foreground">
                      Data covers {dataRange.lo.toLocaleDateString()} – {dataRange.hi.toLocaleDateString()}
                    </p>
                  )}
                  {(dateFrom || dateTo) && (
                    <button
                      type="button"
                      onClick={() => { setDateFrom(""); setDateTo(""); setDatePreset("all"); }}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" /> Clear
                    </button>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* selects row */}
            <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-2.5">
              <FilterSelect label="Month" value={month} onChange={setMonth} options={months} />
              <FilterSelect label="State" value={stateF} onChange={setStateF} options={states} />
              <FilterSelect label="BCBA" value={bcbaF} onChange={setBcbaF} options={bcbas} />
              <FilterSelect label="Director" value={dirF} onChange={setDirF} options={directors} />
              <FilterSelect label="Payor" value={payorF} onChange={setPayorF} options={payors} />
            </div>

            {/* codes / min hours / search row */}
            <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Codes</span>
                <div className="flex flex-wrap gap-1">
                  {["97155", "97156", "97153", "97151"].map(code => {
                    const active = codesF.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setCodesF(prev => active ? prev.filter(c => c !== code) : [...prev, code])}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground hover:border-primary/40",
                        )}
                      >
                        {code}
                      </button>
                    );
                  })}
                  {codesF.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCodesF([])}
                      className="rounded-full border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      All
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Min hrs</span>
                <Input type="number" value={minHours} onChange={e => setMinHours(num(e.target.value) || DEFAULT_MIN)} className="h-8 w-20 text-xs" />
              </div>
            </div>

            <p className="border-t border-border/60 bg-secondary/30 px-4 py-2 text-[10.5px] text-muted-foreground">
              Billing: <span className="font-medium text-foreground">{billingFileName || "—"}</span>
              {" · "}Auths: <span className="font-medium text-foreground">{authFileNames.length ? `${authFileNames.length} file${authFileNames.length === 1 ? "" : "s"}` : "not uploaded"}</span>
            </p>
          </section>

          {/* ===== KPI Summary ===== */}
          <section className="mt-4 space-y-3">
            {/* Headline totals — period scope */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Kpi
                label="97153 hours · RBT direct"
                value={fmt1(kpis.t97153)}
                unit="hrs"
                icon={Stethoscope}
                highlight
                hint={`Period total · ${periodInfo.span}`}
                sub={`≈ ${fmt1(kpis.t97153 / periodInfo.nMonths)} hrs / mo`}
              />
              <Kpi
                label="97155 hours · supervision"
                value={fmt1(kpis.t97155)}
                unit="hrs"
                icon={ShieldCheck}
                hint={`Period total · ${periodInfo.span}`}
                sub={`≈ ${fmt1(kpis.t97155 / periodInfo.nMonths)} hrs / mo`}
              />
              <Kpi
                label="97156 hours · parent training"
                value={fmt1(kpis.t97156)}
                unit="hrs"
                icon={GraduationCap}
                hint={`Period total · ${periodInfo.span}`}
                sub={`≈ ${fmt1(kpis.t97156 / periodInfo.nMonths)} hrs / mo`}
              />
            </div>

            {/* Roster counts */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi label="BCBAs" value={fmt0(kpis.totalBcbas)} icon={Users} hint="In current view" />
              <Kpi label="Clients served" value={fmt0(kpis.totalClients)} icon={Stethoscope} hint="Unique in period" />
              <Kpi label="RBTs supervised" value={fmt0(kpis.totalRbts)} icon={Users} hint="Unique in period" />
              <Kpi label="Avg caseload" value={fmt1(kpis.avgCaseload)} unit="clients" hint="Clients per BCBA" />
            </div>

            {/* Per-BCBA averages — clearly labeled */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi
                label="97153 / BCBA"
                value={fmt1(kpis.avg97153)}
                unit="hrs"
                hint={`Per BCBA · ${periodInfo.span}`}
                sub={`≈ ${fmt1(kpis.avg97153 / periodInfo.nMonths)} hrs / mo`}
              />
              <Kpi
                label="97155 / BCBA"
                value={fmt1(kpis.avg97155)}
                unit="hrs"
                hint={`Per BCBA · ${periodInfo.span}`}
                sub={`≈ ${fmt1(kpis.avg97155 / periodInfo.nMonths)} hrs / mo`}
              />
              <Kpi
                label="97156 / BCBA"
                value={fmt1(kpis.avg97156)}
                unit="hrs"
                hint={`Per BCBA · ${periodInfo.span}`}
                sub={`≈ ${fmt1(kpis.avg97156 / periodInfo.nMonths)} hrs / mo`}
              />
              <Kpi
                label="Clients / BCBA"
                value={fmt1(kpis.avgClientsPerBcba)}
                unit="clients"
                hint="Per BCBA · in view"
              />
            </div>
          </section>

          {/* ===== AI Summary ===== */}
          {aiBullets.length > 0 && (
            <section className="mt-4 rounded-xl border border-[hsl(265_70%_55%/0.2)] bg-[hsl(265_100%_98%)] p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[hsl(265_70%_55%)]" />
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(265_70%_55%)]">AI Summary</p>
              </div>
              <ul className="mt-2 space-y-1.5 text-[13px] leading-snug">
                {aiBullets.map((b, i) => <li key={i} className="flex items-start gap-2"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[hsl(265_70%_55%)]" /><span>{b}</span></li>)}
              </ul>
            </section>
          )}

          {/* ===== Main Table ===== */}
          <section className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight">BCBA Productivity</h2>
                <span className="inline-flex items-center rounded-full bg-secondary/70 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                  {search ? `${visible.length} of ${aggregates.length}` : visible.length}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-[11px] text-muted-foreground md:inline">Click a row to expand client &amp; RBT breakdowns</span>
                <div className="relative w-64">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search BCBAs in this table…"
                    className={cn(
                      "h-8 rounded-full pl-8 pr-8 text-xs transition",
                      search && "border-primary/50 ring-2 ring-primary/15",
                    )}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-1.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            {search && (
              <div className="flex items-center justify-between border-b border-border/60 bg-[hsl(265_100%_99%)] px-4 py-1.5 text-[11px]">
                <span className="text-[hsl(265_30%_35%)]">
                  Showing <span className="font-semibold text-foreground">{visible.length}</span> result{visible.length === 1 ? "" : "s"} for
                  <span className="ml-1 rounded bg-card px-1.5 py-0.5 font-medium text-foreground shadow-sm">"{search}"</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="inline-flex items-center gap-1 font-medium text-[hsl(265_70%_55%)] hover:text-[hsl(265_70%_45%)]"
                >
                  <X className="h-3 w-3" /> Clear search
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-secondary/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <Th />
                    <SortTh sortKey="name" activeKey={sortKey} dir={sortDir} onSort={handleSort}>BCBA</SortTh>
                    <SortTh sortKey="state" activeKey={sortKey} dir={sortDir} onSort={handleSort}>State</SortTh>
                    <SortTh sortKey="activeClients" align="right" activeKey={sortKey} dir={sortDir} onSort={handleSort}>Active Clients</SortTh>
                    <SortTh sortKey="assignedRbts" align="right" activeKey={sortKey} dir={sortDir} onSort={handleSort}>RBTs</SortTh>
                    <SortTh sortKey="h97153" align="right" activeKey={sortKey} dir={sortDir} onSort={handleSort}>97153</SortTh>
                    <SortTh sortKey="h97155" align="right" activeKey={sortKey} dir={sortDir} onSort={handleSort}>97155</SortTh>
                    <SortTh sortKey="h97156" align="right" activeKey={sortKey} dir={sortDir} onSort={handleSort}>97156</SortTh>
                    <SortTh sortKey="total" align="right" activeKey={sortKey} dir={sortDir} onSort={handleSort}>Total Billable</SortTh>
                    <SortTh sortKey="avgHoursPerClient" align="right" activeKey={sortKey} dir={sortDir} onSort={handleSort}>Avg/Client</SortTh>
                    <SortTh sortKey="avgHoursPerRbt" align="right" activeKey={sortKey} dir={sortDir} onSort={handleSort}>Avg/RBT</SortTh>
                    <SortTh sortKey="payrollHours" align="right" activeKey={sortKey} dir={sortDir} onSort={handleSort}>Payroll</SortTh>
                    <SortTh sortKey="minimumHours" align="right" activeKey={sortKey} dir={sortDir} onSort={handleSort}>Min</SortTh>
                    <SortTh sortKey="minStatus" activeKey={sortKey} dir={sortDir} onSort={handleSort}>Status</SortTh>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(a => {
                    const isOpen = !!expanded[a.name];
                    return (
                      <ExpandableBcbaRow
                        key={a.name}
                        agg={a}
                        isOpen={isOpen}
                        onToggle={() => setExpanded(p => ({ ...p, [a.name]: !p[a.name] }))}
                      />
                    );
                  })}
                  {visible.length === 0 && (
                    <tr><td colSpan={14} className="px-4 py-8 text-center text-muted-foreground">No BCBAs match your filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ===== Exceptions ===== */}
          {exceptions.length > 0 && (
            <section className="mt-4 overflow-hidden rounded-xl border border-amber-200 bg-card">
              <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50/60 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <FileWarning className="h-4 w-4 text-amber-700" />
                  <h2 className="text-sm font-semibold text-amber-900">BCBA Attribution Exceptions ({exceptions.length.toLocaleString()})</h2>
                </div>
                <span className="text-[11px] text-amber-800">
                  These 97153 rows could not be matched to an active authorization and are not credited to any BCBA.
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card text-[10px] uppercase text-muted-foreground">
                    <tr>
                      <Th>Client</Th><Th>Client ID</Th><Th>DOS</Th><Th>Code</Th>
                      <Th align="right">Hours</Th><Th>Auth Id</Th><Th>Auth Resource Id</Th>
                      <Th>Payor</Th><Th>Reason</Th><Th>Suggested</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {exceptions.slice(0, 500).map((e, i) => (
                      <tr key={i} className="border-t border-border/30">
                        <Td className="font-medium">{e.client}</Td>
                        <Td>{e.clientId || "—"}</Td>
                        <Td>{e.date || "—"}</Td>
                        <Td>{e.code}</Td>
                        <Td align="right">{fmt1(e.hours)}</Td>
                        <Td>{e.authId || "—"}</Td>
                        <Td>{e.authResourceId || "—"}</Td>
                        <Td>{e.payor || "—"}</Td>
                        <Td className="text-amber-800">{e.reason}</Td>
                        <Td className="text-muted-foreground">{e.suggested || "—"}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {exceptions.length > 500 && (
                  <p className="px-4 py-2 text-[11px] text-muted-foreground">Showing first 500 of {exceptions.length.toLocaleString()}.</p>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </OSShell>
  );
}

/* ============ Sub components ============ */

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function Kpi({ label, value, unit, icon: Icon, highlight, hint, sub }: {
  label: string; value: string; unit?: string; icon?: any; highlight?: boolean; hint?: string; sub?: string;
}) {
  return (
    <div className={cn(
      "group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border bg-card p-3.5 transition-all duration-300",
      "shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_8px_20px_-16px_hsl(265_60%_50%/0.18)] hover:-translate-y-0.5",
      highlight
        ? "border-primary/40 bg-gradient-to-br from-[hsl(265_100%_99%)] to-card ring-1 ring-primary/15"
        : "border-border/60",
    )}>
      {highlight && (
        <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[hsl(265_100%_92%)] opacity-60 blur-2xl" />
      )}
      <div className="relative flex items-start justify-between gap-2">
        <p className={cn(
          "text-[10.5px] font-semibold uppercase leading-tight tracking-[0.12em]",
          highlight ? "text-[hsl(265_70%_45%)]" : "text-muted-foreground",
        )}>{label}</p>
        {Icon && (
          <span className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            highlight ? "bg-[hsl(265_100%_96%)] text-[hsl(265_70%_55%)]" : "bg-secondary/70 text-muted-foreground",
          )}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="relative mt-2">
        <p className="flex items-baseline gap-1">
          <span className={cn(
            "font-semibold tabular-nums tracking-tight",
            highlight ? "text-[26px] text-foreground" : "text-[22px] text-foreground",
          )}>{value}</span>
          {unit && <span className="text-[11px] font-medium text-muted-foreground">{unit}</span>}
        </p>
        {hint && <p className="mt-0.5 text-[10.5px] text-muted-foreground">{hint}</p>}
        {sub && <p className="text-[10.5px] font-medium text-[hsl(265_70%_55%)]">{sub}</p>}
      </div>
    </div>
  );
}

function SortTh({
  children,
  align = "left",
  sortKey: key,
  activeKey,
  dir,
  onSort,
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
  sortKey: keyof BcbaAgg | "";
  activeKey: keyof BcbaAgg | "";
  dir: "asc" | "desc";
  onSort: (k: keyof BcbaAgg | "") => void;
}) {
  const active = activeKey === key && key !== "";
  return (
    <th
      className={cn(
        "px-3 py-2 font-medium select-none",
        align === "right" && "text-right",
        key && "cursor-pointer hover:text-foreground",
      )}
      onClick={() => key && onSort(key)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {key && (
          <ArrowUpDown className={cn(
            "h-3 w-3 transition-colors",
            active ? "text-primary" : "text-muted-foreground/40",
          )} />
        )}
        {active && (
          <span className="text-[10px] text-primary">{dir === "asc" ? "▲" : "▼"}</span>
        )}
      </span>
    </th>
  );
}

function Th({ children, align = "left" }: { children?: React.ReactNode; align?: "left" | "right" }) {
  return <th className={cn("px-3 py-2 font-medium", align === "right" && "text-right")}>{children}</th>;
}
function Td({ children, align = "left", className }: { children?: React.ReactNode; align?: "left" | "right"; className?: string }) {
  return <td className={cn("px-3 py-2", align === "right" && "text-right tabular-nums", className)}>{children}</td>;
}

function statusTone(s: MinStatus): string {
  if (s === "Exceeds") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "Meets") return "bg-sky-50 text-sky-700 border-sky-200";
  if (s === "At Risk") return "bg-amber-50 text-amber-700 border-amber-200";
  if (s === "Below") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-secondary text-muted-foreground border-border";
}

function ExpandableBcbaRow({ agg, isOpen, onToggle }: { agg: BcbaAgg; isOpen: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className="border-t border-border/40 hover:bg-secondary/20 cursor-pointer" onClick={onToggle}>
        <Td>
          {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </Td>
        <Td className="font-medium text-foreground">{agg.name}</Td>
        <Td>{agg.state || "—"}</Td>
        <Td align="right">{agg.activeClients}</Td>
        <Td align="right">{agg.assignedRbts}</Td>
        <Td align="right" className="font-semibold text-primary">{fmt1(agg.h97153)}</Td>
        <Td align="right">{fmt1(agg.h97155)}</Td>
        <Td align="right">{fmt1(agg.h97156)}</Td>
        <Td align="right" className="font-semibold">{fmt1(agg.total)}</Td>
        <Td align="right">{fmt1(agg.avgHoursPerClient)}</Td>
        <Td align="right">{fmt1(agg.avgHoursPerRbt)}</Td>
        <Td align="right">{fmt1(agg.payrollHours)}</Td>
        <Td align="right">{agg.minimumHours}</Td>
        <Td>
          <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium", statusTone(agg.minStatus))}>
            {agg.minStatus}
          </span>
        </Td>
      </tr>
      {isOpen && (
        <tr className="bg-secondary/10">
          <td colSpan={14} className="px-4 py-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Code breakdown */}
              <SubCard title="Code Breakdown">
                <table className="w-full text-xs">
                  <thead className="text-[10px] uppercase text-muted-foreground">
                    <tr><Th>BCBA</Th><Th align="right">97153</Th><Th align="right">97155</Th><Th align="right">97156</Th><Th align="right">97151</Th><Th align="right">Other</Th><Th align="right">Total</Th></tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border/30">
                      <Td>{agg.name}</Td>
                      <Td align="right" className="font-semibold text-primary">{fmt1(agg.h97153)}</Td>
                      <Td align="right">{fmt1(agg.h97155)}</Td>
                      <Td align="right">{fmt1(agg.h97156)}</Td>
                      <Td align="right">{fmt1(agg.h97151)}</Td>
                      <Td align="right">{fmt1(agg.hOther)}</Td>
                      <Td align="right" className="font-semibold">{fmt1(agg.total)}</Td>
                    </tr>
                  </tbody>
                </table>
              </SubCard>

              {/* Caseload summary */}
              <SubCard title="Caseload Summary">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <DT label="Caseload size" value={String(agg.activeClients)} />
                  <DT label="Avg service hrs" value={fmt1(agg.avgHoursPerClient)} />
                  <DT label="Missing parent training" value={String(agg.missingPT)} />
                  <DT label="Missing supervision" value={String(agg.missingSup)} />
                  <DT label="Assigned RBTs" value={String(agg.assignedRbts)} />
                </dl>
                <div className="mt-2">
                  <PayorsDisclosure payors={[...agg.payors]} />
                </div>
                {agg.flags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {agg.flags.map(f => (
                      <span key={f} className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        <AlertTriangle className="h-2.5 w-2.5" />{f}
                      </span>
                    ))}
                  </div>
                )}
              </SubCard>

              {/* Client breakdown */}
              <SubCard title={`Clients (${agg.clients.size})`} className="lg:col-span-2">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-card text-[10px] uppercase text-muted-foreground">
                      <tr>
                        <Th>Client</Th><Th align="right">97155</Th><Th align="right">97156</Th>
                        <Th align="right">Total</Th><Th>Parent Training</Th><Th align="right">RBTs</Th><Th>Payor</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...agg.clients.values()].sort((a, b) => b.total - a.total).map(c => (
                        <tr key={c.name} className="border-t border-border/30">
                          <Td className="font-medium">{c.name}</Td>
                          <Td align="right">{fmt1(c.h97155)}</Td>
                          <Td align="right">{fmt1(c.h97156)}</Td>
                          <Td align="right" className="font-semibold">{fmt1(c.total)}</Td>
                          <Td>
                            {c.parentTrainingCompleted ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3 w-3" />Yes</span>
                            ) : (
                              <span className="text-rose-600">No</span>
                            )}
                          </Td>
                          <Td align="right">{c.rbts.size}</Td>
                          <Td>{c.payor || "—"}</Td>
                        </tr>
                      ))}
                      {agg.clients.size === 0 && <tr><td colSpan={7} className="px-3 py-4 text-center text-muted-foreground">No client data.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </SubCard>

              {/* RBT breakdown */}
              <SubCard title={`RBTs (${agg.rbts.size})`} className="lg:col-span-2">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-card text-[10px] uppercase text-muted-foreground">
                      <tr>
                        <Th>RBT</Th><Th align="right">Clients Shared</Th><Th align="right">97155 Related</Th>
                        <Th align="right">Primary Clients</Th><Th>Status</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...agg.rbts.values()].sort((a, b) => b.clients.size - a.clients.size).map(r => (
                        <tr key={r.name} className="border-t border-border/30">
                          <Td className="font-medium">{r.name}</Td>
                          <Td align="right">{r.clients.size}</Td>
                          <Td align="right">{fmt1(r.h97155Related)}</Td>
                          <Td align="right">{r.primaryClientCount}</Td>
                          <Td>{r.status}</Td>
                        </tr>
                      ))}
                      {agg.rbts.size === 0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">No RBT data.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </SubCard>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function SubCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border/60 bg-card p-3", className)}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}
function DT({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{value}</dd>
    </>
  );
}

function PayorsDisclosure({ payors }: { payors: string[] }) {
  const [open, setOpen] = useState(false);
  const count = payors.length;
  if (!count) {
    return (
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Payors</span>
        <span className="font-medium">—</span>
      </div>
    );
  }
  return (
    <div className="rounded-md border border-border/60 bg-secondary/20">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-2.5 py-1.5 text-xs"
        aria-expanded={open}
      >
        <span className="text-muted-foreground">Payors</span>
        <span className="flex items-center gap-1.5 font-medium">
          {count} {count === 1 ? "payor" : "payors"}
          {open
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </span>
      </button>
      {open && (
        <div className="border-t border-border/60 px-2.5 py-1.5">
          <div className="flex flex-wrap gap-1">
            {payors.map(p => (
              <span
                key={p}
                className="inline-flex rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-foreground"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}