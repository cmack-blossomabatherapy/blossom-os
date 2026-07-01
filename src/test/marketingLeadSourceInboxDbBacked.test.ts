import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Marketing — Lead Source Inbox is Supabase-backed", () => {
  const INBOX = "src/pages/os/growth/LeadSourceInbox.tsx";
  const JOURNEY = "src/pages/os/growth/PatientLifetimeJourney.tsx";

  it("LeadSourceInbox.tsx does not import the in-memory leadSourceEventsStore", () => {
    expect(read(INBOX)).not.toMatch(/leadSourceEventsStore/);
  });

  it("PatientLifetimeJourney.tsx does not import the in-memory leadSourceEventsStore", () => {
    expect(read(JOURNEY)).not.toMatch(/leadSourceEventsStore/);
  });

  it("LeadSourceInbox uses the useMarketingSourceEvents hook (queries marketing_source_events)", () => {
    const src = read(INBOX);
    expect(src).toMatch(/useMarketingSourceEvents/);
    const hook = read("src/hooks/useMarketingSourceEvents.ts");
    expect(hook).toMatch(/from\("marketing_source_events"\)/);
  });

  it("LeadSourceInbox updates marketing_source_events.lead_id when converting/attaching", () => {
    const src = read(INBOX);
    // linkLead(id, leadId, status) with converted_to_lead + attached_to_existing_lead
    expect(src).toMatch(/linkLead\([^)]*converted_to_lead/);
    expect(src).toMatch(/linkLead\([^)]*attached_to_existing_lead/);
    const hook = read("src/hooks/useMarketingSourceEvents.ts");
    expect(hook).toMatch(/update\.lead_id\s*=/);
  });

  it("PatientLifetimeJourney reads marketing_source_events, marketing_call_events, and marketing_email_events", () => {
    const src = read(JOURNEY);
    expect(src).toMatch(/useLeadMarketingActivity/);
    const hook = read("src/hooks/useLeadMarketingActivity.ts");
    expect(hook).toMatch(/from\("marketing_source_events"\)/);
    expect(hook).toMatch(/from\("marketing_call_events"\)/);
    expect(hook).toMatch(/from\("marketing_email_events"\)/);
  });

  it("Source-specific pages pass ?source=<slug> into the Lead Source Inbox link", () => {
    const actions = read("src/components/marketing/LeadSourceActions.tsx");
    expect(actions).toMatch(/\/marketing\/lead-source-inbox\?source=/);
  });

  it("Lead Source Inbox route uses MARKETING_ROLES (no business_development)", () => {
    const app = read("src/App.tsx");
    const match = app.match(
      /<Route\s+path="\/marketing\/lead-source-inbox"[\s\S]*?<\/PermissionRoute>/,
    );
    expect(match).not.toBeNull();
    expect(match![0]).toMatch(/\[\.\.\.MARKETING_ROLES\]/);
    expect(match![0]).not.toMatch(/MARKETING_ROLES_WITH_BD/);
  });

  it("MarketingReports.tsx stays removed and unimported", () => {
    expect(fs.existsSync("src/pages/os/marketing/MarketingReports.tsx")).toBe(false);
    expect(read("src/App.tsx")).not.toMatch(/MarketingReports/);
  });

  it("Marketing production pages do not import mock data arrays", () => {
    const files = [
      "src/pages/os/growth/LeadSourceInbox.tsx",
      "src/pages/os/growth/PatientLifetimeJourney.tsx",
      "src/pages/os/marketing/CallTracking.tsx",
      "src/pages/os/marketing/Campaigns.tsx",
      "src/pages/os/marketing/CommunityOutreach.tsx",
      "src/pages/os/marketing/EmailMarketing.tsx",
    ];
    for (const f of files) {
      if (!fs.existsSync(f)) continue;
      const src = read(f);
      expect(src, `${f} imports mockLeads`).not.toMatch(/from\s+["'][^"']*mockLeads["']/);
      expect(src, `${f} imports mockPhoneCalls`).not.toMatch(/mockPhoneCalls/);
      expect(src, `${f} imports mockCandidates`).not.toMatch(/mockCandidates/);
    }
  });
});