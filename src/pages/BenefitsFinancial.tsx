import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDollarSign, Clock, FileCheck2, ShieldAlert, TrendingUp, Wallet, XCircle } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useLeads } from "@/contexts/LeadsContext";
import { Lead, FinancialStatus } from "@/data/leads";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const financialStages = [
  { label: "VOB Pending", filter: (lead: Lead) => lead.status === "Sent to VOB" && lead.vobStatus === "Sent" },
  { label: "Under Review", filter: (lead: Lead) => lead.vobStatus === "Received" && lead.financialStatus === "Pending Review" },
  { label: "Payment Plan Needed", filter: (lead: Lead) => lead.financialStatus === "Payment Plan Required" },
  { label: "Approved", filter: (lead: Lead) => lead.financialStatus === "Approved" || lead.paymentPlanSigned },
  { label: "Rejected", filter: (lead: Lead) => lead.financialStatus === "Not Viable" || lead.status === "Non-Qualified" || lead.status === "Non-qualified Lead" },
];

const statusVariant = (status: FinancialStatus | string) =>
  status === "Approved" ? "success" : status === "Payment Plan Required" ? "warning" : status === "Not Viable" ? "destructive" : "info";

const getRisk = (lead: Lead) => {
  if (lead.financialStatus === "Not Viable" || (!lead.inNetwork && !lead.outOfNetwork)) return { label: "HIGH RISK", tone: "destructive", message: "Recommend rejection" };
  if (lead.insurance.toLowerCase().includes("medicaid")) return { label: "LOW RISK", tone: "success", message: "Medicaid case: auto-approve" };
  if (lead.deductibleRemaining > 10000 || lead.coinsurancePercent >= 35 || lead.outOfNetwork) return { label: "WATCH", tone: "warning", message: "Recommend payment plan" };
  return { label: "VIABLE", tone: "success", message: "Recommend approval" };
};

const getAlert = (lead: Lead) => {
  if (lead.status === "Sent to VOB" && lead.daysInStage >= 3 && lead.vobStatus === "Sent") return "VOB not received after 3 days";
  if (lead.deductibleRemaining > 10000) return "High deductible over 10k";
  if (lead.financialStatus === "Payment Plan Required" && !lead.paymentPlanSigned) return "Payment plan not signed";
  if (lead.financialStatus === "Pending Review" && lead.daysInFinancialStage > 2) return "Financial decision pending";
  if (lead.financialStatus === "Not Viable") return "Case not viable";
  return null;
};

export default function BenefitsFinancial() {
  const { leads, updateLead } = useLeads();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const financialLeads = useMemo(() => leads.filter((lead) => ["Sent to VOB", "VOB Completed", "Non-Qualified", "Non-qualified Lead"].includes(lead.status) || lead.financialStatus !== "Pending Review" || lead.vobStatus !== "Not Started"), [leads]);
  const selectedLead = financialLeads.find((lead) => lead.id === selectedId) ?? financialLeads[0];

  const metrics = useMemo(() => {
    const decided = financialLeads.filter((lead) => ["Approved", "Payment Plan Required", "Not Viable"].includes(lead.financialStatus));
    const pct = (count: number) => decided.length ? Math.round((count / decided.length) * 100) : 0;
    const avg = (values: number[]) => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    return {
      approvedPct: pct(decided.filter((lead) => lead.financialStatus === "Approved" || lead.paymentPlanSigned).length),
      paymentPlanPct: pct(decided.filter((lead) => lead.financialStatus === "Payment Plan Required").length),
      rejectedPct: pct(decided.filter((lead) => lead.financialStatus === "Not Viable").length),
      avgRevenue: avg(financialLeads.map((lead) => lead.estimatedMonthlyRevenue).filter(Boolean)),
      avgDeductible: avg(financialLeads.map((lead) => lead.deductibleRemaining).filter(Boolean)),
      avgCoinsurance: avg(financialLeads.map((lead) => lead.coinsurancePercent).filter(Boolean)),
    };
  }, [financialLeads]);

  const decide = (lead: Lead, financialStatus: FinancialStatus, notes: string) => {
    updateLead(lead.id, { financialStatus, financialDecisionNotes: notes });
    toast.success(`Financial decision: ${financialStatus}`, { description: lead.childName });
  };

  return (
    <PageShell title="Benefits & Financial" description="Profitability gate from VOB through client conversion readiness" icon={Wallet}>
      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Metric label="Approved Cases" value={`${metrics.approvedPct}%`} icon={CheckCircle2} />
        <Metric label="Payment Plans" value={`${metrics.paymentPlanPct}%`} icon={CircleDollarSign} />
        <Metric label="Rejected Cases" value={`${metrics.rejectedPct}%`} icon={XCircle} />
        <Metric label="Avg Revenue" value={currency.format(metrics.avgRevenue)} icon={TrendingUp} />
        <Metric label="Avg Deductible" value={currency.format(metrics.avgDeductible)} icon={ShieldAlert} />
        <Metric label="Avg Coinsurance" value={`${metrics.avgCoinsurance}%`} icon={FileCheck2} />
      </section>

      <section className="grid gap-3 xl:grid-cols-5">
        {financialStages.map((stage) => {
          const rows = financialLeads.filter(stage.filter);
          return (
            <div key={stage.label} className="rounded-lg border border-border/60 bg-card">
              <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                <h2 className="text-xs font-semibold text-foreground">{stage.label}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{rows.length}</span>
              </div>
              <div className="min-h-[180px] space-y-2 p-2">
                {rows.map((lead) => {
                  const alert = getAlert(lead);
                  return (
                    <button key={lead.id} onClick={() => setSelectedId(lead.id)} className={cn("w-full rounded-md border border-border/60 bg-background p-3 text-left transition-colors hover:bg-muted/40", selectedLead?.id === lead.id && "border-primary/40 bg-primary/5")}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{lead.childName}</p>
                        <StatusBadge status={lead.financialStatus} variant={statusVariant(lead.financialStatus)} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{lead.insurance} · {currency.format(lead.estimatedMonthlyRevenue)}/mo</p>
                      {alert && <p className="mt-2 flex items-center gap-1 text-[11px] text-destructive"><AlertTriangle className="h-3 w-3" />{alert}</p>}
                    </button>
                  );
                })}
                {rows.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">No cases</p>}
              </div>
            </div>
          );
        })}
      </section>

      {selectedLead && <FinancialReviewCard lead={selectedLead} onUpdate={(patch) => updateLead(selectedLead.id, patch)} onDecide={decide} />}
    </PageShell>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Wallet }) {
  return <div className="rounded-lg border border-border/60 bg-card p-4"><div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div><p className="text-xl font-semibold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>;
}

function FinancialReviewCard({ lead, onUpdate, onDecide }: { lead: Lead; onUpdate: (patch: Partial<Lead>) => void; onDecide: (lead: Lead, status: FinancialStatus, notes: string) => void }) {
  const risk = getRisk(lead);
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="rounded-lg border border-border/60 bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-lg font-semibold text-foreground">{lead.childName} · Financial Review</h2><p className="text-sm text-muted-foreground">Owner: {lead.financialOwner} · Parent: {lead.parentName}</p></div>
          <StatusBadge status={risk.label} variant={risk.tone as never} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Primary Insurance" value={lead.primaryInsurance || lead.insurance} onChange={(v) => onUpdate({ primaryInsurance: v, insurance: v })} />
          <Field label="Secondary Insurance" value={lead.secondaryInsurance ?? ""} onChange={(v) => onUpdate({ secondaryInsurance: v })} />
          <NumberField label="Deductible Remaining" value={lead.deductibleRemaining} onChange={(v) => onUpdate({ deductibleRemaining: v })} />
          <NumberField label="Coinsurance %" value={lead.coinsurancePercent} onChange={(v) => onUpdate({ coinsurancePercent: v })} />
          <NumberField label="Copay" value={lead.copay} onChange={(v) => onUpdate({ copay: v })} />
          <NumberField label="Max OOP" value={lead.maxOutOfPocket} onChange={(v) => onUpdate({ maxOutOfPocket: v })} />
          <NumberField label="Weekly Hours" value={lead.expectedWeeklyHours} onChange={(v) => onUpdate({ expectedWeeklyHours: v, estimatedMonthlyRevenue: Math.round(v * 4 * 80) })} />
          <NumberField label="Monthly Revenue" value={lead.estimatedMonthlyRevenue} onChange={(v) => onUpdate({ estimatedMonthlyRevenue: v })} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Toggle label="In Network" active={lead.inNetwork} onClick={() => onUpdate({ inNetwork: !lead.inNetwork, outOfNetwork: lead.inNetwork ? lead.outOfNetwork : false })} />
          <Toggle label="Out of Network" active={lead.outOfNetwork} onClick={() => onUpdate({ outOfNetwork: !lead.outOfNetwork, inNetwork: lead.outOfNetwork ? lead.inNetwork : false })} />
          <Toggle label="Payment Plan Sent" active={lead.paymentPlanSent} onClick={() => onUpdate({ paymentPlanSent: !lead.paymentPlanSent })} />
          <Toggle label="Payment Plan Signed" active={lead.paymentPlanSigned} onClick={() => onUpdate({ paymentPlanSigned: !lead.paymentPlanSigned })} />
        </div>
      </div>
      <aside className="rounded-lg border border-border/60 bg-card p-5">
        <div className="rounded-md border border-border/60 bg-background p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Decision support</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{risk.message}</p>
          <p className="mt-2 text-sm text-muted-foreground">Coverage {lead.estimatedInsuranceCoveragePercent}% · Client responsibility {currency.format(lead.estimatedClientResponsibility)} · {lead.daysInFinancialStage} days in finance</p>
        </div>
        <div className="mt-4 space-y-2">
          <Button className="w-full justify-start" onClick={() => onDecide(lead, "Approved", "Approved by Gabi: financially viable.")}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => onDecide(lead, "Payment Plan Required", "Payment plan required due to client responsibility.")}><CircleDollarSign className="mr-2 h-4 w-4" />Payment Plan</Button>
          <Button variant="destructive" className="w-full justify-start" onClick={() => onDecide(lead, "Not Viable", "Rejected: financial risk not serviceable.")}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
        </div>
        <div className="mt-4 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground"><Clock className="mb-2 h-4 w-4" />Only approved cases or signed payment plans should move into the client pipeline.</div>
      </aside>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="space-y-1"><span className="text-xs text-muted-foreground">{label}</span><Input value={value} onChange={(event) => onChange(event.target.value)} className="h-9" /></label>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="space-y-1"><span className="text-xs text-muted-foreground">{label}</span><Input type="number" value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} className="h-9" /></label>;
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={cn("rounded-md border px-3 py-1.5 text-xs font-medium transition-colors", active ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-muted/40")}>{label}</button>;
}
