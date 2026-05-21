import { Sparkles, AlertTriangle, ShieldCheck, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SD_KPIS, formatKpiValue } from "@/lib/scorecards/kpiDefs";
import type { WeeklyScorecard } from "@/lib/scorecards/mockScorecards";

type Tone = "ok" | "warn" | "bad" | "info";
interface Insight { tone: Tone; text: string }

function deriveInsights(scorecards: WeeklyScorecard[]): Insight[] {
  if (scorecards.length < 2) return [];
  const cur = scorecards[scorecards.length - 1].values;
  const prev = scorecards[scorecards.length - 2].values;
  const last3 = scorecards.slice(-3).map(s => s.values.restaffing_needed);
  const out: Insight[] = [];

  // 53 hours vs clients
  const hoursDown = cur.hours_53 < prev.hours_53;
  const clientsUp = cur.active_clients > prev.active_clients;
  if (hoursDown && clientsUp) {
    out.push({ tone: "bad", text: `53 Hours decreased while client count increased — utilization slipping (${formatKpiValue(cur.hours_53,"hours")} vs ${formatKpiValue(prev.hours_53,"hours")}).` });
  } else if (!hoursDown && clientsUp) {
    out.push({ tone: "ok", text: `Active Clients up and 53 Hours holding — operational throughput healthy.` });
  }

  // restaffing trend
  if (last3.length === 3 && last3[0] < last3[1] && last3[1] < last3[2]) {
    out.push({ tone: "warn", text: `Restaffing Needed rising 3 weeks in a row (${last3.join(" → ")}). Open requisitions early.` });
  }

  // avg client hours
  if (cur.avg_client_hours > prev.avg_client_hours + 0.2) {
    out.push({ tone: "ok", text: `Avg Client Hours improving (${cur.avg_client_hours} vs ${prev.avg_client_hours}).` });
  } else if (cur.avg_client_hours < prev.avg_client_hours - 0.2) {
    out.push({ tone: "warn", text: `Avg Client Hours dropping — investigate scheduling adherence.` });
  }

  // BCBA %
  if (cur.pct_bcba_hours < 0.10) {
    out.push({ tone: "bad", text: `% of BCBA Hours below 10% — supervision risk.` });
  } else if (cur.pct_bcba_hours < prev.pct_bcba_hours - 0.01) {
    out.push({ tone: "warn", text: `BCBA utilization trending down (${(cur.pct_bcba_hours*100).toFixed(1)}%).` });
  }

  if (!out.length) out.push({ tone: "info", text: "No meaningful week-over-week shifts detected." });
  return out.slice(0, 4);
}

const TONE_BG: Record<Tone, string> = {
  ok:   "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-700",
  bad:  "bg-rose-50 text-rose-700",
  info: "bg-[hsl(265_100%_97%)] text-[hsl(265_70%_45%)]",
};

function Icon({ tone }: { tone: Tone }) {
  const C = tone === "ok" ? ShieldCheck : tone === "info" ? Info : AlertTriangle;
  return <C className="h-3 w-3" />;
}

export function AiInsightsPanel({ scorecards }: { scorecards: WeeklyScorecard[] }) {
  const insights = deriveInsights(scorecards);
  return (
    <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-[hsl(265_100%_98%)] to-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)] text-white">
            <Sparkles className="h-3 w-3" />
          </span>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(265_70%_55%)]">AI KPI Insights</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {(["Summarize Trends", "Find Risks", "Weekly Summary"] as const).map(l => (
            <Button key={l} size="sm" variant="outline" className="h-6 rounded-full px-2 text-[10.5px]">{l}</Button>
          ))}
        </div>
      </div>
      <ul className="mt-3 space-y-2">
        {insights.map((i, idx) => (
          <li key={idx} className="flex items-start gap-2 text-[12.5px] leading-snug">
            <span className={cn("mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md", TONE_BG[i.tone])}>
              <Icon tone={i.tone} />
            </span>
            <span>{i.text}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10.5px] text-muted-foreground">Heuristic preview · live AI analysis wires in when data sources connect.</p>
      {/* Surface KPI count so SD_KPIS import is used */}
      <p className="sr-only">Analyzing {SD_KPIS.length} KPIs.</p>
    </div>
  );
}