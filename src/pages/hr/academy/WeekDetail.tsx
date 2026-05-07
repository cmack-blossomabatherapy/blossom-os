import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { loadCurriculum, getMyEnrollment, listProgress } from "@/lib/academy/api";
import type { AcademyEnrollment, AcademyModule, AcademyProgress, AcademyWeek } from "@/lib/academy/types";
import { ModuleCard } from "@/components/academy/ModuleCard";
import { PhaseBadge } from "@/components/academy/PhaseBadge";
import { ShadowSessionDialog } from "@/components/academy/ShadowSessionDialog";
import { CheckinDialog } from "@/components/academy/CheckinDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function WeekDetail() {
  const { weekId } = useParams<{ weekId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState<(AcademyWeek & { modules: AcademyModule[] }) | null>(null);
  const [phaseInfo, setPhaseInfo] = useState<{ name: string; color_token: string } | null>(null);
  const [enrollment, setEnrollment] = useState<AcademyEnrollment | null>(null);
  const [progress, setProgress] = useState<AcademyProgress[]>([]);
  const [shadowOpen, setShadowOpen] = useState<{ moduleId?: string; suggested?: string; dept?: string } | null>(null);
  const [checkinOpen, setCheckinOpen] = useState<{ moduleId?: string; suggested?: string } | null>(null);

  useEffect(() => { void load(); }, [weekId, user?.id]);

  async function load() {
    setLoading(true);
    const cur = await loadCurriculum();
    if (cur) {
      for (const p of cur.phases) {
        const w = p.weeks.find((x) => x.id === weekId);
        if (w) { setWeek(w); setPhaseInfo({ name: p.name, color_token: p.color_token }); break; }
      }
    }
    if (user?.id) {
      const { data: emp } = await supabase.from("employees").select("id").eq("user_id", user.id).maybeSingle();
      if (emp) {
        const e = await getMyEnrollment(emp.id);
        setEnrollment(e);
        if (e) setProgress(await listProgress(e.id));
      }
    }
    setLoading(false);
  }

  const filteredModules = useMemo(() => {
    if (!week || !enrollment) return week?.modules ?? [];
    return week.modules.filter((m) => m.applies_to === "either" || m.applies_to === enrollment.path);
  }, [week, enrollment]);

  async function refresh() {
    if (enrollment) setProgress(await listProgress(enrollment.id));
  }

  if (loading) return <Skeleton className="h-96" />;
  if (!week) return <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">Week not found.</div>;

  const completedCount = filteredModules.filter((m) => progress.find((p) => p.module_id === m.id && p.status === "completed")).length;

  return (
    <div className="space-y-6">
      <Link to="/training/academy" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to academy
      </Link>

      <section className="rounded-2xl border bg-card p-6">
        <div className="flex flex-wrap items-center gap-2">
          {phaseInfo && <PhaseBadge name={phaseInfo.name} colorToken={phaseInfo.color_token} />}
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Week {week.week_number}</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{week.title}</h1>
        {week.objective && <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{week.objective}</p>}
        {week.outcomes.length > 0 && (
          <div className="mt-4 rounded-xl border bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Target className="h-3 w-3" /> By the end of this week
            </div>
            <ul className="mt-2 grid gap-1.5 text-sm md:grid-cols-2">
              {week.outcomes.map((o, i) => (
                <li key={i} className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" /> <span>{o}</span></li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{completedCount} / {filteredModules.length} complete</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${filteredModules.length ? (completedCount/filteredModules.length)*100 : 0}%` }} />
          </div>
        </div>
      </section>

      {!enrollment && (
        <div className="rounded-xl border bg-amber-500/5 border-amber-500/30 p-4 text-sm text-amber-700 dark:text-amber-400">
          You're not enrolled in the academy yet. <Link to="/training/academy" className="underline">Enroll here</Link>.
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {filteredModules.map((m) => (
          <ModuleCard
            key={m.id}
            module={m}
            progress={progress.find((p) => p.module_id === m.id)}
            enrollmentId={enrollment?.id ?? ""}
            readOnly={!enrollment}
            onShadow={() => setShadowOpen({ moduleId: m.id, suggested: m.leader_name ?? undefined, dept: m.department ?? undefined })}
            onCheckin={() => setCheckinOpen({ moduleId: m.id, suggested: m.leader_name ?? undefined })}
            onChange={refresh}
          />
        ))}
      </div>

      {enrollment && shadowOpen && (
        <ShadowSessionDialog
          open={!!shadowOpen} onOpenChange={(v) => !v && setShadowOpen(null)}
          enrollmentId={enrollment.id} moduleId={shadowOpen.moduleId}
          suggestedName={shadowOpen.suggested} suggestedDept={shadowOpen.dept}
          onSaved={refresh}
        />
      )}
      {enrollment && checkinOpen && (
        <CheckinDialog
          open={!!checkinOpen} onOpenChange={(v) => !v && setCheckinOpen(null)}
          enrollmentId={enrollment.id} moduleId={checkinOpen.moduleId}
          suggestedWith={checkinOpen.suggested}
          onSaved={refresh}
        />
      )}
    </div>
  );
}