/**
 * BCBA operational intelligence engine.
 *
 * Pure functions over the in-memory Session[] the dashboard already fetches.
 * No extra network calls. Trend deltas are computed by splitting the current
 * window into two equal halves (first vs second) so we get directional signal
 * without a second Supabase query.
 */

export interface IntelSession {
  date_of_service: string | null;
  client_full: string;
  bcba_name: string | null;
  provider_full: string;
  procedure_code: string | null;
  hours: number;
  raw_labels: string | null;
}

const UNASSIGNED = "Unassigned BCBA";

export function normalizeCode(code: string | null | undefined): string {
  if (!code) return "—";
  const t = code.trim();
  if (/^97153(\b|\s)/i.test(t)) return "97153";
  if (/^97155(\b|\s)/i.test(t)) return "97155";
  return t;
}

/** Split sessions in half by date — earlier half vs later half of the window. */
function splitByMedianDate(sessions: IntelSession[]): { early: IntelSession[]; late: IntelSession[] } {
  const dated = sessions.filter((s) => s.date_of_service);
  if (dated.length < 2) return { early: [], late: dated };
  const dates = dated.map((s) => s.date_of_service!).sort();
  const min = new Date(dates[0]).getTime();
  const max = new Date(dates[dates.length - 1]).getTime();
  const mid = (min + max) / 2;
  const early: IntelSession[] = [];
  const late: IntelSession[] = [];
  for (const s of dated) {
    if (new Date(s.date_of_service!).getTime() < mid) early.push(s);
    else late.push(s);
  }
  return { early, late };
}

export interface Scorecard {
  label: string;
  value: string;
  numeric: number;
  delta?: number; // percent change late vs early
  tone?: "good" | "bad" | "neutral";
  hint?: string;
}

function pctChange(early: number, late: number): number | undefined {
  if (early === 0) return undefined;
  return ((late - early) / early) * 100;
}

function sumHours(rows: IntelSession[]): number {
  let h = 0;
  for (const r of rows) h += Number(r.hours) || 0;
  return h;
}

export function computeScorecards(sessions: IntelSession[]): Scorecard[] {
  const { early, late } = splitByMedianDate(sessions);

  const totalHours = sumHours(sessions);
  const earlyHours = sumHours(early);
  const lateHours = sumHours(late);

  const bcbas = new Set<string>();
  const clients = new Set<string>();
  const rbts = new Set<string>();
  let unassignedHours = 0;
  let supervisionHours = 0; // 97155
  let directHours = 0;      // 97153
  for (const s of sessions) {
    const name = s.bcba_name ?? UNASSIGNED;
    if (s.bcba_name) bcbas.add(s.bcba_name);
    else unassignedHours += Number(s.hours) || 0;
    if (s.client_full) clients.add(s.client_full);
    if (s.provider_full) rbts.add(s.provider_full);
    const code = normalizeCode(s.procedure_code);
    if (code === "97155") supervisionHours += Number(s.hours) || 0;
    if (code === "97153") directHours += Number(s.hours) || 0;
  }

  const avgHoursPerBcba = bcbas.size ? sumHours(sessions.filter((s) => s.bcba_name)) / bcbas.size : 0;
  const supRatio = directHours > 0 ? (supervisionHours / directHours) * 100 : 0;
  const unassignedPct = totalHours > 0 ? (unassignedHours / totalHours) * 100 : 0;

  // Continuity: % of clients touched by exactly one BCBA in the window.
  const clientBcbas = new Map<string, Set<string>>();
  for (const s of sessions) {
    if (!s.bcba_name || !s.client_full) continue;
    let set = clientBcbas.get(s.client_full);
    if (!set) { set = new Set(); clientBcbas.set(s.client_full, set); }
    set.add(s.bcba_name);
  }
  const continuityClients = Array.from(clientBcbas.values());
  const continuityScore = continuityClients.length
    ? (continuityClients.filter((s) => s.size === 1).length / continuityClients.length) * 100
    : 0;

  const fmtH = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  const fmtP = (n: number) => `${n.toFixed(1)}%`;

  return [
    {
      label: "Total billable hours",
      value: fmtH(totalHours),
      numeric: totalHours,
      delta: pctChange(earlyHours, lateHours),
      tone: lateHours >= earlyHours ? "good" : "bad",
      hint: "Trend = late half vs early half of window",
    },
    {
      label: "Avg hrs / BCBA",
      value: fmtH(avgHoursPerBcba),
      numeric: avgHoursPerBcba,
      tone: "neutral",
    },
    {
      label: "Supervision ratio (97155 / 97153)",
      value: fmtP(supRatio),
      numeric: supRatio,
      tone: supRatio >= 10 ? "good" : "bad",
      hint: "Industry target ≥ 10%",
    },
    {
      label: "Active clients",
      value: clients.size.toString(),
      numeric: clients.size,
      tone: "neutral",
    },
    {
      label: "Active RBTs",
      value: rbts.size.toString(),
      numeric: rbts.size,
      tone: "neutral",
    },
    {
      label: "Unassigned %",
      value: fmtP(unassignedPct),
      numeric: unassignedPct,
      tone: unassignedPct <= 5 ? "good" : unassignedPct <= 15 ? "neutral" : "bad",
      hint: "% of hours with no BCBA label",
    },
    {
      label: "Continuity score",
      value: fmtP(continuityScore),
      numeric: continuityScore,
      tone: continuityScore >= 80 ? "good" : continuityScore >= 60 ? "neutral" : "bad",
      hint: "% of clients with a single BCBA",
    },
  ];
}

export interface Observation {
  id: string;
  text: string;
  severity: "info" | "warn" | "alert" | "positive";
  category: "concentration" | "trend" | "load" | "code-mix" | "continuity" | "unassigned";
}

export function buildObservations(sessions: IntelSession[]): Observation[] {
  if (sessions.length === 0) return [];
  const out: Observation[] = [];
  const { early, late } = splitByMedianDate(sessions);

  // 1. Concentration: top BCBA share of total hours.
  const byBcba = new Map<string, number>();
  let totalHours = 0;
  for (const s of sessions) {
    const h = Number(s.hours) || 0;
    totalHours += h;
    if (!s.bcba_name) continue;
    byBcba.set(s.bcba_name, (byBcba.get(s.bcba_name) || 0) + h);
  }
  const ranked = Array.from(byBcba.entries()).sort((a, b) => b[1] - a[1]);
  if (ranked.length && totalHours > 0) {
    const [topName, topHours] = ranked[0];
    const share = (topHours / totalHours) * 100;
    if (share >= 20) {
      out.push({
        id: "concentration-top",
        text: `${topName} accounts for ${share.toFixed(1)}% of all billable hours.`,
        severity: share >= 30 ? "alert" : "warn",
        category: "concentration",
      });
    }
  }

  // 2. Supervision (97155) trend.
  const supEarly = sumHours(early.filter((s) => normalizeCode(s.procedure_code) === "97155"));
  const supLate  = sumHours(late.filter((s) => normalizeCode(s.procedure_code) === "97155"));
  const supDelta = pctChange(supEarly, supLate);
  if (typeof supDelta === "number" && Math.abs(supDelta) >= 10) {
    out.push({
      id: "supervision-trend",
      text: `97155 supervision hours ${supDelta >= 0 ? "increased" : "declined"} ${Math.abs(supDelta).toFixed(0)}% in the later half of the window.`,
      severity: supDelta < -15 ? "alert" : supDelta < 0 ? "warn" : "positive",
      category: "trend",
    });
  }

  // 3. Overall billable hours trend.
  const hoursDelta = pctChange(sumHours(early), sumHours(late));
  if (typeof hoursDelta === "number" && Math.abs(hoursDelta) >= 10) {
    out.push({
      id: "hours-trend",
      text: `Total billable hours ${hoursDelta >= 0 ? "trending up" : "trending down"} ${Math.abs(hoursDelta).toFixed(0)}% across the window.`,
      severity: hoursDelta >= 0 ? "positive" : "warn",
      category: "trend",
    });
  }

  // 4. Unassigned concentration by state.
  const unassignedByState = new Map<string, number>();
  let unassignedHours = 0;
  for (const s of sessions) {
    if (s.bcba_name) continue;
    const h = Number(s.hours) || 0;
    unassignedHours += h;
    // light state extraction
    let state = "Unknown";
    if (s.raw_labels) {
      for (const part of s.raw_labels.split(",")) {
        const t = part.trim();
        const m = t.match(/^([A-Za-z][A-Za-z .'-]+?)\s+Location$/i);
        if (m) { state = m[1].trim(); break; }
      }
    }
    unassignedByState.set(state, (unassignedByState.get(state) || 0) + h);
  }
  if (unassignedHours > 0 && totalHours > 0) {
    const pct = (unassignedHours / totalHours) * 100;
    const topState = Array.from(unassignedByState.entries()).sort((a, b) => b[1] - a[1])[0];
    if (topState && topState[0] !== "Unknown" && topState[1] / unassignedHours >= 0.4) {
      out.push({
        id: "unassigned-state",
        text: `Unassigned sessions are concentrated in ${topState[0]} (${((topState[1] / unassignedHours) * 100).toFixed(0)}% of all unassigned hours).`,
        severity: pct >= 10 ? "alert" : "warn",
        category: "unassigned",
      });
    } else if (pct >= 5) {
      out.push({
        id: "unassigned-pct",
        text: `${pct.toFixed(1)}% of billable hours have no BCBA attribution.`,
        severity: pct >= 15 ? "alert" : "warn",
        category: "unassigned",
      });
    }
  }

  // 5. RBT spread: any RBT touching too many clients.
  const rbtClients = new Map<string, Set<string>>();
  for (const s of sessions) {
    if (!s.provider_full || !s.client_full) continue;
    let set = rbtClients.get(s.provider_full);
    if (!set) { set = new Set(); rbtClients.set(s.provider_full, set); }
    set.add(s.client_full);
  }
  const spreadRbt = Array.from(rbtClients.entries()).sort((a, b) => b[1].size - a[1].size)[0];
  if (spreadRbt && spreadRbt[1].size >= 6) {
    out.push({
      id: "rbt-spread",
      text: `${spreadRbt[0]} is assigned across ${spreadRbt[1].size} clients — an unusually high spread.`,
      severity: spreadRbt[1].size >= 10 ? "alert" : "warn",
      category: "load",
    });
  }

  // 6. Continuity improvement / risk.
  const clientBcbas = new Map<string, Set<string>>();
  for (const s of sessions) {
    if (!s.bcba_name || !s.client_full) continue;
    let set = clientBcbas.get(s.client_full);
    if (!set) { set = new Set(); clientBcbas.set(s.client_full, set); }
    set.add(s.bcba_name);
  }
  const overlap = Array.from(clientBcbas.values()).filter((s) => s.size > 1).length;
  if (overlap > 0) {
    const pct = (overlap / clientBcbas.size) * 100;
    if (pct >= 20) {
      out.push({
        id: "continuity-risk",
        text: `${overlap} clients (${pct.toFixed(0)}%) have multiple BCBAs in this window — possible handoffs or staffing instability.`,
        severity: pct >= 35 ? "alert" : "warn",
        category: "continuity",
      });
    }
  }

  // 7. Fastest-growing code (early vs late share).
  const codeEarly = new Map<string, number>();
  const codeLate = new Map<string, number>();
  for (const s of early) codeEarly.set(normalizeCode(s.procedure_code), (codeEarly.get(normalizeCode(s.procedure_code)) || 0) + (Number(s.hours) || 0));
  for (const s of late)  codeLate.set(normalizeCode(s.procedure_code),  (codeLate.get(normalizeCode(s.procedure_code))  || 0) + (Number(s.hours) || 0));
  let topGrowth: { code: string; delta: number } | null = null;
  for (const [code, lh] of codeLate.entries()) {
    const eh = codeEarly.get(code) || 0;
    if (eh < 5) continue; // require baseline
    const d = ((lh - eh) / eh) * 100;
    if (!topGrowth || d > topGrowth.delta) topGrowth = { code, delta: d };
  }
  if (topGrowth && topGrowth.delta >= 20) {
    out.push({
      id: "code-growth",
      text: `Code ${topGrowth.code} demand is growing — up ${topGrowth.delta.toFixed(0)}% in the later half.`,
      severity: "positive",
      category: "code-mix",
    });
  }

  return out;
}