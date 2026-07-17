import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CardFrame } from "./CardFrame";
import { useDashboardCards, logCardEngagement, type DashboardCard } from "./useDashboardCards";
import { PreboardingHomeCards, isPreboardingStage } from "./preboarding/PreboardingHomeCards";
import {
  GreetingCard, NextBestActionCard, TodaysScheduleCard, JourneyProgressCard,
  TrainingProgressCard, SupervisionCard, CredentialAlertCard, RecognitionCard,
  GrowthCard, SupportShortcutCard, AnnouncementCard, CrDataStatusCard,
} from "./cards";

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
      .then(({ data }) => setStageMessage((data as any)?.employee_message ?? undefined));
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

  if (cards.length === 0) return (
    <CardFrame title="You're all caught up" state="empty" emptyLabel="Nothing needs your attention right now." />
  );

  return (
    <div className="grid gap-3 md:grid-cols-2">
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
  const { user } = useAuth();
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(start); end.setDate(start.getDate() + 14);
    supabase.from("rbt_shift_events" as any)
      .select("id,scheduled_start,scheduled_end,client_initials,location")
      .eq("employee_id", user.id)
      .gte("scheduled_start", start.toISOString())
      .lt("scheduled_start", end.toISOString())
      .order("scheduled_start")
      .then(({ data, error }) => { if (error) setErr(error.message); setRows((data as any) ?? []); });
  }, [user?.id]);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    (rows ?? []).forEach((r) => {
      const k = new Date(r.scheduled_start).toDateString();
      map.set(k, [...(map.get(k) ?? []), r]);
    });
    return Array.from(map.entries());
  }, [rows]);

  const state = err ? "error" : rows === null ? "loading" : rows.length === 0 ? "empty" : "success";
  return (
    <div className="space-y-3">
      <CardFrame title="Next 14 days" state={state}
        emptyLabel="No sessions are currently scheduled."
        errorLabel="Schedule is temporarily unavailable.">
        <div className="space-y-5">
          {grouped.map(([day, list]) => (
            <div key={day}>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                {new Date(day).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
              </p>
              <ul className="divide-y divide-border/70">
                {list.map((r: any) => (
                  <li key={r.id} className="py-2.5 flex items-center gap-3">
                    <span className="text-sm font-medium tabular-nums w-20">
                      {new Date(r.scheduled_start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </span>
                    <span className="text-sm flex-1 truncate">{r.client_initials ?? "Client"}</span>
                    {r.location && <span className="text-xs text-muted-foreground truncate">{r.location}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardFrame>
    </div>
  );
}

// ---------------------------------------------------------------- LEARN
export function RbtLearn() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    supabase.from("user_training_progress" as any)
      .select("course_id,progress_percent,status,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(10)
      .then(({ data, error }) => { if (error) setErr(error.message); setRows((data as any) ?? []); });
  }, [user?.id]);
  const state = err ? "error" : rows === null ? "loading" : rows.length === 0 ? "empty" : "success";
  return (
    <CardFrame title="Your learning" state={state}
      emptyLabel="Your next training will appear here when assigned.">
      <ul className="divide-y divide-border/70">
        {rows?.map((r: any) => (
          <li key={r.course_id} className="py-3">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium truncate">{r.course_id}</span>
              <span className="text-muted-foreground tabular-nums">{r.progress_percent ?? 0}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${r.progress_percent ?? 0}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </CardFrame>
  );
}

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
  const { user, signOut } = useAuth() as any;
  const [stage, setStage] = useState<any | null>(null);
  const [history, setHistory] = useState<any[] | null>(null);
  useEffect(() => {
    if (!user) return;
    supabase.from("rbt_lifecycle_state" as any)
      .select("stage, entered_at")
      .eq("employee_id", user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) return;
        const { data: cfg } = await supabase.from("rbt_lifecycle_stages" as any)
          .select("name, description, employee_message")
          .eq("key", (data as any).stage)
          .maybeSingle();
        setStage({ ...(data as any), ...(cfg as any) });
      });
    supabase.from("rbt_lifecycle_events" as any)
      .select("from_stage,to_stage,occurred_at,reason,source")
      .eq("employee_id", user.id)
      .order("occurred_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setHistory((data as any) ?? []));
  }, [user?.id]);

  return (
    <div className="space-y-3">
      <CardFrame title={user?.email ?? "You"} subtitle="Your Blossom profile" state="success"
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
    </div>
  );
}