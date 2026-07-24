import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin, AlertTriangle, ListTodo, Plus, Search, Filter, X,
  Activity, Users, Briefcase, ShieldCheck, Calendar, Stethoscope, Phone,
  Flame, ArrowUpRight, Check, RotateCw, Sparkles, Gauge,
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
import { refreshStateMetrics } from "@/lib/os/stateDirector/stateDirectorStore";
import { upsertStateMetric } from "@/lib/os/stateDirector/stateOperationsService";
import { toast } from "sonner";
import { StateOpsCentralReachSummaryBadge } from "@/components/stateDirector/StateOpsCentralReachBadge";
import { CentralReachReadinessPanel } from "@/components/stateDirector/CentralReachReadinessPanel";
import { bumpCentralReachReadiness } from "@/components/stateDirector/CentralReachReadinessPanel";
import { createStateCentralReachOutboxItem } from "@/lib/os/stateDirector/stateOperationsService";
import { DailyHealthNotesPanel } from "@/components/stateDirector/DailyHealthNotesPanel";
import { LinkedContextPanel } from "@/components/stateDirector/LinkedContextPanel";
import { SendToStateSupportButton } from "@/components/stateDirector/SendToStateSupportButton";

/* --------------------------------- helpers -------------------------------- */

const DEPARTMENTS: Department[] = [
  "Intake", "Authorizations", "Staffing", "Scheduling", "Clinical", "QA",
  "Recruiting", "HR", "Billing", "Growth", "Operations",
];
const PRIORITIES: Priority[] = ["urgent", "high", "medium", "low"];
const ESC_STATUSES: EscalationStatus[] = ["open", "in_review", "waiting", "escalated", "resolved"];
const TASK_STATUSES: TaskStatus[] = ["open", "in_progress", "waiting", "blocked", "completed", "escalated"];

const LEADERSHIP_ROLES = new Set<string>([
  "super_admin", "executive_leadership", "executive", "operations_leadership",
  "ops_manager", "director_of_operations", "coo", "admin",
]);

const STATE_SCOPED_ROLES = new Set<string>([
  "state_director", "assistant_state_director",
]);

/* ---------- CentralReach readiness action (task/escalation detail) --------- */

type CrEligible = {
  id: string;
  state: StateCode;
  title: string;
  description?: string;
  department: Department;
  priority: Priority;
  status: string;
  dueAt?: string;
  sourceModule?: string;
  linkedClientId?: string;
  linkedLeadId?: string;
  linkedCandidateId?: string;
  linkedAuthorizationId?: string;
  linkedSchedulingItemId?: string;
  metadata?: Record<string, unknown>;
};

function inferCrObjectType(row: CrEligible): string {
  if (row.linkedClientId) return "client";
  if (row.linkedAuthorizationId) return "authorization";
  if (row.linkedSchedulingItemId) return "schedule";
  if (row.linkedLeadId) return "lead";
  if (row.linkedCandidateId) return "candidate";
  return "unknown";
}

function inferCrExternalId(row: CrEligible): string | null {
  const md = row.metadata ?? {};
  const candidates = [
    (md as any).centralreachExternalId,
    (md as any).centralreach_external_id,
    (md as any).crExternalId,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return null;
}

function inferCrActionType(row: CrEligible): "needs_mapping" | "blocked_missing_cr_id" {
  const hasLinkedContext =
    !!row.linkedClientId || !!row.linkedAuthorizationId ||
    !!row.linkedSchedulingItemId || !!row.linkedLeadId || !!row.linkedCandidateId;
  return hasLinkedContext ? "needs_mapping" : "blocked_missing_cr_id";
}

function SendToCentralReachReadinessButton({
  row, sourceType, extraOwner,
}: {
  row: CrEligible;
  sourceType: "task" | "escalation";
  extraOwner?: { owner?: string; assignedTo?: string };
}) {
  const { role, profileState } = useOSRole();
  const [sending, setSending] = useState(false);
  const isStateScoped = STATE_SCOPED_ROLES.has(String(role));
  const isLeadership = LEADERSHIP_ROLES.has(String(role));
  const canRole =
    isLeadership || isStateScoped || role === "super_admin";
  const stateMismatch =
    isStateScoped && profileState && String(profileState) !== String(row.state);
  const disabled = !canRole || Boolean(stateMismatch) || sending;
  const tooltip = !canRole
    ? "You do not have permission to queue CentralReach readiness work."
    : stateMismatch
      ? "You can only queue CentralReach readiness work for your assigned state."
      : "Creates a readiness queue item for future CentralReach mapping. This does not send anything to CentralReach yet.";

  async function onClick() {
    setSending(true);
    const payload: Record<string, unknown> = {
      title: row.title,
      description: row.description,
      department: row.department,
      priority: row.priority,
      status: row.status,
      dueAt: row.dueAt,
      sourceModule: row.sourceModule,
      linkedClientId: row.linkedClientId,
      linkedLeadId: row.linkedLeadId,
      linkedCandidateId: row.linkedCandidateId,
      linkedAuthorizationId: row.linkedAuthorizationId,
      linkedSchedulingItemId: row.linkedSchedulingItemId,
      metadata: row.metadata,
      ...(extraOwner ?? {}),
    };
    const res = await createStateCentralReachOutboxItem({
      stateCode: row.state,
      sourceType,
      sourceId: row.id,
      centralreachObjectType: inferCrObjectType(row),
      centralreachExternalId: inferCrExternalId(row),
      actionType: inferCrActionType(row),
      payload,
    });
    setSending(false);
    if (res.ok) {
      if (res.alreadyQueued) {
        toast.success("Already in CentralReach readiness queue", {
          description: "This item is already waiting for mapping. Nothing was sent to CentralReach yet.",
        });
      } else {
        toast.success("CentralReach readiness item created", {
          description: "This is queued for mapping. Nothing was sent to CentralReach yet.",
        });
      }
      bumpCentralReachReadiness();
    } else {
      toast.error("Could not create CentralReach readiness item", {
        description: "Please try again in a moment. If this continues, contact your admin.",
      });
    }
  }

  return (
    <Button
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      title={tooltip}
    >
      <Sparkles className="h-4 w-4 mr-1.5" />
      {sending ? "Queuing..." : "Send to CentralReach readiness"}
    </Button>
  );
}

function useActor() {
  const { role } = useOSRole();
  return role === "state_director" ? "State Director"
    : role === "assistant_state_director" ? "Assistant State Director"
    : String(role || "Operator").replace(/_/g, " ");
}

function StateOperationsDailyHealthSlot({
  stateFilter, isLeadership, assigned,
}: {
  stateFilter: StateCode | "all";
  isLeadership: boolean;
  assigned?: StateCode;
}) {
  const actor = useActor();
  if (stateFilter === "all") return null;
  return (
    <DailyHealthNotesPanel
      stateCode={stateFilter}
      actor={actor}
      canEdit={!isLeadership || Boolean(assigned)}
    />
  );
}

function useAvailableStates() {
  const { role, activeState, profileState, hasAssignedState } = useOSRole();
  const snap = useStateDirectorSnapshot();
  const isLeadership = LEADERSHIP_ROLES.has(String(role));
  const isStateScoped = STATE_SCOPED_ROLES.has(String(role));
  // For state-scoped roles, "assigned" must come from the profile, not
  // from the transient activeState selector. If there is no profile
  // state we do NOT silently fall through to activeState — the page
  // renders the "assigned state required" setup notice instead.
  const assigned: StateCode | undefined = isStateScoped
    ? ((profileState ?? undefined) as StateCode | undefined)
    : ((activeState as StateCode | undefined) ?? undefined);
  return {
    profiles: snap.profiles,
    isLeadership,
    isStateScoped,
    hasAssignedState: isStateScoped ? hasAssignedState : true,
    assigned,
  };
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

function LinkedRefBadges({ row }: { row: OpsTask | Escalation }) {
  const refs: { label: string; value: string }[] = [];
  if ((row as any).sourceModule) refs.push({ label: "src", value: String((row as any).sourceModule) });
  if ((row as any).linkedLeadId) refs.push({ label: "lead", value: String((row as any).linkedLeadId).slice(0, 8) });
  if ((row as any).linkedClientId) refs.push({ label: "client", value: String((row as any).linkedClientId).slice(0, 8) });
  if ((row as any).linkedCandidateId) refs.push({ label: "cand", value: String((row as any).linkedCandidateId).slice(0, 8) });
  if ((row as any).linkedAuthorizationId) refs.push({ label: "auth", value: String((row as any).linkedAuthorizationId).slice(0, 8) });
  if ((row as any).linkedSchedulingItemId) refs.push({ label: "sched", value: String((row as any).linkedSchedulingItemId).slice(0, 8) });
  if (!refs.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {refs.map((r) => (
        <span key={r.label + r.value} className="text-[10px] uppercase tracking-wide bg-muted/60 text-muted-foreground rounded px-1.5 py-0.5">
          {r.label}: {r.value}
        </span>
      ))}
    </div>
  );
}

/* --------------------------------- layout --------------------------------- */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <OSShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-8">{children}</div>
    </OSShell>
  );
}

function AssignedStateRequired({ page }: { page: string }) {
  return (
    <Shell>
      <Card className="p-8 rounded-2xl border-border/60 max-w-2xl">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
          <MapPin className="h-3.5 w-3.5" /> Assigned state required
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {page} needs an assigned state
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Your account is a state-scoped role but does not have an
          assigned state on file. Ask an admin to set your state in
          User Management (profile.state). Until then, {page} will
          not show operational data — this prevents accidentally
          browsing another state's records.
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          Assistant State Director and State Director always operate
          inside a single assigned state — there is no "All states"
          view for these roles.
        </p>
      </Card>
    </Shell>
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
  const { profiles, isLeadership, isStateScoped, assigned } = useAvailableStates();
  // State-scoped roles (state_director, assistant_state_director) never
  // see "All states" — even in View As Role, the UI pins them to their
  // assigned state and blocks cross-state browsing.
  const options: (StateCode | "all")[] = isLeadership
    ? ["all", ...profiles.map((p) => p.code)]
    : isStateScoped
      ? (assigned ? [assigned] : [])
      : profiles.map((p) => p.code);
  return (
    <Select value={value} onValueChange={(v) => onChange(v as StateCode | "all")}>
      <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Filter by state" /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o === "all" ? "All states" : profiles.find((p) => p.code === o)?.name ?? o}
          </SelectItem>
        ))}
        {options.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">Assigned state required</div>
        ) : null}
      </SelectContent>
    </Select>
  );
}

/* ---------------------------- create dialogs ------------------------------ */

function CreateEscalationDialog({
  open, onOpenChange, defaultState, relatedTaskId,
}: { open: boolean; onOpenChange: (v: boolean) => void; defaultState?: StateCode; relatedTaskId?: string }) {
  const actor = useActor();
  const { profiles, isStateScoped, assigned } = useAvailableStates();
  const allowedProfiles = isStateScoped
    ? profiles.filter((p) => p.code === assigned)
    : profiles;
  const [state, setState] = useState<StateCode>(
    (isStateScoped && assigned) ? assigned : (defaultState ?? profiles[0]?.code ?? "GA"),
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState<Department>("Operations");
  const [priority, setPriority] = useState<Priority>("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueAt, setDueAt] = useState("");

  useEffect(() => {
    if (isStateScoped && assigned) { setState(assigned); return; }
    if (defaultState) setState(defaultState);
  }, [defaultState, isStateScoped, assigned]);

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
              <Select value={state} onValueChange={(v) => setState(v)} disabled={isStateScoped}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allowedProfiles.map((p) => <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {isStateScoped ? (
                <p className="text-[10px] text-muted-foreground">Locked to your assigned state.</p>
              ) : null}
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
  const { profiles, isStateScoped, assigned } = useAvailableStates();
  const allowedProfiles = isStateScoped
    ? profiles.filter((p) => p.code === assigned)
    : profiles;
  const [state, setState] = useState<StateCode>(
    (isStateScoped && assigned) ? assigned : (defaultState ?? profiles[0]?.code ?? "GA"),
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState<Department>("Operations");
  const [owner, setOwner] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueAt, setDueAt] = useState("");

  useEffect(() => {
    if (isStateScoped && assigned) { setState(assigned); return; }
    if (defaultState) setState(defaultState);
  }, [defaultState, isStateScoped, assigned]);

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
              <Select value={state} onValueChange={(v) => setState(v)} disabled={isStateScoped}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{allowedProfiles.map((p) => <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
              {isStateScoped ? (
                <p className="text-[10px] text-muted-foreground">Locked to your assigned state.</p>
              ) : null}
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
  const [busy, setBusy] = useState<null | "save" | "note" | "resolve" | "reopen">(null);

  async function save() {
    setBusy("save");
    const res = await stateDirectorStore.updateEscalation(esc.id, {
      status, priority, assignedTo: assignedTo || undefined, resolution: resolution || undefined,
    }, actor);
    setBusy(null);
    if (res.ok) onClose();
  }
  async function addNote() {
    if (!note.trim()) return;
    setBusy("note");
    const res = await stateDirectorStore.addEscalationNote(esc.id, note, actor);
    setBusy(null);
    if (res.ok) setNote("");
  }
  async function resolve() {
    setBusy("resolve");
    const res = await stateDirectorStore.resolveEscalation(esc.id, resolution, actor);
    setBusy(null);
    if (res.ok) onClose();
  }
  async function reopen() {
    setBusy("reopen");
    const res = await stateDirectorStore.reopenEscalation(esc.id, actor);
    setBusy(null);
    if (res.ok) onClose();
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
          <LinkedContextPanel row={esc} />
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
              <Button variant="outline" disabled={busy !== null || !note.trim()} onClick={addNote}>
                {busy === "note" ? "Adding..." : "Add"}
              </Button>
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
          <Button variant="ghost" onClick={onClose} disabled={busy !== null}>Close</Button>
          {esc.status === "resolved"
            ? <Button variant="outline" disabled={busy !== null} onClick={reopen}>{busy === "reopen" ? "Reopening..." : "Reopen"}</Button>
            : <Button variant="outline" disabled={busy !== null} onClick={resolve}>{busy === "resolve" ? "Resolving..." : "Mark resolved"}</Button>}
          <SendToStateSupportButton
            fromDepartment={esc.department}
            defaultKind="handoff"
            buttonLabel="Send Handoff From Escalation"
            defaultTitle={esc.title}
            defaultDescription={esc.description ?? esc.resolution ?? ""}
            defaultPriority={esc.priority}
            defaultState={esc.state}
            linkedClientId={esc.linkedClientId}
            linkedLeadId={esc.linkedLeadId}
            linkedCandidateId={esc.linkedCandidateId}
            linkedAuthorizationId={esc.linkedAuthorizationId}
            linkedSchedulingItemId={esc.linkedSchedulingItemId}
            sourceModule="state_escalation_detail"
            metadata={{ relatedEscalationId: esc.id }}
          />
          <SendToCentralReachReadinessButton
            sourceType="escalation"
            row={{
              id: esc.id,
              state: esc.state,
              title: esc.title,
              description: esc.description,
              department: esc.department,
              priority: esc.priority,
              status: esc.status,
              dueAt: esc.dueAt,
              sourceModule: esc.sourceModule ?? "state_escalation_detail",
              linkedClientId: esc.linkedClientId,
              linkedLeadId: esc.linkedLeadId,
              linkedCandidateId: esc.linkedCandidateId,
              linkedAuthorizationId: esc.linkedAuthorizationId,
              linkedSchedulingItemId: esc.linkedSchedulingItemId,
              metadata: esc.metadata,
            }}
            extraOwner={{ assignedTo: esc.assignedTo }}
          />
          <Button onClick={save} disabled={busy !== null}>{busy === "save" ? "Saving..." : "Save changes"}</Button>
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
  const [busy, setBusy] = useState<null | "save" | "note" | "escalate" | "complete">(null);

  async function save() {
    setBusy("save");
    const res = await stateDirectorStore.updateTask(task.id, { status, priority, owner: owner || undefined }, actor);
    setBusy(null);
    if (res.ok) onClose();
  }
  async function addNote() {
    if (!note.trim()) return;
    setBusy("note");
    const res = await stateDirectorStore.addTaskNote(task.id, note, actor);
    setBusy(null);
    if (res.ok) setNote("");
  }
  async function escalate() {
    setBusy("escalate");
    const res = await stateDirectorStore.escalateTask(task.id, actor);
    setBusy(null);
    if (res.ok) onClose();
  }
  async function complete() {
    setBusy("complete");
    const res = await stateDirectorStore.completeTask(task.id, actor);
    setBusy(null);
    if (res.ok) onClose();
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
          <LinkedContextPanel row={task} />
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
              <Button variant="outline" disabled={busy !== null || !note.trim()} onClick={addNote}>
                {busy === "note" ? "Adding..." : "Add"}
              </Button>
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
          <Button variant="ghost" onClick={onClose} disabled={busy !== null}>Close</Button>
          <Button variant="outline" disabled={busy !== null} onClick={escalate}>
            <Flame className="h-4 w-4 mr-1.5" /> {busy === "escalate" ? "Escalating..." : "Escalate"}
          </Button>
          <Button variant="outline" disabled={busy !== null} onClick={complete}>
            <Check className="h-4 w-4 mr-1.5" /> {busy === "complete" ? "Completing..." : "Complete"}
          </Button>
          <SendToStateSupportButton
            fromDepartment={task.department}
            defaultKind="handoff"
            buttonLabel="Send Handoff From Task"
            defaultTitle={task.title}
            defaultDescription={task.description ?? ""}
            defaultPriority={task.priority}
            defaultState={task.state}
            linkedClientId={task.linkedClientId}
            linkedLeadId={task.linkedLeadId}
            linkedCandidateId={task.linkedCandidateId}
            linkedAuthorizationId={task.linkedAuthorizationId}
            linkedSchedulingItemId={task.linkedSchedulingItemId}
            sourceModule="state_task_detail"
            metadata={{ relatedTaskId: task.id, relatedEscalationId: task.relatedEscalationId }}
          />
          <SendToCentralReachReadinessButton
            sourceType="task"
            row={{
              id: task.id,
              state: task.state,
              title: task.title,
              description: task.description,
              department: task.department,
              priority: task.priority,
              status: task.status,
              dueAt: task.dueAt,
              sourceModule: task.sourceModule ?? "state_task_detail",
              linkedClientId: task.linkedClientId,
              linkedLeadId: task.linkedLeadId,
              linkedCandidateId: task.linkedCandidateId,
              linkedAuthorizationId: task.linkedAuthorizationId,
              linkedSchedulingItemId: task.linkedSchedulingItemId,
              metadata: task.metadata,
            }}
            extraOwner={{ owner: task.owner }}
          />
          <Button onClick={save} disabled={busy !== null}>{busy === "save" ? "Saving..." : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------- 1. State Operations -------------------------- */

export function StateOperationsPage() {
  const { role, activeState } = useOSRole();
  const { profiles, isLeadership, isStateScoped, hasAssignedState, assigned } = useAvailableStates();
  const isAssistant = role === "assistant_state_director";
  // Manual metrics editing is limited to leadership/admin + primary State Director.
  // Assistant State Director never gets the editor.
  const canEditMetrics =
    !isAssistant &&
    (isLeadership || role === "state_director" || role === "super_admin");
  const [metricsOpen, setMetricsOpen] = useState(false);
  // State-scoped roles never get "all". If assigned exists we pin to it,
  // otherwise the setup notice below takes over and no queries fire.
  const initialState: StateCode | "all" = isLeadership
    ? "all"
    : isStateScoped
      ? (assigned ?? ("GA" as StateCode))
      : (assigned ?? profiles[0]?.code ?? "GA");
  const [stateFilter, setStateFilter] = useState<StateCode | "all">(initialState);
  const view = useStateDirectorView(stateFilter);
  const [escOpen, setEscOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [activeEsc, setActiveEsc] = useState<Escalation | null>(null);
  const [activeTask, setActiveTask] = useState<OpsTask | null>(null);

  // Only metrics that have a real source (live/manual/integration) roll up
  // into Executive-visible KPIs. Seed rows exist only as calm placeholders
  // in preview and MUST NOT be presented as operational truth.
  const liveMetrics = useMemo(
    () => view.metrics.filter((m) => {
      const s = (m as { source?: string }).source;
      return s === "live" || s === "manual" || s === "integration";
    }),
    [view.metrics],
  );
  const rollup = useMemo(() => {
    const list = liveMetrics;
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
  }, [liveMetrics, view.escalations, view.tasks]);

  const escPreview = view.escalations.filter((e) => e.status !== "resolved").slice(0, 6);
  const taskPreview = view.tasks.filter((t) => t.status !== "completed").slice(0, 6);
  const pendingCrCount =
    view.tasks.filter((t) => (t.centralreachSyncStatus ?? "pending_import") !== "synced").length +
    view.escalations.filter((e) => (e.centralreachSyncStatus ?? "pending_import") !== "synced").length;

  // Metric provenance for the current selection. Only live/manual/
  // integration rows count as real operational metrics — awaiting rows
  // are zeroed placeholders and MUST render as "—".
  const sources = view.metrics.map((m) => (m as { source?: string }).source ?? "awaiting");
  const isRealSource = (s: string) => s === "live" || s === "manual" || s === "integration";
  const hasLive = sources.some(isRealSource);
  const allLive = sources.length > 0 && sources.every(isRealSource);
  const metricsBannerLabel = allLive
    ? "Live state metrics"
    : hasLive
      ? "Partial live metrics"
      : "No live state metrics connected";
  const metricsSourceSummary = allLive
    ? "Source: Live state metrics"
    : hasLive
      ? "Source: Partial live metrics"
      : "Source: No live state metrics connected";
  const metricsUpdated = (() => {
    const stamps = liveMetrics
      .map((m) => (m as { sourceUpdatedAt?: string | null }).sourceUpdatedAt || m.updatedAt)
      .filter(Boolean) as string[];
    if (!stamps.length) return "—";
    const latest = stamps.sort().slice(-1)[0];
    try { return new Date(latest).toLocaleString(); } catch { return latest; }
  })();
  const kpiVal = (n: number) => (hasLive ? n : "—");

  const departmentSnapshots: { label: string; icon: LucideIcon; to: string }[] = [
    { label: "Intake",          icon: Briefcase,   to: "/intake/dashboard" },
    { label: "Authorizations",  icon: ShieldCheck, to: "/authorizations" },
    { label: "Staffing",        icon: Users,       to: "/ops/staffing" },
    { label: "Scheduling",      icon: Calendar,    to: "/ops/scheduling" },
    { label: "QA / Clinical",   icon: Stethoscope, to: "/qa-team" },
  ];

  if (isStateScoped && !hasAssignedState) return <AssignedStateRequired page="State Operations" />;

  return (
    <Shell>
      <PageHeader
        eyebrow={isAssistant ? "State Director Assistant · Support Center" : "State Director · Command Center"}
        title="State Operations"
        subtitle={isAssistant
          ? "State support queue, follow-ups, department handoffs, and blockers for your assigned state."
          : "State-level operational health, escalation flow, and the department handoffs that move work forward."}
        icon={MapPin}
        actions={
          <div className="flex items-center gap-2">
            <StateSelector value={stateFilter} onChange={setStateFilter} />
            <Button size="sm" variant="outline" onClick={() => setTaskOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Task</Button>
            <Button size="sm" onClick={() => setEscOpen(true)}><AlertTriangle className="h-4 w-4 mr-1.5" />Escalation</Button>
            {canEditMetrics ? (
              <Button size="sm" variant="outline" onClick={() => setMetricsOpen(true)}>
                <Gauge className="h-4 w-4 mr-1.5" />Update Metrics
              </Button>
            ) : null}
            <SendToStateSupportButton
              fromDepartment="Operations"
              defaultKind="handoff"
              buttonLabel="Department Handoff"
              defaultState={stateFilter === "all" ? undefined : (stateFilter as StateCode)}
              sourceModule="state_operations_dashboard"
            />
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
        <div className="col-span-full -mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          {metricsBannerLabel}
        </div>
        <KPI label="State health"        value={hasLive ? (rollup.health || "—") : "—"} tone={rollup.health >= 85 ? "ok" : rollup.health >= 70 ? "warn" : "muted"} />
        <KPI label="Active clients"      value={kpiVal(rollup.activeClients)} tone="info" />
        <KPI label="Authorized hrs"      value={kpiVal(rollup.authorizedHours)} tone="muted" />
        <KPI label="Scheduled hrs"       value={kpiVal(rollup.scheduledHours)}  tone="muted" />
        <KPI label="Delivered hrs"       value={kpiVal(rollup.deliveredHours)}  tone="ok" />
        <KPI label="Staffing gaps"       value={kpiVal(rollup.staffingGaps)}    tone={hasLive && rollup.staffingGaps > 5 ? "danger" : "muted"} />
        <KPI label="Intake pipeline"     value={kpiVal(rollup.intakePipeline)}  tone="info" />
        <KPI label="Auths < 30d"         value={kpiVal(rollup.authsExpiring30d)} tone={hasLive && rollup.authsExpiring30d > 4 ? "danger" : "muted"} />
        <KPI label="Clinical risks"      value={kpiVal(rollup.clinicalRisks)}   tone={hasLive && rollup.clinicalRisks > 2 ? "danger" : "muted"} />
        <KPI label="Recruiting needs"    value={kpiVal(rollup.recruitingNeeds)} tone="muted" />
        <KPI label="Open escalations"    value={rollup.openEscalations} tone={rollup.openEscalations > 3 ? "danger" : "warn"} />
        <KPI label="Open tasks"          value={rollup.openTasks}       tone="info" />
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Tasks, escalations, notes, handoffs, and daily health notes are live.
        State health metrics above use{" "}
        {allLive ? "persisted live metrics from state_operational_metrics." :
          hasLive ? "persisted live metrics only for states that have a live row; other states show as awaiting metrics sync." :
          "no live state metrics — connect a state metrics source to populate KPIs."}
      </p>

      <StateOpsCentralReachSummaryBadge pendingCount={pendingCrCount} />

      <CentralReachReadinessPanel stateFilter={stateFilter} />

      <StateOperationsDailyHealthSlot
        stateFilter={stateFilter}
        isLeadership={isLeadership}
        assigned={assigned}
      />

      <SectionCard
        title="State health"
        description={(isLeadership ? "All states in scope." : "Your assigned state.") + ` · ${metricsSourceSummary} · Updated: ${metricsUpdated}`}
      >
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {["State", "Health", "Clients", "Auth hrs", "Sched hrs", "Delivered", "Staffing gaps", "Auths <30d", "Clinical risks", "Open esc.", "Open tasks", "Source", "Updated"].map((h) => (
                  <th key={h} className="text-left font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.metrics.map((m) => {
                const p = view.profiles.find((x) => x.code === m.code);
                const src = (m as { source?: string }).source ?? "awaiting";
                const isLive = src === "live" || src === "manual" || src === "integration";
                const dash = <span className="text-muted-foreground/60">—</span>;
                return (
                  <tr key={m.code} className="border-t border-border/60">
                    <td className="px-4 py-3 font-medium">{p?.name ?? m.code}</td>
                    <td className="px-4 py-3">
                      {isLive ? (
                        <Badge variant="outline" className={cn(
                          m.healthLabel === "Healthy" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                          m.healthLabel === "Stable"  && "bg-emerald-50 text-emerald-700 border-emerald-200",
                          m.healthLabel === "Watch"   && "bg-amber-50 text-amber-800 border-amber-200",
                          (m.healthLabel === "Risk" || m.healthLabel === "Critical") && "bg-red-50 text-red-700 border-red-200",
                        )}>{m.healthLabel} · {m.healthScore}</Badge>
                      ) : dash}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{isLive ? m.activeClients : dash}</td>
                    <td className="px-4 py-3 text-muted-foreground">{isLive ? m.authorizedHours : dash}</td>
                    <td className="px-4 py-3 text-muted-foreground">{isLive ? m.scheduledHours : dash}</td>
                    <td className="px-4 py-3 text-muted-foreground">{isLive ? m.deliveredHours : dash}</td>
                    <td className="px-4 py-3 text-muted-foreground">{isLive ? m.staffingGaps : dash}</td>
                    <td className="px-4 py-3 text-muted-foreground">{isLive ? m.authsExpiring30d : dash}</td>
                    <td className="px-4 py-3 text-muted-foreground">{isLive ? m.clinicalRisks : dash}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.openEscalations}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.openTasks}</td>
                    <td className="px-4 py-3 text-xs">
                      <Badge variant="outline" className={cn(
                        src === "live" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                        src === "integration" && "bg-blue-50 text-blue-700 border-blue-200",
                        src === "manual" && "bg-slate-100 text-slate-700 border-slate-200",
                        !isLive && "bg-muted text-muted-foreground border-border",
                      )}>{isLive ? src : "Awaiting metrics sync"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {(() => {
                        if (!isLive) return "—";
                        const s = (m as { sourceUpdatedAt?: string | null }).sourceUpdatedAt || m.updatedAt;
                        try { return s ? new Date(s).toLocaleDateString() : "—"; } catch { return s; }
                      })()}
                    </td>
                  </tr>
                );
              })}
              {view.metrics.length === 0 && (
                <tr><td colSpan={13} className="px-4 py-10 text-center text-sm text-muted-foreground">No state metrics available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Department snapshots" description={isAssistant
        ? "State support helps unblock work; department owners still execute."
        : "State Directors coordinate — departments execute."}>
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
        Viewing as <span className="font-medium">{String(role).replace(/_/g, " ")}</span>{assigned ? ` · state ${assigned}` : ""} · Tasks, escalations, and notes persist to Blossom Cloud · CentralReach context: not connected yet · CentralReach integration status: not connected — internal ops records will link to CentralReach client context once the connector is live.
      </Card>

      <CreateEscalationDialog open={escOpen} onOpenChange={setEscOpen} defaultState={stateFilter === "all" ? undefined : stateFilter} />
      <CreateTaskDialog open={taskOpen} onOpenChange={setTaskOpen} defaultState={stateFilter === "all" ? undefined : stateFilter} />
      {activeEsc ? <EscalationDetail esc={activeEsc} onClose={() => setActiveEsc(null)} /> : null}
      {activeTask ? <TaskDetail task={activeTask} onClose={() => setActiveTask(null)} /> : null}
      {canEditMetrics ? (
        <ManualMetricsDialog
          open={metricsOpen}
          onOpenChange={setMetricsOpen}
          profiles={view.profiles}
          isLeadership={isLeadership}
          assigned={assigned}
          stateFilter={stateFilter}
          metrics={view.metrics}
        />
      ) : null}
    </Shell>
  );
}

/* ------------------------- 2. State Escalations --------------------------- */

/* ----------------- Manual metrics editor (Pass 6) ------------------------ */

function ManualMetricsDialog({
  open, onOpenChange, profiles, isLeadership, assigned, stateFilter, metrics,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profiles: { code: StateCode; name: string }[];
  isLeadership: boolean;
  assigned?: StateCode;
  stateFilter: StateCode | "all";
  metrics: Array<{
    code: StateCode; healthScore: number; healthLabel: string;
    activeClients: number; authorizedHours: number; scheduledHours: number;
    deliveredHours: number; staffingGaps: number; intakePipeline: number;
    authsExpiring30d: number; clinicalRisks: number; recruitingNeeds: number;
    cancellationRisk: number; openEscalations: number; openTasks: number;
    agingBlockers: number;
  }>;
}) {
  // Choose an initial state:
  //  - State-scoped director → pin to their assigned state.
  //  - Leadership → default to the active filter if a single state is chosen,
  //    otherwise force an explicit pick.
  const initialCode: StateCode | "" = assigned
    ? assigned
    : stateFilter !== "all"
      ? (stateFilter as StateCode)
      : "";
  const [code, setCode] = useState<StateCode | "">(initialCode);
  const source = metrics.find((m) => m.code === code);
  const [form, setForm] = useState({
    healthScore: 80,
    healthLabel: "Stable",
    activeClients: 0,
    authorizedHours: 0,
    scheduledHours: 0,
    deliveredHours: 0,
    staffingGaps: 0,
    intakePipeline: 0,
    authsExpiring30d: 0,
    clinicalRisks: 0,
    recruitingNeeds: 0,
    cancellationRisk: 0,
    agingBlockers: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync form when the selected state changes so directors edit real values.
  useEffect(() => {
    if (!source) return;
    setForm({
      healthScore: source.healthScore ?? 0,
      healthLabel: source.healthLabel ?? "Stable",
      activeClients: source.activeClients,
      authorizedHours: source.authorizedHours,
      scheduledHours: source.scheduledHours,
      deliveredHours: source.deliveredHours,
      staffingGaps: source.staffingGaps,
      intakePipeline: source.intakePipeline,
      authsExpiring30d: source.authsExpiring30d,
      clinicalRisks: source.clinicalRisks,
      recruitingNeeds: source.recruitingNeeds,
      cancellationRisk: source.cancellationRisk,
      agingBlockers: source.agingBlockers,
    });
  }, [code]);

  const setNum = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: Number(e.target.value) || 0 }));

  async function onSave() {
    setError(null);
    if (!code) {
      setError("Select a state before saving.");
      return;
    }
    setSaving(true);
    try {
      const res = await upsertStateMetric({
        code,
        source: "manual",
        healthScore: form.healthScore,
        healthLabel: form.healthLabel,
        activeClients: form.activeClients,
        authorizedHours: form.authorizedHours,
        scheduledHours: form.scheduledHours,
        deliveredHours: form.deliveredHours,
        staffingGaps: form.staffingGaps,
        intakePipeline: form.intakePipeline,
        authsExpiring30d: form.authsExpiring30d,
        clinicalRisks: form.clinicalRisks,
        recruitingNeeds: form.recruitingNeeds,
        cancellationRisk: form.cancellationRisk,
        agingBlockers: form.agingBlockers,
      });
      if (!res.ok) {
        const friendly = "State metrics didn't save. Please try again in a moment.";
        setError(friendly);
        toast.error("State metrics did not save", { description: friendly });
        return;
      }
      await refreshStateMetrics();
      toast.success(`State metrics saved for ${code}`);
      onOpenChange(false);
    } catch {
      const friendly = "State metrics didn't save. Please try again in a moment.";
      setError(friendly);
      toast.error("State metrics did not save", { description: friendly });
    } finally {
      setSaving(false);
    }
  }

  const openEscalations = source?.openEscalations ?? 0;
  const openTasks = source?.openTasks ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update state metrics</DialogTitle>
          <DialogDescription>
            Manually update state health metrics. Saved rows are tagged{" "}
            <b>manual</b> and surface in State Operations as live values.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">State</label>
              {assigned ? (
                <Input value={assigned} disabled className="mt-1" />
              ) : (
                <Select value={code} onValueChange={(v) => setCode(v as StateCode)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select a state" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.code} value={p.code}>{p.name} ({p.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Health label</label>
              <Select value={form.healthLabel} onValueChange={(v) => setForm((f) => ({ ...f, healthLabel: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Healthy", "Stable", "Watch", "Risk", "Critical"].map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MetricField label="Health score (0-100)" value={form.healthScore} onChange={setNum("healthScore")} />
            <MetricField label="Active clients" value={form.activeClients} onChange={setNum("activeClients")} />
            <MetricField label="Authorized hrs" value={form.authorizedHours} onChange={setNum("authorizedHours")} />
            <MetricField label="Scheduled hrs" value={form.scheduledHours} onChange={setNum("scheduledHours")} />
            <MetricField label="Delivered hrs" value={form.deliveredHours} onChange={setNum("deliveredHours")} />
            <MetricField label="Staffing gaps" value={form.staffingGaps} onChange={setNum("staffingGaps")} />
            <MetricField label="Intake pipeline" value={form.intakePipeline} onChange={setNum("intakePipeline")} />
            <MetricField label="Auths < 30d" value={form.authsExpiring30d} onChange={setNum("authsExpiring30d")} />
            <MetricField label="Clinical risks" value={form.clinicalRisks} onChange={setNum("clinicalRisks")} />
            <MetricField label="Recruiting needs" value={form.recruitingNeeds} onChange={setNum("recruitingNeeds")} />
            <MetricField label="Cancellation risk" value={form.cancellationRisk} onChange={setNum("cancellationRisk")} />
            <MetricField label="Aging blockers" value={form.agingBlockers} onChange={setNum("agingBlockers")} />
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Derived from operational data (read-only): open escalations{" "}
            <b className="text-foreground">{openEscalations}</b> · open tasks{" "}
            <b className="text-foreground">{openTasks}</b>
          </div>
          {error ? (
            <div className="text-xs text-red-600">{error}</div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={onSave} disabled={saving || !code}>
            {saving ? "Saving…" : "Save metrics"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MetricField({
  label, value, onChange,
}: { label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input type="number" value={value} onChange={onChange} className="mt-1" />
    </div>
  );
}

export function StateEscalationsPage() {
  const { isLeadership, isStateScoped, hasAssignedState, assigned, profiles } = useAvailableStates();
  const initialState: StateCode | "all" = isLeadership
    ? "all"
    : isStateScoped
      ? (assigned ?? ("GA" as StateCode))
      : (assigned ?? profiles[0]?.code ?? "GA");
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

  if (isStateScoped && !hasAssignedState) return <AssignedStateRequired page="State Escalations" />;

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
                  <td className="px-4 py-3">
                    <div>{e.title}</div>
                    <LinkedRefBadges row={e} />
                  </td>
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
  const { isLeadership, isStateScoped, hasAssignedState, assigned, profiles } = useAvailableStates();
  const initialState: StateCode | "all" = isLeadership
    ? "all"
    : isStateScoped
      ? (assigned ?? ("GA" as StateCode))
      : (assigned ?? profiles[0]?.code ?? "GA");
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

  if (isStateScoped && !hasAssignedState) return <AssignedStateRequired page="Operational Tasks" />;

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
                  <td className="px-4 py-3">
                    <div>{t.title}</div>
                    <LinkedRefBadges row={t} />
                  </td>
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