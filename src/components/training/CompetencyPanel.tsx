import { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, ShieldCheck, Filter, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  COMPETENCY_TASKS,
  WITH_CLIENT_RULE,
  useCompetencyRecord,
  validateCompetency,
  updateCompetencyTask,
  updateCompetencyMeta,
  updateResponsibleAssessor,
  attestFinalCompetency,
  type CompetencyAssessmentType,
  type CompetencyTaskStatus,
  type CompetencyTaskDef,
} from "@/lib/training/rbtCompetency";

type FilterKey = "All" | "Needs Reassessment" | "With Client Required" | "Interview" | "Complete";

const STATUS_OPTIONS: CompetencyTaskStatus[] = [
  "Not Started",
  "Scheduled",
  "Competent",
  "Not Yet Competent",
  "Reassessment Needed",
  "Complete",
];

function statusTone(s: CompetencyTaskStatus): string {
  if (s === "Competent" || s === "Complete") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "Reassessment Needed" || s === "Not Yet Competent") return "bg-amber-50 text-amber-700 border-amber-200";
  if (s === "Scheduled") return "bg-sky-50 text-sky-700 border-sky-200";
  return "bg-muted text-muted-foreground border-border";
}

/**
 * Admin / clinical panel for the 2026 BACB Initial Competency Assessment.
 * Reads/writes the localStorage-backed competency record for a trainee.
 * Validation is centralized in `validateCompetency` and surfaced as a
 * blocker banner so the same rules drive learner + admin + readiness.
 */
export function CompetencyPanel({
  traineeId,
  trackId,
  readOnly = false,
}: {
  traineeId: string;
  trackId: string;
  readOnly?: boolean;
}) {
  const record = useCompetencyRecord(traineeId, trackId);
  const validation = useMemo(() => validateCompetency(record), [record]);
  const [filter, setFilter] = useState<FilterKey>("All");

  const filteredTasks = useMemo(() => {
    return COMPETENCY_TASKS.filter((def) => {
      const rec = record.tasks.find((t) => t.number === def.number);
      switch (filter) {
        case "All": return true;
        case "Needs Reassessment": return rec?.status === "Reassessment Needed" || rec?.status === "Not Yet Competent";
        case "With Client Required": return def.inWithClientRule;
        case "Interview": return def.allowed.includes("Interview");
        case "Complete": return rec?.status === "Competent" || rec?.status === "Complete";
      }
    });
  }, [filter, record.tasks]);

  const onAttest = () => {
    const res = attestFinalCompetency(traineeId, trackId);
    if (!res.ok) {
      // Validation surfaces in banner; no toast dependency in this component.
      // (Consumers can wrap in their own toast wiring if desired.)
      // eslint-disable-next-line no-alert
      alert(`Cannot attest yet:\n• ${res.blockers.join("\n• ")}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Validation banner */}
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl border p-4",
          validation.ok
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-900",
        )}
      >
        {validation.ok ? (
          <ShieldCheck className="mt-0.5 size-5 shrink-0" />
        ) : (
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold">
            {validation.ok ? "Ready to attest — all validation rules satisfied." : "Cannot finalize competency yet"}
          </p>
          <ul className="mt-1.5 space-y-1 text-[12.5px]">
            <li>Tasks competent: {validation.completedTaskCount}/{validation.totalTaskCount}</li>
            <li>With-Client demonstrations in items 6–14: {validation.withClientCount} of {WITH_CLIENT_RULE.minimum} required</li>
            <li>Inside 90-day window: {validation.inWindow ? "Yes" : "No"}</li>
          </ul>
          {!validation.ok && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[12px]">
              {validation.blockers.map((b) => <li key={b}>{b}</li>)}
            </ul>
          )}
        </div>
      </div>

      {/* Meta + responsible assessor */}
      <div className="grid gap-3 md:grid-cols-2">
        <MetaCard
          title="Training & dates"
          rows={[
            {
              label: "40-hour training complete",
              control: (
                <input
                  type="date"
                  className="rounded-md border border-border bg-card px-2 py-1 text-[12px]"
                  value={record.fortyHourCompletedAt ?? ""}
                  disabled={readOnly}
                  onChange={(e) => updateCompetencyMeta(traineeId, trackId, { fortyHourCompletedAt: e.target.value || undefined })}
                />
              ),
            },
            {
              label: "Certification application target",
              control: (
                <input
                  type="date"
                  className="rounded-md border border-border bg-card px-2 py-1 text-[12px]"
                  value={record.certificationApplicationTargetDate ?? ""}
                  disabled={readOnly}
                  onChange={(e) => updateCompetencyMeta(traineeId, trackId, { certificationApplicationTargetDate: e.target.value || undefined })}
                />
              ),
            },
            {
              label: "Final attestation",
              control: record.finalAttestationAt ? (
                <span className="text-[12px] text-emerald-700">{new Date(record.finalAttestationAt).toLocaleDateString()}</span>
              ) : (
                <span className="text-[12px] text-muted-foreground">Not yet attested</span>
              ),
            },
          ]}
        />
        <MetaCard
          title="Responsible assessor"
          rows={[
            {
              label: "Name",
              control: (
                <input
                  type="text"
                  className="w-full rounded-md border border-border bg-card px-2 py-1 text-[12px]"
                  value={record.responsible.name}
                  disabled={readOnly}
                  onChange={(e) => updateResponsibleAssessor(traineeId, trackId, { name: e.target.value })}
                />
              ),
            },
            {
              label: "Credential",
              control: (
                <select
                  className="rounded-md border border-border bg-card px-2 py-1 text-[12px]"
                  value={record.responsible.credential}
                  disabled={readOnly}
                  onChange={(e) => updateResponsibleAssessor(traineeId, trackId, { credential: e.target.value as "BCBA" | "BCaBA" | "RBT" | "Other" | "" })}
                >
                  <option value="">Select</option>
                  <option value="BCBA">BCBA</option>
                  <option value="BCaBA">BCaBA</option>
                  <option value="RBT">RBT</option>
                  <option value="Other">Other</option>
                </select>
              ),
            },
            {
              label: "8-hour supervision training",
              control: (
                <label className="inline-flex items-center gap-2 text-[12px]">
                  <input
                    type="checkbox"
                    checked={record.responsible.supervisionTrainingComplete}
                    disabled={readOnly}
                    onChange={(e) => updateResponsibleAssessor(traineeId, trackId, { supervisionTrainingComplete: e.target.checked })}
                  />
                  Complete
                </label>
              ),
            },
            {
              label: "Organization relationship",
              control: (
                <select
                  className="rounded-md border border-border bg-card px-2 py-1 text-[12px]"
                  value={record.responsible.organizationRelationship}
                  disabled={readOnly}
                  onChange={(e) => updateResponsibleAssessor(traineeId, trackId, { organizationRelationship: e.target.value as "" | "Direct employer / supervisor" | "Contracted by employer" | "Other approved relationship" })}
                >
                  <option value="">Select</option>
                  <option>Direct employer / supervisor</option>
                  <option>Contracted by employer</option>
                  <option>Other approved relationship</option>
                </select>
              ),
            },
          ]}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="size-3.5 text-muted-foreground" />
        {(["All", "Needs Reassessment", "With Client Required", "Interview", "Complete"] as FilterKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] font-medium transition",
              filter === k
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Tasks */}
      <div className="space-y-2">
        {filteredTasks.map((def) => (
          <TaskRow
            key={def.number}
            def={def}
            record={record.tasks.find((t) => t.number === def.number)}
            readOnly={readOnly}
            onPatch={(patch) => updateCompetencyTask(traineeId, trackId, def.number, patch)}
          />
        ))}
      </div>

      {/* Attest */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
          <p className="text-[12.5px] text-muted-foreground">
            Final attestation can only be recorded when every validation rule above is satisfied.
          </p>
          <button
            type="button"
            onClick={onAttest}
            disabled={!validation.ok || !!record.finalAttestationAt}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 h-9 text-[12.5px] font-medium transition",
              validation.ok && !record.finalAttestationAt
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground",
            )}
          >
            <ClipboardCheck className="size-4" />
            {record.finalAttestationAt ? "Already attested" : "Sign final attestation"}
          </button>
        </div>
      )}
    </div>
  );
}

function MetaCard({ title, rows }: { title: string; rows: { label: string; control: React.ReactNode }[] }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <div className="mt-2 space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3">
            <span className="text-[12px] text-foreground/90">{r.label}</span>
            <div className="shrink-0">{r.control}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskRow({
  def,
  record,
  readOnly,
  onPatch,
}: {
  def: CompetencyTaskDef;
  record?: { number: number; status: CompetencyTaskStatus; assessmentType?: CompetencyAssessmentType; dateAssessed?: string; assessorInitials?: string; evidence?: string; feedback?: string; reassessmentDate?: string };
  readOnly: boolean;
  onPatch: (patch: { status?: CompetencyTaskStatus; assessmentType?: CompetencyAssessmentType; dateAssessed?: string; assessorInitials?: string; evidence?: string; feedback?: string; reassessmentDate?: string }) => void;
}) {
  const status: CompetencyTaskStatus = record?.status ?? "Not Started";
  const completed = status === "Competent" || status === "Complete";
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">#{def.number}</span>
            <h4 className="text-[13.5px] font-semibold tracking-tight">{def.title}</h4>
            <Badge variant="outline" className="text-[10px]">{def.category}</Badge>
            {def.inWithClientRule && <Badge variant="outline" className="border-violet-300 bg-violet-50 text-[10px] text-violet-700">Counts toward With-Client minimum</Badge>}
          </div>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            Allowed: {def.allowed.join(" · ")}
          </p>
        </div>
        <Badge variant="outline" className={cn("text-[10.5px]", statusTone(status))}>
          {completed ? <CheckCircle2 className="mr-1 inline size-3" /> : null}{status}
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Cell label="Status">
          <select
            className="w-full rounded-md border border-border bg-card px-2 py-1 text-[12px]"
            value={status}
            disabled={readOnly}
            onChange={(e) => onPatch({ status: e.target.value as CompetencyTaskStatus })}
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Cell>
        <Cell label="Assessment type">
          <select
            className="w-full rounded-md border border-border bg-card px-2 py-1 text-[12px]"
            value={record?.assessmentType ?? ""}
            disabled={readOnly}
            onChange={(e) => onPatch({ assessmentType: (e.target.value || undefined) as CompetencyAssessmentType | undefined })}
          >
            <option value="">Select</option>
            {def.allowed.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Cell>
        <Cell label="Date assessed">
          <input
            type="date"
            className="w-full rounded-md border border-border bg-card px-2 py-1 text-[12px]"
            value={record?.dateAssessed ?? ""}
            disabled={readOnly}
            onChange={(e) => onPatch({ dateAssessed: e.target.value || undefined })}
          />
        </Cell>
        <Cell label="Assessor initials">
          <input
            type="text"
            maxLength={4}
            className="w-full rounded-md border border-border bg-card px-2 py-1 text-[12px]"
            value={record?.assessorInitials ?? ""}
            disabled={readOnly}
            onChange={(e) => onPatch({ assessorInitials: e.target.value || undefined })}
          />
        </Cell>
        <Cell label="Evidence (link or filename)" className="md:col-span-2">
          <input
            type="text"
            placeholder="upload pending"
            className="w-full rounded-md border border-border bg-card px-2 py-1 text-[12px]"
            value={record?.evidence ?? ""}
            disabled={readOnly}
            onChange={(e) => onPatch({ evidence: e.target.value || undefined })}
          />
        </Cell>
        <Cell label="Reassessment date">
          <input
            type="date"
            className="w-full rounded-md border border-border bg-card px-2 py-1 text-[12px]"
            value={record?.reassessmentDate ?? ""}
            disabled={readOnly}
            onChange={(e) => onPatch({ reassessmentDate: e.target.value || undefined })}
          />
        </Cell>
        <Cell label="Corrective feedback (not on final assessment)" className="md:col-span-4">
          <textarea
            rows={2}
            className="w-full rounded-md border border-border bg-card px-2 py-1 text-[12px]"
            value={record?.feedback ?? ""}
            disabled={readOnly}
            onChange={(e) => onPatch({ feedback: e.target.value || undefined })}
          />
        </Cell>
      </div>
    </div>
  );
}

function Cell({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}