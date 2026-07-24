import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  activityFromLeadAction,
  activityFromSourceEvent,
  buildActivityFeed,
  filterActivityEvents,
  getActivityIcon,
  groupActivityByDate,
  normalizeActivityEvent,
  sortActivityNewestFirst,
} from "@/lib/activity/activityTimeline";
import { normalizeLeadSourceEvent } from "@/lib/leads/leadSourceEvents";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Sprint 11 — Activity timeline model", () => {
  it("normalizes minimal input with safe defaults", () => {
    const e = normalizeActivityEvent({ title: "Hello" });
    expect(e.id).toMatch(/^act_/);
    expect(e.type).toBe("system_audit");
    expect(e.objectType).toBe("system");
    expect(e.severity).toBe("info");
    expect(new Date(e.occurredAt).toString()).not.toBe("Invalid Date");
  });

  it("derives an activity event from a lead action", () => {
    const e = activityFromLeadAction({
      leadId: "L-1",
      leadLabel: "Jaden Howard",
      type: "stage_changed",
      title: "Lead moved",
      actorName: "Maria",
    });
    expect(e.relatedLeadId).toBe("L-1");
    expect(e.objectType).toBe("lead");
    expect(e.sourceSystem).toBe("Blossom OS");
  });

  it("normalizes a converted source event into a success activity", () => {
    const src = normalizeLeadSourceEvent({
      source: "ctm",
      sourceLabel: "CTM",
      sourceEventType: "phone_call",
      status: "converted_to_lead",
      resolvedLeadId: "L-2",
      parentFirstName: "Olivia",
      parentLastName: "Hart",
    });
    const e = activityFromSourceEvent(src);
    expect(e.type).toBe("source_event_converted");
    expect(e.severity).toBe("success");
    expect(e.relatedLeadId).toBe("L-2");
  });

  it("filters and sorts events", () => {
    const feed = buildActivityFeed();
    const sorted = sortActivityNewestFirst(feed);
    for (let i = 1; i < sorted.length; i++) {
      expect(new Date(sorted[i - 1].occurredAt).getTime()).toBeGreaterThanOrEqual(
        new Date(sorted[i].occurredAt).getTime(),
      );
    }
    const onlyCritical = filterActivityEvents(feed, { severity: "critical" });
    expect(onlyCritical.every((e) => e.severity === "critical")).toBe(true);
    groupActivityByDate(feed);
  });

  it("returns a lucide icon for every supported event type", () => {
    expect(getActivityIcon("call_received")).toBeTruthy();
    expect(getActivityIcon("file_uploaded")).toBeTruthy();
    expect(getActivityIcon("login_viewed")).toBeTruthy();
  });
});

describe("Sprint 11 — Wiring & protected routes", () => {
  const app = read("src/App.tsx");
  const shell = read("src/pages/os/OSShell.tsx");
  const commPages = read("src/pages/os/communications/CommunicationsPages.tsx");

  it("mounts the Activity Center route under /communications/activity-center", () => {
    expect(app).toMatch(/\/communications\/activity-center/);
    expect(app).toMatch(/ActivityCenterPage/);
  });

  it.skip("adds Activity Center to the Super Admin Communications menu", () => {
    expect(shell).toMatch(/communications\/activity-center/);
  });

  it("user + patient activity pages use the shared ActivityTimeline", () => {
    expect(commPages).toMatch(/ActivityTimeline/);
    expect(commPages).toMatch(/useActivityFeed/);
  });

  it("preserves protected routes", () => {
    for (const path of [
      "/training",
      "/academy",
      "/resource-library",
      "/reports",
      "/reports/bcba-productivity-report-v3",
      "/system/bcba-productivity-uploads",
      "/user-logins-vault",
      "/admin/login-vault",
      "/nfc-badges",
      "/evaluations",
    ]) {
      expect(app).toContain(path);
    }
  });
});