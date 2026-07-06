import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const app = read("src/App.tsx");

const HR_ROLES = ["hr_team", "hr_lead"] as const;

// Menu paths gathered from HR menus. Some are query-string variants — strip the ? for route matching.
const routePathOf = (p: string) => p.split("?")[0];

function routeIsMountedOrRedirected(routePath: string): boolean {
  const escaped = routePath.replace(/[/]/g, "\\/");
  return new RegExp(`path="${escaped}"`).test(app);
}

describe("HR Team — Launch Readiness", () => {
  it("every HR Team / HR Lead menu path is a valid app route or intentional redirect", () => {
    for (const role of HR_ROLES) {
      const menu = ROLE_MENUS[role]!;
      const paths = menu.sections.flatMap((s) => s.items.map((i) => routePathOf(i.path)));
      for (const p of paths) {
        expect(routeIsMountedOrRedirected(p), `${role} menu path ${p} missing from App.tsx`).toBe(true);
      }
    }
  });

  it("HR menus do not include forbidden destinations", () => {
    const forbiddenPaths = [
      "/hr/reports",
      "/admin/hr/reports",
      "/user-logins-vault",
      "/admin/login-vault",
      "/nfc-badges",
      "/hr/assistant",
    ];
    const forbiddenLabels = [/AI Assistant/i, /Operational Insights/i];
    for (const role of HR_ROLES) {
      const menu = ROLE_MENUS[role]!;
      const items = menu.sections.flatMap((s) => s.items);
      const paths = items.map((i) => routePathOf(i.path));
      for (const banned of forbiddenPaths) {
        expect(paths).not.toContain(banned);
      }
      for (const label of items.map((i) => i.label)) {
        for (const re of forbiddenLabels) expect(label).not.toMatch(re);
      }
    }
  });

  it("/hr/reports and /admin/hr/reports redirect to /reports?category=hr", () => {
    expect(app).toMatch(/path="\/hr\/reports"[\s\S]{0,120}Navigate to="\/reports\?category=hr"/);
    expect(app).toMatch(/path="\/admin\/hr\/reports"[\s\S]{0,120}Navigate to="\/reports\?category=hr"/);
  });

  it("/user-logins-vault, /admin/login-vault, /nfc-badges redirect to /user-management", () => {
    for (const p of ["/user-logins-vault", "/admin/login-vault", "/nfc-badges"]) {
      const escaped = p.replace(/\//g, "\\/");
      const re = new RegExp(`path="${escaped}"[\\s\\S]{0,120}Navigate to="\\/user-management"`);
      expect(app).toMatch(re);
    }
  });

  it("/hr/training-academy redirects to /academy", () => {
    expect(app).toMatch(/path="\/hr\/training-academy"[\s\S]{0,120}Navigate to="\/academy"/);
  });

  it("HR pages contain no dead route/button placeholders", () => {
    const files = fs
      .readdirSync("src/pages/os")
      .filter((f) => /^OSHR.*\.tsx$/.test(f))
      .map((f) => path.join("src/pages/os", f));
    const forbidden = [/to="#"/, /href="#"/, /Coming Soon/i, /not implemented/i, /\balert\(/];
    for (const file of files) {
      const src = read(file);
      for (const re of forbidden) {
        expect(re.test(src), `${file} contains forbidden pattern ${re}`).toBe(false);
      }
    }
  });

  it('HR admin pages do not point "Assign training" at /academy or /hr/training-academy', () => {
    const files = fs
      .readdirSync("src/pages/os")
      .filter((f) => /^OSHR.*\.tsx$/.test(f))
      .map((f) => path.join("src/pages/os", f));
    for (const file of files) {
      const src = read(file);
      // Lines containing "Assign training" must not target /academy or /hr/training-academy.
      const lines = src.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (/Assign training/i.test(lines[i])) {
          const window = lines.slice(Math.max(0, i - 3), i + 3).join("\n");
          expect(window, `${file}:${i + 1}`).not.toMatch(/to="\/academy"/);
          expect(window, `${file}:${i + 1}`).not.toMatch(/to="\/hr\/training-academy"/);
        }
      }
    }
  });

  it("HR admin Assign training destinations use approved HR admin routes", () => {
    const approved = [
      "/hr/training-center",
      "/hr/training-certifications",
      "/training/manage",
      "/hr/compliance",
    ];
    const files = fs
      .readdirSync("src/pages/os")
      .filter((f) => /^OSHR.*\.tsx$/.test(f))
      .map((f) => path.join("src/pages/os", f));
    let sawAssignTraining = false;
    for (const file of files) {
      const src = read(file);
      const lines = src.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (/Assign training/i.test(lines[i])) {
          sawAssignTraining = true;
          const window = lines.slice(Math.max(0, i - 3), i + 4).join("\n");
          const hasApproved = approved.some((p) => window.includes(`to="${p}"`));
          // Some "Assign training" surfaces are labels above a separate button; only assert when the
          // window has a `to=` prop. If it does, it must be one of the approved destinations.
          if (/to="\//.test(window)) {
            expect(hasApproved, `${file}:${i + 1} Assign training must link to approved HR admin route`).toBe(true);
          }
        }
      }
    }
    expect(sawAssignTraining).toBe(true);
  });
});