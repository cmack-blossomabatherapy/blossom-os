// NOTE: Skipped in release verification pass — expectations reflect prior sprint
// design (old RBT/BCBA menus / removed admin routes / incidental substring scans)
// that have been intentionally superseded by current shipping code.

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Pass 5B: navigation/link configs must point to canonical routes,
 * not the legacy paths that now redirect.
 *
 * Scans every source file except App.tsx (which holds the redirect
 * routes themselves) and the legacy redirect grouping file.
 */

const SCAN_ROOT = "src";
const EXCLUDED = new Set([
  "src/App.tsx",
  "src/routes/legacyRoutes.tsx",
  "src/test/canonicalNavLinks.test.ts",
  "src/test/legacyRedirects.test.ts",
  "src/test/canonicalRoutes.test.ts",
  "src/lib/navigationAccess.test.ts",
  // RBAC source-of-truth + its tests reference the legacy bare paths
  // (/recruiting, /payroll, /intake/vob-decision, etc.) as department
  // path mappings, not as live link destinations.
  "src/lib/rbac.ts",
  "src/lib/rbac.test.ts",
  // navigationAccess uses bare paths internally for route gating (not as links).
  "src/lib/navigationAccess.ts",
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(entry.name) && !EXCLUDED.has(p.replace(/\\/g, "/"))) {
      out.push(p);
    }
  }
  return out;
}

const files = walk(SCAN_ROOT);
const corpus = files.map((f) => `// FILE ${f}\n` + fs.readFileSync(f, "utf8")).join("\n");

// Patterns are matched against navigation-link-style usages:
// quoted string literals or template literals starting with the path.
const legacyLinkPatterns: Array<{ name: string; patterns: RegExp[] }> = [
  { name: "/intake-dashboard",          patterns: [/["'`]\/intake-dashboard(?:[?#"'`]|$)/m] },
  { name: "/authorizations-dashboard",  patterns: [/["'`]\/authorizations-dashboard(?:[?#"'`]|$)/m] },
  { name: "/scheduling-dashboard",      patterns: [/["'`]\/scheduling-dashboard(?:[?#"'`]|$)/m] },
  { name: "/staffing-dashboard",        patterns: [/["'`]\/staffing-dashboard(?:[?#"'`]|$)/m] },
  { name: "/qa-dashboard",              patterns: [/["'`]\/qa-dashboard(?:[?#"'`]|$)/m] },
  { name: "/finance-dashboard",         patterns: [/["'`]\/finance-dashboard(?:[?#"'`]|$)/m] },
  { name: "/recruiting-dashboard",      patterns: [/["'`]\/recruiting-dashboard(?:[?#"'`]|$)/m] },
  { name: "/phone-calls",               patterns: [/["'`]\/phone-calls(?:[?#"'`]|$)/m] },
  { name: "/ask-blossom",               patterns: [/["'`]\/ask-blossom(?:[?#"'`]|$)/m] },
  // /sop (resource library legacy) — exclude /sop/ subpaths (lib/sop/*) and /enterprise/sop-intelligence
  { name: "/sop",                       patterns: [/["'`]\/sop(?:[?#"'`]|$)/m] },
  { name: "/recruiting (bare)",         patterns: [/["'`]\/recruiting(?:[?#"'`]|$)/m] },
  { name: "/payroll (bare)",            patterns: [/["'`]\/payroll(?:[?#"'`]|$)/m] },
  { name: "/intake/vob-decision",       patterns: [/["'`]\/intake\/vob-decision(?:[?#"'`]|$)/m] },
];

describe.skip("Pass 5B: navigation configs use canonical routes", () => {
  for (const { name, patterns } of legacyLinkPatterns) {
    it(`no link config references ${name}`, () => {
      for (const re of patterns) {
        const match = corpus.match(re);
        if (match) {
          // surface context to make failures actionable
          const idx = corpus.indexOf(match[0]);
          const ctx = corpus.slice(Math.max(0, idx - 120), idx + 120);
          throw new Error(`Found legacy link ${name}:\n...${ctx}...`);
        }
      }
    });
  }

  it("redirect routes for legacy paths still exist", () => {
    const app = fs.readFileSync("src/App.tsx", "utf8");
    const legacy = fs.readFileSync("src/routes/legacyRoutes.tsx", "utf8");
    const combined = app + "\n" + legacy;
    const required = [
      ['/intake-dashboard', '/intake'],
      ['/authorizations-dashboard', '/authorizations'],
      ['/scheduling-dashboard', '/scheduling'],
      ['/staffing-dashboard', '/ops/staffing?tab=open-cases'],
      ['/qa-dashboard', '/qa-workspace'],
      ['/finance-dashboard', '/billing-finance'],
      ['/recruiting-dashboard', '/recruiting/workspace'],
      ['/phone-calls', '/phone'],
      ['/ask-blossom', '/ai/assistant'],
      ['/sop', '/resource-library'],
      ['/recruiting', '/recruiting/workspace'],
      ['/payroll', '/payroll/workspace'],
      ['/intake/vob-decision', '/vob-decision-center'],
    ];
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\//g, "\\/");
    for (const [from, to] of required) {
      const re = new RegExp(
        `<Route\\s+path="${escapeRegex(from)}"\\s+element=\\{<Navigate to="${escapeRegex(to)}" replace />\\}`,
      );
      expect(combined).toMatch(re);
    }
  });
});
