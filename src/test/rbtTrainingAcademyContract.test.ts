import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  classifyDevelopingScore,
  validateBands,
  deriveCheckinStatus,
  resolveAliasKey,
  OWNERSHIP_SOURCE,
  type DevelopingBand,
  type RetentionCheckin,
} from "@/lib/os/academy/rbtTrainingAcademy";

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");
const migrationsDir = join(root, "supabase/migrations");
const allMigrations = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => readFileSync(join(migrationsDir, f), "utf8"))
  .join("\n---\n");

const BANDS: DevelopingBand[] = [
  { min: 0, max: 36, action: "repeat_lead_session" },
  { min: 37, max: 47, action: "staff_case_lead_first_session" },
  { min: 48, max: 60, action: "staff_case_bcba_first_session" },
];

describe("Academy contract — canonical curricula and thresholds", () => {
  it("classifies every threshold edge for the three developing bands", () => {
    expect(classifyDevelopingScore(0, BANDS)?.action).toBe("repeat_lead_session");
    expect(classifyDevelopingScore(36, BANDS)?.action).toBe("repeat_lead_session");
    expect(classifyDevelopingScore(37, BANDS)?.action).toBe("staff_case_lead_first_session");
    expect(classifyDevelopingScore(47, BANDS)?.action).toBe("staff_case_lead_first_session");
    expect(classifyDevelopingScore(48, BANDS)?.action).toBe("staff_case_bcba_first_session");
    expect(classifyDevelopingScore(60, BANDS)?.action).toBe("staff_case_bcba_first_session");
    expect(classifyDevelopingScore(-1, BANDS)).toBeNull();
    expect(classifyDevelopingScore(61, BANDS)).toBeNull();
  });

  it("rejects overlapping and gapped bands", () => {
    expect(validateBands(BANDS).ok).toBe(true);
    expect(validateBands([
      { min: 0, max: 36, action: "repeat_lead_session" },
      { min: 36, max: 60, action: "staff_case_bcba_first_session" },
    ]).ok).toBe(false);
    expect(validateBands([
      { min: 0, max: 36, action: "repeat_lead_session" },
      { min: 40, max: 60, action: "staff_case_bcba_first_session" },
    ]).ok).toBe(false);
  });

  it("seeds the three canonical curricula in migrations", () => {
    expect(allMigrations).toMatch(/new_rbt/i);
    expect(allMigrations).toMatch(/under_2_years|developing_rbt|developing/i);
    expect(allMigrations).toMatch(/experienced_rbt|experienced/i);
  });

  it("resolves alias pathways to canonical key (no shadow progress)", () => {
    const all = [
      { key: "under_2_years", metadata: {} },
      { key: "certified_no_experience", metadata: { alias_of_key: "under_2_years" } },
    ];
    expect(resolveAliasKey("certified_no_experience", all)).toBe("under_2_years");
    expect(resolveAliasKey("under_2_years", all)).toBe("under_2_years");
    expect(resolveAliasKey("unknown", all)).toBe("unknown");
  });
});

describe("Academy contract — retention check-ins", () => {
  const base = { status: "due" as const, due_at: "2026-01-15T00:00:00Z" };

  it("derives due/overdue based on due_at without a DB write", () => {
    expect(deriveCheckinStatus(
      { ...base, completed_at: null } as Pick<RetentionCheckin, "status" | "due_at" | "completed_at">,
      new Date("2026-01-14T00:00:00Z"),
    )).toBe("due");
    expect(deriveCheckinStatus(
      { ...base, completed_at: null } as Pick<RetentionCheckin, "status" | "due_at" | "completed_at">,
      new Date("2026-01-16T00:00:00Z"),
    )).toBe("overdue");
  });

  it("preserves completed, escalated and cancelled terminal states", () => {
    expect(deriveCheckinStatus({ status: "completed", due_at: base.due_at, completed_at: "2026-01-20T00:00:00Z" }, new Date("2027-01-01T00:00:00Z"))).toBe("completed");
    expect(deriveCheckinStatus({ status: "escalated", due_at: base.due_at, completed_at: null }, new Date("2027-01-01T00:00:00Z"))).toBe("escalated");
    expect(deriveCheckinStatus({ status: "cancelled", due_at: base.due_at, completed_at: null }, new Date("2027-01-01T00:00:00Z"))).toBe("cancelled");
  });

  it("has an overdue notification job that dedupes and scopes recipients", () => {
    expect(allMigrations).toMatch(/CREATE OR REPLACE FUNCTION public\.rbt_mark_retention_overdue/);
    expect(allMigrations).toMatch(/rbt_retention_overdue:/);
    expect(allMigrations).toMatch(/COALESCE\(u\.owner_user_id,\s*ta\.trainer_user_id\)/);
    expect(allMigrations).toMatch(/ON CONFLICT \(user_id, dedupe_key\)[^;]*DO NOTHING/);
  });

  it("has a support-needed notification trigger scoped to active trainers only", () => {
    expect(allMigrations).toMatch(/CREATE OR REPLACE FUNCTION public\.rbt_notify_support_needed/);
    expect(allMigrations).toMatch(/rbt_support_needed:/);
    expect(allMigrations).toMatch(/FROM public\.rbt_trainee_assignments[\s\S]{0,160}WHERE trainee_user_id = NEW\.employee_id AND active/);
  });
});

describe("Academy contract — RLS boundaries and SECURITY DEFINER helpers", () => {
  it("defines rbt_is_assigned_trainer for lead_rbt/floater_lead_rbt only", () => {
    expect(allMigrations).toMatch(/rbt_is_assigned_trainer[\s\S]{0,400}trainer_kind IN\s*\(\s*'lead_rbt'\s*,\s*'floater_lead_rbt'\s*\)/);
  });

  it("defines rbt_is_assigned_bcba scoped to assigned_bcba", () => {
    expect(allMigrations).toMatch(/rbt_is_assigned_bcba[\s\S]{0,400}trainer_kind = 'assigned_bcba'/);
  });

  it("progress policies allow self, assigned trainer/BCBA, admin/HR and nothing else", () => {
    expect(allMigrations).toMatch(/CREATE POLICY "rbt_progress_read"[\s\S]{0,700}employee_id = auth\.uid\(\)/);
    expect(allMigrations).toMatch(/rbt_is_assigned_trainer\(auth\.uid\(\), employee_id\)/);
    expect(allMigrations).toMatch(/rbt_is_assigned_bcba\(auth\.uid\(\), employee_id\)/);
    const progressPolicies = allMigrations.match(/CREATE POLICY "rbt_progress_(read|insert|update)"[\s\S]{0,900}?;/g);
    expect(progressPolicies && progressPolicies.length).toBeGreaterThanOrEqual(3);
    for (const p of progressPolicies ?? []) expect(p).not.toMatch(/USING\s*\(\s*true\s*\)/);
  });

  it("retention writes are trainer/BCBA/admin only — trainees cannot self-complete", () => {
    expect(allMigrations).toMatch(/CREATE POLICY "retention_read"[\s\S]{0,700}trainee_user_id = auth\.uid\(\)/);
    const writePolicies = allMigrations.match(/CREATE POLICY "retention_trainer_(write|update)"[\s\S]{0,1100}?;/g);
    expect(writePolicies && writePolicies.length).toBe(2);
    for (const p of writePolicies ?? []) {
      expect(p).not.toMatch(/trainee_user_id\s*=\s*auth\.uid\(\)/);
    }
  });

  it("enforces BCBA signoff by role via trigger", () => {
    expect(allMigrations).toMatch(/rbt_check_progress_signoff/);
    expect(allMigrations).toMatch(/signoff_role = 'bcba'/);
    expect(allMigrations).toMatch(/has_role\(NEW\.signoff_by,\s*'bcba'::app_role\)/);
    expect(allMigrations).toMatch(/RAISE EXCEPTION 'signoff_role=bcba requires/);
  });

  it("Fellowship readiness helper is SECURITY DEFINER and grant-locked", () => {
    expect(allMigrations).toMatch(/FUNCTION public\.rbt_academy_ready_for_fellowship[\s\S]{0,600}SECURITY DEFINER/);
    expect(allMigrations).toMatch(/REVOKE ALL ON FUNCTION public\.rbt_academy_ready_for_fellowship\(uuid\) FROM PUBLIC/);
    expect(allMigrations).toMatch(/GRANT EXECUTE ON FUNCTION public\.rbt_academy_ready_for_fellowship\(uuid\) TO authenticated/);
  });
});

describe("Academy contract — ownership authority (no shared-client inference)", () => {
  it("adapter names rbt_trainee_assignments as the sole ownership source", () => {
    expect(OWNERSHIP_SOURCE).toBe("rbt_trainee_assignments");
  });

  it("adapter never queries CentralReach / billing tables to infer ownership", () => {
    const src = read("src/lib/os/academy/rbtTrainingAcademy.ts");
    expect(src).not.toMatch(/bcba_billable_sessions/);
    expect(src).not.toMatch(/bcba_productivity/);
    expect(src).not.toMatch(/v_cr_canonical_sessions/);
    expect(src).not.toMatch(/rbt_client_assignments/);
  });

  it("assignment helper functions do not read shared-client tables", () => {
    const helperMig = allMigrations.match(/CREATE OR REPLACE FUNCTION public\.rbt_is_assigned_(?:trainer|bcba)[\s\S]{0,500}?\$\$/g);
    for (const h of helperMig ?? []) {
      expect(h).not.toMatch(/bcba_billable_sessions|v_cr_canonical_sessions|rbt_client_assignments/);
    }
  });
});

describe("Academy contract — canonical progress authority", () => {
  it("RbtProgram consumes only rbt_pathway_progress via useProgram", () => {
    const src = read("src/pages/rbt/app/training/RbtProgram.tsx");
    expect(src).toMatch(/useProgram/);
    expect(src).toMatch(/rbt_pathway_progress/);
    expect(src).not.toMatch(/localStorage\.setItem\([^)]*progress/);
  });

  it("BcbaMyTraineesPage updates progress against rbt_pathway_progress", () => {
    const src = read("src/pages/bcba/trainees/BcbaMyTraineesPage.tsx");
    expect(src).toMatch(/rbt_pathway_progress/);
    expect(src).toMatch(/loadTraineeAssignmentsFor/);
  });
});

describe("Academy contract — routes and page wiring", () => {
  const appSrc = read("src/App.tsx");

  it("Training Admin route is admin/HR/training-admin gated", () => {
    const route = appSrc.match(/path="\/training\/academy-admin"[\s\S]{0,400}TrainingAcademyAdminPage/);
    expect(route).toBeTruthy();
    const seg = route![0];
    expect(seg).toMatch(/PermissionRoute/);
    expect(seg).toMatch(/"admin"/);
    expect(seg).toMatch(/"super_admin"/);
    expect(seg).toMatch(/"training_admin"/);
    expect(seg).not.toMatch(/"rbt"/);
    expect(seg).not.toMatch(/"registered_behavior_technician"/);
  });

  it("BCBA trainees, RBT fellowship explorer, and legacy redirects exist", () => {
    expect(appSrc).toMatch(/path="\/bcba\/trainees"/);
    expect(appSrc).toMatch(/growth\/fellowship/);
    expect(appSrc).toMatch(/path="\/training\/rbt-academy"[\s\S]{0,160}Navigate to="\/training\/academy-admin"/);
  });

  it("Training Admin page has real save handlers for owners, thresholds and assignments", () => {
    const src = read("src/pages/os/TrainingAcademyAdminPage.tsx");
    expect(src).toMatch(/upsertOwnerAssignment\(/);
    expect(src).toMatch(/upsertTrainingConfig\("developing_rbt_bands"/);
    expect(src).toMatch(/upsertTraineeAssignment\(/);
    expect(src).toMatch(/toast\.success/);
    expect(src).toMatch(/toast\.error/);
  });

  it("Fellowship Explorer gates the interest form via isReadyForFellowship + disclaimer + preview read-only", () => {
    const src = read("src/pages/rbt/app/growth/RbtFellowshipExplorer.tsx");
    expect(src).toMatch(/isReadyForFellowship/);
    expect(src).toMatch(/guarantee of acceptance/i);
    expect(src).toMatch(/ready === false/);
    expect(src).toMatch(/isPreviewing/);
    expect(src).toMatch(/Read-only in preview/);
  });

  it("Retention support panel is read-only and uses the canonical loader", () => {
    const src = read("src/pages/rbt/app/support/RetentionSupportPanel.tsx");
    expect(src).toMatch(/loadRetentionCheckinsFor\(authUserId,\s*"trainee"\)/);
    expect(src).not.toMatch(/completeRetentionCheckin|createRetentionCheckin|\.upsert\(|\.insert\(|\.update\(|\.delete\(/);
  });

  it("SupportHome renders the RetentionSupportPanel", () => {
    const supportHome = "src/pages/rbt/app/support/SupportHome.tsx";
    if (existsSync(join(root, supportHome))) {
      const src = read(supportHome);
      expect(src).toMatch(/RetentionSupportPanel/);
    }
  });
});

describe("Academy contract — CentralReach identity", () => {
  it("adapter never joins on CentralReach IDs to derive ownership", () => {
    const src = read("src/lib/os/academy/rbtTrainingAcademy.ts");
    expect(src).not.toMatch(/centralreach_id|centralreach_provider_id|cr_provider_id/i);
  });

  it("RbtProgram exposes identity-aware writable guard for mapped vs unmapped", () => {
    const rbt = read("src/pages/rbt/app/training/RbtProgram.tsx");
    expect(rbt).toMatch(/writableEmployeeId/);
    expect(rbt).toMatch(/isPreviewing/);
    expect(rbt).toMatch(/canWrite/);
  });
});

describe("Academy contract — owner diagnostics", () => {
  it("Training Admin page renders owner assignments", () => {
    const src = read("src/pages/os/TrainingAcademyAdminPage.tsx");
    expect(src).toMatch(/loadOwnerAssignments|owner_key/);
  });
});
