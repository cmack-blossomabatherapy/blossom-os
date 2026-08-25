/**
 * Performance regression fix: v_cr_timesheet_documentation filters
 * cr_timesheet_status by COALESCE(last_seen_batch_id, batch_id) = latest batch,
 * and report_timesheet_documentation_summary() aggregates that view. With no
 * index for that expression the authenticated UI hit statement_timeout.
 *
 * This proves the forward-only migration adds exactly one index targeting that
 * exact expression, and touches nothing else (no view/function/UI/data change).
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = "supabase/migrations";

// Find the newest migration file that defines this index.
const INDEX_NAME = "cr_timesheet_status_current_batch_idx";
const migrationFile = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .reverse()
  .map((f) => ({ f, content: readFileSync(join(MIGRATIONS_DIR, f), "utf8") }))
  .find(({ content }) =>
    content.includes(`CREATE INDEX IF NOT EXISTS ${INDEX_NAME}`),
  );

describe("cr_timesheet_status current-batch index migration", () => {
  it("exists in a migration file", () => {
    expect(migrationFile, "no migration defines the index").toBeDefined();
  });

  it("targets the exact COALESCE(last_seen_batch_id, batch_id) expression", () => {
    expect(migrationFile).toBeDefined();
    const { content } = migrationFile!;
    expect(content).toContain(
      "CREATE INDEX IF NOT EXISTS cr_timesheet_status_current_batch_idx",
    );
    expect(content).toContain("ON public.cr_timesheet_status");
    // Expression index on the exact expression the view filters by.
    expect(content).toMatch(
      /\(\s*COALESCE\s*\(\s*last_seen_batch_id\s*,\s*batch_id\s*\)\s*\)/i,
    );
  });

  it("uses IF NOT EXISTS (forward-only / idempotent)", () => {
    expect(migrationFile).toBeDefined();
    expect(migrationFile!.content).toMatch(
      /CREATE INDEX IF NOT EXISTS cr_timesheet_status_current_batch_idx/,
    );
  });

  it("does not change any view, function, trigger, policy or data rows", () => {
    expect(migrationFile).toBeDefined();
    const content = migrationFile!.content;
    for (const forbidden of [
      /\bCREATE\s+(OR\s+REPLACE\s+)?VIEW\b/i,
      /\bCREATE\s+(OR\s+REPLACE\s+)?FUNCTION\b/i,
      /\bCREATE\s+TRIGGER\b/i,
      /\bCREATE\s+POLICY\b/i,
      /\bDROP\b/i,
      /\bALTER\b/i,
      /\bINSERT\b/i,
      /\bUPDATE\b/i,
      /\bDELETE\b/i,
      /\bGRANT\b/i,
      /\bREVOKE\b/i,
    ]) {
      expect(content, `must not contain statement matching ${forbidden}`).not.toMatch(
        forbidden,
      );
    }
  });

  it("only creates a single index statement", () => {
    expect(migrationFile).toBeDefined();
    const statements = migrationFile!.content
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    expect(statements).toHaveLength(1);
    expect(statements[0]).toMatch(
      /^CREATE INDEX IF NOT EXISTS cr_timesheet_status_current_batch_idx/i,
    );
  });
});
