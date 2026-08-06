import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const APP = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");

function guardFor(marker: string): string {
  const idx = APP.indexOf(marker);
  expect(idx, `marker not found: ${marker}`).toBeGreaterThan(-1);
  const start = APP.lastIndexOf("allowedRoles={[", idx);
  return APP.slice(start, APP.indexOf("]}", start));
}

describe("Admin 'View as role' can reach clinician shells", () => {
  it("/rbt/app allows super_admin", () => {
    const g = guardFor("<RbtAppShell />");
    expect(g).toContain('"super_admin"');
    expect(g).toContain('"rbt"');
  });

  it("/bcba allows super_admin", () => {
    const g = guardFor("<BcbaShell />");
    expect(g).toContain('"super_admin"');
    expect(g).toContain('"bcba"');
  });
});
