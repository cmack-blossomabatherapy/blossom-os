import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  selectActiveReportSnapshotDatasets,
  SAFE_REPORT_REFRESH_KEYS,
} from "@/lib/os/centralreachUploads/legacyReprocess";
import type { SharedReportDataset, SharedReportKey } from "@/lib/os/sharedReportDatasets";

function ds(over: Partial<SharedReportDataset> & { reportKey: SharedReportKey }): SharedReportDataset {
  return {
    id: over.id ?? `${over.reportKey}-${over.fileName ?? "f"}-${over.uploadedAt ?? "t"}`,
    reportKey: over.reportKey,
    storagePath: over.storagePath ?? `p/${over.fileName ?? "f"}`,
    fileName: over.fileName ?? "file.csv",
    fileSize: over.fileSize ?? 100,
    mimeType: "text/csv",
    notes: null,
    uploadedBy: null,
    uploadedAt: over.uploadedAt ?? "2026-08-24T10:00:00Z",
    isActive: over.isActive ?? true,
  };
}

const MIGRATION = readFileSync(
  "supabase/migrations/20260825140132_9b817069-ab86-426d-ba65-1c4ce2d78e0d.sql",
  "utf8",
);

describe("safe active-snapshot report refresh selection", () => {
  it("excludes cancellation-billing from the safe keys", () => {
    expect(SAFE_REPORT_REFRESH_KEYS).not.toContain("cancellation-billing");
    expect(SAFE_REPORT_REFRESH_KEYS).toEqual([
      "cancellation-scheduling",
      "authorization",
      "cancellation-authorization",
    ]);
  });

  it("never includes archived/inactive history", () => {
    const picked = selectActiveReportSnapshotDatasets({
      "cancellation-scheduling": [
        ds({ reportKey: "cancellation-scheduling", fileName: "old.csv", isActive: false, uploadedAt: "2026-08-24T12:00:00Z" }),
        ds({ reportKey: "cancellation-scheduling", fileName: "active.csv", uploadedAt: "2026-08-20T09:00:00Z" }),
      ],
    });
    expect(picked.map((d) => d.fileName)).toEqual(["active.csv"]);
  });

  it("ignores billing datasets even if passed in", () => {
    const picked = selectActiveReportSnapshotDatasets({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "cancellation-billing": [ds({ reportKey: "cancellation-billing", fileName: "billing.csv" })] as any,
      "cancellation-scheduling": [ds({ reportKey: "cancellation-scheduling", fileName: "sched.csv" })],
    });
    expect(picked.map((d) => d.fileName)).toEqual(["sched.csv"]);
  });

  it("collapses the same auth file appearing under both auth aliases", () => {
    const picked = selectActiveReportSnapshotDatasets({
      authorization: [ds({ reportKey: "authorization", fileName: "Auth 8-24.csv", fileSize: 4242 })],
      "cancellation-authorization": [
        ds({ reportKey: "cancellation-authorization", fileName: "auth 8-24.csv", fileSize: 4242 }),
      ],
    });
    expect(picked).toHaveLength(1);
  });

  it("keeps distinct auth files under both aliases", () => {
    const picked = selectActiveReportSnapshotDatasets({
      authorization: [ds({ reportKey: "authorization", fileName: "auth-a.csv", fileSize: 10, uploadedAt: "2026-08-24T08:00:00Z" })],
      "cancellation-authorization": [
        ds({ reportKey: "cancellation-authorization", fileName: "auth-b.csv", fileSize: 11, uploadedAt: "2026-08-24T09:00:00Z" }),
      ],
    });
    expect(picked.map((d) => d.fileName)).toEqual(["auth-a.csv", "auth-b.csv"]);
  });

  it("selects the newest active file per key and returns oldest → newest", () => {
    const picked = selectActiveReportSnapshotDatasets({
      "cancellation-scheduling": [
        ds({ reportKey: "cancellation-scheduling", fileName: "sched-new.csv", uploadedAt: "2026-08-24T18:00:00Z" }),
        ds({ reportKey: "cancellation-scheduling", fileName: "sched-old.csv", uploadedAt: "2026-08-01T18:00:00Z" }),
      ],
      authorization: [
        ds({ reportKey: "authorization", fileName: "auth-new.csv", fileSize: 9, uploadedAt: "2026-08-24T06:00:00Z" }),
        ds({ reportKey: "authorization", fileName: "auth-old.csv", fileSize: 8, uploadedAt: "2026-07-01T06:00:00Z" }),
      ],
    });
    expect(picked.map((d) => d.fileName)).toEqual(["auth-new.csv", "sched-new.csv"]);
  });

  it("at most one dataset per key", () => {
    const picked = selectActiveReportSnapshotDatasets({
      "cancellation-scheduling": [
        ds({ reportKey: "cancellation-scheduling", fileName: "a.csv", fileSize: 1 }),
        ds({ reportKey: "cancellation-scheduling", fileName: "b.csv", fileSize: 2 }),
        ds({ reportKey: "cancellation-scheduling", fileName: "c.csv", fileSize: 3 }),
      ],
    });
    expect(picked).toHaveLength(1);
  });
});

describe("system page calls only the safe refresh", () => {
  const ui = readFileSync("src/pages/os/system/CentralReachUploads.tsx", "utf8");

  it("uses refreshReportsFromExistingUploads", () => {
    expect(ui).toMatch(/refreshReportsFromExistingUploads\(\)/);
    expect(ui).not.toMatch(/reprocessLegacySharedDatasets/);
  });

  it("labels the action as refreshing Scheduling & Authorization from existing uploads", () => {
    expect(ui).toMatch(/Refresh Scheduling & Authorization reports from existing uploads/);
  });
});

describe("current snapshot view migration", () => {
  it("scopes both views to the latest successful active upsert_snapshot batch", () => {
    expect(MIGRATION).toMatch(/import_strategy = 'upsert_snapshot'/);
    expect(MIGRATION).toMatch(/'scheduling', 'schedule', 'schedule_events'/);
    expect(MIGRATION).toMatch(/'authorization', 'authorizations'/);
    expect(
      (MIGRATION.match(/COALESCE\((?:e|a)\.last_seen_batch_id, (?:e|a)\.batch_id\) = \(SELECT id FROM latest_batch\)/g) ?? [])
        .length,
    ).toBe(2);
  });

  it("falls back to all rows when no snapshot batch exists", () => {
    expect((MIGRATION.match(/NOT EXISTS \(SELECT 1 FROM latest_batch\)/g) ?? []).length).toBe(2);
  });

  it("keeps security_invoker and authenticated-only SELECT", () => {
    expect((MIGRATION.match(/security_invoker = on/g) ?? []).length).toBe(2);
    expect(MIGRATION).toMatch(/GRANT SELECT ON public\.v_cr_schedule_current TO authenticated/);
    expect(MIGRATION).toMatch(/GRANT SELECT ON public\.v_cr_authorization_current TO authenticated/);
    expect(MIGRATION).not.toMatch(/GRANT[^;]*TO (anon|PUBLIC)/);
  });

  it("does not touch claims or billing views", () => {
    expect(MIGRATION).not.toMatch(/v_cr_claims_status|v_cr_billing_documentation_status|cr_billing_sessions/);
  });
});
