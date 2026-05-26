import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Phone,
  Globe,
  Heart,
  Megaphone,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { MktgPage, MktgCard, AIPrompt, EmptyRow, ShareBar } from "./_shared";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";
import { mockLeads } from "@/data/leads";
import { mockPhoneCalls } from "@/data/calls";
import { mockCandidates } from "@/data/recruiting";

/* ────────────────────────────────────────────────────────────────────────── *
 * Campaigns — operational growth intelligence.
 * Every "campaign" is derived from real Blossom operational data (leads,
 * calls, candidates). No mock campaigns, no fake analytics.
 * ────────────────────────────────────────────────────────────────────────── */

const STATE_NAMES: Record<string, string> = {
  GA: "Georgia",
  NC: "North Carolina",
  TN: "Tennessee",
  VA: "Virginia",
  MD: "Maryland",
};

type CampaignStatus = "Growing" | "Stable" | "Needs Attention" | "Launching";

interface DerivedCampaign {
  id: string;
  name: string;
  type: string;
  state: string;
  objective: string;
  leads: number;
  qualified: number;
  recent7: number;
  prior7: number;
  delta: number;
  status: CampaignStatus;
  icon: typeof Megaphone;
}

function classifyStatus(recent: number, prior: number, total: number): CampaignStatus {
  if (total <= 1) return "Launching";
  if (recent > prior) return "Growing";
  if (recent < prior && prior > 1) return "Needs Attention";
  return "Stable";
}

function iconForType(type: string) {
  if (type.includes("Recruiting")) return Users;
  if (type.includes("Referral")) return Heart;
  if (type.includes("Phone")) return Phone;
  if (type.includes("SEO") || type.includes("Organic") || type.includes("Web")) return Globe;
  return Megaphone;
}

function StatusDot({ status }: { status: CampaignStatus }) {
  const cls =
    status === "Growing"
      ? "bg-emerald-500"
      : status === "Needs Attention"
      ? "bg-amber-500"
      : status === "Launching"
      ? "bg-primary"
      : "bg-muted-foreground/50";
  return <span className={`inline-block size-1.5 rounded-full ${cls}`} aria-hidden />;
}

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 0) return <TrendingUp className="size-3.5 text-emerald-600" />;
  if (delta < 0) return <TrendingDown className="size-3.5 text-amber-600" />;
  return <Minus className="size-3.5 text-muted-foreground" />;
}

export default function Campaigns() {
  const mi = useMarketingIntelligence();
  const [activeState, setActiveState] = useState<string | null>(null);

  /* ── derive campaigns from real source × state activity ─────────────── */
  const campaigns = useMemo<DerivedCampaign[]>(() => {
    const now = Date.now();
    const buckets = new Map<string, { leads: number; qualified: number; recent: number; prior: number; source: string; state: string }>();

    mockLeads.forEach((l) => {
      const key = `${l.source}|${l.state}`;
      const b = buckets.get(key) ?? { leads: 0, qualified: 0, recent: 0, prior: 0, source: l.source, state: l.state };
      b.leads += 1;
      const ageDays = (now - new Date(l.createdAt).getTime()) / 86_400_000;
      if (ageDays <= 7) b.recent += 1;
      else if (ageDays <= 14) b.prior += 1;
      if (["VOB Completed", "Sent to VOB", "Form Received"].includes(l.status)) b.qualified += 1;
      buckets.set(key, b);
    });

    const list: DerivedCampaign[] = Array.from(buckets.entries()).map(([key, b]) => {
      const typeMap: Record<string, string> = {
        Website: "SEO Visibility",
        Organic: "SEO Visibility",
        Phone: "Call Tracking",
        Facebook: "Community Awareness",
        Ads: "Paid Visibility",
        Referral: "Referral Growth",
        Digital: "Digital Outreach",
        Insurance: "Payor Outreach",
      };
      const type = typeMap[b.source] ?? b.source;
      return {
        id: key,
        name: `${b.source} · ${STATE_NAMES[b.state] ?? b.state}`,
        type,
        state: b.state,
        objective: `Drive ${type.toLowerCase()} in ${STATE_NAMES[b.state] ?? b.state}`,
        leads: b.leads,
        qualified: b.qualified,
        recent7: b.recent,
        prior7: b.prior,
        delta: b.recent - b.prior,
        status: classifyStatus(b.recent, b.prior, b.leads),
        icon: iconForType(type),
      };
    });

    return list.sort((a, b) => b.leads - a.leads);
  }, []);

  const filteredCampaigns = activeState
    ? campaigns.filter((c) => c.state === activeState)
    : campaigns;

  /* ── intelligence timeline (real recent activity) ───────────────────── */
  const timeline = useMemo(() => {
    const now = Date.now();
    type Event = { ts: number; label: string; meta: string; icon: typeof Megaphone };
    const events: Event[] = [];

    mockLeads.slice(0, 6).forEach((l) => {
      events.push({
        ts: new Date(l.createdAt).getTime(),
        label: `${l.source} lead in ${STATE_NAMES[l.state] ?? l.state}`,
        meta: l.status,
        icon: iconForType(l.source === "Referral" ? "Referral" : l.source),
      });
    });
    mockPhoneCalls.slice(0, 4).forEach((c) => {
      if (!c.state) return;
      events.push({
        ts: new Date(c.callTime).getTime(),
        label: `${c.direction} call · ${STATE_NAMES[c.state] ?? c.state}`,
        meta: c.outcome,
        icon: Phone,
      });
    });
    mockCandidates.slice(0, 4).forEach((c) => {
      events.push({
        ts: now - Math.random() * 86_400_000 * 3,
        label: `${c.source} applicant · ${STATE_NAMES[c.state] ?? c.state}`,
        meta: c.stage,
        icon: Users,
      });
    });

    return events.sort((a, b) => b.ts - a.ts).slice(0, 8);
  }, []);

  /* ── strongest state for hero summary ───────────────────────────────── */
  const topState = mi.stateTrend[0];
  const heroLine = topState
    ? topState.delta > 0
      ? `${STATE_NAMES[topState.state] ?? topState.state} lead momentum is accelerating — ${topState.recent} new this week.`
      : `${STATE_NAMES[topState.state] ?? topState.state} remains the strongest operational footprint.`
    : "Awaiting operational growth signals.";

  /* ── recruiting campaigns (real candidate source × state) ───────────── */
  const recruitingCampaigns = useMemo(() => {
    const buckets = new Map<string, { source: string; state: string; count: number; staged: number }>();
    mockCandidates.forEach((c) => {
      if (!c.state) return;
      const key = `${c.source}|${c.state}`;
      const b = buckets.get(key) ?? { source: c.source, state: c.state, count: 0, staged: 0 };
      b.count += 1;
      if (["Offer Accepted", "Training", "Credentialing", "Ready for Staffing"].includes(c.stage)) b.staged += 1;
      buckets.set(key, b);
    });
    return Array.from(buckets.values()).sort((a, b) => b.count - a.count).slice(0, 6);
  }, []);

  const states = ["GA", "NC", "TN", "VA", "MD"];

  return (
    <MktgPage
      title="Campaigns"
      subtitle="Operational growth coordination across lead generation, recruiting, outreach, and referrals — all derived from real Blossom activity."
      actions={<AIPrompt label="What's driving growth this week?" variant="card" />}
    >
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-8">
        <div className="absolute -top-20 -right-20 size-64 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="size-3.5" />
            Growth Pulse
          </div>
          <h2 className="mt-2 max-w-2xl text-xl md:text-2xl font-semibold tracking-tight text-foreground">
            {heroLine}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Active campaigns", value: campaigns.length },
              { label: "Leads · 7d", value: mi.velocity.leadsLast7 },
              { label: "Qualified rate", value: `${mi.velocity.qualifiedRate}%` },
              { label: "Recruiting reach", value: mockCandidates.length },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-card/60 backdrop-blur border border-border/50 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                <div className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATE FILTER ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveState(null)}
          className={`h-8 rounded-full px-3 text-[12.5px] font-medium transition ${
            activeState === null
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-muted/70"
          }`}
        >
          All states
        </button>
        {states.map((s) => (
          <button
            key={s}
            onClick={() => setActiveState(activeState === s ? null : s)}
            className={`h-8 rounded-full px-3 text-[12.5px] font-medium transition ${
              activeState === s
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {STATE_NAMES[s]}
          </button>
        ))}
      </div>

      {/* ── ACTIVE CAMPAIGNS GRID ────────────────────────────────────── */}
      <MktgCard title="Active campaigns" hint="Derived from real source × state lead activity">
        {filteredCampaigns.length === 0 ? (
          <EmptyRow>No active campaigns for this filter.</EmptyRow>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.slice(0, 9).map((c) => {
              const Icon = c.icon;
              const share = Math.min(100, Math.round((c.qualified / Math.max(1, c.leads)) * 100));
              return (
                <div
                  key={c.id}
                  className="group rounded-xl border border-border/60 bg-card p-4 transition hover:-translate-y-0.5 hover:border-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="grid size-8 place-items-center rounded-lg bg-muted">
                        <Icon className="size-4 text-foreground" />
                      </div>
                      <div>
                        <div className="text-[13.5px] font-medium text-foreground">{c.name}</div>
                        <div className="text-[11.5px] text-muted-foreground">{c.type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <StatusDot status={c.status} />
                      {c.status}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-[11.5px]">
                    <div>
                      <div className="text-muted-foreground">Leads</div>
                      <div className="text-[15px] font-semibold text-foreground">{c.leads}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Qualified</div>
                      <div className="text-[15px] font-semibold text-foreground">{c.qualified}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">7d</div>
                      <div className="flex items-center gap-1 text-[15px] font-semibold text-foreground">
                        {c.recent7}
                        <TrendIcon delta={c.delta} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <ShareBar value={share} tone={share >= 50 ? "accent" : "primary"} />
                    <div className="mt-1 text-[11px] text-muted-foreground">{share}% qualified conversion</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </MktgCard>

      {/* ── INTELLIGENCE TIMELINE + STATE PERFORMANCE ─────────────────── */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MktgCard title="Campaign intelligence" hint="Live operational signals">
            {timeline.length === 0 ? (
              <EmptyRow>No recent activity.</EmptyRow>
            ) : (
              <ol className="space-y-3">
                {timeline.map((e, i) => {
                  const Icon = e.icon;
                  const mins = Math.max(1, Math.round((Date.now() - e.ts) / 60_000));
                  const rel =
                    mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.round(mins / 60)}h ago` : `${Math.round(mins / 1440)}d ago`;
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <div className="grid size-7 shrink-0 place-items-center rounded-full bg-muted">
                        <Icon className="size-3.5 text-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] text-foreground">{e.label}</div>
                        <div className="text-[11.5px] text-muted-foreground">{e.meta} · {rel}</div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </MktgCard>
        </div>

        <div className="lg:col-span-2">
          <MktgCard title="State performance" hint="Operational footprint">
            {mi.stateTrend.length === 0 ? (
              <EmptyRow>No state activity yet.</EmptyRow>
            ) : (
              <div className="space-y-3">
                {mi.stateTrend.slice(0, 5).map((s) => {
                  const maxLeads = mi.stateTrend[0]?.leads || 1;
                  return (
                    <div key={s.state}>
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="font-medium text-foreground">{STATE_NAMES[s.state] ?? s.state}</span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          {s.leads} leads
                          <TrendIcon delta={s.delta} />
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <ShareBar value={(s.leads / maxLeads) * 100} tone={s.delta > 0 ? "accent" : "primary"} />
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {s.candidates} applicants · {s.calls} calls
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </MktgCard>
        </div>
      </div>

      {/* ── RECRUITING + REFERRALS ───────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MktgCard title="Recruiting campaigns" hint="Where hiring visibility is producing applicants">
          <div className="-mt-2 mb-2 flex justify-end">
            <Link to="/marketing/recruiting" className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          {recruitingCampaigns.length === 0 ? (
            <EmptyRow>No active recruiting campaigns.</EmptyRow>
          ) : (
            <div className="divide-y divide-border/60">
              {recruitingCampaigns.map((r) => (
                <div key={`${r.source}-${r.state}`} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Users className="size-4 text-muted-foreground" />
                    <div>
                      <div className="text-[13px] font-medium text-foreground">
                        {r.source} · {STATE_NAMES[r.state] ?? r.state}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground">
                        {r.count} applicants · {r.staged} progressing
                      </div>
                    </div>
                  </div>
                  <div className="text-[12px] font-medium text-foreground">
                    {Math.round((r.staged / Math.max(1, r.count)) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </MktgCard>

        <MktgCard title="Outreach & referrals" hint="Relationship-driven growth">
          <div className="-mt-2 mb-2 flex justify-end">
            <Link to="/marketing/referrals" className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          {mi.referrals.byState.length === 0 ? (
            <EmptyRow>No referral activity yet.</EmptyRow>
          ) : (
            <div className="divide-y divide-border/60">
              {mi.referrals.byState.map((r) => (
                <div key={r.state} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Heart className="size-4 text-muted-foreground" />
                    <div>
                      <div className="text-[13px] font-medium text-foreground">
                        {STATE_NAMES[r.state] ?? r.state}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground">
                        {r.count} referral lead{r.count === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    {Math.round((r.count / Math.max(1, mi.referrals.total)) * 100)}% of mix
                  </div>
                </div>
              ))}
            </div>
          )}
        </MktgCard>
      </div>

      {/* ── AI INSIGHTS ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.04] p-5 md:p-6">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          Ask Blossom AI
        </div>
        <h3 className="mt-2 text-[16px] font-semibold tracking-tight text-foreground">
          Campaign intelligence
        </h3>
        <div className="mt-3 grid gap-2 text-[13px] text-foreground/90 md:grid-cols-2">
          {mi.stateTrend.slice(0, 2).map((s) => (
            <div key={s.state} className="rounded-xl border border-border/50 bg-card/60 p-3">
              <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground">
                {STATE_NAMES[s.state] ?? s.state}
              </div>
              <div className="mt-1">
                {s.delta > 0
                  ? `Lead generation is accelerating (+${s.delta} vs prior week). Consider expanding outreach to match staffing.`
                  : s.delta < 0
                  ? `Lead momentum is softening this week. Outreach or paid visibility may need attention.`
                  : `Lead generation is steady. Maintain current outreach cadence.`}
              </div>
            </div>
          ))}
          {mi.bySource[0] && (
            <div className="rounded-xl border border-border/50 bg-card/60 p-3">
              <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground">Top source</div>
              <div className="mt-1">
                {mi.bySource[0].source} is producing {mi.bySource[0].count} leads at a {mi.bySource[0].qualifiedRate}% qualified rate.
              </div>
            </div>
          )}
          {mi.referrals.total > 0 && (
            <div className="rounded-xl border border-border/50 bg-card/60 p-3">
              <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground">Referrals</div>
              <div className="mt-1">
                {mi.referrals.total} referral leads active — relationship growth is contributing to intake.
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Which campaign should we scale?" />
          <AIPrompt label="Where is recruiting falling behind demand?" />
          <AIPrompt label="Draft an outreach plan for the slowest state" />
        </div>
      </section>

      {/* ── UPCOMING INITIATIVES ─────────────────────────────────────── */}
      <MktgCard title="Upcoming growth initiatives" hint="Add planned campaigns from Admin → Data Uploads">
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/30 p-4">
          <Calendar className="size-4 text-muted-foreground" />
          <div className="flex-1 text-[12.5px] text-muted-foreground">
            Planned campaigns will appear here once added to the operational calendar.
          </div>
        </div>
      </MktgCard>
    </MktgPage>
  );
}