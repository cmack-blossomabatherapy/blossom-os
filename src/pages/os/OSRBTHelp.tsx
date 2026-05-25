import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronRight, Clock, CalendarClock, CalendarX, Users, ClipboardCheck,
  ShieldAlert, Wrench, HeartHandshake, GraduationCap, HelpCircle, MessageSquare,
  ArrowLeft, Phone, MapPin, CheckCircle2, Sparkles, AlertTriangle, X,
} from "lucide-react";

type CategoryId =
  | "late" | "schedule" | "cancel" | "parent" | "clinical"
  | "safety" | "tech" | "bcba" | "training" | "other";

type Urgency = "low" | "medium" | "high";

type Category = {
  id: CategoryId;
  label: string;
  hint: string;
  routesTo: string;
  icon: any;
  tone?: "primary" | "danger";
};

type OpenRequest = {
  id: string;
  type: string;
  status: "Submitted" | "Routed" | "In Review" | "Waiting on You" | "Resolved";
  submittedIso: string;
  routedTo: string;
  lastUpdate: string;
  nextStep: string;
};

const ME = { name: "Alex Rivera", role: "RBT" };
const BCBA = { name: "Dr. Maya Patel" };
const TODAY_SESSION = {
  client: "J.R.",
  time: "3:00 PM",
  location: "Client home · Atlanta, GA",
};
const SESSIONS = [
  { id: "s1", label: "Today · 3:00 PM · J.R." },
  { id: "s2", label: "Today · 5:30 PM · M.K." },
  { id: "s3", label: "Tomorrow · 10:00 AM · M.K." },
];

const CATEGORIES: Category[] = [
  { id: "late", label: "I'm running late", hint: "Let scheduling and your BCBA know quickly.", routesTo: "Scheduling · BCBA", icon: Clock },
  { id: "schedule", label: "Schedule issue", hint: "Something about a session needs attention.", routesTo: "Scheduling", icon: CalendarClock },
  { id: "cancel", label: "Client canceled", hint: "Report a cancellation so we can adjust.", routesTo: "Scheduling · BCBA", icon: CalendarX },
  { id: "parent", label: "Parent / caregiver concern", hint: "Caregiver said or asked something that needs follow-up.", routesTo: "BCBA · Operations", icon: Users },
  { id: "clinical", label: "I need clinical support", hint: "Question or guidance from your BCBA.", routesTo: "BCBA", icon: ClipboardCheck },
  { id: "safety", label: "Safety concern", hint: "Something unsafe — for you, the client, or others.", routesTo: "BCBA · Operations", icon: ShieldAlert, tone: "danger" },
  { id: "tech", label: "Tech / system issue", hint: "App, login, or device trouble in the field.", routesTo: "Systems support", icon: Wrench },
  { id: "bcba", label: "Contact my BCBA", hint: "Send a quick message to your supervisor.", routesTo: "BCBA", icon: HeartHandshake, tone: "primary" },
  { id: "training", label: "Training question", hint: "Need help with a module or supervision step.", routesTo: "Training support", icon: GraduationCap },
  { id: "other", label: "Other support", hint: "Not sure where it fits — we'll route it.", routesTo: "Operations", icon: HelpCircle },
];

const OPEN_REQUESTS: OpenRequest[] = [
  {
    id: "r1",
    type: "Schedule issue",
    status: "Routed",
    submittedIso: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    routedTo: "Scheduling",
    lastUpdate: "Scheduling acknowledged your request.",
    nextStep: "They'll confirm the updated session time shortly.",
  },
  {
    id: "r2",
    type: "Clinical question",
    status: "Waiting on You",
    submittedIso: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    routedTo: "Dr. Maya Patel",
    lastUpdate: "Maya asked a quick follow-up question.",
    nextStep: "Reply in Messages when you have a moment.",
  },
];

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export default function OSRBTHelp() {
  const [selected, setSelected] = useState<Category | null>(null);
  const [submitted, setSubmitted] = useState<{ category: Category; routing: string } | null>(null);
  const [params] = useSearchParams();

  useEffect(() => {
    const cat = params.get("category");
    if (!cat) return;
    const match = CATEGORIES.find((c) => c.id === cat);
    if (match) {
      setSelected(match);
      setTimeout(() => {
        document.getElementById("help-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }, [params]);

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* HEADER */}
      <header className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="mx-auto max-w-4xl px-5 md:px-10 pt-10 pb-8 md:pt-14 md:pb-12">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/rbt" className="hover:text-foreground transition-colors">RBT</Link>
            <ChevronRight className="size-3" />
            <span>Need Help</span>
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Need help? We've got you.
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground max-w-xl">
            Pick what's going on and Blossom OS will route it to the right person. You're not alone.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 md:px-10 space-y-10 md:space-y-12 pt-8 md:pt-10">

        {/* EMERGENCY NOTICE */}
        <div className="rounded-2xl bg-card border border-border/70 p-4 md:p-5 flex items-start gap-3">
          <div className="size-9 rounded-lg bg-destructive/10 grid place-items-center shrink-0">
            <AlertTriangle className="size-4 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground">In an emergency, call 911 first.</div>
            <div className="text-sm text-muted-foreground mt-0.5">
              If anyone is in immediate danger or needs medical help, call 911 — then notify Blossom here.
            </div>
          </div>
        </div>

        {/* CATEGORY PICKER OR FLOW */}
        {!selected && !submitted && (
          <section id="categories">
            <SectionTitle>What do you need help with?</SectionTitle>
            <p className="mt-1 text-sm text-muted-foreground">Choose the closest option — we'll handle the rest.</p>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {CATEGORIES.map((c) => (
                <CategoryCard key={c.id} category={c} onClick={() => setSelected(c)} />
              ))}
            </div>
          </section>
        )}

        {selected && !submitted && (
          <div id="help-form" className="scroll-mt-24">
          <RequestFlow
            category={selected}
            onBack={() => setSelected(null)}
            onSubmit={(routing) => {
              setSubmitted({ category: selected, routing });
              setSelected(null);
            }}
          />
          </div>
        )}

        {submitted && (
          <ConfirmationCard
            category={submitted.category}
            routing={submitted.routing}
            onAgain={() => setSubmitted(null)}
          />
        )}

        {/* OPEN REQUESTS */}
        <section>
          <SectionTitle>Your open requests</SectionTitle>
          <p className="mt-1 text-sm text-muted-foreground">Only your requests — nobody else can see them.</p>
          <div className="mt-4 space-y-2.5">
            {OPEN_REQUESTS.map((r) => (
              <OpenRequestCard key={r.id} req={r} />
            ))}
            {OPEN_REQUESTS.length === 0 && (
              <div className="rounded-2xl bg-card border border-border/70 p-10 text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted">
                  <CheckCircle2 className="size-5 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-base font-medium text-foreground">No open requests</h3>
                <p className="mt-1 text-sm text-muted-foreground">You're covered — we'll keep this empty until you need it.</p>
              </div>
            )}
          </div>
        </section>

        {/* WHAT HAPPENS NEXT */}
        <section>
          <SectionTitle>What happens after you submit</SectionTitle>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <NextStep n={1} title="We route it instantly" detail="Goes to the right team or person based on what you chose." />
            <NextStep n={2} title="You stay in the loop" detail="Updates appear in Messages and on this page." />
            <NextStep n={3} title="Keep going safely" detail="Continue your session. If it's urgent, escalate again — that's expected." />
          </div>
        </section>
      </main>

      {/* FLOATING SHORTCUT */}
      {!selected && !submitted && (
        <a
          href="#categories"
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full h-12 px-5 bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.7_0.13_5/0.5)] hover:opacity-90 transition"
        >
          <Sparkles className="size-4" />
          <span className="text-sm font-medium">Start request</span>
        </a>
      )}
    </div>
  );
}

/* ───────── components ───────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl md:text-2xl font-medium tracking-tight text-foreground">{children}</h2>;
}

function CategoryCard({ category, onClick }: { category: Category; onClick: () => void }) {
  const Icon = category.icon;
  const tone =
    category.tone === "danger" ? "text-destructive bg-destructive/10"
    : category.tone === "primary" ? "text-primary bg-primary/10"
    : "text-muted-foreground bg-muted";
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl bg-card border border-border/70 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-border"
    >
      <div className="flex items-start gap-4">
        <div className={`size-11 rounded-xl grid place-items-center shrink-0 ${tone}`}>
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium text-foreground">{category.label}</div>
          <div className="text-sm text-muted-foreground mt-0.5">{category.hint}</div>
          <div className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1">
            <ArrowRight /> Routes to {category.routesTo}
          </div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors mt-1" />
      </div>
    </button>
  );
}

function ArrowRight() {
  return <span className="size-1 rounded-full bg-muted-foreground inline-block" />;
}

function RequestFlow({
  category, onBack, onSubmit,
}: {
  category: Category;
  onBack: () => void;
  onSubmit: (routing: string) => void;
}) {
  const [sessionId, setSessionId] = useState(SESSIONS[0].id);
  const [urgency, setUrgency] = useState<Urgency>("medium");
  const [delay, setDelay] = useState("10 min");
  const [note, setNote] = useState("");
  const [contact, setContact] = useState("");

  const showSession = !["tech", "training", "bcba", "other"].includes(category.id);
  const showDelay = category.id === "late";
  const showContact = category.id === "safety";
  const isSafety = category.id === "safety";
  const charLimit = 500;

  const submit = () => {
    if (note.length > charLimit) return;
    onSubmit(category.routesTo);
  };

  return (
    <section>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="mt-4 rounded-2xl bg-card border border-border/70 p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className={`size-11 rounded-xl grid place-items-center shrink-0 ${
            isSafety ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          }`}>
            <category.icon className="size-5" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold tracking-tight text-foreground">{category.label}</div>
            <div className="text-sm text-muted-foreground mt-0.5">Tell us what's going on. We'll handle routing.</div>
          </div>
        </div>

        {/* Prefilled context */}
        <div className="mt-5 rounded-xl bg-muted/60 border border-border/60 p-3.5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Your context</div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Sparkles className="size-3" /> {ME.name} · {ME.role}</span>
            <span className="inline-flex items-center gap-1.5"><HeartHandshake className="size-3" /> {BCBA.name}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="size-3" /> {TODAY_SESSION.time} · {TODAY_SESSION.client}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-3" /> {TODAY_SESSION.location}</span>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {isSafety && (
            <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3.5 text-sm text-foreground">
              <span className="font-medium">Is anyone in immediate danger?</span> Call 911 first, then complete this form.
            </div>
          )}

          {showSession && (
            <Field label="Which session?">
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition"
              >
                {SESSIONS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </Field>
          )}

          {showDelay && (
            <Field label="Estimated delay">
              <div className="flex gap-2 flex-wrap">
                {["5 min", "10 min", "15 min", "20+ min"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDelay(d)}
                    className={`h-9 px-3.5 rounded-full text-sm transition ${
                      delay === d
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground/80 hover:bg-muted/80"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </Field>
          )}

          <Field label="Urgency">
            <div className="flex gap-2">
              {(["low", "medium", "high"] as Urgency[]).map((u) => (
                <button
                  key={u}
                  onClick={() => setUrgency(u)}
                  className={`flex-1 h-10 rounded-xl text-sm font-medium transition border ${
                    urgency === u
                      ? u === "high"
                        ? "bg-destructive/10 text-destructive border-destructive/30"
                        : u === "medium"
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-muted text-foreground border-border"
                      : "bg-card text-muted-foreground border-border/70 hover:bg-muted"
                  }`}
                >
                  {u === "low" ? "When you can" : u === "medium" ? "Soon" : "Urgent"}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Add a quick note" hint={`${note.length}/${charLimit}`}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, charLimit))}
              rows={3}
              placeholder="Tell us what's happening in a sentence or two."
              className="w-full rounded-xl bg-muted/60 border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent transition resize-none"
            />
          </Field>

          {showContact && (
            <Field label="Best number to reach you">
              <input
                type="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value.slice(0, 20))}
                placeholder="(555) 555-5555"
                className="w-full h-10 rounded-xl bg-muted/60 border border-border px-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent transition"
              />
            </Field>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 pt-5 border-t border-border/60">
          <div className="text-xs text-muted-foreground">
            Goes to <span className="text-foreground font-medium">{category.routesTo}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 text-sm font-medium hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              className={`h-10 px-5 rounded-xl text-sm font-medium hover:opacity-90 transition ${
                isSafety ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
              }`}
            >
              Send request
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ConfirmationCard({
  category, routing, onAgain,
}: { category: Category; routing: string; onAgain: () => void }) {
  return (
    <section>
      <div className="rounded-2xl bg-card border border-border/70 p-6 md:p-8">
        <div className="size-12 rounded-full bg-primary/10 grid place-items-center">
          <CheckCircle2 className="size-6 text-primary" />
        </div>
        <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">You're covered.</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-md">
          Your <span className="text-foreground font-medium">{category.label.toLowerCase()}</span> request was sent to{" "}
          <span className="text-foreground font-medium">{routing}</span>. You'll see updates in Messages.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={onAgain}
            className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 text-sm font-medium hover:bg-muted transition"
          >
            Send another
          </button>
          <Link
            to="/rbt/messages?focus=bcba"
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition inline-flex items-center gap-1.5"
          >
            <MessageSquare className="size-4" /> Go to Messages
          </Link>
        </div>
      </div>
    </section>
  );
}

function OpenRequestCard({ req }: { req: OpenRequest }) {
  const statusCls: Record<OpenRequest["status"], string> = {
    Submitted: "bg-muted text-foreground/70",
    Routed: "bg-primary/10 text-primary",
    "In Review": "bg-primary/10 text-primary",
    "Waiting on You": "bg-destructive/10 text-destructive",
    Resolved: "bg-primary/10 text-primary",
  };
  return (
    <div className="rounded-2xl bg-card border border-border/70 p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm font-medium text-foreground">{req.type}</div>
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusCls[req.status]}`}>
          {req.status}
        </span>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{req.lastUpdate}</div>
      <div className="mt-3 grid sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
        <div><span className="text-foreground/70">Submitted</span> · {relTime(req.submittedIso)}</div>
        <div><span className="text-foreground/70">Routed to</span> · {req.routedTo}</div>
        <div><span className="text-foreground/70">Next step</span> · {req.nextStep}</div>
      </div>
    </div>
  );
}

function NextStep({ n, title, detail }: { n: number; title: string; detail: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 border border-border/60 p-5">
      <div className="size-7 rounded-full bg-card border border-border/70 grid place-items-center text-xs font-medium text-foreground">{n}</div>
      <div className="mt-3 text-sm font-medium text-foreground">{title}</div>
      <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{detail}</div>
    </div>
  );
}