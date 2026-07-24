import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { ROLE_HOME } from "@/lib/os/roleHome";

/**
 * Blossom OS — Growth + Finance/RCM Release Manifest (Cluster 4).
 *
 * Locks in the Cluster 4 defect fixes across marketing, business development,
 * clinic growth and billing/finance roles:
 *   1. Every cluster role has a landing route and a non-empty menu.
 *   2. Audited growth/marketing files removed native window.prompt/confirm/alert
 *      in favour of <OperatorDialogsProvider>.
 *   3. OperatorDialogsProvider is mounted globally in App.tsx.
 */

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

const GROWTH_FINANCE_ROLES = [
  "marketing_team",
  "marketing_growth_lead",
  "business_development",
  "clinic_growth",
  "billing_finance",
] as const;

describe("Growth/Finance cluster — landing routes and menus", () => {
  it.each(GROWTH_FINANCE_ROLES)("role %s has a landing route and a non-empty menu", (role) => {
    const home = ROLE_HOME[role] ?? "/dashboard";
    expect(home).toMatch(/^\//);
    const menu = ROLE_MENUS[role];
    expect(menu, `role ${role} missing from ROLE_MENUS`).toBeTruthy();
    const paths = menu!.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(paths.length).toBeGreaterThan(0);
  });
});

describe("Growth/Finance cluster — no native browser dialogs on audited pages", () => {
  const files = [
    "src/pages/os/marketing/ReferralCRM.tsx",
    "src/pages/os/growth/LeadSourceInbox.tsx",
    "src/components/marketing/referrals/AddReferralDialog.tsx",
  ];

  it.each(files)("%s does not call window.prompt/confirm/alert", (file) => {
    const src = read(file);
    expect(src).not.toMatch(/window\.(prompt|confirm|alert)\s*\(/);
  });
});

describe("Growth/Finance cluster — OperatorDialogsProvider mounted globally", () => {
  it("App.tsx mounts <OperatorDialogsProvider>", () => {
    const src = read("src/App.tsx");
    expect(src).toMatch(/OperatorDialogsProvider/);
  });
});