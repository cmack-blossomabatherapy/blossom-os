import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight, Search, Bookmark, BookOpen, PlayCircle, ClipboardCheck,
  FileText, Workflow, Sparkles, Zap, ArrowUpRight, X, CheckCircle2,
  ExternalLink, StickyNote, Youtube, FileBadge, Video, ListChecks,
} from "lucide-react";
import { RBTRetentionSection } from "@/components/training/RBTRetentionSection";
import { OSShell } from "./OSShell";
import {
  useRBTResources, RBT_RESOURCE_CATEGORIES,
  type RBTResource, type RBTResourceCategoryId, type RBTResourceType,
  getRBTResourceOpenUrl,
} from "@/lib/training/rbtResources";
import {
  useResourcePrefs, toggleBookmark, toggleComplete, markViewed,
} from "@/lib/training/rbtResourcePrefs";

/**
 * RBT Resource Library — surfaces the same Supabase-backed rbt_resources
 * catalog that powers the RBT Training Academy. Bookmarks/completion/viewed
 * state live in public.rbt_resource_prefs (per user).
 */
export default function OSRBTResources() {
  const resources = useRBTResources();
  const prefs = useResourcePrefs();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<RBTResourceCategoryId | "all" | "saved" | "completed">("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const bookmarkedSet = useMemo(() => new Set(prefs.bookmarked), [prefs.bookmarked]);
  const completedSet = useMemo(() => new Set(prefs.completed), [prefs.completed]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => (r.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort().slice(0, 12);
  }, [resources]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (activeCategory === "saved" && !bookmarkedSet.has(r.id)) return false;
      if (activeCategory === "completed" && !completedSet.has(r.id)) return false;
      if (activeCategory !== "all" && activeCategory !== "saved" && activeCategory !== "completed" && r.category !== activeCategory) return false;
      if (activeTag && !(r.tags ?? []).includes(activeTag)) return false;
      if (!q) return true;
      const hay = [r.title, r.description ?? "", r.type, r.category ?? "", ...(r.tags ?? [])].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [resources, query, activeTag, activeCategory, bookmarkedSet, completedSet]);

  const grouped = useMemo(() => {
    if (activeCategory !== "all") return null;
    const map = new Map<string, RBTResource[]>();
    for (const r of filtered) {
      const k = r.category ?? "other";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    return RBT_RESOURCE_CATEGORIES
      .map((c) => ({ id: c.id, label: c.label, hint: c.description, items: map.get(c.id) ?? [] }))
      .filter((g) => g.items.length > 0)
      .concat(map.has("other") ? [{ id: "other" as never, label: "Other", hint: "", items: map.get("other")! }] : []);
  }, [filtered, activeCategory]);

  const handleOpen = (r: RBTResource) => { markViewed(r.id); };
  const handleToggleSave = (id: string) => { toggleBookmark(id); markViewed(id); };
  const handleToggleComplete = (id: string) => { toggleComplete(id); markViewed(id); };

  return (
    <OSShell>
      <div className="min-h-screen bg-background pb-20">
        <header className="relative overflow-hidden border-b border-border/60">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
          <div className="mx-auto max-w-6xl px-5 md:px-10 pt-10 pb-8 md:pt-14 md:pb-10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/rbt" className="hover:text-foreground transition-colors">RBT</Link>
              <ChevronRight className="size-3" />
              <span>Resource Library</span>
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Everything you need for the field.
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground max-w-xl">
              Same resources your Training Academy uses. Save what helps, mark what you've completed.
            </p>
            <div className="mt-6 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value.slice(0, 200))}
                placeholder="Search resources, tags, or topics…"
                className="w-full h-12 rounded-2xl bg-card border border-border/70 pl-11 pr-11 text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent transition"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full size-7 grid place-items-center hover:bg-muted transition-colors"
                >
                  <X className="size-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            {allTags.length > 0 && (
              <div className="mt-4 flex gap-1.5 flex-wrap">
                {allTags.map((t) => {
                  const on = activeTag === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setActiveTag(on ? null : t)}
                      className={`h-7 px-3 rounded-full text-xs font-medium transition border ${
                        on
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-muted/60 text-muted-foreground border-border/60 hover:text-foreground"
                      }`}
                    >#{t}</button>
                  );
                })}
                {activeTag && (
                  <button
                    onClick={() => setActiveTag(null)}
                    className="h-7 px-3 rounded-full text-xs text-muted-foreground hover:text-foreground transition"
                  >Clear tag</button>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 md:px-10 pt-8 md:pt-10 space-y-10">
          <RBTRetentionSection />
          <div className="grid md:grid-cols-[240px_1fr] gap-8 md:gap-10">
            <aside className="md:sticky md:top-6 md:self-start space-y-1">
              <SidebarItem
                label="All resources"
                hint={`${resources.length} items`}
                active={activeCategory === "all"}
                onClick={() => setActiveCategory("all")}
                icon={Sparkles}
              />
              <SidebarItem
                label="Saved"
                hint={prefs.bookmarked.length === 0 ? "None yet" : `${prefs.bookmarked.length} saved`}
                active={activeCategory === "saved"}
                onClick={() => setActiveCategory("saved")}
                icon={Bookmark}
              />
              <SidebarItem
                label="Completed"
                hint={prefs.completed.length === 0 ? "None yet" : `${prefs.completed.length} completed`}
                active={activeCategory === "completed"}
                onClick={() => setActiveCategory("completed")}
                icon={CheckCircle2}
              />
              <div className="h-px bg-border/60 my-2.5" />
              {RBT_RESOURCE_CATEGORIES.map((c) => {
                const count = resources.filter((r) => r.category === c.id).length;
                return (
                  <SidebarItem
                    key={c.id}
                    label={c.label}
                    hint={`${count} items`}
                    active={activeCategory === c.id}
                    onClick={() => setActiveCategory(c.id)}
                    icon={BookOpen}
                  />
                );
              })}
            </aside>

            <div className="space-y-10 min-w-0">
              {filtered.length === 0 ? (
                <div className="rounded-2xl bg-card border border-border/70 p-10 text-center">
                  <div className="size-12 mx-auto rounded-full bg-muted grid place-items-center">
                    <Search className="size-5 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-base font-medium text-foreground">No matches</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Try a different search or clear your filters.</p>
                  <button
                    onClick={() => { setQuery(""); setActiveTag(null); setActiveCategory("all"); }}
                    className="mt-4 h-9 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 text-sm hover:bg-muted transition"
                  >Reset</button>
                </div>
              ) : grouped ? (
                grouped.map((g) => (
                  <SectionBlock
                    key={g.id}
                    label={g.label}
                    hint={g.hint}
                    resources={g.items}
                    bookmarkedSet={bookmarkedSet}
                    completedSet={completedSet}
                    onOpen={handleOpen}
                    onToggleSave={handleToggleSave}
                    onToggleComplete={handleToggleComplete}
                  />
                ))
              ) : (
                <SectionBlock
                  label={activeCategory === "saved" ? "Saved" : activeCategory === "completed" ? "Completed" : RBT_RESOURCE_CATEGORIES.find((c) => c.id === activeCategory)?.label ?? "Resources"}
                  hint=""
                  resources={filtered}
                  bookmarkedSet={bookmarkedSet}
                  completedSet={completedSet}
                  onOpen={handleOpen}
                  onToggleSave={handleToggleSave}
                  onToggleComplete={handleToggleComplete}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </OSShell>
  );
}

function SidebarItem({
  label, hint, active, onClick, icon: Icon,
}: { label: string; hint?: string; active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
        active ? "bg-card border border-border/70 shadow-sm" : "hover:bg-muted/60"
      }`}
    >
      <Icon className={`size-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${active ? "text-foreground" : "text-foreground/80"}`}>{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground truncate">{hint}</div>}
      </div>
    </button>
  );
}

function SectionBlock({
  label, hint, resources, bookmarkedSet, completedSet, onOpen, onToggleSave, onToggleComplete,
}: {
  label: string;
  hint: string;
  resources: RBTResource[];
  bookmarkedSet: Set<string>;
  completedSet: Set<string>;
  onOpen: (r: RBTResource) => void;
  onToggleSave: (id: string) => void;
  onToggleComplete: (id: string) => void;
}) {
  return (
    <section>
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl bg-muted grid place-items-center">
          <BookOpen className="size-4 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-medium tracking-tight text-foreground">{label}</h2>
          {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {resources.map((r) => (
          <ResourceCard
            key={r.id}
            resource={r}
            saved={bookmarkedSet.has(r.id)}
            completed={completedSet.has(r.id)}
            onOpen={() => onOpen(r)}
            onToggleSave={() => onToggleSave(r.id)}
            onToggleComplete={() => onToggleComplete(r.id)}
          />
        ))}
      </div>
    </section>
  );
}

function ResourceCard({
  resource, saved, completed, onOpen, onToggleSave, onToggleComplete,
}: {
  resource: RBTResource;
  saved: boolean;
  completed: boolean;
  onOpen: () => void;
  onToggleSave: () => void;
  onToggleComplete: () => void;
}) {
  const Icon = typeIcon(resource.type);
  const url = resource.url;
  const isExternal = !!url && /^https?:\/\//.test(url);
  const hasStorage = !!resource.storagePath;
  const openStorage = async () => {
    onOpen();
    const signed = await getRBTResourceOpenUrl(resource);
    if (signed) window.open(signed, "_blank", "noopener,noreferrer");
  };
  return (
    <div className="group rounded-2xl bg-card border border-border/70 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-border">
      <div className="flex items-start gap-4">
        <div className="size-10 rounded-xl bg-muted grid place-items-center shrink-0">
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-muted text-foreground/70">{resource.type}</span>
            {resource.required && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">Required</span>
            )}
            {resource.needsReview && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300">Needs Review</span>
            )}
            {resource.planningOnly && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium border border-amber-500/40 text-amber-700 dark:text-amber-300">Not Current SOP</span>
            )}
            {resource.minutes && (
              <span className="text-xs text-muted-foreground">{resource.minutes} min</span>
            )}
            {completed && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3" /> Completed
              </span>
            )}
          </div>
          <div className="mt-2 text-[15px] font-medium text-foreground">{resource.title}</div>
          {resource.description && (
            <div className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{resource.description}</div>
          )}
          {resource.tags && resource.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {resource.tags.slice(0, 4).map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">#{t}</span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onToggleSave}
          aria-label={saved ? "Remove from saved" : "Save"}
          className="rounded-full size-9 grid place-items-center hover:bg-muted transition-colors shrink-0"
        >
          <Bookmark className={`size-4 ${saved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
        </button>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          onClick={onToggleComplete}
          className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-medium border transition ${
            completed
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-card border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <CheckCircle2 className="size-3.5" /> {completed ? "Completed" : "Mark complete"}
        </button>
        {hasStorage ? (
          <button
            onClick={openStorage}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-secondary text-secondary-foreground border border-border/70 text-sm font-medium hover:bg-muted transition"
          >
            Open <ExternalLink className="size-3.5" />
          </button>
        ) : url ? (
          isExternal ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              onClick={onOpen}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-secondary text-secondary-foreground border border-border/70 text-sm font-medium hover:bg-muted transition"
            >
              Open <ExternalLink className="size-3.5" />
            </a>
          ) : (
            <Link
              to={url}
              onClick={onOpen}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-secondary text-secondary-foreground border border-border/70 text-sm font-medium hover:bg-muted transition"
            >
              Open <ArrowUpRight className="size-3.5" />
            </Link>
          )
        ) : (
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-secondary text-secondary-foreground border border-border/70 text-sm font-medium hover:bg-muted transition"
          >
            View <StickyNote className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function typeIcon(t: RBTResourceType): React.ComponentType<{ className?: string }> {
  switch (t) {
    case "YouTube Video": return Youtube;
    case "Internal Video": return PlayCircle;
    case "Meeting Recording": return Video;
    case "SOP": return FileText;
    case "Policy": return FileText;
    case "How-To": return Workflow;
    case "Checklist": return ClipboardCheck;
    case "Template": return FileBadge;
    case "Worksheet": return FileBadge;
    case "Quiz": return ListChecks;
    case "Mock Form": return ClipboardCheck;
    case "Trainer Note": return StickyNote;
    case "PDF": return FileText;
    case "Research Article": return BookOpen;
    default: return FileText;
  }
}
