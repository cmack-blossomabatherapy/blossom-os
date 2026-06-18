import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  normalizeLeadSourceEvent,
  eventToLeadDefaults,
  findPossibleLeadMatches,
  getDuplicateScore,
  getEventPriority,
  getEventDisplayName,
  getEventSourceBadge,
  shouldRequireReview,
  shouldAutoCreateLead,
} from "@/lib/leads/leadSourceEvents";
import type { Lead } from "@/data/leads";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const lead = (over: Partial<Lead> = {}): Lead =>
  ({
    id: "lead-1",
    childName: "Eli Martinez",
    parentName: "Sofia Martinez",
    phone: "404-555-0182",
    email: "sofia@example.com",
    state: "GA",
    source: "CTM",
    status: "New Lead",
    owner: "Sarah M.",
    priority: "Warm",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    daysInStage: 0,
    tasks: [], timeline: [], automationLog: [], documents: [], tags: [],
    ...over,
  } as unknown as Lead);

describe("Sprint 10 — Lead Source Event helpers", () => {
  it("normalizes events with defaults", () => {
    const e = normalizeLeadSourceEvent({ source: "CTM", phone: " 404 555 0182 " });
    expect(e.id).toBeTruthy();
    expect(e.status).toBe("new");
    expect(e.sourceLabel).toMatch(/CTM/);
    expect(e.phone).toBe("404 555 0182");
  });

  it("builds lead defaults preserving source metadata", () => {
    const e = normalizeLeadSourceEvent({
      source: "Facebook Ads",
      sourceEventType: "ad_lead",
      parentFirstName: "Megan", parentLastName: "Williams",
      childFirstName: "Ava",
      phone: "615-555-0140", state: "TN",
      campaign: "TN Parents", externalId: "fb_1",
    });
    const d = eventToLeadDefaults(e);
    expect(d.leadSource).toBe("Facebook Ads");
    expect(d.childName).toBe("Ava");
    expect(d.parentName).toContain("Megan");
    expect(d.state).toBe("TN");
    expect(d.sourceMetadata.source_event_id).toBe(e.id);
    expect(d.sourceMetadata.external_id).toBe("fb_1");
    expect(d.sourceMetadata.integration_id).toBe("meta-ads");
  });

  it("scores duplicates by phone, email, name, state", () => {
    const e = normalizeLeadSourceEvent({
      source: "CTM", parentFirstName: "Sofia", parentLastName: "Martinez",
      childFirstName: "Eli", childLastName: "Martinez",
      phone: "404-555-0182", state: "GA",
    });
    const m = getDuplicateScore(e, lead());
    expect(m.score).toBeGreaterThan(0.5);
    expect(m.reasons.some((r) => /phone/i.test(r))).toBe(true);
    const matches = findPossibleLeadMatches(e, [lead(), lead({ id: "x", phone: "", email: "" })]);
    expect(matches[0].leadId).toBe("lead-1");
  });

  it("classifies priority + review flags + display name", () => {
    const phoneEvt = normalizeLeadSourceEvent({ source: "CTM", sourceEventType: "phone_call", phone: "1" });
    expect(getEventPriority(phoneEvt)).toBe("high");
    expect(getEventDisplayName(phoneEvt)).toBeTruthy();
    expect(getEventSourceBadge(phoneEvt).origin).toBe("CTM");
    const blank = normalizeLeadSourceEvent({ source: "Other", sourceEventType: "web_form" });
    expect(shouldRequireReview(blank)).toBe(true);
    expect(shouldAutoCreateLead(blank)).toBe(false);
  });
});

describe("Sprint 10 — Inbox wiring", () => {
  it("route + menu reference the inbox", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/path="\/marketing\/lead-source-inbox"[\s\S]*LeadSourceInbox/);
    const shell = read("src/pages/os/OSShell.tsx");
    expect(shell).toContain("/marketing/lead-source-inbox");
    expect(shell).toContain("Lead Source Inbox");
  });

  it("inbox page uses shared lead source config + integration registry", () => {
    const src = read("src/pages/os/growth/LeadSourceInbox.tsx");
    expect(src).toContain("LEAD_SOURCE_OPTIONS");
    expect(src).toContain("BLOSSOM_INTEGRATIONS");
    expect(src).toContain("eventToLeadDefaults");
    expect(src).toContain("findPossibleLeadMatches");
    expect(src).toMatch(/Convert to lead/i);
    expect(src).toMatch(/Attach to existing/i);
    expect(src).toMatch(/Integration readiness/i);
  });

  it("Patient Journey reads source events + supports sourceEventId param", () => {
    const src = read("src/pages/os/growth/PatientLifetimeJourney.tsx");
    expect(src).toContain("getEventsForLead");
    expect(src).toContain("sourceEventId");
    expect(src).toContain("Source events");
  });

  it("protected routes still present", () => {
    const app = read("src/App.tsx");
    [
      "/training", "/academy", "/resource-library", "/reports",
      "/reports/bcba-productivity-report-v3",
      "/system/bcba-productivity-uploads",
      "/user-logins-vault", "/admin/login-vault",
      "/nfc-badges", "/evaluations", "/patient-journey", "/leads/:id",
    ].forEach((r) => expect(app, `route ${r} missing`).toContain(r));
  });
});