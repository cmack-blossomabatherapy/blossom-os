import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock, MapPin, Stethoscope, ChevronDown, ChevronUp, ChevronRight,
  LifeBuoy, MessageSquare, Phone, AlertTriangle, ShieldAlert, Wrench,
  CalendarDays, HeartHandshake, FileText, Sparkles, X, BookOpen,
  CheckCircle2, Circle, ListChecks, Headphones, ArrowRight,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { cn } from "@/lib/utils";

// RBT — Session Support. Calming field support, not a knowledge base.

const helpOptions = [
  { label: "Running late",     icon: Clock },
  { label: "Schedule issue",   icon: CalendarDays },
  { label: "Parent concern",   icon: HeartHandshake },
  { label: "Clinical support", icon: Stethoscope },
  { label: "Tech / system",    icon: Wrench },
  { label: "Contact BCBA",     icon: Phone },
  { label: "Safety concern",   icon: ShieldAlert },
];

const quickActions = [
  { label: "Running late",     icon: Clock,          tone: "amber" as const },
  { label: "Clinical support", icon: Stethoscope,    tone: "primary" as const },
  { label: "Parent concern",   icon: HeartHandshake, tone: "neutral" as const },
  { label: "Schedule problem", icon: CalendarDays,   tone: "neutral" as const },
  { label: "Safety concern",   icon: ShieldAlert,    tone: "destructive" as const },
  { label: "Tech / system",    icon: Wrench,         tone: "neutral" as const },
  { label: "Contact BCBA",     icon: Phone,          tone: "primary" as const },
];

const checklist = [
  "Reviewed today's schedule and locations",
  "Materials & reinforcers packed",
  "Reviewed client reminders & caregiver notes",
  "Checked supervision schedule for the day",
  "Confirmed arrival timing & travel buffer",
];

type Situation = {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  contact: string;
  urgency: "low" | "medium" | "high";
};

const situations: Situation[] = [
  {
    id: "refusing",
    title: "Client refusing session",
    summary: "Pair, lower demands, and re-engage with preferred items.",
    steps: [
      "Pair with reinforcers — lower demands for 5–10 min.",
      "Try a preferred activity to rebuild rapport.",
      "If refusal continues 15+ min, message your BCBA for guidance.",
      "Document what worked / didn't in your note.",
    ],
    contact: "BCBA",
    urgency: "low",
  },
  {
    id: "upset-parent",
    title: "Parent upset or frustrated",
    summary: "Listen, validate, do not promise. Loop in BCBA.",
    steps: [
      "Listen calmly — do not interrupt.",
      "Validate the concern without making clinical promises.",
      "Let them know you'll loop in the BCBA right away.",
      "Message your BCBA with a short summary.",
    ],
    contact: "BCBA",
    urgency: "medium",
  },
  {
    id: "late",
    title: "Running late",
    summary: "Notify scheduling and the family as early as possible.",
    steps: [
      "Tap Running Late to notify scheduling.",
      "If 10+ min, send a quick parent update.",
      "Drive safely — never rush.",
    ],
    contact: "Scheduling",
    urgency: "low",
  },
  {
    id: "cancellation",
    title: "Session canceled at the door",
    summary: "Confirm, leave calmly, log it.",
    steps: [
      "Confirm cancellation with the caregiver.",
      "Tap Schedule problem to log it.",
      "Do not reschedule on your own — scheduling will follow up.",
    ],
    contact: "Scheduling",
    urgency: "low",
  },
  {
    id: "unsafe",
    title: "Unsafe environment",
    summary: "Your safety comes first. Leave and escalate.",
    steps: [
      "Remove yourself if you feel unsafe.",
      "Call your BCBA or operations immediately.",
      "Tap Safety concern — operations will respond.",
    ],
    contact: "BCBA + Operations",
    urgency: "high",
  },
  {
    id: "illness",
    title: "Child is ill",
    summary: "Do not run the session. Notify and reschedule.",
    steps: [
      "Politely end the session if a child is visibly ill.",
      "Notify scheduling and your BCBA.",
      "Do not document the session as completed.",
    ],
    contact: "BCBA + Scheduling",
    urgency: "medium",
  },
  {
    id: "tech",
    title: "Tech / app issue",
    summary: "Use the manual fallback and report it.",
    steps: [
      "Use the offline fallback to capture session info on paper.",
      "Tap Tech / system to log the issue.",
      "Tech will reply within the day.",
    ],
    contact: "Tech support",
    urgency: "low",
  },
  {
    id: "urgent-bcba",
    title: "Need my BCBA right now",
    summary: "Call BCBA directly, then text for non-urgent follow-up.",
    steps: [
      "Tap Contact BCBA → Call.",
      "If no answer in 5 min, call your backup BCBA.",
      "Send a text summary so they can respond when free.",
    ],
    contact: "BCBA",
    urgency: "high",
  },
];

const expectations = [
  { title: "Professionalism",  body: "Arrive on time, dressed per Blossom standards, and ready to engage." },
  { title: "Communication",    body: "Be warm with caregivers. Avoid clinical advice — defer to your BCBA." },
  { title: "Session readiness", body: "Materials, reinforcers, and any client-specific items packed before you leave." },
  { title: "Documentation",    body: "Notes submitted same-day. Accuracy matters more than length." },
];

const escalation = [
  { level: "Routine",  who: "Your BCBA",          when: "Programs, reinforcement, behavior questions",     tone: "primary" as const },
  { level: "Schedule", who: "Scheduling team",    when: "Cancellations, time changes, coverage",            tone: "neutral" as const },
  { level: "Urgent",   who: "Operations",         when: "Parent escalations, repeated no-shows",            tone: "amber" as const },
  { level: "Safety",   who: "Call BCBA + Ops",    when: "Anything that puts you or the child at risk",      tone: "destructive" as const },
];

const resources = [
  { id: "r1", title: "Session-ready checklist",     type: "Checklist", icon: ListChecks },
  { id: "r2", title: "Parent communication script", type: "SOP",       icon: FileText },
  { id: "r3", title: "Safety & escalation flow",    type: "SOP",       icon: FileText },
  { id: "r4", title: "Caregiver interaction guide", type: "Guide",     icon: BookOpen },
];

const assignedBCBA = {
  name: "Jennifer Patel",
  nextSupervision: "Wed · 3:00 PM",
};

export default function OSRBTSessionSupport() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const toggle = (i: number) => setChecked((c) => ({ ...c, [i]: !c[i] }));
  const completed = Object.values(checked).filter(Boolean).length;

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-32 pt-5 md:px-6 md:pt-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <Link to="/rbt" className="hover:text-foreground transition-colors">RBT</Link>
          <ChevronRight className="size-3" />
          <span>Clients & Sessions</span>
          <ChevronRight className="size-3" />
          <span>Session Support</span>
        </div>
        {/* 1. Header */}
        <header className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Clients & Sessions</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Session Support</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Quick answers for the field. Support is always one tap away.
          </p>
        </header>

        {/* 2. Quick help actions */}
        <section className="space-y-2">
          <h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Quick help</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {quickActions.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => setHelpOpen(true)}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5",
                  a.tone === "destructive" ? "border-destructive/30 bg-destructive/5 hover:border-destructive/50"
                  : a.tone === "amber"       ? "border-amber-500/30 bg-amber-50/40 dark:bg-amber-500/5 hover:border-amber-500/50"
                  : a.tone === "primary"     ? "border-primary/30 bg-primary/5 hover:border-primary/50"
                  : "border-border/70 bg-card hover:border-border",
                )}
              >
                <div
                  className={cn(
                    "grid size-10 place-items-center rounded-xl",
                    a.tone === "destructive" ? "bg-destructive/15 text-destructive"
                    : a.tone === "amber"       ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    : a.tone === "primary"     ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                  )}
                >
                  <a.icon className="size-4" />
                </div>
                <span className="text-sm font-medium text-foreground">{a.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 3. Before session checklist */}
        <section className="space-y-2">
          <div className="flex items-end justify-between px-1">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Before your next session</h2>
            <span className="text-xs text-muted-foreground">{completed} of {checklist.length}</span>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-2 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_4px_16px_-12px_oklch(0.2_0.02_260/0.06)]">
            <ul>
              {checklist.map((item, i) => {
                const on = !!checked[i];
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => toggle(i)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-muted/60"
                    >
                      {on
                        ? <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        : <Circle className="size-5 shrink-0 text-muted-foreground" />}
                      <span className={cn("text-sm", on ? "text-muted-foreground line-through" : "text-foreground")}>
                        {item}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* 4. Common situations */}
        <section className="space-y-2">
          <h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Common situations</h2>
          <div className="space-y-2">
            {situations.map((s) => <SituationCard key={s.id} s={s} onHelp={() => setHelpOpen(true)} />)}
          </div>
        </section>

        {/* 5. Session expectations */}
        <section className="space-y-2">
          <div className="flex items-end justify-between px-1">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Session expectations</h2>
            <Link to="/rbt/training-academy" className="text-xs text-primary hover:opacity-80">Open training</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {expectations.map((e) => (
              <div key={e.title} className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-sm font-semibold tracking-tight text-foreground">{e.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{e.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Escalation guidance */}
        <section className="space-y-2">
          <h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">When in doubt — who to contact</h2>
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
            <ul className="divide-y divide-border/60">
              {escalation.map((e) => (
                <li key={e.level} className="flex items-center gap-3 px-4 py-3">
                  <UrgencyDot tone={e.tone} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <p className="text-sm font-medium text-foreground">{e.level}</p>
                      <p className="text-xs text-muted-foreground">→ {e.who}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{e.when}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 7. Assigned BCBA support */}
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              JP
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Your BCBA</p>
              <p className="mt-0.5 text-base font-semibold tracking-tight text-foreground">{assignedBCBA.name}</p>
              <p className="text-sm text-muted-foreground">Next supervision · {assignedBCBA.nextSupervision}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ActionBtn icon={MessageSquare} label="Message" to="/rbt/messages" />
                <ActionBtn icon={Phone}         label="Call"    href="tel:+1" />
                <ActionBtn icon={Headphones}    label="Request support" onClick={() => setHelpOpen(true)} />
              </div>
            </div>
          </div>
        </section>

        {/* 8. Recommended resources */}
        <section className="space-y-2">
          <div className="flex items-end justify-between">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Recommended resources</h2>
            <Link to="/rbt/resources" className="text-sm text-primary hover:opacity-80">View library</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {resources.map((r) => {
              const Icon = r.icon;
              return (
                <Link
                  key={r.id}
                  to="/rbt/resources"
                  className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 transition hover:-translate-y-0.5 hover:border-border"
                >
                  <div className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.type}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
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

function SituationCard({ s, onHelp }: { s: Situation; onHelp: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn(
      "rounded-2xl border border-border/70 bg-card transition",
      "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_4px_16px_-12px_oklch(0.2_0.02_260/0.06)]",
    )}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <UrgencyDot tone={s.urgency === "high" ? "destructive" : s.urgency === "medium" ? "amber" : "primary"} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{s.title}</p>
          <p className="truncate text-xs text-muted-foreground">{s.summary}</p>
        </div>
        {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="space-y-3 border-t border-border/60 px-4 py-4">
          <ol className="space-y-1.5 text-sm text-foreground">
            {s.steps.map((step, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">Route to · {s.contact}</span>
            <button
              type="button"
              onClick={onHelp}
              className="ml-auto inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              Get help <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UrgencyDot({ tone }: { tone: "primary" | "amber" | "destructive" | "neutral" }) {
  const cls =
    tone === "destructive" ? "bg-destructive/15 text-destructive"
    : tone === "amber"     ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
    : tone === "primary"   ? "bg-primary/10 text-primary"
    : "bg-muted text-muted-foreground";
  return <span className={cn("grid size-7 shrink-0 place-items-center rounded-full", cls)}>
    <Sparkles className="size-3.5" />
  </span>;
}

function ActionBtn({
  icon: Icon, label, to, href, onClick,
}: {
  icon: React.ComponentType<{ className?: string }>; label: string;
  to?: string; href?: string; onClick?: () => void;
}) {
  const cls = "inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition hover:bg-muted";
  if (href) return <a href={href} className={cls}><Icon className="size-3.5" /> {label}</a>;
  if (to) return <Link to={to} className={cls}><Icon className="size-3.5" /> {label}</Link>;
  return <button type="button" onClick={onClick} className={cls}><Icon className="size-3.5" /> {label}</button>;
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
