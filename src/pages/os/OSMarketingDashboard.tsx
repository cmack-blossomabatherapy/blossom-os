import {
  TrendingUp, Megaphone, Users, Globe, MapPin, Sparkles,
  Hash, BarChart3, Star, Brain, ArrowUpRight, Activity,
} from "lucide-react";
import { OSShell } from "./OSShell";

const stat = (label: string, value: string, delta: string, Icon: typeof TrendingUp) => ({ label, value, delta, Icon });

const KPIS = [
  stat("Leads this week", "284", "+14%", TrendingUp),
  stat("Conversion rate", "31%", "+3pt", Activity),
  stat("Active campaigns", "6", "2 new", Megaphone),
  stat("Cost / lead", "$28", "-12%", BarChart3),
];

const SOURCES = [
  { label: "Google Ads",   share: 38, tone: "from-violet-400 to-violet-500" },
  { label: "Organic / SEO", share: 24, tone: "from-emerald-400 to-emerald-500" },
  { label: "Facebook",     share: 16, tone: "from-sky-400 to-sky-500" },
  { label: "Referral",     share: 12, tone: "from-amber-400 to-amber-500" },
  { label: "Recruiting",   share: 10, tone: "from-fuchsia-400 to-fuchsia-500" },
];

const CAMPAIGNS = [
  { name: "FL — Parent Awareness Q4",   spend: "$4.2k", leads: 86, cvr: "34%", trend: "up" },
  { name: "Charlotte RBT Recruiting",    spend: "$1.8k", leads: 42, cvr: "29%", trend: "up" },
  { name: "GA Local SEO Boost",          spend: "$0",    leads: 31, cvr: "22%", trend: "flat" },
  { name: "Autism Signs Blog Refresh",   spend: "$0",    leads: 18, cvr: "18%", trend: "down" },
];

const STATES = [
  { code: "FL", growth: "+22%", tone: "emerald" },
  { code: "GA", growth: "+11%", tone: "emerald" },
  { code: "NC", growth: "+4%",  tone: "amber" },
  { code: "TX", growth: "+18%", tone: "emerald" },
  { code: "VA", growth: "-2%",  tone: "rose" },
];

const FUNNEL = [
  { stage: "Site visits",  value: "18.4k", width: "100%" },
  { stage: "Leads",         value: "284",   width: "62%" },
  { stage: "Intake calls",  value: "171",   width: "38%" },
  { stage: "Active starts", value: "62",    width: "14%" },
];

const INSIGHTS = [
  { icon: Brain,     text: "Google Ads CAC is down 12% — scale top creative this week." },
  { icon: Sparkles,  text: "Blog 'Signs of Early Autism' drives 24% of organic leads — refresh for Q4." },
  { icon: TrendingUp,text: "Charlotte staffing shortage = recruiting marketing opportunity. Boost ad set?" },
  { icon: Star,      text: "Reputation: 3 new 5★ reviews waiting for response." },
];

export default function OSMarketingDashboard() {
  return (
    <OSShell>
      <header className="os-rise">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(265_70%_55%)]">Marketing Team · Growth Intelligence</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight md:text-[32px]">Marketing Dashboard</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">
          Lead flow, campaign performance, state growth, recruiting marketing, SEO visibility, and AI-driven growth insights.
        </p>
      </header>

      {/* KPI strip */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.label} className="os-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] text-white">
                <k.Icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-[24px] font-semibold tracking-tight">{k.value}</p>
            <p className="text-[11.5px] font-medium text-emerald-600">{k.delta} vs last week</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Lead sources */}
        <section className="os-card lg:col-span-2 p-5">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-[13.5px] font-semibold">Lead source breakdown</p>
              <p className="text-[11.5px] text-muted-foreground">Where this week's leads came from.</p>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">Placeholder data</span>
          </header>
          <div className="mt-4 space-y-3">
            {SOURCES.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-[12px]">
                  <span className="font-medium">{s.label}</span>
                  <span className="text-muted-foreground">{s.share}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-foreground/[0.05] overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${s.tone}`} style={{ width: `${s.share * 2.4}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Funnel */}
        <section className="os-card p-5">
          <p className="text-[13.5px] font-semibold">Conversion funnel</p>
          <p className="text-[11.5px] text-muted-foreground">Site → start.</p>
          <div className="mt-4 space-y-2.5">
            {FUNNEL.map((f) => (
              <div key={f.stage}>
                <div className="flex justify-between text-[12px]">
                  <span className="font-medium">{f.stage}</span>
                  <span className="text-muted-foreground">{f.value}</span>
                </div>
                <div className="mt-1 h-2.5 rounded-full bg-foreground/[0.04]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)]" style={{ width: f.width }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Campaigns + state growth */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <section className="os-card lg:col-span-2 p-5">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-[13.5px] font-semibold">Campaign performance</p>
              <p className="text-[11.5px] text-muted-foreground">Active growth & recruiting campaigns.</p>
            </div>
            <button className="inline-flex items-center gap-1 rounded-lg border border-[hsl(265_50%_85%)] bg-white/70 px-2.5 py-1 text-[11.5px] font-semibold text-[hsl(265_70%_50%)]">
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </header>
          <div className="mt-3 divide-y divide-foreground/[0.05]">
            {CAMPAIGNS.map((c) => (
              <div key={c.name} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-[13px] font-medium">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">Spend {c.spend} · {c.leads} leads · CVR {c.cvr}</p>
                </div>
                <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-semibold ${
                  c.trend === "up" ? "bg-emerald-50 text-emerald-700" :
                  c.trend === "down" ? "bg-rose-50 text-rose-700" : "bg-foreground/[0.05] text-muted-foreground"
                }`}>{c.trend === "up" ? "Growing" : c.trend === "down" ? "Slipping" : "Flat"}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="os-card p-5">
          <p className="text-[13.5px] font-semibold">State growth</p>
          <p className="text-[11.5px] text-muted-foreground">Lead lift by state.</p>
          <div className="mt-4 space-y-2">
            {STATES.map((s) => (
              <div key={s.code} className="flex items-center justify-between rounded-xl border border-white/70 bg-white/60 px-3 py-2">
                <span className="inline-flex items-center gap-2 text-[12.5px] font-medium"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {s.code}</span>
                <span className={`text-[12px] font-semibold ${
                  s.tone === "emerald" ? "text-emerald-600" :
                  s.tone === "amber"   ? "text-amber-600" : "text-rose-600"
                }`}>{s.growth}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Lower row: SEO + Social + Recruiting + AI */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { Icon: Globe,    title: "SEO visibility",        sub: "Domain authority, rankings, GEO/AEO." },
          { Icon: Hash,     title: "Social engagement",     sub: "Reach, engagement, top posts." },
          { Icon: Users,    title: "Recruiting marketing",  sub: "Applicants by source, funnel velocity." },
          { Icon: Star,     title: "Reputation",            sub: "Reviews, sentiment, response rate." },
        ].map((c) => (
          <div key={c.title} className="os-card p-4">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_100%_95%)] to-[hsl(285_100%_95%)] text-[hsl(265_70%_55%)]">
              <c.Icon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-[13.5px] font-semibold">{c.title}</p>
            <p className="text-[11.5px] text-muted-foreground">{c.sub}</p>
            <div className="os-skeleton mt-3 h-14 w-full rounded-lg" />
          </div>
        ))}
      </div>

      {/* AI insights */}
      <section className="os-card p-5">
        <header className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <p className="text-[13.5px] font-semibold">AI growth insights</p>
        </header>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {INSIGHTS.map((i, idx) => (
            <li key={idx} className="flex items-start gap-2 rounded-xl border border-white/70 bg-white/70 p-3 text-[12.5px]">
              <i.icon className="mt-0.5 h-4 w-4 text-[hsl(265_70%_55%)]" />
              <span>{i.text}</span>
            </li>
          ))}
        </ul>
      </section>
    </OSShell>
  );
}
