import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { OSShell } from "./OSShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Search, Plus, Upload, FolderPlus, BookOpen, Star, ArrowRight, Pin,
  Download, Share2, Link2, ChevronRight, Sparkles, Send, Eye, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOSRole } from "@/contexts/OSRoleContext";
import {
  resources, resourceCategories, categoryById, resourcesByCategory,
  featuredResources, recentResources, pinnedResources, searchResources,
  formatRelative, quickLinks, aiSamplePrompts, TYPE_ICON, TYPE_TONE,
  type Resource,
} from "@/lib/resources/resourceData";
import { toast } from "@/hooks/use-toast";

const TONE_BG: Record<string, string> = {
  purple:  "bg-[hsl(265_70%_96%)] text-[hsl(265_70%_45%)]",
  blue:    "bg-[hsl(215_85%_96%)] text-[hsl(215_85%_45%)]",
  teal:    "bg-[hsl(180_60%_94%)] text-[hsl(180_60%_35%)]",
  amber:   "bg-[hsl(40_90%_94%)]  text-[hsl(30_70%_42%)]",
  rose:    "bg-[hsl(345_80%_96%)] text-[hsl(345_70%_48%)]",
  emerald: "bg-[hsl(150_55%_94%)] text-[hsl(150_55%_32%)]",
  slate:   "bg-slate-100 text-slate-700",
};

export default function OSResourceLibrary() {
  const { role } = useOSRole();
  const canManage = role === "super_admin" || role === "hr_team";

  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentlyOpened, setRecentlyOpened] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<Resource | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");

  const featured = useMemo(featuredResources, []);
  const recent = useMemo(() => recentResources(6), []);
  const pinned = useMemo(pinnedResources, []);
  const searchResults = useMemo(() => (query ? searchResources(query) : []), [query]);

  const recentlyOpenedItems = useMemo(
    () => recentlyOpened.map((id) => resources.find((r) => r.id === id)).filter(Boolean) as Resource[],
    [recentlyOpened]
  );

  const visibleList: Resource[] = useMemo(() => {
    if (query) return searchResults;
    if (activeCategory) return resourcesByCategory(activeCategory as any);
    return [];
  }, [query, activeCategory, searchResults]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openResource = (r: Resource) => {
    setSelected(r);
    setRecentlyOpened((prev) => [r.id, ...prev.filter((x) => x !== r.id)].slice(0, 6));
  };

  return (
    <OSShell>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div>
          {/* Hero */}
          <header className="os-rise os-glass-panel rounded-3xl p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(265_70%_55%)]">
              Blossom OS · Resource Library
            </p>
            <h1 className="mt-2 text-[28px] font-semibold tracking-tight md:text-[34px]">
              Resource Library
            </h1>
            <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">
              Access SOPs, templates, workflows, forms, and operational resources across Blossom.
            </p>

            <div className="relative mt-5 max-w-2xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveCategory(null); }}
                placeholder="Search resources, SOPs, templates, forms…"
                className="os-glass-input h-12 rounded-2xl pl-11 text-sm"
              />
              {query && searchResults.length > 0 && (
                <div className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-border/60 bg-card shadow-xl">
                  {searchResults.slice(0, 8).map((r) => {
                    const Icon = TYPE_ICON[r.type];
                    return (
                      <button
                        key={r.id}
                        onClick={() => openResource(r)}
                        className="flex w-full items-center justify-between gap-3 border-b border-border/40 px-4 py-3 text-left last:border-b-0 hover:bg-muted/40"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className={cn("rounded-lg p-1.5", TYPE_TONE[r.type])}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{r.title}</p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {r.type} · {categoryById(r.category).name}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {canManage && (
                <>
                  <Button size="sm" className="rounded-full" onClick={() => setUploadOpen(true)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Resource
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => setUploadOpen(true)}>
                    <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload File
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => toast({ title: "Folder created", description: "Mock folder added to this library." })}>
                    <FolderPlus className="mr-1.5 h-3.5 w-3.5" /> Create Folder
                  </Button>
                </>
              )}
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link to="/training"><BookOpen className="mr-1.5 h-3.5 w-3.5" /> Open SOP Library</Link>
              </Button>
            </div>
          </header>

          {/* Featured */}
          {!query && !activeCategory && (
            <section className="mt-8 os-rise">
              <SectionHeader title="Featured Resources" subtitle="Hand-picked essentials for everyday operations." />
              <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
                {featured.map((r) => (
                  <FeaturedCard key={r.id} r={r} onOpen={() => openResource(r)} />
                ))}
              </div>
            </section>
          )}

          {/* Categories */}
          {!query && (
            <section className="mt-10 os-rise">
              <SectionHeader
                title="Categories"
                subtitle="Browse resources by area."
                action={activeCategory ? (
                  <Button size="sm" variant="ghost" className="h-8 rounded-full" onClick={() => setActiveCategory(null)}>
                    <X className="mr-1 h-3.5 w-3.5" /> Clear
                  </Button>
                ) : undefined}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {resourceCategories.map((c) => {
                  const count = resourcesByCategory(c.id).length;
                  const Icon = c.icon;
                  const active = activeCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveCategory(active ? null : c.id)}
                      className={cn(
                        "os-card group flex flex-col rounded-2xl p-5 text-left transition",
                        active && "ring-2 ring-[hsl(265_70%_55%)]/40"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn("rounded-xl p-2", TONE_BG[c.tone])}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-[14px] font-semibold leading-tight">{c.name}</h3>
                          <p className="truncate text-[11.5px] text-muted-foreground">{count} resources</p>
                        </div>
                      </div>
                      <p className="mt-3 line-clamp-2 text-[12.5px] text-muted-foreground">{c.description}</p>
                      <div className="mt-3 flex items-center justify-end text-[11px] font-medium text-primary">
                        Open <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Category / Search Results list */}
          {visibleList.length > 0 && (
            <section className="mt-10 os-rise">
              <SectionHeader
                title={query ? `Results for "${query}"` : categoryById(activeCategory as any).name}
                subtitle={`${visibleList.length} resource${visibleList.length === 1 ? "" : "s"}`}
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleList.map((r) => (
                  <ResourceCard key={r.id} r={r} fav={favorites.has(r.id)} onFav={() => toggleFavorite(r.id)} onOpen={() => openResource(r)} />
                ))}
              </div>
            </section>
          )}

          {/* Recent */}
          {!query && !activeCategory && (
            <section className="mt-10 os-rise">
              <SectionHeader title="Recently Updated" subtitle="Latest changes across the library." />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {recent.map((r) => (
                  <ResourceCard key={r.id} r={r} fav={favorites.has(r.id)} onFav={() => toggleFavorite(r.id)} onOpen={() => openResource(r)} />
                ))}
              </div>
            </section>
          )}

          {/* Pinned */}
          {!query && !activeCategory && pinned.length > 0 && (
            <section className="mt-10 os-rise">
              <SectionHeader title="Pinned Resources" subtitle="Your team's most-used essentials." />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {pinned.map((r) => (
                  <ResourceCard key={r.id} r={r} fav={favorites.has(r.id)} onFav={() => toggleFavorite(r.id)} onOpen={() => openResource(r)} pinned />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-6">
          {/* Quick Links */}
          <div className="os-glass-panel rounded-3xl p-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Quick Links</h3>
            <div className="mt-3 space-y-1">
              {quickLinks.map((q) => (
                <Link
                  key={q.label}
                  to={q.to}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{q.label}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{q.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recently Opened */}
          <div className="os-glass-panel rounded-3xl p-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Recently Opened</h3>
            {recentlyOpenedItems.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-muted-foreground">Resources you open will appear here.</p>
            ) : (
              <div className="mt-3 space-y-1">
                {recentlyOpenedItems.map((r) => {
                  const Icon = TYPE_ICON[r.type];
                  return (
                    <button
                      key={r.id}
                      onClick={() => openResource(r)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted/50"
                    >
                      <span className={cn("rounded-lg p-1.5", TYPE_TONE[r.type])}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{r.title}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{formatRelative(r.updatedAt)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Assistant */}
          <div className="os-glass-panel rounded-3xl p-5">
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-[hsl(265_70%_96%)] p-1.5 text-[hsl(265_70%_45%)]">
                <Sparkles className="h-4 w-4" />
              </span>
              <h3 className="text-[13px] font-semibold">Ask Blossom AI</h3>
            </div>
            <p className="mt-2 text-[12.5px] text-muted-foreground">Find resources, SOPs, and answers instantly.</p>
            <div className="relative mt-3">
              <Input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && aiInput.trim()) { setQuery(aiInput); setAiInput(""); } }}
                placeholder="Ask anything…"
                className="os-glass-input h-10 rounded-xl pr-10 text-sm"
              />
              <button
                onClick={() => { if (aiInput.trim()) { setQuery(aiInput); setAiInput(""); } }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {aiSamplePrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => setQuery(p.replace(/[.?]$/, ""))}
                  className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted/50"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Resource Detail Drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && <ResourceDetail r={selected} fav={favorites.has(selected.id)} onFav={() => toggleFavorite(selected.id)} />}
        </SheetContent>
      </Sheet>

      {/* Upload Modal */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
            <DialogDescription>Upload a file, paste a link, or add a Tango walkthrough.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[12px] font-medium">Title</label>
              <Input placeholder="e.g. Insurance Cheat Sheet" className="mt-1" />
            </div>
            <div>
              <label className="text-[12px] font-medium">Description</label>
              <Textarea placeholder="Short description for your team…" className="mt-1" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium">Category</label>
                <Input placeholder="SOPs, Forms…" className="mt-1" />
              </div>
              <div>
                <label className="text-[12px] font-medium">Department</label>
                <Input placeholder="Intake, HR…" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-[12px] font-medium">Tags</label>
              <Input placeholder="comma, separated, tags" className="mt-1" />
            </div>
            <div>
              <label className="text-[12px] font-medium">External link or Tango URL</label>
              <Input placeholder="https://…" className="mt-1" />
            </div>
            <div className="rounded-xl border border-dashed border-border/60 p-4 text-center text-[12.5px] text-muted-foreground">
              Drop file here or click to upload
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={() => { setUploadOpen(false); toast({ title: "Resource added", description: "Your resource is now visible to the team." }); }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OSShell>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[18px] font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-[12.5px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function FeaturedCard({ r, onOpen }: { r: Resource; onOpen: () => void }) {
  const Icon = TYPE_ICON[r.type];
  const cat = categoryById(r.category);
  return (
    <button
      onClick={onOpen}
      className="os-card group min-w-[280px] max-w-[300px] flex-shrink-0 snap-start rounded-2xl p-5 text-left"
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn("rounded-xl p-2", TYPE_TONE[r.type])}>
          <Icon className="h-4 w-4" />
        </span>
        <Badge variant="outline" className="text-[10px]">{cat.name}</Badge>
      </div>
      <h3 className="mt-3 text-[14.5px] font-semibold leading-tight">{r.title}</h3>
      <p className="mt-1 line-clamp-2 text-[12.5px] text-muted-foreground">{r.description}</p>
      <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Updated {formatRelative(r.updatedAt)}</span>
        <span className="font-medium text-primary inline-flex items-center gap-1">
          Open <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}

function ResourceCard({
  r, fav, onFav, onOpen, pinned,
}: { r: Resource; fav: boolean; onFav: () => void; onOpen: () => void; pinned?: boolean }) {
  const Icon = TYPE_ICON[r.type];
  const cat = categoryById(r.category);
  return (
    <div className="os-card group flex flex-col rounded-2xl p-5">
      <div className="flex items-start justify-between gap-2">
        <span className={cn("rounded-xl p-2", TYPE_TONE[r.type])}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex items-center gap-1">
          {pinned && <Pin className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />}
          <button
            onClick={onFav}
            className={cn(
              "rounded-full p-1.5 transition",
              fav ? "text-amber-500" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Favorite"
          >
            <Star className={cn("h-4 w-4", fav && "fill-current")} />
          </button>
        </div>
      </div>
      <button onClick={onOpen} className="mt-3 text-left">
        <h3 className="text-[14.5px] font-semibold leading-tight">{r.title}</h3>
        <p className="mt-1 line-clamp-2 text-[12.5px] text-muted-foreground">{r.description}</p>
      </button>
      <div className="mt-3 flex flex-wrap gap-1">
        <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
        <Badge variant="outline" className="text-[10px]">{cat.name}</Badge>
        {r.tags.slice(0, 2).map((t) => (
          <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">#{t}</span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
        <span>By {r.uploadedBy} · {formatRelative(r.updatedAt)}</span>
        <button onClick={onOpen} className="font-medium text-primary inline-flex items-center gap-1">
          Open <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

function ResourceDetail({ r, fav, onFav }: { r: Resource; fav: boolean; onFav: () => void }) {
  const Icon = TYPE_ICON[r.type];
  const cat = categoryById(r.category);
  const related = resources.filter((x) => x.category === r.category && x.id !== r.id).slice(0, 4);
  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-3">
          <span className={cn("rounded-xl p-2", TYPE_TONE[r.type])}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <SheetTitle className="text-left text-[18px]">{r.title}</SheetTitle>
            <SheetDescription className="text-left text-[12px]">{cat.name} · {r.type}</SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="mt-5 space-y-5">
        <p className="text-[13.5px] text-muted-foreground">{r.description}</p>

        <div className="grid grid-cols-2 gap-3 text-[12px]">
          <Meta label="Department" value={r.department ?? "—"} />
          <Meta label="Uploaded by" value={r.uploadedBy} />
          <Meta label="Created" value={formatRelative(r.createdAt)} />
          <Meta label="Updated" value={formatRelative(r.updatedAt)} />
        </div>

        {r.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {r.tags.map((t) => (
              <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">#{t}</span>
            ))}
          </div>
        )}

        {/* Preview */}
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-6 text-center">
          <Eye className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-[12.5px] text-muted-foreground">Preview not available in mock. Open to view.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="rounded-full">
            <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Open
          </Button>
          <Button size="sm" variant="outline" className="rounded-full">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Download
          </Button>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast({ title: "Link copied" }); }}>
            <Link2 className="mr-1.5 h-3.5 w-3.5" /> Copy Link
          </Button>
          <Button size="sm" variant="outline" className="rounded-full">
            <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share
          </Button>
          <Button size="sm" variant="outline" className="rounded-full" onClick={onFav}>
            <Star className={cn("mr-1.5 h-3.5 w-3.5", fav && "fill-current text-amber-500")} />
            {fav ? "Favorited" : "Favorite"}
          </Button>
        </div>

        {related.length > 0 && (
          <div>
            <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Related</h4>
            <div className="space-y-1">
              {related.map((x) => {
                const RI = TYPE_ICON[x.type];
                return (
                  <div key={x.id} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm hover:bg-muted/50">
                    <span className={cn("rounded-lg p-1.5", TYPE_TONE[x.type])}>
                      <RI className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{x.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{x.type} · {formatRelative(x.updatedAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[13px] font-medium">{value}</p>
    </div>
  );
}