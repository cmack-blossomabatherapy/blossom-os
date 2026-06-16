import { useMemo, useState } from "react";
import {
  Sparkles,
  Users,
  Briefcase,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  ArrowRight,
  HandHeart,
  Megaphone,
  School,
  Heart,
  CalendarDays,
  ShieldCheck,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { MktgPage, MktgCard, AIPrompt, EmptyRow, ShareBar } from "./_shared";
import { mockCandidates, type Candidate, type CandidateStage } from "@/data/recruiting";
import { mockLeads } from "@/data/leads";

/* Recruiting Marketing — operational recruiting visibility intelligence.
 * Derived from real candidate pipeline, source attribution, and state-level
 * staffing demand (family leads). Not an ATS, not Apploi. */

const FOOTPRINT = ["GA", "NC", "VA", "TN", "MD", "NJ"] as const;
const STATE_NAMES: Record<string, string> = {
  GA: "Georgia",
  NC: "North Carolina",
  TN: "Tennessee",
  VA: "Virginia",
  MD: "Maryland",
};

const EARLY_STAGES = new Set<CandidateStage>([
  "New Applicant",
  "Screening",
  "Interview Scheduled",
  "Interview",
]);
const MID_STAGES = new Set<CandidateStage>([
  "Interview Completed",
  "Offer Sent",
  "Offer",
  "Offer Accepted",
]);
const LATE_STAGES = new Set<CandidateStage>([
  "Onboarding",
  "Background Check",
  "Orientation",
  "Credentialing",
  "Training",
  "I9 / E-Verify",
]);
const READY_STAGES = new Set<CandidateStage>(["Ready for Staffing", "Ready for Assignment"]);

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 0) return <TrendingUp className="size-3.5 text-emerald-600" />;
  if (delta < 0) return <TrendingDown className="size-3.5 text-amber-600" />;
  return <Minus className="size-3.5 text-muted-foreground" />;
}

export default function RecruitingMarketing() {
  const [activeState, setActiveState] = useState<string | null>(null);

  const momentum = useMemo(() => {
    const now = Date.now();
    const age = (iso: string) => (now - new Date(iso).getTime()) / 86_400_000;
    const recent = mockCandidates.filter((c) => age(c.appliedDate) <= 7).length;
    const prior = mockCandidates.filter((c) => {
      const a = age(c.appliedDate);
      return a > 7 && a <= 14;
    }).length;
    const qualified = mockCandidates.filter(
      (c) => MID_STAGES.has(c.stage) || LATE_STAGES.has(c.stage) || READY_STAGES.has(c.stage),
    ).length;
    const ready = mockCandidates.filter((c) => READY_STAGES.has(c.stage)).length;
    return {
      recent,
      prior,
      delta: recent - prior,
      qualified,
      ready,
      qualifiedRate: mockCandidates.length
        ? Math.round((qualified / mockCandidates.length) * 100)
        : 0,
    };
  }, []);

  const sourceRows = useMemo(() => {
    const map = new Map<
      string,
      { source: string; total: number; qualified: number; ready: number; rbt: number; bcba: number }
    >();
    mockCandidates.forEach((c) => {
      const e =
        map.get(c.source) ?? { source: c.source, total: 0, qualified: 0, ready: 0, rbt: 0, bcba: 0 };
      e.total += 1;
      if (MID_STAGES.has(c.stage) || LATE_STAGES.has(c.stage) || READY_STAGES.has(c.stage))
        e.qualified += 1;
      if (READY_STAGES.has(c.stage)) e.ready += 1;
      if (c.role === "RBT") e.rbt += 1;
      else e.bcba += 1;
      map.set(c.source, e);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, []);

  const stateRows = useMemo(() => {
    return FOOTPRINT.map((state) => {
      const cands = mockCandidates.filter((c) => c.state === state);
      const rbt = cands.filter((c) => c.role === "RBT").length;
      const bcba = cands.filter((c) => c.role === "BCBA").length;
      const ready = cands.filter((c) => READY_STAGES.has(c.stage)).length;
      const onboarding = cands.filter(
        (c) => LATE_STAGES.has(c.stage) || c.stage === "Offer Accepted",
      ).length;
      const demand = mockLeads.filter((l) => l.state === state).length;
      const pressure = Math.max(0, demand - ready);
      return { state, total: cands.length, rbt, bcba, ready, onboarding, demand, pressure };
    }).sort((a, b) => b.pressure - a.pressure);
  }, []);

  const activeRow = stateRows.find((s) => s.state === activeState);
  const strongestState = [...stateRows].sort((a, b) => b.total - a.total)[0];

  const funnel = useMemo(() => {
    const buckets: { label: string; match: (c: Candidate) => boolean }[] = [
      { label: "Application Submitted", match: (c) => c.stage === "New Applicant" },
      { label: "Screening", match: (c) => c.stage === "Screening" },
      {
        label: "Interview",
        match: (c) =>
          c.stage === "Interview Scheduled" ||
          c.stage === "Interview" ||
          c.stage === "Interview Completed",
      },
      { label: "Offer", match: (c) => c.stage === "Offer Sent" || c.stage === "Offer" },
      { label: "Offer Accepted", match: (c) => c.stage === "Offer Accepted" },
      {
        label: "Onboarding",
        match: (c) =>
          c.stage === "Onboarding" || c.stage === "Background Check" || c.stage === "Credentialing",
      },
      { label: "Orientation", match: (c) => c.stage === "Orientation" },
      {
        label: "Training & Compliance",
        match: (c) => c.stage === "Training" || c.stage === "I9 / E-Verify",
      },
      { label: "Ready for Staffing", match: (c) => READY_STAGES.has(c.stage) },
    ];
    return buckets.map((b) => ({ label: b.label, count: mockCandidates.filter(b.match).length }));
  }, []);
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.count));

  const roleRows = useMemo(() => {
    return (["RBT", "BCBA"] as const).map((role) => {
      const cands = mockCandidates.filter((c) => c.role === role);
      const ready = cands.filter((c) => READY_STAGES.has(c.stage)).length;
      const byState = FOOTPRINT.map((state) => ({
        state,
        count: cands.filter((c) => c.state === state).length,
      })).sort((a, b) => b.count - a.count);
      return { role, total: cands.length, ready, byState };
    });
  }, []);

  const campaigns = useMemo(() => {
    const referralCount = mockCandidates.filter((c) => c.source === "Referral").length;
    const apploiCount = mockCandidates.filter((c) => c.source === "Apploi").length;
    const directCount = mockCandidates.filter((c) => c.source === "Direct").length;
    return [
      {
        id: "referral",
        title: "Staff referral program",
        icon: HandHeart,
        note: "Highest-retention channel",
        signal: referralCount,
        hint: `${referralCount} active referrals`,
      },
      {
        id: "apploi",
        title: "Apploi & job boards",
        icon: Megaphone,
        note: "Indeed, ZipRecruiter, Apploi network",
        signal: apploiCount,
        hint: `${apploiCount} applicants`,
      },
      {
        id: "schools",
        title: "University & school recruiting",
        icon: School,
        note: "Psychology, education, BCBA programs",
        signal: Math.round(mockCandidates.length * 0.15),
        hint: "Connect campus partners",
      },
      {
        id: "community",
        title: "Community & autism orgs",
        icon: Heart,
        note: "Awareness events, parent network",
        signal: Math.round(mockCandidates.length * 0.1),
        hint: "Event-driven outreach",
      },
      {
        id: "direct",
        title: "Career site & direct apply",
        icon: UserCheck,
        note: "blossomaba.com careers",
        signal: directCount,
        hint: `${directCount} direct applicants`,
      },
      {
        id: "fairs",
        title: "Job fairs & community hiring",
        icon: CalendarDays,
        note: "Local hiring events",
        signal: Math.round(mockCandidates.length * 0.08),
        hint: "Connect events calendar",
      },
    ].sort((a, b) => b.signal - a.signal);
  }, []);

  const insights = useMemo(() => {
    const out: string[] = [];
    const pressureState = stateRows[0];
    if (pressureState && pressureState.pressure > 0) {
      out.push(
        `${STATE_NAMES[pressureState.state]} demand is outpacing recruiting visibility — ${pressureState.demand} family leads vs ${pressureState.ready} staff ready.`,
      );
    }
    if (strongestState && strongestState.total > 0) {
      out.push(
        `${STATE_NAMES[strongestState.state]} carries the strongest recruiting visibility — ${strongestState.total} active applicants across RBT and BCBA.`,
      );
    }
    const referralSource = sourceRows.find((s) => s.source === "Referral");
    if (referralSource && referralSource.total > 0) {
      const rate = Math.round((referralSource.qualified / referralSource.total) * 100);
      out.push(
        `Referral applicants qualify at ${rate}% — internal referrals continue producing the strongest retention signal.`,
      );
    }
    const bcbaRow = roleRows.find((r) => r.role === "BCBA");
    if (bcbaRow && bcbaRow.total > 0 && bcbaRow.ready === 0) {
      out.push(
        `BCBA visibility remains below operational demand — ${bcbaRow.total} in pipeline but none yet ready for assignment.`,
      );
    }
    const orientationStalled = funnel.find((f) => f.label === "Orientation")?.count ?? 0;
    if (orientationStalled > 0) {
      out.push(
        `${orientationStalled} applicants currently in orientation — monitor completion velocity to protect staffing momentum.`,
      );
    }
    if (momentum.delta > 0) {
      out.push(
        `Hiring momentum is accelerating — ${momentum.recent} new applicants this week vs ${momentum.recent - momentum.delta} prior.`,
      );
    }
    return out.slice(0, 5);
  }, [stateRows, strongestState, sourceRows, roleRows, funnel, momentum]);

  return (
    <MktgPage
      title="Recruiting Marketing"
      subtitle="Operational recruiting visibility — where hiring demand, campaigns, and onboarding momentum translate into staffing readiness."
      actions={<AIPrompt label="Where is staffing demand outpacing recruiting?" variant="card" />}
    >
      {/* 1. RECRUITING VISIBILITY HERO */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-8">
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-sky-500/5 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="size-3.5" />
            Recruiting Visibility
          </div>
          <h2 className="mt-2 max-w-2xl text-xl md:text-2xl font-semibold tracking-tight text-foreground">
            {momentum.delta > 0
              ? `Hiring momentum is accelerating — ${momentum.recent} new applicants this week.`
              : strongestState
              ? `${STATE_NAMES[strongestState.state]} carries Blossom's strongest recruiting visibility right now.`
              : "Connect Apploi, Indeed, and recruiting calls in Admin → Data Uploads to activate recruiting intelligence."}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Active applicants", value: mockCandidates.length },
              { label: "Qualified rate", value: `${momentum.qualifiedRate}%` },
              { label: "Ready for staffing", value: momentum.ready },
              { label: "Top market", value: strongestState ? STATE_NAMES[strongestState.state] : "—" },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-card/60 backdrop-blur border border-border/50 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                <div className="mt-1 text-[20px] font-semibold tracking-tight text-foreground truncate">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. STAFFING GROWTH SNAPSHOT */}
      <MktgCard title="Staffing growth snapshot" hint="Recruiting momentum, not HR metrics">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "New applicants", value: momentum.recent, sub: "Last 7 days", icon: Users, delta: momentum.delta },
            { label: "Qualified applicants", value: momentum.qualified, sub: `${momentum.qualifiedRate}% qualification`, icon: TrendingUp, delta: 0 },
            { label: "Onboarding in motion", value: mockCandidates.filter((c) => LATE_STAGES.has(c.stage)).length, sub: "Background, training, credentialing", icon: ShieldCheck, delta: 0 },
            { label: "Ready for staffing", value: momentum.ready, sub: "Cleared for assignment", icon: UserCheck, delta: 0 },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="grid size-8 place-items-center rounded-lg bg-muted">
                    <Icon className="size-4 text-foreground" />
                  </div>
                  <TrendIcon delta={m.delta} />
                </div>
                <div className="mt-3 text-[11.5px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                <div className="mt-1 text-[22px] font-semibold tabular-nums text-foreground">{m.value}</div>
                <div className="mt-1 text-[11.5px] text-muted-foreground">{m.sub}</div>
              </div>
            );
          })}
        </div>
      </MktgCard>

      {/* 3. RECRUITING SOURCE INTELLIGENCE */}
      <MktgCard title="Recruiting source intelligence" hint="Where the best hires come from">
        {sourceRows.length === 0 ? (
          <EmptyRow>No recruiting source signal yet.</EmptyRow>
        ) : (
          <div className="space-y-2.5">
            {sourceRows.map((s) => {
              const max = Math.max(1, ...sourceRows.map((x) => x.total));
              const qualRate = s.total ? Math.round((s.qualified / s.total) * 100) : 0;
              return (
                <div key={s.source} className="rounded-xl border border-border/60 bg-card p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-8 place-items-center rounded-lg bg-muted">
                        <Briefcase className="size-4 text-foreground" />
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-foreground">{s.source}</div>
                        <div className="text-[11.5px] text-muted-foreground">
                          {s.rbt} RBT · {s.bcba} BCBA · {s.ready} ready
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[15px] font-semibold tabular-nums text-foreground">{s.total}</div>
                      <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{qualRate}% qualified</div>
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <ShareBar value={(s.total / max) * 100} tone={qualRate >= 50 ? "accent" : "primary"} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </MktgCard>

      {/* 4. STATE STAFFING DEMAND MAP */}
      <MktgCard title="State staffing demand" hint="Click a state to see recruiting detail">
        <div className="grid gap-2.5 md:grid-cols-2">
          {stateRows.map((s) => {
            const max = Math.max(1, ...stateRows.map((x) => x.demand + x.total));
            const isActive = activeState === s.state;
            const pressureTone = s.pressure > 5 ? "primary" : s.ready >= s.demand ? "accent" : "primary";
            return (
              <button
                key={s.state}
                onClick={() => setActiveState(isActive ? null : s.state)}
                className={`text-left rounded-xl border p-4 transition hover:-translate-y-0.5 ${
                  isActive ? "border-foreground/40 bg-muted/50" : "border-border/60 bg-card hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span className="text-[13.5px] font-medium text-foreground">
                      {STATE_NAMES[s.state] ?? s.state}
                    </span>
                  </div>
                  <TrendIcon delta={s.ready - s.pressure} />
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-[11.5px]">
                  <div>
                    <div className="text-muted-foreground">RBT</div>
                    <div className="text-[15px] font-semibold text-foreground">{s.rbt}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">BCBA</div>
                    <div className="text-[15px] font-semibold text-foreground">{s.bcba}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Ready</div>
                    <div className="text-[15px] font-semibold text-foreground">{s.ready}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Demand</div>
                    <div className="text-[15px] font-semibold text-foreground">{s.demand}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <ShareBar value={((s.total + s.demand) / max) * 100} tone={pressureTone} />
                </div>
              </button>
            );
          })}
        </div>

        {activeRow && (
          <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-medium text-foreground">
                {STATE_NAMES[activeRow.state] ?? activeRow.state} recruiting detail
              </div>
              <button
                onClick={() => setActiveState(null)}
                className="text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              <div className="text-[12.5px] text-muted-foreground">
                <span className="text-foreground font-medium">{activeRow.total}</span> active applicants ·{" "}
                <span className="text-foreground font-medium">{activeRow.onboarding}</span> in onboarding
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                <span className="text-foreground font-medium">{activeRow.ready}</span> ready for staffing vs{" "}
                <span className="text-foreground font-medium">{activeRow.demand}</span> family leads
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                RBT visibility: <span className="text-foreground font-medium">{activeRow.rbt}</span> applicants
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                BCBA visibility: <span className="text-foreground font-medium">{activeRow.bcba}</span> applicants
              </div>
            </div>
            {activeRow.pressure > 0 && (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[12px] text-foreground">
                Family demand is outpacing staffing readiness — invest in recruiting visibility for {STATE_NAMES[activeRow.state]}.
              </div>
            )}
            {activeRow.bcba === 0 && (
              <div className="mt-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-[12px] text-foreground">
                No BCBA pipeline visibility in {STATE_NAMES[activeRow.state]} — clinical staffing gap to address.
              </div>
            )}
          </div>
        )}
      </MktgCard>

      {/* 5. RECRUITING FUNNEL INTELLIGENCE */}
      <MktgCard title="Recruiting funnel" hint="Where applicants progress, stall, or drop off">
        {funnel.every((f) => f.count === 0) ? (
          <EmptyRow>No funnel movement yet.</EmptyRow>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2.5">
              {funnel.map((f, i) => {
                const prev = i > 0 ? funnel[i - 1].count : f.count;
                const drop = prev > 0 && f.count < prev ? Math.round(((prev - f.count) / prev) * 100) : 0;
                return (
                  <div key={f.label}>
                    <div className="flex items-baseline justify-between text-[12.5px]">
                      <span className="font-medium text-foreground">{f.label}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {f.count}
                        {i > 0 && drop > 0 && <span className="ml-1.5 text-amber-600">−{drop}%</span>}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <ShareBar
                        value={(f.count / maxFunnel) * 100}
                        tone={i === funnel.length - 1 ? "accent" : "primary"}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl bg-muted/40 border border-border/50 p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Operational signal
              </div>
              <div className="mt-2 text-[13.5px] leading-relaxed text-foreground">
                {momentum.ready > 0
                  ? `${momentum.ready} applicants are cleared and ready to be staffed — protect onboarding velocity to maintain pipeline.`
                  : "No applicants are fully cleared yet — orientation and credentialing are the operational bottleneck to watch."}
              </div>
              <div className="mt-3 text-[12px] text-muted-foreground">
                {mockCandidates.filter((c) => EARLY_STAGES.has(c.stage)).length} early-stage ·{" "}
                {mockCandidates.filter((c) => LATE_STAGES.has(c.stage)).length} late-stage ·{" "}
                {momentum.ready} ready
              </div>
            </div>
          </div>
        )}
      </MktgCard>

      {/* 6. RBT & BCBA VISIBILITY */}
      <div className="grid gap-4 lg:grid-cols-2">
        {roleRows.map((r) => {
          const Icon = r.role === "RBT" ? Users : Stethoscope;
          return (
            <MktgCard
              key={r.role}
              title={`${r.role} visibility`}
              hint={r.role === "RBT" ? "Front-line staffing capacity" : "Clinical staffing growth"}
            >
              <div className="rounded-xl bg-gradient-to-br from-primary/8 to-transparent border border-border/50 p-3.5">
                <div className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 size-4 text-primary shrink-0" />
                  <div className="text-[12.5px] text-foreground">
                    {r.total === 0
                      ? `No ${r.role} visibility yet — recruiting investment needed.`
                      : r.ready === 0
                      ? `${r.total} ${r.role}s in pipeline but none yet ready — focus on onboarding velocity.`
                      : `${r.ready} of ${r.total} ${r.role}s ready for staffing across active markets.`}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {r.byState.filter((s) => s.count > 0).length === 0 ? (
                  <EmptyRow>No state visibility yet for {r.role}.</EmptyRow>
                ) : (
                  r.byState
                    .filter((s) => s.count > 0)
                    .map((s) => {
                      const max = Math.max(1, ...r.byState.map((x) => x.count));
                      return (
                        <div key={s.state} className="rounded-xl border border-border/60 bg-card p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin className="size-3.5 text-muted-foreground" />
                              <span className="text-[13px] font-medium text-foreground">
                                {STATE_NAMES[s.state] ?? s.state}
                              </span>
                            </div>
                            <span className="text-[12.5px] text-muted-foreground tabular-nums">
                              {s.count} {r.role}
                            </span>
                          </div>
                          <div className="mt-2">
                            <ShareBar value={(s.count / max) * 100} tone="primary" />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </MktgCard>
          );
        })}
      </div>

      {/* 7. RECRUITING CAMPAIGN COORDINATION */}
      <MktgCard title="Recruiting campaigns" hint="Marketing + recruiting growth, coordinated">
        <div className="grid gap-2.5 md:grid-cols-2">
          {campaigns.map((c) => {
            const Icon = c.icon;
            const max = Math.max(1, ...campaigns.map((x) => x.signal));
            return (
              <div key={c.id} className="rounded-xl border border-border/60 bg-card p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 place-items-center rounded-lg bg-muted">
                      <Icon className="size-4 text-foreground" />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-foreground">{c.title}</div>
                      <div className="text-[11.5px] text-muted-foreground">{c.note}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[15px] font-semibold tabular-nums text-foreground">{c.signal}</div>
                    <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{c.hint}</div>
                  </div>
                </div>
                <div className="mt-2.5">
                  <ShareBar value={(c.signal / max) * 100} tone={c.id === "referral" ? "accent" : "primary"} />
                </div>
              </div>
            );
          })}
        </div>
      </MktgCard>

      {/* 8. AI RECRUITING INTELLIGENCE */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/8 via-card to-card p-6 md:p-7">
        <div className="absolute -top-20 -right-16 size-64 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-lg bg-primary/10">
                <Brain className="size-4 text-primary" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Operational Insights</div>
                <div className="text-[14px] font-semibold text-foreground">Recruiting intelligence summary</div>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </div>

          {insights.length === 0 ? (
            <EmptyRow>Not enough recruiting signal to summarize yet.</EmptyRow>
          ) : (
            <ul className="mt-4 space-y-2">
              {insights.map((i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-foreground">
                  <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap gap-1.5">
            <AIPrompt label="Where is staffing demand outpacing recruiting?" />
            <AIPrompt label="Which recruiting sources produce the best hires?" />
            <AIPrompt label="Where are onboarding bottlenecks emerging?" />
            <AIPrompt label="Which states need BCBA visibility most?" />
          </div>
        </div>
      </section>
    </MktgPage>
  );
}
