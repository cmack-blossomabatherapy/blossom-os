import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDeepLink, useConsumeDeepLink, useDeepLinkHighlight } from "@/lib/deepLink";
import { statusVariant, priorityVariant, getInlineAlert, pipelineStages, LeadStatus } from "@/data/leads";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, Phone, Mail, MessageSquare, FileText, ArrowRight, UserPlus,
  CheckCircle2, Circle, Clock, Zap, FileIcon, Shield, Calendar,
  AlertCircle, MoreHorizontal, Copy, ExternalLink, Send, Upload,
  CreditCard, FileCheck2, PhoneCall, StickyNote, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeads } from "@/contexts/LeadsContext";
import { toast } from "sonner";
import { OSShell } from "@/pages/os/OSShell";
import { BenefitsCheatSheetMatchPanel } from "@/components/leads/LeadDetailDrawer";
import {
  callParent,
  sendLeadEmail,
  sendLeadSms,
  sendIntakePacket,
  sendMissingInfoReminder,
  sendVobUpdate,
  notifyCommunicationResult,
} from "@/lib/integrations/communications/communicationAdapters";

const COORDINATORS = ["Sarah M.", "James R.", "Maya P."];

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getLead, updateLead, moveStage, assignOwner, deleteLeads } = useLeads();
  const lead = id ? getLead(id) : undefined;

  // Hidden file inputs powering Upload document, VOB upload, and the empty-state dropzone.
  const docInputRef = useRef<HTMLInputElement>(null);
  const vobInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (n?: number) => {
    if (!n && n !== 0) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDocumentUpload = (files: FileList | null) => {
    if (!lead || !files || files.length === 0) return;
    const now = new Date().toISOString();
    const newDocs = Array.from(files).map((f) => ({
      name: f.name,
      type: "Parent Provided Document",
      uploadedAt: now,
    }));
    updateLead(lead.id, {
      documents: [...(lead.documents ?? []), ...newDocs],
      automationLog: [
        ...(lead.automationLog ?? []),
        ...newDocs.map((d) => `Document uploaded: ${d.name} (storage connection pending)`),
      ],
    });
    toast.success(`Attached ${newDocs.length} document${newDocs.length === 1 ? "" : "s"}`, {
      description: "Storage connection pending — metadata recorded against this lead.",
    });
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const handleVobUpload = (files: FileList | null) => {
    if (!lead || !files || files.length === 0) return;
    const f = files[0];
    const now = new Date().toISOString();
    updateLead(lead.id, {
      vobFile: { name: f.name, uploadedAt: now },
      documents: [
        ...(lead.documents ?? []),
        { name: f.name, type: "VOB", uploadedAt: now },
      ],
      automationLog: [
        ...(lead.automationLog ?? []),
        `VOB uploaded: ${f.name} (storage connection pending)`,
      ],
    });
    toast.success(`VOB uploaded: ${f.name}`, {
      description: `${formatBytes(f.size)} · storage connection pending`,
    });
    if (vobInputRef.current) vobInputRef.current.value = "";
  };

  // Deep-link: open a tab and highlight a task if requested via the URL.
  const deepLink = useDeepLink();
  useConsumeDeepLink();
  const validTabs = ["timeline","communications","tasks","forms","insurance","documents","automation"] as const;
  type LeadTabKey = typeof validTabs[number];
  const focusToTab: Record<string, LeadTabKey> = {
    tasks: "tasks", task: "tasks",
    communications: "communications", forms: "forms",
    insurance: "insurance", documents: "documents", automation: "automation",
    timeline: "timeline",
  };
  let initialTab: LeadTabKey = "timeline";
  if (deepLink.tab && (validTabs as readonly string[]).includes(deepLink.tab)) {
    initialTab = deepLink.tab as LeadTabKey;
  } else if (deepLink.focus && focusToTab[deepLink.focus.toLowerCase()]) {
    initialTab = focusToTab[deepLink.focus.toLowerCase()];
  } else if (deepLink.task) {
    initialTab = "tasks";
  }
  const [activeTab, setActiveTab] = useState<LeadTabKey>(initialTab);
  useDeepLinkHighlight(deepLink.task ? `task-${deepLink.task}` : null, !!lead);
  useEffect(() => {
    if (lead && deepLink.alert) toast.message?.("Opened from alert");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  if (!lead) {
    return (
      <OSShell>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-muted-foreground">Lead not found</p>
          <Button variant="outline" onClick={() => navigate("/leads")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Leads
          </Button>
        </div>
      </OSShell>
    );
  }

  const alert = getInlineAlert(lead);

  const progressSteps = [
    { label: "Contacted", done: lead.lastContacted !== null },
    { label: "Form Sent", done: lead.formStatus !== "Not Sent" },
    { label: "Form Completed", done: lead.formStatus === "Completed" },
    { label: "Consent Completed", done: lead.consentStatus === "Completed" },
    { label: "VOB Sent", done: ["Sent", "Received", "Completed", "Approved", "Payment Plan Required"].includes(lead.vobStatus) },
    { label: "VOB Received", done: ["Received", "Completed", "Approved", "Payment Plan Required"].includes(lead.vobStatus) },
  ];
  const completedSteps = progressSteps.filter((s) => s.done).length;
  const progressPercent = Math.round((completedSteps / progressSteps.length) * 100);

  const timelineIcons: Record<string, React.ReactNode> = {
    call: <Phone className="h-3.5 w-3.5" />,
    email: <Mail className="h-3.5 w-3.5" />,
    sms: <MessageSquare className="h-3.5 w-3.5" />,
    form: <FileText className="h-3.5 w-3.5" />,
    system: <Zap className="h-3.5 w-3.5" />,
    note: <StickyNote className="h-3.5 w-3.5" />,
  };

  const commIcon = (t: string) =>
    t === "call" ? <PhoneCall className="h-3.5 w-3.5" /> :
    t === "sms" ? <MessageSquare className="h-3.5 w-3.5" /> :
    t === "email" ? <Mail className="h-3.5 w-3.5" /> :
    <StickyNote className="h-3.5 w-3.5" />;

  return (
    <OSShell>
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
            <p className="text-sm text-muted-foreground">{lead.parentName} · {lead.childAge} · {lead.state}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={lead.priority} variant={priorityVariant(lead.priority)} />
          <StatusBadge status={lead.status} variant={statusVariant(lead.status)} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => copy(`${window.location.origin}/leads/${lead.id}`, "Lead link")}>
                <Copy className="h-3.5 w-3.5 mr-2" /> Copy lead link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateLead(lead.id, { priority: lead.priority === "Hot" ? "Warm" : "Hot" })}>
                <AlertCircle className="h-3.5 w-3.5 mr-2" /> Toggle priority
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  if (window.confirm(`Delete ${lead.childName}? This cannot be undone.`)) {
                    deleteLeads([lead.id]);
                    toast.success("Lead deleted");
                    navigate("/leads");
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Inline alert banner */}
      {alert && (
        <div className={cn(
          "rounded-xl border px-4 py-2.5 flex items-center gap-2 text-sm",
          alert.type === "red" ? "bg-destructive/5 border-destructive/30 text-destructive" : "bg-warning/5 border-warning/30 text-warning",
        )}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">{alert.message}</span>
        </div>
      )}

      {/* Quick Actions bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={async () => {
          notifyCommunicationResult(await callParent({ leadId: lead.id, phone: lead.phone, email: lead.email, parentName: lead.parentName, childName: lead.childName, state: lead.state, insurance: lead.insurance }));
        }}>
          <Phone className="h-3.5 w-3.5" /> Call Parent
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={async () => {
          notifyCommunicationResult(await sendLeadSms({ leadId: lead.id, phone: lead.phone, email: lead.email, parentName: lead.parentName, childName: lead.childName, state: lead.state, insurance: lead.insurance }));
        }}>
          <MessageSquare className="h-3.5 w-3.5" /> Send SMS
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={async () => {
          notifyCommunicationResult(await sendLeadEmail({ leadId: lead.id, phone: lead.phone, email: lead.email, parentName: lead.parentName, childName: lead.childName, state: lead.state, insurance: lead.insurance }));
        }}>
          <Mail className="h-3.5 w-3.5" /> Send Email
        </Button>
        <Button
          variant="outline" size="sm" className="gap-1.5 text-xs h-8"
          onClick={async () => {
            const res = await sendIntakePacket({ leadId: lead.id, phone: lead.phone, email: lead.email, parentName: lead.parentName, childName: lead.childName, state: lead.state, insurance: lead.insurance });
            notifyCommunicationResult(res);
            if (!res.success) return;
            updateLead(lead.id, {
              formStatus: "Sent",
              status: lead.status === "In Contact" || lead.status === "New Lead" ? "Sent Form" : lead.status,
              automationLog: [...lead.automationLog, "Intake packet sent via Mailchimp Email"],
            });
          }}
        >
          <FileText className="h-3.5 w-3.5" /> Send Intake Packet
        </Button>
        <Button
          variant="outline" size="sm" className="gap-1.5 text-xs h-8"
          onClick={() => {
            updateLead(lead.id, {
              consentStatus: "Sent",
              automationLog: [...lead.automationLog, "Consent forms sent"],
            });
            toast.success("Consent forms sent");
          }}
        >
          <Shield className="h-3.5 w-3.5" /> Send Consent
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" className="gap-1.5 text-xs h-8">
              <ArrowRight className="h-3.5 w-3.5" /> Move Stage
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-[400px] overflow-y-auto">
            <DropdownMenuLabel className="text-[10px]">Move to stage</DropdownMenuLabel>
            {pipelineStages.map((s) => (
              <DropdownMenuItem
                key={s.name}
                onClick={() => {
                  moveStage([lead.id], s.name as LeadStatus);
                  toast.success(`Moved to ${s.name}`);
                }}
              >
                {s.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <UserPlus className="h-3.5 w-3.5" /> Assign Owner
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel className="text-[10px]">Assign to</DropdownMenuLabel>
            {COORDINATORS.map((o) => (
              <DropdownMenuItem
                key={o}
                onClick={() => {
                  assignOwner([lead.id], o);
                  toast.success(`Assigned to ${o}`);
                }}
              >
                {o}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => navigate("/scheduling")}>
          <Calendar className="h-3.5 w-3.5" /> Schedule
        </Button>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left column — main content */}
        <div className="col-span-2 space-y-6">
          {/* Intake Progress */}
          <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Intake Progress</h3>
              <span className="text-sm font-semibold text-primary">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2 mb-4" />
            <div className="grid grid-cols-6 gap-3">
              {progressSteps.map((step) => (
                <div key={step.label} className="flex flex-col items-center text-center gap-1.5">
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", step.done ? "bg-success/10" : "bg-muted")}>
                    {step.done
                      ? <CheckCircle2 className="h-4 w-4 text-success" />
                      : <Circle className="h-4 w-4 text-muted-foreground/40" />}
                  </div>
                  <span className={cn("text-[10px] leading-tight", step.done ? "text-foreground font-medium" : "text-muted-foreground")}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeadTabKey)}>
            <TabsList className="bg-muted/50 flex-wrap h-auto">
              <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
              <TabsTrigger value="communications" className="text-xs">Communications ({lead.communications.length})</TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs">Tasks ({lead.tasks.length})</TabsTrigger>
              <TabsTrigger value="forms" className="text-xs">Forms & Consent</TabsTrigger>
              <TabsTrigger value="insurance" className="text-xs">Insurance / VOB</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs">Documents ({lead.documents.length})</TabsTrigger>
              <TabsTrigger value="automation" className="text-xs">Automation</TabsTrigger>
            </TabsList>

            {/* Timeline */}
            <TabsContent value="timeline" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm">
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
                          {new Date(event.timestamp).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          {event.user && <span> · {event.user}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Communications */}
            <TabsContent value="communications" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 shadow-sm">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
                  <h4 className="text-sm font-semibold">Communication log</h4>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={async () => { notifyCommunicationResult(await callParent({ leadId: lead.id, phone: lead.phone, email: lead.email, parentName: lead.parentName, childName: lead.childName, state: lead.state, insurance: lead.insurance })); }}><PhoneCall className="h-3 w-3" /> Call Parent</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={async () => { notifyCommunicationResult(await sendLeadSms({ leadId: lead.id, phone: lead.phone, email: lead.email, parentName: lead.parentName, childName: lead.childName, state: lead.state, insurance: lead.insurance })); }}><MessageSquare className="h-3 w-3" /> Send SMS</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={async () => { notifyCommunicationResult(await sendLeadEmail({ leadId: lead.id, phone: lead.phone, email: lead.email, parentName: lead.parentName, childName: lead.childName, state: lead.state, insurance: lead.insurance })); }}><Mail className="h-3 w-3" /> Send Email</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={async () => { notifyCommunicationResult(await sendMissingInfoReminder({ leadId: lead.id, phone: lead.phone, email: lead.email, parentName: lead.parentName, childName: lead.childName, state: lead.state, insurance: lead.insurance })); }}><AlertCircle className="h-3 w-3" /> Missing Info</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={async () => { notifyCommunicationResult(await sendVobUpdate({ leadId: lead.id, phone: lead.phone, email: lead.email, parentName: lead.parentName, childName: lead.childName, state: lead.state, insurance: lead.insurance })); }}><Shield className="h-3 w-3" /> VOB Update</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { const note = window.prompt("Add note:"); if (note) { updateLead(lead.id, { notes: (lead.notes ? lead.notes + "\n" : "") + note }); toast.success("Note added"); } }}><StickyNote className="h-3 w-3" /> Note</Button>
                  </div>
                </div>
                <div className="divide-y divide-border/40">
                  {lead.communications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No communication logged yet</p>
                  ) : lead.communications.slice().reverse().map((c) => (
                    <div key={c.id} className="px-5 py-3 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          c.type === "call" ? "bg-info/10 text-info" :
                          c.type === "sms" ? "bg-accent/10 text-accent" :
                          c.type === "email" ? "bg-primary/10 text-primary" :
                          "bg-muted text-muted-foreground",
                        )}>
                          {commIcon(c.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.type}</span>
                            {c.outcome && <StatusBadge status={c.outcome} variant={c.outcome === "Connected" ? "success" : c.outcome === "Wrong number" ? "destructive" : "warning"} />}
                            {c.direction && <span className="text-[10px] text-muted-foreground">{c.direction}</span>}
                            {c.durationSec !== undefined && <span className="text-[10px] text-muted-foreground">{Math.floor(c.durationSec / 60)}:{(c.durationSec % 60).toString().padStart(2, "0")}</span>}
                          </div>
                          {c.subject && <p className="text-sm font-medium text-foreground mb-0.5">{c.subject}</p>}
                          <p className="text-sm text-foreground/90">{c.preview}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {new Date(c.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                            {c.user && ` · ${c.user}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Tasks */}
            <TabsContent value="tasks" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 shadow-sm">
                <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Workflow tasks</h4>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Circle className="h-3 w-3" /> Add task</Button>
                </div>
                {lead.tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No tasks for this stage</p>
                ) : (
                  <div className="divide-y divide-border/40">
                    {lead.tasks.map((task) => (
                      <div
                        key={task.id}
                        data-deeplink-id={`task-${task.id}`}
                        onClick={() => updateLead(lead.id, { tasks: lead.tasks.map((t) => t.id === task.id ? { ...t, completed: !t.completed } : t) })}
                        className="px-5 py-3 flex items-start gap-3 hover:bg-muted/20 cursor-pointer"
                      >
                        {task.completed
                          ? <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                          : <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm", task.completed ? "text-muted-foreground line-through" : "text-foreground font-medium")}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                            {task.workflowStep && <span>Step: {task.workflowStep}</span>}
                            {task.owner && <span>Owner: {task.owner}</span>}
                            {task.dueDate && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                            {task.comments !== undefined && task.comments > 0 && <span>{task.comments} comments</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Forms & Consent */}
            <TabsContent value="forms" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold">Initial Intake Form</h4>
                    </div>
                    <StatusBadge status={lead.formStatus} variant={lead.formStatus === "Completed" ? "success" : lead.formStatus === "Not Sent" ? "muted" : "warning"} />
                  </div>
                  {lead.initialFormLink && (
                    <a href={lead.initialFormLink} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mb-3">
                      <ExternalLink className="h-3 w-3" /> View PandaDoc form
                    </a>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                    {(["Sent", "Viewed", "Completed"] as const).map((s) => {
                      const order = ["Not Sent", "Sent", "Viewed", "Completed"];
                      const reached = order.indexOf(lead.formStatus) >= order.indexOf(s);
                      return (
                        <div key={s} className={cn("flex items-center gap-1", reached ? "text-success" : "")}>
                          {reached ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                          {s}
                        </div>
                      );
                    })}
                  </div>
                  <Separator className="my-3" />
                  <Button size="sm" className="w-full gap-1.5" onClick={() => { updateLead(lead.id, { formStatus: "Sent", status: lead.status === "In Contact" || lead.status === "New Lead" ? "Sent Form" : lead.status, automationLog: [...lead.automationLog, "Intake form sent"] }); toast.success("Intake form sent"); }}><Send className="h-3 w-3" /> {lead.formStatus === "Not Sent" ? "Send Form" : "Resend Form"}</Button>
                </div>

                <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-accent" />
                      <h4 className="text-sm font-semibold">Consent Forms</h4>
                    </div>
                    <StatusBadge status={lead.consentStatus} variant={lead.consentStatus === "Completed" ? "success" : lead.consentStatus === "Not Sent" ? "muted" : "warning"} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">HIPAA, Treatment, Telehealth, and Financial Responsibility forms.</p>
                  <Separator className="my-3" />
                  <Button size="sm" className="w-full gap-1.5" onClick={() => { updateLead(lead.id, { consentStatus: "Sent", automationLog: [...lead.automationLog, "Consent forms sent"] }); toast.success("Consent forms sent"); }}><Send className="h-3 w-3" /> {lead.consentStatus === "Not Sent" ? "Send Consent Forms" : "Resend Consent"}</Button>
                </div>

                <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold">Form Review</h4>
                    </div>
                    <StatusBadge
                      status={lead.formReviewStatus}
                      variant={lead.formReviewStatus === "Complete" ? "success" : lead.formReviewStatus === "Missing Information" ? "destructive" : "muted"}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Once intake form is completed, the intake coordinator reviews it. Setting Form Review to <strong>Complete</strong> moves the lead to <strong>Sent to VOB</strong>. Setting to <strong>Missing Information</strong> creates a follow-up task.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Insurance / VOB */}
            <TabsContent value="insurance" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <BenefitsCheatSheetMatchPanel
                    insurance={lead.insurance || (lead as unknown as { primaryInsurance?: string }).primaryInsurance}
                    state={lead.state}
                  />
                </div>
                <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold">Insurance details</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    {[
                      ["Insurance", lead.insurance],
                      ["Type", lead.insuranceType],
                      ["Payor", lead.payor],
                      ["Coverage", lead.coverageType],
                      ["Payment Plan", lead.paymentPlanNeeded ? "Needed" : "Not required"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="text-foreground font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold">VOB</h4>
                    </div>
                    <StatusBadge
                      status={lead.vobStatus}
                      variant={lead.vobStatus === "Completed" || lead.vobStatus === "Approved" ? "success" : lead.vobStatus === "Issue" ? "destructive" : lead.vobStatus === "Not Started" ? "muted" : "warning"}
                    />
                  </div>
                  {lead.vobFile ? (
                    <div className="flex items-center justify-between bg-muted/40 rounded-lg p-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{lead.vobFile.name}</p>
                          <p className="text-[10px] text-muted-foreground">Uploaded {lead.vobFile.uploadedAt}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><ExternalLink className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-border rounded-lg p-4 text-center">
                      <Upload className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">No VOB file attached yet</p>
                    </div>
                  )}
                  <Separator className="my-3" />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs">Update VOB Status</Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => vobInputRef.current?.click()}
                    >
                      Upload VOB
                    </Button>
                    <input
                      ref={vobInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => handleVobUpload(e.target.files)}
                    />
                  </div>
                </div>

                {(lead.vobStatus === "Approved" || lead.vobStatus === "Payment Plan Required") && (
                  <div className="bg-success/5 border border-success/30 rounded-xl p-5 col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-success">Ready to move to Clients</p>
                        <p className="text-xs text-success/80 mt-0.5">VOB is {lead.vobStatus.toLowerCase()}. Convert this lead into an active client.</p>
                      </div>
                      <Button size="sm" className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground"><ArrowRight className="h-3.5 w-3.5" /> Move to Clients</Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm">
                {lead.documents.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    className="w-full border border-dashed border-border rounded-lg p-8 text-center hover:border-primary/40 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Drop files here or click to upload</p>
                  </button>
                ) : (
                  <div className="space-y-2">
                    {lead.documents.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-foreground font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.type}{doc.uploadedAt ? ` · uploaded ${doc.uploadedAt}` : ""}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm"><ExternalLink className="h-3.5 w-3.5" /></Button>
                      </div>
                    ))}
                  </div>
                )}
                <Separator className="my-3" />
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => docInputRef.current?.click()}
                  >
                    <Upload className="h-3 w-3" /> Upload document
                  </Button>
                  <span className="text-[10.5px] text-muted-foreground">Storage connection pending</span>
                </div>
                <input
                  ref={docInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleDocumentUpload(e.target.files)}
                />
              </div>
            </TabsContent>

            {/* Automation Log */}
            <TabsContent value="automation" className="mt-4">
              <div className="bg-card rounded-xl border border-border/60 p-5 space-y-3 shadow-sm">
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
          <div className="bg-card rounded-xl border border-border/60 p-4 shadow-sm">
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
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground truncate">{lead.email}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Copy className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border/60 p-4 shadow-sm">
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

          <div className="bg-card rounded-xl border border-border/60 p-4 shadow-sm">
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
                <span className="text-muted-foreground">Review</span>
                <StatusBadge status={lead.formReviewStatus} variant={lead.formReviewStatus === "Complete" ? "success" : lead.formReviewStatus === "Missing Information" ? "destructive" : "muted"} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">VOB</span>
                <StatusBadge status={lead.vobStatus} variant={lead.vobStatus === "Completed" || lead.vobStatus === "Approved" ? "success" : lead.vobStatus === "Issue" ? "destructive" : lead.vobStatus === "Not Started" ? "muted" : "warning"} />
              </div>
            </div>
          </div>

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
    </OSShell>
  );
}
