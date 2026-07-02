import { useMemo, useState } from "react";
import {
  Search, Bookmark, FileText, Workflow as WorkflowIcon, ListChecks, ShieldCheck,
  ClipboardCheck, MessageSquare, Wrench, ChevronRight, BookOpen, Library, Loader2,
  Layers, ExternalLink, Folder, GraduationCap, Heart, BadgeCheck,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLibraryResources } from "@/hooks/useLibraryResources";
import type { Resource, ResourceType } from "@/lib/resources/resourceData";

/**
 * HR Team Resource Library — data-driven page.
 *
 * All content is pulled from the shared `hr_resources` table via
 * `useLibraryResources`. There is NO hardcoded resources array and no
 * placeholder skeleton entries. Monday.com is only shown as a "Legacy
 * reference" chip if a resource explicitly mentions it in its metadata.
 */

type WorkflowKey =
  | "onboarding" | "orientation" | "training" | "support" | "certifications"
  | "evaluations" | "readiness" | "systems" | "communication";

const WORKFLOWS: { key: WorkflowKey; label: string; icon: typeof WorkflowIcon }[] = [
  { key: "onboarding", label: "Onboarding", icon: ShieldCheck },
  { key: "orientation", label: "Orientation", icon: GraduationCap },
  { key: "training", label: "Training", icon: BookOpen },
  { key: "support", label: "Employee support", icon: Heart },
  { key: "certifications", label: "Certifications", icon: BadgeCheck },
  { key: "evaluations", label: "Evaluations", icon: ClipboardCheck },
  { key: "readiness", label: "Readiness", icon: Layers },
  { key: "systems", label: "Systems", icon: Wrench },
  { key: "communication", label: "Communication", icon: MessageSquare },
];

function bagFor(r: Resource) {
  return [r.title, r.description, r.category, ...(r.tags ?? [])].join(" ").toLowerCase();
}

function deriveWorkflows(r: Resource): WorkflowKey[] {
  const b = bagFor(r);
  const out = new Set<WorkflowKey>();
  if (b.includes("onboard")) out.add("onboarding");
  if (b.includes("orient")) out.add("orientation");
  if (b.includes("train")) out.add("training");
  if (b.includes("support") || b.includes("escalat")) out.add("support");
  if (b.includes("cert") || b.includes("compliance")) out.add("certifications");
  if (b.includes("evaluat") || b.includes("coaching") || b.includes("growth")) out.add("evaluations");
  if (b.includes("ready") || b.includes("staffing")) out.add("readiness");
  if (b.includes("viventium") || b.includes("centralreach") || b.includes("stellar") || b.includes("system")) out.add("systems");
  if (b.includes("communic") || b.includes("template") || b.includes("message")) out.add("communication");
  return Array.from(out);
}

function isLegacyMonday(r: Resource) {
  return bagFor(r).includes("monday");
}

const TYPE_ICON: Partial<Record<ResourceType, typeof FileText>> = {
  SOP: FileText, Workflow: WorkflowIcon, Checklist: ListChecks, Template: MessageSquare,
  Video: BookOpen, Link: ExternalLink, PDF: FileText, DOCX: FileText, XLSX: FileText,
  CSV: FileText, Form: ClipboardCheck, Tango: WorkflowIcon, Image: FileText,
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch { return iso; }
}

export default function OSHRResources() {
  const { resources, loading } = useLibraryResources();
  const [query, setQuery] = useState("");
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowKey | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const toggleSave = (id: string) =>
    setSaved((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Restrict the HR page to HR-visible resources. If a resource declares
  // roles, require an HR role; otherwise fall back to category === "hr" or
  // hr-relevant tags.
  const hrResources = useMemo(() => {
    return resources.filter((r) => {
      const roles = r.roles ?? [];
      const hasHrRole = roles.some((role) => String(role).toLowerCase().includes("hr"));
      if (roles.length > 0 && hasHrRole) return true;
      if (r.category === "hr") return true;
      const b = bagFor(r);
      return b.includes("hr ") || b.includes("onboard") || b.includes("orient") ||
        b.includes("viventium") || b.includes("stellar") || b.includes("centralreach") ||
        b.includes("compliance") || b.includes("evaluat") || b.includes("employee");
    });
  }, [resources]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hrResources.filter((r) => {
      if (activeWorkflow && !deriveWorkflows(r).includes(activeWorkflow)) return false;
      if (!q) return true;
      return bagFor(r).includes(q) || r.type.toLowerCase().includes(q);
    });
  }, [hrResources, query, activeWorkflow]);

  const pinned = useMemo(() => hrResources.filter((r) => r.pinned).slice(0, 6), [hrResources]);
  const recent = useMemo(() => hrResources.slice().sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")).slice(0, 6), [hrResources]);
  const isFiltering = query.trim().length > 0 || activeWorkflow !== null;
  const clearAll = () => { setQuery(""); setActiveWorkflow(null); };

  return (
    <OSShell rightRail={<ResourceRail saved={saved.size} total={hrResources.length} onClear={clearAll} />}>
      <div className="space-y-8 pb-12 animate-fade-in">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Library className="h-3 w-3" /> Resource Library · HR Team
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Resource Library</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Operational SOPs, onboarding workflows, employee support and compliance references — pulled live from the shared HR resource library.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <a href="/resource-library"><Folder className="mr-1.5 h-3.5 w-3.5" /> Manage in Resource Library</a>
            </Button>
          </div>
        </header>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search HR SOPs, onboarding, orientation, Viventium, Stellar, CentralReach…"
            className="h-12 rounded-2xl border-border/70 bg-card pl-11 text-[15px] shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {WORKFLOWS.map((w) => (
              <button
                key={w.key}
                onClick={() => setActiveWorkflow(activeWorkflow === w.key ? null : w.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition-colors",
                  activeWorkflow === w.key
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/60 bg-muted/50 text-foreground hover:bg-muted",
                )}
              >
                <w.icon className="h-3 w-3" /> {w.label}
              </button>
            ))}
            {isFiltering && (
              <button onClick={clearAll} className="ml-1 text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
                Clear filters
              </button>
            )}
            <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
              {filtered.length} resource{filtered.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border/70 bg-card p-16 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Loading HR resources…</p>
          </div>
        ) : hrResources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card p-14 text-center">
            <Library className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">No HR resources published yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Publish HR SOPs and playbooks from the shared Resource Library to see them here.</p>
            <Button asChild size="sm" className="mt-4 rounded-full">
              <a href="/resource-library">Open Resource Library</a>
            </Button>
          </div>
        ) : isFiltering ? (
          <FilteredView resources={filtered} saved={saved} onToggleSave={toggleSave} />
        ) : (
          <>
            {pinned.length > 0 && (
              <Section title="Pinned HR resources" subtitle="Curated by HR admins.">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {pinned.map((r) => (
                    <ResourceCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => toggleSave(r.id)} />
                  ))}
                </div>
              </Section>
            )}
            <Section title="Recently updated" subtitle="Freshest HR SOPs and playbooks.">
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-card divide-y divide-border/50">
                {recent.map((r) => (
                  <ResourceRow key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => toggleSave(r.id)} />
                ))}
              </div>
            </Section>
            <Section title="Browse by workflow" subtitle="Resources grouped by the HR moment they support.">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {WORKFLOWS.map((w) => {
                  const count = hrResources.filter((r) => deriveWorkflows(r).includes(w.key)).length;
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
          </>
        )}
      </div>
    </OSShell>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function FilteredView({ resources: rs, saved, onToggleSave }: { resources: Resource[]; saved: Set<string>; onToggleSave: (id: string) => void }) {
  if (rs.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-14 text-center">
        <p className="text-sm text-muted-foreground">No HR resources matched your search.</p>
      </div>
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {rs.map((r) => (
        <ResourceCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => onToggleSave(r.id)} />
      ))}
    </div>
  );
}

function ResourceCard({ r, saved, onToggleSave }: { r: Resource; saved: boolean; onToggleSave: () => void }) {
  const Icon = TYPE_ICON[r.type] ?? FileText;
  const legacyMonday = isLegacyMonday(r);
  return (
    <div className="group flex flex-col rounded-2xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_8px_24px_-12px_oklch(0.2_0.02_260/0.12)]">
      <div className="flex items-start justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted/60 text-muted-foreground group-hover:text-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <button
          onClick={onToggleSave}
          aria-label={saved ? "Unsave resource" : "Save resource"}
          className={cn("rounded-full p-1.5 text-muted-foreground hover:text-foreground", saved && "text-primary")}
        >
          <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
        </button>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground line-clamp-2">{r.title}</p>
      {r.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.description}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10.5px] text-muted-foreground">
        <span className="rounded-full border border-border/60 bg-muted/50 px-1.5 py-0.5">{r.type}</span>
        {r.pinned && <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-primary">Pinned</span>}
        {legacyMonday && <span className="rounded-full border border-amber-300/50 bg-amber-500/10 px-1.5 py-0.5 text-amber-700 dark:text-amber-400">Legacy reference</span>}
        <span className="ml-auto">Updated {formatDate(r.updatedAt)}</span>
      </div>
      {r.url && (
        <a
          href={r.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
        >
          Open <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

function ResourceRow({ r, saved, onToggleSave }: { r: Resource; saved: boolean; onToggleSave: () => void }) {
  const Icon = TYPE_ICON[r.type] ?? FileText;
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted/60 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{r.type} · Updated {formatDate(r.updatedAt)}</p>
      </div>
      <button
        onClick={onToggleSave}
        aria-label={saved ? "Unsave resource" : "Save resource"}
        className={cn("rounded-full p-1.5 text-muted-foreground hover:text-foreground", saved && "text-primary")}
      >
        <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
      </button>
    </div>
  );
}

function ResourceRail({ saved, total, onClear }: { saved: number; total: number; onClear: () => void }) {
  return (
    <div className="space-y-3 p-4">
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">HR library</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{total}</p>
        <p className="text-[11px] text-muted-foreground">Live HR resources</p>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Saved</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{saved}</p>
        <p className="text-[11px] text-muted-foreground">Bookmarked this session</p>
      </div>
      <Button variant="outline" size="sm" className="w-full rounded-full" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}