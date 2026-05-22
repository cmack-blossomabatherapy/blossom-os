import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { OSShell } from "./OSShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useOSRole } from "@/contexts/OSRoleContext";
import {
  Search, Clock, ArrowRight, Sparkles, Play, FileText, Workflow as WorkflowIcon,
  CheckCircle2, BookOpen, ChevronRight, BookMarked, Library, AlertCircle,
  MonitorCog, Compass,
} from "lucide-react";
import {
  trainings, getProgress, continueLearning, requiredDue,
  systemsTrainings, sharedTrainings, searchTrainings,
  getJourneyForRole, getJourneyModules,
  type Training, type TrainingType,
} from "@/lib/training/academyData";

const TYPE_ICON: Record<TrainingType, typeof FileText> = {
  SOP: FileText,
  Workflow: WorkflowIcon,
  Tango: Play,
  Video: Play,
  Checklist: CheckCircle2,
  "Quick Guide": BookOpen,
};

export default function OSTraining() {
  const navigate = useNavigate();
  const { role } = useOSRole();
  const [query, setQuery] = useState("");

  const journey = useMemo(() => getJourneyForRole(role), [role]);
  const journeyModules = useMemo(() => getJourneyModules(journey), [journey]);
  const cont = useMemo(continueLearning, []);
  const required = useMemo(requiredDue, []);
  const systems = useMemo(systemsTrainings, []);
  const shared = useMemo(sharedTrainings, []);
  const searchResults = useMemo(() => (query ? searchTrainings(query) : []), [query]);

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
    const all = trainings.map((t) => getProgress(t.id));
    const avg = Math.round(all.reduce((s, p) => s + p.progressPercent, 0) / all.length);
    return {
      avg,
      requiredDone: trainings.filter((t) => t.required && getProgress(t.id).status === "completed").length,
      requiredTotal: trainings.filter((t) => t.required).length,
      overdue: all.filter((p) => p.status === "overdue").length,
    };
  }, []);

  const nextModule = mastery.nextId ? journeyModules.find((m) => m.id === mastery.nextId) : undefined;

  return (
    <OSShell>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-12">
          {/* HERO */}
          <header>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Training Academy
            </p>
            <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight text-foreground md:text-[30px]">
              Operational learning built around your role.
            </h1>

            <div className="relative mt-5 max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                <Button size="sm" className="rounded-full" onClick={() => navigate("/sop")}>
                  <Library className="mr-1.5 h-3.5 w-3.5" /> Open SOP Library
                </Button>
              )}
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => navigate("/sop")}>
                <Library className="mr-1.5 h-3.5 w-3.5" /> SOP Library
              </Button>
            </div>
          </header>

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
                      className="group rounded-2xl border border-border/70 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-border"
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
                      <h3 className="mt-3 text-[14px] font-semibold leading-snug">{training.title}</h3>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground capitalize">{training.department}</p>
                      <div className="mt-3 space-y-1.5">
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
                    <journey.icon className="h-5 w-5" />
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

          {/* QUICK ACCESS */}
          <section>
            <SectionHeader title="Quick Access" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { label: "SOP Library", to: "/sop" },
                { label: "My Journey", to: "#journey" },
                { label: "Required Trainings", to: "#required" },
                { label: "Systems", to: "#systems" },
                { label: "Ask Blossom AI", to: "/ai/assistant" },
              ].map((q) => (
                <button
                  key={q.label}
                  onClick={() => q.to.startsWith("/") ? navigate(q.to) : undefined}
                  className="rounded-xl border border-border/70 bg-card px-3 py-2.5 text-left text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted/40"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          {/* Progress */}
          <div className="rounded-2xl border border-border/70 bg-card p-5">
            <div className="flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">Progress</h3>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-muted-foreground">Overall</span>
                <span className="text-[22px] font-semibold tabular-nums">{overall.avg}%</span>
              </div>
              <Progress value={overall.avg} className="mt-2 h-1.5" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[11.5px]">
              <Stat icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />} label="Required" value={`${overall.requiredDone}/${overall.requiredTotal}`} />
              <Stat icon={<AlertCircle className="h-3.5 w-3.5 text-red-500" />} label="Overdue" value={overall.overdue} />
            </div>
          </div>

          {/* Required Due */}
          {required.length > 0 && (
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
          )}

          {/* Ask Blossom AI */}
          <div className="rounded-2xl border border-border/70 bg-card p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">Ask Blossom AI</h3>
            </div>
            <div className="mt-3 space-y-1">
              {[
                "Explain this SOP",
                "Summarize this workflow",
                "What's the next step?",
                "Show related trainings",
              ].map((p) => (
                <Link
                  key={p}
                  to={`/ai/assistant?q=${encodeURIComponent(p)}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[12px] hover:bg-muted/50"
                >
                  <span>{p}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Access */}
          <div className="rounded-2xl border border-border/70 bg-card p-5">
            <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">Quick Access</h3>
            <div className="mt-3 space-y-0.5 text-[12.5px]">
              {[
                { label: "SOP Library", to: "/sop" },
                { label: "Resource Hub", to: "/resources" },
                { label: "Ask Blossom AI", to: "/ai/assistant" },
              ].map((q) => (
                <Link
                  key={q.label}
                  to={q.to}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-foreground hover:bg-muted/50"
                >
                  {q.label}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
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