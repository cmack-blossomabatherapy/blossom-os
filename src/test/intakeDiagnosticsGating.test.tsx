import { describe, expect, it } from "vitest";
import { isOperatorDiagnosticsVisible } from "@/components/os/intake/OperatorDiagnosticsGate";

/**
 * Regression: technical diagnostics (provider health, webhook delivery,
 * raw sync/routing config, ingestion counters) must be hidden from
 * every Intake operator role. Only Super Admin / Systems Admin / Admin
 * may see them.
 *
 * These tests protect the "no diagnostics for Intake role" contract on
 * every Intake surface (Dashboard, Tasks, Missing Info, After-Hours AI,
 * CentralReach Packet Prep, Leads).
 */
describe("OperatorDiagnosticsGate — Intake role diagnostics contract", () => {
  const OPERATOR_ROLES = [
    "intake_coordinator",
    "intake_lead",
    "intake_team",
    "intake",
    "bcba",
    "rbt",
    "state_director",
    "recruiting_team",
    "billing_finance",
  ];

  const ADMIN_ROLES = ["super_admin", "systems_admin", "admin"];

  it.each(OPERATOR_ROLES)("hides diagnostics for %s", (role) => {
    expect(isOperatorDiagnosticsVisible(role)).toBe(false);
  });

  it.each(ADMIN_ROLES)("shows diagnostics for %s", (role) => {
    expect(isOperatorDiagnosticsVisible(role)).toBe(true);
  });

  it("hides diagnostics when role is missing or unknown", () => {
    expect(isOperatorDiagnosticsVisible(null)).toBe(false);
    expect(isOperatorDiagnosticsVisible(undefined)).toBe(false);
    expect(isOperatorDiagnosticsVisible("")).toBe(false);
    expect(isOperatorDiagnosticsVisible("unknown_role")).toBe(false);
  });
});

describe("AfterHoursAIBoard — operator-facing copy", () => {
  it("does not leak vendor/webhook terminology to Intake operators in default copy", async () => {
    // Read the source file and assert the operator-facing copy strings
    // no longer mention "Retell" or "webhook" outside admin-gated blocks.
    const fs = await import("node:fs/promises");
    const src = await fs.readFile("src/components/phone/AfterHoursAIBoard.tsx", "utf8");

    // Header subtitle should be operator-safe (no vendor name).
    expect(src).toContain("Inbound calls captured after business hours. Intake reviews and follows up here.");
    expect(src).not.toContain("Retell AI captures inbound calls outside business hours");

    // Empty-state copy no longer mentions webhooks.
    expect(src).toContain("New after-hours calls will appear here as they come in.");
    expect(src).not.toMatch(/No calls yet\. Calls will appear here as Retell sends webhooks/);

    // Sync / Routing buttons live inside the diagnostics gate.
    expect(src).toMatch(/<OperatorDiagnosticsGate>[\s\S]*Routing & Notifications[\s\S]*Sync history[\s\S]*<\/OperatorDiagnosticsGate>/);
  });
});