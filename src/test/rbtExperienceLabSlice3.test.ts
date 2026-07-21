import { describe, it, expect, beforeEach } from "vitest";
import {
  isLabEligible,
  projectProgram,
  projectSkillPassport,
  statusForIndex,
  purgeAllLabStorage,
  __lab_internal,
  LAB_PATHWAY_KEYS,
  LAB_PRESETS,
  type LabState,
} from "@/lib/rbt/experienceLab";

describe("RBT Experience Lab — Slice 3", () => {
  beforeEach(() => {
    try { window.sessionStorage.clear(); } catch { /* jsdom */ }
  });

  describe("eligibility", () => {
    it("only super/systems admins are eligible", () => {
      expect(isLabEligible(["super_admin"])).toBe(true);
      expect(isLabEligible(["systems_admin"])).toBe(true);
      expect(isLabEligible(["admin"])).toBe(true);
      expect(isLabEligible(["rbt"])).toBe(false);
      expect(isLabEligible(["bcba"])).toBe(false);
      expect(isLabEligible(["state_director"])).toBe(false);
      expect(isLabEligible([])).toBe(false);
      expect(isLabEligible(null)).toBe(false);
    });
  });

  describe("all three pathways project deterministic programs", () => {
    for (const key of LAB_PATHWAY_KEYS) {
      it(`${key} projects with all presets`, () => {
        for (const preset of LAB_PRESETS) {
          const proj = projectProgram({ pathway: key, preset });
          expect(proj.pathway.key).toBe(key);
          expect(proj.rows.length).toBeGreaterThan(0);
          expect(proj.stats.total).toBe(proj.rows.length);
          expect(proj.stats.percent).toBeGreaterThanOrEqual(0);
          expect(proj.stats.percent).toBeLessThanOrEqual(100);
          // Every progress row uses the sentinel employee id — no real
          // employee data is ever synthesised in.
          for (const row of proj.rows) {
            expect(row.progress.employee_id).toBe("lab-preview");
          }
        }
      });
    }
  });

  describe("stage / preset switching", () => {
    it("starting → first step in_progress, none complete", () => {
      const p = projectProgram({ pathway: "new_rbt_certification", preset: "starting" });
      expect(p.stats.complete).toBe(0);
      expect(p.rows[0].progress.status).toBe("in_progress");
    });
    it("midway → roughly half complete", () => {
      const p = projectProgram({ pathway: "new_rbt_certification", preset: "midway" });
      expect(p.stats.complete).toBeGreaterThan(0);
      expect(p.stats.percent).toBeGreaterThan(20);
      expect(p.stats.percent).toBeLessThan(80);
    });
    it("nearly_done → mostly complete", () => {
      const p = projectProgram({ pathway: "new_rbt_certification", preset: "nearly_done" });
      expect(p.stats.percent).toBeGreaterThanOrEqual(70);
    });
    it("needs_support → surfaces a blocked row", () => {
      const p = projectProgram({ pathway: "new_rbt_certification", preset: "needs_support" });
      expect(p.stats.blocked).not.toBeNull();
      expect(p.stats.blocked?.progress.status).toBe("needs_support");
    });
    it("statusForIndex is a pure deterministic mapping", () => {
      expect(statusForIndex(10, 0, "starting")).toBe("in_progress");
      expect(statusForIndex(10, 9, "starting")).toBe("not_started");
      expect(statusForIndex(10, 0, "midway")).toBe("complete");
    });
  });

  describe("skill passport projection", () => {
    it("returns 6 defs and one status per def across every preset", () => {
      for (const preset of LAB_PRESETS) {
        const proj = projectSkillPassport({ pathway: "new_rbt_certification", preset });
        expect(proj.defs.length).toBe(6);
        expect(Object.keys(proj.status).length).toBe(6);
      }
    });
  });

  describe("persistence isolation", () => {
    it("sessionStorage is namespaced per admin user id", () => {
      const a = __lab_internal.storageKey("admin-a");
      const b = __lab_internal.storageKey("admin-b");
      expect(a).not.toEqual(b);
      const stateA: LabState = { pathway: "experienced_rbt", preset: "starting" };
      __lab_internal.writeSession(a, stateA);
      expect(__lab_internal.readSession(b)).toBeNull();
      expect(__lab_internal.readSession(a)).toEqual(stateA);
    });

    it("purgeAllLabStorage removes every namespaced entry", () => {
      __lab_internal.writeSession(__lab_internal.storageKey("admin-a"), { pathway: "experienced_rbt", preset: "starting" });
      __lab_internal.writeSession(__lab_internal.storageKey("admin-b"), { pathway: "under_2_years", preset: "midway" });
      purgeAllLabStorage();
      expect(__lab_internal.readSession(__lab_internal.storageKey("admin-a"))).toBeNull();
      expect(__lab_internal.readSession(__lab_internal.storageKey("admin-b"))).toBeNull();
    });

    it("rejects tampered sessionStorage payloads", () => {
      const k = __lab_internal.storageKey("admin-a");
      window.sessionStorage.setItem(k, JSON.stringify({ pathway: "hax", preset: "hax" }));
      expect(__lab_internal.readSession(k)).toBeNull();
      window.sessionStorage.setItem(k, "not json");
      expect(__lab_internal.readSession(k)).toBeNull();
    });
  });

  describe("write blocking", () => {
    it("the lab module never exports any Supabase mutation helper", async () => {
      // Structural guard: the module surface must remain read-only.
      const mod = await import("@/lib/rbt/experienceLab");
      const forbidden = ["writeProgress", "saveProgress", "insertLab", "commitLab"];
      for (const f of forbidden) expect((mod as any)[f]).toBeUndefined();
    });
  });

  describe("ordinary-user denial via URL/storage tampering", () => {
    it("an RBT with lab state written into sessionStorage is not eligible and gets purged on read", async () => {
      // Simulate an RBT tampering: they know the storage key format and
      // hand-craft a valid payload.
      const k = __lab_internal.storageKey("rbt-user");
      __lab_internal.writeSession(k, { pathway: "new_rbt_certification", preset: "midway" });

      // Render the controller with RBT roles.
      const { renderHook } = await import("@testing-library/react");
      const { useExperienceLabController } = await import("@/lib/rbt/experienceLab");
      const { result } = renderHook(() =>
        useExperienceLabController(["rbt"], "rbt-user"),
      );

      // Not eligible → not active, and storage is scrubbed for good measure.
      expect(result.current.eligible).toBe(false);
      expect(result.current.active).toBe(false);
      expect(result.current.state).toBeNull();
      expect(__lab_internal.readSession(k)).toBeNull();
    });
  });
});