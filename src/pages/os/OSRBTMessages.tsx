import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronRight, MessageSquare, Phone, Calendar, Clock, MapPin, LifeBuoy, X,
  HeartHandshake, ClipboardCheck, Wrench, Users, ShieldAlert, AlertTriangle,
  CheckCircle2, Megaphone, GraduationCap, CalendarClock, Sparkles, BellRing,
  ArrowRight, UserCog,
} from "lucide-react";

type Priority = "urgent" | "schedule" | "info";
type Alert = {
  id: string;
  priority: Priority;
  title: string;
  detail: string;
  iso: string;
  cta?: { label: string; to?: string };
};

type Update = {
  id: string;
  iso: string;
  source: "bcba" | "scheduling" | "training" | "client" | "system";
  title: string;
  detail: string;
};

type ScheduleChange = {
  id: string;
  iso: string;
  kind: "canceled" | "rescheduled" | "location" | "supervision";
  title: string;
  detail: string;
};

type BcbaMessage = {
  id: string;
  iso: string;
  preview: string;
};

type Announcement = {
  id: string;
  iso: string;
  category: "training" | "policy" | "holiday" | "state" | "weather";
  title: string;
  detail: string;
};

type Action = {
  id: string;
  title: string;
  detail: string;
  cta: string;
  to?: string;
};

const BCBA = { name: "Dr. Maya Patel", initials: "MP" };

const ALERTS: Alert[] = [
  {
    id: "a1",
    priority: "urgent",
    title: "Today's 4:00 PM session canceled",
    detail: "Parent canceled — no action needed from you.",
    iso: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    cta: { label: "View schedule", to: "/rbt/schedule" },
  },
  {
    id: "a2",
    priority: "schedule",
    title: "Friday supervision moved to Tuesday",
    detail: "Dr. Patel rescheduled to Tuesday at 4:00 PM.",
    iso: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    cta: { label: "View supervision", to: "/rbt/supervision" },
  },
];

const UPDATES: Update[] = [
  { id: "u1", iso: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), source: "bcba", title: "BCBA added supervision notes", detail: "Maya shared two quick wins from yesterday's session." },
  { id: "u2", iso: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), source: "client", title: "Parent confirmed tomorrow's session", detail: "J.R. — 3:00 PM at home." },
  { id: "u3", iso: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), source: "scheduling", title: "New session added Thursday", detail: "M.K. — 10:00 AM, clinic." },
  { id: "u4", iso: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), source: "training", title: "Training reminder due Friday", detail: "Ethics refresher · 15 min." },
];

const SCHEDULE_CHANGES: ScheduleChange[] = [
  { id: "s1", iso: new Date(Date.now() - 1000 * 60 * 35).toISOString(), kind: "canceled", title: "Today · 4:00 PM session canceled", detail: "J.R. — parent canceled." },
  { id: "s2", iso: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), kind: "supervision", title: "Supervision moved to Tuesday", detail: "Now Tue 4:00 PM with Dr. Patel." },
  { id: "s3", iso: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), kind: "location", title: "Updated address for M.K.", detail: "New unit number — see schedule." },
];

const BCBA_MESSAGES: BcbaMessage[] = [
  { id: "b1", iso: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), preview: "Great work on the pairing yesterday — let's review the data Tuesday." },
  { id: "b2", iso: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(), preview: "Quick reminder: bring the reinforcer inventory to next supervision." },
];

const ANNOUNCEMENTS: Announcement[] = [
  { id: "an1", iso: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), category: "training", title: "New ethics refresher available", detail: "Optional 15-minute module added to your academy." },
  { id: "an2", iso: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), category: "holiday", title: "Holiday scheduling — Memorial Day", detail: "Most sessions are paused. Check your schedule for confirmed sessions." },
  { id: "an3", iso: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), category: "state", title: "GA supervision documentation update", detail: "Small update to how supervision is logged. Your BCBA handles this." },
];

const ACTIONS: Action[] = [
  { id: "ac1", title: "Acknowledge schedule change", detail: "Friday supervision moved to Tuesday at 4:00 PM.", cta: "Acknowledge" },
  { id: "ac2", title: "Complete ethics refresher", detail: "Due Friday · 15 min", cta: "Open module", to: "/rbt/training" },
  { id: "ac3", title: "Review updated session instructions", detail: "M.K. — new caregiver preferences added.", cta: "Review", to: "/rbt/clients" },
];

const HELP_OPTIONS = [
  { id: "schedule", label: "Schedule issue", icon: Calendar, tone: "default" as const, hint: "Routes to scheduling" },
  { id: "parent", label: "Parent concern", icon: Users, tone: "default" as const, hint: "Caregiver communication" },
  { id: "clinical", label: "Clinical support", icon: ClipboardCheck, tone: "default" as const, hint: "Routes to your BCBA" },
  { id: "late", label: "Running late", icon: Clock, tone: "default" as const, hint: "Notifies your team" },
  { id: "safety", label: "Safety concern", icon: ShieldAlert, tone: "destructive" as const, hint: "Urgent escalation" },
  { id: "tech", label: "Tech / system issue", icon: Wrench, tone: "default" as const, hint: "Field tech support" },
  { id: "bcba", label: "Contact BCBA", icon: HeartHandshake, tone: "primary" as const, hint: "Message Dr. Patel" },
];

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function OSRBTMessages() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [doneActions, setDoneActions] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"all" | "bcba" | "scheduling" | "training">("all");
  const [params] = useSearchParams();
  const bcbaRef = useRef<HTMLElement | null>(null);
  const scheduleRef = useRef<HTMLElement | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);

  useEffect(() => {
    const focus = params.get("focus");
    if (!focus) return;
    if (focus === "bcba" || focus === "scheduling" || focus === "training") {
      setFilter(focus);
    }
    const target =
      focus === "bcba" ? bcbaRef.current :
      focus === "schedule" || focus === "scheduling" ? scheduleRef.current :
      null;
    if (target) {
      setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      setHighlight(focus);
      const t = setTimeout(() => setHighlight(null), 1800);
      return () => clearTimeout(t);
    }
  }, [params]);

  const filteredUpdates = useMemo(() => {
    if (filter === "all") return UPDATES;
    return UPDATES.filter((u) => u.source === filter);
  }, [filter]);

  const importantCount = ALERTS.length;
  const openActions = ACTIONS.filter((a) => !doneActions[a.id]).length;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* HEADER */}
      <header className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="mx-auto max-w-5xl px-5 md:px-10 pt-10 pb-8 md:pt-14 md:pb-12">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/rbt" className="hover:text-foreground transition-colors">RBT</Link>
            <ChevronRight className="size-3" />
            <span>Messages & Updates</span>
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            {importantCount > 0
              ? `You have ${importantCount} important update${importantCount > 1 ? "s" : ""}.`
              : "You're all caught up."}
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground max-w-xl">
            {openActions > 0
              ? `${openActions} item${openActions > 1 ? "s" : ""} need a quick acknowledgement — everything else is just for awareness.`
              : "Everything else is up to date. We'll only surface what matters."}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 md:px-10 space-y-10 md:space-y-12 pt-8 md:pt-10">

        {/* PRIORITY ALERTS */}
        {ALERTS.length > 0 && (
          <section>
            <SectionTitle>Priority alerts</SectionTitle>
            <div className="mt-4 space-y-3">
              {ALERTS.map((a) => (
                <AlertCard key={a.id} alert={a} />
              ))}
            </div>
          </section>
        )}

        {/* ACTION REQUIRED */}
        <section>
          <SectionTitle>Action required</SectionTitle>
          <p className="mt-1 text-sm text-muted-foreground">A few quick things to acknowledge — nothing heavy.</p>
          <div className="mt-4 space-y-2.5">
            {ACTIONS.map((a) => {
              const done = !!doneActions[a.id];
              return (
                <div
                  key={a.id}
                  className={`rounded-2xl bg-card border border-border/70 p-4 md:p-5 flex items-center gap-4 transition-opacity ${done ? "opacity-60" : ""}`}
                >
                  <div className="size-10 rounded-xl bg-muted grid place-items-center shrink-0">
                    {done ? <CheckCircle2 className="size-5 text-primary" /> : <BellRing className="size-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {a.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{a.detail}</div>
                  </div>
                  {!done && (
                    <button
                      onClick={() => setDoneActions((s) => ({ ...s, [a.id]: true }))}
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shrink-0"
                    >
                      {a.cta}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* RECENT UPDATES FEED */}
        <section>
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <SectionTitle>Recent updates</SectionTitle>
            <div className="flex gap-1.5 bg-muted/60 border border-border/60 rounded-full p-1">
              {(["all", "bcba", "scheduling", "training"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 h-7 rounded-full transition-colors ${
                    filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "all" ? "All" : f === "bcba" ? "BCBA" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-card border border-border/70 overflow-hidden">
            {filteredUpdates.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No updates in this view.</div>
            ) : (
              filteredUpdates.map((u, i) => (
                <div key={u.id} className={`flex items-start gap-3 p-4 md:px-5 ${i > 0 ? "border-t border-border/60" : ""}`}>
                  <SourceIcon source={u.source} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-foreground truncate">{u.title}</div>
                      <span className="text-xs text-muted-foreground shrink-0">· {relTime(u.iso)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">{u.detail}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* SCHEDULE UPDATES */}
        <section
          ref={scheduleRef}
          className={`scroll-mt-24 rounded-2xl transition-shadow ${highlight === "scheduling" || highlight === "schedule" ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background" : ""}`}
        >
          <div className="flex items-end justify-between">
            <SectionTitle>Schedule updates</SectionTitle>
            <Link to="/rbt/schedule" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
              View schedule <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-4 grid gap-2.5 md:grid-cols-2">
            {SCHEDULE_CHANGES.map((c) => (
              <div key={c.id} className="rounded-2xl bg-card border border-border/70 p-4 flex items-start gap-3">
                <ScheduleKindIcon kind={c.kind} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <ScheduleKindTag kind={c.kind} />
                    <span className="text-xs text-muted-foreground">{relTime(c.iso)}</span>
                  </div>
                  <div className="mt-1.5 text-sm font-medium text-foreground">{c.title}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{c.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BCBA COMMUNICATION */}
        <section
          ref={bcbaRef}
          className={`scroll-mt-24 rounded-2xl transition-shadow ${highlight === "bcba" ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background" : ""}`}
        >
          <SectionTitle>From your BCBA</SectionTitle>
          <div className="mt-4 rounded-2xl bg-card border border-border/70 p-5 md:p-6">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-full bg-gradient-to-br from-primary/25 to-primary/10 grid place-items-center text-foreground font-semibold shrink-0">
                {BCBA.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{BCBA.name}</div>
                <div className="text-xs text-muted-foreground">Your assigned supervisor</div>
              </div>
              <div className="hidden sm:flex gap-2">
                <SmallAction icon={MessageSquare} label="Message" />
                <SmallAction icon={Phone} label="Call" />
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {BCBA_MESSAGES.map((m) => (
                <div key={m.id} className="rounded-xl bg-muted/60 border border-border/60 p-4">
                  <div className="text-sm text-foreground/90 leading-relaxed">{m.preview}</div>
                  <div className="text-xs text-muted-foreground mt-1.5">{relTime(m.iso)}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 sm:hidden gap-2">
              <SmallAction icon={MessageSquare} label="Message" />
              <SmallAction icon={Phone} label="Call" />
              <SmallAction icon={HeartHandshake} label="Ask" onClick={() => setHelpOpen(true)} />
            </div>
          </div>
        </section>

        {/* ANNOUNCEMENTS */}
        <section>
          <SectionTitle>Announcements</SectionTitle>
          <p className="mt-1 text-sm text-muted-foreground">Just what's relevant for RBTs — nothing else.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {ANNOUNCEMENTS.map((a) => (
              <div key={a.id} className="rounded-2xl bg-muted/60 border border-border/60 p-5">
                <div className="flex items-center gap-2">
                  <AnnouncementTag category={a.category} />
                  <span className="text-xs text-muted-foreground">{relTime(a.iso)}</span>
                </div>
                <div className="mt-2 text-sm font-medium text-foreground">{a.title}</div>
                <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{a.detail}</div>
              </div>
            ))}
          </div>
        </section>

        {/* QUICK COMMUNICATION ACTIONS */}
        <section>
          <SectionTitle>Quick actions</SectionTitle>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2.5">
            <QuickAction icon={MessageSquare} label="Message BCBA" />
            <QuickAction icon={Calendar} label="Contact scheduling" onClick={() => setHelpOpen(true)} />
            <QuickAction icon={Clock} label="Running late" onClick={() => setHelpOpen(true)} />
            <QuickAction icon={Users} label="Parent concern" onClick={() => setHelpOpen(true)} />
            <QuickAction icon={ClipboardCheck} label="Clinical support" onClick={() => setHelpOpen(true)} />
            <QuickAction icon={Wrench} label="Tech support" onClick={() => setHelpOpen(true)} />
          </div>
        </section>
      </main>

      {/* FLOATING HELP */}
      <button
        onClick={() => setHelpOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full h-12 px-5 bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.7_0.13_5/0.5)] hover:opacity-90 transition"
      >
        <LifeBuoy className="size-4" />
        <span className="text-sm font-medium">Need help?</span>
      </button>

      {/* HELP SHEET */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setHelpOpen(false)} />
          <div className="relative w-full md:max-w-md mx-auto rounded-t-3xl md:rounded-3xl glass border border-border/70 p-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Get support</div>
                <h3 className="text-xl font-semibold tracking-tight text-foreground mt-1">How can we help?</h3>
                <p className="text-sm text-muted-foreground mt-1">We'll route this to the right person.</p>
              </div>
              <button onClick={() => setHelpOpen(false)} className="rounded-full size-9 grid place-items-center hover:bg-muted transition-colors" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-5 space-y-2">
              {HELP_OPTIONS.map((o) => {
                const Icon = o.icon;
                const tone =
                  o.tone === "destructive" ? "text-destructive"
                  : o.tone === "primary" ? "text-primary"
                  : "text-muted-foreground";
                return (
                  <button
                    key={o.id}
                    onClick={() => setHelpOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/70 transition-colors text-left"
                  >
                    <div className="size-9 rounded-lg bg-muted grid place-items-center">
                      <Icon className={`size-4 ${tone}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{o.label}</div>
                      <div className="text-xs text-muted-foreground">{o.hint}</div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── helpers ───────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl md:text-2xl font-medium tracking-tight text-foreground">{children}</h2>;
}

function AlertCard({ alert }: { alert: Alert }) {
  const cfg = {
    urgent: { dot: "bg-destructive", chip: "bg-destructive/10 text-destructive", label: "Urgent", icon: AlertTriangle },
    schedule: { dot: "bg-primary", chip: "bg-primary/10 text-primary", label: "Schedule", icon: CalendarClock },
    info: { dot: "bg-muted-foreground", chip: "bg-muted text-foreground/70", label: "Info", icon: BellRing },
  }[alert.priority];
  const Icon = cfg.icon;
  return (
    <div className="rounded-2xl bg-card border border-border/70 p-5 flex items-start gap-4 transition-all duration-300 hover:-translate-y-0.5">
      <div className="size-10 rounded-xl bg-muted grid place-items-center shrink-0">
        <Icon className={`size-5 ${alert.priority === "urgent" ? "text-destructive" : alert.priority === "schedule" ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cfg.chip}`}>{cfg.label}</span>
          <span className="text-xs text-muted-foreground">{relTime(alert.iso)}</span>
        </div>
        <div className="mt-1.5 text-sm font-medium text-foreground">{alert.title}</div>
        <div className="text-sm text-muted-foreground mt-0.5">{alert.detail}</div>
      </div>
      {alert.cta && (
        alert.cta.to ? (
          <Link to={alert.cta.to} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-secondary text-secondary-foreground border border-border/70 text-sm font-medium hover:bg-muted transition shrink-0 self-center">
            {alert.cta.label}
          </Link>
        ) : (
          <button className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-secondary text-secondary-foreground border border-border/70 text-sm font-medium hover:bg-muted transition shrink-0 self-center">
            {alert.cta.label}
          </button>
        )
      )}
    </div>
  );
}

function SourceIcon({ source }: { source: Update["source"] }) {
  const map: Record<Update["source"], { Icon: any; cls: string }> = {
    bcba: { Icon: HeartHandshake, cls: "text-primary" },
    scheduling: { Icon: CalendarClock, cls: "text-muted-foreground" },
    training: { Icon: GraduationCap, cls: "text-muted-foreground" },
    client: { Icon: Users, cls: "text-muted-foreground" },
    system: { Icon: Sparkles, cls: "text-muted-foreground" },
  };
  const { Icon, cls } = map[source];
  return (
    <div className="size-9 rounded-lg bg-muted grid place-items-center shrink-0">
      <Icon className={`size-4 ${cls}`} />
    </div>
  );
}

function ScheduleKindIcon({ kind }: { kind: ScheduleChange["kind"] }) {
  const map: Record<ScheduleChange["kind"], { Icon: any; cls: string }> = {
    canceled: { Icon: X, cls: "text-destructive" },
    rescheduled: { Icon: CalendarClock, cls: "text-primary" },
    location: { Icon: MapPin, cls: "text-muted-foreground" },
    supervision: { Icon: UserCog, cls: "text-primary" },
  };
  const { Icon, cls } = map[kind];
  return (
    <div className="size-9 rounded-lg bg-muted grid place-items-center shrink-0">
      <Icon className={`size-4 ${cls}`} />
    </div>
  );
}

function ScheduleKindTag({ kind }: { kind: ScheduleChange["kind"] }) {
  const map: Record<ScheduleChange["kind"], { label: string; cls: string }> = {
    canceled: { label: "Canceled", cls: "bg-destructive/10 text-destructive" },
    rescheduled: { label: "Rescheduled", cls: "bg-primary/10 text-primary" },
    location: { label: "Location", cls: "bg-muted text-foreground/70" },
    supervision: { label: "Supervision", cls: "bg-primary/10 text-primary" },
  };
  const m = map[kind];
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${m.cls}`}>{m.label}</span>;
}

function AnnouncementTag({ category }: { category: Announcement["category"] }) {
  const map: Record<Announcement["category"], { label: string; Icon: any }> = {
    training: { label: "Training", Icon: GraduationCap },
    policy: { label: "Policy", Icon: ClipboardCheck },
    holiday: { label: "Holiday", Icon: Calendar },
    state: { label: "State update", Icon: Megaphone },
    weather: { label: "Weather", Icon: AlertTriangle },
  };
  const m = map[category];
  const Icon = m.Icon;
  return (
    <span className="text-[11px] px-2 py-0.5 rounded-full bg-card border border-border/70 text-foreground/70 inline-flex items-center gap-1 font-medium">
      <Icon className="size-3" /> {m.label}
    </span>
  );
}

function SmallAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium border border-border/70 hover:bg-muted transition"
    >
      <Icon className="size-4" /> {label}
    </button>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card border border-border/70 hover:-translate-y-0.5 transition-all duration-300 text-left"
    >
      <div className="size-9 rounded-lg bg-muted grid place-items-center shrink-0">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}