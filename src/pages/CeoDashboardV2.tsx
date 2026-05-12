import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight, Upload, Search, Users, Clock, FileBarChart, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
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
}

interface ImportInfo {
  id: string;
  uploaded_at: string;
  filename: string | null;
  row_count: number;
}

const UNASSIGNED = "Unassigned BCBA";

export default function CeoDashboardV2() {
  const [importInfo, setImportInfo] = useState<ImportInfo | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [codeFilter, setCodeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadActive() {
    setLoading(true);
    const { data: imp } = await supabase
      .from("bcba_billable_imports")
      .select("id, uploaded_at, filename, row_count")
      .eq("is_active", true)
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!imp) { setSessions([]); setImportInfo(null); setLoading(false); return; }
    setImportInfo(imp as ImportInfo);
    // Page through all sessions
    const all: Session[] = [];
    const pageSize = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("bcba_billable_sessions")
        .select("id, date_of_service, client_full, bcba_name, provider_full, procedure_code, procedure_description, hours")
        .eq("import_id", imp.id)
        .range(from, from + pageSize - 1);
      if (error) { toast.error(error.message); break; }
      all.push(...((data ?? []) as Session[]));
      if (!data || data.length < pageSize) break;
      from += pageSize;
    }
    setSessions(all);
    setLoading(false);
  }

  useEffect(() => { loadActive(); }, []);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const text = await file.text();
      const { data, error } = await supabase.functions.invoke("import-bcba-sessions", {
        body: { csv: text, filename: file.name },
      });
      if (error) throw error;
      toast.success(`Imported ${data?.rows ?? 0} sessions`);
      await loadActive();
    } catch (e) {
      toast.error((e as Error).message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // Apply filters
  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (codeFilter !== "all" && s.procedure_code !== codeFilter) return false;
      if (dateFrom && (!s.date_of_service || s.date_of_service < dateFrom)) return false;
      if (dateTo && (!s.date_of_service || s.date_of_service > dateTo)) return false;
      if (search) {
        const q = search.toLowerCase();
        const bcba = (s.bcba_name ?? UNASSIGNED).toLowerCase();
        if (!bcba.includes(q) && !s.client_full.toLowerCase().includes(q) && !s.provider_full.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [sessions, search, codeFilter, dateFrom, dateTo]);

  const allCodes = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => { if (s.procedure_code) set.add(s.procedure_code); });
    return Array.from(set).sort();
  }, [sessions]);

  // Group by BCBA
  type Group = {
    bcba: string;
    totalHours: number;
    sessionCount: number;
    clientCount: number;
    byCode: Map<string, number>;
    byClient: Map<string, { client: string; hours: number; sessions: number; byCode: Map<string, number> }>;
  };

  const groups = useMemo<Group[]>(() => {
    const m = new Map<string, Group>();
    for (const s of filtered) {
      const bcba = s.bcba_name ?? UNASSIGNED;
      let g = m.get(bcba);
      if (!g) { g = { bcba, totalHours: 0, sessionCount: 0, clientCount: 0, byCode: new Map(), byClient: new Map() }; m.set(bcba, g); }
      g.totalHours += Number(s.hours) || 0;
      g.sessionCount += 1;
      const code = s.procedure_code || "—";
      g.byCode.set(code, (g.byCode.get(code) || 0) + (Number(s.hours) || 0));
      const client = s.client_full || "Unknown client";
      let c = g.byClient.get(client);
      if (!c) { c = { client, hours: 0, sessions: 0, byCode: new Map() }; g.byClient.set(client, c); }
      c.hours += Number(s.hours) || 0;
      c.sessions += 1;
      c.byCode.set(code, (c.byCode.get(code) || 0) + (Number(s.hours) || 0));
    }
    for (const g of m.values()) g.clientCount = g.byClient.size;
    return Array.from(m.values()).sort((a, b) => b.totalHours - a.totalHours);
  }, [filtered]);

  const totalHours = useMemo(() => groups.reduce((s, g) => s + g.totalHours, 0), [groups]);

  function toggle(bcba: string) {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(bcba)) n.delete(bcba); else n.add(bcba);
      return n;
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CEO Dashboard V2</h1>
          <p className="text-sm text-muted-foreground">Billable hours per BCBA, with breakdown by billing code. Upload a fresh CSV any time.</p>
          {importInfo && (
            <p className="text-xs text-muted-foreground mt-1">
              Active dataset: <span className="font-medium text-foreground">{importInfo.filename}</span> · {importInfo.row_count.toLocaleString()} sessions · uploaded {format(parseISO(importInfo.uploaded_at), "PP p")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadActive}><RefreshCw className="h-4 w-4 mr-1.5" />Refresh</Button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4 mr-1.5" />{uploading ? "Uploading…" : "Upload CSV"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={Clock} label="Total billable hours" value={totalHours.toLocaleString(undefined, { maximumFractionDigits: 1 })} />
        <Stat icon={Users} label="BCBAs" value={groups.length.toString()} />
        <Stat icon={FileBarChart} label="Sessions" value={filtered.length.toLocaleString()} />
        <Stat icon={FileBarChart} label="Billing codes" value={new Set(filtered.map((s) => s.procedure_code).filter(Boolean)).size.toString()} />
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Search BCBA, client, or RBT</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-8" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Billing code</label>
            <Select value={codeFilter} onValueChange={setCodeFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value="all">All codes</SelectItem>
                {allCodes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-2 border-b border-border/50 bg-muted/30 text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
          <div className="col-span-5">BCBA</div>
          <div className="col-span-2 text-right">Hours</div>
          <div className="col-span-2 text-right">Sessions</div>
          <div className="col-span-2 text-right">Clients</div>
          <div className="col-span-1 text-right">% of total</div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : groups.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-muted-foreground">No data yet. Upload a CSV to get started.</p>
          </div>
        ) : groups.map((g) => {
          const isOpen = expanded.has(g.bcba);
          const pct = totalHours > 0 ? (g.totalHours / totalHours) * 100 : 0;
          return (
            <div key={g.bcba} className="border-b border-border/40 last:border-0">
              <button onClick={() => toggle(g.bcba)} className="w-full grid grid-cols-12 px-4 py-3 items-center hover:bg-muted/30 transition-colors text-left">
                <div className="col-span-5 flex items-center gap-2 min-w-0">
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <span className={cn("font-medium truncate", g.bcba === UNASSIGNED && "text-muted-foreground italic")}>{g.bcba}</span>
                </div>
                <div className="col-span-2 text-right tabular-nums font-semibold">{g.totalHours.toFixed(1)}</div>
                <div className="col-span-2 text-right tabular-nums text-sm">{g.sessionCount}</div>
                <div className="col-span-2 text-right tabular-nums text-sm">{g.clientCount}</div>
                <div className="col-span-1 text-right text-xs text-muted-foreground">{pct.toFixed(1)}%</div>
              </button>
              {isOpen && (
                <div className="bg-muted/20 px-4 py-3 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(g.byCode.entries()).sort((a, b) => b[1] - a[1]).map(([code, h]) => (
                      <Badge key={code} variant="secondary" className="font-normal">{code} · {h.toFixed(1)}h</Badge>
                    ))}
                  </div>
                  <div className="rounded-lg border border-border/50 bg-background overflow-hidden">
                    <div className="grid grid-cols-12 px-3 py-1.5 border-b border-border/40 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                      <div className="col-span-6">Client</div>
                      <div className="col-span-2 text-right">Hours</div>
                      <div className="col-span-1 text-right">Sessions</div>
                      <div className="col-span-3">By code</div>
                    </div>
                    {Array.from(g.byClient.values()).sort((a, b) => b.hours - a.hours).map((c) => (
                      <div key={c.client} className="grid grid-cols-12 px-3 py-2 items-center text-sm border-b border-border/30 last:border-0">
                        <div className="col-span-6 truncate">{c.client}</div>
                        <div className="col-span-2 text-right tabular-nums font-medium">{c.hours.toFixed(1)}</div>
                        <div className="col-span-1 text-right tabular-nums text-muted-foreground">{c.sessions}</div>
                        <div className="col-span-3 flex flex-wrap gap-1">
                          {Array.from(c.byCode.entries()).sort((a, b) => b[1] - a[1]).map(([code, h]) => (
                            <span key={code} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground tabular-nums">{code} {h.toFixed(1)}h</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}