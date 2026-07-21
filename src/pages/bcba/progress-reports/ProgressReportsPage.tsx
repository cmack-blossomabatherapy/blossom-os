import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Search, Plus, AlertTriangle, ClipboardList, Settings2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  useProgressReports,
  useCreateProgressReport,
  useMilestones,
  matchMilestone,
  type ProgressReport,
} from "./useProgressReports";
import {
  REPORT_STATUS_LABELS,
  REPORT_STATUS_ORDER,
  REPORT_STATUS_STYLES,
  RISK_LABELS,
  RISK_STYLES,
  daysUntil,
  dueDateLanguage,
  isStale,
  type ProgressReportStatus,
  type RiskLevel,
} from "./pipeline";
import ProgressReportDetailDrawer from "./ProgressReportDetailDrawer";
import MilestoneConfigDialog from "./MilestoneConfigDialog";
import { useBcbaIdentity } from "../useBcbaIdentity";
import { BcbaPreviewBanner } from "../BcbaPreviewBanner";
import { BcbaMappingDiagnostic } from "../BcbaMappingDiagnostic";

function fmt(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return "—"; }
}

function StatusPill({ status }: { status: ProgressReportStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${REPORT_STATUS_STYLES[status]}`}>
      {REPORT_STATUS_LABELS[status]}
    </span>
  );
}

function RiskPill({ risk }: { risk: RiskLevel }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${RISK_STYLES[risk]}`}>
      {RISK_LABELS[risk]}
    </span>
  );
}

export default function ProgressReportsPage() {
  const [params, setParams] = useSearchParams();
  const identity = useBcbaIdentity();
  const readOnly = identity.readOnly;
  const [scope, setScope] = useState<"all" | "mine">("all");
  const { data: rows = [], isLoading, error, refetch, isFetching } = useProgressReports({
    onlyMine: scope === "mine",
    scopedAuthUserId: identity.scopedAuthUserId,
  });
  const { data: milestones = [] } = useMilestones();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProgressReportStatus | "all">("all");
  const [showNew, setShowNew] = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);

  const selectedId = params.get("id");
  const setSelected = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("id", id); else next.delete("id");
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.report_status !== statusFilter) return false;
      if (scope === "mine" && identity.scopedAuthUserId && r.assigned_bcba_id !== identity.scopedAuthUserId) return false;
      if (q) {
        const s = q.toLowerCase();
        if (![r.client_identifier, r.assigned_bcba_name, r.authorization_owner_name, r.payer, r.state]
          .some((v) => (v ?? "").toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [rows, statusFilter, scope, q, identity.scopedAuthUserId]);

  const counts = useMemo(() => {
    const c: Partial<Record<ProgressReportStatus, number>> = {};
    for (const r of rows) c[r.report_status] = (c[r.report_status] ?? 0) + 1;
    return c;
  }, [rows]);

  const summary = useMemo(() => {
    let critical = 0, elevated = 0, staleCount = 0, overdue = 0;
    for (const r of rows) {
      const dr = daysUntil(r.progress_report_due_date);
      const m = matchMilestone(dr, milestones, r.payer, r.state);
      const risk = m?.risk_level ?? r.current_risk;
      if (risk === "critical") critical++;
      else if (risk === "elevated") elevated++;
      if (isStale(r.centralreach_source_date)) staleCount++;
      if (dr !== null && dr < 0) overdue++;
    }
    return { critical, elevated, staleCount, overdue };
  }, [rows, milestones]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <BcbaPreviewBanner />
      <div className="mb-4"><BcbaMappingDiagnostic onRetry={() => refetch()} /></div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Progress Reports & Authorization Readiness</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Early warnings for upcoming reports so authorization continuity stays protected.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8 w-64" placeholder="Search client, BCBA, payer…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowMilestones(true)}>
            <Settings2 className="h-4 w-4 mr-1" /> Milestones
          </Button>
          <Button size="sm" onClick={() => setShowNew(true)} disabled={readOnly} title={readOnly ? "Preview mode — writes disabled" : undefined}>
            <Plus className="h-4 w-4 mr-1" /> New report
          </Button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Critical risk" value={summary.critical} tone="critical" />
        <SummaryCard label="Elevated" value={summary.elevated} tone="elevated" />
        <SummaryCard label="Overdue" value={summary.overdue} tone={summary.overdue ? "critical" : "muted"} />
        <SummaryCard label="Stale CentralReach data" value={summary.staleCount} tone={summary.staleCount ? "elevated" : "muted"} />
      </div>

      {/* Pipeline roll-up */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {REPORT_STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter((cur) => (cur === s ? "all" : s))}
            className={`text-left rounded-xl border p-3 transition ${
              statusFilter === s ? "border-primary bg-primary/5" : "border-border/70 bg-card hover:border-border"
            }`}
          >
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground leading-tight">
              {REPORT_STATUS_LABELS[s]}
            </div>
            <div className="text-2xl font-semibold mt-1">{counts[s] ?? 0}</div>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-3">
        <Select value={scope} onValueChange={(v) => setScope(v as "all" | "mine")}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All BCBAs</SelectItem>
            <SelectItem value="mine">My reports</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProgressReportStatus | "all")}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {REPORT_STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>{REPORT_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {rows.length}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
        <div className="grid grid-cols-[minmax(180px,1.4fr)_1fr_1fr_130px_130px_140px_90px] gap-3 px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground border-b border-border/70 bg-muted/30">
          <div>Client</div>
          <div>BCBA / Auth owner</div>
          <div>Message</div>
          <div>Due</div>
          <div>Auth expires</div>
          <div>Status</div>
          <div className="text-right">Risk</div>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…</div>
        ) : error ? (
          <div className="p-8 text-center text-destructive">Failed to load</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <ClipboardList className="h-6 w-6 mx-auto mb-2 opacity-60" />
            No progress reports in this view. You’re all caught up.
          </div>
        ) : (
          filtered.map((r) => {
            const dr = daysUntil(r.progress_report_due_date);
            const m = matchMilestone(dr, milestones, r.payer, r.state);
            const risk: RiskLevel = m?.risk_level ?? r.current_risk;
            const message = m?.employee_message ?? dueDateLanguage(dr);
            const stale = isStale(r.centralreach_source_date);
            const overdue = dr !== null && dr < 0;
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                className="w-full text-left grid grid-cols-[minmax(180px,1.4fr)_1fr_1fr_130px_130px_140px_90px] gap-3 px-4 py-3 border-b last:border-b-0 border-border/70 hover:bg-muted/40 transition"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.client_identifier}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.payer ?? "—"}{r.state ? ` · ${r.state}` : ""}
                  </div>
                  {stale && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Stale CR data
                    </div>
                  )}
                </div>
                <div className="min-w-0 text-sm">
                  <div className="truncate">{r.assigned_bcba_name ?? <span className="text-muted-foreground">Unassigned BCBA</span>}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    Auth: {r.authorization_owner_name ?? "—"}
                  </div>
                </div>
                <div className="min-w-0 text-sm text-muted-foreground truncate">{message}</div>
                <div className={`text-sm ${overdue ? "text-destructive font-medium" : ""}`}>
                  <div>{fmt(r.progress_report_due_date)}</div>
                  <div className="text-[11px] text-muted-foreground">{dueDateLanguage(dr)}</div>
                </div>
                <div className="text-sm">{fmt(r.authorization_expiration)}</div>
                <div><StatusPill status={r.report_status} /></div>
                <div className="flex items-center justify-end"><RiskPill risk={risk} /></div>
              </button>
            );
          })
        )}
      </div>

      <ProgressReportDetailDrawer id={selectedId} onClose={() => setSelected(null)} readOnly={readOnly} />
      <NewProgressReportDialog open={showNew} onOpenChange={setShowNew} />
      <MilestoneConfigDialog open={showMilestones} onOpenChange={setShowMilestones} />
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "critical" | "elevated" | "muted" }) {
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

function NewProgressReportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateProgressReport();
  const [client, setClient] = useState("");
  const [expiration, setExpiration] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [payer, setPayer] = useState("");
  const [state, setState] = useState("");
  const [crUrl, setCrUrl] = useState("");

  const submit = async () => {
    if (!client.trim() || !expiration || !dueDate) {
      toast.error("Client, authorization expiration and due date are required");
      return;
    }
    try {
      await create.mutateAsync({
        client_identifier: client.trim(),
        authorization_expiration: expiration,
        progress_report_due_date: dueDate,
        payer: payer || null,
        state: state || null,
        centralreach_url: crUrl || null,
      });
      toast.success("Progress report created");
      setClient(""); setExpiration(""); setDueDate(""); setPayer(""); setState(""); setCrUrl("");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New progress report</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Client identifier</Label>
            <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="e.g. Client #4821 or CR ID" />
            <p className="text-[11px] text-muted-foreground mt-1">Use the CentralReach identifier — do not enter clinical narrative.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Authorization expires</Label>
              <Input type="date" value={expiration} onChange={(e) => setExpiration(e.target.value)} />
            </div>
            <div>
              <Label>Report due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Payer (optional)</Label>
              <Input value={payer} onChange={(e) => setPayer(e.target.value)} />
            </div>
            <div>
              <Label>State (optional)</Label>
              <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="GA / NC / TN…" />
            </div>
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

// Small exported inline link so drawer can render CR icon consistently.
export function CrLink({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
      Open in CentralReach <ExternalLink className="h-3 w-3" />
    </a>
  );
}