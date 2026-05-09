import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeepLink, useConsumeDeepLink, useDeepLinkHighlight } from "@/lib/deepLink";
import { AlertTriangle, CheckCircle2, Clock, FileCheck2, RefreshCw, Send, ShieldAlert, TrendingUp } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClients } from "@/contexts/ClientsContext";
import { Client, ReauthCycle, ReauthCycleStatus } from "@/data/clients";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ReauthRow = ReauthCycle & { client: Client };
type ViewKey = "all" | "urgent" | "progress" | "track" | "risk";

const today = () => new Date().toISOString().split("T")[0];
const daysUntil = (date?: string | null) => date ? Math.ceil((new Date(date).getTime() - Date.now()) / 86400000) : null;
const avg = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;

const statusVariant = (status: ReauthCycleStatus): "success" | "warning" | "destructive" | "info" | "muted" => {
  if (status === "Approved") return "success";
  if (status === "Failed / Delayed") return "destructive";
  if (status === "Submitted" || status === "QA Review" || status === "Report Received") return "info";
  if (status === "In Progress" || status === "BCBA Notified") return "warning";
  return "muted";
};

const alertFor = (row: ReauthRow) => {
  const remaining = daysUntil(row.currentAuthExpirationDate) ?? 999;
  if (remaining <= 0) return { tone: "red" as const, message: "Expired authorization" };
  if (row.status === "Failed / Delayed") return { tone: "red" as const, message: row.alerts[0] ?? "Failed / delayed" };
  if (remaining <= 30 && row.submissionStatus === "Not Submitted") return { tone: "red" as const, message: "30d — no submission" };
  if (remaining <= 60 && !row.progressReportReceivedDate) return { tone: "red" as const, message: "60d — no report" };
  if (row.progressReportDueDate && daysUntil(row.progressReportDueDate)! < 0 && !row.progressReportReceivedDate) return { tone: "red" as const, message: "Report overdue" };
  if (row.status === "BCBA Notified" && (row.daysInStage ?? 0) > 14) return { tone: "yellow" as const, message: "BCBA not responding" };
  return null;
};

export default function ReauthLoop() {
  const navigate = useNavigate();
  const { clients, addTask } = useClients();
  const [view, setView] = useState<ViewKey>("all");
  const [query, setQuery] = useState("");
  const deepLink = useDeepLink();
  useConsumeDeepLink();

  const rows = useMemo<ReauthRow[]>(() => clients.flatMap((client) => (client.reauthCycles ?? []).map((cycle) => ({ ...cycle, client }))), [clients]);

  // Deep-link: resolve to a concrete row id (`cycle-<id>`) and highlight it.
  let resolvedCycleId: string | null = null;
  if (deepLink.cycle && rows.some((r) => r.id === deepLink.cycle)) {
    resolvedCycleId = `cycle-${deepLink.cycle}`;
  } else if (deepLink.focus) {
    const match = rows.find((r) => r.client.id === deepLink.focus);
    if (match) resolvedCycleId = `cycle-${match.id}`;
  }
  useDeepLinkHighlight(resolvedCycleId, rows.length > 0);
  useEffect(() => {
    if (!rows.length) return;
    if (deepLink.cycle && !rows.some((r) => r.id === deepLink.cycle)) {
      toast.message?.(`No reauth cycle matches "${deepLink.cycle}"`);
    } else if (deepLink.focus && !rows.some((r) => r.client.id === deepLink.focus)) {
      toast.message?.(`No reauth cycle for client "${deepLink.focus}"`);
    } else if (deepLink.alert) {
      toast.message?.("Opened from alert");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length === 0]);

  const filtered = useMemo(() => {
    let next = rows;
    if (query) {
      const q = query.toLowerCase();
      next = next.filter((row) => row.client.childName.toLowerCase().includes(q) || (row.assignedBcba ?? "").toLowerCase().includes(q) || row.payor.toLowerCase().includes(q) || (row.authorizationCoordinator ?? "").toLowerCase().includes(q));
    }
    if (view === "urgent") next = next.filter((row) => (daysUntil(row.currentAuthExpirationDate) ?? 999) < 30);
    if (view === "progress") next = next.filter((row) => ["BCBA Notified", "In Progress", "Report Received", "QA Review", "Submitted"].includes(row.status));
    if (view === "track") next = next.filter((row) => !alertFor(row) && row.status !== "Approved");
    if (view === "risk") next = next.filter((row) => Boolean(alertFor(row)) || row.status === "Failed / Delayed");
    return next;
  }, [query, rows, view]);

  const completed = rows.filter((row) => row.status === "Approved");
  const metrics = {
    urgent: rows.filter((row) => (daysUntil(row.currentAuthExpirationDate) ?? 999) < 30).length,
    progress: rows.filter((row) => ["BCBA Notified", "In Progress", "Report Received", "QA Review", "Submitted"].includes(row.status)).length,
    track: rows.filter((row) => !alertFor(row) && row.status !== "Approved").length,
    risk: rows.filter((row) => Boolean(alertFor(row)) || row.status === "Failed / Delayed").length,
    onTime: completed.length ? Math.round((completed.filter((row) => (daysUntil(row.currentAuthExpirationDate) ?? -1) >= 0).length / completed.length) * 100) : 0,
    reportDays: avg(rows.filter((row) => row.progressReportReceivedDate).map((row) => Math.max(0, Math.round((new Date(row.progressReportReceivedDate!).getTime() - new Date(row.reauthTriggerDate).getTime()) / 86400000)))),
  };

  const patchCycle = async (row: ReauthRow, patch: Record<string, unknown>, message: string) => {
    const { error } = await supabase.from("client_reauth_cycles" as never).update(patch as never).eq("id", row.id);
    if (error) { toast.error("Could not update reauth"); return; }
    toast.success(message);
  };

  const notifyBcba = async (row: ReauthRow) => {
    await patchCycle(row, { status: "BCBA Notified", alerts: Array.from(new Set([...row.alerts, "BCBA notified"])) }, "BCBA notification tracked");
    await addTask(row.client.id, { id: `bcba-${Date.now()}`, title: "Complete Progress Report", completed: false, dueDate: row.progressReportDueDate ?? today() });
  };

  return (
    <PageShell title="Reauth Loop" description="Revenue continuity engine for progress reports, QA, submissions, reminders, and expiration prevention" icon={RefreshCw}>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Metric label="Urgent" value={metrics.urgent} icon={AlertTriangle} active={view === "urgent"} onClick={() => setView("urgent")} />
        <Metric label="In Progress" value={metrics.progress} icon={Clock} active={view === "progress"} onClick={() => setView("progress")} />
        <Metric label="On Track" value={metrics.track} icon={CheckCircle2} active={view === "track"} onClick={() => setView("track")} />
        <Metric label="At Risk" value={metrics.risk} icon={ShieldAlert} active={view === "risk"} onClick={() => setView("risk")} />
        <Metric label="On-Time" value={`${metrics.onTime}%`} icon={TrendingUp} active={false} onClick={() => setView("all")} />
        <Metric label="Avg Report" value={`${metrics.reportDays}d`} icon={FileCheck2} active={false} onClick={() => setView("progress")} />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search client, BCBA, payor, coordinator…" className="max-w-md" />
        <Button variant="outline" onClick={() => setView("all")}>All</Button>
      </div>

      <ReauthTable rows={filtered} onOpen={(client) => navigate(`/clients/${client.id}`)} onNotify={notifyBcba} onPatch={patchCycle} />
    </PageShell>
  );
}

function Metric({ label, value, icon: Icon, active, onClick }: { label: string; value: number | string; icon: typeof RefreshCw; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("rounded-lg border border-border/60 bg-card p-4 text-left transition-colors hover:bg-muted/30", active && "border-primary/40 bg-primary/5")}><div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div><p className="text-2xl font-semibold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></button>;
}

function ReauthTable({ rows, onOpen, onNotify, onPatch }: { rows: ReauthRow[]; onOpen: (client: Client) => void; onNotify: (row: ReauthRow) => void; onPatch: (row: ReauthRow, patch: Record<string, unknown>, message: string) => void }) {
  return <div className="overflow-hidden rounded-lg border border-border/60 bg-card"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border bg-muted/30">{["Client", "BCBA", "Expiration", "Days", "Status", "QA", "Submission", "Alerts", "Actions"].map((header) => <th key={header} className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">{header}</th>)}</tr></thead><tbody>{rows.map((row) => { const alert = alertFor(row); const remaining = daysUntil(row.currentAuthExpirationDate); return <tr key={row.id} data-deeplink-id={`cycle-${row.id}`} className="border-b border-border/40"><td className="px-3 py-3"><button onClick={() => onOpen(row.client)} className="text-left font-medium text-foreground hover:text-primary">{row.client.childName}</button><p className="text-xs text-muted-foreground">{row.payor} · {row.authorizationCoordinator ?? "Auth Team"}</p></td><td className="px-3 py-3 text-muted-foreground"><p>{row.assignedBcba ?? row.client.bcba ?? "No BCBA"}</p><p className="text-xs">SD: {row.stateDirector ?? "State Director"}</p></td><td className="px-3 py-3 text-muted-foreground">{row.currentAuthExpirationDate}<p className="text-xs">Trigger {row.reauthTriggerDate}</p></td><td className={cn("px-3 py-3 font-medium", (remaining ?? 999) < 30 ? "text-destructive" : (remaining ?? 999) <= 60 ? "text-warning" : "text-foreground")}>{remaining ?? "—"}</td><td className="px-3 py-3"><StatusBadge status={row.status} variant={statusVariant(row.status)} /></td><td className="px-3 py-3"><StatusBadge status={row.qaStatus} variant={row.qaStatus === "Passed" ? "success" : row.qaStatus === "Failed" ? "destructive" : row.qaStatus === "In Review" ? "warning" : "muted"} /></td><td className="px-3 py-3"><StatusBadge status={row.submissionStatus} variant={row.submissionStatus === "Approved" ? "success" : row.submissionStatus === "Submitted" ? "info" : row.submissionStatus === "Denied" ? "destructive" : "muted"} />{row.submissionDate && <p className="mt-1 text-xs text-muted-foreground">{row.submissionDate}</p>}</td><td className="px-3 py-3">{alert ? <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs", alert.tone === "red" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}><AlertTriangle className="h-3 w-3" />{alert.message}</span> : <span className="text-xs text-muted-foreground">—</span>}<p className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">{row.blockers[0] ?? row.alerts[0] ?? "No blockers"}</p></td><td className="px-3 py-3"><div className="flex flex-wrap gap-1.5"><Button size="sm" variant="outline" onClick={() => onNotify(row)}>Notify</Button><Button size="sm" variant="outline" onClick={() => onPatch(row, { status: "In Progress" }, "Progress report started")}>Start</Button><Button size="sm" variant="outline" onClick={() => onPatch(row, { progress_report_received_date: today(), status: "Report Received", qa_status: "In Review" }, "Report moved to QA")}>Report</Button><Button size="sm" variant="outline" onClick={() => onPatch(row, { status: "QA Review", qa_status: "Passed", qa_completed_date: today(), submission_status: "Ready" }, "QA passed")}>QA Pass</Button><Button size="sm" variant="outline" onClick={() => onPatch(row, { submission_status: "Submitted", submission_date: today(), status: "Submitted" }, "Reauth submitted")}><Send className="mr-1 h-3 w-3" />Submit</Button><Button size="sm" variant="outline" onClick={() => onPatch(row, { submission_status: "Approved", approval_date: today(), status: "Approved" }, "Reauth approved")}>Approve</Button></div></td></tr>; })}</tbody></table></div>{rows.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No reauth cycles match this view</p>}</div>;
}