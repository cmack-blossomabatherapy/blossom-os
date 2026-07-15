import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Bookmark, Clock, ArrowRight, FileText, PlayCircle, ListChecks,
  ShieldCheck, Activity, ClipboardCheck, AlertTriangle, Users, MessageSquare,
  Share2, ChevronRight, BookOpen, Library, Star, Calendar, MapPin, TrendingUp,
  Compass, Briefcase, GraduationCap, Building2, LifeBuoy,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// =============================================================================
// Assistant State Director Resource Library — Current-State
// Aligned to "FINAL - Assistant State Director Resource Library Upload - 2026-07-14".
// Files live in the private `state-director-assistant-resources` storage bucket;
// open actions resolve via signed URLs. ASD is state execution support — helps
// keep work moving today; does not permanently own Intake/Recruiting/QA/etc.
// =============================================================================

const BUCKET = "state-director-assistant-resources";
const TODAY = "2026-07-14";

type ResourceType =
  | "SOP" | "Training Resource" | "Video" | "Report/Export"
  | "Role Packet" | "Signoff" | "Handoff Reference"
  | "Current Operations" | "Needs Review" | "Offer Letter";

type ResourceFormat = "PDF" | "CSV" | "XLSX" | "DOCX" | "Video" | "Markdown";

type Category =
  | "Assistant State Director Start Here"
  | "ASD SOPs"
  | "Training Academy Resources"
  | "Videos and Walkthroughs"
  | "Daily Queue, Follow-Up, and Documentation"
  | "Intake, Recruiting, and VA Support"
  | "Family, Staff, Case, and State Communication"
  | "State Health and State Director Handoffs"
  | "Department Handoff References"
  | "State-Specific References"
  | "Role Packet, Offer Letter, and Signoff"
  | "Reports, Exports, and Examples"
  | "Needs Review - ASD Adjacent";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: Category;
  type: ResourceType;
  format?: ResourceFormat;
  storagePath?: string;
  minutes: number;
  updated: string;
  owner?: string;
  featured?: boolean;
  tags?: string[];
  needsReview?: boolean;
  planningOnly?: boolean;
  journeyWeek?: 1 | 2 | 3 | 4;
  exampleOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Curated / featured overrides. Every other bucket file is auto-classified so
// nothing goes missing.
// ---------------------------------------------------------------------------

const CURATED: Resource[] = [
  // Start Here
  { id: "start-role", title: "Assistant State Director — Role SOP (L1)",
    description: "Current-state Assistant State Director role SOP — state execution support, daily queue, follow-up, and boundaries.",
    category: "Assistant State Director Start Here", type: "SOP", format: "PDF",
    storagePath: "L1-Assistant-State-Director-Role-SOP.pdf",
    featured: true, minutes: 10, updated: TODAY, journeyWeek: 1,
    tags: ["Assistant State Director", "ASD", "Role SOP", "Current Operations"] },
  { id: "start-sd-role", title: "State Director — Role SOP (L1)",
    description: "State Director role SOP — reference so ASDs understand what they support.",
    category: "Assistant State Director Start Here", type: "SOP", format: "PDF",
    storagePath: "L1-State-Director-Role-SOP.pdf",
    featured: true, minutes: 10, updated: TODAY, journeyWeek: 1,
    tags: ["State Director", "Handoff", "Current Operations"] },
  { id: "start-va-role", title: "State VA — Role SOP (L1)",
    description: "State VA role SOP — reference for ASDs coordinating VA task work.",
    category: "Assistant State Director Start Here", type: "SOP", format: "PDF",
    storagePath: "L1-State-VA-Role-SOP.pdf",
    featured: true, minutes: 8, updated: TODAY, journeyWeek: 1,
    tags: ["State VA", "VA Task Oversight"] },

  // Core ASD SOPs
  { id: "sop-intake-rec-support", title: "L2 ASD — Intake and Recruiting Support",
    description: "SOP for ASD support to Intake and Recruiting in smaller/growing states.",
    category: "ASD SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Assistant-State-Director-Intake-and-Recruiting-Support-SOP.pdf",
    featured: true, minutes: 8, updated: TODAY, journeyWeek: 2,
    tags: ["Intake Support", "Recruiting Support"] },
  { id: "sop-va-oversight", title: "L2 State VA Task Oversight",
    description: "SOP for coordinating and reviewing State VA task work.",
    category: "ASD SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-State-VA-Task-Oversight-SOP.pdf",
    minutes: 6, updated: TODAY, journeyWeek: 3,
    tags: ["State VA", "VA Task Oversight"] },
  { id: "sop-esc-mgmt", title: "L2 State Escalation Management",
    description: "SOP for routing state escalations to the correct owner.",
    category: "ASD SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-State-Escalation-Management-Process-SOP.pdf",
    minutes: 6, updated: TODAY, tags: ["Escalation", "State Director Handoff"] },
  { id: "sop-state-health", title: "L2 State Health Review",
    description: "SOP for weekly state health review the ASD helps prepare.",
    category: "ASD SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-State-Health-Review-SOP.pdf",
    featured: true, minutes: 6, updated: TODAY, journeyWeek: 4,
    tags: ["State Health", "State Director Handoff"] },
  { id: "sop-growth-coord", title: "L2 State Growth Coordination",
    description: "SOP for state growth coordination touchpoints ASDs support.",
    category: "ASD SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-State-Growth-Coordination-SOP.pdf",
    minutes: 6, updated: TODAY, tags: ["State Health"] },
  { id: "sop-escalations", title: "L2 Escalations — Current Operations",
    description: "Escalation SOP referenced across state operations.",
    category: "ASD SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Escalations-Current-Operations.pdf",
    minutes: 6, updated: TODAY, tags: ["Escalation"] },
  { id: "sop-interdept", title: "L2 Interdepartment Communication",
    description: "SOP for clean handoffs between departments.",
    category: "ASD SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Interdepartment-Communication-Current-Operations.pdf",
    minutes: 6, updated: TODAY, tags: ["Department Handoff"] },
  { id: "sop-task-mgmt", title: "L2 Task Management",
    description: "SOP for state-level task management the ASD helps run.",
    category: "ASD SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Task-Management-Current-Operations.pdf",
    featured: true, minutes: 6, updated: TODAY, journeyWeek: 1,
    tags: ["Daily Queue", "Follow-Up"] },
  { id: "sop-daily-ops", title: "L2 Daily Operations",
    description: "Daily operating rhythm SOP for state support roles.",
    category: "ASD SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Daily-Operations-Current-Operations.pdf",
    minutes: 6, updated: TODAY, journeyWeek: 1,
    tags: ["Daily Queue", "Current Operations"] },

  // Signoff
  { id: "signoff-asd", title: "Assistant State Director — Signoff",
    description: "Signoff completed at the end of the ASD onboarding journey.",
    category: "Role Packet, Offer Letter, and Signoff", type: "Signoff", format: "PDF",
    storagePath: "12 - Assistant State Director - Signoff.pdf",
    featured: true, minutes: 3, updated: TODAY, journeyWeek: 4,
    tags: ["Signoff", "Assistant State Director"] },
];

// ---------------------------------------------------------------------------
// Auto-classification for uncurated files
// ---------------------------------------------------------------------------

const STATE_PREFIXES = ["Georgia", "Maryland", "North Carolina", "Tennessee", "Virginia"];

function inferFormat(name: string): ResourceFormat | undefined {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "PDF";
  if (n.endsWith(".csv")) return "CSV";
  if (n.endsWith(".xlsx")) return "XLSX";
  if (n.endsWith(".docx")) return "DOCX";
  if (n.endsWith(".md")) return "Markdown";
  if (n.endsWith(".mp4") || n.endsWith(".mov") || n.endsWith(".webm")) return "Video";
  return undefined;
}

function prettyTitle(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  let t = base
    .replace(/^\d{2,3}\s*[-_.]\s*/, "")
    .replace(/^\d{2}\s+/, "")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  t = t.replace(/\bpdf\b|\bcsv\b|\bxlsx\b|\bdocx\b|\bmp4\b/gi, "").trim();
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

function classify(name: string): { category: Category; type: ResourceType; tags: string[]; needsReview?: boolean; planningOnly?: boolean; exampleOnly?: boolean } {
  const n = name.toLowerCase();
  const fmt = inferFormat(name);
  const tags: string[] = ["Assistant State Director", "ASD", "Current Operations"];

  const state = STATE_PREFIXES.find((s) => name.startsWith(s));
  if (state) {
    tags.push(state);
    return { category: "State-Specific References", type: "Current Operations", tags };
  }

  if (fmt === "Video") {
    return { category: "Videos and Walkthroughs", type: "Video", tags: [...tags, "Video"] };
  }

  if (fmt === "Markdown") {
    return { category: "Needs Review - ASD Adjacent", type: "Needs Review", tags, needsReview: true, planningOnly: true };
  }

  if (fmt === "CSV" || fmt === "XLSX" || n.includes("report") || n.includes("export") || n.includes("audit")) {
    return { category: "Reports, Exports, and Examples", type: "Report/Export", tags: [...tags, "Report"], exampleOnly: true };
  }

  if (n.includes("offer letter")) {
    return { category: "Role Packet, Offer Letter, and Signoff", type: "Offer Letter", tags: [...tags, "Offer Letter"] };
  }

  if (n.includes("signoff") || n.includes("role packet") || n.includes("role deep dive") || n.includes("job description") || n.startsWith("print_me_") || n.includes("packet.pdf")) {
    return { category: "Role Packet, Offer Letter, and Signoff", type: "Role Packet", tags: [...tags, "Role Packet"] };
  }

  // ASD-owned support work
  if (n.includes("intake") || n.includes("recruit") || n.includes("candidate") || n.includes("orientation") || n.includes("interview") || n.includes("hiring") || n.includes("va-task") || n.includes("va task")) {
    return { category: "Intake, Recruiting, and VA Support", type: "Handoff Reference", tags: [...tags, "Intake Support", "Recruiting Support", "State VA"] };
  }

  // Communication (family/staff/case)
  if (n.includes("family") || n.includes("parent") || n.includes("staff-communication") || n.includes("case-support") || n.includes("case support") || n.includes("communication")) {
    return { category: "Family, Staff, Case, and State Communication", type: "Training Resource", tags: [...tags, "Family Communication", "Staff Communication", "Case Support"] };
  }

  // Daily queue / follow-up / documentation
  if (n.includes("daily") || n.includes("queue") || n.includes("follow-up") || n.includes("follow up") || n.includes("documentation") || n.includes("task-management") || n.includes("task management")) {
    return { category: "Daily Queue, Follow-Up, and Documentation", type: "Training Resource", tags: [...tags, "Daily Queue", "Follow-Up"] };
  }

  // State Director handoff / state health
  if (n.includes("state-director") || n.includes("state director") || n.includes("state-health") || n.includes("state health") || n.includes("weekly")) {
    return { category: "State Health and State Director Handoffs", type: "Handoff Reference", tags: [...tags, "State Director Handoff", "State Health"] };
  }

  // Department handoffs (scheduling / staffing / auth / qa / clinical / bcba / rbt / case)
  if (n.includes("schedul") || n.includes("staffing") || n.includes("auth") || n.includes("qa") || n.includes("clinical") || n.includes("bcba") || n.includes("rbt") || n.includes("case-manager") || n.includes("credential") || n.includes("hr-") || n.includes("payroll") || n.includes("finance") || n.includes("rcm")) {
    return { category: "Department Handoff References", type: "Handoff Reference", tags: [...tags, "Department Handoff"] };
  }

  // SOPs (L1/L2)
  if (/^l[12][-_ ]/i.test(name)) {
    return { category: "ASD SOPs", type: "SOP", tags: [...tags, "SOP"] };
  }

  return { category: "Training Academy Resources", type: "Training Resource", tags };
}

const categoryMeta: Record<Category, { icon: typeof FileText; blurb: string }> = {
  "Assistant State Director Start Here": { icon: Star, blurb: "Orientation and the three anchor role SOPs (ASD · SD · VA)." },
  "ASD SOPs": { icon: FileText, blurb: "Current-state Assistant State Director SOPs (PDF only)." },
  "Training Academy Resources": { icon: BookOpen, blurb: "Guides staged into the ASD onboarding journey." },
  "Videos and Walkthroughs": { icon: PlayCircle, blurb: "Current systems and workflow walkthroughs." },
  "Daily Queue, Follow-Up, and Documentation": { icon: ClipboardCheck, blurb: "Daily queue, follow-up, and documentation discipline." },
  "Intake, Recruiting, and VA Support": { icon: Briefcase, blurb: "Support references — Intake / Recruiting / State VA." },
  "Family, Staff, Case, and State Communication": { icon: MessageSquare, blurb: "Family, staff, case, and state-level communication." },
  "State Health and State Director Handoffs": { icon: TrendingUp, blurb: "State health prep and handoffs to the State Director." },
  "Department Handoff References": { icon: Share2, blurb: "Reference material for cross-department handoffs." },
  "State-Specific References": { icon: MapPin, blurb: "GA · MD · NC · TN · VA state-specific references." },
  "Role Packet, Offer Letter, and Signoff": { icon: ListChecks, blurb: "Role packet, offer letters, and onboarding signoff." },
  "Reports, Exports, and Examples": { icon: Activity, blurb: "Example exports and reports — not a live data source." },
  "Needs Review - ASD Adjacent": { icon: AlertTriangle, blurb: "Planning references. Not current SOPs." },
};

const typeIcon: Record<ResourceType, typeof FileText> = {
  SOP: FileText, "Training Resource": BookOpen, "Video": PlayCircle,
  "Report/Export": Activity, "Role Packet": ListChecks, "Signoff": ListChecks,
  "Handoff Reference": Share2, "Current Operations": ShieldCheck,
  "Needs Review": AlertTriangle, "Offer Letter": FileText,
};

async function openResource(r: Resource) {
  if (!r.storagePath) { toast.info("Reference item — see linked SOPs."); return; }
  try {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(r.storagePath, 60 * 10);
    if (error || !data?.signedUrl) { toast.error("Unable to open file. Please try again."); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  } catch { toast.error("Unable to open file. Please try again."); }
}

function formatDate(s: string) {
  try { return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch { return s; }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OSAssistantStateDirectorResources() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set(["start-role", "sop-task-mgmt", "sop-state-health"]));
  const [dynamic, setDynamic] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.storage.from(BUCKET).list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });
        if (error || !data) { setLoading(false); return; }
        const curatedPaths = new Set(CURATED.map((r) => r.storagePath).filter(Boolean));
        const extras: Resource[] = data
          .filter((o) => o.name && !curatedPaths.has(o.name))
          .map((o, idx) => {
            const info = classify(o.name);
            const fmt = inferFormat(o.name);
            // Enforce SOP category = PDF only
            if (info.category === "ASD SOPs" && fmt !== "PDF") {
              info.category = "Training Academy Resources";
              info.type = "Training Resource";
            }
            return {
              id: `auto-${idx}-${o.name.slice(0, 40)}`,
              title: prettyTitle(o.name),
              description: `${info.category} · Uploaded ${TODAY}. Current-state resource — open to view.`,
              category: info.category,
              type: info.type,
              format: fmt,
              storagePath: o.name,
              minutes: fmt === "Video" ? 8 : 6,
              updated: TODAY,
              tags: info.tags,
              needsReview: info.needsReview,
              planningOnly: info.planningOnly,
              exampleOnly: info.exampleOnly,
            } as Resource;
          });
        if (!cancelled) setDynamic(extras);
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const resources = useMemo(() => [...CURATED, ...dynamic], [dynamic]);
  const toggleSave = (id: string) => setSaved((prev) => {
    const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (activeCategory && r.category !== activeCategory) return false;
      if (!q) return true;
      const hay = [r.title, r.description, r.category, r.type, r.owner ?? "", ...(r.tags ?? [])].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [resources, query, activeCategory]);

  const featured = useMemo(() => resources.filter((r) => r.featured), [resources]);
  const isFiltering = query.trim().length > 0 || activeCategory !== null;

  return (
    <OSShell rightRail={<ResourceRail total={resources.length} saved={saved.size} sopCount={resources.filter((r) => r.category === "ASD SOPs").length} onClearFilters={() => { setActiveCategory(null); setQuery(""); }} />}>
      <div className="space-y-8 pb-12 animate-fade-in">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Library className="h-3 w-3" /> Resource Library · State Leadership · Assistant State Director · Current-State
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Assistant State Director Resources</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Current-state resources for Assistant State Directors and State Operations Assistants — daily queue and follow-up, Intake / Recruiting / VA support, family and staff communication, state health prep and State Director handoffs, cross-department reference, and state-specific references. Current tools (CentralReach, Monday, Outlook/Teams, phone systems) remain today's operating process.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full">
              <Bookmark className="mr-1.5 h-3.5 w-3.5" /> Saved ({saved.size})
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/training"><GraduationCap className="mr-1.5 h-3.5 w-3.5" /> ASD Training Academy</Link>
            </Button>
          </div>
        </header>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ASD, daily queue, intake support, recruiting support, State VA, state health, State Director handoff…"
            className="h-12 rounded-2xl border-border/70 bg-card pl-11 text-[15px] shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
          />
          {isFiltering && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {activeCategory && <Chip onClear={() => setActiveCategory(null)}>{activeCategory}</Chip>}
              {query && <Chip onClear={() => setQuery("")}>"{query}"</Chip>}
              <span className="text-xs text-muted-foreground tabular-nums">
                {filtered.length} resource{filtered.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>

        {loading && !dynamic.length && (
          <p className="text-xs text-muted-foreground">Loading resources from bucket…</p>
        )}

        {isFiltering ? (
          <FilteredView resources={filtered} saved={saved} onToggleSave={toggleSave} />
        ) : (
          <>
            <Section title="Featured ASD resources" subtitle="Highest-priority references for the Assistant State Director seat.">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((r) => (
                  <FeaturedCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => toggleSave(r.id)} />
                ))}
              </div>
            </Section>

            <Section title="Resource categories" subtitle="Organized to mirror the current ASD operating model.">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(Object.keys(categoryMeta) as Category[]).map((c) => {
                  const meta = categoryMeta[c];
                  const all = resources.filter((r) => r.category === c);
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
                        <span className="text-[11px] tabular-nums text-muted-foreground">{all.length}</span>
                      </div>
                      <p className="mt-3 text-sm font-medium text-foreground">{c}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{meta.blurb}</p>
                    </button>
                  );
                })}
              </div>
            </Section>

            <JourneyRoadmap resources={resources} />
          </>
        )}
      </div>
    </OSShell>
  );
}

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
  return (
    <button
      onClick={() => void openResource(r)}
      className="group relative h-full rounded-2xl border border-border/70 bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_8px_24px_-12px_oklch(0.2_0.02_260/0.12)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <span
          role="button" tabIndex={0}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onToggleSave(); } }}
          className={cn("grid h-7 w-7 place-items-center rounded-full border transition-colors",
            saved ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 bg-card text-muted-foreground hover:text-foreground")}
        >
          <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">{r.title}</p>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <Badge variant="secondary" className="rounded-full text-[10px]">{r.type}</Badge>
        {r.format && <Badge variant="outline" className="rounded-full text-[10px]">{r.format}</Badge>}
        {r.needsReview && <Badge className="rounded-full bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 text-[10px]">Needs Review</Badge>}
        {r.planningOnly && <Badge variant="outline" className="rounded-full border-amber-500/40 text-amber-700 text-[10px]">Planning · Not Current SOP</Badge>}
        {r.exampleOnly && <Badge variant="outline" className="rounded-full border-sky-500/40 text-sky-700 text-[10px]">Example · Not Live Data</Badge>}
        {r.journeyWeek && <Badge variant="outline" className="rounded-full text-[10px]">Journey · Week {r.journeyWeek}</Badge>}
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.minutes} min</span>
      </div>
      <div className="mt-4 flex items-center gap-1.5 border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><ArrowRight className="h-3 w-3" /> Open</span>
      </div>
    </button>
  );
}

function ResourceRow({ r, saved, onToggleSave }: { r: Resource; saved: boolean; onToggleSave: () => void }) {
  const Icon = typeIcon[r.type];
  return (
    <button onClick={() => void openResource(r)} className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border/60 bg-muted/60 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{r.title}</p>
          <Badge variant="secondary" className="rounded-full text-[10px]">{r.type}</Badge>
          {r.format && <Badge variant="outline" className="rounded-full text-[10px]">{r.format}</Badge>}
          {r.needsReview && <Badge className="rounded-full bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 text-[10px]">Needs Review</Badge>}
          {r.planningOnly && <Badge variant="outline" className="rounded-full border-amber-500/40 text-amber-700 text-[10px]">Not Current SOP</Badge>}
          {r.exampleOnly && <Badge variant="outline" className="rounded-full border-sky-500/40 text-sky-700 text-[10px]">Example</Badge>}
          {r.journeyWeek && <Badge variant="outline" className="rounded-full text-[10px]">Week {r.journeyWeek}</Badge>}
          <span className="text-[11px] text-muted-foreground">{r.category}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{r.description}</p>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground/80">
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.minutes} min</span>
          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(r.updated)}</span>
        </div>
      </div>
      <span
        role="button" tabIndex={0}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onToggleSave(); } }}
        className={cn("grid h-7 w-7 place-items-center rounded-full border transition-colors",
          saved ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 bg-card text-muted-foreground hover:text-foreground")}
      >
        <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
      </span>
      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function JourneyRoadmap({ resources }: { resources: Resource[] }) {
  const weeks: { n: 1 | 2 | 3 | 4; title: string; blurb: string }[] = [
    { n: 1, title: "Role, Boundaries, Systems, Daily Discipline", blurb: "ASD seat, State Director + VA anchors, current systems, daily follow-up." },
    { n: 2, title: "Intake & Recruiting Support (Current Reality)", blurb: "Current support work for Intake and Recruiting in smaller/growing states." },
    { n: 3, title: "VA Oversight, Communication, Escalations", blurb: "VA task oversight, family/staff/case communication, escalation routing." },
    { n: 4, title: "State Director Handoffs, State Reports, Signoff", blurb: "State Director handoffs, example reports, state references, and signoff." },
  ];
  return (
    <Section title="Assistant State Director 4-Week Journey — Attached Resources" subtitle="Attached / staged without changing the existing live ASD journey.">
      <div className="grid gap-3 md:grid-cols-2">
        {weeks.map((w) => {
          const attached = resources.filter((r) => r.journeyWeek === w.n);
          return (
            <div key={w.n} className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Week {w.n} · {w.title}</p>
                <Badge variant="outline" className="rounded-full text-[10px]">{attached.length} attached</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{w.blurb}</p>
              <div className="mt-3 space-y-1.5">
                {attached.map((r) => (
                  <button key={r.id} onClick={() => void openResource(r)} className="flex w-full items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1.5 text-left text-[12px] text-foreground hover:bg-muted/60">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{r.title}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </button>
                ))}
                {attached.length === 0 && (
                  <p className="text-[11px] text-muted-foreground">Staged in the category catalog — attach in the Academy without altering the live journey.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function ResourceRail({ total, saved, sopCount, onClearFilters }: { total: number; saved: number; sopCount: number; onClearFilters: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Your library</p>
        <div className="mt-3 space-y-2">
          <RailStat icon={Bookmark} label="Saved resources" value={saved} />
          <RailStat icon={FileText} label="Resources total" value={total} />
          <RailStat icon={ShieldCheck} label="SOP PDFs" value={sopCount} />
        </div>
        <button onClick={onClearFilters} className="mt-4 w-full rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-foreground transition-colors hover:bg-muted">
          Reset filters
        </button>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Boundaries</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Assistant State Directors are state execution support. In smaller/growing states, ASDs may help move Intake, Recruiting, family follow-up, and VA task work. They do not permanently own QA, Auth, Finance/RCM, HR/Payroll, Credentialing, or clinical decisions — those live with their functions.
        </p>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">System of record</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Blossom OS organizes access, training, and visibility. CentralReach, Monday, Outlook/Teams, and current phone systems remain today's operating tools.
        </p>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Related</p>
        <div className="mt-2 space-y-1.5 text-xs">
          <RailLink to="/training" icon={GraduationCap}>ASD Training Academy</RailLink>
          <RailLink to="/state-director/resources" icon={Compass}>State Director Resources</RailLink>
          <RailLink to="/state-operations" icon={MapPin}>State Dashboard</RailLink>
          <RailLink to="/ops/tasks" icon={ClipboardCheck}>Assistant / VA Tasks</RailLink>
          <RailLink to="/ops/state-escalations" icon={AlertTriangle}>State Escalations</RailLink>
          <RailLink to="/intake/parent-communication" icon={LifeBuoy}>Family / Parent Communication</RailLink>
          <RailLink to="/resource-library" icon={Building2}>All Resource Libraries</RailLink>
          <RailLink to="/organizational-chart" icon={Users}>Org Chart</RailLink>
          <RailLink to="/home" icon={Star}>Home</RailLink>
          <RailLink to="/ai/assistant" icon={MessageSquare}>Ask Blossom</RailLink>
        </div>
      </div>
    </div>
  );
}

function RailStat({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-3 py-2">
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function RailLink({ to, icon: Icon, children }: { to: string; icon: typeof FileText; children: React.ReactNode }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1.5 text-foreground transition-colors hover:bg-muted/60">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="flex-1 truncate">{children}</span>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
    </Link>
  );
}