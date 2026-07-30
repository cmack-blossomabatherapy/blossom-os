/**
 * CTM ingestion correctness — fixture coverage for the shared qualification
 * rules plus wiring assertions that every ingest path calls them.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  qualifyCtmCall,
  resolveCtmLeadMatch,
  CTM_QUALIFICATION_STATES,
  DEFAULT_MIN_DURATION_SECONDS,
} from "@/lib/intake/ctmQualification";

const CONFIG = {
  trackingNumbers: ["(770) 555-0100"],
  campaigns: ["Intake Google"],
  excludedTags: ["spam", "internal"],
  excludedNumbers: ["+14045550001"],
  minDurationSeconds: 20,
};

const base = {
  ctm_call_id: "call-1",
  direction: "inbound",
  from_number: "+14045551234",
  tracking_number: "7705550100",
  duration_seconds: 120,
  talk_time_seconds: 90,
  tags: [] as string[],
  campaign_name: "Intake Google",
};

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("CTM qualification fixtures", () => {
  it("qualifies a real intake call", () => {
    const r = qualifyCtmCall(base, CONFIG);
    expect(r.state).toBe("eligible");
    expect(r.reason).toBe("qualified");
  });

  it("is deterministic on duplicate retry of the same payload", () => {
    expect(qualifyCtmCall(base, CONFIG)).toEqual(qualifyCtmCall({ ...base }, CONFIG));
  });

  it("links a unique identifier match without creating a lead", () => {
    expect(resolveCtmLeadMatch({ identifierMatches: ["lead-a"] })).toEqual({
      action: "link_existing", leadId: "lead-a", via: "identifier",
    });
  });

  it("never guesses between multiple matches", () => {
    const r = resolveCtmLeadMatch({ identifierMatches: ["lead-a", "lead-b"] });
    expect(r).toMatchObject({ action: "review", state: "ambiguous_review", reason: "multiple_matches" });
  });

  it("prefers provenance over identifier matches", () => {
    expect(resolveCtmLeadMatch({ provenanceLeadId: "lead-x", identifierMatches: ["a", "b"] }))
      .toMatchObject({ action: "link_existing", leadId: "lead-x", via: "provenance" });
  });

  it("sends calls with no phone or email to review", () => {
    const r = qualifyCtmCall({ ...base, from_number: null, caller_email: null }, CONFIG);
    expect(r.state).toBe("incomplete_review");
    expect(r.reason).toBe("missing_identifier");
  });

  it("excludes calls off configured tracking numbers and campaigns", () => {
    const r = qualifyCtmCall({ ...base, tracking_number: "2125559999", to_number: "2125559999", campaign_name: "Careers" }, CONFIG);
    expect(r).toMatchObject({ state: "excluded", reason: "not_intake_routing" });
  });

  it("excludes spam and internal tagged calls", () => {
    expect(qualifyCtmCall({ ...base, tags: ["Spam"] }, CONFIG)).toMatchObject({ state: "excluded", reason: "excluded_tag" });
    expect(qualifyCtmCall({ ...base, tags: ["internal transfer"] }, CONFIG)).toMatchObject({ state: "excluded", reason: "excluded_tag" });
  });

  it("excludes blocked caller numbers", () => {
    expect(qualifyCtmCall({ ...base, from_number: "404-555-0001" }, CONFIG))
      .toMatchObject({ state: "excluded", reason: "excluded_number" });
  });

  it("excludes calls shorter than the configured minimum", () => {
    expect(qualifyCtmCall({ ...base, talk_time_seconds: 5 }, CONFIG))
      .toMatchObject({ state: "excluded", reason: "too_short" });
  });

  it("falls back to the built-in minimum duration when unconfigured", () => {
    expect(qualifyCtmCall({ ...base, talk_time_seconds: DEFAULT_MIN_DURATION_SECONDS - 1 }, {}))
      .toMatchObject({ state: "excluded", reason: "too_short" });
    expect(qualifyCtmCall({ ...base, talk_time_seconds: DEFAULT_MIN_DURATION_SECONDS }, {}).state).toBe("eligible");
  });

  it("excludes outbound calls", () => {
    expect(qualifyCtmCall({ ...base, direction: "outbound" }, CONFIG))
      .toMatchObject({ state: "excluded", reason: "not_inbound" });
  });

  it("reports malformed events and missing call ids as errors", () => {
    expect(qualifyCtmCall(null, CONFIG)).toMatchObject({ state: "error", reason: "malformed_payload" });
    expect(qualifyCtmCall({ ...base, ctm_call_id: null }, CONFIG)).toMatchObject({ state: "error", reason: "missing_call_id" });
  });

  it("exposes every persisted outcome state", () => {
    expect(CTM_QUALIFICATION_STATES).toEqual([
      "eligible", "excluded", "ambiguous_review", "incomplete_review", "error",
    ]);
  });
});

describe("CTM qualification has a single source", () => {
  it("client module only re-exports the shared core", () => {
    const src = read("src/lib/intake/ctmQualification.ts");
    expect(src).toMatch(/export \* from "\.\.\/\.\.\/\.\.\/supabase\/functions\/_shared\/ctm\/qualificationCore"/);
    expect(src).not.toMatch(/function qualifyCtmCall/);
  });

  it("edge module re-exports the shared core and owns only backend helpers", () => {
    const src = read("supabase/functions/_shared/ctm/qualification.ts");
    expect(src).toMatch(/export \* from "\.\/qualificationCore\.ts"/);
    expect(src).not.toMatch(/function qualifyCtmCall/);
    expect(src).toMatch(/loadCtmQualificationSettings/);
  });
});

describe("every CTM ingest path qualifies before link/create", () => {
  const paths = [
    "supabase/functions/ctm-webhook/index.ts",
    "supabase/functions/ctm-sync/index.ts",
    "supabase/functions/ctm-historical-import/index.ts",
    "supabase/functions/ctm-link-call/index.ts",
    "supabase/functions/ctm-retry-event/index.ts",
    "supabase/functions/integration-webhook/index.ts",
  ];

  it.each(paths)("%s imports shared qualification", (p) => {
    const src = read(p);
    expect(src).toMatch(/_shared\/ctm\/qualification\.ts/);
    expect(src).toMatch(/qualifyCtmCall\(/);
    expect(src).toMatch(/recordCtmQualification\(/);
  });

  it.each(paths.filter((p) => p !== "supabase/functions/integration-webhook/index.ts"))(
    "%s only links/creates for eligible calls",
    (p) => {
      const src = read(p);
      expect(src).toMatch(/qualification\.state (===|!==) "eligible"/);
    },
  );

  it("manual review decisions are audited on the same trail", () => {
    const src = read("supabase/functions/ctm-review-action/index.ts");
    expect(src).toMatch(/recordCtmQualification/);
    expect(src).toMatch(/source: "manual_review"/);
  });

  it("audits eligible outcomes too, with integration + provider ids", () => {
    const src = read("supabase/functions/_shared/ctm/qualification.ts");
    expect(src).not.toMatch(/if \(result\.state === "eligible"\) return;/);
    expect(src).toMatch(/integration_id: "ctm"/);
    expect(src).toMatch(/provider_event_id: input\.ctmCallId/);
    expect(src).toMatch(/onConflict: "ctm_call_id,source,state,reason"/);
  });

  it("config loader reads backend settings and surfaces default fallbacks", () => {
    const src = read("supabase/functions/_shared/ctm/qualification.ts");
    expect(src).toMatch(/intake_ctm_qualification_config/);
    expect(src).toMatch(/ctm_number_mapping/);
    expect(src).toMatch(/defaultsApplied/);
    expect(src).toMatch(/configured/);
  });
});
