import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Plus, Search, AlertTriangle, Users, Activity } from "lucide-react";
import { toast } from "sonner";
import {
  useParentTrainingRecords,
  useCreateParentTrainingRecord,
  useServiceUtilization,
} from "./useParentTraining";
import {
  PT_STATUS_ORDER, PT_STATUS_LABELS, PT_STATUS_STYLES,
  FREQUENCY_LABELS, RISK_LABELS, RISK_STYLES, TREND_LABELS,
  isStale, daysUntil, utilizationPct, explainUtilization,
  type ParentTrainingStatus,
} from "./pipeline";
import ParentTrainingDetailDrawer from "./ParentTrainingDetailDrawer";

function fmt(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return "—"; }
}

function StatusPill({ status }: { status: ParentTrainingStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${PT_STATUS_STYLES[status]}`}>
      {PT_STATUS_LABELS[status]}
    </span>
  );
}

export default function ParentTrainingPage() {
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<"parent_training" | "utilization">("parent_training");

  const selectedId = params.get("id");
  const setSelected = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("id", id); else next.delete("id");
    setParams(next, { replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Parent Training & Service Utilization</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Contextualized visibility into training cadence and service delivery — never assigns blame.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="parent_training"><Users className="h-3.5 w-3.5 mr-1.5" /> Parent training</TabsTrigger>
          <TabsTrigger value="utilization"><Activity className="h-3.5 w-3.5 mr-1.5" /> Service utilization</TabsTrigger>
        </TabsList>

        <TabsContent value="parent_training" className="mt-4">
          <ParentTrainingView onSelect={setSelected} />
        </TabsContent>

        <TabsContent value="utilization" className="mt-4">
          <UtilizationView />
        </TabsContent>
      </Tabs>

      <ParentTrainingDetailDrawer id={selectedId} onClose={() => setSelected(null)} />
    </div>
  );
}

function ParentTrainingView({ onSelect }: { onSelect: (id: string) => void }) {
  const { data: rows = [], isLoading, error, refetch, isFetching } = useParentTrainingRecords();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<ParentTrainingStatus | "all">("all");
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => rows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (scope === "mine" && !r.assigned_bcba_id) return false;
    if (q) {
      const s = q.toLowerCase();
      if (![r.client_identifier, r.assigned_bcba_name, r.payer, r.state]
        .some((v) => (v ?? "").toLowerCase().includes(s))) return false;
    }
    return true;
  }), [rows, statusFilter, scope, q]);

  const counts = useMemo(() => {
    const c: Partial<Record<ParentTrainingStatus, number>> = {};
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const gaps = useMemo(() => {
    const overdue = rows.filter((r) => r.status === "overdue").length;
    const cancel = rows.filter((r) => r.status === "repeated_cancellations").length;
    const barrier = rows.filter((r) => r.status === "family_barrier").length;
    const docs = rows.filter((r) => r.status === "documentation_pending").length;
    return { overdue, cancel, barrier, docs };
  }, [rows]);

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-64" placeholder="Search client, BCBA, payer…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={scope} onValueChange={(v) => setScope(v as any)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All BCBAs</SelectItem>
            <SelectItem value="mine">My clients</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {PT_STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>{PT_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
        </Button>
        <Button size="sm" className="ml-auto" onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4 mr-1" /> New record
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <GapCard label="Overdue" value={gaps.overdue} tone={gaps.overdue ? "critical" : "muted"} />
        <GapCard label="Repeated cancellations" value={gaps.cancel} tone={gaps.cancel ? "elevated" : "muted"} />
        <GapCard label="Family barriers" value={gaps.barrier} tone={gaps.barrier ? "elevated" : "muted"} />
        <GapCard label="Documentation pending" value={gaps.docs} tone={gaps.docs ? "elevated" : "muted"} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
        {PT_STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter((cur) => (cur === s ? "all" : s))}
            className={`text-left rounded-xl border p-3 transition ${
              statusFilter === s ? "border-primary bg-primary/5" : "border-border/70 bg-card hover:border-border"
            }`}
          >
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground leading-tight">{PT_STATUS_LABELS[s]}</div>
            <div className="text-2xl font-semibold mt-1">{counts[s] ?? 0}</div>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
        <div className="grid grid-cols-[minmax(180px,1.4fr)_1fr_130px_130px_150px_140px] gap-3 px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground border-b border-border/70 bg-muted/30">
          <div>Client</div>
          <div>Frequency / progress</div>
          <div>Last completed</div>
          <div>Next scheduled</div>
          <div>Barrier</div>
          <div>Status</div>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…</div>
        ) : error ? (
          <div className="p-8 text-center text-destructive">Failed to load</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No parent training records in this view.</div>
        ) : (
          filtered.map((r) => {
            const stale = isStale(r.centralreach_source_date);
            const dr = daysUntil(r.next_scheduled_date);
            return (
              <button
                key={r.id}
                onClick={() => onSelect(r.id)}
                className="w-full text-left grid grid-cols-[minmax(180px,1.4fr)_1fr_130px_130px_150px_140px] gap-3 px-4 py-3 border-b last:border-b-0 border-border/70 hover:bg-muted/40 transition"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.client_identifier}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.assigned_bcba_name ?? "Unassigned"}{r.state ? ` · ${r.state}` : ""}
                  </div>
                  {stale && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Stale CR data
                    </div>
                  )}
                </div>
                <div className="text-sm">
                  <div>{FREQUENCY_LABELS[r.required_frequency]} · {r.completed_sessions}/{r.required_per_month} completed</div>
                  <div className="text-xs text-muted-foreground">
                    Scheduled {r.scheduled_sessions} · Cancelled {r.cancelled_sessions}
                  </div>
                </div>
                <div className="text-sm">{fmt(r.last_completed_date)}</div>
                <div className="text-sm">
                  <div>{fmt(r.next_scheduled_date)}</div>
                  {dr !== null && (
                    <div className={`text-[11px] ${dr < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {dr < 0 ? `${Math.abs(dr)}d overdue` : dr === 0 ? "Today" : `in ${dr}d`}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate" title={r.barrier ?? ""}>
                  {r.barrier ?? "—"}
                </div>
                <div><StatusPill status={r.status} /></div>
              </button>
            );
          })
        )}
      </div>

      <NewParentTrainingDialog open={showNew} onOpenChange={setShowNew} />
    </>
  );
}

function UtilizationView() {
  const { data: rows = [], isLoading, error, refetch, isFetching } = useServiceUtilization();
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState<"all" | "watch" | "elevated" | "critical">("all");

  const filtered = useMemo(() => rows.filter((r) => {
    if (risk !== "all" && r.underutilization_risk !== risk) return false;
    if (q) {
      const s = q.toLowerCase();
      if (![r.client_identifier, r.assigned_bcba_name, r.payer, r.state].some((v) => (v ?? "").toLowerCase().includes(s))) return false;
    }
    return true;
  }), [rows, risk, q]);

  const summary = useMemo(() => {
    let critical = 0, elevated = 0, stale = 0, staffing = 0;
    for (const r of rows) {
      if (r.underutilization_risk === "critical") critical++;
      else if (r.underutilization_risk === "elevated") elevated++;
      if (isStale(r.centralreach_source_date)) stale++;
      if (r.staffing_gap_hours > 0) staffing++;
    }
    return { critical, elevated, stale, staffing };
  }, [rows]);

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-64" placeholder="Search client, BCBA…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={risk} onValueChange={(v) => setRisk(v as any)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All risk levels</SelectItem>
            <SelectItem value="watch">Watch</SelectItem>
            <SelectItem value="elevated">Elevated</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <GapCard label="Critical" value={summary.critical} tone={summary.critical ? "critical" : "muted"} />
        <GapCard label="Elevated" value={summary.elevated} tone={summary.elevated ? "elevated" : "muted"} />
        <GapCard label="Staffing gap contributing" value={summary.staffing} tone={summary.staffing ? "elevated" : "muted"} />
        <GapCard label="Stale CR data" value={summary.stale} tone={summary.stale ? "elevated" : "muted"} />
      </div>

      <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…</div>
        ) : error ? (
          <div className="p-8 text-center text-destructive">Failed to load</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No utilization records match this view.</div>
        ) : (
          filtered.map((r) => {
            const pct = utilizationPct(r.delivered_hours, r.authorized_hours);
            const factors = explainUtilization({
              risk: r.underutilization_risk,
              staffingGapHours: r.staffing_gap_hours,
              familyPattern: r.family_cancellation_pattern,
              providerPattern: r.provider_cancellation_pattern,
              factors: r.contributing_factors,
            });
            return (
              <div key={r.id} className="px-4 py-4 border-b last:border-b-0 border-border/70">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.client_identifier}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {r.assigned_bcba_name ?? "Unassigned"}
                      {r.payer ? ` · ${r.payer}` : ""}{r.state ? ` · ${r.state}` : ""}
                      {" · "}{fmt(r.period_start)} – {fmt(r.period_end)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${RISK_STYLES[r.underutilization_risk]}`}>
                      {RISK_LABELS[r.underutilization_risk]}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Trend: {TREND_LABELS[r.utilization_trend]}</span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <Metric label="Authorized" value={`${r.authorized_hours.toFixed(1)}h`} />
                  <Metric label="Scheduled" value={`${r.scheduled_hours.toFixed(1)}h`} />
                  <Metric label="Delivered" value={`${r.delivered_hours.toFixed(1)}h`} sub={`${pct}%`} />
                  <Metric label="Cancelled" value={`${r.cancelled_hours.toFixed(1)}h`} />
                  <Metric label="Remaining" value={`${r.remaining_hours.toFixed(1)}h`} />
                </div>

                {/* Utilization bar */}
                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full ${pct < 60 ? "bg-rose-400" : pct < 80 ? "bg-amber-400" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>

                {factors.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {factors.map((f, i) => (
                      <span key={i} className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                        {f}
                      </span>
                    ))}
                  </div>
                )}

                {(isStale(r.centralreach_source_date) || r.data_freshness_note) && (
                  <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {r.data_freshness_note ?? `CentralReach source last updated ${fmt(r.centralreach_source_date)}`}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function GapCard({ label, value, tone }: { label: string; value: number; tone: "critical" | "elevated" | "muted" }) {
  const toneStyles = {
    critical: "border-rose-200 bg-rose-50/70 dark:bg-rose-950/20 dark:border-rose-900",
    elevated: "border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900",
    muted: "border-border/70 bg-card",
  }[tone];
  return (
    <div className={`rounded-xl border p-4 ${toneStyles}`}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-3xl font-semibold mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium tabular-nums">
        {value}{sub && <span className="text-muted-foreground font-normal ml-1">({sub})</span>}
      </div>
    </div>
  );
}

function NewParentTrainingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateParentTrainingRecord();
  const [client, setClient] = useState("");
  const [freq, setFreq] = useState<"weekly"|"biweekly"|"monthly"|"quarterly"|"custom">("monthly");
  const [perMonth, setPerMonth] = useState(1);
  const [payer, setPayer] = useState("");
  const [state, setState] = useState("");
  const [crUrl, setCrUrl] = useState("");

  const submit = async () => {
    if (!client.trim()) { toast.error("Client identifier is required"); return; }
    try {
      await create.mutateAsync({
        client_identifier: client.trim(),
        required_frequency: freq,
        required_per_month: perMonth,
        payer: payer || null,
        state: state || null,
        centralreach_url: crUrl || null,
      });
      toast.success("Record created");
      setClient(""); setPayer(""); setState(""); setCrUrl(""); setPerMonth(1); setFreq("monthly");
      onOpenChange(false);
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New parent training record</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Client identifier</Label>
            <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="e.g. Client #4821" />
            <p className="text-[11px] text-muted-foreground mt-1">Use the CentralReach identifier — do not enter clinical narrative.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Required frequency</Label>
              <Select value={freq} onValueChange={(v) => setFreq(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sessions per month</Label>
              <Input type="number" min={1} value={perMonth} onChange={(e) => setPerMonth(parseInt(e.target.value) || 1)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Payer (optional)</Label><Input value={payer} onChange={(e) => setPayer(e.target.value)} /></div>
            <div><Label>State (optional)</Label><Input value={state} onChange={(e) => setState(e.target.value)} placeholder="GA / NC / TN…" /></div>
          </div>
          <div>
            <Label>CentralReach link</Label>
            <Input value={crUrl} onChange={(e) => setCrUrl(e.target.value)} placeholder="https://members.centralreach.com/..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />} Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}