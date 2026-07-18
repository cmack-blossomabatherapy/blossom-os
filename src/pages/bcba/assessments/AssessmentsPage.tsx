import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Plus, ExternalLink, AlertTriangle, ClipboardList } from "lucide-react";
import { useAssessments, useCreateAssessment, type Assessment } from "./useAssessments";
import {
  ASSESSMENT_STATUS_LABELS,
  ASSESSMENT_STATUS_ORDER,
  ASSESSMENT_STATUS_STYLES,
  daysBetween,
  type AssessmentStatus,
} from "./pipeline";
import AssessmentDetailDrawer from "./AssessmentDetailDrawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return "—"; }
}

function StatusPill({ status }: { status: AssessmentStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ASSESSMENT_STATUS_STYLES[status]}`}>
      {ASSESSMENT_STATUS_LABELS[status]}
    </span>
  );
}

export default function AssessmentsPage() {
  const [params, setParams] = useSearchParams();
  const { data: rows = [], isLoading, error, refetch, isFetching } = useAssessments();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssessmentStatus | "all">("all");
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [showNew, setShowNew] = useState(false);

  const selectedId = params.get("id");
  const setSelected = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("id", id); else next.delete("id");
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (scope === "mine" && !r.assigned_bcba_id) return false;
      if (q) {
        const s = q.toLowerCase();
        if (![r.client_identifier, r.assigned_bcba_name, r.qa_reviewer_name, r.next_action, r.missing_item]
          .some((v) => (v ?? "").toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [rows, statusFilter, scope, q]);

  const counts = useMemo(() => {
    const c: Partial<Record<AssessmentStatus, number>> = {};
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const backlog = useMemo(() => {
    return rows.filter((r) => {
      const days = daysBetween(r.status_entered_at);
      return days >= 14 && !["completed_final", "cancelled", "on_hold"].includes(r.status);
    }).length;
  }, [rows]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Assessment & Treatment Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            One pipeline from assignment through authorization. Clinical content of record lives in CentralReach.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8 w-64" placeholder="Search client, BCBA, QA…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
          </Button>
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> New assessment
          </Button>
        </div>
      </div>

      {/* Leadership backlog card */}
      {backlog > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900 p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div className="text-sm">
            <span className="font-medium">{backlog}</span> assessments have been in their current stage 14+ days.
          </div>
        </div>
      )}

      {/* Pipeline roll-up */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {ASSESSMENT_STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter((cur) => (cur === s ? "all" : s))}
            className={`text-left rounded-xl border p-3 transition ${
              statusFilter === s ? "border-primary bg-primary/5" : "border-border/70 bg-card hover:border-border"
            }`}
          >
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground leading-tight">
              {ASSESSMENT_STATUS_LABELS[s]}
            </div>
            <div className="text-2xl font-semibold mt-1">{counts[s] ?? 0}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Select value={scope} onValueChange={(v) => setScope(v as "all" | "mine")}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All BCBAs</SelectItem>
            <SelectItem value="mine">My assessments</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AssessmentStatus | "all")}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {ASSESSMENT_STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>{ASSESSMENT_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {rows.length}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
        <div className="grid grid-cols-[minmax(180px,1.4fr)_1fr_1fr_100px_100px_130px_120px] gap-3 px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground border-b border-border/70 bg-muted/30">
          <div>Client</div>
          <div>BCBA / QA</div>
          <div>Next action / missing</div>
          <div>Due</div>
          <div>Days in stage</div>
          <div>Status</div>
          <div className="text-right">Links</div>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…</div>
        ) : error ? (
          <div className="p-8 text-center text-destructive">Failed to load</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <ClipboardList className="h-6 w-6 mx-auto mb-2 opacity-60" />
            No assessments in this view.
          </div>
        ) : (
          filtered.map((r) => <Row key={r.id} r={r} onOpen={() => setSelected(r.id)} />)
        )}
      </div>

      <AssessmentDetailDrawer id={selectedId} onClose={() => setSelected(null)} />
      <NewAssessmentDialog open={showNew} onOpenChange={setShowNew} />
    </div>
  );
}

function Row({ r, onOpen }: { r: Assessment; onOpen: () => void }) {
  const days = daysBetween(r.status_entered_at);
  const overdue = r.due_date && new Date(r.due_date) < new Date() && !["completed_final","cancelled"].includes(r.status);
  return (
    <button
      onClick={onOpen}
      className="w-full text-left grid grid-cols-[minmax(180px,1.4fr)_1fr_1fr_100px_100px_130px_120px] gap-3 px-4 py-3 border-b last:border-b-0 border-border/70 hover:bg-muted/40 transition"
    >
      <div className="min-w-0">
        <div className="font-medium truncate">{r.client_identifier}</div>
        <div className="text-xs text-muted-foreground truncate">{r.assessment_type}</div>
      </div>
      <div className="min-w-0 text-sm">
        <div className="truncate">{r.assigned_bcba_name ?? <span className="text-muted-foreground">Unassigned</span>}</div>
        <div className="text-xs text-muted-foreground truncate">QA: {r.qa_reviewer_name ?? "—"}</div>
      </div>
      <div className="min-w-0 text-sm">
        <div className="truncate">{r.next_action ?? <span className="text-muted-foreground">No next action</span>}</div>
        {r.missing_item && <div className="text-xs text-amber-600 dark:text-amber-400 truncate">Missing: {r.missing_item}</div>}
      </div>
      <div className={`text-sm ${overdue ? "text-destructive font-medium" : ""}`}>{fmtDate(r.due_date)}</div>
      <div className="text-sm">{days}d</div>
      <div><StatusPill status={r.status} /></div>
      <div className="flex items-center justify-end gap-2 text-muted-foreground">
        {r.centralreach_client_url && (
          <a href={r.centralreach_client_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} title="CentralReach">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </button>
  );
}

function NewAssessmentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateAssessment();
  const [clientIdentifier, setClientIdentifier] = useState("");
  const [type, setType] = useState("initial");
  const [dueDate, setDueDate] = useState("");
  const [crUrl, setCrUrl] = useState("");

  const submit = async () => {
    if (!clientIdentifier.trim()) { toast.error("Client identifier required"); return; }
    try {
      await create.mutateAsync({
        client_identifier: clientIdentifier.trim(),
        assessment_type: type,
        due_date: dueDate || null,
        centralreach_client_url: crUrl || null,
        status: "assigned",
      });
      toast.success("Assessment created");
      setClientIdentifier(""); setDueDate(""); setCrUrl("");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New assessment</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Client identifier</Label>
            <Input value={clientIdentifier} onChange={(e) => setClientIdentifier(e.target.value)} placeholder="e.g. Client #4821 or CR ID" />
            <p className="text-[11px] text-muted-foreground mt-1">Use the CentralReach identifier — do not enter clinical narrative.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="initial">Initial</SelectItem>
                  <SelectItem value="reassessment">Reassessment</SelectItem>
                  <SelectItem value="renewal">Renewal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
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