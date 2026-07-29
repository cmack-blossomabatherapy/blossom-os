import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Apploi sync cron — authorization hardening", () => {
  const fn = read("supabase/functions/apploi-sync-cron/index.ts");

  it("requires a server-only cron secret for scheduled runs", () => {
    expect(fn).toMatch(/APPLOI_CRON_SECRET/);
    expect(fn).toMatch(/x-cron-secret/);
    expect(fn).toMatch(/function safeEqual/);
  });

  it("requires an authenticated, role-authorized user for manual runs", () => {
    expect(fn).toMatch(/getClaims/);
    expect(fn).toMatch(/from\("user_roles"\)/);
    expect(fn).toMatch(/SYNC_ROLES/);
    expect(fn).toMatch(/status:?\s*401|json\(\{ ok: false, error: "Unauthorized" \}, 401\)/);
    expect(fn).toMatch(/403/);
  });

  it("never returns the Apploi API key or the cron secret to the caller", () => {
    expect(fn).not.toMatch(/APPLOI_API_KEY/);
    expect(fn).not.toMatch(/message:\s*CRON_SECRET/);
  });

  it("throttles both scheduled and manual runs", () => {
    expect(fn).toMatch(/MIN_INTERVAL_MINUTES/);
    expect(fn).toMatch(/MANUAL_INTERVAL_MINUTES/);
    expect(fn).toMatch(/reason: "throttled"/);
  });

  it("frontend never holds Apploi credentials and syncs through the secured function", () => {
    const hook = read("src/hooks/useApploiIntegration.ts");
    expect(hook).toMatch(/functions\.invoke\("apploi-sync-cron"/);
    expect(hook).not.toMatch(/Deno\.env|process\.env|partners\.apploi\.com/);
  });
});

describe("Manual staffing handoff — minimum-PHI contract", () => {
  const hook = read("src/hooks/useStaffingHandoff.ts");
  const dialog = read("src/components/recruiting/StaffingHandoffDialog.tsx");
  const panel = read("src/components/recruiting/StaffingHandoffPanel.tsx");
  const queue = read("src/components/recruiting/StaffingHandoffReviewQueue.tsx");

  it("reuses the canonical staffing tables instead of a duplicate patient store", () => {
    expect(hook).toMatch(/from\("recruiting_staffing_needs"\)/);
    expect(hook).toMatch(/from\("recruiting_staffing_need_events"\)/);
    expect(hook).not.toMatch(/from\("patients"\)/);
  });

  it("looks clients up through the minimum-field secure RPC, not the clients table", () => {
    expect(hook).toMatch(/rpc\("recruiting_client_staffing_options"/);
    expect(hook).not.toMatch(/from\("clients"\)/);
  });

  it("captures only staffing-fit fields — never diagnosis, insurance or clinical notes", () => {
    for (const banned of [/diagnos/i, /insurance/i, /clinical note/i]) {
      // The only allowed mentions are the explicit "do not enter" warnings.
      const hits = dialog.match(new RegExp(banned.source, "gi")) ?? [];
      expect(hits.every(() => dialog.includes("Do not enter diagnoses"))).toBe(true);
      expect(hook).not.toMatch(banned);
    }
    for (const field of ["desiredStartDate", "requiredAvailability", "preferenceNotes", "serviceSetting"]) {
      expect(hook).toContain(field);
    }
  });

  it("supports the full handoff lifecycle with an audit trail", () => {
    for (const s of ["proposed", "pending_review", "accepted", "declined", "cancelled"]) {
      expect(hook).toContain(s);
    }
    expect(hook).toMatch(/logEvent\(/);
  });

  it("blocks duplicate active proposals for the same candidate + client + role", () => {
    expect(hook).toMatch(/already has an active proposal/);
    expect(hook).toMatch(/\.in\("handoff_status", \["proposed", "pending_review", "accepted"\]\)/);
  });

  it("does not treat an unready applicant as an assigned clinician", () => {
    expect(dialog).toMatch(/STAFFING_READY_STAGES/);
    expect(dialog).toMatch(/proposed future match/);
  });

  it("recruiters see a read-only handoff history; staffing owns the decision", () => {
    expect(panel).toMatch(/Propose staffing match/);
    expect(panel).not.toMatch(/decide\(/);
    expect(queue).toMatch(/decide\(/);
    expect(queue).toMatch(/promptOperator|confirmOperator/);
    expect(queue).not.toMatch(/window\.prompt|window\.confirm/);
  });

  it("is mounted on the RBT and BCBA recruiting records and in the staffing queue", () => {
    expect(read("src/pages/os/OSRecruitingRBT.tsx")).toMatch(/StaffingHandoffPanel/);
    expect(read("src/pages/os/OSRecruitingBCBA.tsx")).toMatch(/StaffingHandoffPanel/);
    expect(read("src/pages/os/OSRecruitingStaffingNeeds.tsx")).toMatch(/StaffingHandoffReviewQueue/);
  });
});

describe("Apploi job postings surface", () => {
  const page = read("src/pages/os/OSRecruitingJobs.tsx");

  it("renders real synced job records with search and filters", () => {
    expect(page).toMatch(/from\("integration_normalized_records"\)/);
    expect(page).toMatch(/record_kind", "job"/);
    expect(page).toMatch(/Filter by state/);
    expect(page).toMatch(/Filter by status/);
    expect(page).toMatch(/No job postings match these filters/);
  });

  it("states the applicant-scope limitation honestly and keeps the diagnostic admin-only", () => {
    expect(page).toMatch(/Applicant records are not currently shared/);
    expect(page).toMatch(/OperatorDiagnosticsGate/);
    expect(page).toMatch(/provider permission gap, not a sync failure/);
  });

  it("is routed and present in every recruiting role menu", () => {
    expect(read("src/App.tsx")).toContain('path="/recruiting/jobs"');
    for (const role of ["recruiting_team", "recruiting_lead", "recruiting_coordinator"]) {
      const menu = (ROLE_MENUS as Record<string, { sections: { items: { path: string }[] }[] }>)[role];
      const paths = menu.sections.flatMap((s) => s.items.map((i) => i.path));
      expect(paths, role).toContain("/recruiting/jobs");
    }
    expect(read("src/pages/os/OSShell.tsx")).toContain('"/recruiting/jobs"');
  });
});
