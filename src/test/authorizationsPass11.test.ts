import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

const legacy = read("routes/legacyRoutes.tsx");
const intake = read("pages/os/intake/IntakeDashboard.tsx");
const app = read("App.tsx");
const menus = read("lib/os/roleMenus.ts");

describe("Authorizations Pass 11 — final stale-route cleanup", () => {
  it("/os/authorizations redirects directly to /authorizations in legacyRoutes", () => {
    expect(legacy).toMatch(/path="\/os\/authorizations"\s+element=\{<Navigate\s+to="\/authorizations"\s+replace/);
  });

  it("legacyRoutes does not redirect /os/authorizations to /ops/authorizations", () => {
    expect(legacy).not.toMatch(/path="\/os\/authorizations"[^>]*to="\/ops\/authorizations"/);
  });

  it("Intake dashboard does not link to /ops/authorizations", () => {
    expect(intake).not.toMatch(/to="\/ops\/authorizations"/);
  });

  it("Intake dashboard links to /authorizations", () => {
    expect(intake).toMatch(/to="\/authorizations"/);
  });

  it("App.tsx keeps compatibility redirects for /ops/* authorizations paths", () => {
    expect(app).toMatch(/path="\/ops\/authorizations"[^>]*to="\/authorizations"/);
    expect(app).toMatch(/path="\/ops\/approved-authorizations"[^>]*to="\/authorizations\?stage=approved"/);
    expect(app).toMatch(/path="\/ops\/denials"[^>]*to="\/authorizations\?stage=denied"/);
  });

  it("Authorizations role menus use canonical /authorizations paths and /reports", () => {
    expect(menus).toMatch(/path:\s*"\/authorizations"/);
    expect(menus).toMatch(/path:\s*"\/authorizations\?stage=approved"/);
    expect(menus).toMatch(/path:\s*"\/authorizations\?stage=denied"/);
    expect(menus).toMatch(/path:\s*"\/reports"/);
  });

  it("Authorizations role menus do not expose /ai/assistant", () => {
    // Extract the two authorizations role menu blocks and assert /ai/assistant not present inside them
    const blocks = menus.match(/id:\s*"authorizations"[\s\S]*?\]\s*\}/g) ?? [];
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) {
      expect(b).not.toMatch(/\/ai\/assistant/);
    }
  });
});