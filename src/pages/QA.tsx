import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileWarning, Gauge, ListChecks, RefreshCw, ShieldCheck, Stethoscope, UserCheck } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useClients } from "@/contexts/ClientsContext";
import { Client } from "@/data/clients";
import { canonicalPipelineStage } from "@/data/pipeline";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type QAReview = Database["public"]["Tables"]["client_qa_reviews"]["Row"];
type QAReviewInsert = Database["public"]["Tables"]["client_qa_reviews"]["Insert"];
type QAStatus = Database["public"]["Enums"]["qa_review_status"];
type QAErrorType = Database["public"]["Enums"]["qa_error_type"];
type NoteMonitor = Database["public"]["Tables"]["qa_note_monitoring"]["Row"];
type ViewKey = "all" | "awaiting" | "review" | "issues" | "ready" | "monitoring" | "performance";
type QAItem = { review: QAReview | null; client: Client; missingRecord: boolean };

const todayIso = () => new Date().toISOString().split("T")[0];
const daysBetween = (date?: string | null) => date ? Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000)) : 0;
const ERROR_TYPES: QAErrorType[] = ["Missing Treatment Plan", "Missing Supporting Docs", "Formatting Error", "Clinical Accuracy", "Incomplete Notes", "Billing Risk", "Other"];
const QA_OWNERS = ["Mordy G.", "Anje", "QA Team", "Clinical Director"];

const qaVariant = (status: QAStatus | "Missing QA"): "default" | "success" | "warning" | "destructive" | "info" | "muted" => {
  if (status === "Awaiting Review") return "info";
  if (status === "In Review") return "warning";
  if (status === "Issues Found") return "destructive";
  if (status === "Ready for Submission") return "success";
  if (status === "Submitted to Auth") return "success";
  return "destructive";
};

const monitoringVariant = (status: NoteMonitor["status"]): "default" | "success" | "warning" | "destructive" | "muted" => {
  if (status === "Resolved") return "success";
  if (status === "In Progress") return "warning";
  return "destructive";
};

const isQAClient = (client: Client) => {
  const stage = canonicalPipelineStage(client.stage);
  return ["QA Review", "QA Issues / Fix Required", "QA Approved", "Treatment Auth – Awaiting Submission"].includes(stage);
};

const alertFor = (item: QAItem) => {
  if (item.missingRecord) return { tone: "red" as const, message: "Missing QA record" };
  const review = item.review;
  if (!review) return null;
  if (!review.treatment_plan_received) return { tone: "red" as const, message: "Treatment plan missing" };
  if (review.status !== "Submitted to Auth" && daysBetween(review.stage_entered_at) > 3) return { tone: "red" as const, message: "QA delayed >3d" };
  if (review.status === "Issues Found") return { tone: "red" as const, message: "Errors not resolved" };
  if (review.errors_found) return { tone: "red" as const, message: "Compliance risk detected" };
  return null;
};

export default function QA() {
  const navigate = useNavigate();
  const { clients, updateClient, addTask } = useClients();
  const [reviews, setReviews] = useState<QAReview[]>([]);
  const [monitors, setMonitors] = useState<NoteMonitor[]>([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewKey>("all");

  const refetch = useCallback(async () => {
    const [r, m] = await Promise.all([
      supabase.from("client_qa_reviews").select("*").order("created_at", { ascending: false }),
      supabase.from("qa_note_monitoring").select("*").order("created_at", { ascending: false }),
    ]);
    if (r.error || m.error) {
      console.error("QA fetch error", { reviews: r.error, monitoring: m.error });
      return;
    }
    setReviews((r.data ?? []) as QAReview[]);
    setMonitors((m.data ?? []) as NoteMonitor[]);
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);
  useEffect(() => {
    const channel = supabase
      .channel("qa-engine-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "client_qa_reviews" }, () => void refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "qa_note_monitoring" }, () => void refetch())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [refetch]);

  const rows = useMemo<QAItem[]>(() => {
    const clientMap = new Map(clients.map((client) => [client.id, client]));
    const reviewRows = reviews
      .map((review) => ({ review, client: clientMap.get(review.client_id), missingRecord: false }))
      .filter((row): row is QAItem => Boolean(row.client));
    const reviewClientIds = new Set(reviews.map((review) => review.client_id));
    const missing = clients
      .filter((client) => isQAClient(client) && !reviewClientIds.has(client.id))
      .map((client) => ({ review: null, client, missingRecord: true }));
    return [...missing, ...reviewRows];
  }, [clients, reviews]);

  const filtered = useMemo(() => {
    let next = rows;
    if (query) {
      const q = query.toLowerCase();
      next = next.filter((row) => row.client.childName.toLowerCase().includes(q) || row.client.parentName.toLowerCase().includes(q) || (row.review?.assigned_qa_owner ?? "").toLowerCase().includes(q) || (row.review?.assigned_bcba ?? row.client.bcba ?? "").toLowerCase().includes(q));
    }
    if (view === "awaiting") next = next.filter((row) => row.missingRecord || row.review?.status === "Awaiting Review");
    if (view === "review") next = next.filter((row) => row.review?.status === "In Review");
    if (view === "issues") next = next.filter((row) => row.review?.status === "Issues Found");
    if (view === "ready") next = next.filter((row) => row.review?.status === "Ready for Submission" || row.review?.status === "Submitted to Auth");
    return next;
  }, [query, rows, view]);

  const metrics = {
    awaiting: rows.filter((row) => row.missingRecord || row.review?.status === "Awaiting Review").length,
    review: rows.filter((row) => row.review?.status === "In Review").length,
    issues: rows.filter((row) => row.review?.status === "Issues Found").length,
    ready: rows.filter((row) => row.review?.status === "Ready for Submission" || row.review?.status === "Submitted to Auth").length,
    flaggedNotes: monitors.filter((monitor) => monitor.status !== "Resolved" && (monitor.flagged_notes > 0 || monitor.errors_found > 0 || monitor.new_rbt_monitoring)).length,
  };

  const createReview = async (client: Client) => {
    const payload: QAReviewInsert = { client_id: client.id, assigned_qa_owner: "QA Team", assigned_bcba: client.bcba, treatment_plan_submitted_date: todayIso(), treatment_plan_received: client.documents.some((doc) => doc.name.toLowerCase().includes("treatment plan")), next_action: "Review Treatment Plan" };
    const { error } = await supabase.from("client_qa_reviews").insert(payload);
    if (error) { toast.error("Could not create QA record"); return; }
    await addTask(client.id, { id: `qa-${Date.now()}`, title: "Review Treatment Plan", completed: false, dueDate: todayIso() });
    toast.success("QA record created");
    void refetch();
  };

  const updateReview = async (review: QAReview, patch: Database["public"]["Tables"]["client_qa_reviews"]["Update"]) => {
    await supabase.from("client_qa_reviews").update(patch).eq("id", review.id);
    void refetch();
  };

  const startReview = async (item: QAItem) => {
    if (!item.review) return;
    await updateReview(item.review, { status: "In Review", qa_start_date: todayIso(), next_action: "Complete QA checklist" });
    toast.success("QA review started");
  };

  const setOwner = async (review: QAReview, owner: string) => {
    await updateReview(review, { assigned_qa_owner: owner });
    toast.success("QA owner assigned");
  };

  const updateChecklist = async (review: QAReview, key: "treatment_plan_received" | "notes_verified" | "documentation_complete", checked: boolean) => {
    await updateReview(review, { [key]: checked });
  };

  const flagIssues = async (item: QAItem, errorType: QAErrorType) => {
    if (!item.review) return;
    const nextTypes = Array.from(new Set([...item.review.error_types, errorType]));
    await updateReview(item.review, { errors_found: true, error_types: nextTypes, status: "Issues Found", next_action: "Fix Treatment Plan", blockers: Array.from(new Set([...item.review.blockers, errorType])) });
    await addTask(item.client.id, { id: `qa-fix-${Date.now()}`, title: "Fix Treatment Plan", completed: false, dueDate: todayIso() });
    toast.error("QA issues sent back to BCBA");
  };

  const clearIssues = async (item: QAItem) => {
    if (!item.review) return;
    await updateReview(item.review, { errors_found: false, error_types: [], blockers: [], status: "In Review", next_action: "Complete QA checklist" });
    toast.success("Issues cleared — back in review");
  };

  const approveQA = async (item: QAItem) => {
    if (!item.review) return;
    if (!item.review.treatment_plan_received || !item.review.notes_verified || !item.review.documentation_complete || item.review.errors_found) {
      toast.error("QA checklist must pass before auth handoff");
      return;
    }
    await updateReview(item.review, { status: "Ready for Submission", qa_completed_date: todayIso(), next_action: "Submit to Authorization" });
    await updateClient(item.client.id, { stage: "Treatment Auth – Awaiting Submission", qaStatus: "Complete", nextAction: "Submit Treatment Authorization" });
    toast.success("QA approved — treatment auth handoff ready");
  };

  const createMonitoring = async (type: NoteMonitor["monitoring_type"]) => {
    const client = clients.find((c) => c.rbt || c.bcba) ?? clients[0];
    await supabase.from("qa_note_monitoring").insert({ client_id: client?.id, monitoring_type: type, rbt_name: client?.rbt ?? "New RBT", bcba_name: client?.bcba, flagged_notes: type === "RBT Check-In" ? 0 : 1, notes_checked: type === "Amerigroup" ? 12 : 1, errors_found: type === "RBT Check-In" ? 0 : 1, new_rbt_monitoring: type === "RBT Check-In", check_in_due: todayIso(), owner: type === "Amerigroup" ? "Anje" : "QA Team", next_action: type === "RBT Check-In" ? "Check RBT Performance" : "Review Notes" });
    toast.success("Monitoring item created");
    void refetch();
  };

  const resolveMonitor = async (monitor: NoteMonitor) => {
    await supabase.from("qa_note_monitoring").update({ status: "Resolved", next_action: "Closed" }).eq("id", monitor.id);
    toast.success("Monitoring item resolved");
    void refetch();
  };

  return (
    <PageShell title="QA" description="Compliance and quality engine for treatment plans, documentation, notes, RBT monitoring, and auth readiness" icon={ClipboardCheck}>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Metric label="Awaiting Review" value={metrics.awaiting} icon={ClipboardCheck} active={view === "awaiting"} onClick={() => setView("awaiting")} />
        <Metric label="In Review" value={metrics.review} icon={ListChecks} active={view === "review"} onClick={() => setView("review")} />
        <Metric label="Issues Found" value={metrics.issues} icon={FileWarning} active={view === "issues"} onClick={() => setView("issues")} />
        <Metric label="Ready for Auth" value={metrics.ready} icon={ShieldCheck} active={view === "ready"} onClick={() => setView("ready")} />
        <Metric label="Flagged Notes" value={metrics.flaggedNotes} icon={AlertTriangle} active={view === "monitoring"} onClick={() => setView("monitoring")} />
        <Metric label="Performance" value={reviews.length} icon={Gauge} active={view === "performance"} onClick={() => setView("performance")} />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search client, parent, QA owner, BCBA…" className="max-w-md" />
        <Button variant="outline" onClick={() => setView("all")}>All</Button>
        <Button variant="outline" onClick={() => createMonitoring("NoteGuard")}>NoteGuard</Button>
        <Button variant="outline" onClick={() => createMonitoring("Amerigroup")}>Amerigroup Daily</Button>
        <Button variant="outline" onClick={() => createMonitoring("RBT Check-In")}>New RBT</Button>
      </div>

      {view === "monitoring" ? <MonitoringDashboard monitors={monitors} onResolve={resolveMonitor} /> : view === "performance" ? <PerformanceDashboard rows={rows} monitors={monitors} /> : (
        <>
          <section className="grid gap-4 xl:grid-cols-4">
            <QALane title="Awaiting Review" items={filtered.filter((row) => row.missingRecord || row.review?.status === "Awaiting Review")} onOpen={(client) => navigate(`/clients/${client.id}`)} onCreate={createReview} onStart={startReview} onOwner={setOwner} onChecklist={updateChecklist} onIssue={flagIssues} onClear={clearIssues} onApprove={approveQA} />
            <QALane title="In Review" items={filtered.filter((row) => row.review?.status === "In Review")} onOpen={(client) => navigate(`/clients/${client.id}`)} onCreate={createReview} onStart={startReview} onOwner={setOwner} onChecklist={updateChecklist} onIssue={flagIssues} onClear={clearIssues} onApprove={approveQA} />
            <QALane title="Issues Found" items={filtered.filter((row) => row.review?.status === "Issues Found")} onOpen={(client) => navigate(`/clients/${client.id}`)} onCreate={createReview} onStart={startReview} onOwner={setOwner} onChecklist={updateChecklist} onIssue={flagIssues} onClear={clearIssues} onApprove={approveQA} />
            <QALane title="Ready for Submission" items={filtered.filter((row) => row.review?.status === "Ready for Submission" || row.review?.status === "Submitted to Auth")} onOpen={(client) => navigate(`/clients/${client.id}`)} onCreate={createReview} onStart={startReview} onOwner={setOwner} onChecklist={updateChecklist} onIssue={flagIssues} onClear={clearIssues} onApprove={approveQA} />
          </section>
          <QATable items={filtered} onOpen={(client) => navigate(`/clients/${client.id}`)} />
        </>
      )}
    </PageShell>
  );
}

function Metric({ label, value, icon: Icon, active, onClick }: { label: string; value: number; icon: typeof ClipboardCheck; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("rounded-lg border border-border/60 bg-card p-4 text-left transition-colors hover:bg-muted/30", active && "border-primary/40 bg-primary/5")}><div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div><p className="text-2xl font-semibold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></button>;
}

function QALane(props: { title: string; items: QAItem[]; onOpen: (client: Client) => void; onCreate: (client: Client) => void; onStart: (item: QAItem) => void; onOwner: (review: QAReview, owner: string) => void; onChecklist: (review: QAReview, key: "treatment_plan_received" | "notes_verified" | "documentation_complete", checked: boolean) => void; onIssue: (item: QAItem, errorType: QAErrorType) => void; onClear: (item: QAItem) => void; onApprove: (item: QAItem) => void }) {
  return <div className="rounded-lg border border-border/60 bg-card"><div className="flex items-center justify-between border-b border-border/60 px-4 py-3"><h2 className="text-sm font-semibold text-foreground">{props.title}</h2><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{props.items.length}</span></div><div className="min-h-[420px] space-y-3 p-3">{props.items.map((item) => <QACard key={item.review?.id ?? item.client.id} {...props} item={item} />)}{props.items.length === 0 && <p className="py-12 text-center text-xs text-muted-foreground">No QA items</p>}</div></div>;
}

function QACard({ item, onOpen, onCreate, onStart, onOwner, onChecklist, onIssue, onClear, onApprove }: { item: QAItem; onOpen: (client: Client) => void; onCreate: (client: Client) => void; onStart: (item: QAItem) => void; onOwner: (review: QAReview, owner: string) => void; onChecklist: (review: QAReview, key: "treatment_plan_received" | "notes_verified" | "documentation_complete", checked: boolean) => void; onIssue: (item: QAItem, errorType: QAErrorType) => void; onClear: (item: QAItem) => void; onApprove: (item: QAItem) => void }) {
  const alert = alertFor(item);
  const review = item.review;
  return <article className="rounded-md border border-border/60 bg-background p-3"><button type="button" onClick={() => onOpen(item.client)} className="w-full text-left"><div className="flex items-start justify-between gap-2"><div><p className="font-medium text-foreground">{item.client.childName}</p><p className="text-xs text-muted-foreground">{item.client.parentName} · {review?.assigned_bcba ?? item.client.bcba ?? "No BCBA"}</p></div><StatusBadge status={review?.status ?? "Missing QA"} variant={qaVariant(review?.status ?? "Missing QA")} /></div></button>{alert && <p className={cn("mt-3 flex items-center gap-1 rounded-md px-2 py-1.5 text-xs", alert.tone === "red" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}><AlertTriangle className="h-3 w-3" />{alert.message}</p>}<div className="mt-3 grid gap-2 text-xs text-muted-foreground"><div className="flex items-center justify-between"><span>QA owner</span><span className="font-medium text-foreground">{review?.assigned_qa_owner ?? "Unassigned"}</span></div><div className="flex items-center justify-between"><span>Days in QA</span><span className="font-medium text-foreground">{review ? daysBetween(review.qa_start_date ?? review.stage_entered_at) : "—"}</span></div><div className="flex items-center justify-between"><span>Next action</span><span className="max-w-[160px] truncate font-medium text-foreground">{review?.next_action ?? "Create QA record"}</span></div></div>{review && <div className="mt-3 space-y-2 rounded-md border border-border/50 p-2"><Checklist checked={review.treatment_plan_received} label="Treatment plan" onChange={(checked) => onChecklist(review, "treatment_plan_received", checked)} /><Checklist checked={review.notes_verified} label="Notes verified" onChange={(checked) => onChecklist(review, "notes_verified", checked)} /><Checklist checked={review.documentation_complete} label="Docs complete" onChange={(checked) => onChecklist(review, "documentation_complete", checked)} /></div>}<div className="mt-3 flex flex-wrap gap-2">{item.missingRecord && <Button size="sm" variant="outline" onClick={() => onCreate(item.client)}>Create</Button>}{review?.status === "Awaiting Review" && <Button size="sm" variant="outline" onClick={() => onStart(item)}>Start</Button>}{review && <Select value={review.assigned_qa_owner ?? undefined} onValueChange={(owner) => onOwner(review, owner)}><SelectTrigger className="h-8 w-[128px]"><SelectValue placeholder="Owner" /></SelectTrigger><SelectContent>{QA_OWNERS.map((owner) => <SelectItem key={owner} value={owner}>{owner}</SelectItem>)}</SelectContent></Select>}{review && review.status !== "Ready for Submission" && review.status !== "Submitted to Auth" && <Select onValueChange={(error) => onIssue(item, error as QAErrorType)}><SelectTrigger className="h-8 w-[126px]"><SelectValue placeholder="Flag issue" /></SelectTrigger><SelectContent>{ERROR_TYPES.map((error) => <SelectItem key={error} value={error}>{error}</SelectItem>)}</SelectContent></Select>}{review?.status === "Issues Found" && <Button size="sm" variant="outline" onClick={() => onClear(item)}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Fixed</Button>}{review && <Button size="sm" variant="outline" onClick={() => onApprove(item)}><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Approve</Button>}</div></article>;
}

function Checklist({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center gap-2 text-xs text-muted-foreground"><Checkbox checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} /><span>{label}</span></label>;
}

function QATable({ items, onOpen }: { items: QAItem[]; onOpen: (client: Client) => void }) {
  return <div className="overflow-hidden rounded-lg border border-border/60 bg-card"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border bg-muted/30">{["Client", "QA Owner", "BCBA", "Submitted", "Days in QA", "Status", "Alerts"].map((header) => <th key={header} className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">{header}</th>)}</tr></thead><tbody>{items.map((item) => { const alert = alertFor(item); return <tr key={item.review?.id ?? item.client.id} className="border-b border-border/40"><td className="px-3 py-3"><button onClick={() => onOpen(item.client)} className="text-left font-medium text-foreground hover:text-primary">{item.client.childName}</button><p className="text-xs text-muted-foreground">{item.client.parentName}</p></td><td className="px-3 py-3 text-muted-foreground">{item.review?.assigned_qa_owner ?? "—"}</td><td className="px-3 py-3 text-muted-foreground">{item.review?.assigned_bcba ?? item.client.bcba ?? "—"}</td><td className="px-3 py-3 text-muted-foreground">{item.review?.treatment_plan_submitted_date ?? "—"}</td><td className="px-3 py-3 text-muted-foreground">{item.review ? daysBetween(item.review.qa_start_date ?? item.review.stage_entered_at) : "—"}</td><td className="px-3 py-3"><StatusBadge status={item.review?.status ?? "Missing QA"} variant={qaVariant(item.review?.status ?? "Missing QA")} /></td><td className="px-3 py-3">{alert ? <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive"><AlertTriangle className="h-3 w-3" />{alert.message}</span> : <span className="text-xs text-muted-foreground">—</span>}</td></tr>; })}</tbody></table></div>{items.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No QA items match this view</p>}</div>;
}

function MonitoringDashboard({ monitors, onResolve }: { monitors: NoteMonitor[]; onResolve: (monitor: NoteMonitor) => void }) {
  return <section className="grid gap-4 xl:grid-cols-3">{monitors.map((monitor) => <article key={monitor.id} className="rounded-lg border border-border/60 bg-card p-4"><div className="mb-3 flex items-start justify-between gap-2"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">{monitor.new_rbt_monitoring ? <UserCheck className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}</div><div><h2 className="text-sm font-semibold text-foreground">{monitor.monitoring_type}</h2><p className="text-xs text-muted-foreground">{monitor.rbt_name ?? "No RBT"} · {monitor.bcba_name ?? "No BCBA"}</p></div></div><StatusBadge status={monitor.status} variant={monitoringVariant(monitor.status)} /></div><div className="grid grid-cols-3 gap-3 text-sm"><div><p className="text-xl font-semibold text-foreground">{monitor.flagged_notes}</p><p className="text-xs text-muted-foreground">Flagged</p></div><div><p className="text-xl font-semibold text-foreground">{monitor.errors_found}</p><p className="text-xs text-muted-foreground">Errors</p></div><div><p className="text-xl font-semibold text-foreground">{monitor.notes_checked}</p><p className="text-xs text-muted-foreground">Checked</p></div></div><div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>Due {monitor.check_in_due ?? "today"}</span><span>{monitor.owner ?? "QA Team"}</span></div>{monitor.status !== "Resolved" && <Button size="sm" variant="outline" className="mt-3" onClick={() => onResolve(monitor)}>Resolve</Button>}</article>)}{monitors.length === 0 && <p className="rounded-lg border border-border/60 bg-card py-12 text-center text-sm text-muted-foreground xl:col-span-3">No note monitoring records yet</p>}</section>;
}

function PerformanceDashboard({ rows, monitors }: { rows: QAItem[]; monitors: NoteMonitor[] }) {
  const completed = rows.filter((row) => row.review?.qa_completed_date);
  const avgTurnaround = completed.length ? Math.round(completed.reduce((sum, row) => sum + daysBetween(row.review!.qa_start_date ?? row.review!.stage_entered_at) - daysBetween(row.review!.qa_completed_date), 0) / completed.length) : 0;
  const issues = rows.filter((row) => row.review?.errors_found || row.review?.status === "Issues Found").length;
  const reviewed = rows.filter((row) => row.review).length;
  const noteAccuracy = monitors.length ? Math.round(((monitors.reduce((sum, m) => sum + m.notes_checked, 0) - monitors.reduce((sum, m) => sum + m.errors_found, 0)) / Math.max(1, monitors.reduce((sum, m) => sum + m.notes_checked, 0))) * 100) : 100;
  const cards = [
    ["Avg QA Turnaround", `${avgTurnaround}d`],
    ["Items Reviewed", String(reviewed)],
    ["Issues Found", reviewed ? `${Math.round((issues / reviewed) * 100)}%` : "0%"],
    ["Rework Rate", reviewed ? `${Math.round((rows.filter((row) => (row.review?.error_types.length ?? 0) > 0).length / reviewed) * 100)}%` : "0%"],
    ["Note Accuracy", `${noteAccuracy}%`],
    ["Open Monitoring", String(monitors.filter((m) => m.status !== "Resolved").length)],
  ];
  return <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value]) => <article key={label} className="rounded-lg border border-border/60 bg-card p-5"><p className="text-3xl font-semibold text-foreground">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></article>)}</section>;
}
