import { describe, it, expect } from "vitest";
import fs from "node:fs";

describe("canonical routes still exist after Pass 5A extraction", () => {
  const sources = [
    fs.readFileSync("src/App.tsx", "utf8"),
    fs.readFileSync("src/routes/publicRoutes.tsx", "utf8"),
    fs.readFileSync("src/routes/legacyRoutes.tsx", "utf8"),
  ].join("\n");

  const canonical = [
    "/",
    "/intake",
    "/authorizations",
    "/staffing",
    "/phone",
    "/reports",
    "/user-management",
    "/settings",
    "/auth",
  ];

  for (const path of canonical) {
    it(`declares route ${path}`, () => {
      const re = new RegExp(`<Route\\s+path="${path.replace(/[/]/g, "\\/")}"`);
      expect(sources).toMatch(re);
    });
  }
});
