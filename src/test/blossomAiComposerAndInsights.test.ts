import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Blossom AI — composer & insights are wired to real behavior", () => {
  const page = read("src/pages/os/OSAskBlossom.tsx");
  const hook = read("src/hooks/useBlossomAiInsights.ts");
  const adapter = read("src/lib/ai/askBlossomAdapter.ts");

  it("mic button is no longer permanently disabled and calls toggleDictation", () => {
    expect(page).not.toMatch(/title="Voice \(coming soon\)"/);
    expect(page).toMatch(/onClick=\{toggleDictation\}/);
    expect(page).toMatch(/webkitSpeechRecognition/);
  });

  it("paperclip triggers a hidden file input", () => {
    expect(page).not.toMatch(/title="Attach \(coming soon\)"/);
    expect(page).toMatch(/fileInputRef\.current\?\.click\(\)/);
    expect(page).toMatch(/type="file"/);
    expect(page).toMatch(/multiple/);
  });

  it("attachments are folded into the composed prompt sent to the model", () => {
    expect(page).toMatch(/--- Attached: \$\{a\.name\}/);
    expect(page).toMatch(/streamAskBlossom\(composed/);
  });

  it("insights come from useBlossomAiInsights, not the removed mock helper", () => {
    expect(page).toMatch(/from "@\/hooks\/useBlossomAiInsights"/);
    expect(page).not.toMatch(/mockInsightsFor/);
    expect(adapter).not.toMatch(/export function mockInsightsFor/);
  });

  it("insights hook queries real operational tables", () => {
    for (const table of [
      "client_authorizations",
      "critical_alerts",
      "scheduling_coverage_cases",
      "user_tasks",
      "recruiting_candidates",
      "operations_work_items",
    ]) {
      expect(hook).toContain(table);
    }
  });

  it("insights hook honors state scoping for state-scoped roles", () => {
    expect(hook).toMatch(/scope\.dataScope === "state"/);
    expect(hook).toMatch(/getAiScope/);
  });

  it("insights list shows loading skeleton, error state, and honest empty state", () => {
    expect(page).toMatch(/animate-pulse/);
    expect(page).toMatch(/Couldn.t load live insights/);
    expect(hook).toMatch(/No risks flagged in your scope/);
  });

  it("insight cards deep-link to their module", () => {
    expect(hook).toMatch(/href: "\/authorizations"/);
    expect(hook).toMatch(/href: "\/tasks"/);
    expect(hook).toMatch(/href: "\/admin\/alerts"/);
  });

  it("refresh button re-runs the insight queries", () => {
    expect(page).toMatch(/refreshInsights/);
    expect(page).toMatch(/RefreshCw/);
  });
});
