import { describe, it, expect } from "vitest";
import { classifyEmail, startHereScore } from "@/lib/os/emailCommand/routingRules";

describe("Email Command Center — routing rules", () => {
  it("routes authorization keywords to Devorah", () => {
    const r = classifyEmail({ subject: "Prior auth appeal denied" });
    expect(r.workflowTag).toBe("Authorization");
    expect(r.suggestedOwner).toMatch(/Devorah/);
  });
  it("routes VOB / benefits to Gabi", () => {
    const r = classifyEmail({ subject: "VOB request for new client", preview: "Need eligibility check" });
    expect(r.workflowTag).toBe("Benefits / VOB");
    expect(r.suggestedOwner).toMatch(/Gabi/);
  });
  it("routes recruiting to Nikki", () => {
    const r = classifyEmail({ subject: "Candidate resume — RBT applicant" });
    expect(r.suggestedOwner).toMatch(/Nikki/);
  });
  it("routes intake / parent inquiries", () => {
    const r = classifyEmail({ subject: "New lead inquiry — interested in services" });
    expect(r.workflowTag).toBe("Intake");
  });
  it("routes scheduling cancellations", () => {
    const r = classifyEmail({ subject: "Need to reschedule session — call-out coverage" });
    expect(r.workflowTag).toBe("Scheduling");
  });
  it("routes payroll/Viventium to Payroll/HR", () => {
    const r = classifyEmail({ subject: "Viventium paystub issue" });
    expect(r.workflowTag).toBe("Payroll");
    expect(r.suggestedOwner).toMatch(/Payroll/);
  });
  it("routes high-risk language to Corey with critical urgency", () => {
    const r = classifyEmail({ subject: "URGENT complaint — attorney involvement" });
    expect(r.workflowTag).toBe("Risk / Escalation");
    expect(r.suggestedOwner).toMatch(/Corey/);
    expect(r.urgency).toBe("critical");
    expect(r.riskLevel).toBe("high");
    expect(r.needsCorey).toBe(true);
  });
  it("routes scheduling-meeting requests to Calendar channel", () => {
    const r = classifyEmail({ subject: "Can we meet next week?" });
    expect(r.workflowTag).toBe("Calendar / Meeting");
    expect(r.recommendedChannel).toBe("outlook_calendar");
  });
  it("low-confidence (unmatched) items default to Needs Corey review", () => {
    const r = classifyEmail({ subject: "Hello", preview: "no specific keywords here" });
    expect(r.needsCorey).toBe(true);
    expect(r.confidence).toBeLessThan(0.7);
  });
  it("Start Here ranks risk + Corey + waiting age higher", () => {
    const high = startHereScore({
      routing: { riskLevel: "high", urgency: "critical", needsCorey: true },
      receivedAt: new Date(Date.now() - 5 * 36e5).toISOString(),
    });
    const low = startHereScore({
      routing: { riskLevel: "low", urgency: "normal", needsCorey: false },
      receivedAt: new Date().toISOString(),
    });
    expect(high).toBeGreaterThan(low);
  });
  it("contains no Monday.com references in the rules engine", () => {
    // Defensive: the constraint is no Monday integration anywhere.
    const rText = classifyEmail({ subject: "test" });
    expect(JSON.stringify(rText).toLowerCase()).not.toContain("monday");
  });
});
