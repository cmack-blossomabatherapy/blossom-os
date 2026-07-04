import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

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
  onSubmit: (task: { title: string; description?: string; due_at?: string | null }) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (props.open) { setTitle(""); setDescription(""); setDueAt(""); setBusy(false); } }, [props.open]);
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
  onSubmit: (outcome: string) => Promise<void> | void;
}) {
  const [outcome, setOutcome] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (props.open) { setOutcome(""); setBusy(false); } }, [props.open]);
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete follow-up</DialogTitle>
          <DialogDescription>
            {props.clientName ? `Record the outcome for ${props.clientName}.` : "Record the follow-up outcome."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="bs-outcome">Outcome *</Label>
          <Textarea id="bs-outcome" rows={4} value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="What was discussed, any next step or escalation." />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button
            disabled={!outcome.trim() || busy}
            onClick={async () => {
              setBusy(true);
              try { await props.onSubmit(outcome.trim()); props.onOpenChange(false); }
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
  onSubmit: (v: { due_at: string; notes?: string }) => Promise<void> | void;
}) {
  const [dueAt, setDueAt] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (props.open) {
      const d = props.defaultDueAt ?? new Date(Date.now() + 86_400_000).toISOString().slice(0, 16);
      setDueAt(d);
      setNotes("");
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
          <div className="space-y-1.5">
            <Label htmlFor="bs-fu-due">Due *</Label>
            <Input id="bs-fu-due" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
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
              try { await props.onSubmit({ due_at: new Date(dueAt).toISOString(), notes: notes.trim() || undefined }); props.onOpenChange(false); }
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