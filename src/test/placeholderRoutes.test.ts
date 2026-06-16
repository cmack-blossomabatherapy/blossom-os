import { describe, it, expect } from "vitest";
import fs from "node:fs";

const appSrc = fs.readFileSync("src/App.tsx", "utf8");
const shellSrc = fs.readFileSync("src/pages/os/OSShell.tsx", "utf8");

// Pass 6B decisions per docs/placeholder-route-inventory.md.

// Routes that still render OSPlaceholder / OSComingSoon directly.
const DIRECT_ONLY_PLACEHOLDER_ROUTES = [
  "/credentialing",
  "/employee-ops",
  "/workflows",
  "/tech-requests",
  "/internal-requests",
  "/open-issues",
  "/projects",
  "/ai/assistant",
  "/ai/predictive",
  "/ai/workflows",
  "/state-management",
];

// Routes converted in Pass 6B to redirects.
const REDIRECTED_PLACEHOLDER_ROUTES: Record<string, string> = {
  "/billing": "/billing-finance",
  "/revenue": "/billing-finance",
  "/insurance": "/authorizations",
  "/analytics": "/reports",
  "/ai/automations": "/automations",
};

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
  for (const path of DIRECT_ONLY_PLACEHOLDER_ROUTES) {
    it(`direct-only placeholder ${path} still resolves`, () => {
      const re = new RegExp(`<Route\\s+path="${path.replace(/\//g, "\\/")}"`);
      expect(appSrc).toMatch(re);
    });
  }

  for (const [from, to] of Object.entries(REDIRECTED_PLACEHOLDER_ROUTES)) {
    it(`redirected placeholder ${from} → ${to}`, () => {
      // Route element must be a <Navigate to="…" replace /> matching the canonical target.
      const re = new RegExp(
        `<Route\\s+path="${from.replace(/\//g, "\\/")}"\\s+element=\\{<Navigate\\s+to="${to.replace(/\//g, "\\/")}"\\s+replace\\s*/>}\\s*/>`,
      );
      expect(appSrc).toMatch(re);
    });

    it(`redirected placeholder ${from} no longer renders OSPlaceholder/OSComingSoon`, () => {
      const re = new RegExp(
        `<Route\\s+path="${from.replace(/\//g, "\\/")}"\\s+element=\\{<OS(Placeholder|ComingSoon)`,
      );
      expect(appSrc).not.toMatch(re);
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

  // Nav scoping is now driven entirely by src/lib/os/roleMenus.ts +
  // SUPER_ADMIN_SECTIONS in OSShell. Per the Phase 0 unification, AI
  // navigation is intentionally hidden and Credentialing is surfaced only
  // inside the Super Admin "Clinical & Quality" group — so the old "hidden
  // from nav" / "AI assistant in nav" assertions no longer apply.
  void HIDDEN_FROM_NAV;
  void defaultSectionsBlock;

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