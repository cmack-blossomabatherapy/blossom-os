import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, GraduationCap, ArrowRight, CheckCircle2, Circle, ClipboardCheck,
  PlayCircle, FileText, Users, Eye, Pencil, CheckSquare, Award, MessageCircle,
  ExternalLink, Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  AcademyTrack, AcademyPhase, AcademyWeek, AcademyModule,
  AcademyEnrollment, AcademyProgress, AcademyShadowSession, AcademyCheckin,
  AcademyModuleType,
} from "@/lib/academy/types";
import { MODULE_TYPE_META, PHASE_COLORS } from "@/lib/academy/types";
import { OSShell } from "@/pages/os/OSShell";

const TRACK_NAME = "HR Admin Assistant";

interface Competency { id: string; code: string; name: string; description: string | null; position: number; }
interface CompetencyScore { id: string; competency_id: string; score: number; notes: string | null; }
interface Certificate { id: string; code: string; name: string; description: string | null; awarded_after_phase_id: string | null; position: number; }
interface UserCertificate { id: string; certificate_id: string; awarded_at: string; }

interface Curriculum {
  track: AcademyTrack;
  phases: (AcademyPhase & { weeks: (AcademyWeek & { modules: AcademyModule[] })[] })[];
}

const SYSTEM_LINKS = [
  { name: "Viventium",  url: "https://app.viventium.com",        hue: "from-emerald-500 to-emerald-700" },
  { name: "Monday.com", url: "https://monday.com",               hue: "from-violet-500 to-fuchsia-600" },
  { name: "Teams",      url: "https://teams.microsoft.com",      hue: "from-indigo-500 to-blue-600" },
  { name: "Outlook",    url: "https://outlook.office.com",       hue: "from-sky-500 to-blue-600" },
  { name: "SharePoint", url: "https://www.office.com/launch/sharepoint", hue: "from-blue-500 to-cyan-600" },
  { name: "Tapcheck",   url: "https://www.tapcheck.com",         hue: "from-amber-500 to-orange-600" },
  { name: "Jivetel",    url: "https://www.jivetel.com",          hue: "from-rose-500 to-pink-600" },
];

const ICON_FOR_TYPE: Record<AcademyModuleType, React.ComponentType<{ className?: string }>> = {
  training: GraduationCap, video: PlayCircle, sop: FileText, quiz: ClipboardCheck,
  shadowing: Eye, meeting: Users, reflection: Pencil, task: CheckSquare,
};

export default function HRAdminAssistantDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<any>(null);
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [enrollment, setEnrollment] = useState<AcademyEnrollment | null>(null);
  const [progress, setProgress] = useState<AcademyProgress[]>([]);
  const [shadows, setShadows] = useState<AcademyShadowSession[]>([]);
  const [checkins, setCheckins] = useState<AcademyCheckin[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [scores, setScores] = useState<CompetencyScore[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [earnedCerts, setEarnedCerts] = useState<UserCertificate[]>([]);

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  async function load() {
    setLoading(true);
    // Load HR Admin Assistant track + nested curriculum
    const { data: tracks } = await supabase.from("academy_tracks").select("*").eq("name", TRACK_NAME).limit(1);
    const track = tracks?.[0] as AcademyTrack | undefined;
    if (!track) { setLoading(false); return; }

    const [{ data: phases }, { data: weeks }, { data: modules }, { data: comps }, { data: certs }] = await Promise.all([
      supabase.from("academy_phases").select("*").eq("track_id", track.id).order("position"),
      supabase.from("academy_weeks").select("*, phase:academy_phases!inner(track_id)").eq("phase.track_id", track.id).order("week_number"),
      supabase.from("academy_modules").select("*").order("position"),
      supabase.from("academy_competencies").select("*").eq("track_id", track.id).order("position"),
      supabase.from("academy_certificates").select("*").eq("track_id", track.id).order("position"),
    ]);

    const trackWeeks = (weeks ?? []) as any[];
    const trackModulesByWeekId = new Map<string, AcademyModule[]>();
    for (const m of (modules ?? []) as AcademyModule[]) {
      if (trackWeeks.some((w) => w.id === m.week_id)) {
        const arr = trackModulesByWeekId.get(m.week_id) ?? [];
        arr.push(m); trackModulesByWeekId.set(m.week_id, arr);
      }
    }
    const builtPhases = (phases ?? []).map((p: any) => ({
      ...p,
      weeks: trackWeeks
        .filter((w) => w.phase_id === p.id)
        .map((w) => ({ ...w, modules: trackModulesByWeekId.get(w.id) ?? [] })),
    }));
    setCurriculum({ track, phases: builtPhases });
    setCompetencies((comps ?? []) as Competency[]);
    setCertificates((certs ?? []) as Certificate[]);

    if (user?.id) {
      const { data: emp } = await supabase.from("employees").select("*").eq("user_id", user.id).maybeSingle();
      setEmployee(emp);
      if (emp) {
        const { data: enr } = await supabase
          .from("academy_enrollments").select("*")
          .eq("employee_id", emp.id).eq("track_id", track.id).maybeSingle();
        setEnrollment((enr as AcademyEnrollment) ?? null);
        if (enr) {
          const [p, s, c, sc, uc] = await Promise.all([
            supabase.from("academy_progress").select("*").eq("enrollment_id", enr.id),
            supabase.from("academy_shadow_sessions").select("*").eq("enrollment_id", enr.id).order("session_date", { ascending: false }),
            supabase.from("academy_checkins").select("*").eq("enrollment_id", enr.id).order("meeting_date", { ascending: false }),
            supabase.from("academy_competency_scores").select("*").eq("enrollment_id", enr.id),
            supabase.from("academy_user_certificates").select("*").eq("enrollment_id", enr.id),
          ]);
          setProgress((p.data ?? []) as AcademyProgress[]);
          setShadows((s.data ?? []) as AcademyShadowSession[]);
          setCheckins((c.data ?? []) as AcademyCheckin[]);
          setScores((sc.data ?? []) as CompetencyScore[]);
          setEarnedCerts((uc.data ?? []) as UserCertificate[]);
        }
      }
    }
    setLoading(false);
  }

  const completedSet = useMemo(
    () => new Set(progress.filter((p) => p.status === "completed").map((p) => p.module_id)),
    [progress],
  );

  const allModules = useMemo<AcademyModule[]>(
    () => curriculum?.phases.flatMap((p) => p.weeks.flatMap((w) => w.modules)) ?? [],
    [curriculum],
  );
  const requiredCount = allModules.filter((m) => m.is_required).length;
  const doneCount = allModules.filter((m) => m.is_required && completedSet.has(m.id)).length;
  const overallPct = requiredCount === 0 ? 0 : Math.round((doneCount / requiredCount) * 100);

  const currentWeek = useMemo(() => {
    if (!curriculum) return null;
    const weeks = curriculum.phases.flatMap((p) => p.weeks.map((w) => ({ ...w, phaseColor: p.color_token, phaseName: p.name })));
    if (enrollment?.current_week_id) return weeks.find((w) => w.id === enrollment.current_week_id) ?? weeks[0];
    // first incomplete week
    for (const w of weeks) {
      const req = w.modules.filter((m) => m.is_required);
      const done = req.filter((m) => completedSet.has(m.id)).length;
      if (req.length === 0 || done < req.length) return w;
    }
    return weeks[0];
  }, [curriculum, enrollment, completedSet]);

  const todaysTasks = useMemo(() => {
    if (!currentWeek) return [];
    return currentWeek.modules.filter((m) => !completedSet.has(m.id)).slice(0, 4);
  }, [currentWeek, completedSet]);

  const upcomingShadowing = useMemo(
    () => allModules.filter((m) => m.module_type === "shadowing" && !completedSet.has(m.id)).slice(0, 3),
    [allModules, completedSet],
  );
  const assignedSops = useMemo(
    () => allModules.filter((m) => m.module_type === "sop").slice(0, 6),
    [allModules],
  );
  const completedModules = useMemo(
    () => allModules.filter((m) => completedSet.has(m.id)).slice(0, 6),
    [allModules, completedSet],
  );
  const nikkiNotes = useMemo(
    () => checkins.filter((c) => (c.with_name ?? "").toLowerCase().includes("nikki")).slice(0, 3),
    [checkins],
  );

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    employee?.first_name ||
    user?.email?.split("@")[0] ||
    "there";

  async function markComplete(moduleId: string) {
    if (!enrollment) return;
    await supabase.from("academy_progress").upsert(
      { enrollment_id: enrollment.id, module_id: moduleId, status: "completed", completed_at: new Date().toISOString() },
      { onConflict: "enrollment_id,module_id" },
    );
    void load();
  }

  if (loading) {
    return (
      <OSShell>
        <div className="mx-auto w-full max-w-5xl space-y-4 pb-12">
          <Skeleton className="h-44 w-full rounded-3xl" />
          <div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /></div>
        </div>
      </OSShell>
    );
  }

  if (!curriculum || !enrollment) {
    return (
      <OSShell>
        <div className="mx-auto w-full max-w-3xl pb-12">
          <div className="rounded-3xl border border-border/60 bg-card p-8 text-center shadow-sm">
            <GraduationCap className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-3 text-xl font-semibold">HR Admin Assistant onboarding</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You're not enrolled yet. Ask Nikki to assign you to the HR Admin Assistant track.
            </p>
          </div>
        </div>
      </OSShell>
    );
  }

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-5xl space-y-5 pb-16">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)] p-5 text-primary-foreground shadow-lg sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,hsl(var(--primary-foreground)/0.25),transparent_45%),radial-gradient(circle_at_90%_120%,hsl(var(--primary-foreground)/0.18),transparent_50%)]" />
        <div className="relative space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" /> HR Admin Assistant Track
          </div>
          <div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Welcome back, <span className="capitalize">{firstName}</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-primary-foreground/85 sm:text-base">
              {currentWeek ? <>You're on <span className="font-semibold">Week {currentWeek.week_number} — {currentWeek.title}</span>.</> : "Let's get started."} Nikki is here when you need her.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-primary-foreground/10 p-3 backdrop-blur-md">
              <p className="text-2xl font-semibold tabular-nums">{overallPct}%</p>
              <p className="text-[11px] text-primary-foreground/85">Overall progress</p>
              <Progress value={overallPct} className="mt-2 h-1.5 bg-primary-foreground/20" />
            </div>
            <div className="rounded-2xl bg-primary-foreground/10 p-3 backdrop-blur-md">
              <p className="text-2xl font-semibold tabular-nums">{doneCount}/{requiredCount}</p>
              <p className="text-[11px] text-primary-foreground/85">Required modules</p>
            </div>
            <div className="rounded-2xl bg-primary-foreground/10 p-3 backdrop-blur-md">
              <p className="text-2xl font-semibold tabular-nums">{earnedCerts.length}/{certificates.length}</p>
              <p className="text-[11px] text-primary-foreground/85">Certificates earned</p>
            </div>
          </div>
        </div>
      </section>

      {/* TODAY'S TASKS */}
      <Section title="Today's focus" icon={CheckSquare} subtitle={currentWeek ? `${currentWeek.phaseName} · Week ${currentWeek.week_number}` : ""}>
        {todaysTasks.length === 0 ? (
          <EmptyLine text="You're caught up for now. Nice work." />
        ) : (
          <div className="space-y-2">
            {todaysTasks.map((m) => <ModuleRow key={m.id} module={m} done={false} onComplete={() => markComplete(m.id)} />)}
          </div>
        )}
      </Section>

      {/* ROADMAP */}
      <Section title="Onboarding roadmap" icon={GraduationCap} subtitle="Four weeks. One step at a time.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {curriculum.phases.flatMap((p) => p.weeks.map((w) => ({ ...w, phaseName: p.name, color: p.color_token }))).map((w) => {
            const req = w.modules.filter((m) => m.is_required);
            const done = req.filter((m) => completedSet.has(m.id)).length;
            const pct = req.length === 0 ? 0 : Math.round((done / req.length) * 100);
            const isCurrent = w.id === currentWeek?.id;
            const c = PHASE_COLORS[w.color] ?? PHASE_COLORS.primary;
            return (
              <div
                key={w.id}
                className={cn(
                  "relative rounded-2xl border bg-card p-4 shadow-sm transition-all",
                  isCurrent && "ring-2 ring-primary/40",
                  pct === 100 && "shadow-[0_0_0_1px_hsl(var(--primary)/0.4),0_8px_30px_-8px_hsl(var(--primary)/0.4)]",
                )}
              >
                <div className={cn("absolute left-0 top-4 bottom-4 w-1 rounded-r-full", c.bar)} />
                <div className="pl-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Week {w.week_number}</p>
                  <h3 className="mt-0.5 text-[15px] font-semibold leading-tight">{w.title}</h3>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full transition-all", c.bar)} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{done}/{req.length}</span>
                    <span className="tabular-nums">{pct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* CURRENT WEEK MODULES */}
      {currentWeek && (
        <Section title={`Week ${currentWeek.week_number}: ${currentWeek.title}`} icon={ArrowRight} subtitle={currentWeek.objective ?? undefined}>
          <div className="space-y-2">
            {currentWeek.modules.map((m) => (
              <ModuleRow key={m.id} module={m} done={completedSet.has(m.id)} onComplete={() => markComplete(m.id)} />
            ))}
          </div>
        </Section>
      )}

      {/* Two-up: shadowing + SOPs */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Section title="Upcoming shadowing" icon={Eye}>
          {upcomingShadowing.length === 0 ? <EmptyLine text="No shadow sessions scheduled." /> : (
            <ul className="space-y-2">
              {upcomingShadowing.map((m) => (
                <li key={m.id} className="flex items-start gap-2 rounded-xl border bg-card p-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-amber-600" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.title}</p>
                    <p className="text-[11px] text-muted-foreground">{m.duration_label} · with {m.leader_name}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Assigned SOPs" icon={FileText}>
          {assignedSops.length === 0 ? <EmptyLine text="No SOPs yet." /> : (
            <div className="flex flex-wrap gap-1.5">
              {assignedSops.map((m) => (
                <Badge key={m.id} variant={completedSet.has(m.id) ? "default" : "secondary"} className="rounded-full text-[11px]">
                  {completedSet.has(m.id) && <CheckCircle2 className="mr-1 h-3 w-3" />}
                  {m.title}
                </Badge>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Completed */}
      <Section title="Completed modules" icon={CheckCircle2}>
        {completedModules.length === 0 ? (
          <EmptyLine text="Nothing completed yet — your first finish will glow." />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {completedModules.map((m) => (
              <div key={m.id} className="rounded-xl border bg-card p-3 shadow-[0_0_0_1px_hsl(var(--primary)/0.25),0_6px_20px_-8px_hsl(var(--primary)/0.35)]">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.title}</p>
                    <p className="text-[11px] text-muted-foreground">{MODULE_TYPE_META[m.module_type].label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Competencies */}
      <Section title="Competencies" icon={Award} subtitle="Updated by Nikki as you grow.">
        <div className="grid gap-2 sm:grid-cols-2">
          {competencies.map((c) => {
            const s = scores.find((x) => x.competency_id === c.id);
            const v = Math.round(((s?.score ?? 0) / 5) * 100);
            return (
              <div key={c.id} className="rounded-xl border bg-card p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{c.name}</p>
                  <span className="text-xs tabular-nums text-muted-foreground">{(s?.score ?? 0).toFixed(1)} / 5</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${v}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Certificates */}
      <Section title="Certificates" icon={Award} subtitle="Earn one per phase. Final cert: Blossom HR Certified.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => {
            const earned = earnedCerts.some((u) => u.certificate_id === cert.id);
            return (
              <div
                key={cert.id}
                className={cn(
                  "rounded-2xl border p-4 transition-all",
                  earned
                    ? "border-primary/40 bg-card shadow-[0_0_0_1px_hsl(var(--primary)/0.3),0_10px_30px_-12px_hsl(var(--primary)/0.5)]"
                    : "bg-card/60 opacity-80",
                )}
              >
                <div className="flex items-center gap-2">
                  <Award className={cn("h-5 w-5", earned ? "text-primary" : "text-muted-foreground")} />
                  <p className="text-sm font-semibold">{cert.name}</p>
                </div>
                {cert.description && <p className="mt-1.5 text-[11px] text-muted-foreground">{cert.description}</p>}
                <Badge variant={earned ? "default" : "secondary"} className="mt-2 text-[10px]">
                  {earned ? "Earned" : "Locked"}
                </Badge>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Nikki notes */}
      <Section title="Notes from Nikki" icon={MessageCircle} subtitle="Feedback from your check-ins.">
        {nikkiNotes.length === 0 ? <EmptyLine text="No feedback yet — your first check-in is coming up." /> : (
          <div className="space-y-2">
            {nikkiNotes.map((c) => (
              <div key={c.id} className="rounded-xl border bg-card p-3">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{new Date(c.meeting_date).toLocaleDateString()}</span>
                  {c.leader_rating != null && <span>Rating: {c.leader_rating}/5</span>}
                </div>
                {c.notes && <p className="mt-1 text-sm">{c.notes}</p>}
                {c.action_items && <p className="mt-1 text-[12px] text-muted-foreground"><span className="font-medium text-foreground">Action: </span>{c.action_items}</p>}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Quick links */}
      <Section title="Quick system links" icon={ExternalLink}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SYSTEM_LINKS.map((s) => (
            <a
              key={s.name}
              href={s.url} target="_blank" rel="noreferrer"
              className={cn(
                "group relative overflow-hidden rounded-2xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-md",
                "bg-gradient-to-br text-primary-foreground",
                s.hue,
              )}
            >
              <p className="text-sm font-semibold">{s.name}</p>
              <ExternalLink className="absolute right-2 top-2 h-3.5 w-3.5 opacity-70 transition-transform group-hover:translate-x-0.5" />
            </a>
          ))}
        </div>
      </Section>

      <div className="pt-2 text-center">
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link to="/profile">View profile <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
        </Button>
      </div>
      </div>
    </OSShell>
  );
}

function Section({ title, subtitle, icon: Icon, children }: { title: string; subtitle?: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-start gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="text-[12px] text-muted-foreground">{text}</p>;
}

function ModuleRow({ module, done, onComplete }: { module: AcademyModule; done: boolean; onComplete: () => void }) {
  const Icon = ICON_FOR_TYPE[module.module_type] ?? GraduationCap;
  const meta = MODULE_TYPE_META[module.module_type];
  return (
    <div className={cn("flex items-start gap-2 rounded-xl border bg-card p-3 transition-all", done && "opacity-80")}>
      <button
        onClick={onComplete}
        className="mt-0.5 shrink-0"
        aria-label={done ? "Completed" : "Mark complete"}
      >
        {done ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <p className={cn("text-sm font-medium leading-tight", done && "line-through text-muted-foreground")}>{module.title}</p>
        </div>
        {module.description && <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">{module.description}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
          <Badge variant="outline" className={cn("rounded-full px-1.5 py-0 text-[10px]", meta.tone)}>{meta.label}</Badge>
          {module.duration_label && <span>· {module.duration_label}</span>}
          {module.leader_name && <span>· {module.leader_name}</span>}
        </div>
      </div>
    </div>
  );
}