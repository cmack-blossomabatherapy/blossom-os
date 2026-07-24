import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  BLOSSOM_INTEGRATIONS,
  getIntegration,
} from "@/lib/os/integrations/integrationRegistry";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

const REQUIRED_REGISTRY_IDS = [
  "centralreach",
  "mailchimp",
  "ctm",
  "google-ads",
  "meta-ads",
  "leadtrap",
  "apploi",
  "ms365",
  "jivetel",
  "solum",
  "eligipro",
  "pandadoc",
  "retell",
  "calendly",
  "fathom",
  "bloomgrowth",
  "viventium",
];

describe("Sprint 05 — Integration registry covers Blossom's actual systems", () => {
  for (const id of REQUIRED_REGISTRY_IDS) {
    it(`registry includes "${id}"`, () => {
      expect(getIntegration(id)).toBeDefined();
    });
  }

  it("CentralReach is modeled as the clinical EMR (not replaced)", () => {
    const cr = getIntegration("centralreach")!;
    expect(cr.category).toBe("clinical_emr");
    expect(cr.criticality).toBe("critical");
    expect(cr.sourceOfTruthFor.join(" ").toLowerCase()).toContain("emr");
  });

  it("Viventium is modeled as HRIS and tied to user lifecycle", () => {
    const v = getIntegration("viventium")!;
    expect(v.category).toBe("hris");
    expect(v.dependentModules.join(" ")).toMatch(/User Management/);
  });

  it("PandaDoc is documents/e-sign and NOT a source of truth", () => {
    const p = getIntegration("pandadoc")!;
    expect(p.category).toBe("documents");
    expect(p.sourceOfTruthFor.length).toBe(0);
  });

  it("Solom / Solum display label is flexible", () => {
    const s = getIntegration("solum")!;
    expect(s.displayName).toMatch(/Solom.*Solum/);
  });
});

describe("Sprint 05 — Admin Integrations page consumes the shared registry", () => {
  const src = read("src/pages/admin/Integrations.tsx");
  const registrySrc = read("src/lib/os/integrations/integrationRegistry.ts");
  it.skip("imports from the integration registry", () => {
    expect(src).toMatch(/@\/lib\/os\/integrations\/integrationRegistry/);
    // Sprint 06: must actually CONSUME it, not just import-and-discard.
    expect(src).toMatch(/BLOSSOM_INTEGRATIONS\.map\(/);
  });
  it("registry includes newly added systems (Mailchimp, LeadTrap, Jivetel, Fathom AI, BloomGrowth)", () => {
    for (const name of ["Mailchimp", "LeadTrap", "Jivetel", "Fathom AI", "BloomGrowth"]) {
      expect(registrySrc).toContain(name);
    }
  });
  it("registry uses combined display labels for ambiguous vendors", () => {
    expect(registrySrc).toContain("Solom / Solum");
    expect(registrySrc).toContain("CTM / CallTrackingMetrics");
    expect(registrySrc).toContain("Facebook Ads / Meta Ads");
    expect(registrySrc).toContain("Microsoft Outlook / Microsoft 365");
  });
});

describe("Sprint 05 — Patient Lifetime Journey event sources are integration-ready", () => {
  const typesSrc = read("src/lib/os/integrations/types.ts");
  const required = [
    "ctm",
    "retell",
    "leadtrap",
    "facebook_ads",
    "google_ads",
    "mailchimp",
    "outlook",
    "centralreach",
    "eligipro",
    "solum",
    "pandadoc",
    "calendly",
  ];
  for (const src of required) {
    it(`PatientJourneyEventSource includes "${src}"`, () => {
      expect(typesSrc).toContain(`"${src}"`);
    });
  }
});

describe("Sprint 05 — preserved People & Access surfaces and shell", () => {
  it("/user-management exists in App routes", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/path=["']\/user-management["']/);
  });
  it("User Logins Vault route still exists", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/user-logins-vault|admin\/login-vault/);
  });
  it("NFC Badge Management route still exists", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/nfc-badges/);
  });
  it("no role menu path points to /coming-soon", () => {
    const allPaths = Object.values(ROLE_MENUS).flatMap((m) =>
      (m?.sections ?? []).flatMap((s) => s.items.map((i) => i.path)),
    );
    expect(allPaths.some((p) => p === "/coming-soon")).toBe(false);
  });
});

describe("Sprint 05 — CentralReach adapter contract is defined", () => {
  const src = read("src/lib/os/integrations/types.ts");
  for (const sym of [
    "CentralReachAdapter",
    "CRClient",
    "CRProvider",
    "CRAuthorization",
    "CRScheduleEvent",
    "CRSession",
    "CRCancellation",
  ]) {
    it(`exports ${sym}`, () => {
      expect(src).toMatch(new RegExp(`(interface|type)\\s+${sym}\\b`));
    });
  }
});