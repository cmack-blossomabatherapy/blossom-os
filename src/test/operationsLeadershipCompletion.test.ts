import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { BLOSSOM_INTEGRATIONS } from "@/lib/os/integrations/integrationRegistry";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Operations Leadership — completion pass", () => {
  const catalog = read("src/lib/os/reportsCatalog.ts");
  const matrix = read("src/components/operations/OperationsIntegrationReadinessMatrix.tsx");
  const cmd = read("src/pages/os/operations/OpsCommandCenter.tsx");
  const wq = read("src/pages/os/work-queue/WorkQueuePage.tsx");

  it("saveReportRequest mirrors into Supabase report_requests", () => {
    expect(catalog).toMatch(/from\("report_requests"\)/);
    expect(catalog).toMatch(/requested_by_user_id:\s*uid/);
  });

  it("pushRecent mirrors into Supabase shared_report_recents", () => {
    expect(catalog).toMatch(/from\("shared_report_recents"\)/);
    expect(catalog).toMatch(/onConflict:\s*"user_id,report_key"/);
  });

  it("Operations Command Center renders the full readiness matrix, not the summary card", () => {
    expect(cmd).toMatch(/OperationsIntegrationReadinessMatrix/);
    expect(cmd).not.toMatch(/\bIntegrationReadinessCard\b/);
  });

  it("Operations Command Center exposes required quick actions", () => {
    for (const label of [
      "Work Queue", "Escalations", "Reports", "Phone System", "Integrations", "Submit request",
    ]) {
      expect(cmd, `quick action missing: ${label}`).toContain(label);
    }
  });

  it("Work Queue page reads ?selected= from the URL", () => {
    expect(wq).toMatch(/searchParams\.get\("selected"\)/);
  });

  it("Integration readiness matrix hides internalOnly integrations (Make.com)", () => {
    expect(matrix).toMatch(/!i\.internalOnly/);
    const make = BLOSSOM_INTEGRATIONS.find((i) => i.id === "make");
    expect(make?.internalOnly).toBe(true);
  });

  it("Integration registry includes every Operations Leadership required system", () => {
    const required = [
      "centralreach", "viventium", "apploi", "ms365", "jivetel", "ctm", "retell",
      "leadtrap", "mailchimp", "google-ads", "meta-ads", "solum", "eligipro",
      "pandadoc", "calendly", "fathom", "bloomgrowth", "go-integrate-nava", "resend",
    ];
    const ids = new Set(BLOSSOM_INTEGRATIONS.map((i) => i.id));
    for (const id of required) {
      expect(ids.has(id), `registry missing required integration: ${id}`).toBe(true);
    }
  });

  it("Reports normal-menu links no longer target /reports/progress-reports", () => {
    for (const f of [
      "src/lib/os/workspaces.ts",
      "src/lib/os/roleMenus.ts",
      "src/pages/os/clinical/ClinicalDirectorDashboard.tsx",
    ]) {
      const src = read(f);
      expect(src, `${f} still targets /reports/progress-reports`).not.toMatch(
        /(path|to):\s*"\/reports\/progress-reports"/,
      );
    }
  });
});
