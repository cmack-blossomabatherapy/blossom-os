import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  attachChildren,
  mergeOverlayIntoAuth,
} from "@/hooks/useLiveAuthorizations";
import type { Authorization } from "@/data/authorizations";

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Authorizations Pass 3 — static guards", () => {
  it("OSAuthWorkspace has no FALLBACK_AUTHS demo data anymore", () => {
    const src = read("src/pages/os/OSAuthWorkspace.tsx");
    expect(src).not.toMatch(/FALLBACK_AUTHS/);
  });

  it("OSAuthWorkspace and OSAuthorizations contain no window.prompt calls", () => {
    for (const f of [
      "src/pages/os/OSAuthWorkspace.tsx",
      "src/pages/os/OSAuthorizations.tsx",
    ]) {
      expect(read(f), `${f} should not use window.prompt`).not.toMatch(
        /window\.prompt\(/,
      );
    }
  });

  it("hardcoded individual staff names are removed from live auth surfaces", () => {
    const forbidden = [
      "Shira / Rachel",
      "Shira & Rachel",
      '"Julianne"',
      '"Rivky"',
      '"Rikki"',
      "Dr. Patel",
      "Dr. Nguyen",
      "Dr. Cole",
    ];
    for (const f of [
      "src/pages/os/OSAuthWorkspace.tsx",
      "src/pages/os/OSAuthorizations.tsx",
    ]) {
      const src = read(f);
      for (const needle of forbidden) {
        expect(src.includes(needle), `${f} contains hardcoded "${needle}"`).toBe(
          false,
        );
      }
    }
  });
});

describe("Authorizations Pass 3 — merge helpers", () => {
  const base: Authorization & { liveBcba: string | null } = {
    id: "monday-1",
    clientId: "monday-1",
    clientName: "Raw Monday Client",
    state: "GA",
    payor: "Aetna",
    authType: "Treatment",
    stage: "Awaiting Submission",
    coordinator: "Unassigned",
    qaOwner: null,
    qaStatus: "Not Started",
    qaNotes: null,
    submittedDate: null,
    approvedDate: null,
    expirationDate: null,
    hours: null,
    daysInStage: 0,
    riskLevel: "Low",
    missingInfo: false,
    treatmentPlanReceived: false,
    documents: [],
    missingRequirements: [],
    nextAction: "Submit authorization packet",
    nextTaskDue: null,
    lastActivity: new Date().toISOString(),
    tasks: [],
    timeline: [],
    automationLog: [],
    liveBcba: null,
  };

  it("mergeOverlayIntoAuth lets overlay values override Monday values", () => {
    const merged = mergeOverlayIntoAuth(base, {
      id: "overlay-1",
      source_system: "monday",
      monday_item_id: "monday-1",
      centralreach_authorization_id: null,
      centralreach_client_id: null,
      centralreach_sync_status: null,
      centralreach_last_synced_at: null,
      client_name: "Updated Name",
      state: "NC",
      payer: "BCBS NC",
      auth_type: "Reauth",
      status: "Submitted",
      workflow_stage: "Submitted",
      assigned_owner: "Coord A",
      assigned_bcba: "BCBA B",
      assigned_auth_coordinator: null,
      qa_owner: null,
      submitted_date: "2025-01-02",
      approved_date: null,
      expiration_date: "2025-07-02",
      start_date: null,
      denial_reason: null,
      next_action: "Awaiting payor",
      next_action_due_date: null,
      authorization_number: null,
      tracking_number: null,
      service_code: null,
      authorized_hours: 30,
      used_hours: null,
      priority: null,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
    expect(merged.clientName).toBe("Updated Name");
    expect(merged.state).toBe("NC");
    expect(merged.payor).toBe("BCBS NC");
    expect(merged.stage).toBe("Submitted");
    expect(merged.coordinator).toBe("Coord A");
    expect(merged.liveBcba).toBe("BCBA B");
    expect(merged.submittedDate).toBe("2025-01-02");
    expect(merged.expirationDate).toBe("2025-07-02");
    expect(merged.hours).toBe("30");
  });

  it("attachChildren wires requirements, tasks, and activity onto the right auth", () => {
    const overlayMap = new Map<string, string>([["monday-1", "overlay-1"]]);
    const auths: Authorization[] = [{ ...base }];
    const enriched = attachChildren(
      auths,
      overlayMap,
      [
        {
          id: "r1",
          authorization_id: "overlay-1",
          requirement_name: "Diagnostic Eval",
          status: "open",
          due_date: null,
        },
      ],
      [
        {
          id: "t1",
          authorization_id: "overlay-1",
          title: "Follow up on PR",
          status: "open",
          due_date: null,
          owner_user: null,
        },
      ],
      [
        {
          id: "a1",
          authorization_id: "overlay-1",
          activity_type: "note",
          title: "Called BCBA",
          body: null,
          old_value: null,
          new_value: null,
          created_at: new Date().toISOString(),
          created_by: null,
        },
      ],
    );
    const a = enriched[0];
    expect(a.missingRequirements).toContain("Diagnostic Eval");
    expect(a.tasks).toHaveLength(1);
    expect(a.tasks[0].title).toBe("Follow up on PR");
    expect(a.timeline.some((t) => t.description === "Called BCBA")).toBe(true);
  });
});

describe("Authorizations Pass 3 — single Reports page", () => {
  it("authorization_coordinator menu lists exactly one Reports link, /reports", () => {
    const src = read("src/lib/os/roleMenus.ts");
    const startIdx = src.indexOf("authorization_coordinator:");
    expect(startIdx).toBeGreaterThan(-1);
    // Stop at the next role definition (next "  <ident>: {" at 2-space indent).
    const tail = src.slice(startIdx + "authorization_coordinator:".length);
    const stop = tail.search(/\n {2}[a-z_]+:\s*\{/);
    const block = stop >= 0 ? tail.slice(0, stop) : tail;
    expect(block, "authorization_coordinator block not found").toBeDefined();
    if (!block) return;
    const reportsLines = block
      .split("\n")
      .filter((l) => /Reports?/.test(l) && /path:\s*['"`]\//.test(l));
    expect(reportsLines.length).toBeGreaterThan(0);
    for (const line of reportsLines) {
      expect(
        /path:\s*['"`]\/reports['"`]/.test(line),
        `non-canonical reports link in menu: ${line}`,
      ).toBe(true);
    }
  });
});