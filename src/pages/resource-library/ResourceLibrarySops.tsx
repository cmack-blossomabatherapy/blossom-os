import { OSShell } from "@/pages/os/OSShell";
import { LibraryTabs } from "@/components/resource-library/LibraryTabs";
import { ResourceListView } from "@/components/resource-library/ResourceListView";
import { useLibraryResources } from "@/hooks/useLibraryResources";
import { useOSRole } from "@/contexts/OSRoleContext";
import { isVisibleToRole } from "@/lib/resources/resourceData";
import { isCheatSheet, isFormOrTemplate, isPolicyOrHandbook, isSopResource } from "@/lib/resources/librarySections";

export default function ResourceLibrarySops() {
  const { resources, loading } = useLibraryResources();
  const { role, activeState } = useOSRole();
  const list = resources
    .filter((r) => isVisibleToRole(r, role, activeState))
    .filter((r) => isSopResource(r) || isPolicyOrHandbook(r) || isFormOrTemplate(r) || isCheatSheet(r));
  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10 md:px-10">
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
