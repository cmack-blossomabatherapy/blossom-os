import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap, Sparkles, ChevronRight, Search, Plus, BookOpen,
  ClipboardList, ShieldCheck, Award, PlayCircle, FileText, CheckSquare,
  Eye, Users, Pencil, Workflow, Clock, ArrowRight, CheckCircle2,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { HRIntegrationStatusStrip } from "@/components/hr/HRIntegrationStatusStrip";
import { IntegrationReadinessSummary } from "@/components/hr/IntegrationReadinessSummary";
import {
  ReadinessFilterChips,
  useIntegrationCatalogStatus,
  rowMatchesReadinessFilter,
  type OnboardingReadinessRow,
  type ReadinessFilter,
} from "@/components/hr/IntegrationReadinessPanel";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/* ---------------- types ---------------- */
type ModuleType =
  | "training" | "video" | "sop" | "quiz"
  | "shadowing" | "meeting" | "reflection" | "task";

interface Track   { id: string; name: string; description: string | null; }
interface Phase   { id: string; track_id: string; name: string; position: number; tagline: string | null; }
interface Week    { id: string; phase_id: string; week_number: number; title: string; }
interface ModuleRow {
  id: string; week_id: string; position: number; title: string;
  module_type: ModuleType; duration_label: string | null;
  is_required: boolean; is_archived: boolean;
}
interface Certificate { id: string; track_id: string; code: string; name: string; description: string | null; position: number; awarded_after_phase_id: string | null; }
interface Enrollment  { id: string; track_id: string; employee_id: string; status: string; current_week_id: string | null; }
interface OnboardingRow extends OnboardingReadinessRow { id: string; employee_id: string; status: string }

/* ---------------- atoms (Blossom OS) ---------------- */
type Tone = "ok" | "warn" | "crit" | "muted";

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn(
      "rounded-2xl border border-border/70 bg-card",
      "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]",
      className,
    )}>{children}</div>
  );
}
function Pill({ tone = "muted", children }: { tone?: Tone; children: React.ReactNode }) {
  const cls = tone === "crit"
    ? "bg-destructive/10 text-destructive border-destructive/20"
    : tone === "warn"
    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
    : tone === "ok"
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
    : "bg-muted text-muted-foreground border-border/70";
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", cls)}>{children}</span>;
}
function Empty({ icon: Icon, title, hint }: { icon: React.ElementType; title: string; hint?: string }) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-3 h-10 w-10 rounded-2xl bg-muted grid place-items-center">
        <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium tracking-tight">{title}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

const TYPE_ICON: Record<ModuleType, React.ElementType> = {
  training: GraduationCap, video: PlayCircle, sop: FileText, quiz: ClipboardList,
  shadowing: Eye, meeting: Users, reflection: Pencil, task: CheckSquare,
};

function weekNumberFromId(id: string | null, weeks: Week[]) {
  if (!id) return null;
  return weeks.find((w) => w.id === id)?.week_number ?? null;
}

/* ---------------- data hook ---------------- */
function useAcademyData() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [tr, ph, wk, md, ct, en, ob] = await Promise.all([
        supabase.from("academy_tracks").select("id,name,description").order("name"),
        supabase.from("academy_phases").select("id,track_id,name,position,tagline").order("position"),
        supabase.from("academy_weeks").select("id,phase_id,week_number,title").order("week_number"),
        supabase.from("academy_modules").select("id,week_id,position,title,module_type,duration_label,is_required,is_archived").eq("is_archived", false).order("position"),
        supabase.from("academy_certificates").select("id,track_id,code,name,description,position,awarded_after_phase_id").order("position"),
        supabase.from("academy_enrollments").select("id,track_id,employee_id,status,current_week_id"),
        supabase.from("employee_onboarding").select("id,employee_id,status,viventium_status,viventium_synced_at,stellar_status,stellar_synced_at,centralreach_status,centralreach_synced_at"),
      ]);
      if (cancelled) return;
      setTracks((tr.data ?? []) as Track[]);
      setPhases((ph.data ?? []) as Phase[]);
      setWeeks((wk.data ?? []) as Week[]);
      setModules((md.data ?? []) as ModuleRow[]);
      setCertificates((ct.data ?? []) as Certificate[]);
      setEnrollments((en.data ?? []) as Enrollment[]);
      setOnboarding((ob.data ?? []) as OnboardingRow[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { tracks, phases, weeks, modules, certificates, enrollments, onboarding, loading };
}

/* ---------------- page ---------------- */
const HR_TRACK = "HR Admin Assistant";
const HR_CATEGORIES = [
  "Foundation", "Onboarding Operations", "Employee Support",
  "Training Operations", "Evaluations & Growth", "Systems & Tools", "Resource Management",
] as const;

export default function OSHRTrainingAcademy() {
  const data = useAcademyData();
  const [query, setQuery] = useState("");
  const [openTrack, setOpenTrack] = useState<string | null>(null);
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>("all");
  const { catalog: readinessCatalog } = useIntegrationCatalogStatus();

  const readinessCounts = useMemo(() => ({
    all: data.onboarding.length,
    missing_connected: data.onboarding.filter((o) => rowMatchesReadinessFilter(o, readinessCatalog, "missing_connected")).length,
    missing_synced: data.onboarding.filter((o) => rowMatchesReadinessFilter(o, readinessCatalog, "missing_synced")).length,
    missing_any: data.onboarding.filter((o) => rowMatchesReadinessFilter(o, readinessCatalog, "missing_any")).length,
  }), [data.onboarding, readinessCatalog]);

  const filteredOnboarding = useMemo(() => {
    if (readinessFilter === "all") return data.onboarding;
    return data.onboarding.filter((o) => rowMatchesReadinessFilter(o, readinessCatalog, readinessFilter));
  }, [data.onboarding, readinessCatalog, readinessFilter]);

  const hrTrack = data.tracks.find((t) => t.name === HR_TRACK);
  const otherTracks = data.tracks.filter((t) => t.name !== HR_TRACK);

  const weeksByPhase = useMemo(() => {
    const m = new Map<string, Week[]>();
    data.weeks.forEach((w) => {
      const a = m.get(w.phase_id) ?? [];
      a.push(w); m.set(w.phase_id, a);
    });
    return m;
  }, [data.weeks]);

  const modulesByWeek = useMemo(() => {
    const m = new Map<string, ModuleRow[]>();
    data.modules.forEach((mo) => {
      const a = m.get(mo.week_id) ?? [];
      a.push(mo); m.set(mo.week_id, a);
    });
    return m;
  }, [data.modules]);

  function trackStats(trackId: string) {
    const trackPhases = data.phases.filter((p) => p.track_id === trackId);
    let weeks = 0, modules = 0;
    trackPhases.forEach((p) => {
      const ws = weeksByPhase.get(p.id) ?? [];
      weeks += ws.length;
      ws.forEach((w) => { modules += (modulesByWeek.get(w.id) ?? []).length; });
    });
    const certs = data.certificates.filter((c) => c.track_id === trackId).length;
    const learners = data.enrollments.filter((e) => e.track_id === trackId).length;
    return { phases: trackPhases.length, weeks, modules, certs, learners };
  }

  const totals = useMemo(() => {
    const modulesTotal = data.modules.length;
    const learners = data.enrollments.length;
    const completed = data.enrollments.filter((e) => e.status === "completed").length;
    const overdue = 0; // no progress timestamps loaded; lightweight per spec
    return { modulesTotal, learners, completed, overdue, certs: data.certificates.length };
  }, [data]);

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        {/* header */}
        <header className="mb-6 flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
            <GraduationCap className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Training Academy</h1>
            <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
              Learning journeys, onboarding systems, operational training, and people support education for the HR Team.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Link to="/os/onboarding" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] text-foreground border border-border/70 bg-card hover:bg-muted transition-colors">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} /> Onboarding Journey
            </Link>
            <Link to="/training/manage" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] text-foreground border border-border/70 bg-card hover:bg-muted transition-colors">
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} /> Create journey
            </Link>
            <Link to="/training/manage" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] text-foreground border border-border/70 bg-card hover:bg-muted transition-colors">
              <BookOpen className="h-3.5 w-3.5" strokeWidth={1.75} /> Create module
            </Link>
            <Link to="/hr/training-certifications" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] text-foreground border border-border/70 bg-card hover:bg-muted transition-colors">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} /> Certifications
            </Link>
          </div>
        </header>

        <HRIntegrationStatusStrip className="mb-6" />

        {/* KPI strip — lightweight only */}
        <div className="grid gap-3 mb-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Kpi label="Active journeys"    value={data.loading ? "—" : data.tracks.length} />
          <Kpi label="Modules published"  value={data.loading ? "—" : totals.modulesTotal} />
          <Kpi label="Active learners"    value={data.loading ? "—" : totals.learners} />
          <Kpi label="Certifications"     value={data.loading ? "—" : totals.certs} />
          <Kpi label="Completed"          value={data.loading ? "—" : totals.completed} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* MAIN */}
          <div className="space-y-6 min-w-0">

            {/* Journeys */}
            <section>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <h2 className="text-base font-medium tracking-tight">HR Learning Journeys</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Structured paths owned by the HR Team. Drawn live from the Academy.</p>
                </div>
                <div className="relative w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search modules…"
                    className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted/60 border border-border/70 text-[12.5px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-transparent transition"
                  />
                </div>
              </div>

              {data.loading ? (
                <Card className="p-6"><p className="text-sm text-muted-foreground">Loading journeys…</p></Card>
              ) : !hrTrack && otherTracks.length === 0 ? (
                <Card className="p-6"><Empty icon={GraduationCap} title="No journeys yet." hint="Create your first HR learning journey to get started." /></Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {hrTrack && (
                    <JourneyCard
                      title={hrTrack.name}
                      tagline={hrTrack.description ?? "The foundation training for every HR Team member."}
                      category="Foundation"
                      isPrimary
                      stats={trackStats(hrTrack.id)}
                      onOpen={() => setOpenTrack(openTrack === hrTrack.id ? null : hrTrack.id)}
                      open={openTrack === hrTrack.id}
                    />
                  )}
                  {otherTracks.map((t) => (
                    <JourneyCard
                      key={t.id}
                      title={t.name}
                      tagline={t.description ?? "Operational training journey."}
                      category="Operations"
                      stats={trackStats(t.id)}
                      onOpen={() => setOpenTrack(openTrack === t.id ? null : t.id)}
                      open={openTrack === t.id}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Journey detail — accordion expansion */}
            {openTrack && (
              <JourneyDetail
                track={data.tracks.find((t) => t.id === openTrack)!}
                phases={data.phases.filter((p) => p.track_id === openTrack)}
                weeksByPhase={weeksByPhase}
                modulesByWeek={modulesByWeek}
                certificates={data.certificates.filter((c) => c.track_id === openTrack)}
                query={query}
              />
            )}

            {/* Module library — grouped by category (live from real modules) */}
            <section>
              <h2 className="text-base font-medium tracking-tight mb-3">HR Module Library</h2>
              <ModuleLibrary
                phases={data.phases.filter((p) => p.track_id === hrTrack?.id)}
                weeksByPhase={weeksByPhase}
                modulesByWeek={modulesByWeek}
                query={query}
                loading={data.loading}
              />
            </section>

            {/* Assigned Training */}
            <section>
              <h2 className="text-base font-medium tracking-tight mb-3">Assigned Training</h2>
              <Card className="p-6">
                {data.enrollments.length === 0 ? (
                  <Empty
                    icon={ClipboardList}
                    title="No journeys assigned yet."
                    hint="Assign the HR Admin Assistant journey to new hires to start tracking progress."
                  />
                ) : (
                  <ul className="divide-y divide-border/70">
                    {data.enrollments.slice(0, 8).map((e) => {
                      const track = data.tracks.find((t) => t.id === e.track_id);
                      const tone: Tone = e.status === "completed" ? "ok" : e.status === "in_progress" ? "warn" : "muted";
                      return (
                        <li key={e.id} className="py-2.5 flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium tracking-tight truncate">{track?.name ?? "Track"}</p>
                            <p className="text-[11.5px] text-muted-foreground">Week {weekNumberFromId(e.current_week_id, data.weeks) ?? "—"}</p>
                          </div>
                          <Pill tone={tone}>{e.status.replace("_", " ")}</Pill>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </section>

            {/* Certifications */}
            <section>
              <h2 className="text-base font-medium tracking-tight mb-3">Certifications</h2>
              {data.loading ? (
                <Card className="p-6"><p className="text-sm text-muted-foreground">Loading…</p></Card>
              ) : data.certificates.length === 0 ? (
                <Card className="p-6"><Empty icon={Award} title="No certifications defined yet." /></Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {data.certificates.map((c) => {
                    const track = data.tracks.find((t) => t.id === c.track_id);
                    return (
                      <Card key={c.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-xl bg-muted grid place-items-center shrink-0">
                            <Award className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13.5px] font-medium tracking-tight truncate">{c.name}</p>
                            <p className="text-[11.5px] text-muted-foreground truncate">{track?.name}</p>
                            {c.description && <p className="text-[12px] text-muted-foreground mt-1.5 line-clamp-2">{c.description}</p>}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT RAIL */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="p-5">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Management</h3>
              <nav className="space-y-1">
                {[
                  { label: "Create Journey",      to: "/training/manage" },
                  { label: "Create Module",       to: "/training/manage" },
                  { label: "Assign Training",     to: "/hr/training-center" },
                  { label: "Manage Certifications", to: "/hr/training-certifications" },
                  { label: "Role Visibility",     to: "/training/manage" },
                ].map((l) => (
                  <Link key={l.label} to={l.to} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px] hover:bg-muted transition-colors">
                    <span>{l.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  </Link>
                ))}
              </nav>
            </Card>

            <Card className="p-5">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Integration readiness</h3>
              <p className="text-[12px] text-muted-foreground mb-3">
                Training completions and onboarding records only sync when the provider is connected.
              </p>
              <ReadinessFilterChips
                value={readinessFilter}
                onChange={setReadinessFilter}
                counts={readinessCounts}
                className="mb-3"
              />
              <IntegrationReadinessSummary rows={filteredOnboarding} />
              <p className="mt-2 text-[10.5px] text-muted-foreground">
                {readinessFilter === "all"
                  ? `${data.onboarding.length} onboarding record${data.onboarding.length === 1 ? "" : "s"}`
                  : `${filteredOnboarding.length} of ${data.onboarding.length} record${data.onboarding.length === 1 ? "" : "s"} match this filter`}
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Continue learning</h3>
              </div>
              {data.enrollments.length === 0 ? (
                <p className="text-[12.5px] text-muted-foreground">Nothing in progress.</p>
              ) : (
                <ul className="space-y-1.5">
                  {data.enrollments.slice(0, 4).map((e) => {
                    const t = data.tracks.find((t) => t.id === e.track_id);
                    return (
                      <li key={e.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                        <span className="truncate">{t?.name}</span>
                        <span className="text-muted-foreground">W{weekNumberFromId(e.current_week_id, data.weeks) ?? "—"}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card className="p-5 bg-muted/40">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Workflow Guidance</h3>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "Review overdue onboarding training", to: "/hr/training-certifications" },
                  { label: "Complete incomplete HR journeys",    to: "/hr/new-hires" },
                  { label: "Renew certifications expiring soon", to: "/hr/compliance" },
                  { label: "Audit most-assigned modules",        to: "/hr/training-center" },
                  { label: "Check onboarding readiness",         to: "/hr/new-hires" },
                ].map((p) => (
                  <Link key={p.label} to={p.to} className="block w-full text-left rounded-lg px-2 py-1.5 text-[12.5px] text-muted-foreground hover:bg-card hover:text-foreground transition-colors">
                    {p.label}
                  </Link>
                ))}
              </div>
            </Card>

            {/* Suggested HR categories — not legacy, just navigation taxonomy */}
            <Card className="p-5">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">HR categories</h3>
              <div className="flex flex-wrap gap-1.5">
                {HR_CATEGORIES.map((c) => (
                  <Pill key={c} tone="muted">{c}</Pill>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </OSShell>
  );
}

/* ---------------- subcomponents ---------------- */

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight mt-1">{value}</p>
    </div>
  );
}

function JourneyCard({
  title, tagline, category, isPrimary, stats, onOpen, open,
}: {
  title: string; tagline: string; category: string; isPrimary?: boolean;
  stats: { phases: number; weeks: number; modules: number; certs: number; learners: number };
  onOpen: () => void; open: boolean;
}) {
  return (
    <Card className={cn("p-5 transition-all duration-200", open && "ring-1 ring-primary/30")}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "h-10 w-10 rounded-2xl grid place-items-center shrink-0",
          isPrimary ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}>
          <GraduationCap className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14.5px] font-medium tracking-tight">{title}</p>
            {isPrimary && <Pill tone="ok">Owned by HR</Pill>}
          </div>
          <p className="text-[12.5px] text-muted-foreground mt-1 line-clamp-2">{tagline}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
            <span>{stats.phases} phases</span>
            <span>· {stats.weeks} weeks</span>
            <span>· {stats.modules} modules</span>
            <span>· {stats.certs} certs</span>
            <span>· {stats.learners} learners</span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              {open ? "Hide modules" : "Open journey"}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
            <Link to="/training/manage" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] text-muted-foreground hover:bg-muted transition-colors">
              Edit
            </Link>
            <Pill tone="muted">{category}</Pill>
          </div>
        </div>
      </div>
    </Card>
  );
}

function JourneyDetail({
  track, phases, weeksByPhase, modulesByWeek, certificates, query,
}: {
  track: Track;
  phases: Phase[];
  weeksByPhase: Map<string, Week[]>;
  modulesByWeek: Map<string, ModuleRow[]>;
  certificates: Certificate[];
  query: string;
}) {
  const q = query.trim().toLowerCase();
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Journey detail</p>
          <p className="text-base font-medium tracking-tight">{track.name}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {certificates.map((c) => (
            <Pill key={c.id} tone="ok"><Award className="h-3 w-3" strokeWidth={2} />{c.name}</Pill>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {phases.map((p) => {
          const ws = weeksByPhase.get(p.id) ?? [];
          return (
            <div key={p.id} className="rounded-xl border border-border/70 bg-background">
              <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium tracking-tight">Phase {p.position}: {p.name}</p>
                  {p.tagline && <p className="text-[11.5px] text-muted-foreground mt-0.5">{p.tagline}</p>}
                </div>
                <span className="text-[11px] text-muted-foreground">{ws.length} week{ws.length === 1 ? "" : "s"}</span>
              </div>
              <div className="divide-y divide-border/70">
                {ws.map((w) => {
                  let mods = modulesByWeek.get(w.id) ?? [];
                  if (q) mods = mods.filter((m) => m.title.toLowerCase().includes(q));
                  return (
                    <div key={w.id} className="p-4">
                      <p className="text-[12.5px] font-medium tracking-tight mb-2">Week {w.week_number}: {w.title}</p>
                      {mods.length === 0 ? (
                        <p className="text-[11.5px] text-muted-foreground">No modules match.</p>
                      ) : (
                        <ul className="grid gap-1.5 sm:grid-cols-2">
                          {mods.map((m) => {
                            const Icon = TYPE_ICON[m.module_type] ?? FileText;
                            return (
                              <li key={m.id} className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.75} />
                                <span className="text-[12.5px] truncate flex-1">{m.title}</span>
                                {m.duration_label && <span className="text-[11px] text-muted-foreground">{m.duration_label}</span>}
                                {m.is_required && <CheckCircle2 className="h-3 w-3 text-muted-foreground/60" strokeWidth={2} />}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ModuleLibrary({
  phases, weeksByPhase, modulesByWeek, query, loading,
}: {
  phases: Phase[];
  weeksByPhase: Map<string, Week[]>;
  modulesByWeek: Map<string, ModuleRow[]>;
  query: string;
  loading: boolean;
}) {
  const q = query.trim().toLowerCase();

  // Flatten phases → counts
  const groups = phases.map((p) => {
    const ws = weeksByPhase.get(p.id) ?? [];
    const mods: ModuleRow[] = [];
    ws.forEach((w) => mods.push(...(modulesByWeek.get(w.id) ?? [])));
    const filtered = q ? mods.filter((m) => m.title.toLowerCase().includes(q)) : mods;
    return { phase: p, total: mods.length, sample: filtered.slice(0, 5) };
  });

  if (loading) {
    return <Card className="p-6"><p className="text-sm text-muted-foreground">Loading modules…</p></Card>;
  }
  if (groups.length === 0) {
    return <Card className="p-6"><Empty icon={BookOpen} title="No HR modules yet." hint="Modules from the HR Admin Assistant track will appear here." /></Card>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {groups.map(({ phase, total, sample }) => (
        <Card key={phase.id} className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-medium tracking-tight">{phase.name}</p>
            <span className="text-[11px] text-muted-foreground">{total} modules</span>
          </div>
          {sample.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">No matching modules.</p>
          ) : (
            <ul className="space-y-1">
              {sample.map((m) => {
                const Icon = TYPE_ICON[m.module_type] ?? FileText;
                return (
                  <li key={m.id} className="flex items-center gap-2 text-[12.5px]">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{m.title}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}

/* Keep these imports retained for future affordances */
void Workflow;