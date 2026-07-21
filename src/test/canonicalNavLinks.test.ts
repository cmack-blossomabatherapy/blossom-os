// Rewritten to keep the canonical-link contract asserted. Prior version was
// skipped wholesale during release verification; this version restores
// coverage and preserves the redirect-target audit.

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
    const norm = p.replace(/\\/g, "/");
    if (entry.isDirectory()) walk(p, out);
    // Skip every test file — they legitimately contain path literals as fixtures.
    else if (/\.(ts|tsx)$/.test(entry.name)
          && !EXCLUDED.has(norm)
          && !/\.test\.tsx?$/.test(entry.name)
          && !/^src\/test\//.test(norm)
          && !/^src\/tests\//.test(norm)) {
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
  { name: "/ask-blossom",               patterns: [/["'`]\/ask-blossom(?:[?#"'`]|$)/m] },
  // /sop (resource library legacy) — exclude /sop/ subpaths (lib/sop/*) and /enterprise/sop-intelligence
  { name: "/sop",                       patterns: [/["'`]\/sop(?:[?#"'`]|$)/m] },
  // Bare /recruiting and /payroll: only true bare literals (no query/hash),
  // since query-scoped links like `/recruiting?candidate=…` are legitimate.
  { name: "/recruiting (bare)",         patterns: [/["'`]\/recruiting(?:["'`]|$)/m] },
  { name: "/payroll (bare)",            patterns: [/["'`]\/payroll(?:["'`]|$)/m] },
  { name: "/intake/vob-decision",       patterns: [/["'`]\/intake\/vob-decision(?:[?#"'`]|$)/m] },
];

describe("Pass 5B: navigation configs use canonical routes", () => {
  for (const { name, patterns } of legacyLinkPatterns) {
    it(`no link config references ${name}`, () => {
      for (const re of patterns) {
        const match = corpus.match(re);
        if (match) {
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
