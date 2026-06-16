import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  PlayCircle, CheckCircle2, Lock, Clock, ChevronRight, Sparkles,
  BookOpen, LifeBuoy, MessageSquare, FileText, ListChecks, Video,
  GraduationCap, ArrowRight, Award, CalendarDays, HelpCircle,
  Users, Workflow, ShieldCheck, Briefcase, Star,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// Recruiting Training Academy — calm, role-specific operational learning.
// Mirrors the RBT academy pattern; expanded with sections, certifications,
// office hours, and downloadable resources for the Recruiting team.

type ModuleStatus = "completed" | "in_progress" | "not_started" | "locked";
type ModuleType = "SOP" | "Video" | "Walkthrough" | "Checklist" | "Overview";

type Module = {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  type: ModuleType;
  status: ModuleStatus;
  progress?: number;
  required?: boolean;
  hasQuiz?: boolean;
  hasSop?: boolean;
};

type Section = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  locked?: boolean;
  modules: Module[];
};

const SECTIONS: Section[] = [
  {
    id: "start",
    title: "Start Here",
    subtitle: "Required onboarding for new recruiters.",
    icon: Sparkles,
    modules: [
      { id: "s1-1", title: "Welcome to Recruiting at Blossom", summary: "Mission, the families we serve, and why recruiting matters.", minutes: 6, type: "Overview", status: "completed", progress: 100, required: true },
      { id: "s1-2", title: "How Blossom OS Works", summary: "Navigating the workspace, queues, slideouts, and AI rail.", minutes: 8, type: "Walkthrough", status: "completed", progress: 100, required: true, hasQuiz: true },
      { id: "s1-3", title: "Recruiting Team Expectations", summary: "Daily rhythm, ownership, and what 'great' looks like.", minutes: 7, type: "SOP", status: "in_progress", progress: 50, required: true, hasSop: true },
      { id: "s1-4", title: "Recruiting Workflow Overview", summary: "From applicant to active staff — the full lifecycle.", minutes: 10, type: "Overview", status: "not_started", required: true, hasSop: true },
      { id: "s1-5", title: "Understanding the ABA Staffing Model", summary: "RBT/BCBA pairings, regions, and clinic vs in-home.", minutes: 9, type: "Overview", status: "not_started", required: true },
      { id: "s1-6", title: "Meet the Recruiting & Staffing Teams", summary: "Who owns what across recruiting, scheduling, and HR.", minutes: 5, type: "Overview", status: "not_started" },
    ],
  },
  {
    id: "core",
    title: "Core Recruiting Operations",
    subtitle: "Daily workflows for moving candidates.",
    icon: Workflow,
    modules: [
      { id: "s2-1", title: "Candidate Intake Process", summary: "How new applicants enter Blossom and get triaged.", minutes: 8, type: "SOP", status: "not_started", required: true, hasSop: true },
      { id: "s2-2", title: "Using Apploi", summary: "Tags, statuses, and keeping Apploi clean.", minutes: 10, type: "Walkthrough", status: "not_started", required: true },
      { id: "s2-3", title: "Resume Review Standards", summary: "What we screen for and what we pass on.", minutes: 7, type: "Checklist", status: "not_started" },
      { id: "s2-4", title: "RBT Certification Verification", summary: "Verifying RBT credentials before scheduling.", minutes: 6, type: "SOP", status: "not_started", required: true, hasSop: true },
      { id: "s2-5", title: "BACB Verification Process", summary: "Confirming BCBA / BCaBA status with the BACB.", minutes: 6, type: "SOP", status: "not_started", required: true },
      { id: "s2-6", title: "Candidate Qualification Standards", summary: "Minimum bar for RBT and BCBA candidates.", minutes: 8, type: "Overview", status: "not_started" },
      { id: "s2-7", title: "Recruiting Pipeline Management", summary: "Keeping every candidate in the right stage.", minutes: 9, type: "Walkthrough", status: "not_started", required: true, hasQuiz: true },
      { id: "s2-8", title: "Recruiting Workflow Stages", summary: "Stage definitions and exit criteria.", minutes: 7, type: "SOP", status: "not_started", hasSop: true },
    ],
  },
  {
    id: "interviews",
    title: "Interviews & Hiring",
    subtitle: "From scheduling to offer.",
    icon: Users,
    modules: [
      { id: "s3-1", title: "Interview Scheduling Workflow", summary: "Calendly, Outlook, and confirming the candidate.", minutes: 7, type: "Walkthrough", status: "not_started", required: true },
      { id: "s3-2", title: "Conducting Recruiting Interviews", summary: "Script, scoring, and red flags.", minutes: 12, type: "Video", status: "not_started", required: true, hasQuiz: true },
      { id: "s3-3", title: "Post-Interview Decision Process", summary: "Routing decisions, debriefs, and outcomes.", minutes: 6, type: "SOP", status: "not_started" },
      { id: "s3-4", title: "Sending Offer Letters", summary: "Generating, sending, and tracking offers.", minutes: 8, type: "Walkthrough", status: "not_started", required: true, hasSop: true },
      { id: "s3-5", title: "Hiring Decision Standards", summary: "When to advance, hold, or decline.", minutes: 6, type: "Overview", status: "not_started" },
      { id: "s3-6", title: "Escalation & Leadership Involvement", summary: "When to bring in leadership.", minutes: 5, type: "SOP", status: "not_started" },
    ],
  },
  {
    id: "onboarding",
    title: "Onboarding & Orientation",
    subtitle: "Get new hires ready to work.",
    icon: GraduationCap,
    modules: [
      { id: "s4-1", title: "Viventium Onboarding Workflow", summary: "Sending invites, monitoring, and unblocking.", minutes: 10, type: "Walkthrough", status: "not_started", required: true, hasSop: true },
      { id: "s4-2", title: "Background Check Process", summary: "Initiating, tracking, and handling flags.", minutes: 8, type: "SOP", status: "not_started", required: true },
      { id: "s4-3", title: "Stellar Check Workflow", summary: "Running Stellar checks and resolving holds.", minutes: 6, type: "Walkthrough", status: "not_started" },
      { id: "s4-4", title: "Orientation Scheduling", summary: "Slotting candidates into orientation cohorts.", minutes: 7, type: "SOP", status: "not_started", required: true },
      { id: "s4-5", title: "Orientation Readiness Tracking", summary: "Confirming docs, credentials, and attendance.", minutes: 6, type: "Checklist", status: "not_started" },
      { id: "s4-6", title: "Staffing Coordination Handoff", summary: "Clean handoff to scheduling.", minutes: 7, type: "SOP", status: "not_started", required: true, hasSop: true },
      { id: "s4-7", title: "Candidate Communication Standards", summary: "Tone, cadence, and what to confirm in writing.", minutes: 6, type: "Overview", status: "not_started" },
    ],
  },
  {
    id: "staffing",
    title: "Staffing Coordination",
    subtitle: "Matching candidates to real demand.",
    icon: Briefcase,
    modules: [
      { id: "s5-1", title: "Understanding Staffing Needs", summary: "Reading demand by region and role.", minutes: 7, type: "Overview", status: "not_started" },
      { id: "s5-2", title: "RBT Staffing Coordination", summary: "Pairing RBTs to caseloads.", minutes: 8, type: "Walkthrough", status: "not_started" },
      { id: "s5-3", title: "BCBA Staffing Coordination", summary: "BCBA placement and caseload fit.", minutes: 8, type: "Walkthrough", status: "not_started" },
      { id: "s5-4", title: "Georgia Clinic Staffing Workflow", summary: "Clinic-specific staffing in Georgia.", minutes: 6, type: "SOP", status: "not_started", hasSop: true },
      { id: "s5-5", title: "State-Based Staffing Operations", summary: "Differences across GA, NC, TN, VA, MD.", minutes: 9, type: "Overview", status: "not_started" },
      { id: "s5-6", title: "Escalating Staffing Risks", summary: "When and how to flag a region.", minutes: 5, type: "SOP", status: "not_started" },
      { id: "s5-7", title: "Staffing Visibility Inside Blossom OS", summary: "Using staffing widgets and AI prompts.", minutes: 6, type: "Walkthrough", status: "not_started" },
    ],
  },
  {
    id: "systems",
    title: "Systems & Tools",
    subtitle: "The stack recruiters live in.",
    icon: ShieldCheck,
    modules: [
      { id: "s6-1", title: "Using Monday.com for Recruiting", summary: "Boards, updates, and what stays in Monday.", minutes: 8, type: "Walkthrough", status: "not_started" },
      { id: "s6-2", title: "Understanding Recruiting Queues", summary: "Today, Follow-Ups, Offers, Onboarding, Escalations.", minutes: 6, type: "Overview", status: "not_started" },
      { id: "s6-3", title: "Using Candidate Notes Correctly", summary: "Note hygiene that holds up over time.", minutes: 5, type: "Checklist", status: "not_started" },
      { id: "s6-4", title: "Internal Communication Standards", summary: "Where to talk, what to document.", minutes: 5, type: "SOP", status: "not_started" },
      { id: "s6-5", title: "Managing Recruiter Follow-Ups", summary: "Never lose a candidate to silence.", minutes: 6, type: "Walkthrough", status: "not_started" },
      { id: "s6-6", title: "Using Operational Insights", summary: "Prompts that actually help recruiters.", minutes: 5, type: "Video", status: "not_started" },
      { id: "s6-7", title: "Understanding Operational Dashboards", summary: "Reading the recruiting dashboard at a glance.", minutes: 6, type: "Overview", status: "not_started" },
    ],
  },
  {
    id: "excellence",
    title: "Operational Excellence",
    subtitle: "Sharpen the craft.",
    icon: Star,
    modules: [
      { id: "s7-1", title: "Reducing Hiring Delays", summary: "Common bottlenecks and how to break them.", minutes: 7, type: "Overview", status: "not_started" },
      { id: "s7-2", title: "Improving Candidate Experience", summary: "Small touches that win great hires.", minutes: 6, type: "Overview", status: "not_started" },
      { id: "s7-3", title: "Communication Best Practices", summary: "Calm, clear, kind communication.", minutes: 6, type: "SOP", status: "not_started" },
      { id: "s7-4", title: "Handling Candidate Escalations", summary: "De-escalation and clean resolution.", minutes: 7, type: "Walkthrough", status: "not_started" },
      { id: "s7-5", title: "Preventing Staffing Bottlenecks", summary: "Spotting demand before it becomes urgent.", minutes: 6, type: "Overview", status: "not_started" },
      { id: "s7-6", title: "Operational Accountability", summary: "Owning outcomes end-to-end.", minutes: 5, type: "Overview", status: "not_started" },
      { id: "s7-7", title: "Calm Under Pressure Operations", summary: "Working well when volume spikes.", minutes: 6, type: "Overview", status: "not_started" },
    ],
  },
  {
    id: "advanced",
    title: "Advanced Recruiting Operations",
    subtitle: "Unlocks after core modules are complete.",
    icon: Award,
    locked: true,
    modules: [
      { id: "s8-1", title: "Multi-State Recruiting Operations", summary: "Running recruiting across multiple states.", minutes: 10, type: "Overview", status: "locked" },
      { id: "s8-2", title: "Managing High-Volume Recruiting", summary: "Patterns for scaling without losing quality.", minutes: 9, type: "Walkthrough", status: "locked" },
      { id: "s8-3", title: "Recruiting Analytics & Visibility", summary: "Reading the numbers that matter.", minutes: 8, type: "Overview", status: "locked" },
      { id: "s8-4", title: "Orientation Optimization", summary: "Better cohorts, fewer no-shows.", minutes: 7, type: "SOP", status: "locked" },
      { id: "s8-5", title: "Advanced Staffing Coordination", summary: "Optimizing pairings at scale.", minutes: 8, type: "Walkthrough", status: "locked" },
      { id: "s8-6", title: "Leadership Escalation Workflows", summary: "Working cleanly with leadership.", minutes: 6, type: "SOP", status: "locked" },
    ],
  },
];

const CERTIFICATIONS = [
  { id: "c1", title: "Recruiting Foundations Certified", sectionIds: ["start", "core"], description: "Core recruiting workflow mastery." },
  { id: "c2", title: "Onboarding Workflow Certified", sectionIds: ["onboarding"], description: "Viventium, background, and orientation." },
  { id: "c3", title: "Staffing Coordination Certified", sectionIds: ["staffing"], description: "Pairing candidates to real demand." },
];

const OFFICE_HOURS = [
  { id: "o1", title: "Recruiting Workflow Q&A", host: "Lauren Hart", when: "Tue · 11:00a ET", kind: "Live training" },
  { id: "o2", title: "Onboarding Refresher", host: "Recruiting Lead", when: "Thu · 2:00p ET", kind: "Refresher" },
  { id: "o3", title: "Leadership Office Hours", host: "Operations", when: "Fri · 10:00a ET", kind: "Q&A" },
];

const RESOURCES = [
  { id: "r1", title: "Recruiting workflow process", type: "SOP", icon: FileText },
  { id: "r2", title: "Phone calls & leads workflow", type: "SOP", icon: FileText },
  { id: "r3", title: "Client staffing readiness lifecycle", type: "SOP", icon: FileText },
  { id: "r4", title: "Organizational staffing structure", type: "Reference", icon: FileText },
];

function firstName(n?: string | null) { return n ? n.trim().split(/\s+/)[0] : "there"; }
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function OSRecruitingTrainingAcademy() {
  const { user } = useAuth();
  const name = firstName((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0]);
  const [filter, setFilter] = useState<"all" | "required" | "in_progress">("all");
  const [activeSection, setActiveSection] = useState<string>("start");

  const allModules = useMemo(() => SECTIONS.flatMap((s) => s.modules), []);

  const stats = useMemo(() => {
    const total = allModules.length;
    const completed = allModules.filter((m) => m.status === "completed").length;
    const required = allModules.filter((m) => m.required).length;
    const requiredDone = allModules.filter((m) => m.required && m.status === "completed").length;
    const pct = Math.round((completed / total) * 100);
    return { total, completed, pct, required, requiredDone };
  }, [allModules]);

  const current = allModules.find((m) => m.status === "in_progress")
    ?? allModules.find((m) => m.status === "not_started" && !!m.required)
    ?? allModules.find((m) => m.status === "not_started");

  const activeSec = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];
  const filteredModules = activeSec.modules.filter((m) =>
    filter === "required" ? m.required :
    filter === "in_progress" ? (m.status === "in_progress" || m.status === "not_started") :
    true
  );

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-32 pt-5 md:px-6 md:pt-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <Link to="/recruiting-team" className="hover:text-foreground transition-colors">Recruiting</Link>
          <ChevronRight className="size-3" />
          <span>Training Academy</span>
        </div>

        {/* Welcome */}
        <header className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Recruiting Training Academy</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {greeting()}, {name}.
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            You're {stats.pct}% through your recruiting journey. {stats.required - stats.requiredDone > 0
              ? `${stats.required - stats.requiredDone} required module${stats.required - stats.requiredDone === 1 ? "" : "s"} left.`
              : "All required modules complete — nice work."}
          </p>
          <div className="mt-5">
            <ProgressBar value={stats.pct} />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{stats.completed} of {stats.total} modules</span>
              <span>{stats.pct}%</span>
            </div>
          </div>
        </header>

        {/* Continue Learning */}
        {current && <ContinueCard module={current} />}

        {/* Section selector */}
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">Your recruiting journey</h2>
              <p className="text-xs text-muted-foreground">Eight sections, designed for real operational execution.</p>
            </div>
            <FilterPills value={filter} onChange={setFilter} />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {SECTIONS.map((s) => {
              const done = s.modules.filter((m) => m.status === "completed").length;
              const pct = Math.round((done / s.modules.length) * 100);
              const active = s.id === activeSection;
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    "shrink-0 rounded-2xl border px-3.5 py-2.5 text-left transition",
                    active
                      ? "border-primary/40 bg-primary/5 shadow-sm"
                      : "border-border/70 bg-card hover:border-border",
                    s.locked && "opacity-70",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn("size-3.5", active ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-xs font-semibold text-foreground">{s.title}</span>
                    {s.locked && <Lock className="size-3 text-muted-foreground" />}
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{done}/{s.modules.length} · {pct}%</div>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{activeSec.title}</h3>
                <p className="text-xs text-muted-foreground">{activeSec.subtitle}</p>
              </div>
              {activeSec.locked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                  <Lock className="size-3" /> Locked
                </span>
              )}
            </div>

            <ol className="relative space-y-3">
              <span aria-hidden className="absolute left-[19px] top-2 bottom-2 w-px bg-border/70" />
              {filteredModules.map((m, i) => (
                <ModuleRow key={m.id} module={m} index={i + 1} />
              ))}
              {filteredModules.length === 0 && (
                <li className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                  Nothing here with this filter.
                </li>
              )}
            </ol>
          </div>
        </section>

        {/* Certifications */}
        <section className="space-y-2">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">Certifications</h2>
              <p className="text-xs text-muted-foreground">Earned by completing each section.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {CERTIFICATIONS.map((c) => {
              const mods = SECTIONS.filter((s) => c.sectionIds.includes(s.id)).flatMap((s) => s.modules);
              const done = mods.filter((m) => m.status === "completed").length;
              const pct = mods.length ? Math.round((done / mods.length) * 100) : 0;
              const earned = pct === 100;
              return (
                <div
                  key={c.id}
                  className={cn(
                    "rounded-2xl border p-4 transition",
                    earned ? "border-primary/40 bg-primary/5" : "border-border/70 bg-card",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Award className={cn("size-4", earned ? "text-primary" : "text-muted-foreground")} />
                    <p className="text-sm font-semibold text-foreground">{c.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                  <div className="mt-3"><ProgressBar value={pct} /></div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{done}/{mods.length} modules</span>
                    <span>{earned ? "Earned" : `${pct}%`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Office Hours */}
        <section className="rounded-2xl border border-border/70 bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              <h2 className="text-base font-semibold tracking-tight text-foreground">Recruiting Office Hours</h2>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {OFFICE_HOURS.map((o) => (
              <div key={o.id} className="rounded-xl border border-border/70 bg-muted/40 p-3.5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{o.kind}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{o.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{o.host} · {o.when}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Resources */}
        <section className="space-y-2">
          <div className="flex items-end justify-between">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Downloadable resources</h2>
            <Link to="/recruiting/resources" className="text-sm text-primary hover:opacity-80">View library</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {RESOURCES.map((r) => {
              const Icon = r.icon;
              return (
                <Link
                  key={r.id}
                  to="/recruiting/resources"
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

        {/* Support */}
        <section className="rounded-2xl border border-border/70 bg-card p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" />
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Support</p>
          </div>
          <p className="mt-2 text-sm text-foreground">Stuck on something? We're here.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <SupportLink to="/ai/assistant?q=Help+me+with+recruiting" icon={Sparkles} label="Operational Insights" />
            <SupportLink to="/recruiting/messages?focus=training" icon={MessageSquare} label="Message recruiting lead" />
            <SupportLink to="/recruiting/resources" icon={LifeBuoy} label="Resource library" />
          </div>
        </section>
      </div>
    </OSShell>
  );
}

function ContinueCard({ module: m }: { module: Module }) {
  const isResume = m.status === "in_progress";
  return (
    <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/8 via-card to-card p-6 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_12px_32px_-16px_oklch(0.2_0.02_260/0.12)]">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
          <PlayCircle className="size-3.5" /> {isResume ? "Continue learning" : "Start next module"}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" /> {isResume && m.progress ? `${Math.max(1, Math.round(m.minutes * (1 - m.progress / 100)))} min left` : `${m.minutes} min`}
        </span>
      </div>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">{m.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{m.summary}</p>
      {isResume && typeof m.progress === "number" && (
        <div className="mt-4"><ProgressBar value={m.progress} /></div>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          {isResume ? "Resume" : "Start"} <ArrowRight className="size-4" />
        </button>
        <span className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border/70 bg-secondary px-4 text-xs font-medium text-secondary-foreground">
          <TypeIcon type={m.type} className="size-3.5" /> {m.type}
        </span>
      </div>
    </section>
  );
}

function ModuleRow({ module: m, index }: { module: Module; index: number }) {
  const dotCls =
    m.status === "completed" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : m.status === "in_progress" ? "border-primary/40 bg-primary/10 text-primary"
    : m.status === "locked" ? "border-border/70 bg-muted text-muted-foreground"
    : "border-border/70 bg-card text-muted-foreground";

  const statusLabel =
    m.status === "completed" ? "Completed"
    : m.status === "in_progress" ? `${m.progress ?? 0}% in progress`
    : m.status === "locked" ? "Locked"
    : "Not started";

  const isLocked = m.status === "locked";

  return (
    <li className="relative pl-10">
      <span className={cn("absolute left-2 top-4 grid size-6 place-items-center rounded-full border bg-card", dotCls)}>
        {m.status === "completed" ? <CheckCircle2 className="size-3.5" />
          : m.status === "locked" ? <Lock className="size-3" />
          : <span className="text-[10px] font-semibold tabular-nums">{index}</span>}
      </span>

      <div
        className={cn(
          "rounded-2xl border border-border/70 bg-card p-4 transition",
          "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_4px_16px_-12px_oklch(0.2_0.02_260/0.06)]",
          isLocked ? "opacity-60" : "hover:-translate-y-0.5 hover:border-border",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-medium text-foreground">{m.title}</p>
              {m.required && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Required</span>}
              {m.hasQuiz && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground" title="Includes quiz">
                  <HelpCircle className="size-3" /> Quiz
                </span>
              )}
              {m.hasSop && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground" title="Linked SOP">
                  <FileText className="size-3" /> SOP
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{m.summary}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {m.minutes} min</span>
              <span className="inline-flex items-center gap-1"><TypeIcon type={m.type} className="size-3" /> {m.type}</span>
              <span>·</span>
              <span>{statusLabel}</span>
            </div>
            {m.status === "in_progress" && typeof m.progress === "number" && (
              <div className="mt-3"><ProgressBar value={m.progress} /></div>
            )}
          </div>

          {!isLocked && (
            <button
              type="button"
              className="hidden shrink-0 items-center gap-1 rounded-xl border border-border/70 bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition hover:bg-muted sm:inline-flex"
            >
              {m.status === "completed" ? "Review" : m.status === "in_progress" ? "Resume" : "Start"}
              <ChevronRight className="size-3.5" />
            </button>
          )}
        </div>

        {!isLocked && (
          <button
            type="button"
            className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 sm:hidden"
          >
            {m.status === "completed" ? "Review" : m.status === "in_progress" ? "Resume" : "Start"}
            <ChevronRight className="size-3.5" />
          </button>
        )}
      </div>
    </li>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function FilterPills({
  value, onChange,
}: { value: "all" | "required" | "in_progress"; onChange: (v: "all" | "required" | "in_progress") => void }) {
  const opts: { v: typeof value; label: string }[] = [
    { v: "all",         label: "All" },
    { v: "required",    label: "Required" },
    { v: "in_progress", label: "To do" },
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

function TypeIcon({ type, className }: { type: ModuleType; className?: string }) {
  const map: Record<ModuleType, React.ComponentType<{ className?: string }>> = {
    SOP: FileText, Video: Video, Walkthrough: PlayCircle, Checklist: ListChecks, Overview: GraduationCap,
  };
  const Icon = map[type] ?? BookOpen;
  return <Icon className={className} />;
}

function SupportLink({
  to, icon: Icon, label,
}: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-secondary/60 p-3 text-sm font-medium text-foreground transition hover:bg-muted"
    >
      <Icon className="size-4 text-muted-foreground" />
      {label}
    </Link>
  );
}