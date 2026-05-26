import { useMemo, useState } from "react";
import { Download, Upload, ChevronLeft, ChevronRight, MapPin, Activity } from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useOSRole } from "@/contexts/OSRoleContext";
import { SD_KPIS } from "@/lib/scorecards/kpiDefs";
import { generateScorecards, seriesFor, type WeeklyScorecard } from "@/lib/scorecards/mockScorecards";
import { useStateOps } from "@/hooks/useStateOps";
import { activeClientsByWeek } from "@/lib/analytics/stateOps";
import { exportCsv } from "@/lib/scorecards/copyForBloom";
import { KpiTile } from "@/components/scorecards/KpiTile";
import { HeartbeatChart } from "@/components/scorecards/HeartbeatChart";
import { SecondaryCharts } from "@/components/scorecards/SecondaryCharts";
import { WeeklyScorecardTable } from "@/components/scorecards/WeeklyScorecardTable";
import { NotesPanel } from "@/components/scorecards/NotesPanel";
import { AiInsightsPanel } from "@/components/scorecards/AiInsightsPanel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RoleScorecardPlaceholder } from "@/components/scorecards/RoleScorecardPlaceholder";
import { OS_ROLES } from "@/lib/os/permissions";

const STATES = ["VA", "NC", "GA", "TN", "MD"];

export default function OSKpiScorecards() {
  const { role } = useOSRole();

  // Only the State Director scorecard is fully defined today. Every other role
  // gets a polished placeholder until leadership confirms their KPIs.
  if (role !== "state_director" && role !== "super_admin") {
    const roleLabel = OS_ROLES.find((r) => r.id === role)?.label ?? "Your Role";
    return (
      <OSShell>
        <RoleScorecardPlaceholder roleLabel={roleLabel} />
      </OSShell>
    );
  }

  return <StateDirectorScorecard />;
}

function StateDirectorScorecard() {
  const { activeState } = useOSRole();
  const initialState = STATES.includes(activeState) ? activeState : "VA";
  const [state, setState] = useState<string>(initialState);
  const { sessions } = useStateOps(state, "12w");
  const realClients = useMemo(() => activeClientsByWeek(sessions), [sessions]);
  const scorecards = useMemo(
    () => generateScorecards(state, 12, { activeClientsByWeek: realClients }),
    [state, realClients],
  );
  const [activeWeek, setActiveWeek] = useState<string>(scorecards[scorecards.length - 1].weekOf);

  // Re-derive when state changes
  if (!scorecards.find(s => s.weekOf === activeWeek)) {
    setActiveWeek(scorecards[scorecards.length - 1].weekOf);
  }

  const activeIdx = scorecards.findIndex(s => s.weekOf === activeWeek);
  const active = scorecards[activeIdx];
  const prev = activeIdx > 0 ? scorecards[activeIdx - 1] : undefined;

  const statusTone =
    active.status === "healthy" ? "bg-emerald-50 text-emerald-700 ring-emerald-200/70" :
    active.status === "watch"   ? "bg-amber-50 text-amber-700 ring-amber-200/70" :
                                  "bg-rose-50 text-rose-700 ring-rose-200/70";

  function exportAll() {
    const csv = exportCsv(scorecards);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `scorecards-${state}-${active.weekOf}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Scorecard CSV exported");
  }

  function importCsv(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const rows = text.split(/\r?\n/).filter(Boolean).length - 1;
      toast.success(`Detected ${Math.max(0, rows)} rows · column mapping preview coming next`);
    };
    reader.readAsText(file);
  }

  function shiftWeek(delta: number) {
    const next = scorecards[activeIdx + delta];
    if (next) setActiveWeek(next.weekOf);
  }

  return (
    <TooltipProvider>
    <OSShell>
      {/* HEADER */}
      <section className="os-rise relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-[hsl(265_100%_98%)] via-white to-[hsl(220_100%_98%)] p-7 shadow-[0_30px_70px_-40px_hsl(265_60%_50%/0.4)]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[hsl(265_70%_70%/0.25)] blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full bg-white/80 text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(265_70%_45%)]">
                State Director
              </Badge>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] ring-1", statusTone)}>
                <Activity className="h-3 w-3" />
                {active.status === "healthy" ? "Healthy" : active.status === "watch" ? "Watch" : "At Risk"}
              </span>
            </div>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[32px]">KPI Scorecards</h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              Track operational performance and quickly update Bloom Growth scorecards.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="outline" onClick={exportAll} className="border-white/70 bg-white/70 backdrop-blur">
                <Download className="mr-1 h-3.5 w-3.5" /> Export
              </Button>
              <label className="inline-flex">
                <Button asChild size="sm" variant="outline" className="border-white/70 bg-white/70 backdrop-blur">
                  <span><Upload className="mr-1 h-3.5 w-3.5" /> Import</span>
                </Button>
                <input type="file" accept=".csv,.xlsx" className="hidden"
                  onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])} />
              </label>
            </div>

            {/* Week + state pickers */}
            <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-2 py-1 text-[11.5px] backdrop-blur">
              <button onClick={() => shiftWeek(-1)} disabled={activeIdx <= 0}
                className="rounded-full p-1 hover:bg-secondary/60 disabled:opacity-30"><ChevronLeft className="h-3 w-3" /></button>
              <span className="font-semibold tabular-nums">Week of {active.weekLabel}</span>
              <button onClick={() => shiftWeek(1)} disabled={activeIdx >= scorecards.length - 1}
                className="rounded-full p-1 hover:bg-secondary/60 disabled:opacity-30"><ChevronRight className="h-3 w-3" /></button>
              <span className="mx-1 h-3 w-px bg-border" />
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <select value={state} onChange={(e) => setState(e.target.value)}
                className="bg-transparent text-[11.5px] font-semibold outline-none">
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* KPI TILES */}
      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {SD_KPIS.map(def => {
          const series = seriesFor(scorecards.slice(0, activeIdx + 1), def.key);
          const value = active.values[def.key];
          const previous = prev?.values[def.key] ?? value;
          const pct = previous === 0 ? null : ((value - previous) / previous) * 100;
          return <KpiTile key={def.key} def={def} value={value} previous={previous} change={pct} series={series} />;
        })}
      </section>

      {/* HEARTBEAT + AI */}
      <section className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <HeartbeatChart scorecards={scorecards.slice(0, activeIdx + 1)} />
        <AiInsightsPanel scorecards={scorecards.slice(0, activeIdx + 1)} />
      </section>

      {/* SECONDARY CHARTS */}
      <section className="mt-4">
        <SecondaryCharts scorecards={scorecards.slice(0, activeIdx + 1)} />
      </section>

      {/* TABLE + NOTES */}
      <section className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <WeeklyScorecardTable scorecards={scorecards} activeWeek={activeWeek} onSelectWeek={setActiveWeek} />
          <NotesPanel
            storageKey={`blossom:scorecard-notes:${state}:${active.weekOf}`}
            weekLabel={active.weekLabel}
            initial={active.note ? [{ id: "seed", note: active.note, author: "Meeting summary", createdAt: active.weekLabel }] : []}
          />
      </section>
    </OSShell>
    </TooltipProvider>
  );
}