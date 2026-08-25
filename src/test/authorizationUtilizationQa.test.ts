import { describe, expect, it } from "vitest";
import {
  dedupeGapReasons,
  reconciliationEmptyLabel,
} from "@/lib/os/reports/crPrimary/metrics/authorizationUtilizationQa";

describe("reconciliation empty state honesty", () => {
  it("does not claim agreement when there are zero comparable hour pairs", () => {
    const label = reconciliationEmptyLabel(0);
    expect(label).toBe("No comparable hour pairs are available to reconcile.");
    expect(label).not.toMatch(/agree/i);
  });

  it("claims agreement only when at least one comparable pair exists", () => {
    expect(reconciliationEmptyLabel(1)).toMatch(/agree with recomputed billing hours/i);
    expect(reconciliationEmptyLabel(42)).toMatch(/agree with recomputed billing hours/i);
  });

  it("treats invalid or negative counts as zero comparable pairs", () => {
    expect(reconciliationEmptyLabel(Number.NaN)).toMatch(/No comparable hour pairs/i);
    expect(reconciliationEmptyLabel(-3)).toMatch(/No comparable hour pairs/i);
  });
});

describe("data gap reason dedupe", () => {
  it("renders an identical reason only once", () => {
    expect(
      dedupeGapReasons([
        "No worked hours joined to this authorization",
        "No worked hours joined to this authorization",
      ]),
    ).toEqual(["No worked hours joined to this authorization"]);
  });

  it("treats case and whitespace differences as duplicates", () => {
    expect(
      dedupeGapReasons(["No worked hours joined", "  no   worked hours joined "]),
    ).toEqual(["No worked hours joined"]);
  });

  it("preserves distinct reasons in order", () => {
    expect(
      dedupeGapReasons(["Missing authorized hours", "No worked hours joined"]),
    ).toEqual(["Missing authorized hours", "No worked hours joined"]);
  });

  it("drops blank, null and undefined reasons", () => {
    expect(dedupeGapReasons([null, undefined, "  ", "Missing coverage dates"])).toEqual([
      "Missing coverage dates",
    ]);
    expect(dedupeGapReasons([])).toEqual([]);
  });
});
