import { supabase } from "@/integrations/supabase/client";
import type { OSRole } from "@/lib/os/permissions";
import type {
  Resource,
  ResourceCategoryId,
  ResourceType,
  UploadCandidate,
  ResourceUploadStatus,
} from "@/lib/resources/resourceData";

/** Dedicated private bucket for Resource Library uploads. */
export const RESOURCE_LIBRARY_BUCKET = "resource-library";

/** Upload statuses that should never call the storage API. */
export const HELD_UPLOAD_STATUSES: ResourceUploadStatus[] = [
  "pending_review",
  "needs_conversion",
  "privacy_review",
  "business_review",
  "vault_only",
  "excluded",
];

/** Make a safe, lowercase, hyphenated filename — no path traversal, no spaces. */
export function safeFileName(name: string): string {
  const lastDot = name.lastIndexOf(".");
  const base = (lastDot > 0 ? name.slice(0, lastDot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";
  const ext = (lastDot > 0 ? name.slice(lastDot + 1) : "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  return ext ? `${base}.${ext}` : base;
}

/** Build the canonical storage path: `{category}/{resourceId}/{safeFileName}`. */
export function buildStoragePath(
  category: ResourceCategoryId,
  resourceId: string,
  fileName: string,
): string {
  return `${category}/${resourceId}/${safeFileName(fileName)}`;
}

/** True if the candidate is eligible to be uploaded right now. */
export function isUploadable(c: UploadCandidate): boolean {
  return c.uploadStatus === "ready_to_upload";
}

/** Map a ResourceCategoryId to the legacy `hr_resource_category` enum value. */
function categoryToHrCategory(c: ResourceCategoryId): string {
  switch (c) {
    case "hr":          return "handbook";
    case "training":    return "training";
    case "systems":     return "it";
    case "leadership":  return "general";
    case "communication":
    case "templates":
    case "workflows":
    case "sops":
    case "operational":
    case "insurance":
    default:            return "general";
  }
}

function typeToHrKind(t: ResourceType): string {
  if (t === "Link" || t === "Tango") return "link";
  if (t === "Video") return "video";
  if (t === "Form") return "form";
  if (t === "SOP" || t === "Workflow") return "policy";
  return "document";
}

/** Pure id generator (timestamp + random suffix) — kept stable for tests. */
export function newResourceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface UploadResult {
  ok: boolean;
  resource?: Resource;
  error?: string;
}

/**
 * Upload a single ready candidate to Supabase Storage and persist the row.
 * Returns `{ok:false, error}` without creating any DB row on failure, so
 * broken/visible records can never appear in the Resource Library.
 */
export async function uploadAndPublishResource(
  candidate: UploadCandidate,
  file: File,
  uploadedByName = "Bulk import",
): Promise<UploadResult> {
  if (!isUploadable(candidate)) {
    return { ok: false, error: "Candidate is not in ready_to_upload status." };
  }

  const id = newResourceId();
  const path = buildStoragePath(candidate.category, id, file.name);

  const { error: uploadErr } = await supabase.storage
    .from(RESOURCE_LIBRARY_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

  if (uploadErr) {
    return { ok: false, error: uploadErr.message };
  }

  const nowIso = new Date().toISOString();
  const row: Record<string, unknown> = {
    id,
    title: candidate.title,
    description: candidate.description || null,
    kind: typeToHrKind(candidate.type),
    category: categoryToHrCategory(candidate.category),
    storage_path: path,
    storage_bucket: RESOURCE_LIBRARY_BUCKET,
    visibility_roles: candidate.roles,
    visibility_states: candidate.states,
    is_active: true,
    is_pinned: false,
    uploaded_by_name: uploadedByName,
    upload_status: "published",
    attachment_status: "available",
    sensitivity: candidate.sensitivity,
    resource_type: candidate.resourceType,
    tags: candidate.tags,
    departments: candidate.departments,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type || null,
    source_note: "Uploaded via Resource Library bulk upload.",
    created_at: nowIso,
    updated_at: nowIso,
  };

  const { error: insertErr } = await (supabase
    .from("hr_resources") as any)
    .insert(row);

  if (insertErr) {
    // Best-effort cleanup of the orphan file — do not surface a visible row.
    await supabase.storage.from(RESOURCE_LIBRARY_BUCKET).remove([path]);
    return { ok: false, error: insertErr.message };
  }

  const resource: Resource = {
    id,
    title: candidate.title,
    description: candidate.description,
    type: candidate.type,
    category: candidate.category,
    status: "Published",
    roles: candidate.roles as OSRole[],
    departments: candidate.departments,
    states: candidate.states,
    tags: candidate.tags,
    uploadedBy: uploadedByName,
    createdAt: nowIso,
    updatedAt: nowIso,
    resourceType: candidate.resourceType,
    sensitivity: candidate.sensitivity,
    attachmentStatus: "available",
    uploadStatus: "published",
    sourceNote: "Uploaded via Resource Library bulk upload.",
  };
  return { ok: true, resource };
}

/** Resolve a signed URL for opening/downloading a private resource. */
export async function resolveResourceOpenUrl(r: Resource): Promise<string | null> {
  // External link first.
  if (r.url && /^https?:\/\//i.test(r.url)) return r.url;
  if (r.fileUrl && /^https?:\/\//i.test(r.fileUrl)) return r.fileUrl;
  // Storage path stored in `url` slot by the hook.
  const storagePath = (r as Resource & { storagePath?: string }).storagePath ?? r.url;
  if (!storagePath) return null;
  const { data, error } = await supabase.storage
    .from(RESOURCE_LIBRARY_BUCKET)
    .createSignedUrl(storagePath, 60 * 10);
  if (error || !data) return null;
  return data.signedUrl;
}
