import { useMemo, useState } from "react";
import type { LeadSource } from "@/data/leads";
import { useMarketingData } from "@/hooks/useMarketingData";
import {
  Sparkles,
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Building2,
  FileText,
  HelpCircle,
  Brain,
  Link2,
  Briefcase,
  PhoneCall,
  MousePointerClick,
  Smartphone,
  Users,
  ArrowRight,
} from "lucide-react";
import { MktgPage, MktgCard, AIPrompt, EmptyRow, ShareBar } from "./_shared";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";

/* ────────────────────────────────────────────────────────────────────────── *
 * Web Analytics — operational web intelligence. Derived from real lead,
 * call, and candidate data. Connect Google Analytics / Search Console via
 * Admin → Data Uploads to extend with session and impression layers.
 * ────────────────────────────────────────────────────────────────────────── */

const STATE_NAMES: Record<string, string> = {
  GA: "Georgia",
  NC: "North Carolina",
  TN: "Tennessee",
  VA: "Virginia",
  MD: "Maryland",
};

const DIGITAL_SOURCES: LeadSource[] = ["Website", "Organic", "Digital", "Ads", "Facebook"];
const ORGANIC_SOURCES: LeadSource[] = ["Website", "Organic"];

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 0) return <TrendingUp className="size-3.5 text-emerald-600" />;
  if (delta < 0) return <TrendingDown className="size-3.5 text-amber-600" />;
  return <Minus className="size-3.5 text-muted-foreground" />;
}

export default function WebAnalytics() {
  const { leads: marketingLeads, calls: marketingCalls, candidates: marketingCandidates } = useMarketingData();
  const mi = useMarketingIntelligence();
  const [activeState, setActiveState] = useState<string | null>(null);

  /* ── digital + organic momentum ─────────────────────────────────────── */
  const digital = useMemo(() => {
    const all = marketingLeads.filter((l) => (DIGITAL_SOURCES as string[]).includes(l.source));
    const organic = marketingLeads.filter((l) => (ORGANIC_SOURCES as string[]).includes(l.source));
    const now = Date.now();
    const within = (iso: string, d: number) => now - new Date(iso).getTime() <= d * 86_400_000;
    const between = (iso: string, lo: number, hi: number) => {
      const age = (now - new Date(iso).getTime()) / 86_400_000;
      return age > lo && age <= hi;
    };
    const recent = all.filter((l) => within(l.createdAt, 7)).length;
    const prior = all.filter((l) => between(l.createdAt, 7, 14)).length;
    const orgRecent = organic.filter((l) => within(l.createdAt, 7)).length;
    const orgPrior = organic.filter((l) => between(l.createdAt, 7, 14)).length;
    const qualified = all.filter((l) =>
      ["VOB Completed", "Sent to VOB", "Form Received"].includes(l.status),
    ).length;
    return {
      all,
      organic,
      total: all.length,
      recent,
      prior,
      delta: recent - prior,
      orgRecent,
      orgDelta: orgRecent - orgPrior,
      qualified,
      qualifiedRate: all.length ? Math.round((qualified / all.length) * 100) : 0,
    };
  }, []);

  /* ── traffic channel cards ──────────────────────────────────────────── */
  const channels = useMemo(() => {
    const websiteCount = mi.bySource.find((s) => s.source === "Website")?.count ?? 0;
    const organicCount = mi.bySource.find((s) => s.source === "Organic")?.count ?? 0;
    const facebookCount = mi.bySource.find((s) => s.source === "Facebook")?.count ?? 0;
    const adsCount = mi.bySource.find((s) => s.source === "Ads")?.count ?? 0;
    const referralCount = mi.referrals.total;
    const phoneCount = mi.calls.inbound;
    return [
      { label: "Website sessions", value: websiteCount, sub: "Direct + branded entry", icon: Globe, delta: digital.delta },
      { label: "Organic discovery", value: organicCount, sub: "Search-driven leads", icon: Sparkles, delta: digital.orgDelta },
      { label: "Paid / social", value: adsCount + facebookCount, sub: "Ads + Facebook", icon: MousePointerClick, delta: 0 },
      { label: "Recruiting traffic", value: mi.recruitingBySource.reduce((s, r) => s + r.count, 0), sub: `${mi.recruitingBySource.length} sources`, icon: Briefcase, delta: 0 },
      { label: "Intake conversions", value: digital.qualified, sub: `${digital.qualifiedRate}% qualified`, icon: Users, delta: 0 },
      { label: "Phone conversions", value: phoneCount, sub: `${mi.calls.last24h} in last 24h`, icon: PhoneCall, delta: 0 },
      { label: "Referral traffic", value: referralCount, sub: `${mi.referrals.byState.length} states`, icon: Link2, delta: 0 },
      { label: "Mobile engagement", value: Math.round(digital.total * 0.62), sub: "Est. mobile share", icon: Smartphone, delta: 0 },
    ];
  }, [mi, digital]);

  /* ── family journey — surfaces × intake stages ──────────────────────── */
  const journey = useMemo(() => {
    const stageOf = (names: string[]) =>
      mi.pipeline.filter((p) => names.includes(p.stage)).reduce((s, p) => s + p.count, 0);
    const surfaces = [
      { id: "state", title: "State pages", icon: MapPin, signal: digital.organic.length, hint: "Organic entry surfaces" },
      { id: "clinic", title: "Clinic & service pages", icon: Building2, signal: marketingCalls.length, hint: "Drive inbound calls" },
      { id: "parent", title: "Parent education", icon: FileText, signal: mi.bySource.find((s) => s.source === "Website")?.count ?? 0, hint: "Trust-building content" },
      { id: "faq", title: "Insurance & FAQ", icon: HelpCircle, signal: stageOf(["Form Received", "Sent to VOB"]), hint: "Reduces intake friction" },
      { id: "referral", title: "Referral landing", icon: Link2, signal: mi.referrals.total, hint: "Relationship-driven entry" },
      { id: "ai", title: "AI-answer surfaces", icon: Brain, signal: digital.orgRecent, hint: "Recent organic discovery" },
    ].sort((a, b) => b.signal - a.signal);
    const funnel = [
      { stage: "New Lead", count: stageOf(["New Lead", "In Contact"]) },
      { stage: "Form Received", count: stageOf(["Form Received"]) },
      { stage: "Sent to VOB", count: stageOf(["Sent to VOB"]) },
      { stage: "VOB Completed", count: stageOf(["VOB Completed"]) },
      { stage: "Converted", count: stageOf(["Converted"]) },
    ];
    return { surfaces, funnel };
  }, [mi, digital]);

  /* ── state traffic map ──────────────────────────────────────────────── */
  const stateRows = useMemo(() => {
    const map = new Map<string, { state: string; sessions: number; organic: number; recruiting: number; calls: number; qualified: number; recent: number; prior: number }>();
    marketingLeads.forEach((l) => {
      const e = map.get(l.state) ?? { state: l.state, sessions: 0, organic: 0, recruiting: 0, calls: 0, qualified: 0, recent: 0, prior: 0 };
      if ((DIGITAL_SOURCES as string[]).includes(l.source)) e.sessions += 1;
      if ((ORGANIC_SOURCES as string[]).includes(l.source)) e.organic += 1;
      if (["VOB Completed", "Sent to VOB", "Form Received"].includes(l.status)) e.qualified += 1;
      const age = (Date.now() - new Date(l.createdAt).getTime()) / 86_400_000;
      if (age <= 7) e.recent += 1;
      else if (age <= 14) e.prior += 1;
      map.set(l.state, e);
    });
    marketingCalls.forEach((c) => {
      if (!c.state) return;
      const e = map.get(c.state) ?? { state: c.state, sessions: 0, organic: 0, recruiting: 0, calls: 0, qualified: 0, recent: 0, prior: 0 };
      e.calls += 1;
      map.set(c.state, e);
    });
    marketingCandidates.forEach((c) => {
      if (!c.state) return;
      const e = map.get(c.state) ?? { state: c.state, sessions: 0, organic: 0, recruiting: 0, calls: 0, qualified: 0, recent: 0, prior: 0 };
      e.recruiting += 1;
      map.set(c.state, e);
    });
    return Array.from(map.values()).sort((a, b) => b.sessions - a.sessions);
  }, []);

  const topState = stateRows[0];
  const activeRow = stateRows.find((s) => s.state === activeState);

  /* ── recruiting traffic ─────────────────────────────────────────────── */
  const recruitingTraffic = useMemo(() => {
    const total = mi.recruitingBySource.reduce((s, r) => s + r.count, 0);
    const byState = new Map<string, number>();
    marketingCandidates.forEach((c) => {
      if (!c.state) return;
      byState.set(c.state, (byState.get(c.state) ?? 0) + 1);
    });
    const states = Array.from(byState.entries())
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);
    return { total, byState: states };
  }, [mi]);

  /* ── AI insights ────────────────────────────────────────────────────── */
  const insights = useMemo(() => {
    const out: string[] = [];
    if (topState) {
      out.push(`${STATE_NAMES[topState.state] ?? topState.state} is generating Blossom's strongest digital activity (${topState.sessions} sessions, ${topState.qualified} qualified).`);
    }
    if (digital.orgDelta > 0) {
      out.push(`Organic visibility is accelerating — ${digital.orgRecent} organic leads this week, up from ${digital.orgRecent - digital.orgDelta} prior week.`);
    }
    if (mi.bottlenecks[0]) {
      out.push(`Web traffic is stalling at "${mi.bottlenecks[0].stage}" — ${mi.bottlenecks[0].count} leads stuck. Clarifying content could improve self-service progression.`);
    }
    const recruitingTopState = recruitingTraffic.byState[0];
    const websiteTopState = stateRows[0];
    if (recruitingTopState && websiteTopState && recruitingTopState.state !== websiteTopState.state) {
      out.push(`${STATE_NAMES[websiteTopState.state] ?? websiteTopState.state} family traffic is outpacing recruiting visibility — staffing risk if demand keeps climbing.`);
    }
    if (mi.referrals.total > 0) {
      out.push(`Referral landing surfaces drove ${mi.referrals.total} leads across ${mi.referrals.byState.length} states — content here punches above its volume.`);
    }
    return out.slice(0, 5);
  }, [topState, digital, mi, recruitingTraffic, stateRows]);

  return (
    <MktgPage
      title="Web Analytics"
      subtitle="Operational web intelligence — how families and candidates interact with Blossom online, and the operational impact it creates."
      actions={<AIPrompt label="What changed in web behavior this week?" variant="card" />}
    >
      {/* ── 1. DIGITAL GROWTH HERO ───────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-8">
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-emerald-500/5 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="size-3.5" />
            Digital Growth Intelligence
          </div>
          <h2 className="mt-2 max-w-2xl text-xl md:text-2xl font-semibold tracking-tight text-foreground">
            {digital.delta > 0
              ? `Digital momentum is building — ${digital.recent} leads this week, up from ${digital.recent - digital.delta} prior.`
              : topState
              ? `${STATE_NAMES[topState.state] ?? topState.state} continues driving Blossom's strongest digital activity.`
              : "Connect Google Analytics in Admin → Data Uploads to activate digital intelligence."}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Digital leads", value: digital.total },
              { label: "Top state", value: topState ? STATE_NAMES[topState.state] ?? topState.state : "—" },
              { label: "Intake qualified", value: `${digital.qualifiedRate}%` },
              { label: "Recruiting reach", value: recruitingTraffic.total },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-card/60 backdrop-blur border border-border/50 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                <div className="mt-1 text-[20px] font-semibold tracking-tight text-foreground truncate">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. TRAFFIC INTELLIGENCE SNAPSHOT ─────────────────────────── */}
      <MktgCard title="Traffic intelligence" hint="Operational interpretation, not raw page views">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="grid size-8 place-items-center rounded-lg bg-muted">
                    <Icon className="size-4 text-foreground" />
                  </div>
                  <TrendIcon delta={c.delta} />
                </div>
                <div className="mt-3 text-[11.5px] uppercase tracking-wider text-muted-foreground">{c.label}</div>
                <div className="mt-1 text-[22px] font-semibold tabular-nums text-foreground">{c.value}</div>
                <div className="mt-1 text-[11.5px] text-muted-foreground">{c.sub}</div>
              </div>
            );
          })}
        </div>
      </MktgCard>

      {/* ── 3. FAMILY JOURNEY INTELLIGENCE ───────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MktgCard title="Family journey" hint="Website surfaces → intake stage progression">
            <div className="space-y-2.5">
              {journey.surfaces.map((s) => {
                const Icon = s.icon;
                const max = Math.max(1, ...journey.surfaces.map((x) => x.signal));
                return (
                  <div key={s.id} className="rounded-xl border border-border/60 bg-card p-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="grid size-7 place-items-center rounded-lg bg-muted">
                          <Icon className="size-3.5 text-foreground" />
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-foreground">{s.title}</div>
                          <div className="text-[11.5px] text-muted-foreground">{s.hint}</div>
                        </div>
                      </div>
                      <span className="text-[13px] font-semibold tabular-nums text-foreground">{s.signal}</span>
                    </div>
                    <div className="mt-2.5">
                      <ShareBar value={(s.signal / max) * 100} tone="primary" />
                    </div>
                  </div>
                );
              })}
            </div>
          </MktgCard>
        </div>

        <div className="lg:col-span-2">
          <MktgCard title="Intake conversion flow" hint="Where families progress and drop off">
            {journey.funnel.every((f) => f.count === 0) ? (
              <EmptyRow>No intake conversion signal yet.</EmptyRow>
            ) : (
              <div className="space-y-2.5">
                {journey.funnel.map((f, i) => {
                  const max = Math.max(1, ...journey.funnel.map((x) => x.count));
                  const prev = i > 0 ? journey.funnel[i - 1].count : f.count;
                  const drop = prev > 0 ? Math.round(((prev - f.count) / prev) * 100) : 0;
                  return (
                    <div key={f.stage}>
                      <div className="flex items-baseline justify-between text-[12.5px]">
                        <span className="font-medium text-foreground">{f.stage}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {f.count}
                          {i > 0 && drop > 0 && <span className="ml-1.5 text-amber-600">−{drop}%</span>}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <ShareBar value={(f.count / max) * 100} tone={i === journey.funnel.length - 1 ? "accent" : "primary"} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </MktgCard>
        </div>
      </div>

      {/* ── 4. STATE TRAFFIC & VISIBILITY MAP ────────────────────────── */}
      <MktgCard title="State traffic & visibility" hint="Click a state to see operational detail">
        {stateRows.length === 0 ? (
          <EmptyRow>No state traffic yet.</EmptyRow>
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2">
            {stateRows.map((s) => {
              const max = Math.max(1, ...stateRows.map((x) => x.sessions || x.calls));
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
                      <div className="text-muted-foreground">Sessions</div>
                      <div className="text-[15px] font-semibold text-foreground">{s.sessions}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Organic</div>
                      <div className="text-[15px] font-semibold text-foreground">{s.organic}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Calls</div>
                      <div className="text-[15px] font-semibold text-foreground">{s.calls}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Recruiting</div>
                      <div className="text-[15px] font-semibold text-foreground">{s.recruiting}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <ShareBar value={((s.sessions || s.calls) / max) * 100} tone={s.recent > s.prior ? "accent" : "primary"} />
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
                {STATE_NAMES[activeRow.state] ?? activeRow.state} detail
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
                <span className="text-foreground font-medium">{activeRow.qualified}</span> qualified leads from{" "}
                <span className="text-foreground font-medium">{activeRow.sessions}</span> digital sessions
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                <span className="text-foreground font-medium">{activeRow.recent}</span> leads in last 7d ·{" "}
                <span className="text-foreground font-medium">{activeRow.prior}</span> prior week
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                Recruiting visibility:{" "}
                <span className="text-foreground font-medium">{activeRow.recruiting}</span> applicants tracked
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                Inbound calls:{" "}
                <span className="text-foreground font-medium">{activeRow.calls}</span> · phone-to-web ratio{" "}
                {activeRow.sessions ? Math.round((activeRow.calls / activeRow.sessions) * 100) : 0}%
              </div>
            </div>
            {activeRow.sessions > activeRow.recruiting * 2 && activeRow.recruiting > 0 && (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[12px] text-foreground">
                Family demand is outpacing recruiting visibility — staffing risk to monitor.
              </div>
            )}
          </div>
        )}
      </MktgCard>

      {/* ── 5 + 6. RECRUITING + CONTENT ENGAGEMENT ───────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MktgCard title="Recruiting traffic" hint="Career visibility + applicant flow">
          {mi.recruitingBySource.length === 0 ? (
            <EmptyRow>No recruiting traffic yet.</EmptyRow>
          ) : (
            <div className="space-y-3">
              {mi.recruitingBySource.map((r) => {
                const max = Math.max(1, ...mi.recruitingBySource.map((x) => x.count));
                return (
                  <div key={r.source}>
                    <div className="flex items-baseline justify-between text-[13px]">
                      <span className="font-medium text-foreground">{r.source}</span>
                      <span className="text-muted-foreground tabular-nums">{r.count} applicants</span>
                    </div>
                    <div className="mt-1.5">
                      <ShareBar value={(r.count / max) * 100} tone="primary" />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 mt-2 border-t border-border/60 text-[12px] text-muted-foreground">
                Strongest recruiting state:{" "}
                <span className="text-foreground font-medium">
                  {recruitingTraffic.byState[0] ? STATE_NAMES[recruitingTraffic.byState[0].state] ?? recruitingTraffic.byState[0].state : "—"}
                </span>
              </div>
            </div>
          )}
        </MktgCard>

        <MktgCard title="Content engagement" hint="What's building trust and visibility">
          <div className="space-y-2.5">
            {[
              { title: "Parent education", signal: mi.bySource.find((s) => s.source === "Website")?.count ?? 0, note: "Trust + intent" },
              { title: "Insurance & FAQ", signal: (mi.pipeline.find((p) => p.stage === "Form Received")?.count ?? 0) + (mi.pipeline.find((p) => p.stage === "Sent to VOB")?.count ?? 0), note: "Reduces intake friction" },
              { title: "Clinic & service pages", signal: marketingCalls.length, note: "Drives inbound calls" },
              { title: "Referral content", signal: mi.referrals.total, note: "Relationship-driven entry" },
              { title: "Recruiting pages", signal: recruitingTraffic.total, note: "Staffing visibility" },
            ]
              .sort((a, b) => b.signal - a.signal)
              .map((c) => {
                const max = Math.max(1, mi.totals.leads, recruitingTraffic.total);
                return (
                  <div key={c.title} className="rounded-xl border border-border/60 bg-card p-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[13px] font-medium text-foreground">{c.title}</div>
                        <div className="text-[11.5px] text-muted-foreground">{c.note}</div>
                      </div>
                      <span className="text-[13px] font-semibold tabular-nums text-foreground">{c.signal}</span>
                    </div>
                    <div className="mt-2.5">
                      <ShareBar value={(c.signal / max) * 100} tone="primary" />
                    </div>
                  </div>
                );
              })}
          </div>
        </MktgCard>
      </div>

      {/* ── 7. CONVERSION & INTAKE INTELLIGENCE ──────────────────────── */}
      <MktgCard title="Conversion intelligence" hint="Website behavior → operational outcomes">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Intake form completions", value: digital.qualified, sub: "Through to VOB stages" },
            { label: "Phone-call conversions", value: mi.calls.inbound - mi.calls.missed, sub: `${mi.calls.missed} missed` },
            { label: "Referral conversions", value: mi.referrals.total, sub: `${mi.referrals.byState.length} states` },
            { label: "Stalled at form stage", value: mi.bottlenecks.find((b) => b.stage === "Form Received")?.count ?? 0, sub: "≥ 7 days in stage" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
              <div className="mt-1 text-[22px] font-semibold tabular-nums text-foreground">{m.value}</div>
              <div className="mt-1 text-[11.5px] text-muted-foreground">{m.sub}</div>
            </div>
          ))}
        </div>
      </MktgCard>

      {/* ── 8. AI WEB INTELLIGENCE PANEL ─────────────────────────────── */}
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
                <div className="text-[14px] font-semibold text-foreground">Web intelligence summary</div>
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
            <AIPrompt label="Which content drives intake?" />
            <AIPrompt label="Where is recruiting visibility weakest?" />
            <AIPrompt label="What state should we invest in next?" />
            <AIPrompt label="Why are families dropping off?" />
          </div>
        </div>
      </section>
    </MktgPage>
  );
}