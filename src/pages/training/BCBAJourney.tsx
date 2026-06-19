import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap, ArrowRight, CheckCircle2, Clock, Sparkles, Compass, Workflow,
  FileText, ClipboardCheck, Users, Layers, BookOpen, PlayCircle, ExternalLink,
  Target, GraduationCap as Cap, Eye, Hand, ChevronRight, MessageSquare, Calendar,
  ListChecks, HeartHandshake, ShieldCheck, Award, Bot, Heart, Stethoscope, Brain,
} from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// =============================================================================
// BCBA Journey
// Operational onboarding for Blossom ABA BCBAs. Grounded in real Blossom
// workflows: caseload management, supervision (97155), parent training (97156),
// PR & authorization cadence, scheduling coordination, escalation paths, and
// the BCBA-facing Blossom OS surface. NOT a corporate LMS.
// =============================================================================

import {
  modules,
  type LessonKind,
  type Lesson,
  type Phase,
  type Module,
} from "@/lib/training/bcbaAcademy";

// Re-export so any existing legacy importers of @/pages/training/BCBAJourney still resolve.
export { modules };
export type { LessonKind, Lesson, Phase, Module };


const phaseStyles: Record<Phase, { label: string; tone: string; icon: typeof Eye }> = {
  Observe: { label: "Phase 1 · Foundations", tone: "bg-info/10 text-info border-info/20", icon: Eye },
  Practice: { label: "Phase 2 · Core practice", tone: "bg-warning/10 text-warning border-warning/20", icon: Hand },
  Assisted: { label: "Phase 3 · Assisted execution", tone: "bg-accent/10 text-accent border-accent/30", icon: Users },
  Independent: { label: "Phase 4 · Independent readiness", tone: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
};

const lessonKindIcon: Record<LessonKind, typeof FileText> = {
  Overview: BookOpen,
  SOP: FileText,
  Workflow: Workflow,
  Tango: PlayCircle,
  Checklist: ListChecks,
  Shadowing: Eye,
  "Knowledge Check": ClipboardCheck,
};

export default function BCBAJourney() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [activeModuleId, setActiveModuleId] = useState<string>(modules[0].id);
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);

  const totalLessons = useMemo(() => modules.reduce((s, m) => s + m.lessons.length, 0), []);
  const totalMinutes = useMemo(() => modules.reduce((s, m) => s + m.lessons.reduce((a, l) => a + l.minutes, 0), 0), []);
  const completedCount = completed.size;
  const pct = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

  const toggle = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const active = modules.find((m) => m.id === activeModuleId)!;
  const activeCompleted = active.lessons.filter((l) => completed.has(l.id)).length;
  const activePct = Math.round((activeCompleted / active.lessons.length) * 100);

  return (
    <GlassPageShell
      eyebrow="Training Academy · BCBA Journey"
      eyebrowIcon={GraduationCap}
      title="BCBA Journey"
      description="Learn how to manage your caseload, supervision, parent training, PRs, and clinical operations inside Blossom OS — calmly and confidently."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="secondary" size="sm" className="bg-white/15 text-primary-foreground hover:bg-white/25 border-white/20">
            <Link to="/academy"><Compass className="mr-1.5 h-4 w-4" /> Academy home</Link>
          </Button>
          <Button asChild size="sm" className="bg-white text-primary hover:bg-white/90">
            <Link to="/bcba/workspace"><ArrowRight className="mr-1.5 h-4 w-4" /> Open BCBA Workspace</Link>
          </Button>
        </div>
      }
      stats={
        <div className="grid grid-cols-3 gap-3">
          <JourneyStat label="Modules" value={`${modules.length}`} sub="BCBA-specific" />
          <JourneyStat label="Lessons" value={`${totalLessons}`} sub={`${totalMinutes} min total`} />
          <JourneyStat label="Progress" value={`${pct}%`} sub={`${completedCount} of ${totalLessons} complete`} />
        </div>
      }
    >
      {/* Mission + meta */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <GlassPanel className="p-6">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Mission</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-foreground">
                Help every BCBA at Blossom operate with clarity, calm, and confidence — across supervision,
                parent training, authorizations, scheduling, and family communication.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MetaRow icon={Layers} label="Core systems" value="Blossom OS · CentralReach · Resource Library" />
                <MetaRow icon={Workflow} label="Key workflows" value="Caseload · Supervision · PR · Parent Training" />
                <MetaRow icon={Calendar} label="Suggested length" value="3–5 weeks clinical onboarding" />
                <MetaRow icon={Users} label="Assigned trainer" value="State Director · BCBA Lead" />
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Journey progress</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{pct}%</p>
            </div>
            <Badge variant="secondary" className="rounded-full">{completedCount}/{totalLessons} lessons</Badge>
          </div>
          <Progress value={pct} className="mt-3 h-2" />
          <div className="mt-5 space-y-2">
            {(["Observe", "Practice", "Assisted", "Independent"] as Phase[]).map((phase) => {
              const phaseModules = modules.filter((m) => m.phase === phase);
              const phaseLessons = phaseModules.flatMap((m) => m.lessons);
              const done = phaseLessons.filter((l) => completed.has(l.id)).length;
              const p = phaseLessons.length === 0 ? 0 : Math.round((done / phaseLessons.length) * 100);
              const meta = phaseStyles[phase];
              const Icon = meta.icon;
              return (
                <div key={phase} className="flex items-center gap-3">
                  <div className={cn("grid h-7 w-7 place-items-center rounded-full border", meta.tone)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{meta.label}</span>
                      <span className="text-muted-foreground">{done}/{phaseLessons.length}</span>
                    </div>
                    <Progress value={p} className="mt-1 h-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      </div>

      {/* Module rail + active module */}
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <GlassPanel className="p-3">
          <p className="px-3 pt-2 pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Modules</p>
          <ol className="space-y-1">
            {modules.map((m) => {
              const Icon = m.icon;
              const isActive = m.id === activeModuleId;
              const done = m.lessons.filter((l) => completed.has(l.id)).length;
              const isDone = done === m.lessons.length;
              return (
                <li key={m.id}>
                  <button
                    onClick={() => setActiveModuleId(m.id)}
                    className={cn(
                      "group w-full rounded-xl border px-3 py-2.5 text-left transition-all",
                      isActive
                        ? "border-primary/30 bg-primary/5 shadow-sm"
                        : "border-transparent hover:bg-muted/60 hover:border-border/60",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors",
                        isActive ? "border-primary/30 bg-primary/10 text-primary" : "border-border/60 bg-muted/60 text-muted-foreground group-hover:text-foreground",
                      )}>
                        {isDone ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Module {m.number}</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground">{done}/{m.lessons.length}</span>
                        </div>
                        <p className="mt-0.5 truncate text-sm font-medium text-foreground">{m.title}</p>
                      </div>
                      <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isActive && "translate-x-0.5 text-primary")} />
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </GlassPanel>

        <div className="space-y-4">
          <GlassPanel className="overflow-hidden p-0">
            <div className="border-b border-border/60 bg-gradient-to-br from-muted/40 to-transparent p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={cn("rounded-full border text-[10px] font-semibold uppercase tracking-wider", phaseStyles[active.phase].tone)}>
                      {phaseStyles[active.phase].label}
                    </Badge>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Module {active.number} of {modules.length}
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{active.title}</h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{active.subtitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Module progress</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight">{activePct}%</p>
                  <Progress value={activePct} className="mt-2 h-1.5 w-32" />
                </div>
              </div>
            </div>

            <div className="grid gap-0 md:grid-cols-2">
              <div className="border-b border-border/60 p-6 md:border-b-0 md:border-r">
                <SectionHeader icon={Target} label="Learning objectives" />
                <ul className="mt-3 space-y-2">
                  {active.objectives.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6">
                <SectionHeader icon={FileText} label="SOPs & walkthroughs" />
                <ul className="mt-3 space-y-2">
                  {active.sopLinks.map((l) => (
                    <li key={l.label}>
                      <Link to={l.href} className="group flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted">
                        <span className="flex items-center gap-2 text-foreground"><FileText className="h-3.5 w-3.5 text-muted-foreground" /> {l.label}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  ))}
                  {active.tangos?.map((t) => (
                    <li key={t.label} className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2 text-foreground"><PlayCircle className="h-3.5 w-3.5 text-primary" /> {t.label}</div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t.note}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-border/60 p-6">
              <SectionHeader icon={BookOpen} label="Lessons" />
              <ul className="mt-3 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
                {active.lessons.map((l) => {
                  const Icon = lessonKindIcon[l.kind];
                  const isDone = completed.has(l.id);
                  return (
                    <li key={l.id}>
                      <button
                        onClick={() => toggle(l.id)}
                        className="group flex w-full items-start gap-3 bg-card p-4 text-left transition-colors hover:bg-muted/50"
                      >
                        <div className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-colors",
                          isDone ? "border-success/30 bg-success/10 text-success" : "border-border/60 bg-muted/60 text-muted-foreground",
                        )}>
                          {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={cn("text-sm font-medium", isDone ? "text-muted-foreground line-through" : "text-foreground")}>{l.title}</p>
                            <Badge variant="secondary" className="rounded-full text-[10px]">{l.kind}</Badge>
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="h-3 w-3" /> {l.minutes} min</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{l.summary}</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="grid gap-0 border-t border-border/60 md:grid-cols-2">
              {active.shadowing && active.shadowing.length > 0 && (
                <div className="border-b border-border/60 p-6 md:border-b-0 md:border-r">
                  <SectionHeader icon={Eye} label="Shadowing tasks" />
                  <ul className="mt-3 space-y-2">
                    {active.shadowing.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className={cn("p-6", !active.shadowing && "md:col-span-2")}>
                <SectionHeader icon={ListChecks} label="Completion checklist" />
                <ul className="mt-3 space-y-2">
                  {active.checklist.map((c, i) => {
                    const key = `${active.id}-chk-${i}`;
                    const isDone = completed.has(key);
                    return (
                      <li key={key}>
                        <button
                          onClick={() => toggle(key)}
                          className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/50"
                        >
                          <div className={cn(
                            "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors",
                            isDone ? "border-success bg-success text-primary-foreground" : "border-border bg-background",
                          )}>
                            {isDone && <CheckCircle2 className="h-3 w-3" />}
                          </div>
                          <span className={cn(isDone ? "text-muted-foreground line-through" : "text-foreground")}>{c}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {active.knowledgeCheck && (
              <div className="border-t border-border/60 bg-muted/30 p-6">
                <SectionHeader icon={ClipboardCheck} label="Lightweight knowledge check" />
                <p className="mt-2 text-sm font-medium text-foreground">{active.knowledgeCheck.q}</p>
                <details className="mt-2 group">
                  <summary className="cursor-pointer text-xs font-medium text-primary hover:underline">Reveal answer</summary>
                  <p className="mt-2 rounded-lg border border-border/60 bg-card p-3 text-sm text-foreground">{active.knowledgeCheck.a}</p>
                </details>
              </div>
            )}
          </GlassPanel>

          <GlassPanel className="p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Operational Insights · {active.title}</p>
                  <Badge variant="secondary" className="rounded-full text-[10px]">role-aware</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">Contextual help grounded in your caseload and SOPs. HIPAA-aware.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {active.aiPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => setAiPrompt(p)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs transition-colors",
                        aiPrompt === p ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 bg-muted/50 text-foreground hover:bg-muted",
                      )}
                    >
                      <MessageSquare className="mr-1 inline h-3 w-3" /> {p}
                    </button>
                  ))}
                </div>
                {aiPrompt && (
                  <div className="mt-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-3 text-sm text-foreground">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Suggested response</p>
                    <p className="mt-1">{aiResponseFor(aiPrompt, active)}</p>
                  </div>
                )}
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </GlassPageShell>
  );
}

function aiResponseFor(prompt: string, m: Module): string {
  const p = prompt.toLowerCase();
  if (p.includes("bcba role") || (p.includes("responsibilities") && p.includes("bcba"))) {
    return "As a BCBA at Blossom, you own clinical direction for your caseload: supervision cadence, treatment plans, PRs, and parent training. You coordinate (not own) scheduling and authorization submission. Your operating surface is the BCBA Workspace.";
  }
  if (p.includes("supported") || p.includes("departments")) {
    return "Scheduling owns coverage. The Auth team owns submissions and payor follow-up. QA owns clinical review and PR readiness. Your State Director owns escalations. You are never on an island.";
  }
  if (p.includes("scheduling vs") || p.includes("owned by scheduling")) {
    return "Scheduling owns staffing decisions, RBT assignments, and rebooking. You own communicating cancellations, flagging coverage risk, and supporting RBTs once paired. You coordinate — you don't run scheduling.";
  }
  if (p.includes("attention today") || p.includes("first this morning")) {
    return "Open the Workspace action queue. Work the red-zone clients first: any overdue supervision, any PR within 6 weeks of due, any client with 2+ cancellations in the last 30 days. Then your parent training cadence.";
  }
  if (p.includes("caseload health") || p.includes("caseload risks")) {
    return "Sort your caseload by risk. Red = overdue supervision OR PR overdue OR auth expiring <30 days. Yellow = approaching one of those thresholds. Green = healthy. Spend 70% of your time on Red, 30% on Yellow, and let Green run.";
  }
  if (p.includes("overdue") && p.includes("supervision")) {
    return "Filter the supervision queue by 'days since last touchpoint' > 21. Each one needs either a scheduled supervision in the next 7 days or a documented reason. If you can't schedule it, escalate to Scheduling with the client name and required date.";
  }
  if (p.includes("missed supervision") || p.includes("escalate") && p.includes("supervision")) {
    return "Escalate to Scheduling first with the client name and the overdue window. If unresolved within 3 business days, loop in your State Director. Document the gap in the supervision log either way.";
  }
  if (p.includes("6-week") || p.includes("approaching the 6-week")) {
    return "Pull your authorizations queue and filter by PR due in the next 6 weeks. Anything older than that should already be in QA. Anything at the 6-week mark needs a documented next action today.";
  }
  if (p.includes("parent signature")) {
    return "Signatures are requested at the same time the PR enters QA. If unsigned after 7 days, send a calm follow-up. If unsigned after 14 days, loop in the family's primary contact and document the delay in the auth record.";
  }
  if (p.includes("behind on 97156") || (p.includes("families") && p.includes("behind"))) {
    return "Filter the parent training queue by 'days since last 97156' > 30. Each one needs a scheduled session in the next 14 days or a documented family reason. Repeated misses become a continuation risk worth flagging to your SD.";
  }
  if (p.includes("low parent participation") || p.includes("document") && p.includes("participation")) {
    return "In the session note, document attendance rate, presence quality, follow-through on prior session goals, and one concrete next step. Below 60% participation over 60 days is a written escalation to your SD.";
  }
  if (p.includes("scheduling contact")) {
    return "Each State has a primary scheduling contact listed in the Org Chart. For day-to-day requests, use the standard channel. For urgent coverage gaps, use the operational escalation path defined in Module 7.";
  }
  if (p.includes("uncovered client") || p.includes("escalate") && p.includes("client")) {
    return "Report the gap to Scheduling immediately with the client name, the uncovered hours, and the deadline by which it must be resolved. If unresolved within 24 hours for a Red client, escalate to your State Director.";
  }
  if (p.includes("escalate") && p.includes("pr signature")) {
    return "Stalled parent signatures: gentle follow-up at 7 days, primary contact loop-in at 14 days, State Director notification at 21 days. Document each touch in the auth record.";
  }
  if (p.includes("draft a calm message") || p.includes("missed session")) {
    return "Lead with care: \"Hi [Family], we missed [Client] today and want to make sure everything is okay.\" Confirm the next session, offer a make-up if applicable, and avoid blame language. Document the message in the family thread.";
  }
  if (p.includes("documentation expectations") || p.includes("documentation gaps")) {
    return "Every session note: attendance, behaviors observed, programs run, parent presence (97156), and next-session plan. Gaps usually show up as missing parent presence fields or missing next-step notes — both are common QA pushbacks.";
  }
  if (p.includes("operational risks this month") || p.includes("top operational risks")) {
    return "Three risk buckets: (1) PRs landing in the next 6 weeks, (2) supervision overdue, (3) clients with rising cancellation patterns. Sort each by severity and clear bucket 1 by end of week.";
  }
  if (p.includes("busiest weeks") || p.includes("pre-plan")) {
    return "Layer your PR due dates, supervision cadence, and parent training cadence on one calendar. Weeks with 3+ overlapping deliverables are your pre-plan weeks — block focus time the week before.";
  }
  if (p.includes("learned in this journey")) {
    return `You've moved through ${modules.length} modules covering BCBA foundations, caseload management, supervision, PRs and authorizations, parent training, scheduling coordination, escalations, Blossom OS, documentation, and advanced operations. You are operationally ready.`;
  }
  if (p.includes("first 90 days") || p.includes("post-journey")) {
    return "First 30 days: run your Workspace daily and complete every required workflow on cadence. Next 30: tune your weekly rituals. Last 30: mentor a newer BCBA on one workflow you've mastered.";
  }
  return `Operational context for "${m.title}": ${m.subtitle} Use the SOP links in this module and the BCBA Workspace to ground your next action.`;
}

// ---------- small atoms ----------

function JourneyStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-primary-foreground/10 px-4 py-3 backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/80">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-primary-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] text-primary-foreground/75">{sub}</p>
    </div>
  );
}

function MetaRow({ icon: Icon, label, value }: { icon: typeof Layers; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted/60 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, label }: { icon: typeof Layers; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}