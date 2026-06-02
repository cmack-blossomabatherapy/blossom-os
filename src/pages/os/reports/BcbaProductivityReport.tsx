import { useMemo, useRef, useState } from "react";
import {
  Upload, FileSpreadsheet, Download, Search, Sparkles, ChevronRight, ChevronDown,
  Users, Stethoscope, GraduationCap, AlertTriangle, CheckCircle2, Printer, Trash2,
  ShieldCheck, FileWarning,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseAnyFile, SUPPORTED_EXTENSIONS } from "@/lib/os/dashboardEngine/excelParser";

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
}

interface AttributionException {
  client: string;
  clientId: string;
  date: string;
  code: string;
  hours: number;
  provider: string;
  reason: string;
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
  const [fileName, setFileName] = useState("");
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [month, setMonth] = useState("all");
  const [stateF, setStateF] = useState("all");
  const [bcbaF, setBcbaF] = useState("all");
  const [dirF, setDirF] = useState("all");
  const [payorF, setPayorF] = useState("all");
  const [codesF, setCodesF] = useState<string[]>([]); // empty = all
  const [search, setSearch] = useState("");
  const [minHours, setMinHours] = useState(DEFAULT_MIN);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ---- parse ---- */
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
      const rbtH = findH(headers, ["RBT", "RBT Name", "Tech", "Technician", "BehaviorTechnician"]);
      const codeH = findH(headers, ["ProcedureCode", "Code", "CPT", "CPT Code", "ServiceCode", "Service Code", "Procedure", "Procedure Code"]);
      const hoursH = findH(headers, ["TimeWorkedInHours", "Hours", "BillableHours", "Worked Hours", "ServiceHours", "UnitsOfService", "Units"]);
      const dateH = findH(headers, ["DateOfService", "Date", "ServiceDate", "Service Date", "SessionDate", "DOS"]);
      const stateH = findH(headers, ["ClientLocationStateProvince", "ProviderLocationStateProvince", "ServiceLocationStateProvince", "State", "WorkState", "Location"]);
      const dirH = findH(headers, ["StateDirector", "Director", "RegionalDirector"]);
      const payorH = findH(headers, ["PayorName", "PayorNickname", "Payor", "Payer", "Insurance", "Funder"]);
      const ptH = findH(headers, ["ParentTrainingCompleted", "PT Completed", "ParentTraining"]);
      const labelsH = findH(headers, ["ClientContactLabels", "Client Contact Labels", "Labels", "ContactLabels"]);

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
        setMissing(miss); setSessions([]); setFileName(file.name); return;
      }
      setMissing([]);

      // Pass 1: build raw entries with provider + client + code.
      type Raw = {
        provider: string; client: string; code: string; bucket: string;
        hours: number; date: string; state: string; director: string;
        payor: string; pt: boolean; labelBcba: string | null; raw: Record<string, string>;
      };
      const raws: Raw[] = [];
      for (const r of first.rows) {
        const provider = composeProv(r);
        const client = composeClient(r);
        if (!provider) continue;
        const code = codeH ? (r[codeH] || "").trim() : "";
        const labels = labelsH ? (r[labelsH] || "") : "";
        raws.push({
          provider, client, code, bucket: classifyCode(code),
          hours: hoursH ? num(r[hoursH]) : 0,
          date: dateH ? (r[dateH] || "") : "",
          state: stateH ? (r[stateH] || "") : "",
          director: dirH ? (r[dirH] || "") : "",
          payor: payorH ? (r[payorH] || "") : "",
          pt: ptH ? boolish(r[ptH]) : false,
          labelBcba: extractBcbaFromLabels(labels),
          raw: r,
        });
      }

      // Pass 2: determine the BCBA assigned to each client.
      // Priority:
      //   1) BCBA extracted from ClientContactLabels (source of truth — when
      //      the label changes, the assignment changes).
      //   2) Provider with most supervisor-code hours (97155/97156/97151).
      //   3) Highest-hours provider overall.
      const labelBcbaByClient = new Map<string, Map<string, number>>();
      for (const x of raws) {
        if (!x.client || !x.labelBcba) continue;
        let m = labelBcbaByClient.get(x.client);
        if (!m) { m = new Map(); labelBcbaByClient.set(x.client, m); }
        m.set(x.labelBcba, (m.get(x.labelBcba) ?? 0) + 1);
      }
      const supByClient = new Map<string, Map<string, number>>();
      const anyByClient = new Map<string, Map<string, number>>();
      for (const x of raws) {
        if (!x.client) continue;
        const isSup = x.bucket === "97155" || x.bucket === "97156" || x.bucket === "97151";
        const target = isSup ? supByClient : anyByClient;
        let m = target.get(x.client);
        if (!m) { m = new Map(); target.set(x.client, m); }
        m.set(x.provider, (m.get(x.provider) ?? 0) + x.hours);
      }
      const bcbaForClient = new Map<string, string>();
      const pickTop = (m: Map<string, number>) => {
        let best = ""; let bestH = -1;
        for (const [p, h] of m) if (h > bestH) { best = p; bestH = h; }
        return best;
      };
      const allClients = new Set<string>([
        ...labelBcbaByClient.keys(), ...supByClient.keys(), ...anyByClient.keys(),
      ]);
      for (const c of allClients) {
        const lm = labelBcbaByClient.get(c);
        if (lm && lm.size) { bcbaForClient.set(c, pickTop(lm)); continue; }
        const sm = supByClient.get(c);
        if (sm && sm.size) { bcbaForClient.set(c, pickTop(sm)); continue; }
        const am = anyByClient.get(c);
        if (am && am.size) { bcbaForClient.set(c, pickTop(am)); }
      }

      // Pass 3: build SessionRow stream feeding existing aggregation.
      // - bcba grouping field = bcbaForClient (or self if no client)
      // - hours are credited when the provider IS that BCBA, OR for
      //   97153/97154 RBT direct sessions (attributed to the BCBA via label).
      // - if the provider is NOT the BCBA, set rbt = provider so the RBT roster is built
      const rows: SessionRow[] = [];
      for (const x of raws) {
        const bcba = x.client ? (bcbaForClient.get(x.client) || x.provider) : x.provider;
        const isBcbaRow = x.provider === bcba;
        const creditRbtDirect = !isBcbaRow && x.bucket === "97153";
        rows.push({
          bcba,
          client: x.client,
          rbt: isBcbaRow ? "" : x.provider,
          code: x.code,
          hours: isBcbaRow || creditRbtDirect ? x.hours : 0,
          date: x.date,
          state: x.state,
          director: x.director,
          payor: x.payor,
          parentTrainingCompleted: x.pt,
          raw: x.raw,
        });
      }
      setSessions(rows);
      setFileName(file.name);
      toast.success(`Loaded ${rows.length.toLocaleString()} session rows`);
    } catch (e: any) {
      toast.error(`Failed to parse: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  function resetUpload() {
    setFileName(""); setSessions([]); setMissing([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  /* ---- filter options ---- */
  const months = useMemo(() => [...new Set(sessions.map(s => monthOf(s.date)).filter(Boolean))].sort(), [sessions]);
  const states = useMemo(() => [...new Set(sessions.map(s => s.state).filter(Boolean))].sort(), [sessions]);
  const bcbas = useMemo(() => [...new Set(sessions.map(s => s.bcba).filter(Boolean))].sort(), [sessions]);
  const directors = useMemo(() => [...new Set(sessions.map(s => s.director).filter(Boolean))].sort(), [sessions]);
  const payors = useMemo(() => [...new Set(sessions.map(s => s.payor).filter(Boolean))].sort(), [sessions]);

  const filteredSessions = useMemo(() => sessions.filter(s => {
    if (month !== "all" && monthOf(s.date) !== month) return false;
    if (stateF !== "all" && s.state !== stateF) return false;
    if (bcbaF !== "all" && s.bcba !== bcbaF) return false;
    if (dirF !== "all" && s.director !== dirF) return false;
    if (payorF !== "all" && s.payor !== payorF) return false;
    if (codesF.length > 0 && !codesF.includes(classifyCode(s.code))) return false;
    return true;
  }), [sessions, month, stateF, bcbaF, dirF, payorF, codesF]);

  /* ---- aggregate ---- */
  const aggregates = useMemo<BcbaAgg[]>(() => {
    const map = new Map<string, BcbaAgg>();
    for (const s of filteredSessions) {
      let agg = map.get(s.bcba);
      if (!agg) {
        agg = {
          name: s.bcba, state: s.state, director: s.director, payors: new Set(),
          h97155: 0, h97156: 0, h97151: 0, hOther: 0, total: 0, payrollHours: 0,
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
      const bucket = classifyCode(s.code);
      if (bucket === "97155") agg.h97155 += s.hours;
      else if (bucket === "97156") agg.h97156 += s.hours;
      else if (bucket === "97151") agg.h97151 += s.hours;
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
    if (!search.trim()) return aggregates;
    const q = search.toLowerCase();
    return aggregates.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.state.toLowerCase().includes(q) ||
      a.director.toLowerCase().includes(q),
    );
  }, [aggregates, search]);

  /* ---- KPIs ---- */
  const kpis = useMemo(() => {
    const n = aggregates.length;
    const totalClients = new Set(filteredSessions.map(s => s.client).filter(Boolean)).size;
    const totalRbts = new Set(filteredSessions.map(s => s.rbt).filter(Boolean)).size;
    const t97155 = aggregates.reduce((s, a) => s + a.h97155, 0);
    const t97156 = aggregates.reduce((s, a) => s + a.h97156, 0);
    const totalCases = aggregates.reduce((s, a) => s + a.activeClients, 0);
    return {
      totalBcbas: n,
      totalClients,
      totalRbts,
      t97155, t97156,
      avgCaseload: n ? totalCases / n : 0,
      avg97155: n ? t97155 / n : 0,
      avg97156: n ? t97156 / n : 0,
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
      "97155", "97156", "97151", "Other", "Total", "Payroll Hours",
      "Avg/Client", "Avg/RBT", "Min Hours", "Status", "Flags",
    ];
    const rows = visible.map(a => [
      a.name, a.state, a.director, a.activeClients, a.assignedRbts,
      fmt1(a.h97155), fmt1(a.h97156), fmt1(a.h97151), fmt1(a.hOther), fmt1(a.total),
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

  const empty = !sessions.length;

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
            <p className="mt-3 text-sm font-medium">Upload a CR billing / service export</p>
            <p className="text-xs text-muted-foreground">
              CSV or Excel · one row per session with BCBA, Client, CPT code, hours, RBT, payor, date, state.
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
            {missing.length > 0 && (
              <div className="mx-auto mt-4 max-w-lg rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-left text-xs text-destructive">
                <p className="font-semibold">Missing required columns:</p>
                <ul className="ml-4 mt-1 list-disc">
                  {missing.map(m => <li key={m}>{m}</li>)}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {!empty && (
        <>
          {/* ===== Filters ===== */}
          <section className="mt-4 rounded-xl border border-border/60 bg-card p-3 print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect label="Month" value={month} onChange={setMonth} options={months} />
              <FilterSelect label="State" value={stateF} onChange={setStateF} options={states} />
              <FilterSelect label="BCBA" value={bcbaF} onChange={setBcbaF} options={bcbas} />
              <FilterSelect label="State Director" value={dirF} onChange={setDirF} options={directors} />
              <FilterSelect label="Payor" value={payorF} onChange={setPayorF} options={payors} />
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Service Code</span>
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
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Min hours</span>
                <Input type="number" value={minHours} onChange={e => setMinHours(num(e.target.value) || DEFAULT_MIN)} className="h-8 w-20" />
              </div>
              <div className="relative ml-auto w-56">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search BCBA…" className="h-8 pl-8 text-xs" />
              </div>
              <Button variant="ghost" size="sm" onClick={resetUpload} className="text-xs">
                <Trash2 className="mr-1 h-3.5 w-3.5" />Reset
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Source: <span className="font-medium text-foreground">{fileName}</span> · {filteredSessions.length.toLocaleString()} session rows in view.
            </p>
          </section>

          {/* ===== KPI Summary ===== */}
          <section className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            <Kpi label="Total BCBAs" value={fmt0(kpis.totalBcbas)} icon={Users} />
            <Kpi label="Total Clients Served" value={fmt0(kpis.totalClients)} icon={Stethoscope} />
            <Kpi label="Total RBTs Supervised" value={fmt0(kpis.totalRbts)} />
            <Kpi label="Total 97155 Hours" value={fmt1(kpis.t97155)} />
            <Kpi label="Total 97156 Hours" value={fmt1(kpis.t97156)} icon={GraduationCap} />
            <Kpi label="Average Caseload" value={fmt1(kpis.avgCaseload)} />
            <Kpi label="Avg 97155 / BCBA" value={fmt1(kpis.avg97155)} />
            <Kpi label="Avg 97156 / BCBA" value={fmt1(kpis.avg97156)} />
            <Kpi label="Avg Clients / BCBA" value={fmt1(kpis.avgClientsPerBcba)} />
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
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
              <h2 className="text-sm font-semibold">BCBA Productivity ({visible.length})</h2>
              <span className="text-[11px] text-muted-foreground">Click a row to expand client &amp; RBT breakdowns</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-secondary/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <Th />
                    <Th>BCBA</Th>
                    <Th>State</Th>
                    <Th align="right">Active Clients</Th>
                    <Th align="right">RBTs</Th>
                    <Th align="right">97155</Th>
                    <Th align="right">97156</Th>
                    <Th align="right">Total Billable</Th>
                    <Th align="right">Avg/Client</Th>
                    <Th align="right">Avg/RBT</Th>
                    <Th align="right">Payroll</Th>
                    <Th align="right">Min</Th>
                    <Th>Status</Th>
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
                    <tr><td colSpan={13} className="px-4 py-8 text-center text-muted-foreground">No BCBAs match your filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
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

function Kpi({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
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
          <td colSpan={13} className="px-4 py-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Code breakdown */}
              <SubCard title="Code Breakdown">
                <table className="w-full text-xs">
                  <thead className="text-[10px] uppercase text-muted-foreground">
                    <tr><Th>BCBA</Th><Th align="right">97155</Th><Th align="right">97156</Th><Th align="right">97151</Th><Th align="right">Other</Th><Th align="right">Total</Th></tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border/30">
                      <Td>{agg.name}</Td>
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
                  <DT label="Payors" value={agg.payors.size ? [...agg.payors].join(", ") : "—"} />
                </dl>
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