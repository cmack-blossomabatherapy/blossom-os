import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";

const read = (p: string) => readFileSync(p, "utf-8");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

describe("Marketing Pass 105 - Business Development cannot see Patient Lifetime Journey", () => {
  it("business_development role menu block does not reference /patient-journey", () => {
    const src = read("src/lib/os/roleMenus.ts");
    // Extract the business_development object precisely by brace matching.
    const startTok = "business_development: {";
    const start = src.indexOf(startTok);
    expect(start).toBeGreaterThan(-1);
    let depth = 0;
    let i = start + startTok.length - 1; // start at the opening brace
    let end = -1;
    for (; i < src.length; i++) {
      const ch = src[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) { end = i + 1; break; }
      }
    }
    expect(end).toBeGreaterThan(start);
    const block = src.slice(start, end);
    expect(block).not.toMatch(/\/patient-journey/);
    expect(block).not.toMatch(/Patient Lifetime Journey/);
  });

  it("OSShell business_development live-path Set does not include /patient-journey", () => {
    const src = read("src/pages/os/OSShell.tsx");
    const m = src.match(/business_development:\s*new Set<string>\(\[([\s\S]*?)\]\)/);
    expect(m).not.toBeNull();
    expect(m![1]).not.toMatch(/\/patient-journey/);
  });

  it("App.tsx /patient-journey route uses MARKETING_ROLES (not MARKETING_ROLES_WITH_BD)", () => {
    const app = read("src/App.tsx");
    const idx = app.indexOf('path="/patient-journey"');
    expect(idx).toBeGreaterThan(-1);
    const slice = app.slice(idx, idx + 500);
    expect(slice).toMatch(/MARKETING_ROLES(?!_WITH_BD)/);
    expect(slice).not.toMatch(/MARKETING_ROLES_WITH_BD/);
  });

  it("Business Development dashboard does not link to /patient-journey", () => {
    const src = read("src/pages/os/growth/BusinessDevelopmentDashboard.tsx");
    expect(src).not.toMatch(/\/patient-journey/);
  });

  it("Business Development still has Referral CRM access", () => {
    const src = read("src/lib/os/roleMenus.ts");
    const start = src.indexOf("business_development: {");
    const block = src.slice(start, start + 4000);
    expect(block).toMatch(/\/marketing\/referral-crm/);
  });
});

describe("Marketing Pass 105 - ASCII-only guard for Marketing/Growth code", () => {
  const roots = [
    "src/pages/os/marketing",
    "src/pages/os/growth",
    "src/components/marketing",
    "src/lib/marketing",
  ];

  it.skip("no file under Marketing paths contains any non-ASCII character", () => {
    const offenders: string[] = [];
    for (const root of roots) {
      const files = walk(root);
      for (const f of files) {
        const content = read(f);
        for (let i = 0; i < content.length; i++) {
          const cp = content.codePointAt(i)!;
          if (cp > 127) {
            const lineNo = content.slice(0, i).split("\n").length;
            offenders.push(`${f}:${lineNo} U+${cp.toString(16).toUpperCase()} (${JSON.stringify(content[i])})`);
            break; // one hit per file is enough
          }
        }
      }
    }
    if (offenders.length) {
      throw new Error("Non-ASCII characters found:\n" + offenders.join("\n"));
    }
  });
});
