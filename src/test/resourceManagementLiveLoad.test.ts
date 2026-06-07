import { describe, it, expect } from "vitest";
import fs from "node:fs";

const SRC = fs.readFileSync("src/pages/hr/ResourceManagement.tsx", "utf8");

describe("Resource Management loads live admin resources", () => {
  it("imports the admin Supabase hook", () => {
    expect(SRC).toMatch(/from\s+"@\/hooks\/useAdminResources"/);
    expect(SRC).toMatch(/useAdminResources\(\s*\)/);
  });

  it("renders a calm error state on Supabase failure", () => {
    expect(SRC).toMatch(/data-testid="resource-management-load-error"/);
    expect(SRC).not.toMatch(/href="#"/);
  });

  it("preserves bulk upload + QA checklist", () => {
    expect(SRC).toMatch(/ResourceBulkUploadPanel/);
    expect(SRC).toMatch(/UploadQAChecklist/);
  });
});

describe("Learner Resource Library hook stays published-only", () => {
  const HOOK = fs.readFileSync("src/hooks/useLibraryResources.ts", "utf8");
  it("filters to upload_status published", () => {
    expect(HOOK).toMatch(/\.eq\(\s*"upload_status"\s*,\s*"published"\s*\)/);
    expect(HOOK).toMatch(/\.eq\(\s*"is_active"\s*,\s*true\s*\)/);
  });
});

describe("Training Management SD coverage uses live data", () => {
  const TMC = fs.readFileSync("src/pages/hr/TrainingManagementCenter.tsx", "utf8");
  it("wires useAdminResources + sdSopCoverage", () => {
    expect(TMC).toMatch(/useAdminResources/);
    expect(TMC).toMatch(/computeSdSopCoverageFromResources/);
    expect(TMC).toMatch(/data-testid="sd-coverage-needs-upload"/);
    expect(TMC).toMatch(/data-testid="sd-coverage-published"/);
    expect(TMC).toMatch(/Learners only see published resources/);
  });
});

describe("State Director module detail surfaces mapped SOP status", () => {
  const DETAIL = fs.readFileSync("src/pages/os/OSTrainingDetail.tsx", "utf8");
  it("includes Open SOP / pending / missing branches and no broken links", () => {
    expect(DETAIL).toMatch(/data-testid="sd-mapped-sop"/);
    expect(DETAIL).toMatch(/Open SOP/);
    expect(DETAIL).toMatch(/SOP upload pending/);
    expect(DETAIL).toMatch(/SOP not linked yet/);
    expect(DETAIL).not.toMatch(/href="#"/);
  });
});