import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { CAPACITY_LABELS, CAPACITY_STYLES, type CapacitySnapshot, type CapacityStatus, fmtHours } from "./pipeline";

/**
 * Advisory scenario planner. Uses transparent, explainable formulas —
 * no hidden ML. Every delta shows the hours it adds and the resulting
 * capacity band. Read-only: this never writes to snapshots.
 */

// Hour equivalents per unit — conservative planning heuristics used only for scenarios.
const HOURS_PER_LEAVE_DAY = 6;         // avg BCBA delivered hours lost per leave day
const HOURS_PER_QA_CORRECTION = 1.5;   // rework time per open correction
const HOURS_PER_NEW_ASSESSMENT = 4;    // assessment + write-up per new case

function bandFromRatio(ratio: number): CapacityStatus {
  if (!isFinite(ratio) || ratio <= 0) return "review_required";
  if (ratio < 0.75) return "available";
  if (ratio < 0.95) return "approaching_capacity";
  if (ratio < 1.05) return "at_capacity";
  return "over_capacity";
}

function Badge({ status }: { status: CapacityStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${CAPACITY_STYLES[status]}`}>
      {CAPACITY_LABELS[status]}
    </span>
  );
}

export default function ScenarioPlannerDialog({
  open, onOpenChange, snapshot,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  snapshot: CapacitySnapshot | null;
}) {
  const [leaveDays, setLeaveDays] = useState(0);
  const [qaCorrections, setQaCorrections] = useState(0);
  const [newAssessments, setNewAssessments] = useState(0);

  const result = useMemo(() => {
    if (!snapshot) return null;

    // Baseline demand = projected clinical workload driven by caseload obligations.
    const baselineDemand =
      Number(snapshot.projected_service_hours) +
      Number(snapshot.supervision_load_hours) +
      Number(snapshot.parent_training_workload) +
      Number(snapshot.reports_due) * 2 +
      Number(snapshot.open_qa_corrections) * HOURS_PER_QA_CORRECTION +
      Number(snapshot.new_assessments) * HOURS_PER_NEW_ASSESSMENT;

    // Baseline available = scheduled hours minus already-known leave impact.
    const baselineAvailable = Math.max(
      0,
      Number(snapshot.scheduled_hours) - Number(snapshot.upcoming_leave_days) * HOURS_PER_LEAVE_DAY
    );

    const baselineRatio = baselineAvailable > 0 ? baselineDemand / baselineAvailable : Infinity;

    const addedLeaveHours = leaveDays * HOURS_PER_LEAVE_DAY;
    const addedQaHours = qaCorrections * HOURS_PER_QA_CORRECTION;
    const addedAssessmentHours = newAssessments * HOURS_PER_NEW_ASSESSMENT;

    const scenarioDemand = baselineDemand + addedQaHours + addedAssessmentHours;
    const scenarioAvailable = Math.max(0, baselineAvailable - addedLeaveHours);
    const scenarioRatio = scenarioAvailable > 0 ? scenarioDemand / scenarioAvailable : Infinity;

    return {
      baseline: {
        demand: baselineDemand,
        available: baselineAvailable,
        ratio: baselineRatio,
        band: snapshot.capacity_status,
      },
      scenario: {
        demand: scenarioDemand,
        available: scenarioAvailable,
        ratio: scenarioRatio,
        band: bandFromRatio(scenarioRatio),
      },
      deltas: {
        leaveHours: addedLeaveHours,
        qaHours: addedQaHours,
        assessmentHours: addedAssessmentHours,
      },
    };
  }, [snapshot, leaveDays, qaCorrections, newAssessments]);

  const reset = () => { setLeaveDays(0); setQaCorrections(0); setNewAssessments(0); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Scenario planner — next 30 days
          </DialogTitle>
          <DialogDescription>
            Model upcoming leave, QA corrections, and new assessments to preview how your
            capacity advisory would shift. Advisory only — no staffing decisions are made here.
          </DialogDescription>
        </DialogHeader>

        {!snapshot ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Capacity snapshot not available yet.
          </div>
        ) : (
          <div className="space-y-5">
            {/* Inputs */}
            <div className="space-y-4">
              <ScenarioInput
                label="Additional leave days"
                helper={`Each day ≈ ${HOURS_PER_LEAVE_DAY} h of unavailable capacity`}
                value={leaveDays} onChange={setLeaveDays} max={20}
              />
              <ScenarioInput
                label="Additional open QA corrections"
                helper={`Each correction ≈ ${HOURS_PER_QA_CORRECTION} h of rework`}
                value={qaCorrections} onChange={setQaCorrections} max={15}
              />
              <ScenarioInput
                label="Additional new assessments"
                helper={`Each assessment ≈ ${HOURS_PER_NEW_ASSESSMENT} h of clinical + write-up time`}
                value={newAssessments} onChange={setNewAssessments} max={10}
              />
            </div>

            {/* Comparison */}
            {result && (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
                <ScenarioColumn
                  title="Today"
                  demand={result.baseline.demand}
                  available={result.baseline.available}
                  ratio={result.baseline.ratio}
                  band={result.baseline.band}
                />
                <div className="hidden md:flex items-center justify-center text-muted-foreground">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <ScenarioColumn
                  title="With scenario"
                  demand={result.scenario.demand}
                  available={result.scenario.available}
                  ratio={result.scenario.ratio}
                  band={result.scenario.band}
                  highlight={result.scenario.band !== result.baseline.band}
                />
              </div>
            )}

            {/* Deltas summary */}
            {result && (leaveDays > 0 || qaCorrections > 0 || newAssessments > 0) && (
              <Card className="border-primary/20 bg-primary/[0.02]">
                <CardContent className="p-4 space-y-1.5 text-sm">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    What changed in this scenario
                  </div>
                  {leaveDays > 0 && (
                    <div>• {leaveDays} leave day{leaveDays === 1 ? "" : "s"} → −{fmtHours(result.deltas.leaveHours)} available</div>
                  )}
                  {qaCorrections > 0 && (
                    <div>• {qaCorrections} QA correction{qaCorrections === 1 ? "" : "s"} → +{fmtHours(result.deltas.qaHours)} demand</div>
                  )}
                  {newAssessments > 0 && (
                    <div>• {newAssessments} new assessment{newAssessments === 1 ? "" : "s"} → +{fmtHours(result.deltas.assessmentHours)} demand</div>
                  )}
                  {result.scenario.band !== result.baseline.band && (
                    <div className="pt-1 font-medium">
                      Advisory would move from “{CAPACITY_LABELS[result.baseline.band]}” to “{CAPACITY_LABELS[result.scenario.band]}”.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between pt-1">
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset scenario
              </Button>
              <Button size="sm" onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ScenarioInput({
  label, helper, value, onChange, max,
}: {
  label: string; helper: string; value: number; onChange: (n: number) => void; max: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <Input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0)))}
          className="w-20 h-8 text-right"
        />
      </div>
      <Slider
        value={[value]}
        min={0}
        max={max}
        step={1}
        onValueChange={(v) => onChange(v[0] ?? 0)}
      />
      <div className="text-xs text-muted-foreground">{helper}</div>
    </div>
  );
}

function ScenarioColumn({
  title, demand, available, ratio, band, highlight,
}: {
  title: string;
  demand: number;
  available: number;
  ratio: number;
  band: CapacityStatus;
  highlight?: boolean;
}) {
  const pct = isFinite(ratio) ? Math.round(ratio * 100) : 999;
  return (
    <Card className={highlight ? "border-primary/50 shadow-sm" : "border-border/60"}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
          <Badge status={band} />
        </div>
        <div className="text-2xl font-semibold tracking-tight">{pct}%</div>
        <div className="text-xs text-muted-foreground">
          {fmtHours(demand)} demand ÷ {fmtHours(available)} available
        </div>
      </CardContent>
    </Card>
  );
}