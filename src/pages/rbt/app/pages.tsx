import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CardFrame } from "./CardFrame";
import { useDashboardCards, logCardEngagement, type DashboardCard } from "./useDashboardCards";
import { PreboardingHomeCards, isPreboardingStage } from "./preboarding/PreboardingHomeCards";
import { FirstCaseHomeCard } from "./firstcase/FirstCaseHomeCard";
import { JourneyHomeCard } from "./journey/JourneyHomeCard";
import RbtProgram from "./training/RbtProgram";
import RbtSkillPassport from "./training/RbtSkillPassport";
import ActiveHome from "./active/ActiveHome";
import ActiveSchedule from "./active/ActiveSchedule";
import { Link } from "react-router-dom";
import { GraduationCap, Award, ArrowRight, Users, Clock, ShieldCheck, BadgeCheck, Sparkles } from "lucide-react";
import {
  GreetingCard, NextBestActionCard, TodaysScheduleCard, JourneyProgressCard,
  TrainingProgressCard, SupervisionCard, CredentialAlertCard, RecognitionCard,
  GrowthCard, SupportShortcutCard, AnnouncementCard, CrDataStatusCard,
} from "./cards";
import { useRbtIdentity } from "./useRbtIdentity";
import { WelcomeToBlossomCard } from "@/components/onboarding/WelcomeToBlossomCard";
import { useProgram } from "./training/useProgram";

function WelcomeBanner({ userId }: { userId: string }) {
  const key = `rbt-app-welcome-dismissed-${userId}`;
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return typeof window !== "undefined" && window.localStorage.getItem(key) === "1"; }
    catch { return true; }
  });
  if (dismissed) return null;
  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 shrink-0 text-primary mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Welcome to the new Blossom RBT app</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Your schedule, training, supervision, growth, and support — all in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { try { window.localStorage.setItem(key, "1"); } catch {} setDismissed(true); }}
          className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
          aria-label="Dismiss welcome message"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function renderCard(card: DashboardCard, stageMessage?: string) {
  switch (card.card_type) {
    case "greeting":               return <GreetingCard card={card} />;
    case "next_best_action":       return <NextBestActionCard card={card} stageMessage={stageMessage} />;
    case "todays_schedule":        return <TodaysScheduleCard card={card} />;
    case "journey_progress":       return <JourneyProgressCard card={card} />;
    case "training_progress":      return <TrainingProgressCard card={card} />;
    case "supervision_status":     return <SupervisionCard card={card} />;
    case "credential_alert":       return <CredentialAlertCard card={card} />;
    case "recognition":            return <RecognitionCard card={card} />;
    case "growth_opportunity":     return <GrowthCard card={card} />;
    case "support_shortcut":       return <SupportShortcutCard card={card} />;
    case "important_announcement": return <AnnouncementCard card={card} />;
    case "centralreach_status":    return <CrDataStatusCard card={card} />;
    default: return null;
  }
}

// ---------------------------------------------------------------- HOME
export function RbtHome() {
  const { user } = useAuth();
  const { cards, loading, error, context } = useDashboardCards();
  const [stageMessage, setStageMessage] = useState<string | undefined>();

  useEffect(() => {
    if (!context.lifecycleStage) return;
    supabase.from("rbt_lifecycle_stages" as any)
      .select("employee_message")
      .eq("key", context.lifecycleStage)
      .maybeSingle()
      .then(
        ({ data }) => setStageMessage((data as any)?.employee_message ?? undefined),
        () => setStageMessage(undefined),
      );
  }, [context.lifecycleStage]);

  useEffect(() => {
    if (!user) return;
    cards.forEach((c) => logCardEngagement(c.id, user.id, "view"));
  }, [cards.length, user?.id]);

  if (loading) return (
    <div className="space-y-3">
      {[0,1,2].map(i => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
    </div>
  );

  if (error) return (
    <CardFrame title="Home" state="error" errorLabel="We could not load your home right now. Try again shortly." />
  );

  if (isPreboardingStage(context.lifecycleStage)) {
    return <PreboardingHomeCards />;
  }

  // Established / Active RBTs get the Active experience.
  const ACTIVE_STAGES = new Set([
    "active_rbt", "established_rbt", "advanced_rbt_candidate",
    "lead_rbt", "trainer_rbt",
  ]);
  if (context.lifecycleStage && ACTIVE_STAGES.has(context.lifecycleStage)) {
    return <ActiveHome />;
  }

  if (cards.length === 0) return (
    <CardFrame title="You're all caught up" state="empty" emptyLabel="Nothing needs your attention right now." />
  );

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {user && <div className="md:col-span-2"><WelcomeBanner userId={user.id} /></div>}
      <div className="md:col-span-2"><FirstCaseHomeCard /></div>
      <div className="md:col-span-2"><JourneyHomeCard /></div>
      {cards.map((c) => (
        <div key={c.id} className={c.card_type === "greeting" || c.card_type === "next_best_action" ? "md:col-span-2" : ""}>
          {renderCard(c, stageMessage)}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- SCHEDULE
export function RbtSchedule() {
  return <ActiveSchedule />;
}

// ---------------------------------------------------------------- LEARN
export function RbtLearn() {
  const { authUserId, employeeId, loading: idLoading } = useRbtIdentity();
  const { pathway, stats, loading: programLoading } = useProgram(employeeId);
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (idLoading) return;
    const uid = authUserId;
    if (!uid) { setRows([]); return; }
    (async () => {
      setErr(null);
      const { data, error } = await supabase
        .from("user_training_progress")
        .select("training_id,progress_percent,status,updated_at,completed_at")
        .eq("user_id", uid)
        .order("updated_at", { ascending: false })
        .limit(25);
      if (error) { setErr(error.message); setRows([]); return; }
      const list = (data ?? []) as any[];
      const ids = Array.from(new Set(list.map((r) => r.training_id).filter(Boolean)));
      let courseMap: Record<string, any> = {};
      if (ids.length) {
        const { data: courses } = await supabase
          .from("training_courses")
          .select("id,title,name,status,is_active,duration_minutes,estimated_minutes")
          .in("id", ids);
        (courses ?? []).forEach((c: any) => { courseMap[c.id] = c; });
      }
      setRows(list.map((r) => ({ ...r, course: courseMap[r.training_id] ?? null })));
    })();
  }, [authUserId, idLoading]);

  const state: "error" | "loading" | "empty" | "success" =
    err ? "error" : rows === null ? "loading" : rows.length === 0 ? "empty" : "success";

  const isPublished = (c: any | null) => Boolean(c && c.is_active !== false && c.status !== "draft" && c.status !== "archived");

  return (
    <div className="space-y-4">
      <WelcomeToBlossomCard />
      {!programLoading && pathway && (
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Your training path</p>
              <p className="mt-0.5 text-base font-semibold truncate">{pathway.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {stats.complete} of {stats.total} steps complete · {stats.percent}%
              </p>
            </div>
            {stats.current ? (
              <Link
                to="/rbt/app/program"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                to="/rbt/app/program"
                className="inline-flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-sm font-medium"
              >
                View path <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${stats.percent}%` }} />
          </div>
        </div>
      )}
      {!programLoading && !pathway && employeeId && (
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <p className="text-sm font-medium">We're preparing your personalized training path.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            You can start with Welcome to Blossom above while your path is finalized.
          </p>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/rbt/app/program" className="rounded-2xl border border-border/70 bg-card p-4 hover:bg-muted/50 transition flex items-center gap-3">
          <span className="rounded-xl bg-primary/10 p-2.5 text-primary"><GraduationCap className="h-5 w-5" strokeWidth={1.75} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">My Program</p>
            <p className="text-xs text-muted-foreground">Your training roadmap</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link to="/rbt/app/passport" className="rounded-2xl border border-border/70 bg-card p-4 hover:bg-muted/50 transition flex items-center gap-3">
          <span className="rounded-xl bg-primary/10 p-2.5 text-primary"><Award className="h-5 w-5" strokeWidth={1.75} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Skill Passport</p>
            <p className="text-xs text-muted-foreground">Skills, evaluations & feedback</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
      <CardFrame title="Your learning" state={state}
        errorLabel="We couldn't load your training right now. Pull to refresh or try again in a moment."
        emptyLabel="Your next training will appear here as your path is set up.">
        <ul className="divide-y divide-border/70">
          {rows?.map((r: any) => {
            const c = r.course;
            const label = c?.title ?? c?.name ?? `Course ${String(r.training_id).slice(0, 8)}`;
            const published = isPublished(c);
            const complete = r.status === "completed" || (r.progress_percent ?? 0) >= 100;
            return (
              <li key={r.training_id} className="py-3">
                <div className="flex justify-between items-start gap-3 mb-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{label}</p>
                    {!published && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                        Unpublished — a coordinator will publish this before you can complete it.
                      </p>
                    )}
                    {published && !complete && (
                      <Link to={`/rbt/app/learn/course/${r.training_id}`}
                        className="text-[11px] text-primary underline underline-offset-4">
                        Continue course
                      </Link>
                    )}
                    {published && complete && (
                      <Link to={`/rbt/app/learn/course/${r.training_id}`}
                        className="text-[11px] text-muted-foreground underline underline-offset-4 ml-2">
                        Review
                      </Link>
                    )}
                    {complete && r.completed_at && (
                      <p className="text-[11px] text-primary mt-0.5">
                        Completed {new Date(r.completed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className="text-muted-foreground text-sm tabular-nums">{r.progress_percent ?? 0}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${r.progress_percent ?? 0}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </CardFrame>
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-card p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Grow with Blossom</p>
        <p className="mt-0.5 text-sm font-semibold">Interested in becoming a BCBA?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Explore fellowship and advancement pathways when you're ready.
        </p>
        <Link to="/rbt/app/support" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
          Talk to your BCBA <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- PROGRAM / PASSPORT (nested Learn pages)
export function RbtProgramPage()   { return <RbtProgram />; }
export function RbtPassportPage()  { return <RbtSkillPassport />; }

// ---------------------------------------------------------------- SUPPORT
export function RbtSupport() {
  const { user } = useAuth();
  const [subject, setSubject] = useState(""); const [body, setBody] = useState("");
  const [sending, setSending] = useState(false); const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    if (!user || !subject.trim()) return;
    setSending(true); setErr(null);
    const { error } = await supabase.from("rbt_help_requests" as any).insert({
      employee_id: user.id, subject, message: body, status: "open",
    });
    setSending(false);
    if (error) return setErr(error.message);
    setSent(true); setSubject(""); setBody("");
  };
  return (
    <CardFrame title="Get support" subtitle="We’re here to help" state="success"
      action={
        <button onClick={submit} disabled={sending || !subject.trim()}
          className="rounded-xl bg-primary text-primary-foreground px-5 h-11 min-h-11 font-medium disabled:opacity-60">
          {sending ? "Sending…" : "Send request"}
        </button>
      }>
      <div className="space-y-3">
        <input value={subject} onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject" aria-label="Subject"
          className="w-full h-11 min-h-11 rounded-xl bg-muted/60 border border-border px-4 text-[15px] focus:ring-2 focus:ring-ring focus:border-transparent" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="How can we help?" aria-label="Message" rows={5}
          className="w-full rounded-xl bg-muted/60 border border-border p-4 text-[15px] focus:ring-2 focus:ring-ring focus:border-transparent" />
        {sent && <p className="text-sm text-primary">Thanks — a teammate will follow up.</p>}
        {err && <p className="text-sm text-destructive">{err}</p>}
      </div>
    </CardFrame>
  );
}

// ---------------------------------------------------------------- ME
export function RbtMe() {
  const { signOut } = useAuth() as any;
  const { employeeId, displayName, email, credential, loading: idLoading } = useRbtIdentity();
  const [stage, setStage] = useState<any | null>(null);
  const [history, setHistory] = useState<any[] | null>(null);
  useEffect(() => {
    if (idLoading) return;
    if (!employeeId) { setStage(null); setHistory([]); return; }
    supabase.from("rbt_lifecycle_state" as any)
      .select("stage, entered_at")
      .eq("employee_id", employeeId)
      .maybeSingle()
      .then(
        async ({ data }) => {
          if (!data) return;
          try {
            const { data: cfg } = await supabase.from("rbt_lifecycle_stages" as any)
              .select("name, description, employee_message")
              .eq("key", (data as any).stage)
              .maybeSingle();
            setStage({ ...(data as any), ...(cfg as any) });
          } catch { setStage(data as any); }
        },
        () => setStage(null),
      );
    supabase.from("rbt_lifecycle_events" as any)
      .select("from_stage,to_stage,occurred_at,reason,source")
      .eq("employee_id", employeeId)
      .order("occurred_at", { ascending: false })
      .limit(10)
      .then(
        ({ data }) => setHistory((data as any) ?? []),
        () => setHistory([]),
      );
  }, [employeeId, idLoading]);

  return (
    <div className="space-y-3">
      <CardFrame
        title={displayName}
        subtitle={[credential, email].filter(Boolean).join(" · ") || "Your Blossom profile"}
        state="success"
        action={signOut && <button onClick={() => signOut()} className="text-sm text-muted-foreground underline underline-offset-4">Sign out</button>}>
        {stage ? (
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Current stage</p>
            <p className="text-lg font-semibold tracking-tight mt-1">{stage.name}</p>
            {stage.employee_message && <p className="text-sm text-muted-foreground mt-2">{stage.employee_message}</p>}
          </div>
        ) : <p className="text-sm text-muted-foreground">Your journey will appear here.</p>}
      </CardFrame>

      <CardFrame title="Lifecycle history" state={history === null ? "loading" : history.length === 0 ? "empty" : "success"}
        emptyLabel="No transitions recorded yet.">
        <ul className="space-y-2">
          {history?.map((h, i) => (
            <li key={i} className="text-sm flex items-center gap-2">
              <span className="text-muted-foreground text-xs w-28 shrink-0 tabular-nums">
                {new Date(h.occurred_at).toLocaleDateString()}
              </span>
              <span className="text-muted-foreground">{h.from_stage ?? "—"}</span>
              <span aria-hidden>→</span>
              <span className="font-medium">{h.to_stage}</span>
            </li>
          ))}
        </ul>
      </CardFrame>

      <div className="grid gap-3 grid-cols-2">
        {[
          { to: "/rbt/app/clients",     icon: Users,       label: "My Clients" },
          { to: "/rbt/app/hours",       icon: Clock,       label: "Hours" },
          { to: "/rbt/app/supervision", icon: ShieldCheck, label: "Supervision" },
          { to: "/rbt/app/credentials", icon: BadgeCheck,  label: "Credentials" },
          { to: "/rbt/app/performance", icon: Award,       label: "Performance" },
          { to: "/rbt/app/learn",       icon: GraduationCap, label: "Training" },
          { to: "/rbt/app/growth",      icon: Sparkles,    label: "My Growth" },
        ].map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to}
            className="rounded-2xl border border-border/70 bg-card p-4 hover:bg-muted/50 transition flex items-center gap-3 min-h-16">
            <span className="rounded-xl bg-muted p-2 text-foreground/80"><Icon className="h-4 w-4" strokeWidth={1.75} /></span>
            <span className="text-sm font-medium flex-1">{label}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}