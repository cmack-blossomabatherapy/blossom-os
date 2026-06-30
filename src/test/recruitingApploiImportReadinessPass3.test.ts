import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Recruiting Pass 3 — Apploi import readiness", () => {
  it("status + import helpers exist in useApploiIntegration", () => {
    const src = read("src/hooks/useApploiIntegration.ts");
    expect(src).toMatch(/useApploiIntegrationStatus/);
    expect(src).toMatch(/useApploiNormalizedCandidates/);
    expect(src).toMatch(/importApploiNormalizedRecords/);
    // Reads platform integration tables, not a fake source.
    expect(src).toMatch(/integration_connections/);
    expect(src).toMatch(/integration_normalized_records/);
    // Maps into recruiting_candidates with Apploi source tag.
    expect(src).toMatch(/recruiting_candidates/);
    expect(src).toMatch(/"Apploi"/);
    // Honest not-connected behavior is gated through the centralized helper.
    expect(src).toMatch(/notifyApploiNotConnected/);
  });

  it("pipeline page wires Apploi import through the live readiness path", () => {
    const src = read("src/pages/os/OSRecruitingPipeline.tsx");
    expect(src).toMatch(/useApploiIntegrationStatus/);
    expect(src).toMatch(/importApploiNormalizedRecords/);
  });

  it("no Apploi API secrets are referenced in any src/ frontend file", () => {
    const walk = (dir: string, acc: string[] = []) => {
      for (const entry of fs.readdirSync(dir)) {
        const p = path.join(dir, entry);
        const st = fs.statSync(p);
        if (st.isDirectory()) walk(p, acc);
        else if (/\.(ts|tsx|js|jsx)$/.test(entry)) acc.push(p);
      }
      return acc;
    };
    const files = walk(path.join(process.cwd(), "src"));
    const BAD = /APPLOI_API_KEY|APPLOI_SECRET|apploi[_-]?api[_-]?key|apploi[_-]?secret/i;
    for (const f of files) {
      const src = fs.readFileSync(f, "utf8");
      expect(src, `${f} must not reference Apploi API secret env vars`).not.toMatch(BAD);
    }
  });
});
