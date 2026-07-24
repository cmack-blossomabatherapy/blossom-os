import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

// Recruiting Team 100% Pass 7 — hardening + alignment coverage.

describe("Recruiting Pass 7 — Performance page uses live data only", () => {
  const src = read("src/pages/os/OSRecruitingPerformance.tsx");

  it("does not import from @/data/recruitingDashboard", () => {
    expect(src).not.toMatch(/from ["']@\/data\/recruitingDashboard["']/);
  });

  it("does not reference the removed getClientStaffingNeeds helper", () => {
    expect(src).not.toMatch(/\bgetClientStaffingNeeds\b/);
  });

  it("wires live recruiting hooks", () => {
    expect(src).toMatch(/useRecruitingStaffingNeeds/);
    expect(src).toMatch(/useRecruitingCandidates/);
    expect(src).toMatch(/useRecruitingInterviews/);
    expect(src).toMatch(/useRecruitingOffers/);
    expect(src).toMatch(/useRecruitingBackgroundChecks/);
    expect(src).toMatch(/useRecruitingOnboarding/);
    expect(src).toMatch(/useRecruitingFollowups/);
  });
});

describe("Recruiting Pass 7 — Apploi importer safety", () => {
  const src = read("src/hooks/useApploiIntegration.ts");

  it("never uses the legacy email/id onConflict upsert", () => {
    expect(src).not.toMatch(/onConflict:\s*email\s*\?\s*"email"\s*:\s*"id"/);
  });

  it("does not reset pipeline_stage on updates (New Applicant only appears in the insert branch)", () => {
    // The only "New Applicant" literal must live inside the insert path, not
    // the update path. We assert it exists in an insertRow block.
    const matches = [...src.matchAll(/pipeline_stage:\s*"New Applicant"/g)];
    expect(matches.length).toBe(1);
    // The safeProfilePatch (used for updates) must NOT contain pipeline_stage
    const patchBlock = src.split("safeProfilePatch")[1]?.split("}")[0] ?? "";
    expect(patchBlock).not.toMatch(/pipeline_stage/);
  });

  it("handles missing external id via a durable normalized-record fallback, no blind insert", () => {
    // The importer must import + call the resolver, and log skips when there
    // is truly no durable id — the actual `normalized_record:${recordId}`
    // fallback literal lives in the shared resolver module.
    expect(src).toMatch(/resolveApploiIdentity/);
    expect(src).toMatch(/apploi_import_skipped/);
    const resolver = read("src/lib/recruiting/apploiNormalizedIdentity.ts");
    expect(resolver).toMatch(/normalized_record:\$\{recordId\}/);
  });

  it("selects candidate id after insert/update for activity events", () => {
    expect(src).toMatch(/\.select\("id"\)/);
    expect(src).toMatch(/candidate_id:\s*finalCandidateId/);
    expect(src).toMatch(/entity_id:\s*finalCandidateId/);
  });
});

describe("Recruiting Pass 7 — menu alignment", () => {
  const menus = read("src/lib/os/roleMenus.ts");

  it("keeps core recruiting nav in every recruiting role menu (Training Academy lives in the shared Training & Resources section)", () => {
    const roles = ["recruiting_team", "recruiting_lead", "recruiting_coordinator"] as const;
    for (const role of roles) {
      const idx = menus.indexOf(`${role}:`);
      expect(idx).toBeGreaterThan(-1);
      const next = menus.slice(idx, idx + 4000);
      // The duplicative "Recruiting Academy" entry was retired; recruiters
      // now use the unified Training Academy via TRAINING_AND_RESOURCES.
      expect(next).not.toMatch(/\/recruiting\/academy/);
      expect(next).toMatch(/\/recruiting\/rbt/);
      expect(next).toMatch(/\/recruiting\/bcba/);
      expect(next).toMatch(/\/recruiting\/onboarding/);
      expect(next).toMatch(/\/recruiting\/messages/);
      expect(next).toMatch(/\/recruiting\/escalations/);
    }
  });
});

describe("Recruiting Pass 7 — Reports cleanup", () => {
  const app = read("src/App.tsx");

  it("redirects /reports/ai/new to /reports (not into an AI dashboard)", () => {
    expect(app).toMatch(/path="\/reports\/ai\/new"[^>]*to="\/reports"/);
  });

  it("redirects /reports/ai/:id via AiReportRedirect to /reports", () => {
    const fn = app.split("function AiReportRedirect")[1]?.split("}")[0] ?? "";
    expect(fn).toMatch(/to="\/reports"/);
    expect(fn).not.toMatch(/dashboards\/ai/);
  });
});