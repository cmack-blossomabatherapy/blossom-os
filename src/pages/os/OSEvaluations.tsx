import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck, AlertTriangle, CalendarClock, Search, CheckCircle2, Clock,
  Users, ChevronRight,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useOSRole } from "@/contexts/OSRoleContext";
import { ClinicalDirectorSection } from "@/components/clinical/ClinicalDirectorSection";
import { toast } from "@/hooks/use-toast";

type EmployeeRow = {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string;
  state: string;
  status: string;
  next_review_date: string | null;
  last_review_date: string | null;
  hire_date: string | null;
};

type ReviewRow = {
  id: string;
  employee_id: string;
  status: string;
  review_type: string;
  overall_rating: string | null;
  due_date: string | null;
  completed_at: string | null;
};

type Tone = "ok" | "warn" | "crit";
const toneClasses: Record<Tone, string> = {
  ok: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20",
  warn: "bg-amber-500/10 text-amber-700 ring-amber-500/20",
  crit: "bg-destructive/10 text-destructive ring-destructive/20",
};

function daysFromNow(date: string | null) {
  if (!date) return null;
  return Math.floor((new Date(date).getTime() - Date.now()) / 86400000);
}

export default function OSEvaluations() {
  const { activeState, role } = useOSRole();
  const isClinicalDirector = role === "clinical_director";
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "overdue" | "upcoming" | "in_progress" | "complete">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [{ data: ed }, { data: rd }] = await Promise.all([
        supabase
          .from("employees")
          .select("id,first_name,last_name,job_title,state,status,next_review_date,last_review_date,hire_date")
          .eq("status", "active")
          .order("last_name", { ascending: true })
          .limit(1000),
        supabase
          .from("employee_reviews")
          .select("id,employee_id,status,review_type,overall_rating,due_date,completed_at")
          .order("due_date", { ascending: true })
          .limit(2000),
      ]);
      if (!alive) return;
      const isClinicalOnly = role === "qa_team" || role === "bcba" || role === "clinical_director";
      const filtered = (ed ?? []).filter((e: EmployeeRow) => {
        if (activeState && e.state !== activeState) return false;
        if (isClinicalOnly) {
          const t = (e.job_title ?? "").toLowerCase();
          // Restrict QA / BCBA reviewers to clinical staff only (BCBAs and RBTs).
          if (!/\b(bcba|rbt)\b/.test(t)) return false;
        }
        return true;
      });
      setEmployees(filtered);
      setReviews((rd ?? []) as ReviewRow[]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [activeState, role]);

  const enriched = useMemo(() => {
    const byEmp = new Map<string, ReviewRow[]>();
    reviews.forEach((r) => {
      const list = byEmp.get(r.employee_id) ?? [];
      list.push(r);
      byEmp.set(r.employee_id, list);
    });
    return employees.map((e) => {
      const eReviews = byEmp.get(e.id) ?? [];
      const open = eReviews.find((r) => r.status === "in_progress" || r.status === "draft");
      const lastCompleted = eReviews
        .filter((r) => r.status === "completed" || r.status === "acknowledged")
        .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""))[0];
      const dueDays = daysFromNow(e.next_review_date);
      const status: "overdue" | "upcoming" | "in_progress" | "complete" | "none" =
        open ? "in_progress"
        : dueDays !== null && dueDays < 0 ? "overdue"
        : dueDays !== null && dueDays <= 30 ? "upcoming"
        : lastCompleted ? "complete"
        : "none";
      const tone: Tone = status === "overdue" ? "crit" : status === "upcoming" || status === "in_progress" ? "warn" : "ok";
      return { ...e, openReview: open, lastCompleted, dueDays, status, tone };
    });
  }, [employees, reviews]);

  const kpis = useMemo(() => ({
    total: enriched.length,
    overdue: enriched.filter((e) => e.status === "overdue").length,
    upcoming: enriched.filter((e) => e.status === "upcoming").length,
    inProgress: enriched.filter((e) => e.status === "in_progress").length,
    complete: enriched.filter((e) => e.status === "complete").length,
  }), [enriched]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter((e) => {
      const name = `${e.first_name} ${e.last_name}`.toLowerCase();
      if (q && !name.includes(q) && !(e.job_title ?? "").toLowerCase().includes(q)) return false;
      if (filter !== "all" && e.status !== filter) return false;
      return true;
    });
  }, [enriched, search, filter]);

  const selectedEmployee = selectedId ? employees.find((e) => e.id === selectedId) ?? null : null;

  return (
    <OSShell>
        {isClinicalDirector && selectedEmployee && (
          <ClinicalDirectorSection
            sourceType="evaluation"
            sourceRecordId={selectedEmployee.id}
            bcbaName={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
            state={selectedEmployee.state}
            defaultTitle={`Clinical evaluation follow-up: ${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
            metadata={{
              role: selectedEmployee.job_title,
              status: selectedEmployee.status,
              reviewer: null,
              dueDate: selectedEmployee.next_review_date,
              centralReachClientId: null,
            }}
          />
        )}
      <header className="os-rise relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-[hsl(265_100%_98%)] via-white to-[hsl(220_100%_98%)] p-7 shadow-[0_30px_70px_-40px_hsl(265_60%_50%/0.4)]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[hsl(265_70%_70%/0.25)] blur-3xl" />
        <div className="relative">
          <Badge variant="secondary" className="rounded-full bg-white/80 text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(265_70%_45%)]">
            {isClinicalDirector ? "Clinical Director" : "State Director"} · {activeState}
          </Badge>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[32px]">Evaluations</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">
            {isClinicalDirector
              ? "Clinical evaluations for BCBAs and RBTs — supervision readiness, clinical performance, and follow-ups."
              : "Performance reviews for clinical and operational staff — overdue, upcoming, in progress, and completed."}
          </p>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Active staff" value={kpis.total} icon={Users} />
        <Kpi label="Overdue" value={kpis.overdue} icon={AlertTriangle} tone="crit" />
        <Kpi label="Upcoming 30d" value={kpis.upcoming} icon={CalendarClock} tone="warn" />
        <Kpi label="In progress" value={kpis.inProgress} icon={Clock} tone="warn" />
        <Kpi label="Recently complete" value={kpis.complete} icon={CheckCircle2} />
      </section>

      <section className="mt-6 rounded-[24px] border border-foreground/[0.06] bg-white/70 p-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or title…" className="h-9 pl-9" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {([
              ["all", `All (${kpis.total})`],
              ["overdue", `Overdue (${kpis.overdue})`],
              ["upcoming", `Upcoming (${kpis.upcoming})`],
              ["in_progress", `In progress (${kpis.inProgress})`],
              ["complete", "Complete"],
            ] as const).map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition",
                  filter === k ? "bg-foreground text-background" : "bg-foreground/[0.04] text-foreground/70 hover:bg-foreground/[0.08]",
                )}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-foreground/[0.05]">
          <table className="w-full text-[13px]">
            <thead className="bg-foreground/[0.03] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left">Employee</th>
                <th className="px-4 py-2.5 text-left">Role</th>
                <th className="px-4 py-2.5 text-left">Next review</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/[0.05] bg-white/40">
              {loading && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!loading && visible.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No employees match the current filter.</td></tr>
              )}
              {!loading && visible.slice(0, 200).map((e) => (
                <tr key={e.id} className={cn("hover:bg-foreground/[0.02] cursor-pointer", selectedId === e.id && "bg-foreground/[0.04]")}
                  onClick={() => setSelectedId(e.id)}>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">{e.first_name} {e.last_name}</div>
                    <div className="text-[11.5px] text-muted-foreground">{e.state}</div>
                  </td>
                  <td className="px-4 py-2.5">{e.job_title}</td>
                  <td className="px-4 py-2.5">
                    {e.next_review_date ? (
                      <span>
                        {e.next_review_date}
                        {e.dueDays !== null && (
                          <span className={cn("ml-2 text-[11.5px]", e.dueDays < 0 ? "text-destructive" : "text-muted-foreground")}>
                            {e.dueDays < 0 ? `${Math.abs(e.dueDays)}d overdue` : `in ${e.dueDays}d`}
                          </span>
                        )}
                      </span>
                    ) : <span className="text-muted-foreground">Not scheduled</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1", toneClasses[e.tone])}>
                      {e.status === "overdue" ? "Overdue"
                        : e.status === "upcoming" ? "Upcoming"
                        : e.status === "in_progress" ? "In progress"
                        : e.status === "complete" ? "Complete"
                        : "No review yet"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => toast({ title: "Coming soon", description: "Scheduling review flow will be available shortly." })}>
                      Schedule <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </OSShell>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof ClipboardCheck; tone?: Tone }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
        <Icon className={cn("h-4 w-4", tone === "crit" ? "text-destructive" : tone === "warn" ? "text-amber-600" : "text-muted-foreground")} />
      </div>
      <div className="mt-1.5 text-[24px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}