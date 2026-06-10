import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Upload, FileSpreadsheet, Download, Search, ChevronRight, ChevronDown,
  Users, Stethoscope, Plus, Trash2, Save, History, ArrowLeftRight, X, Pencil, Database,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseAnyFile, SUPPORTED_EXTENSIONS } from "@/lib/os/dashboardEngine/excelParser";
import {
  readAssignments, addAssignment, updateAssignment, deleteAssignment,
  ownerForClientAtDate, deriveTransfers, readSavedReports, saveReportV2,
  getSavedReportRows, deleteSavedReportV2, saveLastBilling, loadLastBilling,
  findDuplicateSaved, seedAssignmentsIfEmpty,
  type BcbaAssignment,
} from "@/lib/os/bcbaProductivityV2/store";

/* ----- helpers ----- */
const normH = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");
function findH(headers: string[], cands: string[]) {
  const m = new Map(headers.map(h => [normH(h), h]));
  for (const c of cands) { const hit = m.get(normH(c)); if (hit) return hit; }
  return null;
}
const num = (v: any) => {
  if (v === undefined || v === null || v === "") return 0;
  const n = parseFloat(String(v).replace(/[$,%]/g, ""));
  return isFinite(n) ? n : 0;
};
const fmt1 = (n: number) => (isFinite(n) ? n.toFixed(1) : "—");
const fmt0 = (n: number) => (isFinite(n) ? Math.round(n).toLocaleString() : "—");
function isoDate(d: string) {
  if (!d) return "";
  const t = new Date(d).getTime();
  return isFinite(t) ? new Date(t).toISOString().slice(0, 10) : d.slice(0, 10);
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
  clientKey: string; // canonical key for ownership lookup
  rbt: string;
  renderingProvider: string;
  code: string;
  hours: number;
  date: string; // ISO
  state: string;
  payor: string;
}

interface OwnedRow extends BillingRow {
  bcbaOwner: string | null; // resolved BCBA at DOS
  isDirect: boolean;        // direct BCBA hours (not 97153)
}

/* ----- page ----- */
export default function BcbaProductivityReportV2() {
  const [params] = useSearchParams();
  const savedParam = params.get("saved");

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);

  const [assignments, setAssignments] = useState<BcbaAssignment[]>(() => readAssignments());
  const [savedList, setSavedList] = useState(() => readSavedReports());

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
  const [editing, setEditing] = useState<BcbaAssignment | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refreshAssign = () => setAssignments(readAssignments());
    const refreshSaved = () => setSavedList(readSavedReports());
    window.addEventListener("bcba-prod-v2-assignments-changed", refreshAssign);
    window.addEventListener("bcba-prod-v2-saved-changed", refreshSaved);
    return () => {
      window.removeEventListener("bcba-prod-v2-assignments-changed", refreshAssign);
      window.removeEventListener("bcba-prod-v2-saved-changed", refreshSaved);
    };
  }, []);

  // Load last session or a saved report on mount
  useEffect(() => {
    (async () => {
      if (savedParam) {
        const data = await getSavedReportRows(savedParam);
        if (data?.length) {
          setRows(data);
          const meta = readSavedReports().find(r => r.id === savedParam);
          if (meta) setFileName(meta.fileName);
          return;
        }
      }
      const last = await loadLastBilling();
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
      const cliFirstH = findH(h, ["ClientFirstName"]);
      const cliLastH = findH(h, ["ClientLastName"]);
      const clientNameH = findH(h, ["Client", "Client Name", "Patient", "Patient Name"]);
      const dosH = findH(h, ["DateOfService", "Date", "ServiceDate", "DOS"]);
      const codeH = findH(h, ["ProcedureCode", "Code", "CPT", "Service Code"]);
      const hoursH = findH(h, ["TimeWorkedInHours", "Hours", "BillableHours", "ServiceHours"]);
      const provFirstH = findH(h, ["ProviderFirstName"]);
      const provLastH = findH(h, ["ProviderLastName"]);
      const provNameH = findH(h, ["Provider", "Provider Name"]);
      const stateH = findH(h, ["ClientLocationStateProvince", "ServiceLocationStateProvince", "State"]);
      const payorH = findH(h, ["PayorName", "Payor", "Payer", "Insurance"]);

      // Validation
      const miss: string[] = [];
      if (!clientNameH && !(cliFirstH || cliLastH)) miss.push("Client name");
      if (!dosH) miss.push("DateOfService");
      if (!codeH) miss.push("ProcedureCode");
      if (!hoursH) miss.push("Hours");
      if (miss.length) {
        setValidationIssues(miss);
        toast.error(`Missing required columns: ${miss.join(", ")}`);
        setLoading(false);
        return;
      }
      setValidationIssues([]);

      const parsedRows: BillingRow[] = [];
      for (const r of first.rows) {
        const code = (codeH ? r[codeH] : "").trim();
        const hours = num(hoursH ? r[hoursH] : 0);
        if (!code || !hours) continue;
        const clientName = (clientNameH ? r[clientNameH] : "").trim() ||
          [cliFirstH ? r[cliFirstH] : "", cliLastH ? r[cliLastH] : ""].filter(Boolean).join(" ").trim();
        if (!clientName) continue;
        const clientId = (clientIdH ? r[clientIdH] : "").trim();
        const dos = isoDate((dosH ? r[dosH] : "").trim());
        if (!dos) continue;
        const renderingProvider = (provNameH ? r[provNameH] : "").trim() ||
          [provFirstH ? r[provFirstH] : "", provLastH ? r[provLastH] : ""].filter(Boolean).join(" ").trim();
        const isRbtCode = code.startsWith("97153") || code.startsWith("97154");
        parsedRows.push({
          clientId: clientId || clientName.toLowerCase(),
          clientName,
          clientKey: clientId || clientName.toLowerCase(),
          rbt: isRbtCode ? renderingProvider : "",
          renderingProvider,
          code,
          hours,
          date: dos,
          state: (stateH ? r[stateH] : "").trim(),
          payor: (payorH ? r[payorH] : "").trim(),
        });
      }

      // Duplicate prevention vs recent saved reports
      const dup = findDuplicateSaved(file.name, parsedRows.length);
      if (dup) {
        toast.warning(`Possible duplicate of "${dup.name}" saved ${new Date(dup.savedAt).toLocaleString()}`);
      }

      setRows(parsedRows);
      setFileName(file.name);
      await saveLastBilling(file.name, parsedRows);

      // Seed assignment history with a few clients to help demo
      const sample = Array.from(new Map(parsedRows.map(r => [r.clientKey, r])).values())
        .map(r => ({ clientId: r.clientId, clientName: r.clientName }));
      seedAssignmentsIfEmpty(sample);
      setAssignments(readAssignments());

      toast.success(`Parsed ${parsedRows.length.toLocaleString()} billing rows from ${file.name}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to parse file");
    } finally {
      setLoading(false);
    }
  }

  /* ----- ownership-resolved rows ----- */
  const ownedRows: OwnedRow[] = useMemo(() => {
    return rows.map(r => {
      const owner = ownerForClientAtDate(assignments, r.clientKey, r.date);
      const is97153 = r.code.startsWith("97153") || r.code.startsWith("97154");
      return { ...r, bcbaOwner: owner, isDirect: !is97153 };
    });
  }, [rows, assignments]);

  /* ----- options for filters ----- */
  const bcbaOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of ownedRows) if (r.bcbaOwner) s.add(r.bcbaOwner);
    return [...s].sort();
  }, [ownedRows]);
  const clientOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of ownedRows) s.add(r.clientName);
    return [...s].sort();
  }, [ownedRows]);
  const rbtOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of ownedRows) if (r.rbt) s.add(r.rbt);
    return [...s].sort();
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
      if (bcbaF !== "all" && r.bcbaOwner !== bcbaF) return false;
      if (clientF !== "all" && r.clientName !== clientF) return false;
      if (rbtF !== "all" && r.rbt !== rbtF) return false;
      if (stateF !== "all" && r.state !== stateF) return false;
      if (payorF !== "all" && r.payor !== payorF) return false;
      if (codeF !== "all" && r.code !== codeF) return false;
      if (q && !(r.clientName.toLowerCase().includes(q) ||
                 (r.bcbaOwner || "").toLowerCase().includes(q) ||
                 r.rbt.toLowerCase().includes(q) ||
                 r.code.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [ownedRows, dateFrom, dateTo, bcbaF, clientF, rbtF, stateF, payorF, codeF, search]);

  /* ----- KPIs ----- */
  const kpis = useMemo(() => {
    let totalHours = 0;
    let h97153 = 0;
    let directBcbaHours = 0;
    const clients = new Set<string>();
    const rbts = new Set<string>();
    const bcbas = new Set<string>();
    let unassigned = 0;
    for (const r of filtered) {
      totalHours += r.hours;
      if (r.code.startsWith("97153") || r.code.startsWith("97154")) h97153 += r.hours;
      else directBcbaHours += r.hours;
      clients.add(r.clientKey);
      if (r.rbt) rbts.add(r.rbt);
      if (r.bcbaOwner) bcbas.add(r.bcbaOwner);
      else unassigned += r.hours;
    }
    return { totalHours, h97153, directBcbaHours, clients: clients.size, rbts: rbts.size, bcbas: bcbas.size, unassignedHours: unassigned };
  }, [filtered]);

  /* ----- main table aggregation per BCBA ----- */
  interface BcbaRow {
    bcba: string;
    totalHours: number;
    h97153: number;
    directHours: number;
    clients: Map<string, number>; // clientName -> hours
    rbts: Map<string, number>;
    codes: Map<string, number>;
  }
  const bcbaTable = useMemo(() => {
    const map = new Map<string, BcbaRow>();
    const ensure = (b: string) => {
      let v = map.get(b);
      if (!v) {
        v = { bcba: b, totalHours: 0, h97153: 0, directHours: 0, clients: new Map(), rbts: new Map(), codes: new Map() };
        map.set(b, v);
      }
      return v;
    };
    for (const r of filtered) {
      const owner = r.bcbaOwner || "— Unassigned —";
      const row = ensure(owner);
      row.totalHours += r.hours;
      if (r.code.startsWith("97153") || r.code.startsWith("97154")) row.h97153 += r.hours;
      else row.directHours += r.hours;
      row.clients.set(r.clientName, (row.clients.get(r.clientName) || 0) + r.hours);
      if (r.rbt) row.rbts.set(r.rbt, (row.rbts.get(r.rbt) || 0) + r.hours);
      row.codes.set(r.code, (row.codes.get(r.code) || 0) + r.hours);
    }
    return [...map.values()].sort((a, b) => b.totalHours - a.totalHours);
  }, [filtered]);

  /* ----- transfers ----- */
  const transfers = useMemo(() => deriveTransfers(assignments), [assignments]);

  /* ----- save report ----- */
  async function handleSaveReport() {
    if (!rows.length) { toast.error("Upload a billing file first"); return; }
    const dup = findDuplicateSaved(fileName, rows.length);
    if (dup && !confirm(`A similar report ("${dup.name}") was saved recently. Save anyway?`)) return;
    const name = prompt("Name this report", `${fileName || "Billing"} — ${new Date().toLocaleDateString()}`);
    if (!name) return;
    await saveReportV2({ name, fileName, rows });
    setSavedList(readSavedReports());
    toast.success("Report saved");
  }

  async function handleRegenerate(id: string) {
    const data = await getSavedReportRows(id);
    if (!data.length) { toast.error("Saved report payload not found"); return; }
    setRows(data);
    const meta = readSavedReports().find(r => r.id === id);
    if (meta) setFileName(meta.fileName);
    toast.success(`Regenerated "${meta?.name || id}"`);
  }

  function exportBcbaCsv() {
    downloadCsv(`bcba-productivity-v2-${Date.now()}.csv`,
      ["BCBA", "Total Hours", "97153 Hours", "Direct Hours", "Client Count", "RBT Count"],
      bcbaTable.map(b => [b.bcba, b.totalHours.toFixed(2), b.h97153.toFixed(2), b.directHours.toFixed(2), b.clients.size, b.rbts.size])
    );
  }
  function exportTransfersCsv() {
    downloadCsv(`bcba-transfers-${Date.now()}.csv`,
      ["Client", "Previous BCBA", "New BCBA", "Transfer Date"],
      transfers.map(t => [t.clientName, t.previousBcba, t.newBcba, t.transferDate])
    );
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
            <h1 className="text-2xl font-semibold tracking-tight">BCBA Productivity Report V2</h1>
            <p className="text-sm text-muted-foreground">
              Single billing upload. Historical BCBA assignment ownership drives all productivity attribution.
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
                {fileName ? `Loaded: ${fileName}` : "Upload a single CR Billing Report (CSV or XLSX)"}
              </div>
              <div className="text-xs text-muted-foreground">
                {rows.length > 0
                  ? `${rows.length.toLocaleString()} rows parsed · ownership resolved via Assignment History`
                  : "Drag a file here, or click choose."}
              </div>
              {validationIssues.length > 0 && (
                <div className="mt-2 text-xs text-destructive">Missing columns: {validationIssues.join(", ")}</div>
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
                    onClick={async () => { await deleteSavedReportV2(r.id); setSavedList(readSavedReports()); }}
                    title="Delete"
                  ><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <KpiCard label="Total Hours" value={fmt1(kpis.totalHours)} />
          <KpiCard label="97153 Hours" value={fmt1(kpis.h97153)} />
          <KpiCard label="Direct BCBA Hours" value={fmt1(kpis.directBcbaHours)} />
          <KpiCard label="Active Clients" value={fmt0(kpis.clients)} />
          <KpiCard label="Active RBTs" value={fmt0(kpis.rbts)} />
          <KpiCard label="Active BCBAs" value={fmt0(kpis.bcbas)} />
        </div>
        {kpis.unassignedHours > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {fmt1(kpis.unassignedHours)} hrs have no Assignment History match. Open "Assignment History" to add ownership entries.
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
            <FilterSelect label="BCBA" value={bcbaF} onChange={setBcbaF} options={bcbaOptions} />
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>BCBA Assignment History</DialogTitle>
          </DialogHeader>
          <AssignmentHistoryEditor
            assignments={assignments}
            knownClients={clientOptions}
            onChange={() => setAssignments(readAssignments())}
            editing={editing}
            setEditing={setEditing}
          />
        </DialogContent>
      </Dialog>
    </OSShell>
  );
}

/* ---------- subcomponents ---------- */
function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card/60 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight">{value}</div>
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
  bcba: { bcba: string; totalHours: number; h97153: number; directHours: number;
          clients: Map<string, number>; rbts: Map<string, number>; codes: Map<string, number>; };
  expanded: boolean; onToggle: () => void;
}) {
  return (
    <>
      <tr className="border-t hover:bg-muted/30">
        <td className="px-3 py-2">
          <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </td>
        <td className="px-3 py-2 font-medium">{bcba.bcba}</td>
        <td className="px-3 py-2 text-right">{fmt1(bcba.totalHours)}</td>
        <td className="px-3 py-2 text-right">{fmt1(bcba.h97153)}</td>
        <td className="px-3 py-2 text-right">{fmt1(bcba.directHours)}</td>
        <td className="px-3 py-2 text-right">{fmt0(bcba.clients.size)}</td>
        <td className="px-3 py-2 text-right">{fmt0(bcba.rbts.size)}</td>
      </tr>
      {expanded && (
        <tr className="bg-muted/10">
          <td></td>
          <td colSpan={6} className="px-3 py-3">
            <div className="grid gap-4 md:grid-cols-3">
              <DrillList title="Clients" items={[...bcba.clients.entries()]} />
              <DrillList title="RBTs"    items={[...bcba.rbts.entries()]} />
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
        {sorted.slice(0, 12).map(([k, v]) => (
          <li key={k} className="flex items-center justify-between gap-2">
            <span className="truncate">{k}</span>
            <span className="tabular-nums">{fmt1(v)}</span>
          </li>
        ))}
        {sorted.length > 12 && (
          <li className="text-muted-foreground">+{sorted.length - 12} more</li>
        )}
      </ul>
    </div>
  );
}

function AssignmentHistoryEditor({
  assignments, knownClients, onChange, editing, setEditing,
}: {
  assignments: BcbaAssignment[];
  knownClients: string[];
  onChange: () => void;
  editing: BcbaAssignment | null;
  setEditing: (a: BcbaAssignment | null) => void;
}) {
  const [draft, setDraft] = useState<Omit<BcbaAssignment, "id" | "createdAt">>({
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
    const clientId = draft.clientId || draft.clientName.toLowerCase();
    if (editing) {
      updateAssignment(editing.id, { ...draft, clientId });
      toast.success("Assignment updated");
    } else {
      // Auto-close prior open assignment for same client
      const prior = readAssignments().filter(a =>
        (a.clientId === clientId || a.clientName.toLowerCase() === clientId) &&
        !a.endDate && a.bcbaName !== draft.bcbaName,
      );
      for (const p of prior) {
        const end = new Date(draft.startDate); end.setDate(end.getDate() - 1);
        updateAssignment(p.id, { endDate: end.toISOString().slice(0, 10) });
      }
      addAssignment({ ...draft, clientId });
      toast.success("Assignment added");
    }
    onChange();
    reset();
  }

  return (
    <div className="space-y-3">
      {/* form */}
      <div className="grid gap-2 rounded-lg border bg-card/60 p-3 sm:grid-cols-2">
        <div>
          <label className="text-[10px] font-semibold uppercase text-muted-foreground">Client</label>
          <Input list="known-clients" value={draft.clientName}
                 onChange={e => setDraft(s => ({ ...s, clientName: e.target.value }))} className="h-8" />
          <datalist id="known-clients">
            {knownClients.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase text-muted-foreground">BCBA</label>
          <Input value={draft.bcbaName}
                 onChange={e => setDraft(s => ({ ...s, bcbaName: e.target.value }))} className="h-8" />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase text-muted-foreground">Start Date</label>
          <Input type="date" value={draft.startDate}
                 onChange={e => setDraft(s => ({ ...s, startDate: e.target.value }))} className="h-8" />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase text-muted-foreground">End Date (optional)</label>
          <Input type="date" value={draft.endDate ?? ""}
                 onChange={e => setDraft(s => ({ ...s, endDate: e.target.value || null }))} className="h-8" />
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

      {/* table */}
      <div className="max-h-[40vh] overflow-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">BCBA</th>
              <th className="px-3 py-2">Start</th>
              <th className="px-3 py-2">End</th>
              <th className="w-20 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-sm text-muted-foreground">
                No assignments yet. Add one above.
              </td></tr>
            )}
            {assignments.map(a => (
              <tr key={a.id} className="border-t">
                <td className="px-3 py-2">{a.clientName}</td>
                <td className="px-3 py-2">{a.bcbaName}</td>
                <td className="px-3 py-2">{a.startDate}</td>
                <td className="px-3 py-2">{a.endDate || <Badge variant="outline">Open</Badge>}</td>
                <td className="px-3 py-2 text-right">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(a)} title="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => { if (confirm("Delete assignment?")) { deleteAssignment(a.id); onChange(); } }}
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