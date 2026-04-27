import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, BadgeDollarSign, CheckCircle2, HeartPulse, RefreshCw, ShieldAlert, UserMinus } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClients } from "@/contexts/ClientsContext";
import { Client } from "@/data/clients";
import { canonicalPipelineStage } from "@/data/pipeline";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ViewKey = "all" | "stable" | "issues" | "risk" | "reauth";
type FlagRow = { id: string; client_id: string; source: string; severity: "Yellow" | "Red"; title: string; status: string; due_date: string | null };

const daysUntil = (date?: string | null) => date ? Math.ceil((new Date(date).getTime() - Date.now()) / 86400000) : null;
const pct = (value: number, total: number) => total > 0 ? Math.round((value / total) * 100) : 0;
const activeStages = new Set(["Active", "Services on Pause", "Flaked", "Discharged", "Restaffing Needed", "Reauth Triggered", "Progress Report Needed"]);

const activeVariant = (status: string): "success" | "warning" | "destructive" | "muted" => {
  if (status === "Active") return "success";
  if (status === "Services on Pause") return "warning";
  if (status === "Flaked") return "destructive";
  return "muted";
};

const alertFor = (client: Client, flags: FlagRow[]) => {
  const utilization = pct(client.deliveredWeeklyHours ?? 0, client.approvedWeeklyHours ?? 0);
  const reauthDays = daysUntil(client.nextReauthDate) ?? daysUntil(client.authorizations.find((a) => a.type !== "Initial" && a.expirationDate)?.expirationDate);
  if (!client.rbt || client.activeStaffingStatus === "Needs Restaffing") return { tone: "red" as const, message: "RBT removed" };
  if ((client.noteguardFlags ?? 0) > 0 || flags.some((flag) => flag.source === "NoteGuard" || flag.source === "Amerigroup")) return { tone: "red" as const, message: "Note compliance issue" };
  if ((client.claimsIssues ?? 0) > 0 || client.billingStatus === "Claims Issue") return { tone: "red" as const, message: "Billing issue" };
  if (reauthDays !== null && reauthDays <= 90) return { tone: "yellow" as const, message: "Reauth needed" };
  if ((client.approvedWeeklyHours ?? 0) > 0 && utilization < 75) return { tone: "yellow" as const, message: "Low session hours" };
  return null;
};

export default function ActiveServices() {
  const navigate = useNavigate();
  const { clients, updateClient, addTask } = useClients();
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewKey>("all");

  const refetchFlags = useCallback(async () => {
    const { data, error } = await supabase.from("client_compliance_flags" as never).select("*").order("created_at", { ascending: false });
    if (error) { console.error("Active flags fetch error", error); return; }
    setFlags((data ?? []) as unknown as FlagRow[]);
  }, []);

  useEffect(() => { void refetchFlags(); }, [refetchFlags]);
  useEffect(() => {
    const channel = supabase.channel("active-services-live").on("postgres_changes", { event: "*", schema: "public", table: "client_compliance_flags" }, () => void refetchFlags()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [refetchFlags]);

  const rows = useMemo(() => clients.filter((client) => activeStages.has(canonicalPipelineStage(client.stage))), [clients]);
  const flagsByClient = useMemo(() => flags.reduce((map, flag) => map.set(flag.client_id, [...(map.get(flag.client_id) ?? []), flag]), new Map<string, FlagRow[]>()), [flags]);

  const filtered = useMemo(() => {
    let next = rows;
    if (query) {
      const q = query.toLowerCase();
      next = next.filter((client) => client.childName.toLowerCase().includes(q) || (client.bcba ?? "").toLowerCase().includes(q) || (client.rbt ?? "").toLowerCase().includes(q));
    }
    if (view === "stable") next = next.filter((client) => !alertFor(client, flagsByClient.get(client.id) ?? []) && canonicalPipelineStage(client.stage) === "Active");
    if (view === "issues") next = next.filter((client) => ["Flagged", "Repeated Errors"].includes(client.notesComplianceStatus ?? "") || client.billingStatus !== "Current");
    if (view === "risk") next = next.filter((client) => Boolean(alertFor(client, flagsByClient.get(client.id) ?? [])) || canonicalPipelineStage(client.stage) !== "Active");
    if (view === "reauth") next = next.filter((client) => {
      const days = daysUntil(client.nextReauthDate) ?? daysUntil(client.authorizations.find((a) => a.type !== "Initial" && a.expirationDate)?.expirationDate);
      return days !== null && days <= 90;
    });
    return next;
  }, [flagsByClient, query, rows, view]);

  const metrics = {
    stable: rows.filter((client) => !alertFor(client, flagsByClient.get(client.id) ?? []) && canonicalPipelineStage(client.stage) === "Active").length,
    issues: rows.filter((client) => ["Flagged", "Repeated Errors"].includes(client.notesComplianceStatus ?? "") || client.billingStatus !== "Current").length,
    risk: rows.filter((client) => Boolean(alertFor(client, flagsByClient.get(client.id) ?? [])) || canonicalPipelineStage(client.stage) !== "Active").length,
    reauth: rows.filter((client) => { const days = daysUntil(client.nextReauthDate) ?? daysUntil(client.authorizations.find((a) => a.type !== "Initial" && a.expirationDate)?.expirationDate); return days !== null && days <= 90; }).length,
    utilization: rows.length ? Math.round(rows.reduce((sum, client) => sum + pct(client.deliveredWeeklyHours ?? 0, client.approvedWeeklyHours ?? 0), 0) / rows.length) : 0,
  };

  const createFlag = async (client: Client, source: "NoteGuard" | "Billing" | "Staffing" | "Reauth", title: string) => {
    const { error } = await supabase.from("client_compliance_flags" as never).insert({ client_id: client.id, source, severity: source === "Reauth" ? "Yellow" : "Red", title, status: "Open", due_date: new Date().toISOString().split("T")[0] } as never);
    if (error) { toast.error("Could not create alert"); return; }
    toast.success("Active services alert created");
    void refetchFlags();
  };

  const removeRbt = async (client: Client) => {
    await updateClient(client.id, { rbt: null, stage: "Restaffing Needed", staffingStatus: "Needed", activeStaffingStatus: "Needs Restaffing", nextAction: "Reassign RBT", activeAlerts: Array.from(new Set([...(client.activeAlerts ?? []), "RBT removed"])) });
    await addTask(client.id, { id: `restaff-${Date.now()}`, title: "Reassign RBT", completed: false });
    toast.error("Client moved to restaffing");
  };

  return (
    <PageShell title="Active Services" description="Live operations engine for care delivery, QA, staffing stability, billing, and reauth protection" icon={HeartPulse}>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Stable Clients" value={metrics.stable} icon={CheckCircle2} active={view === "stable"} onClick={() => setView("stable")} />
        <Metric label="Issues" value={metrics.issues} icon={ShieldAlert} active={view === "issues"} onClick={() => setView("issues")} />
        <Metric label="At Risk" value={metrics.risk} icon={AlertTriangle} active={view === "risk"} onClick={() => setView("risk")} />
        <Metric label="Reauth Needed" value={metrics.reauth} icon={RefreshCw} active={view === "reauth"} onClick={() => setView("reauth")} />
        <Metric label="Sessions Delivered" value={`${metrics.utilization}%`} icon={BadgeDollarSign} active={false} onClick={() => setView("all")} />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search client, BCBA, RBT…" className="max-w-md" />
        <Button variant="outline" onClick={() => setView("all")}>All</Button>
      </div>

      <ActiveServicesTable rows={filtered} flagsByClient={flagsByClient} onOpen={(client) => navigate(`/clients/${client.id}`)} onFlag={createFlag} onRemoveRbt={removeRbt} />
    </PageShell>
  );
}

function Metric({ label, value, icon: Icon, active, onClick }: { label: string; value: number | string; icon: typeof HeartPulse; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("rounded-lg border border-border/60 bg-card p-4 text-left transition-colors hover:bg-muted/30", active && "border-primary/40 bg-primary/5")}><div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div><p className="text-2xl font-semibold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></button>;
}

function ActiveServicesTable({ rows, flagsByClient, onOpen, onFlag, onRemoveRbt }: { rows: Client[]; flagsByClient: Map<string, FlagRow[]>; onOpen: (client: Client) => void; onFlag: (client: Client, source: "NoteGuard" | "Billing" | "Staffing" | "Reauth", title: string) => void; onRemoveRbt: (client: Client) => void }) {
  return <div className="overflow-hidden rounded-lg border border-border/60 bg-card"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border bg-muted/30">{["Client", "Care Team", "Hours", "Status", "Staffing", "QA Flags", "Reauth", "Alerts", "Actions"].map((header) => <th key={header} className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">{header}</th>)}</tr></thead><tbody>{rows.map((client) => { const flags = flagsByClient.get(client.id) ?? []; const alert = alertFor(client, flags); const reauthDate = client.nextReauthDate ?? client.authorizations.find((auth) => auth.type !== "Initial" && auth.expirationDate)?.expirationDate; const utilization = pct(client.deliveredWeeklyHours ?? 0, client.approvedWeeklyHours ?? 0); return <tr key={client.id} className="border-b border-border/40"><td className="px-3 py-3"><button onClick={() => onOpen(client)} className="text-left font-medium text-foreground hover:text-primary">{client.childName}</button><p className="text-xs text-muted-foreground">{client.serviceLocation ?? client.clinic} · {client.daysInStage}d active</p></td><td className="px-3 py-3 text-muted-foreground"><p>{client.bcba ?? "No BCBA"}</p><p className="text-xs">{client.rbt ?? "No RBT"}</p></td><td className="px-3 py-3"><p className="font-medium text-foreground">{client.approvedWeeklyHours ?? 0}h / {client.deliveredWeeklyHours ?? 0}h</p><div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", utilization >= 85 ? "bg-success" : utilization >= 70 ? "bg-warning" : "bg-destructive")} style={{ width: `${Math.min(100, utilization)}%` }} /></div><p className="mt-1 text-xs text-muted-foreground">{client.scheduledWeeklyHours ?? client.schedule.length * 4}h scheduled</p></td><td className="px-3 py-3"><StatusBadge status={client.activeServiceStatus ?? canonicalPipelineStage(client.stage)} variant={activeVariant(client.activeServiceStatus ?? canonicalPipelineStage(client.stage))} /></td><td className="px-3 py-3"><StatusBadge status={client.activeStaffingStatus ?? (client.rbt ? "Stable" : "Needs Restaffing")} variant={(client.activeStaffingStatus ?? "Stable") === "Stable" ? "success" : "warning"} /><p className="mt-1 text-xs text-muted-foreground">{client.rbtCheckInStatus ?? "Not Required"}</p></td><td className="px-3 py-3"><StatusBadge status={client.notesComplianceStatus ?? "Compliant"} variant={(client.notesComplianceStatus ?? "Compliant") === "Compliant" ? "success" : "destructive"} /><p className="mt-1 text-xs text-muted-foreground">{client.noteguardFlags ?? 0} NoteGuard · {client.amerigroupStatus ?? "Current"}</p></td><td className="px-3 py-3 text-muted-foreground">{reauthDate ?? "—"}{reauthDate && <p className="text-xs">{daysUntil(reauthDate)}d</p>}</td><td className="px-3 py-3">{alert ? <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs", alert.tone === "red" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}><AlertTriangle className="h-3 w-3" />{alert.message}</span> : <span className="text-xs text-muted-foreground">—</span>}<p className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">{flags[0]?.title ?? client.nextAction}</p></td><td className="px-3 py-3"><div className="flex flex-wrap gap-1.5"><Button size="sm" variant="outline" onClick={() => onFlag(client, "NoteGuard", "Note compliance issue")}>Flag Note</Button><Button size="sm" variant="outline" onClick={() => onFlag(client, "Billing", "Resolve claim issue")}>Billing</Button><Button size="sm" variant="outline" onClick={() => onFlag(client, "Reauth", "Request progress report")}>Reauth</Button>{client.rbt && <Button size="sm" variant="outline" onClick={() => onRemoveRbt(client)}><UserMinus className="mr-1 h-3 w-3" />RBT</Button>}</div></td></tr>; })}</tbody></table></div>{rows.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No active service clients match this view</p>}</div>;
}