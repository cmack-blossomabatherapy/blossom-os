import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ClipboardList, ShieldCheck, UserCheck, UsersRound } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useClients } from "@/contexts/ClientsContext";
import { Client, ClientStage, getClientAlert, stageVariant } from "@/data/clients";
import { canonicalPipelineStage } from "@/data/pipeline";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const BCBAS = ["Dr. Kim", "Dr. Lee", "Dr. Patel", "Dr. Rivera"];

const authOwner = (client: Client) => {
  if (["GA", "Georgia"].includes(client.state)) return "GA Auth Team";
  if (["FL", "Florida"].includes(client.state)) return "FL Auth Team";
  return `${client.payor || "Payor"} Auth Team`;
};

const isOnboarding = (client: Client) => [
  "Converted to Client",
  "BCBA Assignment",
  "Pending Initial Authorization",
  "Waiting on Consent Forms",
  "Waiting on Consent",
  "Schedule Assessment",
].includes(canonicalPipelineStage(client.stage));

export default function ClientOnboarding() {
  const navigate = useNavigate();
  const { clients, assignBcba, updateClient } = useClients();

  const onboardingClients = useMemo(() => clients.filter(isOnboarding), [clients]);
  const needsBcba = onboardingClients.filter((client) => !client.bcba);
  const pendingAuth = onboardingClients.filter((client) => canonicalPipelineStage(client.stage) === "Pending Initial Authorization");
  const blocked = onboardingClients.filter((client) => getClientAlert(client)?.type === "red");

  const assign = async (client: Client, bcba: string) => {
    await assignBcba([client.id], bcba);
    toast.success(client.paymentPlanRequired && !client.paymentPlanSigned ? "BCBA assigned — payment plan still blocks auth" : "BCBA assigned — auth tasks created");
  };

  const markPaymentSigned = async (client: Client) => {
    await updateClient(client.id, {
      paymentPlanSigned: true,
      paymentPlanStatus: "Signed",
      blockers: client.blockers.filter((blocker) => blocker !== "Payment plan not signed"),
      readyForAuth: Boolean(client.bcba),
      ...(client.bcba ? { stage: "Pending Initial Authorization" as ClientStage, nextAction: "Submit Initial Auth" } : {}),
    });
    toast.success("Payment plan signed");
  };

  const progressAuth = async (client: Client, action: "submitted" | "approved" | "consent") => {
    if (action === "submitted") await updateClient(client.id, { authStatus: "Submitted", nextAction: "Follow up with payor" });
    if (action === "approved") await updateClient(client.id, { authStatus: "Approved", stage: client.consentComplete ? "Schedule Assessment" : "Waiting on Consent Forms", nextAction: client.consentComplete ? "Schedule assessment" : "Collect consent forms" });
    if (action === "consent") await updateClient(client.id, { consentComplete: true, blockers: client.blockers.filter((blocker) => blocker !== "Missing consent forms"), stage: client.authStatus === "Approved" ? "Schedule Assessment" : client.stage, nextAction: client.authStatus === "Approved" ? "Schedule assessment" : client.nextAction });
    toast.success("Client onboarding updated");
  };

  return (
    <PageShell title="Onboarding to Client" description="New Clients dashboard for BCBA assignment, initial auth setup, consent, and blocked handoffs" icon={UserCheck}>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="New Clients" value={onboardingClients.length} icon={UsersRound} />
        <Metric label="Needs BCBA" value={needsBcba.length} icon={UserCheck} />
        <Metric label="Pending Auth" value={pendingAuth.length} icon={ShieldCheck} />
        <Metric label="Blocked" value={blocked.length} icon={AlertTriangle} />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <OnboardingLane title="Needs BCBA" clients={needsBcba} onSelect={(client) => navigate(`/clients/${client.id}`)} onAssign={assign} />
        <OnboardingLane title="Pending Auth" clients={pendingAuth} onSelect={(client) => navigate(`/clients/${client.id}`)} onAssign={assign} onAuth={progressAuth} />
        <OnboardingLane title="Blocked" clients={blocked} onSelect={(client) => navigate(`/clients/${client.id}`)} onAssign={assign} onPaymentSigned={markPaymentSigned} onAuth={progressAuth} />
      </section>
    </PageShell>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof UserCheck }) {
  return <div className="rounded-lg border border-border/60 bg-card p-4"><div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div><p className="text-2xl font-semibold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>;
}

function OnboardingLane({ title, clients, onSelect, onAssign, onPaymentSigned, onAuth }: { title: string; clients: Client[]; onSelect: (client: Client) => void; onAssign: (client: Client, bcba: string) => void; onPaymentSigned?: (client: Client) => void; onAuth?: (client: Client, action: "submitted" | "approved" | "consent") => void }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3"><h2 className="text-sm font-semibold text-foreground">{title}</h2><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{clients.length}</span></div>
      <div className="min-h-[420px] space-y-3 p-3">
        {clients.map((client) => <ClientSetupCard key={client.id} client={client} onSelect={onSelect} onAssign={onAssign} onPaymentSigned={onPaymentSigned} onAuth={onAuth} />)}
        {clients.length === 0 && <p className="py-12 text-center text-xs text-muted-foreground">No clients</p>}
      </div>
    </div>
  );
}

function ClientSetupCard({ client, onSelect, onAssign, onPaymentSigned, onAuth }: { client: Client; onSelect: (client: Client) => void; onAssign: (client: Client, bcba: string) => void; onPaymentSigned?: (client: Client) => void; onAuth?: (client: Client, action: "submitted" | "approved" | "consent") => void }) {
  const alert = getClientAlert(client);
  return (
    <article className="rounded-md border border-border/60 bg-background p-3">
      <button type="button" onClick={() => onSelect(client)} className="w-full text-left">
        <div className="flex items-start justify-between gap-2"><div><p className="font-medium text-foreground">{client.childName}</p><p className="text-xs text-muted-foreground">{client.parentName} · {client.payor}</p></div><StatusBadge status={canonicalPipelineStage(client.stage)} variant={stageVariant(client.stage)} /></div>
      </button>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between"><span>BCBA</span><span className="font-medium text-foreground">{client.bcba ?? "Unassigned"}</span></div>
        <div className="flex items-center justify-between"><span>Auth owner</span><span className="font-medium text-foreground">{authOwner(client)}</span></div>
        <div className="flex items-center justify-between"><span>Payment plan</span><span className="font-medium text-foreground">{client.paymentPlanStatus ?? "Not Required"}</span></div>
        <div className="flex items-center justify-between"><span>Days in stage</span><span className="font-medium text-foreground">{client.daysInStage}</span></div>
      </div>
      {alert && <p className={cn("mt-3 flex items-center gap-1 rounded-md px-2 py-1.5 text-xs", alert.type === "red" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}><AlertTriangle className="h-3 w-3" />{alert.message}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {!client.bcba && <Select onValueChange={(bcba) => onAssign(client, bcba)}><SelectTrigger className="h-8 w-[150px]"><SelectValue placeholder="Assign BCBA" /></SelectTrigger><SelectContent>{BCBAS.map((bcba) => <SelectItem key={bcba} value={bcba}>{bcba}</SelectItem>)}</SelectContent></Select>}
        {client.paymentPlanRequired && !client.paymentPlanSigned && onPaymentSigned && <Button size="sm" variant="outline" onClick={() => onPaymentSigned(client)}><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Plan signed</Button>}
        {canonicalPipelineStage(client.stage) === "Pending Initial Authorization" && client.authStatus === "Not Submitted" && onAuth && <Button size="sm" variant="outline" onClick={() => onAuth(client, "submitted")}><ClipboardList className="mr-1.5 h-3.5 w-3.5" />Submit auth</Button>}
        {client.authStatus === "Submitted" && onAuth && <Button size="sm" variant="outline" onClick={() => onAuth(client, "approved")}><ShieldCheck className="mr-1.5 h-3.5 w-3.5" />Approve auth</Button>}
        {!client.consentComplete && onAuth && <Button size="sm" variant="outline" onClick={() => onAuth(client, "consent")}>Consent complete</Button>}
      </div>
    </article>
  );
}