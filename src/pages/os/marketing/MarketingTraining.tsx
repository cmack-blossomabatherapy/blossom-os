import { MktgPage, MktgCard, AIPrompt } from "./_shared";
import { Link } from "react-router-dom";
import { BookOpen, Megaphone, Star, Search, PhoneCall, HeartHandshake, Users2, ArrowUpRight } from "lucide-react";

const TRACKS = [
  { icon: BookOpen, title: "Marketing onboarding", desc: "How marketing operates inside Blossom — tools, cadence, and ownership.", time: "~25 min" },
  { icon: Search, title: "SEO & content fundamentals", desc: "State pages, local SEO, content cadence, AEO/AI search readiness.", time: "~40 min" },
  { icon: Star, title: "Reputation management", desc: "Review request flow, response standards, escalation rules.", time: "~15 min" },
  { icon: HeartHandshake, title: "Referral relationships", desc: "Outreach standards for physicians, schools, and community partners.", time: "~20 min" },
  { icon: Users2, title: "Community outreach", desc: "Event planning, partnership development, local engagement.", time: "~20 min" },
  { icon: PhoneCall, title: "Call tracking & attribution", desc: "How calls are tagged, attributed, and routed to intake.", time: "~15 min" },
  { icon: Megaphone, title: "Campaign management", desc: "How to launch, monitor, and retire growth and recruiting campaigns.", time: "~30 min" },
];

export default function MarketingTraining() {
  return (
    <MktgPage
      title="Training Academy"
      subtitle="Operational learning for the Marketing Team — lightweight, role-scoped, practical."
      actions={<AIPrompt label="What should I learn first?" prompt="As a new marketing team member at Blossom, what trainings should I complete first?" variant="card" />}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TRACKS.map((t) => (
          <Link
            key={t.title}
            to="/training"
            className="group rounded-2xl border border-border/70 bg-card p-5 transition hover:border-border hover:-translate-y-0.5 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset]"
          >
            <div className="flex items-center justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-foreground/70">
                <t.icon className="h-4 w-4" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
            </div>
            <h3 className="mt-4 text-[14px] font-semibold tracking-tight text-foreground">{t.title}</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{t.desc}</p>
            <div className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">{t.time}</div>
          </Link>
        ))}
      </div>

      <MktgCard title="Operational marketing standards" hint="Single source of truth">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          The full Marketing SOP library, brand standards, and campaign playbooks live in the Resource Library.
          Ask Blossom AI can pull any specific SOP on demand.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <AIPrompt label="Open the marketing SOP library" />
          <AIPrompt label="Show the brand voice guide" />
          <AIPrompt label="Summarize our review-response standard" />
        </div>
      </MktgCard>
    </MktgPage>
  );
}