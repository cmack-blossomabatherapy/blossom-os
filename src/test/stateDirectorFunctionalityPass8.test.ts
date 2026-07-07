import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_SPECIFIC_LIVE_PATHS } from "@/pages/os/OSShell";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const app = read("src/App.tsx");
const store = read("src/lib/os/stateDirector/stateDirectorStore.ts");
const pages = read("src/pages/os/stateDirector/StateDirectorPages.tsx");
const panel = read("src/components/stateDirector/CentralReachReadinessPanel.tsx");
const svc = read("src/lib/os/stateDirector/stateOperationsService.ts");

/* ---------- helpers ---------- */
function basePath(p: string): string { return p.split("?")[0].split("#")[0]; }
function isMountedOrRedirected(p: string): boolean {
  const escaped = p.replace(/\//g, "\\/");
  return new RegExp(`path="${escaped}"`).test(app);
}

describe("State Director Pass 8 — awaitable writes, de-dupe, menu coverage", () => {
  /* -------- awaitable primary writes -------- */
  it("store declares StateDirectorMutationResult", () => {
    expect(store).toMatch(/export type StateDirectorMutationResult/);
  });

  for (const method of [
    "updateEscalation", "addEscalationNote", "resolveEscalation", "reopenEscalation",
    "updateTask", "completeTask", "escalateTask", "addTaskNote",
  ]) {
    it(`${method} is async and returns a mutation result`, () => {
      const re = new RegExp(`async\\s+${method}\\s*\\([^)]*\\)\\s*:\\s*Promise<StateDirectorMutationResult`);
      expect(store, `${method} should be async and return Promise<StateDirectorMutationResult>`).toMatch(re);
    });
  }

  it("escalateTask awaits both companion escalation insert and task row update", () => {
    const idx = store.indexOf("async escalateTask");
    expect(idx).toBeGreaterThan(0);
    const block = store.slice(idx, idx + 3000);
    expect(block).toMatch(/await sbInsertEscalation/);
    expect(block).toMatch(/await sbUpdateTaskRow/);
  });

  /* -------- dialogs await results -------- */
  it("EscalationDetail awaits saves and only closes on ok=true", () => {
    expect(pages).toMatch(/const res = await stateDirectorStore\.updateEscalation/);
    expect(pages).toMatch(/const res = await stateDirectorStore\.addEscalationNote/);
    expect(pages).toMatch(/const res = await stateDirectorStore\.resolveEscalation/);
    expect(pages).toMatch(/const res = await stateDirectorStore\.reopenEscalation/);
    expect(pages).toMatch(/if \(res\.ok\) onClose\(\)/);
    expect(pages).toMatch(/if \(res\.ok\) setNote\(""\)/);
    expect(pages).toMatch(/Saving\.\.\./);
    expect(pages).toMatch(/Adding\.\.\./);
  });

  it("TaskDetail awaits saves and only closes on ok=true", () => {
    expect(pages).toMatch(/const res = await stateDirectorStore\.updateTask/);
    expect(pages).toMatch(/const res = await stateDirectorStore\.addTaskNote/);
    expect(pages).toMatch(/const res = await stateDirectorStore\.escalateTask/);
    expect(pages).toMatch(/const res = await stateDirectorStore\.completeTask/);
    expect(pages).toMatch(/Escalating\.\.\./);
    expect(pages).toMatch(/Completing\.\.\./);
  });

  /* -------- CentralReach de-dupe + statuses -------- */
  it("createStateCentralReachOutboxItem de-dupes active source rows and returns alreadyQueued", () => {
    expect(svc).toMatch(/ACTIVE_CENTRALREACH_SYNC_STATUSES/);
    expect(svc).toMatch(/alreadyQueued\?:\s*boolean/);
    const idx = svc.indexOf("export async function createStateCentralReachOutboxItem");
    const block = svc.slice(idx, idx + 2000);
    expect(block).toMatch(/state_centralreach_outbox/);
    expect(block).toMatch(/alreadyQueued: true/);
  });

  it("new readiness rows default to pending, not not_connected", () => {
    const idx = svc.indexOf("export async function createStateCentralReachOutboxItem");
    const block = svc.slice(idx, idx + 2000);
    expect(block).toMatch(/sync_status:\s*input\.syncStatus\s*\?\?\s*"pending"/);
  });

  it("sync status type accepts new (ready/failed) + legacy (not_connected/error)", () => {
    expect(svc).toMatch(/"not_connected"\s*\|\s*"pending"\s*\|\s*"ready"\s*\|\s*"synced"\s*\|\s*"error"\s*\|\s*"failed"/);
  });

  it("panel maps legacy statuses to user-friendly labels", () => {
    expect(panel).toMatch(/not_connected["']?\s*\?\s*["']pending/);
    expect(panel).toMatch(/error["']?\s*\?\s*["']failed/);
  });

  it("readiness action button surfaces alreadyQueued to the user", () => {
    expect(pages).toMatch(/alreadyQueued/);
    expect(pages).toMatch(/Already in CentralReach readiness queue/);
  });

  /* -------- menu → route coverage -------- */
  const stateDirectorPaths = [
    "/state-operations", "/ops/state-escalations", "/ops/tasks", "/ops/staffing",
    "/intake/dashboard", "/authorizations", "/ops/scheduling", "/qa-team",
    "/phone", "/training", "/resource-library", "/reports",
  ];

  for (const p of stateDirectorPaths) {
    it(`State Director menu path ${p} is mounted/redirected in App.tsx`, () => {
      expect(isMountedOrRedirected(basePath(p))).toBe(true);
    });
  }

  it("ROLE_SPECIFIC_LIVE_PATHS.state_director contains every SD menu base path", () => {
    const set = ROLE_SPECIFIC_LIVE_PATHS.state_director!;
    for (const p of stateDirectorPaths) {
      expect(set.has(basePath(p)), `state_director missing ${p}`).toBe(true);
    }
  });

  it("ROLE_SPECIFIC_LIVE_PATHS.assistant_state_director contains ASD menu base paths (no /phone)", () => {
    const set = ROLE_SPECIFIC_LIVE_PATHS.assistant_state_director!;
    for (const p of [
      "/state-operations", "/intake/dashboard", "/ops/tasks", "/ops/state-escalations",
      "/ops/staffing", "/ops/scheduling", "/authorizations", "/qa-team",
      "/training", "/resource-library", "/reports",
    ]) {
      expect(set.has(p), `assistant_state_director missing ${p}`).toBe(true);
    }
    expect(set.has("/phone")).toBe(false);
  });

  it("/ops/scheduling remains a redirect to /scheduling-workspace", () => {
    expect(app).toMatch(/path="\/ops\/scheduling"[^>]*to="\/scheduling-workspace/);
  });

  it("/scheduling-workspace remains guarded for state_director and assistant_state_director", () => {
    const line = app.split("\n").find((l) => l.includes('path="/scheduling-workspace"'));
    expect(line).toBeTruthy();
    expect(line!).toMatch(/state_director/);
    expect(line!).toMatch(/assistant_state_director/);
  });

  it("Assistant State Director menu does not include /phone", () => {
    const asd = ROLE_MENUS.assistant_state_director!;
    const items = asd.sections.flatMap((s) => s.items);
    expect(items.find((i) => i.path === "/phone")).toBeFalsy();
  });

  /* -------- Reports guard -------- */
  it("SD and ASD each have exactly one Reports menu item pointing at /reports", () => {
    for (const role of ["state_director", "assistant_state_director"] as const) {
      const menu = ROLE_MENUS[role]!;
      const items = menu.sections.flatMap((s) => s.items);
      const reports = items.filter((i) => /reports/i.test(i.label) || i.path.startsWith("/reports"));
      expect(reports.length, `${role} should have exactly one Reports item`).toBe(1);
      expect(reports[0].path).toBe("/reports");
    }
    expect(app).not.toMatch(/path="\/state-director\/reports"/);
    expect(app).not.toMatch(/path="\/assistant-state-director\/reports"/);
  });

  it("BCBA Productivity Report V3 remains available", () => {
    expect(app).toMatch(/BcbaProductivityReportV3/);
  });

  /* -------- no encoding regression -------- */
  it("no mojibake sequences in State Director source files", () => {
    const files = [
      "src/pages/os/stateDirector/StateDirectorPages.tsx",
      "src/components/stateDirector/CentralReachReadinessPanel.tsx",
      "src/components/stateDirector/SendToStateSupportButton.tsx",
      "src/components/stateDirector/LinkedContextPanel.tsx",
      "src/components/stateDirector/DailyHealthNotesPanel.tsx",
      "src/lib/os/stateDirector/stateDirectorStore.ts",
      "docs/state-director-functionality-pass-8-qa.md",
    ];
    const bad = ["\u00c3\u00a2\u20ac\u201d", "\u00c3\u00a2\u20ac\u201c", "\u00c3\u00a2\u20ac\u00a6",
                 "\u00c3\u00a2\u20ac\u0153", "\u00c3\u00a2\u20ac\u009d",
                 "\u00c3\u00a2\u2020\u2019", "\u00c3\u201a\u00c2\u00b7"];
    for (const f of files) {
      const src = read(f);
      for (const seq of bad) {
        expect(src.includes(seq), `mojibake ${JSON.stringify(seq)} in ${f}`).toBe(false);
      }
    }
  });
});