import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  CASE_STATUSES, FU_TYPES, PRIORITIES, TASK_STATUSES,
  type BSCaseStatus, type BSFollowupType, type BSPriority, type BSSeverity, type BSTaskStatus,
} from "./behavioralSupportTypes";

/**
 * Small polished dialog primitives that replace the browser `prompt()` calls
 * previously used across Behavioral Support pages. Each dialog validates a
 * required field, shows a loading state, and delegates submission to the
 * parent via an async onSubmit.
 */

interface BaseProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function BehavioralSupportNoteDialog(props: BaseProps & {
  title?: string;
  description?: string;
  onSubmit: (note: string) => Promise<void> | void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (props.open) { setNote(""); setBusy(false); } }, [props.open]);
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title ?? "Add note"}</DialogTitle>
          <DialogDescription>{props.description ?? "Notes are recorded in the Behavioral Support activity timeline."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="bs-note">Note *</Label>
          <Textarea id="bs-note" rows={5} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened, what was decided, next steps…" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button
            disabled={!note.trim() || busy}
            onClick={async () => {
              setBusy(true);
              try { await props.onSubmit(note.trim()); props.onOpenChange(false); }
              finally { setBusy(false); }
            }}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Save note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BehavioralSupportTaskDialog(props: BaseProps & {
  onSubmit: (task: {
    title: string;
    description?: string;
    due_at?: string | null;
    assigned_to_name?: string | null;
    status?: BSTaskStatus;
  }) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [assignedOwner, setAssignedOwner] = useState("");
  const [status, setStatus] = useState<BSTaskStatus>("open");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (props.open) {
      setTitle(""); setDescription(""); setDueAt(""); setAssignedOwner(""); setStatus("open"); setBusy(false);
    }
  }, [props.open]);
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add plan task</DialogTitle>
          <DialogDescription>Break the support plan into a concrete follow-up action.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="bs-task-title">Title *</Label>
            <Input id="bs-task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Review antecedent data with parent" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bs-task-desc">Description</Label>
            <Textarea id="bs-task-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bs-task-owner">Assigned owner</Label>
              <Input id="bs-task-owner" value={assignedOwner} onChange={(e) => setAssignedOwner(e.target.value)} placeholder="e.g. Jamie B." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bs-task-status">Status</Label>
              <select id="bs-task-status" value={status} onChange={(e) => setStatus(e.target.value as BSTaskStatus)} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm h-9">
                {TASK_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bs-task-due">Due</Label>
            <Input id="bs-task-due" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button
            disabled={!title.trim() || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await props.onSubmit({
                  title: title.trim(),
                  description: description.trim() || undefined,
                  due_at: dueAt ? new Date(dueAt).toISOString() : null,
                  assigned_to_name: assignedOwner.trim() || null,
                  status,
                });
                props.onOpenChange(false);
              } finally { setBusy(false); }
            }}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Add task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BehavioralSupportPlanDialog(props: BaseProps & {
  defaultTitle?: string;
  clientName?: string | null;
  onSubmit: (v: { plan_title: string; notes?: string }) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (props.open) {
      setTitle(props.defaultTitle ?? (props.clientName ? `Support plan for ${props.clientName}` : ""));
      setNotes("");
      setBusy(false);
    }
  }, [props.open, props.defaultTitle, props.clientName]);
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create support plan</DialogTitle>
          <DialogDescription>
            {props.clientName ? `Draft plan prefilled for ${props.clientName}.` : "Draft a new behavioral support plan."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="bs-plan-title">Plan title *</Label>
            <Input id="bs-plan-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bs-plan-notes">Reason / context</Label>
            <Textarea id="bs-plan-notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why is a support plan being opened now?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button
            disabled={!title.trim() || busy}
            onClick={async () => {
              setBusy(true);
              try { await props.onSubmit({ plan_title: title.trim(), notes: notes.trim() || undefined }); props.onOpenChange(false); }
              finally { setBusy(false); }
            }}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Create plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BehavioralSupportFollowupCompleteDialog(props: BaseProps & {
  clientName?: string | null;
  onSubmit: (v: {
    outcome: string;
    resolved: boolean;
    nextStepNeeded: boolean;
    nextFollowupDueAt: string | null;
    note: string | null;
  }) => Promise<void> | void;
}) {
  const [outcome, setOutcome] = useState("");
  const [resolved, setResolved] = useState(false);
  const [nextStep, setNextStep] = useState(false);
  const [nextDue, setNextDue] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (props.open) {
      setOutcome(""); setResolved(false); setNextStep(false); setNextDue(""); setNote(""); setBusy(false);
    }
  }, [props.open]);
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete follow-up</DialogTitle>
          <DialogDescription>
            {props.clientName ? `Record the outcome for ${props.clientName}.` : "Record the follow-up outcome."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="bs-outcome">Outcome *</Label>
            <Textarea id="bs-outcome" rows={4} value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="What was discussed, any next step or escalation." />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={resolved} onChange={(e) => setResolved(e.target.checked)} />
              Resolved
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={nextStep} onChange={(e) => setNextStep(e.target.checked)} />
              Next step needed
            </label>
          </div>
          {nextStep && (
            <div className="space-y-1.5">
              <Label htmlFor="bs-outcome-nextdue">Next follow-up due</Label>
              <Input id="bs-outcome-nextdue" type="datetime-local" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="bs-outcome-note">Note</Label>
            <Textarea id="bs-outcome-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button
            disabled={!outcome.trim() || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await props.onSubmit({
                  outcome: outcome.trim(),
                  resolved,
                  nextStepNeeded: nextStep,
                  nextFollowupDueAt: nextStep && nextDue ? new Date(nextDue).toISOString() : null,
                  note: note.trim() || null,
                });
                props.onOpenChange(false);
              }
              finally { setBusy(false); }
            }}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Mark complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BehavioralSupportEscalationDialog(props: BaseProps & {
  clientName?: string | null;
  defaultDescription?: string;
  onSubmit: (description: string) => Promise<void> | void;
}) {
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (props.open) { setDescription(props.defaultDescription ?? ""); setBusy(false); } }, [props.open, props.defaultDescription]);
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open escalation</DialogTitle>
          <DialogDescription>
            {props.clientName ? `Escalate a supervision signal for ${props.clientName}.` : "Open a new behavioral escalation."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="bs-esc-desc">Description *</Label>
          <Textarea id="bs-esc-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the concern and any immediate action taken." />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button
            disabled={!description.trim() || busy}
            onClick={async () => {
              setBusy(true);
              try { await props.onSubmit(description.trim()); props.onOpenChange(false); }
              finally { setBusy(false); }
            }}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Escalate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BehavioralSupportFollowupDialog(props: BaseProps & {
  clientName?: string | null;
  defaultDueAt?: string;
  onSubmit: (v: {
    due_at: string;
    followup_type: BSFollowupType;
    priority: BSPriority;
    assigned_to_name?: string | null;
    notes?: string;
  }) => Promise<void> | void;
}) {
  const [dueAt, setDueAt] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState<BSFollowupType>("bcba_checkin");
  const [priority, setPriority] = useState<BSPriority>("medium");
  const [owner, setOwner] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (props.open) {
      const d = props.defaultDueAt ?? new Date(Date.now() + 86_400_000).toISOString().slice(0, 16);
      setDueAt(d);
      setNotes("");
      setType("bcba_checkin");
      setPriority("medium");
      setOwner("");
      setBusy(false);
    }
  }, [props.open, props.defaultDueAt]);
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule follow-up</DialogTitle>
          <DialogDescription>
            {props.clientName ? `Create a follow-up for ${props.clientName}.` : "Create a new follow-up."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bs-fu-type">Follow-up type</Label>
              <select id="bs-fu-type" value={type} onChange={(e) => setType(e.target.value as BSFollowupType)} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm h-9">
                {FU_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bs-fu-priority">Priority</Label>
              <select id="bs-fu-priority" value={priority} onChange={(e) => setPriority(e.target.value as BSPriority)} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm h-9">
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bs-fu-due">Due *</Label>
            <Input id="bs-fu-due" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bs-fu-owner">Assigned owner</Label>
            <Input id="bs-fu-owner" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="e.g. Alex R." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bs-fu-notes">Notes</Label>
            <Textarea id="bs-fu-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button
            disabled={!dueAt || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await props.onSubmit({
                  due_at: new Date(dueAt).toISOString(),
                  followup_type: type,
                  priority,
                  assigned_to_name: owner.trim() || null,
                  notes: notes.trim() || undefined,
                });
                props.onOpenChange(false);
              }
              finally { setBusy(false); }
            }}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * BehavioralSupportCaseDialog — real New Case workflow for the Behavioral
 * Support Dashboard. Persists via bs.createCase.
 */
export function BehavioralSupportCaseDialog(props: BaseProps & {
  onSubmit: (v: {
    client_name: string;
    state: string | null;
    bcba_name: string | null;
    rbt_name: string | null;
    severity: BSSeverity;
    status: BSCaseStatus;
    source_system: string;
    centralreach_client_id: string | null;
    primary_concern: string | null;
    initial_note: string | null;
  }) => Promise<void> | void;
}) {
  const [clientName, setClientName] = useState("");
  const [state, setState] = useState("");
  const [bcba, setBcba] = useState("");
  const [rbt, setRbt] = useState("");
  const [severity, setSeverity] = useState<BSSeverity>("medium");
  const [status, setStatus] = useState<BSCaseStatus>("open");
  const [source, setSource] = useState("manual");
  const [crId, setCrId] = useState("");
  const [concern, setConcern] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (props.open) {
      setClientName(""); setState(""); setBcba(""); setRbt(""); setSeverity("medium");
      setStatus("open"); setSource("manual"); setCrId(""); setConcern(""); setNote(""); setBusy(false);
    }
  }, [props.open]);
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Open new case</DialogTitle>
          <DialogDescription>
            Create a Behavioral Support case to track a family, escalations, plans, and follow-ups.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[65vh] overflow-auto pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="bs-case-client">Client name *</Label>
            <Input id="bs-case-client" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Family last name or client identifier" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bs-case-state">State</Label>
              <Input id="bs-case-state" value={state} onChange={(e) => setState(e.target.value)} placeholder="GA, NC, VA…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bs-case-source">Source system</Label>
              <select id="bs-case-source" value={source} onChange={(e) => setSource(e.target.value)} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm h-9">
                <option value="manual">Manual entry</option>
                <option value="centralreach">CentralReach</option>
                <option value="phone">Phone call</option>
                <option value="intake">Intake</option>
                <option value="qa">QA</option>
                <option value="case_manager">Case Manager</option>
                <option value="bcba">BCBA</option>
                <option value="rbt">RBT</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bs-case-bcba">BCBA</Label>
              <Input id="bs-case-bcba" value={bcba} onChange={(e) => setBcba(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bs-case-rbt">RBT</Label>
              <Input id="bs-case-rbt" value={rbt} onChange={(e) => setRbt(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bs-case-severity">Severity</Label>
              <select id="bs-case-severity" value={severity} onChange={(e) => setSeverity(e.target.value as BSSeverity)} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm h-9">
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="crisis">crisis</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bs-case-status">Status</Label>
              <select id="bs-case-status" value={status} onChange={(e) => setStatus(e.target.value as BSCaseStatus)} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm h-9">
                {CASE_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bs-case-crid">CentralReach client id</Label>
            <Input id="bs-case-crid" value={crId} onChange={(e) => setCrId(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bs-case-concern">Summary / current concern</Label>
            <Textarea id="bs-case-concern" rows={3} value={concern} onChange={(e) => setConcern(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bs-case-note">Initial note</Label>
            <Textarea id="bs-case-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Context, immediate action, next step…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button
            disabled={!clientName.trim() || busy}
            onClick={async () => {
              setBusy(true);
              try {
                const ALLOWED_SOURCES = ["manual","centralreach","phone","intake","qa","case_manager","bcba","rbt","other"];
                const safeSource = ALLOWED_SOURCES.includes(source) ? source : "manual";
                await props.onSubmit({
                  client_name: clientName.trim(),
                  state: state.trim() || null,
                  bcba_name: bcba.trim() || null,
                  rbt_name: rbt.trim() || null,
                  severity, status,
                  source_system: safeSource,
                  centralreach_client_id: crId.trim() || null,
                  primary_concern: concern.trim() || null,
                  initial_note: note.trim() || null,
                });
                props.onOpenChange(false);
              } finally { setBusy(false); }
            }}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Open case
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}