import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Upload, FileSpreadsheet, Download, Search, ChevronRight, ChevronDown,
  Stethoscope, Plus, Trash2, Save, History, ArrowLeftRight, X, Pencil, Database, AlertTriangle,
  UserPlus, RefreshCw, HelpCircle, FileText,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from "recharts";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseAnyFile, SUPPORTED_EXTENSIONS } from "@/lib/os/dashboardEngine/excelParser";
import {
  readAssignmentsV3, loadAssignmentsV3, addAssignmentV3, updateAssignmentV3, deleteAssignmentV3,
  ownerForClientAtDateV3, deriveTransfersV3, readSavedReportsV3, saveReportV3,
  getSavedReportRowsV3, deleteSavedReportV3, clearLastBillingV3,
  saveLastBillingV3, loadLastBillingV3,
  findDuplicateSavedV3, normalizeName, bulkInsertAssignmentsV3,
  type BcbaAssignmentV3,
} from "@/lib/os/bcbaProductivityV3/store";
import { inferAssignmentHistory, type OwnershipConflict } from "@/lib/os/bcbaProductivityV3/inferAssignments";
import {
  getBcbaProductivitySharedRows, getBcbaProductivityDatasetStatus,
  type BcbaDatasetStatus,
} from "@/lib/os/bcbaProductivityV3/adminUploadStore";
import { normalizeUsState, resolveRowState } from "@/lib/os/bcbaProductivityV3/stateNormalization";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import blossomLogo from "@/assets/blossom-logo-color.png";
import { CentralReachRequirementsCard } from "@/components/reports/CentralReachRequirementsCard";

/* ----- helpers ----- */
const normH = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");
function findH(headers: string[], cands: string[]) {
  const m = new Map(headers.map(h => [normH(h), h]));
  for (const c of cands) { const hit = m.get(normH(c)); if (hit) return hit; }
  return null;
}
const num = (v: any) => {
  if (v === undefined || v === null || v === "") return NaN;
  const n = parseFloat(String(v).replace(/[$,%]/g, ""));
  return isFinite(n) ? n : NaN;
};
const fmt1 = (n: number) =>
  isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—";
const fmt0 = (n: number) => (isFinite(n) ? Math.round(n).toLocaleString() : "—");
const fmtPct = (num: number, denom: number) =>
  denom > 0 && isFinite(num) ? `${((num / denom) * 100).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : "—";
const supervisionPctValue = (sup: number, h97153: number) => (h97153 > 0 ? (sup / h97153) * 100 : null);
function supervisionTone(pct: number | null): "danger" | "warn" | "ok" | undefined {
  if (pct === null) return undefined;
  if (pct < 5) return "danger";
  if (pct < 10) return "warn";
  return "ok";
}
function isoDate(d: string) {
  if (!d) return "";
  const t = new Date(d).getTime();
  return isFinite(t) ? new Date(t).toISOString().slice(0, 10) : "";
}
function downloadCsv(name: string, columns: string[], rows: (string | number)[][]) {
  const esc = (v: any) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const text = [columns.map(esc).join(","), ...rows.map(r => r.map(esc).join(","))].join("\n");
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

/* ----- types ----- */
interface BillingRow {
  clientId: string;
  clientName: string;
  rbt: string; // rendering provider for 97153 rows
  renderingProvider: string;
  providerLabels: string;
  code: string;
  hours: number;
  date: string; // ISO
  state: string;
  payor: string;
}
interface OwnedRow extends BillingRow {
  bcbaOwner: string | null;
  assignmentId: string | null;
  assignmentSource: "saved" | "inferred" | "inferred_gap_fill" | "unassigned";
  is97153: boolean;
}
interface ValidationSummary {
  fileName: string;
  rawRowCount: number;
  acceptedRowCount: number;
  droppedRowCount: number;
  dropReasons: Record<string, number>;
  totalHours: number;
  dateMin: string;
  dateMax: string;
  uniqueClients: number;
  uniqueProviders: number;
  topCodes: { code: string; rows: number; hours: number }[];
}
interface UnassignedAuditRow extends BillingRow {
  reason: "No assignment covering DOS";
}
interface AssignmentIssue {
  clientKey: string;
  clientName: string;
  type: "gap" | "overlap";
  detail: string;
}

const isRbt97153 = (code: string) => /^97153\b/.test(code.trim()) || code.trim().startsWith("97153");
const isSupervision = (code: string) => /^97155\b/.test(code.trim()) || code.trim().startsWith("97155");

function addDaysIso(date: string, days: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function deriveAssignmentIssues(assignments: BcbaAssignmentV3[]): AssignmentIssue[] {
  const byClient = new Map<string, BcbaAssignmentV3[]>();
  for (const a of assignments) {
    const key = a.clientId || normalizeName(a.clientName);
    if (!key) continue;
    if (!byClient.has(key)) byClient.set(key, []);
    byClient.get(key)!.push(a);
  }
  const issues: AssignmentIssue[] = [];
  for (const [clientKey, list] of byClient) {
    const sorted = [...list].sort((a, b) => a.startDate.localeCompare(b.startDate));
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      if (!prev.endDate) {
        issues.push({ clientKey, clientName: cur.clientName || prev.clientName, type: "overlap", detail: `${prev.bcbaName} is open-ended before ${cur.bcbaName} starts ${cur.startDate}` });
      } else if (prev.endDate >= cur.startDate) {
        issues.push({ clientKey, clientName: cur.clientName || prev.clientName, type: "overlap", detail: `${prev.bcbaName} ends ${prev.endDate}; ${cur.bcbaName} starts ${cur.startDate}` });
      } else if (addDaysIso(prev.endDate, 1) < cur.startDate) {
        issues.push({ clientKey, clientName: cur.clientName || prev.clientName, type: "gap", detail: `No owner from ${addDaysIso(prev.endDate, 1)} to ${addDaysIso(cur.startDate, -1)}` });
      }
    }
  }
  return issues.sort((a, b) => a.clientName.localeCompare(b.clientName));
}

export default function BcbaProductivityReportV3() {
  const [params] = useSearchParams();
  const savedParam = params.get("saved");

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationSummary | null>(null);
  const [missingCols, setMissingCols] = useState<string[]>([]);

  const [assignments, setAssignments] = useState<BcbaAssignmentV3[]>(() => readAssignmentsV3());
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [savedList, setSavedList] = useState(() => readSavedReportsV3());

  // filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [bcbaF, setBcbaF] = useState("all");
  const [clientF, setClientF] = useState("all");
  const [rbtF, setRbtF] = useState("all");
  const [stateF, setStateF] = useState("all");
  const [payorF, setPayorF] = useState("all");
  const [codeF, setCodeF] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [editing, setEditing] = useState<BcbaAssignmentV3 | null>(null);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const assignImportRef = useRef<HTMLInputElement>(null);
  const [showHelp, setShowHelp] = useState(false);

  /* ----- shared admin dataset (the only data source) ----- */
  const [sharedStatus, setSharedStatus] = useState<BcbaDatasetStatus | null>(null);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [sharedProgress, setSharedProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [sharedError, setSharedError] = useState("");

  useEffect(() => {
    const refreshAssign = () => setAssignments(readAssignmentsV3());
    const refreshSaved = () => setSavedList(readSavedReportsV3());
    window.addEventListener("bcba-prod-v3-assignments-changed", refreshAssign);
    window.addEventListener("bcba-prod-v3-saved-changed", refreshSaved);
    return () => {
      window.removeEventListener("bcba-prod-v3-assignments-changed", refreshAssign);
      window.removeEventListener("bcba-prod-v3-saved-changed", refreshSaved);
    };
  }, []);

  async function refreshAssignments() {
    setAssignmentLoading(true);
    setAssignmentError("");
    try {
      setAssignments(await loadAssignmentsV3());
    } catch (e: any) {
      setAssignmentError(e?.message ?? "Assignment History could not be loaded");
      setAssignments([]);
      toast.error("Assignment History could not be loaded from the database");
    } finally {
      setAssignmentLoading(false);
    }
  }

  useEffect(() => { void refreshAssignments(); }, []);

  /* Load shared admin dataset on mount. This is now the only data source. */
  useEffect(() => {
    (async () => {
      try {
        const s = await getBcbaProductivityDatasetStatus();
        setSharedStatus(s);
        if (s.activeRowCount > 0) {
          await loadSharedDataset({ silent: true });
        }
      } catch {
        /* ignore — banner will say no admin data found */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSharedDataset(opts?: { silent?: boolean; force?: boolean }) {
    setSharedLoading(true);
    setSharedError("");
    setSharedProgress(null);
    try {
      const shared = await getBcbaProductivitySharedRows({
        force: opts?.force,
        onProgress: (loaded, total) => setSharedProgress({ loaded, total }),
      });
      const s = await getBcbaProductivityDatasetStatus();
      setSharedStatus(s);
      if (!shared.length) {
        setRows([]);
        setFileName("");
        if (!opts?.silent) {
          toast.info("No CentralReach billing rows uploaded yet. Add one from CentralReach Uploads.");
        }
        setSharedLoading(false);
        return;
      }
      setRows(shared as BillingRow[]);
      setFileName("Shared admin dataset");
      if (!opts?.silent) {
        toast.success(`Loaded ${shared.length.toLocaleString()} shared admin rows`);
      }
    } catch (e: any) {
      const message = e?.message ?? "Failed to load shared admin dataset";
      setSharedError(message);
      toast.error(message);
    } finally {
      setSharedLoading(false);
      setSharedProgress(null);
    }
  }


  useEffect(() => {
    (async () => {
      if (savedParam) {
        const data = await getSavedReportRowsV3(savedParam);
        if (data?.length) {
          setRows(data);
          const meta = readSavedReportsV3().find(r => r.id === savedParam);
          if (meta) setFileName(meta.fileName);
          return;
        }
      }
      // Auto-load shared admin dataset when no saved report param is present.
    })();
  }, [savedParam]);

  async function handleFiles(files: FileList | File[] | null) {
    if (!files || !files[0]) return;
    const file = files[0];
    setLoading(true);
    try {
      const parsed = await parseAnyFile(file);
      const first = parsed[0];
      if (!first) throw new Error("No data in file.");
      const h = first.headers;

      const clientIdH = findH(h, ["ClientId", "Client ID", "PatientId", "MRN"]);
      const cliFirstH = findH(h, ["ClientFirstName", "Client First Name"]);
      const cliLastH = findH(h, ["ClientLastName", "Client Last Name"]);
      const clientNameH = findH(h, ["Client", "Client Name", "Patient", "Patient Name"]);
      const dosH = findH(h, ["DateOfService", "Date Of Service", "ServiceDate", "DOS", "Date"]);
      const codeH = findH(h, ["ProcedureCode", "Procedure Code", "Code", "CPT", "Service Code"]);
      const hoursH = findH(h, ["TimeWorkedInHours", "Time Worked In Hours", "Hours", "BillableHours", "Billable Hours", "ServiceHours"]);
      const provFirstH = findH(h, ["ProviderFirstName", "Provider First Name"]);
      const provLastH = findH(h, ["ProviderLastName", "Provider Last Name"]);
      const provNameH = findH(h, ["Provider", "Provider Name", "RenderingProvider", "Rendering Provider"]);
      // State resolved per-row via resolveRowState (column fallback + normalization).
      const payorH = findH(h, ["PayorNickname", "PayorName", "Payor Name", "Payor", "Payer", "Insurance"]);
      const provLabelsH = findH(h, ["ProviderContactLabels", "Provider Contact Labels", "ProviderLabels", "Provider Labels"]);

      const miss: string[] = [];
      if (!clientNameH && !(cliFirstH || cliLastH)) miss.push("Client name");
      if (!dosH) miss.push("DateOfService");
      if (!codeH) miss.push("ProcedureCode");
      if (!hoursH) miss.push("Hours");
      if (miss.length) {
        setMissingCols(miss);
        toast.error(`Missing required columns: ${miss.join(", ")}`);
        setLoading(false);
        return;
      }
      setMissingCols([]);

      const parsedRows: BillingRow[] = [];
      const drop: Record<string, number> = {};
      const bumpDrop = (k: string) => { drop[k] = (drop[k] || 0) + 1; };
      let totalHoursAll = 0;
      let minDate = "", maxDate = "";
      const clientsSet = new Set<string>();
      const providersSet = new Set<string>();
      const codeAgg = new Map<string, { rows: number; hours: number }>();

      for (const r of first.rows) {
        const code = (codeH ? r[codeH] : "").trim();
        const hoursRaw = hoursH ? r[hoursH] : "";
        const hours = num(hoursRaw);
        const clientName = (clientNameH ? r[clientNameH] : "").trim() ||
          [cliFirstH ? r[cliFirstH] : "", cliLastH ? r[cliLastH] : ""].filter(Boolean).join(" ").trim();
        const clientId = (clientIdH ? r[clientIdH] : "").trim();
        const dos = isoDate((dosH ? r[dosH] : "").trim());

        if (!dos) { bumpDrop("No parseable Date of Service"); continue; }
        if (!clientName && !clientId) { bumpDrop("No client identity"); continue; }
        if (!code) { bumpDrop("No procedure code"); continue; }
        if (!isFinite(hours) || hours <= 0) { bumpDrop("No numeric hours"); continue; }

        const renderingProvider = (provNameH ? r[provNameH] : "").trim() ||
          [provFirstH ? r[provFirstH] : "", provLastH ? r[provLastH] : ""].filter(Boolean).join(" ").trim();

        const row: BillingRow = {
          clientId,
          clientName,
          rbt: isRbt97153(code) ? renderingProvider : "",
          renderingProvider,
          providerLabels: (provLabelsH ? String(r[provLabelsH] ?? "") : "").trim(),
          code,
          hours,
          date: dos,
          state: resolveRowState(r as Record<string, unknown>),
          payor: (payorH ? r[payorH] : "").trim(),
        };
        parsedRows.push(row);
        totalHoursAll += hours;
        if (!minDate || dos < minDate) minDate = dos;
        if (!maxDate || dos > maxDate) maxDate = dos;
        clientsSet.add(clientId || normalizeName(clientName));
        if (renderingProvider) providersSet.add(renderingProvider);
        const c = codeAgg.get(code) || { rows: 0, hours: 0 };
        c.rows += 1; c.hours += hours;
        codeAgg.set(code, c);
      }

      const topCodes = [...codeAgg.entries()]
        .map(([code, v]) => ({ code, ...v }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 8);

      const summary: ValidationSummary = {
        fileName: file.name,
        rawRowCount: first.rows.length,
        acceptedRowCount: parsedRows.length,
        droppedRowCount: first.rows.length - parsedRows.length,
        dropReasons: drop,
        totalHours: totalHoursAll,
        dateMin: minDate,
        dateMax: maxDate,
        uniqueClients: clientsSet.size,
        uniqueProviders: providersSet.size,
        topCodes,
      };
      setValidation(summary);

      const dup = findDuplicateSavedV3(file.name, parsedRows.length);
      if (dup) {
        toast.warning(`Possible duplicate of "${dup.name}" saved ${new Date(dup.savedAt).toLocaleString()}`);
      }

      setRows(parsedRows);
      setFileName(file.name);
      // Persist so the upload survives tab navigation / refresh.
      void saveLastBillingV3(file.name, parsedRows);

      toast.success(`Parsed ${parsedRows.length.toLocaleString()} of ${first.rows.length.toLocaleString()} rows from ${file.name}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to parse file");
    } finally {
      setLoading(false);
    }
  }

  /* ----- ownership-resolved rows ----- */
  /* Ownership is resolved per client AND per date of service.
   *
   *   1. Try saved Assignment History for that client/DOS.
   *   2. If saved doesn't cover the DOS, fall back to inferred ownership
   *      from the Billing Report (BCBA anchor rows).
   *   3. Only when neither covers the row do we mark it Unassigned.
   *
   * This prevents partial saved Assignment History (e.g. records that end
   * before June) from silently disabling inferred ownership and turning
   * valid June rows into "No assignment covering DOS". */
  const inferred = useMemo(() => inferAssignmentHistory(rows), [rows]);

  const savedClientKeys = useMemo(() => {
    const s = new Set<string>();
    for (const a of assignments) {
      const k = (a.clientId && a.clientId.trim()) || normalizeName(a.clientName);
      if (k) s.add(k);
    }
    return s;
  }, [assignments]);

  /* Effective assignment list (saved + inferred) is kept for downstream
   * panels that need a flat list (issue detection, history view). Ownership
   * resolution per row does NOT use this list directly; it consults saved
   * and inferred independently so saved never blocks inferred for a date
   * the saved list doesn't cover. */
  const effectiveAssignments = useMemo(
    () => [...assignments, ...inferred.assignments],
    [assignments, inferred.assignments],
  );

  const inferredAssignmentIds = useMemo(
    () => new Set(inferred.assignments.map(a => a.id)),
    [inferred.assignments],
  );

  const usingInferred =
    rows.length > 0 && assignments.length === 0 && inferred.assignments.length > 0;
  const inferredClientCount = useMemo(() => {
    if (assignments.length === 0) return inferred.clientsWithAnchors;
    const seen = new Set<string>();
    for (const a of inferred.assignments) {
      const k = (a.clientId && a.clientId.trim()) || normalizeName(a.clientName);
      if (k) seen.add(k);
    }
    return seen.size;
  }, [assignments.length, inferred, savedClientKeys]);
  const usingMixedSources =
    rows.length > 0 && assignments.length > 0 && inferredClientCount > 0;

  const ownedRows: OwnedRow[] = useMemo(() => {
    return rows.map(r => {
      // 1. Try saved Assignment History first.
      const savedOwner = assignments.length
        ? ownerForClientAtDateV3(assignments, r.clientId, r.clientName, r.date)
        : null;
      // 2. Fall back to inferred ownership for this client/DOS.
      const inferredOwner = savedOwner
        ? null
        : ownerForClientAtDateV3(inferred.assignments, r.clientId, r.clientName, r.date);
      const owner = savedOwner ?? inferredOwner;
      // 3. Tag the row so the UI can show how the owner was resolved.
      const clientKey = (r.clientId && r.clientId.trim()) || normalizeName(r.clientName);
      const clientHasSaved = savedClientKeys.has(clientKey);
      const source: OwnedRow["assignmentSource"] = !owner
        ? "unassigned"
        : savedOwner
          ? "saved"
          : clientHasSaved ? "inferred_gap_fill" : "inferred";
      return {
        ...r,
        bcbaOwner: owner?.bcba ?? null,
        assignmentId: owner?.assignmentId ?? null,
        assignmentSource: source,
        is97153: isRbt97153(r.code),
      };
    });
  }, [rows, assignments, inferred.assignments, savedClientKeys]);

  const setupIncomplete = rows.length > 0 && effectiveAssignments.length === 0;
  const unassignedAudit: UnassignedAuditRow[] = useMemo(() => (
    ownedRows.filter(r => !r.bcbaOwner).map(r => ({ ...r, reason: "No assignment covering DOS" as const }))
  ), [ownedRows]);
  const assignmentIssues = useMemo(() => deriveAssignmentIssues(effectiveAssignments), [effectiveAssignments]);
  const validationCoverage = useMemo(() => {
    let assignedRows = 0, unassignedRows = 0, assignedHours = 0, unassignedHours = 0;
    const missing = new Map<string, { clientId: string; clientName: string; rows: number; hours: number }>();
    for (const r of ownedRows) {
      if (r.bcbaOwner) { assignedRows++; assignedHours += r.hours; continue; }
      unassignedRows++; unassignedHours += r.hours;
      const key = r.clientId || normalizeName(r.clientName);
      const v = missing.get(key) || { clientId: r.clientId, clientName: r.clientName, rows: 0, hours: 0 };
      v.rows += 1; v.hours += r.hours; missing.set(key, v);
    }
    return {
      assignmentRows: effectiveAssignments.length,
      assignedRows, assignedHours, unassignedRows, unassignedHours,
      missingClients: [...missing.values()].sort((a, b) => b.hours - a.hours),
      dateGaps: assignmentIssues.filter(i => i.type === "gap"),
    };
  }, [ownedRows, effectiveAssignments.length, assignmentIssues]);

  /* ----- filter options ----- */
  const bcbaOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of ownedRows) if (r.bcbaOwner) s.add(r.bcbaOwner);
    return [...s].sort();
  }, [ownedRows]);
  const clientOptions = useMemo(() => {
    const s = new Set<string>(); for (const r of ownedRows) s.add(r.clientName); return [...s].sort();
  }, [ownedRows]);
  const rbtOptions = useMemo(() => {
    const s = new Set<string>(); for (const r of ownedRows) if (r.renderingProvider) s.add(r.renderingProvider); return [...s].sort();
  }, [ownedRows]);
  const stateOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of ownedRows) {
      const code = normalizeUsState(r.state);
      if (code) s.add(code);
    }
    return [...s].sort();
  }, [ownedRows]);
  const payorOptions = useMemo(() => {
    const s = new Set<string>(); for (const r of ownedRows) if (r.payor) s.add(r.payor); return [...s].sort();
  }, [ownedRows]);
  const codeOptions = useMemo(() => {
    const s = new Set<string>(); for (const r of ownedRows) s.add(r.code); return [...s].sort();
  }, [ownedRows]);

  /* ----- apply filters ----- */
  const filtered: OwnedRow[] = useMemo(() => {
    const fromMs = dateFrom ? Date.parse(dateFrom) : -Infinity;
    const toMs = dateTo ? Date.parse(dateTo) + 24 * 3600 * 1000 : Infinity;
    const q = search.trim().toLowerCase();
    return ownedRows.filter(r => {
      const ms = Date.parse(r.date);
      if (!(ms >= fromMs && ms <= toMs)) return false;
      if (bcbaF !== "all" && (r.bcbaOwner ?? "— Unassigned —") !== bcbaF) return false;
      if (clientF !== "all" && r.clientName !== clientF) return false;
      if (rbtF !== "all" && r.renderingProvider !== rbtF) return false;
      if (stateF !== "all" && normalizeUsState(r.state) !== stateF) return false;
      if (payorF !== "all" && r.payor !== payorF) return false;
      if (codeF !== "all" && r.code !== codeF) return false;
      if (q && !(r.clientName.toLowerCase().includes(q) ||
                 (r.bcbaOwner || "").toLowerCase().includes(q) ||
                 r.renderingProvider.toLowerCase().includes(q) ||
                 r.code.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [ownedRows, dateFrom, dateTo, bcbaF, clientF, rbtF, stateF, payorF, codeF, search]);

  /* ----- KPIs ----- */
  const kpis = useMemo(() => {
    let totalHours = 0, h97153 = 0, directHours = 0, supervisionHours = 0, unassigned = 0;
    const clients = new Set<string>(), rbts = new Set<string>(), bcbas = new Set<string>();
    for (const r of filtered) {
      totalHours += r.hours;
      if (r.is97153) h97153 += r.hours; else directHours += r.hours;
      if (isSupervision(r.code)) supervisionHours += r.hours;
      clients.add(r.clientId || normalizeName(r.clientName));
      if (r.is97153 && r.renderingProvider) rbts.add(r.renderingProvider);
      if (r.bcbaOwner) bcbas.add(r.bcbaOwner); else unassigned += r.hours;
    }
    return { totalHours, h97153, directHours, supervisionHours, unassigned,
      clients: clients.size, rbts: rbts.size, bcbas: bcbas.size };
  }, [filtered]);

  /* ----- BCBA table ----- */
  interface BcbaRow {
    bcba: string;
    isUnassigned: boolean;
    totalHours: number;
    h97153: number;
    directHours: number;
    supervisionHours: number;
    clients: Map<string, number>;
    rbts: Map<string, number>;
    codes: Map<string, number>;
    rows: OwnedRow[];
  }
  const bcbaTable = useMemo(() => {
    const map = new Map<string, BcbaRow>();
    const ensure = (b: string, isU: boolean) => {
      let v = map.get(b);
      if (!v) {
        v = { bcba: b, isUnassigned: isU, totalHours: 0, h97153: 0, directHours: 0, supervisionHours: 0,
              clients: new Map(), rbts: new Map(), codes: new Map(), rows: [] };
        map.set(b, v);
      }
      return v;
    };
    for (const r of filtered) {
      const owner = r.bcbaOwner || "— Unassigned —";
      const row = ensure(owner, !r.bcbaOwner);
      row.totalHours += r.hours;
      if (r.is97153) row.h97153 += r.hours; else row.directHours += r.hours;
      if (isSupervision(r.code)) row.supervisionHours += r.hours;
      row.clients.set(r.clientName, (row.clients.get(r.clientName) || 0) + r.hours);
      if (r.is97153 && r.renderingProvider) row.rbts.set(r.renderingProvider, (row.rbts.get(r.renderingProvider) || 0) + r.hours);
      row.codes.set(r.code, (row.codes.get(r.code) || 0) + r.hours);
      row.rows.push(r);
    }
    return [...map.values()].sort((a, b) => b.totalHours - a.totalHours);
  }, [filtered]);

  const transfers = useMemo(() => deriveTransfersV3(effectiveAssignments), [effectiveAssignments]);
  const knownClientsWithId = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of ownedRows) if (!m.has(r.clientName)) m.set(r.clientName, r.clientId);
    return m;
  }, [ownedRows]);
  const filteredAssignments = useMemo(() => {
    const q = assignmentSearch.trim().toLowerCase();
    if (!q) return assignments;
    return assignments.filter(a =>
      a.clientName.toLowerCase().includes(q) ||
      a.clientId.toLowerCase().includes(q) ||
      a.bcbaName.toLowerCase().includes(q),
    );
  }, [assignments, assignmentSearch]);

  async function handleSaveReport() {
    if (!rows.length) { toast.error("Upload a billing file first"); return; }
    const dup = findDuplicateSavedV3(fileName, rows.length);
    if (dup && !confirm(`A similar report ("${dup.name}") was saved recently. Save anyway?`)) return;
    const name = prompt("Name this report", `${fileName || "Billing"} — ${new Date().toLocaleDateString()}`);
    if (!name) return;
    try {
      const rec = await saveReportV3({ name, fileName, rows });
      setSavedList(readSavedReportsV3());
      if (rec.remoteSyncError) {
        toast.warning("Saved locally — cloud sync failed, it won't appear on other devices yet.");
      } else {
        toast.success("Report saved");
      }
    } catch (e: any) {
      console.error("[bcba v3] save report failed", e);
      toast.error(e?.message ?? "Failed to save report");
    }
  }
  async function handleResetUpload() {
    if (rows.length && !confirm("Clear the current upload? Unsaved data will be lost.")) return;
    setRows([]);
    setFileName("");
    setValidation(null);
    setMissingCols([]);
    await clearLastBillingV3();
    if (inputRef.current) inputRef.current.value = "";
    toast.success("Upload cleared");
  }
  async function handleRegenerate(id: string) {
    const data = await getSavedReportRowsV3(id);
    if (!data.length) { toast.error("Saved report payload not found"); return; }
    setRows(data);
    const meta = readSavedReportsV3().find(r => r.id === id);
    if (meta) setFileName(meta.fileName);
    toast.success(`Regenerated "${meta?.name || id}"`);
  }

  function exportBcbaCsv() {
    downloadCsv(`bcba-productivity-v3-${Date.now()}.csv`,
      ["BCBA", "Total Hours", "97153 Hours", "Direct Hours", "Supervision Hours", "Supervision %", "Client Count", "RBT Count"],
      bcbaTable.map(b => {
        const pct = supervisionPctValue(b.supervisionHours, b.h97153);
        return [
          b.bcba, b.totalHours.toFixed(2), b.h97153.toFixed(2), b.directHours.toFixed(2),
          b.supervisionHours.toFixed(2), pct === null ? "" : pct.toFixed(1),
          b.clients.size, b.rbts.size,
        ];
      })
    );
  }

  async function exportBcbaPdf() {
    if (!bcbaTable.length) { toast.error("Nothing to export"); return; }
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      // Brand palette (Blossom soft blossom pink + slate)
      const brand: [number, number, number] = [232, 121, 145];
      const ink: [number, number, number] = [30, 33, 48];
      const sub: [number, number, number] = [120, 124, 140];
      const surface: [number, number, number] = [248, 246, 247];

      // Load logo as data URL (best effort — skip silently if it fails)
      let logoDataUrl: string | null = null;
      try {
        const res = await fetch(blossomLogo);
        const blob = await res.blob();
        logoDataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = reject;
          r.readAsDataURL(blob);
        });
      } catch { /* ignore */ }

      // ---------- Header band ----------
      doc.setFillColor(...surface);
      doc.rect(0, 0, pageW, 96, "F");
      doc.setDrawColor(...brand);
      doc.setLineWidth(2);
      doc.line(0, 96, pageW, 96);

      if (logoDataUrl) {
        try { doc.addImage(logoDataUrl, "PNG", 36, 24, 48, 48); } catch { /* ignore */ }
      }

      doc.setTextColor(...ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("BCBA Productivity Report", 100, 48);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...sub);
      const periodLabel = (validation && validation.dateMin && validation.dateMax)
        ? `Period ${validation.dateMin} — ${validation.dateMax}`
        : "Current dataset";
      doc.text(periodLabel, 100, 64);
      doc.text(
        `Generated ${new Date().toLocaleString()}${fileName ? `  •  Source: ${fileName}` : ""}`,
        100, 78,
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...brand);
      doc.text("BLOSSOM ABA THERAPY", pageW - 36, 48, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...sub);
      doc.text("Operational Intelligence", pageW - 36, 62, { align: "right" });

      // ---------- KPI cards ----------
      const cards: { label: string; value: string }[] = [
        { label: "Total hours", value: fmt1(kpis.totalHours) },
        { label: "97153 (Direct RBT)", value: fmt1(kpis.h97153) },
        { label: "Supervision (97155)", value: fmt1(kpis.supervisionHours) },
        { label: "Supervision %", value: fmtPct(kpis.supervisionHours, kpis.h97153) },
        { label: "BCBAs", value: fmt0(kpis.bcbas) },
        { label: "Clients", value: fmt0(kpis.clients) },
        { label: "Unassigned hrs", value: fmt1(kpis.unassigned) },
      ];
      const cardsY = 116;
      const cardsX = 36;
      const cardsW = pageW - 72;
      const gap = 10;
      const cardW = (cardsW - gap * (cards.length - 1)) / cards.length;
      const cardH = 56;
      cards.forEach((c, i) => {
        const x = cardsX + i * (cardW + gap);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(232, 230, 232);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, cardsY, cardW, cardH, 6, 6, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...sub);
        doc.text(c.label.toUpperCase(), x + 10, cardsY + 16);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(...ink);
        doc.text(c.value, x + 10, cardsY + 40);
      });

      // ---------- BCBA summary table ----------
      const head = [[
        "BCBA", "Total hrs", "97153 hrs", "Direct hrs", "Supervision hrs",
        "Sup %", "Clients", "RBTs",
      ]];
      const body = bcbaTable.map(b => {
        const pct = supervisionPctValue(b.supervisionHours, b.h97153);
        return [
          b.isUnassigned ? "— Unassigned —" : b.bcba,
          fmt1(b.totalHours),
          fmt1(b.h97153),
          fmt1(b.directHours),
          fmt1(b.supervisionHours),
          pct === null ? "—" : `${pct.toFixed(1)}%`,
          String(b.clients.size),
          String(b.rbts.size),
        ];
      });

      autoTable(doc, {
        startY: cardsY + cardH + 22,
        head,
        body,
        theme: "plain",
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: { top: 7, right: 8, bottom: 7, left: 8 },
          textColor: ink,
          lineColor: [232, 230, 232],
          lineWidth: 0.4,
        },
        headStyles: {
          fillColor: brand,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
          halign: "left",
        },
        alternateRowStyles: { fillColor: surface },
        columnStyles: {
          0: { cellWidth: "auto", fontStyle: "bold" },
          1: { halign: "right" },
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "right" },
          5: { halign: "right" },
          6: { halign: "right" },
          7: { halign: "right" },
        },
        margin: { left: 36, right: 36 },
        didDrawPage: () => {
          // Footer
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(...sub);
          doc.text(
            "Confidential — Blossom ABA Therapy Operational Report",
            36, pageH - 18,
          );
          const pageNum = doc.getNumberOfPages();
          doc.text(
            `Page ${doc.getCurrentPageInfo().pageNumber} of ${pageNum}`,
            pageW - 36, pageH - 18, { align: "right" },
          );
        },
      });

      const stamp = new Date().toISOString().slice(0, 10);
      doc.save(`blossom-bcba-productivity-${stamp}.pdf`);
      toast.success("PDF exported");
    } catch (e: any) {
      console.error("[bcba v3] pdf export failed", e);
      toast.error(e?.message ?? "Failed to export PDF");
    }
  }
  function exportTransfersCsv() {
    downloadCsv(`bcba-transfers-v3-${Date.now()}.csv`,
      ["Client", "Previous BCBA", "New BCBA", "Transfer Date"],
      transfers.map(t => [t.clientName, t.previousBcba, t.newBcba, t.transferDate])
    );
  }
  function exportAssignmentsCsv() {
    downloadCsv(`bcba-assignment-history-${Date.now()}.csv`,
      ["ClientId", "ClientName", "BCBA", "StartDate", "EndDate", "Note"],
      assignments.map(a => [a.clientId, a.clientName, a.bcbaName, a.startDate, a.endDate ?? "", a.note ?? ""])
    );
  }
  function exportUnassignedCsv() {
    downloadCsv(`bcba-unassigned-audit-v3-${Date.now()}.csv`,
      ["ClientId", "ClientName", "DateOfService", "Code", "Rendering Provider", "Hours", "State", "Payor", "Reason"],
      unassignedAudit.map(r => [r.clientId, r.clientName, r.date, r.code, r.renderingProvider, r.hours.toFixed(2), r.state, r.payor, r.reason]),
    );
  }
  function startAssignmentForRow(row: UnassignedAuditRow) {
    setEditing({
      id: "__new__", clientId: row.clientId, clientName: row.clientName, bcbaName: "",
      startDate: row.date, endDate: null, note: "Created from unassigned audit", createdAt: Date.now(),
    });
    setAssignmentSearch(row.clientId || row.clientName);
    setShowHistory(true);
  }
  function openClientHistory(row: UnassignedAuditRow) {
    setAssignmentSearch(row.clientId || row.clientName);
    setShowHistory(true);
  }
  async function importAssignmentsCsv(file: File) {
    try {
      const parsed = await parseAnyFile(file);
      const first = parsed[0];
      const h = first.headers;
      const idH = findH(h, ["ClientId", "Client ID"]);
      const nameH = findH(h, ["ClientName", "Client Name", "Client"]);
      const bcbaH = findH(h, ["BCBA", "BcbaName", "BCBA Name"]);
      const startH = findH(h, ["StartDate", "Start Date", "Start"]);
      const endH = findH(h, ["EndDate", "End Date", "End"]);
      const noteH = findH(h, ["Note", "Notes"]);
      if (!bcbaH || !startH || (!nameH && !idH)) {
        toast.error("Missing required columns: BCBA, StartDate, and ClientName or ClientId");
        return;
      }
      const imported: Omit<BcbaAssignmentV3, "id" | "createdAt" | "updatedAt">[] = [];
      let added = 0;
      for (const r of first.rows) {
        const cid = (idH ? r[idH] : "").trim();
        const cn = (nameH ? r[nameH] : "").trim() || cid;
        const bn = (bcbaH ? r[bcbaH] : "").trim();
        const sd = isoDate((startH ? r[startH] : "").trim());
        if ((!cn && !cid) || !bn || !sd) continue;
        const ed = endH ? isoDate(String(r[endH]).trim()) : "";
        imported.push({
          clientId: cid,
          clientName: cn,
          bcbaName: bn,
          startDate: sd,
          endDate: ed || null,
          note: noteH ? String(r[noteH] || "") : "",
        });
        added++;
      }
      setAssignments(await bulkInsertAssignmentsV3(imported));
      toast.success(`Imported ${added} assignments`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to import assignments");
    }
  }

  async function handleSaveInferred() {
    if (!inferred.assignments.length) return;
    if (!confirm(`Save ${inferred.assignments.length} inferred BCBA assignments to Assignment History? You can edit them after.`)) return;
    try {
      const toInsert = inferred.assignments.map(a => ({
        clientId: a.clientId,
        clientName: a.clientName,
        bcbaName: a.bcbaName,
        startDate: a.startDate,
        endDate: a.endDate,
        note: a.note ?? "Inferred from Billing Report",
      }));
      setAssignments(await bulkInsertAssignmentsV3(toInsert));
      toast.success(`Saved ${toInsert.length} inferred assignments`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save inferred assignments");
    }
  }

  return (
    <OSShell>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Stethoscope className="h-3.5 w-3.5" /> Featured Dashboard
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">BCBA Productivity Report V3</h1>
            <p className="text-sm text-muted-foreground">
              One billing upload. Historical BCBA Assignment History is the source of truth for ownership.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHelp(true)}
              title="How this report works"
              aria-label="How this report works"
              className="rounded-full"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportBcbaCsv} disabled={!bcbaTable.length}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportBcbaPdf} disabled={!bcbaTable.length}>
              <FileText className="mr-2 h-4 w-4" /> Export PDF
            </Button>
            <Button size="sm" onClick={handleSaveReport} disabled={!rows.length}>
              <Save className="mr-2 h-4 w-4" /> Save Report
            </Button>
          </div>
        </div>

        <CentralReachRequirementsCard
          exportName="CentralReach Billing / Service export (CSV or XLSX)"
          requiredColumns={[
            "DateOfService", "ClientId", "ClientFirstName", "ClientLastName",
            "ProcedureCode", "TimeWorkedInHours", "ProviderFirstName",
            "ProviderLastName", "PayorNickname", "LocationCode",
          ]}
          filterNote="Same file feeds BCBA Supervision and Parent Training. Admin uploads at System Tools → BCBA Productivity Uploads are auto-loaded — no manual upload needed when the shared dataset is populated."
          adminUploadsHref="/admin/bcba-productivity-uploads"
          adminSourceLabel="Auto-loads from Admin Uploads"
        />

        {/* Setup / inferred banners stay above tabs */}
        {setupIncomplete && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
            <AlertTriangle className="mr-1.5 inline h-4 w-4" />
            BCBA Assignment History is required before productivity can be assigned. Upload or create assignment history first.
          </div>
        )}
        {usingInferred && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Database className="mr-1.5 inline h-4 w-4 text-primary" />
                Ownership inferred from this Billing Report — {inferred.assignments.length} assignments derived for {inferred.clientsWithAnchors} clients across {inferred.uniqueBcbas} BCBAs.
                {inferred.conflicts.length > 0 && (
                  <span className="ml-2 text-warning-foreground">
                    <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                    {inferred.conflicts.length} ownership conflicts flagged.
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowHistory(true)}>
                  <History className="mr-1.5 h-3.5 w-3.5" /> Review inferred history
                </Button>
                <Button size="sm" onClick={handleSaveInferred}>
                  <Save className="mr-1.5 h-3.5 w-3.5" /> Save inferred history
                </Button>
              </div>
            </div>
          </div>
        )}
        {usingMixedSources && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            <Database className="mr-1.5 inline h-4 w-4 text-primary" />
            Mixed ownership sources — {assignments.length} saved assignments are used for clients with manual history,
            and {inferredClientCount} additional clients fall back to month-aware inference from the Billing Report.
            Saved Assignment History for one client no longer disables inference for other clients.
          </div>
        )}
        {kpis.unassigned > 0 && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
            <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />
            {fmt1(kpis.unassigned)} hrs have no Assignment History match. Open <button className="underline" onClick={() => setShowHistory(true)}>Assignment History</button> to add ownership entries.
            {unassignedAudit.length > 0 && <button className="ml-2 underline" onClick={exportUnassignedCsv}>Export unassigned audit</button>}
          </div>
        )}

        {/* Empty state when no admin-uploaded dataset exists. */}
        {!savedParam && !rows.length && (!sharedStatus || sharedStatus.activeRowCount === 0) && (
          <div className="rounded-xl border bg-card/60 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-3 text-primary"><Database className="h-6 w-6" /></div>
                <div>
                  <div className="font-medium">Admin-fed CentralReach dataset</div>
                  <div className="mt-1 text-sm text-muted-foreground max-w-xl">
                    No admin-uploaded BCBA productivity dataset found. Ask an admin to upload the CentralReach billing export.
                  </div>
                  {sharedError && (
                    <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />
                      {sharedError}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => loadSharedDataset({ force: true })} disabled={sharedLoading}>
                  <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", sharedLoading && "animate-spin")} />
                  {sharedLoading && sharedProgress
                    ? `Loading ${sharedProgress.loaded.toLocaleString()} / ${sharedProgress.total.toLocaleString()}`
                    : "Refresh dataset"}
                </Button>
                <Button size="sm" asChild>
                  <Link to="/system/bcba-productivity-uploads">Manage uploads</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="rounded-xl border bg-card/60 p-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">From</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">To</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8" />
            </div>
            <FilterSelect label="BCBA" value={bcbaF} onChange={setBcbaF}
              options={["— Unassigned —", ...bcbaOptions]} />
            <FilterSelect label="Client" value={clientF} onChange={setClientF} options={clientOptions} />
            <FilterSelect label="RBT" value={rbtF} onChange={setRbtF} options={rbtOptions} />
            <FilterSelect label="State" value={stateF} onChange={setStateF} options={stateOptions} />
            <FilterSelect label="Payor" value={payorF} onChange={setPayorF} options={payorOptions} />
            <FilterSelect label="Code" value={codeF} onChange={setCodeF} options={codeOptions} />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                     placeholder="Search BCBA, client, RBT, code…"
                     className="h-8 pl-7" />
            </div>
          </div>
        </div>

        {/* Main tabbed report */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bcba">BCBA Summary</TabsTrigger>
            <TabsTrigger value="supervision">Supervision</TabsTrigger>
            <TabsTrigger value="clients">Clients &amp; RBTs</TabsTrigger>
            <TabsTrigger value="upload">Data Source</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
              <KpiCard label="Total Hours" value={fmt1(kpis.totalHours)} />
              <KpiCard label="97153 Hours" value={fmt1(kpis.h97153)} />
              <KpiCard label="Direct BCBA Hours" value={fmt1(kpis.directHours)} />
              <KpiCard label="Supervision Hours" value={fmt1(kpis.supervisionHours)} />
              <KpiCard label="Supervision %" value={fmtPct(kpis.supervisionHours, kpis.h97153)}
                tone={supervisionTone(supervisionPctValue(kpis.supervisionHours, kpis.h97153)) === "danger" ? "warn" : undefined} />
              <KpiCard label="Active BCBAs" value={fmt0(kpis.bcbas)} />
              <KpiCard label="Active Clients" value={fmt0(kpis.clients)} />
              <KpiCard label="Active RBTs" value={fmt0(kpis.rbts)} />
            </div>
            <OverviewCharts bcbaTable={bcbaTable} />
          </TabsContent>

          <TabsContent value="bcba" className="space-y-3">
            <BcbaSummaryTable
              bcbaTable={bcbaTable}
              expanded={expanded}
              setExpanded={setExpanded}
            />
          </TabsContent>

          <TabsContent value="supervision" className="space-y-4">
            <SupervisionTab bcbaTable={bcbaTable} />
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <ClientsRbtsTab filtered={filtered} bcbaTable={bcbaTable} />
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            {/* Admin-fed dataset status and controls. */}
            <div className="rounded-2xl border bg-card/60 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary"><Database className="h-6 w-6" /></div>
                  <div>
                    <div className="font-medium">Admin-fed CentralReach dataset</div>
                    <div className="text-xs text-muted-foreground max-w-xl">
                      This report runs on CentralReach billing data uploaded by admins in System Tools. Users do not need to upload the daily CentralReach export.
                    </div>
                    {sharedStatus && sharedStatus.activeRowCount > 0 ? (
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5">
                          Using shared admin dataset
                        </span>
                        <span>{sharedStatus.activeRowCount.toLocaleString()} rows</span>
                        {sharedStatus.earliestServiceDate && sharedStatus.latestServiceDate && (
                          <span>{sharedStatus.earliestServiceDate} → {sharedStatus.latestServiceDate}</span>
                        )}
                        {sharedStatus.lastUploadAt && (
                          <span>last uploaded {new Date(sharedStatus.lastUploadAt).toLocaleString()}</span>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-muted-foreground">
                        No admin-uploaded BCBA productivity dataset found. Ask an admin to upload the CentralReach billing export.
                      </div>
                    )}
                    {sharedError && (
                      <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />
                        {sharedError}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => loadSharedDataset()} disabled={sharedLoading}>
                    <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", sharedLoading && "animate-spin")} /> Refresh dataset
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/system/bcba-productivity-uploads">Manage uploads</Link>
                  </Button>
                </div>
              </div>
            </div>

            {validation && (
              <div className="rounded-xl border bg-card/60 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Upload Validation
                  </div>
                  <div className="text-xs text-muted-foreground">{validation.fileName}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                  <ValPill label="Raw rows" value={fmt0(validation.rawRowCount)} />
                  <ValPill label="Accepted" value={fmt0(validation.acceptedRowCount)} />
                  <ValPill label="Dropped" value={fmt0(validation.droppedRowCount)} tone={validation.droppedRowCount ? "warn" : undefined} />
                  <ValPill label="Total hours" value={fmt1(validation.totalHours)} />
                  <ValPill label="Date range" value={validation.dateMin && validation.dateMax ? `${validation.dateMin} → ${validation.dateMax}` : "—"} />
                  <ValPill label="Unique clients" value={fmt0(validation.uniqueClients)} />
                  <ValPill label="Unique providers" value={fmt0(validation.uniqueProviders)} />
                  <ValPill label="Assignment rows" value={fmt0(validationCoverage.assignmentRows)} tone={!validationCoverage.assignmentRows ? "warn" : undefined} />
                  <ValPill label="Assigned rows" value={fmt0(validationCoverage.assignedRows)} />
                  <ValPill label="Assigned hours" value={fmt1(validationCoverage.assignedHours)} />
                  <ValPill label="Unassigned rows" value={fmt0(validationCoverage.unassignedRows)} tone={validationCoverage.unassignedRows ? "warn" : undefined} />
                  <ValPill label="Unassigned hours" value={fmt1(validationCoverage.unassignedHours)} tone={validationCoverage.unassignedHours ? "warn" : undefined} />
                </div>
                {Object.keys(validation.dropReasons).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {Object.entries(validation.dropReasons).map(([k, v]) => (
                      <Badge key={k} variant="outline" className="font-normal">
                        <AlertTriangle className="mr-1 h-3 w-3 text-warning" />
                        {k}: {v.toLocaleString()}
                      </Badge>
                    ))}
                  </div>
                )}
                {validation.topCodes.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Top codes</div>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {validation.topCodes.map(c => (
                        <span key={c.code} className="rounded-md border bg-background px-2 py-0.5">
                          <span className="font-medium">{c.code}</span>
                          <span className="ml-1 text-muted-foreground">{fmt0(c.rows)} rows · {fmt1(c.hours)} hrs</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(validationCoverage.missingClients.length > 0 || validationCoverage.dateGaps.length > 0) && (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <MiniAuditList
                      title="Clients missing assignment history"
                      rows={validationCoverage.missingClients.slice(0, 10).map(c => [`${c.clientName || c.clientId}`, `${fmt1(c.hours)} hrs · ${fmt0(c.rows)} rows`])}
                    />
                    <MiniAuditList
                      title="Clients with assignment date gaps"
                      rows={validationCoverage.dateGaps.slice(0, 10).map(g => [g.clientName, g.detail])}
                    />
                  </div>
                )}
              </div>
            )}

            {savedList.length > 0 && (
              <div className="rounded-xl border bg-card/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Database className="h-3.5 w-3.5" /> Saved Reports
                </div>
                <div className="flex flex-wrap gap-2">
                  {savedList.map(r => (
                    <div key={r.id} className="group flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-xs">
                      <button className="font-medium hover:underline" onClick={() => handleRegenerate(r.id)}>{r.name}</button>
                      <span className="text-muted-foreground">{r.rowCount.toLocaleString()} rows</span>
                      <button
                        className="opacity-60 hover:opacity-100"
                        onClick={async () => { await deleteSavedReportV3(r.id); setSavedList(readSavedReportsV3()); }}
                        title="Delete"
                      ><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unassignedAudit.length > 0 && (
              <div className="overflow-hidden rounded-xl border">
                <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <AlertTriangle className="h-3.5 w-3.5" /> Unassigned Audit
                  </div>
                  <Button variant="ghost" size="sm" onClick={exportUnassignedCsv}>
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Export
                  </Button>
                </div>
                <div className="max-h-80 overflow-auto">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead className="sticky top-0 bg-background text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Client</th><th className="px-3 py-2">Client ID</th><th className="px-3 py-2">DOS</th>
                        <th className="px-3 py-2">Code</th><th className="px-3 py-2">Rendering Provider</th><th className="px-3 py-2 text-right">Hours</th>
                        <th className="px-3 py-2">State</th><th className="px-3 py-2">Payor</th><th className="px-3 py-2">Reason</th><th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {unassignedAudit.slice(0, 250).map((r, i) => (
                        <tr key={`${r.clientId}-${r.clientName}-${r.date}-${i}`} className="border-t">
                          <td className="px-3 py-2 font-medium">{r.clientName}</td><td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.clientId || "—"}</td>
                          <td className="px-3 py-2">{r.date}</td><td className="px-3 py-2">{r.code}</td><td className="px-3 py-2">{r.renderingProvider || "—"}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{fmt1(r.hours)}</td><td className="px-3 py-2">{r.state || "—"}</td><td className="px-3 py-2">{r.payor || "—"}</td>
                          <td className="px-3 py-2">{r.reason}</td>
                          <td className="px-3 py-2 text-right">
                            <Button variant="ghost" size="sm" onClick={() => openClientHistory(r)}>
                              <History className="mr-1.5 h-3.5 w-3.5" /> Open history
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => startAssignmentForRow(r)}>
                              <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Create assignment
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-xl border">
              <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <ArrowLeftRight className="h-3.5 w-3.5" /> Transfer Audit
                </div>
                <Button variant="ghost" size="sm" onClick={exportTransfersCsv} disabled={!transfers.length}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Export
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-background text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Client</th>
                      <th className="px-3 py-2">Previous BCBA</th>
                      <th className="px-3 py-2">New BCBA</th>
                      <th className="px-3 py-2">Transfer Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.length === 0 && (
                      <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-muted-foreground">
                        No transfers yet. Add a new assignment for a client to create a transfer event.
                      </td></tr>
                    )}
                    {transfers.map((t, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{t.clientName}</td>
                        <td className="px-3 py-2">{t.previousBcba}</td>
                        <td className="px-3 py-2">{t.newBcba}</td>
                        <td className="px-3 py-2">{t.transferDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Assignment history drawer */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-h-[88vh] max-w-6xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>BCBA Assignment History</DialogTitle>
          </DialogHeader>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="relative min-w-64 flex-1">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={assignmentSearch} onChange={e => setAssignmentSearch(e.target.value)} placeholder="Search client, ClientId, or BCBA…" className="h-8 pl-7" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={refreshAssignments} disabled={assignmentLoading}>
                <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", assignmentLoading && "animate-spin")} /> Refresh
              </Button>
            <input ref={assignImportRef} type="file" hidden accept={SUPPORTED_EXTENSIONS}
              onChange={e => e.target.files?.[0] && importAssignmentsCsv(e.target.files[0])} />
            <Button variant="outline" size="sm" onClick={() => assignImportRef.current?.click()}>
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Import CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportAssignmentsCsv} disabled={!assignments.length}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
            </Button>
            </div>
          </div>
          {assignmentError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{assignmentError}</div>}
          <Tabs defaultValue="history" className="min-h-0">
            <TabsList>
              <TabsTrigger value="history">History ({assignments.length})</TabsTrigger>
              <TabsTrigger value="issues">Gaps & overlaps ({assignmentIssues.length})</TabsTrigger>
              <TabsTrigger value="unassigned">Unassigned ({unassignedAudit.length})</TabsTrigger>
              <TabsTrigger value="inferred">Inferred ({inferred.assignments.length})</TabsTrigger>
              <TabsTrigger value="conflicts">Conflicts ({inferred.conflicts.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="history" className="max-h-[64vh] overflow-auto">
              <AssignmentHistoryEditor
                assignments={filteredAssignments}
                knownClients={clientOptions}
                knownClientsWithId={knownClientsWithId}
                onChange={refreshAssignments}
                editing={editing}
                setEditing={setEditing}
              />
            </TabsContent>
            <TabsContent value="issues" className="max-h-[64vh] overflow-auto">
              <AssignmentIssuesTable issues={assignmentIssues} />
            </TabsContent>
            <TabsContent value="unassigned" className="max-h-[64vh] overflow-auto">
              <UnassignedManagerTable rows={unassignedAudit} onCreate={startAssignmentForRow} onExport={exportUnassignedCsv} />
            </TabsContent>
            <TabsContent value="inferred" className="max-h-[64vh] overflow-auto">
              <InferredAssignmentsTable
                assignments={inferred.assignments}
                onSave={handleSaveInferred}
                usingInferred={usingInferred}
              />
            </TabsContent>
            <TabsContent value="conflicts" className="max-h-[64vh] overflow-auto">
              <OwnershipConflictsTable conflicts={inferred.conflicts} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" /> How the BCBA Productivity V3 report works
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-5 overflow-auto pr-2 text-sm leading-relaxed">
            <section>
              <h3 className="mb-1 text-sm font-semibold">1. What you upload</h3>
              <p className="text-muted-foreground">
                A single CentralReach <strong>Billing Report</strong> (CSV or XLSX). One row = one
                billed service line. The parser auto-detects these columns (case/spacing insensitive):
              </p>
              <ul className="ml-5 mt-1 list-disc text-muted-foreground">
                <li><code>ClientId</code> + <code>ClientFirstName</code> / <code>ClientLastName</code> (or <code>Client</code> / <code>Patient</code>)</li>
                <li><code>DateOfService</code> (DOS)</li>
                <li><code>ProcedureCode</code> (CPT)</li>
                <li><code>TimeWorkedInHours</code> (or <code>Hours</code> / <code>BillableHours</code>)</li>
                <li><code>ProviderFirstName</code> / <code>ProviderLastName</code> (rendering provider)</li>
                <li><code>ProviderContactLabels</code> — used to detect BCBA vs RBT</li>
                <li><code>ClientLocationStateProvince</code>, <code>PayorNickname</code> (optional filters)</li>
              </ul>
              <p className="mt-1 text-muted-foreground">
                A row is <strong>dropped</strong> if it is missing a parseable DOS, client identity,
                procedure code, or numeric hours &gt; 0. Drop counts appear in the validation panel.
              </p>
            </section>

            <section>
              <h3 className="mb-1 text-sm font-semibold">2. BCBA vs RBT classification</h3>
              <p className="text-muted-foreground">
                Classification is <strong>by procedure code, not by job title</strong>:
              </p>
              <ul className="ml-5 mt-1 list-disc text-muted-foreground">
                <li><strong>97153</strong> rows → counted as <em>RBT direct therapy</em> hours
                  (column "97153 Hours"). The rendering provider on these rows is treated as the RBT.</li>
                <li><strong>All other codes</strong> (97155, 97156, 97151, 97158, etc.) → counted as
                  <em>Direct BCBA</em> hours.</li>
              </ul>
              <p className="mt-1 text-muted-foreground">
                The <code>ProviderContactLabels</code> column is only used when <em>inferring</em> an
                assignment history (see §4) — it identifies which rendering provider on a non-97153
                line is a BCBA via a case-insensitive match on the word <code>BCBA</code>.
              </p>
            </section>

            <section>
              <h3 className="mb-1 text-sm font-semibold">3. Who owns each row (the BCBA owner)</h3>
              <p className="text-muted-foreground">
                Every billing row — including 97153 RBT lines — is attributed to the BCBA who owned
                that client on that DOS. Ownership is resolved against <strong>Assignment History</strong>
                with this rule:
              </p>
              <ol className="ml-5 mt-1 list-decimal text-muted-foreground">
                <li>Match the billing row to assignments where either <code>ClientId</code> matches
                  exactly, or the normalized client name matches
                  (lowercased, alphanumerics only).</li>
                <li>Keep assignments where <code>startDate ≤ DOS ≤ endDate</code>
                  (an empty <code>endDate</code> is treated as open / today).</li>
                <li>If multiple match, pick the one with the <strong>latest startDate</strong> —
                  that handles transfers cleanly.</li>
              </ol>
              <p className="mt-1 text-muted-foreground">
                Rows with no matching assignment are surfaced in the <strong>Unassigned audit</strong>
                so you can either add an assignment or fix the client name.
              </p>
            </section>

            <section>
              <h3 className="mb-1 text-sm font-semibold">4. Inferred Assignment History (fallback)</h3>
              <p className="text-muted-foreground">
                If Assignment History is empty, the report infers ownership from the billing file
                itself so you are never fully unassigned:
              </p>
              <ul className="ml-5 mt-1 list-disc text-muted-foreground">
                <li>An <em>anchor row</em> is any row where <code>ProcedureCode ≠ 97153</code> AND
                  <code>ProviderContactLabels</code> contains "BCBA".</li>
                <li>For each client, anchor rows are grouped by date; if multiple BCBAs anchor on
                  the same day, the one with the most hours wins (tiebreak: total direct hours on
                  this client, then name).</li>
                <li>Consecutive days with the same BCBA are compressed into a single assignment
                  run. A new BCBA starting a run creates an inferred <strong>transfer</strong>.</li>
                <li>The first inferred assignment is back-dated to the client's earliest DOS in
                  the file so early 97153 hours still attach.</li>
              </ul>
              <p className="mt-1 text-muted-foreground">
                Click <em>Save inferred</em> to promote these into permanent Assignment History, then
                edit them as needed. Once any assignments exist in history, the inferred set is
                ignored and history becomes the only source of truth.
              </p>
            </section>

            <section>
              <h3 className="mb-1 text-sm font-semibold">5. KPIs and table math</h3>
              <ul className="ml-5 list-disc text-muted-foreground">
                <li><strong>Total Hours</strong> = sum of <code>hours</code> on filtered rows.</li>
                <li><strong>97153 Hours</strong> = sum of hours where code starts with 97153.</li>
                <li><strong>Direct BCBA Hours</strong> = Total − 97153.</li>
                <li><strong>Active Clients</strong> = distinct <code>ClientId</code> (or normalized name).</li>
                <li><strong>Active RBTs</strong> = distinct rendering providers on 97153 rows.</li>
                <li><strong>Active BCBAs</strong> = distinct resolved BCBA owners.</li>
                <li><strong>Unassigned hours</strong> = hours on rows with no owner — these are
                  excluded from any per-BCBA rollup and shown under "— Unassigned —".</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-1 text-sm font-semibold">6. Transfers</h3>
              <p className="text-muted-foreground">
                A transfer is emitted whenever, for the same client, a later assignment has a
                different <code>bcbaName</code> than the prior one. The <strong>transfer date</strong>
                is the start date of the new assignment.
              </p>
            </section>

            <section>
              <h3 className="mb-1 text-sm font-semibold">7. Persistence</h3>
              <ul className="ml-5 list-disc text-muted-foreground">
                <li><strong>Assignment History</strong> lives in the database (<code>bcba_assignment_history</code>).</li>
                <li><strong>Your last uploaded billing file</strong> is cached in this browser
                  (IndexedDB) and reloaded automatically when you return to the page. It only
                  clears when you click <em>Reset</em>.</li>
                <li><strong>Saved Reports</strong> snapshot the parsed rows under a name; opening
                  one regenerates the full report deterministically from the saved billing rows
                  + current Assignment History.</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-1 text-sm font-semibold">8. Common reasons numbers look "off"</h3>
              <ul className="ml-5 list-disc text-muted-foreground">
                <li>Client name spelled differently in billing vs. Assignment History → row falls into Unassigned.</li>
                <li>Assignment <code>startDate</code> is later than some early DOS for that client → those early rows are Unassigned.</li>
                <li>Overlapping or gap assignments (flagged in the validation panel) — only one BCBA can own a DOS, so the latest-start wins.</li>
                <li>Provider listed as BCBA but billed a 97153 code → that line counts as 97153/RBT hours by design.</li>
              </ul>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </OSShell>
  );
}

/* ---------- subcomponents ---------- */
function KpiCard({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className={cn("rounded-xl border p-3",
      tone === "warn" ? "border-warning/40 bg-warning/10" : "bg-card/60")}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
function ValPill({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className={cn("rounded-lg border bg-background px-3 py-2",
      tone === "warn" && "border-warning/40 bg-warning/10")}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
function MiniAuditList({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-lg border bg-background p-2">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      <ul className="space-y-1 text-xs">
        {rows.length === 0 && <li className="text-muted-foreground">None detected</li>}
        {rows.map(([name, detail], i) => (
          <li key={`${name}-${i}`} className="flex justify-between gap-3">
            <span className="min-w-0 truncate font-medium">{name || "Unknown client"}</span>
            <span className="shrink-0 text-right text-muted-foreground">{detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8"><SelectValue placeholder={`All ${label}s`} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All {label}s</SelectItem>
          {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
function Row({ bcba, expanded, onToggle }: {
  bcba: { bcba: string; isUnassigned: boolean; totalHours: number; h97153: number; directHours: number;
          supervisionHours: number; clients: Map<string, number>; rbts: Map<string, number>; codes: Map<string, number>; rows: OwnedRow[]; };
  expanded: boolean; onToggle: () => void;
}) {
  const pct = supervisionPctValue(bcba.supervisionHours, bcba.h97153);
  const tone = supervisionTone(pct);
  return (
    <>
      <tr className={cn("border-t hover:bg-muted/30", bcba.isUnassigned && "bg-warning/10")}>
        <td className="px-3 py-2">
          <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </td>
        <td className="px-3 py-2 font-medium">
          {bcba.bcba}
          {bcba.isUnassigned && <Badge variant="outline" className="ml-2 border-warning/50 text-warning-foreground">No assignment history</Badge>}
        </td>
        <td className="px-3 py-2 text-right tabular-nums">{fmt1(bcba.totalHours)}</td>
        <td className="px-3 py-2 text-right tabular-nums">{fmt1(bcba.h97153)}</td>
        <td className="px-3 py-2 text-right tabular-nums">{fmt1(bcba.directHours)}</td>
        <td className="px-3 py-2 text-right tabular-nums">{fmt1(bcba.supervisionHours)}</td>
        <td className={cn("px-3 py-2 text-right tabular-nums font-medium",
          tone === "danger" && "text-destructive",
          tone === "warn" && "text-warning-foreground",
          tone === "ok" && "text-emerald-600 dark:text-emerald-400",
        )}>{pct === null ? "—" : `${pct.toFixed(1)}%`}</td>
        <td className="px-3 py-2 text-right tabular-nums">{fmt0(bcba.clients.size)}</td>
        <td className="px-3 py-2 text-right tabular-nums">{fmt0(bcba.rbts.size)}</td>
      </tr>
      {expanded && (
        <tr className="bg-muted/10">
          <td></td>
          <td colSpan={8} className="px-3 py-3">
            <div className="grid gap-4 md:grid-cols-3">
              <DrillList title="Clients" items={[...bcba.clients.entries()]} />
              <DrillList title="RBTs / Rendering Providers" items={[...bcba.rbts.entries()]} />
              <DrillList title="Billing Codes" items={[...bcba.codes.entries()]} />
            </div>
            <BillingRowsDrilldown rows={bcba.rows} />
          </td>
        </tr>
      )}
    </>
  );
}
function BillingRowsDrilldown({ rows }: { rows: OwnedRow[] }) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border bg-background">
      <div className="border-b bg-muted/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Billing Rows
      </div>
      <div className="max-h-56 overflow-auto">
        <table className="w-full min-w-[760px] text-xs">
          <thead className="sticky top-0 bg-background text-left uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-2 py-1">DOS</th><th className="px-2 py-1">Client</th><th className="px-2 py-1">Rendering Provider</th><th className="px-2 py-1">Code</th><th className="px-2 py-1 text-right">Hours</th><th className="px-2 py-1">Payor</th></tr>
          </thead>
          <tbody>
            {rows.slice(0, 200).map((r, i) => (
              <tr key={`${r.date}-${r.clientId}-${r.code}-${i}`} className="border-t">
                <td className="px-2 py-1">{r.date}</td><td className="px-2 py-1 font-medium">{r.clientName}</td><td className="px-2 py-1">{r.renderingProvider || "—"}</td><td className="px-2 py-1">{r.code}</td><td className="px-2 py-1 text-right tabular-nums">{fmt1(r.hours)}</td><td className="px-2 py-1">{r.payor || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function DrillList({ title, items }: { title: string; items: [string, number][] }) {
  const sorted = [...items].sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-lg border bg-background p-2">
      <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>{title}</span><span>Hours</span>
      </div>
      <ul className="space-y-0.5 text-xs">
        {sorted.length === 0 && <li className="text-muted-foreground">—</li>}
        {sorted.slice(0, 20).map(([k, v]) => (
          <li key={k} className="flex items-center justify-between gap-2">
            <span className="truncate">{k}</span>
            <span className="tabular-nums">{fmt1(v)}</span>
          </li>
        ))}
        {sorted.length > 20 && (
          <li className="text-muted-foreground">+{sorted.length - 20} more</li>
        )}
      </ul>
    </div>
  );
}

function AssignmentIssuesTable({ issues }: { issues: AssignmentIssue[] }) {
  return (
    <div className="rounded-lg border">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="sticky top-0 bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr><th className="px-3 py-2">Client</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Details</th></tr>
        </thead>
        <tbody>
          {issues.length === 0 && <tr><td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">No date gaps or overlaps detected.</td></tr>}
          {issues.map((i, idx) => (
            <tr key={`${i.clientKey}-${idx}`} className="border-t">
              <td className="px-3 py-2 font-medium">{i.clientName}</td>
              <td className="px-3 py-2"><Badge variant="outline">{i.type}</Badge></td>
              <td className="px-3 py-2 text-muted-foreground">{i.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UnassignedManagerTable({ rows, onCreate, onExport }: { rows: UnassignedAuditRow[]; onCreate: (row: UnassignedAuditRow) => void; onExport: () => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-end"><Button variant="outline" size="sm" onClick={onExport} disabled={!rows.length}><Download className="mr-1.5 h-3.5 w-3.5" /> Export unassigned</Button></div>
      <div className="rounded-lg border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="sticky top-0 bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-3 py-2">Client</th><th className="px-3 py-2">Client ID</th><th className="px-3 py-2">DOS</th><th className="px-3 py-2">Code</th><th className="px-3 py-2">Provider</th><th className="px-3 py-2 text-right">Hours</th><th className="px-3 py-2"></th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">No unassigned rows.</td></tr>}
            {rows.slice(0, 500).map((r, i) => (
              <tr key={`${r.clientId}-${r.date}-${i}`} className="border-t">
                <td className="px-3 py-2 font-medium">{r.clientName}</td><td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.clientId || "—"}</td>
                <td className="px-3 py-2">{r.date}</td><td className="px-3 py-2">{r.code}</td><td className="px-3 py-2">{r.renderingProvider || "—"}</td><td className="px-3 py-2 text-right tabular-nums">{fmt1(r.hours)}</td>
                <td className="px-3 py-2 text-right"><Button variant="outline" size="sm" onClick={() => onCreate(r)}><UserPlus className="mr-1.5 h-3.5 w-3.5" /> Create assignment</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssignmentHistoryEditor({
  assignments, knownClients, knownClientsWithId, onChange, editing, setEditing,
}: {
  assignments: BcbaAssignmentV3[];
  knownClients: string[];
  knownClientsWithId: Map<string, string>;
  onChange: () => void | Promise<void>;
  editing: BcbaAssignmentV3 | null;
  setEditing: (a: BcbaAssignmentV3 | null) => void;
}) {
  const [draft, setDraft] = useState<Omit<BcbaAssignmentV3, "id" | "createdAt">>({
    clientId: "", clientName: "", bcbaName: "",
    startDate: new Date().toISOString().slice(0, 10), endDate: null,
  });

  useEffect(() => {
    if (editing) {
      setDraft({
        clientId: editing.clientId, clientName: editing.clientName, bcbaName: editing.bcbaName,
        startDate: editing.startDate, endDate: editing.endDate, note: editing.note,
      });
    }
  }, [editing]);

  function reset() {
    setEditing(null);
    setDraft({ clientId: "", clientName: "", bcbaName: "",
      startDate: new Date().toISOString().slice(0, 10), endDate: null });
  }

  async function submit() {
    if (!draft.clientName || !draft.bcbaName || !draft.startDate) {
      toast.error("Client, BCBA and Start Date are required"); return;
    }
    // Auto-fill clientId from billing if known
    const inferredId = draft.clientId || knownClientsWithId.get(draft.clientName) || "";
    if (editing && editing.id !== "__new__") {
      await updateAssignmentV3(editing.id, { ...draft, clientId: inferredId });
      toast.success("Assignment updated");
    } else {
      // Auto-close prior open assignment for same client with a different BCBA
      const nm = normalizeName(draft.clientName);
      const prior = readAssignmentsV3().filter(a =>
        ((inferredId && a.clientId === inferredId) || normalizeName(a.clientName) === nm) &&
        !a.endDate && a.bcbaName !== draft.bcbaName,
      );
      for (const p of prior) {
        const end = new Date(draft.startDate); end.setDate(end.getDate() - 1);
        await updateAssignmentV3(p.id, { endDate: end.toISOString().slice(0, 10) });
      }
      await addAssignmentV3({ ...draft, clientId: inferredId });
      toast.success("Assignment added");
    }
    await onChange();
    reset();
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 rounded-lg border bg-card/60 p-3 sm:grid-cols-2">
        <div>
          <label className="text-[10px] font-semibold uppercase text-muted-foreground">Client Name</label>
          <Input list="known-clients-v3" value={draft.clientName}
                 onChange={e => setDraft(s => ({ ...s, clientName: e.target.value }))} className="h-8" />
          <datalist id="known-clients-v3">
            {knownClients.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase text-muted-foreground">Client ID (optional)</label>
          <Input value={draft.clientId}
                 onChange={e => setDraft(s => ({ ...s, clientId: e.target.value }))} className="h-8" />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase text-muted-foreground">BCBA</label>
          <Input value={draft.bcbaName}
                 onChange={e => setDraft(s => ({ ...s, bcbaName: e.target.value }))} className="h-8" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold uppercase text-muted-foreground">Start Date</label>
            <Input type="date" value={draft.startDate}
                   onChange={e => setDraft(s => ({ ...s, startDate: e.target.value }))} className="h-8" />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase text-muted-foreground">End Date</label>
            <Input type="date" value={draft.endDate ?? ""}
                   onChange={e => setDraft(s => ({ ...s, endDate: e.target.value || null }))} className="h-8" />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] font-semibold uppercase text-muted-foreground">Note</label>
          <Input value={draft.note ?? ""}
                 onChange={e => setDraft(s => ({ ...s, note: e.target.value }))} className="h-8" />
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2">
          {editing && <Button variant="ghost" size="sm" onClick={reset}><X className="mr-1.5 h-3.5 w-3.5" />Cancel</Button>}
          <Button size="sm" onClick={submit}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />{editing ? "Update" : "Add Assignment"}
          </Button>
        </div>
      </div>

      <div className="max-h-[40vh] overflow-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">BCBA</th>
              <th className="px-3 py-2">Start</th>
              <th className="px-3 py-2">End</th>
              <th className="w-20 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">
                No assignments yet. Add one above, or import a CSV.
              </td></tr>
            )}
            {assignments.map(a => (
              <tr key={a.id} className="border-t">
                <td className="px-3 py-2">{a.clientName}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{a.clientId || "—"}</td>
                <td className="px-3 py-2">{a.bcbaName}</td>
                <td className="px-3 py-2">{a.startDate}</td>
                <td className="px-3 py-2">{a.endDate || <Badge variant="outline">Open</Badge>}</td>
                <td className="px-3 py-2 text-right">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(a)} title="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={async () => { if (confirm("Delete assignment?")) { await deleteAssignmentV3(a.id); await onChange(); toast.success("Assignment deleted"); } }}
                          title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function InferredAssignmentsTable({
  assignments, onSave, usingInferred,
}: { assignments: BcbaAssignmentV3[]; onSave: () => void; usingInferred: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="text-xs text-muted-foreground">
          {assignments.length === 0
            ? "Upload a billing report to see inferred BCBA ownership."
            : usingInferred
              ? "These are being used right now because no saved Assignment History exists. Save them to make them editable."
              : "Saved Assignment History is in use. These inferred records are shown for comparison only."}
        </div>
        <Button size="sm" onClick={onSave} disabled={!assignments.length}>
          <Save className="mr-1.5 h-3.5 w-3.5" /> Save inferred ({assignments.length})
        </Button>
      </div>
      <div className="rounded-lg border">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="sticky top-0 bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">Client ID</th>
              <th className="px-3 py-2">BCBA</th>
              <th className="px-3 py-2">Start</th>
              <th className="px-3 py-2">End</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No inferred assignments.</td></tr>
            )}
            {assignments.slice(0, 500).map(a => (
              <tr key={a.id} className="border-t">
                <td className="px-3 py-2 font-medium">{a.clientName}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{a.clientId || "—"}</td>
                <td className="px-3 py-2">{a.bcbaName}</td>
                <td className="px-3 py-2 tabular-nums">{a.startDate}</td>
                <td className="px-3 py-2 tabular-nums">{a.endDate ?? "—"}</td>
              </tr>
            ))}
            {assignments.length > 500 && (
              <tr><td colSpan={5} className="px-3 py-2 text-center text-xs text-muted-foreground">+{assignments.length - 500} more — save to view & edit all.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OwnershipConflictsTable({ conflicts }: { conflicts: OwnershipConflict[] }) {
  return (
    <div className="rounded-lg border">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="sticky top-0 bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Client</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Candidates</th>
            <th className="px-3 py-2">Chosen</th>
          </tr>
        </thead>
        <tbody>
          {conflicts.length === 0 && (
            <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No ownership conflicts detected.</td></tr>
          )}
          {conflicts.slice(0, 500).map((c, i) => (
            <tr key={`${c.clientId || c.clientName}-${c.date}-${i}`} className="border-t">
              <td className="px-3 py-2 font-medium">{c.clientName}</td>
              <td className="px-3 py-2 tabular-nums">{c.date}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                {c.candidates.map(x => `${x.bcba} (${x.hours.toFixed(2)}h)`).join(" · ")}
              </td>
              <td className="px-3 py-2">{c.chosen}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- new tab subcomponents ---------- */
type BcbaTableRow = {
  bcba: string; isUnassigned: boolean; totalHours: number; h97153: number; directHours: number;
  supervisionHours: number; clients: Map<string, number>; rbts: Map<string, number>;
  codes: Map<string, number>; rows: OwnedRow[];
};

const CHART_TICK = { fontSize: 11 };

function OverviewCharts({ bcbaTable }: { bcbaTable: BcbaTableRow[] }) {
  const real = bcbaTable.filter(b => !b.isUnassigned);
  const byHours = [...real].sort((a, b) => b.totalHours - a.totalHours).slice(0, 12);
  const top10 = [...real].sort((a, b) => b.totalHours - a.totalHours).slice(0, 10)
    .map(b => ({ name: b.bcba, hours: +b.totalHours.toFixed(1) }));
  const stacked = byHours.map(b => ({
    name: b.bcba,
    "97153": +b.h97153.toFixed(1),
    "Direct": +Math.max(0, b.directHours - b.supervisionHours).toFixed(1),
    "Supervision": +b.supervisionHours.toFixed(1),
  }));
  const supPct = real.map(b => ({
    name: b.bcba,
    pct: supervisionPctValue(b.supervisionHours, b.h97153) ?? 0,
    has: supervisionPctValue(b.supervisionHours, b.h97153) !== null,
  })).filter(x => x.has).sort((a, b) => b.pct - a.pct).slice(0, 20);
  const tooltipFmt = (v: any) => typeof v === "number" ? v.toLocaleString(undefined, { maximumFractionDigits: 1 }) : v;

  if (!real.length) {
    return <div className="rounded-xl border bg-card/40 p-10 text-center text-sm text-muted-foreground">Upload a billing report to see charts.</div>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartShell title="Hours by BCBA">
        <BarChart data={byHours.map(b => ({ name: b.bcba, hours: +b.totalHours.toFixed(1) }))}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" tick={CHART_TICK} interval={0} angle={-30} textAnchor="end" height={70} />
          <YAxis tick={CHART_TICK} tickFormatter={(v) => v.toLocaleString()} />
          <Tooltip formatter={tooltipFmt} />
          <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartShell>
      <ChartShell title="97153 vs Direct vs Supervision">
        <BarChart data={stacked}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" tick={CHART_TICK} interval={0} angle={-30} textAnchor="end" height={70} />
          <YAxis tick={CHART_TICK} tickFormatter={(v) => v.toLocaleString()} />
          <Tooltip formatter={tooltipFmt} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="97153" stackId="a" fill="hsl(var(--primary))" />
          <Bar dataKey="Direct" stackId="a" fill="hsl(var(--muted-foreground))" />
          <Bar dataKey="Supervision" stackId="a" fill="#10b981" />
        </BarChart>
      </ChartShell>
      <ChartShell title="Top 10 BCBAs by total hours">
        <BarChart data={top10} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis type="number" tick={CHART_TICK} tickFormatter={(v) => v.toLocaleString()} />
          <YAxis type="category" dataKey="name" tick={CHART_TICK} width={120} />
          <Tooltip formatter={tooltipFmt} />
          <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartShell>
      <ChartShell title="Supervision % by BCBA">
        <BarChart data={supPct}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" tick={CHART_TICK} interval={0} angle={-30} textAnchor="end" height={70} />
          <YAxis tick={CHART_TICK} tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(v: any) => `${Number(v).toFixed(1)}%`} />
          <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
            {supPct.map((d, i) => {
              const tone = supervisionTone(d.pct);
              const color = tone === "danger" ? "hsl(var(--destructive))"
                : tone === "warn" ? "#eab308" : "#10b981";
              return <Cell key={i} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ChartShell>
    </div>
  );
}

function ChartShell({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="rounded-xl border bg-card/60 p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

type SortKey = "bcba" | "totalHours" | "h97153" | "directHours" | "supervisionHours" | "supervisionPct" | "clients" | "rbts";

function BcbaSummaryTable({ bcbaTable, expanded, setExpanded }: {
  bcbaTable: BcbaTableRow[];
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "totalHours", dir: "desc" });
  const sorted = useMemo(() => {
    const arr = [...bcbaTable];
    arr.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      if (av === bv) return 0;
      if (typeof av === "string") return av.localeCompare(String(bv)) * dir;
      return ((av as number) - (bv as number)) * dir;
    });
    return arr;
  }, [bcbaTable, sort]);

  const SortHeader = ({ k, label, align = "right" }: { k: SortKey; label: string; align?: "left" | "right" }) => (
    <th className={cn("px-3 py-2 cursor-pointer select-none", align === "right" ? "text-right" : "text-left")}
        onClick={() => setSort(s => s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "desc" })}>
      {label}{sort.key === k ? (sort.dir === "asc" ? " ▲" : " ▼") : ""}
    </th>
  );

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="w-8 px-3 py-2"></th>
              <SortHeader k="bcba" label="BCBA" align="left" />
              <SortHeader k="totalHours" label="Total Hours" />
              <SortHeader k="h97153" label="97153 Hours" />
              <SortHeader k="directHours" label="Direct Hours" />
              <SortHeader k="supervisionHours" label="Supervision Hours" />
              <SortHeader k="supervisionPct" label="Supervision %" />
              <SortHeader k="clients" label="Clients" />
              <SortHeader k="rbts" label="RBTs" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-sm text-muted-foreground">
                No productivity rows yet. The report runs on the shared admin dataset.
              </td></tr>
            )}
            {sorted.map(b => {
              const open = !!expanded[b.bcba];
              return (
                <Row key={b.bcba} expanded={open} onToggle={() => setExpanded(s => ({ ...s, [b.bcba]: !open }))} bcba={b} />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function sortValue(b: BcbaTableRow, k: SortKey): string | number {
  switch (k) {
    case "bcba": return b.bcba.toLowerCase();
    case "totalHours": return b.totalHours;
    case "h97153": return b.h97153;
    case "directHours": return b.directHours;
    case "supervisionHours": return b.supervisionHours;
    case "supervisionPct": return supervisionPctValue(b.supervisionHours, b.h97153) ?? -1;
    case "clients": return b.clients.size;
    case "rbts": return b.rbts.size;
  }
}

function SupervisionTab({ bcbaTable }: { bcbaTable: BcbaTableRow[] }) {
  const rows = bcbaTable.filter(b => !b.isUnassigned);
  const withPct = rows.map(b => ({
    ...b, pct: supervisionPctValue(b.supervisionHours, b.h97153),
  }));
  const lowest = [...withPct].filter(r => r.pct !== null).sort((a, b) => (a.pct! - b.pct!)).slice(0, 10);
  const highHoursLowSup = [...withPct].filter(r => r.pct !== null && r.pct < 10)
    .sort((a, b) => b.h97153 - a.h97153).slice(0, 10);
  const byPct = [...withPct].filter(r => r.pct !== null).sort((a, b) => b.pct! - a.pct!);

  const tooltipPct = (v: any) => `${Number(v).toFixed(1)}%`;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartShell title="Supervision % by BCBA">
          <BarChart data={byPct.map(r => ({ name: r.bcba, pct: +(r.pct ?? 0).toFixed(1) }))}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={CHART_TICK} interval={0} angle={-30} textAnchor="end" height={70} />
            <YAxis tick={CHART_TICK} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={tooltipPct} />
            <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
              {byPct.map((d, i) => {
                const tone = supervisionTone(d.pct);
                const color = tone === "danger" ? "hsl(var(--destructive))"
                  : tone === "warn" ? "#eab308" : "#10b981";
                return <Cell key={i} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ChartShell>
        <ChartShell title="Lowest supervision % BCBAs">
          <BarChart data={lowest.map(r => ({ name: r.bcba, pct: +(r.pct ?? 0).toFixed(1) }))} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis type="number" tick={CHART_TICK} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" tick={CHART_TICK} width={120} />
            <Tooltip formatter={tooltipPct} />
            <Bar dataKey="pct" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartShell>
        <ChartShell title="High 97153 hours with low supervision %">
          <BarChart data={highHoursLowSup.map(r => ({ name: r.bcba, hours: +r.h97153.toFixed(1), pct: +(r.pct ?? 0).toFixed(1) }))}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={CHART_TICK} interval={0} angle={-30} textAnchor="end" height={70} />
            <YAxis tick={CHART_TICK} tickFormatter={(v) => v.toLocaleString()} />
            <Tooltip formatter={(v: any, n: any) => n === "pct" ? `${Number(v).toFixed(1)}%` : Number(v).toLocaleString(undefined, { maximumFractionDigits: 1 })} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="hours" name="97153 Hours" fill="hsl(var(--primary))" />
          </BarChart>
        </ChartShell>
        <SupervisionLegend />
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">BCBA</th>
              <th className="px-3 py-2 text-right">97153 Hours</th>
              <th className="px-3 py-2 text-right">Supervision Hours</th>
              <th className="px-3 py-2 text-right">Supervision %</th>
              <th className="px-3 py-2 text-right">Clients</th>
              <th className="px-3 py-2 text-right">RBTs</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No data.</td></tr>
            )}
            {[...withPct].sort((a, b) => (a.pct ?? 999) - (b.pct ?? 999)).map(r => {
              const tone = supervisionTone(r.pct);
              return (
                <tr key={r.bcba} className="border-t">
                  <td className="px-3 py-2 font-medium">{r.bcba}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt1(r.h97153)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt1(r.supervisionHours)}</td>
                  <td className={cn("px-3 py-2 text-right tabular-nums font-medium",
                    tone === "danger" && "text-destructive",
                    tone === "warn" && "text-warning-foreground",
                    tone === "ok" && "text-emerald-600 dark:text-emerald-400",
                  )}>
                    {r.pct === null ? "—" : `${r.pct.toFixed(1)}%`}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt0(r.clients.size)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt0(r.rbts.size)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SupervisionLegend() {
  return (
    <div className="rounded-xl border bg-card/60 p-4 text-sm">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supervision % thresholds</div>
      <ul className="space-y-2">
        <li className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-sm bg-destructive" /> Under 5% — urgent</li>
        <li className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#eab308" }} /> 5%–10% — monitor</li>
        <li className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#10b981" }} /> 10% or higher — healthy</li>
      </ul>
      <div className="mt-3 text-xs text-muted-foreground">
        Supervision % = 97155 hours ÷ 97153 hours × 100. Shown as “—” when a BCBA has no 97153 hours to supervise.
      </div>
    </div>
  );
}

function ClientsRbtsTab({ filtered, bcbaTable }: { filtered: OwnedRow[]; bcbaTable: BcbaTableRow[] }) {
  const real = bcbaTable.filter(b => !b.isUnassigned);

  const clientByCode = useMemo(() => {
    const m = new Map<string, { client: string; codes: Map<string, number>; total: number }>();
    for (const r of filtered) {
      const key = r.clientName;
      const v = m.get(key) || { client: key, codes: new Map<string, number>(), total: 0 };
      v.codes.set(r.code, (v.codes.get(r.code) || 0) + r.hours);
      v.total += r.hours;
      m.set(key, v);
    }
    return [...m.values()].sort((a, b) => b.total - a.total).slice(0, 100);
  }, [filtered]);

  const rbtHours = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      if (r.is97153 && r.renderingProvider) {
        m.set(r.renderingProvider, (m.get(r.renderingProvider) || 0) + r.hours);
      }
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="BCBA → Clients">
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-3 py-2">BCBA</th><th className="px-3 py-2">Clients</th><th className="px-3 py-2 text-right">Hours</th></tr>
            </thead>
            <tbody>
              {real.map(b => (
                <tr key={b.bcba} className="border-t align-top">
                  <td className="px-3 py-2 font-medium">{b.bcba}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {[...b.clients.keys()].slice(0, 12).join(", ")}{b.clients.size > 12 ? ` +${b.clients.size - 12} more` : ""}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt1(b.totalHours)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="BCBA → RBTs">
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-3 py-2">BCBA</th><th className="px-3 py-2">RBTs</th><th className="px-3 py-2 text-right">97153 Hours</th></tr>
            </thead>
            <tbody>
              {real.map(b => (
                <tr key={b.bcba} className="border-t align-top">
                  <td className="px-3 py-2 font-medium">{b.bcba}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {[...b.rbts.keys()].slice(0, 12).join(", ")}{b.rbts.size > 12 ? ` +${b.rbts.size - 12} more` : ""}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt1(b.h97153)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Client → Hours by Code">
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-3 py-2">Client</th><th className="px-3 py-2">Codes</th><th className="px-3 py-2 text-right">Total</th></tr>
            </thead>
            <tbody>
              {clientByCode.map(c => (
                <tr key={c.client} className="border-t align-top">
                  <td className="px-3 py-2 font-medium">{c.client}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {[...c.codes.entries()].sort((a, b) => b[1] - a[1])
                      .map(([k, v]) => `${k}: ${fmt1(v)}`).join(" · ")}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt1(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="RBT → 97153 Hours">
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-3 py-2">RBT</th><th className="px-3 py-2 text-right">97153 Hours</th></tr>
            </thead>
            <tbody>
              {rbtHours.length === 0 && (
                <tr><td colSpan={2} className="px-3 py-6 text-center text-muted-foreground">No 97153 rows.</td></tr>
              )}
              {rbtHours.map(([name, hours]) => (
                <tr key={name} className="border-t">
                  <td className="px-3 py-2 font-medium">{name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt1(hours)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card/60">
      <div className="border-b bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}
