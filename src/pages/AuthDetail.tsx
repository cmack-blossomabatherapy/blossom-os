import { useParams, useNavigate } from "react-router-dom";
import {
  mockAuths, stageVariant, qaVariant, riskVariant, daysUntil, expirationTone,
  getAuthAlert, getLifecycleProgress, lifecycleStages,
} from "@/data/authorizations";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock, Zap, FileIcon, FileText,
  Shield, AlertCircle, MoreHorizontal, ExternalLink, Send, RefreshCw,
  X as XIcon, UserCircle, Calendar, ClipboardCheck, Building2,
} from "lucide-react";

const tlIcons: Record<string, React.ReactNode> = {
  system: <Zap className="h-3.5 w-3.5" />,
  submission: <Send className="h-3.5 w-3.5" />,
  approval: <CheckCircle2 className="h-3.5 w-3.5" />,
  denial: <XIcon className="h-3.5 w-3.5" />,
  qa: <ClipboardCheck className="h-3.5 w-3.5" />,
  document: <FileText className="h-3.5 w-3.5" />,
  renewal: <RefreshCw className="h-3.5 w-3.5" />,
  note: <FileText className="h-3.5 w-3.5" />,
};

export default function AuthDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = mockAuths.find((a) => a.id === id);

  if (!auth) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">Authorization not found</p>
        <Button variant="outline" onClick={() => navigate("/authorizations")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Authorizations
        </Button>
      </div>
    );
  }

  const alert = getAuthAlert(auth);
  const days = daysUntil(auth.expirationDate);
  const tone = expirationTone(days);
  const lifecycle = getLifecycleProgress(auth);
  const lifecyclePercent = Math.round((lifecycle.filter(Boolean).length / lifecycle.length) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/authorizations")} className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Authorizations
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{auth.clientName}</h1>
              <span className="text-sm text-muted-foreground font-mono">{auth.id}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {auth.payor} · {auth.authType} Authorization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={`Risk: ${auth.riskLevel}`} variant={riskVariant(auth.riskLevel)} />
          <StatusBadge status={auth.stage} variant={stageVariant(auth.stage)} />
          <Button variant="outline" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Snapshot strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Payor", value: auth.payor, icon: Building2 },
          { label: "Coordinator", value: auth.coordinator, icon: UserCircle },
          { label: "Submitted", value: auth.submittedDate || "Not yet", icon: Send, alert: !auth.submittedDate && auth.stage === "Awaiting Submission" },
          {
            label: "Expires",
            value: auth.expirationDate || "—",
            sub: days !== null ? `${days}d remaining` : null,
            icon: Calendar,
            alert: days !== null && days < 30,
          },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border/60 p-3 flex items-center gap-3">
            <div className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center",
              s.alert ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
            )}>
              <s.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{s.label}</p>
              <p className={cn("text-sm font-medium truncate", s.alert ? "text-destructive" : "text-foreground")}>{s.value}</p>
              {"sub" in s && s.sub && (
                <p className={cn(
                  "text-[10px] font-medium",
                  tone === "destructive" && "text-destructive",
                  tone === "warning" && "text-warning",
                  tone === "success" && "text-success",
                )}>{s.sub}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { icon: Send, label: "Submit Authorization", variant: "default" as const },
          { icon: ClipboardCheck, label: "Send to QA", variant: "outline" as const },
          { icon: ArrowRight, label: "Move Stage", variant: "outline" as const },
          { icon: RefreshCw, label: "Trigger Reauth", variant: "outline" as const },
          { icon: FileText, label: "Upload Documents", variant: "outline" as const },
          { icon: UserCircle, label: "Reassign Coordinator", variant: "outline" as const },
        ].map(({ icon: Icon, label, variant }) => (
          <Button key={label} variant={variant} size="sm" className="gap-1.5 text-xs h-8">
            <Icon className="h-3.5 w-3.5" /> {label}
          </Button>
        ))}
      </div>

      {/* Blocker alert */}
      {(alert || auth.missingRequirements.length > 0 || auth.denialReason) && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-destructive mb-1">Risk & Blockers</h4>
              <ul className="space-y-1 text-sm text-foreground">
                {alert && <li>{alert.message}</li>}
                {auth.denialReason && <li>Denial reason: {auth.denialReason}</li>}
                {auth.missingRequirements.map((req, i) => (
                  <li key={i}>Missing: {req}</li>
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
          {/* Lifecycle */}
          <div className="bg-card rounded-xl border border-border/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Authorization Lifecycle</h3>
              <span className="text-sm font-semibold text-primary">{lifecyclePercent}%</span>
            </div>
            <Progress value={lifecyclePercent} className="h-2 mb-4" />
            <div className="grid grid-cols-6 gap-3">
              {lifecycleStages.map((label, i) => {
                const done = lifecycle[i];
                return (
                  <div key={label} className="flex flex-col items-center text-center gap-1.5">
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", done ? "bg-success/10" : "bg-muted")}>
                      {done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground/40" />}
                    </div>
                    <span className={cn("text-[10px] leading-tight", done ? "text-foreground font-medium" : "text-muted-foreground")}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="documents">
            <TabsList className="bg-muted/50 flex-wrap h-auto">
              <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
              <TabsTrigger value="qa" className="text-xs">QA</TabsTrigger>
              <TabsTrigger value="renewal" className="text-xs">Renewal</TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs">Tasks ({auth.tasks.length})</TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
              <TabsTrigger value="automation" className="text-xs">Automation</TabsTrigger>
            </TabsList>

            {/* Documents */}
            <TabsContent value="documents" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5 space-y-2">
                {auth.documents.map((doc, i) => (
                  <div key={i} className={cn(
                    "flex items-center justify-between py-2 px-3 rounded-lg border",
                    doc.required && !doc.received
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-border/40"
                  )}>
                    <div className="flex items-center gap-3">
                      {doc.received
                        ? <CheckCircle2 className="h-4 w-4 text-success" />
                        : <XIcon className={cn("h-4 w-4", doc.required ? "text-destructive" : "text-muted-foreground/40")} />}
                      <div>
                        <p className="text-sm text-foreground font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.required ? "Required" : "Optional"} · {doc.received ? "Received" : "Missing"}
                        </p>
                      </div>
                    </div>
                    {doc.received
                      ? <Button variant="ghost" size="sm"><ExternalLink className="h-3.5 w-3.5" /></Button>
                      : <Button variant="outline" size="sm" className="text-xs h-7">Upload</Button>}
                  </div>
                ))}
                <Separator />
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-muted-foreground">Treatment Plan</span>
                  {auth.treatmentPlanReceived
                    ? <span className="text-success font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Received</span>
                    : <span className="text-destructive font-medium flex items-center gap-1"><XIcon className="h-3 w-3" /> Not received</span>}
                </div>
              </div>
            </TabsContent>

            {/* QA */}
            <TabsContent value="qa" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">QA Status</span>
                    <StatusBadge status={auth.qaStatus} variant={qaVariant(auth.qaStatus)} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">QA Owner</span>
                    <span className="text-foreground font-medium">{auth.qaOwner || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">Treatment Plan</span>
                    <span className={cn("font-medium", auth.treatmentPlanReceived ? "text-success" : "text-destructive")}>
                      {auth.treatmentPlanReceived ? "Received" : "Missing"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">Ready to Submit</span>
                    <span className={cn(
                      "font-medium",
                      auth.qaStatus === "Complete" && !auth.missingInfo ? "text-success" : "text-warning"
                    )}>
                      {auth.qaStatus === "Complete" && !auth.missingInfo ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
                {auth.qaNotes && (
                  <div className="p-3 rounded-lg bg-muted/30 text-sm">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">QA Notes</p>
                    <p className="text-foreground">{auth.qaNotes}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Renewal */}
            <TabsContent value="renewal" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5 space-y-3">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Expiration Date</p>
                    <p className="text-foreground font-medium">{auth.expirationDate || "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Days Remaining</p>
                    <p className={cn(
                      "font-semibold",
                      tone === "destructive" && "text-destructive",
                      tone === "warning" && "text-warning",
                      tone === "success" && "text-success",
                    )}>{days !== null ? `${days}d` : "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Reauth Trigger</p>
                    <p className="text-foreground font-medium">
                      {days === null ? "—" : days <= 30 ? "Active (30d)" : days <= 60 ? "Active (60d)" : days <= 90 ? "Active (90d)" : "Not yet"}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  Reauth subtask is automatically created at the 90-day window. Treatment plan must be confirmed before resubmission.
                </div>
              </div>
            </TabsContent>

            {/* Tasks */}
            <TabsContent value="tasks" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5 space-y-3">
                {auth.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                      {task.completed
                        ? <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                        : <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />}
                      <span className={cn("text-sm", task.completed ? "text-muted-foreground line-through" : "text-foreground")}>
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

            {/* Timeline */}
            <TabsContent value="timeline" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5">
                <div className="space-y-4">
                  {auth.timeline.map((event, i) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
                          {tlIcons[event.type]}
                        </div>
                        {i < auth.timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
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

            {/* Automation */}
            <TabsContent value="automation" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5 space-y-3">
                {auth.automationLog.map((log, i) => (
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
            <p className="text-sm text-foreground font-medium">{auth.nextAction}</p>
            {auth.nextTaskDue && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Due: {auth.nextTaskDue}
              </p>
            )}
          </div>

          {/* Auth details */}
          <div className="bg-card rounded-xl border border-border/60 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Authorization Details</h4>
            <div className="space-y-2.5 text-sm">
              {[
                ["Auth ID", auth.id],
                ["Type", auth.authType],
                ["Payor", auth.payor],
                ["State", auth.state],
                ["Hours", auth.hours || "—"],
                ["Submitted", auth.submittedDate || "—"],
                ["Approved", auth.approvedDate || "—"],
                ["Expires", auth.expirationDate || "—"],
                ["Days in Stage", `${auth.daysInStage}d`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Linked client */}
          <button
            onClick={() => navigate(`/clients/${auth.clientId}`)}
            className="w-full text-left bg-card rounded-xl border border-border/60 p-4 hover:border-primary/30 transition-colors"
          >
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Linked Client</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{auth.clientName}</p>
                <p className="text-xs text-muted-foreground font-mono">{auth.clientId}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>

          {/* Status */}
          <div className="bg-card rounded-xl border border-border/60 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Status</h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Stage</span>
                <StatusBadge status={auth.stage} variant={stageVariant(auth.stage)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">QA</span>
                <StatusBadge status={auth.qaStatus} variant={qaVariant(auth.qaStatus)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Risk Level</span>
                <StatusBadge status={auth.riskLevel} variant={riskVariant(auth.riskLevel)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Missing Info</span>
                <span className={cn("font-medium", auth.missingInfo ? "text-destructive" : "text-success")}>
                  {auth.missingInfo ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
