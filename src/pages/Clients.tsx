import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  FileCheck2,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  UserCheck,
  UserCog,
  Users,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/shared/PageShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClients } from "@/contexts/ClientsContext";
import {
  authVariant,
  Client,
  ClientStage,
  getClientAlert,
  qaVariant,
  staffingVariant,
  stageVariant,
} from "@/data/clients";
import { canonicalPipelineStage, getNextPipelineStage } from "@/data/pipeline";
import { cn } from "@/lib/utils";

const lifecycle = [
  "Lead",
  "Financial",
  "Client",
  "Auth",
  "Assessment",
  "QA",
  "Treatment Auth",
  "Staffing",
  "Scheduling",
  "Active",
  "Reauth",
] as const;

const tabItems = [
  "Overview",
  "Intake",
  "Financial",
  "Authorizations",
  "Assessment",
  "QA",
  "Staffing",
  "Scheduling",
  "Active Services",
  "Documents",
  "Tasks",
  "Communications",
  "Timeline",
];

type ClientTab = (typeof tabItems)[number];

type UnifiedEvent = {
  id: string;
  type: "system" | "auth" | "staffing" | "schedule" | "qa" | "note" | "stage" | "document" | "task" | "communication";
  title: string;
  detail?: string;
  timestamp: string;
  user?: string;
};

const stageToLifecycle = (stage: string) => {
  const canonical = canonicalPipelineStage(stage);
  if (["New Lead", "In Contact", "Sent Form", "Missing Information", "Form Received", "Sent to VOB"].includes(canonical)) return 0;
  if (["VOB Pending", "VOB Received", "Financial Review", "Payment Plan Required", "Payment Plan Received", "Approved for Services", "Not Qualified"].includes(canonical)) return 1;
  if (["Converted to Client", "BCBA Assignment"].includes(canonical)) return 2;
  if (["Pending Initial Authorization", "Initial Auth – Awaiting Submission", "Initial Auth – Submitted", "Initial Auth – Approved", "Waiting on Consent"].includes(canonical)) return 3;
  if (["Schedule Assessment", "Assessment Scheduled", "Assessment Completed", "Treatment Plan Pending"].includes(canonical)) return 4;
  if (["QA Review", "QA Issues / Fix Required", "QA Approved"].includes(canonical)) return 5;
  if (["Treatment Auth – Awaiting Submission", "Treatment Auth – Submitted", "Treatment Auth – Approved", "Treatment Auth – Denied"].includes(canonical)) return 6;
  if (["Staffing Needed", "Matching in Progress", "RBT Assigned", "Restaffing Needed"].includes(canonical)) return 7;
  if (["Pending Schedule", "Schedule Created", "Pending Start Date"].includes(canonical)) return 8;
  if (["Active", "Services on Pause", "Flaked", "Discharged"].includes(canonical)) return 9;
  if (["Reauth Triggered", "Progress Report Needed", "Progress Report Received", "Reauth Submitted", "Reauth Approved"].includes(canonical)) return 10;
  return 0;
};

const formatDate = (value?: string | null) => {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const exportCsv = (clients: Client[]) => {
  if (!clients.length) return;
  const rows = clients.map((client) => ({
    id: client.id,
    child: client.childName,
    parent: client.parentName,
    stage: canonicalPipelineStage(client.stage),
    owner: client.intakeOwner,
    bcba: client.bcba ?? "",
    rbt: client.rbt ?? "",
    payor: client.payor,
    auth: client.authStatus,
    staffing: client.staffingStatus,
    qa: client.qaStatus,
    nextAction: client.nextAction,
  }));
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => `"${String(row[header as keyof typeof row]).replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `clients-operating-system-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const buildAlerts = (client: Client) => {
  const alerts = new Set<string>();
  const alert = getClientAlert(client);
  if (alert) alerts.add(alert.message);
  client.blockers.forEach((blocker) => alerts.add(blocker));
  client.activeAlerts?.forEach((activeAlert) => alerts.add(activeAlert));
  if (client.paymentPlanRequired && !client.paymentPlanSigned) alerts.add("Payment plan not signed");
  if (client.authStatus === "Not Submitted" && stageToLifecycle(client.stage) >= 3) alerts.add("Authorization delay: auth has not been submitted");
  if (client.qaStatus === "In Review" && client.daysInStage > 3) alerts.add("QA delay: review aging over 3 days");
  if (client.staffingStatus === "Needed" || client.staffingStatus === "In Progress") alerts.add("Staffing gap: RBT coverage not finalized");
  if (!client.startDate && ["Pending Schedule", "Schedule Created", "Pending Start Date"].includes(canonicalPipelineStage(client.stage))) alerts.add("Scheduling delay: start date not confirmed");
  if (client.nextReauthDate) alerts.add(`Reauth risk window: ${formatDate(client.nextReauthDate)}`);
  if (!client.phone || !client.email) alerts.add("Missing intake contact information");
  return Array.from(alerts);
};

const buildTimeline = (client: Client): UnifiedEvent[] => [
  ...client.timeline.map((event) => ({ id: event.id, type: event.type, title: event.description, timestamp: event.timestamp, user: event.user })),
  ...client.authorizations.flatMap((auth, index) => [
    auth.submittedDate ? { id: `auth-submitted-${index}`, type: "auth" as const, title: `${auth.type} authorization submitted`, detail: auth.payor ?? client.payor, timestamp: new Date(auth.submittedDate).toISOString(), user: auth.assignedAuthCoordinator } : null,
    auth.approvedDate ? { id: `auth-approved-${index}`, type: "auth" as const, title: `${auth.type} authorization approved`, detail: auth.hours ?? auth.frequency ?? undefined, timestamp: new Date(auth.approvedDate).toISOString(), user: auth.assignedAuthCoordinator } : null,
  ].filter(Boolean) as UnifiedEvent[]),
  ...client.documents.map((document, index) => ({ id: `doc-${index}`, type: "document" as const, title: `Document on file: ${document.name}`, detail: document.type, timestamp: client.timeline[index]?.timestamp ?? new Date(Date.now() - index * 3_600_000).toISOString() })),
  ...client.tasks.map((task, index) => ({ id: `task-${task.id}`, type: "task" as const, title: task.completed ? `Task completed: ${task.title}` : `Task open: ${task.title}`, detail: task.dueDate ? `Due ${formatDate(task.dueDate)}` : undefined, timestamp: task.dueDate ? new Date(task.dueDate).toISOString() : new Date(Date.now() - index * 7_200_000).toISOString() })),
  ...client.staffingHistory.map((item, index) => ({ id: `staffing-${index}`, type: "staffing" as const, title: item.event, timestamp: new Date(item.date).toISOString(), user: client.rbt ?? undefined })),
].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

const MetricCard = ({ title, value, detail, icon: Icon, tone = "default" }: { title: string; value: string; detail: string; icon: LucideIcon; tone?: "default" | "warning" | "destructive" | "success" }) => (
  <div className={cn("rounded-lg border bg-card p-4 shadow-sm", tone === "destructive" ? "border-destructive/30" : tone === "warning" ? "border-warning/30" : tone === "success" ? "border-success/30" : "border-border/60")}>
    <div className="mb-3 flex items-center justify-between gap-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-md", tone === "destructive" ? "bg-destructive/10 text-destructive" : tone === "warning" ? "bg-warning/10 text-warning" : tone === "success" ? "bg-success/10 text-success" : "bg-primary/10 text-primary")}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <p className="truncate text-lg font-semibold text-foreground">{value}</p>
    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{detail}</p>
  </div>
);

const RecordSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-lg border border-border/60 bg-card p-4 shadow-sm">
    <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
    {children}
  </section>
);

export default function Clients() {
  const { clients, moveStage } = useClients();
  const [localClients, setLocalClients] = useState<Client[]>(clients);
  const [selectedId, setSelectedId] = useState(clients[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ClientTab>("Overview");

  useEffect(() => {
    setLocalClients(clients);
    setSelectedId((current) => clients.some((client) => client.id === current) ? current : clients[0]?.id ?? "");
  }, [clients]);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return localClients;
    return localClients.filter((client) => [client.childName, client.parentName, client.id, client.stage, client.clinic, client.payor].some((value) => value?.toLowerCase().includes(q)));
  }, [localClients, query]);

  const selectedClient = localClients.find((client) => client.id === selectedId) ?? filteredClients[0] ?? localClients[0];
  const alerts = selectedClient ? buildAlerts(selectedClient) : [];
  const timeline = selectedClient ? buildTimeline(selectedClient) : [];
  const lifecycleIndex = selectedClient ? stageToLifecycle(selectedClient.stage) : 0;
  const lifecycleProgress = Math.round(((lifecycleIndex + 1) / lifecycle.length) * 100);
  const nextStage = selectedClient ? getNextPipelineStage(selectedClient.stage) as ClientStage | null : null;

  const updateClient = (patch: Partial<Client>, timelineTitle?: string, type: UnifiedEvent["type"] = "note") => {
    if (!selectedClient) return;
    const event = timelineTitle ? {
      id: `local-${Date.now()}`,
      type: type === "communication" || type === "document" || type === "task" ? "note" as const : type,
      description: timelineTitle,
      timestamp: new Date().toISOString(),
      user: "You",
    } : null;
    setLocalClients((current) => current.map((client) => client.id === selectedClient.id ? {
      ...client,
      ...patch,
      lastActivity: timelineTitle ?? client.lastActivity,
      timeline: event ? [event, ...client.timeline] : client.timeline,
    } : client));
  };

  const runQuickAction = (label: string, type: UnifiedEvent["type"] = "communication") => {
    updateClient({}, `${label} logged with ${selectedClient?.parentName}`, type);
    toast.success(`${label} logged`);
  };

  const advanceStage = () => {
    if (!selectedClient || !nextStage) return;
    updateClient({ stage: nextStage, automationLog: [...selectedClient.automationLog, `Stage advanced to ${nextStage}`] }, `Moved to ${nextStage}`, "stage");
    void moveStage([selectedClient.id], nextStage).catch(() => undefined);
    toast.success(`Advanced to ${nextStage}`);
  };

  const createTask = () => {
    const title = window.prompt("Task name");
    if (!title || !selectedClient) return;
    updateClient({ tasks: [{ id: `task-${Date.now()}`, title, completed: false, dueDate: new Date().toISOString().slice(0, 10) }, ...selectedClient.tasks] }, `Task created: ${title}`, "task");
    toast.success("Task created");
  };

  const uploadDocument = () => {
    const name = window.prompt("Document name", "Uploaded document");
    if (!name || !selectedClient) return;
    updateClient({ documents: [{ name, type: "PDF" }, ...selectedClient.documents] }, `Document uploaded: ${name}`, "document");
    toast.success("Document uploaded");
  };

  const assignOwner = () => {
    const owner = window.prompt("Owner name", selectedClient?.intakeOwner ?? "");
    if (!owner) return;
    updateClient({ intakeOwner: owner }, `Owner assigned: ${owner}`, "note");
    toast.success("Owner updated");
  };

  if (!selectedClient) {
    return <PageShell title="Clients" description="Unified client operating system" icon={UserCheck}><p className="text-sm text-muted-foreground">No clients found.</p></PageShell>;
  }

  const snapshotCards = [
    { title: "Pipeline Status", value: canonicalPipelineStage(selectedClient.stage), detail: `${selectedClient.daysInStage} days in stage · next ${nextStage ?? "complete"}`, icon: Sparkles, tone: alerts.length ? "warning" as const : "default" as const },
    { title: "Financial", value: selectedClient.paymentPlanRequired ? selectedClient.paymentPlanSigned ? "Plan signed" : "Plan pending" : "Cleared", detail: `${selectedClient.payor} · ${selectedClient.insurance ?? "benefits verified"}`, icon: WalletCards, tone: selectedClient.paymentPlanRequired && !selectedClient.paymentPlanSigned ? "destructive" as const : "success" as const },
    { title: "Authorization", value: selectedClient.authStatus, detail: `${selectedClient.authorizations.length} records · ${selectedClient.authorizations.at(-1)?.hours ?? "hours pending"}`, icon: ShieldCheck, tone: selectedClient.authStatus === "Approved" ? "success" as const : selectedClient.authStatus === "Denied" || selectedClient.authStatus === "Expired" ? "destructive" as const : "warning" as const },
    { title: "Staffing", value: selectedClient.staffingStatus, detail: selectedClient.rbt ? `${selectedClient.rbt} assigned` : "RBT not assigned", icon: Users, tone: selectedClient.staffingStatus === "Assigned" ? "success" as const : selectedClient.staffingStatus === "Needed" ? "destructive" as const : "warning" as const },
    { title: "Scheduling", value: selectedClient.schedulingStatus ?? "Pending Schedule", detail: `${selectedClient.schedule.length} schedule blocks · start ${formatDate(selectedClient.startDate)}`, icon: CalendarDays, tone: selectedClient.startDate ? "success" as const : "warning" as const },
    { title: "QA / Compliance", value: selectedClient.qaStatus, detail: `${selectedClient.documents.length} docs · ${selectedClient.noteguardFlags ?? 0} note flags`, icon: ClipboardCheck, tone: selectedClient.qaStatus === "Complete" ? "success" as const : selectedClient.qaStatus === "In Review" ? "warning" as const : "default" as const },
  ];

  return (
    <PageShell
      title="Clients"
      description="Single source of truth for intake, finance, auth, staffing, scheduling, services, and lifecycle history"
      icon={UserCheck}
      actions={<Button variant="outline" size="sm" onClick={() => { exportCsv(localClients); toast.success("Client export prepared"); }}><Download className="h-4 w-4" /> Export</Button>}
      className="space-y-5"
    >
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/60 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search clients, parents, stages..." className="pl-9" />
            </div>
          </div>
          <div className="max-h-[calc(100vh-260px)] overflow-y-auto p-2">
            {filteredClients.map((client) => {
              const clientAlerts = buildAlerts(client);
              return (
                <button
                  key={client.id}
                  onClick={() => { setSelectedId(client.id); setActiveTab("Overview"); }}
                  className={cn("mb-2 w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent", client.id === selectedClient.id ? "border-primary/40 bg-primary/5" : "border-border/50 bg-background")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{client.childName}</p>
                      <p className="truncate text-xs text-muted-foreground">{client.parentName} · {client.state}</p>
                    </div>
                    {clientAlerts.length > 0 && <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <StatusBadge status={canonicalPipelineStage(client.stage)} variant={stageVariant(client.stage)} />
                    <span className="text-xs text-muted-foreground">{client.daysInStage}d</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0 space-y-5">
          <section className="rounded-lg border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold text-foreground">{selectedClient.childName} + {selectedClient.parentName}</h1>
                  <StatusBadge status={canonicalPipelineStage(selectedClient.stage)} variant={stageVariant(selectedClient.stage)} />
                </div>
                <p className="text-sm text-muted-foreground">{selectedClient.id} · {selectedClient.childAge} · {selectedClient.clinic} · {selectedClient.payor}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => runQuickAction("Call", "communication")}><Phone className="h-4 w-4" /> Call</Button>
                <Button variant="outline" size="sm" onClick={() => runQuickAction("Text", "communication")}><MessageSquare className="h-4 w-4" /> Text</Button>
                <Button variant="outline" size="sm" onClick={() => runQuickAction("Email", "communication")}><Mail className="h-4 w-4" /> Email</Button>
                <Button variant="outline" size="sm" onClick={() => runQuickAction("Note", "note")}><FileText className="h-4 w-4" /> Add Note</Button>
                <Button variant="outline" size="sm" onClick={uploadDocument}><Upload className="h-4 w-4" /> Upload Document</Button>
                <Button variant="outline" size="sm" onClick={createTask}><Plus className="h-4 w-4" /> Create Task</Button>
                <Button variant="outline" size="sm" onClick={assignOwner}><UserCog className="h-4 w-4" /> Assign Owner</Button>
              </div>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-6">
            {snapshotCards.map((card) => <MetricCard key={card.title} {...card} />)}
          </section>

          <section className="rounded-lg border border-border/60 bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Lifecycle tracker</h2>
                <p className="text-xs text-muted-foreground">Progression is ordered; stage skipping is blocked by automation.</p>
              </div>
              <Button size="sm" disabled={!nextStage} onClick={advanceStage}><ArrowRight className="h-4 w-4" /> {nextStage ? `Advance to ${nextStage}` : "Complete"}</Button>
            </div>
            <Progress value={lifecycleProgress} className="mb-4 h-2" />
            <div className="grid grid-cols-11 gap-2">
              {lifecycle.map((step, index) => (
                <div key={step} className="min-w-0">
                  <div className={cn("mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold", index < lifecycleIndex ? "border-success/30 bg-success/10 text-success" : index === lifecycleIndex ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground")}>
                    {index < lifecycleIndex ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </div>
                  <p className="truncate text-center text-[11px] font-medium text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="min-w-0 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ClientTab)}>
                <div className="overflow-x-auto pb-2">
                  <TabsList className="h-auto justify-start gap-1 bg-muted/70 p-1">
                    {tabItems.map((tab) => <TabsTrigger key={tab} value={tab} className="text-xs">{tab}</TabsTrigger>)}
                  </TabsList>
                </div>

                <TabsContent value="Overview" className="mt-4 grid gap-4 lg:grid-cols-2">
                  <RecordSection title="Client summary">
                    <div className="grid gap-3 text-sm">
                      <div className="flex justify-between gap-4"><span className="text-muted-foreground">Owner</span><span className="font-medium text-foreground">{selectedClient.intakeOwner}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-muted-foreground">BCBA</span><span className="font-medium text-foreground">{selectedClient.bcba ?? "Unassigned"}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-muted-foreground">RBT</span><span className="font-medium text-foreground">{selectedClient.rbt ?? "Unassigned"}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-muted-foreground">Last activity</span><span className="text-right font-medium text-foreground">{selectedClient.lastActivity}</span></div>
                    </div>
                  </RecordSection>
                  <RecordSection title="Open alerts">
                    <div className="space-y-2">
                      {alerts.length ? alerts.map((alert) => <div key={alert} className="rounded-md border border-warning/30 bg-warning/10 p-2 text-sm text-foreground"><AlertTriangle className="mr-2 inline h-4 w-4 text-warning" />{alert}</div>) : <p className="text-sm text-muted-foreground">No active alerts.</p>}
                    </div>
                  </RecordSection>
                </TabsContent>

                <TabsContent value="Intake" className="mt-4"><RecordSection title="Intake record"><InfoGrid rows={[ ["Parent", selectedClient.parentName], ["Phone", selectedClient.phone ?? "Missing"], ["Email", selectedClient.email ?? "Missing"], ["State", selectedClient.state], ["Clinic", selectedClient.clinic], ["Consent", selectedClient.consentComplete ? "Complete" : "Pending"] ]} /></RecordSection></TabsContent>
                <TabsContent value="Financial" className="mt-4"><RecordSection title="Financial record"><InfoGrid rows={[ ["Payor", selectedClient.payor], ["Insurance", selectedClient.insurance ?? "Verified"], ["Payment plan", selectedClient.paymentPlanRequired ? selectedClient.paymentPlanSigned ? "Signed" : "Required / unsigned" : "Not required"], ["Billing status", selectedClient.billingStatus ?? "Current"], ["Claims issues", String(selectedClient.claimsIssues ?? 0)] ]} /></RecordSection></TabsContent>
                <TabsContent value="Authorizations" className="mt-4"><RecordSection title="Authorization records"><div className="space-y-3">{selectedClient.authorizations.map((auth, index) => <div key={`${auth.type}-${index}`} className="rounded-md border border-border/60 p-3"><div className="flex items-center justify-between"><p className="font-medium text-foreground">{auth.type}</p><StatusBadge status={auth.status} variant={authVariant(auth.status)} /></div><p className="mt-2 text-sm text-muted-foreground">Submitted {formatDate(auth.submittedDate)} · Approved {formatDate(auth.approvedDate)} · Expires {formatDate(auth.expirationDate)}</p></div>)}</div></RecordSection></TabsContent>
                <TabsContent value="Assessment" className="mt-4"><RecordSection title="Assessment"><InfoGrid rows={[ ["Assessment date", formatDate(selectedClient.assessmentDate)], ["Days since assessment", selectedClient.daysSinceAssessment?.toString() ?? "Not assessed"], ["Treatment plan", selectedClient.documents.some((doc) => doc.name.toLowerCase().includes("treatment")) ? "On file" : "Pending"], ["Assigned BCBA", selectedClient.bcba ?? "Unassigned"] ]} /></RecordSection></TabsContent>
                <TabsContent value="QA" className="mt-4"><RecordSection title="QA and compliance"><InfoGrid rows={[ ["QA status", selectedClient.qaStatus], ["Notes compliance", selectedClient.notesComplianceStatus ?? "Compliant"], ["Noteguard flags", String(selectedClient.noteguardFlags ?? 0)], ["Documents", `${selectedClient.documents.length} on file`] ]} /></RecordSection></TabsContent>
                <TabsContent value="Staffing" className="mt-4"><RecordSection title="Staffing"><InfoGrid rows={[ ["Staffing status", selectedClient.staffingStatus], ["RBT", selectedClient.rbt ?? "Unassigned"], ["Active staffing", selectedClient.activeStaffingStatus ?? "Needs review"], ["History", `${selectedClient.staffingHistory.length} events`] ]} /><div className="mt-4 space-y-2">{selectedClient.staffingHistory.map((item) => <p key={`${item.date}-${item.event}`} className="rounded-md bg-muted p-2 text-sm text-muted-foreground">{formatDate(item.date)} · {item.event}</p>)}</div></RecordSection></TabsContent>
                <TabsContent value="Scheduling" className="mt-4"><RecordSection title="Scheduling"><div className="grid gap-3 md:grid-cols-2">{selectedClient.schedule.length ? selectedClient.schedule.map((slot) => <div key={`${slot.day}-${slot.start}`} className="rounded-md border border-border/60 p-3"><p className="font-medium text-foreground">{slot.day} · {slot.start}–{slot.end}</p><p className="text-sm text-muted-foreground">{slot.rbt ?? selectedClient.rbt ?? "RBT pending"} · {slot.location ?? "Clinic"}</p></div>) : <p className="text-sm text-muted-foreground">No schedule blocks created.</p>}</div></RecordSection></TabsContent>
                <TabsContent value="Active Services" className="mt-4"><RecordSection title="Active services"><InfoGrid rows={[ ["Service status", selectedClient.activeServiceStatus ?? "Not active"], ["Approved hours", `${selectedClient.approvedWeeklyHours ?? 0}/wk`], ["Scheduled hours", `${selectedClient.scheduledWeeklyHours ?? 0}/wk`], ["Delivered hours", `${selectedClient.deliveredWeeklyHours ?? 0}/wk`], ["Location", selectedClient.serviceLocation ?? "Not set"] ]} /></RecordSection></TabsContent>
                <TabsContent value="Documents" className="mt-4"><RecordSection title="Documents"><div className="grid gap-2 md:grid-cols-2">{selectedClient.documents.map((doc) => <div key={`${doc.name}-${doc.type}`} className="flex items-center gap-3 rounded-md border border-border/60 p-3"><FileCheck2 className="h-4 w-4 text-primary" /><div><p className="text-sm font-medium text-foreground">{doc.name}</p><p className="text-xs text-muted-foreground">{doc.type}</p></div></div>)}</div></RecordSection></TabsContent>
                <TabsContent value="Tasks" className="mt-4"><RecordSection title="Tasks"><div className="space-y-2">{selectedClient.tasks.map((task) => <button key={task.id} onClick={() => updateClient({ tasks: selectedClient.tasks.map((item) => item.id === task.id ? { ...item, completed: !item.completed } : item) }, `${task.completed ? "Reopened" : "Completed"} task: ${task.title}`, "task")} className="flex w-full items-center justify-between gap-3 rounded-md border border-border/60 p-3 text-left hover:bg-accent"><span className={cn("text-sm", task.completed ? "text-muted-foreground line-through" : "text-foreground")}>{task.title}</span><span className="text-xs text-muted-foreground">{task.dueDate ? formatDate(task.dueDate) : "No due date"}</span></button>)}</div></RecordSection></TabsContent>
                <TabsContent value="Communications" className="mt-4"><RecordSection title="Communications"><div className="grid gap-3 md:grid-cols-3"><Button variant="outline" onClick={() => runQuickAction("Call", "communication")}><Phone className="h-4 w-4" /> Log call</Button><Button variant="outline" onClick={() => runQuickAction("Text", "communication")}><MessageSquare className="h-4 w-4" /> Log text</Button><Button variant="outline" onClick={() => runQuickAction("Email", "communication")}><Mail className="h-4 w-4" /> Log email</Button></div><div className="mt-4 space-y-2">{timeline.filter((event) => ["note", "communication"].includes(event.type)).slice(0, 8).map((event) => <TimelineRow key={event.id} event={event} />)}</div></RecordSection></TabsContent>
                <TabsContent value="Timeline" className="mt-4"><RecordSection title="Full lifecycle timeline"><div className="space-y-2">{timeline.map((event) => <TimelineRow key={event.id} event={event} />)}</div></RecordSection></TabsContent>
              </Tabs>
            </section>

            <aside className="space-y-4">
              <RecordSection title="Next action">
                <p className="text-base font-semibold text-foreground">{selectedClient.nextAction}</p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4"><span className="text-muted-foreground">Owner</span><span className="font-medium text-foreground">{selectedClient.intakeOwner}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-muted-foreground">Due date</span><span className="font-medium text-foreground">{formatDate(selectedClient.nextTaskDue)}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-muted-foreground">Open tasks</span><span className="font-medium text-foreground">{selectedClient.tasks.filter((task) => !task.completed).length}</span></div>
                </div>
              </RecordSection>
              <RecordSection title="Alerts">
                <div className="space-y-2">{alerts.length ? alerts.map((alert) => <div key={alert} className="rounded-md border border-warning/30 bg-warning/10 p-2 text-xs text-foreground">{alert}</div>) : <p className="text-sm text-muted-foreground">No active alerts.</p>}</div>
              </RecordSection>
              <RecordSection title="Quick actions">
                <div className="grid gap-2">
                  <Button variant="outline" size="sm" onClick={advanceStage} disabled={!nextStage}><ArrowRight className="h-4 w-4" /> Move next stage</Button>
                  <Button variant="outline" size="sm" onClick={createTask}><Plus className="h-4 w-4" /> Create task</Button>
                  <Button variant="outline" size="sm" onClick={uploadDocument}><Upload className="h-4 w-4" /> Upload document</Button>
                  <Button variant="outline" size="sm" onClick={assignOwner}><UserCog className="h-4 w-4" /> Assign owner</Button>
                </div>
              </RecordSection>
            </aside>
          </div>
        </main>
      </div>
    </PageShell>
  );
}

function InfoGrid({ rows }: { rows: [string, string][] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-md bg-muted p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
}

function TimelineRow({ event }: { event: UnifiedEvent }) {
  return (
    <div className="flex gap-3 rounded-md border border-border/60 p-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {event.type === "auth" ? <ShieldCheck className="h-3.5 w-3.5" /> : event.type === "staffing" ? <Users className="h-3.5 w-3.5" /> : event.type === "schedule" ? <CalendarDays className="h-3.5 w-3.5" /> : event.type === "qa" ? <ClipboardCheck className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{event.title}</p>
          <span className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</span>
        </div>
        {(event.detail || event.user) && <p className="mt-1 text-xs text-muted-foreground">{event.detail}{event.detail && event.user ? " · " : ""}{event.user}</p>}
      </div>
    </div>
  );
}
