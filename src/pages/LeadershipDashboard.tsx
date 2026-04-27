import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, Download, Filter, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardDefinitions, pipelineStageOrder, type ClientRecord, type ClinicPerformance, type DashboardKey, type HealthStatus, type RiskLevel, type ServiceSetting } from "@/data/leadershipDashboard";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (value: number | null) => (value === null || Number.isNaN(value) ? "—" : `${value}%`);
const dayMs = 1000 * 60 * 60 * 24;

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type AuthRow = Database["public"]["Tables"]["client_authorizations"]["Row"];
type TimesheetRow = Database["public"]["Tables"]["hours_timesheets"]["Row"];

const roleDashboardMap: Record<string, DashboardKey> = {
  intake: "intake",
  auth_team: "authorizations",
  scheduling: "scheduling",
  staffing: "staffing",
  clinic: "clinic",
  clinic_director: "clinic",
  qa: "qa",
  finance: "finance",
  hr: "hr",
  hr_admin: "hr",
  hr_manager: "hr",
  recruiting_assistant: "recruiting",
};

function daysSince(date: string | null | undefined) {
  if (!date) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / dayMs));
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "unknown";
}

function normalizeServiceSetting(value: string | null | undefined): ServiceSetting {
  const text = (value ?? "").toLowerCase();
  if (text.includes("home")) return "Home";
  if (text.includes("school")) return "School";
  if (text.includes("clinic")) return "Clinic";
  return "Unknown";
}

function parseHours(value: string | null | undefined) {
  if (!value) return 0;
  const match = value.match(/[\d.]+/);
  return match ? Number(match[0]) || 0 : 0;
}

function riskFor(client: ClientRow, authorizedHours: number, deliveredHours: number): RiskLevel {
  const days = daysSince(client.stage_entered_at);
  const utilization = authorizedHours > 0 ? Math.round((deliveredHours / authorizedHours) * 100) : null;
  if (client.stage === "Staffing Needed" || days > 21 || (utilization !== null && utilization < 70)) return "Critical";
  if (days > 14 || client.staffing_status === "Needed") return "High";
  if (days > 7) return "Medium";
  return "Low";
}

function buildLiveDashboard(clients: ClientRow[], auths: AuthRow[], timesheets: TimesheetRow[]) {
  const authsByClient = new Map<string, AuthRow[]>();
  auths.forEach((auth) => authsByClient.set(auth.client_id, [...(authsByClient.get(auth.client_id) ?? []), auth]));
  const deliveredTotal = timesheets.reduce((sum, row) => sum + Number(row.total_hours ?? 0), 0);
  const deliveredPerActiveClient = clients.filter((c) => c.stage === "Active").length > 0 ? deliveredTotal / clients.filter((c) => c.stage === "Active").length : 0;

  const clientRecords: ClientRecord[] = clients.map((client) => {
    const clientAuths = authsByClient.get(client.id) ?? [];
    const authorizedHours = clientAuths.reduce((sum, auth) => sum + parseHours(auth.hours), 0);
    const deliveredHours = client.stage === "Active" ? Math.round(deliveredPerActiveClient) : 0;
    return {
      id: client.id,
      name: client.child_name,
      status: String(client.stage),
      state: client.state,
      clinic: client.clinic,
      serviceSetting: normalizeServiceSetting(client.clinic),
      bcba: client.bcba ?? "—",
      rbt: client.rbt ?? (client.staffing_status === "Needed" ? "Needed" : "—"),
      insurance: client.payor || "—",
      authStatus: String(client.auth_status),
      authorizedHours,
      deliveredHours,
      daysInStatus: daysSince(client.stage_entered_at),
      startDate: client.start_date ?? "—",
      riskLevel: riskFor(client, authorizedHours, deliveredHours),
      notes: client.next_action || client.blockers.join(", ") || "—",
    };
  });

  const clinicMap = new Map<string, ClientRecord[]>();
  clientRecords.forEach((client) => clinicMap.set(client.clinic, [...(clinicMap.get(client.clinic) ?? []), client]));
  const clinics: ClinicPerformance[] = Array.from(clinicMap.entries()).map(([clinicName, rows]) => {
    const activeClients = rows.filter((row) => row.status === "Active").length;
    const pipelineClients = rows.filter((row) => !["Active", "Discharged"].includes(row.status)).length;
    const staffingNeeded = rows.filter((row) => row.status === "Staffing Needed" || row.rbt === "Needed").length;
    const authorizedHours = rows.reduce((sum, row) => sum + row.authorizedHours, 0);
    const deliveredHours = rows.reduce((sum, row) => sum + row.deliveredHours, 0);
    const utilization = authorizedHours > 0 ? Math.round((deliveredHours / authorizedHours) * 100) : null;
    const avgDaysToStartRows = rows.filter((row) => row.startDate !== "—");
    const avgDaysToStart = avgDaysToStartRows.length ? Math.round(avgDaysToStartRows.reduce((sum, row) => sum + row.daysInStatus, 0) / avgDaysToStartRows.length) : null;
    const healthStatus: HealthStatus = utilization !== null && utilization >= 85 && staffingNeeded <= 2 ? "Healthy" : utilization !== null && utilization < 70 ? "Critical" : "Watch";
    return {
      id: slug(clinicName),
      clinic: clinicName,
      state: rows[0]?.state ?? "—",
      director: "—",
      activeClients,
      pipelineClients,
      staffingNeeded,
      authorizedHours,
      deliveredHours,
      utilization,
      avgDaysToStart,
      flakedClients: rows.filter((row) => row.status.toLowerCase().includes("flaked")).length,
      revenueEstimate: deliveredHours ? deliveredHours * 80 : null,
      healthStatus,
      notes: rows.length ? "Live data from Blossom OS records." : "No records yet.",
    };
  });

  const pipelineStages = pipelineStageOrder.map((stage) => {
    const matching = clientRecords.filter((row) => row.status === stage || (stage === "Pending Initial Auth" && row.authStatus.includes("Submitted")));
    return {
      stage,
      count: matching.length,
      avgDays: matching.length ? Math.round(matching.reduce((sum, row) => sum + row.daysInStatus, 0) / matching.length) : null,
      stuckTooLong: matching.some((row) => row.daysInStatus > 14),
    };
  });

  const redFlags = clientRecords
    .filter((row) => row.riskLevel === "Critical" || row.riskLevel === "High")
    .slice(0, 12)
    .map((row) => ({
      type: row.status === "Staffing Needed" || row.rbt === "Needed" ? "Staffing Needed" : row.daysInStatus > 21 ? "Client stuck in status" : "Operational risk",
      target: row.name,
      owner: row.bcba !== "—" ? row.bcba : "Unassigned",
      daysOpen: row.daysInStatus,
      severity: row.riskLevel === "Critical" ? "Critical" as const : "Watch" as const,
      action: row.notes !== "—" ? row.notes : "Review next action and assign owner.",
    }));

  return { clientRecords, clinics, pipelineStages, redFlags, lastUpdated: new Date() };
}

export default function LeadershipDashboard() {
  const { clinicId } = useParams();
  const { isAdmin, roles, partOfLeadership, dashboardAccess } = useAuth();
  const [clientRows, setClientRows] = useState<ClientRow[]>([]);
  const [authRows, setAuthRows] = useState<AuthRow[]>([]);
  const [timesheetRows, setTimesheetRows] = useState<TimesheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("This Month");
  const [stateFilter, setStateFilter] = useState("All States");
  const [clinicFilter, setClinicFilter] = useState("All Clinics");
  const [serviceFilter, setServiceFilter] = useState("All Settings");
  const [insuranceFilter, setInsuranceFilter] = useState("All Insurance");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<keyof ClientRecord>("daysInStatus");

  const assignedDashboard = useMemo<DashboardKey>(() => {
    if (dashboardAccess && dashboardAccess !== "department") return dashboardAccess as DashboardKey;
    return roles.map((role) => roleDashboardMap[role]).find(Boolean) ?? "clinic";
  }, [dashboardAccess, roles]);
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardKey>(isAdmin || partOfLeadership ? "ceo" : assignedDashboard);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const [clientsRes, authsRes, timesheetsRes] = await Promise.all([
        supabase.from("clients").select("*"),
        supabase.from("client_authorizations").select("*"),
        supabase.from("hours_timesheets").select("*"),
      ]);

      const queryError = clientsRes.error ?? authsRes.error ?? timesheetsRes.error;
      if (queryError) throw queryError;

      setClientRows((clientsRes.data ?? []) as ClientRow[]);
      setAuthRows((authsRes.data ?? []) as AuthRow[]);
      setTimesheetRows((timesheetsRes.data ?? []) as TimesheetRow[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Live dashboard data could not be loaded.";
      setLoadError(message);
      setClientRows([]);
      setAuthRows([]);
      setTimesheetRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const live = useMemo(() => buildLiveDashboard(clientRows, authRows, timesheetRows), [authRows, clientRows, timesheetRows]);
  const states = ["All States", ...Array.from(new Set(live.clientRecords.map((client) => client.state))).filter(Boolean)];
  const clinicNames = ["All Clinics", ...Array.from(new Set(live.clinics.map((clinic) => clinic.clinic))).filter(Boolean)];
  const insuranceNames = ["All Insurance", ...Array.from(new Set(live.clientRecords.map((client) => client.insurance))).filter((item) => item && item !== "—")];
  const allowedDashboards = isAdmin ? dashboardDefinitions : partOfLeadership ? dashboardDefinitions.filter((d) => d.key === "ceo") : dashboardDefinitions.filter((d) => d.key === assignedDashboard);
  const activeDashboard = allowedDashboards.some((d) => d.key === selectedDashboard) ? selectedDashboard : allowedDashboards[0]?.key ?? "clinic";
  const selectedClinic = clinicId ? live.clinics.find((clinic) => clinic.id === clinicId) : null;

  const filteredClients = useMemo(() => {
    const q = query.toLowerCase();
    return live.clientRecords
      .filter((client) => stateFilter === "All States" || client.state === stateFilter)
      .filter((client) => clinicFilter === "All Clinics" || client.clinic === clinicFilter)
      .filter((client) => serviceFilter === "All Settings" || client.serviceSetting === serviceFilter)
      .filter((client) => insuranceFilter === "All Insurance" || client.insurance === insuranceFilter)
      .filter((client) => !q || [client.name, client.status, client.clinic, client.bcba, client.rbt, client.insurance].some((field) => field.toLowerCase().includes(q)))
      .sort((a, b) => {
        const av = a[sortBy];
        const bv = b[sortBy];
        if (typeof av === "number" && typeof bv === "number") return bv - av;
        return String(av).localeCompare(String(bv));
      });
  }, [clinicFilter, insuranceFilter, live.clientRecords, query, serviceFilter, sortBy, stateFilter]);

  if (selectedClinic) {
    return <ClinicDetailDashboard clinic={selectedClinic} allClients={live.clientRecords.filter((client) => client.clinic === selectedClinic.clinic)} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">CEO & Leadership Dashboard</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Company-wide operational scorecard for clinics, staffing, authorizations, utilization, and client flow.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Last Updated: {live.lastUpdated.toLocaleString()}</span>
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          </div>
        </div>

        {isAdmin && <DashboardSelector activeDashboard={activeDashboard} onSelect={setSelectedDashboard} />}
        {!isAdmin && !partOfLeadership && activeDashboard !== "ceo" && <DepartmentDashboardNotice dashboard={allowedDashboards[0]} />}

        {activeDashboard === "ceo" && (
          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Filter className="h-4 w-4 text-primary" />Dashboard Filters</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <Select value={dateRange} onValueChange={setDateRange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Today", "This Week", "This Month", "Last Month", "Custom Range"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
              <Select value={stateFilter} onValueChange={setStateFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{states.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
              <Select value={clinicFilter} onValueChange={setClinicFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{clinicNames.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
              <Select value={serviceFilter} onValueChange={setServiceFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["All Settings", "Home", "School", "Clinic", "Unknown"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
              <Select value={insuranceFilter} onValueChange={setInsuranceFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{insuranceNames.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
              <Select defaultValue="All BCBAs"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["All BCBAs", ...Array.from(new Set(live.clientRecords.map((c) => c.bcba))).filter((v) => v !== "—")].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
              <Select defaultValue="All RBTs"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["All RBTs", ...Array.from(new Set(live.clientRecords.map((c) => c.rbt))).filter((v) => v !== "—")].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
        )}
      </header>

      {loading ? <Section title="Loading live data"><p className="text-sm text-muted-foreground">Loading records from Blossom OS…</p></Section> : activeDashboard === "ceo" ? <LeadershipScorecard live={live} filteredClients={filteredClients} query={query} setQuery={setQuery} sortBy={sortBy} setSortBy={setSortBy} /> : <DepartmentDashboard dashboardKey={activeDashboard} live={live} />}
    </div>
  );
}

function DashboardSelector({ activeDashboard, onSelect }: { activeDashboard: DashboardKey; onSelect: (key: DashboardKey) => void }) {
  return <section className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"><div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold text-foreground">Super Admin Dashboard Selector</h2></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">{dashboardDefinitions.map((dashboard) => <button key={dashboard.key} onClick={() => onSelect(dashboard.key)} className={cn("rounded-lg border p-3 text-left transition-colors", activeDashboard === dashboard.key ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background hover:bg-muted/40")}><p className="text-sm font-semibold text-foreground">{dashboard.name}</p><p className="mt-1 text-[11px] text-muted-foreground">Access: {dashboard.access}</p><p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{dashboard.description}</p></button>)}</div></section>;
}

function LeadershipScorecard({ live, filteredClients, query, setQuery, sortBy, setSortBy }: { live: ReturnType<typeof buildLiveDashboard>; filteredClients: ClientRecord[]; query: string; setQuery: (value: string) => void; sortBy: keyof ClientRecord; setSortBy: (value: keyof ClientRecord) => void }) {
  const totalAuthorized = live.clinics.reduce((sum, clinic) => sum + clinic.authorizedHours, 0);
  const totalDelivered = live.clinics.reduce((sum, clinic) => sum + clinic.deliveredHours, 0);
  const utilization = totalAuthorized > 0 ? Math.round((totalDelivered / totalAuthorized) * 100) : null;
  const activeClients = live.clientRecords.filter((client) => client.status === "Active").length;
  const pipelineClients = live.clientRecords.filter((client) => !["Active", "Discharged"].includes(client.status)).length;
  const staffingNeeded = live.clientRecords.filter((client) => client.status === "Staffing Needed" || client.rbt === "Needed").length;
  const avgDaysToStartRows = live.clientRecords.filter((client) => client.startDate !== "—");
  const avgDaysToStart = avgDaysToStartRows.length ? Math.round(avgDaysToStartRows.reduce((sum, client) => sum + client.daysInStatus, 0) / avgDaysToStartRows.length) : null;

  return <>{live.clientRecords.length === 0 && <EmptyState title="No leadership data yet" message="This dashboard is connected to live Blossom OS records, but there are no clients, authorizations, or service hours to summarize yet." guidance={["Add client records with clinic, state, stage, payor, BCBA, and RBT fields.", "Add authorization records with approved hours to populate authorized hours and auth health.", "Add submitted/approved timesheets to populate delivered hours and utilization."]} />}<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><KpiCard title="Total Active Clients" value={activeClients} tone="success" /><KpiCard title="Total Clients in Pipeline" value={pipelineClients} tone="info" /><KpiCard title="Authorized Hours" value={totalAuthorized.toLocaleString()} tone="info" /><KpiCard title="Delivered Hours" value={totalDelivered.toLocaleString()} tone="success" /><KpiCard title="Utilization %" value={pct(utilization)} trend="Target 85%+" tone={utilization === null ? "info" : utilization >= 85 ? "success" : utilization >= 70 ? "warning" : "critical"} /><KpiCard title="Staffing Needed" value={staffingNeeded} tone={staffingNeeded > 10 ? "critical" : staffingNeeded > 0 ? "warning" : "success"} /><KpiCard title="Average Days to Start" value={avgDaysToStart ?? "—"} tone="warning" /><KpiCard title="Revenue Estimate" value={totalDelivered ? currency.format(totalDelivered * 80) : "—"} tone="success" /></section><Section title="CEO Snapshot"><EmptyOrList items={buildSnapshot(live)} /></Section><ClinicPerformanceTable clinics={live.clinics} /><div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"><PipelineFunnel stages={live.pipelineStages} total={Math.max(1, live.clientRecords.length)} /><ServiceSettingPerformance clients={live.clientRecords} /></div><OperationalSections live={live} /><RedFlagsAndInsights redFlags={live.redFlags} clients={live.clientRecords} /><ClientListTable clients={filteredClients} query={query} setQuery={setQuery} sortBy={sortBy} setSortBy={setSortBy} /></>;
}

function buildSnapshot(live: ReturnType<typeof buildLiveDashboard>) {
  const items: string[] = [];
  const highestPipeline = [...live.clinics].sort((a, b) => b.pipelineClients - a.pipelineClients)[0];
  if (highestPipeline) items.push(`${highestPipeline.clinic} has ${highestPipeline.pipelineClients} clients in pipeline and ${highestPipeline.activeClients} active.`);
  const stuck = live.clientRecords.filter((client) => client.daysInStatus > 14).length;
  if (stuck) items.push(`${stuck} clients have been in their current status for more than 14 days.`);
  const staffing = live.clientRecords.filter((client) => client.status === "Staffing Needed" || client.rbt === "Needed").length;
  if (staffing) items.push(`${staffing} clients currently need staffing support.`);
  if (!items.length && live.clientRecords.length) items.push("No major live red flags are currently detected from available records.");
  return items;
}

function ClinicPerformanceTable({ clinics }: { clinics: ClinicPerformance[] }) {
  return <Section title="Clinic Performance">{clinics.length === 0 ? <EmptyState title="No clinic performance yet" message="Clinic performance appears after live client records are added with a clinic and state." guidance={["Add at least one client record.", "Make sure each client has a clinic, state, and current stage.", "Add authorization hours and timesheets to calculate utilization and revenue estimates."]} /> : <div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-sm"><thead className="text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{["Clinic", "State", "Active Clients", "Pipeline Clients", "Staffing Needed", "Authorized Hours", "Delivered Hours", "Utilization %", "Avg Days to Start", "Flaked Clients", "Revenue Estimate", "Health Status"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y divide-border/50">{clinics.map((clinic) => <tr key={clinic.id} className="hover:bg-muted/30"><td className="px-3 py-3 font-medium text-primary"><Link to={`/leadership-dashboard/clinics/${clinic.id}`}>{clinic.clinic}</Link></td><td className="px-3 py-3">{clinic.state}</td><td className="px-3 py-3">{clinic.activeClients}</td><td className="px-3 py-3">{clinic.pipelineClients}</td><td className="px-3 py-3">{clinic.staffingNeeded}</td><td className="px-3 py-3">{clinic.authorizedHours}</td><td className="px-3 py-3">{clinic.deliveredHours}</td><td className="px-3 py-3"><StatusPill label={pct(clinic.utilization)} status={clinic.healthStatus} /></td><td className="px-3 py-3">{clinic.avgDaysToStart ?? "—"}</td><td className="px-3 py-3">{clinic.flakedClients}</td><td className="px-3 py-3">{clinic.revenueEstimate ? currency.format(clinic.revenueEstimate) : "—"}</td><td className="px-3 py-3"><StatusPill label={clinic.healthStatus} status={clinic.healthStatus} /></td></tr>)}</tbody></table></div>}</Section>;
}

function PipelineFunnel({ stages, total }: { stages: ReturnType<typeof buildLiveDashboard>["pipelineStages"]; total: number }) {
  return <Section title="Pipeline Funnel"><div className="space-y-2">{stages.map((stage) => <div key={stage.stage} className="grid grid-cols-[180px_1fr_120px] items-center gap-3 text-sm"><span className="font-medium text-foreground">{stage.stage}</span><div className="h-8 overflow-hidden rounded-md bg-muted"><div className={cn("h-full rounded-md", stage.stuckTooLong ? "bg-destructive/70" : "bg-primary/70")} style={{ width: `${Math.max(0, (stage.count / total) * 100)}%` }} /></div><span className="text-xs text-muted-foreground">{stage.count} · {Math.round((stage.count / total) * 100)}% · {stage.avgDays ?? "—"}d</span></div>)}</div></Section>;
}

function ServiceSettingPerformance({ clients }: { clients: ClientRecord[] }) {
  return <Section title="Service Setting Performance"><div className="grid gap-3">{(["Home", "School", "Clinic", "Unknown"] as ServiceSetting[]).map((setting) => { const rows = clients.filter((client) => client.serviceSetting === setting); const authorized = rows.reduce((sum, row) => sum + row.authorizedHours, 0); const delivered = rows.reduce((sum, row) => sum + row.deliveredHours, 0); const utilization = authorized ? Math.round((delivered / authorized) * 100) : null; return <div key={setting} className="rounded-lg border border-border/60 bg-background p-4"><div className="flex items-center justify-between"><p className="font-semibold text-foreground">{setting} Clients</p><StatusPill label={pct(utilization)} status={utilization !== null && utilization >= 85 ? "Healthy" : utilization !== null && utilization < 70 ? "Critical" : "Watch"} /></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground"><span>Active: {rows.filter((r) => r.status === "Active").length}</span><span>Authorized: {authorized}</span><span>Delivered: {delivered}</span><span>Staffing Needed: {rows.filter((r) => r.rbt === "Needed" || r.status === "Staffing Needed").length}</span></div></div>; })}</div></Section>;
}

function OperationalSections({ live }: { live: ReturnType<typeof buildLiveDashboard> }) {
  const staffingRows = live.clientRecords.filter((c) => c.rbt === "Needed" || c.status === "Staffing Needed").map((c) => [c.name, `${c.clinic} / ${c.state}`, c.rbt === "Needed" ? "RBT" : "Staffing", String(c.daysInStatus), c.bcba, c.rbt, c.riskLevel, c.notes, "—"]);
  const authRows = live.clientRecords.filter((c) => c.authStatus !== "Approved" && c.authStatus !== "Not Submitted").map((c) => [c.name, c.state, c.insurance, c.authStatus, c.status, "—", String(c.daysInStatus), "—", "—", c.riskLevel]);
  return <div className="grid gap-6 xl:grid-cols-2"><MetricSection title="Staffing Health" metrics={[`Clients Needing RBT: ${staffingRows.length}`, `Open Staffing Gaps: ${staffingRows.length}`, `Clients at Risk Due to Staffing: ${staffingRows.filter((r) => ["High", "Critical"].includes(r[6])).length}`]} tableHeaders={["Client", "Clinic/State", "Needed Role", "Days Waiting", "BCBA", "RBT", "Priority", "Notes", "Owner"]} rows={staffingRows} /><MetricSection title="Authorization Health" metrics={[`Pending Auths: ${authRows.length}`, `Auths Approved: ${live.clientRecords.filter((c) => c.authStatus === "Approved").length}`, `Avg Days Waiting: ${authRows.length ? Math.round(authRows.reduce((s, r) => s + Number(r[6]), 0) / authRows.length) : 0}`]} tableHeaders={["Client", "State", "Payor", "Auth Type", "Current Status", "Submitted Date", "Days Waiting", "Expiration Date", "Owner", "Risk Level"]} rows={authRows} /><MetricSection title="Intake & Conversion" metrics={[`Pipeline Clients: ${live.clientRecords.filter((c) => c.status !== "Active").length}`, `Missing Info: ${live.clientRecords.filter((c) => c.status === "Missing Info").length}`, `Active: ${live.clientRecords.filter((c) => c.status === "Active").length}`]} tableHeaders={["Stage", "Count", "Avg Days"]} rows={live.pipelineStages.map((s) => [s.stage, String(s.count), String(s.avgDays ?? "—")])} /><MetricSection title="QA & Clinical Readiness" metrics={[`In QA: ${live.clientRecords.filter((c) => c.status === "In QA").length}`, `QA Over 14 Days: ${live.clientRecords.filter((c) => c.status === "In QA" && c.daysInStatus > 14).length}`]} tableHeaders={["Client", "BCBA", "Status", "Days in QA", "Notes"]} rows={live.clientRecords.filter((c) => c.status === "In QA").map((c) => [c.name, c.bcba, c.status, String(c.daysInStatus), c.notes])} /><MetricSection title="Finance Snapshot" metrics={[`Estimated Revenue: ${currency.format(live.clinics.reduce((s, c) => s + (c.revenueEstimate ?? 0), 0))}`, `Delivered Billable Hours: ${live.clinics.reduce((s, c) => s + c.deliveredHours, 0)}`, `Financial Risk Clients: ${live.clientRecords.filter((c) => c.riskLevel === "High" || c.riskLevel === "Critical").length}`]} tableHeaders={["Risk", "Count", "Action"]} rows={[["Live billing risk rules", "—", "Add finance-specific fields to calculate more precisely."]]} /></div>;
}

function RedFlagsAndInsights({ redFlags, clients }: { redFlags: ReturnType<typeof buildLiveDashboard>["redFlags"]; clients: ClientRecord[] }) {
  const insights = buildSnapshot({ clientRecords: clients, clinics: [], pipelineStages: [], redFlags, lastUpdated: new Date() } as ReturnType<typeof buildLiveDashboard>);
  return <div className="grid gap-6 xl:grid-cols-2"><Section title="Red Flags">{redFlags.length === 0 ? <EmptyState title="No red flags right now" message="No critical or watch-level risks were detected from the live records currently available." guidance={["Red flags will appear when clients are stuck too long, need staffing, have low utilization, or have overdue authorization risk.", "Keep stage dates, staffing status, auth status, and delivered hours updated for accurate alerts."]} /> : <div className="grid gap-3">{redFlags.map((flag) => <div key={`${flag.type}-${flag.target}`} className="rounded-lg border border-border/60 bg-background p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-foreground">{flag.type}</p><p className="text-sm text-muted-foreground">{flag.target} · Owner: {flag.owner}</p></div><SeverityPill severity={flag.severity} /></div><p className="mt-2 text-sm text-foreground">{flag.daysOpen} days open · {flag.action}</p></div>)}</div>}</Section><Section title="Patterns & Insights"><EmptyOrList items={insights} /></Section></div>;
}

function ClinicDetailDashboard({ clinic, allClients }: { clinic: ClinicPerformance; allClients: ClientRecord[] }) {
  return <div className="space-y-6 animate-fade-in"><div><Button asChild variant="outline" size="sm"><Link to="/leadership-dashboard">Back to Leadership Dashboard</Link></Button><h1 className="mt-4 text-2xl font-semibold text-foreground">{clinic.clinic} Clinic Detail Dashboard</h1><p className="text-sm text-muted-foreground">{clinic.state} · Director/Admin: {clinic.director}</p></div><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><KpiCard title="Active Clients" value={clinic.activeClients} tone="success" /><KpiCard title="Pipeline Clients" value={clinic.pipelineClients} tone="info" /><KpiCard title="Staffing Needed" value={clinic.staffingNeeded} tone={clinic.staffingNeeded > 4 ? "critical" : clinic.staffingNeeded > 0 ? "warning" : "success"} /><KpiCard title="Utilization %" value={pct(clinic.utilization)} tone={clinic.utilization !== null && clinic.utilization >= 85 ? "success" : clinic.utilization !== null && clinic.utilization >= 70 ? "warning" : "critical"} /><KpiCard title="Revenue Estimate" value={clinic.revenueEstimate ? currency.format(clinic.revenueEstimate) : "—"} tone="success" /></section><div className="grid gap-6 xl:grid-cols-2"><Section title="Pipeline by Status"><EmptyOrList items={Object.entries(allClients.reduce<Record<string, number>>((acc, client) => ({ ...acc, [client.status]: (acc[client.status] ?? 0) + 1 }), {})).map(([status, count]) => `${status}: ${count}`)} /></Section><Section title="Notes"><p className="text-sm text-foreground">{clinic.notes}</p></Section></div><ClientListTable clients={allClients} query="" setQuery={() => undefined} sortBy="daysInStatus" setSortBy={() => undefined} compact /></div>;
}

function ClientListTable({ clients: rows, query, setQuery, sortBy, setSortBy, compact }: { clients: ClientRecord[]; query: string; setQuery: (value: string) => void; sortBy: keyof ClientRecord; setSortBy: (value: keyof ClientRecord) => void; compact?: boolean }) {
  return <Section title="Universal Client Table"><div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">{!compact && <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter clients…" className="max-w-sm" />}<Select value={String(sortBy)} onValueChange={(value) => setSortBy(value as keyof ClientRecord)}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger><SelectContent>{[["status", "Status"], ["daysInStatus", "Days in Status"], ["riskLevel", "Risk Level"], ["clinic", "Clinic"], ["deliveredHours", "Utilization %"]].map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>{rows.length === 0 ? <EmptyState title="No clients match these filters" message="There are live client records, but none match the current filter/search combination." guidance={["Clear one or more filters.", "Check that client records include clinic, state, service setting, insurance, BCBA, and RBT values."]} /> : <div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-sm"><thead className="text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{["Client Name", "Status", "State", "Clinic", "Service Setting", "BCBA", "RBT", "Insurance", "Auth Status", "Authorized Hours", "Delivered Hours", "Utilization %", "Days in Current Status", "Start Date", "Risk Level", "Notes"].map((header) => <th key={header} className="px-3 py-2 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-border/50">{rows.map((client) => <tr key={client.id} className="hover:bg-muted/30"><td className="px-3 py-3 font-medium text-foreground">{client.name}</td><td className="px-3 py-3">{client.status}</td><td className="px-3 py-3">{client.state}</td><td className="px-3 py-3">{client.clinic}</td><td className="px-3 py-3">{client.serviceSetting}</td><td className="px-3 py-3">{client.bcba}</td><td className="px-3 py-3">{client.rbt}</td><td className="px-3 py-3">{client.insurance}</td><td className="px-3 py-3">{client.authStatus}</td><td className="px-3 py-3">{client.authorizedHours}</td><td className="px-3 py-3">{client.deliveredHours}</td><td className="px-3 py-3">{client.authorizedHours ? pct(Math.round((client.deliveredHours / client.authorizedHours) * 100)) : "—"}</td><td className="px-3 py-3">{client.daysInStatus}</td><td className="px-3 py-3">{client.startDate}</td><td className="px-3 py-3"><RiskPill risk={client.riskLevel} /></td><td className="px-3 py-3">{client.notes}</td></tr>)}</tbody></table></div>}</Section>;
}

function DepartmentDashboard({ dashboardKey, live }: { dashboardKey: DashboardKey; live: ReturnType<typeof buildLiveDashboard> }) { const dashboard = dashboardDefinitions.find((item) => item.key === dashboardKey) ?? dashboardDefinitions[5]; return <Section title={dashboard.name}><div className="grid gap-4 md:grid-cols-3"><KpiCard title="Open Work" value={live.clientRecords.filter((c) => c.status !== "Active").length} tone="info" /><KpiCard title="At Risk" value={live.clientRecords.filter((c) => c.riskLevel === "High" || c.riskLevel === "Critical").length} tone="warning" /><KpiCard title="Overdue" value={live.clientRecords.filter((c) => c.daysInStatus > 14).length} tone="critical" /></div><p className="mt-4 text-sm text-muted-foreground">{dashboard.description} Leadership KPIs are hidden unless your account allows them.</p></Section>; }
function DepartmentDashboardNotice({ dashboard }: { dashboard?: { name: string; access: string; description: string } }) { if (!dashboard) return null; return <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"><p className="text-sm font-semibold text-foreground">Assigned dashboard: {dashboard.name}</p><p className="mt-1 text-sm text-muted-foreground">{dashboard.description} Leadership KPIs are hidden unless your account is marked Part of Leadership or Super Admin.</p></div>; }
function MetricSection({ title, metrics, tableHeaders, rows }: { title: string; metrics: string[]; tableHeaders: string[]; rows: string[][] }) { return <Section title={title}><div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{metrics.map((metric) => <div key={metric} className="rounded-md bg-muted/40 px-3 py-2 text-sm text-foreground">{metric}</div>)}</div>{rows.length === 0 ? <EmptyState title="No records for this section yet" message="This section is ready for live data, but no matching records exist yet." guidance={["Add or update client records related to this workflow.", "As records move through stages, this table will populate automatically."]} /> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{tableHeaders.map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y divide-border/50">{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={`${i}-${j}`} className="px-3 py-3">{cell}</td>)}</tr>)}</tbody></table></div>}</Section>; }
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"><h2 className="mb-4 text-lg font-semibold text-foreground">{title}</h2>{children}</section>; }
function KpiCard({ title, value, trend, tone }: { title: string; value: string | number; trend?: string; tone: "success" | "warning" | "critical" | "info" }) { const Icon = tone === "success" ? ArrowUp : tone === "critical" ? AlertTriangle : tone === "warning" ? ArrowDown : Users; return <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-muted-foreground">{title}</p><Icon className={cn("h-5 w-5", tone === "success" && "text-success", tone === "warning" && "text-warning", tone === "critical" && "text-destructive", tone === "info" && "text-info")} /></div><p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</p>{trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}</div>; }
function StatusPill({ label, status }: { label: string; status: HealthStatus }) { return <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-semibold", status === "Healthy" && "bg-success/10 text-success", status === "Watch" && "bg-warning/10 text-warning", status === "Critical" && "bg-destructive/10 text-destructive")}>{label}</span>; }
function RiskPill({ risk }: { risk: RiskLevel }) { return <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-semibold", risk === "Low" && "bg-success/10 text-success", risk === "Medium" && "bg-info/10 text-info", risk === "High" && "bg-warning/10 text-warning", risk === "Critical" && "bg-destructive/10 text-destructive")}>{risk}</span>; }
function SeverityPill({ severity }: { severity: "Critical" | "Watch" | "Info" | "Resolved" }) { return <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold", severity === "Critical" && "bg-destructive/10 text-destructive", severity === "Watch" && "bg-warning/10 text-warning", severity === "Info" && "bg-info/10 text-info", severity === "Resolved" && "bg-success/10 text-success")}><CheckCircle2 className="h-3 w-3" />{severity}</span>; }
function EmptyState({ title = "No data yet", message, guidance }: { title?: string; message: string; guidance?: string[] }) {
  return (
    <div className="rounded-lg border border-dashed border-border/70 bg-background p-6 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-2xl text-sm text-muted-foreground">{message}</p>
      {guidance && guidance.length > 0 && (
        <div className="mx-auto mt-4 grid max-w-3xl gap-2 text-left sm:grid-cols-2 lg:grid-cols-3">
          {guidance.map((item) => (
            <div key={item} className="rounded-md border border-border/50 bg-card px-3 py-2 text-xs text-muted-foreground">
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function EmptyOrList({ items }: { items: string[] }) { return items.length === 0 ? <EmptyState title="No insights yet" message="Insights will appear after there is enough live operational data to summarize." guidance={["Add client pipeline records first.", "Then add authorizations, staffing details, and delivered hours for richer insights."]} /> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <div key={item} className="rounded-lg border border-border/60 bg-background p-4 text-sm text-foreground shadow-sm">{item}</div>)}</div>; }
