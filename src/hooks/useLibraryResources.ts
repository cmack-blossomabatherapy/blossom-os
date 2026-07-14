import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  Resource,
  ResourceCategoryId,
  ResourceType,
  ResourceStatus,
} from "@/lib/resources/resourceData";
import type { OSRole } from "@/lib/os/permissions";
import { cleanResourceTitle, resourceDisplayDescription } from "@/lib/resources/resourceDisplay";

interface HrResourceRow {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  category: string;
  url: string | null;
  storage_path: string | null;
  visibility_states: string[] | null;
  visibility_roles: string[] | null;
  is_pinned: boolean;
  is_active: boolean;
  uploaded_by_name: string | null;
  created_at: string;
  updated_at: string;
  upload_status?: string | null;
  attachment_status?: string | null;
  sensitivity?: string | null;
  resource_type?: string | null;
  tags?: string[] | null;
  departments?: string[] | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  source_note?: string | null;
  storage_bucket?: string | null;
  resource_id?: string | null;
  visibility_level?: string | null;
  owner?: string | null;
  last_reviewed_date?: string | null;
  is_sensitive?: boolean | null;
  requires_acknowledgement?: boolean | null;
  training_related?: boolean | null;
  sop_related?: boolean | null;
}

const KIND_TO_TYPE: Record<string, ResourceType> = {
  document: "PDF",
  link: "Link",
  video: "Video",
  policy: "SOP",
  form: "Form",
  folder: "Workflow",
};

const CATEGORY_MAP: Record<string, ResourceCategoryId> = {
  handbook: "hr",
  payroll: "hr",
  training: "training",
  clinical: "operational",
  it: "systems",
  benefits: "hr",
  onboarding: "hr",
  general: "operational",
};

const RESOURCE_TYPE_TO_TYPE: Partial<Record<string, ResourceType>> = {
  sop: "SOP",
  policy: "SOP",
  workflow: "Workflow",
  template: "Template",
  form: "Form",
  checklist: "Checklist",
  cheat_sheet: "Checklist",
  video: "Video",
  training: "PDF",
  guide: "PDF",
  handbook: "PDF",
  role_packet: "PDF",
  org_reference: "PDF",
  admin_reference: "PDF",
  report_reference: "PDF",
};

function inferType(r: HrResourceRow): ResourceType {
  const file = `${r.file_name ?? ""} ${r.storage_path ?? ""}`.toLowerCase();
  const mime = (r.mime_type ?? "").toLowerCase();
  const resourceType = (r.resource_type ?? "").toLowerCase();
  if (r.kind === "video" || resourceType === "video" || r.storage_bucket === "resource-videos" || mime.startsWith("video/") || /\.(mp4|mov|m4v|webm)$/.test(file)) return "Video";
  if (mime === "application/pdf" || /\.pdf$/.test(file)) return RESOURCE_TYPE_TO_TYPE[resourceType] ?? "PDF";
  if (/\.(doc|docx)$/.test(file)) return "DOCX";
  if (/\.(xls|xlsx)$/.test(file)) return "XLSX";
  if (/\.csv$/.test(file)) return "CSV";
  if (/\.(png|jpe?g|webp|gif|svg)$/.test(file)) return "Image";
  return RESOURCE_TYPE_TO_TYPE[resourceType] ?? KIND_TO_TYPE[r.kind] ?? "PDF";
}

function mapRow(r: HrResourceRow): Resource {
  const base = {
    title: cleanResourceTitle(r.title || r.file_name || "Resource"),
    description: r.description ?? "",
    type: inferType(r),
    departments: r.departments ?? [],
    resourceType: (r.resource_type as Resource["resourceType"]) ?? undefined,
    category: CATEGORY_MAP[r.category] ?? "operational",
  };
  return {
    id: r.id,
    title: base.title,
    description: resourceDisplayDescription(base),
    type: base.type,
    category: base.category,
    status: (r.is_active ? "Published" : "Archived") as ResourceStatus,
    roles: ((r.visibility_roles ?? []) as OSRole[]),
    departments: base.departments,
    states: r.visibility_states ?? [],
    tags: r.tags ?? [],
    uploadedBy: r.uploaded_by_name ?? "—",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    url: r.url ?? undefined,
    pinned: r.is_pinned,
    resourceType: base.resourceType,
    sensitivity: (r.sensitivity as Resource["sensitivity"]) ?? undefined,
    attachmentStatus: (r.attachment_status as Resource["attachmentStatus"]) ?? undefined,
    uploadStatus: (r.upload_status as Resource["uploadStatus"]) ?? "published",
    sourceNote: r.source_note ?? undefined,
    // Stash storage path/bucket on the resource so the open handler can sign it.
    ...(r.storage_path ? { storagePath: r.storage_path } : {}),
    ...(r.storage_bucket ? { storageBucket: r.storage_bucket } : {}),
    ...(r.resource_id ? { resourceId: r.resource_id } : {}),
    ...(r.file_name ? { fileName: r.file_name } : {}),
    ...(typeof r.file_size === "number" ? { fileSize: r.file_size } : {}),
    ...(r.mime_type ? { mimeType: r.mime_type } : {}),
    ...(r.visibility_level ? { visibilityLevel: r.visibility_level } : {}),
    ...(r.owner ? { owner: r.owner } : {}),
    ...(r.last_reviewed_date ? { lastReviewedDate: r.last_reviewed_date } : {}),
    isSensitive: !!r.is_sensitive,
    requiresAcknowledgement: !!r.requires_acknowledgement,
    trainingRelated: !!r.training_related,
    sopRelated: !!r.sop_related,
  };
}

export interface LibraryResourcesResult {
  resources: Resource[];
  loading: boolean;
}

/**
 * Live operational resource library sourced from `hr_resources`.
 * Returns an empty array (not mock data) when nothing has been published yet.
 */
export function useLibraryResources(): LibraryResourcesResult {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await (supabase
        .from("hr_resources") as any)
        .select(
          "id,title,description,kind,category,url,storage_path,storage_bucket,resource_id,visibility_states,visibility_roles,is_pinned,is_active,uploaded_by_name,created_at,updated_at,upload_status,attachment_status,sensitivity,resource_type,tags,departments,file_name,file_size,mime_type,source_note,visibility_level,owner,last_reviewed_date,is_sensitive,requires_acknowledgement,training_related,sop_related",
        )
        .eq("is_active", true)
        .eq("upload_status", "published")
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });
      if (cancelled) return;
      if (!error && data) {
        setResources((data as HrResourceRow[]).map(mapRow));
      }
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { resources, loading };
}