import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { GrowthPageShell, Section, ReadyForDataNotice } from "@/components/os/growth/GrowthPageShell";
import { useLeads } from "@/contexts/LeadsContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { LeadStatus } from "@/data/leads";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { buildLeadSourceDefaults } from "@/lib/leads/leadSourceConfig";
import { LeadActionPanel } from "@/components/intake/LeadActionPanel";
import { getLeadWorkflowRisk } from "@/lib/intake/intakeWorkflow";

const STAGES: LeadStatus[] = [
  "New Lead",
  "In Contact",
  "Sent Form",
  "Missing Information",
  "Form Received",
  "Sent to VOB",
  "VOB Completed",
  "Non-Qualified",
];

export default function LeadToActivePipeline() {
  const { leads, loading, moveStage, revertStage } = useLeads();
  const [addOpen, setAddOpen] = useState(false);

  const byStage = useMemo(() => {
    const map = new Map<LeadStatus, typeof leads>();
    STAGES.forEach((s) => map.set(s, []));
    leads.forEach((l) => {
      const arr = map.get(l.status as LeadStatus);
      if (arr) arr.push(l);
    });
    return map;
  }, [leads]);

  const avgAgeForStage = (items: typeof leads) => {
    if (items.length === 0) return null;
    const total = items.reduce((sum, l) => sum + (l.daysInStage ?? 0), 0);
    return Math.round(total / items.length);
  };

  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Lead To Active Pipeline"
      description="Track every lead through the journey from first contact to active care."
      actions={[
        { label: "Add Lead", icon: Plus, variant: "default", onClick: () => setAddOpen(true) },
        { label: "Open Patient Lifetime Journey", to: "/patient-journey", icon: TrendingUp },
        { label: "Open Leads", to: "/leads?view=pipeline" },
      ]}
    >
      <Section title="Pipeline stages" description="Counts and recent leads per stage.">
        <div className="overflow-x-auto">
          <div className="flex items-stretch gap-3 min-w-max pb-2">
            {STAGES.map((stage) => {
              const items = byStage.get(stage) ?? [];
              const avgAge = avgAgeForStage(items);
              const stageIdx = STAGES.indexOf(stage);
              return (
                <div key={stage} className="rounded-2xl border border-border/70 bg-card p-4 w-64 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">{stage}</div>
                    <div className="text-lg font-semibold tabular-nums text-foreground">{items.length}</div>
                  </div>
                  {avgAge !== null && (
                    <div className="text-[10px] text-muted-foreground">Avg age: {avgAge}d</div>
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
                          {stageIdx > 0 && (
                            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]"
                              onClick={() => { revertStage(l.id, STAGES[stageIdx - 1], 0, "Move back"); toast.success(`Moved back to ${STAGES[stageIdx - 1]}`); }}>
                              <ChevronLeft className="h-3 w-3" /> Back
                            </Button>
                          )}
                          {stageIdx < STAGES.length - 1 && (
                            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]"
                              onClick={() => { moveStage([l.id], STAGES[stageIdx + 1]); toast.success(`Moved to ${STAGES[stageIdx + 1]}`); }}>
                              Forward <ChevronRight className="h-3 w-3" />
                            </Button>
                          )}
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