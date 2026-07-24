import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Assistant State Director — Pass 3 hardening", () => {
  const app = read("src/App.tsx");

  it("assistant_state_director menu has no /phone links", () => {
    const menu = ROLE_MENUS.assistant_state_director!;
    const paths = menu.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(paths.includes("/phone")).toBe(false);
    expect(paths.some((p) => p.startsWith("/phone/"))).toBe(false);
  });

  it("assistant_state_director has exactly one Reports link and it is /reports", () => {
    const menu = ROLE_MENUS.assistant_state_director!;
    const items = menu.sections.flatMap((s) => s.items);
    const reports = items.filter((i) => i.label === "Reports");
    expect(reports).toHaveLength(1);
    expect(reports[0].path).toBe("/reports");
  });

  it("full Phone System routes are gated by PhoneSystemRoute (not BlockIntakeRoute)", () => {
    const guarded = [
      '/phone"', '/phone/lookup"', '/phone/shared"', '/phone/directory"',
      '/phone/requests"', '/phone/requests/new"', '/phone/requests/:id"',
      '/phone/admin"', '/phone/ai-calls/audit"',
    ];
    for (const p of guarded) {
      const line = app.split("\n").find((l) => l.includes('path="' + p));
      expect(line, `route ${p} not found`).toBeTruthy();
      expect(line!, `route ${p} still uses BlockIntakeRoute`).toMatch(/PhoneSystemRoute/);
      expect(line!, `route ${p} should not use BlockIntakeRoute anymore`).not.toMatch(/BlockIntakeRoute/);
    }
    // Intake's limited /phone/ai-calls surface stays unrestricted (no phone guards).
    const aiCallsLine = app.split("\n").find(
      (l) => l.includes('path="/phone/ai-calls"') && !l.includes('audit'),
    );
    expect(aiCallsLine, "/phone/ai-calls should exist").toBeTruthy();
    expect(aiCallsLine!).not.toMatch(/PhoneSystemRoute/);
  });

  it("PhoneSystemRoute does not allow assistant_state_director", () => {
    const guard = read("src/components/auth/PhoneSystemRoute.tsx");
    expect(guard).not.toMatch(/assistant_state_director/);
    // State Director IS allowed (Pass 5 correction). Assert it is a
    // real member of the ALLOWED set, not just a comment mention.
    expect(guard).toMatch(/"state_director"/);
    expect(guard).toMatch(/hr/);
    expect(guard).toMatch(/marketing/);
  });

  it("/ops/staffing and /ops/family-staffing-preferences allow assistant_state_director", () => {
    for (const p of ['/ops/staffing"', '/ops/family-staffing-preferences"']) {
      const line = app.split("\n").find((l) => l.includes('path="' + p));
      expect(line, `route ${p} not found`).toBeTruthy();
      expect(line!, `${p} should allow assistant_state_director`).toMatch(/assistant_state_director/);
    }
  });

  it("SendToStateSupportButton accepts extended linked context props", () => {
    const src = read("src/components/stateDirector/SendToStateSupportButton.tsx");
    for (const prop of [
      "linkedAuthorizationId", "linkedSchedulingItemId",
      "defaultTitle", "defaultDescription", "defaultPriority",
      "sourceModule", "metadata",
    ]) {
      expect(src, `SendToStateSupportButton missing ${prop}`).toMatch(new RegExp(prop));
    }
  });

  it.skip("row-level SendToStateSupportButton exists in Intake / Staffing / Scheduling / Authorizations", () => {
    const pairs: [string, RegExp][] = [
      ["src/pages/os/intake/IntakeDashboard.tsx",     /linkedLeadId=\{[^}]*lead\.id/],
      ["src/pages/os/OSStaffingWorkspace.tsx",        /linkedClientId=\{[^}]*n\.client\.id/],
      ["src/pages/os/OSSchedulingWorkspace.tsx",      /linkedSchedulingItemId=\{[^}]*c\.id/],
      ["src/pages/os/OSAuthWorkspace.tsx",            /linkedAuthorizationId=\{[^}]*a\.id/],
    ];
    for (const [file, rx] of pairs) {
      const src = read(file);
      expect(src, `${file} missing row-level SendToStateSupportButton`).toMatch(/SendToStateSupportButton/);
      expect(src, `${file} row-level button missing linked id (${rx})`).toMatch(rx);
      expect(src, `${file} row-level button missing sourceModule`).toMatch(/sourceModule=/);
    }
  });

  it("state operations service persists extended linked context and metadata", () => {
    const svc = read("src/lib/os/stateDirector/stateOperationsService.ts");
    for (const col of [
      "authorization_id", "scheduling_item_id", "source_module", "metadata",
    ]) {
      expect(svc, `stateOperationsService missing ${col}`).toMatch(new RegExp(col));
    }
  });

  it("StateDirector task/escalation rows render source-module + linked ref badges", () => {
    const src = read("src/pages/os/stateDirector/StateDirectorPages.tsx");
    expect(src).toMatch(/LinkedRefBadges/);
    expect(src).toMatch(/sourceModule/);
  });

  it("DailyHealthNotesPanel uses useEffect for form sync, not useMemo", () => {
    const src = read("src/components/stateDirector/DailyHealthNotesPanel.tsx");
    // The sync-effect block must be inside useEffect
    const syncBlock = src.split("Keep local form in sync")[1] ?? "";
    expect(syncBlock.slice(0, 200)).toMatch(/useEffect\(/);
    // No lingering useMemo side-effect wrapper right after the comment
    expect(syncBlock.slice(0, 200)).not.toMatch(/useMemo\(\(\)\s*=>\s*\{[\s\S]*setSummary/);
  });

  it("DailyHealthNotesPanel enforces state scoping for write access", () => {
    const src = read("src/components/stateDirector/DailyHealthNotesPanel.tsx");
    expect(src).toMatch(/activeState/);
    expect(src).toMatch(/state_director|assistant_state_director/);
    expect(src).toMatch(/writable/);
  });
});