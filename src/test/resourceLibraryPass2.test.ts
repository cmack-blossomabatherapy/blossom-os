import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  classifyUploadCandidate,
  inferRolesForUpload,
  candidateToResource,
  containsCredentialKeywords,
  containsPrivacyReviewKeywords,
  isVisibleToRole,
  NON_PUBLIC_UPLOAD_STATUSES,
  UPLOAD_STATUS_LABEL,
  type Resource,
  type ResourceUploadStatus,
  type UploadCandidate,
} from "@/lib/resources/resourceData";

const PANEL = fs.readFileSync(
  "src/components/resources/ResourceBulkUploadPanel.tsx",
  "utf8",
);
const MGMT = fs.readFileSync("src/pages/hr/ResourceUploadCenter.tsx", "utf8");
const LIBRARY = fs.readFileSync("src/pages/os/OSResourceLibrary.tsx", "utf8");

function makeCandidate(overrides: Partial<UploadCandidate> = {}): UploadCandidate {
  return {
    fileName: "Sample.pdf",
    title: "Sample",
    description: "—",
    resourceType: "guide",
    category: "operational",
    type: "PDF",
    roles: ["operations_leadership", "super_admin"],
    departments: [],
    states: [],
    tags: [],
    sensitivity: "public_internal",
    uploadStatus: "ready_to_upload",
    ...overrides,
  };
}

describe("Pass 2 — auto-classification", () => {
  it("flags credential / login / vault files as vault_only", () => {
    for (const name of ["My Logins.pdf", "Password Vault.docx", "Portal Credentials.xlsx"]) {
      const c = classifyUploadCandidate({ fileName: name });
      expect(c.uploadStatus).toBe("vault_only");
      expect(c.sensitivity).toBe("admin_only");
    }
  });

  it("excludes anything under _Sensitive_Not_For_Shared_Context", () => {
    const c = classifyUploadCandidate({
      fileName: "Secret.pdf",
      path: "/Current Materials/_Sensitive_Not_For_Shared_Context/Secret.pdf",
    });
    expect(c.uploadStatus).toBe("excluded");
  });

  it("routes filled-in / consent / named-person docs to privacy_review", () => {
    for (const name of [
      "Consent Form Filled In.pdf",
      "John Smith Personal Message.docx",
      "Generic Document.pdf",
    ]) {
      const c = classifyUploadCandidate({ fileName: name });
      expect(c.uploadStatus).toBe("privacy_review");
    }
  });

  it("routes heic/pages/numbers/key files to needs_conversion", () => {
    for (const name of ["chart.heic", "doc.pages", "sheet.numbers", "deck.key"]) {
      const c = classifyUploadCandidate({ fileName: name });
      expect(c.uploadStatus).toBe("needs_conversion");
    }
  });

  it("defaults safe files to ready_to_upload", () => {
    const c = classifyUploadCandidate({ fileName: "Intake Workflow SOP.pdf" });
    expect(c.uploadStatus).toBe("ready_to_upload");
    expect(c.sensitivity).toBe("public_internal");
  });
});

describe("Pass 2 — keyword helpers", () => {
  it("containsCredentialKeywords catches obvious variants", () => {
    for (const t of ["Login Sheet", "PASSWORD vault", "credentials list", "portal accounts"]) {
      expect(containsCredentialKeywords(t)).toBe(true);
    }
    expect(containsCredentialKeywords("Intake SOP")).toBe(false);
  });
  it("containsPrivacyReviewKeywords catches PHI-like cues", () => {
    expect(containsPrivacyReviewKeywords("Consent signed")).toBe(true);
    expect(containsPrivacyReviewKeywords("Plain workflow")).toBe(false);
  });
});

describe("Pass 2 — role inference", () => {
  it("HR handbooks map to HR + leadership + super_admin", () => {
    const roles = inferRolesForUpload({ category: "hr", title: "Employee Handbook" });
    for (const r of ["hr_team", "operations_leadership", "executive_leadership", "super_admin"]) {
      expect(roles).toContain(r);
    }
  });
  it("RBT-tagged resources include rbt, bcba, SD, ops, super_admin", () => {
    const roles = inferRolesForUpload({ category: "operational", title: "RBT Session Guide", tags: ["rbt"] });
    for (const r of ["rbt", "bcba", "state_director", "operations_leadership", "super_admin"]) {
      expect(roles).toContain(r);
    }
  });
  it("BCBA-tagged resources include bcba, qa_team, SD, ops, super_admin", () => {
    const roles = inferRolesForUpload({ category: "sops", title: "BCBA Supervision SOP", tags: ["bcba"] });
    for (const r of ["bcba", "qa_team", "state_director", "operations_leadership", "super_admin"]) {
      expect(roles).toContain(r);
    }
  });
  it("Scheduling / CentralReach resources include scheduling, bcba, SD, ops, super_admin", () => {
    const roles = inferRolesForUpload({ category: "systems", title: "CentralReach Scheduling Guide" });
    for (const r of ["scheduling_team", "bcba", "state_director", "operations_leadership", "super_admin"]) {
      expect(roles).toContain(r);
    }
  });
  it("Recruiting resources include recruiting, hr, ops, super_admin", () => {
    const roles = inferRolesForUpload({ category: "workflows", title: "Recruiting Workflow" });
    for (const r of ["recruiting_team", "hr_team", "operations_leadership", "super_admin"]) {
      expect(roles).toContain(r);
    }
  });
  it("Authorization/payer resources include auth, bcba, SD, ops, super_admin", () => {
    const roles = inferRolesForUpload({ category: "insurance", title: "Payer Reauthorization Guide" });
    for (const r of ["authorization_coordinator", "bcba", "state_director", "operations_leadership", "super_admin"]) {
      expect(roles).toContain(r);
    }
  });
  it("Finance/payroll/bonus resources include billing, payroll, hr, ops, exec, super_admin", () => {
    const roles = inferRolesForUpload({ category: "operational", title: "Payroll Bonus Workflow", tags: ["payroll"] });
    for (const r of ["billing_finance", "payroll_coordinator", "hr_team", "operations_leadership", "executive_leadership", "super_admin"]) {
      expect(roles).toContain(r);
    }
  });
  it("Leadership / State Director resources include SD, ops, exec, hr, super_admin", () => {
    const roles = inferRolesForUpload({ category: "leadership", title: "State Director Playbook" });
    for (const r of ["state_director", "operations_leadership", "executive_leadership", "hr_team", "super_admin"]) {
      expect(roles).toContain(r);
    }
  });
  it("Phone System resources include intake, scheduling, auth, recruiting, hr, SD, ops, super_admin", () => {
    const roles = inferRolesForUpload({ category: "systems", title: "Phone System Operational Guide" });
    for (const r of ["intake_coordinator", "scheduling_team", "authorization_coordinator", "recruiting_team", "hr_team", "state_director", "operations_leadership", "super_admin"]) {
      expect(roles).toContain(r);
    }
  });
});

describe("Pass 2 — visibility rules", () => {
  it("non-public upload statuses are hidden from every standard role", () => {
    for (const status of NON_PUBLIC_UPLOAD_STATUSES) {
      const r = candidateToResource(makeCandidate({ uploadStatus: status }));
      // Force `status: Published` so we know visibility is gated by uploadStatus only.
      const forced: Resource = { ...r, status: "Published" };
      for (const role of ["rbt", "bcba", "state_director", "hr_team", "operations_leadership"] as const) {
        expect(isVisibleToRole(forced, role)).toBe(false);
      }
    }
  });

  it("published candidates surface only to roles in their assignment", () => {
    const r = candidateToResource(makeCandidate({
      uploadStatus: "published",
      roles: ["rbt", "bcba", "super_admin"],
    }));
    const forced: Resource = { ...r, status: "Published" };
    expect(isVisibleToRole(forced, "rbt")).toBe(true);
    expect(isVisibleToRole(forced, "bcba")).toBe(true);
    expect(isVisibleToRole(forced, "hr_team")).toBe(false);
    expect(isVisibleToRole(forced, "super_admin")).toBe(true);
  });

  it("vault-only resources never reach the standard library", () => {
    const r = candidateToResource(makeCandidate({
      uploadStatus: "vault_only",
      sensitivity: "admin_only",
    }));
    const forced: Resource = { ...r, status: "Published" };
    for (const role of ["rbt", "bcba", "state_director", "operations_leadership", "executive_leadership", "super_admin"] as const) {
      expect(isVisibleToRole(forced, role)).toBe(false);
    }
  });

  it("credential keywords are blocked even if a row sneaks past status checks", () => {
    const r = candidateToResource(makeCandidate({
      title: "Vault password sheet",
      uploadStatus: "published",
      roles: ["super_admin"],
    }));
    const forced: Resource = { ...r, status: "Published" };
    expect(isVisibleToRole(forced, "super_admin")).toBe(false);
  });

  it("state scope is honored", () => {
    const r = candidateToResource(makeCandidate({
      uploadStatus: "published",
      roles: ["hr_team"],
      states: ["GA"],
    }));
    const forced: Resource = { ...r, status: "Published" };
    expect(isVisibleToRole(forced, "hr_team", "GA")).toBe(true);
    expect(isVisibleToRole(forced, "hr_team", "NC")).toBe(false);
  });
});

describe("Pass 2 — Resource Management surfaces the bulk upload panel", () => {
  it("ResourceManagement renders the bulk upload panel", () => {
    expect(MGMT).toMatch(/ResourceBulkUploadPanel/);
  });

  it("bulk upload panel exposes all review queues", () => {
    for (const label of [
      "Ready to publish",
      "Needs privacy review",
      "Needs business review",
      "Needs conversion",
      "Vault only",
      "Excluded",
    ]) {
      expect(PANEL).toContain(label);
    }
  });

  it("bulk upload panel exposes file picker + publish/hold/vault actions", () => {
    expect(PANEL).toMatch(/data-testid="bulk-upload-file-input"/);
    expect(PANEL).toMatch(/Publish ready resources/);
    expect(PANEL).toMatch(/data-testid="action-mark-ready"/);
    expect(PANEL).toMatch(/data-testid="action-hold-review"/);
    expect(PANEL).toMatch(/data-testid="action-vault-only"/);
    expect(PANEL).toMatch(/data-testid="action-exclude"/);
  });
});

describe("Pass 2 — user Resource Library only shows published items", () => {
  it("OSResourceLibrary still routes through visibleResources / isVisibleToRole", () => {
    expect(LIBRARY).toMatch(/isVisibleToRole/);
  });

  it("pending upload resources still render without broken links", () => {
    expect(LIBRARY).toMatch(/Attachment pending/);
    expect(LIBRARY).not.toMatch(/href=\{selected\.url \|\| selected\.fileUrl \|\| "#"\}/);
  });
});

describe("Pass 2 — status label coverage", () => {
  it("every ResourceUploadStatus has a friendly label", () => {
    const statuses: ResourceUploadStatus[] = [
      "ready_to_upload",
      "pending_review",
      "needs_conversion",
      "privacy_review",
      "business_review",
      "vault_only",
      "excluded",
      "published",
    ];
    for (const s of statuses) expect(UPLOAD_STATUS_LABEL[s]).toBeTruthy();
  });
});