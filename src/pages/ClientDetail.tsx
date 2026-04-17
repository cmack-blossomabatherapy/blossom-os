import { useParams, useNavigate } from "react-router-dom";
import {
  stageVariant, authVariant, staffingVariant, qaVariant,
  getClientAlert, getLifecycleProgress, lifecycleSteps, clientStages, ClientStage,
} from "@/data/clients";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, Phone, Mail, MessageSquare, ArrowRight, UserPlus, CheckCircle2, Circle,
  Clock, Zap, FileIcon, Shield, Calendar, AlertCircle, MoreHorizontal, ExternalLink,
  FileText, MapPin, Briefcase, Users as UsersIcon, Trash2, Send,
} from "lucide-react";
import { useClients } from "@/contexts/ClientsContext";
import { toast } from "sonner";

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
};

const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getClient, updateClient, moveStage, assignBcba, assignRbt, setStartDate, toggleTask, addTask, appendTimeline, appendAutomation, deleteClients } = useClients();
  const client = id ? getClient(id) : undefined;

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
          <StatusBadge status={client.stage} variant={stageVariant(client.stage)} />
          <Button variant="outline" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
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
        {[
          { icon: ArrowRight, label: "Move Stage", variant: "default" as const },
          { icon: UserPlus, label: "Assign BCBA", variant: "outline" as const },
          { icon: UsersIcon, label: "Assign RBT", variant: "outline" as const },
          { icon: Calendar, label: "Schedule Assessment", variant: "outline" as const },
          { icon: Shield, label: "Submit Auth", variant: "outline" as const },
          { icon: Phone, label: "Call Parent", variant: "outline" as const },
          { icon: MessageSquare, label: "Text", variant: "outline" as const },
          { icon: Mail, label: "Email", variant: "outline" as const },
        ].map(({ icon: Icon, label, variant }) => (
          <Button key={label} variant={variant} size="sm" className="gap-1.5 text-xs h-8">
            <Icon className="h-3.5 w-3.5" /> {label}
          </Button>
        ))}
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
                <div className="space-y-4">
                  {client.timeline.map((event, i) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
                          {tlIcons[event.type]}
                        </div>
                        {i < client.timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm text-foreground">{event.description}</p>
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
                {client.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between py-1">
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
                  </div>
                ))}
                <Separator />
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
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
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Weekly Schedule</h4>
                  {client.schedule.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recurring schedule yet</p>
                  ) : (
                    <div className="grid grid-cols-6 gap-2">
                      {dayOrder.map((day) => {
                        const slot = client.schedule.find((s) => s.day === day);
                        return (
                          <div key={day} className={`rounded-lg p-3 text-center text-xs ${slot ? "bg-primary/5 border border-primary/20" : "bg-muted/30"}`}>
                            <p className="font-semibold text-foreground mb-1">{day}</p>
                            {slot ? (
                              <>
                                <p className="text-foreground">{slot.start}</p>
                                <p className="text-muted-foreground">{slot.end}</p>
                                {slot.rbt && <p className="mt-1 text-[10px] text-primary font-medium truncate">{slot.rbt}</p>}
                              </>
                            ) : (
                              <p className="text-muted-foreground">—</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <FileIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-foreground font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.type}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm"><ExternalLink className="h-3.5 w-3.5" /></Button>
                      </div>
                    ))}
                  </div>
                )}
                <Separator className="my-3" />
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
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
    </div>
  );
}
