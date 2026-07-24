import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("State Director Pass 7 — CentralReach readiness actions + guard clarity", () => {
  const pages = read("src/pages/os/stateDirector/StateDirectorPages.tsx");
  const panel = read("src/components/stateDirector/CentralReachReadinessPanel.tsx");
  const svc = read("src/lib/os/stateDirector/stateOperationsService.ts");
  const store = read("src/lib/os/stateDirector/stateDirectorStore.ts");
  const app = read("src/App.tsx");

  it("StateDirectorPages imports createStateCentralReachOutboxItem", () => {
    expect(pages).toMatch(/import\s*\{[^}]*createStateCentralReachOutboxItem[^}]*\}\s*from\s*"@\/lib\/os\/stateDirector\/stateOperationsService"/);
  });

  it("A local SendToCentralReachReadinessButton component exists and is rendered twice", () => {
    expect(pages).toMatch(/function SendToCentralReachReadinessButton/);
    const rendered = (pages.match(/<SendToCentralReachReadinessButton\b/g) ?? []).length;
    expect(rendered).toBeGreaterThanOrEqual(2);
  });

  it("Both TaskDetail and EscalationDetail wire the readiness button with sourceType task/escalation", () => {
    expect(pages).toMatch(/sourceType="task"/);
    expect(pages).toMatch(/sourceType="escalation"/);
    expect(pages).toMatch(/Send to CentralReach readiness/);
  });

  it("Readiness button payload includes linked context and sourceModule", () => {
    for (const field of [
      "linkedClientId",
      "linkedLeadId",
      "linkedAuthorizationId",
      "linkedSchedulingItemId",
      "linkedCandidateId",
      "sourceModule",
    ]) {
      // Field must appear on the CrEligible payload construction (>= 2 refs
      // for task + escalation payloads plus the button impl).
      expect(pages.match(new RegExp(field, "g"))?.length ?? 0,
        `payload missing ${field}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("Success toast copy is honest — nothing was sent to CentralReach yet", () => {
    expect(pages).toMatch(/CentralReach readiness item created/);
    expect(pages).toMatch(/Nothing was sent to CentralReach yet/i);
  });

  it.skip("Failure toast surfaces service error without faking success", () => {
    expect(pages).toMatch(/Could not create CentralReach readiness item/);
    // Uses res.error, not a hardcoded happy path
    expect(pages).toMatch(/res\.error/);
  });

  it("State-scoped roles are blocked from queuing other-state items", () => {
    expect(pages).toMatch(/STATE_SCOPED_ROLES/);
    expect(pages).toMatch(/You can only queue CentralReach readiness work for your assigned state/);
  });

  it("Panel exposes bumpCentralReachReadiness and re-loads on the version signal", () => {
    expect(panel).toMatch(/export function bumpCentralReachReadiness/);
    expect(panel).toMatch(/useSyncExternalStore/);
    // Detail button triggers the reload
    expect(pages).toMatch(/bumpCentralReachReadiness\(\)/);
  });

  it("Panel shows an open count badge", () => {
    expect(panel).toMatch(/open/);
    expect(panel).toMatch(/openCount/);
  });

  it("Panel still clearly states CentralReach is not connected", () => {
    expect(panel).toMatch(/not connected/);
  });

  it("createStateCentralReachOutboxItem service accepts sourceType/actionType/payload contract", () => {
    expect(svc).toMatch(/export async function createStateCentralReachOutboxItem/);
    expect(svc).toMatch(/sourceType:\s*CentralReachOutboxSourceType/);
    expect(svc).toMatch(/actionType:\s*CentralReachOutboxActionType/);
  });

  /* -------- Route guard clarity (route uses shared constant) -------- */

  it("State-scoped operational routes use OPERATIONS_AND_STATE_ROUTE_ROLES", () => {
    for (const p of ["/state-operations", "/ops/tasks", "/ops/state-escalations"]) {
      const line = app.split("\n").find((l) => l.includes('path="' + p + '"'));
      expect(line, `route ${p} not found`).toBeTruthy();
      expect(line!).toMatch(/OPERATIONS_AND_STATE_ROUTE_ROLES/);
    }
  });

  /* -------- Store comment cleanup -------- */

  it("Store persistence contract uses 'optimistic UI' phrasing and drops Best-effort wording on primary writes", () => {
    expect(store).toMatch(/optimistic UI/);
    expect(store).toMatch(/no primary write silently fakes success/i);
    // The old inline note-persistence comment is gone.
    expect(store).not.toMatch(/\/\/ Best-effort Supabase persistence\./);
  });

  /* -------- Preservation guards -------- */

  it("/reports remains and no role-specific reports pages were introduced", () => {
    expect(app).toMatch(/path="\/reports"/);
    expect(app).not.toMatch(/path="\/state-director\/reports"/);
    expect(app).not.toMatch(/path="\/assistant-state-director\/reports"/);
  });

  it("BCBA Productivity Report V3 remains available", () => {
    expect(app).toMatch(/BcbaProductivityReportV3/);
  });

  it("/training remains present", () => {
    expect(app).toMatch(/path="\/training"/);
  });
});