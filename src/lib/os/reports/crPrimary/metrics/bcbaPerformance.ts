import { pct } from "../format";
import type { CrAuthorizationRow, CrBillingSessionRow } from "../types";
import {
  CODE_ASSESSMENT,
  CODE_DIRECT,
  CODE_PARENT_TRAINING,
  CODE_SUPERVISION,
  hoursOf,
  isCountableStatus,
  normalizeCode,
} from "./codes";
import { buildClientBcbaMap, supervisionBand, type SupervisionBand } from "./supervision";
import { utilizationBand, utilizationPct } from "./authorizationUtilization";

export interface BcbaScorecardRow {
  bcba: string;
  billableHours: number;
  supervisionHours: number;
  directHours: number;
  supervisionPct: number;
  supervisionBand: SupervisionBand;
  parentTrainingHours: number;
  ptCoveragePct: number;
  assessmentHours: number;
  clientLoad: number;
  rbtLoad: number;
  authRiskCount: number;
  states: string[];
  flags: string[];
  score: number;
}

export interface BcbaPerformanceMetrics {
  bcbaCount: number;
  clientCount: number;
  rbtCount: number;
  totalBillableHours: number;
  avgSupervisionPct: number;
  avgPtCoveragePct: number;
  bcbasWithFlags: number;
  authRiskTotal: number;
  avgScore: number;
  scorecards: BcbaScorecardRow[];
}

/**
 * Executive BCBA roll-up: combines productivity, supervision, parent
 * training, assessment documentation load, caseload, RBT span, and
 * authorization risk into one comparable scorecard per BCBA.
 */
export function computeBcbaPerformance(
  sessions: CrBillingSessionRow[],
  auths: CrAuthorizationRow[] = [],
): BcbaPerformanceMetrics {
  const countable = sessions.filter((r) => isCountableStatus(r.status));
  const clientToBcba = buildClientBcbaMap(countable);

  interface Acc {
    billable: number;
    direct: number;
    supervision: number;
    pt: number;
    assessment: number;
    clients: Set<string>;
    ptClients: Set<string>;
    rbts: Set<string>;
    states: Set<string>;
  }
  const acc = new Map<string, Acc>();
  const ensure = (name: string) => {
    const k = name || "Unassigned";
    if (!acc.has(k)) {
      acc.set(k, {
        billable: 0,
        direct: 0,
        supervision: 0,
        pt: 0,
        assessment: 0,
        clients: new Set(),
        ptClients: new Set(),
        rbts: new Set(),
        states: new Set(),
      });
    }
    return acc.get(k)!;
  };

  const clients = new Set<string>();
  const rbts = new Set<string>();
  let totalBillable = 0;

  for (const r of countable) {
    const code = normalizeCode(r.procedure_code);
    const hours = hoursOf(r.hours);
    const client = (r.client_name ?? "Unknown client").trim() || "Unknown client";
    const provider = (r.rendering_provider_name ?? "").trim();
    const bcba = clientToBcba.get(client) ?? "Unassigned";
    const a = ensure(bcba);
    clients.add(client);
    a.clients.add(client);
    if (r.state) a.states.add(r.state);
    totalBillable += hours;

    if (code === CODE_DIRECT) {
      a.direct += hours;
      if (provider) {
        rbts.add(provider);
        a.rbts.add(provider);
      }
    } else if (code === CODE_SUPERVISION) {
      a.supervision += hours;
      a.billable += hours;
    } else if (code === CODE_PARENT_TRAINING) {
      a.pt += hours;
      a.billable += hours;
      a.ptClients.add(client);
    } else if (code === CODE_ASSESSMENT) {
      a.assessment += hours;
      a.billable += hours;
    } else {
      a.billable += hours;
    }
  }

  // Authorization risk per BCBA, derived from the BCBA's client roster.
  const riskByBcba = new Map<string, number>();
  for (const auth of auths) {
    const client = (auth.client_name ?? "").trim();
    if (!client) continue;
    const bcba = clientToBcba.get(client);
    if (!bcba) continue;
    const p = utilizationPct(
      Number(auth.worked_hours ?? 0),
      Number(auth.authorized_hours ?? 0),
    );
    const band = utilizationBand(p);
    const paused = /paused|hold/i.test(auth.status ?? "");
    if (band === "over" || band === "under" || paused) {
      riskByBcba.set(bcba, (riskByBcba.get(bcba) ?? 0) + 1);
    }
  }

  const scorecards: BcbaScorecardRow[] = [...acc.entries()].map(([bcba, a]) => {
    const supPct = pct(a.supervision, a.direct);
    const ptCoverage = pct(a.ptClients.size, a.clients.size);
    const authRisk = riskByBcba.get(bcba) ?? 0;
    const flags: string[] = [];
    if (a.direct > 0 && supPct < 5) flags.push("Supervision below 5%");
    if (a.clients.size > 0 && ptCoverage < 50) flags.push("Parent training gap");
    if (a.clients.size > 12) flags.push("High caseload");
    if (a.rbts.size > 10) flags.push("Wide RBT span");
    if (authRisk > 0) flags.push(`${authRisk} authorization risk${authRisk === 1 ? "" : "s"}`);

    const supScore = Math.min(100, (supPct / 10) * 100);
    const ptScore = Math.min(100, ptCoverage);
    const loadScore = a.clients.size === 0 ? 0 : Math.max(0, 100 - Math.abs(a.clients.size - 10) * 6);
    const riskScore = Math.max(0, 100 - authRisk * 15);
    const score = Math.round(supScore * 0.35 + ptScore * 0.25 + loadScore * 0.2 + riskScore * 0.2);

    return {
      bcba,
      billableHours: Math.round(a.billable * 10) / 10,
      supervisionHours: Math.round(a.supervision * 10) / 10,
      directHours: Math.round(a.direct * 10) / 10,
      supervisionPct: supPct,
      supervisionBand: supervisionBand(supPct),
      parentTrainingHours: Math.round(a.pt * 10) / 10,
      ptCoveragePct: ptCoverage,
      assessmentHours: Math.round(a.assessment * 10) / 10,
      clientLoad: a.clients.size,
      rbtLoad: a.rbts.size,
      authRiskCount: authRisk,
      states: [...a.states].sort(),
      flags,
      score,
    };
  });

  scorecards.sort((a, b) => b.score - a.score);
  const n = scorecards.length || 1;

  return {
    bcbaCount: scorecards.filter((s) => s.bcba !== "Unassigned").length,
    clientCount: clients.size,
    rbtCount: rbts.size,
    totalBillableHours: Math.round(totalBillable * 10) / 10,
    avgSupervisionPct:
      Math.round((scorecards.reduce((s, r) => s + r.supervisionPct, 0) / n) * 10) / 10,
    avgPtCoveragePct:
      Math.round((scorecards.reduce((s, r) => s + r.ptCoveragePct, 0) / n) * 10) / 10,
    bcbasWithFlags: scorecards.filter((s) => s.flags.length > 0).length,
    authRiskTotal: scorecards.reduce((s, r) => s + r.authRiskCount, 0),
    avgScore: Math.round(scorecards.reduce((s, r) => s + r.score, 0) / n),
    scorecards,
  };
}