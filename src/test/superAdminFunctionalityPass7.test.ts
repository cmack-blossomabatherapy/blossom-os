import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  getIntegrationSelectOptions,
} from "@/components/system-tools/IntegrationRegistrySelect";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Super Admin — Pass 7 final closeout", () => {
  const pages = read("src/pages/os/system-tools/SystemToolsPages.tsx");
  const hook = read("src/hooks/useSystemTools.ts");
  const panel = read("src/components/executive/SystemRequestsPanel.tsx");

  it("Workflow verification cell shows verified_by_name, falling back to UUID", () => {
    // Primary render prefers the display-name column.
    expect(pages).toMatch(/r\.verified_by_name\s*\?\?\s*r\.verified_by/);
    // The old raw-UUID-only render is gone.
    expect(pages).not.toMatch(/>by \{r\.verified_by\}</);
  });

  it("UUID actor columns still receive user?.id, name columns receive display name", () => {
    expect(pages).toMatch(/verified_by:\s*user\?\.id/);
    expect(pages).toMatch(/closed_by:\s*user\?\.id/);
    expect(pages).toMatch(/verified_by_name:\s*displayName/);
    expect(pages).toMatch(/closed_by_name:\s*displayName/);
  });

  it("Pass 6 workflow/issue audit actions remain present", () => {
    for (const action of [
      "workflow_mark_active", "workflow_mark_needs_review", "workflow_mark_deprecated",
      "workflow_verified", "workflow_owner_assigned",
      "issue_triaged", "issue_started", "issue_blocked",
      "issue_resolved", "issue_reopened", "issue_owner_assigned",
      "request_converted_to_tracked_issue",
    ]) {
      expect(pages).toMatch(new RegExp(`"${action}"`));
    }
    expect(hook).toMatch(/"workflow_created"/);
    expect(hook).toMatch(/"issue_created"/);
  });

  it("IntegrationRegistrySelect remains used for workflows, issues, and request intake", () => {
    expect(pages).toMatch(/IntegrationRegistrySelect/);
    expect(panel).toMatch(/IntegrationRegistrySelect/);
  });

  it("Make.com / internal-only integrations remain excluded from the selector", () => {
    const ids = getIntegrationSelectOptions().map((o) => o.id);
    expect(ids).not.toContain("make");
  });
});