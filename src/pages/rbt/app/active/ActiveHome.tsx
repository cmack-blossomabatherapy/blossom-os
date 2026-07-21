import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CardFrame } from "../CardFrame";
import { FreshnessPill, freshness } from "./freshness";
import { useCrSync } from "./useCrSync";
import { useRbtIdentity } from "../useRbtIdentity";
import {
  Calendar, Users, Clock, ShieldCheck, GraduationCap, LifeBuoy,
  Award, Sparkles, ArrowRight, AlertTriangle,
} from "lucide-react";

function Tile({ to, icon: Icon, label, hint }: any) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-border/70 bg-card p-4 hover:bg-muted/50 transition flex items-center gap-3 min-h-16"
    >
      <span className="rounded-xl bg-muted p-2.5 text-foreground/80">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{label}</p>
        {hint && <p className="text-xs text-muted-foreground truncate">{hint}</p>}
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

export default function ActiveHome() {
  const { employeeId, displayName, loading: idLoading } = useRbtIdentity();
  const first = (displayName ?? "").split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const [next, setNext] = useState<any | null | undefined>(undefined);
  const [today, setToday] = useState<any[] | null>(null);
  const [changes, setChanges] = useState<any[] | null>(null);
  const [supervision, setSupervision] = useState<any | null>(null);
  const [credAlerts, setCredAlerts] = useState<any[] | null>(null);
  const [supportUpdates, setSupportUpdates] = useState<any[] | null>(null);
  const [recognition, setRecognition] = useState<any | null>(null);
  const [growth, setGrowth] = useState<any | null>(null);
  const [training, setTraining] = useState<any | null>(null);
  const [outstanding, setOutstanding] = useState<any[] | null>(null);
  const crSync = useCrSync();
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (idLoading) return;
    if (!employeeId) {
      setToday([]); setNext(null); setChanges([]); setSupervision(null);
      setCredAlerts([]); setSupportUpdates([]); setRecognition(null);
      setGrowth(null); setTraining(null); setOutstanding([]);
      return;
    }
    const uid = employeeId;
    setLoadError(null);
    const now = new Date();
    const startDay = new Date(now); startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(startDay); endDay.setDate(startDay.getDate() + 1);

    // Today's + next session
    supabase.from("rbt_shift_events" as any)
      .select("id,starts_at,ends_at,client_initials,location_type,status,bcba_first_name,bcba_last_initial,external_id")
      .eq("employee_id", uid)
      .gte("starts_at", startDay.toISOString())
      .lt("starts_at", endDay.toISOString())
      .order("starts_at")
      .then(({ data }) => setToday((data as any[]) ?? []));

    supabase.from("rbt_shift_events" as any)
      .select("id,starts_at,ends_at,client_initials,location_type,status,bcba_first_name,bcba_last_initial,external_id")
      .eq("employee_id", uid)
      .gte("starts_at", now.toISOString())
      .order("starts_at")
      .limit(1)
      .then(({ data, error }) => {
        if (error) setLoadError(error.message);
        setNext((data as any[])?.[0] ?? null);
      });

    // Schedule changes (recently cancelled or updated)
    supabase.from("rbt_sessions" as any)
      .select("id,session_date,start_time,client_name,attendance_status,cancellation_reason,updated_at")
      .eq("rbt_employee_id", uid)
      .in("attendance_status", ["cancelled", "rescheduled"])
      .gte("session_date", startDay.toISOString().slice(0,10))
      .order("updated_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setChanges((data as any[]) ?? []));

    // Supervision – last & next
    supabase.from("rbt_supervision" as any)
      .select("supervision_date,bcba_id,status,feedback,acknowledged_by_rbt_at")
      .eq("rbt_employee_id", uid)
      .order("supervision_date", { ascending: false })
      .limit(1)
      .then(({ data }) => setSupervision((data as any[])?.[0] ?? null));

    // Credential alerts (expiring in 60 days or expired)
    const soon = new Date(); soon.setDate(soon.getDate() + 60);
    supabase.from("rbt_credentials" as any)
      .select("id,label,status,expires_on,credential_type")
      .eq("employee_id", uid)
      .or(`status.eq.expired,status.eq.expiring,expires_on.lte.${soon.toISOString().slice(0,10)}`)
      .order("expires_on", { ascending: true })
      .limit(5)
      .then(({ data }) => setCredAlerts((data as any[]) ?? []));

    // Training due
    supabase.from("user_training_progress" as any)
      .select("course_id,progress_percent,status,updated_at")
      .eq("user_id", uid)
      .neq("status", "completed")
      .order("updated_at", { ascending: false })
      .limit(1)
      .then(({ data }) => setTraining((data as any[])?.[0] ?? null));

    // Support request updates
    supabase.from("rbt_help_requests" as any)
      .select("id,category,status,updated_at,first_response_at")
      .eq("rbt_employee_id", uid)
      .in("status", ["open", "in_progress", "waiting_on_you"])
      .order("updated_at", { ascending: false })
      .limit(3)
      .then(({ data }) => setSupportUpdates((data as any[]) ?? []));

    // Recognition + growth (performance notes)
    supabase.from("rbt_performance_notes" as any)
      .select("id,category,title,detail,source_date")
      .eq("employee_id", uid)
      .eq("is_active", true)
      .in("category", ["recognition", "development_goal"])
      .order("source_date", { ascending: false })
      .then(({ data }) => {
        const rows = (data as any[]) ?? [];
        setRecognition(rows.find((r) => r.category === "recognition") ?? null);
        setGrowth(rows.find((r) => r.category === "development_goal") ?? null);
      });

    // Outstanding employee actions – unacknowledged supervision, sessions to confirm, open hours issues
    Promise.all([
      supabase.from("rbt_supervision" as any)
        .select("id").eq("rbt_employee_id", uid).is("acknowledged_by_rbt_at", null),
      supabase.from("rbt_sessions" as any)
        .select("id").eq("rbt_employee_id", uid).is("acknowledged_by_rbt_at", null)
        .gte("session_date", new Date(Date.now() - 7 * 864e5).toISOString().slice(0,10)),
    ]).then(([s, sess]) => {
      const items: any[] = [];
      if ((s.data ?? []).length) items.push({ label: `${s.data!.length} supervision note${s.data!.length === 1 ? "" : "s"} to acknowledge`, to: "/rbt/app/supervision" });
      if ((sess.data ?? []).length) items.push({ label: `${sess.data!.length} session${sess.data!.length === 1 ? "" : "s"} to confirm`, to: "/rbt/app/schedule" });
      setOutstanding(items);
    });
  }, [employeeId, idLoading]);

  const crFresh = freshness(crSync?.last_success_at, crSync?.stale_after_hours ?? 24);

  if (idLoading) {
    return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;
  }
  if (!employeeId) {
    return (
      <CardFrame title="We couldn't find your clinician profile" state="error"
        errorLabel="Ask an admin to link your login to your employee record from the CentralReach Data Hub." />
    );
  }

  return (
    <div className="space-y-3">
      {/* Greeting */}
      <CardFrame title={`${greet}, ${first}`} state="success" subtitle="Here is your day.">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">CentralReach data</p>
          <FreshnessPill f={crFresh} />
        </div>
        {loadError && <p className="mt-2 text-xs text-destructive">Some panels failed to load: {loadError}</p>}
      </CardFrame>

      {/* Next session */}
      <CardFrame title="Next session" state={next === undefined ? "loading" : next === null ? "empty" : "success"}
        emptyLabel="Nothing scheduled next."
        action={next ? (
          <Link to="/rbt/app/schedule" className="text-sm text-primary underline underline-offset-4">See full schedule</Link>
        ) : undefined}
      >
        {next && (
          <div>
            <p className="text-lg font-semibold tracking-tight">
              {new Date(next.starts_at).toLocaleString([], {
                weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
              })}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {next.client_initials ?? "Client"} · {next.location_type ?? "Location TBD"}
              {next.bcba_first_name && ` · BCBA ${next.bcba_first_name} ${next.bcba_last_initial ?? ""}`}
            </p>
          </div>
        )}
      </CardFrame>

      {/* Today's schedule */}
      <CardFrame title="Today" state={today === null ? "loading" : today.length === 0 ? "empty" : "success"}
        emptyLabel="No sessions today.">
        <ul className="divide-y divide-border/70">
          {today?.map((r) => (
            <li key={r.id} className="py-2.5 flex items-center gap-3">
              <span className="text-sm font-medium tabular-nums w-16">
                {new Date(r.starts_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
              <span className="text-sm flex-1 truncate">{r.client_initials ?? "Client"}</span>
              <span className="text-xs text-muted-foreground truncate">{r.location_type ?? ""}</span>
            </li>
          ))}
        </ul>
      </CardFrame>

      {/* Outstanding action */}
      {outstanding && outstanding.length > 0 && (
        <CardFrame title="Needs your attention" state="success">
          <ul className="space-y-1.5">
            {outstanding.map((o, i) => (
              <li key={i}>
                <Link to={o.to} className="text-sm flex items-center gap-2 hover:text-primary">
                  <AlertTriangle className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
                  {o.label}
                  <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </CardFrame>
      )}

      {/* Schedule changes */}
      {changes && changes.length > 0 && (
        <CardFrame title="Schedule changes" state="success" subtitle="Recent cancellations & updates">
          <ul className="divide-y divide-border/70">
            {changes.map((c) => (
              <li key={c.id} className="py-2 text-sm flex items-center gap-2">
                <span className="text-xs text-muted-foreground tabular-nums w-20 shrink-0">
                  {new Date(c.session_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
                <span className="flex-1 truncate">{c.client_name ?? "Client"}</span>
                <span className="text-xs rounded-full bg-muted px-2 py-0.5 capitalize">{c.attendance_status}</span>
              </li>
            ))}
          </ul>
        </CardFrame>
      )}

      {/* Quick tiles */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Tile to="/rbt/app/clients" icon={Users} label="My Clients"
          hint="Assigned clients only" />
        <Tile to="/rbt/app/hours" icon={Clock} label="Hours"
          hint="Scheduled · completed · cancelled" />
        <Tile to="/rbt/app/supervision" icon={ShieldCheck} label="Supervision"
          hint={supervision ? `Last ${new Date(supervision.supervision_date).toLocaleDateString()}` : "Monthly status"} />
        <Tile to="/rbt/app/credentials" icon={ShieldCheck} label="Credentials"
          hint={credAlerts && credAlerts.length ? `${credAlerts.length} need attention` : "Up to date"} />
        <Tile to="/rbt/app/performance" icon={Award} label="Performance"
          hint="Strengths & goals" />
        <Tile to="/rbt/app/learn" icon={GraduationCap} label="Training"
          hint={training ? `${training.progress_percent ?? 0}% in progress` : "Nothing due"} />
      </div>

      {/* Support updates */}
      {supportUpdates && supportUpdates.length > 0 && (
        <CardFrame title="Your support requests" state="success"
          action={<Link to="/rbt/app/support" className="text-sm text-primary underline underline-offset-4">Open support</Link>}>
          <ul className="divide-y divide-border/70">
            {supportUpdates.map((s) => (
              <li key={s.id} className="py-2 text-sm flex items-center gap-2">
                <LifeBuoy className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                <span className="flex-1 truncate">{s.category ?? "Request"}</span>
                <span className="text-xs rounded-full bg-muted px-2 py-0.5 capitalize">{String(s.status).replace(/_/g, " ")}</span>
              </li>
            ))}
          </ul>
        </CardFrame>
      )}

      {/* Recognition */}
      {recognition && (
        <CardFrame title="Recognition" state="success">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-primary/10 p-2 text-primary">
              <Sparkles className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">{recognition.title}</p>
              {recognition.detail && <p className="text-xs text-muted-foreground mt-1">{recognition.detail}</p>}
            </div>
          </div>
        </CardFrame>
      )}

      {/* Growth opportunity */}
      {growth && (
        <CardFrame title="Current growth goal" state="success"
          action={<Link to="/rbt/app/performance" className="text-sm text-primary underline underline-offset-4">View performance</Link>}>
          <p className="text-sm font-medium">{growth.title}</p>
          {growth.detail && <p className="text-xs text-muted-foreground mt-1">{growth.detail}</p>}
        </CardFrame>
      )}

      {/* CR last sync footer */}
      <CardFrame title="CentralReach" subtitle="Source of scheduling & hours"
        state={crSync ? "success" : "loading"}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {crSync?.status === "healthy" ? "Connected" : crSync?.message ?? "—"}
          </span>
          <FreshnessPill f={crFresh} />
        </div>
      </CardFrame>
    </div>
  );
}