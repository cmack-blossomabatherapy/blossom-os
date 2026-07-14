import { useMemo, useState } from "react";
import {
  Search, X, AlertTriangle, CheckCircle2, Clock, Sparkles,
  Brain, Send, MessageSquare, UserPlus, Download, Bell,
  Building2, Home, Flame, Plus, RefreshCw, ArrowRight,
  MapPin, Users, Briefcase, Link2,
} from "lucide-react";
import { OSShell } from "./OSShell";
import {
  getCapacityMap,
  type StaffingClientNeed,
} from "@/data/staffing";
import {
  recruitingStates,
  recruitingRecruiters,
  type RecruitingCandidate,
} from "@/data/recruitingDashboard";
import { useLegacyRecruitingCandidates } from "@/hooks/useLegacyRecruitingCandidates";
import { useRecruitingMutations } from "@/hooks/useRecruitingMutations";
import { useRecruitingStaffingNeeds, type RecruitingStaffingNeed } from "@/hooks/useRecruitingCandidates";
import { useRecruitingCandidateLookup } from "@/hooks/useRecruitingCandidateLookup";
import { useSlideout } from "@/hooks/useSlideout";
import { cn } from "@/lib/utils";

// Recruiting → Staffing & Operations → Open Staffing Needs
// Operational visibility layer that bridges client staffing demand,
// recruiting pipeline, and orientation-ready candidates.

type Tone = "ok" | "warn" | "crit" | "muted" | "info";

const STAGES = [
  { key: "new",          label: "New Staffing Need" },
  { key: "review",       label: "Recruiting Review" },
  { key: "active",       label: "Active Recruiting" },
  { key: "matchAvail",   label: "Candidate Match Available" },
  { key: "orientation",  label: "Orientation Pending" },
  { key: "coordination", label: "Staffing Coordination" },
  { key: "confirmed",    label: "Staffing Confirmed" },
  { key: "escalated",    label: "Escalated" },
  { key: "highRisk",     label: "High Risk Delay" },
] as const;
type StageKey = typeof STAGES[number]["key"];

const STATUS_TO_STAGE: Record<string, StageKey> = {
  Open: "new",
  New: "new",
  Active: "active",
  Working: "active",
  Review: "review",
  Match: "matchAvail",
  matchAvail: "matchAvail",
  Orientation: "orientation",
  Coordination: "coordination",
  Confirmed: "confirmed",
  Closed: "confirmed",
  Escalated: "escalated",
  HighRisk: "highRisk",
};
function statusToStage(status: string | null | undefined, fallback: StageKey = "new"): StageKey {
  if (!status) return fallback;
  if ((STAGES as readonly { key: string }[]).some((s) => s.key === status)) return status as StageKey;
  return STATUS_TO_STAGE[status] ?? fallback;
}

function mapLiveNeedToViewModel(row: RecruitingStaffingNeed): StaffingClientNeed {
  const opened = row.opened_at ? new Date(row.opened_at) : null;
  const days = opened ? Math.max(0, Math.floor((Date.now() - opened.getTime()) / 86_400_000)) : 0;
  const label = row.client_label || "Unassigned client";
  const stageReason: StaffingClientNeed["reason"] =
    row.status === "Closed" ? "RBT Assigned"
    : row.matched_candidate_id ? "Matching"
    : "Staffing Needed";
  // Fabricate a minimal Client wrapper. Only fields used by this page are populated;
  // remaining required fields are cast away to avoid leaking placeholder client data.
  const client = {
    id: row.id,
    childName: label,
    state: row.state,
    clinic: "—",
    bcba: row.role_needed === "BCBA" ? null : "BCBA Assigned",
    serviceLocation: "In-Home",
  } as unknown as StaffingClientNeed["client"];
  return {
    client,
    reason: stageReason,
    priority: ((row.priority as "High" | "Medium" | "Low") ?? "Medium"),
    daysWaiting: days,
    requiredHours: row.hours_per_week ?? 0,
    availability: [],
    zip: "",
    region: row.state,
    alert: row.status === "Closed" ? null : (row.notes ?? null),
  };
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function needRole(n: StaffingClientNeed): "RBT" | "BCBA" {
  // All staffing needs in this dataset are RBT placements unless explicitly BCBA-less
  return !n.client.bcba ? "BCBA" : "RBT";
}

function orientationReady(c: RecruitingCandidate) {
  return c.readinessStatus === "Ready for Staffing" || c.orientation === "Complete";
}

function classify(n: StaffingClientNeed, readyMatches: number): StageKey {
  if (n.daysWaiting >= 14) return "highRisk";
  if (n.alert?.includes("Restaffing") || n.daysWaiting >= 10) return "escalated";
  if (n.reason === "RBT Assigned") return "confirmed";
  if (n.reason === "Matching") return readyMatches > 0 ? "matchAvail" : "active";
  if (n.daysWaiting >= 5) return "active";
  if (n.daysWaiting >= 2) return "review";
  return "new";
}

function toneFor(n: StaffingClientNeed): Tone {
  if (n.priority === "High" || n.daysWaiting >= 10) return "crit";
  if (n.priority === "Medium" || n.daysWaiting >= 5) return "warn";
  if (n.reason === "RBT Assigned") return "ok";
  return "info";
}

function toneClass(t: Tone) {
  switch (t) {
    case "crit":  return "bg-destructive/10 text-destructive border-destructive/20";
    case "warn":  return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    case "info":  return "bg-primary/10 text-primary border-primary/20";
    case "muted": return "bg-muted text-muted-foreground border-border/60";
    default:      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  }
}

function Pill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap", toneClass(tone), className)}>
      {children}
    </span>
  );
}

const CHIPS = [
  { key: "all",        label: "All Staffing Needs" },
  { key: "rbt",        label: "Needs RBT" },
  { key: "bcba",       label: "Needs BCBA" },
  { key: "urgent",     label: "Urgent" },
  { key: "high",       label: "High Priority" },
  { key: "wait7",      label: "Waiting 7+ Days" },
  { key: "clinic",     label: "Clinic-Based" },
  { key: "home",       label: "In-Home" },
  { key: "matchAvail", label: "Orientation-Ready Match" },
  { key: "escalated",  label: "Escalated" },
];

function fitScore(n: StaffingClientNeed, c: RecruitingCandidate): number {
  let score = 40;
  if (c.state === n.client.state) score += 30;
  if (c.role === needRole(n)) score += 20;
  if (c.readinessStatus === "Ready for Staffing") score += 10;
  return Math.min(100, score);
}

export default function OSRecruitingStaffingNeeds() {
  const recruitingCandidates = useLegacyRecruitingCandidates();
  const mutations = useRecruitingMutations();
  const { items: liveStaffingNeeds, loading: liveStaffingNeedsLoading } = useRecruitingStaffingNeeds();
  const { find: findCandidate } = useRecruitingCandidateLookup();
  // Build needs list — the active board is ONLY live Supabase rows.
  const liveNeeds = useMemo(
    () => liveStaffingNeeds.map(mapLiveNeedToViewModel),
    [liveStaffingNeeds],
  );
  // Live rows are the sole operational source of truth for the active board.
  const baseNeeds = liveNeeds;
  const readyCandidates = useMemo(
    () => recruitingCandidates.filter(orientationReady),
    []
  );

  // Default stage mapping: live rows derive from DB status; synthetic from classifier.
  const [stageOverrides, setStageOverrides] = useState<Record<string, StageKey>>({});
  const liveStatusById = useMemo(() => {
    const m: Record<string, string | null | undefined> = {};
    liveStaffingNeeds.forEach((r) => { m[r.id] = r.status; });
    return m;
  }, [liveStaffingNeeds]);

  const [activeChip, setActiveChip] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [stateF, setStateF] = useState<string>("all");
  const [recruiterF, setRecruiterF] = useState<string>("all");
  const [urgencyF, setUrgencyF] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stageOf = (n: StaffingClientNeed): StageKey => {
    const override = stageOverrides[n.client.id];
    if (override) return override;
    if (liveStatusById[n.client.id] !== undefined) return statusToStage(liveStatusById[n.client.id]);
    const matches = readyCandidates.filter((c) => c.state === n.client.state && c.role === needRole(n)).length;
    return classify(n, matches);
  };

  // Synthesize recruiter assignment per need (round robin over real recruiters)
  const assignedRecruiter = (n: StaffingClientNeed) =>
    recruitingRecruiters[
      Math.abs(n.client.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0)) % recruitingRecruiters.length
    ];

  const states = useMemo(() => Array.from(new Set(baseNeeds.map((n) => n.client.state))), [baseNeeds]);

  const needs = useMemo(() => {
    return baseNeeds.filter((n) => {
      if (stateF !== "all" && n.client.state !== stateF) return false;
      if (recruiterF !== "all" && assignedRecruiter(n) !== recruiterF) return false;
      if (urgencyF !== "all" && n.priority !== urgencyF) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [initials(n.client.childName), n.client.state, n.client.clinic, assignedRecruiter(n), n.reason, n.alert ?? "", needRole(n)].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const st = stageOf(n);
      switch (activeChip) {
        case "all": return true;
        case "rbt": return needRole(n) === "RBT";
        case "bcba": return needRole(n) === "BCBA";
        case "urgent": return n.priority === "High" || st === "escalated" || st === "highRisk";
        case "high": return n.priority === "High";
        case "wait7": return n.daysWaiting >= 7;
        case "clinic": return /clinic|center/i.test(n.client.serviceLocation ?? "");
        case "home": return /home/i.test(n.client.serviceLocation ?? "") || !n.client.serviceLocation;
        case "matchAvail": return st === "matchAvail";
        case "escalated": return st === "escalated" || st === "highRisk";
        default: return true;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseNeeds, stageOverrides, liveStatusById, activeChip, search, stateF, recruiterF, urgencyF]);

  const summary = useMemo(() => {
    const get = (pred: (n: StaffingClientNeed) => boolean) => baseNeeds.filter(pred).length;
    return {
      needsRBT:    get((n) => needRole(n) === "RBT"),
      needsBCBA:   get((n) => needRole(n) === "BCBA"),
      urgent:      get((n) => n.priority === "High"),
      wait7:       get((n) => n.daysWaiting >= 7),
      readyCands:  readyCandidates.length,
      gaGap:       baseNeeds.filter((n) => n.client.state === "GA").length,
      highRisk:    get((n) => n.daysWaiting >= 14 || n.alert?.includes("Restaffing") === true),
      escalations: get((n) => stageOf(n) === "escalated" || stageOf(n) === "highRisk"),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseNeeds, readyCandidates, stageOverrides, liveStatusById]);

  const escalations = useMemo(
    () => baseNeeds.filter((n) => stageOf(n) === "escalated" || stageOf(n) === "highRisk"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseNeeds, stageOverrides, liveStatusById]
  );

  const statePressure = useMemo(() => {
    const cap = getCapacityMap();
    return cap.map((row) => {
      const stateNeeds = baseNeeds.filter((n) => n.client.state === row.region);
      const stateReady = readyCandidates.filter((c) => c.state === row.region).length;
      return {
        state: row.region,
        openNeeds: stateNeeds.length,
        urgent: stateNeeds.filter((n) => n.priority === "High").length,
        capacityGap: row.gap,
        readyCandidates: stateReady,
      };
    }).sort((a, b) => b.openNeeds - a.openNeeds);
  }, [baseNeeds, readyCandidates]);

  const selected = selectedId ? baseNeeds.find((n) => n.client.id === selectedId) ?? null : null;

  function moveStage(id: string, to: StageKey) {
    setStageOverrides((m) => ({ ...m, [id]: to }));
    // Persist when this row corresponds to a real recruiting_staffing_needs row.
    const liveNeed = liveStaffingNeeds.find((n: any) => n.client_id === id || n.id === id);
    if (liveNeed?.id && /^[0-9a-f-]{36}$/i.test(liveNeed.id)) {
      if (to === "active")        void mutations.markStaffingNeedWorking(liveNeed.id);
      else if (to === "confirmed") void mutations.closeStaffingNeed(liveNeed.id, "confirmed");
      else                         void mutations.updateStaffingNeed(liveNeed.id, { status: to });
    }
  }
  function onDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }
  function onDrop(e: React.DragEvent, to: StageKey) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) moveStage(id, to);
  }

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Open Staffing Needs</h1>
            <p className="text-muted-foreground mt-1 text-[15px]">
              Track staffing demand, recruiting pressure, and orientation-ready candidate opportunities.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition inline-flex items-center gap-2 text-sm">
              <RefreshCw className="size-4" /> Sync Staffing Board
            </button>
            <button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition inline-flex items-center gap-2 text-sm font-medium">
              <Plus className="size-4" /> Add Staffing Need
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="rounded-2xl bg-card border border-border/70 p-4 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search client initials, state, recruiter, status…"
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/60 border border-border focus:ring-2 focus:ring-ring focus:border-transparent text-sm placeholder:text-muted-foreground/70"
            />
          </div>
          <Select value={stateF} onChange={setStateF} label="All States" options={states} />
          <Select value={recruiterF} onChange={setRecruiterF} label="All Recruiters" options={recruitingRecruiters} />
          <Select value={urgencyF} onChange={setUrgencyF} label="All Urgency" options={["High", "Medium", "Low"]} />
          {(search || stateF !== "all" || recruiterF !== "all" || urgencyF !== "all") && (
            <button onClick={() => { setSearch(""); setStateF("all"); setRecruiterF("all"); setUrgencyF("all"); }} className="h-10 px-3 rounded-xl text-muted-foreground hover:bg-muted transition inline-flex items-center gap-1 text-sm">
              <X className="size-4" /> Clear
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          <SummaryCard label="Needs RBT"            value={summary.needsRBT}    icon={Users}        tone="info" onClick={() => setActiveChip("rbt")} />
          <SummaryCard label="Needs BCBA"           value={summary.needsBCBA}   icon={Briefcase}    tone="info" onClick={() => setActiveChip("bcba")} />
          <SummaryCard label="Urgent Needs"         value={summary.urgent}      icon={AlertTriangle} tone="crit" onClick={() => setActiveChip("urgent")} />
          <SummaryCard label="Waiting 7+ Days"      value={summary.wait7}       icon={Clock}        tone="warn" onClick={() => setActiveChip("wait7")} />
          <SummaryCard label="Orientation-Ready"    value={summary.readyCands}  icon={CheckCircle2} tone="ok"   onClick={() => setActiveChip("matchAvail")} />
          <SummaryCard label="GA Clinic Gaps"       value={summary.gaGap}       icon={Building2}    tone="warn" onClick={() => { setStateF("GA"); setActiveChip("clinic"); }} />
          <SummaryCard label="High-Risk Delays"     value={summary.highRisk}    icon={Flame}        tone="crit" onClick={() => setActiveChip("escalated")} />
          <SummaryCard label="Escalations"          value={summary.escalations} icon={Bell}         tone="crit" onClick={() => setActiveChip("escalated")} />
        </div>

        {/* Live pill summary */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <Pill tone="info">{liveNeeds.length} live</Pill>
          {liveStaffingNeedsLoading && <span>Loading live needs…</span>}
          <span className="text-muted-foreground/70">
            Live rows persist to <code className="text-foreground/80">recruiting_staffing_needs</code>.
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveChip(c.key)}
              className={cn(
                "px-3 h-8 rounded-full text-xs font-medium border transition",
                activeChip === c.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border/70 hover:bg-muted"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-8">
            {/* Board */}
            <section>
              <SectionHeader title="Staffing Needs Board" caption="Drag staffing needs between operational stages" />
              <div className="grid grid-flow-col auto-cols-[280px] gap-3 overflow-x-auto pb-2 -mx-2 px-2">
                {STAGES.map((stage) => {
                  const list = needs.filter((n) => stageOf(n) === stage.key);
                  return (
                    <div
                      key={stage.key}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => onDrop(e, stage.key)}
                      className="rounded-2xl bg-muted/40 border border-border/60 p-3 flex flex-col min-h-[220px]"
                    >
                      <div className="flex items-center justify-between mb-2 px-1">
                        <div className="text-xs font-semibold tracking-tight">{stage.label}</div>
                        <div className="text-[11px] text-muted-foreground">{list.length}</div>
                      </div>
                      <div className="space-y-2 flex-1">
                        {list.length === 0 ? (
                          <div className="text-[11px] text-muted-foreground/70 italic px-2 py-3">Empty</div>
                        ) : list.map((n) => (
                          <BoardCard
                            key={n.client.id}
                            n={n}
                            recruiter={assignedRecruiter(n)}
                            matches={readyCandidates.filter((c) => c.state === n.client.state && c.role === needRole(n)).length}
                            onOpen={() => setSelectedId(n.client.id)}
                            onDragStart={(e) => onDragStart(e, n.client.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Orientation-Ready Match Queue */}
            <section>
              <SectionHeader title="Orientation-Ready Candidate Match Queue" caption={`${readyCandidates.length} candidate${readyCandidates.length === 1 ? "" : "s"} cleared and ready for placement`} />
              {readyCandidates.length === 0 ? (
                <EmptyCard icon={CheckCircle2} title="No orientation-ready candidate matches available." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {readyCandidates.map((c) => {
                    const matches = baseNeeds.filter((n) => n.client.state === c.state && needRole(n) === c.role);
                    const best = matches[0];
                    return <MatchCard key={c.id} c={c} matchCount={matches.length} fit={best ? fitScore(best, c) : 50} />;
                  })}
                </div>
              )}
            </section>

            {/* State pressure */}
            <section>
              <SectionHeader title="State Staffing Pressure Feed" caption="Where staffing demand and recruiting pressure are highest" />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {statePressure.map((s) => (
                  <StatePressureCard key={s.state} {...s} />
                ))}
              </div>
            </section>

            {/* Escalations */}
            <section>
              <SectionHeader title="Staffing Escalations Queue" caption={`${escalations.length} staffing need${escalations.length === 1 ? "" : "s"} escalated`} />
              {escalations.length === 0 ? (
                <EmptyCard icon={CheckCircle2} title="No staffing escalations currently." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {escalations.map((n) => (
                    <EscalationCard key={n.client.id} n={n} recruiter={assignedRecruiter(n)} onOpen={() => setSelectedId(n.client.id)} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right rail */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-card border border-border/70 p-5">
              <div className="text-xs font-semibold tracking-tight text-muted-foreground uppercase mb-3">Quick Actions</div>
              <div className="space-y-1.5">
                {[
                  { icon: Plus, label: "Add Staffing Need", onClick: () => void mutations.createStaffingNeed({
                      role: "RBT", role_needed: "RBT", state: "GA", priority: "Medium", status: "new",
                    } as any) },
                  { icon: UserPlus, label: "Assign Recruiter" },
                  { icon: AlertTriangle, label: "Escalate Staffing Delay" },
                  { icon: Link2, label: "Link Candidate", onClick: () => {
                      const need = liveStaffingNeeds[0];
                      const cand = recruitingCandidates[0];
                      if (need && cand) void mutations.linkCandidateToStaffingNeed(need.id, cand.id);
                    } },
                  { icon: Bell, label: "Notify Staffing Coordinator" },
                  { icon: ArrowRight, label: "Move to Staffing Confirmed" },
                  { icon: Download, label: "Export Staffing Queue" },
                  { icon: Send, label: "Send Staffing Update" },
                ].map((a) => (
                  <button key={a.label} onClick={(a as any).onClick} className="w-full h-9 px-3 rounded-xl text-left text-sm hover:bg-muted transition inline-flex items-center gap-2 text-foreground">
                    <a.icon className="size-4 text-muted-foreground" />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border/70 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-7 rounded-lg bg-primary/10 grid place-items-center">
                  <Sparkles className="size-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-tight">Operational Insights</div>
                  <div className="text-[11px] text-muted-foreground">Staffing demand copilot</div>
                </div>
              </div>
              <div className="space-y-1.5">
                {[
                  "Which staffing needs are urgent?",
                  "Show orientation-ready candidates.",
                  "Which states have the biggest shortages?",
                  "What staffing requests are stalled?",
                  "Which clients are high risk?",
                  "Show RBT shortages in Georgia.",
                ].map((q) => (
                  <button key={q} className="w-full text-left text-xs px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition inline-flex items-center gap-2 text-foreground">
                    <Brain className="size-3.5 text-muted-foreground shrink-0" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {selected && (
        <NeedSlideout
          n={selected}
          stage={stageOf(selected)}
          recruiter={assignedRecruiter(selected)}
          matches={readyCandidates.filter((c) => c.state === selected.client.state && c.role === needRole(selected))}
          onMove={(to) => moveStage(selected.client.id, to)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </OSShell>
  );
}

/* ---------- subcomponents ---------- */

function Select({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: readonly string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 px-3 rounded-xl bg-muted/60 border border-border text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
    >
      <option value="all">{label}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function SectionHeader({ title, caption }: { title: string; caption?: string }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {caption && <p className="text-xs text-muted-foreground mt-0.5">{caption}</p>}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, tone, onClick }: { label: string; value: number; icon: any; tone: Tone; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="text-left rounded-2xl bg-card border border-border/70 p-4 hover:border-border hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className={cn("size-7 rounded-lg grid place-items-center border", toneClass(tone))}>
          <Icon className="size-3.5" />
        </span>
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </button>
  );
}

function EmptyCard({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 border border-border/60 p-10 text-center">
      <Icon className="size-6 text-muted-foreground mx-auto mb-2" />
      <div className="text-sm text-muted-foreground">{title}</div>
    </div>
  );
}

function IconBtn({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <span title={title} className="rounded-full size-8 grid place-items-center hover:bg-muted transition cursor-pointer">
      <Icon className="size-4 text-muted-foreground" />
    </span>
  );
}

function BoardCard({ n, recruiter, matches, onOpen, onDragStart }: { n: StaffingClientNeed; recruiter: string; matches: number; onOpen: () => void; onDragStart: (e: React.DragEvent) => void }) {
  const tone = toneFor(n);
  const role = needRole(n);
  const inits = initials(n.client.childName);
  const clinic = /clinic|center/i.test(n.client.serviceLocation ?? "");
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      className="rounded-xl bg-card border border-border/70 p-3 hover:border-border hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">Client {inits}</div>
          <div className="text-[10px] text-muted-foreground">{n.client.state} · {n.client.clinic}</div>
        </div>
        <Pill tone={tone} className="shrink-0">{n.daysWaiting}d</Pill>
      </div>
      <div className="text-[11px] text-muted-foreground truncate">{n.alert ?? n.reason}</div>
      <div className="flex flex-wrap gap-1 mt-2">
        <Pill tone="info">Needs {role}</Pill>
        {n.priority === "High" && <Pill tone="crit">Urgent</Pill>}
        {n.daysWaiting >= 7 && <Pill tone="warn">7+ Days</Pill>}
        {matches > 0 && <Pill tone="ok">{matches} match{matches === 1 ? "" : "es"}</Pill>}
        {clinic && <Pill tone="muted">Clinic</Pill>}
      </div>
      <div className="text-[10px] text-muted-foreground truncate mt-2">{recruiter}</div>
    </div>
  );
}

function MatchCard({ c, matchCount, fit }: { c: RecruitingCandidate; matchCount: number; fit: number }) {
  return (
    <div className="rounded-2xl bg-card border border-border/70 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-full bg-muted grid place-items-center text-xs font-semibold shrink-0">{initials(c.name)}</div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{c.name}</div>
            <div className="text-[11px] text-muted-foreground">{c.role} · {c.state} · {c.recruiter}</div>
          </div>
        </div>
        <Pill tone={fit >= 80 ? "ok" : fit >= 60 ? "info" : "warn"}>{fit}% fit</Pill>
      </div>
      <div className="text-xs text-muted-foreground mb-2">{c.availability} · Radius {c.travelRadius}mi</div>
      <div className="flex items-center justify-between mt-1">
        <div className="text-[11px] text-muted-foreground">{matchCount} matching need{matchCount === 1 ? "" : "s"}</div>
        <div className="flex items-center gap-1">
          <IconBtn icon={Link2} title="Link to staffing need" />
          <IconBtn icon={Bell} title="Notify staffing coordinator" />
          <IconBtn icon={UserPlus} title="Assign placement" />
        </div>
      </div>
    </div>
  );
}

function StatePressureCard({ state, openNeeds, urgent, capacityGap, readyCandidates }: { state: string; openNeeds: number; urgent: number; capacityGap: number; readyCandidates: number }) {
  const pressure: Tone = urgent >= 3 ? "crit" : openNeeds >= 3 ? "warn" : "info";
  return (
    <div className="rounded-2xl bg-card border border-border/70 p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" />
          <div className="text-sm font-semibold tracking-tight">{state}</div>
        </div>
        <Pill tone={pressure}>{pressure === "crit" ? "High Pressure" : pressure === "warn" ? "Watch" : "Stable"}</Pill>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Stat label="Open Needs" value={openNeeds} />
        <Stat label="Urgent" value={urgent} tone={urgent > 0 ? "crit" : "muted"} />
        <Stat label="Capacity Gap" value={capacityGap} tone={capacityGap < 0 ? "crit" : "ok"} />
        <Stat label="Ready Candidates" value={readyCandidates} tone={readyCandidates > 0 ? "ok" : "muted"} />
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "muted" }: { label: string; value: number; tone?: Tone }) {
  const color = tone === "crit" ? "text-destructive" : tone === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-foreground";
  return (
    <div className="rounded-xl bg-muted/40 border border-border/60 px-3 py-2">
      <div className={cn("text-base font-semibold tracking-tight", color)}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function EscalationCard({ n, recruiter, onOpen }: { n: StaffingClientNeed; recruiter: string; onOpen: () => void }) {
  const reason = n.alert ?? (n.daysWaiting >= 14 ? `Waiting ${n.daysWaiting} days — high risk delay` : `Escalated after ${n.daysWaiting} days`);
  return (
    <button onClick={onOpen} className="text-left rounded-2xl bg-card border border-border/70 p-4 hover:border-border hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-sm font-medium">Client {initials(n.client.childName)} · {n.client.state}</div>
        <Pill tone="crit"><Flame className="size-3" /> Escalated</Pill>
      </div>
      <div className="text-xs text-muted-foreground">{reason}</div>
      <div className="flex items-center justify-between mt-3">
        <div className="text-[11px] text-muted-foreground">{recruiter} · {n.daysWaiting}d waiting · Needs {needRole(n)}</div>
        <div className="flex items-center gap-1">
          <IconBtn icon={AlertTriangle} title="Escalate to Leadership" />
          <IconBtn icon={Bell} title="Notify Staffing" />
          <IconBtn icon={MessageSquare} title="Add Operational Note" />
        </div>
      </div>
    </button>
  );
}

/* ---------- slideout ---------- */

function NeedSlideout({
  n, stage, recruiter, matches, onMove, onClose,
}: {
  n: StaffingClientNeed;
  stage: StageKey;
  recruiter: string;
  matches: RecruitingCandidate[];
  onMove: (to: StageKey) => void;
  onClose: () => void;
}) {
  useSlideout(true, onClose);
  const tone = toneFor(n);
  const role = needRole(n);
  const inits = initials(n.client.childName);
  const clinic = /clinic|center/i.test(n.client.serviceLocation ?? "");
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-[520px] bg-card border-l border-border/70 shadow-[0_20px_60px_-30px_oklch(0.2_0.02_260/0.4)] overflow-y-auto">
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/70 px-6 py-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-full bg-muted grid place-items-center text-sm font-semibold">{inits}</div>
            <div>
              <div className="text-base font-semibold tracking-tight">Client {inits}</div>
              <div className="text-xs text-muted-foreground">{n.client.state} · {n.client.clinic}</div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full size-9 grid place-items-center hover:bg-muted transition">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div className="flex flex-wrap gap-1.5">
            <Pill tone={tone}>{STAGES.find((s) => s.key === stage)?.label ?? stage}</Pill>
            <Pill tone="info">Needs {role}</Pill>
            <Pill tone="muted">{n.daysWaiting}d waiting</Pill>
            {n.priority === "High" && <Pill tone="crit">Urgent</Pill>}
            {clinic ? <Pill tone="muted"><Building2 className="size-3" /> Clinic</Pill> : <Pill tone="muted"><Home className="size-3" /> In-Home</Pill>}
          </div>

          <Block title="Client Overview">
            <Row k="State" v={n.client.state} />
            <Row k="Clinic" v={n.client.clinic} />
            <Row k="Service Type" v={n.client.serviceLocation ?? "In-Home"} />
            <Row k="Required Hours" v={`${n.requiredHours} hrs/week`} />
            <Row k="Availability" v={n.availability.join(", ")} />
          </Block>

          <Block title="Operational Status">
            <Row k="Stage" v={STAGES.find((s) => s.key === stage)?.label ?? stage} />
            <Row k="Reason" v={n.reason} />
            <Row k="Days Waiting" v={`${n.daysWaiting} days`} />
            <Row k="Recruiter" v={recruiter} />
            <Row k="Priority" v={n.priority} />
            <Row k="Alert" v={n.alert ?? "—"} />
          </Block>

          <Block title="Candidate Match Visibility">
            {matches.length === 0 ? (
              <div className="px-3 py-3 text-xs text-muted-foreground">No orientation-ready candidates match this need yet.</div>
            ) : matches.slice(0, 5).map((c) => (
              <div key={c.id} className="px-3 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm truncate">{c.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{c.role} · {c.state} · {c.availability}</div>
                </div>
                <Pill tone="ok">{fitScore(n, c)}%</Pill>
              </div>
            ))}
          </Block>

          <Block title="Operational Blockers">
            <Row k="Candidate Availability" v={matches.length === 0 ? "No orientation-ready matches" : `${matches.length} candidate${matches.length === 1 ? "" : "s"} available`} />
            <Row k="Geographic Fit" v={matches.filter((c) => c.state === n.client.state).length > 0 ? "In-state matches found" : "Out-of-region only"} />
            <Row k="Escalation" v={stage === "escalated" || stage === "highRisk" ? "Escalated" : "Not escalated"} />
          </Block>

          {/* Stage transitions */}
          <div>
            <div className="text-xs font-semibold tracking-tight text-muted-foreground uppercase mb-2">Move Stage</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Recruiting Review", to: "review" as StageKey },
                { label: "Active Recruiting", to: "active" as StageKey },
                { label: "Match Available", to: "matchAvail" as StageKey },
                { label: "Orientation Pending", to: "orientation" as StageKey },
                { label: "Staffing Coordination", to: "coordination" as StageKey },
                { label: "Staffing Confirmed", to: "confirmed" as StageKey, primary: true },
                { label: "Escalate", to: "escalated" as StageKey },
                { label: "High Risk Delay", to: "highRisk" as StageKey },
              ].map((o) => (
                <button
                  key={o.label}
                  onClick={() => onMove(o.to)}
                  className={cn(
                    "h-9 px-3 rounded-xl text-xs font-medium border transition",
                    o.primary
                      ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
                      : "bg-card text-foreground border-border/70 hover:bg-muted"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="text-xs font-semibold tracking-tight text-muted-foreground uppercase mb-2">Actions</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: UserPlus, label: "Assign Recruiter" },
                { icon: AlertTriangle, label: "Escalate Staffing" },
                { icon: Bell, label: "Notify Coordinator" },
                { icon: Link2, label: "Link Candidate" },
                { icon: Flame, label: "Update Urgency" },
                { icon: MessageSquare, label: "Add Staffing Note" },
                { icon: ArrowRight, label: "Move to Confirmed" },
                { icon: Send, label: "Send Staffing Update" },
              ].map((a) => (
                <button key={a.label} className="h-9 px-3 rounded-xl bg-card border border-border/70 hover:bg-muted transition inline-flex items-center gap-2 text-xs text-foreground">
                  <a.icon className="size-3.5 text-muted-foreground" />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold tracking-tight text-muted-foreground uppercase mb-2">{title}</div>
      <div className="rounded-2xl bg-muted/40 border border-border/60 divide-y divide-border/60">
        {children}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2">
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide pt-0.5">{k}</div>
      <div className="text-sm text-foreground text-right break-words max-w-[60%]">{v}</div>
    </div>
  );
}

// Touch unused imports to keep tree-shaking honest
void recruitingStates;
