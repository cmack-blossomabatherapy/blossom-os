import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessAdminHub } from "@/lib/adminAccess";
import { DashboardShell, exportCsv } from "@/components/admin/rbt/DashboardShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ExternalLink, CalendarCheck2, ClipboardList, LifeBuoy, Users } from "lucide-react";

interface Trainer { id: string; name: string; }
interface TraineeRow {
  trainee_id: string;
  name: string;
  role_link: string;
  next_event: string | null;
  evals_due: number;
  competencies_due: number;
  first_session_at: string | null;
  open_followups: number;
  open_support: number;
  in_remediation: boolean;
}

function fmt(d: string | null) { return d ? new Date(d).toLocaleString() : "—"; }

export default function RbtTrainerDashboard() {
  const { user, roles } = useAuth();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [rows, setRows] = useState<TraineeRow[] | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<Date>(new Date());
  const [q, setQ] = useState("");

  useEffect(() => { (async () => {
    const { data } = await supabase.from("employees" as any)
      .select("id,full_name,first_name,last_name,job_title")
      .in("job_title", ["Lead RBT","Trainer","Training Lead","BCBA"]).limit(200);
    const list: Trainer[] = ((data as any[]) ?? []).map((e) => ({
      id: e.id, name: e.full_name || [e.first_name,e.last_name].filter(Boolean).join(" ") || "Unknown",
    }));
    setTrainers(list);
    if (list.length && !selected) setSelected(list[0].id);
  })(); }, []);

  const load = async () => {
    if (!selected) return;
    const [fc, evals, comps, fups, help] = await Promise.all([
      supabase.from("rbt_first_case" as any)
        .select("employee_id,start_date,status,bcba_id,lead_rbt_id")
        .or(`lead_rbt_id.eq.${selected},bcba_id.eq.${selected}`),
      supabase.from("rbt_skill_evaluations" as any).select("employee_id,evaluated_at,rating").eq("evaluator_id", selected),
      supabase.from("rbt_competency_records" as any).select("trainee_id,task_status,responsible_assessor,assistant_assessor")
        .or(`responsible_assessor.eq.${selected},assistant_assessor.eq.${selected}`),
      supabase.from("rbt_first_session_bcba_followups" as any).select("employee_id,followup_date,notes").eq("bcba_id", selected),
      supabase.from("rbt_help_requests" as any).select("rbt_employee_id,status,category").eq("assigned_bcba_id", selected).neq("status","resolved").neq("status","closed"),
    ]);
    const cases = (fc.data as any[]) ?? [];
    const traineeIds = Array.from(new Set(cases.map((c) => c.employee_id)));
    const { data: emps } = await supabase.from("employees" as any)
      .select("id,full_name,first_name,last_name").in("id", traineeIds);

    const now = Date.now();
    const built: TraineeRow[] = traineeIds.map((tid) => {
      const e = (emps as any[])?.find((x) => x.id === tid);
      const c = cases.find((x) => x.employee_id === tid);
      const evalsList = ((evals.data as any[]) ?? []).filter((v) => v.employee_id === tid);
      const lastEval = evalsList.sort((a, b) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime())[0];
      const evalsDue = !lastEval || (now - new Date(lastEval.evaluated_at).getTime() > 14 * 86400000) ? 1 : 0;
      const compsList = ((comps.data as any[]) ?? []).filter((v) => v.trainee_id === tid);
      const compsDue = compsList.filter((v) => v.task_status !== "completed").length;
      const fupList = ((fups.data as any[]) ?? []).filter((v) => v.employee_id === tid);
      const openF = fupList.filter((v) => v.followup_date && new Date(v.followup_date).getTime() >= now - 30 * 86400000).length;
      const openH = ((help.data as any[]) ?? []).filter((v) => v.rbt_employee_id === tid).length;
      const remed = compsList.some((v) => v.task_status === "remediation");
      return {
        trainee_id: tid,
        name: e?.full_name || [e?.first_name, e?.last_name].filter(Boolean).join(" ") || "Unknown",
        role_link: `/team/${tid}`,
        next_event: c?.start_date ?? null,
        evals_due: evalsDue,
        competencies_due: compsDue,
        first_session_at: c?.start_date ?? null,
        open_followups: openF,
        open_support: openH,
        in_remediation: remed,
      };
    });
    setRows(built);
    setRefreshedAt(new Date());
  };

  useEffect(() => { void load(); }, [selected]);

  const kpis = useMemo(() => [
    { label: "Assigned trainees", value: rows?.length ?? "—" },
    { label: "Evaluations due", value: rows?.reduce((n, r) => n + r.evals_due, 0) ?? 0, tone: "warn" as const },
    { label: "Competencies due", value: rows?.reduce((n, r) => n + r.competencies_due, 0) ?? 0, tone: "warn" as const },
    { label: "Open follow-ups", value: rows?.reduce((n, r) => n + r.open_followups, 0) ?? 0 },
    { label: "In remediation", value: rows?.filter((r) => r.in_remediation).length ?? 0, tone: "danger" as const },
  ], [rows]);

  if (!canAccessAdminHub(user, roles)) return <Navigate to="/" replace />;

  return (
    <DashboardShell
      title="Trainer & Lead RBT Dashboard"
      subtitle="A trainer's daily worklist — assigned trainees, upcoming events, evaluations, competencies, follow-ups, support requests, and remediation."
      source="rbt_first_case · rbt_skill_evaluations · rbt_competency_records · rbt_help_requests"
      freshness={refreshedAt.toLocaleTimeString()}
      kpis={kpis}
      onRefresh={() => void load()}
      onExport={() => exportCsv("rbt-trainer.csv", (rows ?? []) as any)}
      filters={
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="h-9 w-[260px]"><SelectValue placeholder="Select trainer / Lead RBT" /></SelectTrigger>
          <SelectContent>
            {trainers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      }
      search={{ value: q, onChange: setQ, placeholder: "Search trainee name…" }}
    >
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Trainee</th>
              <th className="px-3 py-3"><CalendarCheck2 className="inline h-3.5 w-3.5" /> First session</th>
              <th className="px-3 py-3"><ClipboardList className="inline h-3.5 w-3.5" /> Evals due</th>
              <th className="px-3 py-3"><Users className="inline h-3.5 w-3.5" /> Competencies due</th>
              <th className="px-3 py-3">Follow-ups</th>
              <th className="px-3 py-3"><LifeBuoy className="inline h-3.5 w-3.5" /> Support</th>
              <th className="px-3 py-3">Remediation</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows === null && (<tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>)}
            {rows !== null && rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No trainees assigned to this trainer. You're clear.</td></tr>
            )}
            {(rows ?? []).filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase())).map((r) => (
              <tr key={r.trainee_id} className="border-b transition-colors hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-3 py-3 text-xs">{fmt(r.first_session_at)}</td>
                <td className="px-3 py-3 text-xs">{r.evals_due}</td>
                <td className="px-3 py-3 text-xs">{r.competencies_due}</td>
                <td className="px-3 py-3 text-xs">{r.open_followups}</td>
                <td className="px-3 py-3 text-xs">{r.open_support}</td>
                <td className="px-3 py-3 text-xs">{r.in_remediation ? <span className="text-red-600">Yes</span> : "—"}</td>
                <td className="px-3 py-3">
                  <Button asChild size="sm" variant="ghost">
                    <Link to={r.role_link} aria-label={`Open ${r.name} profile`}><ExternalLink className="h-3.5 w-3.5" /></Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}