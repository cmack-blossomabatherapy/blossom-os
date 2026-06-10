/**
 * Infer BCBA Assignment History from an uploaded Billing Report.
 *
 * Used as a fallback when no permanent Assignment History is configured.
 * A row is treated as a BCBA ownership "anchor" when:
 *   - its ProcedureCode does NOT start with 97153 (direct BCBA service), AND
 *   - its ProviderContactLabels contains "BCBA".
 *
 * For each client, anchor rows are grouped by rendering BCBA in DOS order;
 * when a different BCBA appears for the same client, a transfer is created.
 * The first inferred assignment starts at the client's earliest billing DOS
 * (so early 97153 rows attach), and the last has an open end date.
 */
import { normalizeName, type BcbaAssignmentV3 } from "./store";

export interface InferBillingRow {
  clientId: string;
  clientName: string;
  renderingProvider: string;
  providerLabels: string;
  code: string;
  hours: number;
  date: string; // YYYY-MM-DD
}

export interface OwnershipConflict {
  clientId: string;
  clientName: string;
  date: string;
  candidates: { bcba: string; hours: number }[];
  chosen: string;
}

export interface InferredHistory {
  assignments: BcbaAssignmentV3[];
  conflicts: OwnershipConflict[];
  anchorRowCount: number;
  clientsWithAnchors: number;
  uniqueBcbas: number;
}

const isRbt97153 = (code: string) => /^97153/.test((code || "").trim());
const isBcbaLabel = (labels: string) =>
  /(^|[^a-z])bcba([^a-z]|$)/i.test(labels || "");

function clientKey(r: { clientId: string; clientName: string }) {
  return (r.clientId && r.clientId.trim()) || normalizeName(r.clientName);
}

function addDaysIso(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function inferAssignmentHistory(rows: InferBillingRow[]): InferredHistory {
  // Bucket rows per client
  const perClient = new Map<string, { name: string; id: string; rows: InferBillingRow[] }>();
  for (const r of rows) {
    if (!r.date) continue;
    const k = clientKey(r);
    if (!k) continue;
    let b = perClient.get(k);
    if (!b) { b = { name: r.clientName, id: r.clientId, rows: [] }; perClient.set(k, b); }
    b.rows.push(r);
    if (!b.name && r.clientName) b.name = r.clientName;
    if (!b.id && r.clientId) b.id = r.clientId;
  }

  const assignments: BcbaAssignmentV3[] = [];
  const conflicts: OwnershipConflict[] = [];
  const bcbaSet = new Set<string>();
  let anchorRowCount = 0;
  let clientsWithAnchors = 0;
  let seq = 0;

  for (const [, bucket] of perClient) {
    const anchors = bucket.rows.filter(r => !isRbt97153(r.code) && isBcbaLabel(r.providerLabels) && r.renderingProvider);
    if (!anchors.length) continue;
    anchorRowCount += anchors.length;
    clientsWithAnchors += 1;

    // Per-client total direct hours by BCBA (used to break ties)
    const totalsByBcba = new Map<string, number>();
    for (const a of anchors) totalsByBcba.set(a.renderingProvider, (totalsByBcba.get(a.renderingProvider) ?? 0) + (a.hours || 0));

    // Per-date pick the winning BCBA
    const byDate = new Map<string, Map<string, number>>();
    for (const a of anchors) {
      let m = byDate.get(a.date);
      if (!m) { m = new Map(); byDate.set(a.date, m); }
      m.set(a.renderingProvider, (m.get(a.renderingProvider) ?? 0) + (a.hours || 0));
    }
    const dateOwners: { date: string; bcba: string }[] = [];
    for (const [date, m] of [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      const candidates = [...m.entries()].map(([bcba, hours]) => ({ bcba, hours }));
      let chosen = candidates[0];
      if (candidates.length > 1) {
        candidates.sort((a, b) => {
          if (b.hours !== a.hours) return b.hours - a.hours;
          const ta = totalsByBcba.get(a.bcba) ?? 0;
          const tb = totalsByBcba.get(b.bcba) ?? 0;
          if (tb !== ta) return tb - ta;
          return a.bcba.localeCompare(b.bcba);
        });
        chosen = candidates[0];
        conflicts.push({
          clientId: bucket.id,
          clientName: bucket.name,
          date,
          candidates,
          chosen: chosen.bcba,
        });
      }
      dateOwners.push({ date, bcba: chosen.bcba });
      bcbaSet.add(chosen.bcba);
    }

    // Compress consecutive dates with the same BCBA into runs
    const runs: { bcba: string; firstDate: string; lastDate: string }[] = [];
    for (const d of dateOwners) {
      const last = runs[runs.length - 1];
      if (last && last.bcba === d.bcba) last.lastDate = d.date;
      else runs.push({ bcba: d.bcba, firstDate: d.date, lastDate: d.date });
    }
    if (!runs.length) continue;

    // Anchor the first run to the client's earliest billing DOS so 97153 hours
    // before the first BCBA anchor date still attach.
    let earliestClientDos = runs[0].firstDate;
    for (const r of bucket.rows) if (r.date && r.date < earliestClientDos) earliestClientDos = r.date;
    runs[0].firstDate = earliestClientDos;

    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      const next = runs[i + 1];
      const startDate = run.firstDate;
      const endDate = next ? addDaysIso(next.firstDate, -1) : null;
      const ts = Date.now() + (seq++);
      assignments.push({
        id: `inf_${ts.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        clientId: bucket.id,
        clientName: bucket.name,
        bcbaName: run.bcba,
        startDate,
        endDate,
        note: "Inferred from Billing Report",
        createdAt: ts,
      });
    }
  }

  return {
    assignments,
    conflicts,
    anchorRowCount,
    clientsWithAnchors,
    uniqueBcbas: bcbaSet.size,
  };
}