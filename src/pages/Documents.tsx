import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { DocumentControlBar, type DocViewMode } from "@/components/documents/DocumentControlBar";
import { DocumentTableView } from "@/components/documents/DocumentTableView";
import { DocumentGroupedView } from "@/components/documents/DocumentGroupedView";
import { DocumentTimelineView } from "@/components/documents/DocumentTimelineView";
import { DocumentDetailPanel } from "@/components/documents/DocumentDetailPanel";
import { MissingDocumentsBanner } from "@/components/documents/MissingDocumentsBanner";
import { mockDocuments, filterDocsByView, findDocument, type DocSavedView } from "@/data/documents";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function Documents() {
  const [viewMode, setViewMode] = useState<DocViewMode>("table");
  const [activeView, setActiveView] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(mockDocuments[0]?.id ?? null);

  const filteredDocs = useMemo(() => {
    let list = filterDocsByView(mockDocuments, activeView as DocSavedView);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q) ||
          d.linkedRecordLabel.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q) ||
          (d.linkedRecordId?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [activeView, searchQuery]);

  const selectedDoc = selectedId ? findDocument(selectedId) ?? null : null;

  return (
    <PageShell
      title="Documents"
      description="Active workflow drivers · status, linkage, and missing-doc engine"
      icon={FileText}
    >
      <DocumentControlBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeView={activeView}
        onActiveViewChange={setActiveView}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {activeView !== "missing" && (
        <MissingDocumentsBanner documents={mockDocuments} onSelect={setSelectedId} />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
        <div className="min-w-0">
          {viewMode === "table" && (
            <DocumentTableView documents={filteredDocs} selectedId={selectedId} onSelect={setSelectedId} />
          )}
          {viewMode === "grouped" && (
            <DocumentGroupedView documents={filteredDocs} selectedId={selectedId} onSelect={setSelectedId} />
          )}
          {viewMode === "timeline" && (
            <DocumentTimelineView documents={filteredDocs} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </div>
        <div className="hidden xl:block">
          <DocumentDetailPanel document={selectedDoc} onClose={() => setSelectedId(null)} />
        </div>
      </div>

      {/* Mobile/tablet: open detail in a Sheet */}
      <Sheet
        open={!!selectedDoc}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
      >
        <SheetContent side="right" className="xl:hidden p-0 w-full sm:max-w-md md:max-w-lg flex flex-col [&>div]:rounded-none [&>div]:border-0 [&>div]:max-h-none [&>div]:h-full">
          <DocumentDetailPanel document={selectedDoc} onClose={() => setSelectedId(null)} />
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}
