import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  isDuplicateCandidate,
  type Resource,
  type UploadCandidate,
} from "@/lib/resources/resourceData";
import { UPLOAD_QA_ITEMS } from "@/components/resources/UploadQAChecklist";
import {
  computeBatchSummary,
} from "@/components/resources/UploadBatchSummary";

const RUNBOOK_PATH = "docs/resource-library-operational-upload-runbook.md";
const RUNBOOK = fs.existsSync(RUNBOOK_PATH) ? fs.readFileSync(RUNBOOK_PATH, "utf8") : "";
const MGMT = fs.readFileSync("src/pages/hr/ResourceManagement.tsx", "utf8");
const PANEL = fs.readFileSync("src/components/resources/ResourceBulkUploadPanel.tsx", "utf8");
const LIBRARY = fs.readFileSync("src/pages/os/OSResourceLibrary.tsx", "utf8");

function candidate(over: Partial<UploadCandidate> = {}): UploadCandidate {
  return {
    fileName: "Employee Handbook.pdf",
    title: "Employee Handbook",
    description: "ready",
    resourceType: "handbook",
    category: "hr",
    type: "PDF",
    roles: ["hr_team", "super_admin"],
    departments: [],
    states: [],
    tags: ["handbook", "hr"],
    sensitivity: "public_internal",
    uploadStatus: "ready_to_upload",
    ...over,
  };
}

function resource(over: Partial<Resource> = {}): Resource {
  return {
    id: "r-x",
    title: "Employee Handbook",
    description: "—",
    type: "PDF",
    category: "hr",
    status: "Published",
    roles: ["hr_team"],
    departments: [],
    states: [],
    tags: [],
    uploadedBy: "HR",
    createdAt: "",
    updatedAt: "",
    uploadStatus: "published",
    ...over,
  };
}

describe("Pass 4 — runbook doc", () => {
  it("runbook file exists", () => {
    expect(fs.existsSync(RUNBOOK_PATH)).toBe(true);
  });

  it("covers all required sections", () => {
    for (const heading of [
      "Pre-upload checklist",
      "Batch order",
      "First batch recommendation",
      "How to upload ready files",
      "How to verify a successful upload",
      "How to verify role visibility",
      "How to verify state visibility",
      "How to test signed URL",
      "How to handle failed uploads",
      "How to handle duplicate uploads",
      "How to process held queues",
      "When to mark files excluded",
      "Post-upload QA checklist",
    ]) {
      expect(RUNBOOK).toContain(heading);
    }
  });

  it("lists the agreed batch order", () => {
    for (const cat of [
      "HR handbooks",
      "Training",
      "Scheduling",
      "Recruiting",
      "Authorization",
      "Intake",
      "Phone system",
      "payroll",
      "videos",
    ]) {
      expect(RUNBOOK.toLowerCase()).toContain(cat.toLowerCase());
    }
  });

  it("recommends a 10-20 file first batch and excludes risky files", () => {
    expect(RUNBOOK).toMatch(/10.?20/);
    for (const banned of ["payer", "wage", "offer letter", "I-9", "OneNote", "vault_only", "excluded"]) {
      expect(RUNBOOK.toLowerCase()).toContain(banned.toLowerCase());
    }
  });
});

describe("Pass 4 — Resource Management surfaces QA checklist + batch summary", () => {
  it("ResourceManagement renders the QA checklist", () => {
    expect(MGMT).toMatch(/UploadQAChecklist/);
  });

  it("ResourceManagement renders the batch summary", () => {
    expect(MGMT).toMatch(/UploadBatchSummary/);
  });

  it("checklist exposes every required QA item", () => {
    for (const item of [
      "Files classified before upload",
      "Only ready files selected",
      "No held files included",
      "Role assignments reviewed",
      "State scope reviewed",
      "Sensitive keywords checked",
      "Upload completed",
      "Open/download tested",
      "Normal user visibility checked",
      "Admin queue reviewed",
      "Failed uploads retried or removed",
    ]) {
      expect(UPLOAD_QA_ITEMS).toContain(item as any);
    }
  });
});

describe("Pass 4 — duplicate detection", () => {
  it("flags a title+category match with overlapping roles", () => {
    const existing = [resource({ roles: ["hr_team"] })];
    expect(isDuplicateCandidate(candidate(), existing)).toBe(true);
  });

  it("ignores non-published existing rows", () => {
    const existing = [resource({ uploadStatus: "privacy_review" })];
    expect(isDuplicateCandidate(candidate(), existing)).toBe(false);
  });

  it("does not flag different categories or titles", () => {
    expect(
      isDuplicateCandidate(
        candidate({ title: "RBT Handbook" }),
        [resource()],
      ),
    ).toBe(false);
    expect(
      isDuplicateCandidate(
        candidate({ category: "training" }),
        [resource()],
      ),
    ).toBe(false);
  });

  it("warning copy is rendered in the bulk upload panel", () => {
    expect(PANEL).toMatch(/data-testid="upload-candidate-duplicate"/);
    expect(PANEL).toMatch(/Possible duplicate/);
  });
});

describe("Pass 4 — batch summary helper", () => {
  it("counts published resources and surfaces queue + failed totals", () => {
    const items: Resource[] = [
      resource({ id: "a" }),
      resource({ id: "b", uploadStatus: "privacy_review", status: "Draft" }),
      resource({ id: "c" }),
    ];
    const out = computeBatchSummary(items, {
      ready_to_upload: 2,
      privacy_review: 1,
      vault_only: 1,
      excluded: 0,
    }, 3);
    expect(out.published).toBe(2);
    expect(out.ready_to_upload).toBe(2);
    expect(out.privacy_review).toBe(1);
    expect(out.vault_only).toBe(1);
    expect(out.excluded).toBe(0);
    expect(out.failed).toBe(3);
  });
});

describe("Pass 4 — protections preserved", () => {
  it("library still resolves signed URLs on open", () => {
    expect(LIBRARY).toMatch(/resolveResourceOpenUrl/);
  });

  it("library still hides non-published / vault / excluded", () => {
    expect(LIBRARY).toMatch(/isVisibleToRole/);
  });

  it("bulk panel still gates publish behind isUploadable", () => {
    expect(PANEL).toMatch(/isUploadable/);
  });
});