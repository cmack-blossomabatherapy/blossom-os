import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  resources,
  resourceCategories,
  isVisibleToRole,
  isAttachmentPending,
  visibleResources,
} from "@/lib/resources/resourceData";
import { SD_SOPS_BY_WEEK } from "@/lib/training/academyData";

describe("Resource Library — categories", () => {
  it("has all core categories", () => {
    const ids = resourceCategories.map((c) => c.id);
    for (const wanted of [
      "sops", "hr", "training", "insurance", "systems",
      "workflows", "templates", "leadership", "operational", "communication",
    ]) {
      expect(ids).toContain(wanted);
    }
  });
});

describe("Resource Library — HR handbooks", () => {
  it("seeds handbook resources for the key roles", () => {
    const handbooks = resources.filter((r) => r.resourceType === "handbook");
    const titles = handbooks.map((r) => r.title);
    for (const wanted of [
      "Employee Handbook",
      "RBT Handbook",
      "BCBA Handbook",
      "State Director Handbook",
    ]) {
      expect(titles).toContain(wanted);
    }
  });
});

describe("Resource Library — State Director SOPs", () => {
  const titles = new Set(resources.map((r) => r.title));

  it("every named State Director SOP exists in the catalog", () => {
    const missing: string[] = [];
    for (const days of Object.values(SD_SOPS_BY_WEEK)) {
      for (const list of Object.values(days)) {
        for (const sop of list) {
          if (!titles.has(sop)) missing.push(sop);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe("Resource Library — pending attachments", () => {
  it("pending resources do not carry a URL anchor", () => {
    const pending = resources.filter((r) => r.attachmentStatus === "pending_upload");
    expect(pending.length).toBeGreaterThan(0);
    for (const r of pending) {
      expect(r.url ?? "").toBe("");
      expect(r.fileUrl ?? "").toBe("");
      expect(isAttachmentPending(r)).toBe(true);
    }
  });

  it("OSResourceLibrary renders pending state instead of a broken anchor", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "src/pages/os/OSResourceLibrary.tsx"),
      "utf8",
    );
    expect(src).toMatch(/Attachment pending/);
    expect(src).toMatch(/resource-attachment-pending/);
    // Detail panel must no longer fall back to href="#"
    expect(src).not.toMatch(/href=\{selected\.url \|\| selected\.fileUrl \|\| "#"\}/);
  });
});

describe("Resource Library — credential / vault exclusion", () => {
  it("hides credential/login/vault entries from the standard library", () => {
    const everyone = visibleResources("rbt");
    const titles = everyone.map((r) => r.title.toLowerCase());
    for (const banned of ["login", "password", "credential", "vault"]) {
      expect(titles.every((t) => !t.includes(banned))).toBe(true);
    }
    // No tag should leak credential-style content either.
    for (const r of everyone) {
      expect(r.tags.every((t) => !/password|credential|vault/i.test(t))).toBe(true);
    }
  });

  it("Systems & Logins Directory is filtered out for non-admin roles", () => {
    const r = resources.find((x) => x.id === "r-system-logins");
    expect(r).toBeDefined();
    expect(isVisibleToRole(r!, "rbt")).toBe(false);
    expect(isVisibleToRole(r!, "state_director")).toBe(false);
    expect(isVisibleToRole(r!, "operations_leadership")).toBe(false);
  });
});

describe("Resource Library — route preserved", () => {
  it("/resource-library route still exists", () => {
    const app = fs.readFileSync(path.join(process.cwd(), "src/App.tsx"), "utf8");
    expect(app).toMatch(/path="\/resource-library"/);
  });
});

describe("Resource Library — audit doc", () => {
  it("audit doc exists", () => {
    const p = path.join(process.cwd(), "docs/resource-library-loading-audit.md");
    expect(fs.existsSync(p)).toBe(true);
  });
});