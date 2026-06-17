import { useMemo, useState } from "react";
import {
  Sparkles,
  PhoneCall as PhoneIcon,
  PhoneIncoming,
  PhoneMissed,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Users,
  Briefcase,
  Link2,
  Clock,
  Moon,
  Brain,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { MktgPage, MktgCard, AIPrompt, EmptyRow, ShareBar } from "./_shared";
import { LeadSourceActions } from "@/components/marketing/LeadSourceActions";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";
import { mockPhoneCalls } from "@/data/calls";
import { mockLeads } from "@/data/leads";

/* ────────────────────────────────────────────────────────────────────────── *
 * Call Tracking — operational communication intelligence. Derived entirely
 * from real phone call + lead data. Connect telephony provider via Admin →
 * Data Uploads to extend with campaign-level attribution.
 * ────────────────────────────────────────────────────────────────────────── */

const STATE_NAMES: Record<string, string> = {
  GA: "Georgia",
  NC: "North Carolina",
  TN: "Tennessee",
  VA: "Virginia",
  MD: "Maryland",
};

const QUALIFIED_STATUSES = new Set(["VOB Completed", "Sent to VOB", "Form Received"]);

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 0) return <TrendingUp className="size-3.5 text-emerald-600" />;
  if (delta < 0) return <TrendingDown className="size-3.5 text-amber-600" />;
  return <Minus className="size-3.5 text-muted-foreground" />;
}

export default function CallTracking() {
  const mi = useMarketingIntelligence();
  const [activeState, setActiveState] = useState<string | null>(null);

  const now = Date.now();
  const ageDays = (iso: string) => (now - new Date(iso).getTime()) / 86_400_000;
  const hourOf = (iso: string) => new Date(iso).getHours();

  /* ── momentum across all calls (7d vs prior 7d) ────────────────────── */
  const momentum = useMemo(() => {
    const recent = mockPhoneCalls.filter((c) => ageDays(c.callTime) <= 7);
    const prior = mockPhoneCalls.filter((c) => {
      const a = ageDays(c.callTime);
      return a > 7 && a <= 14;
    });
    const inboundRecent = recent.filter((c) => c.direction === "Inbound").length;
    const inboundPrior = prior.filter((c) => c.direction === "Inbound").length;
    const missedRecent = recent.filter(
      (c) => c.direction === "Inbound" && (c.status === "New" || c.outcome === "No Answer"),
    ).length;
    const missedPrior = prior.filter(
      (c) => c.direction === "Inbound" && (c.status === "New" || c.outcome === "No Answer"),
    ).length;
    return {
      recent: recent.length,
      prior: prior.length,
      delta: recent.length - prior.length,
      inboundRecent,
      inboundDelta: inboundRecent - inboundPrior,
      missedRecent,
      missedDelta: missedRecent - missedPrior,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── intake vs recruiting vs referral splits ───────────────────────── */
  const splits = useMemo(() => {
    const intake = mockPhoneCalls.filter((c) => c.type === "Lead");
    const recruiting = mockPhoneCalls.filter((c) => c.type === "Staff");
    const client = mockPhoneCalls.filter((c) => c.type === "Client");
    const connected = mockPhoneCalls.filter((c) => c.status === "Connected" || c.status === "Contacted").length;
    const missed = mockPhoneCalls.filter(
      (c) => c.direction === "Inbound" && (c.status === "New" || c.outcome === "No Answer"),
    ).length;
    const afterHours = mockPhoneCalls.filter((c) => {
      const h = hourOf(c.callTime);
      return h >= 18 || h < 8;
    }).length;
    const intakeConverted = intake.filter((c) => {
      if (!c.linkedLeadId) return false;
      const lead = mockLeads.find((l) => l.id === c.linkedLeadId);
      return lead && QUALIFIED_STATUSES.has(lead.status);
    }).length;
    const intakeWithLead = intake.filter((c) => c.linkedLeadId).length;
    return {
      intake,
      recruiting,
      client,
      connected,
      missed,
      afterHours,
      intakeConverted,
      intakeWithLead,
      callToLead: intake.length ? Math.round((intakeWithLead / intake.length) * 100) : 0,
      callToQualified: intakeWithLead ? Math.round((intakeConverted / intakeWithLead) * 100) : 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── state call rollup ─────────────────────────────────────────────── */
  const stateRows = useMemo(() => {
    const map = new Map<string, { state: string; total: number; intake: number; recruiting: number; missed: number; recent: number; prior: number }>();
    mockPhoneCalls.forEach((c) => {
      if (!c.state) return;
      const e = map.get(c.state) ?? { state: c.state, total: 0, intake: 0, recruiting: 0, missed: 0, recent: 0, prior: 0 };
      e.total += 1;
      if (c.type === "Lead") e.intake += 1;
      if (c.type === "Staff") e.recruiting += 1;
      if (c.direction === "Inbound" && (c.status === "New" || c.outcome === "No Answer")) e.missed += 1;
      const a = ageDays(c.callTime);
      if (a <= 7) e.recent += 1;
      else if (a <= 14) e.prior += 1;
      map.set(c.state, e);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topState = stateRows[0];
  const activeRow = stateRows.find((s) => s.state === activeState);

  /* ── intake stage progression for calls with linked leads ──────────── */
  const intakeStages = useMemo(() => {
    const stageCount = new Map<string, number>();
    splits.intake.forEach((c) => {
      if (!c.linkedLeadId) return;
      const lead = mockLeads.find((l) => l.id === c.linkedLeadId);
      if (!lead) return;
      stageCount.set(lead.status, (stageCount.get(lead.status) ?? 0) + 1);
    });
    const order = ["New Lead", "In Contact", "Sent Form", "Form Received", "Sent to VOB", "VOB Completed"];
    return order
      .map((stage) => ({ stage, count: stageCount.get(stage) ?? 0 }))
      .filter((s) => s.count > 0 || ["New Lead", "Form Received", "VOB Completed"].includes(s.stage));
  }, [splits.intake]);

  /* ── attribution surfaces (from lead source of linked leads) ───────── */
  const attribution = useMemo(() => {
    const map = new Map<string, { source: string; calls: number; qualified: number }>();
    splits.intake.forEach((c) => {
      if (!c.linkedLeadId) return;
      const lead = mockLeads.find((l) => l.id === c.linkedLeadId);
      if (!lead) return;
      const e = map.get(lead.source) ?? { source: lead.source, calls: 0, qualified: 0 };
      e.calls += 1;
      if (QUALIFIED_STATUSES.has(lead.status)) e.qualified += 1;
      map.set(lead.source, e);
    });
    return Array.from(map.values())
      .map((r) => ({ ...r, rate: r.calls ? Math.round((r.qualified / r.calls) * 100) : 0 }))
      .sort((a, b) => b.calls - a.calls);
  }, [splits.intake]);

  /* ── after-hours by state ──────────────────────────────────────────── */
  const afterHoursByState = useMemo(() => {
    const map = new Map<string, number>();
    mockPhoneCalls.forEach((c) => {
      if (!c.state) return;
      const h = hourOf(c.callTime);
      if (h >= 18 || h < 8) map.set(c.state, (map.get(c.state) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── AI insights ───────────────────────────────────────────────────── */
  const insights = useMemo(() => {
    const out: string[] = [];
    if (topState) {
      out.push(
        `${STATE_NAMES[topState.state] ?? topState.state} leads call demand with ${topState.total} calls (${topState.intake} intake, ${topState.recruiting} recruiting).`,
      );
    }
    if (momentum.inboundDelta > 0) {
      out.push(`Inbound calls are accelerating — ${momentum.inboundRecent} this week, up from ${momentum.inboundRecent - momentum.inboundDelta} prior.`);
    }
    if (splits.missed > 0) {
      out.push(`${splits.missed} inbound calls still need a callback — operational risk for intake conversion.`);
    }
    if (splits.callToQualified >= 40) {
      out.push(`Phone-linked leads qualify at ${splits.callToQualified}% — calls remain Blossom's highest-converting channel.`);
    }
    const topRecruit = stateRows.find((s) => s.recruiting > 0);
    if (topRecruit) {
      out.push(`${STATE_NAMES[topRecruit.state] ?? topRecruit.state} is generating the strongest recruiting call demand (${topRecruit.recruiting}).`);
    }
    if (splits.afterHours > 0) {
      const ahTop = afterHoursByState[0];
      out.push(
        `${splits.afterHours} after-hours calls detected${ahTop ? ` — strongest in ${STATE_NAMES[ahTop.state] ?? ahTop.state}` : ""}.`,
      );
    }
    return out.slice(0, 5);
  }, [topState, momentum, splits, stateRows, afterHoursByState]);

  return (
    <MktgPage
      title="Call Tracking"
      subtitle="Operational communication intelligence — how inbound conversations translate into intake, recruiting, and operational growth."
      actions={<AIPrompt label="Where is call demand accelerating?" variant="card" />}
    >
      <LeadSourceActions sourceLabel="CTM / CallTrackingMetrics" sourceValue="CTM" integrationId="ctm" sourcePage="call-tracking" />
      {/* ── 1. COMMUNICATION INTELLIGENCE HERO ───────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-8">
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-emerald-500/5 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="size-3.5" />
            Communication Intelligence
          </div>
          <h2 className="mt-2 max-w-2xl text-xl md:text-2xl font-semibold tracking-tight text-foreground">
            {momentum.inboundDelta > 0
              ? `Call demand is accelerating — ${momentum.inboundRecent} inbound calls this week.`
              : topState
              ? `${STATE_NAMES[topState.state] ?? topState.state} is driving Blossom's strongest call demand.`
              : "Connect your telephony provider in Admin → Data Uploads to activate call intelligence."}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Inbound · 7d", value: momentum.inboundRecent },
              { label: "Top state", value: topState ? STATE_NAMES[topState.state] ?? topState.state : "—" },
              { label: "Call → qualified", value: `${splits.callToQualified}%` },
              { label: "Need callback", value: splits.missed },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-card/60 backdrop-blur border border-border/50 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                <div className="mt-1 text-[20px] font-semibold tracking-tight text-foreground truncate">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. CALL ACTIVITY SNAPSHOT ────────────────────────────────── */}
      <MktgCard title="Call activity" hint="Operational interpretation, not telecom telemetry">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Inbound calls", value: mi.calls.inbound, sub: `${mi.calls.last24h} in last 24h`, icon: PhoneIncoming, delta: momentum.inboundDelta },
            { label: "Connected", value: splits.connected, sub: `${mockPhoneCalls.length ? Math.round((splits.connected / mockPhoneCalls.length) * 100) : 0}% answer rate`, icon: PhoneIcon, delta: 0 },
            { label: "Missed / new", value: splits.missed, sub: "Inbound awaiting callback", icon: PhoneMissed, delta: momentum.missedDelta },
            { label: "Intake calls", value: splits.intake.length, sub: `${splits.callToLead}% linked to lead`, icon: Users, delta: 0 },
            { label: "Recruiting calls", value: splits.recruiting.length, sub: "Staff inquiries", icon: Briefcase, delta: 0 },
            { label: "Referral calls", value: mi.referrals.total, sub: `${mi.referrals.byState.length} states`, icon: Link2, delta: 0 },
            { label: "After-hours", value: splits.afterHours, sub: "Outside 8a–6p window", icon: Moon, delta: 0 },
            { label: "Call → qualified", value: `${splits.callToQualified}%`, sub: `${splits.intakeConverted} of ${splits.intakeWithLead} linked`, icon: TrendingUp, delta: 0 },
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

      {/* ── 3 + 4. INTAKE + RECRUITING CALL INTELLIGENCE ─────────────── */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MktgCard title="Intake call intelligence" hint="Where phone-linked leads progress">
            {intakeStages.every((s) => s.count === 0) ? (
              <EmptyRow>No intake call progression yet.</EmptyRow>
            ) : (
              <div className="space-y-2.5">
                {intakeStages.map((s, i) => {
                  const max = Math.max(1, ...intakeStages.map((x) => x.count));
                  const prev = i > 0 ? intakeStages[i - 1].count : s.count;
                  const drop = prev > 0 ? Math.round(((prev - s.count) / prev) * 100) : 0;
                  return (
                    <div key={s.stage}>
                      <div className="flex items-baseline justify-between text-[12.5px]">
                        <span className="font-medium text-foreground">{s.stage}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {s.count}
                          {i > 0 && drop > 0 && <span className="ml-1.5 text-amber-600">−{drop}%</span>}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <ShareBar value={(s.count / max) * 100} tone={i === intakeStages.length - 1 ? "accent" : "primary"} />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 mt-2 border-t border-border/60 text-[12px] text-muted-foreground">
                  Phone-linked leads qualify at{" "}
                  <span className="text-foreground font-medium">{splits.callToQualified}%</span> — strongest channel for intake progression.
                </div>
              </div>
            )}
          </MktgCard>
        </div>

        <div className="lg:col-span-2">
          <MktgCard title="Recruiting calls" hint="Career inquiries by state">
            {splits.recruiting.length === 0 ? (
              <EmptyRow>No recruiting calls yet.</EmptyRow>
            ) : (
              <div className="space-y-2.5">
                {stateRows
                  .filter((s) => s.recruiting > 0)
                  .map((s) => {
                    const max = Math.max(1, ...stateRows.map((x) => x.recruiting));
                    return (
                      <div key={s.state} className="rounded-xl border border-border/60 bg-card p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Briefcase className="size-3.5 text-muted-foreground" />
                            <span className="text-[13px] font-medium text-foreground">
                              {STATE_NAMES[s.state] ?? s.state}
                            </span>
                          </div>
                          <span className="text-[13px] font-semibold tabular-nums text-foreground">{s.recruiting}</span>
                        </div>
                        <div className="mt-2">
                          <ShareBar value={(s.recruiting / max) * 100} tone="primary" />
                        </div>
                      </div>
                    );
                  })}
                <div className="text-[11.5px] text-muted-foreground pt-1">
                  Connect recruiting line attribution in Admin → Data Uploads for source-level breakdown.
                </div>
              </div>
            )}
          </MktgCard>
        </div>
      </div>

      {/* ── 5. STATE CALL VOLUME MAP ─────────────────────────────────── */}
      <MktgCard title="State call demand" hint="Click a state to see operational detail">
        {stateRows.length === 0 ? (
          <EmptyRow>No state call data yet.</EmptyRow>
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2">
            {stateRows.map((s) => {
              const max = Math.max(1, ...stateRows.map((x) => x.total));
              const isActive = activeState === s.state;
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
                    <TrendIcon delta={s.recent - s.prior} />
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-[11.5px]">
                    <div>
                      <div className="text-muted-foreground">Total</div>
                      <div className="text-[15px] font-semibold text-foreground">{s.total}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Intake</div>
                      <div className="text-[15px] font-semibold text-foreground">{s.intake}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Recruit</div>
                      <div className="text-[15px] font-semibold text-foreground">{s.recruiting}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Missed</div>
                      <div className={`text-[15px] font-semibold ${s.missed > 0 ? "text-amber-600" : "text-foreground"}`}>
                        {s.missed}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <ShareBar value={(s.total / max) * 100} tone={s.recent > s.prior ? "accent" : "primary"} />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {activeRow && (
          <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-medium text-foreground">
                {STATE_NAMES[activeRow.state] ?? activeRow.state} call detail
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
                <span className="text-foreground font-medium">{activeRow.intake}</span> intake calls ·{" "}
                <span className="text-foreground font-medium">{activeRow.recruiting}</span> recruiting
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                <span className="text-foreground font-medium">{activeRow.recent}</span> last 7d ·{" "}
                <span className="text-foreground font-medium">{activeRow.prior}</span> prior week
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                Missed:{" "}
                <span className={`font-medium ${activeRow.missed > 0 ? "text-amber-600" : "text-foreground"}`}>
                  {activeRow.missed}
                </span>{" "}
                · operational follow-up signal
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                Demand share:{" "}
                <span className="text-foreground font-medium">
                  {Math.round((activeRow.total / Math.max(1, mockPhoneCalls.length)) * 100)}%
                </span>{" "}
                of company call volume
              </div>
            </div>
            {activeRow.intake > activeRow.recruiting * 3 && activeRow.recruiting > 0 && (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[12px] text-foreground">
                Family demand is outpacing recruiting visibility — staffing pressure to monitor.
              </div>
            )}
          </div>
        )}
      </MktgCard>

      {/* ── 6 + 7. MISSED CALLS / RISK + ATTRIBUTION ─────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MktgCard title="Missed calls & response risk" hint="Operational awareness, not ticketing">
          {splits.missed === 0 && splits.afterHours === 0 ? (
            <EmptyRow>No outstanding response risk.</EmptyRow>
          ) : (
            <div className="space-y-2.5">
              <div className="rounded-xl border border-border/60 bg-card p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-7 place-items-center rounded-lg bg-amber-500/10">
                      <AlertTriangle className="size-3.5 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-foreground">Awaiting callback</div>
                      <div className="text-[11.5px] text-muted-foreground">Inbound calls without contact</div>
                    </div>
                  </div>
                  <span className="text-[15px] font-semibold tabular-nums text-foreground">{splits.missed}</span>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-7 place-items-center rounded-lg bg-muted">
                      <Moon className="size-3.5 text-foreground" />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-foreground">After-hours demand</div>
                      <div className="text-[11.5px] text-muted-foreground">Inquiries outside business hours</div>
                    </div>
                  </div>
                  <span className="text-[15px] font-semibold tabular-nums text-foreground">{splits.afterHours}</span>
                </div>
                {afterHoursByState.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {afterHoursByState.slice(0, 5).map((s) => (
                      <span
                        key={s.state}
                        className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {STATE_NAMES[s.state] ?? s.state} · {s.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-7 place-items-center rounded-lg bg-muted">
                      <Clock className="size-3.5 text-foreground" />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-foreground">Response momentum</div>
                      <div className="text-[11.5px] text-muted-foreground">7d vs prior 7d missed delta</div>
                    </div>
                  </div>
                  <span className={`text-[15px] font-semibold tabular-nums ${momentum.missedDelta <= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                    {momentum.missedDelta > 0 ? `+${momentum.missedDelta}` : momentum.missedDelta}
                  </span>
                </div>
              </div>
            </div>
          )}
        </MktgCard>

        <MktgCard title="Attribution & conversion" hint="Which sources drive qualifying calls">
          {attribution.length === 0 ? (
            <EmptyRow>No attributed call conversions yet.</EmptyRow>
          ) : (
            <div className="space-y-2.5">
              {attribution.map((a) => {
                const max = Math.max(1, ...attribution.map((x) => x.calls));
                return (
                  <div key={a.source} className="rounded-xl border border-border/60 bg-card p-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[13px] font-medium text-foreground">{a.source}</div>
                        <div className="text-[11.5px] text-muted-foreground">
                          {a.calls} call{a.calls === 1 ? "" : "s"} · {a.qualified} qualified
                        </div>
                      </div>
                      <span className="text-[13px] font-semibold tabular-nums text-foreground">{a.rate}%</span>
                    </div>
                    <div className="mt-2.5">
                      <ShareBar value={(a.calls / max) * 100} tone={a.rate >= 50 ? "accent" : "primary"} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </MktgCard>
      </div>

      {/* ── 8. AI CALL INTELLIGENCE PANEL ────────────────────────────── */}
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
                <div className="text-[14px] font-semibold text-foreground">Call intelligence summary</div>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </div>

          {insights.length === 0 ? (
            <EmptyRow>Not enough signal to summarize yet.</EmptyRow>
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
            <AIPrompt label="Which state has the highest call demand?" />
            <AIPrompt label="Why are calls being missed?" />
            <AIPrompt label="Which source converts best by phone?" />
            <AIPrompt label="Where is recruiting demand outpacing visibility?" />
          </div>
        </div>
      </section>
    </MktgPage>
  );
}