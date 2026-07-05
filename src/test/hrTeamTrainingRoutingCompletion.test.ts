import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const HR_ADMIN_PAGES = [
  "src/pages/os/OSHRWorkspace.tsx",
  "src/pages/os/OSHRNewHires.tsx",
  "src/pages/os/OSHREmployeeSupport.tsx",
  "src/pages/os/OSHRTrainingCerts.tsx",
  "src/pages/os/OSHRTrainingAcademy.tsx",
];

describe("HR Team — Training Routing Completion", () => {
  it("no HR admin page links 'Assign training' to /hr/training-academy", () => {
    for (const file of HR_ADMIN_PAGES) {
      const src = read(file);
      // Assign training must not be paired with the learner academy path
      const bad = /Assign training[\s\S]{0,200}\/hr\/training-academy|to="\/hr\/training-academy"[\s\S]{0,200}Assign training/;
      expect(bad.test(src), `${file} still routes Assign training to /hr/training-academy`).toBe(false);
    }
  });

  it("Assign training on HR admin pages routes to /hr/training-center", () => {
    const certs = read("src/pages/os/OSHRTrainingCerts.tsx");
    const newHires = read("src/pages/os/OSHRNewHires.tsx");
    expect(certs).toMatch(/to="\/hr\/training-center"[^>]*>Assign training/);
    expect(newHires).toMatch(/to="\/hr\/training-center"[\s\S]{0,200}Assign training|Assign training[\s\S]{0,200}to="\/hr\/training-center"/);
  });

  it("HR admin builder actions link to /training/manage", () => {
    const certs = read("src/pages/os/OSHRTrainingCerts.tsx");
    expect(certs).toMatch(/to="\/training\/manage"[^>]*>Create journey/);
    expect(certs).toMatch(/to="\/training\/manage"[^>]*>Create module/);
  });

  it("HR quick links use clear labels: Learner Academy → /academy, Training Management → /hr/training-center", () => {
    for (const file of HR_ADMIN_PAGES) {
      const src = read(file);
      // Any residual 'Training Academy' label paired with /hr/training-academy is banned
      expect(src).not.toMatch(/label:\s*"Training Academy"\s*,\s*to:\s*"\/hr\/training-academy"/);
    }
    const certs = read("src/pages/os/OSHRTrainingCerts.tsx");
    expect(certs).toMatch(/"Learner Academy"[^}]*"\/academy"/);
    expect(certs).toMatch(/"Training Management"[^}]*"\/hr\/training-center"/);
  });

  it("/hr/training-academy remains a redirect to /academy", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/path="\/hr\/training-academy"[\s\S]{0,80}Navigate to="\/academy"/);
  });

  it("/academy remains mounted as the learner academy", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/path="\/academy"/);
  });

  it("HR role menus stay clean: no reports duplicates, no Login Vault / NFC / Assistant / Insights", () => {
    const forbidden = [
      "/hr/reports",
      "/admin/hr/reports",
      "/user-logins-vault",
      "/admin/login-vault",
      "/nfc-badges",
      "/hr/assistant",
      "/ai-assistant",
      "/operational-insights",
    ];
    for (const role of ["hr_team", "hr_lead"] as const) {
      const menu = ROLE_MENUS[role];
      if (!menu) continue;
      const paths = menu.sections.flatMap((s) => s.items.map((i) => i.path));
      for (const bad of forbidden) {
        expect(paths, `${role} menu should not include ${bad}`).not.toContain(bad);
      }
    }
  });
});