import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin, AlertTriangle, ListTodo, Plus, Search, Filter, X,
  Activity, Users, Briefcase, ShieldCheck, Calendar, Stethoscope, Phone,
  Flame, ArrowUpRight, Check, RotateCw, Sparkles,
  type LucideIcon,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useOSRole } from "@/contexts/OSRoleContext";
import {
  stateDirectorStore, useStateDirectorSnapshot, useStateDirectorView,
  type Escalation, type OpsTask, type Priority, type Department, type StateCode,
  type EscalationStatus, type TaskStatus,
} from "@/lib/os/stateDirector/stateDirectorStore";

/* --------------------------------- helpers -------------------------------- */

const DEPARTMENTS: Department[] = [
  "Intake", "Authorizations", "Staffing", "Scheduling", "Clinical", "QA",
  "Recruiting", "HR", "Billing", "Growth", "Operations",
];
const PRIORITIES: Priority[] = ["urgent", "high", "medium", "low"];
const ESC_STATUSES: EscalationStatus[] = ["open", "in_review", "waiting", "escalated", "resolved"];
const TASK_STATUSES: TaskStatus[] = ["open", "in_progress", "waiting", "blocked", "completed", "escalated"];

function useActor() {
  const { profile } = useOSRole();
  return profile?.name || "State Director";
}

function useAvailableStates() {
  const { profile } = useOSRole();
  const snap = useStateDirectorSnapshot();
  const isLeadership = ["super_admin", "executive_leadership", "executive", "operations_leadership", "ops_manager", "director_of_operations", "coo"].includes(profile?.role ?? "");
  const assigned = (profile?.state as StateCode | undefined) ?? undefined;
  return { profiles: snap.profiles, isLeadership, assigned };
}

function toneForPriority(p: Priority) {
  return {
    urgent: "bg-red-50 text-red-700 border-red-200",
    high:   "bg-amber-50 text-amber-800 border-amber-200",
    medium: "bg-sky-50 text-sky-700 border-sky-200",
    low:    "bg-muted text-muted-foreground",
  }[p];
}

function toneForStatus(s: string) {
  const map: Record<string, string> = {
    open:         "bg-sky-50 text-sky-700 border-sky-200",
    in_review:    "bg-sky-50 text-sky-700 border-sky-200",
    in_progress:  "bg-sky-50 text-sky-700 border-sky-200",
    waiting:      "bg-amber-50 text-amber-800 border-amber-200",
    blocked:      "bg-red-50 text-red-700 border-red-200",
    escalated:    "bg-red-50 text-red-700 border-red-200",
    resolved:     "bg-emerald-50 text-emerald-700 border-emerald-200",
    completed:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return map[s] ?? "bg-muted text-muted-foreground";
}

const fmtDate = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

/* --------------------------------- layout --------------------------------- */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <OSShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-8">{children}</div>
    </OSShell>
  );
}

function PageHeader({
  eyebrow, title, subtitle, icon: Icon, actions,
}: {
  eyebrow: string; title: string; subtitle: string; icon: LucideIcon; actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
          <Icon className="h-3.5 w-3.5" /> {eyebrow}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{subtitle}</p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

function KPI({ label, value, tone = "muted" }: { label: string; value: string | number; tone?: "ok" | "warn" | "danger" | "info" | "muted" }) {
  return (
    <Card className="p-5 rounded-2xl border-border/60">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("text-3xl font-semibold tracking-tight mt-2",
        tone === "ok" && "text-emerald-600",
        tone === "warn" && "text-amber-600",
        tone === "danger" && "text-red-600",
        tone === "info" && "text-sky-600",
      )}>{value}</div>
    </Card>
  );
}

function SectionCard({
  title, description, children, action,
}: {
  title: string; description?: string; children?: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <Card className="p-6 rounded-2xl border-border/60">
      <div className="flex items-baseline justify-between mb-4 gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

function StateSelector({ value, onChange }: { value: StateCode | "all"; onChange: (v: StateCode | "all") => void }) {
  const { profiles, isLeadership, assigned } = useAvailableStates();
  const options: (StateCode | "all")[] = isLeadership ? ["all", ...profiles.map((p) => p.code)] : (assigned ? [assigned] : profiles.map((p) => p.code));
  return (
    <Select value={value} onValueChange={(v) => onChange(v as StateCode | "all")}>
      <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Filter by state" /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o === "all" ? "All states" : profiles.find((p) => p.code === o)?.name ?? o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ---------------------------- create dialogs ------------------------------ */

function CreateEscalationDialog({
  open, onOpenChange, defaultState, relatedTaskId,
}: { open: boolean; onOpenChange: (v: boolean) => void; defaultState?: StateCode; relatedTaskId?: string }) {
  const actor = useActor();
  const { profiles } = useAvailableStates();
  const [state, setState] = useState<StateCode>(defaultState ?? profiles[0]?.code ?? "GA");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState<Department>("Operations");
  const [priority, setPriority] = useState<Priority>("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueAt, setDueAt] = useState("");

  useEffect(() => { if (defaultState) setState(defaultState); }, [defaultState]);

  function submit() {
    if (!title.trim()) return;
    stateDirectorStore.createEscalation({
      state, title, description, department, priority,
      assignedTo: assignedTo || undefined,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      createdBy: actor,
    });
    setTitle(""); setDescription(""); setAssignedTo(""); setDueAt("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New escalation</DialogTitle>
          <DialogDescription>Route a state-level operational issue to the department owner.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">State</label>
              <Select value={state} onValueChange={(v) => setState(v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Department owner</label>
              <Select value={department} onValueChange={(v) => setDepartment(v as Department)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary…" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What happened, what's needed next…" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Priority</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Assign to</label>
              <Input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Owner name" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Due</label>
              <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </div>
          </div>
          {relatedTaskId ? <p className="text-[11px] text-muted-foreground">Linked to task {relatedTaskId}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!title.trim()}>Create escalation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateTaskDialog({
  open, onOpenChange, defaultState, relatedEscalationId,
}: { open: boolean; onOpenChange: (v: boolean) => void; defaultState?: StateCode; relatedEscalationId?: string }) {
  const actor = useActor();
  const { profiles } = useAvailableStates();
  const [state, setState] = useState<StateCode>(defaultState ?? profiles[0]?.code ?? "GA");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState<Department>("Operations");
  const [owner, setOwner] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueAt, setDueAt] = useState("");

  useEffect(() => { if (defaultState) setState(defaultState); }, [defaultState]);

  function submit() {
    if (!title.trim()) return;
    stateDirectorStore.createTask({
      state, title, description, department, owner: owner || undefined, priority,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      createdBy: actor, relatedEscalationId,
    });
    setTitle(""); setDescription(""); setOwner(""); setDueAt("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>Assign a follow-up to the right department owner.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">State</label>
              <Select value={state} onValueChange={(v) => setState(v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{profiles.map((p) => <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Department</label>
              <Select value={department} onValueChange={(v) => setDepartment(v as Department)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary…" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Priority</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Owner</label>
              <Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner name" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Due</label>
              <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </div>
          </div>
          {relatedEscalationId ? <p className="text-[11px] text-muted-foreground">Linked to escalation {relatedEscalationId}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!title.trim()}>Create task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------- detail drawers ------------------------------ */

function EscalationDetail({ esc, onClose }: { esc: Escalation; onClose: () => void }) {
  const actor = useActor();
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<EscalationStatus>(esc.status);
  const [priority, setPriority] = useState<Priority>(esc.priority);
  const [assignedTo, setAssignedTo] = useState(esc.assignedTo ?? "");
  const [resolution, setResolution] = useState(esc.resolution ?? "");

  function save() {
    stateDirectorStore.updateEscalation(esc.id, {
      status, priority, assignedTo: assignedTo || undefined, resolution: resolution || undefined,
    }, actor);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" /> {esc.title}
          </DialogTitle>
          <DialogDescription>{esc.state} · {esc.department} · Opened {fmtDate(esc.createdAt)} by {esc.createdBy}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {esc.description ? <p className="text-sm text-muted-foreground">{esc.description}</p> : null}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v as EscalationStatus)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{ESC_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Priority</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Assigned to</label>
              <Input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
            </div>
          </div>
          {status === "resolved" ? (
            <div>
              <label className="text-xs text-muted-foreground">Resolution</label>
              <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={2} />
            </div>
          ) : null}
          <div>
            <label className="text-xs text-muted-foreground">Add note</label>
            <div className="flex gap-2">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add operational note…" />
              <Button variant="outline" onClick={() => { if (note.trim()) { stateDirectorStore.addEscalationNote(esc.id, note, actor); setNote(""); } }}>Add</Button>
            </div>
          </div>
          {esc.notes.length ? (
            <div className="space-y-2 max-h-40 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-3">
              {esc.notes.map((n) => (
                <div key={n.id} className="text-xs">
                  <span className="font-medium">{n.author}</span>
                  <span className="text-muted-foreground"> · {fmtDate(n.createdAt)}</span>
                  <p className="text-muted-foreground mt-0.5">{n.body}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          {esc.status === "resolved"
            ? <Button variant="outline" onClick={() => { stateDirectorStore.reopenEscalation(esc.id, actor); onClose(); }}>Reopen</Button>
            : <Button variant="outline" onClick={() => { stateDirectorStore.resolveEscalation(esc.id, resolution, actor); onClose(); }}>Mark resolved</Button>}
          <Button onClick={() => { save(); onClose(); }}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskDetail({ task, onClose }: { task: OpsTask; onClose: () => void }) {
  const actor = useActor();
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [owner, setOwner] = useState(task.owner ?? "");

  function save() {
    stateDirectorStore.updateTask(task.id, { status, priority, owner: owner || undefined }, actor);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ListTodo className="h-4 w-4" /> {task.title}</DialogTitle>
          <DialogDescription>{task.state} · {task.department} · Created {fmtDate(task.createdAt)} by {task.createdBy}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {task.description ? <p className="text-sm text-muted-foreground">{task.description}</p> : null}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Priority</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Owner</label>
              <Input value={owner} onChange={(e) => setOwner(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Add note</label>
            <div className="flex gap-2">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add note…" />
              <Button variant="outline" onClick={() => { if (note.trim()) { stateDirectorStore.addTaskNote(task.id, note, actor); setNote(""); } }}>Add</Button>
            </div>
          </div>
          {task.notes.length ? (
            <div className="space-y-2 max-h-40 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-3">
              {task.notes.map((n) => (
                <div key={n.id} className="text-xs">
                  <span className="font-medium">{n.author}</span>
                  <span className="text-muted-foreground"> · {fmtDate(n.createdAt)}</span>
                  <p className="text-muted-foreground mt-0.5">{n.body}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="outline" onClick={() => { stateDirectorStore.escalateTask(task.id, actor); onClose(); }}>
            <Flame className="h-4 w-4 mr-1.5" /> Escalate
          </Button>
          <Button variant="outline" onClick={() => { stateDirectorStore.completeTask(task.id, actor); onClose(); }}>
            <Check className="h-4 w-4 mr-1.5" /> Complete
          </Button>
          <Button onClick={() => { save(); onClose(); }}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------- 1. State Operations -------------------------- */

export function StateOperationsPage() {
  const { profile } = useOSRole();
  const { profiles, isLeadership, assigned } = useAvailableStates();
  const initialState: StateCode | "all" = isLeadership ? "all" : (assigned ?? profiles[0]?.code ?? "GA");
  const [stateFilter, setStateFilter] = useState<StateCode | "all">(initialState);
  const view = useStateDirectorView(stateFilter);
  const [escOpen, setEscOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [activeEsc, setActiveEsc] = useState<Escalation | null>(null);
  const [activeTask, setActiveTask] = useState<OpsTask | null>(null);

  const rollup = useMemo(() => {
    const list = view.metrics;
    const sum = (k: keyof typeof list[number]) => list.reduce((a, m) => a + (Number(m[k]) || 0), 0);
    return {
      activeClients: sum("activeClients"),
      authorizedHours: sum("authorizedHours"),
      scheduledHours: sum("scheduledHours"),
      deliveredHours: sum("deliveredHours"),
      staffingGaps: sum("staffingGaps"),
      intakePipeline: sum("intakePipeline"),
      authsExpiring30d: sum("authsExpiring30d"),
      clinicalRisks: sum("clinicalRisks"),
      recruitingNeeds: sum("recruitingNeeds"),
      openEscalations: view.escalations.filter((e) => e.status !== "resolved").length,
      openTasks: view.tasks.filter((t) => t.status !== "completed").length,
      health: list.length ? Math.round(list.reduce((a, m) => a + m.healthScore, 0) / list.length) : 0,
    };
  }, [view.metrics, view.escalations, view.tasks]);

  const escPreview = view.escalations.filter((e) => e.status !== "resolved").slice(0, 6);
  const taskPreview = view.tasks.filter((t) => t.status !== "completed").slice(0, 6);

  const departmentSnapshots: { label: string; icon: LucideIcon; to: string }[] = [
    { label: "Intake",          icon: Briefcase,   to: "/intake/dashboard" },
    { label: "Authorizations",  icon: ShieldCheck, to: "/authorizations" },
    { label: "Staffing",        icon: Users,       to: "/ops/staffing" },
    { label: "Scheduling",      icon: Calendar,    to: "/ops/scheduling" },
    { label: "QA / Clinical",   icon: Stethoscope, to: "/qa-team" },
    { label: "Phone",           icon: Phone,       to: "/phone" },
  ];

  return (
    <Shell>
      <PageHeader
        eyebrow="State Director · Command Center"
        title="State Operations"
        subtitle="State-level operational health, escalation flow, and the department handoffs that move work forward."
        icon={MapPin}
        actions={
          <div className="flex items-center gap-2">
            <StateSelector value={stateFilter} onChange={setStateFilter} />
            <Button size="sm" variant="outline" onClick={() => setTaskOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Task</Button>
            <Button size="sm" onClick={() => setEscOpen(true)}><AlertTriangle className="h-4 w-4 mr-1.5" />Escalation</Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
        <KPI label="State health"        value={rollup.health || "—"} tone={rollup.health >= 85 ? "ok" : rollup.health >= 70 ? "warn" : "danger"} />
        <KPI label="Active clients"      value={rollup.activeClients} tone="info" />
        <KPI label="Authorized hrs"      value={rollup.authorizedHours} tone="muted" />
        <KPI label="Scheduled hrs"       value={rollup.scheduledHours}  tone="muted" />
        <KPI label="Delivered hrs"       value={rollup.deliveredHours}  tone="ok" />
        <KPI label="Staffing gaps"       value={rollup.staffingGaps}    tone={rollup.staffingGaps > 5 ? "danger" : "warn"} />
        <KPI label="Intake pipeline"     value={rollup.intakePipeline}  tone="info" />
        <KPI label="Auths < 30d"         value={rollup.authsExpiring30d} tone={rollup.authsExpiring30d > 4 ? "danger" : "warn"} />
        <KPI label="Clinical risks"      value={rollup.clinicalRisks}   tone={rollup.clinicalRisks > 2 ? "danger" : "warn"} />
        <KPI label="Recruiting needs"    value={rollup.recruitingNeeds} tone="warn" />
        <KPI label="Open escalations"    value={rollup.openEscalations} tone={rollup.openEscalations > 3 ? "danger" : "warn"} />
        <KPI label="Open tasks"          value={rollup.openTasks}       tone="info" />
      </div>

      <SectionCard title="State health" description={isLeadership ? "All states in scope." : "Your assigned state."}>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {["State", "Health", "Clients", "Auth hrs", "Sched hrs", "Delivered", "Staffing gaps", "Auths <30d", "Clinical risks", "Open esc.", "Open tasks"].map((h) => (
                  <th key={h} className="text-left font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.metrics.map((m) => {
                const p = view.profiles.find((x) => x.code === m.code);
                return (
                  <tr key={m.code} className="border-t border-border/60">
                    <td className="px-4 py-3 font-medium">{p?.name ?? m.code}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn(
                        m.healthLabel === "Healthy" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                        m.healthLabel === "Stable"  && "bg-emerald-50 text-emerald-700 border-emerald-200",
                        m.healthLabel === "Watch"   && "bg-amber-50 text-amber-800 border-amber-200",
                        (m.healthLabel === "Risk" || m.healthLabel === "Critical") && "bg-red-50 text-red-700 border-red-200",
                      )}>{m.healthLabel} · {m.healthScore}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.activeClients}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.authorizedHours}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.scheduledHours}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.deliveredHours}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.staffingGaps}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.authsExpiring30d}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.clinicalRisks}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.openEscalations}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.openTasks}</td>
                  </tr>
                );
              })}
              {view.metrics.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-sm text-muted-foreground">No state metrics available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Department snapshots" description="State Directors coordinate — departments execute.">
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {departmentSnapshots.map((d) => (
            <Link key={d.label} to={d.to} className="group rounded-2xl border border-border/60 bg-muted/30 p-4 hover:bg-muted/50 transition">
              <div className="flex items-center gap-2">
                <d.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                <span className="text-sm font-medium">{d.label}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">State-scoped snapshot</p>
              <ArrowUpRight className="h-3.5 w-3.5 mt-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
            </Link>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Open escalations" description="Live queue — click any row to review." action={
          <Button variant="ghost" size="sm" asChild><Link to="/ops/state-escalations">Open queue <ArrowUpRight className="h-3.5 w-3.5 ml-1" /></Link></Button>
        }>
          {escPreview.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">No open escalations.</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {escPreview.map((e) => (
                <li key={e.id} className="py-3 flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setActiveEsc(e)} className="text-left flex-1">
                    <div className="text-sm font-medium">{e.state} · {e.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{e.department} · {e.assignedTo ?? "Unassigned"} · Due {fmtDate(e.dueAt)}</div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={toneForPriority(e.priority)}>{e.priority}</Badge>
                    <Badge variant="outline" className={toneForStatus(e.status)}>{e.status.replace("_", " ")}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Open tasks" description="Follow-ups routed to the department owner." action={
          <Button variant="ghost" size="sm" asChild><Link to="/ops/tasks">Open queue <ArrowUpRight className="h-3.5 w-3.5 ml-1" /></Link></Button>
        }>
          {taskPreview.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">No open tasks.</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {taskPreview.map((t) => (
                <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setActiveTask(t)} className="text-left flex-1">
                    <div className="text-sm font-medium">{t.state} · {t.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.department} · {t.owner ?? "Unassigned"} · Due {fmtDate(t.dueAt)}</div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={toneForPriority(t.priority)}>{t.priority}</Badge>
                    <Badge variant="outline" className={toneForStatus(t.status)}>{t.status.replace("_", " ")}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Recent activity" description="Escalations, tasks, notes, and department handoffs." action={
        <Button variant="ghost" size="sm" asChild><Link to="/reports"><Sparkles className="h-3.5 w-3.5 mr-1" />Reports</Link></Button>
      }>
        <ul className="space-y-2 max-h-72 overflow-y-auto">
          {view.activity.slice(0, 20).map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm">
              <span className="text-xs text-muted-foreground w-24 shrink-0">{fmtDate(a.createdAt)}</span>
              <span className="text-muted-foreground text-xs w-14 shrink-0">{a.state ?? "—"}</span>
              <span className="flex-1">{a.message}</span>
              <span className="text-xs text-muted-foreground shrink-0">{a.actor}</span>
            </li>
          ))}
          {view.activity.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No recent activity.</li>}
        </ul>
      </SectionCard>

      <Card className="p-4 rounded-2xl border-border/60 bg-muted/20 text-xs text-muted-foreground">
        Signed in as {profile?.name ?? "State Director"} · {profile?.role} · Data source: Blossom OS local · Ready for CentralReach / CTM / Apploi / BloomGrowth integration adapters.
      </Card>

      <CreateEscalationDialog open={escOpen} onOpenChange={setEscOpen} defaultState={stateFilter === "all" ? undefined : stateFilter} />
      <CreateTaskDialog open={taskOpen} onOpenChange={setTaskOpen} defaultState={stateFilter === "all" ? undefined : stateFilter} />
      {activeEsc ? <EscalationDetail esc={activeEsc} onClose={() => setActiveEsc(null)} /> : null}
      {activeTask ? <TaskDetail task={activeTask} onClose={() => setActiveTask(null)} /> : null}
    </Shell>
  );
}

/* ------------------------- 2. State Escalations --------------------------- */

export function StateEscalationsPage() {
  const { isLeadership, assigned, profiles } = useAvailableStates();
  const initialState: StateCode | "all" = isLeadership ? "all" : (assigned ?? profiles[0]?.code ?? "GA");
  const [stateFilter, setStateFilter] = useState<StateCode | "all">(initialState);
  const [status, setStatus] = useState<EscalationStatus | "all">("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [active, setActive] = useState<Escalation | null>(null);
  const view = useStateDirectorView(stateFilter);

  const rows = view.escalations
    .filter((e) => (status === "all" ? true : e.status === status))
    .filter((e) => (priority === "all" ? true : e.priority === priority))
    .filter((e) => q ? [e.title, e.department, e.assignedTo, e.createdBy, e.state].some((f) => (f ?? "").toLowerCase().includes(q.toLowerCase())) : true);

  return (
    <Shell>
      <PageHeader
        eyebrow="State Director · Escalations"
        title="State Escalations"
        subtitle="Every open state-level issue with an owner, priority, and next action."
        icon={AlertTriangle}
        actions={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1.5" />New escalation</Button>}
      />
      <Card className="p-4 rounded-2xl border-border/60">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search escalations…" className="pl-9 h-10" />
          </div>
          <StateSelector value={stateFilter} onChange={setStateFilter} />
          <Select value={status} onValueChange={(v) => setStatus(v as EscalationStatus | "all")}>
            <SelectTrigger className="h-10 w-[160px]"><Filter className="h-3.5 w-3.5 mr-1.5" /><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ESC_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority | "all")}>
            <SelectTrigger className="h-10 w-[160px]"><Filter className="h-3.5 w-3.5 mr-1.5" /><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          {(q || status !== "all" || priority !== "all") ? (
            <Button variant="ghost" size="sm" onClick={() => { setQ(""); setStatus("all"); setPriority("all"); }}><X className="h-3.5 w-3.5 mr-1" />Clear</Button>
          ) : null}
        </div>
      </Card>

      <Card className="rounded-2xl border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>{["State", "Title", "Department", "Assigned", "Priority", "Status", "Due", ""].map((h) => (
                <th key={h} className="text-left font-medium px-4 py-3 whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-t border-border/60 hover:bg-muted/30 cursor-pointer" onClick={() => setActive(e)}>
                  <td className="px-4 py-3 font-medium">{e.state}</td>
                  <td className="px-4 py-3">{e.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.department}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.assignedTo ?? "—"}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className={toneForPriority(e.priority)}>{e.priority}</Badge></td>
                  <td className="px-4 py-3"><Badge variant="outline" className={toneForStatus(e.status)}>{e.status.replace("_", " ")}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(e.dueAt)}</td>
                  <td className="px-4 py-3 text-right"><ArrowUpRight className="h-4 w-4 text-muted-foreground inline" /></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">No escalations match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CreateEscalationDialog open={createOpen} onOpenChange={setCreateOpen} defaultState={stateFilter === "all" ? undefined : stateFilter} />
      {active ? <EscalationDetail esc={active} onClose={() => setActive(null)} /> : null}
    </Shell>
  );
}

/* --------------------------- 3. Operational Tasks ------------------------- */

export function OperationalTasksPage() {
  const { isLeadership, assigned, profiles } = useAvailableStates();
  const initialState: StateCode | "all" = isLeadership ? "all" : (assigned ?? profiles[0]?.code ?? "GA");
  const [stateFilter, setStateFilter] = useState<StateCode | "all">(initialState);
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [active, setActive] = useState<OpsTask | null>(null);
  const view = useStateDirectorView(stateFilter);

  const now = Date.now();
  const rows = view.tasks
    .filter((t) => (status === "all" ? true : t.status === status))
    .filter((t) => (priority === "all" ? true : t.priority === priority))
    .filter((t) => (overdueOnly ? (t.dueAt ? new Date(t.dueAt).getTime() < now && t.status !== "completed" : false) : true))
    .filter((t) => q ? [t.title, t.department, t.owner, t.createdBy, t.state].some((f) => (f ?? "").toLowerCase().includes(q.toLowerCase())) : true);

  return (
    <Shell>
      <PageHeader
        eyebrow="State Director · Tasks"
        title="Operational Tasks"
        subtitle="Cross-department tasks with a clear owner and next step."
        icon={ListTodo}
        actions={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1.5" />New task</Button>}
      />
      <Card className="p-4 rounded-2xl border-border/60">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks…" className="pl-9 h-10" />
          </div>
          <StateSelector value={stateFilter} onChange={setStateFilter} />
          <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus | "all")}>
            <SelectTrigger className="h-10 w-[160px]"><Filter className="h-3.5 w-3.5 mr-1.5" /><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority | "all")}>
            <SelectTrigger className="h-10 w-[160px]"><Filter className="h-3.5 w-3.5 mr-1.5" /><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant={overdueOnly ? "default" : "outline"} size="sm" onClick={() => setOverdueOnly((v) => !v)}>
            <Activity className="h-3.5 w-3.5 mr-1.5" />Overdue
          </Button>
          {(q || status !== "all" || priority !== "all" || overdueOnly) ? (
            <Button variant="ghost" size="sm" onClick={() => { setQ(""); setStatus("all"); setPriority("all"); setOverdueOnly(false); }}><X className="h-3.5 w-3.5 mr-1" />Clear</Button>
          ) : null}
        </div>
      </Card>

      <Card className="rounded-2xl border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>{["State", "Task", "Department", "Owner", "Priority", "Status", "Due", ""].map((h) => (
                <th key={h} className="text-left font-medium px-4 py-3 whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-t border-border/60 hover:bg-muted/30 cursor-pointer" onClick={() => setActive(t)}>
                  <td className="px-4 py-3 font-medium">{t.state}</td>
                  <td className="px-4 py-3">{t.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.department}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.owner ?? "—"}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className={toneForPriority(t.priority)}>{t.priority}</Badge></td>
                  <td className="px-4 py-3"><Badge variant="outline" className={toneForStatus(t.status)}>{t.status.replace("_", " ")}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(t.dueAt)}</td>
                  <td className="px-4 py-3 text-right"><RotateCw className="h-4 w-4 text-muted-foreground inline" /></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">No tasks match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} defaultState={stateFilter === "all" ? undefined : stateFilter} />
      {active ? <TaskDetail task={active} onClose={() => setActive(null)} /> : null}
    </Shell>
  );
}