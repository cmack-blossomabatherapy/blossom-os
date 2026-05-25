import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock, MapPin, Stethoscope, ChevronDown, ChevronUp, ChevronRight,
  LifeBuoy, MessageSquare, Phone, Navigation, AlertTriangle, ShieldAlert,
  Wrench, CalendarDays, HeartHandshake, CheckCircle2, Circle, Sparkles,
  X, User, CalendarClock,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// RBT My Day — primary operational workspace. Mobile-first, calm, execution-focused.

type SessionStatus = "completed" | "in_progress" | "upcoming" | "canceled";
type Session = {
  id: string;
  startISO: string;
  endISO: string;
  client: string;
  type: string;
  location: string;
  address: string;
  bcba: string;
  status: SessionStatus;
  flags?: { supervision?: boolean; scheduleChange?: boolean; parentNote?: boolean };
  prep?: string[];
};

// Mock — wired to real assignments later.
function makeToday(): Session[] {
  const d = new Date();
  const at = (h: number, m: number) => {
    const x = new Date(d); x.setHours(h, m, 0, 0); return x.toISOString();
  };
  return [
    { id: "s1", startISO: at(9, 0),  endISO: at(11, 0), client: "Liam C.",  type: "1:1 Therapy",       location: "Home · Buckhead",        address: "1820 Peachtree Rd, Atlanta GA", bcba: "Jennifer Patel", status: "completed", prep: ["Bring token board", "Mom prefers entry via side door"] },
    { id: "s2", startISO: at(12, 30), endISO: at(14, 30), client: "Aria J.", type: "1:1 Therapy",      location: "Clinic · Sandy Springs", address: "5555 Glenridge Dr, Atlanta GA", bcba: "Marcus Lee",     status: "upcoming",  flags: { scheduleChange: true }, prep: ["Time moved from 1:00 PM", "Continue mand training program"] },
    { id: "s3", startISO: at(15, 0),  endISO: at(17, 0), client: "Mia R.",   type: "1:1 + Supervision", location: "Home · Decatur",        address: "210 E Ponce de Leon, Decatur GA", bcba: "Jennifer Patel", status: "upcoming",  flags: { supervision: true, parentNote: true }, prep: ["Supervision: BCBA arrives 3:15 PM", "Parent note: nap may push start 10 min"] },
    { id: "s4", startISO: at(17, 30), endISO: at(19, 0), client: "Noah B.",  type: "1:1 Therapy",      location: "Clinic · Sandy Springs", address: "5555 Glenridge Dr, Atlanta GA", bcba: "Marcus Lee",     status: "upcoming",  prep: ["Reinforcer: bubbles"] },
  ];
}

const helpOptions = [
  { label: "Running late",     icon: Clock },
  { label: "Schedule issue",   icon: CalendarDays },
  { label: "Parent concern",   icon: HeartHandshake },
  { label: "Clinical support", icon: Stethoscope },
  { label: "Tech / system",    icon: Wrench },
  { label: "Contact BCBA",     icon: Phone },
  { label: "Safety concern",   icon: ShieldAlert },
];

function firstName(n?: string | null) { return n ? n.trim().split(/\s+/)[0] : "there"; }
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
function timeFmt(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
function countdown(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Starting now";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `Starts in ${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return `Starts in ${h}h${m ? ` ${m}m` : ""}`;
}

export default function OSRBTMyDay() {
  const { user } = useAuth();
  const name = firstName((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0]);
  const sessions = useMemo(makeToday, []);
  const [helpOpen, setHelpOpen] = useState(false);
  const [, force] = useState(0);

  // Tick countdown every minute
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const next = sessions.find((s) => s.status === "upcoming");
  const completed = sessions.filter((s) => s.status === "completed").length;
  const total = sessions.length;

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-3xl space-y-5 px-4 pb-32 pt-5 md:px-6 md:pt-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <Link to="/rbt" className="hover:text-foreground transition-colors">RBT</Link>
          <ChevronRight className="size-3" />
          <span>My Day</span>
        </div>
        {/* 1. Today Header */}
        <header className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{todayLabel()}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {greeting()}, {name}.
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {total} session{total === 1 ? "" : "s"} today
            {next ? ` · ${countdown(next.startISO).toLowerCase()}` : " · you're all wrapped up"}.
          </p>
        </header>

        {/* 2. Next Session Focus Card */}
        {next && <NextSessionCard session={next} onHelp={() => setHelpOpen(true)} />}

        {/* 3. Today Timeline + 4. Session Cards */}
        <section className="space-y-2">
          <h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Today's timeline
          </h2>
          <div className="relative">
            <div aria-hidden className="absolute left-[19px] top-2 bottom-2 w-px bg-border/70" />
            <ul className="space-y-3">
              {sessions.map((s) => (
                <SessionItem key={s.id} session={s} onHelp={() => setHelpOpen(true)} />
              ))}
            </ul>
          </div>
        </section>

        {/* 6. Quick Communication Actions */}
        <section className="space-y-2">
          <h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <QuickAction icon={MessageSquare} label="Message BCBA" to="/rbt/messages?focus=bcba" />
            <QuickAction icon={Phone}         label="Contact scheduling" to="/rbt/messages?focus=scheduling" />
            <QuickAction icon={Clock}         label="Running late" onClick={() => setHelpOpen(true)} />
            <QuickAction icon={Stethoscope}   label="Clinical help" onClick={() => setHelpOpen(true)} />
            <QuickAction icon={HeartHandshake} label="Parent concern" onClick={() => setHelpOpen(true)} />
            <QuickAction icon={Wrench}        label="Tech support" onClick={() => setHelpOpen(true)} />
          </div>
        </section>

        {/* 8. End-of-Day Summary */}
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" />
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Today at a glance</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Completed" value={`${completed} / ${total}`} />
            <Stat label="Supervision" value={sessions.some((s) => s.flags?.supervision) ? "Today" : "None"} />
            <Stat label="Schedule changes" value={String(sessions.filter((s) => s.flags?.scheduleChange).length)} />
            <Stat label="Tomorrow" value="3 sessions" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Nice work today. Your next supervision is Wednesday with Jennifer.
          </p>
        </section>
      </div>

      {/* 9. Floating Need Help */}
      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90 md:bottom-8 md:right-8"
        aria-label="Need help"
      >
        <LifeBuoy className="size-4" /> Need help?
      </button>

      {helpOpen && <HelpSheet onClose={() => setHelpOpen(false)} />}
    </OSShell>
  );
}

// --- Subcomponents ---

function NextSessionCard({ session, onHelp }: { session: Session; onHelp: () => void }) {
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(session.address)}`;
  return (
    <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/8 via-card to-card p-6 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_12px_32px_-16px_oklch(0.2_0.02_260/0.12)]">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
          <Sparkles className="size-3.5" /> Next session
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Clock className="size-3.5" /> {countdown(session.startISO)}
        </span>
      </div>

      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{session.client}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{session.type}</p>

      <div className="mt-4 space-y-1.5 text-sm text-foreground">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          <span>{timeFmt(session.startISO)} – {timeFmt(session.endISO)}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 text-muted-foreground" />
          <span>{session.location}<span className="block text-xs text-muted-foreground">{session.address}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Stethoscope className="size-4 text-muted-foreground" />
          <span>BCBA · {session.bcba}</span>
        </div>
      </div>

      {(session.flags?.scheduleChange || session.flags?.supervision || session.flags?.parentNote) && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {session.flags?.scheduleChange && <Pill tone="amber">Schedule change</Pill>}
          {session.flags?.supervision && <Pill tone="primary">Supervision today</Pill>}
          {session.flags?.parentNote && <Pill>Parent note</Pill>}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <PrimaryAction to={`/rbt/clients`} icon={User} label="Open client" />
        <SecondaryAction href={directions} icon={Navigation} label="Directions" external />
        <SecondaryAction to="/rbt/messages?focus=bcba" icon={MessageSquare} label="Message BCBA" />
        <SecondaryAction onClick={onHelp} icon={LifeBuoy} label="Need help" />
      </div>
    </section>
  );
}

function SessionItem({ session, onHelp }: { session: Session; onHelp: () => void }) {
  const [open, setOpen] = useState(false);
  const isDone = session.status === "completed";
  const isCanceled = session.status === "canceled";

  return (
    <li className="relative pl-10">
      {/* timeline dot */}
      <span
        aria-hidden
        className={cn(
          "absolute left-2 top-4 grid size-6 place-items-center rounded-full border bg-card",
          isDone ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                 : isCanceled ? "border-border/70 text-muted-foreground"
                 : "border-primary/40 text-primary",
        )}
      >
        {isDone ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-2.5 fill-current" />}
      </span>

      <div
        className={cn(
          "rounded-2xl border border-border/70 bg-card transition",
          "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_4px_16px_-12px_oklch(0.2_0.02_260/0.06)]",
          isCanceled && "opacity-60",
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        >
          <div className="w-16 shrink-0 text-sm font-medium tabular-nums text-foreground">
            {timeFmt(session.startISO)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className={cn("truncate text-sm font-medium text-foreground", isCanceled && "line-through")}>
                {session.client}
              </p>
              {session.flags?.supervision && <Pill tone="primary" size="xs">Supervision</Pill>}
              {session.flags?.scheduleChange && <Pill tone="amber" size="xs">Changed</Pill>}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {session.type} · {session.location}
            </p>
          </div>
          {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </button>

        {open && (
          <div className="border-t border-border/60 px-4 py-4 space-y-3">
            <div className="grid gap-1.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-3.5" /> {session.address}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Stethoscope className="size-3.5" /> BCBA · {session.bcba}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="size-3.5" /> {timeFmt(session.startISO)} – {timeFmt(session.endISO)}
              </div>
            </div>

            {session.prep && session.prep.length > 0 && (
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Session prep</p>
                <ul className="mt-1.5 space-y-1 text-sm text-foreground">
                  {session.prep.map((p, i) => (
                    <li key={i} className="flex gap-2"><span className="text-muted-foreground">•</span><span>{p}</span></li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Link
                to="/rbt/clients"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-muted"
              >
                <User className="size-3.5" /> Open client
              </Link>
              <Link
                to="/rbt/messages"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-muted"
              >
                <MessageSquare className="size-3.5" /> Message BCBA
              </Link>
              <button
                type="button"
                onClick={onHelp}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-muted"
              >
                <AlertTriangle className="size-3.5" /> Report issue
              </button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

function Pill({
  children, tone, size = "sm",
}: { children: React.ReactNode; tone?: "primary" | "amber"; size?: "xs" | "sm" }) {
  const base = "inline-flex items-center rounded-full font-medium";
  const sizing = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]";
  const tones =
    tone === "primary" ? "bg-primary/10 text-primary"
    : tone === "amber" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
    : "bg-muted text-muted-foreground";
  return <span className={cn(base, sizing, tones)}>{children}</span>;
}

function PrimaryAction({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
    >
      <Icon className="size-4" /> {label}
    </Link>
  );
}

function SecondaryAction({
  to, href, onClick, icon: Icon, label, external,
}: {
  to?: string; href?: string; onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>; label: string; external?: boolean;
}) {
  const cls = "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-secondary px-3 text-sm font-medium text-secondary-foreground transition hover:bg-muted";
  if (href) return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={cls}><Icon className="size-4" /> {label}</a>;
  if (to) return <Link to={to} className={cls}><Icon className="size-4" /> {label}</Link>;
  return <button type="button" onClick={onClick} className={cls}><Icon className="size-4" /> {label}</button>;
}

function QuickAction({
  to, onClick, icon: Icon, label,
}: { to?: string; onClick?: () => void; icon: React.ComponentType<{ className?: string }>; label: string }) {
  const inner = (
    <>
      <div className="grid size-9 place-items-center rounded-xl bg-muted text-foreground">
        <Icon className="size-4" />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <ChevronRight className="ml-auto size-4 text-muted-foreground" />
    </>
  );
  const cls = "flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 transition hover:border-border hover:-translate-y-0.5";
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  return <button type="button" onClick={onClick} className={cls + " text-left"}>{inner}</button>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function HelpSheet({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-sm sm:items-center"
      onClick={onClose}
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
            onClick={onClose}
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
                onClick={onClose}
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
  );
}
