import { useState, type ComponentType } from "react";
import { MktgPage, MktgCard, AIPrompt } from "./_shared";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Compass,
  Workflow,
  PhoneIncoming,
  Search,
  HeartHandshake,
  Users2,
  Megaphone,
  Bot,
  Award,
  ArrowUpRight,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Marketing Team - Role-based learning journeys
// The Academy engine itself lives at /training. This page only defines the
// marketing role's journeys, modules, and certifications.
// ---------------------------------------------------------------------------

type Journey = {
  id: string;
  number: string;
  title: string;
  purpose: string;
  icon: ComponentType<{ className?: string }>;
  modules: string[];
  minutes: number;
  required?: boolean;
};

const JOURNEYS: Journey[] = [
  {
    id: "start-here",
    number: "01",
    title: "Start Here",
    purpose: "Welcome to Blossom - mission, model, and the marketing team's role in operational growth.",
    icon: Compass,
    required: true,
    minutes: 35,
    modules: [
      "Welcome to Blossom",
      "Mission & core values",
      "Understanding ABA at Blossom",
      "How families find Blossom",
      "The multi-state model",
      "Understanding operational growth",
      "Marketing team expectations",
      "Introduction to Blossom OS",
      "Communication standards",
      "HIPAA & privacy awareness for marketing",
    ],
  },
  {
    id: "growth",
    number: "02",
    title: "Understanding Blossom Growth",
    purpose: "How growth actually happens operationally - the full ABA client journey from lead to active care.",
    icon: Workflow,
    required: true,
    minutes: 45,
    modules: [
      "The ABA client journey",
      "Lead -> Intake -> VOB -> Assessment -> Staffing -> Active",
      "Understanding intake operations",
      "Understanding authorizations",
      "Understanding staffing bottlenecks",
      "Understanding state growth",
      "Clinic vs in-home expansion",
      "Understanding recruiting demand",
      "Family experience fundamentals",
    ],
  },
  {
    id: "leads",
    number: "03",
    title: "Lead Sources & Intake Visibility",
    purpose: "Where leads come from and how lead quality impacts every downstream operation.",
    icon: PhoneIncoming,
    minutes: 40,
    modules: [
      "Understanding lead sources",
      "Website lead flow",
      "Facebook lead intake",
      "Call tracking",
      "Referral lead sources",
      "Physician referrals",
      "School referrals",
      "Community referrals",
      "Lead quality vs lead volume",
      "Intake conversion metrics",
      "Understanding \"Can't Reach\" leads",
      "Understanding nonqualified leads",
      "Family communication standards",
    ],
  },
  {
    id: "seo",
    number: "04",
    title: "SEO & Visibility",
    purpose: "How Blossom builds visibility across states - search, content, and AI answer engines.",
    icon: Search,
    minutes: 40,
    modules: [
      "Understanding local SEO",
      "State expansion SEO",
      "ABA search behavior",
      "Parent search intent",
      "Google Business Profiles",
      "Review signals",
      "AI search & Answer Engine Optimization",
      "Content strategy for ABA",
      "Blog standards",
      "Location page standards",
      "Clinic visibility",
      "SEO + recruiting visibility",
      "Website quality & trust signals",
    ],
  },
  {
    id: "reputation",
    number: "05",
    title: "Reputation & Community Outreach",
    purpose: "How trust is built locally - reviews, partnerships, and community presence.",
    icon: HeartHandshake,
    minutes: 30,
    modules: [
      "Managing reviews",
      "Responding to reviews",
      "Community outreach standards",
      "School relationships",
      "Physician relationships",
      "Autism community partnerships",
      "Event marketing",
      "Local visibility",
      "Family trust signals",
      "Community brand reputation",
      "Handling negative feedback",
      "Brand voice standards",
    ],
  },
  {
    id: "recruiting",
    number: "06",
    title: "Recruiting Marketing",
    purpose: "How recruiting and marketing connect - supporting staffing growth alongside client growth.",
    icon: Users2,
    minutes: 30,
    modules: [
      "Recruiting funnel overview",
      "Understanding RBT demand",
      "Understanding BCBA demand",
      "Recruiting lead sources",
      "Apploi workflow basics",
      "Recruiting campaign coordination",
      "Hiring visibility",
      "Recruiting geography challenges",
      "Orientation pipeline awareness",
      "Recruiting conversion metrics",
      "Staffing pressure awareness",
    ],
  },
  {
    id: "campaigns",
    number: "07",
    title: "Campaigns & Growth Coordination",
    purpose: "How campaigns connect to operations - coordinated growth across states and teams.",
    icon: Megaphone,
    minutes: 30,
    modules: [
      "Understanding growth campaigns",
      "State growth campaigns",
      "Referral campaigns",
      "Community campaigns",
      "Recruiting campaigns",
      "Seasonal campaign planning",
      "Campaign performance interpretation",
      "Outreach coordination",
      "Internal marketing coordination",
      "Multi-state campaign awareness",
    ],
  },
  {
    id: "ai",
    number: "08",
    title: "AI & Operational Marketing Intelligence",
    purpose: "How Operational Insights supports growth intelligence - practical, modern, AI-native marketing.",
    icon: Bot,
    minutes: 25,
    modules: [
      "Using Operational Insights",
      "AI-assisted growth analysis",
      "AI for SEO visibility",
      "AI for outreach planning",
      "AI for campaign intelligence",
      "AI for referral growth",
      "AI for recruiting visibility",
      "AI for reputation monitoring",
      "AI for operational insights",
    ],
  },
];

const CERTIFICATIONS = [
  { id: "onboarding", title: "Marketing Team Onboarding", journeys: ["start-here", "growth"] },
  { id: "leads", title: "Lead Visibility", journeys: ["leads"] },
  { id: "outreach", title: "Outreach & Reputation", journeys: ["reputation"] },
  { id: "recruiting", title: "Recruiting Marketing", journeys: ["recruiting"] },
  { id: "seo", title: "SEO & Visibility", journeys: ["seo"] },
  { id: "ai", title: "AI Marketing Intelligence", journeys: ["ai"] },
];

function JourneyCard({ journey }: { journey: Journey }) {
  const [open, setOpen] = useState(false);
  const Icon = journey.icon;
  return (
    <div className="group rounded-2xl border border-border/70 bg-card p-5 transition hover:border-border">
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground/70">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>Journey {journey.number}</span>
            {journey.required && (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">Required</span>
            )}
          </div>
          <h3 className="mt-1 text-[15px] font-semibold tracking-tight text-foreground">{journey.title}</h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{journey.purpose}</p>
          <div className="mt-3 flex items-center justify-between text-[11.5px] text-muted-foreground">
            <span>
              {journey.modules.length} modules - ~{journey.minutes} min
            </span>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition hover:bg-muted"
            >
              {open ? "Hide modules" : "View modules"}
              <ChevronRight className={`h-3 w-3 transition ${open ? "rotate-90" : ""}`} />
            </button>
          </div>
          {open && (
            <ul className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
              {journey.modules.map((m) => (
                <li key={m} className="flex items-start gap-2 text-[12.5px] text-foreground/85">
                  <PlayCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/training"
            className="mt-3 inline-flex items-center gap-1 text-[12.5px] text-primary/80 hover:text-primary"
          >
            Open in Academy <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MarketingTraining() {
  const totalModules = JOURNEYS.reduce((s, j) => s + j.modules.length, 0);
  const totalMinutes = JOURNEYS.reduce((s, j) => s + j.minutes, 0);

  return (
    <MktgPage
      title="Training Academy"
      subtitle="Operational growth training for the Marketing Team - practical, role-scoped, AI-native."
      actions={
        <AIPrompt
          label="What should I learn first?"
          prompt="As a new marketing team member at Blossom, which journeys and modules should I complete first?"
          variant="card"
        />
      }
    >
      {/* ---------- Hero / Continue Learning ---------- */}
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-primary/80">
              <Sparkles className="h-3 w-3" /> Marketing Team Academy
            </div>
            <h2 className="text-2xl md:text-[28px] font-semibold tracking-tight text-foreground leading-tight">
              Learn how Blossom grows - not how marketing usually works.
            </h2>
            <p className="text-[13.5px] text-muted-foreground">
              Eight role-based journeys covering operational growth, lead sources, SEO, reputation,
              recruiting marketing, campaigns, and AI intelligence. Built for ABA healthcare - not generic marketing.
            </p>
            <div className="flex flex-wrap gap-3 pt-1 text-[12px] text-muted-foreground">
              <span><span className="font-semibold text-foreground tabular-nums">{JOURNEYS.length}</span> journeys</span>
              <span><span className="font-semibold text-foreground tabular-nums">{totalModules}</span> modules</span>
              <span><span className="font-semibold text-foreground tabular-nums">~{totalMinutes}</span> min total</span>
              <span><span className="font-semibold text-foreground tabular-nums">{CERTIFICATIONS.length}</span> certifications</span>
            </div>
          </div>
          <Link
            to="/training"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-[13px] font-medium text-primary-foreground transition hover:opacity-90"
          >
            Continue learning <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* ---------- Journeys ---------- */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Learning journeys</h2>
          <span className="text-[11.5px] text-muted-foreground">Role-based - ordered for new marketing hires</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {JOURNEYS.map((j) => (
            <JourneyCard key={j.id} journey={j} />
          ))}
        </div>
      </section>

      {/* ---------- Certifications ---------- */}
      <section>
        <MktgCard
          title="Certifications"
          hint="Lightweight completion-focused - earned by finishing the linked journeys"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CERTIFICATIONS.map((c) => (
              <Link
                key={c.id}
                to="/training"
                className="group flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 transition hover:border-border hover:bg-muted/50"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-background text-primary/80">
                  <Award className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-foreground">{c.title}</div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                    {c.journeys.map((id) => JOURNEYS.find((j) => j.id === id)?.title).filter(Boolean).join(" - ")}
                  </div>
                </div>
                <CheckCircle2 className="mt-1 h-3.5 w-3.5 text-muted-foreground/50 transition group-hover:text-primary/70" />
              </Link>
            ))}
          </div>
        </MktgCard>
      </section>

      {/* ---------- Linked resources ---------- */}
      <section>
        <MktgCard title="Marketing resource library" hint="SOPs and playbooks that pair with these journeys">
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            The full marketing SOP library, brand voice guide, campaign playbooks, outreach standards,
            review-response templates, and state growth playbooks live in the Resource Library.
            Operational Insights can pull any specific SOP on demand.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Link to="/training" className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-3 py-1 text-[12px] text-foreground hover:bg-muted">
              Open Academy library <ArrowUpRight className="h-3 w-3" />
            </Link>
            <AIPrompt label="Show the brand voice guide" />
            <AIPrompt label="Summarize our review-response standard" />
            <AIPrompt label="Open the outreach SOP" />
          </div>
        </MktgCard>
      </section>
    </MktgPage>
  );
}