import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock, FileWarning, RefreshCw, Send, ShieldCheck, TrendingUp } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useClients } from "@/contexts/ClientsContext";
import { AuthorizationRecord, Client, authVariant } from "@/data/clients";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AuthRow = AuthorizationRecord & { client: Client; authId: string; type: "Initial" | "Treatment" | "Reauth" };
type ViewKey = "all" | "needs" | "progress" | "approved" | "problem" | "expiring";

const daysUntil = (date?: string | null) => date ? Math.ceil((new Date(date).getTime() - Date.now()) / 86400000) : null;

const coordinatorFor = (client: Client, auth: AuthorizationRecord) => auth.assignedAuthCoordinator || (client.state === "GA" ? "Kayla / Riki / GA Team" : client.payor.toLowerCase().includes("medicaid") ? "Medicaid Auth Team" : "Kayla");

const getAlert = (auth: AuthRow) => {
  const exp = daysUntil(auth.expirationDate);
  if (auth.type === "Treatment" && !auth.treatmentPlanLinked) return { tone: "red", message: "Missing treatment plan" };
  if ((auth.missingDocs?.length ?? 0) > 0 || auth.requiredDocsReceived === false) return { tone: "red", message: "Missing documentation" };
  if (auth.status === "Denied") return { tone: "red", message: "Denied auth" };
  if (exp !== null && exp < 30) return { tone: "red", message: `Expiring in ${exp}d` };
  if (auth.qaStatus === "In Review") return { tone: "yellow", message: "QA blocking submission" };
  if (auth.status === "Submitted" && (auth.daysInStage ?? 0) > 10) return { tone: "red", message: `Waiting ${auth.daysInStage}d` };
  if (auth.status === "Submitted" && (auth.daysInStage ?? 0) > 5) return { tone: "yellow", message: `Waiting ${auth.daysInStage}d` };
  if (auth.status === "Not Submitted" && (auth.daysInStage ?? 0) > 2) return { tone: "yellow", message: `Awaiting submission ${auth.daysInStage}d` };
  return null;
};

const avg = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;

export default function Authorizations() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clients, updateClient, addTask } = useClients();
  const [view, setView] = useState<ViewKey>("all");
  const [query, setQuery] = useState("");
  const typeFilter = searchParams.get("type") === "treatment" ? "Treatment" : searchParams.get("type") === "initial" ? "Initial" : null;
  const isTreatment = typeFilter === "Treatment";

  const auths = useMemo<AuthRow[]>(() => clients.flatMap((client) => client.authorizations.map((auth, index) => ({ ...auth, client, authId: auth.id ?? `${client.id}-${auth.type}-${index}`, type: auth.type } as AuthRow))).filter((auth) => !typeFilter || auth.type === typeFilter), [clients, typeFilter]);

  const filtered = useMemo(() => {
    let rows = auths;
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter((auth) => auth.client.childName.toLowerCase().includes(q) || auth.payor?.toLowerCase().includes(q) || auth.authId.toLowerCase().includes(q) || coordinatorFor(auth.client, auth).toLowerCase().includes(q));
    }
    if (view === "needs") rows = rows.filter((auth) => auth.status === "Not Submitted");
    if (view === "progress") rows = rows.filter((auth) => auth.status === "Submitted" || auth.qaStatus === "In Review");
    if (view === "approved") rows = rows.filter((auth) => auth.status === "Approved");
    if (view === "problem") rows = rows.filter((auth) => auth.status === "Denied" || (auth.missingDocs?.length ?? 0) > 0 || auth.requiredDocsReceived === false);
    if (view === "expiring") rows = rows.filter((auth) => auth.status === "Expiring Soon" || auth.status === "Expired" || (daysUntil(auth.expirationDate) ?? 999) <= 90);
    return rows;
  }, [auths, query, view]);

  const metrics = {
    needs: auths.filter((a) => a.status === "Not Submitted").length,
    progress: auths.filter((a) => a.status === "Submitted" || a.qaStatus === "In Review").length,
    approved: auths.filter((a) => a.status === "Approved").length,
    problem: auths.filter((a) => a.status === "Denied" || (a.missingDocs?.length ?? 0) > 0 || a.requiredDocsReceived === false).length,
    expiring: auths.filter((a) => a.status === "Expiring Soon" || (daysUntil(a.expirationDate) ?? 999) <= 90).length,
  };

  const submittedRows = auths.filter((a) => a.status === "Submitted" && a.submittedDate);
  const approvedRows = auths.filter((a) => a.status === "Approved");
  const successMetrics = {
    qaToSubmission: avg(submittedRows.map((a) => a.daysInStage ?? 0)),
    submissionToApproval: avg(approvedRows.map((a) => a.daysInStage ?? 0)),
    approvalRate: auths.length ? Math.round((approvedRows.length / auths.length) * 100) : 0,
    denialRate: auths.length ? Math.round((auths.filter((a) => a.status === "Denied").length / auths.length) * 100) : 0,
    reauthSuccess: auths.filter((a) => a.type === "Reauth").length ? Math.round((auths.filter((a) => a.type === "Reauth" && a.status === "Approved").length / auths.filter((a) => a.type === "Reauth").length) * 100) : 0,
  };

  const submitAuth = async (auth: AuthRow) => {
    if ((auth.missingDocs?.length ?? 0) > 0 || auth.requiredDocsReceived === false) {
      await handleMissingDocs(auth);
      return;
    }
    await supabase.from("client_authorizations").update({ status: "Submitted", submitted_date: new Date().toISOString().split("T")[0], next_action: "Follow up with payor" } as never).eq("id", auth.authId);
    toast.success("Authorization submitted");
  };

  const approveAuth = async (auth: AuthRow) => {
    await supabase.from("client_authorizations").update({ status: "Approved", approved_date: new Date().toISOString().split("T")[0] } as never).eq("id", auth.authId);
    toast.success("Authorization approved");
  };

  const denyAuth = async (auth: AuthRow) => {
    await supabase.from("client_authorizations").update({ status: "Denied", blockers: ["Denied auth"], next_action: "Fix documentation and resubmit" } as never).eq("id", auth.authId);
    await addTask(auth.client.id, { id: `fix-${Date.now()}`, title: "Fix documentation", completed: false, dueDate: new Date().toISOString().split("T")[0] });
    toast.error("Authorization denied — fix tasks created");
  };

  const handleMissingDocs = async (auth: AuthRow) => {
    if (auth.id) await supabase.from("client_authorizations").delete().eq("id", auth.authId);
    await updateClient(auth.client.id, { stage: "Can Not Submit Auth" as never, blockers: Array.from(new Set([...auth.client.blockers, "Missing documentation"])), nextAction: "Collect missing documentation" });
    await addTask(auth.client.id, { id: `docs-${Date.now()}`, title: "Collect Missing Documentation", completed: false, dueDate: new Date().toISOString().split("T")[0] });
    toast.error("Missing docs loop started", { description: "Auth removed and client sent back for documentation." });
  };

  const triggerReauth = async (auth: AuthRow) => {
    if (auth.id) await supabase.from("client_authorizations").update({ status: "Expiring Soon", next_action: "Start reauthorization" } as never).eq("id", auth.authId);
    await supabase.from("client_authorizations").insert({ client_id: auth.client.id, kind: "Reauth", status: "Not Submitted", payor: auth.payor ?? auth.client.payor, state: auth.state ?? auth.client.state, assigned_auth_coordinator: coordinatorFor(auth.client, auth), next_action: "Confirm Treatment Plan", reauth_source_id: auth.id ?? null } as never);
    await addTask(auth.client.id, { id: `reauth-${Date.now()}`, title: "Request Progress Report", completed: false });
    toast.success("Reauth record created");
  };

  return (
    <PageShell title={isTreatment ? "Treatment Authorization" : "Authorization"} description={isTreatment ? "Primary revenue activation layer from QA approval to staffing, denials, and reauth" : "Revenue gate for initial auth, treatment auth, denials, and reauthorization cycles"} icon={ShieldCheck}>
      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Metric label="Needs Submission" value={metrics.needs} icon={Send} active={view === "needs"} onClick={() => setView("needs")} />
        <Metric label="In Progress" value={metrics.progress} icon={Clock} active={view === "progress"} onClick={() => setView("progress")} />
        <Metric label="Approved" value={metrics.approved} icon={CheckCircle2} active={view === "approved"} onClick={() => setView("approved")} />
        <Metric label="Problem Cases" value={metrics.problem} icon={FileWarning} active={view === "problem"} onClick={() => setView("problem")} />
        <Metric label="Expiring Soon" value={metrics.expiring} icon={RefreshCw} active={view === "expiring"} onClick={() => setView("expiring")} />
      </section>

      {isTreatment && (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Metric label="QA → Submission" value={`${successMetrics.qaToSubmission}d`} icon={TrendingUp} active={false} onClick={() => setView("progress")} />
          <Metric label="Submission → Approval" value={`${successMetrics.submissionToApproval}d`} icon={Clock} active={false} onClick={() => setView("approved")} />
          <Metric label="Approval Rate" value={`${successMetrics.approvalRate}%`} icon={CheckCircle2} active={false} onClick={() => setView("approved")} />
          <Metric label="Denial Rate" value={`${successMetrics.denialRate}%`} icon={FileWarning} active={false} onClick={() => setView("problem")} />
          <Metric label="Reauth Success" value={`${successMetrics.reauthSuccess}%`} icon={RefreshCw} active={false} onClick={() => setView("expiring")} />
        </section>
      )}

      <div className="flex items-center gap-2"><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search client, payor, auth ID, coordinator…" className="max-w-md" /><Button variant="outline" onClick={() => setView("all")}>All</Button></div>
      <AuthRevenueTable auths={filtered} onSelect={(auth) => navigate(`/clients/${auth.client.id}`)} onSubmit={submitAuth} onApprove={approveAuth} onDeny={denyAuth} onMissingDocs={handleMissingDocs} onReauth={triggerReauth} />
    </PageShell>
  );
}

function Metric({ label, value, icon: Icon, active, onClick }: { label: string; value: number | string; icon: typeof ShieldCheck; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={cn("rounded-lg border border-border/60 bg-card p-4 text-left transition-colors hover:bg-muted/30", active && "border-primary/40 bg-primary/5")}><div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div><p className="text-2xl font-semibold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></button>;
}

function AuthRevenueTable({ auths, onSelect, onSubmit, onApprove, onDeny, onMissingDocs, onReauth }: { auths: AuthRow[]; onSelect: (auth: AuthRow) => void; onSubmit: (auth: AuthRow) => void; onApprove: (auth: AuthRow) => void; onDeny: (auth: AuthRow) => void; onMissingDocs: (auth: AuthRow) => void; onReauth: (auth: AuthRow) => void }) {
  return <div className="overflow-hidden rounded-lg border border-border/60 bg-card"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border bg-muted/30">{["Client", "Payor", "Status", "Approved Hours", "Expiration", "Days in Stage", "Alerts", "Actions"].map((header) => <th key={header} className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">{header}</th>)}</tr></thead><tbody>{auths.map((auth) => { const alert = getAlert(auth); const exp = daysUntil(auth.expirationDate); return <tr key={auth.authId} className="border-b border-border/40"><td className="px-3 py-3"><button onClick={() => onSelect(auth)} className="text-left font-medium text-foreground hover:text-primary">{auth.client.childName}</button><p className="text-xs text-muted-foreground">{auth.authId} · {auth.type} · {coordinatorFor(auth.client, auth)}</p></td><td className="px-3 py-3 text-muted-foreground">{auth.payor ?? auth.client.payor}</td><td className="px-3 py-3"><StatusBadge status={auth.status === "Not Submitted" ? "Awaiting Submission" : auth.status} variant={authVariant(auth.status)} />{auth.partialApproval && <p className="mt-1 text-xs text-warning">Partial approval</p>}</td><td className="px-3 py-3 text-muted-foreground">{auth.approvedHours ?? auth.hours ?? "—"}{auth.frequency && <p className="text-xs text-muted-foreground">{auth.frequency}</p>}</td><td className="px-3 py-3 text-muted-foreground">{auth.expirationDate ?? "—"}{exp !== null && <span className="ml-1 text-xs">({exp}d)</span>}</td><td className="px-3 py-3 text-muted-foreground">{auth.daysInStage ?? 0}</td><td className="px-3 py-3">{alert ? <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs", alert.tone === "red" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}><AlertTriangle className="h-3 w-3" />{alert.message}</span> : <span className="text-xs text-muted-foreground">—</span>}<p className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">{auth.nextAction ?? "Submit Authorization"}</p></td><td className="px-3 py-3"><div className="flex flex-wrap gap-1.5">{auth.status === "Not Submitted" && <Button size="sm" variant="outline" onClick={() => onSubmit(auth)}>Submit</Button>}{auth.status === "Submitted" && <Button size="sm" variant="outline" onClick={() => onApprove(auth)}>Approve</Button>}<Button size="sm" variant="outline" onClick={() => onDeny(auth)}>Deny</Button>{((auth.missingDocs?.length ?? 0) > 0 || auth.requiredDocsReceived === false) && <Button size="sm" variant="outline" onClick={() => onMissingDocs(auth)}>Missing Docs</Button>}{auth.status === "Approved" && <Button size="sm" variant="outline" onClick={() => onReauth(auth)}>Reauth</Button>}</div></td></tr>; })}</tbody></table></div>{auths.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No authorizations match this view</p>}</div>;
}