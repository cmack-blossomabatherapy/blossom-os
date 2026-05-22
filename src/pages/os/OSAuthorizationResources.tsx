import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Sparkles, Bookmark, Clock, ArrowRight, FileText, Workflow as WorkflowIcon,
  PlayCircle, ListChecks, ShieldCheck, Activity, ClipboardCheck, AlertTriangle,
  Users, Target, MessageSquare, Wrench, Pin, Share2, ChevronRight,
  BookOpen, Library, Star, Calendar, ExternalLink,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// =============================================================================
// Authorization Resource Library
// Curated operational knowledge for the Authorization team. Wireframe + structure.
// Real content is referenced by linking to existing Blossom workflows where
// possible (Auth workspace, Risk Center, Parent Training 97156, Training journey).
// =============================================================================

type ResourceType = "SOP" | "Workflow" | "Guide" | "Template" | "Tango" | "Video" | "Checklist" | "FAQ";
type Category =
  | "SOPs & Core Workflows"
  | "PR & Supervision Tracking"
  | "QA & Reassessment"
  | "Parent Training 97156"
  | "Missing Documentation"
  | "Payer & Insurance Guidance"
  | "Authorization Risk Management"
  | "Communication Templates"
  | "Tango Walkthroughs"
  | "Systems & Tools";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: Category;
  type: ResourceType;
  minutes: number;
  updated: string; // ISO date
  href?: string;
  featured?: boolean;
  workflows?: WorkflowKey[];
  system?: string;
  difficulty?: "Quick" | "Standard" | "Deep";
}

type WorkflowKey =
  | "new-auth" | "awaiting-submission" | "pr-followup" | "qa-review"
  | "expiring-soon" | "denial-resolution" | "missing-docs" | "reassessment"
  | "continuation" | "parent-signature";

const resources: Resource[] = [
  // Featured
  { id: "r1", title: "Authorization SOP", description: "End-to-end lifecycle: Awaiting Submission → Submitted → Approved, with status ownership and timing.", category: "SOPs & Core Workflows", type: "SOP", minutes: 12, updated: "2026-05-12", featured: true, workflows: ["new-auth", "awaiting-submission"] },
  { id: "r2", title: "PR Escalation Workflow", description: "Real 9-week / 6-week escalation ladders for Georgia and multi-state PRs.", category: "PR & Supervision Tracking", type: "Workflow", minutes: 8, updated: "2026-05-08", featured: true, workflows: ["pr-followup"] },
  { id: "r3", title: "QA Review Workflow", description: "How treatment auths move through QA Review and back to Awaiting Submission.", category: "QA & Reassessment", type: "Workflow", minutes: 7, updated: "2026-04-29", featured: true, workflows: ["qa-review", "reassessment"] },
  { id: "r4", title: "Missing Documentation Resolution Guide", description: "Apply the Incomplete Documents rule correctly. When to delete the auth and return to Can't Submit Auth.", category: "Missing Documentation", type: "Guide", minutes: 9, updated: "2026-05-02", featured: true, workflows: ["missing-docs"] },
  { id: "r5", title: "Reassessment Timing Guide", description: "When to open reassessments so QA has runway and submissions land before expiration.", category: "QA & Reassessment", type: "Guide", minutes: 6, updated: "2026-04-21", featured: true, workflows: ["reassessment", "continuation"] },
  { id: "r6", title: "Parent Training 97156 Operations Guide", description: "Continuation readiness, utilization signals, and parent participation visibility.", category: "Parent Training 97156", type: "Guide", minutes: 8, updated: "2026-05-15", featured: true, href: "/parent-training-97156", workflows: ["continuation"] },
  { id: "r7", title: "Auth Risk Center Usage Guide", description: "Read the 11 risk signals and the Red/Orange/Yellow/Green zones operationally.", category: "Authorization Risk Management", type: "Guide", minutes: 7, updated: "2026-05-18", featured: true, href: "/auth-risk-center", workflows: ["expiring-soon"] },

  // SOPs & core
  { id: "r10", title: "Authorization Status Definitions", description: "What each status means, what triggers a move, and who owns each transition.", category: "SOPs & Core Workflows", type: "SOP", minutes: 5, updated: "2026-04-30" },
  { id: "r11", title: "Authorization Coordinator Daily Workflow", description: "The 10-minute morning scan that catches 90% of issues.", category: "SOPs & Core Workflows", type: "Workflow", minutes: 4, updated: "2026-05-19" },
  { id: "r12", title: "Authorization Workspace Guide", description: "Every panel, filter, and keyboard shortcut in the Auth workspace.", category: "SOPs & Core Workflows", type: "Guide", minutes: 6, updated: "2026-05-10", href: "/authorizations" },
  { id: "r13", title: "Escalation Matrix", description: "Owner mapping for every common escalation path across states.", category: "SOPs & Core Workflows", type: "Guide", minutes: 5, updated: "2026-04-26" },

  // PR & supervision
  { id: "r20", title: "Supervision Tracking Guide", description: "Supervision % thresholds and when <70% becomes coordinator-owned.", category: "PR & Supervision Tracking", type: "Guide", minutes: 5, updated: "2026-04-22", workflows: ["pr-followup"] },
  { id: "r21", title: "Parent Signature Workflow", description: "When SD re-enters the ladder after PR is received.", category: "PR & Supervision Tracking", type: "Workflow", minutes: 4, updated: "2026-05-04", workflows: ["parent-signature"] },
  { id: "r22", title: "PR Outreach Templates", description: "Calm, specific, action-oriented outreach drafts in the Blossom tone.", category: "Communication Templates", type: "Template", minutes: 3, updated: "2026-05-11", workflows: ["pr-followup"] },

  // Payer / insurance
  { id: "r30", title: "Payer Communication Expectations", description: "Per-payer cadence, tone, and documentation expectations.", category: "Payer & Insurance Guidance", type: "Guide", minutes: 7, updated: "2026-04-18" },
  { id: "r31", title: "Common Denial Resolution Guide", description: "Three patterns that resolve 80% of denials. When to appeal.", category: "Payer & Insurance Guidance", type: "Guide", minutes: 8, updated: "2026-05-06", workflows: ["denial-resolution"] },
  { id: "r32", title: "EOB / Payment Plan Guidance", description: "Coordinator-level finance literacy: enough to coordinate well, not to bill.", category: "Payer & Insurance Guidance", type: "Guide", minutes: 6, updated: "2026-04-14" },

  // Reports / risk
  { id: "r40", title: "Authorization Reports Guide", description: "The 3 foundational reports: expiration, workflow bottleneck, operational performance.", category: "Authorization Risk Management", type: "Guide", minutes: 5, updated: "2026-05-16", href: "/reports/auth-expiration-risk" },
  { id: "r41", title: "Risk Center Daily Routine", description: "The exact morning routine for Red/Orange zones.", category: "Authorization Risk Management", type: "Checklist", minutes: 3, updated: "2026-05-17", href: "/auth-risk-center" },

  // Tangos
  { id: "t1", title: "CR — Locating an auth", description: "Find any client's active and expired authorizations in CentralReach.", category: "Tango Walkthroughs", type: "Tango", minutes: 4, updated: "2026-04-08", system: "CentralReach", difficulty: "Quick" },
  { id: "t2", title: "CR — Auth actions", description: "Open, edit, and update authorization records in CR.", category: "Tango Walkthroughs", type: "Tango", minutes: 5, updated: "2026-04-09", system: "CentralReach", difficulty: "Standard" },
  { id: "t3", title: "CR — Treatment plan workflow", description: "Find treatment plans tied to active auths.", category: "Tango Walkthroughs", type: "Tango", minutes: 6, updated: "2026-04-10", system: "CentralReach", difficulty: "Standard" },
  { id: "t4", title: "CR — Contact exports", description: "Pull contact lists for parent outreach.", category: "Tango Walkthroughs", type: "Tango", minutes: 3, updated: "2026-04-11", system: "CentralReach", difficulty: "Quick" },
  { id: "t5", title: "Blossom OS — Auth drawer tour", description: "Every field, every action, every link in the auth drawer.", category: "Tango Walkthroughs", type: "Tango", minutes: 5, updated: "2026-05-13", system: "Blossom OS", difficulty: "Quick" },
  { id: "t6", title: "CR — User management", description: "Add and adjust coordinator access in CentralReach.", category: "Tango Walkthroughs", type: "Tango", minutes: 4, updated: "2026-03-29", system: "CentralReach", difficulty: "Quick" },

  // Systems & tools
  { id: "r50", title: "Systems & Tools Overview", description: "How Blossom OS, CentralReach, and legacy Monday fit together.", category: "Systems & Tools", type: "Guide", minutes: 5, updated: "2026-04-25" },
];

const workflows: { key: WorkflowKey; label: string; icon: typeof WorkflowIcon }[] = [
  { key: "new-auth", label: "New Authorization", icon: FileText },
  { key: "awaiting-submission", label: "Awaiting Submission", icon: Clock },
  { key: "pr-followup", label: "PR Follow-Up", icon: Activity },
  { key: "qa-review", label: "QA Review", icon: ClipboardCheck },
  { key: "expiring-soon", label: "Expiring Soon", icon: AlertTriangle },
  { key: "denial-resolution", label: "Denial Resolution", icon: ShieldCheck },
  { key: "missing-docs", label: "Missing Documentation", icon: AlertTriangle },
  { key: "reassessment", label: "Reassessment", icon: WorkflowIcon },
  { key: "continuation", label: "Continuation", icon: Target },
  { key: "parent-signature", label: "Parent Signature", icon: Users },
];

const categoryMeta: Record<Category, { icon: typeof FileText; blurb: string }> = {
  "SOPs & Core Workflows": { icon: FileText, blurb: "Lifecycle, statuses, daily workflow." },
  "PR & Supervision Tracking": { icon: Activity, blurb: "9-week and 6-week escalation ladders." },
  "QA & Reassessment": { icon: ClipboardCheck, blurb: "QA Review handoffs and reassessment timing." },
  "Parent Training 97156": { icon: Users, blurb: "Continuation readiness and utilization." },
  "Missing Documentation": { icon: AlertTriangle, blurb: "Incomplete Documents rule and re-entry." },
  "Payer & Insurance Guidance": { icon: ShieldCheck, blurb: "Per-payer cadence and denial patterns." },
  "Authorization Risk Management": { icon: Target, blurb: "Risk Center, zones, and prioritization." },
  "Communication Templates": { icon: MessageSquare, blurb: "Calm, specific outreach drafts." },
  "Tango Walkthroughs": { icon: PlayCircle, blurb: "System walkthroughs for CR and Blossom OS." },
  "Systems & Tools": { icon: Wrench, blurb: "How the systems fit together." },
};

const typeIcon: Record<ResourceType, typeof FileText> = {
  SOP: FileText, Workflow: WorkflowIcon, Guide: BookOpen, Template: MessageSquare,
  Tango: PlayCircle, Video: PlayCircle, Checklist: ListChecks, FAQ: BookOpen,
};

const aiPrompts = [
  { q: "Show me the PR escalation process", a: "Georgia: Rivky begins outreach at 9 weeks, Shira/Rachel engage at 6 weeks. Multi-state: Rikki outreach at 9 weeks with Julianne CC'd, SD escalation at 6 weeks. SD exits after PR is received unless parent signature support is needed." },
  { q: "What happens during QA Review?", a: "A treatment auth sits In QA Review until the assigned reviewer confirms the plan is complete, signed where required, and payer-ready. It then moves to Awaiting Submission and ownership returns to the coordinator." },
  { q: "How do missing documents workflows work?", a: "Map each gap to its owner (insurance → intake, diagnosis → intake/parent, consent → BCBA, PR → BCBA, signatures → parent). If two or more are unrecoverable short-term, apply Incomplete Documents — the auth is deleted and the client returns to Can't Submit Auth." },
  { q: "Explain reassessment timing", a: "Open the reassessment with enough runway for QA review and payer submission before expiration. Aim for QA-cleared at least 14 days before the auth expires." },
  { q: "What should I do if a PR is overdue?", a: "At 9 weeks, confirm active outreach by Rivky (GA) or Rikki+Julianne (other states). At 6 weeks, engage SD. Document one concrete next action before end of day." },
  { q: "Show Parent Training 97156 guidance", a: "Track utilization, parent participation, and continuation risk. Surface clients under 60% utilization or with 3+ missed sessions in 14 days to SD." },
];

export default function OSAuthorizationResources() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowKey | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set(["r1", "r2", "r7"]));
  const [recent] = useState<string[]>(["r7", "r2", "r4", "t5", "r11"]);
  const [activePrompt, setActivePrompt] = useState<number | null>(null);

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (activeCategory && r.category !== activeCategory) return false;
      if (activeWorkflow && !(r.workflows ?? []).includes(activeWorkflow)) return false;
      if (!q) return true;
      return [r.title, r.description, r.category, r.type, r.system ?? ""]
        .join(" ").toLowerCase().includes(q);
    });
  }, [query, activeCategory, activeWorkflow]);

  const featured = useMemo(() => resources.filter((r) => r.featured), []);
  const tangos = useMemo(() => resources.filter((r) => r.type === "Tango"), []);
  const recentResources = useMemo(
    () => recent.map((id) => resources.find((r) => r.id === id)).filter(Boolean) as Resource[],
    [recent],
  );

  const isFiltering = query.trim().length > 0 || activeCategory !== null || activeWorkflow !== null;

  return (
    <OSShell rightRail={<ResourceRail saved={saved.size} recent={recent.length} onClearFilters={() => { setActiveCategory(null); setActiveWorkflow(null); setQuery(""); }} />}>
      <div className="space-y-8 pb-12 animate-fade-in">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Library className="h-3 w-3" />
              Resource Library · Authorization
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Authorization Resources</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Operational SOPs, workflows, payer guidance, escalation references, and training resources for authorization operations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full">
              <Clock className="mr-1.5 h-3.5 w-3.5" /> Recently viewed
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              <Bookmark className="mr-1.5 h-3.5 w-3.5" /> Saved ({saved.size})
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/ask-blossom"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Ask Blossom AI</Link>
            </Button>
          </div>
        </header>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search SOPs, workflows, payers, escalations, PR, QA, denials, reassessments…"
            className="h-12 rounded-2xl border-border/70 bg-card pl-11 text-[15px] shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
          />
          {isFiltering && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {activeCategory && (
                <Chip onClear={() => setActiveCategory(null)}>{activeCategory}</Chip>
              )}
              {activeWorkflow && (
                <Chip onClear={() => setActiveWorkflow(null)}>
                  {workflows.find((w) => w.key === activeWorkflow)?.label}
                </Chip>
              )}
              {query && (
                <Chip onClear={() => setQuery("")}>"{query}"</Chip>
              )}
              <span className="text-xs text-muted-foreground tabular-nums">
                {filtered.length} resource{filtered.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>

        {isFiltering ? (
          <FilteredView resources={filtered} saved={saved} onToggleSave={toggleSave} />
        ) : (
          <>
            {/* 1 — Featured */}
            <Section title="Featured operational resources" subtitle="Highest-priority references for daily authorization work.">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((r) => (
                  <FeaturedCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => toggleSave(r.id)} />
                ))}
              </div>
            </Section>

            {/* 2 — Categories */}
            <Section title="Resource categories" subtitle="Curated for authorization operations.">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {(Object.keys(categoryMeta) as Category[]).map((c) => {
                  const meta = categoryMeta[c];
                  const items = resources.filter((r) => r.category === c);
                  const recent = items.sort((a, b) => b.updated.localeCompare(a.updated))[0];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={c}
                      onClick={() => setActiveCategory(c)}
                      className="group flex flex-col rounded-2xl border border-border/60 bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_8px_24px_-12px_oklch(0.2_0.02_260/0.12)]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted/60 text-muted-foreground group-hover:text-foreground transition-colors">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[11px] tabular-nums text-muted-foreground">{items.length}</span>
                      </div>
                      <p className="mt-3 text-sm font-medium text-foreground">{c}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{meta.blurb}</p>
                      {recent && (
                        <p className="mt-3 text-[11px] text-muted-foreground/80">Updated {formatDate(recent.updated)}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* 3 — Recently used */}
            {recentResources.length > 0 && (
              <Section title="Recently used" subtitle="Pick up where you left off.">
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-card divide-y divide-border/50">
                  {recentResources.map((r) => (
                    <ResourceRow key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => toggleSave(r.id)} />
                  ))}
                </div>
              </Section>
            )}

            {/* 4 — Workflow-based */}
            <Section title="Find by workflow" subtitle="Resources grouped by the operational moment they support.">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {workflows.map((w) => {
                  const count = resources.filter((r) => (r.workflows ?? []).includes(w.key)).length;
                  const Icon = w.icon;
                  return (
                    <button
                      key={w.key}
                      onClick={() => setActiveWorkflow(w.key)}
                      className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                    >
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-muted/60 text-muted-foreground group-hover:text-foreground">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{w.label}</p>
                        <p className="text-[11px] text-muted-foreground">{count} resource{count === 1 ? "" : "s"}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* 5 — Tango walkthroughs */}
            <Section title="Tango walkthroughs" subtitle="Step-by-step system guides for CentralReach and Blossom OS.">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {tangos.map((r) => (
                  <TangoCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => toggleSave(r.id)} />
                ))}
              </div>
            </Section>

            {/* 6 — Ask Blossom AI */}
            <Section title="Ask Blossom AI" subtitle="Need help finding workflows, SOPs, payer guidance, or escalation instructions?">
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <div className="flex flex-wrap gap-2">
                  {aiPrompts.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePrompt(i === activePrompt ? null : i)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs transition-colors",
                        activePrompt === i
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border/60 bg-muted/50 text-foreground hover:bg-muted",
                      )}
                    >
                      <MessageSquare className="mr-1 inline h-3 w-3" /> {p.q}
                    </button>
                  ))}
                </div>
                {activePrompt !== null && (
                  <div className="mt-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Operational answer · role-aware</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground">{aiPrompts[activePrompt].a}</p>
                  </div>
                )}
                <p className="mt-4 text-[11px] text-muted-foreground">HIPAA-aware · scoped to authorization resources you have access to.</p>
              </div>
            </Section>
          </>
        )}
      </div>
    </OSShell>
  );
}

// ---------- filtered view ----------

function FilteredView({ resources: rs, saved, onToggleSave }: { resources: Resource[]; saved: Set<string>; onToggleSave: (id: string) => void }) {
  if (rs.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-16 text-center">
        <p className="text-sm text-muted-foreground">No resources found.</p>
        <p className="mt-1 text-xs text-muted-foreground/70">Try clearing filters or searching different keywords.</p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card divide-y divide-border/50">
      {rs.map((r) => (
        <ResourceRow key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => onToggleSave(r.id)} />
      ))}
    </div>
  );
}

// ---------- atoms ----------

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <button onClick={onClear} className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/60 px-2.5 py-1 text-[11px] text-foreground hover:bg-muted">
      {children}
      <span className="text-muted-foreground">×</span>
    </button>
  );
}

function FeaturedCard({ r, saved, onToggleSave }: { r: Resource; saved: boolean; onToggleSave: () => void }) {
  const Icon = typeIcon[r.type];
  const inner = (
    <div className="group relative h-full rounded-2xl border border-border/70 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_8px_24px_-12px_oklch(0.2_0.02_260/0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
            className={cn("grid h-7 w-7 place-items-center rounded-full border transition-colors",
              saved ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 bg-card text-muted-foreground hover:text-foreground")}
            title={saved ? "Saved" : "Save"}
          >
            <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
          </button>
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">{r.title}</p>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.description}</p>
      <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
        <Badge variant="secondary" className="rounded-full text-[10px]">{r.type}</Badge>
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.minutes} min</span>
        <span>·</span>
        <span>Updated {formatDate(r.updated)}</span>
      </div>
      <div className="mt-4 flex items-center gap-1.5 border-t border-border/50 pt-3 text-[11px]">
        <QuickAction icon={ArrowRight} label="Open" />
        <QuickAction icon={Share2} label="Share" />
        <QuickAction icon={Sparkles} label="Ask AI" />
      </div>
    </div>
  );
  return r.href ? <Link to={r.href} className="block h-full">{inner}</Link> : inner;
}

function ResourceRow({ r, saved, onToggleSave }: { r: Resource; saved: boolean; onToggleSave: () => void }) {
  const Icon = typeIcon[r.type];
  const inner = (
    <div className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border/60 bg-muted/60 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{r.title}</p>
          <Badge variant="secondary" className="rounded-full text-[10px]">{r.type}</Badge>
          <span className="text-[11px] text-muted-foreground">{r.category}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{r.description}</p>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground/80">
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.minutes} min</span>
          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(r.updated)}</span>
        </div>
      </div>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
        className={cn("grid h-7 w-7 place-items-center rounded-full border transition-colors",
          saved ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 bg-card text-muted-foreground hover:text-foreground")}
      >
        <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
      </button>
      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
    </div>
  );
  return r.href ? <Link to={r.href} className="block">{inner}</Link> : <div>{inner}</div>;
}

function TangoCard({ r, saved, onToggleSave }: { r: Resource; saved: boolean; onToggleSave: () => void }) {
  return (
    <div className="group rounded-2xl border border-border/70 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_8px_24px_-12px_oklch(0.2_0.02_260/0.12)]">
      <div className="flex items-start justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted/60 text-muted-foreground group-hover:text-foreground">
          <PlayCircle className="h-4 w-4" />
        </div>
        <button
          onClick={onToggleSave}
          className={cn("grid h-7 w-7 place-items-center rounded-full border transition-colors",
            saved ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 bg-card text-muted-foreground hover:text-foreground")}
        >
          <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
        </button>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{r.title}</p>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        {r.system && <Badge variant="outline" className="rounded-full text-[10px]">{r.system}</Badge>}
        {r.difficulty && <Badge variant="secondary" className="rounded-full text-[10px]">{r.difficulty}</Badge>}
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.minutes} min</span>
        <span>· Updated {formatDate(r.updated)}</span>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label }: { icon: typeof ArrowRight; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

function ResourceRail({ saved, recent, onClearFilters }: { saved: number; recent: number; onClearFilters: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Your library</p>
        <div className="mt-3 space-y-2">
          <RailStat icon={Bookmark} label="Saved resources" value={saved} />
          <RailStat icon={Clock} label="Recently viewed" value={recent} />
          <RailStat icon={Star} label="Pinned" value={0} />
        </div>
        <button onClick={onClearFilters} className="mt-4 w-full rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-foreground transition-colors hover:bg-muted">
          Reset filters
        </button>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Operational tip</p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-foreground">
          Search by workflow first ("PR follow-up", "missing docs"), not by document name. The library is organized around how you work.
        </p>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Jump to</p>
        <div className="mt-2 space-y-1">
          <RailLink to="/authorizations" label="Authorization workspace" icon={ShieldCheck} />
          <RailLink to="/auth-risk-center" label="Auth Risk Center" icon={Target} />
          <RailLink to="/parent-training-97156" label="Parent Training 97156" icon={Users} />
          <RailLink to="/training/journeys/authorization-coordinator" label="Coordinator training" icon={BookOpen} />
        </div>
      </div>
    </div>
  );
}

function RailStat({ icon: Icon, label, value }: { icon: typeof Bookmark; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="inline-flex items-center gap-2 text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</span>
      <span className="tabular-nums font-medium text-foreground">{value}</span>
    </div>
  );
}

function RailLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof ShieldCheck }) {
  return (
    <Link to={to} className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-muted/60">
      <span className="inline-flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-muted-foreground" /> {label}</span>
      <ExternalLink className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}