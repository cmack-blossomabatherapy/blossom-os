import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Clock, MapPin, Stethoscope, ChevronDown, ChevronUp, ChevronRight,
  LifeBuoy, MessageSquare, Phone, AlertTriangle, ShieldAlert, Wrench,
  CalendarDays, HeartHandshake, Users, CalendarClock, FileText, Sparkles,
  Info, X, BookOpen, Navigation,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// RBT — My Clients. Assignment-scoped, mobile-first, supportive.

type Client = {
  id: string;
  name: string;          // first name + last initial only
  initials: string;
  location: string;
  locationType: "Home" | "Clinic" | "School";
  bcba: string;
  nextSession?: { iso: string; type: string };
  weeklySessions: number;
  reminders?: string[];
  caregiverNotes?: string[];
  prep?: string[];
  flags?: { supervisionThisWeek?: boolean; scheduleChange?: boolean; newNotes?: boolean };
};

const CLIENTS: Client[] = [
  {
    id: "c1", name: "Liam C.", initials: "LC",
    location: "Buckhead, Atlanta", locationType: "Home",
    bcba: "Jennifer Patel", weeklySessions: 5,
    nextSession: { iso: nextAt(1, 9, 0), type: "1:1 Therapy" },
    reminders: ["Parent prefers text updates", "Use side entry door"],
    caregiverNotes: ["Mom is primary contact", "Quiet space available upstairs"],
    prep: ["Bring token board", "Continue mand training"],
    flags: { newNotes: true },
  },
  {
    id: "c2", name: "Aria J.", initials: "AJ",
    location: "Sandy Springs Clinic", locationType: "Clinic",
    bcba: "Marcus Lee", weeklySessions: 4,
    nextSession: { iso: todayAt(12, 30), type: "1:1 Therapy" },
    reminders: ["Session moved from 1:00 PM", "Reinforcer: bubbles"],
    prep: ["Time updated this morning"],
    flags: { scheduleChange: true },
  },
  {
    id: "c3", name: "Mia R.", initials: "MR",
    location: "Decatur, GA", locationType: "Home",
    bcba: "Jennifer Patel", weeklySessions: 6,
    nextSession: { iso: todayAt(15, 0), type: "1:1 + Supervision" },
    reminders: ["Supervision this week", "Parent note about nap schedule"],
    caregiverNotes: ["Naps may push session start 10 min"],
    flags: { supervisionThisWeek: true, newNotes: true },
  },
  {
    id: "c4", name: "Noah B.", initials: "NB",
    location: "Sandy Springs Clinic", locationType: "Clinic",
    bcba: "Marcus Lee", weeklySessions: 3,
    nextSession: { iso: nextAt(2, 16, 30), type: "1:1 Therapy" },
    reminders: ["Reinforcer rotation this week"],
  },
  {
    id: "c5", name: "Ella W.", initials: "EW",
    location: "Marietta, GA", locationType: "Home",
    bcba: "Priya Shah", weeklySessions: 4,
    nextSession: { iso: nextAt(3, 10, 0), type: "1:1 Therapy" },
    reminders: ["Allergy: peanuts — do not bring snacks"],
  },
];

const helpOptions = [
  { label: "Running late",     icon: Clock },
  { label: "Schedule issue",   icon: CalendarDays },
  { label: "Parent concern",   icon: HeartHandshake },
  { label: "Clinical support", icon: Stethoscope },
  { label: "Tech / system",    icon: Wrench },
  { label: "Contact BCBA",     icon: Phone },
  { label: "Safety concern",   icon: ShieldAlert },
];

function todayAt(h: number, m: number) {
  const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString();
}
function nextAt(daysAhead: number, h: number, m: number) {
  const d = new Date(); d.setDate(d.getDate() + daysAhead); d.setHours(h, m, 0, 0); return d.toISOString();
}

function fmtNext(iso?: string) {
  if (!iso) return "No upcoming session";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) + ` · ${time}`;
}

export default function OSRBTClients() {
  const { user } = useAuth();
  const _ = user;
  const [helpOpen, setHelpOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [params] = useSearchParams();
  const [openId, setOpenId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const id = params.get("id");
    if (!id) return;
    if (CLIENTS.some((c) => c.id === id)) {
      setOpenId(id);
      setTimeout(() => {
        cardRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }, [params]);

  const summary = useMemo(() => {
    const todayCount = CLIENTS.filter((c) => c.nextSession && new Date(c.nextSession.iso).toDateString() === new Date().toDateString()).length;
    const weekly = CLIENTS.reduce((s, c) => s + c.weeklySessions, 0);
    const bcbas = new Set(CLIENTS.map((c) => c.bcba)).size;
    const supervision = CLIENTS.some((c) => c.flags?.supervisionThisWeek);
    return { todayCount, weekly, bcbas, supervision };
  }, []);

  const filtered = CLIENTS.filter((c) =>
    !query ? true : (c.name + " " + c.bcba + " " + c.location).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-32 pt-5 md:px-6 md:pt-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <Link to="/rbt" className="hover:text-foreground transition-colors">RBT</Link>
          <ChevronRight className="size-3" />
          <span>Clients & Sessions</span>
          <ChevronRight className="size-3" />
          <span>My Clients</span>
        </div>
        {/* 1. Header */}
        <header className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Clients & Sessions</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            My Clients
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            You're assigned to {CLIENTS.length} clients
            {summary.todayCount ? ` · ${summary.todayCount} session${summary.todayCount === 1 ? "" : "s"} today` : " · no sessions today"}.
          </p>
        </header>

        {/* 2. Summary */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SnapTile icon={Users} label="Active clients" value={String(CLIENTS.length)} />
          <SnapTile icon={CalendarClock} label="Sessions this week" value={String(summary.weekly)} />
          <SnapTile icon={Stethoscope} label="BCBAs" value={String(summary.bcbas)} />
          <SnapTile icon={Sparkles} label="Supervision" value={summary.supervision ? "This week" : "None"} accent={summary.supervision} />
        </section>

        {/* Search */}
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, BCBAs, locations…"
            className="h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* 3. Client cards */}
        <section className="space-y-3">
          {filtered.map((c) => (
            <ClientCard
              key={c.id}
              client={c}
              onHelp={() => setHelpOpen(true)}
              defaultOpen={openId === c.id}
              setRef={(el) => { cardRefs.current[c.id] = el; }}
            />
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
              No clients match "{query}".
            </div>
          )}
        </section>

        {/* 7. Communication actions */}
        <section className="space-y-2">
          <h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <QuickAction icon={MessageSquare} label="Message BCBA" to="/rbt/messages?focus=bcba" />
            <QuickAction icon={Phone}         label="Contact scheduling" to="/rbt/messages?focus=scheduling" />
            <QuickAction icon={Clock}         label="Running late" onClick={() => setHelpOpen(true)} />
            <QuickAction icon={Stethoscope}   label="Clinical help" onClick={() => setHelpOpen(true)} />
            <QuickAction icon={HeartHandshake} label="Parent concern" onClick={() => setHelpOpen(true)} />
            <QuickAction icon={Wrench}        label="Tech support" onClick={() => setHelpOpen(true)} />
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

function ClientCard({ client, onHelp, defaultOpen, setRef }: { client: Client; onHelp: () => void; defaultOpen?: boolean; setRef?: (el: HTMLDivElement | null) => void }) {
  const [open, setOpen] = useState(!!defaultOpen);
  useEffect(() => { if (defaultOpen) setOpen(true); }, [defaultOpen]);
  const [tab, setTab] = useState<"overview" | "schedule" | "notes" | "resources">("overview");

  return (
    <div
      ref={setRef}
      className={`scroll-mt-24 rounded-2xl border border-border/70 bg-card shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_4px_16px_-12px_oklch(0.2_0.02_260/0.06)] transition hover:border-border ${defaultOpen ? "ring-2 ring-primary/40" : ""}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-4 p-4 text-left"
      >
        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {client.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-base font-semibold tracking-tight text-foreground">{client.name}</p>
            {client.flags?.supervisionThisWeek && <Pill tone="primary">Supervision</Pill>}
            {client.flags?.scheduleChange && <Pill tone="amber">Changed</Pill>}
            {client.flags?.newNotes && <Pill>New notes</Pill>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {fmtNext(client.nextSession?.iso)}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {client.locationType} · {client.location}</span>
            <span className="inline-flex items-center gap-1"><Stethoscope className="size-3" /> {client.bcba}</span>
          </div>
        </div>
        {open ? <ChevronUp className="size-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border/60 px-4 py-4 space-y-4">
          {/* Tabs */}
          <div className="inline-flex rounded-full border border-border/70 bg-muted/50 p-1">
            {([
              { v: "overview",  label: "Overview" },
              { v: "schedule",  label: "Schedule" },
              { v: "notes",     label: "Support notes" },
              { v: "resources", label: "Resources" },
            ] as const).map((t) => (
              <button
                key={t.v}
                type="button"
                onClick={() => setTab(t.v)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  tab === t.v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="space-y-3">
              {client.reminders && client.reminders.length > 0 && (
                <InfoList icon={Info} title="Reminders" items={client.reminders} />
              )}
              {client.prep && client.prep.length > 0 && (
                <InfoList icon={Sparkles} title="Session prep" items={client.prep} />
              )}
            </div>
          )}

          {tab === "schedule" && (
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Next session</p>
              <p className="mt-1.5 text-sm font-medium text-foreground">
                {fmtNext(client.nextSession?.iso)}
              </p>
              <p className="text-sm text-muted-foreground">{client.nextSession?.type ?? "—"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{client.locationType} · {client.location}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {client.weeklySessions} session{client.weeklySessions === 1 ? "" : "s"} per week
              </p>
              <Link
                to="/rbt/my-day"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80"
              >
                Open My Day <ChevronRight className="size-3.5" />
              </Link>
            </div>
          )}

          {tab === "notes" && (
            <div className="space-y-3">
              {client.caregiverNotes && client.caregiverNotes.length > 0
                ? <InfoList icon={HeartHandshake} title="Caregiver notes" items={client.caregiverNotes} />
                : <EmptyHint>No caregiver notes shared yet.</EmptyHint>}
              {client.reminders && client.reminders.length > 0 && (
                <InfoList icon={Info} title="Operational reminders" items={client.reminders} />
              )}
            </div>
          )}

          {tab === "resources" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <ResourceLink icon={FileText} label="Session expectations" />
              <ResourceLink icon={FileText} label="Reinforcement guide" />
              <ResourceLink icon={FileText} label="Caregiver comms standards" />
              <ResourceLink icon={BookOpen} label="Open resource library" to="/rbt/resources" />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <ActionBtn icon={Stethoscope} label="Open client" to="/rbt/clients" />
            <ActionBtn icon={MessageSquare} label="Message BCBA" to="/rbt/messages?focus=bcba" />
            <ActionBtn
              icon={Navigation}
              label="Directions"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.location)}`}
              external
            />
            <ActionBtn icon={AlertTriangle} label="Get help" onClick={onHelp} />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoList({
  icon: Icon, title, items,
}: { icon: React.ComponentType<{ className?: string }>; title: string; items: string[] }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-muted-foreground" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
      </div>
      <ul className="mt-1.5 space-y-1 text-sm text-foreground">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2"><span className="text-muted-foreground">•</span><span>{it}</span></li>
        ))}
      </ul>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function ResourceLink({
  icon: Icon, label, to,
}: { icon: React.ComponentType<{ className?: string }>; label: string; to?: string }) {
  const cls = "flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/60 p-3 text-sm font-medium text-foreground transition hover:bg-muted";
  const inner = (<><Icon className="size-4 text-muted-foreground" /><span className="truncate">{label}</span><ChevronRight className="ml-auto size-4 text-muted-foreground" /></>);
  return to ? <Link to={to} className={cls}>{inner}</Link> : <button type="button" className={cls}>{inner}</button>;
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

function Pill({ children, tone }: { children: React.ReactNode; tone?: "primary" | "amber" }) {
  const tones =
    tone === "primary" ? "bg-primary/10 text-primary"
    : tone === "amber" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
    : "bg-muted text-muted-foreground";
  return <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium", tones)}>{children}</span>;
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
              <Link key={o.label} to={`/rbt/help?category=${({"Running late":"late","Schedule issue":"schedule","Parent concern":"parent","Clinical support":"clinical","Clinical help":"clinical","Tech / system":"tech","Tech support":"tech","Contact BCBA":"bcba","Safety concern":"safety","Client canceled":"cancel","Training question":"training"} as Record<string,string>)[o.label] || "other"}`} onClick={onClose} className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-secondary/60 p-3 text-sm font-medium text-foreground transition hover:bg-muted">
                <Icon className="size-4 text-muted-foreground" />{o.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
