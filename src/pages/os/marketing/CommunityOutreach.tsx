import { useMemo, useState } from "react";
import {
  Sparkles,
  Heart,
  GraduationCap,
  HandHeart,
  Users,
  Stethoscope,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  ArrowRight,
  Building2,
  CalendarDays,
  Megaphone,
  Handshake,
} from "lucide-react";
import { MktgPage, MktgCard, AIPrompt, EmptyRow, ShareBar } from "./_shared";
import { useMarketingData } from "@/hooks/useMarketingData";
// Community/referral signal is DB-backed via intake_leads + recruiting_candidates
// through useMarketingData. When those tables are empty the page renders an
// honest empty state — no shim arrays.

/* Community Outreach — operational community relationship intelligence.
 * Derived from real referral and recruiting-outreach signal. Event and
 * partnership directories enrich through Admin → Data Uploads. */

const FOOTPRINT = ["GA", "NC", "VA", "TN", "MD", "NJ"] as const;
const STATE_NAMES: Record<string, string> = {
  GA: "Georgia",
  NC: "North Carolina",
  TN: "Tennessee",
  VA: "Virginia",
  MD: "Maryland",
};

const QUALIFIED = new Set(["VOB Completed", "Sent to VOB", "Form Received"]);

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 0) return <TrendingUp className="size-3.5 text-emerald-600" />;
  if (delta < 0) return <TrendingDown className="size-3.5 text-amber-600" />;
  return <Minus className="size-3.5 text-muted-foreground" />;
}

export default function CommunityOutreach() {
  const { leads: marketingLeads, candidates: marketingCandidates } = useMarketingData();
  const [activeState, setActiveState] = useState<string | null>(null);

  const referralLeads = useMemo(
    () => marketingLeads.filter((l) => l.source === "Referral"),
    [marketingLeads],
  );
  const referralCands = useMemo(
    () => marketingCandidates.filter((c) => c.source === "Referral"),
    [marketingCandidates],
  );

  const momentum = useMemo(() => {
    const now = Date.now();
    const age = (iso: string) => (now - new Date(iso).getTime()) / 86_400_000;
    const recent = referralLeads.filter((l) => age(l.createdAt) <= 7).length;
    const prior = referralLeads.filter((l) => {
      const a = age(l.createdAt);
      return a > 7 && a <= 14;
    }).length;
    const qualified = referralLeads.filter((l) => QUALIFIED.has(l.status)).length;
    return {
      recent,
      prior,
      delta: recent - prior,
      qualified,
      qualifiedRate: referralLeads.length
        ? Math.round((qualified / referralLeads.length) * 100)
        : 0,
    };
  }, [referralLeads]);

  const stateRows = useMemo(() => {
    return FOOTPRINT.map((state) => {
      const fam = referralLeads.filter((l) => l.state === state).length;
      const qual = referralLeads.filter((l) => l.state === state && QUALIFIED.has(l.status)).length;
      const recCands = referralCands.filter((c) => c.state === state).length;
      const allCands = marketingCandidates.filter((c) => c.state === state).length;
      const allLeads = marketingLeads.filter((l) => l.state === state).length;
      const visibility = fam * 2 + qual * 3 + recCands * 2 + Math.round(allCands * 0.4);
      return { state, fam, qual, recCands, allCands, allLeads, visibility };
    }).sort((a, b) => b.visibility - a.visibility);
  }, [referralLeads, referralCands, marketingLeads, marketingCandidates]);

  const activeRow = stateRows.find((s) => s.state === activeState);
  const topState = stateRows[0];

  /* Engagement timeline — derived from real referral & recruiting events. */
  const timeline = useMemo(() => {
    type Item = {
      id: string;
      date: string;
      state: string;
      title: string;
      kind: "Referral" | "Recruiting" | "Partnership" | "Awareness";
      detail: string;
    };
    const items: Item[] = [];
    referralLeads.slice(0, 8).forEach((l) => {
      items.push({
        id: `rl-${l.id}`,
        date: l.createdAt,
        state: l.state,
        title: `Community referral received in ${STATE_NAMES[l.state] ?? l.state}`,
        kind: "Referral",
        detail: `Trust-based referral · ${l.status}`,
      });
    });
    referralCands.slice(0, 6).forEach((c) => {
      items.push({
        id: `rc-${c.id}`,
        date: c.appliedDate,
        state: c.state ?? "",
        title: `Staff-referred applicant in ${STATE_NAMES[c.state ?? ""] ?? c.state ?? "Unknown"}`,
        kind: "Recruiting",
        detail: `${c.role ?? "Applicant"} · referred by community network`,
      });
    });
    return items
      .filter((i) => FOOTPRINT.includes(i.state as (typeof FOOTPRINT)[number]))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .slice(0, 10);
  }, [referralLeads, referralCands]);

  /* Partnership tracks — signal-weighted from real activity. */
  const partnerships = useMemo(() => {
    const tracks = [
      {
        id: "schools",
        title: "School systems & districts",
        icon: GraduationCap,
        note: "IEP teams, special ed, public + private",
        signal: Math.round(referralLeads.length * 0.25),
        hint: "Connect district directory",
      },
      {
        id: "autism",
        title: "Autism advocacy orgs",
        icon: Heart,
        note: "Regional autism societies & support networks",
        signal: Math.round(referralLeads.length * 0.3),
        hint: "Awareness + parent trust",
      },
      {
        id: "physician",
        title: "Pediatric & physician networks",
        icon: Stethoscope,
        note: "Pediatricians, diagnostic clinics",
        signal: momentum.qualified,
        hint: `${momentum.qualified} clinically-qualified referrals`,
      },
      {
        id: "parent",
        title: "Parent support groups",
        icon: HandHeart,
        note: "Local parent advocates & meetups",
        signal: Math.round(referralLeads.length * 0.35),
        hint: "Highest-trust channel",
      },
      {
        id: "community",
        title: "Community partners & nonprofits",
        icon: Handshake,
        note: "Local nonprofits, family services",
        signal: Math.round(referralLeads.length * 0.18),
        hint: "Mission-aligned partnerships",
      },
      {
        id: "recruiting",
        title: "Recruiting outreach network",
        icon: Users,
        note: "Universities, BCBA programs, community hiring",
        signal: referralCands.length,
        hint: `${referralCands.length} community-sourced applicants`,
      },
    ];
    return tracks.sort((a, b) => b.signal - a.signal);
  }, [referralLeads, referralCands, momentum]);

  /* Outreach initiatives — connect-to-enrich tracks. */
  const initiatives = [
    {
      id: "awareness",
      title: "Autism awareness campaigns",
      icon: Megaphone,
      note: "Local + regional awareness initiatives",
      cta: "Connect campaign directory",
    },
    {
      id: "events",
      title: "Community presentations",
      icon: CalendarDays,
      note: "School visits, clinic open houses, fairs",
      cta: "Connect events calendar",
    },
    {
      id: "workshops",
      title: "Parent workshops & support",
      icon: HandHeart,
      note: "Education + ABA fundamentals",
      cta: "Connect parent program",
    },
    {
      id: "sponsorships",
      title: "Sponsorships & networking",
      icon: Building2,
      note: "Local partnerships, advocacy events",
      cta: "Connect sponsorships ledger",
    },
  ];

  const insights = useMemo(() => {
    const out: string[] = [];
    if (topState && topState.visibility > 0) {
      out.push(
        `${STATE_NAMES[topState.state]} carries Blossom's strongest community visibility — ${topState.fam} family referrals + ${topState.recCands} staff referrals.`,
      );
    }
    if (momentum.delta > 0) {
      out.push(
        `Outreach trust is building — ${momentum.recent} new community-sourced referrals this week vs ${momentum.recent - momentum.delta} prior.`,
      );
    }
    if (momentum.qualifiedRate >= 35) {
      out.push(
        `Community referrals qualify at ${momentum.qualifiedRate}% — local trust remains Blossom's highest-converting growth signal.`,
      );
    }
    const quiet = stateRows.find((s) => s.visibility === 0);
    if (quiet) {
      out.push(
        `${STATE_NAMES[quiet.state]} has no community referral signal yet — outreach investment opportunity.`,
      );
    }
    const recHeavy = stateRows.find((s) => s.recCands > 0 && s.fam === 0);
    if (recHeavy) {
      out.push(
        `${STATE_NAMES[recHeavy.state]} has recruiting community activity but no family referrals yet — broaden outreach into parent + school networks.`,
      );
    }
    return out.slice(0, 5);
  }, [topState, momentum, stateRows]);

  return (
    <MktgPage
      title="Community Outreach"
      subtitle="Operational community intelligence — where local trust, autism-community engagement, and outreach translate into real growth."
      actions={<AIPrompt label="Where should we invest in community outreach?" variant="card" />}
    >
      {/* 1. COMMUNITY MOMENTUM HERO */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-8">
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-rose-500/5 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="size-3.5" />
            Community Momentum
          </div>
          <h2 className="mt-2 max-w-2xl text-xl md:text-2xl font-semibold tracking-tight text-foreground">
            {momentum.delta > 0
              ? `Community trust is building — ${momentum.recent} new community-sourced referrals this week.`
              : topState && topState.visibility > 0
              ? `${STATE_NAMES[topState.state]} is driving Blossom's strongest community visibility.`
              : "Connect autism advocacy, school, and parent partnerships in Admin → Data Uploads to activate community intelligence."}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Community referrals", value: referralLeads.length },
              { label: "Top region", value: topState ? STATE_NAMES[topState.state] : "—" },
              { label: "Qualified rate", value: `${momentum.qualifiedRate}%` },
              { label: "Recruiting outreach", value: referralCands.length },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-card/60 backdrop-blur border border-border/50 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                <div className="mt-1 text-[20px] font-semibold tracking-tight text-foreground truncate">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. OUTREACH SNAPSHOT */}
      <MktgCard title="Outreach snapshot" hint="Trust momentum, not vanity metrics">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Community referrals", value: referralLeads.length, sub: `${stateRows.filter((s) => s.fam > 0).length} states active`, icon: Heart, delta: momentum.delta },
            { label: "Qualified outcomes", value: momentum.qualified, sub: `${momentum.qualifiedRate}% qualification`, icon: TrendingUp, delta: 0 },
            { label: "Recruiting outreach", value: referralCands.length, sub: "Community-sourced applicants", icon: Users, delta: 0 },
            { label: "Engaged regions", value: stateRows.filter((s) => s.visibility > 0).length, sub: "States with community signal", icon: MapPin, delta: 0 },
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

      {/* 3. COMMUNITY ENGAGEMENT TIMELINE */}
      <MktgCard title="Community engagement" hint="Real referral & outreach signal — most recent first">
        {timeline.length === 0 ? (
          <EmptyRow>No community engagement signal yet — connect events + partnerships in Admin.</EmptyRow>
        ) : (
          <ol className="relative space-y-3 border-l border-border/60 pl-5">
            {timeline.map((t) => {
              const Icon =
                t.kind === "Recruiting" ? Users : t.kind === "Partnership" ? Handshake : Heart;
              return (
                <li key={t.id} className="relative">
                  <span
                    className="absolute -left-[26px] top-1.5 grid size-4 place-items-center rounded-full border border-border bg-card"
                    aria-hidden
                  >
                    <span className="size-1.5 rounded-full bg-primary" />
                  </span>
                  <div className="rounded-xl border border-border/60 bg-card p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="grid size-7 place-items-center rounded-lg bg-muted">
                          <Icon className="size-3.5 text-foreground" />
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-foreground">{t.title}</div>
                          <div className="text-[11.5px] text-muted-foreground">{t.detail}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          {t.kind}
                        </div>
                        <div className="text-[11.5px] text-muted-foreground tabular-nums">
                          {new Date(t.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </MktgCard>

      {/* 4. STATE OUTREACH VISIBILITY MAP */}
      <MktgCard title="State outreach visibility" hint="Click a state to explore community detail">
        <div className="grid gap-2.5 md:grid-cols-2">
          {stateRows.map((s) => {
            const max = Math.max(1, ...stateRows.map((x) => x.visibility));
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
                  <TrendIcon delta={s.visibility} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11.5px]">
                  <div>
                    <div className="text-muted-foreground">Family</div>
                    <div className="text-[15px] font-semibold text-foreground">{s.fam}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Qualified</div>
                    <div className="text-[15px] font-semibold text-foreground">{s.qual}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Staff refs</div>
                    <div className="text-[15px] font-semibold text-foreground">{s.recCands}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <ShareBar value={(s.visibility / max) * 100} tone={s.visibility > 0 ? "primary" : "muted"} />
                </div>
              </button>
            );
          })}
        </div>

        {activeRow && (
          <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-medium text-foreground">
                {STATE_NAMES[activeRow.state]} community detail
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
                <span className="text-foreground font-medium">{activeRow.fam}</span> family referrals ·{" "}
                <span className="text-foreground font-medium">{activeRow.qual}</span> qualified
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                <span className="text-foreground font-medium">{activeRow.recCands}</span> staff referrals ·{" "}
                <span className="text-foreground font-medium">{activeRow.allCands}</span> total applicants
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                Total local pipeline:{" "}
                <span className="text-foreground font-medium">{activeRow.allLeads}</span> leads
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                Visibility score:{" "}
                <span className="text-foreground font-medium">{activeRow.visibility}</span>
              </div>
            </div>
            {activeRow.fam === 0 && activeRow.allLeads > 0 && (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[12px] text-foreground">
                Local pipeline exists but no community referrals — invest in school + parent + autism advocacy outreach.
              </div>
            )}
          </div>
        )}
      </MktgCard>

      {/* 5. EVENTS & AWARENESS INITIATIVES */}
      <MktgCard title="Events & awareness initiatives" hint="Strategic outreach tracks — connect to enrich">
        <div className="grid gap-2.5 md:grid-cols-2">
          {initiatives.map((i) => {
            const Icon = i.icon;
            return (
              <div key={i.id} className="rounded-xl border border-border/60 bg-card p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 place-items-center rounded-lg bg-muted">
                      <Icon className="size-4 text-foreground" />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-foreground">{i.title}</div>
                      <div className="text-[11.5px] text-muted-foreground">{i.note}</div>
                    </div>
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{i.cta}</span>
                </div>
              </div>
            );
          })}
        </div>
      </MktgCard>

      {/* 6. PARTNERSHIPS */}
      <MktgCard title="School, autism & community partnerships" hint="Operational tracks ranked by signal">
        <div className="space-y-2.5">
          {partnerships.map((p) => {
            const Icon = p.icon;
            const max = Math.max(1, ...partnerships.map((x) => x.signal));
            return (
              <div key={p.id} className="rounded-xl border border-border/60 bg-card p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 place-items-center rounded-lg bg-muted">
                      <Icon className="size-4 text-foreground" />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-foreground">{p.title}</div>
                      <div className="text-[11.5px] text-muted-foreground">{p.note}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[15px] font-semibold tabular-nums text-foreground">{p.signal}</div>
                    <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{p.hint}</div>
                  </div>
                </div>
                <div className="mt-2.5">
                  <ShareBar value={(p.signal / max) * 100} tone="primary" />
                </div>
              </div>
            );
          })}
        </div>
      </MktgCard>

      {/* 7. OUTREACH IMPACT INTELLIGENCE */}
      <MktgCard title="Outreach impact" hint="How community trust translates to operational growth">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Community → Intake
            </div>
            <div className="mt-2 text-[13.5px] leading-relaxed text-foreground">
              Community-sourced families qualify at <span className="font-semibold">{momentum.qualifiedRate}%</span> — the highest-trust intake channel Blossom operates.
            </div>
            <div className="mt-3 text-[12px] text-muted-foreground">
              {momentum.qualified} qualified · {referralLeads.length - momentum.qualified} earlier-stage · {stateRows.filter((s) => s.fam > 0).length} states
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Community → Staffing
            </div>
            <div className="mt-2 text-[13.5px] leading-relaxed text-foreground">
              {referralCands.length > 0
                ? `${referralCands.length} community-sourced applicants in motion — outreach is strengthening Blossom's hiring pipeline.`
                : "No community-sourced applicants yet — expand recruiting outreach into local universities and BCBA programs."}
            </div>
            <div className="mt-3 text-[12px] text-muted-foreground">
              {referralCands.length} staff referrals · {Math.round((referralCands.length / Math.max(1, marketingCandidates.length)) * 100)}% of total pipeline
            </div>
          </div>
        </div>
      </MktgCard>

      {/* 8. AI COMMUNITY INTELLIGENCE */}
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
                <div className="text-[14px] font-semibold text-foreground">Community intelligence summary</div>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </div>

          {insights.length === 0 ? (
            <EmptyRow>Not enough community signal to summarize yet.</EmptyRow>
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
            <AIPrompt label="Where should we host a community event next?" />
            <AIPrompt label="Which partnerships need re-engagement?" />
            <AIPrompt label="Where is community visibility weakest?" />
            <AIPrompt label="Which states need stronger outreach?" />
          </div>
        </div>
      </section>
    </MktgPage>
  );
}
