import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

const LEAD_DETAIL = read("src/pages/LeadDetail.tsx");
const OS_LEADS = read("src/pages/os/OSLeadsV2.tsx");
const OS_INTAKE = read("src/pages/os/OSIntakeOperations.tsx");
const DRAWER_CTX = read("src/contexts/LeadDrawerContext.tsx");

describe("LeadDetail page rebuild — full-page record", () => {
  it("renders inside OSShell (no popout Sheet)", () => {
    expect(LEAD_DETAIL).toMatch(/<OSShell>/);
    expect(LEAD_DETAIL).not.toMatch(/<LeadDetailDrawer/);
    expect(LEAD_DETAIL).not.toMatch(/<LeadDetailPanel/);
  });

  it("uses the canonical 13-step FAMILY pipeline (not the old 6-step progress)", () => {
    expect(LEAD_DETAIL).toMatch(/PipelineProgress/);
    expect(LEAD_DETAIL).toMatch(/FAMILY_LEAD_PIPELINE_STAGES/);
    // Old 6-dot progress removed.
    expect(LEAD_DETAIL).not.toMatch(/progressSteps\s*=\s*\[/);
    expect(LEAD_DETAIL).not.toMatch(/label:\s*"VOB Sent"/);
    expect(LEAD_DETAIL).not.toMatch(/label:\s*"VOB Received"/);
  });

  it("wires real dialogs and dedicated hooks — no window.prompt, no metadata-only uploads", () => {
    expect(LEAD_DETAIL).toMatch(/<EditLeadDialog/);
    expect(LEAD_DETAIL).toMatch(/<AddLeadNoteDialog/);
    expect(LEAD_DETAIL).toMatch(/<CreateLeadTaskDialog/);
    expect(LEAD_DETAIL).toMatch(/<LinkReferralDialog/);
    expect(LEAD_DETAIL).toMatch(/useLeadDocuments/);
    expect(LEAD_DETAIL).toMatch(/useLeadReferralLink/);
    expect(LEAD_DETAIL).toMatch(/useLeadUpdates/);
    expect(LEAD_DETAIL).toMatch(/IntakeCoordinatorPicker/);
    expect(LEAD_DETAIL).not.toMatch(/window\.prompt/);
    expect(LEAD_DETAIL).not.toMatch(/storage connection pending/i);
    // Hard-coded coordinator list is gone.
    expect(LEAD_DETAIL).not.toMatch(/const COORDINATORS\s*=/);
  });

  it("exposes URL-addressable tabs including the redesigned tab set", () => {
    expect(LEAD_DETAIL).toMatch(/useSearchParams/);
    for (const tab of [
      "overview", "family", "insurance", "documents", "tasks", "communications", "actions",
    ]) {
      expect(LEAD_DETAIL).toMatch(new RegExp(`value="${tab}"`));
    }
  });

  it("wires BenefitsCheatSheetMatchPanel and Ask Blossom AI", () => {
    expect(LEAD_DETAIL).toMatch(/BenefitsCheatSheetMatchPanel/);
    expect(LEAD_DETAIL).toMatch(/useBlossomAI/);
    expect(LEAD_DETAIL).toMatch(/Ask Blossom AI/);
  });

  it("preserves task deep-link highlight for /leads/:id?task=…", () => {
    expect(LEAD_DETAIL).toMatch(/useDeepLinkHighlight/);
    expect(LEAD_DETAIL).toMatch(/data-deeplink-id={`task-\$\{task\.id\}`}/);
  });

  it("Add Task button is no longer a no-op", () => {
    // Old code had `<Button ...><Circle .../> Add task</Button>` with no onClick.
    expect(LEAD_DETAIL).not.toMatch(/<Button[^>]*>\s*<Circle[^>]*\/>\s*Add task\s*<\/Button>/);
    expect(LEAD_DETAIL).toMatch(/setTaskOpen\("task"\)/);
  });
});

describe("Popout drawer is fully retired", () => {
  it("LeadDrawerContext no longer catches useNavigate errors", () => {
    expect(DRAWER_CTX).not.toMatch(/try\s*\{[\s\S]*useNavigate/);
    expect(DRAWER_CTX).toMatch(/const navigate = useNavigate\(\)/);
  });
  it("No production surface mounts <LeadDetailDrawer …/>", () => {
    expect(OS_LEADS).not.toMatch(/<LeadDetailDrawer\b/);
    expect(OS_INTAKE).not.toMatch(/<LeadDetailDrawer\b/);
  });
});