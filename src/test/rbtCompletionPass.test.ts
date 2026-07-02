import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const APP_TSX = readFileSync(path.resolve(__dirname, "../App.tsx"), "utf8");

describe("RBT completion pass", () => {
  const menu = ROLE_MENUS.rbt;
  const paths = menu!.sections.flatMap((s) => s.items.map((i) => i.path));

  it("exposes an RBT menu with every required workspace", () => {
    expect(menu).toBeDefined();
    for (const required of [
      "/rbt/my-day",
      "/rbt/clients",
      "/rbt/schedule",
      "/rbt/session-support",
      "/rbt/supervision",
      "/rbt/training-academy",
      "/rbt/readiness",
      "/rbt/messages",
      "/rbt/resources",
      "/rbt/help",
    ]) {
      expect(paths).toContain(required);
    }
  });

  it("uses the single canonical /reports page (no /rbt/reports in menu)", () => {
    expect(paths).toContain("/reports");
    expect(paths.some((p) => p === "/rbt/reports")).toBe(false);
  });

  it("contains no AI menu items and no coming-soon links", () => {
    for (const p of paths) {
      expect(p).not.toMatch(/\/ai(\/|$)/);
      expect(p).not.toMatch(/coming-soon/i);
    }
  });

  it("mounts every RBT route in App.tsx", () => {
    for (const p of [
      "/rbt/my-day",
      "/rbt/clients",
      "/rbt/schedule",
      "/rbt/session-support",
      "/rbt/supervision",
      "/rbt/training-academy",
      "/rbt/readiness",
      "/rbt/messages",
      "/rbt/resources",
      "/rbt/help",
    ]) {
      expect(APP_TSX).toContain(`path="${p}"`);
    }
  });

  it("redirects /rbt/reports to the canonical /reports page", () => {
    expect(APP_TSX).toMatch(/path="\/rbt\/reports"[\s\S]*?to="\/reports\?audience=rbt"/);
  });

  it("exposes the useRbtWorkflow hook for self-scoped RBT data", async () => {
    const mod = await import("@/hooks/useRbtWorkflow");
    expect(typeof mod.useRbtWorkflow).toBe("function");
  });
});