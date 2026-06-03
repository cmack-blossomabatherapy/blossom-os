import { Link } from "react-router-dom";
import { ArrowRight, Users, Network, Heart, ShieldCheck, Sparkles, Phone, Calendar, GraduationCap, FileCheck, Megaphone, Building2, UserCheck, Briefcase } from "lucide-react";
import { JourneyHero } from "@/components/onboarding/JourneyHero";
import { StepCompleteButton } from "@/components/onboarding/StepCompleteButton";
import { Button } from "@/components/ui/button";
import { useEmployeeDirectory } from "@/hooks/useEmployeeDirectory";
import type { DepartmentId } from "@/data/teamDirectory";

const ICONS: Record<DepartmentId, React.ComponentType<{ className?: string }>> = {
  "operations": Briefcase,
  "executive-operations": Briefcase,
  "state-directors": Building2,
  "asst-state-directors": ShieldCheck,
  "intake": Phone,
  "marketing": Megaphone,
  "hr-payroll": Heart,
  "qa": FileCheck,
  "regional-bcbas": GraduationCap,
  "behavioral-support": UserCheck,
  "scheduling-rbt": Calendar,
  "ga-case-management": Users,
  "recruiting": Sparkles,
  "authorizations": FileCheck,
};

const RESPONSIBILITIES: Record<DepartmentId, { mission: string; responsibilities: string[]; whoToCall: string }> = {
  "operations": {
    mission: "The leadership engine of Blossom — setting strategy, aligning departments, and making sure every part of the company moves together.",
    responsibilities: [
      "Set company-wide vision, priorities, and quarterly goals",
      "Approve budgets, hiring plans, and clinical expansion",
      "Oversee cross-department initiatives and large rollouts",
      "Hold every department accountable to outcomes",
    ],
    whoToCall: "Escalations that span more than one department, strategic decisions, or anything that doesn't have a clear owner yet.",
  },
  "executive-operations": {
    mission: "Executive operations partners — supporting leadership across cross-functional initiatives and day-to-day execution.",
    responsibilities: [
      "Support executive leadership across cross-functional work",
      "Drive operational follow-through on strategic initiatives",
      "Coordinate communication across departments",
      "Keep leadership focused on the highest-priority work",
    ],
    whoToCall: "Executive-level coordination, leadership follow-ups, and cross-department alignment.",
  },
  "state-directors": {
    mission: "The face of Blossom in each state — building local presence, owning state-level performance, and ensuring families and clinicians are well supported.",
    responsibilities: [
      "Own all clinical and operational outcomes within their state",
      "Build and maintain payer, school, and referral relationships",
      "Coach Assistant Directors and frontline supervisors",
      "Represent Blossom in their region",
    ],
    whoToCall: "Anything happening on the ground in your state — staffing, clinical concerns, family escalations, local partnerships.",
  },
  "asst-state-directors": {
    mission: "Right-hand operators for State Directors — translating strategy into day-to-day execution.",
    responsibilities: [
      "Run daily operations under the State Director",
      "Track caseload health, supervision compliance, and KPIs",
      "Coordinate between Scheduling, QA, and Clinical",
      "Step in to resolve operational blockers quickly",
    ],
    whoToCall: "Daily operational questions in your state, before they need to escalate further.",
  },
  "intake": {
    mission: "First impressions matter — Intake is how every family begins their journey with Blossom.",
    responsibilities: [
      "Receive new referrals and respond within hours, not days",
      "Verify benefits and explain the process to families",
      "Schedule assessments and onboard new clients",
      "Hand off cleanly to Authorizations and Clinical",
    ],
    whoToCall: "New family inquiries, benefits questions, or anything related to a client's first 30 days.",
  },
  "marketing": {
    mission: "Telling Blossom's story — to families, to clinicians, and to the wider ABA community.",
    responsibilities: [
      "Run referral, brand, and recruiting campaigns",
      "Manage the website, social channels, and content",
      "Support events, conferences, and partner outreach",
      "Build assets that help every department communicate clearly",
    ],
    whoToCall: "Anything public-facing — collateral, social posts, press, events, or external partnerships.",
  },
  "hr-payroll": {
    mission: "Caring for the people who care for families. HR & Payroll keep employees supported, paid, and growing.",
    responsibilities: [
      "Onboard, support, and offboard every employee",
      "Run accurate, on-time payroll and benefits",
      "Maintain employee records, time-off, and compliance",
      "Champion culture, recognition, and team well-being",
    ],
    whoToCall: "Pay, benefits, time-off, leave, employment paperwork, or any people question.",
  },
  "qa": {
    mission: "The clinical conscience of Blossom — protecting quality, ethics, and outcomes for every client.",
    responsibilities: [
      "Audit session notes, treatment plans, and supervision",
      "Investigate incidents and clinical concerns",
      "Coach BCBAs and RBTs toward higher quality",
      "Keep us aligned with BACB and payer standards",
    ],
    whoToCall: "Clinical quality concerns, ethics questions, documentation issues, or anything that affects client outcomes.",
  },
  "regional-bcbas": {
    mission: "Clinical leadership and BCBA development — the people who grow the next generation of behavior analysts.",
    responsibilities: [
      "Provide clinical oversight across regions",
      "Mentor and supervise BCBAs and BCaBAs",
      "Lead clinical training and case consultation",
      "Drive evidence-based practice across the company",
    ],
    whoToCall: "Complex clinical cases, BCBA mentorship, or training needs.",
  },
  "behavioral-support": {
    mission: "Senior clinical guidance — the BCBAs that BCBAs call when they need help.",
    responsibilities: [
      "Consult on the most complex behavioral cases",
      "Support crisis response and behavior reduction plans",
      "Coach clinical teams through ethical dilemmas",
      "Partner with QA on clinical quality",
    ],
    whoToCall: "Severe behavior cases, crisis situations, or when a BCBA needs senior clinical support.",
  },
  "scheduling-rbt": {
    mission: "The calendar engine of Blossom — and the people RBTs lean on every day.",
    responsibilities: [
      "Build and maintain RBT schedules across clients",
      "Cover cancellations, callouts, and last-minute changes",
      "Be the daily point of contact for RBTs",
      "Protect billable hours and authorization usage",
    ],
    whoToCall: "Schedule changes, RBT coverage, callouts, time-off requests, or session logistics.",
  },
  "ga-case-management": {
    mission: "Day-to-day case ownership for our Georgia families — the connective tissue between family, clinician, and operations.",
    responsibilities: [
      "Own the family relationship for each Georgia client",
      "Coordinate scheduling, clinical, and authorization needs",
      "Communicate proactively with parents and caregivers",
      "Flag risks early so the right team can step in",
    ],
    whoToCall: "Anything family-facing on a Georgia case — communication, logistics, or coordination.",
  },
  "recruiting": {
    mission: "Finding the people who will join Blossom next — the team that fuels every other team.",
    responsibilities: [
      "Source, screen, and interview RBT and BCBA candidates",
      "Partner with State Directors on hiring needs",
      "Run a candidate experience worth talking about",
      "Build pipelines for future growth",
    ],
    whoToCall: "Open roles, candidate referrals, or hiring questions.",
  },
  "authorizations": {
    mission: "Insurance, eligibility, and credentialing — the team that keeps care funded and compliant.",
    responsibilities: [
      "Submit, track, and renew authorizations",
      "Manage credentialing and payer relationships",
      "Resolve claims, appeals, and benefits issues",
      "Protect billable capacity for every client",
    ],
    whoToCall: "Anything insurance — authorizations, denials, credentialing, or payer questions.",
  },
};

export default function OnboardingMeetTheTeam() {
  const { departments, members } = useEmployeeDirectory();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-16 animate-fade-in">
      <JourneyHero
        eyebrow="Meet the Team"
        title="How Blossom is built"
        description="A guide to every department, what they do, and how they fit together. Read this first — then meet the humans behind it in the Team Directory."
      />

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/onboarding/team"><Users className="mr-1.5 h-3.5 w-3.5" /> Team Directory</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/onboarding/org-chart"><Network className="mr-1.5 h-3.5 w-3.5" /> Organizational Chart</Link>
        </Button>
      </div>

      {/* Intro */}
      <section className="rounded-3xl border border-border/60 bg-card/70 p-6 backdrop-blur-md sm:p-8">
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">One company, many specialties</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Blossom is built around a simple idea: families and clinicians deserve a team that works
            together seamlessly. Every department below owns a piece of that promise — from the moment
            a family first calls us, all the way through years of high-quality ABA care.
          </p>
          <p>
            Use this page to understand <span className="font-medium text-foreground">who does what</span>
            {" "}and <span className="font-medium text-foreground">who to call</span> when you need help.
            When you're ready to put names and faces to each role, head to the
            {" "}<Link to="/onboarding/team" className="text-primary underline-offset-4 hover:underline">Team Directory</Link>.
          </p>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 sm:max-w-md">
          {[
            { l: "Departments", v: departments.length },
            { l: "Teammates", v: members.length || "—" },
            { l: "States served", v: "MD · GA · +" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border/60 bg-background/60 p-3 text-center">
              <p className="text-2xl font-semibold text-foreground">{s.v}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Department write-ups */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Departments &amp; responsibilities</h2>
          <p className="mt-1 text-sm text-muted-foreground">Every team at Blossom — what they own, and when to bring them in.</p>
        </div>
        <div className="space-y-4">
          {departments.map((d) => {
            const Icon = ICONS[d.id] ?? Users;
            const detail = RESPONSIBILITIES[d.id];
            const count = members.filter((m) => m.department === d.id).length;
            if (!detail) return null;
            return (
              <article
                key={d.id}
                className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-md transition-all hover:border-primary/40 hover:shadow-md sm:p-8"
              >
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/5 blur-3xl" aria-hidden />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">{d.name}</h3>
                        {count > 0 && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {count} {count === 1 ? "person" : "people"}
                          </span>
                        )}
                        {d.spotlight && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            <Sparkles className="h-3 w-3" /> Core team
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{detail.mission}</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">What they own</p>
                      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                        {detail.responsibilities.map((r) => (
                          <li key={r} className="flex gap-2 text-sm text-muted-foreground">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-border/50 bg-background/50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">When to call them</p>
                      <p className="mt-1 text-sm text-muted-foreground">{detail.whoToCall}</p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 text-center sm:p-8">
        <h2 className="text-xl font-semibold text-foreground">Ready to put faces to the names?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          The Team Directory has every teammate's photo, role, and the states they support. The Org Chart shows how we report up.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/onboarding/team">Open the Team Directory <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/onboarding/org-chart"><Network className="mr-1.5 h-4 w-4" /> View Org Chart</Link>
          </Button>
        </div>
      </section>

      <StepCompleteButton stepId="team" />
    </div>
  );
}
