import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (e.endsWith(".tsx") || e.endsWith(".ts")) out.push(p);
  }
  return out;
}

const files = ["src/pages/rbt", "src/pages/bcba"].flatMap(walk);

describe("role page canonical-card contract", () => {
  it("every CanonicalSessionsCard usage passes roleRowCount or is guarded", () => {
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      const idx = src.indexOf("<CanonicalSessionsCard");
      if (idx < 0) continue;
      let cursor = 0;
      while (true) {
        const at = src.indexOf("<CanonicalSessionsCard", cursor);
        if (at < 0) break;
        const end = src.indexOf("/>", at);
        const propsBlock = end > 0 ? src.slice(at, end) : src.slice(at, at + 1000);
        const hasRoleRowCount = /roleRowCount\s*=/.test(propsBlock);
        const preceding = src.slice(Math.max(0, at - 1400), at);
        const isGuarded = /(===\s*null|\.length\s*===\s*0|===\s*0)\s*&&\s*[\s\S]*?<>?\s*$/m.test(
          preceding,
        ) || /(===\s*null|\.length\s*===\s*0)/m.test(preceding.split(/<\/?CardFrame|<\/?div>/).pop() ?? "") ||
          /(rows|records|snap|list|items)\s*[!=]==\s*null[\s\S]{0,600}$/m.test(preceding) ||
          /\.length\s*===\s*0[\s\S]{0,600}$/m.test(preceding);
        if (!hasRoleRowCount && !isGuarded) offenders.push(f);
        cursor = at + 1;
      }
    }
    expect(offenders).toEqual([]);
  });

  it("Hours/Performance/Supervision RBT pages use canonicalRoleBridge as PRIMARY (no additive card)", () => {
    for (const p of [
      "src/pages/rbt/app/active/Hours.tsx",
      "src/pages/rbt/app/active/Performance.tsx",
      "src/pages/rbt/app/active/Supervision.tsx",
    ]) {
      const src = readFileSync(p, "utf8");
      expect(src.includes("CanonicalSessionsCard"), `${p} should not use CanonicalSessionsCard`).toBe(false);
      expect(/canonicalRoleBridge/.test(src), `${p} must import canonicalRoleBridge`).toBe(true);
    }
  });
});
