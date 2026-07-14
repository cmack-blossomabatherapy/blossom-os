import { useEffect, useMemo, useState } from "react";
import { OSShell } from "@/pages/os/OSShell";
import { LibraryTabs } from "@/components/resource-library/LibraryTabs";
import { ResourceListView } from "@/components/resource-library/ResourceListView";
import { useLibraryResources } from "@/hooks/useLibraryResources";
import { LIBRARY_DEPARTMENTS } from "@/lib/resources/librarySections";
import { cn } from "@/lib/utils";
import { useOSRole } from "@/contexts/OSRoleContext";
import { isVisibleToRole } from "@/lib/resources/resourceData";

export default function ResourceLibraryDepartment() {
  const { resources, loading } = useLibraryResources();
  const { role, activeState } = useOSRole();

  const scopedResources = useMemo(
    () => resources.filter((r) => isVisibleToRole(r, role, activeState)),
    [resources, role, activeState],
  );
  const availableDepartments = useMemo(
    () => LIBRARY_DEPARTMENTS.filter((d) => scopedResources.some((r) => d.match(r))),
    [scopedResources],
  );
  const [active, setActive] = useState<string>("company");

  useEffect(() => {
    if (availableDepartments.length === 0) return;
    if (!availableDepartments.some((d) => d.id === active)) setActive(availableDepartments[0].id);
  }, [active, availableDepartments]);

  const bucket = availableDepartments.find((d) => d.id === active) ?? availableDepartments[0];
  const list = bucket ? scopedResources.filter((r) => bucket.match(r)) : [];
  return (
    <OSShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Resource Library</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Departments for your role</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">
            Only departments connected to your current role appear here, keeping the library focused on what you actually use.
          </p>
        </header>
        <LibraryTabs />
        <div className="flex flex-wrap gap-1.5">
          {availableDepartments.map((d) => {
            const count = scopedResources.filter((r) => d.match(r)).length;
            return (
              <button
                key={d.id}
                onClick={() => setActive(d.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] transition",
                  d.id === active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/60 bg-card/70 text-foreground hover:bg-muted",
                )}
              >
                {d.name}
                <span className={cn("rounded-full px-1.5 py-0 text-[10.5px]",
                  d.id === active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground")}>{count}</span>
              </button>
            );
          })}
        </div>
        <ResourceListView
          resources={list}
          loading={loading}
          filterMode="search"
          departmentOptions={availableDepartments}
          emptyMessage="No published resources are assigned to this department for your role yet."
        />
      </div>
    </OSShell>
  );
}
