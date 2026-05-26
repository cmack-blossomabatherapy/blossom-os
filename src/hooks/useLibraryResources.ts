import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  Resource,
  ResourceCategoryId,
  ResourceType,
  ResourceStatus,
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
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    type: KIND_TO_TYPE[r.kind] ?? "PDF",
    category: CATEGORY_MAP[r.category] ?? "operational",
    status: (r.is_active ? "Published" : "Archived") as ResourceStatus,
    roles: ((r.visibility_roles ?? []) as OSRole[]),
    departments: [],
    states: r.visibility_states ?? [],
    tags: [],
    uploadedBy: r.uploaded_by_name ?? "—",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    url: r.url ?? r.storage_path ?? undefined,
    pinned: r.is_pinned,
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
      const { data, error } = await supabase
        .from("hr_resources")
        .select(
          "id,title,description,kind,category,url,storage_path,visibility_states,visibility_roles,is_pinned,is_active,uploaded_by_name,created_at,updated_at",
        )
        .eq("is_active", true)
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