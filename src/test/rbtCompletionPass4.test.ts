// Rewritten to assert the CURRENT shipping RBT contract: canonical /rbt/reports
// redirect, Supabase-backed prefs + readiness data stores, RBT report cards in
// the catalog, and the underlying RLS migrations remain in place.

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("RBT Pass 4 — canonical routing + catalog", () => {
  it("App.tsx redirects /rbt/reports to /reports?audience=rbt and never mounts an RBT reports page", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/\/rbt\/reports[\s\S]{0,200}Navigate to="\/reports\?audience=rbt"/);
    expect(app).not.toMatch(/element=\{<OSRBTReports/);
  });

  it("reportsCatalog contains every RBT report card and each is visible to `rbt`", () => {
    const src = read("src/lib/os/reportsCatalog.ts");
    const ids = [
      "rbt-training-progress",
      "rbt-readiness-status",
      "rbt-sessions-attendance",
      "rbt-my-supervision",
      "rbt-help-requests",
      "rbt-resource-completion",
      "rbt-centralreach-sync",
    ];
    for (const id of ids) {
      expect(src).toMatch(new RegExp(`id:\\s*"${id}"`));
    }
    const rbtCards = src.split(/\n/).filter((l) => /id:\s*"rbt-/.test(l));
    expect(rbtCards.length).toBeGreaterThanOrEqual(ids.length);
    for (const line of rbtCards) expect(line).toMatch(/"rbt"/);
  });
});

describe("RBT Pass 4 — Supabase-backed persistence surfaces", () => {
  it("rbtResourcePrefs is Supabase-backed", () => {
    const src = read("src/lib/training/rbtResourcePrefs.ts");
    expect(src).toMatch(/from\s+"@\/integrations\/supabase\/client"/);
    expect(src).toMatch(/rbt_resource_prefs/);
  });

  it("rbtReadiness exposes a Supabase-backed hook", () => {
    const src = read("src/lib/training/rbtReadiness.ts");
    expect(src).toMatch(/useReadinessTrainees/);
    expect(src).toMatch(/rbt_readiness_records/);
  });

  it("migrations still define rbt_resource_prefs + rbt_readiness_records with RLS and grants", () => {
    const dir = "supabase/migrations";
    const combined = fs.readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => fs.readFileSync(path.join(dir, f), "utf8"))
      .join("\n");
    expect(combined).toMatch(/CREATE TABLE IF NOT EXISTS public\.rbt_resource_prefs/);
    expect(combined).toMatch(/CREATE TABLE IF NOT EXISTS public\.rbt_readiness_records/);
    expect(combined).toMatch(/ENABLE ROW LEVEL SECURITY[\s\S]*rbt_resource_prefs/);
    expect(combined).toMatch(/ENABLE ROW LEVEL SECURITY[\s\S]*rbt_readiness_records/);
    expect(combined).toMatch(/GRANT[\s\S]*ON public\.rbt_resource_prefs TO authenticated/);
    expect(combined).toMatch(/GRANT[\s\S]*ON public\.rbt_readiness_records TO authenticated/);
  });
});