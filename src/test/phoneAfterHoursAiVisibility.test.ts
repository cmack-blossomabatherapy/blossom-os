/**
 * Phone System — After-Hours AI visibility rules.
 *
 * Product rule: /phone is available to Executive Leadership, HR, Marketing,
 * State Director, and admins, but After-Hours AI Calls entry points inside
 * /phone (and the /phone/ai-calls route itself) are Intake-owned with
 * admin support access only.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { canSeeAfterHoursAI, AFTER_HOURS_AI_ROLES } from "@/pages/phone/PhonePages";

const phonePagesSrc = fs.readFileSync("src/pages/phone/PhonePages.tsx", "utf8");
const intakeAiSrc = fs.readFileSync("src/components/auth/IntakeAiCallsRoute.tsx", "utf8");
const phoneRouteSrc = fs.readFileSync("src/components/auth/PhoneSystemRoute.tsx", "utf8");

describe("Phone After-Hours AI visibility", () => {
  it("Executive Leadership menu has /phone but not /phone/ai-calls", () => {
    const exec = ROLE_MENUS.executive_leadership!;
    const paths = exec.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(paths).toContain("/phone");
    expect(paths).not.toContain("/phone/ai-calls");
    expect(paths).not.toContain("/phone/ai-calls/audit");
  });

  it("Intake coordinator menu still exposes After-Hours AI Calls", () => {
    const intake = ROLE_MENUS.intake_coordinator!;
    const paths = intake.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(paths).toContain("/phone/ai-calls");
  });

  it("canSeeAfterHoursAI allows intake + admins only", () => {
    for (const r of [
      "super_admin", "admin", "systems_admin",
      "intake", "intake_team", "intake_lead", "intake_admin",
      "intake_manager", "intake_specialist", "intake_coordinator",
    ]) {
      expect(canSeeAfterHoursAI(r)).toBe(true);
    }
    for (const r of [
      "executive_leadership", "ceo", "coo", "director_of_operations",
      "operations_leadership", "hr", "hr_manager", "marketing",
      "marketing_manager", "state_director", "assistant_state_director",
      "bcba", "rbt",
    ]) {
      expect(canSeeAfterHoursAI(r)).toBe(false);
    }
    expect(canSeeAfterHoursAI(null)).toBe(false);
  });

  it("PhoneDashboard gates After-Hours AI UI on canSeeAfterHoursAI", () => {
    // Stat cards, Retell CTA row, and AI quick links must be behind the flag.
    expect(phonePagesSrc).toMatch(/showAfterHoursAI\s*&&[\s\S]{0,400}After-Hours AI Calls/);
    expect(phonePagesSrc).toMatch(/showAfterHoursAI\s*&&[\s\S]{0,400}\/phone\/ai-calls/);
    expect(phonePagesSrc).toMatch(/showAfterHoursAI\s*&&[\s\S]{0,600}Retell AI after-hours/);
    // Sanity: allow-list export exists and matches Intake support set.
    expect(AFTER_HOURS_AI_ROLES.has("intake_coordinator")).toBe(true);
    expect(AFTER_HOURS_AI_ROLES.has("executive_leadership")).toBe(false);
  });

  it("IntakeAiCallsRoute does not allow executive_leadership or HR/Marketing", () => {
    // Extract the ALLOWED set literal from the source.
    const m = intakeAiSrc.match(/ALLOWED\s*=\s*new Set<string>\(\[([\s\S]*?)\]\)/);
    expect(m).toBeTruthy();
    const allowed = m![1];
    for (const r of [
      "executive_leadership", "ceo", "coo", "hr", "hr_manager",
      "marketing", "marketing_manager", "state_director",
      "assistant_state_director", "bcba", "rbt",
    ]) {
      expect(allowed).not.toMatch(new RegExp(`"${r}"`));
    }
    // Intake + admins remain allowed.
    for (const r of ["intake_coordinator", "intake_admin", "super_admin", "admin", "systems_admin"]) {
      expect(allowed).toMatch(new RegExp(`"${r}"`));
    }
  });

  it("PhoneSystemRoute still allows executive_leadership at /phone", () => {
    const m = phoneRouteSrc.match(/ALLOWED\s*=\s*new Set<string>\(\[([\s\S]*?)\]\)/);
    expect(m).toBeTruthy();
    const allowed = m![1];
    expect(allowed).toMatch(/"executive_leadership"/);
    expect(allowed).toMatch(/"hr"/);
    expect(allowed).toMatch(/"marketing"/);
    expect(allowed).toMatch(/"state_director"/);
    // Assistant State Director must remain excluded from the full Phone System.
    expect(allowed).not.toMatch(/"assistant_state_director"/);
  });

  it("PhoneSystemRoute comment no longer claims Assistant State Director uses /phone/ai-calls", () => {
    expect(phoneRouteSrc).not.toMatch(/Assistant.*uses the limited \/phone\/ai-calls surface only/i);
    expect(phoneRouteSrc).toMatch(/Assistant State Director/);
  });
});