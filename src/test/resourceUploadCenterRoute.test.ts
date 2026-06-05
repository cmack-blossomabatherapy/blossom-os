import { describe, expect, it } from "vitest";
import fs from "node:fs";

const APP = fs.readFileSync("src/App.tsx", "utf8");
const TMC = fs.readFileSync("src/pages/hr/TrainingManagementCenter.tsx", "utf8");
const RUC = fs.readFileSync("src/pages/hr/ResourceUploadCenter.tsx", "utf8");

describe("Emergency Resource Upload Center route", () => {
  it("maps /hr/resource-management to the stable upload center route guard", () => {
    expect(APP).toMatch(/path="\/hr\/resource-management"\s+element=\{<ResourceUploadAdminRoute\s*\/>\}/);
    expect(APP).toMatch(/import ResourceUploadCenter/);
    expect(APP).not.toMatch(/import ResourceManagement/);
    expect(APP).not.toMatch(/<ResourceManagement\s*\/>/);
  });

  it("redirects /resource-management to /hr/resource-management", () => {
    expect(APP).toMatch(/path="\/resource-management"\s+element=\{<Navigate to="\/hr\/resource-management" replace \/>\}/);
  });

  it("does not route legacy ResourceHub into resource management paths", () => {
    expect(APP).not.toMatch(/import ResourceHub/);
    expect(APP).not.toMatch(/<ResourceHub/);
    expect(APP).toMatch(/path="\/hr\/resources"\s+element=\{<Navigate to="\/hr\/resource-management" replace \/>\}/);
    expect(APP).toMatch(/path="\/resources"\s+element=\{<Navigate to="\/resource-library" replace \/>\}/);
  });

  it("stable upload page contains the required panels and safe fallback", () => {
    expect(RUC).toContain("Resource Upload Center");
    expect(RUC).toContain('id="bulk-upload"');
    expect(RUC).toContain("UploadBatchSummary");
    expect(RUC).toContain("UploadQAChecklist");
    expect(RUC).toContain("ResourceBulkUploadPanel");
    expect(RUC).toContain("Resource upload panel could not load");
  });

  it("Training Management Upload Resource CTAs use the stable hash path and no href placeholders", () => {
    expect(TMC).toMatch(/navigate\("\/hr\/resource-management#bulk-upload"\)/);
    expect(TMC).toContain("useCanUploadResources");
    expect(TMC).not.toMatch(/href="#"/);
    expect(RUC).not.toMatch(/href="#"/);
  });
});