import { OSShell } from "@/pages/os/OSShell";
import { LibraryTabs } from "@/components/resource-library/LibraryTabs";
import { ResourceListView } from "@/components/resource-library/ResourceListView";
import { useLibraryResources } from "@/hooks/useLibraryResources";
import { useOSRole } from "@/contexts/OSRoleContext";
import { isVisibleToRole } from "@/lib/resources/resourceData";

export default function ResourceLibraryRole() {
  const { resources, loading } = useLibraryResources();
  const { role, activeState } = useOSRole();
  const mine = resources.filter((r) => isVisibleToRole(r, role, activeState));
  return (
    <OSShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Resource Library</p>
          <h1 className="text-2xl font-semibold tracking-tight">My Role Bundle</h1>
          <p className="text-[13px] text-muted-foreground">
            Everything scoped to your current role — grouped by how you'll use it.
          </p>
        </header>
        <LibraryTabs />
        <ResourceListView resources={mine} loading={loading} />
      </div>
    </OSShell>
  );
}
