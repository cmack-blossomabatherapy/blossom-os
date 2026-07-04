import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Business Development — Completion Pass 3 (source handoff close-the-loop)", () => {
  const dashboard = read("src/pages/os/growth/BusinessDevelopmentDashboard.tsx");

  it("retains the source event id when Create Partner is triggered from a handoff", () => {
    expect(dashboard).toMatch(/pendingSourceEventId/);
    expect(dashboard).toMatch(/setPendingSourceEventId\(eventId \?\? null\)/);
    // The Create Partner button in the handoff row passes ev.id to the callback.
    expect(dashboard).toMatch(/onCreatePartnerFromEvent\(buildPartnerPrefill\(ev\), ev\.id\)/);
  });

  it("handleAddPartner captures the createCompany return value", () => {
    expect(dashboard).toMatch(/const created = await createCompany\(input\)/);
  });

  it("after partner creation, code calls bd_link_source_event_to_referral with the new company id", () => {
    expect(dashboard).toMatch(
      /rpc\("bd_link_source_event_to_referral",\s*\{\s*_event_id:\s*eventId,\s*_company_id:\s*created\.id,?\s*\}/,
    );
  });

  it("shows the required success / warning toasts for the linked flow", () => {
    expect(dashboard).toContain("Partner created and source handoff linked.");
    expect(dashboard).toContain(
      "Partner created, but the source handoff could not be linked. Use Link to Existing Partner to finish the handoff.",
    );
  });

  it("does not auto-mark the source event reviewed as part of Create Partner", () => {
    // The link call above passes only _event_id and _company_id.
    // bd_mark_source_event_reviewed must not be invoked from handleAddPartner.
    const handler = dashboard.slice(
      dashboard.indexOf("const handleAddPartner"),
      dashboard.indexOf("const handleUpdatePartner"),
    );
    expect(handler).not.toMatch(/bd_mark_source_event_reviewed/);
  });

  it("SourceHandoffsPanel and HandoffQueue are task-aware", () => {
    // SourceHandoffsPanel accepts tasks and forwards them to HandoffQueue.
    expect(dashboard).toMatch(
      /function SourceHandoffsPanel\(\{[\s\S]*?tasks,[\s\S]*?\}: \{ partners: ReferralCompany\[\]; outreach: ReferralActivity\[\]; tasks: ReferralCrmTask\[\] \}/,
    );
    expect(dashboard).toMatch(/<HandoffQueue[\s\S]*?tasks=\{tasks\}/);
    // HandoffQueue destructures tasks and includes it in its typed props.
    expect(dashboard).toMatch(/function HandoffQueue\(\{[\s\S]*?tasks,[\s\S]*?\}: \{[\s\S]*?tasks: ReferralCrmTask\[\];/);
  });

  it("deriveHandoffStatus references tasks and returns the new Follow-up scheduled state", () => {
    expect(dashboard).toMatch(
      /function deriveHandoffStatus\(\s*ev: MarketingSourceEventRow,\s*outreach: ReferralActivity\[\],\s*tasks: ReferralCrmTask\[\][^)]*\)/,
    );
    expect(dashboard).toContain('"Follow-up scheduled"');
    expect(dashboard).toMatch(/hasOpenFollowUp/);
  });

  it("PartnerDialog uses useEffect (not useMemo) to prefill form state", () => {
    const dialog = dashboard.slice(
      dashboard.indexOf("function PartnerDialog("),
      dashboard.indexOf("function OutreachDialog("),
    );
    // The prefill sync block must use useEffect, not useMemo.
    expect(dialog).toMatch(/useEffect\(\(\) => \{\s*if \(open && initial\)/);
    expect(dialog).not.toMatch(/useMemo\(\(\) => \{\s*if \(open && initial\)/);
  });

  it("bd_link_source_event_to_referral RPC validates event, company, and contact", () => {
    const migDir = "supabase/migrations";
    const files = fs.readdirSync(migDir).filter((f) => f.endsWith(".sql"));
    const combined = files.map((f) => fs.readFileSync(path.join(migDir, f), "utf8")).join("\n");
    // Latest hardened RPC body validates all three inputs and raises clear errors.
    expect(combined).toMatch(/source event % not found/);
    expect(combined).toMatch(/referral partner % not found/);
    expect(combined).toMatch(/referral contact % not found/);
    expect(combined).toMatch(/does not belong to partner/);
    // Access rule reused, not widened to broad marketing writes.
    expect(combined).toMatch(/can_act_on_bd_source_events\(v_uid\)/);
  });
});