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
  Search, Plus, Upload, BookOpen, Star, ArrowRight, Pin, Sparkles, Send,
  X, Settings2, ExternalLink, GraduationCap, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOSRole } from "@/contexts/OSRoleContext";
import {
  resourceCategories, categoryById, resourcesByCategory,
  visibleResources, pinnedFor, recentFor, searchResources,
  formatRelative, aiSamplePrompts, TYPE_ICON, TYPE_TONE, roleLabel,
  type Resource, type ResourceCategoryId,
} from "@/lib/resources/resourceData";

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

export default function OSResourceLibrary() {
  const { role, activeState } = useOSRole();
  const canManage = role === "super_admin" || role === "hr_team";

  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentlyOpened, setRecentlyOpened] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<ResourceCategoryId | null>(null);
  const [selected, setSelected] = useState<Resource | null>(null);

  // Role-aware scope: everything else flows from this list.
  const scope = useMemo(() => visibleResources(role, activeState), [role, activeState]);
  const pinned = useMemo(() => pinnedFor(scope), [scope]);
  const recent = useMemo(() => recentFor(scope, 6), [scope]);
  const searchResults = useMemo(
    () => (query ? searchResources(query, scope) : []),
    [query, scope]
  );

  const roleLabelText = roleLabel(role);

  const visibleList: Resource[] = useMemo(() => {
    if (query) return searchResults;
    if (activeCategory) return resourcesByCategory(activeCategory, scope);
    return [];
  }, [query, activeCategory, searchResults, scope]);

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
              <Button variant="outline" asChild>
                <Link to="/sop"><BookOpen className="mr-2 h-4 w-4" />SOP Library</Link>
              </Button>
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
                onChange={(e) => { setQuery(e.target.value); setActiveCategory(null); }}
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
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              <span>{scope.length} resources visible</span>
            </div>
          </div>
        </header>

        {/* MAIN GRID */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* CENTER COLUMN */}
          <div className="space-y-8 min-w-0">
            {/* PINNED */}
            {pinned.length > 0 && !query && !activeCategory && (
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

            {/* ROLE RESOURCES */}
            {!query && !activeCategory && (
              <section>
                <SectionHeader
                  title={`Resources for ${roleLabelText}s`}
                  subtitle="Hand-picked resources assigned to your role"
                  icon={Star}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {scope.slice(0, 9).map((r) => (
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
            {!query && (
              <section>
                <SectionHeader title="Browse by category" subtitle="Organized operational knowledge" icon={BookOpen} />
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {resourceCategories.map((c) => {
                    const count = resourcesByCategory(c.id, scope).length;
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
            {(query || activeCategory) && (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-semibold text-foreground">
                      {query ? `Results for "${query}"` : categoryById(activeCategory!).name}
                    </h2>
                    <p className="text-[12.5px] text-muted-foreground">
                      {visibleList.length} resource{visibleList.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  {(query || activeCategory) && (
                    <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setActiveCategory(null); }}>
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
            {!query && !activeCategory && recent.length > 0 && (
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
                          <div className="truncate text-[13.5px] font-medium text-foreground">{r.title}</div>
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

          {/* AI SIDEBAR */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-[hsl(265_70%_98%)] to-white p-5 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_8px_24px_-12px_hsl(220_15%_30%/0.08)]">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(265_70%_94%)] text-[hsl(265_70%_45%)]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[13.5px] font-semibold text-foreground">Ask Blossom AI</div>
                  <div className="text-[11.5px] text-muted-foreground">Find any resource instantly</div>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {aiSamplePrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => setQuery(p.replace(/[.?]$/, ""))}
                    className="block w-full rounded-lg border border-border/60 bg-white/70 px-3 py-2 text-left text-[12.5px] text-foreground transition-colors hover:bg-white"
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Input placeholder="Ask anything…" className="h-9 rounded-lg border-border/70 bg-white text-[13px]" />
                <Button size="icon" className="h-9 w-9 rounded-lg"><Send className="h-4 w-4" /></Button>
              </div>
            </div>

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
                      <span className="truncate">{r.title}</span>
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
              <Button variant="outline" size="sm" className="mt-3 w-full">Request resource</Button>
            </div>
          </aside>
        </div>
      </div>

      {/* DETAIL DRAWER */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-start gap-3">
                  <TypeChip type={selected.type} />
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-[18px]">{selected.title}</SheetTitle>
                    <SheetDescription className="mt-1 text-[13px]">
                      {categoryById(selected.category).name} · Updated {formatRelative(selected.updatedAt)}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <p className="text-[13.5px] text-foreground">{selected.description}</p>

                <MetaRow label="Type" value={selected.type} />
                <MetaRow label="Status" value={selected.status} />
                <MetaRow label="Uploaded by" value={selected.uploadedBy} />
                <MetaRow label="Departments" value={selected.departments.join(", ") || "All"} />
                <MetaRow label="States" value={selected.states.join(", ") || "All states"} />
                <MetaRow label="Roles" value={selected.roles.length ? selected.roles.map(roleLabel).join(", ") : "All roles"} />

                {selected.tags.length > 0 && (
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Tags</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selected.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="rounded-full text-[11px] font-normal">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button asChild>
                    <a href={selected.url || selected.fileUrl || "#"} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" /> Open resource
                    </a>
                  </Button>
                  <Button variant="outline" onClick={() => toggleFavorite(selected.id)}>
                    <Star className={cn("mr-2 h-4 w-4", favorites.has(selected.id) && "fill-current text-amber-500")} />
                    {favorites.has(selected.id) ? "Favorited" : "Favorite"}
                  </Button>
                </div>
              </div>
            </>
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
        <div className="line-clamp-1 text-[14px] font-semibold text-foreground">{r.title}</div>
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
