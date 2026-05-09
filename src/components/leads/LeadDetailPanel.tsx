import { Lead, statusVariant, priorityVariant } from "@/data/leads";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Phone, Mail, MessageSquare, FileText, ArrowRight, UserPlus,
  CheckCircle2, Circle, Clock, Zap, FileIcon, Shield
} from "lucide-react";

interface LeadDetailPanelProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
}

const timelineIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-3 w-3" />,
  email: <Mail className="h-3 w-3" />,
  sms: <MessageSquare className="h-3 w-3" />,
  form: <FileText className="h-3 w-3" />,
  system: <Zap className="h-3 w-3" />,
  note: <FileText className="h-3 w-3" />,
};

export function LeadDetailPanel({ lead, open, onClose }: LeadDetailPanelProps) {
  if (!lead) return null;

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

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      desktopClassName="w-[480px] sm:max-w-[480px] overflow-y-auto"
    >
      <div className="flex h-full max-h-full flex-col overflow-y-auto">
        {/* Header */}
        <div className="p-6 pb-4">
          <SheetHeader className="mb-0">
            <SheetTitle className="text-lg">{lead.childName}</SheetTitle>
            <SheetDescription className="text-xs">
              {lead.parentName} · {lead.phone} · {lead.email}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <StatusBadge status={lead.status} variant={statusVariant(lead.status)} />
            <StatusBadge status={lead.state} variant="muted" />
            <StatusBadge status={lead.source} variant="muted" />
            <StatusBadge status={lead.priority} variant={priorityVariant(lead.priority)} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Owner: <span className="text-foreground font-medium">{lead.owner}</span>
            <span className="mx-2">·</span>
            Child: {lead.childAge}
            <span className="mx-2">·</span>
            {lead.daysInStage}d in stage
          </p>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Actions</h4>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Phone, label: "Call" },
              { icon: MessageSquare, label: "Text" },
              { icon: Mail, label: "Email" },
              { icon: FileText, label: "Send Form" },
              { icon: Shield, label: "Consent" },
              { icon: ArrowRight, label: "Move Stage" },
              { icon: UserPlus, label: "Assign" },
            ].map(({ icon: Icon, label }) => (
              <Button key={label} variant="outline" size="sm" className="h-auto py-2 px-2 flex-col gap-1 text-[10px]">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Intake Progress */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Intake Progress</h4>
            <span className="text-xs font-medium text-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2 mb-3" />
          <div className="space-y-1.5">
            {progressSteps.map((step) => (
              <div key={step.label} className="flex items-center gap-2 text-xs">
                {step.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                )}
                <span className={step.done ? "text-foreground" : "text-muted-foreground"}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Timeline */}
        <div className="p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Timeline</h4>
          <div className="space-y-3">
            {lead.timeline.slice().reverse().map((event) => (
              <div key={event.id} className="flex gap-3">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  {timelineIcons[event.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">{event.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(event.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    {event.user && ` · ${event.user}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Tasks */}
        <div className="p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tasks</h4>
          <div className="space-y-1.5">
            {lead.tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-2 text-xs">
                {task.completed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                )}
                <span className={task.completed ? "text-muted-foreground line-through" : "text-foreground"}>{task.title}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Documents */}
        <div className="p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Documents</h4>
          {lead.documents.length === 0 ? (
            <p className="text-xs text-muted-foreground">No documents yet</p>
          ) : (
            <div className="space-y-1.5">
              {lead.documents.map((doc, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-foreground hover:text-primary cursor-pointer">
                  <FileIcon className="h-3.5 w-3.5" />
                  <span>{doc.name}</span>
                  <span className="text-muted-foreground">({doc.type})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Insurance / VOB */}
        <div className="p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Insurance / VOB</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Payor</span>
              <p className="text-foreground font-medium">{lead.payor}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Coverage</span>
              <p className="text-foreground font-medium">{lead.coverageType}</p>
            </div>
            <div>
              <span className="text-muted-foreground">VOB Status</span>
              <p><StatusBadge status={lead.vobStatus} variant={lead.vobStatus === "Completed" ? "success" : lead.vobStatus === "Issue" ? "destructive" : "muted"} /></p>
            </div>
            <div>
              <span className="text-muted-foreground">Payment Plan</span>
              <p className="text-foreground font-medium">{lead.paymentPlanNeeded ? "Needed" : "No"}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Automation Log */}
        <div className="p-4 pb-8">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Automation Log</h4>
          <div className="space-y-1.5">
            {lead.automationLog.map((log, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-3 w-3 text-primary" />
                {log}
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
