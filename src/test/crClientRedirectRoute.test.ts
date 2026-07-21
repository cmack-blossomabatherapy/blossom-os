import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Phase 1a P0-1 — CR client redirect route", () => {
  const appSrc = fs.readFileSync(path.join(process.cwd(), "src/App.tsx"), "utf8");

  it("registers the /clients/cr/:crId alias route", () => {
    expect(appSrc).toMatch(/path="\/clients\/cr\/:crId"/);
    expect(appSrc).toMatch(/CrClientRedirect/);
  });

  it("keeps the canonical /clients route intact", () => {
    expect(appSrc).toMatch(/path="\/clients"\s+element=\{<ClientsRouter/);
  });
});