import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap, Sparkles, ChevronRight, Search, Plus, BookOpen,
  ClipboardList, ShieldCheck, Award, PlayCircle, FileText, CheckSquare,
  Eye, Users, Pencil, Clock, ArrowRight, CheckCircle2,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Card, Pill, Empty, KpiCard, type Tone } from "./_PayrollAtoms";

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

// Card, Pill, Empty, KpiCard, PageHeader, HeaderBtn imported from _PayrollAtoms

const TYPE_ICON: Record<ModuleType, React.ElementType> = {
  training: GraduationCap, video: PlayCircle, sop: FileText, quiz: ClipboardList,
  shadowing: Eye, meeting: Users, reflection: Pencil, task: CheckSquare,
};

function weekNumberFromId(id: string | null, weeks: Week[]) {
  if (!id) return null;
  return weeks.find((w) => w.id === id)?.week_number ?? null;
}

function useAcademyData() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [tr, ph, wk, md, ct, en] = await Promise.all([
        supabase.from("academy_tracks").select("id,name,description").order("name"),
        supabase.from("academy_phases").select("id,track_id,name,position,tagline").order("position"),
        supabase.from("academy_weeks").select("id,phase_id,week_number,title").order("week_number"),
        supabase.from("academy_modules").select("id,week_id,position,title,module_type,duration_label,is_required,is_archived").eq("is_archived", false).order("position"),
        supabase.from("academy_certificates").select("id,track_id,code,name,description,position,awarded_after_phase_id").order("position"),
        supabase.from("academy_enrollments").select("id,track_id,employee_id,status,current_week_id"),
      ]);
      if (cancelled) return;
      setTracks((tr.data ?? []) as Track[]);
      setPhases((ph.data ?? []) as Phase[]);
      setWeeks((wk.data ?? []) as Week[]);
      setModules((md.data ?? []) as ModuleRow[]);
      setCertificates((ct.data ?? []) as Certificate[]);
      setEnrollments((en.data ?? []) as Enrollment[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { tracks, phases, weeks, modules, certificates, enrollments, loading };
}

const PAYROLL_TRACK = "Payroll Coordinator";
const PAYROLL_CATEGORIES = [
  "Start Here", "Payroll Operations", "Readiness & Processing",
  "PTO & Attendance", "Communication & Support", "Benefits & Deductions",
  "Compliance", "Blossom OS",
] as const;

export default function OSPayrollTrainingAcademy() {
  const data = useAcademyData();
  const [query, setQuery] = useState("");
  const [openTrack, setOpenTrack] = useState<string | null>(null);

  const payrollTrack = data.tracks.find((t) => t.name === PAYROLL_TRACK);
  const payrollPhases = payrollTrack ? data.phases.filter((p) => p.track_id === payrollTrack.id) : [];
  const payrollPhaseIds = new Set(payrollPhases.map((p) => p.id));
  const payrollWeeks = data.weeks.filter((w) => payrollPhaseIds.has(w.phase_id));
  const payrollWeekIds = new Set(payrollWeeks.map((w) => w.id));
  const payrollModules = data.modules.filter((m) => payrollWeekIds.has(m.week_id));
  const payrollCerts = payrollTrack ? data.certificates.filter((c) => c.track_id === payrollTrack.id) : [];
  const payrollEnrollments = payrollTrack ? data.enrollments.filter((e) => e.track_id === payrollTrack.id) : [];

  const weeksByPhase = useMemo(() => {
    const m = new Map<string, Week[]>();
    payrollWeeks.forEach((w) => { const a = m.get(w.phase_id) ?? []; a.push(w); m.set(w.phase_id, a); });
    return m;
  }, [payrollWeeks]);

  const modulesByWeek = useMemo(() => {
    const m = new Map<string, ModuleRow[]>();
    payrollModules.forEach((mo) => { const a = m.get(mo.week_id) ?? []; a.push(mo); m.set(mo.week_id, a); });
    return m;
  }, [payrollModules]);

  const totals = useMemo(() => ({
    journeys: payrollPhases.length,
    modulesTotal: payrollModules.length,
    learners: payrollEnrollments.length,
    completed: payrollEnrollments.filter((e) => e.status === "completed").length,
    certs: payrollCerts.length,
  }), [payrollPhases, payrollModules, payrollEnrollments, payrollCerts]);

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        <header className="mb-6 flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
            <GraduationCap className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Training Academy</h1>
            <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
              Operational learning journeys for the Payroll team — written workflows, follow-up standards, and Blossom OS proficiency.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Link to="/training/manage" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] text-foreground border border-border/70 bg-card hover:bg-muted transition-colors">
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} /> Create journey
            </Link>
            <Link to="/training/manage" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] text-foreground border border-border/70 bg-card hover:bg-muted transition-colors">
              <BookOpen className="h-3.5 w-3.5" strokeWidth={1.75} /> Create module
            </Link>
            <Link to="/training/manage" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] text-foreground border border-border/70 bg-card hover:bg-muted transition-colors">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} /> Certifications
            </Link>
            <Link to="/ai/assistant?q=What%20payroll%20training%20is%20overdue" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] text-primary-foreground bg-primary hover:opacity-90 transition-opacity">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} /> Operational Insights
            </Link>
          </div>
        </header>

        <div className="grid gap-3 mb-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Kpi label="Learning journeys" value={data.loading ? "—" : totals.journeys} />
          <Kpi label="Modules" value={data.loading ? "—" : totals.modulesTotal} />
          <Kpi label="Active learners" value={data.loading ? "—" : totals.learners} />
          <Kpi label="Certifications" value={data.loading ? "—" : totals.certs} />
          <Kpi label="Completed" value={data.loading ? "—" : totals.completed} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6 min-w-0">
            <section>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <h2 className="text-base font-medium tracking-tight">Payroll Learning Journeys</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Role-specific operational journeys for the Payroll team.</p>
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
              ) : payrollPhases.length === 0 ? (
                <Card className="p-6"><Empty icon={GraduationCap} title="No Payroll journeys yet." hint="Seed the Payroll Coordinator track to get started." /></Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {payrollPhases.map((p) => {
                    const ws = weeksByPhase.get(p.id) ?? [];
                    const mods = ws.reduce((acc, w) => acc + (modulesByWeek.get(w.id)?.length ?? 0), 0);
                    return (
                      <JourneyCard
                        key={p.id}
                        title={p.name}
                        tagline={p.tagline ?? "Operational journey for the Payroll team."}
                        position={p.position}
                        isPrimary={p.position === 1}
                        stats={{ weeks: ws.length, modules: mods }}
                        onOpen={() => setOpenTrack(openTrack === p.id ? null : p.id)}
                        open={openTrack === p.id}
                      />
                    );
                  })}
                </div>
              )}
            </section>

            {openTrack && (
              <PhaseDetail
                phase={payrollPhases.find((p) => p.id === openTrack)!}
                weeks={weeksByPhase.get(openTrack) ?? []}
                modulesByWeek={modulesByWeek}
                query={query}
              />
            )}

            <section>
              <h2 className="text-base font-medium tracking-tight mb-3">Continue Learning</h2>
              <Card className="p-6">
                {payrollEnrollments.length === 0 ? (
                  <Empty icon={ClipboardList} title="Nothing in progress." hint="Assign the Payroll Coordinator journey to start tracking progress." />
                ) : (
                  <ul className="divide-y divide-border/70">
                    {payrollEnrollments.slice(0, 8).map((e) => {
                      const tone: Tone = e.status === "completed" ? "ok" : e.status === "in_progress" ? "warn" : "muted";
                      return (
                        <li key={e.id} className="py-2.5 flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium tracking-tight truncate">Payroll Coordinator</p>
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

            <section>
              <h2 className="text-base font-medium tracking-tight mb-3">Certifications</h2>
              {data.loading ? (
                <Card className="p-6"><p className="text-sm text-muted-foreground">Loading…</p></Card>
              ) : payrollCerts.length === 0 ? (
                <Card className="p-6"><Empty icon={Award} title="No certifications yet." /></Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {payrollCerts.map((c) => (
                    <Card key={c.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-muted grid place-items-center shrink-0">
                          <Award className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-medium tracking-tight truncate">{c.name}</p>
                          <p className="text-[11.5px] text-muted-foreground truncate">Payroll Coordinator</p>
                          {c.description && <p className="text-[12px] text-muted-foreground mt-1.5 line-clamp-2">{c.description}</p>}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="p-5">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Management</h3>
              <nav className="space-y-1">
                {[
                  { label: "Create Journey", to: "/training/manage" },
                  { label: "Create Module", to: "/training/manage" },
                  { label: "Assign Training", to: "/training/manage" },
                  { label: "Manage Certifications", to: "/training/manage" },
                  { label: "Role Visibility", to: "/training/manage" },
                ].map((l) => (
                  <Link key={l.label} to={l.to} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px] hover:bg-muted transition-colors">
                    <span>{l.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  </Link>
                ))}
              </nav>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Continue learning</h3>
              </div>
              {payrollEnrollments.length === 0 ? (
                <p className="text-[12.5px] text-muted-foreground">Nothing in progress.</p>
              ) : (
                <ul className="space-y-1.5">
                  {payrollEnrollments.slice(0, 4).map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                      <span className="truncate">Payroll Coordinator</span>
                      <span className="text-muted-foreground">W{weekNumberFromId(e.current_week_id, data.weeks) ?? "—"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5 bg-muted/40">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Operational Insights</h3>
              </div>
              <div className="space-y-1.5">
                {[
                  "Summarize the weekly payroll workflow.",
                  "Which payroll modules are required this week?",
                  "Explain the NJ payroll workflow.",
                  "Show me the payroll communication standards.",
                  "Which payroll certifications are pending?",
                ].map((p) => (
                  <Link key={p} to={`/ai/assistant?q=${encodeURIComponent(p)}`} className="block w-full text-left rounded-lg px-2 py-1.5 text-[12.5px] text-muted-foreground hover:bg-card hover:text-foreground transition-colors">
                    {p}
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Payroll categories</h3>
              <div className="flex flex-wrap gap-1.5">
                {PAYROLL_CATEGORIES.map((c) => (
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

const Kpi = ({ label, value }: { label: string; value: string | number }) => (
  <KpiCard label={label} value={value} />
);

function JourneyCard({
  title, tagline, position, isPrimary, stats, onOpen, open,
}: {
  title: string; tagline: string; position: number; isPrimary?: boolean;
  stats: { weeks: number; modules: number };
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
            {isPrimary && <Pill tone="ok">Start here</Pill>}
          </div>
          <p className="text-[12.5px] text-muted-foreground mt-1 line-clamp-2">{tagline}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
            <span>Journey {position}</span>
            <span>· {stats.weeks} week{stats.weeks === 1 ? "" : "s"}</span>
            <span>· {stats.modules} modules</span>
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
          </div>
        </div>
      </div>
    </Card>
  );
}

function PhaseDetail({
  phase, weeks, modulesByWeek, query,
}: {
  phase: Phase;
  weeks: Week[];
  modulesByWeek: Map<string, ModuleRow[]>;
  query: string;
}) {
  const q = query.trim().toLowerCase();
  return (
    <Card className="p-5">
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Journey detail</p>
        <p className="text-base font-medium tracking-tight">{phase.name}</p>
        {phase.tagline && <p className="text-[12.5px] text-muted-foreground mt-0.5">{phase.tagline}</p>}
      </div>

      <div className="divide-y divide-border/70 rounded-xl border border-border/70 bg-background">
        {weeks.map((w) => {
          let mods = modulesByWeek.get(w.id) ?? [];
          if (q) mods = mods.filter((m) => m.title.toLowerCase().includes(q));
          return (
            <div key={w.id} className="p-4">
              {mods.length === 0 ? (
                <p className="text-[11.5px] text-muted-foreground">No modules match.</p>
              ) : (
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {mods.map((m) => {
                    const Icon = TYPE_ICON[m.module_type] ?? FileText;
                    return (
                      <li key={m.id} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-muted transition-colors">
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
    </Card>
  );
}