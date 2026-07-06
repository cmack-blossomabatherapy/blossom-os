import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import {
  normalizeLinkedRef,
  isUuid,
  pickLinkedRef,
} from "@/lib/os/stateDirector/linkedRef";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Assistant State Director — Pass 4 hardening", () => {
  const app = read("src/App.tsx");
  const svc = read("src/lib/os/stateDirector/stateOperationsService.ts");
  const store = read("src/lib/os/stateDirector/stateDirectorStore.ts");
  const button = read("src/components/stateDirector/SendToStateSupportButton.tsx");
  const pages = read("src/pages/os/stateDirector/StateDirectorPages.tsx");
  const panel = read("src/components/stateDirector/LinkedContextPanel.tsx");
  const phoneGuard = read("src/components/auth/PhoneSystemRoute.tsx");

  /* ------------------------------- menu ---------------------------------- */

  it("assistant_state_director menu has no /phone links and exactly one /reports", () => {
    const menu = ROLE_MENUS.assistant_state_director!;
    const items = menu.sections.flatMap((s) => s.items);
    const paths = items.map((i) => i.path);
    expect(paths.includes("/phone")).toBe(false);
    expect(paths.some((p) => p.startsWith("/phone/"))).toBe(false);
    const reports = items.filter((i) => i.path === "/reports");
    expect(reports.length).toBe(1);
  });

  it("assistant_state_director menu keeps expected live operational links", () => {
    const menu = ROLE_MENUS.assistant_state_director!;
    const paths = menu.sections.flatMap((s) => s.items.map((i) => i.path));
    for (const p of [
      "/state-operations",
      "/intake/dashboard",
      "/ops/tasks",
      "/ops/state-escalations",
      "/ops/staffing",
      "/ops/scheduling",
      "/authorizations",
      "/reports",
    ]) {
      expect(paths, `assistant_state_director missing ${p}`).toContain(p);
    }
  });

  /* ---------------------------- phone guard ------------------------------ */

  it("PhoneSystemRoute allows state_director but excludes assistant_state_director", () => {
    const allowedMatch = phoneGuard.match(/const\s+ALLOWED\s*=\s*new\s+Set<string>\(\[([\s\S]*?)\]\)/);
    expect(allowedMatch, "ALLOWED set not found in PhoneSystemRoute").toBeTruthy();
    const body = allowedMatch![1];
    expect(body).toMatch(/"state_director"/);
    expect(body).not.toMatch(/"assistant_state_director"/);
    expect(phoneGuard).toMatch(/hr/);
    expect(phoneGuard).toMatch(/marketing/);
    expect(phoneGuard).toMatch(/exec/);
  });

  /* --------------------- linked-ref normalization ------------------------ */

  it("normalizeLinkedRef separates UUIDs from raw strings and preserves both", () => {
    const uuid = "11111111-2222-4333-8444-555555555555";
    expect(isUuid(uuid)).toBe(true);
    expect(isUuid("lead-42")).toBe(false);

    expect(normalizeLinkedRef(uuid)).toEqual({ uuid, ref: uuid });
    expect(normalizeLinkedRef("lead-42")).toEqual({ uuid: null, ref: "lead-42" });
    expect(normalizeLinkedRef("")).toEqual({ uuid: null, ref: null });
    expect(normalizeLinkedRef(null)).toEqual({ uuid: null, ref: null });
    expect(normalizeLinkedRef(undefined)).toEqual({ uuid: null, ref: null });

    // Ref column takes precedence when hydrating.
    expect(pickLinkedRef("lead-42", null)).toBe("lead-42");
    expect(pickLinkedRef(null, uuid)).toBe(uuid);
    expect(pickLinkedRef(null, null)).toBeUndefined();
  });

  /* ---------------- service persistence + hydration ---------------------- */

  it("stateOperationsService writes ref columns and returns { ok, error }", () => {
    for (const col of [
      "lead_ref", "client_ref", "candidate_ref",
      "authorization_ref", "scheduling_item_ref",
    ]) {
      expect(svc, `service missing insert of ${col}`).toMatch(new RegExp(col));
    }
    expect(svc).toMatch(/normalizeLinkedRef/);
    // Insert helpers now surface errors instead of fire-and-forget.
    expect(svc).toMatch(/Promise<\{ ok: boolean; error\?: string \}>/);
  });

  it("fromTaskRow and fromEscRow hydrate the full extended context", () => {
    for (const field of [
      "linkedAuthorizationId", "linkedSchedulingItemId",
      "sourceModule", "metadata", "centralreachSyncStatus",
    ]) {
      const rx = new RegExp(field, "g");
      expect(svc.match(rx)?.length ?? 0, `service does not hydrate ${field}`).toBeGreaterThanOrEqual(2);
    }
  });

  /* ----------------- store surfaces persistence failures ---------------- */

  it("stateDirectorStore createTask/createEscalation are async and surface errors", () => {
    expect(store).toMatch(/async createTask/);
    expect(store).toMatch(/async createEscalation/);
    expect(store).toMatch(/persistError/);
    expect(store).toMatch(/pending: true/);
  });

  it("escalateTask preserves authorization/scheduling/source/metadata", () => {
    const escBlock = store.split("escalateTask")[1] ?? "";
    expect(escBlock).toMatch(/linkedAuthorizationId/);
    expect(escBlock).toMatch(/linkedSchedulingItemId/);
    expect(escBlock).toMatch(/sourceModule/);
    expect(escBlock).toMatch(/metadata/);
  });

  /* --------------------- SendToStateSupportButton ------------------------ */

  it("SendToStateSupportButton accepts defaultState, awaits persistence, and shows real errors", () => {
    expect(button).toMatch(/defaultState\?:\s*StateCode/);
    expect(button).toMatch(/STATE_SCOPED_ROLES/);
    expect(button).toMatch(/await stateDirectorStore\.createTask/);
    expect(button).toMatch(/await stateDirectorStore\.createEscalation/);
    expect(button).toMatch(/Could not save task|Could not open escalation/);
    // Mojibake / friendly text cleanup.
    expect(button).not.toContain("Sending…");
    expect(button).toMatch(/Sending\.\.\./);
    expect(button).toMatch(/CentralReach sync is not connected yet/);
  });

  /* --------------------- linked context UI panel ------------------------- */

  it("LinkedContextPanel exists and is used in both detail dialogs", () => {
    expect(panel).toMatch(/LinkedContextPanel/);
    expect(panel).toMatch(/Source module/);
    expect(panel).toMatch(/CentralReach/);
    expect(pages).toMatch(/import \{ LinkedContextPanel \}/);
    // Rendered in both dialogs.
    expect((pages.match(/<LinkedContextPanel/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  /* -------------------------- route consistency -------------------------- */

  it("state-scoped routes are guarded and consistent with the assistant menu", () => {
    const routesToCheck: [string, RegExp][] = [
      ["/state-operations", /assistant_state_director/],
      ["/ops/tasks", /assistant_state_director/],
      ["/ops/state-escalations", /assistant_state_director/],
    ];
    for (const [p, rx] of routesToCheck) {
      const line = app.split("\n").find((l) => l.includes('path="' + p + '"'));
      expect(line, `route ${p} not found`).toBeTruthy();
      expect(line!, `${p} guard should include assistant_state_director`).toMatch(rx);
    }
  });

  it("/scheduling-workspace, /authorizations, /intake/dashboard, /qa-team are mounted", () => {
    for (const p of [
      "/scheduling-workspace",
      "/authorizations",
      "/intake/dashboard",
      "/qa-team",
    ]) {
      expect(app, `route ${p} not mounted`).toMatch(
        new RegExp('path="' + p.replace(/[/]/g, "\\/") + '"'),
      );
    }
  });
});