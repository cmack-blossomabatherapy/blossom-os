import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LeadNameLink } from "@/contexts/LeadDrawerContext";
import { TrendingUp, Plus, Ban, List, Workflow, Flame, Sparkles, AlertTriangle, ArrowRightLeft, GripVertical, MoreHorizontal } from "lucide-react";
import { GrowthPageShell, ReadyForDataNotice } from "@/components/os/growth/GrowthPageShell";
import { IntakeSectionHeader, IntakePulseStrip, INTAKE_TONE, type PulseTileSpec } from "@/components/os/intake/IntakeVisuals";
import { cn } from "@/lib/utils";
import { useLeads } from "@/contexts/LeadsContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { LeadStatus } from "@/data/leads";
import type { Lead } from "@/data/leads";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { buildLeadSourceDefaults } from "@/lib/leads/leadSourceConfig";
import { LeadActionPanel } from "@/components/intake/LeadActionPanel";
import {
  getLeadWorkflowRisk,
  FAMILY_LEAD_PIPELINE_STAGES,
  canonicalFamilyLeadStage,
  FAMILY_LEAD_STAGE_OWNERS,
  isReadyToStartStage,
  isLeadOutOfPipeline,
  type FamilyLeadPipelineStage,
} from "@/lib/intake/intakeWorkflow";
import { IntakeStateFilterToggle, useIntakeStateFilter } from "@/lib/intake/intakeStateFilter";
import { PipelinePanRail } from "@/components/intake/PipelinePanRail";

const STAGES: readonly FamilyLeadPipelineStage[] = FAMILY_LEAD_PIPELINE_STAGES;

// Rotating tone palette per stage for a colorful kanban.
const STAGE_TONES: (keyof typeof INTAKE_TONE)[] = ["sky", "indigo", "violet", "amber", "rose", "emerald", "primary"];

export default function LeadToActivePipeline() {
  const { leads: allLeads, loading, moveStage, revertStage } = useLeads();
  const { matches } = useIntakeStateFilter();
  const leads = useMemo(() => allLeads.filter((l) => matches(l.state)), [allLeads, matches]);
  const [addOpen, setAddOpen] = useState(false);
  const [actionLead, setActionLead] = useState<Lead | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<FamilyLeadPipelineStage | null>(null);

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
    return Math.round(items.reduce((s, l) => s + (l.daysInStage ?? 0), 0) / items.length);
  };
  const oldestForStage = (items: typeof leads) =>
    items.reduce((m, l) => Math.max(m, l.daysInStage ?? 0), 0);
  const atRiskForStage = (items: typeof leads) =>
    items.filter((l) => {
      const r = getLeadWorkflowRisk(l);
      return r.level === "risk" || r.level === "urgent";
    }).length;

  const pulseTiles: PulseTileSpec[] = useMemo(() => {
    const inPipeline = leads.filter((l) => !isLeadOutOfPipeline(l.status)).length;
    const ready = leads.filter((l) => isReadyToStartStage(l.status)).length;
    const urgent = leads.filter((l) => getLeadWorkflowRisk(l).level === "urgent").length;
    const risk = leads.filter((l) => getLeadWorkflowRisk(l).level === "risk").length;
    const hot = leads.filter((l) => l.priority === "Hot" && !isLeadOutOfPipeline(l.status)).length;
    return [
      { key: "open",    label: "In Pipeline",   value: inPipeline, hint: "Captured → Ready to Start",  icon: Workflow,       tone: "indigo" },
      { key: "ready",   label: "Ready to Start",value: ready,      hint: "Handoff to active services", icon: ArrowRightLeft, tone: "emerald" },
      { key: "urgent",  label: "Urgent",        value: urgent,     hint: "SLA breach",                 icon: AlertTriangle,  tone: "rose" },
      { key: "risk",    label: "At Risk",       value: risk,       hint: "Slipping",                   icon: AlertTriangle,  tone: "amber" },
      { key: "hot",     label: "Hot Priority",  value: hot,        hint: "Family-flagged hot",         icon: Flame,          tone: "violet" },
      { key: "stages",  label: "Stages",        value: STAGES.length, hint: "Canonical workflow",      icon: Sparkles,       tone: "sky" },
    ];
  }, [leads]);

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggingId(lead.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", lead.id);
  };
  const handleDragEnd = () => { setDraggingId(null); setDragOverStage(null); };
  const handleDragOver = (e: React.DragEvent, stage: FamilyLeadPipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stage) setDragOverStage(stage);
  };
  const handleDragLeave = (e: React.DragEvent, stage: FamilyLeadPipelineStage) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverStage === stage) setDragOverStage(null);
    }
  };
  const handleDrop = (e: React.DragEvent, stage: FamilyLeadPipelineStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    setDragOverStage(null);
    if (!id) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;
    const fromCanonical = canonicalFamilyLeadStage(lead.status);
    if (fromCanonical === stage) return;
    const fromIdx = STAGES.indexOf(fromCanonical as FamilyLeadPipelineStage);
    const toIdx = STAGES.indexOf(stage);
    const previousStatus = lead.status;
    const previousDays = lead.daysInStage;
    if (toIdx > fromIdx) {
      moveStage([lead.id], stage as unknown as LeadStatus);
    } else {
      revertStage(lead.id, stage as unknown as LeadStatus, 0, `Moved back to ${stage}`);
    }
    toast.success(`${lead.childName} → ${stage}`, {
      description: `From ${fromCanonical}`,
      action: {
        label: "Undo",
        onClick: () => {
          revertStage(lead.id, previousStatus, previousDays, `Reverted to ${previousStatus}`);
          toast.success(`Reverted ${lead.childName}`);
        },
      },
    });
  };

  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Lead to Ready-to-Start Pipeline"
      description="Family lead workflow from lead capture through ready to start services. Active patient operations begin in a separate workflow after Ready to Start Services."
      headerRight={<IntakeStateFilterToggle />}
      actions={[
        { label: "Add Lead", icon: Plus, variant: "default", onClick: () => setAddOpen(true) },
        { label: "Open Leads", icon: List, to: "/leads" },
      ]}
    >
      <section>
        <IntakeSectionHeader icon={TrendingUp} tone="indigo" title="Pipeline Pulse" subtitle="Live snapshot of where every family sits." />
        <IntakePulseStrip tiles={pulseTiles} loading={loading} />
      </section>

      <section>
        <IntakeSectionHeader icon={Workflow} tone="violet" title="Pipeline stages" subtitle="Drag a card between columns to move stages. Click Actions for more options." />
        <PipelineDragSection>
          <div className="flex items-stretch gap-3 min-w-max pb-2">
            {STAGES.map((stage, i) => {
              const items = byStage.get(stage) ?? [];
              const avgAge = avgAgeForStage(items);
              const oldest = oldestForStage(items);
              const atRisk = atRiskForStage(items);
              const owner = FAMILY_LEAD_STAGE_OWNERS[stage];
              const isPipelineEnd = stage === "Ready to Start Services";
              const toneKey: keyof typeof INTAKE_TONE = isPipelineEnd ? "emerald" : STAGE_TONES[i % STAGE_TONES.length];
              const t = INTAKE_TONE[toneKey];
              const isDropTarget = dragOverStage === stage;
              return (
                <div
                  key={stage}
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDragLeave={(e) => handleDragLeave(e, stage)}
                  onDrop={(e) => handleDrop(e, stage)}
                  className={cn(
                    "rounded-2xl border p-4 w-72 shrink-0 transition-all duration-200 flex flex-col",
                    t.bg,
                    isPipelineEnd ? "border-emerald-500/40" : "border-border/70",
                    isDropTarget && "ring-2 ring-primary border-primary bg-primary/5",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn("grid place-items-center h-7 w-7 rounded-lg shrink-0", t.icon)}>
                        {isPipelineEnd ? <ArrowRightLeft className="h-3.5 w-3.5" /> : <Workflow className="h-3.5 w-3.5" />}
                      </div>
                      <div className="text-xs font-medium text-foreground truncate">{stage}</div>
                    </div>
                    <div className={cn("text-lg font-semibold tabular-nums", t.number)}>{items.length}</div>
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/80">
                    Owner: {owner}
                  </div>
                  {avgAge !== null && (
                    <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>Avg {avgAge}d</span>
                      <span>· Oldest {oldest}d</span>
                      {atRisk > 0 && <span className="text-amber-600">· {atRisk} at risk</span>}
                    </div>
                  )}
                  <div className={cn(
                    "mt-3 space-y-2 flex-1 min-h-[120px] rounded-xl p-1 transition-colors",
                    isDropTarget && "bg-primary/5",
                  )}>
                    {items.slice(0, 6).map((l) => {
                      const risk = getLeadWorkflowRisk(l);
                      const isDragging = draggingId === l.id;
                      const accent =
                        risk.level === "urgent" ? "border-l-rose-500" :
                        risk.level === "risk" ? "border-l-amber-500" :
                        l.priority === "Hot" ? "border-l-primary" :
                        "border-l-border";
                      return (
                        <div
                          key={l.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, l)}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            "group rounded-xl border border-border/70 bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all px-2.5 py-2.5 text-xs cursor-grab active:cursor-grabbing border-l-4",
                            accent,
                            isDragging && "opacity-40 scale-[0.97] rotate-1",
                          )}
                        >
                          <div className="flex items-start gap-1.5">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <LeadNameLink leadId={l.id} className="font-medium truncate text-foreground hover:underline">
                                  {l.childName}
                                </LeadNameLink>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setActionLead(l); }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-muted p-0.5"
                                  aria-label="Lead actions"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                                {l.owner || "Unassigned"} · {l.state} · {l.daysInStage}d
                              </div>
                              {risk.level !== "ok" && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {risk.reasons.slice(0, 2).map((r) => (
                                    <Badge
                                      key={r}
                                      variant="secondary"
                                      className={cn(
                                        "text-[9px] py-0 px-1.5",
                                        risk.level === "urgent" && "bg-rose-500/10 text-rose-700 dark:text-rose-300",
                                        risk.level === "risk" && "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                                      )}
                                    >
                                      {r}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <div className="mt-2 flex justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                                  onClick={(e) => { e.stopPropagation(); setActionLead(l); }}
                                >
                                  Actions
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <div className={cn(
                        "h-full min-h-[100px] grid place-items-center text-[11px] italic rounded-lg border border-dashed border-border/60",
                        isDropTarget ? "text-primary border-primary/40 bg-primary/5" : "text-muted-foreground",
                      )}>
                        {isDropTarget ? "Drop to move here" : "No leads in stage"}
                      </div>
                    )}
                    {items.length > 6 && (
                      <Link to={`/leads?view=pipeline`} className="block text-[11px] text-primary hover:underline pt-1">
                        +{items.length - 6} more
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-900 dark:text-emerald-100">
          <Ban className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
          <span>
            <strong>Hard stop:</strong> this pipeline ends at <strong>Ready to Start Services</strong>. Active patient operations start after this point and are managed in a separate workflow.
          </span>
        </div>
      </section>

      {leads.length === 0 && (
        <ReadyForDataNotice message={loading ? "Loading leads…" : "No leads yet. Add a lead or connect a source to populate the pipeline."} />
      )}
      <NewLeadDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaults={buildLeadSourceDefaults("Website", { sourcePage: "lead-to-active" })}
      />

      <Dialog open={!!actionLead} onOpenChange={(o) => !o && setActionLead(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{actionLead?.childName}</span>
              {actionLead && (
                <span className="text-xs font-normal text-muted-foreground">
                  · {canonicalFamilyLeadStage(actionLead.status)}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {actionLead && (
            <LeadActionPanel
              lead={actionLead}
              sourcePage="lead-to-active"
              onAfterAction={() => setActionLead(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </GrowthPageShell>
  );
}
