import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Search, Sparkles, Heart, Activity,
  Phone, FileCheck, ShieldCheck, Calendar, Users, Stethoscope, Briefcase, GraduationCap,
  MessageSquare, Database, ClipboardList, FileSignature, Mail, RefreshCw, BarChart3,
  Megaphone, UserCheck, CheckCircle2, Layers, Target, Network, Zap, Crown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StepCompleteButton } from "@/components/onboarding/StepCompleteButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/* ───────────────────────── Data ───────────────────────── */

const PILLARS = [
  { icon: MessageSquare, title: "Communication", body: "Clear, fast, written. Teams threads, documented decisions, no dropped balls." },
  { icon: Layers,        title: "Structure",     body: "Every role has a lane, every lane has an owner, every owner has accountability." },
  { icon: Database,      title: "Systems",       body: "Workflows live in tools — not in heads. If it isn't logged, it didn't happen." },
  { icon: Target,        title: "Accountability",body: "Extreme ownership. We don't blame, we resolve and document the fix." },
  { icon: Heart,         title: "Family-first",  body: "Every metric, every workflow, every decision rolls up to one outcome: family experience." },
];

type FlowStage = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  dept: string;
  short: string;
  responsibilities: string[];
  systems: string[];
  handsOff: string;
};

const FLOW: FlowStage[] = [
  { id: "marketing", label: "Marketing", icon: Megaphone, dept: "Marketing",
    short: "Reach families and clinicians who need us.",
    responsibilities: ["Run referral & brand campaigns", "Drive inbound leads", "Track source attribution"],
    systems: ["Web", "Social", "Email"], handsOff: "Qualified lead → Intake" },
  { id: "intake", label: "Intake", icon: Phone, dept: "Intake",
    short: "First contact with the family — within hours, not days.",
    responsibilities: ["Receive new referrals", "Collect demographics", "Open the case in Monday"],
    systems: ["Monday.com", "Phone log", "Email"], handsOff: "New family → Forms" },
  { id: "forms", label: "Forms & Packets", icon: FileSignature, dept: "Intake",
    short: "Send, track, and collect every signature we need to start care.",
    responsibilities: ["Send PandaDoc packets", "Chase signatures", "Verify identity & consent"],
    systems: ["PandaDoc", "Email"], handsOff: "Signed packet → VOB" },
  { id: "vob", label: "Insurance Verification", icon: ShieldCheck, dept: "Intake → Auth",
    short: "Confirm benefits before we promise a single session.",
    responsibilities: ["Run VOB", "Document copays / deductibles", "Flag coverage gaps"],
    systems: ["Payer portals", "CentralReach"], handsOff: "Verified benefits → Auth" },
  { id: "auth", label: "Authorizations", icon: FileCheck, dept: "Authorizations",
    short: "Get the green light from insurance to deliver care.",
    responsibilities: ["Submit initial auth", "Track pending requests", "Renew before expiry"],
    systems: ["CentralReach", "Payer portals", "Monday"], handsOff: "Auth approved → Scheduling" },
  { id: "scheduling", label: "Scheduling", icon: Calendar, dept: "Scheduling",
    short: "Build the calendar that turns approvals into real sessions.",
    responsibilities: ["Match availability", "Protect billable hours", "Resolve conflicts fast"],
    systems: ["CentralReach", "Teams"], handsOff: "Scheduled → Assessment" },
  { id: "assessment", label: "Assessments", icon: Stethoscope, dept: "Clinical",
    short: "BCBA evaluation that becomes the treatment plan.",
    responsibilities: ["Run intake assessment", "Draft treatment plan", "Set baseline goals"],
    systems: ["CentralReach"], handsOff: "Plan drafted → QA" },
  { id: "qa", label: "QA Review", icon: ClipboardList, dept: "QA",
    short: "Quality control before anything goes to insurance.",
    responsibilities: ["Audit treatment plans", "Check session notes", "Coach clinicians"],
    systems: ["CentralReach", "Monday"], handsOff: "Approved plan → Staffing" },
  { id: "staffing", label: "Staffing", icon: Users, dept: "Staffing",
    short: "Match the right RBT to the right family.",
    responsibilities: ["Profile match", "Confirm credentials", "Schedule pairing"],
    systems: ["Apploi", "CentralReach"], handsOff: "RBT matched → Pairing" },
  { id: "pairing", label: "Pairing", icon: UserCheck, dept: "Clinical + Staffing",
    short: "First sessions: trust between RBT, family, and child.",
    responsibilities: ["Run intro session", "Set expectations with family", "Coach RBT"],
    systems: ["CentralReach", "Teams"], handsOff: "Paired → Ongoing services" },
  { id: "services", label: "Ongoing Services", icon: Activity, dept: "Clinical",
    short: "The work that changes lives — week after week.",
    responsibilities: ["Daily sessions", "Data collection", "Parent updates"],
    systems: ["CentralReach"], handsOff: "Sessions → Progress reports" },
  { id: "progress", label: "Progress Reports", icon: BarChart3, dept: "Clinical + QA",
    short: "Show insurance and family that care is working.",
    responsibilities: ["Write progress notes", "Update goals", "Submit to QA"],
    systems: ["CentralReach"], handsOff: "Reports → Renewals" },
  { id: "renewals", label: "Renewals", icon: RefreshCw, dept: "Authorizations",
    short: "Renew before authorizations expire — never break care.",
    responsibilities: ["Track expiry dates", "Re-submit auth", "Coordinate with clinical"],
    systems: ["CentralReach", "Monday"], handsOff: "Renewed → Continued care" },
  { id: "support", label: "Family Support", icon: Heart, dept: "Case Management",
    short: "Always-on relationship with the family.",
    responsibilities: ["Proactive check-ins", "Resolve concerns", "Coordinate everyone"],
    systems: ["Teams", "Email", "Phone"], handsOff: "Lifelong relationship" },
];

const DEPARTMENTS = [
  { id: "ops", icon: Briefcase, name: "Operations", tagline: "The leadership engine.",
    why: "Sets vision, approves budgets, breaks ties between departments.",
    workflows: ["Quarterly planning", "KPI reviews", "Cross-department escalations"], systems: ["Monday", "Teams"] },
  { id: "intake", icon: Phone, name: "Intake", tagline: "First impression, every time.",
    why: "Speed-to-respond is the single biggest signal that we care.",
    workflows: ["Lead intake", "VOB", "Packet collection"], systems: ["Monday", "PandaDoc", "Phone log"] },
  { id: "auth", icon: FileCheck, name: "Authorizations", tagline: "Care that gets paid for.",
    why: "Protect billable capacity for every client without gaps.",
    workflows: ["Initial auth", "Renewals", "Appeals"], systems: ["CentralReach", "Payer portals"] },
  { id: "qa", icon: ClipboardList, name: "Quality Assurance", tagline: "The clinical conscience.",
    why: "Quality protects outcomes, ethics, and our reputation.",
    workflows: ["Treatment plan audits", "Note review", "Coaching loops"], systems: ["CentralReach", "Monday"] },
  { id: "sched", icon: Calendar, name: "Scheduling & RBT Reps", tagline: "The calendar engine.",
    why: "Every cancellation is a family without care that day.",
    workflows: ["Scheduling", "Coverage", "Callouts"], systems: ["CentralReach", "Teams"] },
  { id: "staffing", icon: Users, name: "Recruiting & Staffing", tagline: "The people who fuel everything.",
    why: "We grow only as fast as we can hire and pair well.",
    workflows: ["Sourcing", "Interviews", "Match-to-case"], systems: ["Apploi", "CentralReach"] },
  { id: "clinical", icon: Stethoscope, name: "Clinical (BCBAs & RBTs)", tagline: "Where care actually happens.",
    why: "Everything else exists to make these sessions great.",
    workflows: ["Assessments", "Sessions", "Progress reports"], systems: ["CentralReach"] },
  { id: "hr", icon: Heart, name: "HR & Payroll", tagline: "Care for the caregivers.",
    why: "If our team isn't supported, families can't be either.",
    workflows: ["Onboarding", "Payroll", "Benefits"], systems: ["Viventium", "Monday"] },
  { id: "training", icon: GraduationCap, name: "Training", tagline: "Growth never stops.",
    why: "Skill is built — through orientation, mentorship, and practice.",
    workflows: ["RBT orientation", "BCBA development", "Ongoing CEs"], systems: ["Academy", "Monday"] },
];

const SYSTEMS = [
  { name: "Monday.com",   icon: Layers,         purpose: "Pipeline & workflow tracking",        users: "Intake, Auth, Ops, QA",   why: "If a case isn't in Monday, it doesn't exist." },
  { name: "CentralReach", icon: Stethoscope,    purpose: "Clinical EHR — auths, sessions, notes", users: "Clinical, Auth, Scheduling, QA", why: "The clinical source of truth." },
  { name: "Viventium",    icon: Briefcase,      purpose: "Payroll & benefits",                  users: "HR, Finance, Employees",  why: "How you get paid and stay covered." },
  { name: "Apploi",       icon: UserCheck,      purpose: "Recruiting ATS",                      users: "Recruiting, Hiring Managers", why: "Pipeline of every candidate." },
  { name: "PandaDoc",     icon: FileSignature,  purpose: "Forms, signatures, packets",          users: "Intake, HR, Ops",         why: "Signed in minutes, tracked end-to-end." },
  { name: "Microsoft Teams", icon: MessageSquare, purpose: "Internal communication",            users: "Everyone",                why: "Threads beat email. Document decisions." },
  { name: "Outlook / Email", icon: Mail,        purpose: "External communication",              users: "Everyone",                why: "Family- and payer-facing comms." },
  { name: "Blossom Academy", icon: GraduationCap, purpose: "Training & onboarding",              users: "Everyone",                why: "Where every new teammate becomes great." },
];

const VALUES = [
  { icon: BarChart3,  title: "Data Over Emotion",   color: "from-sky-500 to-blue-600",
    actions: ["KPI dashboards reviewed weekly", "Decisions backed by numbers", "Documented outcomes, not opinions"] },
  { icon: ShieldCheck, title: "Extreme Ownership",  color: "from-violet-500 to-purple-600",
    actions: ["Own the outcome, not the task", "Close the loop in writing", "No 'not my job' here"] },
  { icon: RefreshCw,  title: "Always Improving",    color: "from-emerald-500 to-teal-600",
    actions: ["Every workflow has a v2", "Training never stops", "Retros after every miss"] },
  { icon: Heart,      title: "Family First, Always",color: "from-rose-500 to-pink-600",
    actions: ["Family experience is the metric", "Same-day responsiveness", "Coordinate so they never have to chase"] },
];

const COMM_STANDARDS = [
  { icon: MessageSquare, title: "Default to Teams threads", body: "Decisions and questions live in Teams. Email is for external only." },
  { icon: FileCheck,     title: "Document the decision",   body: "If it isn't written down, it didn't happen. Leave a trail every time." },
  { icon: Zap,           title: "Same-business-day reply", body: "Acknowledge fast, even if the full answer comes later." },
  { icon: Crown,         title: "Escalate cleanly",        body: "Bring the problem AND the proposed fix. Up the chain only when needed." },
];

/* ───────────────────────── Components ───────────────────────── */

function GlowCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-md transition-all hover:border-primary/40 hover:shadow-lg",
      className,
    )}>
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
      <div className="relative">{children}</div>
    </div>
  );
}

function FlowNode({ stage, active, onClick }: { stage: FlowStage; active: boolean; onClick: () => void }) {
  const Icon = stage.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex shrink-0 flex-col items-center gap-2 outline-none transition-all",
        "focus-visible:ring-2 focus-visible:ring-primary/50 rounded-2xl",
      )}
    >
      <span className={cn(
        "absolute inset-0 -z-10 rounded-3xl blur-xl transition-opacity duration-500",
        active ? "bg-primary/40 opacity-100" : "bg-primary/10 opacity-0 group-hover:opacity-60",
      )} aria-hidden />
      <span className={cn(
        "flex h-14 w-14 items-center justify-center rounded-2xl border transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-lg scale-110"
          : "border-border/60 bg-card text-foreground group-hover:border-primary/50 group-hover:scale-105",
      )}>
        <Icon className="h-6 w-6" />
      </span>
      <span className={cn(
        "max-w-[110px] text-center text-[11px] font-medium leading-tight transition-colors",
        active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
      )}>{stage.label}</span>
    </button>
  );
}

function FlowConnector({ active }: { active: boolean }) {
  return (
    <div className="relative mx-1 mt-7 hidden h-px w-8 shrink-0 sm:block">
      <div className="absolute inset-0 bg-border" />
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r from-primary to-primary-glow transition-opacity duration-500",
        active ? "opacity-100" : "opacity-0",
      )} />
      <ArrowRight className={cn("absolute -right-1 -top-2 h-3 w-3 transition-colors", active ? "text-primary" : "text-border")} />
    </div>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default function OnboardingHowItWorks() {
  const navigate = useNavigate();
  const [activeFlow, setActiveFlow] = useState<string>(FLOW[0].id);
  const [openStage, setOpenStage] = useState<FlowStage | null>(null);
  const [search, setSearch] = useState("");

  const stage = FLOW.find((s) => s.id === activeFlow) ?? FLOW[0];

  /* Searchable index across flow stages, departments, and systems */
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    const flowHits = FLOW.filter((s) =>
      [s.label, s.dept, s.short, ...s.responsibilities, ...s.systems].join(" ").toLowerCase().includes(q),
    ).map((s) => ({ kind: "Workflow" as const, id: s.id, title: s.label, sub: s.dept, body: s.short, onOpen: () => { setActiveFlow(s.id); setOpenStage(s); } }));
    const deptHits = DEPARTMENTS.filter((d) =>
      [d.name, d.tagline, d.why, ...d.workflows, ...d.systems].join(" ").toLowerCase().includes(q),
    ).map((d) => ({ kind: "Department" as const, id: d.id, title: d.name, sub: d.tagline, body: d.why, onOpen: () => {
      document.getElementById(`dept-${d.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    } }));
    const sysHits = SYSTEMS.filter((s) =>
      [s.name, s.purpose, s.users, s.why].join(" ").toLowerCase().includes(q),
    ).map((s) => ({ kind: "System" as const, id: s.name, title: s.name, sub: s.purpose, body: s.why, onOpen: () => {
      document.getElementById("systems")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } }));
    return [...flowHits, ...deptHits, ...sysHits];
  }, [search]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 pb-20 animate-fade-in">
      {/* HERO — cinematic */}
      <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)] p-8 text-primary-foreground shadow-2xl sm:p-14">
        {/* Animated glow blobs */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,hsl(var(--primary-foreground)/0.3),transparent_45%),radial-gradient(circle_at_85%_85%,hsl(var(--primary-foreground)/0.18),transparent_50%)]" aria-hidden />
        {/* Floating workflow nodes */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {[
            { Icon: Phone,       top: "12%", left: "8%",  delay: "0s"   },
            { Icon: FileCheck,   top: "70%", left: "15%", delay: "0.6s" },
            { Icon: Calendar,    top: "25%", left: "82%", delay: "0.3s" },
            { Icon: Stethoscope, top: "78%", left: "78%", delay: "0.9s" },
            { Icon: Heart,       top: "8%",  left: "55%", delay: "0.45s"},
          ].map(({ Icon, top, left, delay }, i) => (
            <div key={i}
              className="absolute h-12 w-12 rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 backdrop-blur-md flex items-center justify-center animate-fade-in"
              style={{ top, left, animationDelay: delay, animationFillMode: "both" }}
            >
              <Icon className="h-5 w-5 text-primary-foreground/80" />
            </div>
          ))}
        </div>

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" /> Inside the Blossom Operating System
          </div>
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">How Blossom Works</h1>
            <p className="mt-4 max-w-2xl text-base text-primary-foreground/90 sm:text-lg">
              An inside look at the systems, workflows, communication, and operational structure that power Blossom ABA Therapy.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[12px]">
            {["Communication", "Structure", "Systems", "Accountability", "Family-first"].map((p) => (
              <span key={p} className="rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1 backdrop-blur-md">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Quick nav */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/onboarding"))}>
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
        </Button>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { href: "#flow",        label: "Family Flow" },
            { href: "#departments", label: "Departments" },
            { href: "#systems",     label: "Systems" },
            { href: "#values",      label: "Values" },
            { href: "#comms",       label: "Comms" },
          ].map((n) => (
            <a key={n.href} href={n.href} className="rounded-full border border-border/60 bg-card px-3 py-1 text-muted-foreground hover:border-primary/40 hover:text-foreground">{n.label}</a>
          ))}
        </div>
      </div>

      {/* INTRODUCTION — five pillars */}
      <section className="space-y-5">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Blossom runs on five things.</h2>
          <p className="mt-2 text-muted-foreground">
            Every department, every workflow, every decision traces back to these. Internalize them — they're how we operate.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <GlowCard key={p.title} className="p-5 animate-fade-in" >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">{p.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.body}</p>
                <div className="mt-3 text-[10px] font-mono text-muted-foreground/70">0{i + 1}</div>
              </GlowCard>
            );
          })}
        </div>
      </section>

      {/* SEARCH */}
      <section className="rounded-3xl border border-border/60 bg-card/70 p-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Search className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Search the operating system</p>
            <p className="text-xs text-muted-foreground">Workflows, departments, systems, terminology — all indexed.</p>
          </div>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute z-10 left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Try: authorizations, scheduling, PandaDoc, QA…" className="pl-9" />
        </div>
        {searchResults && (
          <div className="mt-4 space-y-2">
            {searchResults.length === 0 && (
              <p className="rounded-xl border border-dashed border-border bg-background/40 p-4 text-center text-xs text-muted-foreground">
                No matches. Try a department, system, or workflow keyword.
              </p>
            )}
            {searchResults.slice(0, 8).map((r) => (
              <button key={`${r.kind}-${r.id}`} onClick={r.onOpen}
                className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3 text-left transition-all hover:border-primary/40 hover:bg-background">
                <Badge variant="outline" className="shrink-0 text-[10px]">{r.kind}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.sub} — {r.body}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* INTERACTIVE FAMILY FLOW */}
      <section id="flow" className="space-y-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            <Network className="h-3 w-3" /> Operational Ecosystem
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">How a family moves through Blossom.</h2>
          <p className="mt-2 text-muted-foreground">
            From the first call to year-three of care. Click any node to see what that team owns and how they hand off.
          </p>
        </div>

        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-card via-background to-primary/5 p-5 sm:p-7">
          {/* Flow rail */}
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-fit items-start gap-1 sm:gap-2">
              {FLOW.map((s, i) => (
                <div key={s.id} className="flex items-start">
                  <FlowNode stage={s} active={s.id === activeFlow} onClick={() => { setActiveFlow(s.id); setOpenStage(s); }} />
                  {i < FLOW.length - 1 && <FlowConnector active={i < FLOW.findIndex((x) => x.id === activeFlow)} />}
                </div>
              ))}
            </div>
          </div>

          {/* Active stage detail */}
          <div className="mt-6 grid gap-4 rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur-md sm:grid-cols-[auto_1fr]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-md">
              <stage.icon className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">{stage.label}</h3>
                <Badge variant="outline" className="text-[10px]">{stage.dept}</Badge>
              </div>
              <p className="mt-1 text-sm text-foreground/90">{stage.short}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">What they own</p>
                  <ul className="mt-1.5 space-y-1">
                    {stage.responsibilities.map((r) => (
                      <li key={r} className="flex gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Systems</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {stage.systems.map((s) => (
                      <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Hand-off</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{stage.handsOff}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEPARTMENT BREAKDOWN */}
      <section id="departments" className="space-y-5">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Departments &amp; how they connect.</h2>
          <p className="mt-2 text-muted-foreground">Every team's role in the bigger picture — and the systems they live in.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DEPARTMENTS.map((d) => {
            const Icon = d.icon;
            return (
              <GlowCard key={d.id} className="p-6">
                <div id={`dept-${d.id}`} className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground">{d.name}</h3>
                    <p className="text-xs text-muted-foreground">{d.tagline}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground/90">{d.why}</p>
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Workflows</p>
                  <div className="flex flex-wrap gap-1">
                    {d.workflows.map((w) => <Badge key={w} variant="outline" className="text-[10px]">{w}</Badge>)}
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Systems</p>
                  <div className="flex flex-wrap gap-1">
                    {d.systems.map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                  </div>
                </div>
              </GlowCard>
            );
          })}
        </div>
      </section>

      {/* SYSTEMS ECOSYSTEM */}
      <section id="systems" className="space-y-5">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">The Blossom systems ecosystem.</h2>
          <p className="mt-2 text-muted-foreground">The platforms that make every workflow possible — connected, intentional, accountable.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SYSTEMS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.name} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" aria-hidden />
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">{s.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.purpose}</p>
                  <div className="mt-3 border-t border-border/50 pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Used by</p>
                    <p className="mt-0.5 text-xs text-foreground/90">{s.users}</p>
                  </div>
                  <p className="mt-3 text-xs italic text-primary/90">"{s.why}"</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* VALUES IN ACTION */}
      <section id="values" className="space-y-5">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">How our values shape operations.</h2>
          <p className="mt-2 text-muted-foreground">Values aren't posters. They're decisions you'll see in every workflow.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
                <div className={cn("bg-gradient-to-br p-5 text-white", v.color)}>
                  <Icon className="h-7 w-7" />
                  <p className="mt-3 text-sm font-semibold">{v.title}</p>
                </div>
                <ul className="space-y-2 p-5">
                  {v.actions.map((a) => (
                    <li key={a} className="flex gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* COMMUNICATION */}
      <section id="comms" className="space-y-5">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">How we communicate.</h2>
          <p className="mt-2 text-muted-foreground">Operational professionalism is built on clear, fast, written communication.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COMM_STANDARDS.map((c) => {
            const Icon = c.icon;
            return (
              <GlowCard key={c.title} className="p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">{c.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.body}</p>
              </GlowCard>
            );
          })}
        </div>
      </section>

      {/* HOW EVERYTHING CONNECTS — closing visual */}
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/30 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--accent))_140%)] p-8 text-primary-foreground shadow-xl sm:p-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary-foreground)/0.25),transparent_60%)]" aria-hidden />
        <div className="relative mx-auto max-w-3xl text-center">
          <Heart className="mx-auto h-10 w-10 text-primary-foreground" />
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Every workflow leads back to the family.</h2>
          <p className="mt-3 text-primary-foreground/85">
            Marketing finds them. Intake welcomes them. Auth funds their care. Scheduling shows up on time. Clinical changes lives. QA protects quality. HR cares for the team that cares for them.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px]">
            {["Marketing", "Intake", "Auth", "Scheduling", "Clinical", "QA", "HR", "Family"].map((d, i, arr) => (
              <span key={d} className="flex items-center gap-2">
                <span className="rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 backdrop-blur-md">{d}</span>
                {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-primary-foreground/60" />}
              </span>
            ))}
          </div>
        </div>
      </section>

      <StepCompleteButton stepId="how-it-works" />

      {/* STAGE DETAIL DIALOG */}
      <Dialog open={!!openStage} onOpenChange={(o) => !o && setOpenStage(null)}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          {openStage && (
            <>
              <div className="relative bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_60%,hsl(var(--accent))_120%)] p-6 text-primary-foreground">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/15 backdrop-blur-md">
                    <openStage.icon className="h-7 w-7" />
                  </div>
                  <div className="pt-1">
                    <Badge className="mb-2 bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/25">{openStage.dept}</Badge>
                    <DialogHeader className="text-left">
                      <DialogTitle className="text-2xl text-primary-foreground">{openStage.label}</DialogTitle>
                      <DialogDescription className="text-primary-foreground/85">{openStage.short}</DialogDescription>
                    </DialogHeader>
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">What they own</p>
                  <ul className="mt-2 space-y-1.5">
                    {openStage.responsibilities.map((r) => (
                      <li key={r} className="flex gap-2 text-sm text-foreground/90">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-muted/40 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Systems</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {openStage.systems.map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/40 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Hand-off</p>
                    <p className="mt-1 text-sm text-foreground/90">{openStage.handsOff}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
