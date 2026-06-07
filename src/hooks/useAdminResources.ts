import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  Resource,
  ResourceCategoryId,
  ResourceType,
  ResourceStatus,
  ResourceUploadStatus,
} from "@/lib/resources/resourceData";
import type { OSRole } from "@/lib/os/permissions";

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

function mapRow(r: HrResourceRow): Resource {
  const uploadStatus = (r.upload_status as ResourceUploadStatus | null) ?? "published";
  // Admin view keeps Archived rows visible — only is_active=false maps to Archived.
  const status: ResourceStatus = r.is_active ? "Published" : "Archived";
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    type: KIND_TO_TYPE[r.kind] ?? "PDF",
    category: CATEGORY_MAP[r.category] ?? "operational",
    status,
    roles: ((r.visibility_roles ?? []) as OSRole[]),
    departments: r.departments ?? [],
    states: r.visibility_states ?? [],
    tags: r.tags ?? [],
    uploadedBy: r.uploaded_by_name ?? "—",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    url: r.url ?? undefined,
    pinned: r.is_pinned,
    resourceType: (r.resource_type as Resource["resourceType"]) ?? undefined,
    sensitivity: (r.sensitivity as Resource["sensitivity"]) ?? undefined,
    attachmentStatus: (r.attachment_status as Resource["attachmentStatus"]) ?? undefined,
    uploadStatus,
    sourceNote: r.source_note ?? undefined,
    ...(r.storage_path ? { storagePath: r.storage_path } : {}),
  };
}

export interface AdminResourcesResult {
  resources: Resource[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Admin-scoped resource feed. Returns every `hr_resources` row visible to the
 * current admin (any upload_status — published, pending, held, privacy review,
 * business review, conversion, vault_only, excluded, plus archived).
 *
 * Used by Resource Management + Training Management coverage widgets so we
 * never confuse "published to learners" with "exists in the system".
 */
export function useAdminResources(): AdminResourcesResult {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await (supabase
        .from("hr_resources") as any)
        .select(
          "id,title,description,kind,category,url,storage_path,visibility_states,visibility_roles,is_pinned,is_active,uploaded_by_name,created_at,updated_at,upload_status,attachment_status,sensitivity,resource_type,tags,departments,file_name,file_size,mime_type,source_note",
        )
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });
      if (cancelled) return;
      if (err) {
        setError(err.message ?? "Could not load resources.");
      } else if (data) {
        setResources((data as HrResourceRow[]).map(mapRow));
      }
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { resources, loading, error, reload: () => setTick((t) => t + 1) };
}