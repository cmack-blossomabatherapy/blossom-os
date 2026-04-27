import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  stageVariant, authVariant, staffingVariant, qaVariant,
  getClientAlert, getLifecycleProgress, lifecycleSteps, ClientStage, ScheduleSlot,
} from "@/data/clients";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Phone, Mail, MessageSquare, ArrowRight, UserPlus, CheckCircle2, Circle,
  Clock, Zap, FileIcon, Shield, Calendar, AlertCircle, MoreHorizontal, ExternalLink,
  FileText, MapPin, Briefcase, Users as UsersIcon, Trash2, Send,
} from "lucide-react";
import { useClients } from "@/contexts/ClientsContext";
import { toast } from "sonner";
import {
  AddTaskDialog, DatePickerDialog, ScheduleBlockDialog, UploadDocumentDialog,
} from "@/components/clients/ClientDetailDialogs";
import { canonicalPipelineStage, getNextPipelineStage } from "@/data/pipeline";
import { mockPhoneCalls } from "@/data/calls";

type ScheduleDay = ScheduleSlot["day"];

const BCBAS = ["Dr. Kim", "Dr. Lee", "Dr. Patel"];
const RBTS = ["Taylor S.", "Jordan M.", "Casey R.", "Alex T."];

const tlIcons: Record<string, React.ReactNode> = {
  system: <Zap className="h-3.5 w-3.5" />,
  auth: <Shield className="h-3.5 w-3.5" />,
  staffing: <UserPlus className="h-3.5 w-3.5" />,
  schedule: <Calendar className="h-3.5 w-3.5" />,
  qa: <CheckCircle2 className="h-3.5 w-3.5" />,
  note: <FileText className="h-3.5 w-3.5" />,
  stage: <ArrowRight className="h-3.5 w-3.5" />,
  call: <Phone className="h-3.5 w-3.5" />,
  document: <FileIcon className="h-3.5 w-3.5" />,
  task: <Circle className="h-3.5 w-3.5" />,
};

const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type UnifiedTimelineEvent = {
  id: string;
  type: "system" | "auth" | "staffing" | "schedule" | "qa" | "note" | "stage" | "call" | "document" | "task";
  title: string;
  detail?: string;
  timestamp: string;
  user?: string;
};

const dateToIso = (date: string | null | undefined, fallbackOffset = 0) => {
  if (!date) return new Date(Date.now() - fallbackOffset * 60_000).toISOString();
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? new Date(Date.now() - fallbackOffset * 60_000).toISOString() : parsed.toISOString();
};

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getClient, updateClient, moveStage, assignBcba, assignRbt, setStartDate, toggleTask, addTask, appendTimeline, appendAutomation, deleteClients } = useClients();
  const client = id ? getClient(id) : undefined;

  // Dialog state
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [uploadDocOpen, setUploadDocOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [assessmentDateOpen, setAssessmentDateOpen] = useState(false);
  const [scheduleDay, setScheduleDay] = useState<ScheduleDay | null>(null);
  const [removeScheduleDay, setRemoveScheduleDay] = useState<ScheduleDay | null>(null);
  const [removeDocIdx, setRemoveDocIdx] = useState<number | null>(null);
  const [confirmDeleteClient, setConfirmDeleteClient] = useState(false);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">Client not found</p>
        <Button variant="outline" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Clients
        </Button>
      </div>
    );
  }

  const alert = getClientAlert(client);
  const lifecycle = getLifecycleProgress(client);
  const lifecyclePercent = Math.round((lifecycle.filter(Boolean).length / lifecycle.length) * 100);
  const nextStage = getNextPipelineStage(client.stage) as ClientStage | null;
  const linkedCalls = mockPhoneCalls.filter((call) => call.linkedClientId === client.id || call.callerName === client.parentName);
  const unifiedTimeline: UnifiedTimelineEvent[] = [
    ...client.timeline.map((event) => ({ id: `timeline-${event.id}`, type: event.type, title: event.description, timestamp: event.timestamp, user: event.user })),
    ...client.authorizations.flatMap((auth, index) => [
      auth.submittedDate ? { id: `auth-submitted-${index}`, type: "auth" as const, title: `${auth.type} authorization submitted`, detail: auth.payor ?? client.payor, timestamp: dateToIso(auth.submittedDate, 30 + index), user: auth.assignedAuthCoordinator } : null,
      auth.approvedDate ? { id: `auth-approved-${index}`, type: "auth" as const, title: `${auth.type} authorization approved`, detail: auth.hours ?? auth.frequency ?? undefined, timestamp: dateToIso(auth.approvedDate, 20 + index), user: auth.assignedAuthCoordinator } : null,
      auth.expirationDate ? { id: `auth-expiration-${index}`, type: "auth" as const, title: `${auth.type} authorization expires`, detail: auth.expirationDate, timestamp: dateToIso(auth.expirationDate, 10 + index), user: auth.assignedAuthCoordinator } : null,
    ].filter(Boolean) as UnifiedTimelineEvent[]),
    ...client.staffingHistory.map((item, index) => ({ id: `staffing-${index}`, type: "staffing" as const, title: item.event, timestamp: dateToIso(item.date, 60 + index), user: client.rbt ?? undefined })),
    ...client.schedule.map((slot, index) => ({ id: `schedule-${index}`, type: "schedule" as const, title: `${slot.day} schedule block`, detail: `${slot.start}–${slot.end}${slot.rbt ? ` · ${slot.rbt}` : ""}${slot.location ? ` · ${slot.location}` : ""}`, timestamp: dateToIso(client.startDate ?? client.assessmentDate, 90 + index), user: slot.rbt })),
    ...client.documents.map((doc, index) => ({ id: `document-${index}`, type: "document" as const, title: `Document added: ${doc.name}`, detail: doc.type, timestamp: dateToIso(client.timeline[index]?.timestamp, 120 + index) })),
    ...client.tasks.map((task, index) => ({ id: `task-${task.id}`, type: "task" as const, title: task.completed ? `Task completed: ${task.title}` : `Task created: ${task.title}`, detail: task.dueDate ? `Due ${task.dueDate}` : undefined, timestamp: dateToIso(task.dueDate, 150 + index) })),
    ...client.automationLog.map((log, index) => ({ id: `automation-${index}`, type: "system" as const, title: log, detail: "Automation", timestamp: dateToIso(client.timeline[index]?.timestamp, 180 + index), user: "System" })),
    ...linkedCalls.flatMap((call) => [
      { id: `call-${call.id}`, type: "call" as const, title: `${call.direction} call · ${call.status}`, detail: call.outcome !== "—" ? call.outcome : call.lastAction, timestamp: call.callTime, user: call.assignedTo ?? undefined },
      ...call.timeline.map((event) => ({ id: `call-${call.id}-${event.id}`, type: "call" as const, title: event.description, detail: call.notes || undefined, timestamp: event.timestamp, user: event.user })),
    ]),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const moveClientStage = (stage: ClientStage) => {
    void moveStage([client.id], stage)
      .then(() => toast.success(`Moved to ${stage}`))
      .catch((error) => toast.error("Pipeline stages must advance in order", { description: error instanceof Error ? error.message : undefined }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/clients")} className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Clients
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{client.childName}</h1>
              <span className="text-sm text-muted-foreground font-mono">{client.id}</span>
            </div>
            <p className="text-sm text-muted-foreground">{client.parentName} · {client.childAge}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={canonicalPipelineStage(client.stage)} variant={stageVariant(client.stage)} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/clients/${client.id}`); toast.success("Client link copied"); }}>
                <ExternalLink className="h-3.5 w-3.5 mr-2" /> Copy client link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => moveClientStage("Flaked")}>
                <AlertCircle className="h-3.5 w-3.5 mr-2" /> Mark as Flaked
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => moveClientStage("Services on Pause")}>
                <Clock className="h-3.5 w-3.5 mr-2" /> Pause services
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => moveClientStage("Discharged")}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Discharge
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onSelect={(e) => { e.preventDefault(); setConfirmDeleteClient(true); }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Snapshot strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Clinic", value: client.clinic, icon: MapPin },
          { label: "BCBA", value: client.bcba || "Unassigned", icon: Briefcase, alert: !client.bcba },
          { label: "RBT", value: client.rbt || "Not assigned", icon: UsersIcon, alert: !client.rbt && client.staffingStatus === "Needed" },
          { label: "Start Date", value: client.startDate || "Not set", icon: Calendar, alert: !client.startDate && client.stage === "Pending Start Date" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border/60 p-3 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.alert ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{s.label}</p>
              <p className={`text-sm font-medium truncate ${s.alert ? "text-destructive" : "text-foreground"}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" className="gap-1.5 text-xs h-8">
              <ArrowRight className="h-3.5 w-3.5" /> Move Stage
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-[400px] overflow-y-auto">
            <DropdownMenuLabel className="text-[10px]">Move to stage</DropdownMenuLabel>
            <DropdownMenuItem disabled={!nextStage} onClick={() => nextStage && moveClientStage(nextStage)}>
              {nextStage ? `Next: ${nextStage}` : "No next stage"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <UserPlus className="h-3.5 w-3.5" /> Assign BCBA
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel className="text-[10px]">Assign BCBA</DropdownMenuLabel>
            {BCBAS.map((b) => (
              <DropdownMenuItem key={b} onClick={() => { assignBcba([client.id], b); toast.success(`${b} assigned`); }}>{b}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <UsersIcon className="h-3.5 w-3.5" /> Assign RBT
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel className="text-[10px]">Assign RBT</DropdownMenuLabel>
            {RBTS.map((r) => (
              <DropdownMenuItem key={r} onClick={() => { assignRbt([client.id], r); toast.success(`${r} assigned`); }}>{r}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline" size="sm" className="gap-1.5 text-xs h-8"
          onClick={() => setAssessmentDateOpen(true)}
        >
          <Calendar className="h-3.5 w-3.5" /> Schedule Assessment
        </Button>

        <Button
          variant="outline" size="sm" className="gap-1.5 text-xs h-8"
          onClick={() => {
            updateClient(client.id, { authStatus: "Submitted" });
            appendTimeline(client.id, "Authorization submitted to payor", "auth");
            appendAutomation(client.id, "Auth submitted");
            toast.success("Authorization submitted");
          }}
        >
          <Shield className="h-3.5 w-3.5" /> Submit Auth
        </Button>

        <Button
          variant="outline" size="sm" className="gap-1.5 text-xs h-8"
          onClick={() => setStartDateOpen(true)}
        >
          <Calendar className="h-3.5 w-3.5" /> Set Start Date
        </Button>

        <Button
          variant="outline" size="sm" className="gap-1.5 text-xs h-8"
          onClick={() => {
            updateClient(client.id, {
              documents: [...client.documents, { name: `Case Coordination – ${client.childName}`, type: "PDF" }],
            });
            appendAutomation(client.id, "Case Coordination document generated");
            appendTimeline(client.id, "Case Coordination document generated", "system");
            toast.success("Case Coordination document generated");
          }}
        >
          <FileText className="h-3.5 w-3.5" /> Case Coord Doc
        </Button>

        <Button
          variant="outline" size="sm" className="gap-1.5 text-xs h-8"
          onClick={() => {
            appendAutomation(client.id, `Pairing email sent (BCBA: ${client.bcba || "—"}, RBT: ${client.rbt || "—"})`);
            appendTimeline(client.id, "Pairing email sent to BCBA & RBT", "staffing");
            toast.success("Pairing email sent");
          }}
        >
          <Send className="h-3.5 w-3.5" /> Send Pairing Email
        </Button>

        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => toast.success(`Calling ${client.parentName}…`)}>
          <Phone className="h-3.5 w-3.5" /> Call Parent
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => toast.success("Opening text composer")}>
          <MessageSquare className="h-3.5 w-3.5" /> Text
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => toast.success("Opening email composer")}>
          <Mail className="h-3.5 w-3.5" /> Email
        </Button>
      </div>

      {/* Blocker alert */}
      {(alert || client.blockers.length > 0) && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-destructive mb-1">Blockers</h4>
              <ul className="space-y-1">
                {alert && <li className="text-sm text-foreground">{alert.message}</li>}
                {client.blockers.map((b, i) => (
                  <li key={i} className="text-sm text-foreground">{b}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left column */}
        <div className="col-span-2 space-y-6">
          {/* Lifecycle Tracker */}
          <div className="bg-card rounded-xl border border-border/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Lifecycle Tracker</h3>
              <span className="text-sm font-semibold text-primary">{lifecyclePercent}%</span>
            </div>
            <Progress value={lifecyclePercent} className="h-2 mb-4" />
            <div className="grid grid-cols-5 gap-3">
              {lifecycleSteps.map((label, i) => {
                const done = lifecycle[i];
                return (
                  <div key={label} className="flex flex-col items-center text-center gap-1.5">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${done ? "bg-success/10" : "bg-muted"}`}>
                      {done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground/40" />}
                    </div>
                    <span className={`text-[10px] leading-tight ${done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="timeline">
            <TabsList className="bg-muted/50 flex-wrap h-auto">
              <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs">Tasks ({client.tasks.length})</TabsTrigger>
              <TabsTrigger value="auth" className="text-xs">Authorizations</TabsTrigger>
              <TabsTrigger value="staffing" className="text-xs">Staffing</TabsTrigger>
              <TabsTrigger value="schedule" className="text-xs">Schedule</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs">Documents ({client.documents.length})</TabsTrigger>
              <TabsTrigger value="automation" className="text-xs">Automation</TabsTrigger>
            </TabsList>

            {/* Timeline */}
            <TabsContent value="timeline" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Unified Client Timeline</h3>
                    <p className="text-xs text-muted-foreground">Scheduling, staffing, QA, auth, calls, documents, tasks, and automation</p>
                  </div>
                  <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">{unifiedTimeline.length}</span>
                </div>
                <div className="max-h-[620px] space-y-4 overflow-y-auto pr-2">
                  {unifiedTimeline.map((event, i) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
                          {tlIcons[event.type]}
                        </div>
                        {i < unifiedTimeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm text-foreground">{event.title}</p>
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{event.type}</span>
                        </div>
                        {event.detail && <p className="mt-1 text-xs text-muted-foreground">{event.detail}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.timestamp).toLocaleDateString("en-US", {
                            weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                          })}
                          {event.user && <span> · {event.user}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Tasks */}
            <TabsContent value="tasks" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5 space-y-3">
                {client.tasks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>
                )}
                {client.tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      toggleTask(client.id, task.id);
                      toast.success(task.completed ? "Task reopened" : "Task completed");
                    }}
                    className="w-full flex items-center justify-between py-1.5 px-2 -mx-2 rounded-md hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {task.completed
                        ? <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                        : <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />}
                      <span className={`text-sm ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {task.title}
                      </span>
                    </div>
                    {task.dueDate && !task.completed && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {task.dueDate}
                      </span>
                    )}
                  </button>
                ))}
                <Separator />
                <Button
                  variant="outline" size="sm" className="gap-1.5 text-xs"
                  onClick={() => setAddTaskOpen(true)}
                >
                  <Circle className="h-3 w-3" /> Add Task
                </Button>
              </div>
            </TabsContent>

            {/* Authorizations */}
            <TabsContent value="auth" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5 space-y-3">
                {client.authorizations.map((auth, i) => (
                  <div key={i} className="border border-border/60 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-foreground">{auth.type} Authorization</h4>
                      <StatusBadge status={auth.status} variant={authVariant(auth.status)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {auth.submittedDate && (
                        <div><span className="text-muted-foreground">Submitted:</span> <span className="text-foreground font-medium">{auth.submittedDate}</span></div>
                      )}
                      {auth.approvedDate && (
                        <div><span className="text-muted-foreground">Approved:</span> <span className="text-foreground font-medium">{auth.approvedDate}</span></div>
                      )}
                      {auth.expirationDate && (
                        <div><span className="text-muted-foreground">Expires:</span> <span className="text-foreground font-medium">{auth.expirationDate}</span></div>
                      )}
                      {auth.hours && (
                        <div><span className="text-muted-foreground">Hours:</span> <span className="text-foreground font-medium">{auth.hours}</span></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Staffing */}
            <TabsContent value="staffing" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">RBT Status</span>
                    <StatusBadge status={client.staffingStatus} variant={staffingVariant(client.staffingStatus)} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">Assigned RBT</span>
                    <span className="text-foreground font-medium">{client.rbt || "—"}</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Staffing History</h4>
                  {client.staffingHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No staffing activity recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {client.staffingHistory.map((h, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{h.date}</span>
                          <span className="text-foreground">{h.event}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Schedule */}
            <TabsContent value="schedule" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">Assessment Date</span>
                    <span className="text-foreground font-medium">{client.assessmentDate || "Not scheduled"}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">Start Date</span>
                    <span className="text-foreground font-medium">{client.startDate || "Not set"}</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Weekly Schedule</h4>
                    <Button
                      variant="outline" size="sm" className="h-7 text-xs gap-1"
                      onClick={() => {
                        const seed: ScheduleSlot[] = dayOrder.slice(0, 5).map((d) => ({
                          day: d, start: "09:00", end: "12:00", rbt: client.rbt ?? undefined,
                        }));
                        updateClient(client.id, { schedule: seed });
                        appendTimeline(client.id, "Default M–F schedule generated (9–12)", "schedule");
                        toast.success("Default schedule generated");
                      }}
                    >
                      <Calendar className="h-3 w-3" /> Generate M–F
                    </Button>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {dayOrder.map((day) => {
                      const slot = client.schedule.find((s) => s.day === day);
                      return (
                        <button
                          key={day}
                          onClick={() => {
                            if (slot) setRemoveScheduleDay(day);
                            else setScheduleDay(day);
                          }}
                          className={`rounded-lg p-3 text-center text-xs transition-colors ${slot ? "bg-primary/5 border border-primary/20 hover:bg-primary/10" : "bg-muted/30 hover:bg-muted/50 border border-transparent"}`}
                        >
                          <p className="font-semibold text-foreground mb-1">{day}</p>
                          {slot ? (
                            <>
                              <p className="text-foreground">{slot.start}</p>
                              <p className="text-muted-foreground">{slot.end}</p>
                              {slot.rbt && <p className="mt-1 text-[10px] text-primary font-medium truncate">{slot.rbt}</p>}
                            </>
                          ) : (
                            <p className="text-muted-foreground">+ add</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5">
                {client.documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No documents uploaded yet</p>
                ) : (
                  <div className="space-y-2">
                    {client.documents.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors group">
                        <div className="flex items-center gap-3">
                          <FileIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-foreground font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => toast.info(`Opening ${doc.name}…`, { description: "Document preview coming soon" })}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => setRemoveDocIdx(i)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Separator className="my-3" />
                <Button
                  variant="outline" size="sm" className="gap-1.5 text-xs"
                  onClick={() => setUploadDocOpen(true)}
                >
                  <FileText className="h-3 w-3" /> Upload Document
                </Button>
              </div>
            </TabsContent>

            {/* Automation */}
            <TabsContent value="automation" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5 space-y-3">
                {client.automationLog.map((log, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{log}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Next Action */}
          <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
            <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Next Action</h4>
            <p className="text-sm text-foreground font-medium">{client.nextAction}</p>
            {client.nextTaskDue && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Due: {client.nextTaskDue}
              </p>
            )}
          </div>

          {/* Status snapshot */}
          <div className="bg-card rounded-xl border border-border/60 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Status</h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Authorization</span>
                <StatusBadge status={client.authStatus} variant={authVariant(client.authStatus)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Staffing</span>
                <StatusBadge status={client.staffingStatus} variant={staffingVariant(client.staffingStatus)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">QA</span>
                <StatusBadge status={client.qaStatus} variant={qaVariant(client.qaStatus)} />
              </div>
            </div>
          </div>

          {/* Client details */}
          <div className="bg-card rounded-xl border border-border/60 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Client Details</h4>
            <div className="space-y-2.5 text-sm">
              {[
                ["State", client.state],
                ["Clinic", client.clinic],
                ["Payor", client.payor],
                ["Intake Owner", client.intakeOwner],
                ["Days in Stage", `${client.daysInStage}d`],
                ["Days Since VOB", `${client.daysSinceVOB}d`],
                ["Days Since Assessment", client.daysSinceAssessment !== null ? `${client.daysSinceAssessment}d` : "—"],
                ["Days to Start", client.daysToStart !== null ? `${client.daysToStart}d` : "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div className="bg-card rounded-xl border border-border/60 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Assigned Team</h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">BCBA</span>
                {client.bcba ? <span className="text-foreground font-medium">{client.bcba}</span> : <span className="text-destructive font-medium">Unassigned</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">RBT</span>
                {client.rbt ? <span className="text-foreground font-medium">{client.rbt}</span> : <span className="text-muted-foreground">—</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Intake Owner</span>
                <span className="text-foreground font-medium">{client.intakeOwner}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AddTaskDialog
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        onConfirm={(title, dueDate) => {
          addTask(client.id, { id: `ct-${Date.now()}`, title, completed: false, dueDate });
          appendTimeline(client.id, `Task added: ${title}`, "note");
          toast.success("Task added");
        }}
      />

      <DatePickerDialog
        open={startDateOpen}
        onOpenChange={setStartDateOpen}
        title="Set start date"
        description="When does this client begin services?"
        label="Start date"
        defaultDate={client.startDate ?? undefined}
        confirmLabel="Set start date"
        onConfirm={(d) => { setStartDate([client.id], d); toast.success("Start date set"); }}
      />

      <DatePickerDialog
        open={assessmentDateOpen}
        onOpenChange={setAssessmentDateOpen}
        title="Schedule assessment"
        description="Choose the assessment date — the client will move to Assessment Scheduled."
        label="Assessment date"
        defaultDate={client.assessmentDate ?? undefined}
        confirmLabel="Schedule"
        onConfirm={(d) => {
          updateClient(client.id, { assessmentDate: d, stage: "Assessment Scheduled" });
          appendTimeline(client.id, `Assessment scheduled for ${d}`, "schedule");
          appendAutomation(client.id, `Assessment scheduled (${d})`);
          toast.success("Assessment scheduled");
        }}
      />

      <ScheduleBlockDialog
        open={scheduleDay !== null}
        onOpenChange={(o) => { if (!o) setScheduleDay(null); }}
        day={scheduleDay}
        defaultRbt={client.rbt ?? undefined}
        onConfirm={(start, end) => {
          if (!scheduleDay) return;
          updateClient(client.id, {
            schedule: [...client.schedule, { day: scheduleDay, start, end, rbt: client.rbt ?? undefined }],
          });
          appendTimeline(client.id, `${scheduleDay} ${start}–${end} added to schedule`, "schedule");
          toast.success(`${scheduleDay} added`);
          setScheduleDay(null);
        }}
      />

      <UploadDocumentDialog
        open={uploadDocOpen}
        onOpenChange={setUploadDocOpen}
        onConfirm={(name, type) => {
          updateClient(client.id, { documents: [...client.documents, { name, type }] });
          appendTimeline(client.id, `Document uploaded: ${name}`, "note");
          toast.success("Document added");
        }}
      />

      {/* Confirm: remove schedule block */}
      <AlertDialog open={removeScheduleDay !== null} onOpenChange={(o) => { if (!o) setRemoveScheduleDay(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeScheduleDay} block?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear the {removeScheduleDay} session from the weekly schedule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!removeScheduleDay) return;
                updateClient(client.id, { schedule: client.schedule.filter((s) => s.day !== removeScheduleDay) });
                appendTimeline(client.id, `${removeScheduleDay} schedule block removed`, "schedule");
                toast.success(`${removeScheduleDay} cleared`);
                setRemoveScheduleDay(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm: remove document */}
      <AlertDialog open={removeDocIdx !== null} onOpenChange={(o) => { if (!o) setRemoveDocIdx(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove document?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeDocIdx !== null && client.documents[removeDocIdx]
                ? `“${client.documents[removeDocIdx].name}” will be removed from this client.`
                : "This document will be removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (removeDocIdx === null) return;
                const doc = client.documents[removeDocIdx];
                updateClient(client.id, { documents: client.documents.filter((_, j) => j !== removeDocIdx) });
                appendTimeline(client.id, `Document removed: ${doc.name}`, "note");
                toast.success("Document removed");
                setRemoveDocIdx(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm: delete client */}
      <AlertDialog open={confirmDeleteClient} onOpenChange={setConfirmDeleteClient}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {client.childName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the client record. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteClients([client.id]);
                toast.success("Client deleted");
                navigate("/clients");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
