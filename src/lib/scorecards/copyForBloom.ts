import { SD_KPIS, formatKpiValue } from "./kpiDefs";

/** Format the latest scorecard as a paste-ready Bloom Growth block. */
export function formatForBloom(values: Record<string, number>): string {
  const lines = SD_KPIS.map(def => {
    const val = formatKpiValue(values[def.key], def.unit);
    return `${def.label.padEnd(24)} ${val}`;
  });
  return [
    "BLOSSOM SCORECARD — WEEKLY KPIs",
    "─".repeat(36),
    ...lines,
    "",
    "Copy and paste each value into your Bloom Growth scorecard.",
  ].join("\n");
}

/** CSV export — week column + every KPI as a column. */
export function exportCsv(scorecards: { weekOf: string; values: Record<string, number> }[]): string {
  const header = ["Week Of", ...SD_KPIS.map(k => k.label)];
  const rows = scorecards.map(s => [s.weekOf, ...SD_KPIS.map(k => formatKpiValue(s.values[k.key], k.unit))]);
  return [header, ...rows].map(r => r.map(cell => /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell).join(",")).join("\n");
}