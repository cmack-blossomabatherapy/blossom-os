import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Upload, FileSpreadsheet, Download, Search, ChevronRight, ChevronDown,
  Stethoscope, Plus, Trash2, Save, History, ArrowLeftRight, X, Pencil, Database, AlertTriangle,
  UserPlus, RefreshCw,
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
  getSavedReportRowsV3, deleteSavedReportV3, saveLastBillingV3, loadLastBillingV3,
  findDuplicateSavedV3, normalizeName, bulkInsertAssignmentsV3,
  type BcbaAssignmentV3,
} from "@/lib/os/bcbaProductivityV3/store";

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
      const last = await loadLastBillingV3();
      if (last) { setRows(last.rows); setFileName(last.fileName); }
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
      await saveLastBillingV3(file.name, parsedRows);

      toast.success(`Parsed ${parsedRows.length.toLocaleString()} of ${first.rows.length.toLocaleString()} rows from ${file.name}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to parse file");
    } finally {
      setLoading(false);
    }
  }

  /* ----- ownership-resolved rows ----- */
  const ownedRows: OwnedRow[] = useMemo(() => {
    return rows.map(r => {
      const owner = ownerForClientAtDateV3(assignments, r.clientId, r.clientName, r.date);
      return { ...r, bcbaOwner: owner?.bcba ?? null, assignmentId: owner?.assignmentId ?? null, is97153: isRbt97153(r.code) };
    });
  }, [rows, assignments]);

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
      if (r.renderingProvider) rbts.add(r.renderingProvider);
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
      if (r.renderingProvider) row.rbts.set(r.renderingProvider, (row.rbts.get(r.renderingProvider) || 0) + r.hours);
      row.codes.set(r.code, (row.codes.get(r.code) || 0) + r.hours);
      row.rows.push(r);
    }
    return [...map.values()].sort((a, b) => b.totalHours - a.totalHours);
  }, [filtered]);

  const transfers = useMemo(() => deriveTransfersV3(assignments), [assignments]);

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
      if (!nameH || !bcbaH || !startH) {
        toast.error("Missing required columns: ClientName, BCBA, StartDate");
        return;
      }
      const existing = readAssignmentsV3();
      let added = 0;
      for (const r of first.rows) {
        const cn = (nameH ? r[nameH] : "").trim();
        const bn = (bcbaH ? r[bcbaH] : "").trim();
        const sd = isoDate((startH ? r[startH] : "").trim());
        if (!cn || !bn || !sd) continue;
        const ed = endH ? isoDate(String(r[endH]).trim()) : "";
        existing.unshift({
          id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${added}`,
          clientId: (idH ? r[idH] : "").trim(),
          clientName: cn,
          bcbaName: bn,
          startDate: sd,
          endDate: ed || null,
          note: noteH ? String(r[noteH] || "") : "",
          createdAt: Date.now(),
        });
        added++;
      }
      bulkReplaceAssignmentsV3(existing);
      setAssignments(readAssignmentsV3());
      toast.success(`Imported ${added} assignments`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to import assignments");
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
                  ? `${rows.length.toLocaleString()} rows accepted · ownership resolved via Assignment History`
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
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
              <ValPill label="Raw rows" value={fmt0(validation.rawRowCount)} />
              <ValPill label="Accepted" value={fmt0(validation.acceptedRowCount)} />
              <ValPill label="Dropped" value={fmt0(validation.droppedRowCount)} tone={validation.droppedRowCount ? "warn" : undefined} />
              <ValPill label="Total hours" value={fmt1(validation.totalHours)} />
              <ValPill label="Date range" value={validation.dateMin && validation.dateMax ? `${validation.dateMin} → ${validation.dateMax}` : "—"} />
              <ValPill label="Unique clients" value={fmt0(validation.uniqueClients)} />
              <ValPill label="Unique providers" value={fmt0(validation.uniqueProviders)} />
            </div>
            {Object.keys(validation.dropReasons).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {Object.entries(validation.dropReasons).map(([k, v]) => (
                  <Badge key={k} variant="outline" className="font-normal">
                    <AlertTriangle className="mr-1 h-3 w-3 text-amber-600" />
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
        {kpis.unassigned > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />
            {fmt1(kpis.unassigned)} hrs have no Assignment History match. Open <button className="underline" onClick={() => setShowHistory(true)}>Assignment History</button> to add ownership entries.
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>BCBA Assignment History</DialogTitle>
          </DialogHeader>
          <div className="mb-2 flex flex-wrap justify-end gap-2">
            <input ref={assignImportRef} type="file" hidden accept={SUPPORTED_EXTENSIONS}
              onChange={e => e.target.files?.[0] && importAssignmentsCsv(e.target.files[0])} />
            <Button variant="outline" size="sm" onClick={() => assignImportRef.current?.click()}>
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Import CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportAssignmentsCsv} disabled={!assignments.length}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
          <AssignmentHistoryEditor
            assignments={assignments}
            knownClients={clientOptions}
            knownClientsWithId={useMemo(() => {
              const m = new Map<string, string>();
              for (const r of ownedRows) if (!m.has(r.clientName)) m.set(r.clientName, r.clientId);
              return m;
            }, [ownedRows])}
            onChange={() => setAssignments(readAssignmentsV3())}
            editing={editing}
            setEditing={setEditing}
          />
        </DialogContent>
      </Dialog>
    </OSShell>
  );
}

/* ---------- subcomponents ---------- */
function KpiCard({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className={cn("rounded-xl border p-3",
      tone === "warn" ? "border-amber-300 bg-amber-50" : "bg-card/60")}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
function ValPill({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className={cn("rounded-lg border bg-background px-3 py-2",
      tone === "warn" && "border-amber-300 bg-amber-50")}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">{value}</div>
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
          clients: Map<string, number>; rbts: Map<string, number>; codes: Map<string, number>; };
  expanded: boolean; onToggle: () => void;
}) {
  return (
    <>
      <tr className={cn("border-t hover:bg-muted/30", bcba.isUnassigned && "bg-amber-50/60")}>
        <td className="px-3 py-2">
          <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </td>
        <td className="px-3 py-2 font-medium">
          {bcba.bcba}
          {bcba.isUnassigned && <Badge variant="outline" className="ml-2 border-amber-400 text-amber-700">No assignment history</Badge>}
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
          </td>
        </tr>
      )}
    </>
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

function AssignmentHistoryEditor({
  assignments, knownClients, knownClientsWithId, onChange, editing, setEditing,
}: {
  assignments: BcbaAssignmentV3[];
  knownClients: string[];
  knownClientsWithId: Map<string, string>;
  onChange: () => void;
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

  function submit() {
    if (!draft.clientName || !draft.bcbaName || !draft.startDate) {
      toast.error("Client, BCBA and Start Date are required"); return;
    }
    // Auto-fill clientId from billing if known
    const inferredId = draft.clientId || knownClientsWithId.get(draft.clientName) || "";
    if (editing) {
      updateAssignmentV3(editing.id, { ...draft, clientId: inferredId });
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
        updateAssignmentV3(p.id, { endDate: end.toISOString().slice(0, 10) });
      }
      addAssignmentV3({ ...draft, clientId: inferredId });
      toast.success("Assignment added");
    }
    onChange();
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
                          onClick={() => { if (confirm("Delete assignment?")) { deleteAssignmentV3(a.id); onChange(); } }}
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