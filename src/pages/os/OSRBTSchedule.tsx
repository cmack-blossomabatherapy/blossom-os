import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock, MapPin, Stethoscope, ChevronDown, ChevronUp, ChevronRight,
  LifeBuoy, MessageSquare, Phone, AlertTriangle, ShieldAlert, Wrench,
  CalendarDays, HeartHandshake, CalendarClock, Navigation, FileText,
  Sparkles, X, User, CircleDot,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { cn } from "@/lib/utils";

// RBT — My Schedule. Personal schedule visibility. Mobile-first, calm.

type Status = "confirmed" | "updated" | "canceled" | "supervision" | "pending";

type Session = {
  id: string;
  startISO: string;
  endISO: string;
  client: string;
  type: string;
  locationType: "Home" | "Clinic" | "School";
  location: string;
  address: string;
  bcba: string;
  status: Status;
  notes?: string[];
};

type Change = { id: string; text: string; tone: "amber" | "neutral" | "destructive"; when: string };

const helpOptions = [
  { label: "Running late",     icon: Clock },
  { label: "Schedule issue",   icon: CalendarDays },
  { label: "Parent concern",   icon: HeartHandshake },
  { label: "Clinical support", icon: Stethoscope },
  { label: "Tech / system",    icon: Wrench },
  { label: "Contact BCBA",     icon: Phone },
  { label: "Safety concern",   icon: ShieldAlert },
];

// --- Mock schedule (replace with assignment-scoped data) ---
function at(daysAhead: number, h: number, m: number) {
  const d = new Date(); d.setDate(d.getDate() + daysAhead); d.setHours(h, m, 0, 0);
  return d.toISOString();
}
function endAt(iso: string, hours: number) {
  const d = new Date(iso); d.setHours(d.getHours() + hours); return d.toISOString();
}

const SESSIONS: Session[] = [
  { id: "t1", startISO: at(0, 12, 30), endISO: at(0, 14, 30), client: "Aria J.", type: "1:1 Therapy",      locationType: "Clinic", location: "Sandy Springs Clinic", address: "5555 Glenridge Dr, Atlanta GA", bcba: "Marcus Lee",     status: "updated",     notes: ["Time moved from 1:00 PM"] },
  { id: "t2", startISO: at(0, 15, 0),  endISO: at(0, 17, 0), client: "Mia R.",  type: "1:1 + Supervision", locationType: "Home",   location: "Decatur, GA",          address: "210 E Ponce de Leon, Decatur GA", bcba: "Jennifer Patel", status: "supervision", notes: ["BCBA arrives 3:15 PM"] },
  { id: "t3", startISO: at(0, 17, 30), endISO: at(0, 19, 0), client: "Noah B.", type: "1:1 Therapy",      locationType: "Clinic", location: "Sandy Springs Clinic", address: "5555 Glenridge Dr, Atlanta GA", bcba: "Marcus Lee",     status: "confirmed" },
  { id: "t4", startISO: at(1, 9, 0),   endISO: at(1, 11, 0), client: "Liam C.", type: "1:1 Therapy",      locationType: "Home",   location: "Buckhead, Atlanta",    address: "1820 Peachtree Rd, Atlanta GA",   bcba: "Jennifer Patel", status: "confirmed",   notes: ["Use side entry door"] },
  { id: "t5", startISO: at(1, 14, 0),  endISO: at(1, 16, 0), client: "Aria J.", type: "1:1 Therapy",      locationType: "Clinic", location: "Sandy Springs Clinic", address: "5555 Glenridge Dr, Atlanta GA", bcba: "Marcus Lee",     status: "confirmed" },
  { id: "t6", startISO: at(2, 10, 0),  endISO: at(2, 12, 0), client: "Ella W.", type: "1:1 Therapy",      locationType: "Home",   location: "Marietta, GA",         address: "880 Cobb Pkwy, Marietta GA",      bcba: "Priya Shah",     status: "confirmed",   notes: ["Allergy: peanuts"] },
  { id: "t7", startISO: at(2, 16, 30), endISO: at(2, 18, 0), client: "Noah B.", type: "1:1 Therapy",      locationType: "Clinic", location: "Sandy Springs Clinic", address: "5555 Glenridge Dr, Atlanta GA", bcba: "Marcus Lee",     status: "pending" },
  { id: "t8", startISO: at(3, 9, 30),  endISO: at(3, 11, 0), client: "Liam C.", type: "1:1 Therapy",      locationType: "Home",   location: "Buckhead, Atlanta",    address: "1820 Peachtree Rd, Atlanta GA",   bcba: "Jennifer Patel", status: "canceled" },
  { id: "t9", startISO: at(4, 12, 0),  endISO: at(4, 14, 0), client: "Mia R.",  type: "1:1 Therapy",      locationType: "Home",   location: "Decatur, GA",          address: "210 E Ponce de Leon, Decatur GA", bcba: "Jennifer Patel", status: "confirmed" },
];

const CHANGES: Change[] = [
  { id: "c1", text: "Aria's session today moved to 12:30 PM (was 1:00 PM)", tone: "amber",       when: "2h ago" },
  { id: "c2", text: "Thursday Buckhead session was canceled by the family",  tone: "destructive", when: "Yesterday" },
  { id: "c3", text: "Address updated for Wednesday's Marietta session",      tone: "neutral",     when: "Yesterday" },
];

function timeFmt(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - now.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}
function dayKey(iso: string) {
  const d = new Date(iso); d.setHours(0, 0, 0, 0); return d.toISOString();
}
function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function countdown(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Starting now";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `in ${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return `in ${h}h${m ? ` ${m}m` : ""}`;
}

export default function OSRBTSchedule() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "today" | "week">("all");

  const upcoming = useMemo(
    () => SESSIONS.filter((s) => new Date(s.endISO).getTime() >= Date.now() - 30 * 60_000),
    [],
  );

  const today = upcoming.filter((s) => dayKey(s.startISO) === dayKey(new Date().toISOString()));
  const weekEnd = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.getTime(); })();
  const week = upcoming.filter((s) => new Date(s.startISO).getTime() <= weekEnd);

  const filteredList = filter === "today" ? today : filter === "week" ? week : upcoming;

  const grouped = useMemo(() => {
    const m = new Map<string, Session[]>();
    for (const s of filteredList) {
      const k = dayKey(s.startISO);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(s);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredList]);

  const nextSession = upcoming.find((s) => s.status !== "canceled" && new Date(s.startISO).getTime() > Date.now());

  // Snapshot
  const sessionsToday = today.filter((s) => s.status !== "canceled").length;
  const sessionsWeek = week.filter((s) => s.status !== "canceled").length;
  const changesCount = CHANGES.length;

  // Week strip
  const weekStrip = useMemo(() => {
    const days: { iso: string; count: number; supervision: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() + i); d.setHours(0, 0, 0, 0);
      const iso = d.toISOString();
      const items = SESSIONS.filter((s) => dayKey(s.startISO) === iso && s.status !== "canceled");
      days.push({ iso, count: items.length, supervision: items.some((s) => s.status === "supervision") });
    }
    return days;
  }, []);

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-32 pt-5 md:px-6 md:pt-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <Link to="/rbt" className="hover:text-foreground transition-colors">RBT</Link>
          <ChevronRight className="size-3" />
          <span>Clients & Sessions</span>
          <ChevronRight className="size-3" />
          <span>My Schedule</span>
        </div>
        {/* 1. Header */}
        <header className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Clients & Sessions</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">My Schedule</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {nextSession
              ? <>Next session {countdown(nextSession.startISO)} · {nextSession.client} at {timeFmt(nextSession.startISO)}.</>
              : <>You're all wrapped up — enjoy the rest of your day.</>}
          </p>
        </header>

        {/* 2. Snapshot */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SnapTile icon={CalendarClock} label="Sessions today" value={String(sessionsToday)} />
          <SnapTile icon={CalendarDays}  label="This week"      value={String(sessionsWeek)} />
          <SnapTile icon={Clock}         label="Next session"   value={nextSession ? timeFmt(nextSession.startISO) : "—"} />
          <SnapTile icon={AlertTriangle} label="Updates"        value={String(changesCount)} accent={changesCount > 0} />
        </section>

        {/* 6. Weekly view (compact strip) */}
        <section className="space-y-2">
          <h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">This week</h2>
          <div className="grid grid-cols-7 gap-2">
            {weekStrip.map((d) => {
              const dt = new Date(d.iso);
              const isToday = dayKey(d.iso) === dayKey(new Date().toISOString());
              return (
                <div
                  key={d.iso}
                  className={cn(
                    "rounded-xl border p-2 text-center",
                    isToday ? "border-primary/40 bg-primary/5" : "border-border/70 bg-card",
                  )}
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {dt.toLocaleDateString(undefined, { weekday: "short" })}
                  </p>
                  <p className={cn("text-base font-semibold tabular-nums", isToday ? "text-primary" : "text-foreground")}>
                    {dt.getDate()}
                  </p>
                  <div className="mt-1 flex items-center justify-center gap-0.5">
                    {d.count === 0
                      ? <span className="text-[10px] text-muted-foreground/60">—</span>
                      : Array.from({ length: Math.min(d.count, 4) }).map((_, i) => (
                          <span key={i} className={cn("inline-block size-1 rounded-full", isToday ? "bg-primary" : "bg-muted-foreground/50")} />
                        ))}
                    {d.supervision && <CircleDot className="ml-0.5 size-2.5 text-primary" />}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. Schedule changes */}
        {CHANGES.length > 0 && (
          <section className="space-y-2">
            <h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Schedule changes</h2>
            <div className="space-y-2">
              {CHANGES.map((c) => {
                const tone =
                  c.tone === "amber" ? "border-amber-500/30 bg-amber-50/40 dark:bg-amber-500/5"
                  : c.tone === "destructive" ? "border-destructive/30 bg-destructive/5"
                  : "border-border/70 bg-card";
                const iconCls =
                  c.tone === "amber" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                  : c.tone === "destructive" ? "bg-destructive/15 text-destructive"
                  : "bg-muted text-foreground";
                return (
                  <div key={c.id} className={cn("flex items-start gap-3 rounded-2xl border p-4", tone)}>
                    <div className={cn("grid size-9 shrink-0 place-items-center rounded-xl", iconCls)}>
                      <AlertTriangle className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{c.text}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{c.when}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 3 + 4. Timeline with grouped session cards */}
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Upcoming</h2>
            <FilterPills value={filter} onChange={setFilter} />
          </div>

          {grouped.length === 0 ? (
            <div className="rounded-2xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
              Nothing scheduled in this range.
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map(([key, items]) => (
                <DayGroup key={key} dayISO={key} sessions={items} onHelp={() => setHelpOpen(true)} />
              ))}
            </div>
          )}
        </section>

        {/* 7. Quick communication */}
        <section className="space-y-2">
          <h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <QuickAction icon={MessageSquare}   label="Message BCBA" to="/rbt/messages?focus=bcba" />
            <QuickAction icon={Phone}           label="Contact scheduling" to="/rbt/messages?focus=scheduling" />
            <QuickAction icon={Clock}           label="Running late"        onClick={() => setHelpOpen(true)} />
            <QuickAction icon={CalendarDays}    label="Schedule concern"    onClick={() => setHelpOpen(true)} />
            <QuickAction icon={Stethoscope}     label="Clinical help"       onClick={() => setHelpOpen(true)} />
            <QuickAction icon={Wrench}          label="Tech support"        onClick={() => setHelpOpen(true)} />
          </div>
        </section>
      </div>

      {/* Floating Need Help */}
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

function DayGroup({ dayISO, sessions, onHelp }: { dayISO: string; sessions: Session[]; onHelp: () => void }) {
  const active = sessions.filter((s) => s.status !== "canceled").length;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between px-1">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{dayLabel(dayISO)}</h3>
        <span className="text-xs text-muted-foreground">{shortDate(dayISO)} · {active} session{active === 1 ? "" : "s"}</span>
      </div>
      <ol className="relative space-y-2.5">
        <span aria-hidden className="absolute left-[19px] top-2 bottom-2 w-px bg-border/70" />
        {sessions.map((s) => <SessionRow key={s.id} session={s} onHelp={onHelp} />)}
      </ol>
    </div>
  );
}

function SessionRow({ session, onHelp }: { session: Session; onHelp: () => void }) {
  const [open, setOpen] = useState(false);
  const tone = statusTone(session.status);

  return (
    <li className="relative pl-10">
      <span
        className={cn(
          "absolute left-2 top-4 grid size-6 place-items-center rounded-full border bg-card",
          tone.dot,
        )}
      >
        <CircleDot className="size-3" />
      </span>

      <div
        className={cn(
          "rounded-2xl border border-border/70 bg-card transition",
          "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_4px_16px_-12px_oklch(0.2_0.02_260/0.06)]",
          session.status === "canceled" && "opacity-60",
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
            <div className="flex flex-wrap items-center gap-1.5">
              <p className={cn("truncate text-sm font-medium text-foreground", session.status === "canceled" && "line-through")}>
                {session.client}
              </p>
              <StatusPill status={session.status} />
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {session.type} · {session.locationType} · {session.location}
            </p>
          </div>
          {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </button>

        {open && (
          <div className="space-y-3 border-t border-border/60 px-4 py-4">
            <div className="grid gap-1.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-3.5" /> {timeFmt(session.startISO)} – {timeFmt(session.endISO)}
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 size-3.5" /> {session.address}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Stethoscope className="size-3.5" /> BCBA · {session.bcba}
              </div>
            </div>

            {session.notes && session.notes.length > 0 && (
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Notes</p>
                <ul className="mt-1.5 space-y-1 text-sm text-foreground">
                  {session.notes.map((n, i) => (
                    <li key={i} className="flex gap-2"><span className="text-muted-foreground">•</span><span>{n}</span></li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <ActionBtn icon={User} label="Open client" to="/rbt/clients" />
              <ActionBtn
                icon={Navigation}
                label="Directions"
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(session.address)}`}
                external
              />
              <ActionBtn icon={MessageSquare} label="Message BCBA" to="/rbt/messages?focus=bcba" />
              <ActionBtn icon={FileText}      label="Session resources" to="/rbt/resources" />
              <ActionBtn icon={AlertTriangle} label="Running late" onClick={onHelp} />
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

function statusTone(s: Status) {
  switch (s) {
    case "confirmed":   return { dot: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400" };
    case "updated":     return { dot: "border-amber-500/40 text-amber-600 dark:text-amber-400" };
    case "canceled":    return { dot: "border-border/70 text-muted-foreground" };
    case "supervision": return { dot: "border-primary/40 text-primary" };
    case "pending":     return { dot: "border-border/70 text-muted-foreground" };
  }
}

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { label: string; cls: string }> = {
    confirmed:   { label: "Confirmed",   cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
    updated:     { label: "Updated",     cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    canceled:    { label: "Canceled",    cls: "bg-muted text-muted-foreground" },
    supervision: { label: "Supervision", cls: "bg-primary/10 text-primary" },
    pending:     { label: "Pending",     cls: "bg-muted text-muted-foreground" },
  };
  const v = map[status];
  return <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium", v.cls)}>{v.label}</span>;
}

function FilterPills({
  value, onChange,
}: { value: "all" | "today" | "week"; onChange: (v: "all" | "today" | "week") => void }) {
  const opts: { v: typeof value; label: string }[] = [
    { v: "today", label: "Today" },
    { v: "week",  label: "Week"  },
    { v: "all",   label: "All"   },
  ];
  return (
    <div className="inline-flex rounded-full border border-border/70 bg-muted/50 p-1">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition",
            value === o.v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ActionBtn({
  icon: Icon, label, to, href, onClick, external,
}: {
  icon: React.ComponentType<{ className?: string }>; label: string;
  to?: string; href?: string; onClick?: () => void; external?: boolean;
}) {
  const cls = "inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition hover:bg-muted";
  if (href) return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={cls}><Icon className="size-3.5" /> {label}</a>;
  if (to) return <Link to={to} className={cls}><Icon className="size-3.5" /> {label}</Link>;
  return <button type="button" onClick={onClick} className={cls}><Icon className="size-3.5" /> {label}</button>;
}

function SnapTile({
  icon: Icon, label, value, accent,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_4px_16px_-12px_oklch(0.2_0.02_260/0.08)]">
      <Icon className={cn("size-4", accent ? "text-primary" : "text-muted-foreground")} />
      <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-lg font-semibold tracking-tight", accent ? "text-primary" : "text-foreground")}>{value}</p>
    </div>
  );
}

function QuickAction({
  to, onClick, icon: Icon, label,
}: { to?: string; onClick?: () => void; icon: React.ComponentType<{ className?: string }>; label: string }) {
  const inner = (
    <>
      <div className="grid size-9 place-items-center rounded-xl bg-muted text-foreground"><Icon className="size-4" /></div>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <ChevronRight className="ml-auto size-4 text-muted-foreground" />
    </>
  );
  const cls = "flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 transition hover:border-border hover:-translate-y-0.5";
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  return <button type="button" onClick={onClick} className={cls + " text-left"}>{inner}</button>;
}

function HelpSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl border border-border/70 bg-card p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">How can we help?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Pick what's going on — we'll route you to the right person.</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {helpOptions.map((o) => {
            const Icon = o.icon;
            return (
              <Link key={o.label} to="/rbt/help" onClick={onClose} className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-secondary/60 p-3 text-sm font-medium text-foreground transition hover:bg-muted">
                <Icon className="size-4 text-muted-foreground" />{o.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
