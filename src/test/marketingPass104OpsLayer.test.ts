import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

import {
  normalizeDisposition,
  normalizeDirection,
  normalizeCategory,
  validateDisposition,
  validateDirection,
  validateCategory,
  CANONICAL_CALL_DISPOSITIONS,
} from "@/lib/marketing/callDispositions";
import { hourInTimeZone, isAfterHoursEastern, BLOSSOM_TZ } from "@/lib/marketing/callTimezone";

const REPO = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(REPO, rel), "utf8");
}
function exists(rel: string): boolean {
  return fs.existsSync(path.join(REPO, rel));
}
function walk(dir: string, out: string[] = []): string[] {
  const abs = path.join(REPO, dir);
  if (!fs.existsSync(abs)) return out;
  for (const name of fs.readdirSync(abs)) {
    const rel = path.join(dir, name);
    const full = path.join(REPO, rel);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(rel, out);
    else if (/\.(t|j)sx?$/.test(name)) out.push(rel);
  }
  return out;
}

describe("Marketing Pass 104 - reports & role invariants", () => {
  it("MarketingReports.tsx does not exist", () => {
    expect(exists("src/pages/os/marketing/MarketingReports.tsx")).toBe(false);
  });
  it("App.tsx does not import MarketingReports", () => {
    expect(read("src/App.tsx")).not.toMatch(/MarketingReports/);
  });
  it("/patient-journey uses Marketing-only roles", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/patient-journey/);
    expect(app).toMatch(/MARKETING_ROLES/);
  });
  it("Business Development menu does not include /patient-journey", () => {
    const menu = read("src/lib/os/roleMenus.ts");
    // crude but effective: BD block should not carry patient-journey
    const bdMatch = menu.match(/business_development[\s\S]*?\](?=,)/i);
    if (bdMatch) {
      expect(bdMatch[0]).not.toMatch(/patient-journey/);
    }
  });
});

describe("Marketing Pass 104 - routing hygiene", () => {
  const files = [
    ...walk("src/pages/os/marketing"),
    ...walk("src/pages/os/growth"),
    ...walk("src/components/marketing"),
  ];

  it("no production marketing/growth file references /marketing/inbox", () => {
    for (const f of files) {
      expect(read(f), f).not.toMatch(/\/marketing\/inbox(?!-)/);
    }
  });

  it("marketing menu pages do not contain 'coming soon'", () => {
    for (const f of walk("src/pages/os/marketing")) {
      expect(read(f).toLowerCase(), f).not.toContain("coming soon");
    }
  });

  it("does not import mock leads/phone calls/candidates or leadSourceEventsStore", () => {
    const bad = ["mockLeads", "mockPhoneCalls", "mockCandidates", "leadSourceEventsStore"];
    for (const f of walk("src/pages/os/marketing")) {
      const c = read(f);
      for (const b of bad) expect(c, `${f} imports ${b}`).not.toContain(b);
    }
  });
});

describe("Marketing Pass 104 - LeadSourceActions", () => {
  const src = read("src/components/marketing/LeadSourceActions.tsx");
  it("has no stub/placeholder/coming-soon copy", () => {
    expect(src.toLowerCase()).not.toMatch(/\b(stub|placeholder|coming soon|no-?op)\b/);
  });
  it("wires bulk/import to a real dialog", () => {
    expect(src).toMatch(/BulkSourceEventImportDialog/);
    expect(src).toMatch(/ManualSourceEventDialog/);
  });
});

describe("Marketing Pass 104 - call tracking", () => {
  it("hourInTimeZone returns 0-23", () => {
    const h = hourInTimeZone(new Date().toISOString(), BLOSSOM_TZ);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(24);
  });
  it("isAfterHoursEastern boundary", () => {
    // 2024-01-15 03:00 UTC == 22:00 ET previous day -> after hours
    expect(isAfterHoursEastern("2024-01-15T03:00:00Z")).toBe(true);
    // 2024-01-15 15:00 UTC == 10:00 ET -> business hours
    expect(isAfterHoursEastern("2024-01-15T15:00:00Z")).toBe(false);
  });
  it("call dispositions normalize to canonical set", () => {
    expect(normalizeDisposition("Answered")).toBe("connected");
    expect(normalizeDisposition("no-answer")).toBe("no_answer");
    expect(normalizeDisposition("after_hours")).toBe("missed_after_hours");
    expect(normalizeDisposition("bogus-value")).toBeNull();
    for (const d of CANONICAL_CALL_DISPOSITIONS) {
      expect(normalizeDisposition(d)).toBe(d);
    }
  });
  it("bulk call import validates invalid direction/category/disposition", () => {
    expect(validateDirection("banana").ok).toBe(false);
    expect(validateCategory("banana").ok).toBe(false);
    expect(validateDisposition("banana").ok).toBe(false);
    expect(validateDirection("inbound").ok).toBe(true);
    expect(normalizeCategory("Intake")).toBe("intake");
  });
  it("CallQueueSection and CallTracking use the tz helper", () => {
    expect(read("src/components/marketing/CallQueueSection.tsx")).toMatch(/isAfterHoursEastern/);
    expect(read("src/pages/os/marketing/CallTracking.tsx")).toMatch(/isAfterHoursEastern/);
  });
  it("PatientLifetimeJourney supports leadId deep links", () => {
    const s = read("src/pages/os/growth/PatientLifetimeJourney.tsx");
    expect(s).toMatch(/leadId/);
  });
});

describe("Marketing Pass 104 - mojibake", () => {
  const roots = [
    "src/pages/os/marketing",
    "src/pages/os/growth",
    "src/components/marketing",
  ];
  const files = roots.flatMap((r) => walk(r));
  const BAD_LITERALS = ["â”€", "â€”", "â€“", "â€¦", "â†’", "âˆ’", "Â·", "Ã—"];
  it("no mojibake codepoints or literal bad strings", () => {
    for (const f of files) {
      const c = read(f);
      for (const cp of ["\u00e2", "\u00c2", "\u00c3"]) {
        expect(c.includes(cp), `${f} contains codepoint U+${cp.charCodeAt(0).toString(16)}`).toBe(false);
      }
      for (const b of BAD_LITERALS) {
        expect(c.includes(b), `${f} contains ${b}`).toBe(false);
      }
    }
  });
});

describe("Marketing Pass 104 - durable ops layer", () => {
  it("useMarketingWorkItems + MarketingWorkPanel exist", () => {
    expect(exists("src/hooks/useMarketingWorkItems.ts")).toBe(true);
    expect(exists("src/components/marketing/MarketingWorkPanel.tsx")).toBe(true);
  });
  it("web metrics + reputation hooks exist", () => {
    expect(exists("src/hooks/useMarketingWebMetrics.ts")).toBe(true);
    expect(exists("src/hooks/useMarketingReputationEvents.ts")).toBe(true);
  });
  it("all seven operational pages use MarketingWorkPanel", () => {
    const pages = [
      "SEOContent",
      "WebAnalytics",
      "Reputation",
      "CommunityOutreach",
      "RecruitingMarketing",
      "StateGrowth",
      "AttributionROI",
    ];
    for (const p of pages) {
      const c = read(`src/pages/os/marketing/${p}.tsx`);
      expect(c, p).toMatch(/MarketingWorkPanel/);
    }
  });
  it("marketing_work_items migration exists", () => {
    const dir = "supabase/migrations";
    const migs = fs.readdirSync(path.join(REPO, dir));
    const found = migs.some((m) =>
      fs.readFileSync(path.join(REPO, dir, m), "utf8").includes("marketing_work_items"),
    );
    expect(found).toBe(true);
  });
});