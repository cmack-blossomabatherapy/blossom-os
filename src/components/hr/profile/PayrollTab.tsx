import { useEffect, useState } from "react";
import { DollarSign, Plus, TrendingUp, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  BONUS_STATUS_META, BONUS_TYPE_LABEL, PAY_CHANGE_KIND_LABEL, PAY_CHANGE_STATUS_META,
  formatMoney, type BonusStatus, type BonusType, type Employee, type EmployeeBonus,
  type EmployeePayChange, type PayChangeKind, type PayChangeStatus,
} from "@/lib/hr/types";

export function PayrollTab({ employee, onChange }: { employee: Employee; onChange?: () => void }) {
  const { hasPerm } = useAuth();
  const canBonuses = hasPerm("hr.bonuses.manage");
  const canPayChanges = hasPerm("hr.paychanges.manage");
  const [bonuses, setBonuses] = useState<EmployeeBonus[]>([]);
  const [pay, setPay] = useState<EmployeePayChange[]>([]);
  const [loading, setLoading] = useState(true);

  // bonus dialog
  const [bOpen, setBOpen] = useState(false);
  const [bType, setBType] = useState<BonusType>("performance");
  const [bAmount, setBAmount] = useState("");
  const [bReason, setBReason] = useState("");

  // pay change dialog
  const [pOpen, setPOpen] = useState(false);
  const [pKind, setPKind] = useState<PayChangeKind>("raise");
  const [pNewRate, setPNewRate] = useState("");
  const [pNewTitle, setPNewTitle] = useState("");
  const [pEffective, setPEffective] = useState(new Date().toISOString().slice(0, 10));
  const [pReason, setPReason] = useState("");

  useEffect(() => { void load(); }, [employee.id]);

  async function load() {
    setLoading(true);
    const [b, p] = await Promise.all([
      supabase.from("employee_bonuses").select("*").eq("employee_id", employee.id).order("created_at", { ascending: false }),
      supabase.from("employee_pay_changes").select("*").eq("employee_id", employee.id).order("effective_date", { ascending: false }),
    ]);
    setBonuses((b.data ?? []) as EmployeeBonus[]);
    setPay((p.data ?? []) as EmployeePayChange[]);
    setLoading(false);
  }

  async function createBonus() {
    const amt = parseFloat(bAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount."); return; }
    const { error } = await supabase.from("employee_bonuses").insert({
      employee_id: employee.id, bonus_type: bType, amount: amt,
      reason: bReason.trim() || null, status: "pending_approval",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Bonus added.");
    setBOpen(false); setBAmount(""); setBReason(""); setBType("performance");
    void load();
  }

  async function createPayChange() {
    const rate = parseFloat(pNewRate);
    if (!rate || rate <= 0) { toast.error("Enter a valid new rate."); return; }
    const { error } = await supabase.from("employee_pay_changes").insert({
      employee_id: employee.id, kind: pKind, status: "proposed",
      previous_rate: employee.pay_rate, new_rate: rate,
      previous_title: employee.job_title,
      new_title: pNewTitle.trim() || (pKind === "promotion" ? employee.job_title : null),
      effective_date: pEffective, reason: pReason.trim() || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Pay change proposed.");
    setPOpen(false); setPNewRate(""); setPNewTitle(""); setPReason("");
    void load();
  }

  async function updateBonus(id: string, patch: Partial<EmployeeBonus>) {
    const { error } = await supabase.from("employee_bonuses").update(patch).eq("id", id);
    if (error) toast.error(error.message); else void load();
  }
  async function updatePayChange(id: string, patch: Partial<EmployeePayChange>) {
    const { error } = await supabase.from("employee_pay_changes").update(patch).eq("id", id);
    if (error) toast.error(error.message); else void load();
  }

  async function applyPayChange(c: EmployeePayChange) {
    const { error } = await supabase.from("employees").update({
      pay_rate: c.new_rate,
      job_title: c.new_title ?? employee.job_title,
    }).eq("id", employee.id);
    if (error) { toast.error(error.message); return; }
    await updatePayChange(c.id, { status: "effective", applied_at: new Date().toISOString() });
    toast.success("Pay change applied to employee record.");
    onChange?.();
  }

  return (
    <div className="space-y-4">
      {/* Pay summary */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3"><DollarSign className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Compensation</h3></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Current rate" value={employee.pay_rate ? `$${employee.pay_rate}/hr` : "—"} />
          <Stat label="Pay type" value={employee.pay_type} />
          <Stat label="Employment" value={employee.employment_type.replace("_", " ")} />
          <Stat label="Viventium" value={employee.viventium_sync_status ?? "Not connected"} />
        </div>
      </Card>

      {/* Bonuses */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Bonuses</h3>
          {canBonuses && <Button size="sm" variant="outline" onClick={() => setBOpen(true)}><Plus className="h-3.5 w-3.5" /> Add bonus</Button>}
        </div>
        {loading ? <Skeleton className="h-20" /> : bonuses.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No bonuses on file.</p>
        ) : (
          <div className="space-y-2">
            {bonuses.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border", BONUS_STATUS_META[b.status].tone)}>
                      {BONUS_STATUS_META[b.status].label}
                    </span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{formatMoney(b.amount)}</span>
                    <span className="text-xs text-muted-foreground">{BONUS_TYPE_LABEL[b.bonus_type]}</span>
                  </div>
                  {b.reason && <p className="text-xs text-muted-foreground mt-0.5">{b.reason}</p>}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Effective {b.effective_date ?? "—"}
                    {b.approved_by_name ? ` · approved by ${b.approved_by_name}` : ""}
                  </p>
                </div>
                {canBonuses && (
                  <Select value={b.status} onValueChange={(v) => updateBonus(b.id, {
                    status: v as BonusStatus,
                    approved_at: v === "approved" || v === "paid" ? new Date().toISOString() : null,
                    paid_date: v === "paid" ? new Date().toISOString().slice(0, 10) : null,
                  })}>
                    <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending_approval">Pending Approval</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pay changes */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Pay & Title History</h3>
          {canPayChanges && <Button size="sm" variant="outline" onClick={() => setPOpen(true)}><Plus className="h-3.5 w-3.5" /> Propose change</Button>}
        </div>
        {loading ? <Skeleton className="h-20" /> : pay.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No pay changes recorded.</p>
        ) : (
          <div className="space-y-2">
            {pay.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border", PAY_CHANGE_STATUS_META[c.status].tone)}>
                      {PAY_CHANGE_STATUS_META[c.status].label}
                    </span>
                    <span className="text-sm font-medium text-foreground">{PAY_CHANGE_KIND_LABEL[c.kind]}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {c.previous_rate != null ? `$${c.previous_rate}` : "—"} → <span className="font-semibold text-foreground">${c.new_rate}</span>
                    </span>
                  </div>
                  {(c.previous_title !== c.new_title) && c.new_title && (
                    <p className="text-xs text-muted-foreground mt-0.5">{c.previous_title} → <span className="text-foreground">{c.new_title}</span></p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Effective {c.effective_date}
                    {c.reason ? ` · ${c.reason}` : ""}
                  </p>
                </div>
                {canPayChanges && c.status !== "effective" && (
                  <Button size="sm" variant="outline" onClick={() => applyPayChange(c)}>Apply now</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Bonus dialog */}
      <Dialog open={bOpen} onOpenChange={setBOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add bonus</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select value={bType} onValueChange={(v) => setBType(v as BonusType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="signing">Signing</SelectItem>
                    <SelectItem value="retention">Retention</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="spot">Spot</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Amount (USD)</Label>
                <Input type="number" step="0.01" value={bAmount} onChange={(e) => setBAmount(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Reason</Label>
              <Textarea value={bReason} onChange={(e) => setBReason(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBOpen(false)}>Cancel</Button>
            <Button onClick={createBonus}>Add bonus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay change dialog */}
      <Dialog open={pOpen} onOpenChange={setPOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Propose pay / title change</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Kind</Label>
                <Select value={pKind} onValueChange={(v) => setPKind(v as PayChangeKind)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raise">Raise</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="demotion">Demotion</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="rate_correction">Rate Correction</SelectItem>
                    <SelectItem value="title_change">Title Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">New rate ($/hr)</Label>
                <Input type="number" step="0.01" value={pNewRate} onChange={(e) => setPNewRate(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">New title (optional)</Label>
              <Input value={pNewTitle} onChange={(e) => setPNewTitle(e.target.value)} placeholder={employee.job_title} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Effective date</Label>
              <Input type="date" value={pEffective} onChange={(e) => setPEffective(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Reason</Label>
              <Textarea value={pReason} onChange={(e) => setPReason(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPOpen(false)}>Cancel</Button>
            <Button onClick={createPayChange}>Propose change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-1 capitalize">{value}</p>
    </div>
  );
}