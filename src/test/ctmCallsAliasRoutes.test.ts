import { describe, it, expect } from "vitest";
import fs from "node:fs";

describe("CTM Calls route aliases", () => {
  const app = fs.readFileSync("src/App.tsx", "utf8");

  const aliases = ["/phone/calls", "/phone/ctm-calls", "/intake/ctm-calls"];

  for (const path of aliases) {
    it(`route ${path} renders CTMCalls behind PhoneSystemRoute`, () => {
      const re = new RegExp(
        `<Route\\s+path="${path.replace(/\//g, "\\/")}"\\s+element=\\{<PhoneSystemRoute><CTMCalls\\s*/></PhoneSystemRoute>\\}`,
      );
      expect(app).toMatch(re);
    });
  }

  it("PhoneSystemRoute guard file still enforces role allow-list", () => {
    const guard = fs.readFileSync("src/components/auth/PhoneSystemRoute.tsx", "utf8");
    expect(guard).toMatch(/ALLOWED\.has\(String\(role\)\)/);
    expect(guard).toMatch(/Navigate to=\{redirectTo\}/);
  });
});