import { describe, it, expect } from "vitest";
import fs from "node:fs";

const APP_TSX = fs.readFileSync("src/App.tsx", "utf8");
const CONTROL_ROOM = fs.readFileSync(
  "src/components/training/TrainingControlRoom.tsx",
  "utf8",
);
const MODAL = fs.readFileSync(
  "src/components/training/AssignTrainingModal.tsx",
  "utf8",
);
const AUDIT = fs.readFileSync("docs/training-management-audit.md", "utf8");
const MODULE_CARD = fs.readFileSync(
  "src/components/academy/ModuleCard.tsx",
  "utf8",
);

describe("Pass 2 — legacy redirects", () => {
  const redirected = [
    "/admin/training-dashboard",
    "/hr/training-dashboard",
    "/hr/training",
  ];
  for (const path of redirected) {
    it(`${path} redirects to /hr/training-center`, () => {
      const escaped = path.replace(/\//g, "\\/");
      const re = new RegExp(
        `<Route\\s+path="${escaped}"\\s+element=\\{<Navigate\\s+to="/hr/training-center"\\s+replace\\s*/>\\}`,
      );
      expect(APP_TSX).toMatch(re);
    });
  }

  it("/hr/training-center remains registered as the primary workspace", () => {
    expect(APP_TSX).toMatch(
      /<Route\s+path="\/hr\/training-center"\s+element=\{<TrainingManagementCenter\s*\/>\}/,
    );
  });

  it("learner Academy route /training/academy remains registered", () => {
    expect(APP_TSX).toMatch(/<Route\s+path="\/training\/academy"/);
  });

  it("Leadership Dashboard route remains registered", () => {
    expect(APP_TSX).toMatch(/<Route\s+path="\/training\/academy\/leadership"/);
  });
});

describe("Pass 2 — Control Room Assign action", () => {
  it("Control Room imports the Assign Training modal", () => {
    expect(CONTROL_ROOM).toMatch(/AssignTrainingModal/);
  });

  it("Admin Actions section exposes an 'Assign training' action", () => {
    expect(CONTROL_ROOM).toMatch(/Assign training/);
    expect(CONTROL_ROOM).toMatch(/assign-training-action/);
  });

  it("Assign action no longer hard-links to /admin/training-assign", () => {
    expect(CONTROL_ROOM).not.toMatch(/to="\/admin\/training-assign"/);
  });
});

describe("Pass 2 — Assign modal contents", () => {
  it("includes trainee input", () => {
    expect(MODAL).toMatch(/Trainee/i);
  });
  it("includes training path selector backed by journeys", () => {
    expect(MODAL).toMatch(/Training path/);
    expect(MODAL).toMatch(/journeys\.map/);
  });
  it("includes mentor and state fields", () => {
    expect(MODAL).toMatch(/Mentor/);
    expect(MODAL).toMatch(/State/);
  });
  it("includes start date input", () => {
    expect(MODAL).toMatch(/Start date/i);
    expect(MODAL).toMatch(/type="date"/);
  });
  it("surfaces setup warnings before assignment", () => {
    expect(MODAL).toMatch(/Setup warnings/);
    expect(MODAL).toMatch(/data-testid="setup-warnings"/);
    expect(MODAL).toMatch(/employee\/auth-user link missing/);
    expect(MODAL).toMatch(/No mentor assigned/);
    expect(MODAL).toMatch(/No state assigned/);
    expect(MODAL).toMatch(/welcome asset/);
    expect(MODAL).toMatch(/SOP\/resource link/);
  });
  it("renders a confirmation / next-step state", () => {
    expect(MODAL).toMatch(/Confirm assignment/);
    expect(MODAL).toMatch(/assign-confirmation/);
    expect(MODAL).toMatch(/Next step/);
  });
  it("is mock-safe — pending integration label, no DB writes", () => {
    expect(MODAL).toMatch(/Pending integration/i);
    expect(MODAL).not.toMatch(/supabase\.from\(/);
    expect(MODAL).not.toMatch(/\.insert\(/);
    expect(MODAL).not.toMatch(/\.upsert\(/);
  });
});

describe("Pass 2 — preserved behavior", () => {
  it("pending videos remain non-blocking in Control Room copy", () => {
    expect(CONTROL_ROOM).toMatch(/do not block/i);
  });

  it("ModuleCard does not gate Mark complete on video_url", () => {
    expect(MODULE_CARD).not.toMatch(/video_url[^}]*&&\s*<[^>]*Mark complete/i);
  });

  it("Pending SOP/resource gaps still surface as admin action items", () => {
    expect(CONTROL_ROOM).toContain("Resource / SOP Gaps");
    expect(CONTROL_ROOM).toMatch(/pendingSops/);
  });

  it("Control Room has no placeholder wording", () => {
    const forbidden = [/coming soon/i, /lorem ipsum/i, /placeholder content/i, /\bTBD\b/, /\bTODO\b/];
    for (const pat of forbidden) expect(CONTROL_ROOM).not.toMatch(pat);
  });
});

describe("Pass 2 — audit doc", () => {
  it("documents the three legacy redirects", () => {
    expect(AUDIT).toMatch(/Routes redirected in Pass 2/);
    expect(AUDIT).toContain("/admin/training-dashboard");
    expect(AUDIT).toContain("/hr/training-dashboard");
    expect(AUDIT).toContain("/hr/training");
  });

  it("documents assignment surface consolidation", () => {
    expect(AUDIT).toMatch(/Assignment surfaces consolidated/);
    expect(AUDIT).toMatch(/AssignTrainingModal/);
    expect(AUDIT).toMatch(/Pending integration/);
  });

  it("lists remaining Pass 3 work", () => {
    expect(AUDIT).toMatch(/Recommended Pass 3/);
  });
});