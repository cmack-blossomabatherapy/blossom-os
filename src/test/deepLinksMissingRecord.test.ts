import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (rel: string) => readFileSync(resolve(__dirname, "../..", rel), "utf8");

/**
 * When a CTM call row or escalation chip carries a lead id that no longer
 * exists (deleted, out of scope, etc.) the Leads workspace MUST NOT silently
 * mount an empty drawer. It should surface a toast and strip the stale
 * ?lead= param so the URL stays clean.
 */
describe("Missing-record deep links show a toast + empty state (never a blank drawer)", () => {
  const leadsV2 = read("src/pages/os/OSLeadsV2.tsx");
  const drawer = read("src/components/leads/LeadDetailDrawer.tsx");

  it("LeadDetailDrawer returns null (renders nothing) when the leadId is not found", () => {
    // Contract: `const lead = leads.find(...) ?? null;` then `if (!lead) return null;`
    expect(drawer).toMatch(/leads\.find\(\(l\)\s*=>\s*l\.id\s*===\s*leadId\)\s*\?\?\s*null/);
    expect(drawer).toMatch(/if\s*\(!lead\)\s*return null;/);
  });

  it("OSLeadsV2 guards against a stale ?lead=<id> deep link once data has loaded", () => {
    // 1) Waits for data (no toast while loading)
    expect(leadsV2).toMatch(/if\s*\(loading\)\s*return;/);
    // 2) Checks existence against the loaded leads
    expect(leadsV2).toMatch(/leads\.some\(\(l\)\s*=>\s*l\.id\s*===\s*openLeadId\)/);
    // 3) Fires an error toast with a helpful description
    expect(leadsV2).toMatch(/toast\.error\("Lead not found"/);
    expect(leadsV2).toMatch(/description:\s*"That lead may have been deleted/);
    // 4) Strips the stale ?lead= param (replace, not push)
    expect(leadsV2).toMatch(/next\.delete\("lead"\)/);
    expect(leadsV2).toMatch(/setSearchParams\(next,\s*\{\s*replace:\s*true\s*\}\)/);
  });

  it("guard uses a ref to fire the toast at most once per bad id (no toast storms)", () => {
    expect(leadsV2).toMatch(/missingLeadHandledRef/);
    expect(leadsV2).toMatch(/missingLeadHandledRef\.current\s*===\s*openLeadId/);
  });
});