import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight, Upload, Search, Users, Clock, FileBarChart, RefreshCw, AlertTriangle } from "lucide-react";
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
  raw_labels: string | null;
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
        .select("id, date_of_service, client_full, bcba_name, provider_full, procedure_code, procedure_description, hours, raw_labels")
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
      // Get user id to namespace the upload (storage RLS allows admins anywhere in the bucket)
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id ?? "anon";
      const path = `${uid}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      toast.info("Uploading CSV…");
      const { error: upErr } = await supabase.storage
        .from("bcba-imports")
        .upload(path, file, { contentType: "text/csv", upsert: true });
      if (upErr) throw upErr;
      toast.info("Processing CSV — this can take up to a minute…");
      const { data, error } = await supabase.functions.invoke("import-bcba-sessions", {
        body: { storagePath: path, filename: file.name },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`Imported ${(data as any)?.rows ?? 0} sessions`);
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

  // Unassigned & mismatch analysis (always computed from filtered set)
  type UnassignedClient = {
    client: string;
    hours: number;
    sessions: number;
    sampleLabels: string;
    candidateNames: string[]; // label fragments that look like names but were skipped
  };

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
      // Pull plausible name candidates from the raw labels for review
      const allLabelParts = new Set<string>();
      v.labels.forEach((l) => l.split(",").forEach((p) => {
        const t = p.trim();
        if (t && /^[A-Za-z][A-Za-z'.\- ]+$/.test(t) && t.split(/\s+/).length >= 2) allLabelParts.add(t);
      }));
      return {
        client,
        hours: v.hours,
        sessions: v.sessions,
        sampleLabels: Array.from(v.labels)[0] ?? "",
        candidateNames: Array.from(allLabelParts).slice(0, 6),
      };
    }).sort((a, b) => b.hours - a.hours);
  }, [filtered]);

  const unassignedHours = unassignedClients.reduce((s, c) => s + c.hours, 0);
  const unassignedSessions = unassignedClients.reduce((s, c) => s + c.sessions, 0);

  // Mismatch detection: same client with multiple BCBA names in dataset
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

      {(unassignedClients.length > 0 || mismatches.length > 0) && (
        <div className="rounded-xl border border-warning/40 bg-warning/5 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-foreground">Label issues detected</p>
            <p className="text-muted-foreground mt-0.5">
              {unassignedClients.length > 0 && (
                <>
                  <span className="font-medium text-foreground">{unassignedHours.toFixed(1)}h</span> across{" "}
                  <span className="font-medium text-foreground">{unassignedSessions.toLocaleString()}</span> sessions for{" "}
                  <span className="font-medium text-foreground">{unassignedClients.length}</span> client(s) couldn't be mapped to a current BCBA.
                </>
              )}
              {unassignedClients.length > 0 && mismatches.length > 0 && " "}
              {mismatches.length > 0 && (
                <>
                  <span className="font-medium text-foreground">{mismatches.length}</span> client(s) have hours assigned to multiple BCBAs (possible mid-period transition or duplicate labels).
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {unassignedClients.length > 0 && (
        <Card className="overflow-hidden border-warning/30">
          <div className="px-4 py-3 border-b border-border/50 bg-warning/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h2 className="text-sm font-semibold">Unassigned hours — needs label fix</h2>
            </div>
            <span className="text-xs text-muted-foreground">{unassignedHours.toFixed(1)}h · {unassignedSessions} sessions · {unassignedClients.length} clients</span>
          </div>
          <div className="grid grid-cols-12 px-4 py-2 border-b border-border/40 bg-muted/20 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            <div className="col-span-3">Client</div>
            <div className="col-span-1 text-right">Hours</div>
            <div className="col-span-1 text-right">Sessions</div>
            <div className="col-span-3">Possible BCBA names in labels</div>
            <div className="col-span-4">Sample labels</div>
          </div>
          {unassignedClients.slice(0, 50).map((c) => (
            <div key={c.client} className="grid grid-cols-12 px-4 py-2 items-start border-b border-border/30 last:border-0 text-sm">
              <div className="col-span-3 font-medium truncate" title={c.client}>{c.client}</div>
              <div className="col-span-1 text-right tabular-nums font-semibold">{c.hours.toFixed(1)}</div>
              <div className="col-span-1 text-right tabular-nums text-muted-foreground">{c.sessions}</div>
              <div className="col-span-3 flex flex-wrap gap-1">
                {c.candidateNames.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground italic">No name candidates in labels</span>
                ) : c.candidateNames.map((n) => (
                  <Badge key={n} variant="outline" className="font-normal text-[10px]">{n}</Badge>
                ))}
              </div>
              <div className="col-span-4 text-[11px] text-muted-foreground truncate" title={c.sampleLabels}>{c.sampleLabels}</div>
            </div>
          ))}
          {unassignedClients.length > 50 && (
            <div className="px-4 py-2 text-xs text-muted-foreground text-center bg-muted/10">
              Showing top 50 of {unassignedClients.length} unassigned clients.
            </div>
          )}
        </Card>
      )}

      {mismatches.length > 0 && (
        <Card className="overflow-hidden border-warning/30">
          <div className="px-4 py-3 border-b border-border/50 bg-warning/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h2 className="text-sm font-semibold">Multiple BCBAs per client — possible mismatch</h2>
            </div>
            <span className="text-xs text-muted-foreground">{mismatches.length} clients</span>
          </div>
          <div className="grid grid-cols-12 px-4 py-2 border-b border-border/40 bg-muted/20 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            <div className="col-span-4">Client</div>
            <div className="col-span-2 text-right">Total hours</div>
            <div className="col-span-6">BCBA split</div>
          </div>
          {mismatches.slice(0, 50).map((m) => (
            <div key={m.client} className="grid grid-cols-12 px-4 py-2 items-center border-b border-border/30 last:border-0 text-sm">
              <div className="col-span-4 font-medium truncate" title={m.client}>{m.client}</div>
              <div className="col-span-2 text-right tabular-nums font-semibold">{m.totalHours.toFixed(1)}</div>
              <div className="col-span-6 flex flex-wrap gap-1.5">
                {m.bcbas.map((b) => (
                  <Badge key={b.name} variant="secondary" className="font-normal">{b.name} · {b.hours.toFixed(1)}h</Badge>
                ))}
              </div>
            </div>
          ))}
          {mismatches.length > 50 && (
            <div className="px-4 py-2 text-xs text-muted-foreground text-center bg-muted/10">
              Showing top 50 of {mismatches.length}.
            </div>
          )}
        </Card>
      )}

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