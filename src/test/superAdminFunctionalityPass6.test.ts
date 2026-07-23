import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  BLOSSOM_INTEGRATIONS,
} from "@/lib/os/integrations/integrationRegistry";
import {
  getIntegrationSelectOptions,
  NONE_INTEGRATION_VALUE,
} from "@/components/system-tools/IntegrationRegistrySelect";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Super Admin — Pass 6 closeout", () => {
  const pages = read("src/pages/os/system-tools/SystemToolsPages.tsx");
  const hook = read("src/hooks/useSystemTools.ts");
  const panel = read("src/components/executive/SystemRequestsPanel.tsx");
  const integrations = read("src/pages/admin/Integrations.tsx");
  const backend = read("src/lib/os/integrations/backend.ts");

  it("UUID actor columns never receive display names", () => {
    expect(pages).not.toMatch(/verified_by:\s*displayName/);
    expect(pages).not.toMatch(/closed_by:\s*displayName/);
    // The correct pattern: uuid comes from the auth user id.
    expect(pages).toMatch(/verified_by:\s*user\?\.id/);
    expect(pages).toMatch(/closed_by:\s*user\?\.id/);
    // Optional display-name mirror columns are used when writing.
    expect(pages).toMatch(/verified_by_name:\s*displayName/);
    expect(pages).toMatch(/closed_by_name:\s*displayName/);
  });

  it("Workflow quick actions emit specific audit action names", () => {
    expect(pages).toMatch(/"workflow_mark_active"/);
    expect(pages).toMatch(/"workflow_mark_needs_review"/);
    expect(pages).toMatch(/"workflow_mark_deprecated"/);
    expect(pages).toMatch(/"workflow_verified"/);
    expect(pages).toMatch(/"workflow_owner_assigned"/);
    // Default create/delete actions in the hook are specific too.
    expect(hook).toMatch(/"workflow_created"/);
    expect(hook).toMatch(/"workflow_deleted"/);
    expect(hook).toMatch(/"workflow_updated"/);
    // No generic status_change action is emitted from the hook anymore.
    expect(hook).not.toMatch(/action:\s*isStatusChange\s*\?\s*"status_change"/);
  });

  it("Issue Tracker quick actions emit specific audit action names", () => {
    expect(pages).toMatch(/"issue_triaged"/);
    expect(pages).toMatch(/"issue_started"/);
    expect(pages).toMatch(/"issue_blocked"/);
    expect(pages).toMatch(/"issue_resolved"/);
    expect(pages).toMatch(/"issue_reopened"/);
    expect(pages).toMatch(/"issue_owner_assigned"/);
    expect(pages).toMatch(/"request_converted_to_tracked_issue"/);
    expect(hook).toMatch(/"issue_created"/);
    expect(hook).toMatch(/"issue_deleted"/);
  });

  it("Free-text related integration inputs are gone from workflow/issue dialogs", () => {
    // The old placeholder text (or 'Related integration ID' label) should be gone.
    expect(pages).not.toMatch(/Related integration ID/);
    expect(pages).not.toMatch(/placeholder="e\.g\. retell, viventium, centralreach"/);
    // Registry-backed select is used instead.
    expect(pages).toMatch(/IntegrationRegistrySelect/);
  });

  it("Request Intake dialog uses IntegrationRegistrySelect", () => {
    expect(panel).toMatch(/IntegrationRegistrySelect/);
    expect(panel).toMatch(/related_integration_id/);
  });

  it("Integration registry options include the canonical registry keys", () => {
    const ids = getIntegrationSelectOptions().map((o) => o.id);
    for (const key of [
      "centralreach", "viventium", "ctm", "retell", "apploi",
      "calendly", "jotform", "google-ads", "meta-ads",
      "eligipro", "bloomgrowth", "go-integrate-nava",
    ]) {
      expect(ids).toContain(key);
    }
    // Make.com is internal-only and must not be selectable.
    expect(ids).not.toContain("make");
    // None sentinel is distinct from any real id.
    expect(BLOSSOM_INTEGRATIONS.map((i) => i.id)).not.toContain(NONE_INTEGRATION_VALUE);
  });

  it("Workflow Inventory exposes owner and integration filters", () => {
    expect(pages).toMatch(/SelectFilter label="Owner"/);
    expect(pages).toMatch(/SelectFilter label="Integration"/);
    expect(pages).toMatch(/ownerFilter/);
    expect(pages).toMatch(/integrationFilter/);
  });

  it("Integration toggle persists to backend and audits", () => {
    expect(backend).toMatch(/updateIntegrationConnectionEnabled/);
    expect(integrations).toMatch(/updateIntegrationConnectionEnabled/);
    expect(integrations).toMatch(/handleToggleIntegration/);
    expect(integrations).toMatch(/"integration_enabled"/);
    expect(integrations).toMatch(/"integration_disabled"/);
    // Toggle onToggle handler goes through the persistent path, not raw setEnabledMap.
    expect(integrations).toMatch(/onToggle=\{\(next\)\s*=>\s*handleToggleIntegration/);
  });
});