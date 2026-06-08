/**
 * Resource Library smart collections — role visibility, learner-safety,
 * search/category coexistence, and admin/learner split.
 */
import { describe, it, expect } from "vitest";
import {
  collectSmartCollections,
  countAdminHiddenResources,
  SMART_COLLECTIONS,
  isResourceOpenable,
} from "@/lib/resources/smartCollections";
import { isVisibleToRole, searchResources } from "@/lib/resources/resourceData";
import type { Resource } from "@/lib/resources/resourceData";
import { SD_SOP_MANIFEST } from "@/lib/resources/stateDirectorSopManifest";
import type { OSRole } from "@/lib/os/permissions";
import fs from "node:fs";

function mk(overrides: Partial<Resource>): Resource {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    title: overrides.title ?? "Sample",
    description: overrides.description ?? "",
    type: overrides.type ?? "SOP",
    category: overrides.category ?? "operational",
    status: "Published",
    roles: overrides.roles ?? [],
    departments: [],
    states: overrides.states ?? [],
    tags: overrides.tags ?? [],
    uploadedBy: "—",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    url: overrides.url ?? "https://example.test/file.pdf",
    uploadStatus: overrides.uploadStatus ?? "published",
    attachmentStatus: overrides.attachmentStatus ?? "available",
    sensitivity: overrides.sensitivity,
    resourceType: overrides.resourceType,
    ...overrides,
  } as Resource;
}

const SD_TITLE = SD_SOP_MANIFEST[0].title;
const SD_ROLES: OSRole[] = [
  "state_director",
  "operations_leadership",
  "executive_leadership",
  "super_admin",
];

describe("smart collections — role visibility & SD launch", () => {
  it("State Director Launch collection is present for SD and leadership roles", () => {
    for (const role of SD_ROLES) {
      const out = collectSmartCollections([], role);
      const ids = out.map((c) => c.collection.id);
      expect(ids).toContain("state-director-launch");
    }
  });

  it("RBT and BCBA never see the State Director Launch collection or its SOPs", () => {
    const sdSop = mk({
      title: SD_TITLE,
      roles: SD_ROLES,
      uploadStatus: "published",
      url: "https://example.test/sd.pdf",
    });
    for (const role of ["rbt", "bcba"] as OSRole[]) {
      const out = collectSmartCollections([sdSop], role);
      const sdCol = out.find((c) => c.collection.id === "state-director-launch");
      expect(sdCol, `role ${role} should not see SD launch collection`).toBeUndefined();
      // And the SOP itself must not appear in any other collection for them.
      const allItems = out.flatMap((c) => c.items.map((i) => i.id));
      expect(allItems).not.toContain(sdSop.id);
    }
  });

  it("Leadership Library is gated to leadership / super_admin roles", () => {
    const lead = mk({ title: "State Playbook", category: "leadership", roles: [] });
    expect(collectSmartCollections([lead], "rbt").find((c) => c.collection.id === "leadership-library")).toBeUndefined();
    expect(collectSmartCollections([lead], "state_director").find((c) => c.collection.id === "leadership-library")?.items).toHaveLength(1);
  });
});

describe("smart collections — learner safety", () => {
  it("held / vault / excluded / pending resources never appear in any collection", () => {
    const offenders: Resource[] = [
      mk({ title: SD_TITLE, uploadStatus: "privacy_review", url: "https://x" }),
      mk({ title: SD_TITLE, uploadStatus: "business_review", url: "https://x" }),
      mk({ title: SD_TITLE, uploadStatus: "needs_conversion", url: "https://x" }),
      mk({ title: SD_TITLE, uploadStatus: "vault_only", url: "https://x" }),
      mk({ title: SD_TITLE, uploadStatus: "excluded", url: "https://x" }),
      mk({ title: SD_TITLE, uploadStatus: "pending_review", url: "https://x" }),
      mk({ title: SD_TITLE, sensitivity: "excluded", url: "https://x" }),
      mk({ title: SD_TITLE, attachmentStatus: "pending_upload", url: undefined }),
      mk({ title: "Login credentials", url: "https://x" }),
    ];
    const out = collectSmartCollections(offenders, "state_director");
    for (const c of out) {
      expect(c.items, `collection ${c.collection.id} leaked`).toHaveLength(0);
    }
  });

  it("Open button only appears for openable resources (isResourceOpenable)", () => {
    const openable = mk({ title: "X", url: "https://x" });
    const closed = mk({ title: "Y", url: undefined, fileUrl: undefined });
    expect(isResourceOpenable(openable)).toBe(true);
    expect(isResourceOpenable(closed)).toBe(false);
    // Smart collection drops non-openable items even if they would match.
    const sop = mk({ title: "Some SOP", type: "SOP", url: undefined, fileUrl: undefined });
    const out = collectSmartCollections([sop], "state_director");
    const sopCol = out.find((c) => c.collection.id === "sops-workflows");
    expect(sopCol?.items ?? []).toHaveLength(0);
  });
});

describe("smart collections — state scope", () => {
  it("state-scoped resources only appear when activeState matches", () => {
    const ncSop = mk({
      title: "NC Auth Workflow",
      states: ["NC"],
      roles: ["state_director"],
      url: "https://x",
    });
    const inNc = collectSmartCollections([ncSop], "state_director", "NC")
      .flatMap((c) => c.items.map((i) => i.id));
    const inGa = collectSmartCollections([ncSop], "state_director", "GA")
      .flatMap((c) => c.items.map((i) => i.id));
    expect(inNc).toContain(ncSop.id);
    expect(inGa).not.toContain(ncSop.id);
  });
});

describe("smart collections — content classification", () => {
  it("classifies SOPs/Workflows, Templates/Checklists, Walkthroughs, Welcome, Role Guides", () => {
    const sop = mk({ id: "a", title: "Intake SOP", type: "SOP" });
    const tmpl = mk({ id: "b", title: "PR Template", type: "Template", category: "templates" });
    const tango = mk({ id: "c", title: "Central Reach Walkthrough", type: "Tango", category: "systems" });
    const welcome = mk({ id: "d", title: "Welcome to Blossom Video", type: "Video", url: "https://x" });
    const roleGuide = mk({ id: "e", title: "Director Quickstart", roles: ["state_director"] });
    const out = collectSmartCollections([sop, tmpl, tango, welcome, roleGuide], "state_director");
    const byId = Object.fromEntries(out.map((c) => [c.collection.id, c.items.map((i) => i.id)]));
    expect(byId["sops-workflows"]).toContain("a");
    expect(byId["templates-checklists"]).toContain("b");
    expect(byId["systems-walkthroughs"]).toContain("c");
    expect(byId["welcome-to-blossom"]).toContain("d");
    expect(byId["my-role-guides"]).toContain("e");
  });
});

describe("search and admin/learner split", () => {
  it("search finds resources by title, tag, category, and type", () => {
    const a = mk({ id: "a", title: "Authorization Renewal Checklist", tags: ["auth"], type: "Checklist" });
    const b = mk({ id: "b", title: "Random", tags: ["leadership-playbook"] });
    const c = mk({ id: "c", title: "Random 2", category: "insurance" });
    const list = [a, b, c];
    expect(searchResources("authorization", list).map((r) => r.id)).toContain("a");
    expect(searchResources("leadership-playbook", list).map((r) => r.id)).toContain("b");
    expect(searchResources("insurance", list).map((r) => r.id)).toContain("c");
    expect(searchResources("checklist", list).map((r) => r.id)).toContain("a");
  });

  it("countAdminHiddenResources counts held/vault/excluded/pending only", () => {
    const published = mk({ id: "p", uploadStatus: "published", url: "https://x" });
    const pending = mk({ id: "q", uploadStatus: "pending_review", url: "https://x" });
    const vault = mk({ id: "v", uploadStatus: "vault_only", url: "https://x" });
    expect(countAdminHiddenResources([published, pending, vault])).toBe(2);
  });

  it("isVisibleToRole hides non-published learner rows", () => {
    const held = mk({ uploadStatus: "privacy_review" });
    expect(isVisibleToRole(held, "state_director")).toBe(false);
  });
});

describe("OSResourceLibrary source — smart collections + admin links", () => {
  it("smart-collections section, generic categories, and admin Manage/Add links remain", () => {
    const SRC = fs.readFileSync("src/pages/os/OSResourceLibrary.tsx", "utf8");
    // Smart collections grid is present.
    expect(SRC).toMatch(/data-testid="smart-collections"/);
    // Generic categories survive below smart collections.
    expect(SRC).toMatch(/Browse by category/);
    // Admin links route to Resource Upload Center / Resource Management.
    expect(SRC).toMatch(/\/hr\/resource-management/);
    // Learner-friendly empty state for SD launch.
    expect(SRC).toMatch(/keep moving in the Academy/i);
  });

  it("registers all 8 smart collections", () => {
    const ids = SMART_COLLECTIONS.map((c) => c.id).sort();
    expect(ids).toEqual(
      [
        "handbooks-policies",
        "leadership-library",
        "my-role-guides",
        "sops-workflows",
        "state-director-launch",
        "systems-walkthroughs",
        "templates-checklists",
        "welcome-to-blossom",
      ].sort(),
    );
  });
});
