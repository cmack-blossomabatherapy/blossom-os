/**
 * Sprint 02 regression suite.
 *
 * Locks in every guarantee from the Sprint 02 brief so the next sprint can't
 * silently regress them. Most checks are static (file-text + module exports)
 * because they assert routing / catalog / copy invariants — fast and stable.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { PHASE3_REPORTS, reportRoute } from "@/lib/os/phase3Reports";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

/* ───────────────────────────── Phase A ───────────────────────────── */
describe("Phase A — State Director / Assistant SD training routing", () => {
  const roleMenus = read("src/lib/os/roleMenus.ts");
  const osShell = read("src/pages/os/OSShell.tsx");

  it("role menus never link Training Academy to /coming-soon", () => {
    // Training Academy should land on /academy or /training — never the old stub.
    expect(roleMenus).not.toMatch(/Training Academy[^,]*coming-soon/);
  });

  it("OSShell mobile bottom nav routes Training to /training", () => {
    expect(osShell).toMatch(/\/training/);
  });
});

/* ───────────────────────────── Phase B ───────────────────────────── */
describe("Phase B — no /coming-soon or 'Coming Soon' copy in cleaned pages", () => {
  const FILES = [
    "src/pages/os/growth/BusinessDevelopmentDashboard.tsx",
    "src/pages/os/intake/IntakeDashboard.tsx",
    "src/pages/os/intake/LeadToActivePipeline.tsx",
    "src/pages/os/intake/IntakeTasks.tsx",
    "src/pages/os/operations-phase6/OperationsPages.tsx",
    "src/pages/os/people/PeoplePages.tsx",
    "src/pages/os/reports/ReportsLanding.tsx",
    "src/components/os/growth/GrowthPageShell.tsx",
  ];

  it.each(FILES)("%s contains no /coming-soon link or 'Coming Soon' copy", (file) => {
    const src = read(file);
    expect(src).not.toMatch(/\/coming-soon/);
    expect(src).not.toMatch(/Coming Soon/i);
  });
});

/* ───────────────────────────── Phase C ───────────────────────────── */
describe("Phase C — intake pages pull from live leads context", () => {
  it("IntakeDashboard imports useLeads()", () => {
    expect(read("src/pages/os/intake/IntakeDashboard.tsx")).toMatch(/useLeads/);
  });
  it("Leads page auto-opens NewLeadDialog on ?new=1", () => {
    expect(read("src/pages/Leads.tsx")).toMatch(/new.*===\s*"1"|get\("new"\)/);
  });
  it("MissingInformation + ParentCommunication pages exist", () => {
    expect(read("src/pages/os/intake/MissingInformation.tsx").length).toBeGreaterThan(0);
    expect(read("src/pages/os/intake/ParentCommunication.tsx").length).toBeGreaterThan(0);
  });
});

/* ───────────────────────────── Phase D ───────────────────────────── */
describe("Phase D — Add Lead round-trip selects every extended column", () => {
  const ctx = read("src/contexts/LeadsContext.tsx");
  const REQUIRED = [
    "patient_first_name", "patient_last_name", "dob",
    "parent_first_name", "parent_last_name", "parent_2_name", "parent_2_email",
    "parent_cell_phone", "home_phone", "preferred_contact_method",
    "lead_type", "utm_source", "utm_medium", "utm_campaign",
    "referral_source", "referral_partner",
    "origination_date", "last_contact_date",
    "regular_call_log", "et_call_log", "message_comments",
    "secondary_insurance", "diagnosis_status", "dx_needed",
  ];
  it.each(REQUIRED)("INTAKE_LEADS_SELECT includes %s", (col) => {
    expect(ctx).toContain(col);
  });
});

/* ───────────────────────────── Phase E ───────────────────────────── */
describe("Phase E — Patient Lifetime Journey is wired to useLeads()", () => {
  const src = read("src/pages/os/growth/PatientLifetimeJourney.tsx");
  it("uses live leads instead of MOCK_PATIENTS", () => {
    expect(src).toMatch(/useLeads/);
    expect(src).not.toMatch(/MOCK_PATIENTS/);
  });
});

/* ───────────────────────────── Phase F ───────────────────────────── */
describe("Phase F — Business Development is a tabbed page", () => {
  const src = read("src/pages/os/growth/BusinessDevelopmentDashboard.tsx");
  it("renders Tabs and reads ?tab= from the URL", () => {
    expect(src).toMatch(/Tabs/);
    expect(src).toMatch(/useSearchParams/);
    for (const k of ["partners", "outreach", "tasks", "providers", "community"]) {
      expect(src).toContain(k);
    }
  });
});

/* ───────────────────────────── Phase G ───────────────────────────── */
describe("Phase G — Reports catalog has no coming_soon status or route", () => {
  it("no report has status 'coming_soon'", () => {
    for (const r of PHASE3_REPORTS) {
      expect(r.status as string).not.toBe("coming_soon");
    }
  });
  it("reportRoute never returns /coming-soon", () => {
    for (const r of PHASE3_REPORTS) {
      expect(reportRoute(r)).not.toMatch(/coming[-_]?soon/i);
    }
  });
  it("ReportsLanding exposes Connect / Upload / Request actions for setup-needed reports", () => {
    const src = read("src/pages/os/reports/ReportsLanding.tsx");
    expect(src).toMatch(/Connect/);
    expect(src).toMatch(/Upload/);
    expect(src).toMatch(/Request/);
    expect(src).not.toMatch(/View Roadmap/);
  });
});

/* ───────────────────────────── Phase H ───────────────────────────── */
describe("Phase H — old workspace shell is fully blocked", () => {
  const app = read("src/App.tsx");
  const shell = read("src/pages/os/OSShell.tsx");

  it("/ws/:id redirects to /dashboard and WorkspacePage is no longer imported", () => {
    expect(app).toMatch(/path="\/ws\/:id"\s+element=\{<Navigate to="\/dashboard"/);
    expect(app).not.toMatch(/WorkspacePage/);
  });

  it("OSShell no longer renders 'Old Version' buttons", () => {
    expect(shell).not.toMatch(/Old Version/);
    expect(shell).not.toMatch(/showOldVersion/);
  });

  it("workspaces.ts + workspaceContent.ts contain no /ws/* link paths", () => {
    const ws = read("src/lib/os/workspaces.ts");
    const wc = read("src/lib/os/workspaceContent.ts");
    // path: "/ws/..." or path="/ws/..."
    expect(ws).not.toMatch(/path[:=]\s*["']\/ws\//);
    expect(wc).not.toMatch(/path[:=]\s*["']\/ws\//);
  });
});