import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageShell } from "@/components/shared/PageShell";
import { UserCheck } from "lucide-react";
import { ClientControlBar, ClientViewMode } from "@/components/clients/ClientControlBar";
import { ClientTableView, ClientSortField, SortDir } from "@/components/clients/ClientTableView";
import { ClientQueueView } from "@/components/clients/ClientQueueView";
import { ClientKpiStrip } from "@/components/clients/ClientKpiStrip";
import { ClientBulkActionBar } from "@/components/clients/ClientBulkActionBar";
import { ClientFilters, emptyClientFilters } from "@/components/clients/ClientFilterPopover";
import { ConvertLeadDialog } from "@/components/clients/ConvertLeadDialog";
import { ClientKpiKey, clientKpiFilters, ClientStage, clientStages } from "@/data/clients";
import { useClients } from "@/contexts/ClientsContext";
import { toast } from "sonner";
import { canonicalPipelineStage, getNextPipelineStage, masterPipelineSections, type PipelineSectionKey } from "@/data/pipeline";

const exportToCsv = (rows: Record<string, unknown>[], filename: string) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const stageOrder: ClientStage[] = clientStages.map((s) => s.name);

export default function Clients() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clients, moveStage, assignBcba, assignRbt, setStartDate, deleteClients } = useClients();

  const requestedView = searchParams.get("view") as ClientViewMode | null;
  const [viewMode, setViewMode] = useState<ClientViewMode>(requestedView ?? "table");
  const [activeView, setActiveView] = useState("all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [filters, setFilters] = useState<ClientFilters>(emptyClientFilters);
  const [activeKpi, setActiveKpi] = useState<ClientKpiKey | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [convertOpen, setConvertOpen] = useState(false);
  const [sortField, setSortField] = useState<ClientSortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Sync ?q= → searchQuery
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null && q !== searchQuery) setSearchQuery(q);
    const view = searchParams.get("view") as ClientViewMode | null;
    if (view && view !== viewMode) setViewMode(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (searchQuery) next.set("q", searchQuery); else next.delete("q");
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const filterOptions = useMemo(() => ({
    states: Array.from(new Set(clients.map((c) => c.state))).sort(),
    clinics: Array.from(new Set(clients.map((c) => c.clinic))).sort(),
    bcbas: Array.from(new Set(clients.map((c) => c.bcba).filter(Boolean) as string[])).sort(),
    rbts: Array.from(new Set(clients.map((c) => c.rbt).filter(Boolean) as string[])).sort(),
    stages: stageOrder,
    authStatuses: ["Not Submitted", "Submitted", "Approved", "Denied", "Expired"],
    staffingStatuses: ["Not Needed", "Needed", "In Progress", "Assigned"],
    qaStatuses: ["Not Started", "In Review", "Complete"],
    payors: Array.from(new Set(clients.map((c) => c.payor))).sort(),
  }), [clients]);

  const filteredClients = useMemo(() => {
    let result = clients;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.childName.toLowerCase().includes(q) ||
          c.parentName.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          (c.bcba?.toLowerCase().includes(q) ?? false) ||
          (c.rbt?.toLowerCase().includes(q) ?? false),
      );
    }

    if (filters.states.length) result = result.filter((c) => filters.states.includes(c.state));
    if (filters.clinics.length) result = result.filter((c) => filters.clinics.includes(c.clinic));
    if (filters.bcbas.length) result = result.filter((c) => c.bcba && filters.bcbas.includes(c.bcba));
    if (filters.rbts.length) result = result.filter((c) => c.rbt && filters.rbts.includes(c.rbt));
    if (filters.stages.length) result = result.filter((c) => filters.stages.includes(c.stage));
    if (filters.authStatuses.length) result = result.filter((c) => filters.authStatuses.includes(c.authStatus));
    if (filters.staffingStatuses.length) result = result.filter((c) => filters.staffingStatuses.includes(c.staffingStatus));
    if (filters.qaStatuses.length) result = result.filter((c) => filters.qaStatuses.includes(c.qaStatus));
    if (filters.payors.length) result = result.filter((c) => filters.payors.includes(c.payor));

    if (activeKpi) {
      result = result.filter(clientKpiFilters[activeKpi]);
    } else {
      switch (activeView) {
        case "mine": result = result.filter((c) => c.intakeOwner === "Sarah M."); break;
        case "action": result = result.filter((c) => !c.bcba || canonicalPipelineStage(c.stage) === "Waiting on Consent" || c.stage === "Schedule Assessment" || (canonicalPipelineStage(c.stage) === "Initial Auth – Awaiting Submission" && c.authStatus === "Not Submitted")); break;
        case "pending-start": result = result.filter((c) => c.stage === "Pending Start Date"); break;
        case "staffing": result = result.filter((c) => ["Staffing Needed", "Matching in Progress", "Restaffing Needed"].includes(canonicalPipelineStage(c.stage))); break;
        case "qa": result = result.filter((c) => ["QA Review", "QA Issues / Fix Required", "QA Approved"].includes(canonicalPipelineStage(c.stage))); break;
        case "tx-auth": result = result.filter((c) => canonicalPipelineStage(c.stage).startsWith("Treatment Auth")); break;
        case "active": result = result.filter((c) => c.stage === "Active"); break;
      }
    }

    if (sortField) {
      const dir = sortDir === "asc" ? 1 : -1;
      result = [...result].sort((a, b) => {
        let av: string | number = "", bv: string | number = "";
        switch (sortField) {
          case "id": av = a.id; bv = b.id; break;
          case "childName": av = a.childName; bv = b.childName; break;
          case "state": av = a.state; bv = b.state; break;
          case "clinic": av = a.clinic; bv = b.clinic; break;
          case "stage": av = stageOrder.indexOf(a.stage); bv = stageOrder.indexOf(b.stage); break;
          case "daysInStage": av = a.daysInStage; bv = b.daysInStage; break;
          case "startDate":
            av = a.startDate ? new Date(a.startDate).getTime() : 0;
            bv = b.startDate ? new Date(b.startDate).getTime() : 0;
            break;
        }
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      });
    }

    return result;
  }, [clients, searchQuery, filters, activeView, activeKpi, sortField, sortDir]);

  const handleKpi = (key: ClientKpiKey) => {
    setActiveKpi(activeKpi === key ? null : key);
    setActiveView("all");
  };

  const handleViewChange = (id: string) => {
    setActiveView(id);
    setActiveKpi(null);
  };

  const handleSort = (field: ClientSortField) => {
    if (!field) return;
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const exportClients = (ids?: string[]) => {
    const target = ids?.length ? clients.filter((c) => ids.includes(c.id)) : filteredClients;
    if (!target.length) { toast.info("Nothing to export"); return; }
    exportToCsv(
      target.map((c) => ({
        id: c.id, childName: c.childName, parentName: c.parentName,
        state: c.state, clinic: c.clinic, stage: c.stage, bcba: c.bcba ?? "",
        rbt: c.rbt ?? "", payor: c.payor, authStatus: c.authStatus,
        staffingStatus: c.staffingStatus, qaStatus: c.qaStatus,
        startDate: c.startDate ?? "", daysInStage: c.daysInStage,
        nextAction: c.nextAction,
      })),
      `clients-${new Date().toISOString().split("T")[0]}.csv`,
    );
    toast.success(`Exported ${target.length} clients`);
  };

  const selectedClients = clients.filter((c) => selectedIds.includes(c.id));
  const selectedNextStages = selectedClients.map((c) => getNextPipelineStage(c.stage));
  const sharedNextStage = selectedClients.length
    ? selectedNextStages.every((stage) => stage === selectedNextStages[0]) ? selectedNextStages[0] : null
    : null;

  return (
    <PageShell
      title="Clients"
      description="Client command center — full lifecycle from BCBA assignment to active services"
      icon={UserCheck}
    >
      <ClientKpiStrip clients={clients} activeKpi={activeKpi} onKpiClick={handleKpi} />

      <ClientControlBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeView={activeView}
        onActiveViewChange={handleViewChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFiltersChange={setFilters}
        filterOptions={filterOptions}
        onNewClient={() => setConvertOpen(true)}
        onExport={() => exportClients()}
      />

      <ClientBulkActionBar
        count={selectedIds.length}
        onClear={() => setSelectedIds([])}
        movableStages={sharedNextStage ? [sharedNextStage as ClientStage] : []}
        bcbas={filterOptions.bcbas.length ? filterOptions.bcbas : ["Dr. Kim", "Dr. Lee", "Dr. Patel"]}
        rbts={filterOptions.rbts.length ? filterOptions.rbts : ["Taylor S.", "Jordan M.", "Casey R."]}
        onAssignBcba={(bcba) => { assignBcba(selectedIds, bcba); toast.success(`Assigned ${selectedIds.length} clients to ${bcba}`); }}
        onAssignRbt={(rbt) => { assignRbt(selectedIds, rbt); toast.success(`Assigned ${rbt} to ${selectedIds.length} clients`); }}
        onMoveStage={(stage) => { moveStage(selectedIds, stage); toast.success(`Moved ${selectedIds.length} clients to ${stage}`); setSelectedIds([]); }}
        onSetStartDate={() => {
          const d = window.prompt("Start date (YYYY-MM-DD):", new Date().toISOString().split("T")[0]);
          if (d) { setStartDate(selectedIds, d); toast.success(`Start date set on ${selectedIds.length} clients`); }
        }}
        onExport={() => exportClients(selectedIds)}
        onDelete={() => {
          if (window.confirm(`Delete ${selectedIds.length} clients? This cannot be undone.`)) {
            deleteClients(selectedIds);
            toast.success(`Deleted ${selectedIds.length} clients`);
            setSelectedIds([]);
          }
        }}
      />

      {viewMode === "table" && (
        <ClientTableView
          clients={filteredClients}
          onSelect={(c) => navigate(`/clients/${c.id}`)}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
        />
      )}
      {viewMode === "queue" && (
        <ClientQueueView clients={filteredClients} onSelect={(c) => navigate(`/clients/${c.id}`)} />
      )}

      <ConvertLeadDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        onCreated={(client) => navigate(`/clients/${client.id}`)}
      />
    </PageShell>
  );
}
