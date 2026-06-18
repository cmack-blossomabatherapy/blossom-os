import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_HOME } from "@/lib/os/roleHome";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

const REQUIRED_QA_PATHS = [
  "/qa-team",
  "/qa-workspace",
  "/qa-queue",
  "/qa-clients",
  "/authorization-reviews",
  "/progress-reports",
  "/treatment-plan-reviews",
  "/missing-information",
  "/expiring-items",
  "/assigned-bcbas",
  "/supervision-visibility",
  "/qa-messages",
  "/escalations-followups",
  "/qa/resources",
  "/reports",
  "/academy",
  "/resource-library",
];

describe("Sprint 19 — QA Team role menu", () => {
  const qaMenu = ROLE_MENUS.qa_team!;
  const allPaths = qaMenu.sections.flatMap((s) => s.items.map((i) => i.path));

  it.each(REQUIRED_QA_PATHS)("includes %s", (p) => {
    expect(allPaths).toContain(p);
  });

  it("does not include generic /dashboard", () => {
    expect(allPaths).not.toContain("/dashboard");
  });

  it("does not use legacy base /qa as a menu path", () => {
    expect(allPaths).not.toContain("/qa");
  });
});

describe("Sprint 19 — ROLE_HOME for QA roles", () => {
  it("qa_team → /qa-team", () => expect(ROLE_HOME.qa_team).toBe("/qa-team"));
  it("qa_director → /qa-team", () => expect(ROLE_HOME.qa_director).toBe("/qa-team"));
  it("qa_specialist → /qa-team", () => expect(ROLE_HOME.qa_specialist).toBe("/qa-team"));
});

describe("Sprint 19 — OSShell live paths", () => {
  const shell = read("src/pages/os/OSShell.tsx");

  it("declares role-specific live paths for qa_team", () => {
    expect(shell).toMatch(/qa_team:\s*new Set<string>\(\[/);
  });
  it("declares role-specific live paths for qa_director", () => {
    expect(shell).toMatch(/qa_director:\s*new Set<string>\(\[/);
  });
  it("declares role-specific live paths for qa_specialist", () => {
    expect(shell).toMatch(/qa_specialist:\s*new Set<string>\(\[/);
  });

  it("STAGED_ROLE_LIVE_PATHS does not globally include QA-specific paths", () => {
    const staged = shell.match(/STAGED_ROLE_LIVE_PATHS[\s\S]*?\]\)/)![0];
    expect(staged).not.toContain("/qa-team");
    expect(staged).not.toContain("/qa-workspace");
    expect(staged).not.toContain("/ops/qa");
  });

  it("preserves intake/auth/scheduling/staffing role-specific live paths", () => {
    expect(shell).toMatch(/intake_coordinator:\s*new Set/);
    expect(shell).toMatch(/authorization_coordinator:\s*new Set/);
    expect(shell).toMatch(/scheduling_team:\s*new Set/);
    expect(shell).toMatch(/staffing_team:\s*new Set/);
  });
});

describe("Sprint 19 — OSRoleContext QA mapping", () => {
  const ctx = read("src/contexts/OSRoleContext.tsx");
  it("maps qa_director → qa_director", () => {
    expect(ctx).toMatch(/appRoles\.includes\("qa_director"\)\) return "qa_director"/);
  });
  it("maps qa_specialist → qa_specialist", () => {
    expect(ctx).toMatch(/appRoles\.includes\("qa_specialist"\)\) return "qa_specialist"/);
  });
  it("maps qa → qa_team", () => {
    expect(ctx).toMatch(/appRoles\.includes\("qa"\)\) return "qa_team"/);
  });
});

describe("Sprint 19 — App.tsx QA routing", () => {
  const app = read("src/App.tsx");

  it("redirects qa_director → ROLE_HOME.qa_director", () => {
    expect(app).toMatch(/roles\.includes\("qa_director"\)\s*\?\s*ROLE_HOME\.qa_director/);
  });
  it("redirects qa_specialist → ROLE_HOME.qa_specialist", () => {
    expect(app).toMatch(/roles\.includes\("qa_specialist"\)\s*\?\s*ROLE_HOME\.qa_specialist/);
  });
  it("redirects qa → ROLE_HOME.qa_team", () => {
    expect(app).toMatch(/roles\.includes\("qa"\)\s*\?\s*ROLE_HOME\.qa_team/);
  });

  it("/ops/qa uses PermissionRoute with QA app roles", () => {
    expect(app).toMatch(
      /path="\/ops\/qa"\s+element=\{<PermissionRoute\s+allowedRoles=\{\["admin",\s*"qa",\s*"qa_director",\s*"qa_specialist"\]\}>/
    );
    expect(app).not.toMatch(/path="\/ops\/qa"\s+element=\{<AdminRoute>/);
  });

  it("base /qa redirects to /qa-team", () => {
    expect(app).toMatch(/path="\/qa"\s+element=\{<Navigate\s+to="\/qa-team"\s+replace\s*\/>\}/);
  });
  it("/qa/:id remains mounted", () => {
    expect(app).toMatch(/path="\/qa\/:id"\s+element=\{<QADetail\s*\/>\}/);
  });

  it("preserves protected surfaces", () => {
    expect(app).toMatch(/path="\/training"/);
    expect(app).toMatch(/path="\/academy"/);
    expect(app).toMatch(/path="\/resource-library"/);
    expect(app).toMatch(/path="\/reports"/);
    expect(app).toMatch(/path="\/reports\/bcba-productivity-report-v3"/);
    expect(app).toMatch(/path="\/system\/bcba-productivity-uploads"/);
    expect(app).toMatch(/path="\/user-logins-vault"/);
    expect(app).toMatch(/path="\/admin\/login-vault"/);
    expect(app).toMatch(/path="\/nfc-badges"/);
    expect(app).toMatch(/path="\/evaluations"/);
    expect(app).toMatch(/path="\/phone"/);
  });
});
