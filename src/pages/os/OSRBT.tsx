import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock, GraduationCap, Stethoscope, AlertTriangle, ChevronRight,
  LifeBuoy, CalendarClock, Megaphone, CalendarDays, MessageSquare,
  BookOpen, PlayCircle, X, Phone, ShieldAlert, Wrench, Users, HeartHandshake,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

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

// --- Mock awareness data (wired to real assignment data in a later phase) ---
const snapshot = {
  sessionsToday: 4,
  firstSession: "9:00 AM",
  scheduleChanges: true,
  supervisionThisWeek: true,
};

const alerts = [
  { id: "a1", tone: "warn",   icon: AlertTriangle, title: "Session canceled",      detail: "Riverdale 6:00 PM session was canceled by the family." },
  { id: "a2", tone: "info",   icon: Stethoscope,   title: "BCBA update",            detail: "Jennifer left a note on Mia's program." },
];

const scheduleChanges = [
  { id: "s1", text: "Noah's session moved to 4:30 PM" },
  { id: "s2", text: "Address updated for tomorrow's Decatur session" },
];

const supervisionReminder = {
  bcba: "Jennifer Patel",
  next: "Today · 3:00 PM with Mia Reynolds",
};

const trainingDue = {
  title: "Parent Communication 101",
  due: "Due tomorrow",
};

const announcements = [
  { id: "an1", title: "Holiday scheduling update", body: "Closed Thursday Nov 27. Submit time-off requests by Friday." },
  { id: "an2", title: "New supervision policy",    body: "Monthly supervision must be logged within 7 days." },
];

const helpOptions = [
  { label: "Running late",      icon: Clock },
  { label: "Schedule issue",    icon: CalendarDays },
  { label: "Parent concern",    icon: HeartHandshake },
  { label: "Clinical support",  icon: Stethoscope },
  { label: "Tech / system",     icon: Wrench },
  { label: "Contact BCBA",      icon: Phone },
  { label: "Safety concern",    icon: ShieldAlert },
];

export default function OSRBT() {
  const { user } = useAuth();
  const name = firstName((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0]);
  const [helpOpen, setHelpOpen] = useState(false);

  const attentionCount = alerts.length + scheduleChanges.length;
  const summary = attentionCount === 0
    ? "Everything looks good for today."
    : `${attentionCount} update${attentionCount === 1 ? "" : "s"} need your attention.`;

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
          <SnapTile icon={CalendarClock} label="Sessions today" value={String(snapshot.sessionsToday)} />
          <SnapTile icon={Clock} label="First session" value={snapshot.firstSession} />
          <SnapTile icon={CalendarDays} label="Schedule changes" value={snapshot.scheduleChanges ? "Yes" : "None"} accent={snapshot.scheduleChanges} />
          <SnapTile icon={Stethoscope} label="Supervision this week" value={snapshot.supervisionThisWeek ? "Yes" : "None"} />
        </section>

        {/* 3. Important Alerts */}
        {alerts.length > 0 && (
          <section className="space-y-2">
            <SectionLabel>Important alerts</SectionLabel>
            <div className="space-y-2">
              {alerts.map((a) => {
                const Icon = a.icon;
                const tone = a.tone === "warn"
                  ? "border-amber-500/30 bg-amber-50/40 dark:bg-amber-500/5"
                  : "border-border/70 bg-card";
                const iconTone = a.tone === "warn"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                  : "bg-muted text-foreground";
                return (
                  <div key={a.id} className={cn("rounded-2xl border p-4", tone)}>
                    <div className="flex items-start gap-3">
                      <div className={cn("grid size-9 shrink-0 place-items-center rounded-xl", iconTone)}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{a.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{a.detail}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 4. Schedule Changes */}
        {scheduleChanges.length > 0 && (
          <section className="space-y-2">
            <SectionLabel>Schedule changes</SectionLabel>
            <Card className="p-0">
              <ul className="divide-y divide-border/60">
                {scheduleChanges.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                    <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
                    <p className="min-w-0 flex-1 text-sm text-foreground">{c.text}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        {/* 5 + 6. Supervision + Training reminders */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <div className="flex items-center gap-2">
              <Stethoscope className="size-4 text-muted-foreground" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Supervision</p>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">BCBA · {supervisionReminder.bcba}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{supervisionReminder.next}</p>
            <div className="mt-3 flex items-center gap-2">
              <Link to="/rbt/supervision" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80">
                Open supervision <ChevronRight className="size-3.5" />
              </Link>
              <span className="text-muted-foreground/40">·</span>
              <Link to="/rbt/messages" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <MessageSquare className="size-3.5" /> Message
              </Link>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-muted-foreground" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Training</p>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">{trainingDue.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{trainingDue.due}</p>
            <Link to="/rbt/training-academy" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80">
              Continue training <ChevronRight className="size-3.5" />
            </Link>
          </Card>
        </div>

        {/* 7. Announcements */}
        <section className="space-y-2">
          <SectionLabel>Announcements</SectionLabel>
          <Card className="p-0">
            <ul className="divide-y divide-border/60">
              {announcements.map((a) => (
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
