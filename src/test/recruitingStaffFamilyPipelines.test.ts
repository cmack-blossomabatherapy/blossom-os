import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  classifyJobFamily,
  isOfficeStaffCandidate,
  isClinicStaffCandidate,
  RECRUITING_ROLE_OPTIONS,
} from "@/lib/recruiting/jobFamily";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Office / Clinic Staff job-family classification", () => {
  const office = [
    "Intake Coordinator",
    "Scheduling Coordinator",
    "Authorization Specialist",
    "Billing Specialist",
    "RCM Analyst",
    "HR Generalist",
    "Administrative Assistant",
    "Office Manager",
    "State Support Coordinator",
    "Regional Support Specialist",
    "Operations Coordinator",
    "Credentialing Specialist",
  ];
  for (const title of office) {
    it(`classifies "${title}" as Office Staff`, () => {
      expect(classifyJobFamily({ role: "Other", applied_title: title })).toBe("Office Staff");
      expect(isOfficeStaffCandidate({ role: "Other", applied_title: title })).toBe(true);
    });
  }

  const clinic = [
    "Clinic Director",
    "Assistant Clinic Director",
    "Clinical Training Specialist",
    "Clinical Support Coordinator",
    "Lead RBT",
    "Clinic Operations Manager",
    "Center Director",
  ];
  for (const title of clinic) {
    it(`classifies "${title}" as Clinic Staff`, () => {
      expect(classifyJobFamily({ role: "Other", applied_title: title })).toBe("Clinic Staff");
      expect(isClinicStaffCandidate({ role: "Other", applied_title: title })).toBe(true);
    });
  }

  it("honors an explicitly persisted role over title inference", () => {
    expect(classifyJobFamily({ role: "Office Staff", applied_title: "Clinic Director" })).toBe("Office Staff");
    expect(classifyJobFamily({ role: "Clinic Staff", applied_title: "Billing" })).toBe("Clinic Staff");
  });

  it("does not duplicate ordinary RBT/BCBA candidates into clinic staff", () => {
    expect(classifyJobFamily({ role: "RBT", applied_title: "Registered Behavior Technician" })).toBe("RBT");
    expect(classifyJobFamily({ role: "BCBA", applied_title: "BCBA" })).toBe("BCBA");
    expect(classifyJobFamily({ role: "BT", applied_title: "Behavior Technician" })).toBe("BT");
  });

  it("reclassifies clinical rows only when the title names clinic leadership", () => {
    expect(classifyJobFamily({ role: "RBT", applied_title: "Lead RBT" })).toBe("Clinic Staff");
    expect(classifyJobFamily({ role: "BCBA", applied_title: "Clinic Director (BCBA)" })).toBe("Clinic Staff");
  });

  it("keeps backward compatibility: unmatched rows stay Other", () => {
    expect(classifyJobFamily({ role: "Other" })).toBe("Other");
    expect(classifyJobFamily({ role: "Other", applied_title: "Volunteer" })).toBe("Other");
  });

  it("can classify from tags when no applied title exists", () => {
    expect(classifyJobFamily({ role: "Other", tags: ["apploi:123", "Scheduling Coordinator"] })).toBe("Office Staff");
  });
});

describe("Applicant Pipeline taxonomy", () => {
  it("exposes Office Staff and Clinic Staff explicitly while retaining Other", () => {
    expect(RECRUITING_ROLE_OPTIONS).toContain("Office Staff");
    expect(RECRUITING_ROLE_OPTIONS).toContain("Clinic Staff");
    expect(RECRUITING_ROLE_OPTIONS).toContain("Other");
    expect(RECRUITING_ROLE_OPTIONS).toContain("RBT");
    expect(RECRUITING_ROLE_OPTIONS).toContain("BCBA");
  });

  it("Applicant Pipeline uses the shared taxonomy and family-aware filtering", () => {
    const src = read("src/pages/os/OSRecruitingPipeline.tsx");
    expect(src).toMatch(/RECRUITING_ROLE_OPTIONS/);
    expect(src).toMatch(/classifyJobFamily\(c\)\s*!==\s*roleF/);
  });
});

describe("Office / Clinic Staff pipeline pages are real-backend only", () => {
  const shared = read("src/components/recruiting/StaffFamilyPipeline.tsx");

  it("reads candidates from the recruiting backend hook", () => {
    expect(shared).toMatch(/useRecruitingCandidates/);
  });

  it("persists stage moves through updateStage (audited) and edits through updateCandidate", () => {
    expect(shared).toMatch(/updateStage\(id, s\.key\)/);
    expect(shared).toMatch(/updateCandidate\(selected\.id, patch\)/);
  });

  it("has no demo/mock/synthetic candidate data or local-only stage state", () => {
    expect(shared).not.toMatch(/@\/data\/recruiting/);
    expect(shared).not.toMatch(/mock[A-Z]/);
    expect(shared).not.toMatch(/setStageMap|const\s*\[\s*stageMap\s*,/);
  });

  it("uses the honest Apploi connection behavior", () => {
    expect(shared).toMatch(/notifyApploiNotConnected/);
    expect(shared).toMatch(/apploiStatus !== "connected"/);
  });

  it("covers the canonical lifecycle plus exception stages", () => {
    for (const stage of [
      "New Applicant", "Phone Screen", "Interview Scheduled", "Interview Complete",
      "Offer Sent", "Offer Accepted", "Background Check", "Orientation Scheduled",
      "Onboarding", "Ready to Staff", "On Hold", "Withdrawn", "Rejected",
    ]) {
      expect(shared, `missing stage ${stage}`).toContain(`"${stage}"`);
    }
  });
});

describe("Office / Clinic Staff routes and menus", () => {
  const app = read("src/App.tsx");
  const menus = read("src/lib/os/roleMenus.ts");
  const workspaces = read("src/lib/os/workspaces.ts");

  for (const p of ["/recruiting/office-staff", "/recruiting/clinic-staff"]) {
    it(`App.tsx mounts ${p}`, () => {
      expect(app).toContain(`path="${p}"`);
    });
    it(`workspace tabs include ${p}`, () => {
      expect(workspaces).toContain(`"${p}"`);
    });
  }

  it("recruiting_team and recruiting_lead menus expose both pipelines next to RBT/BCBA", () => {
    const forRole = (role: string) => {
      const start = menus.indexOf(`${role}: {`);
      expect(start, `${role} menu`).toBeGreaterThan(-1);
      return menus.slice(start, start + 3000);
    };
    for (const role of ["recruiting_team", "recruiting_lead"]) {
      const block = forRole(role);
      expect(block, `${role} office staff`).toContain("/recruiting/office-staff");
      expect(block, `${role} clinic staff`).toContain("/recruiting/clinic-staff");
      expect(block).toContain("Office Staff Recruiting");
      expect(block).toContain("Clinic Staff Recruiting");
    }
  });
});