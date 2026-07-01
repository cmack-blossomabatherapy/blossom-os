import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const exists = (p: string) => fs.existsSync(path.join(process.cwd(), p));

const MARKETING_COMPONENT_DIRS = [
  "src/components/marketing",
  "src/pages/os/marketing",
  "src/pages/os/growth",
];

function walk(dir: string, out: string[] = []): string[] {
  const abs = path.join(process.cwd(), dir);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

describe("Marketing Pass 103 — reports rule preserved", () => {
  it("no MarketingReports page exists", () => {
    expect(exists("src/pages/os/marketing/MarketingReports.tsx")).toBe(false);
  });
  it("/marketing/reports is only a Navigate redirect to /reports", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/path=["']\/marketing\/reports["'][^>]*element=\{[^}]*Navigate[^}]*to=["']\/reports/);
  });
});

describe("Marketing Pass 103 — Patient Lifetime Journey scoping", () => {
  it("/patient-journey uses MARKETING_ROLES not MARKETING_ROLES_WITH_BD", () => {
    const app = read("src/App.tsx");
    const idx = app.indexOf('path="/patient-journey"');
    expect(idx).toBeGreaterThan(-1);
    const block = app.slice(idx, idx + 400);
    expect(block).toContain("MARKETING_ROLES");
    expect(block).not.toContain("MARKETING_ROLES_WITH_BD");
  });
  const hasPatientJourney = (role: string): boolean => {
    const menu = (ROLE_MENUS as any)[role];
    if (!menu) return false;
    const sections: any[] = menu.sections ?? menu.groups ?? [];
    const items: any[] = Array.isArray(menu)
      ? menu
      : sections.flatMap((s: any) => s.items ?? []);
    const flat: any[] = items.flatMap((i: any) => [i, ...(i.children ?? [])]);
    return flat.some(
      (i: any) =>
        (typeof i?.to === "string" && i.to.includes("/patient-journey")) ||
        (typeof i?.path === "string" && i.path.includes("/patient-journey")),
    );
  };
  it("Business Development role menu does not include /patient-journey", () => {
    expect(hasPatientJourney("business_development")).toBe(false);
  });
});

describe("Marketing Pass 103 — SourceOpsPanel routing + alias hardening", () => {
  it("no production Marketing/Growth file links to /marketing/inbox", () => {
    for (const dir of MARKETING_COMPONENT_DIRS) {
      for (const f of walk(dir)) {
        const src = read(f);
        expect(src, `${f} still references /marketing/inbox`).not.toContain("/marketing/inbox");
      }
    }
  });
  it("SourceOpsPanel links to /marketing/lead-source-inbox", () => {
    const src = read("src/components/marketing/SourceOpsPanel.tsx");
    expect(src).toContain("/marketing/lead-source-inbox");
  });
  it("SourceOpsPanel uses expandSourceSlugAliases from sourceEventMapper", () => {
    const src = read("src/components/marketing/SourceOpsPanel.tsx");
    expect(src).toContain("expandSourceSlugAliases");
    expect(src).toContain("sourceEventMapper");
  });
});

describe("Marketing Pass 103 — no empty Radix SelectItem values", () => {
  it("no Marketing/Growth component contains SelectItem value=\"\"", () => {
    for (const dir of MARKETING_COMPONENT_DIRS) {
      for (const f of walk(dir)) {
        const src = read(f);
        expect(src, `${f} has empty SelectItem value`).not.toMatch(/<SelectItem\s+value=""/);
      }
    }
  });
});

describe("Marketing Pass 103 — Call Tracking dialogs", () => {
  it("CallEventLogDialog exists and writes into marketing_call_events via createManualCallEvent", () => {
    const p = "src/components/marketing/CallEventLogDialog.tsx";
    expect(exists(p)).toBe(true);
    const src = read(p);
    expect(src).toContain("createManualCallEvent");
    expect(src).toContain("useMarketingCallEvents");
  });
  it("BulkCallEventImportDialog exists and imports via bulkImportCallEvents", () => {
    const p = "src/components/marketing/BulkCallEventImportDialog.tsx";
    expect(exists(p)).toBe(true);
    const src = read(p);
    expect(src).toContain("bulkImportCallEvents");
  });
  it("CallQueueSection mounts both call dialogs", () => {
    const src = read("src/components/marketing/CallQueueSection.tsx");
    expect(src).toContain("CallEventLogDialog");
    expect(src).toContain("BulkCallEventImportDialog");
  });
});

describe("Marketing Pass 103 — Email Marketing wiring", () => {
  it("EmailEventLogDialog writes to marketing_email_events (not marketing_source_events)", () => {
    const src = read("src/components/marketing/EmailEventLogDialog.tsx");
    expect(src).toMatch(/from\(["']marketing_email_events["']\)/);
    expect(src).not.toMatch(/from\(["']marketing_source_events["']\)/);
  });
  it("BulkEmailEventImportDialog writes to marketing_email_events", () => {
    const src = read("src/components/marketing/BulkEmailEventImportDialog.tsx");
    expect(src).toMatch(/from\(["']marketing_email_events["']\)/);
  });
  it("EmailMarketing includes mailchimp when loading email campaigns", () => {
    const src = read("src/pages/os/marketing/EmailMarketing.tsx");
    expect(src).toMatch(/mailchimp/i);
  });
});

describe("Marketing Pass 103 — source-specific pages still mount SourceOpsPanel", () => {
  it.each([
    "src/pages/os/growth/GoogleAds.tsx",
    "src/pages/os/growth/FacebookAds.tsx",
    "src/pages/os/growth/LeadTrap.tsx",
  ])("%s mounts SourceOpsPanel", (p) => {
    expect(read(p)).toContain("SourceOpsPanel");
  });
});

describe("Marketing Pass 103 — no mojibake in touched files", () => {
  const files = [
    "src/pages/os/marketing/EmailMarketing.tsx",
    "src/pages/os/growth/LeadSourceInbox.tsx",
    "src/components/marketing/SourceOpsPanel.tsx",
    "src/components/marketing/CallQueueSection.tsx",
    "src/components/marketing/CallEventLogDialog.tsx",
    "src/components/marketing/BulkCallEventImportDialog.tsx",
    "src/components/marketing/EmailEventLogDialog.tsx",
  ];
  it.each(files)("%s has no mojibake sequences", (p) => {
    const src = read(p);
    for (const bad of ["€", "\u0080", "\u0080\u0093", "\u0080\u0094"]) {
      expect(src, `${p} contains mojibake`).not.toContain(bad);
    }
  });
});