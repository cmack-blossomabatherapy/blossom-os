import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import {
  needsLegacyNormalization, countNormalizedFactRows, summarizeLegacyReprocess,
  clearAutoNormalizeAttempted, AUTO_NORMALIZE_FLAG_KEY,
} from "@/lib/os/centralreachUploads/legacyNormalizationState";

const emptyCounts = {
  batches: 0, billing: 0, scheduling: 0, authorization: 0,
  utilization: 0, claims: 0, contacts: 0, rawRows: 0,
};

const fetchCrNormalizedCounts = vi.fn();
const listCrImportBatches = vi.fn();
const listSharedReportDatasets = vi.fn();
const reprocessLegacySharedDatasets = vi.fn();

vi.mock("@/lib/os/centralreachUploads/supabaseStore", () => ({
  fetchCrNormalizedCounts: () => fetchCrNormalizedCounts(),
  listCrImportBatches: (n?: number) => listCrImportBatches(n),
  rowHashToIdentity: (h: string) => h,
}));
vi.mock("@/lib/os/centralreachUploads/legacyReprocess", () => ({
  reprocessLegacySharedDatasets: () => reprocessLegacySharedDatasets(),
}));
vi.mock("@/lib/os/sharedReportDatasets", () => ({
  listSharedReportDatasets: (k: string) => listSharedReportDatasets(k),
  uploadSharedReportDataset: vi.fn(),
  deleteSharedReportDataset: vi.fn(),
}));
vi.mock("@/lib/os/bcbaProductivityV3/adminUploadStore", () => ({
  previewBcbaProductivityUpload: vi.fn(),
  appendBcbaProductivityUpload: vi.fn(),
  listBcbaProductivityUploadBatches: vi.fn(async () => []),
  getBcbaProductivityDatasetStatus: vi.fn(async () => ({ activeRowCount: 0, batchCount: 0, earliestServiceDate: null, latestServiceDate: null })),
  voidBcbaProductivityBatch: vi.fn(),
}));
vi.mock("@/hooks/useSystemTools", () => ({ runWithSystemToolAudit: vi.fn() }));
vi.mock("@/pages/os/OSShell", () => ({ OSShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import CentralReachUploads from "@/pages/os/system/CentralReachUploads";

function legacyDataset(id: string) {
  return {
    id, reportKey: "cancellation-scheduling", storagePath: `p/${id}`, fileName: `${id}.csv`,
    fileSize: 10, mimeType: "text/csv", notes: null, uploadedBy: null,
    uploadedAt: new Date().toISOString(), isActive: true,
  };
}

function outcome(over: Partial<Record<string, unknown>> = {}) {
  return {
    fileName: "legacy.csv", exportType: "scheduling", table: "cr_schedule_events",
    batchId: "b1", parsedRowCount: 10, appendedRowCount: 8, duplicateRowCount: 2,
    warnings: [], errors: [], ok: true, ...over,
  } as never;
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CentralReachUploads />
    </MemoryRouter>,
  );
}

describe("legacy normalization detection helpers", () => {
  it("counts only fact rows", () => {
    expect(countNormalizedFactRows({ ...emptyCounts, billing: 3, rawRows: 99 })).toBe(3);
  });
  it("flags trapped legacy data", () => {
    expect(needsLegacyNormalization({ counts: emptyCounts, legacyDatasetCount: 2 })).toBe(true);
    expect(needsLegacyNormalization({ counts: emptyCounts, legacyDatasetCount: 0 })).toBe(false);
    expect(needsLegacyNormalization({ counts: { ...emptyCounts, billing: 1 }, legacyDatasetCount: 2 })).toBe(false);
    expect(needsLegacyNormalization({ counts: null, legacyDatasetCount: 2 })).toBe(false);
  });
  it("summarizes results explicitly", () => {
    const report = summarizeLegacyReprocess({
      datasets: 2,
      outcomes: [outcome(), outcome({ fileName: "bad.csv", ok: false, errors: ["no rows"] })],
      errors: ["missing.csv: gone"],
    } as never);
    expect(report).toMatchObject({ filesProcessed: 2, parsedRowCount: 20, appendedRowCount: 16, duplicateRowCount: 4, ok: false });
    expect(report.issues).toContain("bad.csv: no rows");
    expect(report.issues).toContain("missing.csv: gone");
  });
});

describe("CentralReach uploads page legacy banner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    clearAutoNormalizeAttempted();
    fetchCrNormalizedCounts.mockResolvedValue({ ...emptyCounts });
    listCrImportBatches.mockResolvedValue([]);
    listSharedReportDatasets.mockImplementation(async (k: string) =>
      k === "cancellation-scheduling" ? [legacyDataset("legacy-1")] : []);
    reprocessLegacySharedDatasets.mockResolvedValue({ datasets: 1, outcomes: [outcome()], errors: [] });
  });
  afterEach(() => cleanup());

  it("shows the banner when normalized counts are zero and legacy records exist", async () => {
    renderPage();
    expect(await screen.findByTestId("legacy-normalization-banner")).toBeInTheDocument();
    expect(screen.getByText("Legacy uploads need normalization")).toBeInTheDocument();
  });

  it("hides the banner once normalized rows exist", async () => {
    fetchCrNormalizedCounts.mockResolvedValue({ ...emptyCounts, billing: 5, batches: 1 });
    renderPage();
    await waitFor(() => expect(fetchCrNormalizedCounts).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByTestId("legacy-normalization-banner")).toBeNull());
  });

  it("auto-starts reprocessing once and records a session flag", async () => {
    renderPage();
    await waitFor(() => expect(reprocessLegacySharedDatasets).toHaveBeenCalledTimes(1));
    expect(sessionStorage.getItem(AUTO_NORMALIZE_FLAG_KEY)).toBe("1");
    // counts refresh after reprocess
    await waitFor(() => expect(fetchCrNormalizedCounts.mock.calls.length).toBeGreaterThanOrEqual(2));
    // explicit results surface
    expect(await screen.findByTestId("legacy-normalization-result")).toBeInTheDocument();
  });

  it("does not re-fire auto reprocess after a reload in the same session", async () => {
    renderPage();
    await waitFor(() => expect(reprocessLegacySharedDatasets).toHaveBeenCalledTimes(1));
    cleanup();
    renderPage();
    await waitFor(() => expect(screen.getAllByTestId("legacy-normalization-banner").length).toBeGreaterThan(0));
    expect(reprocessLegacySharedDatasets).toHaveBeenCalledTimes(1);
  });

  it("clicking Normalize existing uploads reprocesses and refreshes counts", async () => {
    sessionStorage.setItem(AUTO_NORMALIZE_FLAG_KEY, "1");
    renderPage();
    const btn = await screen.findByTestId("normalize-existing-uploads");
    expect(reprocessLegacySharedDatasets).not.toHaveBeenCalled();
    const before = fetchCrNormalizedCounts.mock.calls.length;
    await userEvent.click(btn);
    await waitFor(() => expect(reprocessLegacySharedDatasets).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(fetchCrNormalizedCounts.mock.calls.length).toBeGreaterThan(before));
    expect(await screen.findByText("Rows appended")).toBeInTheDocument();
  });
});
