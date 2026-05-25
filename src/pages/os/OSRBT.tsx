import { Link } from "react-router-dom";
import {
  Clock, MapPin, GraduationCap, Stethoscope,
  AlertTriangle, ChevronRight, LifeBuoy, ArrowRight, CheckCircle2,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// RBT Dashboard — calm, mobile-first, assignment-scoped.
// One focal point (next session). Everything else is a quiet reminder.

type Session = {
  time: string;
  client: string;
  type: string;
  location: string;
  bcba: string;
  status: "upcoming" | "supervision";
};

// Mock — wired to real assignment data in a later phase.
const today: Session[] = [
  { time: "9:00 AM",  client: "Liam Carter",   type: "1:1 Therapy",       location: "Home · Buckhead",        bcba: "Jennifer P.", status: "upcoming" },
  { time: "12:30 PM", client: "Aria Johnson",  type: "1:1 Therapy",       location: "Clinic · Sandy Springs", bcba: "Marcus L.",   status: "upcoming" },
  { time: "3:00 PM",  client: "Mia Reynolds",  type: "1:1 + Supervision", location: "Home · Decatur",         bcba: "Jennifer P.", status: "supervision" },
  { time: "5:15 PM",  client: "Noah Brooks",   type: "1:1 Therapy",       location: "Clinic · Sandy Springs", bcba: "Marcus L.",   status: "upcoming" },
];

const scheduleChange = {
  message: "Aria Johnson moved to 12:30 PM (was 1 PM)",
  when: "Updated 2h ago",
};

const supervisionReminder = {
  bcba: "Jennifer P.",
  next: "Today · 3:00 PM with Mia Reynolds",
};

const trainingDue = {
  title: "Parent Communication 101",
  due: "Due tomorrow",
};

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

export default function OSRBT() {
  const { user } = useAuth();
  const name = firstName((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0]);

  const next = today.find((s) => s.status === "upcoming" || s.status === "supervision");

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-3xl space-y-5 px-4 pb-16 pt-5 md:px-6 md:pt-8">
        {/* Greeting */}
        <header>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{todayLabel()}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {greeting()}, {name}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You have {today.length} sessions today.
          </p>
        </header>

        {/* Next session — single focal point */}
        {next && (
          <Card className="bg-gradient-to-br from-primary/5 via-card to-card">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                Next session
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" /> {next.time}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
              {next.client}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{next.type}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" /> {next.location}</span>
              <span className="inline-flex items-center gap-1.5"><Stethoscope className="size-3.5" /> BCBA · {next.bcba}</span>
            </div>
            <Link
              to="/rbt/my-day"
              className="mt-4 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Start my day <ArrowRight className="size-4" />
            </Link>
          </Card>
        )}

        {/* Schedule change alert */}
        {scheduleChange && (
          <Card className="border-amber-500/30 bg-amber-50/40 dark:bg-amber-500/5">
            <div className="flex items-start gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Schedule change</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{scheduleChange.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{scheduleChange.when}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Today's schedule — quiet list */}
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h3 className="text-base font-semibold tracking-tight text-foreground">Today's schedule</h3>
            <Link to="/rbt/schedule" className="text-sm text-primary hover:opacity-80">View all</Link>
          </div>
          <Card className="p-0">
            <ul className="divide-y divide-border/60">
              {today.map((s) => (
                <li key={s.time + s.client} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-20 shrink-0 text-sm font-medium tabular-nums text-foreground">{s.time}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{s.client}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.type} · {s.location}</p>
                  </div>
                  {s.status === "supervision" && (
                    <span className="hidden shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary sm:inline">
                      Supervision
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* Quiet reminders — supervision + training */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <div className="flex items-center gap-2">
              <Stethoscope className="size-4 text-muted-foreground" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Supervision</p>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">BCBA · {supervisionReminder.bcba}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{supervisionReminder.next}</p>
            <Link to="/rbt/supervision" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80">
              Open supervision <ChevronRight className="size-3.5" />
            </Link>
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

        {/* Need help — always one tap away */}
        <Card className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
              <LifeBuoy className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Need help with something?</p>
              <p className="text-xs text-muted-foreground">Schedule, clinical, parent, tech or safety — we've got you.</p>
            </div>
          </div>
          <Link
            to="/rbt/help"
            className="inline-flex h-10 shrink-0 items-center rounded-xl border border-border/70 bg-secondary px-4 text-sm font-medium text-secondary-foreground transition hover:bg-muted"
          >
            Get help
          </Link>
        </Card>

        {/* You're set — calm closer */}
        <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          You're all caught up. Have a great day.
        </div>
      </div>
    </OSShell>
  );
}
