import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Compass, Users, ArrowRight, Calendar, GraduationCap } from "lucide-react";
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

  if (!curriculum) return <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">Academy curriculum not yet seeded.</div>;

  // Not enrolled
  if (!enrollment) {
    return (
      <div className="space-y-6">
        <Hero curriculum={curriculum} />
        <div className="rounded-2xl border bg-card p-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-xl font-semibold tracking-tight">Begin your academy journey</h2>
            <p className="mt-2 text-sm text-muted-foreground">A 5-week guided immersion across systems, departments, leadership, and ownership.</p>
            {employee ? (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-muted-foreground">Track:</span>
                  <Select value={path} onValueChange={(v) => setPath(v as any)}>
                    <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="existing_state">Existing State Operations</SelectItem>
                      <SelectItem value="new_state">New State Launch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={enroll}><Sparkles className="h-4 w-4" /> Enroll me</Button>
              </div>
            ) : (
              <p className="mt-6 text-xs text-muted-foreground">No employee record linked to your account. Ask HR to link your login.</p>
            )}
            {hasPerm("hr.training.view") && (
              <div className="mt-8 border-t pt-6">
                <Link to="/training/academy/leadership" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  Open leadership cohort dashboard <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
        <RoadmapPreview curriculum={curriculum} />
      </div>
    );
  }

  const daysIn = Math.max(0, Math.floor((Date.now() - new Date(enrollment.start_date).getTime()) / 86400000));
  const totalShadowHrs = shadows.reduce((a, s) => a + Number(s.hours || 0), 0);
  const upcomingModules = currentWeek?.modules
    .filter((m) => (m.applies_to === "either" || m.applies_to === enrollment.path) && !progress.find((p) => p.module_id === m.id && p.status === "completed"))
    .slice(0, 4) ?? [];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.18),_transparent_60%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" /> Operations Academy
              </span>
              {phaseForCurrent && <PhaseBadge name={phaseForCurrent.name} colorToken={phaseForCurrent.color_token} />}
            </div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">Blossom Operations Academy</h1>
            <p className="text-sm text-muted-foreground">Master the systems, workflows, leadership structure, and operational standards that power Blossom.</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <span><Calendar className="inline h-3 w-3 mr-1" /> Day {daysIn} of program</span>
              {currentWeek && <span><GraduationCap className="inline h-3 w-3 mr-1" /> Week {currentWeek.week_number}: {currentWeek.title}</span>}
              <span><Users className="inline h-3 w-3 mr-1" /> Path: {enrollment.path === "new_state" ? "New State Launch" : "Existing State"}</span>
            </div>
          </div>
          {readiness && <ReadinessRing value={readiness.overall} size={120} label="Operational Readiness" />}
        </div>
      </section>

      {/* Stat strip */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Modules complete" value={progress.filter((p) => p.status === "completed").length} suffix={` / ${allModules.length}`} />
        <Stat label="Shadow hours" value={totalShadowHrs.toFixed(1)} />
        <Stat label="Check-ins logged" value={checkins.length} />
        <Stat label="Reflections submitted" value={progress.filter((p) => p.reflection).length} />
      </section>

      {/* Roadmap */}
      <section>
        <SectionHeader title="Your roadmap" subtitle="Five weeks. Four phases. One operational standard." icon={Compass} />
        <RoadmapTimeline weeks={flatWeeks} progress={progress} currentWeekId={currentWeek?.id ?? null} />
      </section>

      {/* Upcoming */}
      {currentWeek && upcomingModules.length > 0 && (
        <section className="rounded-2xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight">Up next this week</h2>
            <Link to={`/training/academy/week/${currentWeek.id}`} className="text-xs text-primary hover:underline inline-flex items-center gap-1">Open week <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {upcomingModules.map((m) => (
              <Link key={m.id} to={`/training/academy/week/${currentWeek.id}`} className="flex items-center justify-between rounded-xl border bg-muted/20 px-3 py-2 hover:bg-muted/40">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{m.module_type} · {m.duration_label ?? ""} {m.leader_name ? `· ${m.leader_name}` : ""}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}<span className="text-sm font-normal text-muted-foreground">{suffix}</span></p>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon: any }) {
  return (
    <div className="mb-3 flex items-start gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-3.5 w-3.5" /></span>
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function Hero({ curriculum }: { curriculum: AcademyCurriculum }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.18),_transparent_60%)]" />
      <div className="relative max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-primary">
          <Sparkles className="h-3 w-3" /> Operations Academy
        </span>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight">{curriculum.track.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{curriculum.track.description}</p>
      </div>
    </section>
  );
}

function RoadmapPreview({ curriculum }: { curriculum: AcademyCurriculum }) {
  const flat = curriculum.phases.flatMap((p) => p.weeks.map((w) => ({ ...w, phaseColor: p.color_token, phaseName: p.name })));
  return (
    <section>
      <h2 className="mb-3 text-[15px] font-semibold tracking-tight">Curriculum overview</h2>
      <div className="grid gap-4 lg:grid-cols-5">
        {flat.map((w) => (
          <div key={w.id} className="rounded-2xl border bg-card p-4">
            <PhaseBadge name={w.phaseName} colorToken={w.phaseColor} />
            <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">Week {w.week_number}</p>
            <h3 className="mt-1 text-sm font-semibold leading-tight">{w.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{w.objective}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">{w.modules.length} modules</p>
          </div>
        ))}
      </div>
    </section>
  );
}