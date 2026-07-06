import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("RBT Pass 5 - resource/readiness/competency Supabase-backed", () => {
  it("OSRBTResources.tsx uses the shared RBT catalog and no longer defines a static RESOURCES array", () => {
    const src = read("src/pages/os/OSRBTResources.tsx");
    expect(src).toMatch(/import\s*\{\s*OSShell\s*\}\s*from\s*"\.\/OSShell"/);
    expect(src).toMatch(/<OSShell>/);
    expect(src).toMatch(/useRBTResources/);
    expect(src).toMatch(/RBT_RESOURCE_CATEGORIES/);
    expect(src).toMatch(/useResourcePrefs/);
    expect(src).toMatch(/toggleBookmark/);
    expect(src).toMatch(/toggleComplete/);
    expect(src).toMatch(/markViewed/);
    // No large in-file static resource array (previous pass had 60+ entries).
    expect(src).not.toMatch(/const\s+RESOURCES\s*:\s*Resource\[]\s*=/);
    expect(src).not.toMatch(/const\s+SECTIONS\s*:\s*\{\s*id:\s*SectionId/);
  });

  it("rbtResources.ts uses Supabase as the source of truth for the catalog", () => {
    const src = read("src/lib/training/rbtResources.ts");
    expect(src).toMatch(/from\s+"@\/integrations\/supabase\/client"/);
    expect(src).toMatch(/\.from\("rbt_resources"\)/);
    // Reads
    expect(src).toMatch(/hydrateRBTResourcesFromSupabase/);
    // Writes
    expect(src).toMatch(/async function seedStarterIfEmpty/);
    expect(src).toMatch(/\.insert\(resourceToRow/);
    expect(src).toMatch(/\.update\(patchRow/);
    expect(src).toMatch(/\.delete\(\)/);
    // Old localStorage-only StoredShape store must be gone.
    expect(src).not.toMatch(/type\s+StoredShape\s*=\s*\{[\s\S]*hiddenSeedIds:\s*string\[]/);
  });

  it("OSRBTAcademyAdmin.tsx uses the real readiness hook and no longer imports useTrainees", () => {
    const src = read("src/pages/os/OSRBTAcademyAdmin.tsx");
    expect(src).toMatch(/useReadinessTrainees/);
    expect(src).not.toMatch(/\buseTrainees\b/);
    // Async mutation wiring
    expect(src).toMatch(/assignPathRow/);
    expect(src).toMatch(/recordSignoffRow/);
    expect(src).toMatch(/markBlockedRow/);
    expect(src).toMatch(/setNeedsCoachingRow/);
    expect(src).toMatch(/updateAssignmentRow/);
    expect(src).toMatch(/addCoachingNoteRow/);
    // Empty setup + loading states
    expect(src).toMatch(/EmptySetupState/);
    expect(src).toMatch(/LoadingState/);
  });

  it("rbtReadiness.ts exposes Supabase-backed admin mutations targeting rbt_readiness_records", () => {
    const src = read("src/lib/training/rbtReadiness.ts");
    for (const fn of [
      "assignPathRow", "recordSignoffRow", "markBlockedRow",
      "setNeedsCoachingRow", "updateAssignmentRow", "addCoachingNoteRow",
    ]) {
      expect(src).toMatch(new RegExp(`export async function ${fn}`));
    }
    expect(src).toMatch(/\.from\("rbt_readiness_records"\)[\s\S]*\.update/);
  });

  it("rbtCompetency.ts reads/writes public.rbt_competency_records", () => {
    const src = read("src/lib/training/rbtCompetency.ts");
    expect(src).toMatch(/from\s+"@\/integrations\/supabase\/client"/);
    expect(src).toMatch(/\.from\("rbt_competency_records"\)/);
    expect(src).toMatch(/hydrateCompetencyFromSupabase/);
    expect(src).toMatch(/persistCompetencyRecord/);
    expect(src).toMatch(/\.upsert\(recordToRow/);
    // Storage docstring reflects Supabase source of truth.
    expect(src).toMatch(/source of truth is public\.rbt_competency_records/);
  });

  it("migration creates rbt_resources and rbt_competency_records with role-scoped RLS + CentralReach fields", () => {
    const dir = "supabase/migrations";
    const combined = fs.readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => fs.readFileSync(path.join(dir, f), "utf8"))
      .join("\n");
    expect(combined).toMatch(/CREATE TABLE IF NOT EXISTS public\.rbt_resources/);
    expect(combined).toMatch(/CREATE TABLE IF NOT EXISTS public\.rbt_competency_records/);
    expect(combined).toMatch(/GRANT SELECT, INSERT, UPDATE, DELETE ON public\.rbt_resources TO authenticated/);
    expect(combined).toMatch(/GRANT SELECT, INSERT, UPDATE, DELETE ON public\.rbt_competency_records TO authenticated/);
    expect(combined).toMatch(/ENABLE ROW LEVEL SECURITY[\s\S]*rbt_resources/);
    expect(combined).toMatch(/ENABLE ROW LEVEL SECURITY[\s\S]*rbt_competency_records/);
    // Role-scoped write policies, not blanket TO authenticated USING (true).
    expect(combined).toMatch(/rbt_resources_admin_(insert|update|delete)/);
    expect(combined).toMatch(/rbt_competency_write_own_or_admin/);
    // CentralReach integration contract fields
    expect(combined).toMatch(/centralreach_id\s+text/);
    expect(combined).toMatch(/source_system\s+text NOT NULL/);
    expect(combined).toMatch(/sync_status\s+text NOT NULL/);
  });

  it("preserves canonical /reports and /rbt/reports redirect from earlier passes", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/\/rbt\/reports[\s\S]{0,200}Navigate to=\"\/reports\?audience=rbt\"/);
    expect(app).not.toMatch(/element=\{<OSRBTReports/);
  });

  it("does not remove the BCBA Productivity Report or State Director training journey", () => {
    const catalog = read("src/lib/os/reportsCatalog.ts");
    expect(catalog).toMatch(/bcba-productivity/i);
    // State Director training journey files still present.
    expect(fs.existsSync("src/pages/os/stateDirector/StateDirectorPages.tsx")).toBe(true);
  });
});
