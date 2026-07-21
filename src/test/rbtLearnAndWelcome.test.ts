// Verifies the RBT Learn + Welcome experience contract:
//   • /rbt/app/welcome route wired in App.tsx to RbtWelcome
//   • WelcomeToBlossomCard accepts a target and points at the RBT welcome
//   • RbtLearn shows: pathway CTA, Skill Passport, RetentionSupportPanel,
//     BCBA Fellowship link, support link
//   • useProgram calls ensure_my_rbt_pathway_assignment when no assignment
//   • Recruiting-owned CHECK migration exists with "certified requires years"
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const read = (rel: string) => readFileSync(path.resolve(process.cwd(), rel), "utf8");

describe("RBT Welcome route + Learn academy contract", () => {
  it("App.tsx registers /rbt/app/welcome -> RbtWelcome", () => {
    const src = read("src/App.tsx");
    expect(src).toMatch(/import\s+RbtWelcome\s+from\s+"\.\/pages\/rbt\/app\/welcome\/RbtWelcome"/);
    expect(src).toMatch(/path="\/rbt\/app\/welcome"\s+element=\{<RbtWelcome\s*\/>/);
  });

  it("WelcomeToBlossomCard supports a custom target prop", () => {
    const src = read("src/components/onboarding/WelcomeToBlossomCard.tsx");
    expect(src).toMatch(/to\s*=\s*"\/training\/welcome"/);
    expect(src).toMatch(/{\s*to\s*=\s*"\/training\/welcome"\s*}/);
  });

  it("RbtWelcome links back to /rbt/app/learn", () => {
    const src = read("src/pages/rbt/app/welcome/RbtWelcome.tsx");
    expect(src).toMatch(/to="\/rbt\/app\/learn"/);
  });

  it("RbtLearn passes to='/rbt/app/welcome' to WelcomeToBlossomCard", () => {
    const src = read("src/pages/rbt/app/pages.tsx");
    expect(src).toMatch(/WelcomeToBlossomCard\s+to="\/rbt\/app\/welcome"/);
  });

  it("RbtLearn surfaces Skill Passport, Retention support, Fellowship, and Support", () => {
    const src = read("src/pages/rbt/app/pages.tsx");
    expect(src).toMatch(/RetentionSupportPanel/);
    expect(src).toMatch(/\/rbt\/app\/passport/);
    expect(src).toMatch(/\/rbt\/app\/growth\/fellowship/);
    expect(src).toMatch(/\/rbt\/app\/support/);
  });

  it("useProgram calls ensure_my_rbt_pathway_assignment when no assignment exists", () => {
    const src = read("src/pages/rbt/app/training/useProgram.ts");
    expect(src).toMatch(/ensure_my_rbt_pathway_assignment/);
    expect(src).toMatch(/needsRecruitingData/);
  });
});

describe("Corrective migration: certified requires years (real DB CHECK)", () => {
  it("migration file exists and adds a real CHECK constraint", () => {
    const dir = path.resolve(process.cwd(), "supabase/migrations");
    const files = readdirSync(dir).filter((f) => f.endsWith(".sql"));
    const hits = files.map((f) => ({ f, src: readFileSync(path.join(dir, f), "utf8") }))
      .filter((x) =>
        /rbt_certified_requires_years/.test(x.src) &&
        /ADD CONSTRAINT/i.test(x.src) &&
        /VALIDATE CONSTRAINT/i.test(x.src),
      );
    expect(hits.length).toBeGreaterThan(0);
    const src = hits[0].src;
    // certified requires non-null years
    expect(src).toMatch(/rbt_certification_status\s+IS DISTINCT FROM\s+'certified'/i);
    expect(src).toMatch(/rbt_years_experience_direct\s+IS NOT NULL/i);
    // handles invalid rows explicitly (does not silently swallow)
    expect(src).toMatch(/recruiting_pathway_data_quality/);
    // NOT VALID -> VALIDATE pattern (loud on failure)
    expect(src).toMatch(/NOT VALID/);
  });
});