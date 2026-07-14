import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { OSShell } from "./OSShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Search, Plus, Upload, BookOpen, Star, ArrowRight, Pin, Download,
  X, Settings2, ExternalLink, GraduationCap, Filter, FileText, Workflow,
  FileType2, MessageSquare, Cpu, PlayCircle, Link2, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOSRole } from "@/contexts/OSRoleContext";
import { BlossomAIButton } from "@/components/ai/BlossomAIAssistant";
import {
  resourceCategories, categoryById, resourcesByCategory,
  isVisibleToRole, pinnedFor, recentFor, searchResources,
  formatRelative, TYPE_ICON, TYPE_TONE, roleLabel,
  type Resource, type ResourceCategoryId,
} from "@/lib/resources/resourceData";
import { useLibraryResources } from "@/hooks/useLibraryResources";
import { useSystemIssues } from "@/hooks/useSystemTools";
import { useAuth } from "@/contexts/AuthContext";
import { resolveResourceOpenUrl } from "@/lib/resources/resourceStorage";
import { isSdSopVisibleToRole } from "@/lib/resources/stateDirectorSopManifest";
import { cleanResourceTitle } from "@/lib/resources/resourceDisplay";
import { LibraryTabs } from "@/components/resource-library/LibraryTabs";
import { ChevronDown } from "lucide-react";
import {
  collectSmartCollections,
  countAdminHiddenResources,
  type SmartCollectionId,
  type SmartCollectionResult,
} from "@/lib/resources/smartCollections";
import {
  INTAKE_SECTIONS, groupByIntakeSection, isIntakeRelevant,
} from "@/lib/resources/intakeSections";

const TONE_BG: Record<string, string> = {
  purple:  "bg-[hsl(265_70%_96%)] text-[hsl(265_70%_45%)]",
  blue:    "bg-[hsl(215_85%_96%)] text-[hsl(215_85%_45%)]",
  teal:    "bg-[hsl(180_60%_94%)] text-[hsl(180_60%_35%)]",
  amber:   "bg-[hsl(40_90%_94%)]  text-[hsl(30_70%_42%)]",
  rose:    "bg-[hsl(345_80%_96%)] text-[hsl(345_70%_48%)]",
  emerald: "bg-[hsl(150_55%_94%)] text-[hsl(150_55%_32%)]",
  slate:   "bg-slate-100 text-slate-700",
  indigo:  "bg-[hsl(235_70%_96%)] text-[hsl(235_70%_50%)]",
};

/**
 * System tags that should never reach learners: scaffolding from the
 * upload pipeline (week_1, day_1, status:*, raw roles, etc).
 */
const SYSTEM_TAG_RE = /^(week_?\d+|day_?\d+|state_director|rbt|bcba|hr|admin|published|pending|held|vault.*|excluded|upload.*|status:.*|w\d+d\d+)$/i;
function learnerTags(tags: string[]): string[] {
  return (tags ?? []).filter((t) => !SYSTEM_TAG_RE.test(t.trim()));
}

function whenToUse(r: Resource): string {
  switch (r.type) {
    case "SOP":   return "Follow this when you run the workflow it covers.";
    case "Form":  return "Use this whenever you need to capture or submit the information it asks for.";
    case "Video":
    case "Tango": return "Watch this before you do the workflow for the first time, or as a refresher.";
    case "Workflow": return "Open this when you need the end-to-end steps for the workflow.";
    case "Link":  return "Open this to jump straight into the tool or page it links to.";
    case "PDF":
    default:      return "Reference this when you need the details written out.";
  }
}

function whoThisHelps(r: Resource): string {
  if (r.tags?.some((t) => /state_director/i.test(t)))
    return "Part of your State Director launch resources.";
  if (r.roles?.length) return "Available for your role.";
  return "Available to everyone on your team.";
}

export default function OSResourceLibrary() {
  const { role, activeState } = useOSRole();
  const { user } = useAuth();
  const { create: createSystemIssue } = useSystemIssues();
  const canManage = role === "super_admin" || role === "hr_team";
  const { resources: libraryResources, loading } = useLibraryResources();
  const isIntakeView = role === "intake_coordinator";

  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentlyOpened, setRecentlyOpened] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<ResourceCategoryId | null>(null);
  const [selected, setSelected] = useState<Resource | null>(null);
  const [typeFilter, setTypeFilter] = useState<Resource["type"] | null>(null);
  const [activeCollection, setActiveCollection] =
    useState<SmartCollectionId | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [reqTitle, setReqTitle] = useState("");
  const [reqType, setReqType] = useState("");
  const [reqDetails, setReqDetails] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  // Role-aware scope, pulled live from the operational library.
  const scope = useMemo(
    () => {
      const base = libraryResources.filter((r) => isVisibleToRole(r, role, activeState));
      // Intake team should only see resources that are actually about intake work.
      return isIntakeView ? base.filter(isIntakeRelevant) : base;
    },
    [libraryResources, role, activeState, isIntakeView],
  );
  const filteredScope = useMemo(
    () => (typeFilter ? scope.filter((r) => r.type === typeFilter) : scope),
    [scope, typeFilter]
  );
  const pinned = useMemo(() => pinnedFor(filteredScope), [filteredScope]);
  const recent = useMemo(() => recentFor(filteredScope, 6), [filteredScope]);
  const quickLinks = useMemo(
    () => scope.filter((r) => r.type === "Link" || r.type === "Tango").slice(0, 6),
    [scope]
  );
  const searchResults = useMemo(
    () => (query ? searchResources(query, filteredScope) : []),
    [query, filteredScope]
  );

  const roleLabelText = roleLabel(role);

  // Smart collections — computed off the live, learner-safe library so role,
  // state, upload status, and sensitivity rules are honored everywhere.
  const smartCollections: SmartCollectionResult[] = useMemo(
    () => collectSmartCollections(libraryResources, role, activeState),
    [libraryResources, role, activeState],
  );
  const collectionsToShow = useMemo(
    () => smartCollections.filter((c) => c.items.length > 0),
    [smartCollections],
  );
  const sdLaunchVisible = useMemo(
    () =>
      smartCollections.find((c) => c.collection.id === "state-director-launch")?.items ?? [],
    [smartCollections],
  );
  const adminHiddenCount = useMemo(
    () => (canManage ? countAdminHiddenResources(libraryResources) : 0),
    [canManage, libraryResources],
  );
  const activeCollectionResult = useMemo(
    () =>
      activeCollection
        ? smartCollections.find((c) => c.collection.id === activeCollection) ?? null
        : null,
    [activeCollection, smartCollections],
  );
  const showSdLaunchCollection =
    isSdSopVisibleToRole(role) && !query && !activeCategory && !activeCollection;

  // Intake-specific sectioning.
  const intakeGrouped = useMemo(
    () => (isIntakeView ? groupByIntakeSection(filteredScope) : null),
    [isIntakeView, filteredScope],
  );

  const visibleList: Resource[] = useMemo(() => {
    if (query) return searchResults;
    if (activeCollectionResult) return activeCollectionResult.items;
    if (activeCategory) return resourcesByCategory(activeCategory, filteredScope);
    return [];
  }, [query, activeCategory, searchResults, filteredScope, activeCollectionResult]);

  const toggleFavorite = (id: string) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const openResource = (r: Resource) => {
    setSelected(r);
    setRecentlyOpened((prev) => [r.id, ...prev.filter((x) => x !== r.id)].slice(0, 6));
  };

  const recentlyOpenedItems = useMemo(
    () => recentlyOpened.map((id) => scope.find((r) => r.id === id)).filter(Boolean) as Resource[],
    [recentlyOpened, scope]
  );

  return (
    <OSShell>
      <div className="mx-auto max-w-[1400px] space-y-8 px-1">
        <LibraryTabs />
        {/* HERO */}
        <header className="rounded-3xl border border-border/60 bg-gradient-to-br from-[hsl(265_70%_98%)] via-white to-[hsl(215_85%_98%)] p-8 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_12px_36px_-16px_hsl(220_15%_30%/0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Resource Library · {roleLabelText}
              </p>
              <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-foreground md:text-[34px]">
                Operational knowledge, organized for you.
              </h1>
              <p className="mt-2 max-w-2xl text-[14px] text-muted-foreground">
                Access operational guides, SOPs, templates, workflows, and company resources —
                personalized to your role.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <BlossomAIButton
                surface="resource-library"
                title="Resource Library assistant"
                hint="Answers cite the resources they came from — you only see what your role can access."
                contextText={`User role: ${roleLabelText}. They are browsing the Resource Library.`}
                label="Ask Blossom"
              />
              <Button variant="outline" asChild>
                <Link to="/training"><GraduationCap className="mr-2 h-4 w-4" />Training Academy</Link>
              </Button>
              {canManage && (
                <>
                  <Button variant="outline" asChild>
                    <Link to="/hr/resource-management"><Settings2 className="mr-2 h-4 w-4" />Manage</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/hr/resource-management"><Plus className="mr-2 h-4 w-4" />Add Resource</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveCategory(null);
                  setActiveCollection(null);
                }}
                placeholder="Search SOPs, guides, templates, workflows…"
                className="h-11 rounded-xl border-border/70 bg-white/80 pl-9 text-[14px] backdrop-blur"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                {filteredScope.length} of {scope.length} resources
              </span>
              {canManage && adminHiddenCount > 0 && (
                <span
                  data-testid="resource-admin-hidden-count"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-white/70 px-2 py-0.5 text-[11px] text-muted-foreground"
                  title="Pending, held, vault, or excluded resources only visible in Resource Management."
                >
                  {adminHiddenCount} hidden (admin)
                </span>
              )}
            </div>
          </div>

          {/* TYPE QUICK FILTERS */}
          <div className="mt-4 -mx-1 flex gap-1.5 overflow-x-auto pb-1">
            {[
              { key: null, label: "All", icon: BookOpen },
              { key: "SOP" as const, label: "SOPs", icon: FileText },
              { key: "Workflow" as const, label: "Workflows", icon: Workflow },
              { key: "Tango" as const, label: "Tango Walkthroughs", icon: PlayCircle },
              { key: "Template" as const, label: "Templates", icon: FileType2 },
              { key: "Checklist" as const, label: "Checklists", icon: FileText },
              { key: "Link" as const, label: "Quick Links", icon: Link2 },
            ].map((t) => {
              const Icon = t.icon;
              const active = typeFilter === t.key;
              return (
                <button
                  key={t.label}
                  onClick={() => setTypeFilter(t.key as Resource["type"] | null)}
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-white/70 text-muted-foreground hover:text-foreground border-border/70 hover:bg-white",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* MAIN GRID */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* CENTER COLUMN */}
          <div className="space-y-8 min-w-0">
            {/* EMPTY LIBRARY STATE */}
            {!loading && libraryResources.length === 0 && (
              <section className="rounded-2xl border border-dashed border-border/60 bg-card p-8 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-[15px] font-semibold text-foreground">
                  No published resources assigned to your role yet
                </h3>
                <p className="mx-auto mt-1 max-w-md text-[12.5px] text-muted-foreground">
                  Other teams may have resources available, but none have been published or
                  assigned to your role yet.{" "}
                  {canManage
                    ? "Add SOPs, workflows, and quick links from Resource Management to get started."
                    : "Check back soon — HR is preparing the operational library."}
                </p>
                {canManage && (
                  <Button asChild className="mt-4">
                    <Link to="/hr/resource-management">
                      <Plus className="mr-2 h-4 w-4" /> Add your first resource
                    </Link>
                  </Button>
                )}
              </section>
            )}

            {/* QUICK LINKS STRIP */}
            {!query && !activeCategory && !activeCollection && !typeFilter && quickLinks.length > 0 && (
              <section>
                <SectionHeader title="Quick links & walkthroughs" subtitle="Jump straight into the tools you use daily" icon={Link2} />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                  {quickLinks.map((r) => {
                    const Icon = TYPE_ICON[r.type];
                    return (
                      <button
                        key={r.id}
                        onClick={() => openResource(r)}
                        className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_8px_24px_-12px_hsl(220_15%_30%/0.1)]"
                      >
                        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", TYPE_TONE[r.type])}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                       <div className="min-w-0">
                          <div className="truncate text-[12.5px] font-medium text-foreground">{cleanResourceTitle(r.title)}</div>
                          <div className="truncate text-[10.5px] text-muted-foreground">{r.type}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* PINNED */}
            {pinned.length > 0 && !query && !activeCategory && !activeCollection && (
              <section>
                <SectionHeader title="Pinned for you" subtitle="Quick access to your most-used resources" icon={Pin} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {pinned.map((r) => (
                    <ResourceCard
                      key={r.id} r={r}
                      onOpen={openResource}
                      onFavorite={toggleFavorite}
                      isFavorite={favorites.has(r.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* SMART COLLECTIONS GRID */}
            {!isIntakeView && !query && !activeCategory && !activeCollection && (
              <section data-testid="smart-collections">
                <SectionHeader
                  title="Smart collections"
                  subtitle="Curated, role-aware bundles of the resources you use most"
                  icon={Star}
                />
                {collectionsToShow.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-card p-5 text-[12.5px] text-muted-foreground">
                    Smart collections will fill in as published resources are connected.
                    Keep moving in the Academy — your guides will land here as soon as
                    they are live.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                    {collectionsToShow.map((c) => {
                      const Icon = c.collection.icon;
                      return (
                        <button
                          key={c.collection.id}
                          data-testid={`smart-collection-${c.collection.id}`}
                          onClick={() => {
                            setActiveCollection(c.collection.id);
                            setActiveCategory(null);
                            setQuery("");
                          }}
                          className="group flex flex-col items-start gap-2 rounded-2xl border border-border/60 bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_hsl(220_15%_30%/0.12)]"
                        >
                          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", TONE_BG[c.collection.tone])}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-[13.5px] font-semibold text-foreground">
                              {c.collection.name}
                            </div>
                            <div className="mt-0.5 line-clamp-2 text-[11.5px] text-muted-foreground">
                              {c.collection.description}
                            </div>
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {c.items.length} resource{c.items.length === 1 ? "" : "s"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* INTAKE SECTIONED VIEW */}
            {isIntakeView && intakeGrouped && !query && !activeCategory && !activeCollection && !typeFilter && (
              <div className="space-y-8" data-testid="intake-sections">
                {INTAKE_SECTIONS.map((s) => {
                  const items = intakeGrouped[s.id];
                  if (!items || items.length === 0) return null;
                  const shown = items.slice(0, 9);
                  const Icon = s.icon;
                  return (
                    <section key={s.id} data-testid={`intake-section-${s.id}`}>
                      <SectionHeader title={s.title} subtitle={s.subtitle} icon={Icon} />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {shown.map((r) => (
                          <ResourceCard
                            key={r.id} r={r}
                            onOpen={openResource}
                            onFavorite={toggleFavorite}
                            isFavorite={favorites.has(r.id)}
                          />
                        ))}
                      </div>
                      {items.length > shown.length && (
                        <p className="mt-2 text-[11.5px] text-muted-foreground">
                          + {items.length - shown.length} more — use search or filters to explore this section.
                        </p>
                      )}
                    </section>
                  );
                })}
              </div>
            )}

            {/* STATE DIRECTOR LAUNCH SMART COLLECTION */}
            {showSdLaunchCollection && (
              <section data-testid="sd-launch-collection">
                <SectionHeader
                  title="State Director Launch"
                  subtitle="Published SOPs powering the 5-week State Director journey"
                  icon={GraduationCap}
                />
                {sdLaunchVisible.length === 0 ? (
                  <div
                    data-testid="sd-launch-empty"
                    className="rounded-2xl border border-dashed border-border/60 bg-card p-5 text-[12.5px] text-muted-foreground"
                  >
                    Everything here will support your State Director launch path. If a
                    resource is not here yet, keep moving in the Academy and review it
                    with your mentor — guides will appear here as soon as they are
                    published.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {sdLaunchVisible.slice(0, 9).map((r) => (
                      <ResourceCard
                        key={r.id} r={r}
                        onOpen={openResource}
                        onFavorite={toggleFavorite}
                        isFavorite={favorites.has(r.id)}
                      />
                    ))}
                  </div>
                )}
                {sdLaunchVisible.length > 9 && (
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[11.5px] text-muted-foreground">
                      + {sdLaunchVisible.length - 9} more in the State Director launch collection.
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveCollection("state-director-launch")}
                    >
                      Open collection <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </section>
            )}

            {/* ROLE RESOURCES */}
            {!isIntakeView && !query && !activeCategory && !activeCollection && (
              <section>
                <SectionHeader
                  title={`Resources for ${roleLabelText}s`}
                  subtitle="Hand-picked resources assigned to your role"
                  icon={Star}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredScope.slice(0, 9).map((r) => (
                    <ResourceCard
                      key={r.id} r={r}
                      onOpen={openResource}
                      onFavorite={toggleFavorite}
                      isFavorite={favorites.has(r.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* CATEGORIES */}
            {!isIntakeView && !query && !activeCollection && (
              <section>
                <SectionHeader title="Browse by category" subtitle="Organized operational knowledge" icon={BookOpen} />
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {resourceCategories.map((c) => {
                    const count = resourcesByCategory(c.id, filteredScope).length;
                    if (count === 0) return null;
                    const Icon = c.icon;
                    const active = activeCategory === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setActiveCategory(active ? null : c.id)}
                        className={cn(
                          "group flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all",
                          "hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_hsl(220_15%_30%/0.12)]",
                          active
                            ? "border-primary/40 bg-primary/5"
                            : "border-border/60 bg-card"
                        )}
                      >
                        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", TONE_BG[c.tone])}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[13.5px] font-semibold text-foreground">{c.name}</div>
                          <div className="mt-0.5 text-[11.5px] text-muted-foreground">{count} resource{count===1?"":"s"}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* CATEGORY / SEARCH RESULTS */}
            {(query || activeCategory || activeCollection) && (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-semibold text-foreground">
                      {query
                        ? `Results for "${query}"`
                        : activeCollectionResult
                          ? activeCollectionResult.collection.name
                          : categoryById(activeCategory!).name}
                    </h2>
                    <p className="text-[12.5px] text-muted-foreground">
                      {activeCollectionResult
                        ? `${activeCollectionResult.collection.description} · ${visibleList.length} resource${visibleList.length === 1 ? "" : "s"}`
                        : `${visibleList.length} resource${visibleList.length === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  {(query || activeCategory || activeCollection) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setQuery("");
                        setActiveCategory(null);
                        setActiveCollection(null);
                      }}
                    >
                      <X className="mr-1 h-3.5 w-3.5" /> Clear
                    </Button>
                  )}
                </div>
                {visibleList.length === 0 ? (
                  <EmptyState query={query} />
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleList.map((r) => (
                      <ResourceCard
                        key={r.id} r={r}
                        onOpen={openResource}
                        onFavorite={toggleFavorite}
                        isFavorite={favorites.has(r.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* RECENT */}
            {!query && !activeCategory && !activeCollection && recent.length > 0 && (
              <section>
                <SectionHeader title="Recently updated" subtitle="What's new in your library" icon={ArrowRight} />
                <div className="space-y-2">
                  {recent.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => openResource(r)}
                      className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_8px_24px_-12px_hsl(220_15%_30%/0.1)]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <TypeChip type={r.type} />
                        <div className="min-w-0">
                         <div className="truncate text-[13.5px] font-medium text-foreground">{cleanResourceTitle(r.title)}</div>
                          <div className="text-[11.5px] text-muted-foreground">
                            {categoryById(r.category).name} · Updated {formatRelative(r.updatedAt)}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-4">
            {recentlyOpenedItems.length > 0 && (
              <div className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="text-[13.5px] font-semibold text-foreground">Recently viewed</div>
                <div className="mt-3 space-y-2">
                  {recentlyOpenedItems.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => openResource(r)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] text-foreground hover:bg-muted/50"
                    >
                      <TypeChip type={r.type} sm />
                      <span className="truncate">{cleanResourceTitle(r.title)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="text-[13.5px] font-semibold text-foreground">Need something else?</div>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                Request a resource or suggest an SOP update.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => setRequestOpen(true)}
              >
                Request resource
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {/* REQUEST RESOURCE DIALOG */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Request a resource</DialogTitle>
            <DialogDescription>
              Tell us what you need. Super Admins will be notified to review your request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="req-title">Resource title</Label>
              <Input
                id="req-title"
                placeholder="e.g. RBT shadowing checklist"
                value={reqTitle}
                onChange={(e) => setReqTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="req-type">Type</Label>
              <Input
                id="req-type"
                placeholder="e.g. SOP, template, video"
                value={reqType}
                onChange={(e) => setReqType(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="req-details">What do you need?</Label>
              <Textarea
                id="req-details"
                placeholder="Describe the resource, who it's for, and why it's needed."
                rows={4}
                value={reqDetails}
                onChange={(e) => setReqDetails(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRequestOpen(false)}>Cancel</Button>
            <Button
              disabled={requestSubmitting}
              onClick={async () => {
                if (!reqTitle.trim()) {
                  toast.error("Please add a resource title");
                  return;
                }
                setRequestSubmitting(true);
                try {
                  await createSystemIssue({
                    title: reqTitle.trim(),
                    area: "Resource Library",
                    description: reqDetails.trim(),
                    request_type: "resource_request",
                    affected_department: "Training and Resources",
                    affected_role: String(role),
                    affected_state: activeState ?? null,
                    affected_route: "/resource-library",
                    impact:
                      "Resource needed for training, SOP, policy, or operating support.",
                    desired_outcome:
                      reqType.trim() || "Add or update resource",
                    priority: "Medium",
                    status: "Open",
                    reported_by_id: user?.id ?? null,
                    reported_by_name: user?.email ?? String(role),
                    metadata: {
                      source: "resource_library_request_dialog",
                      requested_type: reqType.trim(),
                      requested_by_role: role,
                      requested_state: activeState,
                    },
                  } as never);
                  toast.success("Request submitted", {
                    description:
                      "Sent to System Requests for Super Admin review.",
                  });
                  setReqTitle("");
                  setReqType("");
                  setReqDetails("");
                  setRequestOpen(false);
                } catch (err) {
                  const msg =
                    err instanceof Error ? err.message : "Please try again.";
                  toast.error("Could not submit request", { description: msg });
                } finally {
                  setRequestSubmitting(false);
                }
              }}
            >
              {requestSubmitting ? "Submitting…" : "Submit request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DETAIL DRAWER */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-card">
          {selected && (
            <ResourceDrawerBody
              resource={selected}
              canManage={canManage}
              isFavorite={favorites.has(selected.id)}
              onFavorite={() => toggleFavorite(selected.id)}
            />
          )}
        </SheetContent>
      </Sheet>
    </OSShell>
  );
}

function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon: any }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        </div>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function ResourceCard({
  r, onOpen, onFavorite, isFavorite,
}: {
  r: Resource;
  onOpen: (r: Resource) => void;
  onFavorite: (id: string) => void;
  isFavorite: boolean;
}) {
  const cat = categoryById(r.category);
  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset] transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_10px_28px_-14px_hsl(220_15%_30%/0.14)]">
      <div className="flex items-start justify-between gap-2">
        <TypeChip type={r.type} />
        <button
          onClick={(e) => { e.stopPropagation(); onFavorite(r.id); }}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted/60 hover:text-amber-500"
          aria-label="Favorite"
        >
          <Star className={cn("h-4 w-4", isFavorite && "fill-current text-amber-500")} />
        </button>
      </div>
      <button onClick={() => onOpen(r)} className="text-left">
        <div className="line-clamp-1 text-[14px] font-semibold text-foreground">{cleanResourceTitle(r.title)}</div>
        <p className="mt-1 line-clamp-2 text-[12.5px] text-muted-foreground">{r.description}</p>
      </button>
      <div className="mt-auto flex items-center justify-between pt-1">
        <div className="text-[11.5px] text-muted-foreground">
          {cat.name} · {formatRelative(r.updatedAt)}
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-[12px]" onClick={() => onOpen(r)}>
          Open <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function TypeChip({ type, sm }: { type: Resource["type"]; sm?: boolean }) {
  const Icon = TYPE_ICON[type];
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-medium",
        TYPE_TONE[type],
        sm ? "h-5 px-1.5 text-[10.5px]" : "h-6 px-2 text-[11px]"
      )}
    >
      <Icon className={sm ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {type}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-2 text-[12.5px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function ResourceDrawerBody({
  resource,
  canManage,
  isFavorite,
  onFavorite,
}: {
  resource: Resource;
  canManage: boolean;
  isFavorite: boolean;
  onFavorite: () => void;
}) {
  const [showAdmin, setShowAdmin] = useState(false);
  const cleanTitle = cleanResourceTitle(resource.title);
  const tags = learnerTags(resource.tags ?? []);
  const href = resource.url || resource.fileUrl;
  const hasStorage = Boolean((resource as any).storagePath);
  const pending =
    (!href && !hasStorage) || resource.attachmentStatus === "pending_upload";
  return (
    <>
      <SheetHeader>
        <div className="flex items-start gap-3">
          <TypeChip type={resource.type} />
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-[18px]">{cleanTitle}</SheetTitle>
            <SheetDescription className="mt-1 text-[13px]">
              {categoryById(resource.category).name} · Updated {formatRelative(resource.updatedAt)}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="mt-6 space-y-5" data-testid="resource-drawer-learner">
        <section>
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">What this is</div>
          <p className="mt-1 text-[13.5px] text-foreground">
            {resource.description || "A reference from your Blossom OS library."}
          </p>
        </section>

        <section>
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">When to use it</div>
          <p className="mt-1 text-[13.5px] text-foreground/90">{whenToUse(resource)}</p>
        </section>

        <section>
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Who this helps</div>
          <p className="mt-1 text-[13.5px] text-foreground/90">{whoThisHelps(resource)}</p>
        </section>

        {tags.length > 0 && (
          <section>
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Topics</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="rounded-full text-[11px] font-normal">{t}</Badge>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {pending ? (
            <div
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-3 h-10 text-xs text-muted-foreground"
              data-testid="resource-attachment-pending"
            >
              <ClipboardList className="h-4 w-4" />
              Attachment pending — file will be linked once it's added to the Resource Library.
            </div>
          ) : (
            <Button
              data-testid="resource-open-button"
              onClick={async () => {
                const url = await resolveResourceOpenUrl(resource);
                if (url) window.open(url, "_blank", "noopener,noreferrer");
                else toast.error("This resource could not be opened. Try again or contact an admin.");
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" /> Open resource
            </Button>
          )}
          {!pending && (
            <Button
              variant="outline"
              data-testid="resource-download-button"
              onClick={async () => {
                const url = await resolveResourceOpenUrl(resource);
                if (!url) {
                  toast.error("This resource could not be downloaded. Try again or contact an admin.");
                  return;
                }
                const safeName = resource.title.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "");
                const a = document.createElement("a");
                a.href = url;
                a.download = safeName;
                a.rel = "noopener noreferrer";
                document.body.appendChild(a);
                a.click();
                a.remove();
              }}
            >
              <Download className="mr-2 h-4 w-4" /> Download resource
            </Button>
          )}
          <Button variant="outline" onClick={onFavorite}>
            <Star className={cn("mr-2 h-4 w-4", isFavorite && "fill-current text-amber-500")} />
            {isFavorite ? "Favorited" : "Favorite"}
          </Button>
        </div>

        {canManage && (
          <section
            data-testid="resource-drawer-admin"
            className="mt-4 rounded-xl border border-border/50 bg-muted/20 p-3"
          >
            <button
              type="button"
              onClick={() => setShowAdmin((v) => !v)}
              className="flex w-full items-center justify-between text-[12px] font-medium text-foreground"
            >
              <span>Admin details</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", showAdmin && "rotate-180")} />
            </button>
            {showAdmin && (
              <div className="mt-3 space-y-2">
                <MetaRow label="Type" value={resource.type} />
                <MetaRow label="Status" value={resource.status} />
                <MetaRow label="Uploaded by" value={resource.uploadedBy} />
                <MetaRow label="Departments" value={resource.departments.join(", ") || "All"} />
                <MetaRow label="States" value={resource.states.join(", ") || "All states"} />
                <MetaRow label="Roles" value={resource.roles.length ? resource.roles.map(roleLabel).join(", ") : "All roles"} />
                {resource.tags.length > 0 && (
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">All tags</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {resource.tags.map((t) => (
                        <Badge key={t} variant="outline" className="rounded-full text-[10.5px] font-normal">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-card/60 p-10 text-center">
      <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
      <div className="mt-3 text-[14px] font-medium text-foreground">No resources found</div>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        {query ? `Nothing matched "${query}" in your library.` : "This category is empty for your role."}
      </p>
    </div>
  );
}
