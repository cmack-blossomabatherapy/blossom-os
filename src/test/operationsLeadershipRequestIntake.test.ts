import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Operations Leadership — Request Intake pass", () => {
  const panel = read("src/components/executive/SystemRequestsPanel.tsx");
  const page = read("src/pages/os/system-tools/SystemToolsPages.tsx");
  const hook = read("src/hooks/useSystemTools.ts");

  it("SystemIssue type includes the new intake fields", () => {
    for (const field of [
      "request_type", "affected_department", "affected_role",
      "affected_state", "affected_route", "impact", "desired_outcome",
      "due_date", "linked_work_item_id", "metadata",
    ]) {
      expect(hook).toMatch(new RegExp(`\\b${field}\\??:`));
    }
  });

  it("RequestDialog collects every required intake field", () => {
    for (const label of [
      "Title", "Request type", "Category / area", "Priority", "Status",
      "Affected department", "Affected role", "Affected state",
      "Affected route / page", "Impact", "Desired outcome",
      "Due date", "Owner / assignee", "Description / notes",
    ]) {
      expect(panel, `dialog missing "${label}"`).toContain(label);
    }
  });

  it("Panel exposes filters for status/priority/department/state and search", () => {
    for (const marker of ["All statuses", "All priorities", "All departments", "All states"]) {
      expect(panel).toContain(marker);
    }
    expect(panel).toMatch(/placeholder="Search title/);
  });

  it("Request Intake page header uses the SubmitSystemRequestButton", () => {
    expect(page).toMatch(/import\s*\{[^}]*SubmitSystemRequestButton[^}]*\}\s*from\s*"@\/components\/executive\/SystemRequestsPanel"/);
    expect(page).toMatch(/actions=\{<SubmitSystemRequestButton\s*\/>\}/);
  });

  it("Convert to Work Queue creates operations_work_items and logs the event", () => {
    expect(panel).toMatch(/convertToWorkQueue/);
    expect(panel).toMatch(/\.from\("operations_work_items"\)[\s\S]*\.insert\(/);
    expect(panel).toMatch(/\.from\("operations_work_item_events"\)[\s\S]*\.insert\([\s\S]*event_type:\s*"system_request_converted_to_work_item"/);
    expect(panel).toMatch(/linked_work_item_id:\s*workItemId/);
    expect(panel).toMatch(/action:\s*"convert_to_work_queue"/);
  });

  it("Row action links to the linked Work Queue item with ?selected=", () => {
    expect(panel).toMatch(/\/work-queue\?selected=\$\{i\.linked_work_item_id\}/);
  });

  it("Convert menu prefers Operations Work Queue and keeps workflow inventory as secondary", () => {
    const idx = panel.indexOf("Convert request");
    expect(idx).toBeGreaterThan(0);
    const workQueueAt = panel.indexOf("To Operations Work Queue", idx);
    const workflowAt = panel.indexOf("convert to workflow inventory", idx);
    expect(workQueueAt).toBeGreaterThan(0);
    expect(workflowAt).toBeGreaterThan(workQueueAt);
  });

  it("No user-facing normal menu still points at /reports/progress-reports", () => {
    const files = [
      "src/lib/os/workspaces.ts",
      "src/lib/os/roleMenus.ts",
      "src/pages/os/clinical/ClinicalDirectorDashboard.tsx",
    ];
    for (const f of files) {
      expect(read(f), `${f} still references /reports/progress-reports`)
        .not.toMatch(/path:\s*"\/reports\/progress-reports"|to:\s*"\/reports\/progress-reports"/);
    }
  });
});