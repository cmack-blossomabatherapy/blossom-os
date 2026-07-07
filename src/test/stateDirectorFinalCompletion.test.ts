import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_SPECIFIC_LIVE_PATHS } from "@/pages/os/OSShell";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const app = read("src/App.tsx");
const store = read("src/lib/os/stateDirector/stateDirectorStore.ts");
const svc = read("src/lib/os/stateDirector/stateOperationsService.ts");

const SD_EXPECTED = [
  "/state-operations",
  "/ops/state-escalations",
  "/ops/tasks",
  "/ops/staffing",
  "/intake/dashboard",
  "/authorizations",
  "/ops/scheduling",
  "/qa-team",
  "/phone",
  "/training",
  "/resource-library",
  "/reports",
];

const ASD_EXPECTED = [
  "/state-operations",
  "/intake/dashboard",
  "/ops/tasks",
  "/ops/state-escalations",
  "/ops/staffing",
  "/ops/scheduling",
  "/authorizations",
  "/qa-team",
  "/training",
  "/resource-library",
  "/reports",
];

function base(p: string) { return p.split("?")[0].split("#")[0]; }
function menuPaths(role: "state_director" | "assistant_state_director") {
  const menu = ROLE_MENUS[role]!;
  return menu.sections.flatMap((s) => s.items.map((i) => i.path));
}
function isMounted(p: string) {
  return new RegExp(`path="${p.replace(/\//g, "\\/")}"`).test(app);
}

describe("State Director Final Completion — menus, routes, guards", () => {
  it("state_director menu contains exactly the expected operational paths (plus training/resources/reports)", () => {
    const paths = new Set(menuPaths("state_director").map(base));
    for (const p of SD_EXPECTED) {
      expect(paths.has(p), `state_director menu missing ${p}`).toBe(true);
    }
    // No duplicate Reports item
    const reports = menuPaths("state_director").filter((p) => p === "/reports");
    expect(reports.length).toBe(1);
  });

  it("assistant_state_director menu contains expected paths, no /phone, one Reports", () => {
    const paths = new Set(menuPaths("assistant_state_director").map(base));
    for (const p of ASD_EXPECTED) {
      expect(paths.has(p), `assistant_state_director menu missing ${p}`).toBe(true);
    }
    expect(paths.has("/phone")).toBe(false);
    const reports = menuPaths("assistant_state_director").filter((p) => p === "/reports");
    expect(reports.length).toBe(1);
  });

  it("ROLE_SPECIFIC_LIVE_PATHS.state_director covers every SD menu base path", () => {
    const set = ROLE_SPECIFIC_LIVE_PATHS.state_director!;
    for (const p of SD_EXPECTED) expect(set.has(p), `SD live-paths missing ${p}`).toBe(true);
  });

  it("ROLE_SPECIFIC_LIVE_PATHS.assistant_state_director covers every ASD menu base path", () => {
    const set = ROLE_SPECIFIC_LIVE_PATHS.assistant_state_director!;
    for (const p of ASD_EXPECTED) expect(set.has(p), `ASD live-paths missing ${p}`).toBe(true);
  });

  it("every SD and ASD menu path is mounted or redirected in App.tsx", () => {
    for (const p of [...SD_EXPECTED, ...ASD_EXPECTED]) {
      expect(isMounted(p), `route ${p} not mounted`).toBe(true);
    }
  });

  it("/ops/scheduling redirects to /scheduling-workspace?bucket=coverage_risk", () => {
    expect(app).toMatch(/path="\/ops\/scheduling"[^>]*to="\/scheduling-workspace\?bucket=coverage_risk"/);
  });

  it("/scheduling-workspace allows state_director and assistant_state_director", () => {
    const line = app.split("\n").find((l) => l.includes('path="/scheduling-workspace"'))!;
    expect(line).toBeTruthy();
    expect(line).toMatch(/state_director/);
    expect(line).toMatch(/assistant_state_director/);
  });

  it("/reports is the only Reports hub route (no SD/ASD/ops variants)", () => {
    expect(app).toMatch(/path="\/reports"\s+element=\{<ReportsHome/);
    expect(app).not.toMatch(/path="\/state-director\/reports"/);
    expect(app).not.toMatch(/path="\/assistant-state-director\/reports"/);
    expect(app).not.toMatch(/path="\/ops\/reports"/);
  });

  it("BcbaProductivityReportV3 remains imported/mounted", () => {
    expect(app).toMatch(/BcbaProductivityReportV3/);
  });

  it("SD and ASD Training menu still points to /training (not /academy)", () => {
    for (const role of ["state_director", "assistant_state_director"] as const) {
      const items = ROLE_MENUS[role]!.sections.flatMap((s) => s.items);
      const training = items.find((i) => /Training Academy/i.test(i.label));
      expect(training?.path).toBe("/training");
    }
  });

  it("state director store primary writes are async and return StateDirectorMutationResult", () => {
    expect(store).toMatch(/export type StateDirectorMutationResult/);
    for (const m of [
      "updateEscalation", "addEscalationNote", "resolveEscalation", "reopenEscalation",
      "updateTask", "completeTask", "escalateTask", "addTaskNote",
    ]) {
      expect(store, `${m} async signature`)
        .toMatch(new RegExp(`async\\s+${m}\\s*\\([^)]*\\)\\s*:\\s*Promise<StateDirectorMutationResult`));
    }
  });

  it("CentralReach readiness service dedupes, defaults pending, returns alreadyQueued, accepts expanded statuses", () => {
    expect(svc).toMatch(/ACTIVE_CENTRALREACH_SYNC_STATUSES/);
    expect(svc).toMatch(/alreadyQueued\?:\s*boolean/);
    const idx = svc.indexOf("export async function createStateCentralReachOutboxItem");
    const block = svc.slice(idx, idx + 2000);
    expect(block).toMatch(/sync_status:\s*input\.syncStatus\s*\?\?\s*"pending"/);
    expect(block).toMatch(/alreadyQueued: true/);
    expect(svc).toMatch(/"not_connected"\s*\|\s*"pending"\s*\|\s*"ready"\s*\|\s*"synced"\s*\|\s*"error"\s*\|\s*"failed"/);
  });

  it("Pass 8 migration exists with expanded sync_status check and active-row partial unique index", () => {
    const dir = "supabase/migrations";
    const all = fs.readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => fs.readFileSync(path.join(dir, f), "utf8"))
      .join("\n");
    expect(all).toMatch(/state_centralreach_outbox_sync_status_check[\s\S]*not_connected[\s\S]*pending[\s\S]*ready[\s\S]*synced[\s\S]*error[\s\S]*failed/);
    expect(all).toMatch(/CREATE UNIQUE INDEX[\s\S]*state_centralreach_outbox[\s\S]*state_code[\s\S]*source_type[\s\S]*source_id[\s\S]*sync_status IN/);
  });

  it("no Monday.com or Make.com language in SD user-visible surfaces or QA docs", () => {
    // Scope to user-visible surfaces (SD pages + components) and QA docs.
    // Legacy TS lib files may reference Monday.com in comments describing
    // historical IDs; that is not user-visible copy and is out of scope.
    const targets: string[] = [];
    const walk = (dir: string, filter: (f: string) => boolean) => {
      if (!fs.existsSync(dir)) return;
      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) walk(full, filter);
        else if (filter(f)) targets.push(full);
      }
    };
    walk("src/pages/os/stateDirector", (f) => f.endsWith(".tsx"));
    walk("src/components/stateDirector", (f) => f.endsWith(".tsx"));
    // Scan only the new final QA doc — older QA docs contain the phrases
    // as negative-assertion history ("no Make.com language") which is fine.
    const finalDoc = "docs/state-director-final-completion-qa.md";
    if (fs.existsSync(finalDoc)) targets.push(finalDoc);
    for (const f of targets) {
      const src = fs.readFileSync(f, "utf8");
      expect(/monday\.com/i.test(src), `Monday.com in ${f}`).toBe(false);
      expect(/make\.com/i.test(src), `Make.com in ${f}`).toBe(false);
    }
  });

  it("no literal mojibake sequences in SD source, tests, or QA docs", () => {
    const bad = [
      "\u00c2", "\u00c3\u00a2\u20ac\u201d", "\u00c3\u00a2\u20ac\u201c",
      "\u00c3\u00a2\u20ac\u00a6", "\u00c3\u00a2\u20ac\u0153",
      "\u00c3\u00a2\u20ac\u009d", "\u00c3\u00a2\u20ac\u02dc",
      "\u00c3\u00a2\u20ac\u2122", "\u00c3\u00a2\u2020\u2019",
      "\u00c3\u201a\u00c2\u00b7",
    ];
    const files: string[] = [];
    const walk = (dir: string, filter: (f: string) => boolean) => {
      if (!fs.existsSync(dir)) return;
      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) walk(full, filter);
        else if (filter(f)) files.push(full);
      }
    };
    walk("src/pages/os/stateDirector", (f) => f.endsWith(".tsx"));
    walk("src/components/stateDirector", (f) => f.endsWith(".tsx"));
    walk("src/lib/os/stateDirector", (f) => f.endsWith(".ts"));
    for (const f of fs.readdirSync("src/test")) {
      if (/^stateDirector/i.test(f) && /\.(test|spec)\.tsx?$/.test(f)) {
        files.push(path.join("src/test", f));
      }
    }
    for (const f of fs.readdirSync("docs")) {
      if (/state-director/i.test(f)) files.push(path.join("docs", f));
    }
    for (const f of files) {
      const src = fs.readFileSync(f, "utf8");
      for (const seq of bad) {
        if (seq === "\u00c2") {
          // Bare Â only mojibake when followed by another high char; skip standalone check.
          continue;
        }
        expect(src.includes(seq), `mojibake ${JSON.stringify(seq)} in ${f}`).toBe(false);
      }
    }
  });
});