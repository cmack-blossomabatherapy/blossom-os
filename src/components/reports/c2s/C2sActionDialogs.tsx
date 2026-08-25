/**
 * Commit to Submit — workflow dialogs.
 *
 * Every dialog writes through the caller's own session, so the database RLS
 * policies and trigger guards are the authority. The UI only decides what to
 * *offer*; a rejected write surfaces the database's own plain-language reason.
 *
 * Deliberate omissions, matching program policy:
 * - No dialog can create a formal violation from proxy lag.
 * - No dialog carries pay, discipline, suspension, or termination fields.
 * - A level 3 notice sets an HR review requirement only.
 * - Employees never set their own dispute status, filing date, or deadline.
 */
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TriangleAlert } from "lucide-react";
import {
  C2S_DISPUTE_HOLIDAY_LIMITATION,
  C2S_DISPUTE_WINDOW_BUSINESS_DAYS,
  disputeFilingDeadline,
  evaluateNoticeEligibility,
  type C2sCoachingRecord,
  type C2sDisputeRecord,
  type C2sExceptionRecord,
  type C2sProgramConfig,
  type C2sTrackerRecord,
} from "@/lib/os/reports/crPrimary/metrics/commitToSubmit";
import {
  adjudicateC2sDispute,
  fileC2sDispute,
  issueC2sNotice,
  recordC2sCoaching,
  recordC2sException,
  recordC2sProgramReview,
  reviewC2sTrackerRecord,
  type C2sMutationResult,
} from "@/lib/os/reports/crPrimary/c2s/source";
import { localIsoDate } from "@/lib/os/reports/crPrimary/reportWindow";

interface BaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful write so the host page can reload. */
  onSaved: () => void;
}

function Shell({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel,
  onSubmit,
  disabled,
  onSaved,
  successMessage,
}: BaseProps & {
  title: string;
  description: string;
  children: ReactNode;
  submitLabel: string;
  onSubmit: () => Promise<C2sMutationResult>;
  disabled?: boolean;
  successMessage: string;
}) {
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    const result = await onSubmit();
    setSaving(false);
    if (!result.ok) {
      // Surface the database's own reason. The client never second-guesses it.
      toast.error(result.error ?? "The change could not be saved.");
      return;
    }
    toast.success(successMessage);
    onOpenChange(false);
    onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">{children}</div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || disabled}>
            {saving ? "Saving…" : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Blocked({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) return null;
  return (
    <div
      data-testid="c2s-blocked-reasons"
      className="rounded-xl border border-amber-500/40 bg-amber-500/[0.06] p-3 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300"
    >
      <p className="flex items-center gap-1.5 font-semibold">
        <TriangleAlert className="h-3.5 w-3.5" /> This step is not available yet
      </p>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
        {reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}

/** Employee dispute. Status, dates, and the deadline all come from the database. */
export function C2sDisputeDialog({
  open,
  onOpenChange,
  onSaved,
  subjectEmployeeId,
  trackerRecordId,
  noticeId,
  noticeIssuedAt,
}: BaseProps & {
  subjectEmployeeId: string;
  trackerRecordId: string | null;
  noticeId: string | null;
  noticeIssuedAt?: string | null;
}) {
  const [statement, setStatement] = useState("");
  const deadline = noticeIssuedAt ? disputeFilingDeadline(noticeIssuedAt) : null;
  return (
    <Shell
      open={open}
      onOpenChange={onOpenChange}
      onSaved={onSaved}
      title="File a dispute"
      description={`You have ${C2S_DISPUTE_WINDOW_BUSINESS_DAYS} business days from the notice date to dispute. ${
        deadline ? `Your deadline is ${deadline}. ` : ""
      }${C2S_DISPUTE_HOLIDAY_LIMITATION}`}
      submitLabel="Submit dispute"
      disabled={statement.trim().length < 10}
      successMessage="Your dispute was submitted for review."
      onSubmit={() =>
        fileC2sDispute({ subjectEmployeeId, trackerRecordId, noticeId, statement })
      }
    >
      <div className="space-y-1.5">
        <Label className="text-xs">What should the reviewer know?</Label>
        <Textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          rows={5}
          placeholder="Explain what happened and anything that supports your position."
        />
        <p className="text-[11px] text-muted-foreground">
          The review outcome, decision date, and deadline are recorded by the system — not here.
        </p>
      </div>
    </Shell>
  );
}

/** Direct-manager (or HR) coaching. Coaching always precedes a formal step. */
export function C2sCoachingDialog({
  open,
  onOpenChange,
  onSaved,
  subjectEmployeeId,
  subjectName,
}: BaseProps & { subjectEmployeeId: string; subjectName: string }) {
  const [coachingDate, setCoachingDate] = useState(localIsoDate());
  const [topic, setTopic] = useState("Documentation timeliness");
  const [summary, setSummary] = useState("");
  return (
    <Shell
      open={open}
      onOpenChange={onOpenChange}
      onSaved={onSaved}
      title={`Record coaching — ${subjectName}`}
      description="Coaching is the first step and must be recorded before any formal step can be considered."
      submitLabel="Save coaching"
      disabled={!coachingDate || summary.trim().length < 5}
      successMessage="Coaching recorded."
      onSubmit={() => recordC2sCoaching({ subjectEmployeeId, coachingDate, topic, summary })}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Coaching date</Label>
          <Input type="date" value={coachingDate} onChange={(e) => setCoachingDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Topic</Label>
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">What was discussed</Label>
        <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} />
      </div>
    </Shell>
  );
}

/** Direct-manager (or HR) program review recommendation. */
export function C2sProgramReviewDialog({
  open,
  onOpenChange,
  onSaved,
  subjectEmployeeId,
  subjectName,
  windowStart,
  windowEnd,
}: BaseProps & {
  subjectEmployeeId: string;
  subjectName: string;
  windowStart: string;
  windowEnd: string;
}) {
  const [reviewKind, setReviewKind] = useState("standard");
  const [from, setFrom] = useState(windowStart);
  const [to, setTo] = useState(windowEnd);
  const [recommendation, setRecommendation] = useState("");
  return (
    <Shell
      open={open}
      onOpenChange={onOpenChange}
      onSaved={onSaved}
      title={`Recommend a program review — ${subjectName}`}
      description="You record the manager recommendation and the window it covers. HR approval and the final outcome are recorded separately by HR."
      submitLabel="Submit recommendation"
      disabled={!from || !to || from > to || recommendation.trim().length < 5}
      successMessage="Review recommendation submitted."
      onSubmit={() =>
        recordC2sProgramReview({
          subjectEmployeeId,
          reviewKind,
          windowStart: from,
          windowEnd: to,
          managerRecommendation: recommendation,
        })
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Review kind</Label>
          <Select value={reviewKind} onValueChange={setReviewKind}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="follow_up">Follow-up</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Window start</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Window end</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Recommendation</Label>
        <Textarea
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
          rows={4}
        />
      </div>
    </Shell>
  );
}

/** HR review disposition on a tracker record. */
export function C2sReviewRecordDialog({
  open,
  onOpenChange,
  onSaved,
  record,
}: BaseProps & { record: C2sTrackerRecord }) {
  const [status, setStatus] = useState<"under_review" | "upheld" | "not_upheld" | "withdrawn">(
    "under_review",
  );
  const [notes, setNotes] = useState("");
  return (
    <Shell
      open={open}
      onOpenChange={onOpenChange}
      onSaved={onSaved}
      title="Record a review disposition"
      description="Only a reviewed record can ever support a formal step. Upholding a record does not by itself authorize a notice."
      submitLabel="Save disposition"
      successMessage="Review disposition saved."
      onSubmit={() => reviewC2sTrackerRecord({ id: record.id, reviewStatus: status, reviewNotes: notes })}
    >
      <div className="space-y-1.5">
        <Label className="text-xs">Disposition</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="under_review">Under review</SelectItem>
            <SelectItem value="upheld">Upheld</SelectItem>
            <SelectItem value="not_upheld">Not upheld</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
      </div>
    </Shell>
  );
}

/** HR exception, always linked to one specific record. */
export function C2sExceptionDialog({
  open,
  onOpenChange,
  onSaved,
  record,
}: BaseProps & { record: C2sTrackerRecord }) {
  const [exceptionType, setExceptionType] = useState("approved_leave");
  const [status, setStatus] = useState<"requested" | "approved">("requested");
  const [reason, setReason] = useState("");
  return (
    <Shell
      open={open}
      onOpenChange={onOpenChange}
      onSaved={onSaved}
      title="Record an exception"
      description="An exception is linked to this single record. An approved exception removes the record from active formal counts without erasing its history."
      submitLabel="Save exception"
      disabled={reason.trim().length < 5}
      successMessage="Exception recorded."
      onSubmit={() =>
        recordC2sException({
          subjectEmployeeId: record.subjectEmployeeId,
          trackerRecordId: record.id,
          exceptionType,
          status,
          reason,
        })
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <Select value={exceptionType} onValueChange={setExceptionType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approved_leave">Approved leave</SelectItem>
              <SelectItem value="system_outage">System outage</SelectItem>
              <SelectItem value="data_error">Data error</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="requested">Requested</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Reason</Label>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />
      </div>
    </Shell>
  );
}

/**
 * HR notice issuance. The dialog evaluates eligibility client-side purely to
 * explain what is missing; the database guard is what actually decides.
 */
export function C2sNoticeDialog({
  open,
  onOpenChange,
  onSaved,
  record,
  config,
  coaching,
  exceptions,
  disputes,
  priorLevels,
}: BaseProps & {
  record: C2sTrackerRecord;
  config: C2sProgramConfig | null;
  coaching: C2sCoachingRecord[];
  exceptions: C2sExceptionRecord[];
  disputes: C2sDisputeRecord[];
  priorLevels: number[];
}) {
  const nextLevel = Math.min(
    3,
    priorLevels.reduce((max, n) => Math.max(max, n), 0) + 1,
  ) as 1 | 2 | 3;
  const subjectCoaching = coaching.filter((c) => c.subjectEmployeeId === record.subjectEmployeeId);
  const [priorCoachingId, setPriorCoachingId] = useState(subjectCoaching[0]?.id ?? "");
  const eligibility = evaluateNoticeEligibility({
    level: nextLevel,
    config,
    record,
    coaching: subjectCoaching,
    exceptions,
    disputes,
    priorLevels,
  });
  const canSubmit = eligibility.allowed && Boolean(config?.id) && Boolean(priorCoachingId);
  return (
    <Shell
      open={open}
      onOpenChange={onOpenChange}
      onSaved={onSaved}
      title={`Issue a level ${nextLevel} notice`}
      description={
        nextLevel === 3
          ? "A level 3 notice creates an HR review requirement only. It triggers no pay change and no employment action."
          : "Notice levels advance one at a time and require prior coaching plus an upheld formal violation."
      }
      submitLabel={`Issue level ${nextLevel} notice`}
      disabled={!canSubmit}
      successMessage={`Level ${nextLevel} notice issued.`}
      onSubmit={() =>
        issueC2sNotice({
          subjectEmployeeId: record.subjectEmployeeId,
          trackerRecordId: record.id,
          configId: String(config?.id),
          noticeLevel: nextLevel,
          priorCoachingId,
        })
      }
    >
      <Blocked
        reasons={[
          ...eligibility.reasons,
          ...(config?.id ? [] : ["No active, fully approved program configuration is readable."]),
          ...(subjectCoaching.length > 0 ? [] : ["No coaching record exists for this employee."]),
        ]}
      />
      {subjectCoaching.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs">Prior coaching this notice follows</Label>
          <Select value={priorCoachingId} onValueChange={setPriorCoachingId}>
            <SelectTrigger>
              <SelectValue placeholder="Select coaching" />
            </SelectTrigger>
            <SelectContent>
              {subjectCoaching.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.coachingDate ?? "Undated coaching"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </Shell>
  );
}

/** HR dispute adjudication. */
export function C2sAdjudicateDisputeDialog({
  open,
  onOpenChange,
  onSaved,
  disputeId,
}: BaseProps & { disputeId: string }) {
  const [status, setStatus] = useState<"under_review" | "upheld" | "denied">("under_review");
  const [notes, setNotes] = useState("");
  return (
    <Shell
      open={open}
      onOpenChange={onOpenChange}
      onSaved={onSaved}
      title="Record a dispute decision"
      description="An upheld dispute overturns the record and removes it from active formal counts. History is preserved either way."
      submitLabel="Save decision"
      successMessage="Dispute decision saved."
      onSubmit={() => adjudicateC2sDispute({ id: disputeId, status, decisionNotes: notes })}
    >
      <div className="space-y-1.5">
        <Label className="text-xs">Decision</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="under_review">Under review</SelectItem>
            <SelectItem value="upheld">Upheld</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Decision notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
      </div>
    </Shell>
  );
}
