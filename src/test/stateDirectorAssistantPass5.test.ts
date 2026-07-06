import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("State Director Assistant — Pass 5 hardening", () => {
  const app = read("src/App.tsx");
  const phoneGuard = read("src/components/auth/PhoneSystemRoute.tsx");
  const svc = read("src/lib/os/stateDirector/stateOperationsService.ts");
  const button = read("src/components/stateDirector/SendToStateSupportButton.tsx");

  it("PhoneSystemRoute excludes both state_director and assistant_state_director", () => {
    expect(phoneGuard).not.toMatch(/"state_director"/);
    expect(phoneGuard).not.toMatch(/"assistant_state_director"/);
  });

  it("full /phone routes are wrapped by PhoneSystemRoute; /phone/ai-calls uses IntakeAiCallsRoute", () => {
    for (const p of ["/phone", "/phone/lookup", "/phone/directory", "/phone/admin"]) {
      const rx = new RegExp('path="' + p + '".*PhoneSystemRoute');
      expect(app, `${p} should be PhoneSystemRoute-guarded`).toMatch(rx);
    }
    expect(app).toMatch(/path="\/phone\/ai-calls".*IntakeAiCallsRoute/);
  });

  it("state_director menu no longer exposes /phone; assistant menu still doesn't", () => {
    const sd = ROLE_MENUS.state_director!.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(sd).not.toContain("/phone");
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
      expect(line!, `${p} should allow assistant_state_director`).toMatch(/assistant_state_director/);
    }
    // /ops/scheduling stays as a redirect target
    const opsSched = app.split("\n").find((l) => l.includes('path="/ops/scheduling"'));
    expect(opsSched).toMatch(/Navigate/);
  });

  it("row-level State Support buttons pass defaultState", () => {
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