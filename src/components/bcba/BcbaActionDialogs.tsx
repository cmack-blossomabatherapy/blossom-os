import { useCallback, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  useBcbaWorkflow,
  type BcbaWorkflowScope,
  type BcbaActionTask,
} from "@/hooks/useBcbaWorkflow";

/**
 * Shared BCBA action dialogs. All submissions persist through useBcbaWorkflow
 * so they survive refresh and appear in the correct BCBA pages.
 *
 * Usage:
 *   const bcba = useBcbaActionDialogs({ scope, clientOptions });
 *   <button onClick={() => bcba.openNote()}>Add note</button>
 *   {bcba.dialogs}
 *   bcba.workflow  // useBcbaWorkflow result if the page needs the data too
 */

export interface BcbaActionDialogsOptions {
  scope?: BcbaWorkflowScope;
  /** Optional caseload client names to make selection easier. */
  clientOptions?: string[];
  /** Default source area label for created records (task / note). */
  defaultSourceArea?: string;
  onAfterAction?: () => void;
}

type OpenKind = "note" | "task" | "supervision" | "pt" | "plan" | null;

export function useBcbaActionDialogs(opts: BcbaActionDialogsOptions = {}) {
  const { scope = {}, clientOptions = [], defaultSourceArea = "caseload", onAfterAction } = opts;
  const workflow = useBcbaWorkflow(scope);
  const [open, setOpen] = useState<OpenKind>(null);
  const [presetClient, setPresetClient] = useState<string | null>(null);

  const openNote = useCallback((clientName?: string) => {
    setPresetClient(clientName ?? scope.clientName ?? null);
    setOpen("note");
  }, [scope.clientName]);
  const openTask = useCallback((clientName?: string) => {
    setPresetClient(clientName ?? scope.clientName ?? null);
    setOpen("task");
  }, [scope.clientName]);
  const openSupervision = useCallback((clientName?: string) => {
    setPresetClient(clientName ?? scope.clientName ?? null);
    setOpen("supervision");
  }, [scope.clientName]);
  const openParentTraining = useCallback((clientName?: string) => {
    setPresetClient(clientName ?? scope.clientName ?? null);
    setOpen("pt");
  }, [scope.clientName]);
  const openPlanItem = useCallback((clientName?: string) => {
    setPresetClient(clientName ?? scope.clientName ?? null);
    setOpen("plan");
  }, [scope.clientName]);

  const close = () => setOpen(null);

  const runAfter = () => {
    onAfterAction?.();
  };

  const dialogs = (
    <>
      <NoteDialog
        open={open === "note"}
        onClose={close}
        clientOptions={clientOptions}
        initialClient={presetClient}
        defaultSourceArea={defaultSourceArea}
        onSubmit={async (payload) => {
          try {
            await workflow.addNote(payload);
            toast.success("Note saved");
            runAfter();
          } catch (e: any) {
            toast.error(e?.message ?? "Failed to save note");
          }
        }}
      />
      <TaskDialog
        open={open === "task"}
        onClose={close}
        clientOptions={clientOptions}
        initialClient={presetClient}
        defaultSourceArea={defaultSourceArea}
        onSubmit={async (payload) => {
          try {
            await workflow.createTask(payload);
            toast.success("Task created");
            runAfter();
          } catch (e: any) {
            toast.error(e?.message ?? "Failed to create task");
          }
        }}
      />
      <SupervisionDialog
        open={open === "supervision"}
        onClose={close}
        clientOptions={clientOptions}
        initialClient={presetClient}
        onSubmit={async (payload, nextAction) => {
          try {
            const log = await workflow.logSupervision(payload);
            if (nextAction && nextAction.trim()) {
              await workflow.createTask({
                client_name: log.client_name,
                client_id: log.client_id,
                source_area: "supervision",
                title: `Supervision follow-up: ${nextAction}`,
                priority: "normal",
                status: "open",
              });
            }
            toast.success("Supervision logged");
            runAfter();
          } catch (e: any) {
            toast.error(e?.message ?? "Failed to log supervision");
          }
        }}
      />
      <ParentTrainingDialog
        open={open === "pt"}
        onClose={close}
        clientOptions={clientOptions}
        initialClient={presetClient}
        onSubmit={async (payload, nextDue) => {
          try {
            const log = await workflow.logParentTraining(payload);
            if (nextDue) {
              await workflow.createTask({
                client_name: log.client_name,
                client_id: log.client_id,
                source_area: "parent_training",
                title: `Next parent training session (${nextDue})`,
                due_date: nextDue,
                priority: "normal",
                status: "open",
              });
            }
            toast.success("Parent training logged");
            runAfter();
          } catch (e: any) {
            toast.error(e?.message ?? "Failed to log parent training");
          }
        }}
      />
      <PlanItemDialog
        open={open === "plan"}
        onClose={close}
        clientOptions={clientOptions}
        initialClient={presetClient}
        onSubmit={async (payload) => {
          try {
            await workflow.upsertPlanItem(payload);
            toast.success("Treatment plan updated");
            runAfter();
          } catch (e: any) {
            toast.error(e?.message ?? "Failed to update treatment plan");
          }
        }}
      />
    </>
  );

  return {
    workflow,
    dialogs,
    openNote,
    openTask,
    openSupervision,
    openParentTraining,
    openPlanItem,
  };
}

/** Compact quick-action bar. Buttons persist through useBcbaActionDialogs. */
export function BcbaQuickActionBar(props: {
  onNote: () => void;
  onTask: () => void;
  onSupervision: () => void;
  onParentTraining: () => void;
  onPlanItem?: () => void;
  className?: string;
}) {
  const btn = "inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted";
  return (
    <div className={"flex flex-wrap gap-2 " + (props.className ?? "")}>
      <button type="button" className={btn} onClick={props.onNote}>Add note</button>
      <button type="button" className={btn} onClick={props.onTask}>Create task</button>
      <button type="button" className={btn} onClick={props.onSupervision}>Log supervision</button>
      <button type="button" className={btn} onClick={props.onParentTraining}>Log parent training</button>
      {props.onPlanItem ? (
        <button type="button" className={btn} onClick={props.onPlanItem}>Update plan status</button>
      ) : null}
    </div>
  );
}

/** Renders task list with complete action. */
export function BcbaTaskList({
  tasks, onComplete, empty = "No open tasks.",
}: {
  tasks: BcbaActionTask[];
  onComplete: (id: string) => void | Promise<any>;
  empty?: string;
}) {
  if (!tasks.length) {
    return <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{empty}</div>;
  }
  return (
    <ul className="space-y-2">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3 py-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-foreground">{t.title}</div>
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {t.client_name ?? "—"} · {t.source_area} · {t.priority}
              {t.due_date ? ` · due ${t.due_date}` : ""}
            </div>
          </div>
          {t.status !== "completed" ? (
            <button
              type="button"
              className="rounded-lg border border-border/70 bg-card px-2.5 py-1 text-xs font-medium hover:bg-muted"
              onClick={() => onComplete(t.id)}
            >
              Mark complete
            </button>
          ) : (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Completed</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/* --------------- Dialog primitives --------------- */

function ClientPicker({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: string[] }) {
  if (options.length === 0) {
    return (
      <Input
        placeholder="Client name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <select
      className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select client…</option>
      {options.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function NoteDialog(props: {
  open: boolean; onClose: () => void;
  clientOptions: string[]; initialClient: string | null;
  defaultSourceArea: string;
  onSubmit: (payload: any) => Promise<void>;
}) {
  const [client, setClient] = useState(props.initialClient ?? "");
  const [noteType, setNoteType] = useState("general");
  const [body, setBody] = useState("");
  const submit = async () => {
    if (!body.trim()) return;
    await props.onSubmit({
      client_name: client || null,
      note_type: noteType,
      body,
      visibility: "team",
    });
    setBody(""); setNoteType("general");
    props.onClose();
  };
  return (
    <Dialog open={props.open} onOpenChange={(o) => { if (!o) props.onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add client note</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Client">
            <ClientPicker value={client} onChange={setClient} options={props.clientOptions} />
          </Field>
          <Field label="Note type">
            <Input value={noteType} onChange={(e) => setNoteType(e.target.value)} placeholder="e.g. clinical, coordination" />
          </Field>
          <Field label="Note">
            <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What happened / what needs to be tracked?" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={props.onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!body.trim()}>Save note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskDialog(props: {
  open: boolean; onClose: () => void;
  clientOptions: string[]; initialClient: string | null;
  defaultSourceArea: string;
  onSubmit: (payload: any) => Promise<void>;
}) {
  const [client, setClient] = useState(props.initialClient ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [due, setDue] = useState("");
  const [sourceArea, setSourceArea] = useState(props.defaultSourceArea);
  const submit = async () => {
    if (!title.trim()) return;
    await props.onSubmit({
      client_name: client || null,
      source_area: sourceArea,
      title, description: description || null,
      priority, status: "open",
      due_date: due || null,
    });
    setTitle(""); setDescription(""); setDue(""); setPriority("normal");
    props.onClose();
  };
  return (
    <Dialog open={props.open} onOpenChange={(o) => { if (!o) props.onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create task</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Client">
            <ClientPicker value={client} onChange={setClient} options={props.clientOptions} />
          </Field>
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to happen?" />
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Priority">
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </Field>
            <Field label="Source area">
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={sourceArea} onChange={(e) => setSourceArea(e.target.value)}>
                <option value="caseload">Caseload</option>
                <option value="supervision">Supervision</option>
                <option value="parent_training">Parent training</option>
                <option value="treatment_plan">Treatment plan</option>
                <option value="authorization">Authorization</option>
                <option value="scheduling">Scheduling</option>
                <option value="evaluation">Evaluation</option>
              </select>
            </Field>
            <Field label="Due date">
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={props.onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!title.trim()}>Create task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SupervisionDialog(props: {
  open: boolean; onClose: () => void;
  clientOptions: string[]; initialClient: string | null;
  onSubmit: (payload: any, nextAction: string) => Promise<void>;
}) {
  const [client, setClient] = useState(props.initialClient ?? "");
  const [provider, setProvider] = useState("");
  const [when, setWhen] = useState(new Date().toISOString().slice(0, 16));
  const [modality, setModality] = useState("in_person");
  const [serviceCode, setServiceCode] = useState("97155");
  const [minutes, setMinutes] = useState("30");
  const [notes, setNotes] = useState("");
  const [barriers, setBarriers] = useState("");
  const [nextAction, setNextAction] = useState("");
  const submit = async () => {
    if (!client) return;
    await props.onSubmit({
      client_name: client,
      provider_name: provider || null,
      occurred_at: new Date(when).toISOString(),
      modality,
      service_code: serviceCode || null,
      minutes: minutes ? Number(minutes) : null,
      notes: notes || null,
      barriers: barriers || null,
      next_action: nextAction || null,
    }, nextAction);
    setNotes(""); setBarriers(""); setNextAction("");
    props.onClose();
  };
  return (
    <Dialog open={props.open} onOpenChange={(o) => { if (!o) props.onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Log supervision</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client"><ClientPicker value={client} onChange={setClient} options={props.clientOptions} /></Field>
            <Field label="RBT / provider"><Input value={provider} onChange={(e) => setProvider(e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Date / time"><Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></Field>
            <Field label="Modality">
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={modality} onChange={(e) => setModality(e.target.value)}>
                <option value="in_person">In person</option>
                <option value="telehealth">Telehealth</option>
                <option value="asynchronous">Asynchronous</option>
              </select>
            </Field>
            <Field label="Service code"><Input value={serviceCode} onChange={(e) => setServiceCode(e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Minutes"><Input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} /></Field>
          </div>
          <Field label="Notes"><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          <Field label="Barriers"><Textarea rows={2} value={barriers} onChange={(e) => setBarriers(e.target.value)} /></Field>
          <Field label="Next action (creates follow-up task)"><Input value={nextAction} onChange={(e) => setNextAction(e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={props.onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!client}>Save log</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ParentTrainingDialog(props: {
  open: boolean; onClose: () => void;
  clientOptions: string[]; initialClient: string | null;
  onSubmit: (payload: any, nextDue: string) => Promise<void>;
}) {
  const [client, setClient] = useState(props.initialClient ?? "");
  const [caregiver, setCaregiver] = useState("");
  const [when, setWhen] = useState(new Date().toISOString().slice(0, 16));
  const [serviceCode, setServiceCode] = useState("97156");
  const [goal, setGoal] = useState("");
  const [participation, setParticipation] = useState("engaged");
  const [barriers, setBarriers] = useState("");
  const [notes, setNotes] = useState("");
  const [nextPlan, setNextPlan] = useState("");
  const [nextDue, setNextDue] = useState("");
  const submit = async () => {
    if (!client) return;
    await props.onSubmit({
      client_name: client,
      caregiver_name: caregiver || null,
      occurred_at: new Date(when).toISOString(),
      service_code: serviceCode || "97156",
      goal: goal || null,
      participation_level: participation,
      barriers: barriers || null,
      notes: notes || null,
      next_session_plan: nextPlan || null,
      next_due_date: nextDue || null,
    }, nextDue);
    setNotes(""); setBarriers(""); setGoal(""); setNextPlan(""); setNextDue("");
    props.onClose();
  };
  return (
    <Dialog open={props.open} onOpenChange={(o) => { if (!o) props.onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Log parent training</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client"><ClientPicker value={client} onChange={setClient} options={props.clientOptions} /></Field>
            <Field label="Caregiver"><Input value={caregiver} onChange={(e) => setCaregiver(e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Date / time"><Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></Field>
            <Field label="Service code"><Input value={serviceCode} onChange={(e) => setServiceCode(e.target.value)} /></Field>
            <Field label="Participation">
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={participation} onChange={(e) => setParticipation(e.target.value)}>
                <option value="engaged">Engaged</option>
                <option value="partial">Partial</option>
                <option value="declined">Declined</option>
                <option value="no_show">No show</option>
              </select>
            </Field>
          </div>
          <Field label="Goal covered"><Input value={goal} onChange={(e) => setGoal(e.target.value)} /></Field>
          <Field label="Barriers"><Textarea rows={2} value={barriers} onChange={(e) => setBarriers(e.target.value)} /></Field>
          <Field label="Notes"><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Next session plan"><Input value={nextPlan} onChange={(e) => setNextPlan(e.target.value)} /></Field>
            <Field label="Next due date"><Input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={props.onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!client}>Save log</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlanItemDialog(props: {
  open: boolean; onClose: () => void;
  clientOptions: string[]; initialClient: string | null;
  onSubmit: (payload: any) => Promise<void>;
}) {
  const [client, setClient] = useState(props.initialClient ?? "");
  const [status, setStatus] = useState("in_progress");
  const [due, setDue] = useState("");
  const [missing, setMissing] = useState("");
  const [qa, setQa] = useState("");
  const submit = async () => {
    if (!client) return;
    await props.onSubmit({
      client_name: client,
      status,
      due_date: due || null,
      missing_items: missing ? missing.split(",").map((s) => s.trim()).filter(Boolean) : [],
      qa_notes: qa || null,
    });
    setMissing(""); setQa("");
    props.onClose();
  };
  return (
    <Dialog open={props.open} onOpenChange={(o) => { if (!o) props.onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Update treatment plan / PR status</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Client"><ClientPicker value={client} onChange={setClient} options={props.clientOptions} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="not_started">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="waiting_on_qa">Waiting on QA</option>
                <option value="missing_info">Missing info</option>
                <option value="ready_for_submission">Ready for submission</option>
                <option value="completed">Completed</option>
              </select>
            </Field>
            <Field label="Due date"><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
          </div>
          <Field label="Missing items (comma separated)"><Input value={missing} onChange={(e) => setMissing(e.target.value)} /></Field>
          <Field label="QA notes"><Textarea rows={3} value={qa} onChange={(e) => setQa(e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={props.onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!client}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}