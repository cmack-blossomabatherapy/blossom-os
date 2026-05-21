// Deterministic mock scorecards per state & week. 12 most-recent weeks.

import { SD_KPIS, type KpiDef } from "./kpiDefs";

export interface WeeklyScorecard {
  weekOf: string;       // YYYY-MM-DD (Monday)
  weekLabel: string;    // "Apr 14"
  state: string;
  status: "healthy" | "watch" | "at_risk";
  values: Record<string, number>;
  note?: string;
}

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtIso(d: Date) { return d.toISOString().slice(0, 10); }
function fmtLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Pseudo-random but deterministic by seed string
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

// State baselines so each state feels distinct
const STATE_BASE: Record<string, { clients: number; bcbaPct: number; hires: number }> = {
  VA: { clients: 25, bcbaPct: 0.13, hires: 0 },
  NC: { clients: 42, bcbaPct: 0.15, hires: 1 },
  GA: { clients: 22, bcbaPct: 0.11, hires: 0 },
  TN: { clients: 17, bcbaPct: 0.12, hires: 0 },
  MD: { clients: 14, bcbaPct: 0.14, hires: 0 },
};

function genWeek(state: string, weekIso: string, weekIndex: number): WeeklyScorecard["values"] {
  const base = STATE_BASE[state] ?? STATE_BASE.VA;
  const seed = (k: string) => hash(`${state}|${weekIso}|${k}`);
  const j = (k: string, range: number) => (seed(k) - 0.5) * 2 * range;

  const active_clients     = Math.max(8, Math.round(base.clients + j("clients", 2) + weekIndex * 0.15));
  const hours_53           = Math.round((active_clients * 14.4 + j("h53", 18)) * 10) / 10;
  const hours_51           = Math.max(0, Math.round(active_clients * 1.05 + j("h51", 6)));
  const hours_55           = Math.round((active_clients * 2.45 + j("h55", 8)) * 10) / 10;
  const hours_56           = Math.round((active_clients * 0.42 + j("h56", 3)) * 10) / 10;
  const total_hours        = Math.round((hours_51 + hours_53 + hours_55 + hours_56) * 10) / 10;
  const total_potential_hours = Math.round(active_clients * 17.3);
  const avg_client_hours   = Math.round((total_hours / Math.max(1, active_clients)) * 100) / 100;
  const ccs_sent_out       = Math.max(0, Math.round(2 + j("cc", 2)));
  const ongoing_ias        = Math.max(0, Math.round(active_clients * 0.45 + j("ia", 3)));
  const restaffing_needed  = Math.max(0, Math.round(active_clients * 0.6 + j("re", 4)));
  const tx_auth_received   = Math.max(0, Math.round(active_clients * 0.55 + j("tx", 3)));
  const pct_bcba_hours     = Math.max(0.05, Math.round((base.bcbaPct + j("bcba", 0.025)) * 100) / 100);
  const bcbas_hired        = base.hires + (seed("hire") > 0.85 ? 1 : 0);
  const cases_started      = Math.max(0, Math.round(2 + j("cs", 2)));

  return {
    hours_51, hours_53, hours_55, hours_56,
    total_hours, total_potential_hours,
    active_clients, avg_client_hours,
    ccs_sent_out, ongoing_ias, restaffing_needed, tx_auth_received,
    pct_bcba_hours, bcbas_hired, cases_started,
  };
}

const SAMPLE_NOTES: string[] = [
  "Strong week — staffing matched demand cleanly.",
  "Snow days impacted total hours.",
  "Retention improving, parent training utilization up.",
  "Need RBTs in Richmond region — open requisitions.",
  "BCBA caseload normalized after onboarding completions.",
  "Auth approvals slowed mid-week, recovered by Friday.",
];

export function generateScorecards(state: string, weeks = 12): WeeklyScorecard[] {
  const out: WeeklyScorecard[] = [];
  const today = mondayOf(new Date());
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i * 7);
    const iso = fmtIso(d);
    const values = genWeek(state, iso, weeks - i);
    const noteSeed = hash(`${state}|${iso}|note`);
    out.push({
      weekOf: iso,
      weekLabel: fmtLabel(d),
      state,
      status: noteSeed > 0.8 ? "at_risk" : noteSeed > 0.55 ? "watch" : "healthy",
      values,
      note: noteSeed > 0.4 ? SAMPLE_NOTES[Math.floor(noteSeed * SAMPLE_NOTES.length)] : undefined,
    });
  }
  return out;
}

/** Convenience: latest + previous with deltas for tile rendering. */
export function withDeltas(scorecards: WeeklyScorecard[]): {
  latest: WeeklyScorecard;
  previous?: WeeklyScorecard;
  deltas: Record<string, { value: number; previous: number; pct: number | null }>;
} {
  const latest = scorecards[scorecards.length - 1];
  const previous = scorecards[scorecards.length - 2];
  const deltas: Record<string, { value: number; previous: number; pct: number | null }> = {};
  for (const def of SD_KPIS as KpiDef[]) {
    const v = latest?.values[def.key] ?? 0;
    const p = previous?.values[def.key] ?? 0;
    const pct = p === 0 ? null : ((v - p) / p) * 100;
    deltas[def.key] = { value: v, previous: p, pct };
  }
  return { latest, previous, deltas };
}

export function seriesFor(scorecards: WeeklyScorecard[], key: string): number[] {
  return scorecards.map(s => s.values[key] ?? 0);
}