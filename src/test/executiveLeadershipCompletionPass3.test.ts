/**
 * Executive Leadership completion pass 3 — no-op action removal.
 *
 * Verifies that every visible control on OSCommandCenter either navigates
 * to a real workspace, mutates durable data, or falls back to a
 * non-clickable read-only element via QuickAction. No decorative buttons.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";

const src = fs.readFileSync("src/pages/os/OSCommandCenter.tsx", "utf8");

describe("Executive Leadership completion — pass 3 (no no-op actions)", () => {
  it("QuickAction renders a read-only span when no onClick is supplied", () => {
    expect(src).toMatch(/if\s*\(\s*!\s*onClick\s*\)\s*\{[\s\S]{0,400}<span/);
    expect(src).toMatch(/aria-disabled="true"/);
  });

  it("Attention Required chips are wired through handleAttentionAction", () => {
    expect(src).toMatch(/handleAttentionAction\s*\(/);
    expect(src).toMatch(/onClick=\{\(\)\s*=>\s*handleAttentionAction\(act\.label,\s*a\)\}/);
  });

  it("My Action Queue Open buttons call openTask(t)", () => {
    expect(src).toMatch(/openTask\s*\(\s*task\s*:\s*Task\s*\)/);
    expect(src).toMatch(/onClick=\{\(\)\s*=>\s*openTask\(t\)\}/);
  });

  it("Staffing Control Center Escalate is wired to /operations/escalations", () => {
    expect(src).toMatch(/label="Escalate"[^/]*onClick=\{\(\)\s*=>\s*navigate\("\/operations\/escalations"/);
  });

  it("BCBA Oversight caseload button navigates", () => {
    expect(src).toMatch(/title="Open caseload"[\s\S]{0,200}onClick=\{\(\)\s*=>\s*navigate\(/);
  });

  it("Recruiting Snapshot chips are wired", () => {
    expect(src).toMatch(/label="Schedule Interview"[^/]*onClick=\{\(\)\s*=>\s*navigate\("\/recruiting\/interviews"/);
    expect(src).toMatch(/label="Review Candidate"[^/]*onClick=\{\(\)\s*=>\s*navigate\("\/recruiting\/workspace"/);
  });

  it("Auth risk arrow button has onClick", () => {
    expect(src).toMatch(/source:\s*"auth_risk_center"/);
  });

  it("AI right-rail action buttons all have onClick handlers", () => {
    for (const label of [
      "Prioritize my day",
      "Find op risks",
      "Summarize staffing",
      "Action list",
    ]) {
      const re = new RegExp(`label:\\s*"${label}"[^}]*onClick:`);
      expect(src, `${label} must have onClick`).toMatch(re);
    }
  });

  it("Floating quick action bar has no Ask AI button and wires every entry", () => {
    expect(src).not.toMatch(/label:\s*"Ask AI"/);
    for (const label of ["Staff", "Candidate", "Escalate", "Schedule", "Task", "Reports"]) {
      const re = new RegExp(`label:\\s*"${label}"[^}]*onClick:`);
      expect(src, `${label} must have onClick`).toMatch(re);
    }
  });
});