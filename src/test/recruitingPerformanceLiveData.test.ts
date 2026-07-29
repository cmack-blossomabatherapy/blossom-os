import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";

const page = readFileSync("src/pages/os/OSRecruitingPerformance.tsx", "utf8");
const hook = readFileSync("src/hooks/useRecruitingCandidates.ts", "utf8");

describe("Recruiting Performance uses live data and real actions", () => {
  it("has no fabricated trend or sparkline arrays", () => {
    expect(page).not.toContain("Apploi source quality");
    expect(page).not.toContain("[12, 10, 11, 9, 8, 9, 7]");
    expect(page).not.toContain("12.4");
    expect(page.match(/spark=\{\[/g)).toBeNull();
  });

  it("derives trends from live records", () => {
    expect(page).toContain("weeklySeries(liveCandidates.map");
    expect(page).toContain("weeklySeries(liveOffers.map");
    expect(page).toContain("weeklySeries(liveStaffingNeeds.map");
    expect(page).toContain("hasHistory");
  });

  it("wires export, quick actions and AI to real behaviour", () => {
    expect(page).toContain("downloadCsv");
    expect(page).toContain("onClick={exportSnapshot}");
    expect(page).toContain("useBlossomAI");
    expect(page).toContain("OperationalInsightsButton");
    expect(page).not.toContain("setAiOpen");
  });

  it("escalate button persists an escalation", () => {
    expect(page).toContain("createEscalation({");
    expect(hook).toContain("const createEscalation = useCallback");
    expect(hook).toContain('.from("recruiting_escalations").insert(');
  });

  it("quick actions all have handlers", () => {
    const qas = page.match(/<QA [^/]*\/>/g) ?? [];
    expect(qas.length).toBeGreaterThan(0);
    qas.forEach((q) => expect(q).toContain("onClick="));
  });
});
