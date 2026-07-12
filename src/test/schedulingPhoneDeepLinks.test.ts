import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (rel: string) => readFileSync(resolve(__dirname, "../..", rel), "utf8");

/**
 * Regression guard for scheduling and phone-call deep links.
 *
 * Scheduling pages open a client-context panel/drawer via ?clientId=<id>
 * (OSScheduling, OSSchedulingWorkspace, OSStaffingQueue) or ?client=<id>
 * for the RBT-facing view (OSRBTSchedule).
 *
 * The after-hours AI board opens a specific phone call detail via ?call=<id>.
 *
 * Any drift on the query-param name, on the reader on the target page, or on
 * the route registration itself would silently break email/SMS CTAs and
 * dashboard chips that link into these workspaces.
 */
describe("Scheduling & phone-call deep links resolve to the correct workspace", () => {
  const app = read("src/App.tsx");
  const scheduling = read("src/pages/os/OSScheduling.tsx");
  const schedulingWorkspace = read("src/pages/os/OSSchedulingWorkspace.tsx");
  const staffingQueue = read("src/pages/os/OSStaffingQueue.tsx");
  const rbtSchedule = read("src/pages/os/OSRBTSchedule.tsx");
  const afterHours = read("src/components/phone/AfterHoursAIBoard.tsx");

  const SAMPLE = "22222222-2222-2222-2222-222222222222";

  describe("Scheduling — /scheduling?clientId=<id>", () => {
    it("registers /scheduling as a real route", () => {
      expect(app).toMatch(/path="\/scheduling"\s+element=\{<OSScheduling\s*\/>\}/);
    });

    it("OSScheduling reads ?clientId=<id> and resolves selectedClient from it", () => {
      expect(scheduling).toMatch(/params\.get\("clientId"\)/);
      expect(scheduling).toMatch(/selectedClient\s*=\s*selectedClientId\s*\?\s*clients\.find/);
    });

    it("OSScheduling writes clientId back to the URL when a client is selected", () => {
      expect(scheduling).toMatch(/next\.set\("clientId",\s*id\)/);
    });

    it("emits a shareable /scheduling?clientId=<id> URL", () => {
      const p = new URLSearchParams();
      p.set("clientId", SAMPLE);
      expect(`/scheduling?${p.toString()}`).toBe(`/scheduling?clientId=${SAMPLE}`);
    });
  });

  describe("Scheduling Workspace — /scheduling-workspace?clientId=<id>", () => {
    it("registers /scheduling-workspace as a real route", () => {
      expect(app).toMatch(/path="\/scheduling-workspace"/);
      expect(app).toMatch(/<OSSchedulingWorkspace\s*\/>/);
    });

    it("OSSchedulingWorkspace reads ?clientId=<id> and mounts the selected client", () => {
      expect(schedulingWorkspace).toMatch(/params\.get\("clientId"\)/);
      expect(schedulingWorkspace).toMatch(/selected\s*=\s*selectedId\s*\?\s*clients\.find/);
    });

    it("OSSchedulingWorkspace writes clientId back to the URL when a client is selected", () => {
      expect(schedulingWorkspace).toMatch(/next\.set\("clientId",\s*id\)/);
    });
  });

  describe("Staffing Queue — /ops/staffing?clientId=<id>", () => {
    it("registers /ops/staffing as a real route (canonical staffing surface)", () => {
      expect(app).toMatch(/path="\/ops\/staffing"/);
      expect(app).toMatch(/<OSStaffingWorkspace\s*\/>/);
    });

    it("keeps the legacy /staffing redirect pointing at the canonical workspace", () => {
      expect(app).toMatch(
        /path="\/staffing"\s+element=\{<Navigate\s+to="\/ops\/staffing\?tab=open-cases"\s+replace\s*\/>\}/,
      );
    });

    it("OSStaffingQueue reads ?clientId=<id> and syncs it back on selection", () => {
      expect(staffingQueue).toMatch(/params\.get\("clientId"\)/);
      expect(staffingQueue).toMatch(/p\.set\("clientId",\s*id\)/);
    });
  });

  describe("RBT Schedule — /rbt/schedule?client=<id>", () => {
    it("registers /rbt/schedule as a real route", () => {
      expect(app).toMatch(/path="\/rbt\/schedule"\s+element=\{<OSRBTSchedule\s*\/>\}/);
    });

    it("OSRBTSchedule reads ?client=<id> and filters sessions by client_id", () => {
      expect(rbtSchedule).toMatch(/params\.get\("client"\)/);
      expect(rbtSchedule).toMatch(/s\.client_id\s*!==\s*clientFilter/);
    });
  });

  describe("Phone Calls — /phone/ai-calls?call=<id>", () => {
    it("registers /phone/ai-calls as a real route behind the intake AI gate", () => {
      expect(app).toMatch(
        /path="\/phone\/ai-calls"\s+element=\{<IntakeAiCallsRoute><PhoneAfterHoursAI\s*\/><\/IntakeAiCallsRoute>\}/,
      );
    });

    it("registers /phone/calls (CTM history) as a real route behind the phone gate", () => {
      expect(app).toMatch(
        /path="\/phone\/calls"\s+element=\{<PhoneSystemRoute><CTMCalls\s*\/><\/PhoneSystemRoute>\}/,
      );
    });

    it("AfterHoursAIBoard reads ?call=<id> and opens the matching call panel", () => {
      expect(afterHours).toMatch(/params\.get\("call"\)/);
      // matches on either the db id or the retell call id, then mounts the detail
      expect(afterHours).toMatch(
        /calls\.find\(\(c\)\s*=>\s*c\.id\s*===\s*target\s*\|\|\s*c\.retell_call_id\s*===\s*target\)/,
      );
      expect(afterHours).toMatch(/setSelected\(match\)/);
    });

    it("emits a shareable /phone/ai-calls?call=<id> URL", () => {
      const p = new URLSearchParams();
      p.set("call", SAMPLE);
      expect(`/phone/ai-calls?${p.toString()}`).toBe(`/phone/ai-calls?call=${SAMPLE}`);
    });
  });
});