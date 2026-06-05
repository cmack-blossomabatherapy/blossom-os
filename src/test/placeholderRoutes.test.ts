import { describe, it, expect } from "vitest";
import fs from "node:fs";

const appSrc = fs.readFileSync("src/App.tsx", "utf8");
const shellSrc = fs.readFileSync("src/pages/os/OSShell.tsx", "utf8");

// Routes that render OSPlaceholder / OSComingSoon. Must still resolve directly
// (no deletion in Pass 6A) even though most are now hidden from primary nav.
const PLACEHOLDER_ROUTES = [
  "/credentialing",
  "/employee-ops",
  "/billing",
  "/revenue",
  "/insurance",
  "/workflows",
  "/analytics",
  "/tech-requests",
  "/internal-requests",
  "/open-issues",
  "/projects",
  "/ai/assistant",
  "/ai/automations",
  "/ai/predictive",
  "/ai/workflows",
  "/state-management",
];

// Subset that Pass 6A removed from the OS sidebar (DEFAULT_SECTIONS).
// `/ai/assistant` stays visible — it's the canonical AI CTA target.
// `/analytics` and `/projects` were not in DEFAULT_SECTIONS to begin with.
const HIDDEN_FROM_NAV = [
  "/credentialing",
  "/employee-ops",
  "/billing",
  "/revenue",
  "/insurance",
  "/workflows",
  "/tech-requests",
  "/internal-requests",
  "/open-issues",
  "/ai/automations",
  "/ai/predictive",
  "/ai/workflows",
  "/state-management",
];

// Canonical routes from prior cleanup passes — must still exist.
const CANONICAL_ROUTES = [
  "/",
  "/intake",
  "/authorizations",
  "/staffing",
  "/phone",
  "/reports",
  "/user-management",
  "/settings",
  "/auth",
  "/recruiting/workspace",
  "/payroll/workspace",
  "/vob-decision-center",
];

describe("Pass 6A — placeholder governance", () => {
  for (const path of PLACEHOLDER_ROUTES) {
    it(`placeholder route ${path} still resolves`, () => {
      const re = new RegExp(`<Route\\s+path="${path.replace(/\//g, "\\/")}"`);
      expect(appSrc).toMatch(re);
    });
  }

  // Pull DEFAULT_SECTIONS block once so we only check the top-level nav config
  // and not the role-specific sidebars further down in OSShell.tsx.
  const defaultSectionsBlock = (() => {
    const start = shellSrc.indexOf("const NAV_SECTIONS");
    const startAlt = start === -1 ? shellSrc.indexOf("DEFAULT_SECTIONS") : start;
    // Fall back to first ~170 lines which is where the top-level nav lives.
    const head = shellSrc.split("\n").slice(0, 170).join("\n");
    return startAlt === -1 ? head : shellSrc.slice(startAlt, startAlt + 6000);
  })();

  for (const path of HIDDEN_FROM_NAV) {
    it(`${path} is no longer in the primary OS sidebar`, () => {
      const re = new RegExp(`to:\\s*"${path.replace(/\//g, "\\/")}"`);
      expect(defaultSectionsBlock).not.toMatch(re);
    });
  }

  it("/ai/assistant remains in the primary OS sidebar", () => {
    expect(defaultSectionsBlock).toMatch(/to:\s*"\/ai\/assistant"/);
  });

  for (const path of CANONICAL_ROUTES) {
    it(`canonical route ${path} still declared`, () => {
      const sources = [
        appSrc,
        fs.readFileSync("src/routes/publicRoutes.tsx", "utf8"),
        fs.readFileSync("src/routes/legacyRoutes.tsx", "utf8"),
      ].join("\n");
      const re = new RegExp(`<Route\\s+path="${path.replace(/\//g, "\\/")}"`);
      expect(sources).toMatch(re);
    });
  }
});