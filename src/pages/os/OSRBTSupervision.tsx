import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar, MessageSquare, Phone, HelpCircle, Sparkles, CheckCircle2, Circle,
  ChevronRight, ClipboardCheck, BookOpen, HeartHandshake, Clock, MapPin,
  LifeBuoy, ShieldAlert, AlertTriangle, Wrench, UserCog, X, Users, Bookmark,
} from "lucide-react";

type Touchpoint = {
  id: string;
  date: string; // ISO
  type: "observation" | "coaching" | "checkin" | "note";
  title: string;
  detail: string;
};

type UpcomingSupervision = {
  id: string;
  iso: string;
  client: string;
  location: string;
  notes: string[];
};

type SupportNote = {
  id: string;
  tag: "strength" | "focus" | "reminder";
  text: string;
};

type Resource = {
  id: string;
  title: string;
  description: string;
  minutes: number;
};

const BCBA = {
  name: "Dr. Maya Patel",
  title: "BCBA · Supervisor",
  initials: "MP",
  preferred: "Message first, calls anytime before 7pm",
  available: "Mon–Fri · 8am–6pm",
};

const UPCOMING: UpcomingSupervision[] = [
  {
    id: "u1",
    iso: new Date(Date.now() + 1000 * 60 * 60 * 28).toISOString(),
    client: "J.R. (afternoon session)",
    location: "Client home · Atlanta, GA",
    notes: [
      "Bring updated reinforcer inventory",
      "Parent requested a quick check-in at the end",
    ],
  },
  {
    id: "u2",
    iso: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8).toISOString(),
    client: "Coaching check-in (no client)",
    location: "Video · Microsoft Teams",
    notes: ["Review last week's prompts data together"],
  },
];

const TIMELINE: Touchpoint[] = [
  {
    id: "t1",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    type: "observation",
    title: "Session observed · J.R.",
    detail: "Maya joined the last 30 minutes and shared two quick wins after.",
  },
  {
    id: "t2",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    type: "coaching",
    title: "Coaching conversation",
    detail: "Talked through pairing strategies for newer clients.",
  },
  {
    id: "t3",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    type: "checkin",
    title: "Caregiver communication reviewed",
    detail: "Maya reviewed your parent update and shared positive feedback.",
  },
  {
    id: "t4",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    type: "note",
    title: "Reinforcement strategies discussed",
    detail: "Quick async note on token systems — saved to your resources.",
  },
];

const SUPPORT_NOTES: SupportNote[] = [
  { id: "s1", tag: "strength", text: "Your pairing with new clients has been excellent — caregivers have noticed." },
  { id: "s2", tag: "focus", text: "Let's keep practicing antecedent strategies before transitions." },
  { id: "s3", tag: "reminder", text: "Bring your data sheet to Friday's supervision so we can review together." },
];

const PREP_ITEMS = [
  "Review last session's notes for J.R.",
  "Bring reinforcer inventory + data sheet",
  "Jot down one question or moment you'd like feedback on",
  "Be ready to share a recent caregiver interaction",
];

const RESOURCES: Resource[] = [
  { id: "r1", title: "What to expect in supervision", description: "A short guide to how supervision works at Blossom.", minutes: 4 },
  { id: "r2", title: "Communication standards", description: "Tone, timing, and tips for messaging your BCBA and families.", minutes: 3 },
  { id: "r3", title: "Field professionalism reminders", description: "Quick refresher on showing up prepared and present.", minutes: 2 },
  { id: "r4", title: "Coaching mindset for RBTs", description: "How to make the most of feedback and grow with your team.", minutes: 5 },
];

const HELP_OPTIONS = [
  { id: "bcba", label: "Need BCBA support", icon: HeartHandshake, tone: "primary" as const, hint: "Routes to Dr. Patel" },
  { id: "clinical", label: "Clinical question", icon: ClipboardCheck, tone: "default" as const, hint: "Get clinical guidance" },
  { id: "parent", label: "Parent concern", icon: Users, tone: "default" as const, hint: "Caregiver communication" },
  { id: "schedule", label: "Schedule issue", icon: Calendar, tone: "default" as const, hint: "Routes to scheduling" },
  { id: "late", label: "Running late", icon: Clock, tone: "default" as const, hint: "Notifies your team" },
  { id: "safety", label: "Safety concern", icon: ShieldAlert, tone: "destructive" as const, hint: "Urgent escalation" },
  { id: "tech", label: "Tech / system issue", icon: Wrench, tone: "default" as const, hint: "Field tech support" },
];

function fmtDay(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
function relDay(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 0 && days < 7) return `In ${days} days`;
  if (days < 0 && days > -7) return `${Math.abs(days)}d ago`;
  return fmtDay(iso);
}

export default function OSRBTSupervision() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [prep, setPrep] = useState<Record<number, boolean>>({});
  const [savedResources, setSavedResources] = useState<Record<string, boolean>>({});

  const next = UPCOMING[0];
  const prepDone = useMemo(() => Object.values(prep).filter(Boolean).length, [prep]);

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* HEADER */}
      <header className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="mx-auto max-w-5xl px-5 md:px-10 pt-10 pb-8 md:pt-14 md:pb-12">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/rbt" className="hover:text-foreground transition-colors">RBT</Link>
            <ChevronRight className="size-3" />
            <span>Supervision</span>
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Your support team is here for you.
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground max-w-xl">
            Next supervision {relDay(next.iso).toLowerCase()} at {fmtTime(next.iso)} — everything is organized and ready.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 md:px-10 space-y-10 md:space-y-12 pt-8 md:pt-10">

        {/* ASSIGNED BCBA */}
        <section>
          <SectionTitle>Your assigned BCBA</SectionTitle>
          <div className="mt-4 rounded-2xl bg-card border border-border/70 p-5 md:p-6 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
            <div className="flex items-start gap-4">
              <div className="size-14 md:size-16 rounded-full bg-gradient-to-br from-primary/25 to-primary/10 grid place-items-center text-foreground font-semibold text-lg shrink-0">
                {BCBA.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground truncate">{BCBA.name}</h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Supervisor</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{BCBA.title}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Sparkles className="size-3.5" /> {BCBA.preferred}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {BCBA.available}</span>
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
              <PrimaryAction icon={MessageSquare} label="Message" />
              <GhostAction icon={Phone} label="Call" />
              <GhostAction icon={HelpCircle} label="Ask question" />
              <GhostAction icon={HeartHandshake} label="Request support" onClick={() => setHelpOpen(true)} />
            </div>
          </div>
        </section>

        {/* UPCOMING SUPERVISION */}
        <section>
          <SectionTitle>Upcoming supervision</SectionTitle>
          <div className="mt-4 space-y-3">
            {UPCOMING.map((u, i) => (
              <div key={u.id} className="rounded-2xl bg-card border border-border/70 p-5 transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">{relDay(u.iso)}</div>
                    <div className="mt-1 text-base font-medium text-foreground">{fmtDay(u.iso)} · {fmtTime(u.iso)}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{u.client}</div>
                    <div className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1">
                      <MapPin className="size-3.5" /> {u.location}
                    </div>
                  </div>
                  {i === 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                      Next
                    </span>
                  )}
                </div>
                {u.notes.length > 0 && (
                  <ul className="mt-4 space-y-1.5">
                    {u.notes.map((n, idx) => (
                      <li key={idx} className="text-sm text-foreground/80 flex gap-2">
                        <span className="text-primary mt-1">·</span>
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* TIMELINE */}
        <section>
          <SectionTitle>Recent supervision touchpoints</SectionTitle>
          <p className="mt-1 text-sm text-muted-foreground">A simple look at recent moments of support.</p>
          <div className="mt-4 rounded-2xl bg-muted/60 border border-border/60 p-5 md:p-6">
            <ol className="space-y-5">
              {TIMELINE.map((t) => (
                <li key={t.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="size-2.5 rounded-full bg-primary/70 mt-1.5" />
                    <div className="flex-1 w-px bg-border mt-1" />
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="text-xs text-muted-foreground">{relDay(t.date)}</div>
                    <div className="text-sm font-medium text-foreground mt-0.5">{t.title}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{t.detail}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* SUPPORT & FEEDBACK */}
        <section>
          <SectionTitle>Support & feedback</SectionTitle>
          <p className="mt-1 text-sm text-muted-foreground">Notes from your BCBA — kept short, warm, and useful.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {SUPPORT_NOTES.map((n) => (
              <div key={n.id} className="rounded-2xl bg-card border border-border/70 p-5">
                <SupportTag tag={n.tag} />
                <p className="mt-3 text-sm text-foreground/90 leading-relaxed">{n.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PREP */}
        <section>
          <SectionTitle>Prepare for supervision</SectionTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            A light checklist — {prepDone} of {PREP_ITEMS.length} ready.
          </p>
          <div className="mt-4 rounded-2xl bg-card border border-border/70 p-2">
            {PREP_ITEMS.map((item, i) => {
              const done = !!prep[i];
              return (
                <button
                  key={i}
                  onClick={() => setPrep((p) => ({ ...p, [i]: !p[i] }))}
                  className="w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-muted/60 transition-colors"
                >
                  {done ? (
                    <CheckCircle2 className="size-5 text-primary shrink-0" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground/50 shrink-0" />
                  )}
                  <span className={`text-sm ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>{item}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* QUICK COMMUNICATION */}
        <section>
          <SectionTitle>Quick actions</SectionTitle>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2.5">
            <QuickAction icon={MessageSquare} label="Message BCBA" />
            <QuickAction icon={ClipboardCheck} label="Ask clinical question" />
            <QuickAction icon={HeartHandshake} label="Request support" onClick={() => setHelpOpen(true)} />
            <QuickAction icon={Clock} label="Running late" onClick={() => setHelpOpen(true)} />
            <QuickAction icon={Calendar} label="Scheduling help" onClick={() => setHelpOpen(true)} />
            <QuickAction icon={Wrench} label="Tech support" onClick={() => setHelpOpen(true)} />
          </div>
        </section>

        {/* RESOURCES */}
        <section>
          <div className="flex items-end justify-between">
            <SectionTitle>Recommended resources</SectionTitle>
            <Link to="/rbt/resources" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              View all
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {RESOURCES.map((r) => {
              const saved = !!savedResources[r.id];
              return (
                <div key={r.id} className="rounded-2xl bg-card border border-border/70 p-5 flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-muted grid place-items-center shrink-0">
                    <BookOpen className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{r.title}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{r.description}</div>
                    <div className="text-xs text-muted-foreground mt-2">{r.minutes} min read</div>
                  </div>
                  <button
                    onClick={() => setSavedResources((s) => ({ ...s, [r.id]: !s[r.id] }))}
                    aria-label={saved ? "Saved" : "Save"}
                    className="rounded-full size-9 grid place-items-center hover:bg-muted transition-colors shrink-0"
                  >
                    <Bookmark className={`size-4 ${saved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  </button>
                </div>
              );
            })}
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
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setHelpOpen(false)}
          />
          <div className="relative w-full md:max-w-md mx-auto rounded-t-3xl md:rounded-3xl glass border border-border/70 p-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Get support</div>
                <h3 className="text-xl font-semibold tracking-tight text-foreground mt-1">How can we help?</h3>
                <p className="text-sm text-muted-foreground mt-1">We'll route this to the right person.</p>
              </div>
              <button
                onClick={() => setHelpOpen(false)}
                className="rounded-full size-9 grid place-items-center hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-5 space-y-2">
              {HELP_OPTIONS.map((o) => {
                const Icon = o.icon;
                const tone =
                  o.tone === "destructive"
                    ? "text-destructive"
                    : o.tone === "primary"
                    ? "text-primary"
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

function PrimaryAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
    >
      <Icon className="size-4" /> {label}
    </button>
  );
}

function GhostAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium border border-border/70 hover:bg-muted transition"
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

function SupportTag({ tag }: { tag: SupportNote["tag"] }) {
  const map: Record<SupportNote["tag"], { label: string; cls: string }> = {
    strength: { label: "Strength", cls: "bg-primary/10 text-primary" },
    focus: { label: "Focus area", cls: "bg-muted text-foreground/70" },
    reminder: { label: "Reminder", cls: "bg-muted text-foreground/70" },
  };
  const m = map[tag];
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${m.cls}`}>{m.label}</span>;
}