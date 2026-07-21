import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock excel parser & inspector before importing the loader
vi.mock("@/lib/os/dashboardEngine/excelParser", () => ({
  parseAnyFile: vi.fn(),
}));
vi.mock("@/lib/os/reportEngine/inspector", () => ({
  inspectFile: vi.fn(),
}));
vi.mock("@/lib/os/sharedReportDatasets", () => ({
  getActiveSharedReportDataset: vi.fn(),
  downloadSharedReportDatasetFile: vi.fn(),
}));

import { loadSharedDataset } from "@/lib/os/reporting/sharedDatasetLoader";
import {
  getActiveSharedReportDataset,
  downloadSharedReportDatasetFile,
} from "@/lib/os/sharedReportDatasets";
import { parseAnyFile } from "@/lib/os/dashboardEngine/excelParser";
import { inspectFile } from "@/lib/os/reportEngine/inspector";

const mFetch = getActiveSharedReportDataset as unknown as ReturnType<typeof vi.fn>;
const mDownload = downloadSharedReportDatasetFile as unknown as ReturnType<typeof vi.fn>;
const mParse = parseAnyFile as unknown as ReturnType<typeof vi.fn>;
const mInspect = inspectFile as unknown as ReturnType<typeof vi.fn>;

function fakeDataset(overrides: Record<string, unknown> = {}) {
  return {
    id: "d1",
    key: "authorization",
    fileName: "auths.xlsx",
    filePath: "auth/auths.xlsx",
    fileSize: 12_345,
    uploadedAt: new Date().toISOString(),
    uploadedBy: "admin",
    ...overrides,
  };
}

describe("loadSharedDataset — three report engines", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns MISSING when no active dataset exists (no demo fallback)", async () => {
    mFetch.mockResolvedValue(null);
    const res = await loadSharedDataset("authorization", {
      requiredFields: ["client_name"],
    });
    expect(res.status).toBe("missing");
    expect(res.parsed).toBeNull();
    expect(mDownload).not.toHaveBeenCalled();
  });

  it("returns ERROR when the shared-source lookup throws", async () => {
    mFetch.mockRejectedValue(new Error("network down"));
    const res = await loadSharedDataset("cancellation-scheduling", {
      requiredFields: ["client_name"],
    });
    expect(res.status).toBe("error");
    expect(res.errorMessage).toMatch(/network down/);
  });

  it("returns INVALID when required canonical fields are absent", async () => {
    mFetch.mockResolvedValue(fakeDataset());
    mDownload.mockResolvedValue(new File(["x"], "auths.xlsx"));
    mParse.mockResolvedValue([{ headers: ["Foo"], rows: [{ Foo: "bar" }], rowCount: 1 }]);
    mInspect.mockReturnValue({ detected: {}, headers: ["Foo"] });
    const res = await loadSharedDataset("authorization", {
      requiredFields: ["client_name", "authorization_number"],
    });
    expect(res.status).toBe("invalid");
    expect(res.missingFields).toEqual(["client_name", "authorization_number"]);
  });

  it("returns READY with dataset + parsed rows when validation passes", async () => {
    mFetch.mockResolvedValue(fakeDataset());
    mDownload.mockResolvedValue(new File(["x"], "auths.xlsx"));
    mParse.mockResolvedValue([
      { headers: ["ClientName"], rows: [{ ClientName: "A" }], rowCount: 1 },
    ]);
    mInspect.mockReturnValue({ detected: { client_name: "ClientName" }, headers: ["ClientName"] });
    const res = await loadSharedDataset("authorization", {
      requiredFields: ["client_name"],
    });
    expect(res.status).toBe("ready");
    expect(res.parsed?.rowCount).toBe(1);
    expect(res.dataset?.fileName).toBe("auths.xlsx");
  });

  it("flags stale=true when the dataset was uploaded > staleAfterDays ago", async () => {
    const old = new Date(Date.now() - 45 * 86_400_000).toISOString();
    mFetch.mockResolvedValue(fakeDataset({ uploadedAt: old }));
    mDownload.mockResolvedValue(new File(["x"], "auths.xlsx"));
    mParse.mockResolvedValue([
      { headers: ["ClientName"], rows: [{ ClientName: "A" }], rowCount: 1 },
    ]);
    mInspect.mockReturnValue({ detected: { client_name: "ClientName" } });
    const res = await loadSharedDataset("authorization", {
      requiredFields: ["client_name"],
      staleAfterDays: 30,
    });
    expect(res.status).toBe("ready");
    expect(res.stale).toBe(true);
    expect(res.ageDays).toBeGreaterThanOrEqual(45);
  });

  it("probeOnly skips download/parse", async () => {
    mFetch.mockResolvedValue(fakeDataset());
    const res = await loadSharedDataset("cancellation-billing", { probeOnly: true });
    expect(res.status).toBe("ready");
    expect(mDownload).not.toHaveBeenCalled();
    expect(mParse).not.toHaveBeenCalled();
  });
});