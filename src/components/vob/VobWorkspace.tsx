import { useState } from "react";
import {
  Users, ShieldCheck, Briefcase, Wallet, MessageSquare, StickyNote,
  CheckCircle2, AlertTriangle, XCircle, HelpCircle, CreditCard, ShieldOff,
  Send, Mail, Phone, FileText, ArrowRight, Sparkles, ArrowRightCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  intelFor, paymentPlanStatus,
  type DecisionType, type Tone, type VobReview,
} from "@/lib/vob/mockData";

const TONE_PILL: Record<Tone, string> = {
  ok:   "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
  warn: "bg-amber-50 text-amber-700 ring-amber-200/70",
  crit: "bg-rose-50 text-rose-700 ring-rose-200/70",
};
const TONE_LABEL: Record<Tone, string> = { ok: "Healthy", warn: "Review", crit: "High Risk" };

/**
 * Decision Recommendation Engine.
 * Surfaces the operationally-correct next step based on real benefit + payor signals.
 * Kept rule-based and explainable — Intake should be able to read WHY.
 */
function recommendDecision(review: VobReview): {
  decision: DecisionType;
  label: string;
  why: string;
  tone: Tone;
} {
  const oonBlocked = review.innOon === "OON" && review.oonCoverage === "none";
  const remainingDeductible = Math.max(0, review.deductible - review.deductibleMet);
  const isMedicaid = /medicaid/i.test(review.payor);

  if (oonBlocked) {
    return {
      decision: "no_oon",
      label: "Cannot service — no OON benefits",
      why: `${review.payor} is out-of-network with no OON coverage. Notify the family and close the case respectfully.`,
      tone: "crit",
    };
  }
  if (review.payorCategory === "red") {
    return {
      decision: "finance_review",
      label: "Send to Finance review",
      why: `${review.payor} has a poor reimbursement history in ${review.state}. Finance should confirm before we commit staffing.`,
      tone: "crit",
    };
  }
  if (review.status === "needs_info") {
    return {
      decision: "needs_info",
      label: "Request missing information",
      why: "Benefits or family-side info is incomplete. Send the missing-info request before deciding.",
      tone: "warn",
    };
  }
  if (remainingDeductible >= 5000 || review.coinsurance >= 30 || review.estFamilyResponsibility >= 4000) {
    return {
      decision: "approve_payment_plan",
      label: "Approve with payment plan",
      why: `Remaining deductible $${remainingDeductible.toLocaleString()} · coinsurance ${review.coinsurance}% · est. family responsibility $${review.estFamilyResponsibility.toLocaleString()}. Offer a payment plan before service start.`,
      tone: "warn",
    };
  }
  if (review.operationalRisk === "crit" || review.bcbaAvailability === "none" || review.rbtAvailability === "none") {
    return {
      decision: "finance_review",
      label: "Operational review needed",
      why: "Staffing or operational risk is too high in this market right now. Loop in State Director before approving.",
      tone: "warn",
    };
  }
  if (isMedicaid || (review.payorCategory === "green" && remainingDeductible < 2500)) {
    return {
      decision: "approve",
      label: "Approve and move to Clients",
      why: `${isMedicaid ? "Medicaid pathway is straightforward." : `${review.payor} is a strong payor in ${review.state}.`} Benefits look workable — move this family into Clients.`,
      tone: "ok",
    };
  }
  return {
    decision: "approve",
    label: "Likely approvable",
    why: "Benefits look workable. Confirm staffing, then approve and hand off to Clients.",
    tone: "ok",
  };
}

const RECO_STYLES: Record<Tone, { wrap: string; chip: string; icon: string }> = {
  ok:   { wrap: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white", chip: "bg-emerald-600 text-white",  icon: "text-emerald-600" },
  warn: { wrap: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",     chip: "bg-amber-500 text-white",    icon: "text-amber-600"   },
  crit: { wrap: "border-rose-200 bg-gradient-to-br from-rose-50 to-white",       chip: "bg-rose-600 text-white",     icon: "text-rose-600"    },
};

function Section({
  icon: Icon, title, subtitle, children, accent,
}: {
  icon: React.ElementType; title: string; subtitle?: string; children: React.ReactNode; accent?: Tone;
}) {
  return (
    <section className="rounded-2xl border border-border/50 bg-card/80 p-4 backdrop-blur">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-[hsl(265_85%_96%)] text-[hsl(265_70%_45%)]">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-[13px] font-semibold tracking-tight">{title}</h3>
            {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {accent && (
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ring-1",
            TONE_PILL[accent],
          )}>
            {TONE_LABEL[accent]}
          </span>
        )}
      </header>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-[13px] font-semibold tracking-tight", mono && "tabular-nums")}>{value}</p>
    </div>
  );
}

const DECISIONS: { id: DecisionType; label: string; icon: React.ElementType; tone: Tone; primary?: boolean }[] = [
  { id: "approve",              label: "Approve",                    icon: CheckCircle2, tone: "ok",   primary: true },
  { id: "approve_payment_plan", label: "Approve w/ Payment Plan",    icon: CreditCard,   tone: "warn" },
  { id: "finance_review",       label: "Send to Finance Review",     icon: Wallet,       tone: "warn" },
  { id: "needs_info",           label: "Needs More Information",     icon: HelpCircle,   tone: "warn" },
  { id: "no_oon",               label: "No OON Benefits",            icon: ShieldOff,    tone: "crit" },
  { id: "decline",              label: "Decline / Flake",            icon: XCircle,      tone: "crit" },
];

export function VobWorkspace({ review }: { review: VobReview }) {
  const [decision, setDecision] = useState<DecisionType | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const intel = intelFor(review.payor, review.state);
  const plan = paymentPlanStatus(review);
  const reco = recommendDecision(review);
  const recoStyle = RECO_STYLES[reco.tone];

  const insuranceTone: Tone =
    review.oonCoverage === "none" && review.innOon === "OON" ? "crit" :
    review.deductible > 5000 || review.coinsurance >= 30 ? "warn" : "ok";

  function submitDecision() {
    if (!decision) return;
    const label = DECISIONS.find(d => d.id === decision)?.label ?? "Decision";
    toast.success(`${label} · ${review.parentName}`, { description: reason || "Saved to case timeline." });
    setDecision(null);
    setReason("");
  }

  function addNote() {
    if (!note.trim()) return;
    toast.success("Internal note added");
    setNote("");
  }

  return (
    <div className="space-y-4 pb-24">
      {/* ============ 0. NEXT BEST ACTION ============ */}
      <section className={cn(
        "os-rise rounded-2xl border p-4 shadow-[0_18px_40px_-28px_hsl(220_60%_40%/0.25)]",
        recoStyle.wrap,
      )}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className={cn("grid h-9 w-9 place-items-center rounded-xl bg-white shadow-sm", recoStyle.icon)}>
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                What should happen next
              </p>
              <p className="mt-0.5 text-[15px] font-semibold tracking-tight">{reco.label}</p>
              <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground max-w-2xl">{reco.why}</p>
            </div>
          </div>
          <Button
            size="sm"
            className={cn("shrink-0", recoStyle.chip, "hover:opacity-90")}
            onClick={() => setDecision(reco.decision)}
          >
            Apply recommendation <ArrowRightCircle className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </section>

      {/* ============ 1. CLIENT OVERVIEW ============ */}
      <Section icon={Users} title="Client overview" subtitle="Family, services, and intake context.">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
          <Field label="Parent" value={review.parentName} />
          <Field label="Child" value={`${review.childName} (${review.childAge})`} />
          <Field label="State" value={review.state} />
          <Field label="Requested Hrs/Wk" value={review.requestedHours} mono />
          <Field label="Services" value={review.requestedServices.join(", ")} />
          <Field label="Intake Coordinator" value={review.intakeCoordinator} />
          <Field label="State Director" value={review.stateDirector} />
          <Field label="Assigned Reviewer" value={review.assignedReviewer} />
        </div>
      </Section>

      {/* ============ 2. INSURANCE OVERVIEW ============ */}
      <Section icon={ShieldCheck} title="Insurance overview" subtitle="Plan, benefits, and OON coverage." accent={insuranceTone}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
          <Field label="Payor" value={review.payor} />
          <Field label="Plan Type" value={`${review.planType} · ${review.innOon}`} />
          <Field label="Deductible" value={`$${review.deductible.toLocaleString()}`} mono />
          <Field label="Deductible Met" value={`$${review.deductibleMet.toLocaleString()}`} mono />
          <Field label="Coinsurance" value={`${review.coinsurance}%`} mono />
          <Field label="Copay" value={`$${review.copay}`} mono />
          <Field label="MOOP" value={`$${review.moop.toLocaleString()}`} mono />
          <Field label="OON Coverage" value={
            review.oonCoverage === "covered" ? "Covered" :
            review.oonCoverage === "limited" ? "Limited" : "None"
          } />
        </div>
      </Section>

      {/* ============ 3. PAYOR INTELLIGENCE ============ */}
      <Section icon={ShieldCheck} title="Payor intelligence" subtitle="Historical reimbursement, staffing, and finance notes.">
        <div className={cn(
          "rounded-xl border p-3.5",
          intel?.category === "green"  && "border-emerald-200 bg-emerald-50/60",
          intel?.category === "yellow" && "border-amber-200 bg-amber-50/60",
          intel?.category === "red"    && "border-rose-200 bg-rose-50/60",
          !intel && "border-border/50 bg-secondary/30",
        )}>
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold tracking-tight">
              {review.payor} · {review.state}
            </p>
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]",
              intel?.category === "green"  && "bg-emerald-600 text-white",
              intel?.category === "yellow" && "bg-amber-500 text-white",
              intel?.category === "red"    && "bg-rose-600 text-white",
              !intel && "bg-muted text-muted-foreground",
            )}>
              {intel?.category === "green"  ? "Hard Yes" :
               intel?.category === "yellow" ? "Mid-tier" :
               intel?.category === "red"    ? "Hard No" : "Unknown"}
            </span>
          </div>
          <dl className="mt-3 space-y-2 text-[12px]">
            <div>
              <dt className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Reimbursement</dt>
              <dd>{intel?.reimbursement ?? "No historical data for this payor in this state."}</dd>
            </div>
            <div>
              <dt className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Staffing</dt>
              <dd>{intel?.staffing ?? "Confirm credentialing posture before staffing."}</dd>
            </div>
            <div>
              <dt className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Finance</dt>
              <dd>{intel?.finance ?? "Finance review recommended."}</dd>
            </div>
          </dl>
        </div>
      </Section>

      {/* ============ 4. OPERATIONAL FEASIBILITY ============ */}
      <Section icon={Briefcase} title="Operational feasibility" subtitle="Can this state realistically support this case?" accent={review.operationalRisk}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
          <Field label="BCBA Availability" value={review.bcbaAvailability === "open" ? "Open" : review.bcbaAvailability === "tight" ? "Tight" : "None"} />
          <Field label="RBT Availability" value={review.rbtAvailability === "open" ? "Open" : review.rbtAvailability === "tight" ? "Tight" : "None"} />
          <Field label="Travel Complexity" value={TONE_LABEL[review.travelComplexity]} />
          <Field label="Market Demand" value={TONE_LABEL[review.marketDemand]} />
        </div>
      </Section>

      {/* ============ 5. PAYMENT PLAN REVIEW ============ */}
      <Section icon={Wallet} title="Payment plan review" subtitle="Family responsibility and finance recommendation." accent={plan.tone}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3">
          <Field label="Deductible Burden" value={`$${(review.deductible - review.deductibleMet).toLocaleString()}`} mono />
          <Field label="Coinsurance Burden" value={`${review.coinsurance}% · est $${Math.round(review.estFamilyResponsibility * 0.4).toLocaleString()}`} mono />
          <Field label="Est. Family Responsibility" value={`$${review.estFamilyResponsibility.toLocaleString()}`} mono />
        </div>
        <div className={cn(
          "mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[12px]",
          plan.tone === "ok"   && "border-emerald-200 bg-emerald-50/60",
          plan.tone === "warn" && "border-amber-200 bg-amber-50/60",
          plan.tone === "crit" && "border-rose-200 bg-rose-50/60",
        )}>
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p><span className="font-semibold">{plan.label}.</span> {plan.reason}</p>
        </div>
      </Section>

      {/* ============ 6. DECISION PANEL ============ */}
      <Section icon={CheckCircle2} title="Decision" subtitle="Make the operational call — Bloom Growth and Finance will be notified.">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {DECISIONS.map(d => {
            const selected = decision === d.id;
            return (
              <button key={d.id}
                onClick={() => setDecision(d.id)}
                className={cn(
                  "group flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-all",
                  selected
                    ? "border-transparent bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white shadow-[0_14px_30px_-16px_hsl(265_85%_60%/0.7)]"
                    : "border-border/50 bg-card hover:border-[hsl(265_70%_55%/0.5)] hover:bg-secondary/40",
                )}
              >
                <span className="flex items-center gap-2 text-[12.5px] font-semibold tracking-tight">
                  <d.icon className="h-3.5 w-3.5" /> {d.label}
                </span>
                <ArrowRight className={cn("h-3 w-3 transition-transform", selected && "translate-x-0.5")} />
              </button>
            );
          })}
        </div>
        {decision && (
          <div className="mt-3 rounded-xl border border-border/50 bg-secondary/20 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Decision reasoning</p>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Short note — why this decision? (visible to Finance & Intake)"
              className="mt-1.5 w-full rounded-lg border border-border/60 bg-card px-2.5 py-2 text-[12.5px] outline-none focus:border-[hsl(265_70%_55%)]"
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setDecision(null); setReason(""); }}>Cancel</Button>
              <Button size="sm" onClick={submitDecision} className="bg-[hsl(265_70%_55%)] hover:bg-[hsl(265_70%_50%)]">
                Confirm decision
              </Button>
            </div>
          </div>
        )}
      </Section>

      {/* ============ 7. FAMILY COMMUNICATIONS ============ */}
      <Section icon={MessageSquare} title="Family communications" subtitle="Outreach, benefit explanations, and parent questions.">
        <ul className="space-y-2">
          {review.communications.length === 0 && (
            <li className="rounded-xl border border-dashed border-border/60 px-3 py-2 text-[12px] text-muted-foreground">
              No outreach logged yet.
            </li>
          )}
          {review.communications.map(c => {
            const Icon = c.kind === "email" ? Mail : c.kind === "call" ? Phone : MessageSquare;
            return (
              <li key={c.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/20 px-3 py-2 text-[12.5px]">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
                  <span className="font-medium">{c.subject}</span>
                  <span className="text-[10.5px] text-muted-foreground">· {c.direction === "in" ? "Inbound" : "Outbound"}</span>
                </div>
                <span className="text-[10.5px] text-muted-foreground">{c.createdAt}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Button size="sm" variant="outline" className="h-7 text-[11.5px]"><FileText className="mr-1 h-3 w-3" /> Send Benefit Summary</Button>
          <Button size="sm" variant="outline" className="h-7 text-[11.5px]"><CreditCard className="mr-1 h-3 w-3" /> Send Payment Plan</Button>
          <Button size="sm" variant="outline" className="h-7 text-[11.5px]"><MessageSquare className="mr-1 h-3 w-3" /> Message Intake</Button>
          <Button size="sm" variant="outline" className="h-7 text-[11.5px]"><Wallet className="mr-1 h-3 w-3" /> Message Finance</Button>
        </div>
      </Section>

      {/* ============ 8. INTERNAL NOTES ============ */}
      <Section icon={StickyNote} title="Internal notes" subtitle="State Director, Finance, and reviewer notes.">
        <div className="flex items-start gap-2">
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. State can support 30 hours. Parent open to payment plan."
            className="flex-1 rounded-xl border border-border/60 bg-secondary/20 px-3 py-2 text-[12.5px] outline-none transition focus:border-[hsl(265_70%_55%)] focus:bg-card"
          />
          <Button size="sm" onClick={addNote} className="bg-[hsl(265_70%_55%)] hover:bg-[hsl(265_70%_50%)]">
            <Send className="mr-1 h-3 w-3" /> Post
          </Button>
        </div>
        <ul className="mt-3 space-y-2">
          {review.notes.length === 0 && (
            <li className="rounded-xl border border-dashed border-border/60 px-3 py-2 text-[12px] text-muted-foreground">
              No internal notes yet.
            </li>
          )}
          {review.notes.map(n => (
            <li key={n.id} className="rounded-xl border border-border/50 bg-secondary/20 px-3 py-2">
              <p className="text-[12.5px] leading-snug">{n.text}</p>
              <div className="mt-1 flex items-center gap-2 text-[10.5px] text-muted-foreground">
                <span className="font-medium text-foreground/80">{n.author}</span>
                <span>· {n.role}</span>
                <span>· {n.createdAt}</span>
                {n.tags?.map(t => (
                  <span key={t} className="ml-1 rounded-full bg-[hsl(265_85%_96%)] px-1.5 py-0.5 text-[10px] font-semibold text-[hsl(265_70%_45%)]">#{t}</span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
