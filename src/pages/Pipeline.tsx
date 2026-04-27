import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Search, Workflow, ExternalLink, Clock, AlertCircle, UserCheck, ShieldCheck, Calendar, Users } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useClients } from "@/contexts/ClientsContext";
import { Client, getClientAlert, stageVariant } from "@/data/clients";
import { canonicalPipelineStage, masterPipelineSections } from "@/data/pipeline";
import { cn } from "@/lib/utils";

const ALL = "all";
type Drilldown = { client: Client; stage: string };

const lifecycleLabels: Record<string, string> = {
  financial: "Financial",
  clientSetup: "Client Setup",
  initialAuth: "Initial Auth",
  treatmentAuth: "Treatment Auth",
  activeServices: "Active",
  reauth: "Reauth",
};

const stageToSection = new Map(
  masterPipelineSections.flatMap((section) =>
    section.stages.map((stage) => [stage.name, section.key] as const),
  ),
);

export default function Pipeline() {
  const navigate = useNavigate();
  const { clients } = useClients();
  const [query, setQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState(ALL);
  const [clinicFilter, setClinicFilter] = useState(ALL);
  const [drilldown, setDrilldown] = useState<Drilldown | null>(null);

  const clinics = useMemo(() => Array.from(new Set(clients.map((client) => client.clinic))).sort(), [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const stage = canonicalPipelineStage(client.stage);
      const section = stageToSection.get(stage);
      const matchesQuery = !query || [client.childName, client.parentName, client.id, client.bcba ?? "", client.rbt ?? ""].some((value) => value.toLowerCase().includes(query.toLowerCase()));
      const matchesSection = sectionFilter === ALL || section === sectionFilter;
      const matchesClinic = clinicFilter === ALL || client.clinic === clinicFilter;
      return matchesQuery && matchesSection && matchesClinic;
    });
  }, [clients, query, sectionFilter, clinicFilter]);

  const urgentCount = filteredClients.filter((client) => client.daysInStage >= 7 || getClientAlert(client)).length;
  const activeCount = filteredClients.filter((client) => canonicalPipelineStage(client.stage) === "Active").length;

  return (
    <PageShell title="Pipeline" description="Read-only lifecycle tracker for every client from intake through reauth" icon={Workflow}>
      <section className="grid gap-3 md:grid-cols-3">
        <Metric label="Clients in lifecycle" value={filteredClients.length} icon={Users} />
        <Metric label="Needs attention" value={urgentCount} icon={AlertCircle} />
        <Metric label="Active clients" value={activeCount} icon={UserCheck} />
      </section>

      <div className="sticky top-0 z-30 -mx-1 flex flex-wrap items-center gap-2 border-b border-border/40 bg-background/85 px-1 py-3 backdrop-blur-xl">
        <div className="relative min-w-[260px] flex-1 max-w-lg">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search client, parent, ID, BCBA, RBT…" className="pl-8" />
        </div>
        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="w-[190px]"><SelectValue placeholder="Lifecycle stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All lifecycle</SelectItem>
            {masterPipelineSections.map((section) => <SelectItem key={section.key} value={section.key}>{lifecycleLabels[section.key] ?? section.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={clinicFilter} onValueChange={setClinicFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Clinic" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All clinics</SelectItem>
            {clinics.map((clinic) => <SelectItem key={clinic} value={clinic}>{clinic}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => { setQuery(""); setSectionFilter(ALL); setClinicFilter(ALL); }}>
          <Filter className="mr-2 h-4 w-4" /> Reset
        </Button>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-3">
          {masterPipelineSections.map((section) => {
            const sectionClients = filteredClients.filter((client) => stageToSection.get(canonicalPipelineStage(client.stage)) === section.key);
            return (
              <section key={section.key} className="w-[260px] shrink-0 rounded-lg border border-border/60 bg-card">
                <div className="border-b border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-foreground">{lifecycleLabels[section.key] ?? section.title}</h2>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{sectionClients.length}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{section.summary}</p>
                </div>
                <div className="space-y-2 p-2">
                  {sectionClients.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">No clients</p>}
                  {sectionClients.map((client) => {
                    const alert = getClientAlert(client);
                    return (
                      <button key={client.id} onClick={() => setDrilldown({ client, stage: canonicalPipelineStage(client.stage) })} className="w-full rounded-md border border-border/60 bg-background p-3 text-left transition-colors hover:bg-muted/40">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{client.childName}</p>
                            <p className="truncate text-xs text-muted-foreground">{client.clinic} · {client.bcba || "No BCBA"}</p>
                          </div>
                          <span className={cn("text-xs font-medium", client.daysInStage >= 7 ? "text-destructive" : "text-muted-foreground")}>{client.daysInStage}d</span>
                        </div>
                        <div className="mt-2"><StatusBadge status={canonicalPipelineStage(client.stage)} variant={stageVariant(client.stage)} /></div>
                        {alert && <p className="mt-2 flex items-center gap-1 text-xs font-medium text-destructive"><AlertCircle className="h-3 w-3" />{alert.message}</p>}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <Sheet open={Boolean(drilldown)} onOpenChange={(open) => !open && setDrilldown(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {drilldown && (
            <>
              <SheetHeader>
                <SheetTitle>{drilldown.client.childName}</SheetTitle>
                <SheetDescription>{drilldown.client.parentName} · {drilldown.client.id}</SheetDescription>
              </SheetHeader>
              <PipelineDrilldown drilldown={drilldown} onOpenClient={() => navigate(`/clients/${drilldown.client.id}`)} onOpenWorkspace={(path) => navigate(path)} />
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Workflow }) {
  return <div className="rounded-lg border border-border/60 bg-card p-4"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div><p className="text-2xl font-semibold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>;
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Workflow }) {
  return <div className="rounded-lg border border-border/60 bg-card p-3"><Icon className="mb-2 h-4 w-4 text-primary" /><p className="text-lg font-semibold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-foreground">{value}</p></div>;
}

function PipelineDrilldown({ drilldown, onOpenClient, onOpenWorkspace }: { drilldown: Drilldown; onOpenClient: () => void; onOpenWorkspace: (path: string) => void }) {
  const { client, stage } = drilldown;
  const sectionKey = stageToSection.get(stage) ?? "clientSetup";
  const openTasks = client.tasks.filter((task) => !task.completed);
  const alert = getClientAlert(client);
  const context = getStageContext(client, sectionKey);

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-lg border border-border/60 bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Focused stage</p>
            <StatusBadge status={stage} variant={stageVariant(client.stage)} />
          </div>
          <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", client.daysInStage >= 7 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>{client.daysInStage} days</span>
        </div>
        {alert && <p className="mt-3 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-2 text-xs font-medium text-destructive"><AlertCircle className="h-3.5 w-3.5" />{alert.message}</p>}
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">Read-only stage context</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {context.map((item) => <Info key={item.label} label={item.label} value={item.value} />)}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Open tasks" value={openTasks.length} icon={Clock} />
        <MiniStat label="Documents" value={client.documents.length} icon={ExternalLink} />
        <MiniStat label="Timeline" value={client.timeline.length} icon={Workflow} />
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">Relevant actions</h3>
        <div className="mt-3 grid gap-2">
          <Button variant="outline" className="justify-start" onClick={() => onOpenWorkspace(getWorkspacePath(sectionKey))}>
            <ExternalLink className="mr-2 h-4 w-4" /> Open {lifecycleLabels[sectionKey] ?? "workspace"} workspace
          </Button>
          <Button className="justify-start" onClick={onOpenClient}>
            <ExternalLink className="mr-2 h-4 w-4" /> Open full client record
          </Button>
        </div>
      </div>
    </div>
  );
}

function getStageContext(client: Client, sectionKey: string) {
  const auth = client.authorizations[0];
  const base = [
    { label: "Clinic", value: client.clinic },
    { label: "Next action", value: client.nextAction || "—" },
  ];
  if (["intake", "financial", "clientSetup"].includes(sectionKey)) return [...base, { label: "Parent", value: client.parentName }, { label: "Payor", value: client.payor }, { label: "Intake owner", value: client.intakeOwner }, { label: "Blockers", value: client.blockers.length ? client.blockers.join(", ") : "None" }];
  if (["initialAuth", "treatmentAuth", "reauth"].includes(sectionKey)) return [...base, { label: "Auth status", value: auth?.status ?? client.authStatus }, { label: "Payor", value: auth?.payor ?? client.payor }, { label: "Approved hours", value: String(auth?.approvedHours ?? client.approvedWeeklyHours ?? "—") }, { label: "Expiration", value: auth?.expirationDate ?? client.nextReauthDate ?? "—" }];
  if (sectionKey === "qa") return [...base, { label: "QA status", value: client.qaStatus }, { label: "BCBA", value: client.bcba || "Unassigned" }, { label: "Documents", value: String(client.documents.length) }, { label: "Blockers", value: client.blockers.length ? client.blockers.join(", ") : "None" }];
  if (sectionKey === "staffing") return [...base, { label: "Staffing status", value: client.staffingStatus }, { label: "BCBA", value: client.bcba || "Unassigned" }, { label: "RBT", value: client.rbt || "Unassigned" }, { label: "Approved hours", value: String(client.approvedWeeklyHours ?? "—") }];
  if (sectionKey === "scheduling") return [...base, { label: "Scheduling status", value: client.schedulingStatus ?? "—" }, { label: "Schedule blocks", value: String(client.schedule.length) }, { label: "Start date", value: client.startDate ?? "Not set" }, { label: "CR sync", value: client.centralReachSyncStatus ?? "—" }];
  return [...base, { label: "Service status", value: client.activeServiceStatus ?? "Active" }, { label: "Delivered hours", value: String(client.deliveredWeeklyHours ?? 0) }, { label: "Billing", value: client.billingStatus ?? "—" }, { label: "Next reauth", value: client.nextReauthDate ?? "—" }];
}

function getWorkspacePath(sectionKey: string) {
  if (sectionKey === "intake") return "/leads?view=queue";
  if (["initialAuth", "treatmentAuth", "reauth"].includes(sectionKey)) return "/authorizations";
  if (sectionKey === "qa") return "/qa";
  if (sectionKey === "staffing") return "/staffing";
  if (sectionKey === "scheduling") return "/scheduling";
  if (sectionKey === "activeServices") return "/clinics";
  return "/clients";
}
