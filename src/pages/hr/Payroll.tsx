import { useEffect, useMemo, useState } from "react";
import { useDeepLink, useConsumeDeepLink } from "@/lib/deepLink";
import { Link } from "react-router-dom";
import { Wallet, Plus, Send, Lock, CheckCircle2, Award } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  PAYROLL_RUN_STATUS_META, BONUS_STATUS_META, BONUS_TYPE_LABEL, formatMoney,
  type Employee, type EmployeeBonus, type PayrollRun, type PayrollRunStatus,
} from "@/lib/hr/types";

type BonusRow = EmployeeBonus & { employee: Pick<Employee, "id" | "first_name" | "last_name"> | null };

export default function Payroll() {
  const { hasPerm, user } = useAuth();
  const canManage = hasPerm("hr.payroll.runs.manage");
  const canSubmit = hasPerm("hr.payroll.runs.submit");
  const [tab, setTab] = useState<"runs" | "bonuses">("runs");
  const deepLink = useDeepLink();
  useConsumeDeepLink();
  useEffect(() => {
    if (deepLink.tab === "runs" || deepLink.tab === "bonuses") setTab(deepLink.tab);
    if (deepLink.action) {
      const detail = deepLink.run ? `Pay run #${deepLink.run}` : "";
      toast(`Opened from alert: ${deepLink.action}${detail ? " · " + detail : ""}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [bonuses, setBonuses] = useState<BonusRow[]>([]);
  const [loading, setLoading] = useState(true);

  // create-run dialog
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [payDate, setPayDate] = useState("");

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const [r, b] = await Promise.all([
      supabase.from("payroll_runs").select("*").order("period_start", { ascending: false }),
      supabase.from("employee_bonuses")
        .select("*, employee:employees(id, first_name, last_name)")
        .order("created_at", { ascending: false }).limit(100),
    ]);
    setRuns((r.data ?? []) as PayrollRun[]);
    setBonuses((b.data ?? []) as unknown as BonusRow[]);
    setLoading(false);
  }

  async function createRun() {
    if (!name.trim() || !start || !end) { toast.error("Name and period are required."); return; }
    const { error } = await supabase.from("payroll_runs").insert({
      name: name.trim(), period_start: start, period_end: end,
      pay_date: payDate || null, status: "open", created_by: user?.id ?? null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Payroll run created.");
    setOpen(false); setName(""); setStart(""); setEnd(""); setPayDate("");
    void load();
  }

  async function updateRun(id: string, patch: Partial<PayrollRun>) {
    const { error } = await supabase.from("payroll_runs").update(patch).eq("id", id);
    if (error) toast.error(error.message); else void load();
  }

  async function submitRun(r: PayrollRun) {
    await updateRun(r.id, {
      status: "submitted", submitted_at: new Date().toISOString(),
      submitted_by_name: "Current user",
      viventium_batch_id: `VVT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      viventium_synced_at: new Date().toISOString(),
    });
    toast.success("Submitted to Viventium (simulated).");
  }

  const totals = useMemo(() => ({
    open: runs.filter((r) => r.status === "open").length,
    submitted: runs.filter((r) => r.status === "submitted").length,
    posted: runs.filter((r) => r.status === "posted").length,
    pendingBonuses: bonuses.filter((b) => b.status === "pending_approval").length,
    bonusTotal: bonuses.filter((b) => b.status === "approved" || b.status === "paid").reduce((s, b) => s + Number(b.amount), 0),
  }), [runs, bonuses]);

  return (
    <PageShell title="Payroll" description="Pay-period runs, bonus pipeline, and Viventium sync." icon={Wallet}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPI label="Open runs" value={totals.open} />
        <KPI label="Submitted" value={totals.submitted} tone="warning" />
        <KPI label="Posted" value={totals.posted} tone="success" />
        <KPI label="Pending bonuses" value={totals.pendingBonuses} tone="warning" />
        <KPI label="Bonuses approved" value={formatMoney(totals.bonusTotal)} tone="success" />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="runs">Payroll Runs ({runs.length})</TabsTrigger>
              <TabsTrigger value="bonuses">Bonus Pipeline ({bonuses.length})</TabsTrigger>
            </TabsList>
          </Tabs>
          {tab === "runs" && canManage && (
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> New run</Button>
          )}
        </div>

        {loading ? <Skeleton className="h-40" /> : tab === "runs" ? (
          runs.length === 0 ? <p className="text-sm text-muted-foreground py-10 text-center">No payroll runs yet.</p> : (
            <div className="space-y-2">
              {runs.map((r) => (
                <div key={r.id} className="p-3 rounded-lg border border-border/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border", PAYROLL_RUN_STATUS_META[r.status].tone)}>
                          {PAYROLL_RUN_STATUS_META[r.status].label}
                        </span>
                        <p className="text-sm font-semibold text-foreground">{r.name}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {r.period_start} → {r.period_end}
                        {r.pay_date ? ` · pays ${r.pay_date}` : ""}
                        {r.viventium_batch_id ? ` · Viventium #${r.viventium_batch_id}` : ""}
                      </p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs">
                        <span className="text-muted-foreground">Hours: <span className="text-foreground tabular-nums">{Number(r.total_hours).toFixed(1)}</span></span>
                        <span className="text-muted-foreground">Gross: <span className="text-foreground tabular-nums">{formatMoney(r.total_gross)}</span></span>
                        <span className="text-muted-foreground">Employees: <span className="text-foreground tabular-nums">{r.employee_count}</span></span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {canManage && r.status === "open" && (
                        <Button size="sm" variant="outline" onClick={() => updateRun(r.id, { status: "ready" })}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark ready
                        </Button>
                      )}
                      {canSubmit && (r.status === "ready" || r.status === "open") && (
                        <Button size="sm" onClick={() => submitRun(r)}><Send className="h-3.5 w-3.5" /> Submit</Button>
                      )}
                      {canManage && r.status === "submitted" && (
                        <Button size="sm" variant="outline" onClick={() => updateRun(r.id, { status: "posted", posted_at: new Date().toISOString() })}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark posted
                        </Button>
                      )}
                      {canManage && r.status === "posted" && (
                        <Button size="sm" variant="ghost" onClick={() => updateRun(r.id, { status: "closed", closed_at: new Date().toISOString() })}>
                          <Lock className="h-3.5 w-3.5" /> Close
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          bonuses.length === 0 ? <p className="text-sm text-muted-foreground py-10 text-center">No bonuses tracked.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-3">Employee</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Amount</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Reason</th>
                    <th className="py-2 pr-3">Effective</th>
                  </tr>
                </thead>
                <tbody>
                  {bonuses.map((b) => (
                    <tr key={b.id} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="py-2 pr-3">
                        {b.employee ? (
                          <Link to={`/hr/employees/${b.employee.id}`} className="font-medium text-foreground hover:text-primary">
                            {b.employee.first_name} {b.employee.last_name}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="py-2 pr-3 text-foreground inline-flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-primary" />{BONUS_TYPE_LABEL[b.bonus_type]}</td>
                      <td className="py-2 pr-3 font-semibold text-foreground tabular-nums">{formatMoney(b.amount)}</td>
                      <td className="py-2 pr-3">
                        <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border", BONUS_STATUS_META[b.status].tone)}>
                          {BONUS_STATUS_META[b.status].label}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground truncate max-w-[24rem]">{b.reason ?? "—"}</td>
                      <td className="py-2 pr-3 tabular-nums text-muted-foreground">{b.effective_date ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New payroll run</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs text-muted-foreground">Run name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pay Period 2026-04-21" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-muted-foreground">Period start</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Period end</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
            </div>
            <div><Label className="text-xs text-muted-foreground">Pay date</Label><Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={createRun}>Create run</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function KPI({ label, value, tone }: { label: string; value: number | string; tone?: "warning" | "success" }) {
  const cls = tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-foreground";
  return (
    <Card className="p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className={cn("text-2xl font-semibold mt-1.5 tabular-nums", cls)}>{value}</p>
    </Card>
  );
}