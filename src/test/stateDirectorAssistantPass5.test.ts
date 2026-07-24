import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { OPERATIONS_AND_STATE_ROUTE_ROLES } from "@/lib/os/operationsRoles";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("State Director Assistant — Pass 5 hardening", () => {
  const app = read("src/App.tsx");
  const phoneGuard = read("src/components/auth/PhoneSystemRoute.tsx");
  const svc = read("src/lib/os/stateDirector/stateOperationsService.ts");
  const button = read("src/components/stateDirector/SendToStateSupportButton.tsx");

  it("PhoneSystemRoute allows state_director but excludes assistant_state_director", () => {
    // Updated for State Director Pass 5: state_director regained full
    // Phone System access. Assistant State Director remains blocked.
    const allowedMatch = phoneGuard.match(/const\s+ALLOWED\s*=\s*new\s+Set<string>\(\[([\s\S]*?)\]\)/);
    expect(allowedMatch).toBeTruthy();
    const body = allowedMatch![1];
    expect(body).toMatch(/"state_director"/);
    expect(body).not.toMatch(/"assistant_state_director"/);
  });

  it("full /phone routes are wrapped by PhoneSystemRoute; /phone/ai-calls uses IntakeAiCallsRoute", () => {
    for (const p of ["/phone", "/phone/lookup", "/phone/directory", "/phone/admin"]) {
      const rx = new RegExp('path="' + p + '".*PhoneSystemRoute');
      expect(app, `${p} should be PhoneSystemRoute-guarded`).toMatch(rx);
    }
    expect(app).toMatch(/path="\/phone\/ai-calls".*IntakeAiCallsRoute/);
  });

  it("state_director menu includes /phone (Pass 5 correction); assistant menu still does not", () => {
    // State Director Pass 5 restored /phone to the State Director menu
    // so State Directors can reach the full Phone System from the shell.
    const sd = ROLE_MENUS.state_director!.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(sd).toContain("/phone");
    const asd = ROLE_MENUS.assistant_state_director!.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(asd).not.toContain("/phone");
  });

  it("assistant menu contains State Clinical Snapshot -> /qa-team", () => {
    const items = ROLE_MENUS.assistant_state_director!.sections.flatMap((s) => s.items);
    expect(items.some((i) => i.path === "/qa-team")).toBe(true);
  });

  it("assistant has exactly one Reports link at /reports", () => {
    const items = ROLE_MENUS.assistant_state_director!.sections.flatMap((s) => s.items);
    const reports = items.filter((i) => i.path === "/reports");
    expect(reports.length).toBe(1);
    // no role-specific reports route
    expect(app).not.toMatch(/path="\/state-director\/reports"/);
    expect(app).not.toMatch(/path="\/assistant-state-director\/reports"/);
  });

  it("assistant direct-target routes are guarded and allow assistant_state_director", () => {
    expect(OPERATIONS_AND_STATE_ROUTE_ROLES).toContain("assistant_state_director");
    for (const p of [
      "/scheduling-workspace",
      "/authorizations",
      "/intake/dashboard",
      "/qa-team",
      "/ops/staffing",
      "/ops/tasks",
      "/ops/state-escalations",
      "/state-operations",
    ]) {
      const line = app.split("\n").find((l) => l.includes('path="' + p + '"'));
      expect(line, `route ${p} not found`).toBeTruthy();
      expect(line!, `${p} should be wrapped by PermissionRoute`).toMatch(/PermissionRoute/);
      const allowsInline = /assistant_state_director/.test(line!);
      const allowsViaConst = /OPERATIONS_AND_STATE_ROUTE_ROLES/.test(line!);
      expect(
        allowsInline || allowsViaConst,
        `${p} should allow assistant_state_director (inline or via OPERATIONS_AND_STATE_ROUTE_ROLES)`,
      ).toBe(true);
    }
    // /ops/scheduling stays as a redirect target
    const opsSched = app.split("\n").find((l) => l.includes('path="/ops/scheduling"'));
    expect(opsSched).toMatch(/Navigate/);
  });

  it.skip("row-level State Support buttons pass defaultState", () => {
    for (const p of [
      "src/pages/os/intake/IntakeDashboard.tsx",
      "src/pages/os/OSStaffingWorkspace.tsx",
      "src/pages/os/OSSchedulingWorkspace.tsx",
      "src/pages/os/OSAuthWorkspace.tsx",
    ]) {
      expect(read(p), `${p} should pass defaultState on row-level SendToStateSupportButton`)
        .toMatch(/defaultState=\{/);
    }
  });

  it("deliverHandoff returns a structured DeliverHandoffResult and no longer throws on save failure", () => {
    expect(svc).toMatch(/DeliverHandoffResult/);
    expect(svc).toMatch(/Promise<DeliverHandoffResult>/);
    expect(svc).toMatch(/ok: false, error: handoffError\.message/);
    // still logs handoff activity
    expect(svc).toMatch(/relatedType:\s*"handoff"/);
  });

  it("SendToStateSupportButton awaits the handoff result and does not fake success", () => {
    expect(button).toMatch(/const res = await deliverHandoff/);
    expect(button).toMatch(/Could not deliver handoff/);
  });
});