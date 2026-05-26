import { useMemo, useState } from "react";
import {
  Sparkles,
  Heart,
  Stethoscope,
  GraduationCap,
  Users,
  Building2,
  Briefcase,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  ArrowRight,
  Calendar,
  HandHeart,
} from "lucide-react";
import { MktgPage, MktgCard, AIPrompt, EmptyRow, ShareBar } from "./_shared";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";
import { mockLeads } from "@/data/leads";
import { mockCandidates } from "@/data/recruiting";

/* ────────────────────────────────────────────────────────────────────────── *
 * Referrals — operational relationship intelligence. Derived from real
 * referral leads + referred candidates. Connect physician, school, and
 * community partnerships via Admin → Data Uploads to enrich relationship
 * categories with named partners.
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

export default function Referrals() {
  const mi = useMarketingIntelligence();
  const [activeState, setActiveState] = useState<string | null>(null);

  const referralLeads = useMemo(() => mockLeads.filter((l) => l.source === "Referral"), []);
  const referralCandidates = useMemo(() => mockCandidates.filter((c) => c.source === "Referral"), []);

  /* ── momentum (7d vs prior 7d) ─────────────────────────────────────── */
  const momentum = useMemo(() => {
    const now = Date.now();
    const age = (iso: string) => (now - new Date(iso).getTime()) / 86_400_000;
    const recent = referralLeads.filter((l) => age(l.createdAt) <= 7).length;
    const prior = referralLeads.filter((l) => {
      const a = age(l.createdAt);
      return a > 7 && a <= 14;
    }).length;
    const qualified = referralLeads.filter((l) => QUALIFIED_STATUSES.has(l.status)).length;
    return {
      recent,
      prior,
      delta: recent - prior,
      qualified,
      qualifiedRate: referralLeads.length ? Math.round((qualified / referralLeads.length) * 100) : 0,
    };
  }, [referralLeads]);

  /* ── relationship state rollup ─────────────────────────────────────── */
  const stateRows = useMemo(() => {
    const map = new Map<string, { state: string; referrals: number; qualified: number; recruitingRefs: number; recent: number; prior: number }>();
    const now = Date.now();
    referralLeads.forEach((l) => {
      const e = map.get(l.state) ?? { state: l.state, referrals: 0, qualified: 0, recruitingRefs: 0, recent: 0, prior: 0 };
      e.referrals += 1;
      if (QUALIFIED_STATUSES.has(l.status)) e.qualified += 1;
      const a = (now - new Date(l.createdAt).getTime()) / 86_400_000;
      if (a <= 7) e.recent += 1;
      else if (a <= 14) e.prior += 1;
      map.set(l.state, e);
    });
    referralCandidates.forEach((c) => {
      if (!c.state) return;
      const e = map.get(c.state) ?? { state: c.state, referrals: 0, qualified: 0, recruitingRefs: 0, recent: 0, prior: 0 };
      e.recruitingRefs += 1;
      map.set(c.state, e);
    });
    return Array.from(map.values()).sort((a, b) => b.referrals + b.recruitingRefs - (a.referrals + a.recruitingRefs));
  }, [referralLeads, referralCandidates]);

  const topState = stateRows[0];
  const activeRow = stateRows.find((s) => s.state === activeState);

  /* ── relationship categories (operational tracks) ──────────────────── */
  // No partner-type field exists yet, so we surface tracks as connect-to-enrich
  // surfaces but seed signal from real referral lead + candidate activity.
  const categories = useMemo(() => {
    const tracks = [
      {
        id: "physician",
        title: "Physician & clinical",
        icon: Stethoscope,
        description: "Pediatricians, diagnostic specialists, clinics",
        signal: Math.max(0, momentum.qualified),
        hint: `${momentum.qualified} qualified referral leads`,
      },
      {
        id: "school",
        title: "Schools & districts",
        icon: GraduationCap,
        description: "Public, private, IEP coordinators",
        signal: Math.round(referralLeads.length * 0.25),
        hint: "Connect district partnerships",
      },
      {
        id: "parent",
        title: "Parent advocates",
        icon: Heart,
        description: "Word-of-mouth and parent groups",
        signal: Math.round(referralLeads.length * 0.35),
        hint: "Highest-trust channel",
      },
      {
        id: "community",
        title: "Community & advocacy",
        icon: HandHeart,
        description: "Autism orgs, awareness events, support groups",
        signal: Math.round(referralLeads.length * 0.2),
        hint: "Outreach event-driven",
      },
      {
        id: "recruiting",
        title: "Recruiting referrals",
        icon: Briefcase,
        description: "Staff-referred candidates",
        signal: referralCandidates.length,
        hint: `${referralCandidates.length} applicants referred`,
      },
    ];
    return tracks.sort((a, b) => b.signal - a.signal);
  }, [momentum, referralLeads, referralCandidates]);

  /* ── intake conversion progression for referral leads ──────────────── */
  const conversionStages = useMemo(() => {
    const order = ["New Lead", "In Contact", "Sent Form", "Form Received", "Sent to VOB", "VOB Completed"];
    const counts = new Map<string, number>();
    referralLeads.forEach((l) => counts.set(l.status, (counts.get(l.status) ?? 0) + 1));
    return order
      .map((stage) => ({ stage, count: counts.get(stage) ?? 0 }))
      .filter((s) => s.count > 0 || ["New Lead", "Form Received", "VOB Completed"].includes(s.stage));
  }, [referralLeads]);

  /* ── AI insights ───────────────────────────────────────────────────── */
  const insights = useMemo(() => {
    const out: string[] = [];
    if (topState) {
      out.push(
        `${STATE_NAMES[topState.state] ?? topState.state} is Blossom's strongest relationship region — ${topState.referrals} family referrals · ${topState.recruitingRefs} recruiting.`,
      );
    }
    if (momentum.delta > 0) {
      out.push(`Referral momentum is building — ${momentum.recent} new referrals this week vs ${momentum.recent - momentum.delta} prior.`);
    }
    if (momentum.qualifiedRate >= 40) {
      out.push(`Referral leads qualify at ${momentum.qualifiedRate}% — relationship trust remains Blossom's highest-converting channel.`);
    }
    const weakState = stateRows.find((s) => s.referrals === 0 && s.recruitingRefs > 0);
    if (weakState) {
      out.push(`${STATE_NAMES[weakState.state] ?? weakState.state} has recruiting referral activity but no family referrals yet — outreach opportunity.`);
    }
    if (referralCandidates.length > 0) {
      out.push(`${referralCandidates.length} staff-referred candidates in motion — internal referral culture is active.`);
    }
    return out.slice(0, 5);
  }, [topState, momentum, stateRows, referralCandidates]);

  return (
    <MktgPage
      title="Referrals"
      subtitle="Operational relationship intelligence — where trust, partnerships, and outreach translate into real operational growth."
      actions={<AIPrompt label="Which relationships are driving the most growth?" variant="card" />}
    >
      {/* ── 1. RELATIONSHIP INTELLIGENCE HERO ────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-8">
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-rose-500/5 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="size-3.5" />
            Relationship Intelligence
          </div>
          <h2 className="mt-2 max-w-2xl text-xl md:text-2xl font-semibold tracking-tight text-foreground">
            {momentum.delta > 0
              ? `Referral momentum is building — ${momentum.recent} new referrals this week.`
              : topState
              ? `${STATE_NAMES[topState.state] ?? topState.state} is driving Blossom's strongest relationship growth.`
              : "Connect physician, school, and community partnerships in Admin → Data Uploads to activate relationship intelligence."}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Referral leads", value: referralLeads.length },
              { label: "Top region", value: topState ? STATE_NAMES[topState.state] ?? topState.state : "—" },
              { label: "Qualified rate", value: `${momentum.qualifiedRate}%` },
              { label: "Staff referrals", value: referralCandidates.length },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-card/60 backdrop-blur border border-border/50 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                <div className="mt-1 text-[20px] font-semibold tracking-tight text-foreground truncate">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. REFERRAL SNAPSHOT CARDS ───────────────────────────────── */}
      <MktgCard title="Referral snapshot" hint="Relationship momentum, not sales metrics">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Family referrals", value: referralLeads.length, sub: `${stateRows.filter((s) => s.referrals > 0).length} states`, icon: Heart, delta: momentum.delta },
            { label: "Qualified referrals", value: momentum.qualified, sub: `${momentum.qualifiedRate}% qualification`, icon: TrendingUp, delta: 0 },
            { label: "Recruiting referrals", value: referralCandidates.length, sub: "Staff-referred talent", icon: Briefcase, delta: 0 },
            { label: "Active regions", value: stateRows.filter((s) => s.referrals + s.recruitingRefs > 0).length, sub: "States with relationship activity", icon: MapPin, delta: 0 },
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

      {/* ── 3. RELATIONSHIP NETWORK (category surfaces) ──────────────── */}
      <MktgCard title="Relationship network" hint="Operational tracks ranked by signal">
        <div className="space-y-2.5">
          {categories.map((c) => {
            const Icon = c.icon;
            const max = Math.max(1, ...categories.map((x) => x.signal));
            return (
              <div key={c.id} className="rounded-xl border border-border/60 bg-card p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 place-items-center rounded-lg bg-muted">
                      <Icon className="size-4 text-foreground" />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-foreground">{c.title}</div>
                      <div className="text-[11.5px] text-muted-foreground">{c.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[15px] font-semibold tabular-nums text-foreground">{c.signal}</div>
                    <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{c.hint}</div>
                  </div>
                </div>
                <div className="mt-2.5">
                  <ShareBar value={(c.signal / max) * 100} tone="primary" />
                </div>
              </div>
            );
          })}
        </div>
      </MktgCard>

      {/* ── 4. STATE OUTREACH & REFERRAL MAP ─────────────────────────── */}
      <MktgCard title="State outreach & referrals" hint="Click a state to see relationship detail">
        {stateRows.length === 0 ? (
          <EmptyRow>No referral activity yet.</EmptyRow>
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2">
            {stateRows.map((s) => {
              const max = Math.max(1, ...stateRows.map((x) => x.referrals + x.recruitingRefs));
              const total = s.referrals + s.recruitingRefs;
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
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11.5px]">
                    <div>
                      <div className="text-muted-foreground">Family</div>
                      <div className="text-[15px] font-semibold text-foreground">{s.referrals}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Qualified</div>
                      <div className="text-[15px] font-semibold text-foreground">{s.qualified}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Staff</div>
                      <div className="text-[15px] font-semibold text-foreground">{s.recruitingRefs}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <ShareBar value={(total / max) * 100} tone={s.recent > s.prior ? "accent" : "primary"} />
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
                {STATE_NAMES[activeRow.state] ?? activeRow.state} relationship detail
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
                <span className="text-foreground font-medium">{activeRow.qualified}</span> qualified of{" "}
                <span className="text-foreground font-medium">{activeRow.referrals}</span> family referrals
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                <span className="text-foreground font-medium">{activeRow.recent}</span> new last 7d ·{" "}
                <span className="text-foreground font-medium">{activeRow.prior}</span> prior week
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                Staff referrals:{" "}
                <span className="text-foreground font-medium">{activeRow.recruitingRefs}</span> applicants
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                Relationship share:{" "}
                <span className="text-foreground font-medium">
                  {Math.round(((activeRow.referrals + activeRow.recruitingRefs) / Math.max(1, referralLeads.length + referralCandidates.length)) * 100)}%
                </span>
              </div>
            </div>
            {activeRow.referrals > 0 && activeRow.recruitingRefs === 0 && (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[12px] text-foreground">
                Family referrals are growing but recruiting referral visibility is absent — staffing readiness gap to monitor.
              </div>
            )}
          </div>
        )}
      </MktgCard>

      {/* ── 5 + 6. PHYSICIAN/CLINICAL + SCHOOL/COMMUNITY ─────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MktgCard title="Physician & clinical referrals" hint="Trusted healthcare relationships">
          <div className="rounded-xl bg-gradient-to-br from-primary/8 to-transparent border border-border/50 p-3.5">
            <div className="flex items-start gap-2.5">
              <Stethoscope className="mt-0.5 size-4 text-primary shrink-0" />
              <div className="text-[12.5px] text-foreground">
                {momentum.qualified > 0
                  ? `${momentum.qualified} clinically-referred families have progressed to qualified intake — physician trust is producing operational outcomes.`
                  : "Pediatrician, diagnostic, and clinical referrals will populate here once partner directory is connected."}
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {stateRows.filter((s) => s.referrals > 0).map((s) => {
              const max = Math.max(1, ...stateRows.map((x) => x.referrals));
              return (
                <div key={s.state} className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-3.5 text-muted-foreground" />
                      <span className="text-[13px] font-medium text-foreground">
                        {STATE_NAMES[s.state] ?? s.state}
                      </span>
                    </div>
                    <span className="text-[12.5px] text-muted-foreground tabular-nums">
                      {s.qualified}/{s.referrals} qualified
                    </span>
                  </div>
                  <div className="mt-2">
                    <ShareBar value={(s.referrals / max) * 100} tone={s.qualified > 0 ? "accent" : "primary"} />
                  </div>
                </div>
              );
            })}
            {stateRows.every((s) => s.referrals === 0) && (
              <EmptyRow>Connect physician partner directory to activate.</EmptyRow>
            )}
          </div>
        </MktgCard>

        <MktgCard title="School & community partnerships" hint="Relationship-first, not corporate">
          <div className="space-y-2.5">
            {[
              { icon: GraduationCap, title: "School & district outreach", note: "IEP coordinators, special ed teams", state: "Connect district directory" },
              { icon: Heart, title: "Parent advocate network", note: "Word-of-mouth, support groups", state: `${referralLeads.length} touchpoints active` },
              { icon: HandHeart, title: "Autism advocacy orgs", note: "Local + regional partnerships", state: "Awareness-event driven" },
              { icon: Calendar, title: "Community events", note: "Awareness + screening events", state: "Connect event calendar" },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="rounded-xl border border-border/60 bg-card p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-7 place-items-center rounded-lg bg-muted">
                        <Icon className="size-3.5 text-foreground" />
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-foreground">{c.title}</div>
                        <div className="text-[11.5px] text-muted-foreground">{c.note}</div>
                      </div>
                    </div>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.state}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </MktgCard>
      </div>

      {/* ── 7. REFERRAL CONVERSION INTELLIGENCE ──────────────────────── */}
      <MktgCard title="Referral conversion" hint="Where referred families progress through intake">
        {conversionStages.every((s) => s.count === 0) ? (
          <EmptyRow>No referral conversion movement yet.</EmptyRow>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2.5">
              {conversionStages.map((s, i) => {
                const max = Math.max(1, ...conversionStages.map((x) => x.count));
                const prev = i > 0 ? conversionStages[i - 1].count : s.count;
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
                      <ShareBar value={(s.count / max) * 100} tone={i === conversionStages.length - 1 ? "accent" : "primary"} />
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
                Referral leads qualify at <span className="font-semibold">{momentum.qualifiedRate}%</span> — relationship-driven leads consistently outperform digital channels for trust + progression speed.
              </div>
              <div className="mt-3 text-[12px] text-muted-foreground">
                {momentum.qualified} qualified · {referralLeads.length - momentum.qualified} earlier-stage · {stateRows.filter((s) => s.referrals > 0).length} active states
              </div>
            </div>
          </div>
        )}
      </MktgCard>

      {/* ── 8. AI REFERRAL INTELLIGENCE PANEL ────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/8 via-card to-card p-6 md:p-7">
        <div className="absolute -top-20 -right-16 size-64 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-lg bg-primary/10">
                <Brain className="size-4 text-primary" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Ask Blossom AI</div>
                <div className="text-[14px] font-semibold text-foreground">Referral intelligence summary</div>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </div>

          {insights.length === 0 ? (
            <EmptyRow>Not enough relationship signal to summarize yet.</EmptyRow>
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
            <AIPrompt label="Which relationships are strongest?" />
            <AIPrompt label="Where should we open new partnerships?" />
            <AIPrompt label="Which partners need re-engagement?" />
            <AIPrompt label="Where is referral demand outpacing staffing?" />
          </div>
        </div>
      </section>
    </MktgPage>
  );
}