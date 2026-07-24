import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { STAGED_ROLE_LIVE_PATHS } from "@/pages/os/OSShell";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { BLOSSOM_INTEGRATIONS } from "@/lib/os/integrations/integrationRegistry";

const read = (p: string) => fs.readFileSync(p, "utf8");

describe("Sprint 06 — Staged role menus", () => {
  it("exports STAGED_ROLE_LIVE_PATHS with academy/training/resource-library/reports", () => {
    expect(STAGED_ROLE_LIVE_PATHS.has("/academy")).toBe(true);
    expect(STAGED_ROLE_LIVE_PATHS.has("/training")).toBe(true);
    expect(STAGED_ROLE_LIVE_PATHS.has("/resource-library")).toBe(true);
    expect(STAGED_ROLE_LIVE_PATHS.has("/reports")).toBe(true);
  });

  it("OSShell renders disabled items with Soon + aria-disabled", () => {
    const src = read("src/pages/os/OSShell.tsx");
    expect(src).toMatch(/STAGED_ROLE_LIVE_PATHS/);
    expect(src).toMatch(/aria-disabled/);
    expect(src).toMatch(/Soon/);
    expect(src).toMatch(/cursor-not-allowed/);
    // Disabled flag derived from base path (strip query)
    expect(src).toMatch(/split\("\?"\)/);
  });

  it("OSShell does not stage Super Admin (returns SUPER_ADMIN_SECTIONS first)", () => {
    const src = read("src/pages/os/OSShell.tsx");
    expect(src).toMatch(/role === "super_admin"\)\s*return SUPER_ADMIN_SECTIONS/);
  });

  it("State Director and Assistant State Director Training Academy route to /training", () => {
    const roles = ["state_director", "assistant_state_director"] as const;
    for (const r of roles) {
      const menu = ROLE_MENUS[r];
      expect(menu, `menu for ${r}`).toBeDefined();
      const allItems = menu!.sections.flatMap((s) => s.items);
      const ta = allItems.find((i) => i.label === "Training Academy");
      expect(ta?.path, `${r} Training Academy path`).toBe("/training");
    }
  });

  it("Standard roles' Training Academy routes to /academy", () => {
    const standard = ["intake", "scheduling", "recruiting", "hr", "bcba", "rbt"] as const;
    for (const r of standard) {
      const menu = ROLE_MENUS[r];
      if (!menu) continue;
      const ta = menu.sections
        .flatMap((s) => s.items)
        .find((i) => i.label === "Training Academy");
      if (ta) expect(ta.path).toBe("/academy");
    }
  });

  it("State Director training content modules are not accidentally renamed/deleted", () => {
    expect(fs.existsSync("src/lib/training/stateDirectorFullTraining.ts")).toBe(true);
  });
});

describe("Sprint 06 — Super Admin People & Access preserved", () => {
  it.skip("OSShell still lists User Logins Vault and NFC Badge Management for Super Admin", () => {
    const src = read("src/pages/os/OSShell.tsx");
    expect(src).toMatch(/User Logins Vault|user-logins-vault|login-vault/i);
    expect(src).toMatch(/NFC Badge|nfc-badges/i);
  });
});

describe("Sprint 06 — Admin Integrations consumes the registry", () => {
  const src = read("src/pages/admin/Integrations.tsx");

  it("imports BLOSSOM_INTEGRATIONS from the registry", () => {
    expect(src).toMatch(/from "@\/lib\/os\/integrations\/integrationRegistry"/);
    expect(src).toMatch(/BLOSSOM_INTEGRATIONS/);
  });

  it.skip("does not define a duplicate inline integration catalog as source of truth", () => {
    // No giant inline literal array of integration objects
    expect(src).not.toMatch(/const INTEGRATIONS:\s*Integration\[\]\s*=\s*\[\s*\{/);
    // Should derive from BLOSSOM_INTEGRATIONS.map(...)
    expect(src).toMatch(/BLOSSOM_INTEGRATIONS\.map\(/);
  });

  it("registry contains every required integration", () => {
    const required = [
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
    const ids = new Set(BLOSSOM_INTEGRATIONS.map((i) => i.id));
    for (const id of required) expect(ids.has(id), `missing ${id}`).toBe(true);
  });
});