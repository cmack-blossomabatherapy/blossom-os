import { OSShell } from "@/pages/os/OSShell";
import { LibraryTabs } from "@/components/resource-library/LibraryTabs";
import { ResourceListView } from "@/components/resource-library/ResourceListView";
import { useLibraryResources } from "@/hooks/useLibraryResources";
import { useOSRole } from "@/contexts/OSRoleContext";
import { isVisibleToRole } from "@/lib/resources/resourceData";

export default function ResourceLibrarySops() {
  const { resources, loading } = useLibraryResources();
  const { role } = useOSRole();
  const list = resources
    .filter((r) => isVisibleToRole(r, role))
    .filter((r) =>
      r.sopRelated || r.type === "SOP" || r.resourceType === "sop" || r.resourceType === "policy"
      || r.type === "Form" || r.type === "Template" || r.type === "Checklist"
      || r.resourceType === "handbook",
    );
  return (
    <OSShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Resource Library</p>
          <h1 className="text-2xl font-semibold tracking-tight">SOPs, Policies & Forms</h1>
          <p className="text-[13px] text-muted-foreground">
            The written source of truth for how we operate.
          </p>
        </header>
        <LibraryTabs />
        <ResourceListView
          resources={list}
          loading={loading}
          sections={["required_sops", "policies", "forms", "cheatsheets"]}
        />
      </div>
    </OSShell>
  );
}
