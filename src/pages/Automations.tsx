import { useMemo, useState } from "react";
import { Zap } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import {
  AutomationControlBar,
  type AutomationViewMode,
} from "@/components/automations/AutomationControlBar";
import { AutomationListView } from "@/components/automations/AutomationListView";
import { AutomationFlowView } from "@/components/automations/AutomationFlowView";
import { AutomationLogsView } from "@/components/automations/AutomationLogsView";
import { AutomationDetailPanel } from "@/components/automations/AutomationDetailPanel";
import {
  mockAutomations,
  filterAutomationsByView,
  findAutomation,
  type AutomationSavedView,
} from "@/data/automations";

export default function Automations() {
  const [viewMode, setViewMode] = useState<AutomationViewMode>("list");
  const [activeView, setActiveView] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(mockAutomations[0]?.id ?? null);
  const [selectedNode, setSelectedNode] = useState<string | null>("auth");

  const filtered = useMemo(() => {
    let list = filterAutomationsByView(mockAutomations, activeView as AutomationSavedView);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.triggerLabel.toLowerCase().includes(q) ||
          a.actions.some((act) => act.detail.toLowerCase().includes(q)) ||
          a.id.toLowerCase().includes(q) ||
          a.owner.toLowerCase().includes(q),
      );
    }
    return list;
  }, [activeView, searchQuery]);

  const selected = selectedId ? findAutomation(selectedId) ?? null : null;

  return (
    <PageShell
      title="Automations"
      description="Control center · triggers, actions, failsafes, and full execution logs"
      icon={Zap}
    >
      <AutomationControlBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeView={activeView}
        onActiveViewChange={setActiveView}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4">
        <div className="min-w-0">
          {viewMode === "list" && (
            <AutomationListView automations={filtered} selectedId={selectedId} onSelect={setSelectedId} />
          )}
          {viewMode === "flow" && (
            <AutomationFlowView
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              onSelectAutomation={setSelectedId}
            />
          )}
          {viewMode === "logs" && <AutomationLogsView onSelectAutomation={setSelectedId} />}
        </div>
        <div>
          <AutomationDetailPanel automation={selected} onClose={() => setSelectedId(null)} />
        </div>
      </div>
    </PageShell>
  );
}
