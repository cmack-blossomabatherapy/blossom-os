import { OSShell } from "@/pages/os/OSShell";
import { LibraryTabs } from "@/components/resource-library/LibraryTabs";
import { ResourceListView } from "@/components/resource-library/ResourceListView";
import { useLibraryResources } from "@/hooks/useLibraryResources";
import { useOSRole } from "@/contexts/OSRoleContext";
import { isVisibleToRole } from "@/lib/resources/resourceData";
import { isTrainingResource } from "@/lib/resources/librarySections";

export default function ResourceLibraryTraining() {
  const { resources, loading } = useLibraryResources();
  const { role, activeState } = useOSRole();
  const list = resources
    .filter((r) => isVisibleToRole(r, role, activeState))
    .filter(isTrainingResource);
  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10 md:px-10">
        <header className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Resource Library</p>
          <h1 className="text-2xl font-semibold tracking-tight">Training Resources</h1>
          <p className="text-[13px] text-muted-foreground">
            Guides and materials linked to your training journey.
          </p>
        </header>
        <LibraryTabs />
        <ResourceListView resources={list} loading={loading} sections={["training", "cheatsheets", "videos"]} />
      </div>
    </OSShell>
  );
}
