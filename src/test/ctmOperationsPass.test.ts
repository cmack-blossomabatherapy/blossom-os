import { describe, it, expect } from "vitest";
import fs from "node:fs";

const read = (p: string) => fs.readFileSync(p, "utf8");

describe("CTM end-to-end operations pass", () => {
  it("ctm-test-connection edge function exists and is read-only", () => {
    const src = read("supabase/functions/ctm-test-connection/index.ts");
    // Requires authenticated caller.
    expect(src).toMatch(/Bearer /);
    expect(src).toMatch(/getClaims/);
    // Safe read-only endpoint only.
    expect(src).toMatch(/api\/v1\/accounts\/.+\.json/);
    expect(src).toMatch(/method: "GET"/);
    // Reports connected / degraded / disconnected verdicts.
    expect(src).toMatch(/"connected"/);
    expect(src).toMatch(/"degraded"/);
    expect(src).toMatch(/"disconnected"/);
    // Never leaks secret values in response.
    expect(src).not.toMatch(/CTM_API_KEY\s*[:,]\s*CTM_KEY/);
    expect(src).not.toMatch(/CTM_API_SECRET\s*[:,]\s*CTM_SECRET/);
  });

  it("ctm-webhook enforces token auth and idempotent upsert", () => {
    const src = read("supabase/functions/ctm-webhook/index.ts");
    expect(src).toMatch(/CTM_WEBHOOK_TOKEN/);
    expect(src).toMatch(/status: 401/);
    // Idempotency: upsert on the CTM call id — replaying the same event
    // never duplicates rows.
    expect(src).toMatch(/upsert\([\s\S]*onConflict: "ctm_call_id"/);
    // INGEST_ONLY: no outbound intake writes.
    expect(src).toMatch(/INGEST_ONLY/);
    expect(src).not.toMatch(/from\("intake_communications"\)/);
    expect(src).not.toMatch(/from\("intake_tasks"\)/);
  });

  it("ctm-sync stays read-only against CTM and is resumable", () => {
    const src = read("supabase/functions/ctm-sync/index.ts");
    // Never POSTs / PATCHes / DELETEs to CTM.
    expect(src).not.toMatch(/method:\s*"POST"[\s\S]{0,200}calltrackingmetrics/);
    expect(src).not.toMatch(/method:\s*"PATCH"/);
    expect(src).not.toMatch(/method:\s*"DELETE"/);
    // Pagination + hard cap.
    expect(src).toMatch(/per_page/);
    expect(src).toMatch(/next_page|nextPage/);
    expect(src).toMatch(/PAGE_BUDGET/);
    // Checkpoints via ctm_sync_runs.
    expect(src).toMatch(/from\("ctm_sync_runs"\)[\s\S]{0,200}insert/);
    expect(src).toMatch(/partial_checkpoint/);
    expect(src).toMatch(/integration_connections/);
    expect(src).toMatch(/duplicates/);
    expect(src).toMatch(/detail/);
    expect(src).toMatch(/extractCtmCallsPage/);
  });

  it("Admin CTM operations panel exposes live health without secret values", () => {
    const src = read("src/components/admin/CtmOperationsPanel.tsx");
    expect(src).toMatch(/ctm-test-connection/);
    expect(src).toMatch(/Test connection/);
    expect(src).toMatch(/Ingestion lag/);
    expect(src).toMatch(/Recent sync errors/);
    expect(src).toMatch(/unmapped tracking numbers/i);
    expect(src).toMatch(/INGEST_ONLY/);
    expect(src).toMatch(/refreshKey/);
  });

  it("CTMAdmin page mounts the operations panel", () => {
    const src = read("src/pages/admin/CTMAdmin.tsx");
    expect(src).toMatch(/CtmOperationsPanel/);
  });

  it("ctm-historical-import always returns a visible job outcome", () => {
    const src = read("supabase/functions/ctm-historical-import/index.ts");
    expect(src).toMatch(/RUN_BUDGET_MS/);
    expect(src).toMatch(/extractCtmCallsPage/);
    expect(src).toMatch(/safeMessage/);
    expect(src).toMatch(/normalizedTotal/);
    expect(src).toMatch(/invalidTotal/);
    expect(src).toMatch(/truncated_by_budget/);
    expect(src).toMatch(/checkpoint/);
    expect(src).toMatch(/failed_to_finalize_import_job/);
    expect(src).toMatch(/job_id: created\.id/);
    expect(src).toMatch(/job: fallback \?\? null/);
    expect(src).not.toMatch(/ctm_call_events"\)[\s\S]{0,120}upsert[\s\S]{0,120}else if \(job\.dry_run\)/);
  });

  it("historical import dialog renders dry-run metrics and keeps successful zero-call previews confirmable", () => {
    const src = read("src/components/admin/CtmHistoricalImportDialog.tsx");
    expect(src).toMatch(/Import function returned no job result/);
    expect(src).toMatch(/Dry-run summary/);
    expect(src).toMatch(/Normalized:/);
    expect(src).toMatch(/Invalid:/);
    expect(src).toMatch(/Checkpoint:/);
    expect(src).toMatch(/truncated_by_budget/);
    expect(src).toMatch(/No calls in this window/);
    expect(src).toMatch(/preview\.status !== "failed"/);
    expect(src).toMatch(/!preview\.summary\?\.error/);
  });
});