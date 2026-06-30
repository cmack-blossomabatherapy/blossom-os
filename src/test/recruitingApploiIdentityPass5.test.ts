import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Recruiting Pass 5a — candidate identity foundation", () => {
  it("candidateIdentity module exposes the canonical helpers", () => {
    const src = read("src/lib/recruiting/candidateIdentity.ts");
    expect(src).toMatch(/APPLOI_TAG_PREFIX\s*=\s*"apploi:"/);
    expect(src).toMatch(/export function isCandidateUuid/);
    expect(src).toMatch(/export function apploiTagFor/);
    expect(src).toMatch(/export function extractApploiExternalId/);
    expect(src).toMatch(/export function candidateKey/);
    expect(src).toMatch(/export async function resolveCandidateUuid/);
    // Apploi lookup must use the tag column, not a fuzzy match on id.
    expect(src).toMatch(/\.contains\("tags",\s*\[identifier\]\)/);
  });

  it("useRecruitingCandidateLookup hook is wired to the identity helpers", () => {
    const src = read("src/hooks/useRecruitingCandidateLookup.ts");
    expect(src).toMatch(/from "@\/lib\/recruiting\/candidateIdentity"/);
    expect(src).toMatch(/extractApploiExternalId/);
    expect(src).toMatch(/resolveCandidateUuid/);
    expect(src).toMatch(/export function useRecruitingCandidateLookup/);
    expect(src).toMatch(/export function useResolvedCandidateUuid/);
    // No direct .eq("id", apploiTag) anti-pattern.
    expect(src).not.toMatch(/\.eq\("id",\s*identifier\)/);
  });

  it("Apploi importer continues to stamp the apploi:<id> tag", () => {
    const src = read("src/hooks/useApploiIntegration.ts");
    expect(src).toMatch(/`apploi:\$\{externalId\}`/);
  });

  it("page substage moves still gate on a real UUID before mutating", () => {
    const src = read("src/lib/recruiting/stageMapping.ts");
    // runPageStageMove must keep its UUID guard so Apploi-tag rows don't
    // accidentally mutate the wrong candidate.
    expect(src).toMatch(/if \(!\/\^\[0-9a-f-\]\{36\}\$\/i\.test\(candidateId\)\) return;/);
  });
});
