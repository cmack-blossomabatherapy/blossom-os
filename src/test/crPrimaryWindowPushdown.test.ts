/**
 * Date-window pushdown for the shared non-V3 primary-report loader.
 *
 * A routine current-month report must not page every historical row out of the
 * Data API before filtering client-side; a deliberate All Dates selection must
 * still read history.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";

interface Call {
  table: string;
  rpc?: string;
  gte: [string, string][];
  lte: [string, string][];
  range: [number, number][];
}

const calls: Call[] = [];

function builder(entry: Call) {
  const api: Record<string, unknown> = {};
  const chain = () => api;
  api.select = chain;
  api.order = chain;
  api.gte = (c: string, v: string) => {
    entry.gte.push([c, v]);
    return api;
  };
  api.lte = (c: string, v: string) => {
    entry.lte.push([c, v]);
    return api;
  };
  api.range = (from: number, to: number) => {
    entry.range.push([from, to]);
    return Promise.resolve({ data: [], error: null });
  };
  return api;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      const entry: Call = { table, gte: [], lte: [], range: [] };
      calls.push(entry);
      return builder(entry);
    },
    rpc: (name: string) => {
      const entry: Call = { table: "", rpc: name, gte: [], lte: [], range: [] };
      calls.push(entry);
      return builder(entry);
    },
  },
}));

const src = await import("@/lib/os/reports/crPrimary/source");

describe("window pushdown", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("pushes both bounds before pagination for billing sessions", async () => {
    await src.fetchCrBillingSessions({ from: "2026-09-01", to: "2026-09-30" });
    const c = calls[0];
    expect(c.table).toBe("cr_billing_sessions");
    expect(c.gte).toEqual([["date_of_service", "2026-09-01"]]);
    expect(c.lte).toEqual([["date_of_service", "2026-09-30"]]);
    expect(c.range[0]).toEqual([0, src.CR_PAGE_SIZE - 1]);
  });

  it("pushes the event-date window for the current scheduling view", async () => {
    await src.fetchCrScheduleCurrent({ from: "2026-09-01", to: "2026-09-30" });
    expect(calls[0].table).toBe("v_cr_schedule_current");
    expect(calls[0].gte).toEqual([["event_date", "2026-09-01"]]);
    expect(calls[0].lte).toEqual([["event_date", "2026-09-30"]]);
  });

  it("pushes the window through curated report RPCs", async () => {
    await src.fetchReportBillingFacts({ from: "2026-09-01", to: null });
    expect(calls[0].rpc).toBe("report_billing_facts");
    expect(calls[0].gte).toEqual([["date_of_service", "2026-09-01"]]);
    expect(calls[0].lte).toEqual([]);
  });

  it("pushes the claims window and reads the current claims RPC", async () => {
    await src.fetchCrClaimsStatus({ from: "2026-06-10", to: "2026-08-25" });
    expect(calls[0].rpc).toBe("report_claims_status");
    expect(calls[0].gte).toEqual([["date_of_service", "2026-06-10"]]);
    expect(calls[0].lte).toEqual([["date_of_service", "2026-08-25"]]);
  });

  it("preserves All Dates: no filters when the window is absent or blank", async () => {
    await src.fetchCrBillingSessions();
    await src.fetchCrBillingSessions({ from: "", to: "" });
    await src.fetchReportBillingFacts(null);
    for (const c of calls) {
      expect(c.gte).toEqual([]);
      expect(c.lte).toEqual([]);
    }
  });
});

describe("loader and page wiring", () => {
  const hook = readFileSync("src/hooks/useCrPrimaryReport.ts", "utf8");

  it("only requests the datasets a report declares", () => {
    expect(hook).toMatch(/wanted\.has\("billing"\) \? fetchCrBillingSessions\(win\)/);
    expect(hook).toMatch(/wanted\.has\("claimsStatus"\) \? fetchCrClaimsStatus\(win\)/);
    expect(hook).toMatch(/Promise\.resolve\(EMPTY_RESULT\)/);
  });

  it("refetches when the selected window changes", () => {
    expect(hook).toMatch(/\[key, nonce, windowKey\]/);
  });

  it("scopes claims freshness to the single current snapshot batch", () => {
    expect(hook).toMatch(/CURRENT_SNAPSHOT_DATASETS/);
    expect(hook).toMatch(/currentSnapshotBatches\(batchRes\.rows, currentOnlyTypes\)/);
  });

  it("passes the selected window from date-defaulted report pages", () => {
    for (const page of [
      "src/pages/os/reports/ClaimsQueuePage.tsx",
      "src/pages/os/reports/ClinicOperationsPage.tsx",
      "src/pages/os/reports/ParentTrainingPage.tsx",
      "src/pages/os/reports/AuthorizationUtilizationPage.tsx",
    ]) {
      const text = readFileSync(page, "utf8");
      expect(text, page).toMatch(/useCrPrimaryReport\(\[[^\]]*\], \{\s*from: filters\.from \|\| null,\s*to: filters\.to \|\| null,\s*\}\)/);
    }
  });

  it("keeps primary-report filter state scoped per route (URL/local), never a shared key", () => {
    for (const page of [
      "src/pages/os/reports/ClinicOperationsPage.tsx",
      "src/pages/os/reports/ParentTrainingPage.tsx",
      "src/pages/os/reports/AuthorizationUtilizationPage.tsx",
      "src/pages/os/reports/ClaimsQueuePage.tsx",
    ]) {
      const text = readFileSync(page, "utf8");
      expect(text, page).not.toMatch(/localStorage|sessionStorage/);
      expect(text, page).toMatch(/useUrlFilterState|useState\(\{ \.\.\.EMPTY_FILTERS \}\)/);
    }
  });
});
