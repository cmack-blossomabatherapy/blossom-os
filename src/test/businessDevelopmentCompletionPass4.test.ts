import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const dash = readFileSync(
  resolve(__dirname, "../pages/os/growth/BusinessDevelopmentDashboard.tsx"),
  "utf8",
);

function latestRpcMigration(): string {
  const dir = resolve(__dirname, "../../supabase/migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .reverse();
  for (const f of files) {
    const body = readFileSync(resolve(dir, f), "utf8");
    if (body.includes("FUNCTION public.bd_link_source_event_to_referral")) {
      return body;
    }
  }
  throw new Error("bd_link_source_event_to_referral migration not found");
}

describe("BD Pass 4 — final data correctness & queue filters", () => {
  it("RPC sets sync_status = 'linked' directly, not COALESCE(sync_status, 'linked')", () => {
    const sql = latestRpcMigration();
    expect(sql).toMatch(/sync_status\s*=\s*'linked'/);
    expect(sql).not.toMatch(/sync_status\s*=\s*COALESCE\s*\(\s*sync_status\s*,\s*'linked'\s*\)/);
  });

  it("status filter dropdown exposes every operational status", () => {
    for (const val of [
      "all",
      "new",
      "assigned",
      "linked",
      "needs_followup",
      "followup_scheduled",
      "reviewed",
      "stale",
    ]) {
      expect(dash).toMatch(new RegExp(`<SelectItem value="${val}"`));
    }
    for (const label of [
      "All statuses",
      "New / Needs BD review",
      "Assigned",
      "Linked / Outreach needed",
      "Needs follow-up plan",
      "Follow-up scheduled",
      "Reviewed",
      "Stale handoff",
    ]) {
      expect(dash).toContain(label);
    }
  });

  it("status filter logic maps each option to its derived status", () => {
    expect(dash).toMatch(/case "new":\s*return r\.derived === "New \/ Needs BD review"/);
    expect(dash).toMatch(/case "stale":\s*return r\.derived === "Stale handoff"/);
    expect(dash).toMatch(/case "assigned":\s*return r\.derived === "Assigned"/);
    expect(dash).toMatch(/case "linked":\s*return r\.derived === "Linked \/ Outreach needed"/);
    expect(dash).toMatch(/case "needs_followup":\s*return r\.derived === "Needs follow-up plan"/);
    expect(dash).toMatch(/case "followup_scheduled":\s*return r\.derived === "Follow-up scheduled"/);
    expect(dash).toMatch(/case "reviewed":\s*return r\.derived === "Reviewed"/);
  });

  it("row suggestions exist for stale, follow-up scheduled, and reviewed states", () => {
    expect(dash).toContain("Review and assign immediately");
    expect(dash).toContain("Work next scheduled follow-up");
    expect(dash).toMatch(/derived === "Reviewed"\s*\?\s*"Reviewed"/);
  });

  it("OutreachDialog uses useEffect (not useMemo) for setForm prefill", () => {
    const start = dash.indexOf("function OutreachDialog(");
    expect(start).toBeGreaterThan(-1);
    const end = dash.indexOf("\nfunction ", start + 1);
    const body = dash.slice(start, end === -1 ? undefined : end);
    expect(body).toMatch(/useEffect\(\(\)\s*=>\s*\{[\s\S]*setForm\(/);
    expect(body).not.toMatch(/useMemo\(\(\)\s*=>\s*\{[\s\S]*setForm\(/);
  });
});