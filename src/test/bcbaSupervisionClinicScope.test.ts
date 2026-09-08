import { describe, it, expect } from "vitest";
import {
  computeSupervisionAnalysis,
  filterSessionsByClinicScope,
  type SupervisionSessionInput,
} from "@/lib/os/reports/crPrimary/metrics/bcbaSupervisionV2";
import { clinicKeyOf } from "@/lib/os/reports/crPrimary/metrics/clinicNormalizer";

const s = (over: Partial<SupervisionSessionInput>): SupervisionSessionInput => ({
  date: "2026-01-05",
  procedureCode: "97153",
  hours: 10,
  clientName: "Client A",
  clientCrId: "c1",
  providerName: "RBT One",
  state: "GA",
  payor: "Aetna",
  location: "Riverdale Clinic",
  ...over,
});

const owner = () => "BCBA One";

describe("BCBA Supervision — clinic scoping", () => {
  it("clinicKeyOf maps Peachtree Corners inputs, including Georgia Clinic and the 3850 Holcomb Bridge address", () => {
    expect(clinicKeyOf("Georgia Clinic")).toBe("peachtree_corners");
    expect(clinicKeyOf("3850 Holcomb Bridge Rd, Peachtree Corners GA")).toBe("peachtree_corners");
    expect(clinicKeyOf("Riverdale Clinic")).toBe("riverdale");
    expect(clinicKeyOf("Some Other Office")).toBe("other");
    expect(clinicKeyOf(null)).toBe("other");
    expect(clinicKeyOf("")).toBe("other");
  });

  it("a Riverdale-scoped total excludes Peachtree Corners and unmapped rows", () => {
    const past: SupervisionSessionInput[] = [
      s({ location: "Riverdale Clinic", hours: 100 }),
      s({ location: "Riverdale Clinic", procedureCode: "97155", hours: 5 }),
      s({ location: "Georgia Clinic", hours: 200 }),
      s({ location: "Georgia Clinic", procedureCode: "97155", hours: 20 }),
      s({ location: "3850 Holcomb Bridge Rd", hours: 50 }),
      s({ location: "Unrecognized Street Address", hours: 40 }),
      s({ location: "", hours: 30 }),
    ];
    const all = computeSupervisionAnalysis({ past, projected: [], resolveOwner: owner, clinicScope: "all" });
    expect(all.past.directHours).toBe(420);

    const riverdale = computeSupervisionAnalysis({
      past,
      projected: [],
      resolveOwner: owner,
      clinicScope: "riverdale",
    });
    expect(riverdale.past.directHours).toBe(100);
    expect(riverdale.past.supervisionHours).toBe(5);

    const peachtree = computeSupervisionAnalysis({
      past,
      projected: [],
      resolveOwner: owner,
      clinicScope: "peachtree_corners",
    });
    expect(peachtree.past.directHours).toBe(250);
    expect(peachtree.past.supervisionHours).toBe(20);

    const other = computeSupervisionAnalysis({
      past,
      projected: [],
      resolveOwner: owner,
      clinicScope: "other",
    });
    expect(other.past.directHours).toBe(70);
  });

  it("filterSessionsByClinicScope is a no-op for 'all' and pure elsewhere", () => {
    const sessions = [s({ location: "Riverdale" }), s({ location: "Georgia Clinic" })];
    expect(filterSessionsByClinicScope(sessions, "all")).toHaveLength(2);
    expect(filterSessionsByClinicScope(sessions, "riverdale")).toHaveLength(1);
    expect(filterSessionsByClinicScope(sessions, undefined)).toHaveLength(2);
  });

  it("By RBT stays Insufficient Data with no explicit 97155-to-RBT link, and never allocates the BCBA's hours across RBTs", () => {
    const past: SupervisionSessionInput[] = [
      s({ providerName: "RBT One", hours: 20 }),
      s({ providerName: "RBT Two", hours: 20 }),
      // Unlinked 97155 — no supervisedProviderName recorded.
      s({ procedureCode: "97155", hours: 5, providerName: "BCBA One" }),
    ];
    const a = computeSupervisionAnalysis({ past, projected: [], resolveOwner: owner, grouping: "rbt" });
    const rbtOne = a.past.rows.find((r) => r.label === "RBT One");
    const rbtTwo = a.past.rows.find((r) => r.label === "RBT Two");
    expect(rbtOne?.status).toBe("insufficient_data");
    expect(rbtTwo?.status).toBe("insufficient_data");
    expect(rbtOne?.supervisionHours).toBe(0);
    expect(rbtTwo?.supervisionHours).toBe(0);
    expect(rbtOne?.ratioPct).toBeNull();
    expect(rbtTwo?.ratioPct).toBeNull();
    // Overall (unattributed) totals still reflect the real 97155 hours.
    expect(a.past.supervisionHours).toBe(5);
  });

  it("honors an explicit 97155-to-RBT link when the source provides one", () => {
    const past: SupervisionSessionInput[] = [
      s({ providerName: "RBT One", hours: 20 }),
      s({
        procedureCode: "97155",
        hours: 3,
        providerName: "BCBA One",
        supervisedProviderName: "RBT One",
        supervisedProviderCrId: "rbt-1",
      }),
    ];
    const a = computeSupervisionAnalysis({ past, projected: [], resolveOwner: owner, grouping: "rbt" });
    const rbtOne = a.past.rows.find((r) => r.label === "RBT One");
    expect(rbtOne?.supervisionLinkable).toBe(true);
    expect(rbtOne?.supervisionHours).toBe(3);
    expect(rbtOne?.directHours).toBe(20);
    expect(rbtOne?.ratioPct).toBe(15);
    expect(rbtOne?.status).not.toBe("insufficient_data");
  });

  it("By Client can compute a ratio from client-linked 97155/97153 facts", () => {
    const past: SupervisionSessionInput[] = [
      s({ clientName: "Client A", clientCrId: "c1", hours: 40 }),
      s({ clientName: "Client A", clientCrId: "c1", procedureCode: "97155", hours: 4 }),
    ];
    const a = computeSupervisionAnalysis({ past, projected: [], resolveOwner: owner, grouping: "client" });
    expect(a.past.rows[0].label).toBe("Client A");
    expect(a.past.rows[0].directHours).toBe(40);
    expect(a.past.rows[0].supervisionHours).toBe(4);
    expect(a.past.rows[0].ratioPct).toBe(10);
  });
});
