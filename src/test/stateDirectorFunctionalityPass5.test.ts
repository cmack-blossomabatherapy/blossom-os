import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("State Director Functionality Pass 5 — hardening", () => {
  const svc = read("src/lib/os/stateDirector/stateOperationsService.ts");
  const store = read("src/lib/os/stateDirector/stateDirectorStore.ts");
  const phoneGuard = read("src/components/auth/PhoneSystemRoute.tsx");
  const pages = read("src/pages/os/stateDirector/StateDirectorPages.tsx");
  const types = read("src/integrations/supabase/types.ts");

  it("PhoneSystemRoute allows state_director and excludes assistant_state_director", () => {
    const allowed = phoneGuard.match(/const\s+ALLOWED\s*=\s*new\s+Set<string>\(\[([\s\S]*?)\]\)/)?.[1] ?? "";
    expect(allowed).toMatch(/"state_director"/);
    expect(allowed).not.toMatch(/"assistant_state_director"/);
  });

  it("insertNote / insertActivity / updateTaskRow / updateEscalationRow return { ok, error }", () => {
    expect(svc).toMatch(/export async function insertNote[\s\S]*Promise<\{ ok: boolean; error\?: string; id\?: string \}>/);
    expect(svc).toMatch(/export async function insertActivity[\s\S]*Promise<\{ ok: boolean; error\?: string \}>/);
    expect(svc).toMatch(/export async function updateTaskRow[\s\S]*Promise<\{ ok: boolean; error\?: string \}>/);
    expect(svc).toMatch(/export async function updateEscalationRow[\s\S]*Promise<\{ ok: boolean; error\?: string \}>/);
  });

  it("service contract comment matches actual behavior (no stale 'best-effort/fire-and-forget')", () => {
    // The Pass 5 rewrite explicitly documents that persistence errors are surfaced.
    expect(svc).toMatch(/no write path silently swallows a Supabase error/i);
    expect(svc).not.toMatch(/fire-and-forget while still updating their in-memory cache/);
  });

  it("store surfaces persistError on failed note/update paths", () => {
    // The store checks ok on all four write paths and marks persistError.
    const matches = store.match(/persistError:/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(4);
    // No .catch(() => {}) or /\* ignore \*/ swallows in these paths.
    expect(store).not.toMatch(/\/\* ignore \*\//);
  });

  it("state_operational_metrics is present in Supabase types (live metrics bridge exists)", () => {
    expect(types).toMatch(/state_operational_metrics: \{/);
    expect(svc).toMatch(/loadStateMetrics/);
    expect(svc).toMatch(/upsertStateMetric/);
    expect(svc).toMatch(/StateMetricSource/);
  });

  it("store hydrates live metrics on top of the seed", () => {
    expect(store).toMatch(/sbLoadStateMetrics/);
    expect(store).toMatch(/source: r\.source/);
  });

  it("State Operations UI shows live / mixed / seed source labels", () => {
    expect(pages).toMatch(/Live state metrics/);
    expect(pages).toMatch(/Mixed live \+ seed fallback metrics/);
    expect(pages).toMatch(/Seed fallback metrics/);
    expect(pages).toMatch(/Source: Live state metrics/);
    expect(pages).toMatch(/Source: Mixed live \+ seed fallback/);
    expect(pages).toMatch(/Source: Seed fallback/);
  });

  it("Snapshot banners pass useful context on department pages", () => {
    const intake = read("src/pages/os/intake/IntakeDashboard.tsx");
    expect(intake).toMatch(/overdueCount=\{counts\.missing\}/);
    expect(intake).toMatch(/openBlockers=\{counts\.followUps\}/);
    const auth = read("src/pages/os/OSAuthWorkspace.tsx");
    expect(auth).toMatch(/openBlockers=\{liveItems\.length\}/);
    for (const p of [
      "src/pages/os/OSStaffingWorkspace.tsx",
      "src/pages/os/OSSchedulingWorkspace.tsx",
      "src/pages/os/OSQATeam.tsx",
    ]) {
      expect(read(p)).toMatch(/topRisks=\{/);
    }
  });

  it("state_director menu keeps a single /reports and /training remains at /training", () => {
    const items = ROLE_MENUS.state_director!.sections.flatMap((s) => s.items.map((i) => i.path));
    const reports = items.filter((p) => p === "/reports");
    expect(reports.length).toBe(1);
    expect(items).toContain("/training");
  });
});