import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("State Director Functionality Pass 4", () => {
  it("PhoneSystemRoute allows state_director and excludes assistant_state_director (Pass 5 State Director correction)", () => {
    const src = read("src/components/auth/PhoneSystemRoute.tsx");
    const allowedMatch = src.match(/const\s+ALLOWED\s*=\s*new\s+Set<string>\(\[([\s\S]*?)\]\)/);
    expect(allowedMatch).toBeTruthy();
    const body = allowedMatch![1];
    expect(body).toMatch(/"state_director"/);
    expect(body).not.toMatch(/"assistant_state_director"/);
    expect(src).toMatch(/marketing/);
    expect(src).toMatch(/\bhr\b/);
  });

  it("IntakeAiCallsRoute guards /phone/ai-calls", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/IntakeAiCallsRoute/);
    expect(app).toMatch(/\/phone\/ai-calls.*IntakeAiCallsRoute/);
  });

  it("useStateDailyHealthNotes has no `as any` table casts", () => {
    const src = read("src/hooks/useStateDailyHealthNotes.ts");
    expect(src).not.toMatch(/as any/);
    expect(src).toMatch(/Database\["public"\]\["Tables"\]\["state_daily_health_notes"\]/);
  });

  it("deliverHandoff logs handoff activity with relatedType 'handoff'", () => {
    const src = read("src/lib/os/stateDirector/stateOperationsService.ts");
    expect(src).toMatch(/relatedType:\s*"handoff"/);
    expect(src).not.toMatch(/\(handoff as any\)\?\.id/);
    expect(src).toMatch(/handoffId/);
  });

  it("StateOperationsPage exposes a Department Handoff action", () => {
    const src = read("src/pages/os/stateDirector/StateDirectorPages.tsx");
    expect(src).toMatch(/Department Handoff/);
    expect(src).toMatch(/Send Handoff From Task/);
    expect(src).toMatch(/Send Handoff From Escalation/);
  });

  it("Department snapshot pages render State Director Snapshot banner", () => {
    const pages = [
      "src/pages/os/intake/IntakeDashboard.tsx",
      "src/pages/os/OSAuthWorkspace.tsx",
      "src/pages/os/OSStaffingWorkspace.tsx",
      "src/pages/os/OSSchedulingWorkspace.tsx",
      "src/pages/os/OSQATeam.tsx",
    ];
    for (const p of pages) {
      expect(read(p)).toMatch(/StateDirectorSnapshotBanner/);
    }
    const banner = read("src/components/stateDirector/StateDirectorSnapshotBanner.tsx");
    expect(banner).toMatch(/State Director Snapshot/);
  });

  it("State Ops KPI cards render an awaiting-sync label instead of seed fallback", () => {
    const src = read("src/pages/os/stateDirector/StateDirectorPages.tsx");
    expect(src).not.toMatch(/Seed fallback metrics/);
    expect(src).not.toMatch(/Source: Seed fallback/);
    expect(src).toMatch(/No live state metrics connected/);
    expect(src).toMatch(/Awaiting metrics sync/);
  });

  it("State Director store surfaces save failures via toast helper", () => {
    const src = read("src/lib/os/stateDirector/stateDirectorStore.ts");
    expect(src).toMatch(/reportSaveFailure/);
    expect(src).not.toMatch(/\/\* ignore \*\//);
  });
});