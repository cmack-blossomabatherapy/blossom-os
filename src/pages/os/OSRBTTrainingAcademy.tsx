import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  PlayCircle, CheckCircle2, Lock, Clock, ChevronRight, Sparkles,
  BookOpen, LifeBuoy, MessageSquare, FileText, ListChecks, Video,
  GraduationCap, ArrowRight, ShieldCheck, UserCircle2, ClipboardCheck,
  AlertCircle, Compass, Award, Plus, Pencil, Trash2, ExternalLink,
  Youtube, FileSpreadsheet, StickyNote, X, Search, BookMarked, FileBadge,
  Bookmark, BookmarkCheck, Check, RotateCcw, Download, EyeOff, Layers,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  RBT_PATHS, RBT_OWNERSHIP, pathStats,
  type RBTPath, type RBTPathId, type RBTModule, type ModuleType, type SignoffItem,
} from "@/lib/training/rbtAcademy";
import {
  useRBTResources, getResourcesForModule, addResource, updateResource,
  removeResource, RBT_RESOURCE_TYPES,
  RBT_RESOURCE_CATEGORIES, TRACK_LABELS,
  useHiddenSeedIds, getSeededResourceById, restoreSeededResource,
  type RBTResource, type RBTResourceType, type RBTResourceCategoryId,
} from "@/lib/training/rbtResources";
import {
  useResourcePrefs, toggleBookmark, toggleComplete, markViewed,
} from "@/lib/training/rbtResourcePrefs";
import { TRAINING_ADMIN_ROLES } from "@/lib/navigationAccess";

// RBT Training Academy — experience-based, guided journey. Calm, mobile-first.

type TabKey = "journey" | "resources" | "signoffs" | "support";

function firstName(n?: string | null) { return n ? n.trim().split(/\s+/)[0] : "there"; }
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function OSRBTTrainingAcademy() {
  const { user, roles } = useAuth();
  const name = firstName((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0]);
  const isAdmin = roles.some((r) => TRAINING_ADMIN_ROLES.includes(r as never));

  const [assignedId, setAssignedId] = useState<RBTPathId>("certified_no_experience");
  const [tab, setTab] = useState<TabKey>("journey");

  const path = useMemo(
    () => RBT_PATHS.find((p) => p.id === assignedId) ?? RBT_PATHS[0],
    [assignedId],
  );
  const stats = useMemo(() => pathStats(path), [path]);

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 pb-24 pt-5 md:px-6 md:pt-8">
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <Link to="/rbt" className="hover:text-foreground transition-colors">RBT</Link>
          <ChevronRight className="size-3" />
          <span>Training Academy</span>
        </div>

        <header className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">RBT Training Academy</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {greeting()}, {name}.
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            A guided, experience-based journey. Pick the path that matches you — every path starts
            with <span className="text-foreground font-medium">Welcome to Blossom for RBTs</span>.
          </p>

          <div className="mt-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Your path</p>
            <TrackSelector value={assignedId} onChange={setAssignedId} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Stat label="Assigned path" value={path.label} />
            <Stat label="Readiness" value={`${stats.readiness}%`} tone={stats.fieldReady ? "good" : stats.readiness >= 60 ? "warn" : "neutral"} />
            <Stat label="Modules" value={`${stats.completed}/${stats.total}`} />
            <Stat label="Signoffs" value={`${stats.signedCount}/${stats.signoffTotal}`} />
          </div>

          <div className="mt-4">
            <ProgressBar value={stats.readiness} />
            <p className="mt-2 text-xs text-muted-foreground">
              Required progress · {stats.requiredDone} of {stats.requiredTotal} required modules complete.
            </p>
          </div>

          <ReadinessBanner ready={stats.fieldReady} />
        </header>

        {stats.nextModule && <NextActionCard module={stats.nextModule} />}

        <Ownership />

        <Tabs value={tab} onChange={setTab} />

        {tab === "journey" && <JourneyTab path={path} />}
        {tab === "resources" && (
          <ResourcesTab isAdmin={isAdmin} path={path} currentModule={stats.nextModule ?? null} />
        )}
        {tab === "signoffs" && <SignoffsTab signoffs={path.signoffs} />}
        {tab === "support" && <SupportTab />}
      </div>
    </OSShell>
  );
}

function TrackSelector({ value, onChange }: { value: RBTPathId; onChange: (v: RBTPathId) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {RBT_PATHS.map((p) => {
        const active = p.id === value;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            className={cn(
              "group flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition",
              active
                ? "border-primary/40 bg-primary/5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.12)]"
                : "border-border/70 bg-card hover:border-border hover:-translate-y-0.5",
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-medium text-foreground">{p.label}</span>
              {active && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <CheckCircle2 className="size-3" /> Assigned
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{p.tagline}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Est. {p.estWeeks}</p>
          </button>
        );
      })}
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "good" | "warn" | "neutral" }) {
  const toneCls =
    tone === "good" ? "text-emerald-600 dark:text-emerald-400" :
    tone === "warn" ? "text-amber-600 dark:text-amber-400" :
    "text-foreground";
  return (
    <div className="rounded-xl border border-border/70 bg-card/60 p-3">
      <p className="text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn("mt-1 truncate text-sm font-semibold tabular-nums", toneCls)}>{value}</p>
    </div>
  );
}

function ReadinessBanner({ ready }: { ready: boolean }) {
  return (
    <div
      className={cn(
        "mt-5 flex items-start gap-3 rounded-xl border p-3.5",
        ready
          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
          : "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300",
      )}
    >
      {ready ? <ShieldCheck className="size-4 mt-0.5 shrink-0" /> : <AlertCircle className="size-4 mt-0.5 shrink-0" />}
      <p className="text-xs leading-relaxed">
        {ready ? (
          <>You are <span className="font-semibold">field-ready for independent assignment</span>. Your Lead RBT Trainer has signed off.</>
        ) : (
          <>RBTs are <span className="font-semibold">not eligible for independent client assignment</span> until all required modules are complete and a Lead RBT Trainer + BCBA signoff is recorded.</>
        )}
      </p>
    </div>
  );
}

function NextActionCard({ module: m }: { module: RBTModule }) {
  const resume = m.status === "in_progress";
  return (
    <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.08] via-card to-card p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_12px_32px_-16px_oklch(0.2_0.02_260/0.12)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
          <PlayCircle className="size-3.5" /> Next required action
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" /> {resume && m.progress ? `${Math.max(1, Math.round(m.minutes * (1 - m.progress / 100)))} min left` : `${m.minutes} min`}
        </span>
      </div>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">{m.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{m.summary}</p>
      {resume && typeof m.progress === "number" && (
        <div className="mt-3"><ProgressBar value={m.progress} /></div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          {resume ? "Resume" : "Start"} <ArrowRight className="size-4" />
        </button>
        <span className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border/70 bg-secondary px-3 text-xs font-medium text-secondary-foreground">
          <TypeIcon type={m.type} className="size-3.5" /> {m.type}
        </span>
      </div>
    </section>
  );
}

function Ownership() {
  return (
    <section className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <OwnerCard icon={Compass} role={RBT_OWNERSHIP.leadTrainer.name} name={RBT_OWNERSHIP.leadTrainer.placeholder} note={RBT_OWNERSHIP.leadTrainer.role} />
        <OwnerCard icon={UserCircle2} role={RBT_OWNERSHIP.bcba.name} name={RBT_OWNERSHIP.bcba.placeholder} note={RBT_OWNERSHIP.bcba.role} />
      </div>
      <Link
        to="/training/rbt-readiness"
        className="flex items-center justify-between rounded-2xl border border-border/70 bg-secondary/50 p-4 text-sm transition hover:bg-muted"
      >
        <span className="flex items-center gap-2 font-medium text-foreground">
          <ShieldCheck className="size-4 text-primary" />
          Trainer & Scheduling · RBT Readiness Board
        </span>
        <ArrowRight className="size-4 text-muted-foreground" />
      </Link>
    </section>
  );
}

function OwnerCard({ icon: Icon, role, name, note }: { icon: React.ComponentType<{ className?: string }>; role: string; name: string; note: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4">
      <div className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{role}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
    </div>
  );
}

function Tabs({ value, onChange }: { value: TabKey; onChange: (v: TabKey) => void }) {
  const tabs: { v: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { v: "journey",   label: "Journey",   icon: GraduationCap },
    { v: "resources", label: "Resources", icon: BookOpen },
    { v: "signoffs",  label: "Signoffs",  icon: ClipboardCheck },
    { v: "support",   label: "Support",   icon: LifeBuoy },
  ];
  return (
    <div className="sticky top-0 z-10 -mx-1 overflow-x-auto rounded-2xl border border-border/70 bg-card/80 p-1 backdrop-blur">
      <div className="flex gap-1">
        {tabs.map((t) => {
          const active = value === t.v;
          const Icon = t.icon;
          return (
            <button
              key={t.v}
              type="button"
              onClick={() => onChange(t.v)}
              className={cn(
                "inline-flex flex-1 min-w-[110px] items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition",
                active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-3.5" /> {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function JourneyTab({ path }: { path: RBTPath }) {
  return (
    <section className="space-y-5">
      {path.phases.map((phase, idx) => {
        const completed = phase.modules.filter((m) => m.status === "completed").length;
        const pct = phase.modules.length === 0 ? 0 : Math.round((completed / phase.modules.length) * 100);
        return (
          <div key={phase.id} className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_4px_16px_-12px_oklch(0.2_0.02_260/0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Phase {idx}</p>
                <h3 className="mt-0.5 text-base font-semibold tracking-tight text-foreground">{phase.title.replace(/^Phase \d+ · /, "")}</h3>
                <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{phase.description}</p>
              </div>
              <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                {completed}/{phase.modules.length} · {pct}%
              </span>
            </div>

            <ol className="relative mt-4 space-y-2">
              <span aria-hidden className="absolute left-[19px] top-2 bottom-2 w-px bg-border/70" />
              {phase.modules.map((m, i) => (
                <ModuleRow key={m.id} module={m} index={i + 1} />
              ))}
            </ol>
          </div>
        );
      })}
    </section>
  );
}

function ModuleRow({ module: m, index }: { module: RBTModule; index: number }) {
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
      <span className={cn("absolute left-2 top-3 grid size-6 place-items-center rounded-full border bg-card", dotCls)}>
        {m.status === "completed" ? <CheckCircle2 className="size-3.5" />
          : m.status === "locked" ? <Lock className="size-3" />
          : <span className="text-[10px] font-semibold tabular-nums">{index}</span>}
      </span>
      <div
        className={cn(
          "rounded-xl border border-border/70 bg-card/60 p-3 transition",
          isLocked ? "opacity-60" : "hover:border-border",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-medium text-foreground">{m.title}</p>
              {m.required && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Required</span>}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{m.summary}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {m.minutes} min</span>
              <span className="inline-flex items-center gap-1"><TypeIcon type={m.type} className="size-3" /> {m.type}</span>
              <span>·</span>
              <span>{statusLabel}</span>
            </div>
            {m.status === "in_progress" && typeof m.progress === "number" && (
              <div className="mt-2"><ProgressBar value={m.progress} /></div>
            )}
            <ModuleResources moduleId={m.id} />
          </div>
          {!isLocked && (
            <button
              type="button"
              className="hidden shrink-0 items-center gap-1 rounded-lg border border-border/70 bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground transition hover:bg-muted sm:inline-flex"
            >
              {m.status === "completed" ? "Review" : m.status === "in_progress" ? "Resume" : "Start"}
              <ChevronRight className="size-3" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function ModuleResources({ moduleId }: { moduleId: string }) {
  const all = useRBTResources();
  const attached = useMemo(() => getResourcesForModule(all, moduleId), [all, moduleId]);
  if (attached.length === 0) return null;
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {attached.map((r) => (
        <ResourceChip key={r.id} resource={r} />
      ))}
    </div>
  );
}

function ResourceChip({ resource }: { resource: RBTResource }) {
  const Icon = resourceIcon(resource.type);
  const isExternal = !!resource.url && /^https?:\/\//.test(resource.url);
  const content = (
    <>
      <Icon className="size-3" />
      <span className="truncate max-w-[180px]">{resource.title}</span>
      {isExternal && <ExternalLink className="size-3 opacity-60" />}
    </>
  );
  const cls = "inline-flex items-center gap-1 rounded-full border border-border/70 bg-secondary/60 px-2 py-0.5 text-[11px] font-medium text-foreground transition hover:bg-muted";
  if (!resource.url) return <span className={cls} title={resource.description}>{content}</span>;
  if (isExternal) return <a className={cls} href={resource.url} target="_blank" rel="noreferrer" title={resource.description}>{content}</a>;
  return <Link className={cls} to={resource.url} title={resource.description}>{content}</Link>;
}

function ResourcesTab({ isAdmin, path }: { isAdmin: boolean; path: RBTPath }) {
  const all = useRBTResources();
  const [category, setCategory] = useState<"all" | RBTResourceCategoryId>("all");
  const [trackFilter, setTrackFilter] = useState<"all" | "this" | RBTPathId>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | RBTResourceType>("all");
  const [requiredOnly, setRequiredOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<RBTResource | null>(null);
  const [creating, setCreating] = useState(false);

  const pathModuleIds = useMemo(
    () => new Set(path.phases.flatMap((p) => p.modules.map((m) => m.id))),
    [path],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (requiredOnly && !r.required) return false;
      if (trackFilter !== "all") {
        const tracks = r.tracks && r.tracks.length > 0 ? r.tracks : null;
        if (trackFilter === "this") {
          // Show if academy-wide, attached to this path's modules, or explicitly visible to this track.
          const targetTrack = path.id;
          const trackOk = !tracks || tracks.includes(targetTrack);
          const moduleOk = r.moduleIds.length === 0 || r.moduleIds.some((id) => pathModuleIds.has(id));
          if (!trackOk && !moduleOk) return false;
        } else if (tracks && !tracks.includes(trackFilter)) {
          return false;
        }
      }
      if (q) {
        const hay = [r.title, r.description, r.type, ...(r.tags ?? [])].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, category, typeFilter, requiredOnly, trackFilter, query, pathModuleIds, path.id]);

  // Group by category for cleaner browsing when no specific category selected.
  const grouped = useMemo(() => {
    if (category !== "all") return null;
    const map = new Map<RBTResourceCategoryId | "_uncat", RBTResource[]>();
    for (const r of filtered) {
      const k = (r.category ?? "_uncat") as RBTResourceCategoryId | "_uncat";
      const arr = map.get(k) ?? [];
      arr.push(r);
      map.set(k, arr);
    }
    return RBT_RESOURCE_CATEGORIES
      .map((c) => ({ id: c.id, label: c.label, description: c.description, items: map.get(c.id) ?? [] }))
      .filter((g) => g.items.length > 0)
      .concat(
        map.has("_uncat")
          ? [{ id: "_uncat" as never, label: "Other", description: "Uncategorized", items: map.get("_uncat") ?? [] }]
          : [],
      );
  }, [filtered, category]);

  return (
    <section className="space-y-4">
      {/* Search + admin button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources, tags, types…"
            className="h-9 w-full rounded-xl border border-border/70 bg-card pl-8 pr-3 text-sm outline-none transition focus:border-primary/60"
          />
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="size-3.5" /> Add resource
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border/70 bg-card p-1">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={cn(
            "rounded-lg px-2.5 py-1 text-[11px] font-medium transition",
            category === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
          )}
        >All categories</button>
        {RBT_RESOURCE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[11px] font-medium transition",
              category === c.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
            title={c.description}
          >{c.label}</button>
        ))}
      </div>

      {/* Secondary filters: track + type + required */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={trackFilter}
          onChange={(e) => setTrackFilter(e.target.value as typeof trackFilter)}
          className="h-8 rounded-lg border border-border/70 bg-card px-2 text-[11px] outline-none"
        >
          <option value="all">All tracks</option>
          <option value="this">This track ({TRACK_LABELS[path.id]})</option>
          {(Object.keys(TRACK_LABELS) as RBTPathId[]).map((id) => (
            <option key={id} value={id}>{TRACK_LABELS[id]}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="h-8 rounded-lg border border-border/70 bg-card px-2 text-[11px] outline-none"
        >
          <option value="all">All types</option>
          {RBT_RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/70 bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground">
          <input type="checkbox" checked={requiredOnly} onChange={(e) => setRequiredOnly(e.target.checked)} />
          Required only
        </label>
        <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
          {filtered.length} {filtered.length === 1 ? "resource" : "resources"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card p-10 text-center text-sm text-muted-foreground">
          No resources match this filter yet.
        </div>
      ) : grouped ? (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">{g.label}</h3>
                <span className="text-[11px] text-muted-foreground tabular-nums">{g.items.length}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {g.items.map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    isAdmin={isAdmin}
                    onEdit={() => setEditing(r)}
                    onRemove={() => {
                      if (confirm(`Remove "${r.title}"?${r.seeded ? " (Seeded resources are hidden — they can be restored later.)" : ""}`)) {
                        removeResource(r.id);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              isAdmin={isAdmin}
              onEdit={() => setEditing(r)}
              onRemove={() => {
                if (confirm(`Remove "${r.title}"?${r.seeded ? " (Seeded resources are hidden — they can be restored later.)" : ""}`)) {
                  removeResource(r.id);
                }
              }}
            />
          ))}
        </div>
      )}

      {(creating || editing) && (
        <ResourceEditor
          initial={editing ?? undefined}
          path={path}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}
    </section>
  );
}

function ResourceCard({
  resource, isAdmin, onEdit, onRemove,
}: { resource: RBTResource; isAdmin: boolean; onEdit: () => void; onRemove: () => void }) {
  const Icon = resourceIcon(resource.type);
  const isExternal = !!resource.url && /^https?:\/\//.test(resource.url);
  const Wrapper: React.ElementType = resource.url ? (isExternal ? "a" : Link) : "div";
  const wrapperProps = resource.url
    ? isExternal
      ? { href: resource.url, target: "_blank", rel: "noreferrer" }
      : { to: resource.url }
    : {};
  return (
    <div className="group relative rounded-2xl border border-border/70 bg-card p-4 transition hover:border-border">
      <Wrapper
        {...(wrapperProps as Record<string, unknown>)}
        className="flex items-start gap-3"
      >
        <div className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium text-foreground">{resource.title}</p>
            {isExternal && <ExternalLink className="size-3 text-muted-foreground" />}
            {resource.required && (
              <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Required
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {resource.type}
            {typeof resource.minutes === "number" && ` · ${resource.minutes} min`}
            {resource.moduleIds.length > 0 && ` · ${resource.moduleIds.length} module${resource.moduleIds.length === 1 ? "" : "s"}`}
            {resource.tracks && resource.tracks.length > 0 && ` · ${resource.tracks.length === 1 ? TRACK_LABELS[resource.tracks[0]] : `${resource.tracks.length} tracks`}`}
          </p>
          {resource.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{resource.description}</p>
          )}
          {resource.tags && resource.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {resource.tags.slice(0, 5).map((t) => (
                <span key={t} className="rounded-full bg-secondary/70 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </Wrapper>
      {isAdmin && (
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            className="grid size-7 place-items-center rounded-lg border border-border/70 bg-card text-muted-foreground hover:text-foreground"
            aria-label="Edit"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="grid size-7 place-items-center rounded-lg border border-border/70 bg-card text-muted-foreground hover:text-destructive"
            aria-label="Remove"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function ResourceEditor({
  initial, path, onClose,
}: { initial?: RBTResource; path: RBTPath; onClose: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<RBTResourceType>(initial?.type ?? "SOP");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [minutes, setMinutes] = useState<string>(
    typeof initial?.minutes === "number" ? String(initial.minutes) : "",
  );
  const [moduleIds, setModuleIds] = useState<string[]>(initial?.moduleIds ?? []);
  const [category, setCategory] = useState<RBTResourceCategoryId | "">(initial?.category ?? "");
  const [required, setRequired] = useState<boolean>(!!initial?.required);
  const [tagsText, setTagsText] = useState<string>((initial?.tags ?? []).join(", "));
  const [tracks, setTracks] = useState<RBTPathId[]>(initial?.tracks ?? []);

  const allModules = useMemo(
    () => path.phases.flatMap((p) => p.modules.map((m) => ({ id: m.id, title: m.title, phase: p.title }))),
    [path],
  );

  function toggleModule(id: string) {
    setModuleIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  function save() {
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      type,
      url: url.trim() || undefined,
      description: description.trim() || undefined,
      body: body.trim() || undefined,
      moduleIds,
      minutes: minutes ? Math.max(0, parseInt(minutes, 10) || 0) : undefined,
      category: category || undefined,
      required: required || undefined,
      tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
      tracks: tracks.length ? tracks : undefined,
    };
    if (initial) updateResource(initial.id, payload);
    else addResource(payload);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border/70 p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {initial ? "Edit resource" : "New resource"}
            </p>
            <h3 className="text-base font-semibold">{initial ? initial.title : "Add a resource"}</h3>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-muted">
            <X className="size-4" />
          </button>
        </header>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4">
          <Field2 label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Data Collection quick guide" />
          </Field2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field2 label="Type">
              <select value={type} onChange={(e) => setType(e.target.value as RBTResourceType)} className={inputCls}>
                {RBT_RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field2>
            <Field2 label="Minutes (optional)">
              <input value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/[^0-9]/g, ""))} className={inputCls} placeholder="e.g. 8" inputMode="numeric" />
            </Field2>
          </div>
          <Field2 label="URL or internal path">
            <input value={url} onChange={(e) => setUrl(e.target.value)} className={inputCls} placeholder="https://… or /resources/…" />
          </Field2>
          <Field2 label="Description (one line)">
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder="What the resource covers" />
          </Field2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field2 label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value as RBTResourceCategoryId | "")} className={inputCls}>
                <option value="">— None —</option>
                {RBT_RESOURCE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field2>
            <Field2 label="Required vs optional">
              <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/70 bg-card px-3 text-sm">
                <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
                Required reading
              </label>
            </Field2>
          </div>
          <Field2 label="Tags (comma-separated)">
            <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} className={inputCls} placeholder="e.g. ethics, prompting, video" />
          </Field2>
          <Field2 label={`Track visibility (${tracks.length === 0 ? "all tracks" : `${tracks.length} selected`})`}>
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-border/70 bg-secondary/40 p-2">
              {(Object.keys(TRACK_LABELS) as RBTPathId[]).map((id) => (
                <label key={id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-xs hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={tracks.includes(id)}
                    onChange={() => setTracks((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])}
                  />
                  <span className="flex-1 truncate">{TRACK_LABELS[id]}</span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Leave empty for all tracks.</p>
          </Field2>
          {(type === "Trainer Note" || type === "Quiz" || type === "Mock Form") && (
            <Field2 label="Body / notes (optional)">
              <textarea value={body} onChange={(e) => setBody(e.target.value)} className={cn(inputCls, "min-h-[100px] py-2")} placeholder="Notes, questions, or instructions" />
            </Field2>
          )}
          <Field2 label={`Attach to modules (${moduleIds.length} selected)`}>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border/70 bg-secondary/40 p-2">
              {allModules.map((m) => (
                <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-xs hover:bg-muted">
                  <input type="checkbox" checked={moduleIds.includes(m.id)} onChange={() => toggleModule(m.id)} />
                  <span className="flex-1 truncate">{m.title}</span>
                  <span className="text-[10px] text-muted-foreground">{m.phase.replace(/^Phase \d+ · /, "")}</span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Leave empty for academy-wide resources.</p>
          </Field2>
        </div>
        <footer className="flex justify-end gap-2 border-t border-border/70 p-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-border/70 bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted">Cancel</button>
          <button type="button" onClick={save} disabled={!title.trim()} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
            {initial ? "Save changes" : "Add resource"}
          </button>
        </footer>
      </div>
    </div>
  );
}

const inputCls = "h-9 w-full rounded-lg border border-border/70 bg-card px-3 text-sm outline-none transition focus:border-primary/60";

function Field2({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function resourceIcon(type: RBTResourceType): React.ComponentType<{ className?: string }> {
  switch (type) {
    case "YouTube Video":  return Youtube;
    case "Internal Video": return Video;
    case "Meeting Recording": return Video;
    case "SOP":            return FileText;
    case "Policy":         return ShieldCheck;
    case "How-To":         return BookOpen;
    case "Checklist":      return ListChecks;
    case "Template":       return FileSpreadsheet;
    case "Worksheet":      return FileSpreadsheet;
    case "Quiz":           return ClipboardCheck;
    case "Mock Form":      return FileSpreadsheet;
    case "Trainer Note":   return StickyNote;
    case "PDF":            return FileBadge;
    case "Research Article": return BookMarked;
  }
}

function SignoffsTab({ signoffs }: { signoffs: SignoffItem[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4">
        <Award className="size-4 mt-0.5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Signoffs are recorded by your Lead RBT Trainer and BCBA. All required signoffs must be
          complete before you can be assigned to clients independently.
        </p>
      </div>
      <ul className="space-y-2">
        {signoffs.map((s) => (
          <li key={s.id} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4">
            <SignoffDot status={s.status} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                {s.required && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Required</span>}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Owner · {s.owner}</p>
              {s.signedBy && s.signedOn && (
                <p className="mt-0.5 text-xs text-muted-foreground">Signed by {s.signedBy} · {s.signedOn}</p>
              )}
            </div>
            <SignoffBadge status={s.status} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function SignoffDot({ status }: { status: SignoffItem["status"] }) {
  const cls =
    status === "signed" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
    status === "scheduled" ? "border-primary/40 bg-primary/10 text-primary" :
    "border-border/70 bg-muted text-muted-foreground";
  return (
    <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border", cls)}>
      {status === "signed" ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3" />}
    </span>
  );
}

function SignoffBadge({ status }: { status: SignoffItem["status"] }) {
  const map = {
    signed:    { label: "Signed",    cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
    scheduled: { label: "Scheduled", cls: "bg-primary/10 text-primary" },
    pending:   { label: "Pending",   cls: "bg-muted text-muted-foreground" },
  } as const;
  const m = map[status];
  return <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-medium", m.cls)}>{m.label}</span>;
}

function SupportTab() {
  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-border/70 bg-card p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-muted-foreground" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Stuck on something?</p>
        </div>
        <p className="mt-2 text-sm text-foreground">You are never on your own. Reach out — that's why we're here.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <SupportLink to="/ai/assistant" icon={Sparkles} label="Ask Blossom AI" />
          <SupportLink to="/rbt/help" icon={LifeBuoy} label="Get help" />
          <SupportLink to="/rbt/messages?focus=training" icon={MessageSquare} label="Contact training" />
        </div>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-5">
        <p className="text-sm font-medium text-foreground">Common questions</p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• How do I switch my assigned path? — Talk to your Lead RBT Trainer.</li>
          <li>• Who signs off field readiness? — Your Lead RBT Trainer, after BCBA observation.</li>
          <li>• When can I take clients independently? — After 100% required progress + all signoffs.</li>
        </ul>
      </div>
    </section>
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

function TypeIcon({ type, className }: { type: ModuleType; className?: string }) {
  const map: Record<ModuleType, React.ComponentType<{ className?: string }>> = {
    SOP: FileText, Video: Video, Walkthrough: PlayCircle, Checklist: ListChecks,
    Overview: GraduationCap, Shadowing: Compass, Assessment: ClipboardCheck,
    "Role Play": Compass, Evaluation: ClipboardCheck, Signoff: ClipboardCheck,
  };
  const Icon = map[type] ?? BookOpen;
  return <Icon className={className} />;
}

function SupportLink({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
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