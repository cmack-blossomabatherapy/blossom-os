import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CardFrame } from "../CardFrame";
import { useRbtIdentity } from "../useRbtIdentity";
import { useExperienceLab } from "../useExperienceLab";
import { useProgram } from "../training/useProgram";
import {
  deriveCockpit,
  COCKPIT_ROUTES,
  type CockpitTimelineItem,
} from "@/lib/rbt/homeCockpit";
import {
  Users, Clock, ShieldCheck, GraduationCap, LifeBuoy,
  Award, Sparkles, ArrowRight, AlertTriangle, Compass, CheckCircle2,
  Circle, Loader2, Milestone, HeartHandshake, MessageCircle,
} from "lucide-react";

// -------------------------------------------------------- small primitives

function Tile({ to, icon: Icon, label, hint }: {
  to: string; icon: any; label: string; hint?: string;
}) {
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

function TimelinePill({ item }: { item: CockpitTimelineItem }) {
  const Icon =
    item.status === "complete" ? CheckCircle2
    : item.status === "in_progress" ? Loader2
    : item.status === "needs_support" || item.status === "blocked" ? AlertTriangle
    : Circle;
  const tone =
    item.status === "complete" ? "text-primary"
    : item.status === "in_progress" ? "text-blue-600"
    : item.status === "needs_support" || item.status === "blocked" ? "text-amber-600"
    : "text-muted-foreground";
  return (
    <Link
      to={item.to}
      aria-label={`Milestone ${item.index + 1}: ${item.title}`}
      className={
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition " +
        (item.isCurrent
          ? "border-primary/60 bg-primary/10 text-foreground"
          : "border-border/70 hover:bg-muted/60")
      }
    >
      <Icon className={`h-3.5 w-3.5 ${tone}`} strokeWidth={1.75} aria-hidden />
      <span className="tabular-nums font-medium">{item.index + 1}.</span>
      <span className="truncate max-w-[10rem]">{item.title}</span>
    </Link>
  );
}

// -------------------------------------------------------- main cockpit

export default function ActiveHome() {
  const { employeeId, displayName, loading: idLoading } = useRbtIdentity();
  const lab = useExperienceLab();
  const program = useProgram(employeeId);
  const cockpit = deriveCockpit(program.pathway?.name ?? null, program.rows);

  const first = (displayName ?? "").split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const [next, setNext] = useState<any | null | undefined>(undefined);
  const [today, setToday] = useState<any[] | null>(null);
  const [supervision, setSupervision] = useState<any | null>(null);
  const [credAlerts, setCredAlerts] = useState<any[] | null>(null);
  const [supportUpdates, setSupportUpdates] = useState<any[] | null>(null);
  const [recognition, setRecognition] = useState<any | null>(null);
  const [growth, setGrowth] = useState<any | null>(null);
  const [outstanding, setOutstanding] = useState<any[] | null>(null);

  useEffect(() => {
    if (idLoading) return;
    // In Experience Lab, never touch Supabase — everything on Home is either
    // journey-derived (already lab-projected via useProgram) or synthesised
    // below to reflect the selected pathway/preset.
    if (lab.active) {
      setToday([]); setNext(null); setSupervision(null);
      setCredAlerts([]); setSupportUpdates([]);
      setRecognition({ title: "Recognized for consistency", detail: "Preview data — real recognition will appear when live." });
      setGrowth({ title: "Sharpen data-collection precision", detail: "Preview data — real growth goals will appear when live." });
      setOutstanding([]);
      return;
    }
    if (!employeeId) {
      setToday([]); setNext(null); setSupervision(null);
      setCredAlerts([]); setSupportUpdates([]); setRecognition(null);
      setGrowth(null); setOutstanding([]);
      return;
    }
    const uid = employeeId;
    const now = new Date();
    const startDay = new Date(now); startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(startDay); endDay.setDate(startDay.getDate() + 1);

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
      .then(({ data }) => {
        setNext((data as any[])?.[0] ?? null);
      });

    supabase.from("rbt_supervision" as any)
      .select("supervision_date,bcba_id,status,feedback,acknowledged_by_rbt_at")
      .eq("rbt_employee_id", uid)
      .order("supervision_date", { ascending: false })
      .limit(1)
      .then(({ data }) => setSupervision((data as any[])?.[0] ?? null));

    const soon = new Date(); soon.setDate(soon.getDate() + 60);
    supabase.from("rbt_credentials" as any)
      .select("id,label,status,expires_on,credential_type")
      .eq("employee_id", uid)
      .or(`status.eq.expired,status.eq.expiring,expires_on.lte.${soon.toISOString().slice(0,10)}`)
      .order("expires_on", { ascending: true })
      .limit(5)
      .then(({ data }) => setCredAlerts((data as any[]) ?? []));

    supabase.from("rbt_help_requests" as any)
      .select("id,category,status,updated_at,first_response_at")
      .eq("rbt_employee_id", uid)
      .in("status", ["open", "in_progress", "waiting_on_you"])
      .order("updated_at", { ascending: false })
      .limit(3)
      .then(({ data }) => setSupportUpdates((data as any[]) ?? []));

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

    Promise.all([
      supabase.from("rbt_supervision" as any)
        .select("id").eq("rbt_employee_id", uid).is("acknowledged_by_rbt_at", null),
      supabase.from("rbt_sessions" as any)
        .select("id").eq("rbt_employee_id", uid).is("acknowledged_by_rbt_at", null)
        .gte("session_date", new Date(Date.now() - 7 * 864e5).toISOString().slice(0,10)),
    ]).then(([s, sess]) => {
      const items: any[] = [];
      if ((s.data ?? []).length) items.push({ label: `${s.data!.length} supervision note${s.data!.length === 1 ? "" : "s"} to acknowledge`, to: COCKPIT_ROUTES.supervision });
      if ((sess.data ?? []).length) items.push({ label: `${sess.data!.length} session${sess.data!.length === 1 ? "" : "s"} to confirm`, to: COCKPIT_ROUTES.schedule });
      setOutstanding(items);
    });
  }, [employeeId, idLoading, lab.active]);

  if (idLoading) {
    return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;
  }
  if (!employeeId && !lab.active) {
    return (
      <CardFrame
        title={`${greet}, ${first}`}
        state="success"
        subtitle="Your personalized home is being set up."
        action={
          <Link
            to={COCKPIT_ROUTES.welcome}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 h-10 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
          >
            Open Welcome <ArrowRight className="h-4 w-4" />
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">
          Meet the team and get comfortable while we finish preparing your training path.
        </p>
      </CardFrame>
    );
  }

  return (
    <div className="space-y-3" data-testid="rbt-home-cockpit">
      {/* ---- HERO: greeting + path + next-best-action ---- */}
      <section
        aria-label="Your journey"
        data-testid="rbt-home-hero"
        data-stage={cockpit.nextAction.stage}
        className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_8px_24px_-12px_hsl(220_15%_20%/0.08)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {greet}
            </p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight truncate">
              {first}
            </h1>
            {program.pathway?.name && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/60 px-2.5 py-0.5 text-xs">
                  <Compass className="h-3 w-3" aria-hidden /> {program.pathway.name}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/60 px-2.5 py-0.5 text-xs capitalize">
                  {cockpit.nextAction.stage.replace(/_/g, " ")}
                </span>
              </div>
            )}
          </div>
          {cockpit.stats.total > 0 && (
            <div className="text-right shrink-0">
              <p className="text-3xl font-semibold tabular-nums leading-none">
                {cockpit.stats.percent}%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {cockpit.stats.complete} / {cockpit.stats.total} milestones
              </p>
            </div>
          )}
        </div>

        {cockpit.stats.total > 0 && (
          <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all motion-reduce:transition-none"
              style={{ width: `${cockpit.stats.percent}%` }}
              aria-hidden
            />
          </div>
        )}

        {/* Next-best-action — the single primary CTA on Home */}
        <div className="mt-5 rounded-xl bg-muted/50 border border-border/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            {cockpit.nextAction.eyebrow}
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            {cockpit.nextAction.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {cockpit.nextAction.body}
          </p>
          <Link
            to={cockpit.nextAction.to}
            data-testid="rbt-home-next-action-cta"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 h-10 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
          >
            {cockpit.nextAction.ctaLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ---- Milestone timeline ---- */}
      {cockpit.timeline.length > 0 && (
        <CardFrame
          title="Milestone timeline"
          state="success"
          action={
            <Link
              to={COCKPIT_ROUTES.program}
              className="text-sm text-primary underline underline-offset-4"
            >
              Open My Program
            </Link>
          }
        >
          <ol
            className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x"
            data-testid="rbt-home-timeline"
            aria-label="Training milestones"
          >
            {cockpit.timeline.map((t) => (
              <li key={t.id} className="snap-start"><TimelinePill item={t} /></li>
            ))}
          </ol>
        </CardFrame>
      )}

      {/* ---- Outstanding: unacknowledged supervision, sessions to confirm ---- */}
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

      {/* ---- Today + Next session ---- */}
      <div className="grid gap-3 sm:grid-cols-2">
        <CardFrame
          title="Next session"
          state={next === undefined ? "loading" : next === null ? "empty" : "success"}
          emptyLabel={lab.active ? "Preview data — real sessions appear here when live." : "Nothing scheduled next."}
          action={
            <Link to={COCKPIT_ROUTES.schedule} className="text-sm text-primary underline underline-offset-4">
              Open schedule
            </Link>
          }
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

        <CardFrame
          title="Today"
          state={today === null ? "loading" : today.length === 0 ? "empty" : "success"}
          emptyLabel={lab.active ? "Preview data — real day appears here when live." : "No sessions today."}
          action={
            today && today.length > 0 ? (
              <Link to={COCKPIT_ROUTES.schedule} className="text-sm text-primary underline underline-offset-4">
                Open schedule
              </Link>
            ) : undefined
          }
        >
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
      </div>

      {/* ---- Confidence & supervisor ---- */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Tile
          to={COCKPIT_ROUTES.supervision}
          icon={ShieldCheck}
          label="Supervision"
          hint={supervision ? `Last ${new Date(supervision.supervision_date).toLocaleDateString()}` : "Meet with your BCBA"}
        />
        <Tile
          to={COCKPIT_ROUTES.support}
          icon={LifeBuoy}
          label="Get support"
          hint={
            supportUpdates && supportUpdates.length > 0
              ? `${supportUpdates.length} open request${supportUpdates.length === 1 ? "" : "s"}`
              : "Ask a teammate anything"
          }
        />
        <Tile
          to={COCKPIT_ROUTES.credentials}
          icon={ShieldCheck}
          label="Credentials"
          hint={credAlerts && credAlerts.length ? `${credAlerts.length} need attention` : "Up to date"}
        />
        <Tile
          to={COCKPIT_ROUTES.clients}
          icon={Users}
          label="My clients"
          hint="Assigned clients only"
        />
        <Tile
          to={COCKPIT_ROUTES.performance}
          icon={Award}
          label="Performance"
          hint="Strengths & goals"
        />
        <Tile
          to={COCKPIT_ROUTES.learn}
          icon={GraduationCap}
          label="Academy"
          hint="Courses & practice"
        />
      </div>

      {/* ---- Recognition ---- */}
      {recognition && (
        <CardFrame
          title="Recognition"
          state="success"
          action={
            <Link to={COCKPIT_ROUTES.performance} className="text-sm text-primary underline underline-offset-4">
              View performance
            </Link>
          }
        >
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

      {/* ---- Growth goal ---- */}
      {growth && (
        <CardFrame
          title="Current growth goal"
          state="success"
          action={
            <Link to={COCKPIT_ROUTES.performance} className="text-sm text-primary underline underline-offset-4">
              View performance
            </Link>
          }
        >
          <p className="text-sm font-medium">{growth.title}</p>
          {growth.detail && <p className="text-xs text-muted-foreground mt-1">{growth.detail}</p>}
        </CardFrame>
      )}

      {/* ---- Fellowship path to BCBA ---- */}
      <CardFrame
        title="Path to BCBA"
        subtitle="BCBA Fellowship at Blossom"
        state="success"
        action={
          <Link
            to={COCKPIT_ROUTES.fellowship}
            data-testid="rbt-home-fellowship-cta"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 px-4 h-10 text-sm font-medium hover:bg-muted transition"
          >
            Explore Fellowship <ArrowRight className="h-4 w-4" />
          </Link>
        }
      >
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-primary/10 p-2 text-primary">
            <HeartHandshake className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <p className="text-sm text-muted-foreground">
            Curious about becoming a BCBA? Our Fellowship pairs you with a mentor,
            covers supervision hours, and maps every step to certification.
          </p>
        </div>
      </CardFrame>
    </div>
  );
}