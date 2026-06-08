import { describe, it, expect } from "vitest";
import fs from "node:fs";

const PANEL = fs.readFileSync(
  "src/components/training/SDLaunchReadinessPanel.tsx",
  "utf8",
);
const TMC = fs.readFileSync(
  "src/pages/hr/TrainingManagementCenter.tsx",
  "utf8",
);
const RUC = fs.readFileSync(
  "src/pages/hr/ResourceUploadCenter.tsx",
  "utf8",
);
const LIB = fs.readFileSync("src/pages/os/OSResourceLibrary.tsx", "utf8");

describe("SD Launch readiness panel — honest, data-driven states", () => {
  it("no longer hard-codes the privacy/vault row as ok", () => {
    expect(PANEL).not.toMatch(
      /Privacy \/ vault items excluded from learner view[\s\S]{0,80}state:\s*"ok"/,
    );
  });

  it("renders an overall launch status banner", () => {
    expect(PANEL).toContain('data-testid="sd-launch-overall-status"');
    expect(PANEL).toMatch(/Ready to start with known gaps/);
    expect(PANEL).toMatch(/Not ready/);
  });

  it("includes Welcome setup group with letters and CTA route", () => {
    expect(PANEL).toMatch(/testid:\s*"sd-launch-welcome"/);
    expect(PANEL).toMatch(/Chad Kaufman welcome letter/);
    expect(PANEL).toMatch(/Shira Lasry welcome letter/);
    expect(PANEL).toMatch(/Welcome CTA routes back to \/training/);
  });

  it("exposes vault/excluded and title-cleanup counts in the SOP group", () => {
    expect(PANEL).toMatch(/need title cleanup/);
    expect(PANEL).toMatch(/vault \/ excluded/);
  });
});

describe("Training Management Control Room — launch command wrapper", () => {
  it("wraps the readiness panels in a State Director Launch Command section", () => {
    expect(TMC).toMatch(/data-testid="sd-launch-command"/);
    expect(TMC).toMatch(/State Director Launch Command/);
  });
});

describe("Resource Upload Center — honest counts and filters", () => {
  it("shows the connected-SOP definition helper line", () => {
    expect(RUC).toMatch(
      /Training Management only counts a State Director SOP as connected/,
    );
  });

  it("includes new summary tiles for SD missing, file repair, vault/excluded", () => {
    expect(RUC).toMatch(/SD SOPs missing/);
    expect(RUC).toMatch(/Needs file repair/);
    expect(RUC).toMatch(/Vault \/ excluded/);
  });

  it("adds filters for missing SD SOPs and title cleanup", () => {
    expect(RUC).toMatch(/missing_sd_sops/);
    expect(RUC).toMatch(/needs_title_cleanup/);
    expect(RUC).toMatch(/MissingSDSopsPanel/);
  });

  it("has no placeholder hashes for buttons or links", () => {
    expect(RUC).not.toMatch(/href="#"/);
    expect(TMC).not.toMatch(/href="#"/);
    expect(LIB).not.toMatch(/href="#"/);
    expect(PANEL).not.toMatch(/href="#"/);
  });
});

describe("Resource Library learner empty state copy", () => {
  it("explains role-assigned published resources, not a global empty library", () => {
    expect(LIB).toMatch(/No published resources assigned to your role/);
  });
});