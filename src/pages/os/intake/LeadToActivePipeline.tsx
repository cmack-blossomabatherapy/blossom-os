import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, ChevronLeft, ChevronRight, Plus, Ban } from "lucide-react";
import { GrowthPageShell, Section, ReadyForDataNotice } from "@/components/os/growth/GrowthPageShell";
import { useLeads } from "@/contexts/LeadsContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { LeadStatus } from "@/data/leads";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { buildLeadSourceDefaults } from "@/lib/leads/leadSourceConfig";
import { LeadActionPanel } from "@/components/intake/LeadActionPanel";
import {
  getLeadWorkflowRisk,
  FAMILY_LEAD_PIPELINE_STAGES,
  canonicalFamilyLeadStage,
  getNextFamilyLeadStage,
  getPreviousFamilyLeadStage,
  FAMILY_LEAD_STAGE_OWNERS,
  type FamilyLeadPipelineStage,
} from "@/lib/intake/intakeWorkflow";

// Export 78 — Canonical Family / Lead Workflow (13 stages).
const STAGES: readonly FamilyLeadPipelineStage[] = FAMILY_LEAD_PIPELINE_STAGES;

export default function LeadToActivePipeline() {
  const { leads, loading, moveStage, revertStage } = useLeads();
  const [addOpen, setAddOpen] = useState(false);

  const byStage = useMemo(() => {
    const map = new Map<FamilyLeadPipelineStage, typeof leads>();
    STAGES.forEach((s) => map.set(s, []));
    leads.forEach((l) => {
      const arr = map.get(canonicalFamilyLeadStage(l.status));
      if (arr) arr.push(l);
    });
    return map;
  }, [leads]);

  const avgAgeForStage = (items: typeof leads) => {
    if (items.length === 0) return null;
    const total = items.reduce((sum, l) => sum + (l.daysInStage ?? 0), 0);
    return Math.round(total / items.length);
  };

  const oldestForStage = (items: typeof leads) =>
    items.reduce((m, l) => Math.max(m, l.daysInStage ?? 0), 0);

  const atRiskForStage = (items: typeof leads) =>
    items.filter((l) => {
      const r = getLeadWorkflowRisk(l);
      return r.level === "risk" || r.level === "urgent";
    }).length;

  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Lead To Active Pipeline"
      description="Family lead workflow from lead capture through ready to start services. Active patient operations begin in a separate workflow after Ready to Start Services."
      actions={[
        { label: "Add Lead", icon: Plus, variant: "default", onClick: () => setAddOpen(true) },
        { label: "Open Leads", to: "/leads?view=pipeline" },
      ]}
    >
      <Section title="Pipeline stages" description="Canonical 13-stage family lead workflow. Existing leads with legacy statuses appear under their mapped canonical stage.">
        <div className="overflow-x-auto">
          <div className="flex items-stretch gap-3 min-w-max pb-2">
            {STAGES.map((stage) => {
              const items = byStage.get(stage) ?? [];
              const avgAge = avgAgeForStage(items);
              const oldest = oldestForStage(items);
              const atRisk = atRiskForStage(items);
              const stageIdx = STAGES.indexOf(stage);
              const owner = FAMILY_LEAD_STAGE_OWNERS[stage];
              const isPipelineEnd = stage === "Ready to Start Services";
              return (
                <div key={stage} className={`rounded-2xl border p-4 w-64 shrink-0 ${isPipelineEnd ? "border-amber-500/40 bg-amber-500/5" : "border-border/70 bg-card"}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      {stage}
                      {isPipelineEnd && <Ban className="h-3 w-3 text-amber-600" aria-hidden="true" />}
                    </div>
                    <div className="text-lg font-semibold tabular-nums text-foreground">{items.length}</div>
                  </div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/80">
                    Owner: {owner}
                  </div>
                  {avgAge !== null && (
                    <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                      <span>Avg {avgAge}d</span>
                      <span>· Oldest {oldest}d</span>
                      {atRisk > 0 && <span className="text-amber-600">· {atRisk} at risk</span>}
                    </div>
                  )}
                  <div className="mt-3 space-y-1.5">
                    {items.slice(0, 6).map((l) => (
                      <div key={l.id} className="rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-xs">
                        <Link to={`/leads/${l.id}`} className="font-medium truncate block hover:underline">{l.childName}</Link>
                        <div className="text-[10px] text-muted-foreground truncate">{l.owner || "Unassigned"} · {l.state}</div>
                        {(() => {
                          const risk = getLeadWorkflowRisk(l);
                          if (risk.level === "ok") return null;
                          return (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {risk.reasons.slice(0, 2).map((r) => (
                                <Badge key={r} variant="secondary" className="text-[9px] py-0">{r}</Badge>
                              ))}
                            </div>
                          );
                        })()}
                        <div className="mt-1 flex gap-1">
                          {(() => {
                            const prev = getPreviousFamilyLeadStage(stage);
                            const next = getNextFamilyLeadStage(stage);
                            return (
                              <>
                                {prev && (
                                  <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]"
                                    onClick={() => { revertStage(l.id, prev as LeadStatus, 0, "Move back"); toast.success(`Moved back to ${prev}`); }}>
                                    <ChevronLeft className="h-3 w-3" /> Back
                                  </Button>
                                )}
                                {isPipelineEnd ? (
                                  <Button size="sm" variant="ghost" disabled className="h-6 px-1.5 text-[10px] text-muted-foreground" title="Active patient operations start after this point. Use the active patient workflow to continue.">
                                    <Ban className="h-3 w-3 mr-1" /> Pipeline end
                                  </Button>
                                ) : next && (
                                  <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]"
                                    onClick={() => { moveStage([l.id], next as LeadStatus); toast.success(`Moved to ${next}`); }}>
                                    Forward <ChevronRight className="h-3 w-3" />
                                  </Button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        <details className="mt-1">
                          <summary className="text-[10px] text-muted-foreground cursor-pointer">Actions</summary>
                          <div className="mt-1"><LeadActionPanel lead={l} compact sourcePage="lead-to-active" /></div>
                        </details>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="text-[11px] text-muted-foreground italic">No leads in stage</div>
                    )}
                    {items.length > 6 && (
                      <Link to={`/leads?view=pipeline`} className="text-[11px] text-primary hover:underline">
                        +{items.length - 6} more
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-100">
          <Ban className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-700 dark:text-amber-300" aria-hidden="true" />
          <span>
            <strong>Hard stop:</strong> this pipeline ends at <strong>Ready to Start Services</strong>. Active patient operations start after this point and are managed in a separate workflow.
          </span>
        </div>
      </Section>

      {leads.length === 0 && (
        <ReadyForDataNotice message={loading ? "Loading leads…" : "No leads yet. Add a lead or connect a source to populate the pipeline."} />
      )}
      <NewLeadDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaults={buildLeadSourceDefaults("Website", { sourcePage: "lead-to-active" })}
      />
    </GrowthPageShell>
  );
}