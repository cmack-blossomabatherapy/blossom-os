import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  BookOpen,
  Search,
  Star,
  Sparkles,
  Eye,
  Pin,
  Compass,
  Workflow,
  Users,
  AlertTriangle,
  ShieldCheck,
  BarChart3,
  GraduationCap,
  Wallet,
  MapPin,
  Server,
  MessageSquare,
  Repeat,
  Bot,
  Siren,
  Clock,
} from "lucide-react";
import { OpsPage, OpsCard } from "./_shared";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Resource = {
  title: string;
  desc: string;
  owner: string;
  department: string;
  updated: string;
  workflows?: string[];
  related?: string[];
  tags: string[];
  pinned?: boolean;
};

type Category = {
  id: string;
  name: string;
  icon: typeof BookOpen;
  blurb: string;
  resources: Resource[];
};

const titles = (arr: string[]): Resource[] =>
  arr.map((t, i) => ({
    title: t,
    desc: defaultDesc(t),
    owner: ownerFor(t),
    department: deptFor(t),
    updated: ["2d ago", "5d ago", "1w ago", "2w ago", "3w ago", "1mo ago"][i % 6],
    workflows: workflowsFor(t),
    related: [],
    tags: tagsFor(t),
  }));

function defaultDesc(t: string) {
  return `Operational standard defining how ${t.replace(/ SOP$/, "").toLowerCase()} is executed across departments.`;
}
function ownerFor(t: string) {
  if (/Payroll|Finance|VOB|Payment|OON/i.test(t)) return "Finance Lead";
  if (/QA|Authoriz|Progress Report/i.test(t)) return "QA Director";
  if (/Staffing|Schedul|Capacity|Pairing|RBT|BCBA/i.test(t)) return "Ops Director";
  if (/Recruit|HR|Onboarding|Orientation|Training/i.test(t)) return "People Ops";
  if (/AI|Automation|Systems|Platform|Data|Permissions|CentralReach|Monday|Blossom OS/i.test(t)) return "Systems Lead";
  if (/State|Clinic|Georgia|NC|TN|VA|MD|Regional/i.test(t)) return "State Director";
  if (/Communication|Announcement|Updates|Crisis|Alignment/i.test(t)) return "Ops Comms";
  if (/Emergency|Risk|Incident|Recovery|Downtime|Compliance/i.test(t)) return "Risk Lead";
  return "Director of Operations";
}
function deptFor(t: string) {
  if (/Payroll|Finance|VOB|Payment|OON/i.test(t)) return "Finance";
  if (/QA|Authoriz|Progress Report/i.test(t)) return "QA";
  if (/Schedul|Pairing|Capacity/i.test(t)) return "Scheduling";
  if (/Staffing|RBT|BCBA/i.test(t)) return "Staffing";
  if (/Recruit/i.test(t)) return "Recruiting";
  if (/HR|Onboarding|Orientation/i.test(t)) return "HR";
  if (/Training|Adoption|SOP Governance|Coaching|Tango/i.test(t)) return "Training";
  if (/AI|Automation/i.test(t)) return "AI";
  if (/Systems|Platform|Data|Permissions|CentralReach|Monday|Blossom OS/i.test(t)) return "Systems";
  if (/State|Clinic|Georgia|NC|TN|VA|MD|Regional/i.test(t)) return "State Ops";
  if (/Communication|Announcement|Updates|Crisis|Alignment/i.test(t)) return "Communications";
  if (/Emergency|Risk|Incident|Recovery|Downtime/i.test(t)) return "Risk";
  return "Operations";
}
function workflowsFor(t: string): string[] {
  if (/Escalation/i.test(t)) return ["Escalations & Blockers"];
  if (/Staffing|Capacity|Pairing/i.test(t)) return ["Staffing & Capacity"];
  if (/Readiness/i.test(t)) return ["Department Health"];
  if (/Payroll|Finance/i.test(t)) return ["Payroll Cycle"];
  if (/Onboarding|Adoption|Training/i.test(t)) return ["Training & Adoption"];
  if (/Briefing|Review|KPI|Metric|Reporting/i.test(t)) return ["Leadership Briefing"];
  if (/Communication|Announcement|Updates/i.test(t)) return ["Leadership Updates"];
  return ["Command Center"];
}
function tagsFor(t: string): string[] {
  const tags: string[] = [];
  if (/Escalation|Blocker|Failure|Emergency|Crisis|Incident/i.test(t)) tags.push("escalation");
  if (/Staffing|Capacity|RBT|BCBA|Pairing|Schedul/i.test(t)) tags.push("staffing");
  if (/Readiness/i.test(t)) tags.push("readiness");
  if (/Payroll|Finance|VOB|Payment|OON/i.test(t)) tags.push("payroll");
  if (/Onboarding|Orientation|Adoption|Training|Coaching/i.test(t)) tags.push("onboarding");
  if (/State|Clinic|Georgia|NC|TN|VA|MD/i.test(t)) tags.push("clinics");
  if (/AI|Automation/i.test(t)) tags.push("ai");
  if (/Risk|Emergency|Downtime|Compliance/i.test(t)) tags.push("risk");
  if (tags.length === 0) tags.push("leadership");
  return tags;
}

const CATEGORIES: Category[] = [
  {
    id: "exec-sops",
    name: "Executive Operations SOPs",
    icon: Compass,
    blurb: "Top-level playbooks the Director of Operations runs the company from.",
    resources: titles([
      "Director of Operations Playbook",
      "Daily Leadership Review SOP",
      "Executive Dashboard SOP",
      "Operations Command Center SOP",
      "Leadership Briefing SOP",
      "Department Health Review SOP",
      "Workflow Risk Monitoring SOP",
      "Escalation Review SOP",
      "Leadership Accountability SOP",
      "Operational Coordination SOP",
      "Organizational Readiness SOP",
      "Multi-State Operations SOP",
      "Leadership Escalation Chain SOP",
      "Operational Governance SOP",
      "Leadership Meeting Cadence SOP",
      "Leadership Communication Standards SOP",
    ]).map((r, i) => ({ ...r, pinned: i < 3 })),
  },
  {
    id: "dept-oversight",
    name: "Department Workflow Oversight",
    icon: Workflow,
    blurb: "How leadership oversees each department's execution and handoffs.",
    resources: titles([
      "Intake Workflow Oversight SOP",
      "Authorizations Oversight SOP",
      "Scheduling Oversight SOP",
      "QA Oversight SOP",
      "Recruiting Oversight SOP",
      "HR Oversight SOP",
      "Payroll Oversight SOP",
      "Staffing Oversight SOP",
      "Training Oversight SOP",
      "Cross-Department Coordination SOP",
      "Workflow Dependency SOP",
      "Workflow Escalation SOP",
      "Department Readiness SOP",
      "Operational Handoff Standards SOP",
    ]),
  },
  {
    id: "staffing",
    name: "Staffing & Capacity Management",
    icon: Users,
    blurb: "Standards that keep clinics covered and capacity healthy.",
    resources: titles([
      "Staffing Readiness SOP",
      "RBT Staffing Workflow SOP",
      "BCBA Capacity Management SOP",
      "Staffing Escalation SOP",
      "Staffing Shortage Response SOP",
      "Capacity Planning SOP",
      "Clinic Staffing Standards SOP",
      "Scheduling Capacity SOP",
      "Pairing & Assignment SOP",
      "Staffing Risk Management SOP",
      "Recruiting to Staffing Coordination SOP",
      "Staffing Forecasting SOP",
      "Staffing Prioritization SOP",
    ]),
  },
  {
    id: "escalations",
    name: "Escalations & Blockers",
    icon: AlertTriangle,
    blurb: "How operational failures and blockers are resolved.",
    resources: titles([
      "Escalation Management SOP",
      "Operational Blocker SOP",
      "Workflow Failure Response SOP",
      "Staffing Escalation SOP",
      "Payroll Escalation SOP",
      "QA Escalation SOP",
      "Scheduling Escalation SOP",
      "Authorization Escalation SOP",
      "BCBA Escalation SOP",
      "Missing Documentation SOP",
      "Progress Report Escalation SOP",
      "Leadership Intervention SOP",
      "Operational Recovery SOP",
      "Emergency Workflow Resolution SOP",
    ]),
  },
  {
    id: "readiness",
    name: "Operational Readiness Standards",
    icon: ShieldCheck,
    blurb: "What 'ready' means across clients, staffing, payroll, and QA.",
    resources: titles([
      "Organizational Readiness Standards",
      "Workflow Readiness SOP",
      "Client Start Readiness SOP",
      "Treatment Authorization Readiness SOP",
      "Scheduling Readiness SOP",
      "Staffing Readiness SOP",
      "Payroll Readiness SOP",
      "QA Readiness SOP",
      "Operational Launch Checklist",
      "Readiness Review Framework",
      "Department Readiness Scorecard SOP",
      "Operational Confidence Standards SOP",
    ]),
  },
  {
    id: "reporting",
    name: "Leadership Reporting & Metrics",
    icon: BarChart3,
    blurb: "Definitions, KPI frameworks, and reporting cadences for leadership.",
    resources: titles([
      "Leadership KPI Definitions",
      "Department Health Score Framework",
      "Operational Metrics SOP",
      "Escalation Tracking SOP",
      "Staffing Metrics SOP",
      "Workflow Velocity SOP",
      "Readiness Metrics SOP",
      "Accountability Metrics SOP",
      "Leadership Reporting Standards",
      "Operational Review SOP",
      "Executive Summary SOP",
      "Daily Briefing Standards SOP",
    ]),
  },
  {
    id: "onboarding",
    name: "Onboarding & Adoption",
    icon: GraduationCap,
    blurb: "Leadership-level adoption, reinforcement, and rollout standards.",
    resources: titles([
      "Leadership Onboarding Standards SOP",
      "Operational Adoption SOP",
      "Workflow Reinforcement SOP",
      "SOP Rollout SOP",
      "Department Adoption Monitoring SOP",
      "Training Reinforcement SOP",
      "New Workflow Launch SOP",
      "Employee Readiness SOP",
      "Operational Consistency SOP",
      "Orientation Oversight SOP",
      "Operational Learning Standards SOP",
    ]),
  },
  {
    id: "payroll",
    name: "Payroll & Finance Coordination",
    icon: Wallet,
    blurb: "How leadership coordinates payroll and finance workflows.",
    resources: titles([
      "Payroll Readiness SOP",
      "Payroll Escalation SOP",
      "Payroll Approval Workflow SOP",
      "VOB Financial Coordination SOP",
      "Payment Plan Oversight SOP",
      "Financial Responsibility SOP",
      "OON Insurance Coordination SOP",
      "Payroll Deadline SOP",
      "Finance Coordination SOP",
      "Client Financial Workflow SOP",
    ]),
  },
  {
    id: "state-ops",
    name: "State Operations & Clinics",
    icon: MapPin,
    blurb: "State-specific operational standards and clinic governance.",
    resources: titles([
      "Georgia Operations SOP",
      "NC Operations SOP",
      "TN Operations SOP",
      "VA Operations SOP",
      "MD Operations SOP",
      "Clinic Operations SOP",
      "State Leadership Coordination SOP",
      "Multi-State Staffing SOP",
      "Clinic Readiness SOP",
      "Regional Escalation SOP",
      "State Director Oversight SOP",
      "Cross-State Operations SOP",
    ]),
  },
  {
    id: "systems",
    name: "Systems & Platform Operations",
    icon: Server,
    blurb: "Standards for Blossom OS, CentralReach, and platform governance.",
    resources: titles([
      "Blossom OS Administration SOP",
      "CentralReach Operational Standards",
      "Monday.com Workflow Governance SOP",
      "Data Upload Standards SOP",
      "Operational Reporting Systems SOP",
      "User Permissions SOP",
      "Systems Escalation SOP",
      "Automation Oversight SOP",
      "AI Operational Standards SOP",
      "Platform Readiness SOP",
      "Systems Adoption SOP",
      "Data Integrity SOP",
    ]),
  },
  {
    id: "communication",
    name: "Organizational Communication",
    icon: MessageSquare,
    blurb: "How leadership communicates change, alignment, and updates.",
    resources: titles([
      "Leadership Communication SOP",
      "Department Communication Standards",
      "Escalation Communication SOP",
      "Staffing Communication SOP",
      "Workflow Change Announcement SOP",
      "Leadership Updates SOP",
      "Crisis Communication SOP",
      "Internal Announcement SOP",
      "Multi-State Communication SOP",
      "Operational Alignment SOP",
    ]),
  },
  {
    id: "training",
    name: "Training & Operational Consistency",
    icon: Repeat,
    blurb: "Governance for training, SOPs, and workflow consistency.",
    resources: titles([
      "Training Oversight SOP",
      "Operational Consistency SOP",
      "SOP Governance SOP",
      "Workflow Reinforcement SOP",
      "Operational Adoption SOP",
      "Tango Process Library",
      "Role-Based Training Standards",
      "Department Readiness Training SOP",
      "Workflow Coaching SOP",
      "Operational Excellence SOP",
    ]),
  },
  {
    id: "ai",
    name: "AI & Automation Operations",
    icon: Bot,
    blurb: "Standards for AI usage, automation governance, and oversight.",
    resources: titles([
      "Ask Blossom AI Usage SOP",
      "AI Operational Standards SOP",
      "AI Escalation Review SOP",
      "AI Reporting SOP",
      "Automation Governance SOP",
      "AI Workflow Monitoring SOP",
      "AI Leadership Insights SOP",
      "Automation Failure SOP",
      "AI Risk Detection SOP",
      "Operational AI Ethics SOP",
    ]),
  },
  {
    id: "risk",
    name: "Emergency & Risk Management",
    icon: Siren,
    blurb: "How leadership handles emergencies, failures, and operational risk.",
    resources: titles([
      "Operational Emergency SOP",
      "Staffing Crisis SOP",
      "Payroll Failure SOP",
      "Workflow Failure SOP",
      "Compliance Risk SOP",
      "Operational Downtime SOP",
      "Escalation Chain SOP",
      "Risk Mitigation SOP",
      "Client Readiness Emergency SOP",
      "Operational Recovery Framework",
      "Incident Coordination SOP",
    ]),
  },
];

const TAG_FILTERS = [
  "all",
  "escalation",
  "staffing",
  "readiness",
  "payroll",
  "onboarding",
  "clinics",
  "ai",
  "risk",
] as const;

export default function OpsResourceLibrary() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [activeTag, setActiveTag] = useState<(typeof TAG_FILTERS)[number]>("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const allResources = useMemo(
    () =>
      CATEGORIES.flatMap((c) =>
        c.resources.map((r) => ({ ...r, categoryId: c.id, categoryName: c.name })),
      ),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allResources.filter((r) => {
      if (activeCat !== "all" && r.categoryId !== activeCat) return false;
      if (activeTag !== "all" && !r.tags.includes(activeTag)) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.desc.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.tags.some((t) => t.includes(q))
      );
    });
  }, [allResources, query, activeCat, activeTag]);

  const pinned = allResources.filter((r) => r.pinned).slice(0, 4);
  const recent = allResources.slice(0, 5);

  const toggleFav = (title: string) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });

  return (
    <OpsPage
      title="Resource Library"
      subtitle="The operational knowledge and governance center for Blossom leadership."
    >
      {/* Search + filters */}
      <OpsCard className="!p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search SOPs, workflows, escalation playbooks, KPI definitions…"
              className="h-10 w-full rounded-xl bg-muted/60 border border-border pl-9 pr-3 text-[13.5px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TAG_FILTERS.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTag(t)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11.5px] capitalize transition",
                  activeTag === t
                    ? "border-foreground/20 bg-foreground text-background"
                    : "border-border/70 bg-muted/40 text-muted-foreground hover:bg-muted",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </OpsCard>

      {/* Pinned + recent */}
      <div className="grid gap-4 md:grid-cols-3">
        <OpsCard title="Pinned for leadership" hint="Curated" className="md:col-span-2">
          <div className="grid gap-2 md:grid-cols-2">
            {pinned.map((r) => (
              <div
                key={r.title}
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-3"
              >
                <div className="rounded-lg bg-background p-2 text-muted-foreground border border-border/60">
                  <Pin className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium tracking-tight text-foreground truncate">
                    {r.title}
                  </div>
                  <div className="text-[11.5px] text-muted-foreground">{r.categoryName}</div>
                </div>
              </div>
            ))}
          </div>
        </OpsCard>
        <OpsCard title="Recently used" hint={`${recent.length}`}>
          <ul className="space-y-2">
            {recent.map((r) => (
              <li key={r.title} className="flex items-center gap-2 text-[12.5px]">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate text-foreground">{r.title}</span>
              </li>
            ))}
          </ul>
        </OpsCard>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5">
        <CategoryChip
          active={activeCat === "all"}
          onClick={() => setActiveCat("all")}
          label="All categories"
          count={allResources.length}
        />
        {CATEGORIES.map((c) => (
          <CategoryChip
            key={c.id}
            active={activeCat === c.id}
            onClick={() => setActiveCat(c.id)}
            label={c.name}
            count={c.resources.length}
          />
        ))}
      </div>

      {/* Results */}
      {activeCat === "all" && !query && activeTag === "all" ? (
        <div className="space-y-8">
          {CATEGORIES.map((c) => (
            <CategorySection
              key={c.id}
              category={c}
              favorites={favorites}
              toggleFav={toggleFav}
              onViewAll={(id) => setActiveCat(id)}
            />
          ))}
        </div>
      ) : (
        <OpsCard
          title={
            activeCat === "all"
              ? "Search results"
              : CATEGORIES.find((c) => c.id === activeCat)?.name
          }
          hint={`${filtered.length} resources`}
        >
          {filtered.length === 0 ? (
            <div className="rounded-xl bg-muted/40 border border-dashed border-border/60 p-8 text-center text-[13px] text-muted-foreground">
              No resources match your filters.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((r) => (
                <ResourceCard
                  key={r.title}
                  resource={r}
                  favorite={favorites.has(r.title)}
                  onFav={() => toggleFav(r.title)}
                />
              ))}
            </div>
          )}
        </OpsCard>
      )}

      <div className="text-[12px] text-muted-foreground">
        Looking for company-wide SOPs?{" "}
        <Link to="/resource-library" className="text-primary hover:opacity-80">
          Open the full Resource Library
        </Link>
        .
      </div>
    </OpsPage>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition",
        active
          ? "border-foreground/20 bg-foreground text-background"
          : "border-border/70 bg-card text-foreground hover:bg-muted",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 text-[10.5px]",
          active ? "bg-background/20 text-background" : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function CategorySection({
  category,
  favorites,
  toggleFav,
  onViewAll,
}: {
  category: Category;
  favorites: Set<string>;
  toggleFav: (t: string) => void;
  onViewAll: (id: string) => void;
}) {
  const Icon = category.icon;
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-muted p-2 text-foreground/80 border border-border/60">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
              {category.name}
            </h2>
            <p className="text-[12.5px] text-muted-foreground">{category.blurb}</p>
          </div>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {category.resources.length} resources
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {category.resources.slice(0, 6).map((r) => (
          <ResourceCard
            key={r.title}
            resource={r}
            favorite={favorites.has(r.title)}
            onFav={() => toggleFav(r.title)}
          />
        ))}
      </div>
      {category.resources.length > 6 && (
        <button
          type="button"
          onClick={() => onViewAll(category.id)}
          className="mt-3 text-[12px] text-muted-foreground hover:text-foreground"
        >
          View all {category.resources.length} in {category.name} →
        </button>
      )}
    </section>
  );
}

function ResourceCard({
  resource,
  favorite,
  onFav,
}: {
  resource: Resource;
  favorite: boolean;
  onFav: () => void;
}) {
  return (
    <div className="group rounded-2xl border border-border/70 bg-card p-4 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_8px_24px_-12px_hsl(220_15%_20%/0.06)] transition hover:-translate-y-0.5 hover:border-border">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-muted p-2 text-muted-foreground">
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[13.5px] font-medium tracking-tight text-foreground">
              {resource.title}
            </div>
            <button
              onClick={onFav}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Favorite"
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5",
                  favorite && "fill-foreground text-foreground",
                )}
              />
            </button>
          </div>
          <p className="mt-1 text-[12px] text-muted-foreground line-clamp-2">{resource.desc}</p>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span>{resource.department}</span>
            <span className="text-border">·</span>
            <span>{resource.owner}</span>
            <span className="text-border">·</span>
            <span>Updated {resource.updated}</span>
          </div>

          {resource.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {resource.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-muted/70 px-2 py-0.5 text-[10.5px] text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              onClick={() => toast.info(`Preview: ${resource.title}`, { description: resource.desc })}
              className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background px-2 py-1 text-[11px] text-foreground hover:bg-muted"
            >
              <Eye className="h-3 w-3" /> Preview
            </button>
            <Link
              to={`/ai/assistant?q=${encodeURIComponent(`Summarize the SOP: ${resource.title}`)}`}
              className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background px-2 py-1 text-[11px] text-foreground hover:bg-muted"
            >
              <Sparkles className="h-3 w-3" /> AI summarize
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}