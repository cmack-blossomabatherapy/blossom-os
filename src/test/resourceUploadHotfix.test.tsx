import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ResourceBulkUploadPanel } from "@/components/resources/ResourceBulkUploadPanel";
import { UploadBatchSummary, computeBatchSummary } from "@/components/resources/UploadBatchSummary";
import { UploadQAChecklist } from "@/components/resources/UploadQAChecklist";
import { SafeBoundary } from "@/components/common/SafeBoundary";
import { isDuplicateCandidate } from "@/lib/resources/resourceData";
import fs from "node:fs";
import path from "node:path";

describe("Resource Upload hotfix — defensive rendering", () => {
  it("ResourceBulkUploadPanel renders with no existingResources", () => {
    const { getByTestId } = render(
      <MemoryRouter>
        <ResourceBulkUploadPanel />
      </MemoryRouter>,
    );
    expect(getByTestId("resource-bulk-upload-panel")).toBeTruthy();
  });

  it("ResourceBulkUploadPanel renders with empty array", () => {
    const { getByTestId } = render(
      <MemoryRouter>
        <ResourceBulkUploadPanel existingResources={[]} />
      </MemoryRouter>,
    );
    expect(getByTestId("resource-bulk-upload-panel")).toBeTruthy();
  });

  it("UploadBatchSummary renders with missing/zero counts", () => {
    const counts = computeBatchSummary([], {}, 0);
    const { getByTestId } = render(<UploadBatchSummary counts={counts} />);
    expect(getByTestId("upload-batch-summary")).toBeTruthy();
  });

  it("UploadQAChecklist renders", () => {
    const { getByTestId } = render(<UploadQAChecklist />);
    expect(getByTestId("upload-qa-checklist")).toBeTruthy();
  });

  it("isDuplicateCandidate handles undefined/empty existing safely", () => {
    const candidate: any = { title: "x", category: "sops", roles: [], states: [] };
    expect(isDuplicateCandidate(candidate, undefined as any)).toBe(false);
    expect(isDuplicateCandidate(candidate, [])).toBe(false);
  });

  it("SafeBoundary catches a crashing child and shows fallback", () => {
    const Boom = () => {
      throw new Error("boom");
    };
    const { getByTestId } = render(
      <SafeBoundary label="Test panel">
        <Boom />
      </SafeBoundary>,
    );
    expect(getByTestId("safe-boundary-fallback")).toBeTruthy();
  });
});

describe("Resource Upload hotfix — routing & navigation", () => {
  const appSource = fs.readFileSync(
    path.resolve(__dirname, "../App.tsx"),
    "utf8",
  );

  it("App registers /hr/resource-management route", () => {
    expect(appSource).toMatch(/path="\/hr\/resource-management"/);
  });

  it("/hr/resource-management is admin-gated", () => {
    const block = appSource.split('path="/hr/resource-management"')[1] ?? "";
    expect(block.slice(0, 400)).toMatch(/ResourceUploadAdminRoute/);
    expect(appSource).toMatch(/RESOURCE_UPLOAD_ALLOWED_ROLES/);
    expect(block.slice(0, 400)).not.toMatch(/hr\.resources\.view/);
  });

  it("App route bypasses legacy ResourceManagement for the upload path", () => {
    expect(appSource).toMatch(/ResourceUploadCenter/);
    expect(appSource).not.toMatch(/import ResourceManagement/);
    expect(appSource).not.toMatch(/<ResourceManagement\s*\/>/);
  });

  it("legacy /resource-management redirects to canonical route", () => {
    expect(appSource).toMatch(
      /path="\/resource-management"[\s\S]{0,160}Navigate to="\/hr\/resource-management"/,
    );
  });

  it("Training Management Upload Resource CTAs point to canonical hash route", () => {
    const tmc = fs.readFileSync(
      path.resolve(__dirname, "../pages/hr/TrainingManagementCenter.tsx"),
      "utf8",
    );
    expect(tmc).toMatch(/navigate\("\/hr\/resource-management#bulk-upload"\)/);
    expect(tmc).not.toMatch(/href="#"/);
  });

  it("Resource Upload Center page anchors #bulk-upload", () => {
    const rm = fs.readFileSync(
      path.resolve(__dirname, "../pages/hr/ResourceUploadCenter.tsx"),
      "utf8",
    );
    expect(rm).toMatch(/id="bulk-upload"/);
    expect(rm).toMatch(/Resource Upload Center/);
    expect(rm).not.toMatch(/href="#"/);
  });
});