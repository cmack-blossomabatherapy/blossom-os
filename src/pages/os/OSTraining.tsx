import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useOSRole } from "@/contexts/OSRoleContext";
import {
  Search, Clock, ArrowRight, Sparkles, Play, FileText, Workflow as WorkflowIcon,
  CheckCircle2, BookOpen, ChevronRight, BookMarked, Library, AlertCircle,
  MonitorCog, Compass, Settings2, Inbox, ShieldCheck, MessageSquare, GraduationCap,
  PlayCircle, Heart, Users as UsersIcon, Lightbulb,
} from "lucide-react";
import {
  useAcademy, getProgress, continueLearning, requiredDue,
  systemsTrainings, sharedTrainings, searchTrainings,
  getJourneyForRole, getJourneyModules, ICONS,
  recentlyAdded, requiredForDepartment,
  type Training, type TrainingType,
} from "@/lib/training/academyData";
import { SDJourneyView } from "@/components/training/SDJourneyView";
import { SDLearnerHome } from "@/components/training/SDLearnerHome";
import {
  loadLearnerHome,
  startLearnerModule,
  completeLearnerModule,
  emptyLearnerHome,
  type LearnerHome,
} from "@/lib/academy/learnerHome";
import { toast } from "sonner";

const TYPE_ICON: Record<TrainingType, typeof FileText> = {
  SOP: FileText,
  Workflow: WorkflowIcon,
  Tango: Play,
  Video: Play,
  Checklist: CheckCircle2,
  "Quick Guide": BookOpen,
  Training: GraduationCap,
  Task: CheckCircle2,
  Meeting: MessageSquare,
  Shadowing: Compass,
  Quiz: BookMarked,
  Reflection: BookOpen,
};

/** Map a role to its primary department for required-module scoping. */
const ROLE_DEPARTMENT: Record<string, string> = {
  intake_coordinator: "intake",
  authorization_coordinator: "authorizations",
  scheduling_team: "scheduling",
  qa_team: "qa",
  recruiting_team: "recruiting",
  bcba: "clinical",
  rbt: "clinical",
  hr_team: "hr",
  billing_finance: "billing",
  case_manager: "case_management",
};

export default function OSTraining() {
  const navigate = useNavigate();
  const { role } = useOSRole();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>("");
  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setDisplayName((data?.display_name as string) ?? ""));
  }, [user?.id]);
  const firstName = (displayName || user?.email?.split("@")[0] || "there").split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const [query, setQuery] = useState("");
  const [showAllRequired, setShowAllRequired] = useState(false);
  const { trainings } = useAcademy(); // subscribe to store

  const isSD = role === "state_director";

  // --- DB-backed learner home (shared with Training Management) ---
  const [learnerHome, setLearnerHome] = useState<LearnerHome>(() => emptyLearnerHome());
  const [learnerLoading, setLearnerLoading] = useState<boolean>(false);
  const [actionBusy, setActionBusy] = useState<"start" | "complete" | null>(null);

  const refreshLearnerHome = async () => {
    if (!user?.id) return;
    setLearnerLoading(true);
    try {
      const home = await loadLearnerHome(user.id);
      setLearnerHome(home);
    } catch {
      // non-fatal: fall back to local academyData path
    } finally {
      setLearnerLoading(false);
    }
  };

  useEffect(() => {
    refreshLearnerHome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const hasDbEnrollment = !!learnerHome.enrollment;
  const dbNextModule = learnerHome.nextAction?.module ?? null;

  async function onStartDbNext() {
    if (!learnerHome.enrollment || !dbNextModule) return;
    setActionBusy("start");
    const res = await startLearnerModule(learnerHome.enrollment.id, dbNextModule.id);
    setActionBusy(null);
    if ((res as any)?.error) toast.error("Could not start module");
    else { toast.success("Module started — visible in Training Management"); await refreshLearnerHome(); }
  }
  async function onCompleteDbNext() {
    if (!learnerHome.enrollment || !dbNextModule) return;
    setActionBusy("complete");
    const res = await completeLearnerModule(learnerHome.enrollment.id, dbNextModule.id);
    setActionBusy(null);
    if ((res as any)?.error) toast.error("Could not complete module");
    else { toast.success("Module completed — synced to Training Management"); await refreshLearnerHome(); }
  }

  const journey = useMemo(() => getJourneyForRole(role), [role, trainings]);
  const journeyModules = useMemo(() => getJourneyModules(journey), [journey, trainings]);
  // Continue Learning = next-up modules from the user's role journey that aren't completed.
  // Falls back to in-progress/overdue items if the journey is empty.
  const cont = useMemo(() => {
    const fromJourney = journeyModules
      .map((training) => ({ training, progress: getProgress(training.id) }))
      .filter(({ progress }) => progress.status !== "completed");
    if (fromJourney.length > 0) return fromJourney;
    return continueLearning();
  }, [journeyModules, trainings]);
  const department = ROLE_DEPARTMENT[role];
  const requiredRole = useMemo(
    () => (department ? requiredForDepartment(department) : requiredDue()),
    [department, trainings],
  );
  const visibleRequired = useMemo(() => (showAllRequired ? requiredRole : requiredRole.slice(0, 6)), [showAllRequired, requiredRole]);
  const hasMoreRequired = requiredRole.length > 6;
  const required = useMemo(requiredDue, [trainings]);
  const systems = useMemo(systemsTrainings, [trainings]);
  const shared = useMemo(sharedTrainings, [trainings]);
  const recent = useMemo(() => recentlyAdded(4), [trainings]);
  const searchResults = useMemo(() => (query ? searchTrainings(query) : []), [query, trainings]);
  const JourneyIcon = ICONS[journey.icon] ?? BookOpen;

  // Role mastery
  const mastery = useMemo(() => {
    if (!journeyModules.length) return { pct: 0, done: 0, total: 0, nextId: undefined as string | undefined };
    const completedIds = journeyModules.filter((m) => getProgress(m.id).status === "completed");
    const nextModule = journeyModules.find((m) => getProgress(m.id).status !== "completed");
    const sum = journeyModules.reduce((s, m) => s + getProgress(m.id).progressPercent, 0);
    return {
      pct: Math.round(sum / journeyModules.length),
      done: completedIds.length,
      total: journeyModules.length,
      nextId: nextModule?.id,
    };
  }, [journeyModules]);

  // Overall progress (all modules)
  const overall = useMemo(() => {
    if (!trainings.length) return { avg: 0, requiredDone: 0, requiredTotal: 0, overdue: 0 };
    const all = trainings.map((t) => getProgress(t.id));
    const avg = Math.round(all.reduce((s, p) => s + p.progressPercent, 0) / all.length);
    return {
      avg,
      requiredDone: trainings.filter((t) => t.required && getProgress(t.id).status === "completed").length,
      requiredTotal: trainings.filter((t) => t.required).length,
      overdue: all.filter((p) => p.status === "overdue").length,
    };
  }, [trainings]);

  // Launch-scoped progress for State Director: only the journey modules count,
  // never the global "133 required" pile that anxiety-builds new hires.
  const launch = useMemo(() => {
    if (!journeyModules.length) return { done: 0, total: 0, pct: 0 };
    const done = journeyModules.filter((m) => getProgress(m.id).status === "completed").length;
    return {
      done,
      total: journeyModules.length,
      pct: Math.round((done / journeyModules.length) * 100),
    };
  }, [journeyModules]);

  const nextModule = mastery.nextId ? journeyModules.find((m) => m.id === mastery.nextId) : undefined;

  return (
    <OSShell>
      {isSD ? (
        <SDLearnerHome firstName={firstName} trainings={journeyModules} learnerHome={learnerHome} />
      ) : (
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-12">
          {/* HERO */}
          <header className={cn(
            "relative overflow-hidden",
            isSD && "rounded-3xl border border-border/60 bg-gradient-to-br from-primary/[0.06] via-card to-card p-6 md:p-8 shadow-sm",
          )}>
            {isSD && (
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden />
            )}
            <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span>Training Academy</span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                  <span className="capitalize">{role.replace(/_/g, " ")}</span>
                </div>
                <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-foreground md:text-[30px]">
                  {isSD ? "Welcome back" : greeting}, <span className="capitalize">{firstName}</span>.
                </h1>
                <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
                  {isSD
                    ? "Your first job is to get grounded. Start with Welcome to Blossom, then follow the launch path one step at a time. Your mentor and leadership can see your progress — you're not doing this alone."
                    : overall.avg >= 80
                    ? "You're nearly there — finish your remaining modules to complete your role journey."
                    : overall.avg > 0
                    ? `You're ${overall.avg}% through your training. Let's keep moving.`
                    : "Welcome to the Blossom Academy. Start with your role journey below."}
                </p>
              </div>
              {isSD && (
                <div className="grid grid-cols-3 gap-2 md:w-[320px] shrink-0">
                  <HeroStat label="Week" value={SDWeekLabel(launch.done, launch.total)} />
                  <HeroStat label="Launch" value={`${launch.pct}%`} />
                  <HeroStat label="Mentor" value="Assigned" />
                </div>
              )}
            </div>

            <div className="relative mt-5 max-w-xl">
              <Search className="pointer-events-none absolute z-10 left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search SOPs, workflows, trainings…"
                className="os-glass-input h-11 rounded-2xl pl-11 text-[13.5px]"
              />
              {query && (
                <div className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-border/60 bg-card shadow-xl">
                  {searchResults.length === 0 ? (
                    <p className="px-4 py-6 text-center text-[12px] text-muted-foreground">
                      No matches. Try a workflow, system, or SOP name.
                    </p>
                  ) : (
                    searchResults.slice(0, 8).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => navigate(`/training/${t.id}`)}
                        className="flex w-full items-center justify-between gap-3 border-b border-border/40 px-4 py-3 text-left last:border-b-0 hover:bg-muted/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium">{t.title}</p>
                          <p className="truncate text-[11px] text-muted-foreground capitalize">
                            {t.type} · {t.department}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {nextModule ? (
                <Button
                  size="sm"
                  className="rounded-full"
                  onClick={() => navigate(`/training/${nextModule.id}`)}
                >
                  <Play className="mr-1.5 h-3.5 w-3.5" /> Continue Learning
                </Button>
              ) : (
                <Button size="sm" className="rounded-full" onClick={() => navigate("/resource-library")}>
                  <Library className="mr-1.5 h-3.5 w-3.5" /> Open Resource Library
                </Button>
              )}
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => navigate("/training/welcome")}>
                <GraduationCap className="mr-1.5 h-3.5 w-3.5" /> Welcome to Blossom
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => navigate("/resource-library")}>
                <BookMarked className="mr-1.5 h-3.5 w-3.5" /> Resource Library
              </Button>
              {role === "super_admin" && (
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => navigate("/training/manage")}>
                  <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Manage Journeys
                </Button>
              )}
            </div>
          </header>

          {/* WELCOME TO BLOSSOM — first emotional anchor */}
          {isSD && <WelcomeAnchor onOpen={() => navigate("/training/welcome")} />}

          {/* DB-BACKED LAUNCH TRACKER — only when a real enrollment exists.
              Source of truth shared with Training Management / Leadership Dashboard. */}
          {isSD && hasDbEnrollment && (
            <section data-testid="sd-db-launch-tracker">
              <div className="rounded-3xl border border-border/70 bg-card p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Live launch tracker · synced with leadership
                    </p>
                    <h3 className="mt-1 text-[18px] font-semibold tracking-tight">
                      Week {learnerHome.currentWeek?.week_number ?? "—"} · {learnerHome.currentWeek?.title ?? "Getting started"}
                    </h3>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      {learnerHome.launchProgress.requiredCompleted} of {learnerHome.launchProgress.requiredTotal} launch modules complete
                      {learnerHome.readiness ? <> · Readiness {Math.round(learnerHome.readiness.overall)}%</> : null}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Launch</p>
                    <p className="text-[24px] font-semibold tabular-nums">{learnerHome.launchProgress.pct}%</p>
                  </div>
                </div>
                <Progress value={learnerHome.launchProgress.pct} className="mt-4 h-1.5" />

                {dbNextModule ? (
                  <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/[0.04] p-4">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      <ArrowRight className="h-3 w-3" /> Next action
                    </p>
                    <p className="mt-1.5 text-[13.5px] font-semibold text-foreground">{dbNextModule.title}</p>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground capitalize">
                      {dbNextModule.module_type}
                      {dbNextModule.duration_label ? <> · {dbNextModule.duration_label}</> : null}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="rounded-full"
                        onClick={onStartDbNext}
                        disabled={actionBusy !== null}
                        data-testid="sd-db-start-next"
                      >
                        <Play className="mr-1.5 h-3.5 w-3.5" />
                        {actionBusy === "start" ? "Starting…" : "Mark started"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={onCompleteDbNext}
                        disabled={actionBusy !== null}
                        data-testid="sd-db-complete-next"
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        {actionBusy === "complete" ? "Saving…" : "Mark complete"}
                      </Button>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Progress is logged to your enrollment — your mentor and leadership see it instantly.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-[12.5px] text-foreground">
                    All launch-scoped modules complete. Reach out to your mentor for certification.
                  </div>
                )}

                {learnerHome.setupGaps.length > 0 && (
                  <p className="mt-4 text-[11.5px] text-muted-foreground">
                    Setup pending: {learnerHome.setupGaps.join(", ").replace(/_/g, " ")}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* CONTINUE LEARNING */}
          {cont.length > 0 && (
            <section>
              <SectionHeader title="Continue Learning" subtitle="Pick up where you left off." />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {cont.slice(0, 3).map(({ training, progress }) => {
                  const Icon = TYPE_ICON[training.type] ?? FileText;
                  const minLeft = Math.max(1, Math.round(training.estimatedMinutes * (1 - progress.progressPercent / 100)));
                  return (
                    <Link
                      key={training.id}
                      to={`/training/${training.id}`}
                      className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-border"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground">
                          <Icon className="h-4 w-4" />
                        </div>
                        {progress.status === "overdue" ? (
                          <Badge variant="outline" className="border-red-200 bg-red-50 text-[10px] text-red-600">
                            Overdue
                          </Badge>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" /> {minLeft} min left
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 truncate text-[14px] font-semibold leading-snug">{training.title}</h3>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground capitalize">{training.department}</p>
                      <div className="mt-auto space-y-1.5 pt-3">
                        <Progress value={progress.progressPercent} className="h-1" />
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">{progress.progressPercent}% complete</span>
                          <span className="inline-flex items-center gap-1 font-medium text-primary">
                            Continue <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* MY ROLE JOURNEY */}
          <section>
            <SectionHeader title="My Role Journey" subtitle="A guided path for your role." />
            <div className="rounded-3xl border border-border/70 bg-card p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex min-w-0 items-start gap-4">
                  <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", `os-tone-${journey.tone}`)}>
                    <JourneyIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[18px] font-semibold tracking-tight">{journey.title}</h3>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">{journey.tagline}</p>
                  </div>
                </div>
                <div className="hidden text-right md:block">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Role Mastery</p>
                  <p className="text-[24px] font-semibold tabular-nums">{mastery.pct}%</p>
                </div>
              </div>

              <div className="mt-4">
                <Progress value={mastery.pct} className="h-1.5" />
                <div className="mt-1.5 flex items-center justify-between text-[11.5px] text-muted-foreground">
                  <span>{mastery.done} of {mastery.total} modules complete</span>
                  {nextModule && <span>Next up · <span className="text-foreground font-medium">{nextModule.title}</span></span>}
                </div>
              </div>

              <div className="mt-5 space-y-1.5">
                {journeyModules.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
                    <BookOpen className="mx-auto h-6 w-6 text-muted-foreground/70" />
                    <p className="mt-2 text-[13px] font-medium">No modules in this journey yet</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      Modules for this role will appear here once HR publishes them.
                    </p>
                    {role === "super_admin" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 rounded-full"
                        onClick={() => navigate(`/training/manage?journey=${journey.id}`)}
                      >
                        <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Edit this journey
                      </Button>
                    )}
                  </div>
                )}
                {journeyModules.map((m, idx) => {
                  const p = getProgress(m.id);
                  const done = p.status === "completed";
                  const isNext = m.id === mastery.nextId;
                  return (
                    <Link
                      key={m.id}
                      to={`/training/${m.id}`}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all",
                        isNext
                          ? "border-primary/40 bg-primary/[0.04]"
                          : "border-transparent hover:border-border/70 hover:bg-muted/40",
                      )}
                    >
                      <span className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold",
                        done ? "bg-emerald-100 text-emerald-700"
                          : isNext ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}>
                        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{m.title}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{m.type} · {m.estimatedMinutes} min</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {p.progressPercent}%
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ADDITIONAL LEARNING — Systems + Cross-department */}
          <section>
            <SectionHeader title="Additional Learning" subtitle="Systems and cross-department modules." />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SubGroup
                title="Systems"
                icon={<MonitorCog className="h-3.5 w-3.5 text-muted-foreground" />}
                items={systems}
                onOpen={(id) => navigate(`/training/${id}`)}
              />
              <SubGroup
                title="Cross-Department"
                icon={<Compass className="h-3.5 w-3.5 text-muted-foreground" />}
                items={shared}
                onOpen={(id) => navigate(`/training/${id}`)}
              />
            </div>
          </section>

          {/* REQUIRED MODULES — role-scoped */}
          {requiredRole.length > 0 && (
            <section>
              <SectionHeader
                title="Required Modules"
                subtitle={department ? `Required learning for your role.` : "Required learning."}
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleRequired.map((t) => {
                  const Icon = TYPE_ICON[t.type] ?? FileText;
                  const p = getProgress(t.id);
                  const done = p.status === "completed";
                  return (
                    <Link
                      key={t.id}
                      to={`/training/${t.id}`}
                      className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-border"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground">
                          <Icon className="h-4 w-4" />
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            done
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : p.status === "overdue"
                              ? "border-red-200 bg-red-50 text-red-600"
                              : "border-amber-200 bg-amber-50 text-amber-700",
                          )}
                        >
                          {done ? "Complete" : p.status === "overdue" ? "Overdue" : "Required"}
                        </Badge>
                      </div>
                      <h3 className="mt-3 truncate text-[14px] font-semibold leading-snug">{t.title}</h3>
                      <p className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-[11.5px] text-muted-foreground">{t.description}</p>
                      <div className="mt-auto pt-3">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {t.estimatedMinutes} min
                          </span>
                          <span className="inline-flex items-center gap-1 font-medium text-primary">
                            {done ? "Review" : p.progressPercent > 0 ? "Continue" : "Start"}{" "}
                            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {hasMoreRequired && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setShowAllRequired((s) => !s)}
                  >
                    {showAllRequired ? "Show less" : `Show ${requiredRole.length - 6} more`}
                  </Button>
                </div>
              )}
            </section>
          )}


          {/* RECENTLY ADDED */}
          {recent.length > 0 && (
            <section>
              <SectionHeader title="Recently Added" subtitle="New and updated learning across Blossom OS." />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {recent.map((t) => {
                  const Icon = TYPE_ICON[t.type] ?? FileText;
                  return (
                    <Link
                      key={t.id}
                      to={`/training/${t.id}`}
                      className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5 transition-colors hover:bg-muted/40"
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{t.title}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          Updated {t.lastUpdated} · {t.type} · {t.estimatedMinutes} min
                        </p>
                      </div>
                      <Badge variant="outline" className="border-primary/30 bg-primary/5 text-[10px] text-primary">
                        New
                      </Badge>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          {/* Progress */}
          <div className="rounded-2xl border border-border/70 bg-card p-5">
            <div className="flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                {isSD ? "Your launch progress" : "Progress"}
              </h3>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-muted-foreground">{isSD ? "Launch path" : "Overall"}</span>
                <span className="text-[22px] font-semibold tabular-nums">{isSD ? launch.pct : overall.avg}%</span>
              </div>
              <Progress value={isSD ? launch.pct : overall.avg} className="mt-2 h-1.5" />
            </div>
            {isSD ? (
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11.5px]">
                <Stat icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />} label="Launch" value={`${launch.done}/${launch.total}`} />
                <Stat icon={<Sparkles className="h-3.5 w-3.5 text-primary" />} label="Welcome" value={"In progress"} />
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11.5px]">
                <Stat icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />} label="Required" value={`${overall.requiredDone}/${overall.requiredTotal}`} />
                <Stat icon={<AlertCircle className="h-3.5 w-3.5 text-red-500" />} label="Overdue" value={overall.overdue} />
              </div>
            )}
          </div>

          {/* Need help? — SD-specific calm panel replaces anxiety-heavy Required Due */}
          {isSD ? (
            <div className="rounded-2xl border border-border/70 bg-card p-5">
              <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">Need help?</h3>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                Nothing here has to be solved alone.
              </p>
              <div className="mt-3 space-y-1 text-[12.5px]">
                {[
                  { label: "Ask my mentor", icon: UsersIcon, to: "/messages" },
                  { label: "HR partner", icon: Heart, to: "/messages" },
                  { label: "Resource Library", icon: BookMarked, to: "/resource-library" },
                  { label: "Ask Blossom AI", icon: Sparkles, to: "/ai/assistant" },
                ].map(({ label, icon: Icon, to }) => (
                  <Link
                    key={label}
                    to={to}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-foreground hover:bg-muted/50"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {label}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          ) : required.length > 0 ? (
            <div className="rounded-2xl border border-border/70 bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">Required Due</h3>
                <span className="text-[11px] text-muted-foreground">{required.length}</span>
              </div>
              <div className="mt-3 space-y-1">
                {required.slice(0, 4).map((t) => {
                  const p = getProgress(t.id);
                  return (
                    <Link
                      key={t.id}
                      to={`/training/${t.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[12px] hover:bg-muted/50"
                    >
                      <span className="truncate">{t.title}</span>
                      {p.status === "overdue" ? (
                        <span className="shrink-0 text-[10px] font-medium text-red-600">Overdue</span>
                      ) : (
                        <span className="shrink-0 text-[10px] text-muted-foreground">{t.estimatedMinutes}m</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Need help? */}
          {!isSD && (
            <div className="rounded-2xl border border-border/70 bg-card p-5">
              <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">Need help?</h3>
              <div className="mt-3 space-y-0.5 text-[12.5px]">
                {[
                  { label: "Resource Library", icon: BookMarked, to: "/resource-library" },
                  { label: "Ask Blossom AI", icon: Sparkles, to: "/ai/assistant" },
                ].map(({ label, icon: Icon, to }) => (
                  <Link
                    key={label}
                    to={to}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-foreground hover:bg-muted/50"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {label}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
      )}
    </OSShell>
  );
}

/* ---------------- Subcomponents ---------------- */

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[17px] font-semibold tracking-tight text-foreground">{title}</h2>
      {subtitle && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}{label}
      </div>
      <div className="mt-0.5 text-[13.5px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function SubGroup({
  title, icon, items, onOpen,
}: {
  title: string;
  icon: React.ReactNode;
  items: Training[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        </div>
        <span className="text-[11px] text-muted-foreground">{items.length}</span>
      </div>
      <div className="mt-3 space-y-1">
        {items.length === 0 && (
          <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-6 text-center text-[12px] text-muted-foreground">
            No modules yet.
          </p>
        )}
        {items.map((t) => {
          const Icon = TYPE_ICON[t.type] ?? FileText;
          const p = getProgress(t.id);
          return (
            <button
              key={t.id}
              onClick={() => onOpen(t.id)}
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-muted/40"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{t.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {t.type} · {t.estimatedMinutes} min
                </p>
              </div>
              {p.status === "completed" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2.5 backdrop-blur">
      <p className="text-[9.5px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-[14px] font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SDWeekLabel(done: number, total: number): string {
  if (total === 0) return "—";
  // ~5 weeks of launch; estimate which week the learner is in by progress.
  const pct = done / total;
  const week = Math.min(5, Math.max(1, Math.ceil(pct * 5) || 1));
  return `Week ${week}`;
}

function WelcomeAnchor({ onOpen }: { onOpen: () => void }) {
  return (
    <section>
      <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm sm:p-7">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Phase 0 · For everyone
              </p>
              <h2 className="mt-0.5 text-[19px] font-semibold tracking-tight text-foreground">
                Welcome to Blossom
              </h2>
              <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-muted-foreground">
                Meet the team, hear our mission, watch the welcome video, and read notes from Chad and Shira. Revisit anytime — this is your grounding.
              </p>
              <ul className="mt-3 grid gap-1.5 text-[12px] text-muted-foreground sm:grid-cols-2">
                <li className="inline-flex items-center gap-1.5"><PlayCircle className="h-3.5 w-3.5 text-primary" /> Welcome video</li>
                <li className="inline-flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-primary" /> Mission & Vision</li>
                <li className="inline-flex items-center gap-1.5"><Compass className="h-3.5 w-3.5 text-primary" /> Core Values</li>
                <li className="inline-flex items-center gap-1.5"><UsersIcon className="h-3.5 w-3.5 text-primary" /> Meet the Team</li>
                <li className="inline-flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-primary" /> Notes from Chad & Shira</li>
                <li className="inline-flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5 text-primary" /> Revisit anytime</li>
              </ul>
            </div>
          </div>
          <Button onClick={onOpen} size="lg" className="self-start rounded-2xl shadow-md shadow-primary/20">
            <PlayCircle className="mr-1.5 h-4 w-4" /> Start Welcome to Blossom <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}