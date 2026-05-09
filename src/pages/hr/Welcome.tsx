import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sparkles, PlayCircle, Heart, Compass, Users, GraduationCap,
  ClipboardCheck, ShieldCheck, Calendar, ArrowRight, CheckCircle2, Quote,
} from "lucide-react";

const leadershipVideos = [
  {
    name: "Dr. Sarah Mitchell",
    role: "Chief Executive Officer",
    title: "Welcome to the Blossom family",
    duration: "2:14",
    accent: "from-primary/30 via-primary/10 to-transparent",
  },
  {
    name: "Marcus Reyes, BCBA-D",
    role: "Chief Clinical Officer",
    title: "Our clinical philosophy",
    duration: "3:42",
    accent: "from-accent/30 via-accent/10 to-transparent",
  },
  {
    name: "Priya Anand",
    role: "Head of People & Culture",
    title: "Your first 30 days",
    duration: "1:58",
    accent: "from-success/30 via-success/10 to-transparent",
  },
];

const roadmap = [
  {
    phase: "Day 1",
    label: "Land softly",
    icon: Heart,
    items: ["Sign offer paperwork", "Watch CEO welcome", "Set up your profile"],
  },
  {
    phase: "Week 1",
    label: "Get oriented",
    icon: Compass,
    items: ["Operations Academy intro", "Meet your manager", "Tour your clinic"],
  },
  {
    phase: "Week 2",
    label: "Learn the craft",
    icon: GraduationCap,
    items: ["Core compliance trainings", "Shadow a session", "First check-in"],
  },
  {
    phase: "Week 3",
    label: "Step in",
    icon: ClipboardCheck,
    items: ["Complete role certifications", "Run first task independently"],
  },
  {
    phase: "Week 4",
    label: "Belong",
    icon: Users,
    items: ["30-day review", "Set 90-day goals", "Join a working group"],
  },
];

const quickActions = [
  { label: "Open Operations Academy", to: "/blossom/academy", icon: Compass },
  { label: "Start your trainings", to: "/training", icon: GraduationCap },
  { label: "Browse the Resource Hub", to: "/resources", icon: ShieldCheck },
  { label: "View your schedule", to: "/scheduling", icon: Calendar },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());

  const itemKey = (phase: string, item: string) => `${phase}::${item}`;

  // Load saved progress + subscribe to realtime updates for cross-session sync
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("onboarding_milestone_progress")
        .select("phase, item, completed")
        .eq("user_id", user.id);
      if (cancelled) return;
      if (error) return;
      const next = new Set<string>();
      (data ?? []).forEach((row) => {
        if (row.completed) next.add(itemKey(row.phase, row.item));
      });
      setCompletedItems(next);
    };
    load();

    const channel = supabase
      .channel(`onboarding-progress-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "onboarding_milestone_progress",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setCompletedItems((prev) => {
            const next = new Set(prev);
            if (payload.eventType === "DELETE") {
              const old = payload.old as { phase: string; item: string };
              if (old?.phase) next.delete(itemKey(old.phase, old.item));
            } else {
              const row = payload.new as { phase: string; item: string; completed: boolean };
              const k = itemKey(row.phase, row.item);
              if (row.completed) next.add(k);
              else next.delete(k);
            }
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const toggleItem = async (phase: string, item: string) => {
    if (!user?.id) {
      toast.error("Sign in to save your progress.");
      return;
    }
    const k = itemKey(phase, item);
    const wasComplete = completedItems.has(k);
    // Optimistic update
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (wasComplete) next.delete(k);
      else next.add(k);
      return next;
    });
    setPending((prev) => new Set(prev).add(k));

    const { error } = await supabase
      .from("onboarding_milestone_progress")
      .upsert(
        { user_id: user.id, phase, item, completed: !wasComplete, completed_at: new Date().toISOString() },
        { onConflict: "user_id,phase,item" },
      );

    setPending((prev) => {
      const next = new Set(prev);
      next.delete(k);
      return next;
    });

    if (error) {
      // Revert on failure
      setCompletedItems((prev) => {
        const next = new Set(prev);
        if (wasComplete) next.add(k);
        else next.delete(k);
        return next;
      });
      toast.error("Couldn't save your progress. Try again.");
    }
  };

  const firstName = useMemo(() => {
    const meta = user?.user_metadata as { full_name?: string; display_name?: string } | undefined;
    const raw = meta?.full_name || meta?.display_name || user?.email?.split("@")[0] || "there";
    return raw.split(/[\s._-]+/)[0].replace(/^./, (c) => c.toUpperCase());
  }, [user]);

  const phaseStatuses = useMemo(() => {
    const statuses: Array<"complete" | "active" | "upcoming"> = [];
    let activeAssigned = false;
    roadmap.forEach((step) => {
      const allDone = step.items.every((i) => completedItems.has(itemKey(step.phase, i)));
      if (allDone) {
        statuses.push("complete");
      } else if (!activeAssigned) {
        statuses.push("active");
        activeAssigned = true;
      } else {
        statuses.push("upcoming");
      }
    });
    return statuses;
  }, [completedItems]);

  const totalItems = roadmap.reduce((sum, r) => sum + r.items.length, 0);
  const completedCount = roadmap.reduce(
    (sum, r) => sum + r.items.filter((i) => completedItems.has(itemKey(r.phase, i))).length,
    0,
  );
  const progress = totalItems === 0 ? 0 : Math.round((completedCount / totalItems) * 100);
  const completedPhases = phaseStatuses.filter((s) => s === "complete").length;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <GlassPageShell
      eyebrow="New hire welcome"
      eyebrowIcon={Sparkles}
      title={`${greeting}, ${firstName}.`}
      description="We're so glad you're here. This is your home base for everything you need in your first month at Blossom ABA Therapy."
      stats={
        <div className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm md:min-w-[260px]">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Onboarding progress</span>
            <span className="text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="mt-2 h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            {completedCount} of {totalItems} tasks · {completedPhases} of {roadmap.length} milestones complete
          </p>
        </div>
      }
    >
      {/* Mission quote */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 md:p-8">
        <Quote className="absolute right-4 top-4 h-16 w-16 text-primary/10" aria-hidden />
        <p className="max-w-3xl text-lg font-medium leading-relaxed text-foreground md:text-xl">
          "Every family who walks through our doors trusts us with their child's growth. That trust is sacred — and it starts with you."
        </p>
        <p className="mt-3 text-sm text-muted-foreground">— Blossom ABA Therapy Mission</p>
      </Card>

      {/* Leadership videos */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Hear from leadership</h2>
            <p className="text-sm text-muted-foreground">Three short videos to start your journey.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {leadershipVideos.map((v) => (
            <Card key={v.name} className="group overflow-hidden border-border/60 transition hover:border-primary/40 hover:shadow-lg">
              <div className={`relative aspect-video bg-gradient-to-br ${v.accent} flex items-center justify-center`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--primary)/0.15),transparent_60%)]" />
                <button
                  type="button"
                  className="relative flex h-16 w-16 items-center justify-center rounded-full bg-card/95 text-primary shadow-xl ring-1 ring-border transition group-hover:scale-105"
                  aria-label={`Play ${v.title}`}
                >
                  <PlayCircle className="h-9 w-9" />
                </button>
                <span className="absolute bottom-2 right-2 rounded-md bg-foreground/80 px-1.5 py-0.5 text-[10px] font-medium text-background">
                  {v.duration}
                </span>
              </div>
              <div className="space-y-1 p-4">
                <p className="text-sm font-semibold text-foreground">{v.title}</p>
                <p className="text-xs text-muted-foreground">{v.name} · {v.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Onboarding roadmap */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Your first 30 days</h2>
          <p className="text-sm text-muted-foreground">A clear path from your first day to feeling at home.</p>
        </div>
        <Card className="overflow-hidden border-border/60 p-4 md:p-6">
          <ol className="relative space-y-5 md:space-y-6">
            {roadmap.map((step, idx) => {
              const Icon = step.icon;
              const status = phaseStatuses[idx];
              const isComplete = status === "complete";
              const isActive = status === "active";
              return (
                <li key={step.phase} className="relative flex gap-4">
                  {idx < roadmap.length - 1 && (
                    <span
                      aria-hidden
                      className={`absolute left-5 top-11 h-[calc(100%-1rem)] w-px ${isComplete ? "bg-primary/40" : "bg-border"}`}
                    />
                  )}
                  <div
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                      isComplete
                        ? "border-primary bg-primary text-primary-foreground"
                        : isActive
                          ? "border-primary bg-card text-primary ring-4 ring-primary/15"
                          : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {isComplete ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{step.phase}</span>
                      <h3 className="text-base font-semibold text-foreground">{step.label}</h3>
                      {isActive && <Badge variant="secondary" className="bg-primary/10 text-primary">In progress</Badge>}
                      {isComplete && <Badge variant="secondary" className="bg-success/15 text-success">Complete</Badge>}
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {step.items.map((item) => {
                        const k = itemKey(step.phase, item);
                        const done = completedItems.has(k);
                        const isPending = pending.has(k);
                        return (
                          <li key={item} className="flex items-start gap-2">
                            <Checkbox
                              id={k}
                              checked={done}
                              disabled={isPending}
                              onCheckedChange={() => toggleItem(step.phase, item)}
                              className="mt-0.5"
                            />
                            <label
                              htmlFor={k}
                              className={`cursor-pointer select-none ${done ? "text-foreground line-through decoration-muted-foreground/50" : ""}`}
                            >
                              {item}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      </section>

      {/* Quick actions */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Jump back in</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Button
                key={a.to}
                variant="outline"
                className="group h-auto justify-between gap-2 border-border/60 bg-card/60 p-4 text-left hover:border-primary/40 hover:bg-card"
                onClick={() => navigate(a.to)}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-foreground">{a.label}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </Button>
            );
          })}
        </div>
      </section>
    </GlassPageShell>
  );
}