import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  Filter,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  clients,
  clinics,
  dashboardDefinitions,
  insights,
  pipelineStages,
  redFlags,
  type ClientRecord,
  type DashboardKey,
  type HealthStatus,
  type RiskLevel,
} from "@/data/leadershipDashboard";
import { cn } from "@/lib/utils";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (value: number) => `${value}%`;

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

export default function LeadershipDashboard() {
  const { clinicId } = useParams();
  const { isAdmin, roles, partOfLeadership, dashboardAccess } = useAuth();
  const assignedDashboard = useMemo<DashboardKey>(() => {
    if (dashboardAccess && dashboardAccess !== "department") return dashboardAccess as DashboardKey;
    const roleMatch = roles.map((role) => roleDashboardMap[role]).find(Boolean);
    return roleMatch ?? "clinic";
  }, [dashboardAccess, roles]);
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardKey>(isAdmin || partOfLeadership ? "ceo" : assignedDashboard);
  const [dateRange, setDateRange] = useState("This Month");
  const [stateFilter, setStateFilter] = useState("All States");
  const [clinicFilter, setClinicFilter] = useState("All Clinics");
  const [serviceFilter, setServiceFilter] = useState("All Settings");
  const [insuranceFilter, setInsuranceFilter] = useState("All Insurance");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<keyof ClientRecord>("daysInStatus");

  const canSeeSelector = isAdmin;
  const allowedDashboards = isAdmin ? dashboardDefinitions : partOfLeadership ? dashboardDefinitions.filter((d) => d.key === "ceo") : dashboardDefinitions.filter((d) => d.key === assignedDashboard);
  const activeDashboard = allowedDashboards.some((d) => d.key === selectedDashboard) ? selectedDashboard : allowedDashboards[0]?.key ?? "clinic";
  const selectedClinic = clinicId ? clinics.find((clinic) => clinic.id === clinicId) : null;

  const filteredClients = useMemo(() => {
    const q = query.toLowerCase();
    return clients
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
  }, [clinicFilter, insuranceFilter, query, serviceFilter, sortBy, stateFilter]);

  if (selectedClinic) {
    return <ClinicDetailDashboard clinic={selectedClinic} allClients={clients.filter((client) => client.clinic === selectedClinic.clinic)} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">CEO & Leadership Dashboard</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Company-wide operational scorecard for clinics, staffing, authorizations, utilization, and client flow.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Last Updated: Today · 8:42 AM</span>
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button variant="outline" size="sm"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          </div>
        </div>

        {canSeeSelector && (
          <section className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Super Admin Dashboard Selector</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {dashboardDefinitions.map((dashboard) => (
                <button
                  key={dashboard.key}
                  onClick={() => setSelectedDashboard(dashboard.key)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    activeDashboard === dashboard.key ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background hover:bg-muted/40",
                  )}
                >
                  <p className="text-sm font-semibold text-foreground">{dashboard.name}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Access: {dashboard.access}</p>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{dashboard.description}</p>
                  <p className="mt-2 text-[11px] font-medium text-primary">{dashboard.lastUpdated}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {!isAdmin && !partOfLeadership && activeDashboard !== "ceo" && (
          <DepartmentDashboardNotice dashboard={allowedDashboards[0]} />
        )}

        {activeDashboard === "ceo" && (
          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Filter className="h-4 w-4 text-primary" />Dashboard Filters</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <Select value={dateRange} onValueChange={setDateRange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Today", "This Week", "This Month", "Last Month", "Custom Range"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
              <Select value={stateFilter} onValueChange={setStateFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["All States", "GA", "NC", "TN", "VA", "MD"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
              <Select value={clinicFilter} onValueChange={setClinicFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["All Clinics", ...clinics.map((c) => c.clinic)].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
              <Select value={serviceFilter} onValueChange={setServiceFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["All Settings", "Home", "School", "Clinic"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
              <Select value={insuranceFilter} onValueChange={setInsuranceFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["All Insurance", "Aetna", "BCBS", "Medicaid", "United"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
              <Select defaultValue="All BCBAs"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["All BCBAs", "Dana Morris", "Kim Ward", "Riley Foster"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
              <Select defaultValue="All RBTs"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["All RBTs", "Maya Chen", "Jordan Lee", "Tara Kim"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
        )}
      </header>

      {activeDashboard === "ceo" ? (
        <LeadershipScorecard filteredClients={filteredClients} query={query} setQuery={setQuery} sortBy={sortBy} setSortBy={setSortBy} />
      ) : (
        <DepartmentDashboard dashboardKey={activeDashboard} />
      )}
    </div>
  );
}

function LeadershipScorecard({ filteredClients, query, setQuery, sortBy, setSortBy }: { filteredClients: ClientRecord[]; query: string; setQuery: (value: string) => void; sortBy: keyof ClientRecord; setSortBy: (value: keyof ClientRecord) => void }) {
  const totalAuthorized = clinics.reduce((sum, clinic) => sum + clinic.authorizedHours, 0);
  const totalDelivered = clinics.reduce((sum, clinic) => sum + clinic.deliveredHours, 0);
  const utilization = Math.round((totalDelivered / totalAuthorized) * 100);

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total Active Clients" value="137" trend="+8 vs last period" tone="success" />
        <KpiCard title="Total Clients in Pipeline" value="92" trend="Sent Form → Pending Start" tone="info" />
        <KpiCard title="Authorized Hours" value={totalAuthorized.toLocaleString()} trend="Selected period" tone="info" />
        <KpiCard title="Delivered Hours" value={totalDelivered.toLocaleString()} trend="+6% vs last period" tone="success" />
        <KpiCard title="Utilization %" value={pct(utilization)} trend="Target 85%+" tone={utilization >= 85 ? "success" : utilization >= 70 ? "warning" : "critical"} />
        <KpiCard title="Staffing Needed" value="28" trend="Over threshold" tone="critical" />
        <KpiCard title="Average Days to Start" value="26.4" trend="Lead created → first service" tone="warning" />
        <KpiCard title="Revenue Estimate" value={currency.format(425280)} trend="Delivered hours estimate" tone="success" />
      </section>

      <Section title="CEO Snapshot">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {["Riverdale has 17 clients in pipeline but only 1 active.", "6 clients are stuck in intake/forms.", "Staffing demand is expected to increase based on clients nearing treatment approval.", "Utilization is below target in Tennessee and Riverdale.", "Auth delays are increasing in initial authorization."].map((item) => (
            <div key={item} className="rounded-lg border border-border/60 bg-background p-4 text-sm text-foreground shadow-sm">{item}</div>
          ))}
        </div>
      </Section>

      <Section title="Clinic Performance">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{["Clinic", "State", "Active Clients", "Pipeline Clients", "Staffing Needed", "Authorized Hours", "Delivered Hours", "Utilization %", "Avg Days to Start", "Flaked Clients", "Revenue Estimate", "Health Status"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border/50">
              {clinics.map((clinic) => (
                <tr key={clinic.id} className="hover:bg-muted/30">
                  <td className="px-3 py-3 font-medium text-primary"><Link to={`/leadership-dashboard/clinics/${clinic.id}`}>{clinic.clinic}</Link></td>
                  <td className="px-3 py-3">{clinic.state}</td>
                  <td className="px-3 py-3">{clinic.activeClients}</td>
                  <td className="px-3 py-3">{clinic.pipelineClients}</td>
                  <td className="px-3 py-3">{clinic.staffingNeeded}</td>
                  <td className="px-3 py-3">{clinic.authorizedHours}</td>
                  <td className="px-3 py-3">{clinic.deliveredHours}</td>
                  <td className="px-3 py-3"><StatusPill label={pct(clinic.utilization)} status={clinic.utilization >= 85 ? "Healthy" : clinic.utilization >= 70 ? "Watch" : "Critical"} /></td>
                  <td className="px-3 py-3">{clinic.avgDaysToStart}</td>
                  <td className="px-3 py-3">{clinic.flakedClients}</td>
                  <td className="px-3 py-3">{currency.format(clinic.revenueEstimate)}</td>
                  <td className="px-3 py-3"><StatusPill label={clinic.healthStatus} status={clinic.healthStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Section title="Pipeline Funnel">
          <div className="space-y-2">
            {pipelineStages.map((stage) => (
              <div key={stage.stage} className="grid grid-cols-[180px_1fr_120px] items-center gap-3 text-sm">
                <span className="font-medium text-foreground">{stage.stage}</span>
                <div className="h-8 overflow-hidden rounded-md bg-muted"><div className={cn("h-full rounded-md", stage.stuckTooLong ? "bg-destructive/70" : "bg-primary/70")} style={{ width: `${Math.max(8, (stage.count / 137) * 100)}%` }} /></div>
                <span className="text-xs text-muted-foreground">{stage.count} · {Math.round((stage.count / 137) * 100)}% · {stage.avgDays}d</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-foreground"><strong>Bottleneck Alert:</strong> Current bottleneck: Pending Initial Authorization and Schedule Assessment.</div>
        </Section>
        <Section title="Service Setting Performance">
          <div className="grid gap-3">
            {["Home", "School", "Clinic"].map((setting, index) => (
              <div key={setting} className="rounded-lg border border-border/60 bg-background p-4">
                <div className="flex items-center justify-between"><p className="font-semibold text-foreground">{setting}-Based Clients</p><StatusPill label={pct([72, 81, 88][index])} status={["Watch", "Watch", "Healthy"][index] as HealthStatus} /></div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground"><span>Active: {[62, 28, 47][index]}</span><span>Authorized: {[1880, 820, 1320][index]}</span><span>Delivered: {[1354, 664, 1162][index]}</span><span>Staffing Needed: {[14, 5, 9][index]}</span><span className="col-span-2">Avg Days to Start: {[29, 24, 18][index]}</span></div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <OperationalSections />
      <RedFlagsAndInsights />
      <ClientListTable clients={filteredClients} query={query} setQuery={setQuery} sortBy={sortBy} setSortBy={setSortBy} />
    </>
  );
}

function OperationalSections() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <MetricSection title="Staffing Health" metrics={["Clients Needing RBT: 24", "Clients Needing BCBA: 6", "Average Days in Staffing Needed: 17", "RBT Utilization: 78%", "BCBA Caseload Average: 11.8", "Open Staffing Gaps: 31", "Clients at Risk Due to Staffing: 9"]} tableHeaders={["Client", "Clinic/State", "Needed Role", "Days Waiting", "BCBA", "RBT", "Priority", "Notes", "Owner"]} rows={[["Azaria Daniel", "Riverdale / GA", "RBT", "18", "Dana Morris", "Needed", "Critical", "Start blocked", "Staffing"], ["Mia Bennett", "Tennessee / TN", "BCBA", "15", "Needed", "Pending", "High", "Caseload review", "Ops"]]} />
      <MetricSection title="Authorization Health" metrics={["Pending Initial Auth: 18", "Pending Treatment Auth: 12", "Auths Submitted: 31", "Auths Approved: 24", "Auths Denied: 3", "Auths Expiring Soon: 8", "Avg Days to Approval: 19"]} tableHeaders={["Client", "State", "Payor", "Auth Type", "Current Status", "Submitted Date", "Days Waiting", "Expiration Date", "Owner", "Risk Level"]} rows={[["Ares Jackson", "GA", "Aetna", "Initial", "Pending", "Apr 3", "24", "—", "Auth Team", "Critical"], ["Kennedy Hines", "GA", "BCBS", "Initial", "Pending", "Apr 8", "19", "—", "Auth Team", "High"]]} />
      <MetricSection title="Intake & Conversion" metrics={["New Leads: 34", "Sent Forms: 22", "Missing Info: 11", "VOB Sent: 16", "VOB Completed: 12", "Converted to Client: 10", "Not Qualified: 4", "Can't Reach: 7"]} tableHeaders={["Stage", "Count", "Conversion"]} rows={[["New Lead → Form Sent", "34 → 22", "65%"], ["Form Received → VOB Completed", "18 → 12", "67%"], ["Auth Started → Active", "10 → 7", "70%"]]} />
      <MetricSection title="QA & Clinical Readiness" metrics={["In QA: 8", "Treatment Plans Waiting: 6", "QA Reviews Completed: 14", "QA Reviews Overdue: 3", "Avg QA Turnaround Time: 4.8d", "PRs Needed: 5", "PRs Overdue: 2"]} tableHeaders={["Client", "BCBA", "QA Owner", "Status", "Days in QA", "Missing Items", "Due Date"]} rows={[["Levi Banks", "Riley Foster", "QA Team", "In QA", "12", "Signature", "Apr 30"], ["Sophia James", "Kim Ward", "QA Team", "Treatment Plan", "8", "Goals", "May 2"]]} />
      <MetricSection title="Finance Snapshot" metrics={["Estimated Revenue: $425K", "Delivered Billable Hours: 5,316", "Payment Plan Required: 9", "Payment Plan Received: 6", "High Deductible Cases: 13", "OON Cases: 4", "Financial Risk Clients: 11"]} tableHeaders={["Risk", "Count", "Action"]} rows={[["Payment plan missing", "3", "Finance follow-up"], ["High deductible", "13", "Review family communication"]]} />
    </div>
  );
}

function RedFlagsAndInsights() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Section title="Red Flags">
        <div className="grid gap-3">
          {redFlags.map((flag) => <div key={`${flag.type}-${flag.target}`} className="rounded-lg border border-border/60 bg-background p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-foreground">{flag.type}</p><p className="text-sm text-muted-foreground">{flag.target} · Owner: {flag.owner}</p></div><SeverityPill severity={flag.severity} /></div><p className="mt-2 text-sm text-foreground">{flag.daysOpen} days open · {flag.action}</p></div>)}
        </div>
      </Section>
      <Section title="Patterns & Insights">
        <div className="grid gap-3">
          {insights.map((item) => <div key={item.insight} className="rounded-lg border border-border/60 bg-background p-4"><p className="font-semibold text-foreground">{item.insight}</p><p className="mt-1 text-sm text-muted-foreground"><strong>Why it matters:</strong> {item.why}</p><p className="mt-1 text-sm text-foreground"><strong>Suggested action:</strong> {item.action}</p></div>)}
        </div>
      </Section>
    </div>
  );
}

function ClinicDetailDashboard({ clinic, allClients }: { clinic: (typeof clinics)[number]; allClients: ClientRecord[] }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div><Button asChild variant="outline" size="sm"><Link to="/leadership-dashboard">Back to Leadership Dashboard</Link></Button><h1 className="mt-4 text-2xl font-semibold text-foreground">{clinic.clinic} Clinic Detail Dashboard</h1><p className="text-sm text-muted-foreground">{clinic.state} · Director/Admin: {clinic.director}</p></div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><KpiCard title="Active Clients" value={clinic.activeClients} tone="success" /><KpiCard title="Pipeline Clients" value={clinic.pipelineClients} tone="info" /><KpiCard title="Staffing Needed" value={clinic.staffingNeeded} tone={clinic.staffingNeeded > 4 ? "critical" : "warning"} /><KpiCard title="Utilization %" value={pct(clinic.utilization)} tone={clinic.utilization >= 85 ? "success" : clinic.utilization >= 70 ? "warning" : "critical"} /><KpiCard title="Revenue Estimate" value={currency.format(clinic.revenueEstimate)} tone="success" /></section>
      <div className="grid gap-6 xl:grid-cols-2"><Section title="Pipeline by Status"><div className="grid gap-2">{Object.entries(allClients.reduce<Record<string, number>>((acc, client) => ({ ...acc, [client.status]: (acc[client.status] ?? 0) + 1 }), {})).map(([status, count]) => <div key={status} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"><span>{status}</span><strong>{count}</strong></div>)}</div></Section><Section title="Notes"><p className="text-sm text-foreground">{clinic.notes}</p><div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">Leadership focus: clear oldest auth and staffing blockers before adding more assessment volume.</div></Section></div>
      <MetricSection title="Staffing Gaps" metrics={[`Open gaps: ${clinic.staffingNeeded}`, "Priority cases: 2", "Average days waiting: 16"]} tableHeaders={["Client", "Needed Role", "Days Waiting", "Priority", "Owner"]} rows={allClients.filter((c) => c.rbt === "Needed" || c.status === "Staffing Needed").map((c) => [c.name, c.rbt === "Needed" ? "RBT" : "BCBA/RBT", String(c.daysInStatus), c.riskLevel, "Staffing"])} />
      <ClientListTable clients={allClients} query="" setQuery={() => undefined} sortBy="daysInStatus" setSortBy={() => undefined} compact />
    </div>
  );
}

function ClientListTable({ clients: rows, query, setQuery, sortBy, setSortBy, compact }: { clients: ClientRecord[]; query: string; setQuery: (value: string) => void; sortBy: keyof ClientRecord; setSortBy: (value: keyof ClientRecord) => void; compact?: boolean }) {
  return <Section title="Universal Client Table"><div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">{!compact && <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter clients…" className="max-w-sm" />}<Select value={String(sortBy)} onValueChange={(value) => setSortBy(value as keyof ClientRecord)}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger><SelectContent>{[["status", "Status"], ["daysInStatus", "Days in Status"], ["riskLevel", "Risk Level"], ["clinic", "Clinic"], ["deliveredHours", "Utilization %"]].map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-sm"><thead className="text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{["Client Name", "Status", "State", "Clinic", "Service Setting", "BCBA", "RBT", "Insurance", "Auth Status", "Authorized Hours", "Delivered Hours", "Utilization %", "Days in Current Status", "Start Date", "Risk Level", "Notes"].map((header) => <th key={header} className="px-3 py-2 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-border/50">{rows.map((client) => <tr key={client.id} className="hover:bg-muted/30"><td className="px-3 py-3 font-medium text-foreground">{client.name}</td><td className="px-3 py-3">{client.status}</td><td className="px-3 py-3">{client.state}</td><td className="px-3 py-3">{client.clinic}</td><td className="px-3 py-3">{client.serviceSetting}</td><td className="px-3 py-3">{client.bcba}</td><td className="px-3 py-3">{client.rbt}</td><td className="px-3 py-3">{client.insurance}</td><td className="px-3 py-3">{client.authStatus}</td><td className="px-3 py-3">{client.authorizedHours}</td><td className="px-3 py-3">{client.deliveredHours}</td><td className="px-3 py-3">{client.authorizedHours ? pct(Math.round((client.deliveredHours / client.authorizedHours) * 100)) : "—"}</td><td className="px-3 py-3">{client.daysInStatus}</td><td className="px-3 py-3">{client.startDate}</td><td className="px-3 py-3"><RiskPill risk={client.riskLevel} /></td><td className="px-3 py-3">{client.notes}</td></tr>)}</tbody></table></div></Section>;
}

function DepartmentDashboard({ dashboardKey }: { dashboardKey: DashboardKey }) {
  const dashboard = dashboardDefinitions.find((item) => item.key === dashboardKey) ?? dashboardDefinitions[5];
  return <Section title={dashboard.name}><div className="grid gap-4 md:grid-cols-3"><KpiCard title="Open Work" value="24" tone="info" /><KpiCard title="At Risk" value="6" tone="warning" /><KpiCard title="Overdue" value="3" tone="critical" /></div><p className="mt-4 text-sm text-muted-foreground">{dashboard.description} This mock department view intentionally hides leadership-only KPIs.</p></Section>;
}

function DepartmentDashboardNotice({ dashboard }: { dashboard?: { name: string; access: string; description: string } }) {
  if (!dashboard) return null;
  return <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"><p className="text-sm font-semibold text-foreground">Assigned dashboard: {dashboard.name}</p><p className="mt-1 text-sm text-muted-foreground">{dashboard.description} Leadership KPIs are hidden unless your account is marked Part of Leadership or Super Admin.</p></div>;
}

function MetricSection({ title, metrics, tableHeaders, rows }: { title: string; metrics: string[]; tableHeaders: string[]; rows: string[][] }) {
  return <Section title={title}><div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{metrics.map((metric) => <div key={metric} className="rounded-md bg-muted/40 px-3 py-2 text-sm text-foreground">{metric}</div>)}</div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{tableHeaders.map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y divide-border/50">{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={`${i}-${j}`} className="px-3 py-3">{cell}</td>)}</tr>)}</tbody></table></div></Section>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"><h2 className="mb-4 text-lg font-semibold text-foreground">{title}</h2>{children}</section>;
}

function KpiCard({ title, value, trend, tone }: { title: string; value: string | number; trend?: string; tone: "success" | "warning" | "critical" | "info" }) {
  const Icon = tone === "success" ? ArrowUp : tone === "critical" ? AlertTriangle : tone === "warning" ? ArrowDown : Users;
  return <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-muted-foreground">{title}</p><Icon className={cn("h-5 w-5", tone === "success" && "text-success", tone === "warning" && "text-warning", tone === "critical" && "text-destructive", tone === "info" && "text-info")} /></div><p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</p>{trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}</div>;
}

function StatusPill({ label, status }: { label: string; status: HealthStatus }) {
  return <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-semibold", status === "Healthy" && "bg-success/10 text-success", status === "Watch" && "bg-warning/10 text-warning", status === "Critical" && "bg-destructive/10 text-destructive")}>{label}</span>;
}

function RiskPill({ risk }: { risk: RiskLevel }) {
  return <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-semibold", risk === "Low" && "bg-success/10 text-success", risk === "Medium" && "bg-info/10 text-info", risk === "High" && "bg-warning/10 text-warning", risk === "Critical" && "bg-destructive/10 text-destructive")}>{risk}</span>;
}

function SeverityPill({ severity }: { severity: "Critical" | "Watch" | "Info" | "Resolved" }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold", severity === "Critical" && "bg-destructive/10 text-destructive", severity === "Watch" && "bg-warning/10 text-warning", severity === "Info" && "bg-info/10 text-info", severity === "Resolved" && "bg-success/10 text-success")}><CheckCircle2 className="h-3 w-3" />{severity}</span>;
}
