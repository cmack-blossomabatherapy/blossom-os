import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageShell } from "@/components/shared/PageShell";
import { ClipboardCheck, FileWarning, ShieldCheck, Users } from "lucide-react";
import { LeadControlBar, ViewMode } from "@/components/leads/LeadControlBar";
import { LeadTableView, SortField, SortDir } from "@/components/leads/LeadTableView";
import { LeadPipelineView } from "@/components/leads/LeadPipelineView";
import { LeadQueueView } from "@/components/leads/LeadQueueView";
import { LeadKpiStrip } from "@/components/leads/LeadKpiStrip";
import { LeadBulkActionBar } from "@/components/leads/LeadBulkActionBar";
import { LeadFilters } from "@/components/leads/LeadFilterPopover";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { kpiFilters, KpiKey, LeadStatus } from "@/data/leads";
import { useLeads } from "@/contexts/LeadsContext";
import { toast } from "sonner";
import { useClients } from "@/contexts/ClientsContext";

const emptyFilters: LeadFilters = { states: [], sources: [], owners: [], insurances: [], priorities: [] };

const exportToCsv = (rows: Record<string, unknown>[], filename: string) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => {
      const v = String(r[h] ?? "").replace(/"/g, '""');
      return `"${v}"`;
    }).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export default function Leads() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { leads, moveStage, assignOwner, addTag, deleteLeads } = useLeads();

  const initialView = searchParams.get("view") as ViewMode | null;
  const [viewMode, setViewMode] = useState<ViewMode>(initialView === "table" || initialView === "pipeline" || initialView === "queue" ? initialView : "queue");
  const [activeView, setActiveView] = useState("all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [filters, setFilters] = useState<LeadFilters>(emptyFilters);
  const [activeKpi, setActiveKpi] = useState<KpiKey | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const { clients } = useClients();

  // Initial ?source=… filter (linked from marketing source pages).
  useEffect(() => {
    const src = searchParams.get("source");
    if (src) {
      setFilters((f) => (f.sources.includes(src) ? f : { ...f, sources: [...f.sources, src] }));
    }
    if (searchParams.get("new") === "1") setNewLeadOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external ?q= into search input (e.g. from TopBar global search)
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null && q !== searchQuery) setSearchQuery(q);
    const view = searchParams.get("view") as ViewMode | null;
    if ((view === "table" || view === "pipeline" || view === "queue") && view !== viewMode) setViewMode(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Sync local search → URL (debounced via state)
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (searchQuery) next.set("q", searchQuery);
    else next.delete("q");
    next.set("view", viewMode);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, viewMode]);

  const filterOptions = useMemo(() => ({
    states: Array.from(new Set(leads.map((l) => l.state))).sort(),
    sources: Array.from(new Set(leads.map((l) => l.source))).sort(),
    owners: Array.from(new Set(leads.map((l) => l.owner))).sort(),
    insurances: Array.from(new Set(leads.map((l) => l.insurance))).sort(),
    priorities: ["Hot", "Warm", "Cold"],
  }), [leads]);

  const filteredLeads = useMemo(() => {
    let result = leads;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.childName.toLowerCase().includes(q) ||
          l.parentName.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q),
      );
    }

    if (filters.states.length) result = result.filter((l) => filters.states.includes(l.state));
    if (filters.sources.length) result = result.filter((l) => filters.sources.includes(l.source));
    if (filters.owners.length) result = result.filter((l) => filters.owners.includes(l.owner));
    if (filters.insurances.length) result = result.filter((l) => filters.insurances.includes(l.insurance));
    if (filters.priorities.length) result = result.filter((l) => filters.priorities.includes(l.priority));

    if (activeKpi) {
      result = result.filter(kpiFilters[activeKpi]);
    } else {
      switch (activeView) {
        case "mine": result = result.filter((l) => l.owner === "Sarah M."); break;
        case "today": result = result.filter((l) => l.daysInStage === 0); break;
        case "attention": result = result.filter((l) => l.status === "New Lead" || l.status === "Missing Information" || l.status === "Can't Reach" || l.daysInStage >= 5); break;
        case "stuck": result = result.filter((l) => l.daysInStage >= 3); break;
        case "vob": result = result.filter((l) => l.status === "Form Received" || l.status === "Sent to VOB"); break;
        case "cantReach": result = result.filter((l) => l.status === "Can't Reach" || l.status === "Sent Packet - Can't Reach"); break;
        case "vobDone": result = result.filter((l) => l.status === "VOB Completed"); break;
      }
    }

    if (sortField) {
      const dir = sortDir === "asc" ? 1 : -1;
      const priorityOrder: Record<string, number> = { Hot: 0, Warm: 1, Cold: 2 };
      result = [...result].sort((a, b) => {
        let av: string | number = "", bv: string | number = "";
        switch (sortField) {
          case "id": av = a.id; bv = b.id; break;
          case "childName": av = a.childName; bv = b.childName; break;
          case "state": av = a.state; bv = b.state; break;
          case "status": av = a.status; bv = b.status; break;
          case "owner": av = a.owner; bv = b.owner; break;
          case "priority": av = priorityOrder[a.priority]; bv = priorityOrder[b.priority]; break;
          case "daysInStage": av = a.daysInStage; bv = b.daysInStage; break;
          case "lastContacted":
            av = a.lastContacted ? new Date(a.lastContacted).getTime() : 0;
            bv = b.lastContacted ? new Date(b.lastContacted).getTime() : 0;
            break;
        }
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      });
    }

    return result;
  }, [leads, searchQuery, activeView, filters, activeKpi, sortField, sortDir]);

  const handleKpiClick = (key: KpiKey) => {
    setActiveKpi(activeKpi === key ? null : key);
    setActiveView("all");
  };

  const handleViewChange = (id: string) => {
    setActiveView(id);
    setActiveKpi(null);
  };

  const handleSort = (field: SortField) => {
    if (!field) return;
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const intakeSignals = useMemo(() => [
    { label: "Financial review", value: leads.filter((lead) => lead.financialStatus === "Pending Review" || lead.paymentPlanNeeded).length, icon: FileWarning },
    { label: "Ready for pipeline", value: leads.filter((lead) => lead.status === "VOB Completed" || lead.paymentPlanSigned).length, icon: ClipboardCheck },
    { label: "Converted clients", value: clients.filter((client) => client.leadId || ["Converted to Client", "BCBA Assignment", "Pending Initial Authorization"].includes(client.stage)).length, icon: Users },
    { label: "Auth handoffs", value: clients.filter((client) => client.readyForAuth || client.authorizations.some((auth) => auth.type === "Initial")).length, icon: ShieldCheck },
  ], [clients, leads]);

  const exportLeads = (ids?: string[]) => {
    const target = ids?.length
      ? leads.filter((l) => ids.includes(l.id))
      : filteredLeads;
    if (!target.length) {
      toast.info("Nothing to export");
      return;
    }
    exportToCsv(
      target.map((l) => ({
        id: l.id, childName: l.childName, parentName: l.parentName,
        phone: l.phone, email: l.email, state: l.state, source: l.source,
        status: l.status, owner: l.owner, priority: l.priority,
        insurance: l.insurance, formStatus: l.formStatus, vobStatus: l.vobStatus,
        daysInStage: l.daysInStage, nextAction: l.nextAction,
      })),
      `leads-${new Date().toISOString().split("T")[0]}.csv`,
    );
    toast.success(`Exported ${target.length} leads`);
  };

  return (
    <PageShell
      title="Intake"
      description="Action queue for intake leads from first contact through VOB readiness"
      icon={Users}
    >
      <LeadKpiStrip leads={leads} activeKpi={activeKpi} onKpiClick={handleKpiClick} />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {intakeSignals.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-border/60 bg-card p-3">
            <Icon className="mb-2 h-4 w-4 text-primary" />
            <p className="text-xl font-semibold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>

      <LeadControlBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeView={activeView}
        onActiveViewChange={handleViewChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFiltersChange={setFilters}
        filterOptions={filterOptions}
        onNewLead={() => setNewLeadOpen(true)}
        onExport={() => exportLeads()}
      />

      <LeadBulkActionBar
        count={selectedIds.length}
        selectedIds={selectedIds}
        onClear={() => setSelectedIds([])}
        owners={filterOptions.owners}
        onAssign={(owner) => {
          assignOwner(selectedIds, owner);
          toast.success(`Assigned ${selectedIds.length} leads to ${owner}`);
        }}
        onMoveStage={(status: LeadStatus) => {
          moveStage(selectedIds, status);
          toast.success(`Moved ${selectedIds.length} leads to ${status}`);
          setSelectedIds([]);
        }}
        onSendFollowUp={() => toast.success(`Follow-up sequence queued for ${selectedIds.length} leads`)}
        onTag={() => {
          const tag = window.prompt("Tag name:");
          if (tag) {
            addTag(selectedIds, tag);
            toast.success(`Tagged ${selectedIds.length} leads with "${tag}"`);
          }
        }}
        onCreateTask={() => toast.success(`Task created for ${selectedIds.length} leads`)}
        onExport={() => exportLeads(selectedIds)}
        onDelete={() => {
          if (window.confirm(`Delete ${selectedIds.length} leads? This cannot be undone.`)) {
            deleteLeads(selectedIds);
            toast.success(`Deleted ${selectedIds.length} leads`);
            setSelectedIds([]);
          }
        }}
      />

      {viewMode === "table" && (
        <LeadTableView
          leads={filteredLeads}
          onSelectLead={(lead) => navigate(`/leads/${lead.id}`)}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
        />
      )}
      {viewMode === "pipeline" && (
        <LeadPipelineView leads={filteredLeads} onSelectLead={(lead) => navigate(`/leads/${lead.id}`)} />
      )}
      {viewMode === "queue" && (
        <LeadQueueView leads={filteredLeads} onSelectLead={(lead) => navigate(`/leads/${lead.id}`)} />
      )}

      <NewLeadDialog
        open={newLeadOpen}
        onOpenChange={setNewLeadOpen}
        onCreated={(lead) => navigate(`/leads/${lead.id}`)}
      />
    </PageShell>
  );
}
