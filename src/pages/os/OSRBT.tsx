import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock, GraduationCap, Stethoscope, AlertTriangle, ChevronRight,
  LifeBuoy, CalendarClock, Megaphone, CalendarDays, MessageSquare,
  BookOpen, PlayCircle, X, Phone, ShieldAlert, Wrench, Users, HeartHandshake,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// RBT Dashboard — Awareness layer only. Execution lives in My Day.

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card p-5",
        "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function firstName(name?: string | null) {
  if (!name) return "there";
  return name.trim().split(/\s+/)[0];
}
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

const helpOptions = [
  { label: "Running late",      icon: Clock },
  { label: "Schedule issue",    icon: CalendarDays },
  { label: "Parent concern",    icon: HeartHandshake },
  { label: "Clinical support",  icon: Stethoscope },
  { label: "Tech / system",     icon: Wrench },
  { label: "Contact BCBA",      icon: Phone },
  { label: "Safety concern",    icon: ShieldAlert },
];

const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function parseTimeToMinutes(t: string): number {
  // Accept "9:00 AM" / "09:00" / "13:30" formats.
  const trimmed = t.trim();
  const ampm = trimmed.match(/^(\d{1,2}):(\d{2})\s*([ap]m)$/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2], 10);
    const isPm = ampm[3].toLowerCase() === "pm";
    if (h === 12) h = 0;
    return (isPm ? h + 12 : h) * 60 + m;
  }
  const hhmm = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) return parseInt(hhmm[1], 10) * 60 + parseInt(hhmm[2], 10);
  return Number.POSITIVE_INFINITY;
}

function formatDisplayTime(t: string): string {
  const mins = parseTimeToMinutes(t);
  if (!Number.isFinite(mins)) return t;
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const period = h24 < 12 ? "AM" : "PM";
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

interface RbtLiveData {
  loading: boolean;
  sessionsToday: number;
  firstSessionLabel: string;
  supervisionThisWeek: boolean;
  supervisionBcba: string | null;
  announcements: { id: string; title: string; body: string }[];
  trainingTitle: string | null;
  trainingDue: string | null;
}

function useRbtLiveData(userId: string | undefined): RbtLiveData {
  const [state, setState] = useState<RbtLiveData>({
    loading: true,
    sessionsToday: 0,
    firstSessionLabel: "—",
    supervisionThisWeek: false,
    supervisionBcba: null,
    announcements: [],
    trainingTitle: null,
    trainingDue: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (!userId) return;

    (async () => {
      // Look up the employee record for the signed-in user.
      const { data: emp } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .eq("user_id", userId)
        .maybeSingle();

      const today = new Date();
      const dayKey = DAY_KEYS[today.getDay()];

      // Today's scheduled sessions for this RBT (matched by full name).
      let sessionsToday = 0;
      let firstSessionLabel = "—";
      if (emp) {
        const fullName = `${emp.first_name} ${emp.last_name}`.trim();
        const { data: slots } = await supabase
          .from("client_schedule_slots")
          .select("start_time, rbt")
          .eq("day", dayKey)
          .ilike("rbt", `%${fullName}%`);
        const sorted = (slots ?? []).slice().sort((a, b) =>
          parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time),
        );
        sessionsToday = sorted.length;
        firstSessionLabel = sorted[0] ? formatDisplayTime(sorted[0].start_time) : "—";
      }

      // Published HR announcements.
      const { data: annRows } = await supabase
        .from("hr_announcements")
        .select("id, title, body, publish_at")
        .lte("publish_at", new Date().toISOString())
        .order("publish_at", { ascending: false })
        .limit(3);
      const announcements = (annRows ?? []).map((a) => ({
        id: a.id as string,
        title: (a.title as string) ?? "Announcement",
        body: (a.body as string) ?? "",
      }));

      // Next assigned training (any course not yet completed).
      let trainingTitle: string | null = null;
      let trainingDue: string | null = null;
      if (emp) {
        const { data: et } = await supabase
          .from("employee_trainings")
          .select("course_id, status, due_date")
          .eq("employee_id", emp.id)
          .in("status", ["assigned", "in_progress"])
          .order("due_date", { ascending: true, nullsFirst: false })
          .limit(1);
        const next = et?.[0];
        if (next?.course_id) {
          const { data: course } = await supabase
            .from("training_courses")
            .select("title")
            .eq("id", next.course_id)
            .maybeSingle();
          trainingTitle = (course?.title as string) ?? null;
          if (next.due_date) {
            const due = new Date(next.due_date as string);
            trainingDue = `Due ${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
          } else {
            trainingDue = "No due date";
          }
        }
      }

      if (cancelled) return;
      setState({
        loading: false,
        sessionsToday,
        firstSessionLabel,
        supervisionThisWeek: false, // wired in a follow-up when supervision events table is finalized
        supervisionBcba: null,
        announcements,
        trainingTitle,
        trainingDue,
      });
    })();

    return () => { cancelled = true; };
  }, [userId]);

  return state;
}

export default function OSRBT() {
  const { user } = useAuth();
  const name = firstName((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0]);
  const [helpOpen, setHelpOpen] = useState(false);
  const live = useRbtLiveData(user?.id);

  const summary = useMemo(() => {
    if (live.loading) return "Loading your day…";
    if (live.sessionsToday === 0) return "No sessions scheduled for today.";
    return `${live.sessionsToday} session${live.sessionsToday === 1 ? "" : "s"} today · starts ${live.firstSessionLabel}.`;
  }, [live]);

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-3xl space-y-5 px-4 pb-32 pt-5 md:px-6 md:pt-8">
        {/* 1. Welcome Header */}
        <header className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{todayLabel()}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {greeting()}, {name}.
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{summary}</p>
        </header>

        {/* 2. Daily Snapshot */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SnapTile icon={CalendarClock} label="Sessions today" value={live.loading ? "…" : String(live.sessionsToday)} />
          <SnapTile icon={Clock} label="First session" value={live.loading ? "…" : live.firstSessionLabel} />
          <SnapTile icon={CalendarDays} label="Schedule changes" value="None" />
          <SnapTile icon={Stethoscope} label="Supervision this week" value={live.supervisionThisWeek ? "Yes" : "None"} />
        </section>

        {/* 5 + 6. Supervision + Training reminders */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <div className="flex items-center gap-2">
              <Stethoscope className="size-4 text-muted-foreground" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Supervision</p>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">
              {live.supervisionBcba ? `BCBA · ${live.supervisionBcba}` : "No supervision scheduled"}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {live.supervisionThisWeek ? "Scheduled this week" : "Check back as schedule updates"}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Link to="/rbt/supervision" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80">
                Open supervision <ChevronRight className="size-3.5" />
              </Link>
              <span className="text-muted-foreground/40">·</span>
              <Link to="/rbt/messages?focus=bcba" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <MessageSquare className="size-3.5" /> Message
              </Link>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-muted-foreground" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Training</p>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">
              {live.trainingTitle ?? "No assigned training"}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">{live.trainingDue ?? "You're all caught up."}</p>
            <Link to="/rbt/training-academy" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80">
              Continue training <ChevronRight className="size-3.5" />
            </Link>
          </Card>
        </div>

        {/* 7. Announcements */}
        {live.announcements.length > 0 && (
          <section className="space-y-2">
            <SectionLabel>Announcements</SectionLabel>
            <Card className="p-0">
              <ul className="divide-y divide-border/60">
                {live.announcements.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 px-5 py-4">
                    <Megaphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{a.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{a.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        {/* 8. Quick Actions */}
        <section className="space-y-2">
          <SectionLabel>Quick actions</SectionLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <QuickAction to="/rbt/my-day" icon={PlayCircle} label="Open My Day" primary />
            <QuickAction to="/rbt/schedule" icon={CalendarDays} label="View schedule" />
            <QuickAction to="/rbt/messages?focus=bcba" icon={MessageSquare} label="Message BCBA" />
            <QuickAction to="/rbt/training-academy" icon={GraduationCap} label="Continue training" />
            <QuickAction to="/rbt/resources" icon={BookOpen} label="Resource library" />
            <QuickAction to="/rbt/clients" icon={Users} label="My clients" />
          </div>
        </section>
      </div>

      {/* 9. Floating Need Help button */}
      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90 md:bottom-8 md:right-8"
        aria-label="Need help"
      >
        <LifeBuoy className="size-4" /> Need help?
      </button>

      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-sm sm:items-center"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl border border-border/70 bg-card p-6 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">How can we help?</h3>
                <p className="mt-1 text-sm text-muted-foreground">Pick what's going on — we'll route you to the right person.</p>
              </div>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {helpOptions.map((o) => {
                const Icon = o.icon;
                return (
                  <Link
                    key={o.label}
                    to="/rbt/help"
                    onClick={() => setHelpOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-secondary/60 p-3 text-sm font-medium text-foreground transition hover:bg-muted"
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    {o.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </OSShell>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </h3>
  );
}

function SnapTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_4px_16px_-12px_oklch(0.2_0.02_260/0.08)]">
      <Icon className={cn("size-4", accent ? "text-primary" : "text-muted-foreground")} />
      <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-lg font-semibold tracking-tight", accent ? "text-primary" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
  primary,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group flex flex-col items-start gap-2 rounded-2xl border p-4 transition hover:-translate-y-0.5",
        primary
          ? "border-primary/30 bg-primary/5 hover:border-primary/50"
          : "border-border/70 bg-card hover:border-border",
      )}
    >
      <div
        className={cn(
          "grid size-9 place-items-center rounded-xl",
          primary ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        <Icon className="size-4" />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </Link>
  );
}
