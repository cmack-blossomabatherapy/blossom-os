import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const read = (p: string) => readFileSync(path.resolve(__dirname, "../..", p), "utf8");

const PAGES = {
  MyDay: read("src/pages/os/OSRBTMyDay.tsx"),
  Clients: read("src/pages/os/OSRBTClients.tsx"),
  Schedule: read("src/pages/os/OSRBTSchedule.tsx"),
  SessionSupport: read("src/pages/os/OSRBTSessionSupport.tsx"),
  Supervision: read("src/pages/os/OSRBTSupervision.tsx"),
  Messages: read("src/pages/os/OSRBTMessages.tsx"),
  Help: read("src/pages/os/OSRBTHelp.tsx"),
};

describe("RBT pages use the shared Supabase-backed workflow hook", () => {
  for (const [name, src] of Object.entries(PAGES)) {
    it(`${name} imports useRbtWorkflow`, () => {
      expect(src).toMatch(/from ["']@\/hooks\/useRbtWorkflow["']/);
      expect(src).toContain("useRbtWorkflow");
    });
    it(`${name} does not hardcode a demo client array like Liam/Aria`, () => {
      expect(src).not.toMatch(/Liam C\.|Aria J\.|J\.R\.|Alex Rivera/);
    });
  }
});

describe("RBT workflow actions are wired to Supabase mutations", () => {
  it("Session support submits via logSessionSupport", () => {
    expect(PAGES.SessionSupport).toMatch(/wf\.logSessionSupport\(/);
  });
  it("Help submits via submitHelpRequest", () => {
    expect(PAGES.Help).toMatch(/wf\.submitHelpRequest\(/);
  });
  it("Messages can mark read and complete", () => {
    expect(PAGES.Messages).toMatch(/wf\.markMessageRead\(/);
    expect(PAGES.Messages).toMatch(/wf\.markMessageComplete\(/);
  });
  it("Supervision acknowledges via acknowledgeSupervision", () => {
    expect(PAGES.Supervision).toMatch(/wf\.acknowledgeSupervision\(/);
  });
  it("Schedule and My Day can confirm sessions", () => {
    expect(PAGES.Schedule).toMatch(/wf\.confirmSession\(/);
    expect(PAGES.MyDay).toMatch(/wf\.confirmSession\(/);
  });
});

describe("CentralReach is represented honestly (never faked as live)", () => {
  for (const [name, src] of Object.entries(PAGES)) {
    it(`${name} does not falsely claim a live CentralReach connection`, () => {
      expect(src).not.toMatch(/Live from CentralReach/i);
      expect(src).not.toMatch(/CentralReach connected/i);
    });
  }
  it("Schedule/MyDay/Clients surface CentralReach status without claiming live sync", () => {
    for (const src of [PAGES.MyDay, PAGES.Clients, PAGES.Schedule]) {
      // Must reference CentralReach in some form
      expect(src).toMatch(/CentralReach/);
    }
  });
});

describe("Legacy static demo data is removed", () => {
  it("No RBT page inlines a makeToday() mock helper", () => {
    for (const src of Object.values(PAGES)) {
      expect(src).not.toMatch(/function makeToday/);
    }
  });
});
