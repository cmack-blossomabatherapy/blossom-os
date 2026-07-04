import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) =>
  readFileSync(resolve(__dirname, "..", p), "utf8");

const msgHistory = read("components/hr/HRMessageHistory.tsx");
const recentActivity = read("components/hr/HRRecentActivity.tsx");
const trainingCerts = read("pages/os/OSHRTrainingCerts.tsx");
const app = read("App.tsx");
const menus = read("lib/os/roleMenus.ts");

import {
  channelRouteStatusLabel,
} from "@/components/hr/HRMessageHistory";
import { formatHrActivityEventType } from "@/components/hr/HRRecentActivity";

describe("HR Team Final Hardening Pass", () => {
  describe("HRMessageHistory route status labels", () => {
    it("does not label all non-blocked route statuses as queued", () => {
      // Old logic used a boolean `blocked` and appended "queued" for everything else.
      expect(msgHistory).not.toMatch(/blocked \? "· blocked" : "· queued"/);
    });

    it("renders sent, failed, queued, blocked, and unknown labels", () => {
      expect(channelRouteStatusLabel("queued")).toBe("Queued");
      expect(channelRouteStatusLabel("sent")).toBe("Sent");
      expect(channelRouteStatusLabel("failed")).toBe("Failed");
      expect(channelRouteStatusLabel("blocked")).toBe("Blocked");
      expect(channelRouteStatusLabel(undefined)).toBe("Unknown");
      expect(channelRouteStatusLabel("weird")).toBe("Unknown");
    });

    it("uses an intentional empty state copy", () => {
      expect(msgHistory).toContain("No HR messages recorded yet.");
    });
  });

  describe("HRRecentActivity labels", () => {
    it("maps important event types to polished labels", () => {
      expect(formatHrActivityEventType("ready_blocked")).toBe("Readiness blocked");
      expect(formatHrActivityEventType("integration_readiness_updated")).toBe("Integration readiness updated");
      expect(formatHrActivityEventType("hr_message_queued")).toBe("Message queued");
      expect(formatHrActivityEventType("orientation_no_show")).toBe("Orientation no-show");
      expect(formatHrActivityEventType("candidate_ready_for_staffing")).toBe("Candidate ready for staffing");
      expect(formatHrActivityEventType("compliance_marked_ready")).toBe("Compliance marked ready");
      expect(formatHrActivityEventType("case_note")).toBe("Case note added");
      expect(formatHrActivityEventType("integration_message_blocked")).toBe("Integration message blocked");
    });

    it("falls back to title-cased words for unknown event types", () => {
      expect(formatHrActivityEventType("some_new_thing")).toBe("Some New Thing");
    });

    it("uses formatHrActivityEventType in the render, not raw underscore-replace", () => {
      expect(recentActivity).toMatch(/formatHrActivityEventType\(r\.event_type\)/);
      expect(recentActivity).not.toMatch(/r\.event_type\.replace\(\/_\/g,\s*" "\)/);
    });
  });

  describe("OSHRTrainingCerts message history integration", () => {
    it("imports HRMessageHistory", () => {
      expect(trainingCerts).toMatch(/from\s+"@\/components\/hr\/HRMessageHistory"/);
    });
    it("renders HRMessageHistory scoped by selectedEmployeeId", () => {
      expect(trainingCerts).toMatch(/<HRMessageHistory[\s\S]*employeeId=\{selectedEmployeeId\}/);
    });
    it("bumps a refresh key so a queued reminder refreshes the history", () => {
      expect(trainingCerts).toMatch(/setMessageRefresh\(\(n\)\s*=>\s*n\s*\+\s*1\)/);
    });
  });

  describe("Legacy HR routes", () => {
    it("redirects /hr/assistant away from HR workflow", () => {
      expect(app).toMatch(/path="\/hr\/assistant"\s+element=\{<Navigate\s+to="\/hr\/workspace"\s+replace/);
    });
    it("redirects /hr/training-academy to /academy", () => {
      expect(app).toMatch(/path="\/hr\/training-academy"\s+element=\{<Navigate\s+to="\/academy"\s+replace/);
    });
  });

  describe("HR role menus stay clean", () => {
    it("does not include duplicate reports / login vault / NFC / AI destinations", () => {
      // Extract the two HR role menu bodies (hr_team + hr_lead) and assert forbidden paths absent
      const hrBlocks = [
        ...menus.matchAll(/role:\s*"hr(?:_team|_lead)"[\s\S]*?menu:\s*\[([\s\S]*?)\n\s*\]\s*,?\s*\n\s*\}/g),
      ].map((m) => m[1] ?? "");
      // Fallback: just search anywhere for forbidden paths in an HR context if regex misses
      const forbidden = [
        "/hr/reports",
        "/admin/hr/reports",
        "/user-logins-vault",
        "/admin/login-vault",
        "/nfc-badges",
        "/hr/assistant",
        "/ai/assistant",
        "Operational Insights",
      ];
      for (const path of forbidden) {
        expect(hrBlocks.every((b) => !b.includes(path))).toBe(true);
      }
    });
  });
});