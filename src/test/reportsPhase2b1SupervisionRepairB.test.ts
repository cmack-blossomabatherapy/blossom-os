import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  computeSupervisionAnalysis,
  SUPERVISION_BENCHMARK_LABEL,
  SUPERVISION_BENCHMARK_PCT,
  SUPERVISION_PROVENANCE_NOTE,
  SUPERVISION_VIEW_LABELS,
  type SupervisionSessionInput,
} from "@/lib/os/reports/crPrimary/metrics/bcbaSupervisionV2";

const s = (over: Partial<SupervisionSessionInput>): SupervisionSessionInput => ({
  date: "2026-01-05",
  procedureCode: "97153",
  hours: 10,
  clientName: "Client A",
  clientCrId: "c1",
  providerName: "RBT One",
  state: "GA",
  payor: "Aetna",
  ...over,
});

const owner = () => "BCBA One";

describe("BCBA Supervision — repair B", () => {
  it("exposes completed, scheduled and projected direct/supervision hours per group", () => {
    const a = computeSupervisionAnalysis({
      past: [s({}), s({ procedureCode: "97155", hours: 0.4 })],
      projected: [s({ date: "2026-01-28", hours: 5 })],
      resolveOwner: owner,
    });
    const row = a.projected.rows[0];
    expect(row.completedDirectHours).toBe(10);
    expect(row.completedSupervisionHours).toBe(0.4);
    expect(row.scheduledDirectHours).toBe(5);
    expect(row.scheduledSupervisionHours).toBe(0);
    expect(row.projectedDirectHours).toBe(15);
    expect(row.projectedSupervisionHours).toBe(0.4);
    expect(a.past.rows[0].directHours).toBe(10);
    expect(a.projected.rows[0].directHours).toBe(15);
  });

  it("computes hours needed to reach the 5% benchmark on the active view", () => {
    const a = computeSupervisionAnalysis({
      past: [s({ hours: 100 }), s({ procedureCode: "97155", hours: 1 })],
      projected: [],
      resolveOwner: owner,
    });
    // 5% of 100 direct = 5 supervision hours; 1 already delivered.
    expect(a.past.rows[0].hoursToTarget).toBe(4);
    expect(a.past.rows[0].ratioPct).toBe(1);
    expect(SUPERVISION_BENCHMARK_PCT).toBe(5);
  });

  it("reports Insufficient Data instead of 0% when there are no direct hours", () => {
    const a = computeSupervisionAnalysis({
      past: [s({ procedureCode: "97155", hours: 2 })],
      projected: [],
      resolveOwner: owner,
    });
    expect(a.past.rows[0].ratioPct).toBeNull();
    expect(a.past.rows[0].status).toBe("insufficient_data");
    expect(a.past.rows[0].hoursToTarget).toBeNull();
  });

  it("never fabricates RBT supervision linkage", () => {
    const a = computeSupervisionAnalysis({
      past: [s({ hours: 20 }), s({ procedureCode: "97155", hours: 2, providerName: "BCBA One" })],
      projected: [],
      grouping: "rbt",
      resolveOwner: owner,
    });
    const rbtRow = a.past.rows.find((r) => r.label === "RBT One");
    expect(rbtRow).toBeTruthy();
    expect(rbtRow!.supervisionHours).toBe(0);
    expect(rbtRow!.supervisionLinkable).toBe(false);
    expect(rbtRow!.status).toBe("insufficient_data");
    expect(rbtRow!.ratioPct).toBeNull();
    expect(rbtRow!.note.length).toBeGreaterThan(0);
  });

  it("credits RBT supervision only with an explicit link", () => {
    const a = computeSupervisionAnalysis({
      past: [
        s({ hours: 20 }),
        s({
          procedureCode: "97155",
          hours: 2,
          providerName: "BCBA One",
          supervisedProviderName: "RBT One",
        }),
      ],
      projected: [],
      grouping: "rbt",
      resolveOwner: owner,
    });
    const rbtRow = a.past.rows.find((r) => r.label === "RBT One")!;
    expect(rbtRow.supervisionHours).toBe(2);
    expect(rbtRow.supervisionLinkable).toBe(true);
    expect(rbtRow.ratioPct).toBe(10);
  });

  it("uses the exact approved tab labels and operational provenance note", () => {
    expect(SUPERVISION_VIEW_LABELS.past).toBe("Past Performance");
    expect(SUPERVISION_VIEW_LABELS.projected).toBe("Projected Performance");
    expect(SUPERVISION_BENCHMARK_LABEL).toBe("Blossom operational benchmark");
    expect(SUPERVISION_PROVENANCE_NOTE.toLowerCase()).toContain("operational view");
    expect(SUPERVISION_PROVENANCE_NOTE.toLowerCase()).toContain("credentialing");
    expect(SUPERVISION_PROVENANCE_NOTE).not.toMatch(/BACB/i);
  });

  it("keeps BACB compliance claims out of the supervision surfaces", () => {
    const files = [
      "src/lib/os/reports/crPrimary/metrics/bcbaSupervisionV2.ts",
      "src/pages/os/reports/BcbaSupervisionPage.tsx",
    ];
    for (const f of files) {
      const src = fs.readFileSync(path.resolve(process.cwd(), f), "utf8");
      expect(src).not.toMatch(/BACB complian/i);
      expect(src).not.toMatch(/BACB/);
    }
  });
});
