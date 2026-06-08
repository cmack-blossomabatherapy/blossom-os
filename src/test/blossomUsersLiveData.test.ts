import { describe, it, expect } from "vitest";
import fs from "node:fs";

const USERS = fs.readFileSync("src/pages/blossom/Users.tsx", "utf8");

describe("Blossom Users — live data", () => {
  it("does not import the mock blossomUsers array", () => {
    expect(USERS).not.toMatch(/from "@\/data\/blossomOS"/);
    expect(USERS).not.toMatch(/blossomUsers/);
  });
  it("reads employees, academy_enrollments, and employee_trainings from Supabase", () => {
    expect(USERS).toMatch(/from\("employees"\)/);
    expect(USERS).toMatch(/from\("academy_enrollments"\)/);
    expect(USERS).toMatch(/from\("employee_trainings"\)/);
  });
  it("wires the Assign Track button to the real AssignTrainingModal", () => {
    expect(USERS).toMatch(/AssignTrainingModal/);
    expect(USERS).toMatch(/presetEmployeeId/);
  });
  it("warns when an employee has no linked Blossom login", () => {
    expect(USERS).toMatch(/Not linked to a Blossom login/i);
  });
});