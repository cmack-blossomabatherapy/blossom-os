import { describe, it, expect } from "vitest";
import { inferAssignmentHistory, type InferBillingRow } from "@/lib/os/bcbaProductivityV3/inferAssignments";
import { ownerForClientAtDateV3, type BcbaAssignmentV3, normalizeName } from "@/lib/os/bcbaProductivityV3/store";

function mk(clientName: string, date: string, bcba: string, code: string, hours = 1): InferBillingRow {
  return { clientId: "", clientName, renderingProvider: bcba, providerLabels: "BCBA", code, hours, date };
}

// Mirror of the per-client merge from BcbaProductivityReportV3.tsx
function buildEffective(saved: BcbaAssignmentV3[], inferred: BcbaAssignmentV3[]) {
  if (saved.length === 0) return inferred;
  const savedKeys = new Set<string>();
  for (const a of saved) {
    const k = (a.clientId && a.clientId.trim()) || normalizeName(a.clientName);
    if (k) savedKeys.add(k);
  }
  return [
    ...saved,
    ...inferred.filter(a => {
      const k = (a.clientId && a.clientId.trim()) || normalizeName(a.clientName);
      return !savedKeys.has(k);
    }),
  ];
}

describe("Per-client assignment merge — partial saved history must not break inference", () => {
  const rows: InferBillingRow[] = [
    // Client A — saved assignment will exist
    mk("Client A", "2026-01-05", "BCBA One", "97155"),
    mk("Client A", "2026-02-10", "BCBA One", "97155"),
    // Client B — no saved assignment; must still be inferred
    mk("Client B", "2026-01-05", "BCBA Two", "97155"),
    mk("Client B", "2026-03-15", "BCBA Three", "97155"),
  ];
  const inferred = inferAssignmentHistory(rows).assignments;

  it("with NO saved assignments, all clients use inferred ownership", () => {
    const eff = buildEffective([], inferred);
    expect(ownerForClientAtDateV3(eff, "", "Client A", "2026-02-10")?.bcba).toBe("BCBA One");
    expect(ownerForClientAtDateV3(eff, "", "Client B", "2026-01-05")?.bcba).toBe("BCBA Two");
    expect(ownerForClientAtDateV3(eff, "", "Client B", "2026-03-15")?.bcba).toBe("BCBA Three");
  });

  it("saved record for Client A does NOT disable inference for Client B", () => {
    const saved: BcbaAssignmentV3[] = [{
      id: "saved_a", clientId: "", clientName: "Client A",
      bcbaName: "Manual Override", startDate: "2026-01-01", endDate: null,
      createdAt: 1,
    }];
    const eff = buildEffective(saved, inferred);
    // Client A uses saved
    expect(ownerForClientAtDateV3(eff, "", "Client A", "2026-02-10")?.bcba).toBe("Manual Override");
    // Client B still uses inferred — this is the regression we're guarding
    expect(ownerForClientAtDateV3(eff, "", "Client B", "2026-01-05")?.bcba).toBe("BCBA Two");
    expect(ownerForClientAtDateV3(eff, "", "Client B", "2026-03-15")?.bcba).toBe("BCBA Three");
  });
});
