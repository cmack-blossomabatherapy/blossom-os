import { useState } from "react";
import { OSShell } from "@/pages/os/OSShell";
import { LibraryTabs } from "@/components/resource-library/LibraryTabs";
import { ResourceListView } from "@/components/resource-library/ResourceListView";
import { useLibraryResources } from "@/hooks/useLibraryResources";
import { LIBRARY_DEPARTMENTS } from "@/lib/resources/librarySections";
import { cn } from "@/lib/utils";

export default function ResourceLibraryDepartment() {
  const { resources, loading } = useLibraryResources();
  const [active, setActive] = useState<string>(LIBRARY_DEPARTMENTS[0].id);
  const bucket = LIBRARY_DEPARTMENTS.find((d) => d.id === active)!;
  const list = resources.filter((r) => bucket.match(r));
  return (
    <OSShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Resource Library</p>
          <h1 className="text-2xl font-semibold tracking-tight">By Department</h1>
          <p className="text-[13px] text-muted-foreground">
            Browse resources grouped by the department that owns them.
          </p>
        </header>
        <LibraryTabs />
        <div className="flex flex-wrap gap-1.5">
          {LIBRARY_DEPARTMENTS.map((d) => {
            const count = resources.filter((r) => d.match(r)).length;
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
        <ResourceListView resources={list} loading={loading} />
      </div>
    </OSShell>
  );
}
