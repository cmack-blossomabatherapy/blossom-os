import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Upload, FileSpreadsheet, Download, Search, ChevronRight, ChevronDown,
  Stethoscope, Plus, Trash2, Save, History, ArrowLeftRight, X, Pencil, Database, AlertTriangle,
  UserPlus, RefreshCw, HelpCircle,
} from "lucide-react";
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
const fmt1 = (n: number) => (isFinite(n) ? n.toFixed(1) : "—");
const fmt0 = (n: number) => (isFinite(n) ? Math.round(n).toLocaleString() : "—");
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
      // Restore the last uploaded billing report so leaving/returning to the
      // tab does not discard work. Data is only cleared on explicit Reset.
      const last = await loadLastBillingV3();
      if (last?.rows?.length) {
        setRows(last.rows as BillingRow[]);
        if (last.fileName) setFileName(last.fileName);
      }
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
      const stateH = findH(h, ["ClientLocationStateProvince", "ServiceLocationStateProvince", "State"]);
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
          state: (stateH ? r[stateH] : "").trim(),
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

      toast.success(`Parsed ${parsedRows.length.toLocaleString()} of ${first.rows.length.toLocaleString()} rows from ${file.name}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to parse file");
    } finally {
      setLoading(false);
    }
  }

  /* ----- ownership-resolved rows ----- */
  /* If no permanent Assignment History exists yet, infer one from the uploaded
   * Billing Report so productivity is never left fully unassigned. */
  const inferred = useMemo(() => inferAssignmentHistory(rows), [rows]);
  const usingInferred = rows.length > 0 && assignments.length === 0 && inferred.assignments.length > 0;
  const effectiveAssignments = usingInferred ? inferred.assignments : assignments;

  const ownedRows: OwnedRow[] = useMemo(() => {
    return rows.map(r => {
      const owner = ownerForClientAtDateV3(effectiveAssignments, r.clientId, r.clientName, r.date);
      return { ...r, bcbaOwner: owner?.bcba ?? null, assignmentId: owner?.assignmentId ?? null, is97153: isRbt97153(r.code) };
    });
  }, [rows, effectiveAssignments]);

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
    const s = new Set<string>(); for (const r of ownedRows) if (r.state) s.add(r.state); return [...s].sort();
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
      if (stateF !== "all" && r.state !== stateF) return false;
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
    let totalHours = 0, h97153 = 0, directHours = 0, unassigned = 0;
    const clients = new Set<string>(), rbts = new Set<string>(), bcbas = new Set<string>();
    for (const r of filtered) {
      totalHours += r.hours;
      if (r.is97153) h97153 += r.hours; else directHours += r.hours;
      clients.add(r.clientId || normalizeName(r.clientName));
      if (r.is97153 && r.renderingProvider) rbts.add(r.renderingProvider);
      if (r.bcbaOwner) bcbas.add(r.bcbaOwner); else unassigned += r.hours;
    }
    return { totalHours, h97153, directHours, unassigned,
      clients: clients.size, rbts: rbts.size, bcbas: bcbas.size };
  }, [filtered]);

  /* ----- BCBA table ----- */
  interface BcbaRow {
    bcba: string;
    isUnassigned: boolean;
    totalHours: number;
    h97153: number;
    directHours: number;
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
        v = { bcba: b, isUnassigned: isU, totalHours: 0, h97153: 0, directHours: 0,
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
    await saveReportV3({ name, fileName, rows });
    setSavedList(readSavedReportsV3());
    toast.success("Report saved");
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
      ["BCBA", "Total Hours", "97153 Hours", "Direct Hours", "Client Count", "RBT Count"],
      bcbaTable.map(b => [b.bcba, b.totalHours.toFixed(2), b.h97153.toFixed(2), b.directHours.toFixed(2), b.clients.size, b.rbts.size])
    );
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
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="mr-2 h-4 w-4" /> Assignment History ({assignments.length})
            </Button>
            <Button variant="outline" size="sm" onClick={exportBcbaCsv} disabled={!bcbaTable.length}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetUpload} disabled={!rows.length && !fileName && !validation}>
              <RefreshCw className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button size="sm" onClick={handleSaveReport} disabled={!rows.length}>
              <Save className="mr-2 h-4 w-4" /> Save Report
            </Button>
          </div>
        </div>

        {/* Upload zone */}
        <div
          className={cn(
            "rounded-2xl border-2 border-dashed p-6 transition",
            dragOver ? "border-primary bg-primary/5" : "border-border bg-card/40",
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        >
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
            <div className="rounded-xl bg-primary/10 p-3 text-primary"><Upload className="h-6 w-6" /></div>
            <div className="flex-1">
              <div className="font-medium">
                {fileName ? `Loaded: ${fileName}` : "Upload a single Billing Report (CSV or XLSX)"}
              </div>
              <div className="text-xs text-muted-foreground">
                {rows.length > 0
                  ? `${rows.length.toLocaleString()} rows accepted · ${
                      assignments.length
                        ? "ownership resolved via saved Assignment History"
                        : usingInferred
                          ? `ownership inferred from this billing report (${inferred.assignments.length} assignments, ${inferred.uniqueBcbas} BCBAs)`
                          : "Assignment History setup required"
                    }`
                  : "Drag a file here, or click choose."}
              </div>
              {missingCols.length > 0 && (
                <div className="mt-2 text-xs text-destructive">Missing columns: {missingCols.join(", ")}</div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                ref={inputRef} type="file" hidden accept={SUPPORTED_EXTENSIONS}
                onChange={(e) => handleFiles(e.target.files)}
              />
              <Button size="sm" onClick={() => inputRef.current?.click()} disabled={loading}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> {loading ? "Parsing…" : "Choose file"}
              </Button>
            </div>
          </div>
        </div>

        {/* Upload validation panel */}
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

        {/* Saved reports */}
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

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
          <KpiCard label="Total Hours" value={fmt1(kpis.totalHours)} />
          <KpiCard label="97153 Hours" value={fmt1(kpis.h97153)} />
          <KpiCard label="Direct BCBA Hours" value={fmt1(kpis.directHours)} />
          <KpiCard label="Active Clients" value={fmt0(kpis.clients)} />
          <KpiCard label="Active RBTs" value={fmt0(kpis.rbts)} />
          <KpiCard label="Active BCBAs" value={fmt0(kpis.bcbas)} />
          <KpiCard label="Unassigned Hours" value={fmt1(kpis.unassigned)} tone={kpis.unassigned > 0 ? "warn" : undefined} />
          <KpiCard label="Dropped Rows" value={fmt0(validation?.droppedRowCount ?? 0)} tone={(validation?.droppedRowCount ?? 0) > 0 ? "warn" : undefined} />
        </div>
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
        {kpis.unassigned > 0 && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
            <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />
            {fmt1(kpis.unassigned)} hrs have no Assignment History match. Open <button className="underline" onClick={() => setShowHistory(true)}>Assignment History</button> to add ownership entries.
            {unassignedAudit.length > 0 && <button className="ml-2 underline" onClick={exportUnassignedCsv}>Export unassigned audit</button>}
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

        {/* Main BCBA table */}
        <div className="overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="w-8 px-3 py-2"></th>
                  <th className="px-3 py-2">BCBA</th>
                  <th className="px-3 py-2 text-right">Total Hours</th>
                  <th className="px-3 py-2 text-right">97153 Hours</th>
                  <th className="px-3 py-2 text-right">Direct Hours</th>
                  <th className="px-3 py-2 text-right">Clients</th>
                  <th className="px-3 py-2 text-right">RBTs</th>
                </tr>
              </thead>
              <tbody>
                {bcbaTable.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    Upload a billing report to populate productivity.
                  </td></tr>
                )}
                {bcbaTable.map(b => {
                  const open = !!expanded[b.bcba];
                  return (
                    <Row key={b.bcba} expanded={open} onToggle={() => setExpanded(s => ({ ...s, [b.bcba]: !open }))} bcba={b} />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unassigned audit */}
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

        {/* Transfer audit */}
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
          clients: Map<string, number>; rbts: Map<string, number>; codes: Map<string, number>; rows: OwnedRow[]; };
  expanded: boolean; onToggle: () => void;
}) {
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
        <td className="px-3 py-2 text-right tabular-nums">{fmt0(bcba.clients.size)}</td>
        <td className="px-3 py-2 text-right tabular-nums">{fmt0(bcba.rbts.size)}</td>
      </tr>
      {expanded && (
        <tr className="bg-muted/10">
          <td></td>
          <td colSpan={6} className="px-3 py-3">
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
