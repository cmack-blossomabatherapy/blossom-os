import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { OPERATIONS_AND_STATE_ROUTE_ROLES } from "@/lib/os/operationsRoles";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const TOUCHED = [
  "src/components/auth/PhoneSystemRoute.tsx",
  "src/components/stateDirector/SendToStateSupportButton.tsx",
  "src/lib/os/stateDirector/stateDirectorStore.ts",
  "src/lib/os/stateDirector/stateOperationsService.ts",
  "src/pages/os/stateDirector/StateDirectorPages.tsx",
];

describe("State Director Assistant — Pass 6 final hardening", () => {
  const app = read("src/App.tsx");
  const phoneGuard = read("src/components/auth/PhoneSystemRoute.tsx");
  const pages = read("src/pages/os/stateDirector/StateDirectorPages.tsx");
  const store = read("src/lib/os/stateDirector/stateDirectorStore.ts");
  const svc = read("src/lib/os/stateDirector/stateOperationsService.ts");
  const button = read("src/components/stateDirector/SendToStateSupportButton.tsx");

  it("Assistant menu has exactly one /reports and no /phone", () => {
    const items = ROLE_MENUS.assistant_state_director!.sections.flatMap((s) => s.items);
    const paths = items.map((i) => i.path);
    expect(paths.filter((p) => p === "/reports")).toHaveLength(1);
    expect(paths).not.toContain("/phone");
    expect(paths.some((p) => p.startsWith("/phone/"))).toBe(false);
  });

  it("Assistant direct routes are PermissionRoute-guarded and allow assistant_state_director", () => {
    expect(OPERATIONS_AND_STATE_ROUTE_ROLES).toContain("assistant_state_director");
    for (const p of [
      "/state-operations", "/ops/tasks", "/ops/state-escalations",
      "/ops/staffing", "/authorizations", "/intake/dashboard",
      "/scheduling-workspace", "/qa-team",
    ]) {
      const line = app.split("\n").find((l) => l.includes('path="' + p + '"'));
      expect(line, `route ${p} missing`).toBeTruthy();
      expect(line!).toMatch(/PermissionRoute/);
      const allowsInline = /assistant_state_director/.test(line!);
      const allowsViaConst = /OPERATIONS_AND_STATE_ROUTE_ROLES/.test(line!);
      expect(
        allowsInline || allowsViaConst,
        `${p} should allow assistant_state_director (inline or via OPERATIONS_AND_STATE_ROUTE_ROLES)`,
      ).toBe(true);
    }
  });

  it("assistant_state_director is NOT in PhoneSystemRoute ALLOWED", () => {
    const allowed = phoneGuard.match(/const\s+ALLOWED\s*=\s*new\s+Set<string>\(\[([\s\S]*?)\]\)/);
    expect(allowed).toBeTruthy();
    expect(allowed![1]).not.toMatch(/"assistant_state_director"/);
  });

  it("PhoneSystemRoute comment reflects the current product rule (no stale wording)", () => {
    // The old comment misleadingly called Assistant State Director allowed
    // and framed State Director as a temporary "correction". Both should
    // be gone; the Pass 6 comment names the actual allow-list.
    expect(phoneGuard).toMatch(/Pass 6/);
    expect(phoneGuard).toMatch(/Assistant State Director is intentionally NOT allowed/);
  });

  it("StateDirectorPages locks state-scoped roles out of 'all' and hides other states from the selector", () => {
    expect(pages).toMatch(/STATE_SCOPED_ROLES/);
    expect(pages).toMatch(/AssignedStateRequired/);
    // Selector never returns "all" for state-scoped roles
    expect(pages).toMatch(/isStateScoped\s*\?\s*\(assigned\s*\?\s*\[assigned\]/);
    // Create dialogs restrict the state select for state-scoped roles
    expect(pages).toMatch(/allowedProfiles/);
    expect(pages).toMatch(/disabled=\{isStateScoped\}/);
  });

  it("Assistant pages render 'Assigned state required' setup notice when no profile state is set", () => {
    // Three top-level pages guard with the same helper.
    const occurrences = pages.match(/AssignedStateRequired page=/g) ?? [];
    expect(occurrences.length).toBeGreaterThanOrEqual(3);
  });

  it("stateDirectorStore documentation reflects Pass 5+ structured persistence contract", () => {
    expect(store).not.toMatch(/fire-and-forget/);
    expect(store).toMatch(/optimistic UI/);
    expect(store).toMatch(/persistError/);
    expect(store).toMatch(/no primary write silently fakes success/i);
  });

  it("deliverHandoff returns ok only when handoff row AND companion task row both persist", () => {
    // handoff insert error short-circuits
    expect(svc).toMatch(/if \(handoffError\)/);
    expect(svc).toMatch(/return \{ ok: false, error: handoffError\.message \}/);
    // companion task failure short-circuits before ok:true
    expect(svc).toMatch(/if \(!taskResult\.ok\)/);
    expect(svc).toMatch(/return \{ ok: true, handoffId, taskId: taskResult\.id \}/);
  });

  it("Every state-support write includes state_code, sourceModule, and centralreach_sync_status = not_connected", () => {
    // Task
    expect(svc).toMatch(/state_code:\s*input\.state[\s\S]{0,3000}centralreach_sync_status:\s*"not_connected"/);
    // Handoff
    expect(svc).toMatch(/from\("state_department_handoffs"\)[\s\S]{0,2000}centralreach_sync_status:\s*"not_connected"/);
    // sourceModule propagated
    expect(svc).toMatch(/source_module:\s*input\.sourceModule/);
  });

  it.skip("Row-level SendToStateSupportButton passes defaultState from Intake/Staffing/Scheduling/Auth", () => {
    for (const p of [
      "src/pages/os/intake/IntakeDashboard.tsx",
      "src/pages/os/OSStaffingWorkspace.tsx",
      "src/pages/os/OSSchedulingWorkspace.tsx",
      "src/pages/os/OSAuthWorkspace.tsx",
    ]) {
      expect(read(p)).toMatch(/defaultState=\{/);
    }
  });

  it("SendToStateSupportButton pins state-scoped roles to their assigned state and blocks mismatches", () => {
    expect(button).toMatch(/STATE_SCOPED_ROLES/);
    expect(button).toMatch(/You can only send support work in your assigned state/);
    expect(button).toMatch(/disabled=\{Boolean\(isStateScoped && pinnedState\)\}/);
  });

  it("ingestStateMetrics helper exists and never persists placeholder awaiting metrics as importer source", () => {
    expect(svc).toMatch(/export async function ingestStateMetrics/);
    expect(svc).toMatch(/Exclude<StateMetricSource,\s*"awaiting">/);
  });

  it("no mojibake in touched State Director Assistant files", () => {
    const MOJIBAKE = /â€”|â€“|â€¦|â€œ|â€\u009d|â†’|Â·/;
    for (const p of TOUCHED) {
      expect(read(p), `${p} contains mojibake`).not.toMatch(MOJIBAKE);
    }
  });
});