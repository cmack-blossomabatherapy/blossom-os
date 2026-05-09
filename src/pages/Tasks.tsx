import { useEffect, useMemo, useState } from "react";
import { CheckSquare } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { TaskControlBar, type TaskViewMode } from "@/components/tasks/TaskControlBar";
import { TaskQueueView } from "@/components/tasks/TaskQueueView";
import { TaskTableView } from "@/components/tasks/TaskTableView";
import { TaskTimelineView } from "@/components/tasks/TaskTimelineView";
import { TaskWorkflowView } from "@/components/tasks/TaskWorkflowView";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { mockTasks, filterTasksByView, findTask, type TaskSavedView } from "@/data/tasks";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useDeepLink, useConsumeDeepLink } from "@/lib/deepLink";
import { toast } from "sonner";

export default function Tasks() {
  const deepLink = useDeepLink();
  const [viewMode, setViewMode] = useState<TaskViewMode>("queue");
  const [activeView, setActiveView] = useState<string>("my-tasks");
  const [searchQuery, setSearchQuery] = useState("");
  const initialId = (() => {
    const want = deepLink.task ?? deepLink.focus;
    if (want && findTask(want)) return want;
    return mockTasks[0]?.id ?? null;
  })();
  const [selectedId, setSelectedId] = useState<string | null>(initialId);

  useEffect(() => {
    if (deepLink.q) setSearchQuery(deepLink.q);
    if (deepLink.tab) setActiveView(deepLink.tab);
    if (deepLink.alert) toast.message?.("Opened from alert");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useConsumeDeepLink();

  const filteredTasks = useMemo(() => {
    let list = filterTasksByView(mockTasks, activeView as TaskSavedView);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.type.toLowerCase().includes(q) ||
          t.linkedRecordLabel.toLowerCase().includes(q) ||
          t.owner.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          (t.linkedRecordId?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [activeView, searchQuery]);

  const selectedTask = selectedId ? findTask(selectedId) ?? null : null;

  return (
    <PageShell
      title="Tasks"
      description="Central execution system · queue-first, workflow-aware, blocker-tracked"
      icon={CheckSquare}
    >
      <TaskControlBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeView={activeView}
        onActiveViewChange={setActiveView}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
        <div className="min-w-0">
          {viewMode === "queue" && (
            <TaskQueueView tasks={filteredTasks} selectedId={selectedId} onSelect={setSelectedId} />
          )}
          {viewMode === "table" && (
            <TaskTableView tasks={filteredTasks} selectedId={selectedId} onSelect={setSelectedId} />
          )}
          {viewMode === "timeline" && (
            <TaskTimelineView tasks={filteredTasks} selectedId={selectedId} onSelect={setSelectedId} />
          )}
          {viewMode === "workflow" && (
            <TaskWorkflowView tasks={filteredTasks} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </div>
        <div className="hidden xl:block">
          <TaskDetailPanel task={selectedTask} onClose={() => setSelectedId(null)} />
        </div>
      </div>

      {/* Mobile/tablet: open detail in a Sheet */}
      <Sheet
        open={!!selectedTask}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
      >
        <SheetContent side="right" className="xl:hidden p-0 w-full sm:max-w-md md:max-w-lg flex flex-col [&>div]:rounded-none [&>div]:border-0 [&>div]:max-h-none [&>div]:h-full">
          <TaskDetailPanel task={selectedTask} onClose={() => setSelectedId(null)} />
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}
