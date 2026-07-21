import { useMemo, useState } from "react";
import { Ban, ArrowRight, ArrowLeft, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useLeads } from "@/contexts/LeadsContext";
import {
  FAMILY_LEAD_PIPELINE_STAGES,
  FAMILY_LEAD_STAGE_OWNERS,
  canonicalFamilyLeadStage,
  getNextFamilyLeadStage,
  getPreviousFamilyLeadStage,
  isReadyToStartStage,
  type FamilyLeadPipelineStage,
} from "@/lib/intake/intakeWorkflow";
import type { LeadStatus } from "@/data/leads";
import { guardIntakeMutation } from "@/lib/intake/actionGuard";
import { useIntakeOperatingMode } from "@/lib/intake/operatingMode";

/**
 * Blossom OS — Lead → Active Pipeline
 *
 * Canonical Family lead workflow page. Advances / reverts one lead across
 * the 13-stage FAMILY_LEAD_PIPELINE_STAGES pipeline. The pipeline is a
 * Hard stop at "Ready to Start Services" — Active patient operations
 * start after this point and are managed in a separate workflow.
 *
 * All mutations pass through the INGEST_ONLY guard so the button remains
 * visible but opens a deterministic Preview dialog when Intake actions
 * are disabled. No STAGE_TO_LEAD_STATUS translation table is used — the
 * canonical helpers own that behavior.
 */
export default function LeadToActivePipeline() {
  const { leads, moveStage, revertStage } = useLeads();
  const { data: modeState } = useIntakeOperatingMode();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const lead = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? leads[0] ?? null,
    [leads, selectedId],
  );

  const canonical = useMemo<FamilyLeadPipelineStage>(
    () => canonicalFamilyLeadStage(lead?.status),
    [lead?.status],
  );
  const nextStage = useMemo(() => getNextFamilyLeadStage(lead?.status), [lead?.status]);
  const prevStage = useMemo(() => getPreviousFamilyLeadStage(lead?.status), [lead?.status]);
  const isPipelineEnd = useMemo(() => isReadyToStartStage(lead?.status), [lead?.status]);

  const modeBanner = modeState?.mode === "INGEST_ONLY";

  const doForward = () => {
    if (!lead || !nextStage || isPipelineEnd) return;
    const preview = guardIntakeMutation("advance stage", [lead.id], {
      from: lead.status,
      to: nextStage,
    });
    if (preview) return;
    moveStage([lead.id], nextStage as LeadStatus);
    toast.success(`Moved to ${nextStage}`);
  };
  const doBack = () => {
    if (!lead || !prevStage) return;
    const preview = guardIntakeMutation("revert stage", [lead.id], {
      from: lead.status,
      to: prevStage,
    });
    if (preview) return;
    revertStage(lead.id, prevStage as LeadStatus, 0, "Manual workflow correction");
    toast.success(`Moved back to ${prevStage}`);
  };

  return (
    <div className="p-6 space-y-6" data-page="lead-to-active-pipeline">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Lead → Active pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Family lead workflow — 13 canonical stages from Lead Captured
            through Ready to Start Services. Active patient operations
            start after this point and are managed in a separate workflow.
          </p>
        </div>
        {modeBanner && (
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
            Preview only — Intake actions are not enabled
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
        <Card className="p-3 max-h-[70vh] overflow-y-auto">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Leads
          </div>
          {leads.length === 0 && (
            <div className="text-sm text-muted-foreground p-3">
              No leads in the canonical database yet.
            </div>
          )}
          <div className="space-y-1">
            {leads.slice(0, 100).map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setSelectedId(l.id)}
                className={`w-full text-left rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition ${
                  l.id === lead?.id ? "bg-muted font-medium" : ""
                }`}
              >
                <div className="truncate">{l.childName || l.parentName || "Unknown"}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {canonicalFamilyLeadStage(l.status)}
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6 space-y-6">
          {lead ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Current stage
                  </div>
                  <div className="text-xl font-semibold mt-1">{canonical}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Stage owner: {FAMILY_LEAD_STAGE_OWNERS[canonical] ?? "—"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={doBack}
                    disabled={!prevStage}
                    title={!prevStage ? "At the first stage" : `Back to ${prevStage}`}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={doForward}
                    disabled={!nextStage || isPipelineEnd}
                    title={
                      isPipelineEnd
                        ? "Pipeline end — hard stop at Ready to Start Services"
                        : nextStage
                          ? `Advance to ${nextStage}`
                          : "No next stage"
                    }
                  >
                    Forward <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </div>
              </div>

              {isPipelineEnd && (
                <div className="rounded-xl border border-emerald-300/60 bg-emerald-50/70 p-4 flex items-start gap-3 text-emerald-900">
                  <Ban className="h-5 w-5 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">
                      Hard stop · Pipeline end
                    </div>
                    <div className="text-sm mt-1">
                      Active patient operations start after this point and are
                      managed in a separate workflow (Scheduling / Operations).
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Canonical Family lead workflow
                </div>
                <ol className="space-y-1">
                  {FAMILY_LEAD_PIPELINE_STAGES.map((stage, i) => {
                    const isCurrent = stage === canonical;
                    const isPast =
                      FAMILY_LEAD_PIPELINE_STAGES.indexOf(canonical) > i;
                    return (
                      <li
                        key={stage}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                          isCurrent
                            ? "bg-primary/10 border border-primary/30 font-medium"
                            : isPast
                              ? "text-muted-foreground"
                              : ""
                        }`}
                      >
                        <span
                          className={`grid place-items-center h-6 w-6 rounded-full text-[11px] ${
                            isCurrent
                              ? "bg-primary text-primary-foreground"
                              : isPast
                                ? "bg-emerald-500 text-white"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isPast ? <ShieldCheck className="h-3 w-3" /> : i + 1}
                        </span>
                        <span className="flex-1">{stage}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {FAMILY_LEAD_STAGE_OWNERS[stage] ?? "—"}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Select a lead to view its canonical Family lead workflow.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}