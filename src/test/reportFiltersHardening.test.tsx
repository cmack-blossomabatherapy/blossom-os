/**
 * Report filter hardening.
 *
 * 1. Ownership coverage: unassigned hours must only come from clients that
 *    have no BCBA anchor at all in the CentralReach billing data.
 * 2. Filter UI: option lists must be fully addressable (no truncation cap)
 *    and searchable, for both the shared primary filter bar and BCBA V3.
 */
import { beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { inferAssignmentHistory, type InferBillingRow } from "@/lib/os/bcbaProductivityV3/inferAssignments";
import { ownerForClientAtDateV3, normalizeName } from "@/lib/os/bcbaProductivityV3/store";
import { FilterCombobox } from "@/components/reports/crPrimary/FilterCombobox";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

beforeAll(() => {
  // cmdk requires ResizeObserver, which jsdom does not implement.
  if (!(globalThis as { ResizeObserver?: unknown }).ResizeObserver) {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

function row(o: Partial<InferBillingRow>): InferBillingRow {
  return {
    clientId: "c1",
    clientName: "Client One",
    renderingProvider: "RBT A",
    providerLabels: "RBT",
    code: "97153",
    hours: 2,
    date: "2026-03-02",
    ...o,
  };
}

describe("BCBA ownership coverage (unassigned hours)", () => {
  it("attributes every hour of a client that has at least one BCBA anchor", () => {
    const rows: InferBillingRow[] = [
      // Direct RBT hours before, between, and long after the single anchor.
      row({ date: "2026-01-05" }),
      row({ date: "2026-03-02" }),
      row({ date: "2026-04-20" }),
      row({ date: "2026-02-10", code: "97155", providerLabels: "BCBA", renderingProvider: "Areeb Hasan", hours: 1 }),
    ];
    const inferred = inferAssignmentHistory(rows);
    const unassignedHours = rows.reduce((acc, r) => {
      const owner = ownerForClientAtDateV3(inferred.assignments, r.clientId, r.clientName, r.date);
      return owner ? acc : acc + r.hours;
    }, 0);
    expect(unassignedHours).toBe(0);
  });

  it("only leaves hours unassigned for clients with no BCBA anchor at all", () => {
    const rows: InferBillingRow[] = [
      row({ clientId: "c1", clientName: "Covered Client", date: "2026-03-02" }),
      row({ clientId: "c1", clientName: "Covered Client", date: "2026-02-10", code: "97155", providerLabels: "BCBA", renderingProvider: "Areeb Hasan", hours: 1 }),
      // No BCBA-labelled anchor anywhere for this client.
      row({ clientId: "c2", clientName: "Orphan Client", date: "2026-03-05", hours: 3.5 }),
    ];
    const inferred = inferAssignmentHistory(rows);
    const unassigned = rows.filter(
      (r) => !ownerForClientAtDateV3(inferred.assignments, r.clientId, r.clientName, r.date),
    );
    expect(unassigned).toHaveLength(1);
    expect(unassigned[0].clientName).toBe("Orphan Client");
    expect(normalizeName(unassigned[0].clientName)).toBe("orphan client");
  });

  it("hands ownership to the new BCBA from the first of the transfer month", () => {
    const rows: InferBillingRow[] = [
      row({ date: "2026-03-10", code: "97155", providerLabels: "BCBA", renderingProvider: "Areeb Hasan", hours: 1 }),
      row({ date: "2026-04-12", code: "97155", providerLabels: "BCBA", renderingProvider: "Second BCBA", hours: 1 }),
      row({ date: "2026-04-01" }),
      row({ date: "2026-03-28" }),
    ];
    const { assignments } = inferAssignmentHistory(rows);
    expect(ownerForClientAtDateV3(assignments, "c1", "Client One", "2026-03-28")?.bcba).toBe("Areeb Hasan");
    expect(ownerForClientAtDateV3(assignments, "c1", "Client One", "2026-04-01")?.bcba).toBe("Second BCBA");
  });
});

describe("filter option lists are not truncated", () => {
  it("the shared primary filter bar no longer caps options and uses the searchable combobox", () => {
    const src = read("src/components/reports/crPrimary/PrimaryFilterBar.tsx");
    expect(src).not.toContain("slice(0, 400)");
    expect(src).toContain("FilterCombobox");
  });

  it("BCBA Productivity V3 filters use the searchable combobox and a deferred search", () => {
    const src = read("src/pages/os/reports/BcbaProductivityReportV3.tsx");
    expect(src).toContain("FilterCombobox");
    expect(src).toContain("useDeferredValue");
    expect(src).toContain("deferredSearch");
    expect(src).toContain('options={["— Unassigned —", ...bcbaOptions]}');
  });
});

describe("FilterCombobox", () => {
  const options = Array.from({ length: 976 }, (_, i) => `Client ${String(i + 1).padStart(4, "0")}`);

  it("finds an option far beyond the old 400-item cap and reports it upward", async () => {
    const picked: string[] = [];
    render(
      <FilterCombobox label="Client" value="" options={options} onChange={(v) => picked.push(v)} />,
    );
    fireEvent.click(screen.getByRole("combobox", { name: "Client" }));
    const input = await screen.findByPlaceholderText("Search client…");
    fireEvent.change(input, { target: { value: "0912" } });
    const match = await screen.findByText("Client 0912");
    fireEvent.click(match);
    await waitFor(() => expect(picked).toEqual(["Client 0912"]));
  });

  it("clearing back to All emits an empty value", async () => {
    const picked: string[] = [];
    render(
      <FilterCombobox label="State" value="GA" options={["GA", "NC"]} onChange={(v) => picked.push(v)} />,
    );
    fireEvent.click(screen.getByRole("combobox", { name: "State" }));
    fireEvent.click(await screen.findByText("All State"));
    await waitFor(() => expect(picked).toEqual([""]));
  });
});