import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";

// ---- supabase client mock (must be set up before importing the module) ----
const storageUpload = vi.fn();
const storageRemove = vi.fn();
const storageSign = vi.fn();
const insertFn = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: storageUpload,
        remove: storageRemove,
        createSignedUrl: storageSign,
      }),
    },
    from: () => ({
      insert: insertFn,
    }),
  },
}));

import {
  buildStoragePath,
  safeFileName,
  isUploadable,
  uploadAndPublishResource,
  resolveResourceOpenUrl,
  RESOURCE_LIBRARY_BUCKET,
  HELD_UPLOAD_STATUSES,
} from "@/lib/resources/resourceStorage";
import type { UploadCandidate, Resource } from "@/lib/resources/resourceData";

function makeCandidate(over: Partial<UploadCandidate> = {}): UploadCandidate {
  return {
    fileName: "Intake SOP.pdf",
    title: "Intake SOP",
    description: "Ready to publish",
    resourceType: "sop",
    category: "sops",
    type: "PDF",
    roles: ["intake_coordinator", "super_admin"],
    departments: ["Intake"],
    states: ["GA"],
    tags: ["intake", "sop"],
    sensitivity: "public_internal",
    uploadStatus: "ready_to_upload",
    ...over,
  };
}

function makeFile(name = "Intake SOP.pdf", type = "application/pdf", size = 1024): File {
  return new File([new Uint8Array(size)], name, { type });
}

beforeEach(() => {
  storageUpload.mockReset();
  storageRemove.mockReset();
  storageSign.mockReset();
  insertFn.mockReset();
});

describe("Pass 3 — path/safety helpers", () => {
  it("safeFileName lowercases and strips bad chars", () => {
    expect(safeFileName("My File!.PDF")).toBe("my-file.pdf");
    expect(safeFileName("../etc/passwd")).toBe("etc-passwd");
    expect(safeFileName("no-extension")).toBe("no-extension");
  });

  it("buildStoragePath uses category/id/safe-name", () => {
    expect(buildStoragePath("sops", "abc-123", "My SOP.pdf"))
      .toBe("sops/abc-123/my-sop.pdf");
  });

  it("isUploadable only accepts ready_to_upload", () => {
    expect(isUploadable(makeCandidate())).toBe(true);
    for (const s of HELD_UPLOAD_STATUSES) {
      expect(isUploadable(makeCandidate({ uploadStatus: s }))).toBe(false);
    }
    expect(isUploadable(makeCandidate({ uploadStatus: "published" }))).toBe(false);
  });

  it("RESOURCE_LIBRARY_BUCKET is the dedicated private bucket", () => {
    expect(RESOURCE_LIBRARY_BUCKET).toBe("resource-library");
  });
});

describe("Pass 3 — uploadAndPublishResource", () => {
  it("uploads file and persists full metadata for a ready candidate", async () => {
    storageUpload.mockResolvedValue({ error: null });
    insertFn.mockResolvedValue({ error: null });

    const c = makeCandidate();
    const f = makeFile("Intake SOP.pdf", "application/pdf", 2048);
    const res = await uploadAndPublishResource(c, f);

    expect(res.ok).toBe(true);
    expect(res.resource).toBeDefined();
    expect(res.resource!.uploadStatus).toBe("published");
    expect(res.resource!.attachmentStatus).toBe("available");
    expect(res.resource!.status).toBe("Published");

    expect(storageUpload).toHaveBeenCalledTimes(1);
    const [path, file, opts] = storageUpload.mock.calls[0];
    expect(path).toMatch(/^sops\/[^/]+\/intake-sop\.pdf$/);
    expect(file).toBe(f);
    expect(opts).toMatchObject({ upsert: false });

    expect(insertFn).toHaveBeenCalledTimes(1);
    const row = insertFn.mock.calls[0][0] as Record<string, unknown>;
    for (const key of [
      "id", "title", "category", "storage_path", "storage_bucket",
      "upload_status", "attachment_status", "sensitivity", "resource_type",
      "tags", "departments", "visibility_roles", "visibility_states",
      "file_name", "file_size", "mime_type",
    ]) {
      expect(row).toHaveProperty(key);
    }
    expect(row.upload_status).toBe("published");
    expect(row.attachment_status).toBe("available");
    expect(row.storage_bucket).toBe("resource-library");
    expect(row.file_name).toBe("Intake SOP.pdf");
    expect(row.file_size).toBe(2048);
    expect(row.mime_type).toBe("application/pdf");
    expect(row.visibility_roles).toEqual(c.roles);
    expect(row.visibility_states).toEqual(c.states);
    expect(row.tags).toEqual(c.tags);
    expect(row.departments).toEqual(c.departments);
  });

  it("refuses to upload held statuses", async () => {
    for (const s of HELD_UPLOAD_STATUSES) {
      const res = await uploadAndPublishResource(makeCandidate({ uploadStatus: s }), makeFile());
      expect(res.ok).toBe(false);
      expect(storageUpload).not.toHaveBeenCalled();
      expect(insertFn).not.toHaveBeenCalled();
    }
  });

  it("returns error and skips DB row when storage upload fails", async () => {
    storageUpload.mockResolvedValue({ error: { message: "Network down" } });
    const res = await uploadAndPublishResource(makeCandidate(), makeFile());
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Network down/);
    expect(insertFn).not.toHaveBeenCalled();
  });

  it("removes orphan file and returns error when DB insert fails", async () => {
    storageUpload.mockResolvedValue({ error: null });
    insertFn.mockResolvedValue({ error: { message: "RLS denied" } });
    storageRemove.mockResolvedValue({ error: null });

    const res = await uploadAndPublishResource(makeCandidate(), makeFile());
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/RLS denied/);
    expect(storageRemove).toHaveBeenCalledTimes(1);
  });
});

describe("Pass 3 — resolveResourceOpenUrl", () => {
  it("returns external URL untouched when present", async () => {
    const r: Resource = {
      id: "r1", title: "x", description: "", type: "Link", category: "systems",
      status: "Published", roles: [], departments: [], states: [], tags: [],
      uploadedBy: "—", createdAt: "", updatedAt: "",
      url: "https://example.com/doc.pdf",
    };
    expect(await resolveResourceOpenUrl(r)).toBe("https://example.com/doc.pdf");
    expect(storageSign).not.toHaveBeenCalled();
  });

  it("returns a signed URL when a storagePath is present", async () => {
    storageSign.mockResolvedValue({ data: { signedUrl: "https://signed/abc" }, error: null });
    const r = {
      id: "r2", title: "x", description: "", type: "PDF", category: "sops",
      status: "Published", roles: [], departments: [], states: [], tags: [],
      uploadedBy: "—", createdAt: "", updatedAt: "",
      storagePath: "sops/r2/x.pdf",
    } as unknown as Resource;
    expect(await resolveResourceOpenUrl(r)).toBe("https://signed/abc");
    expect(storageSign).toHaveBeenCalledWith("sops/r2/x.pdf", 600);
  });

  it("returns null when storage cannot sign", async () => {
    storageSign.mockResolvedValue({ data: null, error: { message: "nope" } });
    const r = {
      id: "r3", title: "x", description: "", type: "PDF", category: "sops",
      status: "Published", roles: [], departments: [], states: [], tags: [],
      uploadedBy: "—", createdAt: "", updatedAt: "",
      storagePath: "sops/r3/missing.pdf",
    } as unknown as Resource;
    expect(await resolveResourceOpenUrl(r)).toBeNull();
  });
});

describe("Pass 3 — Resource Library reads", () => {
  it("useLibraryResources filters by upload_status=published", () => {
    const src = fs.readFileSync("src/hooks/useLibraryResources.ts", "utf8");
    expect(src).toMatch(/upload_status/);
    expect(src).toMatch(/\.eq\(\s*"upload_status",\s*"published"\s*\)/);
  });

  it("OSResourceLibrary uses resolveResourceOpenUrl instead of static href", () => {
    const src = fs.readFileSync("src/pages/os/OSResourceLibrary.tsx", "utf8");
    expect(src).toMatch(/resolveResourceOpenUrl/);
    expect(src).not.toMatch(/href=\{href\}/);
    expect(src).toMatch(/Attachment pending/);
  });

  it("docs/resource-library-storage-plan.md exists", () => {
    expect(fs.existsSync("docs/resource-library-storage-plan.md")).toBe(true);
  });
});

describe("Pass 3 — bulk panel guards", () => {
  const PANEL = fs.readFileSync("src/components/resources/ResourceBulkUploadPanel.tsx", "utf8");

  it("only uploads ready candidates and surfaces failures calmly", () => {
    expect(PANEL).toMatch(/uploadAndPublishResource/);
    expect(PANEL).toMatch(/isUploadable/);
    expect(PANEL).toMatch(/data-testid="upload-candidate-error"/);
  });
});
