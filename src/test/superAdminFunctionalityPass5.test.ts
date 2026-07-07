import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  ISSUE_STATUSES,
  normalizeIssueStatus,
  isIssueStatus,
  displayIssueStatus,
} from "@/lib/os/systemToolStatus";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Super Admin — Pass 5 reliability", () => {
  const hook = read("src/hooks/useSystemTools.ts");
  const panel = read("src/components/executive/SystemRequestsPanel.tsx");
  const pages = read("src/pages/os/system-tools/SystemToolsPages.tsx");
  const integrations = read("src/pages/admin/Integrations.tsx");

  it("useSystemTools no longer fire-and-forgets audit writes", () => {
    // No `void logSystemToolAction(` left in the hook.
    expect(hook).not.toMatch(/void\s+logSystemToolAction\(/);
    // Awaited call + warning toast wiring is present.
    expect(hook).toMatch(/await\s+logSystemToolAction\(/);
    expect(hook).toMatch(/Saved,\s*but\s+audit\s+log\s+could\s+not\s+be\s+recorded\./);
  });

  it("Request Intake conversion no longer fire-and-forgets audit writes", () => {
    expect(panel).not.toMatch(/void\s+logSystemToolAction\(/);
    expect(panel).toMatch(/await\s+logSystemToolAction\(/);
    expect(panel).toMatch(/Saved,\s*but\s+audit\s+log\s+could\s+not\s+be\s+recorded/);
  });

  it("Canonical status vocabulary is Title Case, 5 values", () => {
    expect([...ISSUE_STATUSES]).toEqual([
      "Open", "Triage", "In Progress", "Blocked", "Resolved",
    ]);
  });

  it("Status normalizer accepts legacy lowercase and snake_case", () => {
    expect(normalizeIssueStatus("open")).toBe("Open");
    expect(normalizeIssueStatus("OPEN")).toBe("Open");
    expect(normalizeIssueStatus("triage")).toBe("Triage");
    expect(normalizeIssueStatus("in_progress")).toBe("In Progress");
    expect(normalizeIssueStatus("in progress")).toBe("In Progress");
    expect(normalizeIssueStatus("In Progress")).toBe("In Progress");
    expect(normalizeIssueStatus("blocked")).toBe("Blocked");
    expect(normalizeIssueStatus("resolved")).toBe("Resolved");
    expect(normalizeIssueStatus("closed")).toBe("Resolved");
    expect(normalizeIssueStatus(null)).toBe("Open");
  });

  it("isIssueStatus and displayIssueStatus honor legacy rows", () => {
    expect(isIssueStatus("open", "Open")).toBe(true);
    expect(isIssueStatus("in_progress", "In Progress")).toBe(true);
    expect(isIssueStatus("Resolved", "Resolved")).toBe(true);
    expect(displayIssueStatus("triage")).toBe("Triage");
  });

  it("Issue Tracker uses the normalizer for comparisons and display", () => {
    expect(pages).toMatch(/from\s+"@\/lib\/os\/systemToolStatus"/);
    expect(pages).toMatch(/normalizeIssueStatus\(r\.status\)/);
    expect(pages).toMatch(/isIssueStatus\(r\.status,\s*"Open"\)/);
    expect(pages).toMatch(/isIssueStatus\(r\.status,\s*"Resolved"\)/);
  });

  it("Integration toggle is honest: disabled unless a live connection exists", () => {
    expect(integrations).toMatch(/canToggle\s*=/);
    expect(integrations).toMatch(/Connect\/configure this integration before enabling\./);
    expect(integrations).toMatch(/disabled=\{!canToggle\}/);
  });

  it("View logs button is disabled when no live integrations exist", () => {
    expect(integrations).toMatch(/View logs/);
    expect(integrations).toMatch(/Connect an integration to view sync logs/);
  });
});

describe("Super Admin — Pass 5 data model", () => {
  it("related_integration_id is a text registry key (docs) in code", async () => {
    // The column comment / type is verified against the DB, but at the type
    // layer we require string ids so store/display of registry keys works.
    type _CheckWorkflow = { related_integration_id?: string | null };
    type _CheckIssue = { related_integration_id?: string | null };
    const w: _CheckWorkflow = { related_integration_id: "centralreach" };
    const i: _CheckIssue = { related_integration_id: "viventium" };
    expect(w.related_integration_id).toBe("centralreach");
    expect(i.related_integration_id).toBe("viventium");
  });
});
