import { useMemo, useState } from "react";
import { Ban, ArrowRight, ArrowLeft, User, ShieldCheck, AlertTriangle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { GrowthPageShell } from "@/components/os/growth/GrowthPageShell";
import { useLeads } from "@/contexts/LeadsContext";
import { useOSRoleSafe } from "@/contexts/OSRoleContext";
import { isDirectorOfIntake } from "@/lib/intake/intakeRoles";
import {
  INTAKE_CANONICAL_STAGES,
  INTAKE_STAGE_OWNERS,
  INTAKE_STAGE_NEXT_ACTIONS,
  INTAKE_STAGE_SLA_DAYS,
  INTAKE_STAGE_TO_STORED_STATUS,
  canonicalIntakeStage,
  evaluateIntakeStageRequirements,
  getNextIntakeStage,
  getPreviousIntakeStage,
  guardIntakeStageTransition,
  isAdmissionReady,
} from "@/lib/intake/intakeCanonicalStages";
import { CENTRALREACH_BOUNDARY_NOTE } from "@/lib/intake/admissionReadiness";
import type { LeadStatus } from "@/data/leads";
import { guardIntakeMutation } from "@/lib/intake/actionGuard";
import { useIntakeOperatingMode } from "@/lib/intake/operatingMode";
import { LeadActionPanel } from "@/components/intake/LeadActionPanel";

/**
 * Blossom OS — canonical Intake pipeline (/intake/lead-to-active).
 *
 * The real Intake workflow component: eight Intake-owned stages from
 * Lead Captured through Admission Ready, with a single transition guard
 * that blocks advancement when stage requirements are missing. Intake
 * ends at Admission Ready — CentralReach staff activate the patient.
 */
export default function LeadToActivePipeline() {
  const { leads, loading, moveStage, revertStage } = useLeads();
  const { data: modeState } = useIntakeOperatingMode();
  const ctx = useOSRoleSafe();
  const director = isDirectorOfIntake([ctx?.role ?? null]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) =>
      [l.childName, l.parentName, l.phone, l.email].some((v) => (v ?? "").toLowerCase().includes(q)),
    );
  }, [leads, query]);

  const lead = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? filtered[0] ?? null,
    [leads, filtered, selectedId],
  );

  const canonical = useMemo(() => canonicalIntakeStage(lead?.status), [lead?.status]);
  const nextStage = useMemo(() => getNextIntakeStage(lead?.status), [lead?.status]);
  const prevStage = useMemo(() => getPreviousIntakeStage(lead?.status), [lead?.status]);
  const atEnd = useMemo(() => isAdmissionReady(lead?.status), [lead?.status]);

  const requirements = useMemo(
    () => (lead ? evaluateIntakeStageRequirements(canonical, lead, { isDirector: director }) : { ok: true, missing: [] }),
    [lead, canonical, director],
  );

  const modeBanner = modeState?.mode === "INGEST_ONLY";

  const move = (target: typeof canonical | null, direction: "forward" | "back", useException = false) => {
    if (!lead || !target) return;
    const decision = guardIntakeStageTransition(lead, target, {
      isDirector: director,
      directorException: useException,
    });
    if (!decision.allowed) {
      toast.error(decision.reason);
      return;
    }
    const stored = INTAKE_STAGE_TO_STORED_STATUS[target] as LeadStatus;
    const preview = guardIntakeMutation(
      direction === "forward" ? "advance stage" : "revert stage",
      [lead.id],
      { from: lead.status, to: stored },
    );
    if (preview) return;
    if (direction === "forward") moveStage([lead.id], stored);
    else revertStage(lead.id, stored, 0, "Manual workflow correction");
    toast.success(
      decision.allowed && decision.viaException
        ? `Moved to ${target} via Director exception.`
        : `Moved to ${target}.`,
    );
  };

  return (
    <GrowthPageShell
      eyebrow="Intake"
      title="Intake Pipeline"
      description="Lead Captured through Admission Ready — the canonical Intake-owned workflow."
      headerRight={
        modeBanner ? (
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
            Preview only — Intake actions are not enabled
          </Badge>
        ) : undefined
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4" data-page="lead-to-active-pipeline">
        <Card className="p-3 max-h-[70vh] overflow-y-auto space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search leads…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search leads"
            />
          </div>
          {loading ? (
            <div className="text-sm text-muted-foreground p-3">Loading Intake leads…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground p-3">
              {leads.length === 0 ? "No Intake leads yet." : "No leads match that search."}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.slice(0, 100).map((l) => (
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
                    {canonicalIntakeStage(l.status)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-6">
          {lead ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Current stage</div>
                  <div className="text-xl font-semibold mt-1">{canonical}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Owner: {INTAKE_STAGE_OWNERS[canonical]} · SLA {INTAKE_STAGE_SLA_DAYS[canonical]}d ·
                    Next: {INTAKE_STAGE_NEXT_ACTIONS[canonical]}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => move(prevStage, "back")}
                    disabled={!prevStage}
                    title={!prevStage ? "At the first stage" : `Back to ${prevStage}`}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => move(nextStage, "forward")}
                    disabled={!nextStage || atEnd || !requirements.ok}
                    title={
                      atEnd
                        ? "Admission Ready — Intake ends here"
                        : !requirements.ok
                          ? `Blocked — missing: ${requirements.missing.join(", ")}`
                          : nextStage
                            ? `Advance to ${nextStage}`
                            : "No next stage"
                    }
                  >
                    Forward <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </div>
              </div>

              {!requirements.ok && !atEnd && (
                <div className="rounded-xl border border-amber-300/60 bg-amber-50/70 p-4 flex items-start gap-3 text-amber-900">
                  <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold">Advancement blocked</div>
                    <div className="text-sm mt-1">Missing: {requirements.missing.join(", ")}.</div>
                    {director && nextStage && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        onClick={() => move(nextStage, "forward", true)}
                      >
                        Approve Director exception & advance
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {atEnd && (
                <div className="rounded-xl border border-emerald-300/60 bg-emerald-50/70 p-4 flex items-start gap-3 text-emerald-900">
                  <Ban className="h-5 w-5 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">Admission Ready · Intake complete</div>
                    <div className="text-sm mt-1">{CENTRALREACH_BOUNDARY_NOTE}</div>
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Canonical Intake workflow
                </div>
                <ol className="space-y-1">
                  {INTAKE_CANONICAL_STAGES.map((stage, i) => {
                    const isCurrent = stage === canonical;
                    const isPast = INTAKE_CANONICAL_STAGES.indexOf(canonical) > i;
                    return (
                      <li
                        key={stage}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                          isCurrent ? "bg-primary/10 border border-primary/30 font-medium"
                          : isPast ? "text-muted-foreground" : ""
                        }`}
                      >
                        <span
                          className={`grid place-items-center h-6 w-6 rounded-full text-[11px] ${
                            isCurrent ? "bg-primary text-primary-foreground"
                            : isPast ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isPast ? <ShieldCheck className="h-3 w-3" /> : i + 1}
                        </span>
                        <span className="flex-1">{stage}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {INTAKE_STAGE_OWNERS[stage]}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="rounded-xl border bg-card/50 p-4">
                <LeadActionPanel lead={lead} sourcePage="lead-to-active-pipeline" />
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Select a lead to view its canonical Intake workflow.
            </div>
          )}
        </Card>
      </div>
    </GrowthPageShell>
  );
}
