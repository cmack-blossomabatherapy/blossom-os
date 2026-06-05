import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Compass, Users, ArrowRight, Calendar, GraduationCap, Target, BookMarked, Flame, Trophy, LibraryBig } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { loadCurriculum, getMyEnrollment, listProgress, listShadowSessions, listCheckins, computeReadiness, enrollEmployee } from "@/lib/academy/api";
import type { AcademyCurriculum } from "@/lib/academy/api";
import type { AcademyEnrollment, AcademyProgress, AcademyShadowSession, AcademyCheckin, AcademyModule } from "@/lib/academy/types";
import { ReadinessRing } from "@/components/academy/ReadinessRing";
import { RoadmapTimeline } from "@/components/academy/RoadmapTimeline";
import { PhaseBadge } from "@/components/academy/PhaseBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { GlassHero } from "@/components/shared/GlassHero";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { GlassStat } from "@/components/shared/GlassStat";
import { cn } from "@/lib/utils";

export default function AcademyHome() {
  const { user, hasPerm } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<any>(null);
  const [curriculum, setCurriculum] = useState<AcademyCurriculum | null>(null);
  const [enrollment, setEnrollment] = useState<AcademyEnrollment | null>(null);
  const [progress, setProgress] = useState<AcademyProgress[]>([]);
  const [shadows, setShadows] = useState<AcademyShadowSession[]>([]);
  const [checkins, setCheckins] = useState<AcademyCheckin[]>([]);
  const [path, setPath] = useState<"existing_state" | "new_state">("existing_state");

  useEffect(() => { void load(); }, [user?.id]);

  async function load() {
    setLoading(true);
    const cur = await loadCurriculum();
    setCurriculum(cur);
    if (user?.id) {
      const { data: emp } = await supabase.from("employees").select("*").eq("user_id", user.id).maybeSingle();
      setEmployee(emp);
      if (emp) {
        const e = await getMyEnrollment(emp.id);
        setEnrollment(e);
        if (e) {
          const [p, s, c] = await Promise.all([listProgress(e.id), listShadowSessions(e.id), listCheckins(e.id)]);
          setProgress(p); setShadows(s); setCheckins(c);
        }
      }
    }
    setLoading(false);
  }

  async function enroll() {
    if (!employee || !curriculum) return;
    const { error } = await enrollEmployee({ employee_id: employee.id, track_id: curriculum.track.id, path });
    if (error) toast.error(error.message);
    else { toast.success("Enrolled in Operations Academy"); void load(); }
  }

  const flatWeeks = useMemo(() => {
    if (!curriculum) return [];
    return curriculum.phases.flatMap((p) =>
      p.weeks.map((w) => ({ ...w, phaseColor: p.color_token, phaseName: p.name }))
    );
  }, [curriculum]);

  const allModules: AcademyModule[] = useMemo(() => flatWeeks.flatMap((w) => w.modules), [flatWeeks]);

  const readiness = useMemo(() => {
    if (!enrollment) return null;
    const totalShadowHrs = shadows.reduce((a, s) => a + Number(s.hours || 0), 0);
    return computeReadiness({
      modules: allModules, progress, shadowHours: totalShadowHrs, checkins,
      path: enrollment.path === "either" ? "existing_state" : (enrollment.path as any),
    });
  }, [enrollment, allModules, progress, shadows, checkins]);

  const currentWeek = useMemo(() => {
    if (!flatWeeks.length) return null;
    if (enrollment?.current_week_id) return flatWeeks.find((w) => w.id === enrollment.current_week_id) ?? flatWeeks[0];
    // pick first week with incomplete required modules
    const completed = new Set(progress.filter((p) => p.status === "completed").map((p) => p.module_id));
    return flatWeeks.find((w) => w.modules.some((m) => m.is_required && !completed.has(m.id))) ?? flatWeeks[0];
  }, [flatWeeks, enrollment, progress]);

  const phaseForCurrent = useMemo(() => curriculum?.phases.find((p) => p.weeks.some((w) => w.id === currentWeek?.id)), [curriculum, currentWeek]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-48" /><Skeleton className="h-64" /></div>;

  if (!curriculum) {
    return (
      <PageWrap>
        <GlassHero
          eyebrow="Operations Academy"
          eyebrowIcon={Sparkles}
          title="Your academy is almost ready"
          subtitle="The curriculum hasn't been loaded yet. Once your training admin publishes it, your five-week journey will appear here — including welcome, foundations, systems, authorizations, staffing, and leadership."
        />
      </PageWrap>
    );
  }

  // Not enrolled
  if (!enrollment) {
    return (
      <PageWrap>
        <GlassHero
          eyebrow="Operations Academy"
          eyebrowIcon={Sparkles}
          title={curriculum.track.name}
          subtitle={curriculum.track.description}
          right={
            <div className="glass-surface rounded-3xl p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Begin your journey</p>
              <p className="mt-1 text-sm font-medium text-foreground">A five-week guided immersion across systems, departments, leadership, and ownership.</p>
              {employee ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">Choose your track</label>
                    <Select value={path} onValueChange={(v) => setPath(v as any)}>
                      <SelectTrigger className="mt-1 h-10 bg-background/60 backdrop-blur"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="existing_state">Existing State Operations</SelectItem>
                        <SelectItem value="new_state">New State Launch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={enroll} className="w-full gap-2" size="lg">
                    <Sparkles className="h-4 w-4" /> Enroll me
                  </Button>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
                  We can't find an employee record linked to your account yet, so we can't enroll you in the academy.
                  Ping HR (or your training coordinator) and ask them to link your login — once that's done, refresh this page and your journey will appear.
                </div>
              )}
              {hasPerm("hr.training.manage") ? (
                <Link to="/training/academy/leadership" className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                  Leadership cohort dashboard <ArrowRight className="h-3 w-3" />
                </Link>
              ) : (
                <Link to="/hr/resources" className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                  <LibraryBig className="h-3 w-3" /> Browse the Resource Hub <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          }
        />
        <RoadmapPreview curriculum={curriculum} />
      </PageWrap>
    );
  }

  const daysIn = Math.max(0, Math.floor((Date.now() - new Date(enrollment.start_date).getTime()) / 86400000));
  const totalShadowHrs = shadows.reduce((a, s) => a + Number(s.hours || 0), 0);
  const upcomingModules = currentWeek?.modules
    .filter((m) => (m.applies_to === "either" || m.applies_to === enrollment.path) && !progress.find((p) => p.module_id === m.id && p.status === "completed"))
    .slice(0, 4) ?? [];
  const completedModules = progress.filter((p) => p.status === "completed").length;

  return (
    <PageWrap>
      <GlassHero
        eyebrow="Operations Academy"
        eyebrowIcon={Sparkles}
        title="Blossom Operations Academy"
        subtitle="Master the systems, workflows, leadership structure, and operational standards that power Blossom."
        right={
          readiness && (
            <div className="glass-surface flex items-center gap-4 sm:gap-5 rounded-3xl p-4 sm:p-5">
              <ReadinessRing value={readiness.overall} size={108} label="Operational Readiness" />
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Current focus</p>
                {currentWeek && <p className="text-sm font-semibold leading-tight">Week {currentWeek.week_number} · {currentWeek.title}</p>}
                {phaseForCurrent && <PhaseBadge name={phaseForCurrent.name} colorToken={phaseForCurrent.color_token} />}
                <p className="pt-1 text-[11px] text-muted-foreground">Day {daysIn} of program · {enrollment.path === "new_state" ? "New State Launch" : "Existing State"}</p>
              </div>
            </div>
          )
        }
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Day {daysIn}</span>
          {currentWeek && <span className="inline-flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Week {currentWeek.week_number}: {currentWeek.title}</span>}
          <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {enrollment.path === "new_state" ? "New State Launch" : "Existing State"}</span>
        </div>
      </GlassHero>

      {/* Stat strip */}
      <section className="grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-4">
        <GlassStat icon={Target} tone="primary" label="Modules complete" value={completedModules} hint={`of ${allModules.length} total`} />
        <GlassStat icon={Flame} tone="warning" label="Shadow hours" value={totalShadowHrs.toFixed(1)} hint="logged in field" />
        <GlassStat icon={BookMarked} tone="success" label="Check-ins" value={checkins.length} hint="leader sync sessions" />
        <GlassStat icon={Trophy} tone="primary" label="Reflections" value={progress.filter((p) => p.reflection).length} hint="submitted with depth" />
      </section>

      {/* Roadmap */}
      <GlassPanel title="Your roadmap" description="Four weeks. Four phases. One operational standard." icon={Compass}>
        <RoadmapTimeline weeks={flatWeeks} progress={progress} currentWeekId={currentWeek?.id ?? null} />
      </GlassPanel>

      {/* Upcoming */}
      {currentWeek && upcomingModules.length > 0 && (
        <GlassPanel
          title="Up next this week"
          description={`Week ${currentWeek.week_number} — ${currentWeek.title}`}
          icon={ArrowRight}
          actions={
            <Link to={`/training/academy/week/${currentWeek.id}`} className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
              Open week <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {upcomingModules.map((m) => (
              <Link key={m.id} to={`/training/academy/week/${currentWeek.id}`} className="glass-tile group flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{m.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{m.module_type} · {m.duration_label ?? ""} {m.leader_name ? `· ${m.leader_name}` : ""}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </GlassPanel>
      )}
    </PageWrap>
  );
}

function PageWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="aurora-bg -mx-3 -my-3 px-3 py-3 md:-mx-6 md:-my-6 md:px-6 md:py-6 min-h-full">
      <div className="mx-auto max-w-7xl space-y-4 md:space-y-6 animate-fade-in">{children}</div>
    </div>
  );
}

function RoadmapPreview({ curriculum }: { curriculum: AcademyCurriculum }) {
  const flat = curriculum.phases.flatMap((p) => p.weeks.map((w) => ({ ...w, phaseColor: p.color_token, phaseName: p.name })));
  return (
    <GlassPanel title="Curriculum overview" description="A glimpse of every week ahead" icon={Compass}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {flat.map((w) => (
          <div key={w.id} className={cn("glass-tile flex flex-col gap-2")}>
            <PhaseBadge name={w.phaseName} colorToken={w.phaseColor} />
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Week {w.week_number}</p>
            <h3 className="text-sm font-semibold leading-tight text-foreground">{w.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-3 flex-1">{w.objective}</p>
            <p className="pt-1 text-[11px] font-medium text-primary">{w.modules.length} modules</p>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}