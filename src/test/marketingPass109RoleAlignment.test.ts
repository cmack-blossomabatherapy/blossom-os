import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const migrationsDir = "supabase/migrations";
function loadPass109Sql(): string {
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  const contents = files.map((f) => fs.readFileSync(path.join(migrationsDir, f), "utf8"));
  const m = contents.find(
    (c) =>
      /can_access_marketing/.test(c) &&
      /can_manage_marketing/.test(c) &&
      /ON public\.marketing_work_items/.test(c),
  );
  if (!m) throw new Error("Pass 109 role-alignment migration not found");
  return m;
}

const TARGET_TABLES = [
  "marketing_sources",
  "marketing_campaigns",
  "marketing_source_events",
  "marketing_campaign_metrics",
  "marketing_call_events",
  "marketing_email_events",
  "marketing_work_items",
  "marketing_web_metrics",
  "marketing_reputation_events",
];

describe("Marketing Pass 109 - RLS role alignment", () => {
  const sql = loadPass109Sql();

  it("declares both access helpers", () => {
    expect(sql).toMatch(/FUNCTION public\.can_access_marketing/);
    expect(sql).toMatch(/FUNCTION public\.can_manage_marketing/);
  });

  it("access helper includes new marketing role keys", () => {
    for (const r of [
      "marketing_team",
      "marketing_growth_lead",
      "super_admin",
      "executive_leadership",
    ]) {
      expect(sql).toContain(`'${r}'`);
    }
  });

  it("access helper does not grant business_development", () => {
    // business_development must not appear inside can_access_marketing.
    const fn = sql.match(/can_access_marketing[\s\S]*?\$\$;/)![0];
    expect(fn).not.toContain("business_development");
  });

  it("target tables no longer rely only on the old 'marketing' role literal", () => {
    for (const t of TARGET_TABLES) {
      const re = new RegExp(`CREATE POLICY[^;]*ON public\\.${t}[^;]*can_(access|manage)_marketing`, "i");
      expect(re.test(sql), `${t} should reference marketing helper`).toBe(true);
    }
  });

  it("no broad USING (true) WITH CHECK (true) on target tables", () => {
    for (const t of TARGET_TABLES) {
      const bad = new RegExp(
        `CREATE POLICY[^;]*ON public\\.${t}[^;]*USING \\(true\\)[^;]*WITH CHECK \\(true\\)`,
        "is",
      );
      expect(bad.test(sql)).toBe(false);
    }
  });
});
