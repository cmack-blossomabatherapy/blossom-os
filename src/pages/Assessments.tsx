import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CalendarCheck, CheckCircle2, ClipboardCheck, FileText, Gauge, Upload, UsersRound } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useClients } from "@/contexts/ClientsContext";
import { Client } from "@/data/clients";
import { canonicalPipelineStage } from "@/data/pipeline";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AssessmentRow = Database["public"]["Tables"]["client_assessments"]["Row"];
type AssessmentInsert = Database["public"]["Tables"]["client_assessments"]["Insert"];
type AssessmentStatus = Database["public"]["Enums"]["assessment_status"];
type AssessmentLocation = Database["public"]["Enums"]["assessment_location"];
type AssessmentDoc = Database["public"]["Tables"]["assessment_documents"]["Row"];
type ViewKey = "all" | "needs" | "scheduled" | "pending" | "overdue" | "performance";
type AssessmentItem = { assessment: AssessmentRow | null; client: Client; missingRecord: boolean };

const todayIso = () => new Date().toISOString().split("T")[0];
const addDays = (date: string, days: number) => {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().split("T")[0];
};
const daysBetween = (date?: string | null) => date ? Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000)) : 0;
const daysUntil = (date?: string | null) => date ? Math.ceil((new Date(date).getTime() - Date.now()) / 86400000) : null;

const assessmentVariant = (status: AssessmentStatus | "Missing Record"): "default" | "success" | "warning" | "destructive" | "info" | "muted" => {
  if (status === "Needs Scheduling") return "info";
  if (status === "Scheduled") return "default";
  if (status === "Completed") return "success";
  if (status === "Treatment Plan Pending") return "warning";
  if (status === "Treatment Plan Submitted") return "success";
  return "destructive";
};

const isAssessmentClient = (client: Client) => {
  const stage = canonicalPipelineStage(client.stage);
  return client.authStatus === "Approved" && ["Schedule Assessment", "Assessment Scheduled", "Assessment Completed", "Treatment Plan Pending", "QA Review"].includes(stage);
};

const alertFor = (item: AssessmentItem, workload: number) => {
  const { assessment, client, missingRecord } = item;
  if (missingRecord) return { tone: "red" as const, message: "Missing assessment record" };
  if (!assessment) return null;
  if (workload > 3 && ["Needs Scheduling", "Scheduled", "Treatment Plan Pending"].includes(assessment.status)) return { tone: "yellow" as const, message: "BCBA workload flag" };
  if (assessment.status === "Needs Scheduling") {
    if (client.daysInStage >= 5) return { tone: "red" as const, message: `Not scheduled ${client.daysInStage}d` };
    if (client.daysInStage >= 3) return { tone: "yellow" as const, message: "Scheduling delay" };
  }
  if (assessment.status === "Scheduled") {
    const until = daysUntil(assessment.scheduled_date);
    if (until !== null && until < 0) return { tone: "red" as const, message: "Assessment overdue" };
  }
  if (assessment.status === "Treatment Plan Pending") {
    const until = daysUntil(assessment.treatment_plan_due_date);
    if (until !== null && until < 0) return { tone: "red" as const, message: "Treatment plan overdue" };
    if (daysBetween(assessment.completed_date) >= 7) return { tone: "yellow" as const, message: "7+ day report delay" };
  }
  return null;
};

export default function Assessments() {
  const navigate = useNavigate();
  const { clients, updateClient, addTask } = useClients();
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [docs, setDocs] = useState<AssessmentDoc[]>([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewKey>("all");

  const refetch = useCallback(async () => {
    const [a, d] = await Promise.all([
      supabase.from("client_assessments").select("*").order("created_at", { ascending: false }),
      supabase.from("assessment_documents").select("*").order("created_at", { ascending: false }),
    ]);
    if (a.error || d.error) {
      console.error("Assessment fetch error", { assessments: a.error, documents: d.error });
      return;
    }
    setAssessments((a.data ?? []) as AssessmentRow[]);
    setDocs((d.data ?? []) as AssessmentDoc[]);
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);
  useEffect(() => {
    const channel = supabase
      .channel("assessments-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "client_assessments" }, () => void refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "assessment_documents" }, () => void refetch())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [refetch]);

  const rows = useMemo<AssessmentItem[]>(() => {
    const clientMap = new Map(clients.map((client) => [client.id, client]));
    const assessmentRows = assessments
      .map((assessment) => ({ assessment, client: clientMap.get(assessment.client_id), missingRecord: false }))
      .filter((row): row is AssessmentItem => Boolean(row.client));
    const assessmentClientIds = new Set(assessments.map((assessment) => assessment.client_id));
    const missing = clients
      .filter((client) => isAssessmentClient(client) && !assessmentClientIds.has(client.id))
      .map((client) => ({ assessment: null, client, missingRecord: true }));
    return [...missing, ...assessmentRows];
  }, [assessments, clients]);

  const workload = useMemo(() => rows.reduce<Record<string, number>>((acc, row) => {
    const bcba = row.assessment?.assigned_bcba ?? row.client.bcba ?? "Unassigned";
    if (!row.assessment || ["Needs Scheduling", "Scheduled", "Treatment Plan Pending"].includes(row.assessment.status)) acc[bcba] = (acc[bcba] ?? 0) + 1;
    return acc;
  }, {}), [rows]);

  const filtered = useMemo(() => {
    let next = rows;
    if (query) {
      const q = query.toLowerCase();
      next = next.filter((row) => row.client.childName.toLowerCase().includes(q) || row.client.parentName.toLowerCase().includes(q) || (row.assessment?.assigned_bcba ?? row.client.bcba ?? "").toLowerCase().includes(q));
    }
    if (view === "needs") next = next.filter((row) => row.missingRecord || row.assessment?.status === "Needs Scheduling");
    if (view === "scheduled") next = next.filter((row) => row.assessment?.status === "Scheduled");
    if (view === "pending") next = next.filter((row) => row.assessment?.status === "Treatment Plan Pending");
    if (view === "overdue") next = next.filter((row) => alertFor(row, workload[row.assessment?.assigned_bcba ?? row.client.bcba ?? "Unassigned"] ?? 0)?.tone === "red");
    return next;
  }, [query, rows, view, workload]);

  const metrics = {
    needs: rows.filter((row) => row.missingRecord || row.assessment?.status === "Needs Scheduling").length,
    scheduled: rows.filter((row) => row.assessment?.status === "Scheduled").length,
    pending: rows.filter((row) => row.assessment?.status === "Treatment Plan Pending").length,
    overdue: rows.filter((row) => alertFor(row, workload[row.assessment?.assigned_bcba ?? row.client.bcba ?? "Unassigned"] ?? 0)?.tone === "red").length,
  };

  const createAssessment = async (client: Client) => {
    const payload: AssessmentInsert = { client_id: client.id, assigned_bcba: client.bcba, assessment_type: "Initial", location: "Clinic", scheduler: client.intakeOwner, qa_owner: "QA / Compliance" };
    const { error } = await supabase.from("client_assessments").insert(payload);
    if (error) { toast.error("Could not create assessment"); return; }
    await addTask(client.id, { id: `assessment-${Date.now()}`, title: "Schedule Assessment", completed: false, dueDate: todayIso() });
    toast.success("Assessment record created");
    void refetch();
  };

  const scheduleAssessment = async (item: AssessmentItem, date: string) => {
    if (!item.assessment) return;
    await supabase.from("client_assessments").update({ scheduled_date: date, status: "Scheduled", next_action: "Confirm Assessment Completion" }).eq("id", item.assessment.id);
    await updateClient(item.client.id, { stage: "Assessment Scheduled", assessmentDate: date, nextAction: "Confirm assessment completion" });
    toast.success("Assessment scheduled");
  };

  const setLocation = async (assessment: AssessmentRow, location: AssessmentLocation) => {
    await supabase.from("client_assessments").update({ location }).eq("id", assessment.id);
    toast.success("Location updated");
  };

  const completeAssessment = async (item: AssessmentItem) => {
    if (!item.assessment) return;
    const completed = todayIso();
    await supabase.from("client_assessments").update({ completed_date: completed, status: "Treatment Plan Pending", treatment_plan_due_date: addDays(completed, 14), next_action: "Complete Treatment Plan" }).eq("id", item.assessment.id);
    await updateClient(item.client.id, { stage: "Treatment Plan Pending", assessmentDate: completed, nextAction: "Complete treatment plan" });
    await addTask(item.client.id, { id: `plan-${Date.now()}`, title: "Complete Treatment Plan", completed: false, dueDate: addDays(completed, 14) });
    toast.success("Treatment plan deadline set");
  };

  const submitTreatmentPlan = async (item: AssessmentItem) => {
    if (!item.assessment) return;
    await supabase.from("client_assessments").update({ treatment_plan_completed_date: todayIso(), status: "Treatment Plan Submitted", next_action: "QA Review" }).eq("id", item.assessment.id);
    await updateClient(item.client.id, { stage: "QA Review", qaStatus: "In Review", nextAction: "QA review treatment plan" });
    await supabase.from("assessment_documents").insert({ assessment_id: item.assessment.id, client_id: item.client.id, document_type: "Treatment Plan", name: "Treatment Plan", version: docs.filter((doc) => doc.assessment_id === item.assessment?.id && doc.document_type === "Treatment Plan").length + 1, qa_visible: true });
    toast.success("Treatment plan submitted to QA");
  };

  return (
    <PageShell title="Assessment" description="Clinical intake engine for scheduling, assessment completion, treatment plan deadlines, and QA handoff" icon={ClipboardCheck}>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Needs Scheduling" value={metrics.needs} icon={CalendarCheck} active={view === "needs"} onClick={() => setView("needs")} />
        <Metric label="Scheduled" value={metrics.scheduled} icon={CheckCircle2} active={view === "scheduled"} onClick={() => setView("scheduled")} />
        <Metric label="Plan Pending" value={metrics.pending} icon={FileText} active={view === "pending"} onClick={() => setView("pending")} />
        <Metric label="Overdue" value={metrics.overdue} icon={AlertTriangle} active={view === "overdue"} onClick={() => setView("overdue")} />
        <Metric label="BCBA Performance" value={Object.keys(workload).length} icon={Gauge} active={view === "performance"} onClick={() => setView("performance")} />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search client, parent, BCBA…" className="max-w-md" />
        <Button variant="outline" onClick={() => setView("all")}>All</Button>
      </div>

      {view === "performance" ? <Performance rows={rows} workload={workload} /> : (
        <>
          <section className="grid gap-4 xl:grid-cols-4">
            <AssessmentLane title="Needs Scheduling" items={filtered.filter((row) => row.missingRecord || row.assessment?.status === "Needs Scheduling")} workload={workload} onOpen={(client) => navigate(`/clients/${client.id}`)} onCreate={createAssessment} onSchedule={scheduleAssessment} onLocation={setLocation} onComplete={completeAssessment} onSubmitPlan={submitTreatmentPlan} />
            <AssessmentLane title="Scheduled" items={filtered.filter((row) => row.assessment?.status === "Scheduled")} workload={workload} onOpen={(client) => navigate(`/clients/${client.id}`)} onCreate={createAssessment} onSchedule={scheduleAssessment} onLocation={setLocation} onComplete={completeAssessment} onSubmitPlan={submitTreatmentPlan} />
            <AssessmentLane title="Treatment Plan Pending" items={filtered.filter((row) => row.assessment?.status === "Treatment Plan Pending")} workload={workload} onOpen={(client) => navigate(`/clients/${client.id}`)} onCreate={createAssessment} onSchedule={scheduleAssessment} onLocation={setLocation} onComplete={completeAssessment} onSubmitPlan={submitTreatmentPlan} />
            <AssessmentLane title="Overdue" items={filtered.filter((row) => alertFor(row, workload[row.assessment?.assigned_bcba ?? row.client.bcba ?? "Unassigned"] ?? 0)?.tone === "red")} workload={workload} onOpen={(client) => navigate(`/clients/${client.id}`)} onCreate={createAssessment} onSchedule={scheduleAssessment} onLocation={setLocation} onComplete={completeAssessment} onSubmitPlan={submitTreatmentPlan} />
          </section>
          <AssessmentTable items={filtered} workload={workload} onOpen={(client) => navigate(`/clients/${client.id}`)} />
        </>
      )}
    </PageShell>
  );
}

function Metric({ label, value, icon: Icon, active, onClick }: { label: string; value: number; icon: typeof ClipboardCheck; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("rounded-lg border border-border/60 bg-card p-4 text-left transition-colors hover:bg-muted/30", active && "border-primary/40 bg-primary/5")}><div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div><p className="text-2xl font-semibold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></button>;
}

function AssessmentLane(props: { title: string; items: AssessmentItem[]; workload: Record<string, number>; onOpen: (client: Client) => void; onCreate: (client: Client) => void; onSchedule: (item: AssessmentItem, date: string) => void; onLocation: (assessment: AssessmentRow, location: AssessmentLocation) => void; onComplete: (item: AssessmentItem) => void; onSubmitPlan: (item: AssessmentItem) => void }) {
  return <div className="rounded-lg border border-border/60 bg-card"><div className="flex items-center justify-between border-b border-border/60 px-4 py-3"><h2 className="text-sm font-semibold text-foreground">{props.title}</h2><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{props.items.length}</span></div><div className="min-h-[360px] space-y-3 p-3">{props.items.map((item) => <AssessmentCard key={item.assessment?.id ?? item.client.id} {...props} item={item} />)}{props.items.length === 0 && <p className="py-12 text-center text-xs text-muted-foreground">No assessments</p>}</div></div>;
}

function AssessmentCard({ item, workload, onOpen, onCreate, onSchedule, onLocation, onComplete, onSubmitPlan }: { item: AssessmentItem; workload: Record<string, number>; onOpen: (client: Client) => void; onCreate: (client: Client) => void; onSchedule: (item: AssessmentItem, date: string) => void; onLocation: (assessment: AssessmentRow, location: AssessmentLocation) => void; onComplete: (item: AssessmentItem) => void; onSubmitPlan: (item: AssessmentItem) => void }) {
  const bcba = item.assessment?.assigned_bcba ?? item.client.bcba ?? "Unassigned";
  const alert = alertFor(item, workload[bcba] ?? 0);
  return <article className="rounded-md border border-border/60 bg-background p-3"><button type="button" onClick={() => onOpen(item.client)} className="w-full text-left"><div className="flex items-start justify-between gap-2"><div><p className="font-medium text-foreground">{item.client.childName}</p><p className="text-xs text-muted-foreground">{item.client.parentName} · {bcba}</p></div><StatusBadge status={item.assessment?.status ?? "Missing Record"} variant={assessmentVariant(item.assessment?.status ?? "Missing Record")} /></div></button>{alert && <p className={cn("mt-3 flex items-center gap-1 rounded-md px-2 py-1.5 text-xs", alert.tone === "red" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}><AlertTriangle className="h-3 w-3" />{alert.message}</p>}<div className="mt-3 grid gap-2 text-xs text-muted-foreground"><div className="flex items-center justify-between"><span>Scheduled</span><span className="font-medium text-foreground">{item.assessment?.scheduled_date ?? "—"}</span></div><div className="flex items-center justify-between"><span>Completed</span><span className="font-medium text-foreground">{item.assessment?.completed_date ?? "—"}</span></div><div className="flex items-center justify-between"><span>Plan due</span><span className="font-medium text-foreground">{item.assessment?.treatment_plan_due_date ?? "—"}</span></div></div><div className="mt-3 flex flex-wrap gap-2">{item.missingRecord && <Button size="sm" variant="outline" onClick={() => onCreate(item.client)}>Create</Button>}{item.assessment && item.assessment.status === "Needs Scheduling" && <Input type="date" className="h-8 w-[142px]" onChange={(event) => event.target.value && onSchedule(item, event.target.value)} />}{item.assessment && <Select value={item.assessment.location} onValueChange={(value) => onLocation(item.assessment!, value as AssessmentLocation)}><SelectTrigger className="h-8 w-[116px]"><SelectValue /></SelectTrigger><SelectContent>{["Home", "School", "Clinic"].map((location) => <SelectItem key={location} value={location}>{location}</SelectItem>)}</SelectContent></Select>}{item.assessment?.status === "Scheduled" && <Button size="sm" variant="outline" onClick={() => onComplete(item)}>Complete</Button>}{item.assessment?.status === "Treatment Plan Pending" && <Button size="sm" variant="outline" onClick={() => onSubmitPlan(item)}><Upload className="mr-1.5 h-3.5 w-3.5" />Submit plan</Button>}</div></article>;
}

function AssessmentTable({ items, workload, onOpen }: { items: AssessmentItem[]; workload: Record<string, number>; onOpen: (client: Client) => void }) {
  return <div className="overflow-hidden rounded-lg border border-border/60 bg-card"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border bg-muted/30">{["Client", "BCBA", "Scheduled Date", "Completed Date", "Days to Report", "Status", "Alerts"].map((header) => <th key={header} className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">{header}</th>)}</tr></thead><tbody>{items.map((item) => { const bcba = item.assessment?.assigned_bcba ?? item.client.bcba ?? "Unassigned"; const alert = alertFor(item, workload[bcba] ?? 0); const daysToReport = item.assessment?.completed_date ? (item.assessment.treatment_plan_completed_date ? daysBetween(item.assessment.completed_date) - daysBetween(item.assessment.treatment_plan_completed_date) : daysBetween(item.assessment.completed_date)) : null; return <tr key={item.assessment?.id ?? item.client.id} className="border-b border-border/40"><td className="px-3 py-3"><button onClick={() => onOpen(item.client)} className="text-left font-medium text-foreground hover:text-primary">{item.client.childName}</button><p className="text-xs text-muted-foreground">{item.client.parentName}</p></td><td className="px-3 py-3 text-muted-foreground">{bcba}</td><td className="px-3 py-3 text-muted-foreground">{item.assessment?.scheduled_date ?? "—"}</td><td className="px-3 py-3 text-muted-foreground">{item.assessment?.completed_date ?? "—"}</td><td className="px-3 py-3 text-muted-foreground">{daysToReport ?? "—"}</td><td className="px-3 py-3"><StatusBadge status={item.assessment?.status ?? "Missing Record"} variant={assessmentVariant(item.assessment?.status ?? "Missing Record")} /></td><td className="px-3 py-3">{alert ? <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs", alert.tone === "red" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}><AlertTriangle className="h-3 w-3" />{alert.message}</span> : <span className="text-xs text-muted-foreground">—</span>}</td></tr>; })}</tbody></table></div>{items.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No assessments match this view</p>}</div>;
}

function Performance({ rows, workload }: { rows: AssessmentItem[]; workload: Record<string, number> }) {
  const bcbas = Object.keys(workload).sort();
  return <section className="grid gap-4 xl:grid-cols-3">{bcbas.map((bcba) => { const owned = rows.filter((row) => (row.assessment?.assigned_bcba ?? row.client.bcba ?? "Unassigned") === bcba); const completed = owned.filter((row) => row.assessment?.completed_date && row.assessment?.treatment_plan_completed_date); const avg = completed.length ? Math.round(completed.reduce((sum, row) => sum + Math.max(0, new Date(row.assessment!.treatment_plan_completed_date!).getTime() - new Date(row.assessment!.completed_date!).getTime()) / 86400000, 0) / completed.length) : 0; const delayed = owned.filter((row) => row.assessment?.status === "Treatment Plan Pending" && (daysUntil(row.assessment.treatment_plan_due_date) ?? 0) < 0).length; const onTime = completed.length ? Math.round((completed.filter((row) => new Date(row.assessment!.treatment_plan_completed_date!).getTime() <= new Date(row.assessment!.treatment_plan_due_date!).getTime()).length / completed.length) * 100) : 100; return <article key={bcba} className="rounded-lg border border-border/60 bg-card p-4"><div className="mb-3 flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><UsersRound className="h-4 w-4" /></div><div><h2 className="text-sm font-semibold text-foreground">{bcba}</h2><p className="text-xs text-muted-foreground">{owned.length} assessment records</p></div></div><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-2xl font-semibold text-foreground">{workload[bcba]}</p><p className="text-xs text-muted-foreground">Active</p></div><div><p className="text-2xl font-semibold text-foreground">{avg}d</p><p className="text-xs text-muted-foreground">Avg report time</p></div><div><p className="text-2xl font-semibold text-foreground">{onTime}%</p><p className="text-xs text-muted-foreground">On time</p></div><div><p className="text-2xl font-semibold text-foreground">{delayed}</p><p className="text-xs text-muted-foreground">Delayed reports</p></div></div></article>; })}</section>;
}
