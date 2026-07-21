import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { CardFrame } from "./CardFrame";
import type { DashboardCard } from "./useDashboardCards";

function Cta({ label, to }: { label: string; to: string }) {
  return (
    <Button asChild size="sm" className="rounded-xl min-h-11">
      <Link to={to}>{label}<ArrowRight className="h-4 w-4 ml-1.5" /></Link>
    </Button>
  );
}

/** GREETING */
export function GreetingCard({ card }: { card: DashboardCard }) {
  const { user } = useAuth();
  const first = (user?.user_metadata?.full_name ?? user?.email ?? "").split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <CardFrame title={`${greet}, ${first}`} subtitle={card.subtitle ?? undefined} state="success">
      <p className="text-sm text-muted-foreground">Here is your day.</p>
    </CardFrame>
  );
}

/** NEXT BEST ACTION — reads current lifecycle stage message, else falls back */
export function NextBestActionCard({ card, stageMessage }: { card: DashboardCard; stageMessage?: string }) {
  return (
    <CardFrame
      title={card.title}
      subtitle={card.subtitle ?? undefined}
      state="success"
      action={card.cta_link ? <Cta label={card.cta_label ?? "View"} to={card.cta_link} /> : undefined}
    >
      <p className="text-sm">{stageMessage ?? card.body ?? "You’re all caught up."}</p>
    </CardFrame>
  );
}

/** TODAY'S SCHEDULE */
export function TodaysScheduleCard({ card }: { card: DashboardCard }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    supabase.from("rbt_shift_events" as any)
      .select("id,scheduled_start,scheduled_end,client_initials,location")
      .eq("employee_id", user.id)
      .gte("scheduled_start", today.toISOString())
      .lt("scheduled_start", tomorrow.toISOString())
      .order("scheduled_start")
      .then(({ data, error }) => { if (error) setErr(error.message); setRows((data as any) ?? []); });
  }, [user?.id]);

  const state = err ? "error" : rows === null ? "loading" : rows.length === 0 ? "empty" : "success";
  return (
    <CardFrame
      title={card.title}
      subtitle={new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      state={state}
      emptyLabel="No sessions are currently scheduled."
      errorLabel="Schedule is temporarily unavailable."
      action={rows && rows.length > 0 && card.cta_link ? <Cta label={card.cta_label ?? "Open schedule"} to={card.cta_link} /> : undefined}
    >
      <ul className="divide-y divide-border/70">
        {rows?.slice(0, 3).map((r: any) => (
          <li key={r.id} className="py-2.5 flex items-center gap-3">
            <span className="text-sm font-medium tabular-nums">
              {new Date(r.scheduled_start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </span>
            <span className="text-sm text-muted-foreground truncate">{r.client_initials ?? "Client"}</span>
          </li>
        ))}
      </ul>
    </CardFrame>
  );
}

/** JOURNEY PROGRESS — reads pathway progress */
export function JourneyProgressCard({ card }: { card: DashboardCard }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<{ pct: number; total: number; done: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    supabase.from("rbt_pathway_progress" as any)
      .select("status")
      .eq("employee_id", user.id)
      .then(({ data, error }) => {
        if (error) return setErr(error.message);
        const rows = (data as any[]) ?? [];
        const done = rows.filter((r) => r.status === "completed").length;
        setProgress({ pct: rows.length ? Math.round((done / rows.length) * 100) : 0, total: rows.length, done });
      });
  }, [user?.id]);
  const state = err ? "error" : !progress ? "loading" : progress.total === 0 ? "empty" : "success";
  return (
    <CardFrame
      title={card.title}
      subtitle={card.subtitle ?? undefined}
      state={state}
      emptyLabel="Your journey will populate once your pathway is assigned."
      action={card.cta_link ? <Cta label={card.cta_label ?? "View"} to={card.cta_link} /> : undefined}
    >
      {progress && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{progress.done} of {progress.total} complete</span>
            <span className="tabular-nums">{progress.pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress.pct}%` }} />
          </div>
        </div>
      )}
    </CardFrame>
  );
}

/** TRAINING PROGRESS */
export function TrainingProgressCard({ card }: { card: DashboardCard }) {
  const { user } = useAuth();
  const [row, setRow] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!user) return;
    supabase.from("user_training_progress" as any)
      .select("training_id,progress_percent,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => { if (error) setErr(error.message); setRow(data); setLoaded(true); });
  }, [user?.id]);
  const state = err ? "error" : !loaded ? "loading" : !row ? "empty" : "success";
  return (
    <CardFrame
      title={card.title}
      subtitle={card.subtitle ?? undefined}
      state={state}
      emptyLabel="Your next training will appear here when assigned."
      action={card.cta_link ? <Cta label={card.cta_label ?? "Continue"} to={card.cta_link} /> : undefined}
    >
      {row && (
        <div>
          <p className="text-sm text-muted-foreground mb-1.5">In progress</p>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${row.progress_percent ?? 0}%` }} />
          </div>
        </div>
      )}
    </CardFrame>
  );
}

/** SUPERVISION */
export function SupervisionCard({ card }: { card: DashboardCard }) {
  const { user } = useAuth();
  const [hours, setHours] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
    supabase.from("rbt_supervision" as any)
      .select("duration_minutes")
      .eq("rbt_id", user.id)
      .gte("supervision_date", monthStart.toISOString())
      .then(({ data, error }) => {
        if (error) return setErr(error.message);
        const mins = ((data as any[]) ?? []).reduce((s, r) => s + (r.duration_minutes ?? 0), 0);
        setHours(mins / 60);
      });
  }, [user?.id]);
  const state = err ? "error" : hours === null ? "loading" : "success";
  return (
    <CardFrame
      title={card.title}
      subtitle="This month"
      state={state}
      action={card.cta_link ? <Cta label={card.cta_label ?? "View"} to={card.cta_link} /> : undefined}
    >
      <p className="text-2xl font-semibold tabular-nums">{(hours ?? 0).toFixed(1)}<span className="text-sm text-muted-foreground font-normal ml-1">hrs</span></p>
    </CardFrame>
  );
}

/** CREDENTIAL ALERT */
export function CredentialAlertCard({ card }: { card: DashboardCard }) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    supabase.from("credentialing_records" as any)
      .select("id,credential_type,expires_at,status")
      .eq("employee_id", user.id)
      .not("expires_at", "is", null)
      .then(({ data, error }) => {
        if (error) return setErr(error.message);
        const soon = ((data as any[]) ?? []).filter((r) => {
          if (!r.expires_at) return false;
          const days = (new Date(r.expires_at).getTime() - Date.now()) / 86_400_000;
          return days < 60;
        });
        setAlerts(soon);
      });
  }, [user?.id]);
  const state = err ? "error" : alerts === null ? "loading" : alerts.length === 0 ? "empty" : "success";
  return (
    <CardFrame
      title={card.title}
      state={state}
      emptyLabel="All credentials are current."
      action={alerts && alerts.length > 0 && card.cta_link ? <Cta label={card.cta_label ?? "Review"} to={card.cta_link} /> : undefined}
    >
      <ul className="space-y-1.5">
        {alerts?.slice(0, 3).map((r: any) => (
          <li key={r.id} className="text-sm flex justify-between gap-2">
            <span className="truncate">{r.credential_type}</span>
            <span className="text-muted-foreground text-xs">expires {new Date(r.expires_at).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
    </CardFrame>
  );
}

/** RECOGNITION */
export function RecognitionCard({ card }: { card: DashboardCard }) {
  return (
    <CardFrame title={card.title} subtitle={card.subtitle ?? undefined} state={card.body ? "success" : "empty"}
      emptyLabel="Recognition messages will appear here.">
      {card.body && <p className="text-sm">{card.body}</p>}
    </CardFrame>
  );
}

/** GROWTH OPPORTUNITY */
export function GrowthCard({ card }: { card: DashboardCard }) {
  return (
    <CardFrame title={card.title} subtitle={card.subtitle ?? undefined} state="success"
      action={card.cta_link ? <Cta label={card.cta_label ?? "Explore"} to={card.cta_link} /> : undefined}>
      <p className="text-sm text-muted-foreground">{card.body ?? "Small steps compound."}</p>
    </CardFrame>
  );
}

/** SUPPORT SHORTCUT */
export function SupportShortcutCard({ card }: { card: DashboardCard }) {
  return (
    <CardFrame title={card.title} subtitle={card.subtitle ?? undefined} state="success"
      action={<Cta label={card.cta_label ?? "Get support"} to={card.cta_link ?? "/rbt/app/support"} />}>
      <p className="text-sm text-muted-foreground">Message a teammate or open a help request.</p>
    </CardFrame>
  );
}

/** ANNOUNCEMENT */
export function AnnouncementCard({ card }: { card: DashboardCard }) {
  return (
    <CardFrame title={card.title} subtitle={card.subtitle ?? undefined}
      state={card.body ? "success" : "empty"} emptyLabel="No announcements right now.">
      {card.body && <p className="text-sm">{card.body}</p>}
    </CardFrame>
  );
}

/** CENTRALREACH DATA STATUS */
export function CrDataStatusCard({ card }: { card: DashboardCard }) {
  const { user } = useAuth();
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!user) return;
    supabase.from("rbt_data_sync_status" as any)
      .select("last_synced_at")
      .eq("employee_id", user.id)
      .order("last_synced_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setErr(error.message);
        setLastSync((data as any)?.last_synced_at ?? null); setLoaded(true);
      });
  }, [user?.id]);
  const staleThresholdHours = 24;
  const ageHours = lastSync ? (Date.now() - new Date(lastSync).getTime()) / 3_600_000 : null;
  const state = err ? "error"
    : !loaded ? "loading"
    : !lastSync ? "empty"
    : ageHours! > staleThresholdHours ? "stale"
    : "success";
  return (
    <CardFrame
      title={card.title}
      subtitle={card.subtitle ?? undefined}
      state={state}
      staleLabel="May be stale"
      emptyLabel="Waiting on the first sync from CentralReach."
    >
      {lastSync && (
        <p className="text-sm text-muted-foreground">
          Last updated {new Date(lastSync).toLocaleString()}
        </p>
      )}
    </CardFrame>
  );
}