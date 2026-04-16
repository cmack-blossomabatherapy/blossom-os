import { useParams, useNavigate } from "react-router-dom";
import { mockLeads, statusVariant, priorityVariant } from "@/data/leads";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Phone, Mail, MessageSquare, FileText, ArrowRight, UserPlus,
  CheckCircle2, Circle, Clock, Zap, FileIcon, Shield, Calendar,
  AlertCircle, MoreHorizontal, Copy, ExternalLink
} from "lucide-react";

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lead = mockLeads.find((l) => l.id === id);

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">Lead not found</p>
        <Button variant="outline" onClick={() => navigate("/leads")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Leads
        </Button>
      </div>
    );
  }

  const progressSteps = [
    { label: "Contacted", done: lead.lastContacted !== null },
    { label: "Form Sent", done: lead.formStatus !== "Not Sent" },
    { label: "Form Completed", done: lead.formStatus === "Completed" },
    { label: "Consent Completed", done: lead.consentStatus === "Completed" },
    { label: "VOB Sent", done: lead.vobStatus === "Sent" || lead.vobStatus === "Completed" },
    { label: "VOB Received", done: lead.vobStatus === "Completed" },
  ];
  const completedSteps = progressSteps.filter((s) => s.done).length;
  const progressPercent = Math.round((completedSteps / progressSteps.length) * 100);

  const timelineIcons: Record<string, React.ReactNode> = {
    call: <Phone className="h-3.5 w-3.5" />,
    email: <Mail className="h-3.5 w-3.5" />,
    sms: <MessageSquare className="h-3.5 w-3.5" />,
    form: <FileText className="h-3.5 w-3.5" />,
    system: <Zap className="h-3.5 w-3.5" />,
    note: <FileText className="h-3.5 w-3.5" />,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/leads")} className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Leads
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{lead.childName}</h1>
              <span className="text-sm text-muted-foreground font-mono">{lead.id}</span>
            </div>
            <p className="text-sm text-muted-foreground">{lead.parentName} · {lead.childAge}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={lead.priority} variant={priorityVariant(lead.priority)} />
          <StatusBadge status={lead.status} variant={statusVariant(lead.status)} />
          <Button variant="outline" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Quick Actions bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { icon: Phone, label: "Call", variant: "outline" as const },
          { icon: MessageSquare, label: "Text", variant: "outline" as const },
          { icon: Mail, label: "Email", variant: "outline" as const },
          { icon: FileText, label: "Send Form", variant: "outline" as const },
          { icon: Shield, label: "Send Consent", variant: "outline" as const },
          { icon: ArrowRight, label: "Move Stage", variant: "default" as const },
          { icon: UserPlus, label: "Assign Owner", variant: "outline" as const },
          { icon: Calendar, label: "Schedule", variant: "outline" as const },
        ].map(({ icon: Icon, label, variant }) => (
          <Button key={label} variant={variant} size="sm" className="gap-1.5 text-xs h-8">
            <Icon className="h-3.5 w-3.5" /> {label}
          </Button>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left column — main content */}
        <div className="col-span-2 space-y-6">
          {/* Intake Progress */}
          <div className="bg-card rounded-xl border border-border/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Intake Progress</h3>
              <span className="text-sm font-semibold text-primary">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2 mb-4" />
            <div className="grid grid-cols-6 gap-3">
              {progressSteps.map((step, i) => (
                <div key={step.label} className="flex flex-col items-center text-center gap-1.5">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step.done ? "bg-success/10" : "bg-muted"}`}>
                    {step.done ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <span className={`text-[10px] leading-tight ${step.done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs: Timeline / Tasks / Documents */}
          <Tabs defaultValue="timeline">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs">Tasks ({lead.tasks.length})</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs">Documents ({lead.documents.length})</TabsTrigger>
              <TabsTrigger value="automation" className="text-xs">Automation Log</TabsTrigger>
            </TabsList>

            {/* Timeline */}
            <TabsContent value="timeline" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5">
                <div className="space-y-4">
                  {lead.timeline.slice().reverse().map((event, i) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          {timelineIcons[event.type]}
                        </div>
                        {i < lead.timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm text-foreground">{event.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.timestamp).toLocaleDateString("en-US", {
                            weekday: "short", month: "short", day: "numeric",
                            hour: "numeric", minute: "2-digit",
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
                {lead.tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 py-1">
                    {task.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {task.title}
                    </span>
                  </div>
                ))}
                <Separator />
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Circle className="h-3 w-3" /> Add Task
                </Button>
              </div>
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5">
                {lead.documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No documents uploaded yet</p>
                ) : (
                  <div className="space-y-2">
                    {lead.documents.map((doc, i) => (
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

            {/* Automation Log */}
            <TabsContent value="automation" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5 space-y-3">
                {lead.automationLog.map((log, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{log}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column — sidebar info */}
        <div className="space-y-4">
          {/* Contact Info */}
          <div className="bg-card rounded-xl border border-border/60 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-foreground">{lead.phone}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Copy className="h-3 w-3" /></Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-foreground">{lead.email}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Copy className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>

          {/* Lead Details */}
          <div className="bg-card rounded-xl border border-border/60 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Lead Details</h4>
            <div className="space-y-2.5 text-sm">
              {[
                ["State", lead.state],
                ["Source", lead.source],
                ["Owner", lead.owner],
                ["Child Age", lead.childAge],
                ["Created", new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })],
                ["Last Contacted", lead.lastContacted ? new Date(lead.lastContacted).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Never"],
                ["Days in Stage", `${lead.daysInStage}d`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Tracking */}
          <div className="bg-card rounded-xl border border-border/60 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Status Tracking</h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Form</span>
                <StatusBadge status={lead.formStatus} variant={lead.formStatus === "Completed" ? "success" : lead.formStatus === "Not Sent" ? "muted" : "warning"} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Consent</span>
                <StatusBadge status={lead.consentStatus} variant={lead.consentStatus === "Completed" ? "success" : lead.consentStatus === "Not Sent" ? "muted" : "warning"} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">VOB</span>
                <StatusBadge status={lead.vobStatus} variant={lead.vobStatus === "Completed" ? "success" : lead.vobStatus === "Issue" ? "destructive" : lead.vobStatus === "Not Started" ? "muted" : "warning"} />
              </div>
            </div>
          </div>

          {/* Insurance / VOB */}
          <div className="bg-card rounded-xl border border-border/60 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Insurance / VOB</h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payor</span>
                <span className="text-foreground font-medium">{lead.payor}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Coverage</span>
                <span className="text-foreground font-medium">{lead.coverageType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Plan</span>
                <span className="text-foreground font-medium">{lead.paymentPlanNeeded ? "Needed" : "No"}</span>
              </div>
            </div>
          </div>

          {/* Next Action */}
          <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
            <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Next Action</h4>
            <p className="text-sm text-foreground font-medium">{lead.nextAction}</p>
            {lead.nextTaskDue && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Due: {new Date(lead.nextTaskDue).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
