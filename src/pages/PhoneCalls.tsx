import { useMemo, useState } from "react";
import { Phone } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { CallControlBar, type CallViewMode } from "@/components/calls/CallControlBar";
import { CallTableView } from "@/components/calls/CallTableView";
import { CallQueueView } from "@/components/calls/CallQueueView";
import { CallTimelineView } from "@/components/calls/CallTimelineView";
import { CallDetailPanel } from "@/components/calls/CallDetailPanel";
import { mockPhoneCalls, filterCallsByView, findCall, type CallSavedView } from "@/data/calls";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function PhoneCalls() {
  const [viewMode, setViewMode] = useState<CallViewMode>("table");
  const [activeView, setActiveView] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(mockPhoneCalls[0]?.id ?? null);

  const filteredCalls = useMemo(() => {
    let list = filterCallsByView(mockPhoneCalls, activeView as CallSavedView);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.phoneNumber.toLowerCase().includes(q) ||
          (c.callerName?.toLowerCase().includes(q) ?? false) ||
          c.id.toLowerCase().includes(q) ||
          (c.linkedLeadId?.toLowerCase().includes(q) ?? false) ||
          (c.linkedClientId?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [activeView, searchQuery]);

  const selectedCall = selectedId ? findCall(selectedId) ?? null : null;

  return (
    <PageShell
      title="Phone Calls"
      description="System input layer · track every call, link to leads & clients, never lose a contact"
      icon={Phone}
    >
      <CallControlBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeView={activeView}
        onActiveViewChange={setActiveView}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
        <div className="min-w-0">
          {viewMode === "table" && (
            <CallTableView calls={filteredCalls} selectedId={selectedId} onSelect={setSelectedId} />
          )}
          {viewMode === "queue" && (
            <CallQueueView calls={filteredCalls} selectedId={selectedId} onSelect={setSelectedId} />
          )}
          {viewMode === "timeline" && (
            <CallTimelineView calls={filteredCalls} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </div>
        <div className="hidden xl:block">
          <CallDetailPanel call={selectedCall} onClose={() => setSelectedId(null)} />
        </div>
      </div>

      {/* Mobile/tablet: open detail in a Sheet */}
      <Sheet
        open={!!selectedCall}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
      >
        <SheetContent
          side="right"
          className="xl:hidden p-0 w-full sm:max-w-md md:max-w-lg flex flex-col [&>div]:rounded-none [&>div]:border-0 [&>div]:max-h-none [&>div]:h-full"
        >
          <CallDetailPanel call={selectedCall} onClose={() => setSelectedId(null)} />
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}
