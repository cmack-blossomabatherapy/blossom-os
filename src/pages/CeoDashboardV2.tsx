import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  ChevronRight, Upload, Search, Users, Clock, FileBarChart, RefreshCw,
  AlertTriangle, SlidersHorizontal, X, TrendingUp, UserCog, ChevronDown, ArrowUpDown, MapPin, HelpCircle,
  Briefcase, UserCircle2, Tag, Activity, ShieldAlert,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  date_of_service: string | null;
  client_full: string;
  bcba_name: string | null;
  provider_full: string;
  procedure_code: string | null;
  procedure_description: string | null;
  hours: number;
  raw_labels: string | null;
}

interface ImportInfo {
  id: string;
  uploaded_at: string;
  filename: string | null;
  row_count: number;
}

const UNASSIGNED = "Unassigned BCBA";
const STORAGE_KEY = "ceoDashV2.filters.v1";
const CACHE_KEY = "ceoDashV2.cache.v1";
const CACHE_TTL_MS = 10 * 60 * 1000;

type WindowKey = "30d" | "90d" | "6mo" | "12mo" | "all";
const WINDOW_LABELS: Record<WindowKey, string> = {
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "6mo": "Last 6 months",
  "12mo": "Last 12 months",
  all: "All history",
};
const WINDOW_ORDER: WindowKey[] = ["30d", "90d", "6mo", "12mo", "all"];
function windowSinceISO(w: WindowKey): string | null {
  if (w === "all") return null;
  const days = w === "30d" ? 30 : w === "90d" ? 90 : w === "6mo" ? 183 : 365;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

type SortKey = "hours_desc" | "hours_asc" | "name_asc" | "sessions_desc" | "patients_desc" | "rbts_desc";
const SORT_LABELS: Record<SortKey, string> = {
  hours_desc: "Hours (high → low)",
  hours_asc: "Hours (low → high)",
  name_asc: "Name (A → Z)",
  sessions_desc: "Sessions (most)",
  patients_desc: "Patients (most)",
  rbts_desc: "RBTs (most)",
};

function extractState(labels: string | null): string | null {
  if (!labels) return null;
  for (const part of labels.split(",")) {
    const t = part.trim();
    const m = t.match(/^([A-Za-z][A-Za-z .'-]+?)\s+Location$/i);
    if (m) return m[1].trim();
  }
  return null;
}

/**
 * Normalize procedure codes so clinic / VA fee-schedule variants are grouped
 * with their base code for BCBA attribution. Eli: BCBAs aren't penalized
 * because a client happens to be a clinic client — the work is the same.
 *   97153, "97153 RBT Clinic", "97153 BCBA Clinic" -> 97153
 *   97155, "97155 VA",         "97155 BCBA Clinic" -> 97155
 */
function normalizeCode(code: string | null | undefined): string {
  if (!code) return "—";
  const trimmed = code.trim();
  if (/^97153(\b|\s)/i.test(trimmed)) return "97153";
  if (/^97155(\b|\s)/i.test(trimmed)) return "97155";
  return trimmed;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const PETALS = [
  "petal-orange", "petal-yellow", "petal-green", "petal-sage",
  "petal-purple", "petal-pink", "petal-red",
];
function petalFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PETALS[h % PETALS.length];
}

export default function CeoDashboardV2() {
  const [imports, setImports] = useState<ImportInfo[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<"replace" | "append">("append");
  const persisted = (() => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
  })();
  const [search, setSearch] = useState<string>(persisted?.search ?? "");
  const [codeFilter, setCodeFilter] = useState<string>(persisted?.codeFilter ?? "all");
  const [stateFilter, setStateFilter] = useState<string>(persisted?.stateFilter ?? "all");
  const [bcbaFilter, setBcbaFilter] = useState<string>(persisted?.bcbaFilter ?? "all");
  const [dateFrom, setDateFrom] = useState<string>(persisted?.dateFrom ?? "");
  const [dateTo, setDateTo] = useState<string>(persisted?.dateTo ?? "");
  const [sortKey, setSortKey] = useState<SortKey>((persisted?.sortKey as SortKey) ?? "hours_desc");
  const [windowKey, setWindowKey] = useState<WindowKey>((persisted?.windowKey as WindowKey) ?? "90d");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [unassignedOpen, setUnassignedOpen] = useState(false);
  const [mismatchesOpen, setMismatchesOpen] = useState(false);
  const [detailBcba, setDetailBcba] = useState<string | null>(null);
  const [detailSearch, setDetailSearch] = useState<string>("");
  const [detailTab, setDetailTab] = useState<string>("overview");
  const [showUnassigned, setShowUnassigned] = useState<boolean>(persisted?.showUnassigned ?? false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Persist filters across refresh / navigation
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ search, codeFilter, stateFilter, bcbaFilter, dateFrom, dateTo, sortKey, windowKey, showUnassigned }),
      );
    } catch { /* quota/SSR */ }
  }, [search, codeFilter, stateFilter, bcbaFilter, dateFrom, dateTo, sortKey, windowKey, showUnassigned]);

  async function loadActive(opts: { force?: boolean; window?: WindowKey } = {}) {
    const w = opts.window ?? windowKey;
    // Try sessionStorage cache first
    if (!opts.force && typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw) as { windowKey: WindowKey; fetchedAt: number; sessions: Session[]; imports: ImportInfo[] };
          if (cached.windowKey === w && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
            setSessions(cached.sessions);
            setImports(cached.imports ?? []);
            setFetchedAt(cached.fetchedAt);
            setLoading(false);
            // Background revalidate
            void fetchFresh(w, /*background*/ true);
            return;
          }
        }
      } catch { /* ignore */ }
    }
    setLoading(true);
    await fetchFresh(w, false);
  }

  async function fetchFresh(w: WindowKey, background: boolean) {
    try {
      const { data: imps } = await supabase
        .from("bcba_billable_imports")
        .select("id, uploaded_at, filename, row_count")
        .eq("is_active", true)
        .order("uploaded_at", { ascending: false });
      const importsList = (imps ?? []) as ImportInfo[];
      if (importsList.length === 0) {
        setSessions([]); setImports([]); setFetchedAt(Date.now());
        if (!background) setLoading(false);
        try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
        return;
      }
      const importIds = importsList.map((i) => i.id);
      const since = windowSinceISO(w);
      const all: Session[] = [];
      const pageSize = 1000;
      let from = 0;
      while (true) {
        let q = supabase
          .from("bcba_billable_sessions")
          .select("id, date_of_service, client_full, bcba_name, provider_full, procedure_code, procedure_description, hours, raw_labels")
          .in("import_id", importIds)
          .order("date_of_service", { ascending: false })
          .range(from, from + pageSize - 1);
        if (since) q = q.gte("date_of_service", since);
        const { data, error } = await q;
        if (error) { if (!background) toast.error(error.message); break; }
        all.push(...((data ?? []) as Session[]));
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }
      const ts = Date.now();
      setSessions(all);
      setImports(importsList);
      setFetchedAt(ts);
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ windowKey: w, fetchedAt: ts, sessions: all, imports: importsList }));
      } catch { /* quota — drop cache */ }
    } finally {
      if (!background) setLoading(false);
    }
  }

  useEffect(() => { loadActive(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { loadActive({ window: windowKey }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [windowKey]);

  // Reset drawer-local UI state when switching BCBAs
  useEffect(() => { setDetailSearch(""); setDetailTab("overview"); }, [detailBcba]);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id ?? "anon";
      const path = `${uid}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      toast.info("Uploading CSV…");
      const { error: upErr } = await supabase.storage
        .from("bcba-imports")
        .upload(path, file, { contentType: "text/csv", upsert: true });
      if (upErr) throw upErr;
      toast.info(`Processing CSV (${uploadMode === "append" ? "append" : "replace"}) — this can take up to a minute…`);
      const { data, error } = await supabase.functions.invoke("import-bcba-sessions", {
        body: { storagePath: path, filename: file.name, mode: uploadMode },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`Imported ${(data as any)?.rows ?? 0} sessions`);
      try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
      await loadActive({ force: true });
    } catch (e) {
      toast.error((e as Error).message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (codeFilter !== "all" && normalizeCode(s.procedure_code) !== codeFilter) return false;
      if (bcbaFilter !== "all" && (s.bcba_name ?? UNASSIGNED) !== bcbaFilter) return false;
      if (stateFilter !== "all") {
        const st = extractState(s.raw_labels) ?? "Unknown";
        if (st !== stateFilter) return false;
      }
      if (dateFrom && (!s.date_of_service || s.date_of_service < dateFrom)) return false;
      if (dateTo && (!s.date_of_service || s.date_of_service > dateTo)) return false;
      if (search) {
        const q = search.trim().toLowerCase();
        if (q) {
          const bcba = (s.bcba_name ?? UNASSIGNED).toLowerCase();
          const labels = (s.raw_labels ?? "").toLowerCase();
          if (
            !bcba.includes(q) &&
            !s.client_full.toLowerCase().includes(q) &&
            !s.provider_full.toLowerCase().includes(q) &&
            !labels.includes(q)
          ) return false;
        }
      }
      return true;
    });
  }, [sessions, search, codeFilter, bcbaFilter, stateFilter, dateFrom, dateTo]);

  const allCodes = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => { if (s.procedure_code) set.add(normalizeCode(s.procedure_code)); });
    return Array.from(set).sort();
  }, [sessions]);

  const allStates = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => { const st = extractState(s.raw_labels); if (st) set.add(st); });
    return Array.from(set).sort();
  }, [sessions]);

  const allBcbas = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => set.add(s.bcba_name ?? UNASSIGNED));
    return Array.from(set).sort();
  }, [sessions]);

  type Group = {
    bcba: string;
    totalHours: number;
    sessionCount: number;
    clientCount: number;
    rbtCount: number;
    byCode: Map<string, number>;
    byClient: Map<string, { client: string; hours: number; sessions: number; rbts: Set<string>; byCode: Map<string, number> }>;
  };

  const groups = useMemo<Group[]>(() => {
    const m = new Map<string, Group & { rbts: Set<string> }>();
    for (const s of filtered) {
      const bcba = s.bcba_name ?? UNASSIGNED;
      // Hide Unassigned from the main BCBA leaderboard unless the user opts in.
      // Unassigned hours are still surfaced in the dedicated alert above the list.
      if (!showUnassigned && bcba === UNASSIGNED) continue;
      let g = m.get(bcba);
      if (!g) { g = { bcba, totalHours: 0, sessionCount: 0, clientCount: 0, rbtCount: 0, byCode: new Map(), byClient: new Map(), rbts: new Set() }; m.set(bcba, g); }
      g.totalHours += Number(s.hours) || 0;
      g.sessionCount += 1;
      const code = normalizeCode(s.procedure_code);
      g.byCode.set(code, (g.byCode.get(code) || 0) + (Number(s.hours) || 0));
      const client = s.client_full || "Unknown client";
      let c = g.byClient.get(client);
      if (!c) { c = { client, hours: 0, sessions: 0, rbts: new Set(), byCode: new Map() }; g.byClient.set(client, c); }
      c.hours += Number(s.hours) || 0;
      c.sessions += 1;
      c.byCode.set(code, (c.byCode.get(code) || 0) + (Number(s.hours) || 0));
      if (s.provider_full) c.rbts.add(s.provider_full);
      if (s.provider_full) g.rbts.add(s.provider_full);
    }
    for (const g of m.values()) { g.clientCount = g.byClient.size; g.rbtCount = g.rbts.size; }
    const arr = Array.from(m.values());
    const cmp: Record<SortKey, (a: Group, b: Group) => number> = {
      hours_desc: (a, b) => b.totalHours - a.totalHours,
      hours_asc: (a, b) => a.totalHours - b.totalHours,
      name_asc: (a, b) => a.bcba.localeCompare(b.bcba),
      sessions_desc: (a, b) => b.sessionCount - a.sessionCount,
      patients_desc: (a, b) => b.clientCount - a.clientCount,
      rbts_desc: (a, b) => b.rbtCount - a.rbtCount,
    };
    return arr.sort(cmp[sortKey] ?? cmp.hours_desc);
  }, [filtered, sortKey, showUnassigned]);

  const totalHours = useMemo(() => groups.reduce((s, g) => s + g.totalHours, 0), [groups]);
  const maxHours = useMemo(() => groups.reduce((m, g) => Math.max(m, g.totalHours), 0), [groups]);

  type UnassignedClient = { client: string; hours: number; sessions: number; sampleLabels: string; candidateNames: string[] };
  const unassignedClients = useMemo<UnassignedClient[]>(() => {
    const byClient = new Map<string, { hours: number; sessions: number; labels: Set<string> }>();
    for (const s of filtered) {
      if (s.bcba_name) continue;
      const key = s.client_full || "Unknown client";
      let entry = byClient.get(key);
      if (!entry) { entry = { hours: 0, sessions: 0, labels: new Set() }; byClient.set(key, entry); }
      entry.hours += Number(s.hours) || 0;
      entry.sessions += 1;
      if (s.raw_labels) entry.labels.add(s.raw_labels);
    }
    return Array.from(byClient.entries()).map(([client, v]) => {
      const allLabelParts = new Set<string>();
      v.labels.forEach((l) => l.split(",").forEach((p) => {
        const t = p.trim();
        if (t && /^[A-Za-z][A-Za-z'.\- ]+$/.test(t) && t.split(/\s+/).length >= 2) allLabelParts.add(t);
      }));
      return {
        client, hours: v.hours, sessions: v.sessions,
        sampleLabels: Array.from(v.labels)[0] ?? "",
        candidateNames: Array.from(allLabelParts).slice(0, 6),
      };
    }).sort((a, b) => b.hours - a.hours);
  }, [filtered]);

  const unassignedHours = unassignedClients.reduce((s, c) => s + c.hours, 0);
  const unassignedSessions = unassignedClients.reduce((s, c) => s + c.sessions, 0);

  type Mismatch = { client: string; bcbas: { name: string; hours: number }[]; totalHours: number };
  const mismatches = useMemo<Mismatch[]>(() => {
    const byClient = new Map<string, Map<string, number>>();
    for (const s of filtered) {
      if (!s.bcba_name) continue;
      const key = s.client_full || "Unknown client";
      let m = byClient.get(key);
      if (!m) { m = new Map(); byClient.set(key, m); }
      m.set(s.bcba_name, (m.get(s.bcba_name) || 0) + (Number(s.hours) || 0));
    }
    const out: Mismatch[] = [];
    for (const [client, m] of byClient) {
      if (m.size < 2) continue;
      const bcbas = Array.from(m.entries()).map(([name, hours]) => ({ name, hours })).sort((a, b) => b.hours - a.hours);
      const totalHours = bcbas.reduce((s, x) => s + x.hours, 0);
      out.push({ client, bcbas, totalHours });
    }
    return out.sort((a, b) => b.totalHours - a.totalHours);
  }, [filtered]);

  const bcbaDetail = useMemo(() => {
    if (!detailBcba) return null;
    const rows = filtered.filter((s) => (s.bcba_name ?? UNASSIGNED) === detailBcba);
    const byClient = new Map<string, { hours: number; sessions: number; rbts: Set<string>; byCode: Map<string, number> }>();
    const byRbt = new Map<string, { hours: number; sessions: number; clients: Set<string> }>();
    const byCode = new Map<string, number>();
    let total = 0;
    for (const s of rows) {
      const h = Number(s.hours) || 0;
      total += h;
      const code = normalizeCode(s.procedure_code);
      byCode.set(code, (byCode.get(code) || 0) + h);
      const client = s.client_full || "Unknown client";
      let c = byClient.get(client);
      if (!c) { c = { hours: 0, sessions: 0, rbts: new Set(), byCode: new Map() }; byClient.set(client, c); }
      c.hours += h; c.sessions += 1;
      if (s.provider_full) c.rbts.add(s.provider_full);
      c.byCode.set(code, (c.byCode.get(code) || 0) + h);
      const rbt = s.provider_full || "Unknown RBT";
      let r = byRbt.get(rbt);
      if (!r) { r = { hours: 0, sessions: 0, clients: new Set() }; byRbt.set(rbt, r); }
      r.hours += h; r.sessions += 1; r.clients.add(client);
    }
    return {
      totalHours: total,
      sessionCount: rows.length,
      clients: Array.from(byClient.entries()).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.hours - a.hours),
      rbts: Array.from(byRbt.entries()).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.hours - a.hours),
      codes: Array.from(byCode.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [detailBcba, filtered]);

  const activeFilterCount =
    (codeFilter !== "all" ? 1 : 0) +
    (stateFilter !== "all" ? 1 : 0) +
    (bcbaFilter !== "all" ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  const clearFilters = () => {
    setCodeFilter("all"); setStateFilter("all"); setBcbaFilter("all");
    setDateFrom(""); setDateTo("");
  };

  return (
    <div className="-mx-3 -mt-3 md:-mx-6 md:-mt-6 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-12">
      {/* HERO HEADER */}
      <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/10 via-background to-accent/5 px-4 pt-5 pb-4 md:px-8 md:pt-8 md:pb-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <TrendingUp className="h-3 w-3" /> Executive
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">CEO Dashboard V2</h1>
            <p className="mt-1 text-sm text-muted-foreground">Billable hours per BCBA · live label-driven attribution</p>
            {imports.length > 0 ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-success mr-1.5 align-middle" />
                {sessions.length.toLocaleString()} loaded · {WINDOW_LABELS[windowKey].toLowerCase()} ·{" "}
                {imports.length === 1
                  ? `uploaded ${format(parseISO(imports[0].uploaded_at), "MMM d, p")}`
                  : `${imports.length} active imports`}
                {fetchedAt ? ` · refreshed ${format(new Date(fetchedAt), "p")}` : ""}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card/60 backdrop-blur p-1">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                      <Link to="/ceo-dashboard-v2/insights" aria-label="Insights & Trends">
                        <Activity className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Insights & Trends</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                      <Link to="/ceo-dashboard-v2/revenue-leaks" aria-label="Revenue Leak Analysis">
                        <ShieldAlert className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Revenue Leak Analysis</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                      <Link to="/ceo-dashboard-v2/logic" aria-label="How this dashboard works">
                        <HelpCircle className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">How this dashboard works</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="ghost" size="icon" onClick={() => loadActive({ force: true })} className="h-8 w-8 rounded-lg" title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <div className="flex items-center rounded-xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden">
              <Select value={uploadMode} onValueChange={(v) => setUploadMode(v as "replace" | "append")}>
                <SelectTrigger className="h-9 w-[100px] text-xs border-0 bg-transparent rounded-none focus:ring-0" aria-label="Upload mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="append">Append</SelectItem>
                  <SelectItem value="replace">Replace</SelectItem>
                </SelectContent>
              </Select>
              <div className="h-5 w-px bg-border/60" />
              <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()} disabled={uploading} className="h-9 rounded-none gap-1.5 text-primary hover:text-primary hover:bg-primary/5">
                <Upload className="h-3.5 w-3.5" />{uploading ? "Uploading…" : "Upload CSV"}
              </Button>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="relative mt-5 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
          <KpiTile icon={Clock} label="Billable hours" value={totalHours.toLocaleString(undefined, { maximumFractionDigits: 1 })} accent="primary" />
          <KpiTile icon={UserCog} label="BCBAs" value={groups.length.toString()} accent="petal-purple" />
          <KpiTile icon={FileBarChart} label="Sessions" value={filtered.length.toLocaleString()} accent="petal-sage" />
          <KpiTile icon={Users} label="Billing codes" value={new Set(filtered.map((s) => s.procedure_code).filter(Boolean)).size.toString()} accent="accent" />
        </div>

        {/* Window chips */}
        <div className="relative mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground mr-1 shrink-0">Range</span>
          {WINDOW_ORDER.map((w) => (
            <button
              key={w}
              onClick={() => setWindowKey(w)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium border transition-colors",
                windowKey === w
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {WINDOW_LABELS[w]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pt-4 md:px-8 md:pt-6 space-y-4">
        {/* CONTROL BAR */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search BCBA, patient, or RBT…"
              className="h-11 rounded-xl pl-10 pr-9 bg-card border-border/60 text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-11 px-3.5 gap-1.5 rounded-xl shrink-0 flex-1 sm:flex-initial">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-[1.25rem] justify-center px-1 text-[10px] bg-primary text-primary-foreground">{activeFilterCount}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl border-x-0 border-b-0 max-h-[88dvh] p-0 flex flex-col">
              <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
              <SheetHeader className="text-left px-5 pt-3 pb-4">
                <SheetTitle className="text-base">Filter sessions</SheetTitle>
                <SheetDescription className="text-xs">
                  {activeFilterCount === 0 ? "No filters active — saved automatically" : `${activeFilterCount} active · saved automatically`}
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-5 overflow-y-auto border-t border-border/60 px-5 py-5">
                <FilterField label="Billing code">
                  <Select value={codeFilter} onValueChange={setCodeFilter}>
                    <SelectTrigger className="h-12 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="all">All codes</SelectItem>
                      {allCodes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FilterField>
                <FilterField label="State / location">
                  <Select value={stateFilter} onValueChange={setStateFilter}>
                    <SelectTrigger className="h-12 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="all">All states</SelectItem>
                      {allStates.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      <SelectItem value="Unknown">Unknown / no location</SelectItem>
                    </SelectContent>
                  </Select>
                </FilterField>
                <FilterField label="BCBA">
                  <Select value={bcbaFilter} onValueChange={setBcbaFilter}>
                    <SelectTrigger className="h-12 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="all">All BCBAs</SelectItem>
                      {allBcbas.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FilterField>
                <FilterField label="Date range">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">From</div>
                      <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-12 text-sm" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">To</div>
                      <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-12 text-sm" />
                    </div>
                  </div>
                </FilterField>
                <FilterField label="Sort BCBAs by">
                  <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                    <SelectTrigger className="h-12 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                        <SelectItem key={k} value={k}>{SORT_LABELS[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterField>
                <FilterField label="Unassigned BCBA">
                  <button
                    type="button"
                    onClick={() => setShowUnassigned((v) => !v)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors",
                      showUnassigned ? "border-primary/40 bg-primary/5" : "border-border/60 bg-card",
                    )}
                  >
                    <span className="text-left">
                      <div className="font-medium">{showUnassigned ? "Showing in leaderboard" : "Hidden from leaderboard"}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Sessions without a BCBA label still appear in the alert above the list.</div>
                    </span>
                    <Badge variant={showUnassigned ? "default" : "outline"} className="ml-3 shrink-0">{showUnassigned ? "On" : "Off"}</Badge>
                  </button>
                </FilterField>
              </div>
              <SheetFooter className="flex-row gap-2 border-t border-border/60 bg-background px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                <Button variant="outline" className="flex-1 h-11" onClick={clearFilters} disabled={activeFilterCount === 0}>Clear all</Button>
                <Button className="flex-1 h-11" onClick={() => setFiltersOpen(false)}>
                  Done{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="h-11 w-auto gap-1.5 rounded-xl px-3 text-sm shrink-0 flex-1 sm:flex-initial sm:min-w-[180px]">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <SelectItem key={k} value={k}>{SORT_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </div>

        {/* Active filter chips */}
        {(activeFilterCount > 0 || search) && (
          <div className="flex flex-wrap gap-1.5">
            {search && <FilterChip label={`"${search}"`} onClear={() => setSearch("")} />}
            {codeFilter !== "all" && <FilterChip label={`Code: ${codeFilter}`} onClear={() => setCodeFilter("all")} />}
            {stateFilter !== "all" && <FilterChip label={`State: ${stateFilter}`} onClear={() => setStateFilter("all")} />}
            {bcbaFilter !== "all" && <FilterChip label={`BCBA: ${bcbaFilter}`} onClear={() => setBcbaFilter("all")} />}
            {dateFrom && <FilterChip label={`From: ${dateFrom}`} onClear={() => setDateFrom("")} />}
            {dateTo && <FilterChip label={`To: ${dateTo}`} onClear={() => setDateTo("")} />}
            {activeFilterCount + (search ? 1 : 0) > 1 && (
              <button
                onClick={() => { setSearch(""); clearFilters(); }}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* ALERTS */}
        {(unassignedClients.length > 0 || mismatches.length > 0) && (
          <div className="space-y-2.5">
            {unassignedClients.length > 0 && (
              <CollapsibleAlert
                open={unassignedOpen}
                onOpenChange={setUnassignedOpen}
                title="Unassigned hours"
                subtitle="Sessions missing a current BCBA label"
                metric={`${unassignedHours.toFixed(1)}h`}
                meta={`${unassignedSessions.toLocaleString()} sessions · ${unassignedClients.length} clients`}
              >
                <div className="divide-y divide-border/40">
                  {unassignedClients.slice(0, 50).map((c) => (
                    <div key={c.client} className="px-4 py-3 text-sm space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium truncate flex-1">{c.client}</span>
                        <span className="tabular-nums font-semibold whitespace-nowrap text-warning">{c.hours.toFixed(1)}h</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">{c.sessions} sessions</div>
                      {c.candidateNames.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {c.candidateNames.map((n) => (
                            <Badge key={n} variant="outline" className="font-normal text-[10px]">{n}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {unassignedClients.length > 50 && (
                    <div className="px-4 py-2 text-xs text-muted-foreground text-center">
                      Showing top 50 of {unassignedClients.length}.
                    </div>
                  )}
                </div>
              </CollapsibleAlert>
            )}
            {mismatches.length > 0 && (
              <CollapsibleAlert
                open={mismatchesOpen}
                onOpenChange={setMismatchesOpen}
                title="Multiple BCBAs per client"
                subtitle="Possible mid-period transitions or duplicate labels"
                metric={`${mismatches.length}`}
                meta="clients flagged"
              >
                <div className="divide-y divide-border/40">
                  {mismatches.slice(0, 50).map((m) => (
                    <div key={m.client} className="px-4 py-3 text-sm space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium truncate flex-1">{m.client}</span>
                        <span className="tabular-nums font-semibold whitespace-nowrap">{m.totalHours.toFixed(1)}h</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.bcbas.map((b) => (
                          <Badge key={b.name} variant="secondary" className="font-normal text-[10px]">{b.name} · {b.hours.toFixed(1)}h</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleAlert>
            )}
          </div>
        )}

        {/* BCBA SECTION HEADER */}
        <div className="flex items-baseline justify-between pt-1">
          <h2 className="text-base font-semibold">BCBAs by billable hours</h2>
          <span className="text-[11px] text-muted-foreground">{groups.length} total</span>
        </div>

        {/* BCBA LIST */}
        {loading ? (
          <div className="space-y-2.5">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[88px] rounded-2xl" />)}
          </div>
        ) : groups.length === 0 ? (
          <EmptyState onUpload={() => fileRef.current?.click()} />
        ) : (
          <div className="space-y-2.5">
            {groups.map((g) => (
              <BcbaCard
                key={g.bcba}
                group={g}
                maxHours={maxHours}
                totalHours={totalHours}
                searchQuery={search.trim()}
                onOpen={() => setDetailBcba(g.bcba)}
              />
            ))}
            {windowKey !== "all" && (
              <div className="pt-2 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-full px-5 text-xs"
                  onClick={() => {
                    const idx = WINDOW_ORDER.indexOf(windowKey);
                    const next = WINDOW_ORDER[Math.min(idx + 1, WINDOW_ORDER.length - 1)];
                    setWindowKey(next);
                  }}
                >
                  Load older · {WINDOW_LABELS[WINDOW_ORDER[Math.min(WINDOW_ORDER.indexOf(windowKey) + 1, WINDOW_ORDER.length - 1)]]}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAIL DRAWER */}
      <Sheet open={!!detailBcba} onOpenChange={(o) => !o && setDetailBcba(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col gap-0">
          {/* Hero */}
          <SheetHeader className="relative overflow-hidden border-b border-border/60 px-5 py-5 text-left space-y-0">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-card to-accent/5" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            {detailBcba && (
              <div className="relative flex items-center gap-3">
                <div className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white text-lg font-semibold shadow-md ring-2 ring-background",
                  detailBcba === UNASSIGNED ? "bg-muted-foreground" : ""
                )} style={detailBcba === UNASSIGNED ? undefined : { background: `hsl(var(--${petalFor(detailBcba)}))` }}>
                  {detailBcba === UNASSIGNED ? "?" : initials(detailBcba)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">BCBA detail</div>
                  <SheetTitle className={cn("text-xl leading-tight truncate", detailBcba === UNASSIGNED && "italic text-muted-foreground")}>
                    {detailBcba}
                  </SheetTitle>
                  {bcbaDetail && (
                    <SheetDescription className="mt-0.5 text-xs">
                      {WINDOW_LABELS[windowKey]} · {bcbaDetail.sessionCount.toLocaleString()} sessions
                    </SheetDescription>
                  )}
                </div>
              </div>
            )}
            {bcbaDetail && (
              <div className="relative grid grid-cols-4 gap-2 mt-4">
                <DetailStat label="Hours" value={bcbaDetail.totalHours.toFixed(1)} icon={Clock} />
                <DetailStat label="Patients" value={bcbaDetail.clients.length.toString()} icon={UserCircle2} />
                <DetailStat label="RBTs" value={bcbaDetail.rbts.length.toString()} icon={Briefcase} />
                <DetailStat label="Codes" value={bcbaDetail.codes.length.toString()} icon={Tag} />
              </div>
            )}
          </SheetHeader>

          {bcbaDetail && (
            <Tabs value={detailTab} onValueChange={setDetailTab} className="flex-1 flex flex-col min-h-0">
              <div className="px-5 pt-3 pb-2 border-b border-border/60 bg-card/40">
                <TabsList className="grid grid-cols-4 w-full h-9 bg-muted/60">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="patients" className="text-xs gap-1">Patients <span className="text-[10px] opacity-70">{bcbaDetail.clients.length}</span></TabsTrigger>
                  <TabsTrigger value="rbts" className="text-xs gap-1">RBTs <span className="text-[10px] opacity-70">{bcbaDetail.rbts.length}</span></TabsTrigger>
                  <TabsTrigger value="codes" className="text-xs gap-1">Codes <span className="text-[10px] opacity-70">{bcbaDetail.codes.length}</span></TabsTrigger>
                </TabsList>
                {(detailTab === "patients" || detailTab === "rbts") && (
                  <div className="relative mt-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={detailSearch}
                      onChange={(e) => setDetailSearch(e.target.value)}
                      placeholder={detailTab === "patients" ? "Search patients…" : "Search RBTs…"}
                      className="h-9 rounded-lg pl-9 pr-9 text-sm bg-background"
                    />
                    {detailSearch && (
                      <button onClick={() => setDetailSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
                {/* OVERVIEW */}
                <TabsContent value="overview" className="mt-0 space-y-5">
                  <DetailSection title="Billing code mix" icon={Tag} count={bcbaDetail.codes.length}>
                    <div className="space-y-2">
                      {bcbaDetail.codes.map(([code, h]) => {
                        const pct = bcbaDetail.totalHours > 0 ? (h / bcbaDetail.totalHours) * 100 : 0;
                        return (
                          <div key={code} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium tabular-nums">{code}</span>
                              <span className="text-muted-foreground tabular-nums">{h.toFixed(1)}h · {pct.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </DetailSection>

                  <DetailSection title="Top patients" icon={UserCircle2} count={Math.min(5, bcbaDetail.clients.length)}>
                    <div className="rounded-xl border border-border/60 divide-y divide-border/40 bg-card overflow-hidden">
                      {bcbaDetail.clients.slice(0, 5).map((c) => (
                        <div key={c.name} className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-sm">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{c.name}</div>
                            <div className="text-[11px] text-muted-foreground">{c.sessions} sessions · {c.rbts.size} RBTs</div>
                          </div>
                          <div className="tabular-nums font-semibold whitespace-nowrap text-sm">{c.hours.toFixed(1)}h</div>
                        </div>
                      ))}
                    </div>
                    {bcbaDetail.clients.length > 5 && (
                      <button onClick={() => setDetailTab("patients")} className="mt-2 w-full text-center text-xs text-primary hover:underline">
                        View all {bcbaDetail.clients.length} patients →
                      </button>
                    )}
                  </DetailSection>

                  <DetailSection title="Top RBTs" icon={Briefcase} count={Math.min(5, bcbaDetail.rbts.length)}>
                    <div className="rounded-xl border border-border/60 divide-y divide-border/40 bg-card overflow-hidden">
                      {bcbaDetail.rbts.slice(0, 5).map((r) => (
                        <div key={r.name} className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-sm">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{r.name}</div>
                            <div className="text-[11px] text-muted-foreground">{r.sessions} sessions · {r.clients.size} patients</div>
                          </div>
                          <div className="tabular-nums font-semibold whitespace-nowrap text-sm">{r.hours.toFixed(1)}h</div>
                        </div>
                      ))}
                    </div>
                    {bcbaDetail.rbts.length > 5 && (
                      <button onClick={() => setDetailTab("rbts")} className="mt-2 w-full text-center text-xs text-primary hover:underline">
                        View all {bcbaDetail.rbts.length} RBTs →
                      </button>
                    )}
                  </DetailSection>
                </TabsContent>

                {/* PATIENTS */}
                <TabsContent value="patients" className="mt-0">
                  {(() => {
                    const q = detailSearch.trim().toLowerCase();
                    const list = q
                      ? bcbaDetail.clients.filter((c) => c.name.toLowerCase().includes(q) || Array.from(c.rbts).some((r) => r.toLowerCase().includes(q)))
                      : bcbaDetail.clients;
                    if (list.length === 0) {
                      return <div className="py-10 text-center text-sm text-muted-foreground">No patients match "{detailSearch}".</div>;
                    }
                    return (
                      <Accordion type="multiple" className="space-y-1.5">
                        {list.map((c) => {
                          const codes = Array.from(c.byCode.entries()).sort((a, b) => b[1] - a[1]);
                          const rbts = Array.from(c.rbts);
                          return (
                            <AccordionItem key={c.name} value={c.name} className="border border-border/60 rounded-xl bg-card overflow-hidden data-[state=open]:shadow-sm">
                              <AccordionTrigger className="px-3.5 py-2.5 hover:no-underline hover:bg-muted/40 [&[data-state=open]]:bg-muted/40">
                                <div className="flex items-center justify-between gap-3 w-full pr-2 min-w-0">
                                  <div className="min-w-0 flex-1 text-left">
                                    <div className="font-medium truncate text-sm">{c.name}</div>
                                    <div className="text-[11px] text-muted-foreground font-normal">{c.sessions} sessions · {rbts.length} RBT{rbts.length === 1 ? "" : "s"}</div>
                                  </div>
                                  <div className="tabular-nums font-semibold text-sm whitespace-nowrap">{c.hours.toFixed(1)}h</div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-3.5 pb-3 pt-1 space-y-3">
                                <div>
                                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Codes</div>
                                  <div className="flex flex-wrap gap-1">
                                    {codes.map(([code, h]) => (
                                      <Badge key={code} variant="secondary" className="font-normal text-[10px] tabular-nums">{code} · {h.toFixed(1)}h</Badge>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">RBTs assigned</div>
                                  {rbts.length === 0 ? (
                                    <div className="text-xs text-muted-foreground italic">None</div>
                                  ) : (
                                    <div className="flex flex-wrap gap-1">
                                      {rbts.map((r) => (
                                        <Badge key={r} variant="outline" className="font-normal text-[10px]">{r}</Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    );
                  })()}
                </TabsContent>

                {/* RBTs */}
                <TabsContent value="rbts" className="mt-0">
                  {(() => {
                    const q = detailSearch.trim().toLowerCase();
                    const list = q
                      ? bcbaDetail.rbts.filter((r) => r.name.toLowerCase().includes(q) || Array.from(r.clients).some((c) => c.toLowerCase().includes(q)))
                      : bcbaDetail.rbts;
                    if (list.length === 0) {
                      return <div className="py-10 text-center text-sm text-muted-foreground">No RBTs match "{detailSearch}".</div>;
                    }
                    return (
                      <Accordion type="multiple" className="space-y-1.5">
                        {list.map((r) => {
                          const clients = Array.from(r.clients);
                          return (
                            <AccordionItem key={r.name} value={r.name} className="border border-border/60 rounded-xl bg-card overflow-hidden data-[state=open]:shadow-sm">
                              <AccordionTrigger className="px-3.5 py-2.5 hover:no-underline hover:bg-muted/40 [&[data-state=open]]:bg-muted/40">
                                <div className="flex items-center justify-between gap-3 w-full pr-2 min-w-0">
                                  <div className="min-w-0 flex-1 text-left">
                                    <div className="font-medium truncate text-sm">{r.name}</div>
                                    <div className="text-[11px] text-muted-foreground font-normal">{r.sessions} sessions · {clients.length} patient{clients.length === 1 ? "" : "s"}</div>
                                  </div>
                                  <div className="tabular-nums font-semibold text-sm whitespace-nowrap">{r.hours.toFixed(1)}h</div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-3.5 pb-3 pt-1">
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Patients</div>
                                <div className="flex flex-wrap gap-1">
                                  {clients.map((c) => (
                                    <Badge key={c} variant="outline" className="font-normal text-[10px]">{c}</Badge>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    );
                  })()}
                </TabsContent>

                {/* CODES */}
                <TabsContent value="codes" className="mt-0">
                  <div className="space-y-2.5">
                    {bcbaDetail.codes.map(([code, h]) => {
                      const pct = bcbaDetail.totalHours > 0 ? (h / bcbaDetail.totalHours) * 100 : 0;
                      return (
                        <div key={code} className="rounded-xl border border-border/60 bg-card p-3.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Tag className="h-3.5 w-3.5" />
                              </div>
                              <div className="font-semibold tabular-nums">{code}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold tabular-nums">{h.toFixed(1)}h</div>
                              <div className="text-[10px] text-muted-foreground">{pct.toFixed(1)}% of total</div>
                            </div>
                          </div>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function KpiTile({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-3 md:p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span
          className="flex h-6 w-6 items-center justify-center rounded-lg"
          style={{ background: `hsl(var(--${accent}) / 0.12)`, color: `hsl(var(--${accent}))` }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-2 text-xl md:text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
    </div>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      onClick={onClear}
      className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/15 transition-colors"
    >
      {label}
      <X className="h-3 w-3" />
    </button>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function CollapsibleAlert({
  open, onOpenChange, title, subtitle, metric, meta, children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  subtitle: string;
  metric: string;
  meta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-warning/40 bg-warning/5">
      <button
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-warning/10 transition-colors"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate">{title}</span>
          </div>
          <div className="text-[11px] text-muted-foreground truncate">{subtitle}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-semibold tabular-nums">{metric}</div>
          <div className="text-[10px] text-muted-foreground">{meta}</div>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-warning/30 bg-card/60">{children}</div>}
    </div>
  );
}

function BcbaCard({
  group, maxHours, totalHours, onOpen, searchQuery,
}: {
  group: {
    bcba: string;
    totalHours: number;
    sessionCount: number;
    clientCount: number;
    rbtCount: number;
    byCode: Map<string, number>;
    byClient: Map<string, { client: string; hours: number; sessions: number; rbts: Set<string>; byCode: Map<string, number> }>;
  };
  maxHours: number;
  totalHours: number;
  onOpen: () => void;
  searchQuery: string;
}) {
  const pct = totalHours > 0 ? (group.totalHours / totalHours) * 100 : 0;
  const barPct = maxHours > 0 ? (group.totalHours / maxHours) * 100 : 0;
  const isUnassigned = group.bcba === "Unassigned BCBA";
  const codes = Array.from(group.byCode.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const q = searchQuery.toLowerCase();
  const expanded = q.length > 0;
  const patients = expanded
    ? Array.from(group.byClient.values())
        .map((c) => ({ ...c, match: c.client.toLowerCase().includes(q) }))
        .sort((a, b) => (Number(b.match) - Number(a.match)) || (b.hours - a.hours))
    : [];
  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
    <button
      onClick={onOpen}
      className="group w-full text-left p-4 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white text-sm font-semibold shadow-sm",
            isUnassigned && "bg-muted-foreground"
          )}
          style={isUnassigned ? undefined : { background: `hsl(var(--${petalFor(group.bcba)}))` }}
        >
          {isUnassigned ? "?" : initials(group.bcba)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className={cn("font-semibold truncate", isUnassigned && "italic text-muted-foreground")}>{group.bcba}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {group.sessionCount} sessions · {group.clientCount} patients · {group.rbtCount} RBTs
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-lg font-semibold tabular-nums leading-none">{group.totalHours.toFixed(1)}<span className="text-xs text-muted-foreground font-normal">h</span></div>
              <div className="text-[10px] text-muted-foreground mt-1">{pct.toFixed(1)}% of total</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0 group-hover:text-primary transition-colors" />
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${barPct}%`,
                background: isUnassigned
                  ? "hsl(var(--muted-foreground))"
                  : `linear-gradient(90deg, hsl(var(--${petalFor(group.bcba)})), hsl(var(--primary)))`,
              }}
            />
          </div>

          {/* Code chips */}
          {codes.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {codes.map(([code, h]) => (
                <span key={code} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground tabular-nums font-medium">
                  {code} · {h.toFixed(1)}h
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
    {expanded && patients.length > 0 && (
      <div className="border-t border-border/60 bg-muted/20 divide-y divide-border/40">
        <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
          <span>Patients ({patients.length})</span>
          {patients.some((p) => p.match) && (
            <span className="text-primary normal-case tracking-normal">
              {patients.filter((p) => p.match).length} match{patients.filter((p) => p.match).length === 1 ? "" : "es"}
            </span>
          )}
        </div>
        {patients.slice(0, 25).map((p) => (
          <div key={p.client} className={cn("px-4 py-2.5 text-sm", p.match && "bg-primary/5")}>
            <div className="flex items-center justify-between gap-2">
              <span className={cn("truncate font-medium", p.match && "text-primary")}>{p.client}</span>
              <span className="tabular-nums font-semibold text-xs whitespace-nowrap">{p.hours.toFixed(1)}h</span>
            </div>
            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
              {p.sessions} sessions · RBTs: {Array.from(p.rbts).join(", ") || "—"}
            </div>
          </div>
        ))}
        {patients.length > 25 && (
          <div className="px-4 py-2 text-[11px] text-muted-foreground text-center">
            +{patients.length - 25} more — open BCBA for full list
          </div>
        )}
      </div>
    )}
    </div>
  );
}

function DetailStat({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {Icon && <Icon className="h-3 w-3" />}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums leading-tight">{value}</div>
    </div>
  );
}

function DetailSection({ title, icon: Icon, count, children }: { title: string; icon?: React.ComponentType<{ className?: string }>; count?: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-1.5 mb-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{title}</h3>
        {typeof count === "number" && <span className="text-[11px] text-muted-foreground">· {count}</span>}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Upload className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-semibold">No data yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">Upload a BCBA sessions CSV to populate the dashboard.</p>
      <Button className="mt-4" onClick={onUpload}><Upload className="h-4 w-4 mr-1.5" />Upload CSV</Button>
    </div>
  );
}
