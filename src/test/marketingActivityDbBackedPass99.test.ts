import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { expandSourceSlugAliases } from "@/lib/marketing/sourceEventMapper";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Marketing Pass 99 — shared activity is DB-backed", () => {
  const AT = "src/lib/activity/activityTimeline.ts";
  const AC = "src/pages/os/communications/ActivityCenter.tsx";
  const CP = "src/pages/os/communications/CommunicationsPages.tsx";
  const INBOX = "src/pages/os/growth/LeadSourceInbox.tsx";
  const JOURNEY = "src/pages/os/growth/PatientLifetimeJourney.tsx";

  it("activityTimeline.ts no longer imports leadSourceEventsStore or seeded mocks", () => {
    const src = read(AT);
    expect(src).not.toMatch(/leadSourceEventsStore/);
    expect(src).not.toMatch(/listLeadSourceEvents/);
    expect(src).not.toMatch(/subscribeLeadSourceEvents/);
    expect(src).not.toMatch(/seededMockEvents/);
  });

  it("activityTimeline exposes a DB-backed feed", () => {
    const src = read(AT);
    expect(src).toMatch(/fetchActivityFeed/);
    expect(src).toMatch(/useActivityFeed/);
    expect(src).toMatch(/marketing_source_events/);
    expect(src).toMatch(/marketing_call_events/);
    expect(src).toMatch(/marketing_email_events/);
  });

  it("Activity Center and User/Patient logs use useActivityFeed", () => {
    expect(read(AC)).toMatch(/useActivityFeed/);
    expect(read(CP)).toMatch(/useActivityFeed/);
    expect(read(AC)).not.toMatch(/buildActivityFeed\(/);
    expect(read(CP)).not.toMatch(/buildActivityFeed\(/);
  });

  it("Marketing production pages still avoid the in-memory source-events store", () => {
    expect(read(INBOX)).not.toMatch(/leadSourceEventsStore/);
    expect(read(JOURNEY)).not.toMatch(/leadSourceEventsStore/);
  });

  it("useMarketingSourceEvents still writes lead_id on convert/attach", () => {
    const hook = read("src/hooks/useMarketingSourceEvents.ts");
    expect(hook).toMatch(/update\.lead_id\s*=/);
    expect(hook).toMatch(/linkLead/);
  });

  it("Source slug aliases expand for legacy + current spellings", () => {
    const ga = expandSourceSlugAliases(["google_ads"]);
    expect(ga).toEqual(expect.arrayContaining(["google_ads", "google-ads"]));
    const fb = expandSourceSlugAliases(["facebook_ads"]);
    expect(fb).toEqual(expect.arrayContaining(["facebook_ads", "meta_ads", "meta-ads"]));
    const retell = expandSourceSlugAliases(["retell"]);
    expect(retell).toEqual(expect.arrayContaining(["retell", "retellai"]));
  });

  it("useSourceStats and SourceEventInbox use expandSourceSlugAliases", () => {
    expect(read("src/hooks/useSourceStats.ts")).toMatch(/expandSourceSlugAliases/);
    expect(read("src/components/marketing/SourceEventInbox.tsx")).toMatch(/expandSourceSlugAliases/);
  });

  it("MarketingReports.tsx remains removed and Reports canonical /reports", () => {
    expect(existsSync("src/pages/os/marketing/MarketingReports.tsx")).toBe(false);
    expect(read("src/App.tsx")).not.toMatch(/MarketingReports/);
  });
});
