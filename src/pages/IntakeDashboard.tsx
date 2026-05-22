import { useMemo, useState } from "react";
import {
  AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, Clock, Download, Eye, FileText,
  Mail, Phone, RefreshCw, Search, Send, ShieldCheck, UserPlus, Users, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useLeads } from "@/contexts/LeadsContext";
import { getInlineAlert, INTAKE_COORDINATORS, Lead, LeadSource, LeadStatus, statusVariant } from "@/data/leads";
import { cn } from "@/lib/utils";

type KpiFilter = "all" | "new" | "not-contacted" | "speed" | "form-sent" | "forms-completed" | "missing" | "vob-sent" | "vob-completed";
type QueueKey = "urgent" | "today" | "problem";
type Health = "green" | "yellow" | "red";

const ALL = "All";
const dashboardStages: LeadStatus[] = ["New Lead", "In Contact", "Sent Form", "Missing Information", "Form Received", "Sent to VOB", "VOB Completed", "Can't Reach", "Can Not Submit Auth", "Non-Qualified", "Needs DX"];
const sourceOrder: LeadSource[] = ["Website", "Phone", "Facebook", "Referral", "Ads", "Organic"];
const funnelSteps: LeadStatus[] = ["New Lead", "In Contact", "Sent Form", "Form Received", "Sent to VOB", "VOB Completed"];

const hoursBetween = (a: string, b: string) => Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 36e5);
const pct = (value: number, total: number) => (total ? Math.round((value / total) * 100) : 0);
const avg = (values: number[]) => (values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : 0);
const shortDate = (date?: string | null) => date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";

function leadAlerts(lead: Lead, allLeads: Lead[]) {
  const alerts: { label: string; severity: "red" | "yellow" }[] = [];
  const ageHours = hoursBetween(lead.createdAt, lead.lastContacted ?? new Date().toISOString());
  const duplicates = allLeads.filter((item) => item.id !== lead.id && (item.phone === lead.phone || item.email === lead.email));
  if (!lead.owner) alerts.push({ label: "No owner", severity: "red" });
  if (!lead.lastContacted && ageHours >= 24) alerts.push({ label: "No contact in 24h", severity: "red" });
  else if (!lead.lastContacted && ageHours >= 1) alerts.push({ label: "No contact in 1h", severity: "yellow" });
  if (lead.status === "Sent Form" && lead.formStatus === "Sent" && lead.daysInStage >= 2) alerts.push({ label: "Form not viewed 48h", severity: "yellow" });
  if (lead.status === "Sent Form" && lead.formStatus === "Viewed" && lead.daysInStage >= 3) alerts.push({ label: "Viewed not completed 72h", severity: "red" });
  if (lead.status === "Form Received" && lead.formReviewStatus === "Pending") alerts.push({ label: "Needs same-day review", severity: "yellow" });
  if (lead.status === "Missing Information" && lead.daysInStage > 2) alerts.push({ label: "Missing info >2d", severity: "red" });
  if (lead.status === "Sent to VOB" && lead.vobStatus === "Sent") alerts.push({ label: "VOB not received", severity: lead.daysInStage >= 3 ? "red" : "yellow" });
  if (lead.vobStatus === "Received" && lead.financialStatus === "Pending Review") alerts.push({ label: "VOB needs decision", severity: "yellow" });
  if (duplicates.length) alerts.push({ label: "Duplicate lead", severity: "yellow" });
  return alerts;
}

function healthFor(leads: Lead[]): Health {
  if (leads.some((lead) => lead.daysInStage >= 5 || !lead.owner)) return "red";
  if (leads.some((lead) => lead.daysInStage >= 2)) return "yellow";
  return "green";
}

function HealthDot({ health }: { health: Health }) {
  return <span className={cn("h-2.5 w-2.5 rounded-full", health === "green" && "bg-success", health === "yellow" && "bg-warning", health === "red" && "bg-destructive")} />;
}

export default function IntakeDashboard() {
  const { leads, updateLead, assignOwner } = useLeads();
  const [dateRange, setDateRange] = useState("This Month");
  const [stateFilter, setStateFilter] = useState(ALL);
  const [ownerFilter, setOwnerFilter] = useState(ALL);
  const [sourceFilter, setSourceFilter] = useState(ALL);
  const [activeKpi, setActiveKpi] = useState<KpiFilter>("all");
  const [queue, setQueue] = useState<QueueKey>("urgent");
  const [query, setQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const states = useMemo(() => [ALL, ...Array.from(new Set(leads.map((lead) => lead.state))).sort()], [leads]);
  const owners = useMemo(() => [ALL, "Unassigned", ...Array.from(new Set(leads.map((lead) => lead.owner).filter(Boolean))).sort()], [leads]);
  const sources = useMemo(() => [ALL, ...Array.from(new Set(leads.map((lead) => lead.source))).sort()], [leads]);

  const filteredLeads = useMemo(() => {
    const now = new Date();
    const q = query.toLowerCase();
    return leads
      .filter((lead) => stateFilter === ALL || lead.state === stateFilter)
      .filter((lead) => ownerFilter === ALL || (ownerFilter === "Unassigned" ? !lead.owner : lead.owner === ownerFilter))
      .filter((lead) => sourceFilter === ALL || lead.source === sourceFilter)
      .filter((lead) => {
        const created = new Date(lead.createdAt);
        if (dateRange === "Today") return created.toDateString() === now.toDateString();
        if (dateRange === "This Week") return hoursBetween(lead.createdAt, now.toISOString()) <= 24 * 7;
        return true;
      })
      .filter((lead) => {
        if (activeKpi === "new") return lead.status === "New Lead";
        if (activeKpi === "not-contacted") return !lead.lastContacted;
        if (activeKpi === "speed") return !!lead.lastContacted;
        if (activeKpi === "form-sent") return lead.formStatus === "Sent" || lead.formStatus === "Viewed";
        if (activeKpi === "forms-completed") return lead.formStatus === "Completed" || lead.formStatus === "Complete";
        if (activeKpi === "missing") return lead.status === "Missing Information" || lead.formReviewStatus === "Missing Information";
        if (activeKpi === "vob-sent") return lead.status === "Sent to VOB";
        if (activeKpi === "vob-completed") return lead.status === "VOB Completed";
        return true;
      })
      .filter((lead) => !q || [lead.parentName, lead.childName, lead.email, lead.phone, lead.status, lead.owner, lead.source].some((field) => field.toLowerCase().includes(q)));
  }, [activeKpi, dateRange, leads, ownerFilter, query, sourceFilter, stateFilter]);

  const contacted = filteredLeads.filter((lead) => lead.lastContacted);
  const avgFirstContact = avg(contacted.map((lead) => hoursBetween(lead.createdAt, lead.lastContacted!)));
  const kpis = [
    { key: "new" as KpiFilter, label: "New Leads", value: filteredLeads.filter((l) => l.status === "New Lead").length, subtext: "Fresh inquiries in scope", health: "green" as Health },
    { key: "not-contacted" as KpiFilter, label: "Not Contacted", value: filteredLeads.filter((l) => !l.lastContacted).length, subtext: "Needs immediate outreach", health: filteredLeads.some((l) => !l.lastContacted) ? "red" : "green" as Health },
    { key: "speed" as KpiFilter, label: "First Contact Speed", value: `${avgFirstContact}h`, subtext: "Avg create-to-contact", health: avgFirstContact <= 2 ? "green" : avgFirstContact <= 12 ? "yellow" : "red" as Health },
    { key: "form-sent" as KpiFilter, label: "Form Sent", value: filteredLeads.filter((l) => l.formStatus === "Sent" || l.formStatus === "Viewed").length, subtext: "Packets awaiting family", health: "yellow" as Health },
    { key: "forms-completed" as KpiFilter, label: "Forms Completed", value: filteredLeads.filter((l) => l.formStatus === "Completed" || l.formStatus === "Complete").length, subtext: "Ready for review/VOB", health: "green" as Health },
    { key: "missing" as KpiFilter, label: "Missing Information", value: filteredLeads.filter((l) => l.status === "Missing Information" || l.formReviewStatus === "Missing Information").length, subtext: "Blocking progress", health: "red" as Health },
    { key: "vob-sent" as KpiFilter, label: "Sent to VOB", value: filteredLeads.filter((l) => l.status === "Sent to VOB").length, subtext: "Awaiting response", health: "yellow" as Health },
    { key: "vob-completed" as KpiFilter, label: "VOB Completed", value: filteredLeads.filter((l) => l.status === "VOB Completed").length, subtext: "Ready for client handoff", health: "green" as Health },
  ];

  const actionRows = useMemo(() => {
    const withAlerts = filteredLeads.map((lead) => ({ lead, alerts: leadAlerts(lead, leads) }));
    return {
      urgent: withAlerts.filter((row) => row.alerts.some((alert) => alert.severity === "red") || !row.lead.lastContacted).map((row) => row.lead),
      today: filteredLeads.filter((lead) => lead.nextTaskDue && lead.nextTaskDue <= "2025-04-15" && !["VOB Completed", "Non-Qualified", "Non-qualified Lead"].includes(lead.status)),
      problem: filteredLeads.filter((lead) => ["Missing Information", "Can't Reach", "Can Not Submit Auth", "Sent Packet - Can't Reach", "Non-Qualified", "Needs DX"].includes(lead.status)),
    };
  }, [filteredLeads, leads]);

  const queueLeads = actionRows[queue].slice(0, 8);
  const total = filteredLeads.length;

  const stageHealth = dashboardStages.map((stage) => {
    const rows = filteredLeads.filter((lead) => lead.status === stage || (stage === "Non-Qualified" && lead.status === "Non-qualified Lead"));
    return { stage, rows, count: rows.length, oldest: rows.length ? Math.max(...rows.map((lead) => lead.daysInStage)) : 0, avgDays: avg(rows.map((lead) => lead.daysInStage)), health: rows.length ? healthFor(rows) : "green" as Health };
  });

  const teamRows = ["Unassigned", ...INTAKE_COORDINATORS].map((owner) => {
    const rows = filteredLeads.filter((lead) => owner === "Unassigned" ? !lead.owner : lead.owner === owner);
    return {
      owner,
      assigned: rows.length,
      speed: avg(rows.filter((lead) => lead.lastContacted).map((lead) => hoursBetween(lead.createdAt, lead.lastContacted!))),
      sent: rows.filter((lead) => lead.formStatus === "Sent" || lead.formStatus === "Viewed" || lead.formStatus === "Completed" || lead.formStatus === "Complete").length,
      completed: rows.filter((lead) => lead.formStatus === "Completed" || lead.formStatus === "Complete").length,
      resolved: rows.filter((lead) => lead.formReviewStatus === "Complete").length,
      vobs: rows.filter((lead) => lead.status === "Sent to VOB" || lead.status === "VOB Completed").length,
      conversion: pct(rows.filter((lead) => lead.status === "VOB Completed").length, rows.length),
      openTasks: rows.reduce((sum, lead) => sum + lead.tasks.filter((task) => !task.completed).length, 0),
      overdue: rows.reduce((sum, lead) => sum + lead.tasks.filter((task) => !task.completed && task.dueDate && task.dueDate <= "2025-04-15").length, 0),
    };
  }).filter((row) => row.assigned > 0 || row.owner !== "Unassigned");

  const sourceRows = sourceOrder.map((source) => {
    const rows = filteredLeads.filter((lead) => lead.source === source);
    return {
      source,
      count: rows.length,
      contact: pct(rows.filter((lead) => lead.lastContacted).length, rows.length),
      form: pct(rows.filter((lead) => lead.formStatus === "Completed" || lead.formStatus === "Complete").length, rows.length),
      vob: pct(rows.filter((lead) => lead.status === "VOB Completed" || lead.status === "Sent to VOB").length, rows.length),
      client: pct(rows.filter((lead) => lead.status === "VOB Completed").length, rows.length),
    };
  });

  const quickAction = (lead: Lead, action: string) => {
    if (action === "Call" || action === "Email" || action === "Mark Contacted") {
      updateLead(lead.id, { lastContacted: new Date().toISOString(), status: lead.status === "New Lead" ? "In Contact" : lead.status, nextAction: action === "Mark Contacted" ? "Send intake form" : lead.nextAction });
    }
    if (action === "Send Form") updateLead(lead.id, { formStatus: "Sent", consentStatus: lead.consentStatus === "Not Sent" ? "Sent" : lead.consentStatus });
    if (action === "Assign Owner") assignOwner([lead.id], lead.owner === "Maya P." ? "Sarah M." : "Maya P.");
    if (action === "Open Lead") setSelectedLead(lead);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Intake Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Real-time lead flow, contact speed, form progress, and VOB readiness.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button size="sm" onClick={() => setActiveKpi("all")}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          </div>
        </div>

        <div className="sticky top-0 z-20 rounded-xl border border-border/60 bg-card/95 p-3 shadow-sm backdrop-blur">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1.5fr]">
            <Select value={dateRange} onValueChange={setDateRange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Today", "This Week", "This Month", "All Time"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            <Select value={stateFilter} onValueChange={setStateFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{states.map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All States" : item}</SelectItem>)}</SelectContent></Select>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{owners.map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All Intake Owners" : item}</SelectItem>)}</SelectContent></Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{sources.map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All Lead Sources" : item}</SelectItem>)}</SelectContent></Select>
            <div className="relative"><Search className="absolute z-10 left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search leads, owners, phones..." className="pl-9" /></div>
          </div>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        {kpis.map((kpi) => (
          <button key={kpi.key} onClick={() => setActiveKpi(activeKpi === kpi.key ? "all" : kpi.key)} className={cn("rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md", activeKpi === kpi.key ? "border-primary/50 ring-2 ring-primary/15" : "border-border/60")}> 
            <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">{kpi.label}</span><HealthDot health={kpi.health} /></div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{kpi.value}</div>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.subtext}</p>
          </button>
        ))}
      </section>

      <section className="grid gap-5 2xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-xl border border-border/60 bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4">
            <div><h2 className="text-base font-semibold text-foreground">Intake Action Queue</h2><p className="text-xs text-muted-foreground">Prioritized work for intake staff and leads at risk.</p></div>
            <div className="flex rounded-lg bg-muted p-1">
              {([{ key: "urgent", label: "Urgent Now" }, { key: "today", label: "Follow-Up Today" }, { key: "problem", label: "Problem Leads" }] as const).map((item) => <button key={item.key} onClick={() => setQueue(item.key)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", queue === item.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{item.label}</button>)}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr>{["Parent / Child", "State", "Source", "Stage", "Owner", "Age", "Next Action", "Quick Action"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr></thead>
              <tbody>{queueLeads.map((lead) => <tr key={lead.id} className="border-t border-border/50 hover:bg-muted/25"><td className="px-4 py-3"><button onClick={() => setSelectedLead(lead)} className="text-left"><span className="block font-medium text-foreground">{lead.parentName}</span><span className="text-xs text-muted-foreground">{lead.childName}</span></button></td><td className="px-4 py-3"><StatusBadge status={lead.state} variant="muted" /></td><td className="px-4 py-3 text-xs text-muted-foreground">{lead.source}</td><td className="px-4 py-3"><StatusBadge status={lead.status} variant={statusVariant(lead.status)} /></td><td className="px-4 py-3 text-xs text-muted-foreground">{lead.owner || "Unassigned"}</td><td className="px-4 py-3 text-xs font-medium text-foreground">{lead.daysInStage}d</td><td className="max-w-[220px] truncate px-4 py-3 text-xs text-muted-foreground">{lead.nextAction}</td><td className="px-4 py-3"><div className="flex gap-1"><Button variant="outline" size="sm" onClick={() => quickAction(lead, lead.formStatus === "Not Sent" ? "Send Form" : "Open Lead")}>{lead.formStatus === "Not Sent" ? <Send className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}{lead.formStatus === "Not Sent" ? "Send Form" : "Open"}</Button><Button variant="ghost" size="sm" onClick={() => quickAction(lead, "Call")}><Phone className="h-3.5 w-3.5" /></Button></div></td></tr>)}</tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-semibold text-foreground">Intake Funnel</h2><p className="text-xs text-muted-foreground">Flow from inquiry to client readiness.</p></div><Zap className="h-4 w-4 text-primary" /></div>
          <div className="space-y-3">
            {funnelSteps.map((stage, index) => {
              const count = filteredLeads.filter((lead) => lead.status === stage).length;
              const previous = index === 0 ? total : filteredLeads.filter((lead) => lead.status === funnelSteps[index - 1]).length;
              const rows = filteredLeads.filter((lead) => lead.status === stage);
              return <div key={stage} className="rounded-lg border border-border/60 bg-background p-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span><span className="text-sm font-medium text-foreground">{stage}</span></div><span className="text-lg font-semibold text-foreground">{count}</span></div><div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground"><span>Conv {pct(count, total)}%</span><span>Avg {avg(rows.map((lead) => lead.daysInStage))}d</span><span>Drop {Math.max(0, 100 - pct(count, previous))}%</span></div></div>;
            })}
            <div className="rounded-lg border border-success/30 bg-success/5 p-3"><div className="flex items-center justify-between"><span className="text-sm font-medium text-foreground">Ready for Client</span><span className="text-lg font-semibold text-success">{filteredLeads.filter((lead) => lead.status === "VOB Completed").length}</span></div></div>
          </div>
        </div>
      </section>

      <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-base font-semibold text-foreground">Pipeline Health</h2><span className="text-xs text-muted-foreground">Oldest and average days by stage</span></div><div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6 2xl:grid-cols-11">{stageHealth.map((item) => <button key={item.stage} onClick={() => setActiveKpi("all")} className="rounded-xl border border-border/60 bg-card p-3 text-left shadow-sm"><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-foreground">{item.stage}</span><HealthDot health={item.health} /></div><div className="mt-2 text-xl font-semibold text-foreground">{item.count}</div><div className="mt-2 space-y-1 text-[11px] text-muted-foreground"><p>Oldest {item.oldest}d</p><p>Avg {item.avgDays}d</p></div></button>)}</div></section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-xl border border-border/60 bg-card shadow-sm"><div className="border-b border-border/60 p-4"><h2 className="text-base font-semibold text-foreground">Intake Owner Performance</h2></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr>{["Team Member", "Assigned", "Avg First Contact", "Forms Sent", "Forms Completed", "Missing Resolved", "VOBs Sent", "Conversion", "Open Tasks", "Overdue"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr></thead><tbody>{teamRows.map((row) => <tr key={row.owner} className="border-t border-border/50"><td className="px-4 py-3 font-medium text-foreground">{row.owner}</td><td className="px-4 py-3">{row.assigned}</td><td className="px-4 py-3">{row.speed}h</td><td className="px-4 py-3">{row.sent}</td><td className="px-4 py-3">{row.completed}</td><td className="px-4 py-3">{row.resolved}</td><td className="px-4 py-3">{row.vobs}</td><td className="px-4 py-3">{row.conversion}%</td><td className="px-4 py-3">{row.openTasks}</td><td className={cn("px-4 py-3 font-medium", row.overdue ? "text-destructive" : "text-muted-foreground")}>{row.overdue}</td></tr>)}</tbody></table></div></div>
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"><h2 className="text-base font-semibold text-foreground">Lead Source Performance</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-1">{sourceRows.map((row) => <div key={row.source} className="rounded-lg border border-border/60 bg-background p-3"><div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium text-foreground">{row.source}</span><span className="text-lg font-semibold text-foreground">{row.count}</span></div><div className="grid grid-cols-4 gap-2 text-[11px] text-muted-foreground"><span>Contact {row.contact}%</span><span>Forms {row.form}%</span><span>VOB {row.vob}%</span><span>Client {row.client}%</span></div></div>)}</div></div>
      </section>

      <section className="rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4"><div><h2 className="text-base font-semibold text-foreground">Lead Worklist</h2><p className="text-xs text-muted-foreground">{filteredLeads.length} leads match the current dashboard filters.</p></div>{activeKpi !== "all" && <Button variant="outline" size="sm" onClick={() => setActiveKpi("all")}>Clear KPI filter</Button>}</div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="sticky top-0 bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr>{["Parent / Child", "State", "Source", "Stage", "Assigned Intake", "Phone", "Email", "Form", "Consent", "VOB", "Days", "Last Contact", "Next Action", "Alerts"].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 text-left font-medium">{h}</th>)}</tr></thead><tbody>{filteredLeads.map((lead) => { const alerts = leadAlerts(lead, leads); const inline = getInlineAlert(lead); return <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="cursor-pointer border-t border-border/50 hover:bg-muted/25"><td className="px-4 py-3"><span className="block font-medium text-foreground">{lead.parentName}</span><span className="text-xs text-muted-foreground">{lead.childName}</span></td><td className="px-4 py-3"><StatusBadge status={lead.state} variant="muted" /></td><td className="px-4 py-3 text-xs text-muted-foreground">{lead.source}</td><td className="px-4 py-3"><StatusBadge status={lead.status} variant={statusVariant(lead.status)} /></td><td className="px-4 py-3 text-xs text-muted-foreground">{lead.owner || "Unassigned"}</td><td className="px-4 py-3 text-xs text-muted-foreground">{lead.phone}</td><td className="px-4 py-3 text-xs text-muted-foreground">{lead.email}</td><td className="px-4 py-3"><StatusBadge status={lead.formStatus} variant={lead.formStatus === "Completed" || lead.formStatus === "Complete" ? "success" : lead.formStatus === "Viewed" || lead.formStatus === "Sent" ? "warning" : "muted"} /></td><td className="px-4 py-3"><StatusBadge status={lead.consentStatus} variant={lead.consentStatus === "Completed" || lead.consentStatus === "Complete" ? "success" : lead.consentStatus === "Sent" ? "warning" : "muted"} /></td><td className="px-4 py-3"><StatusBadge status={lead.vobStatus} variant={lead.vobStatus === "Approved" || lead.vobStatus === "Completed" ? "success" : lead.vobStatus === "Issue" ? "destructive" : lead.vobStatus === "Sent" || lead.vobStatus === "Received" ? "warning" : "muted"} /></td><td className="px-4 py-3 text-xs font-medium text-foreground">{lead.daysInStage}d</td><td className="px-4 py-3 text-xs text-muted-foreground">{shortDate(lead.lastContacted)}</td><td className="max-w-[220px] truncate px-4 py-3 text-xs text-muted-foreground">{lead.nextAction}</td><td className="px-4 py-3">{alerts.length ? <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive"><AlertCircle className="h-3.5 w-3.5" />{alerts.length}</span> : inline ? <AlertTriangle className="h-3.5 w-3.5 text-warning" /> : <CheckCircle2 className="h-3.5 w-3.5 text-success" />}</td></tr>; })}</tbody></table></div>
      </section>

      <LeadDetailSheet lead={selectedLead ? leads.find((lead) => lead.id === selectedLead.id) ?? selectedLead : null} allLeads={leads} open={!!selectedLead} onClose={() => setSelectedLead(null)} onAction={quickAction} />
    </div>
  );
}

function LeadDetailSheet({ lead, allLeads, open, onClose, onAction }: { lead: Lead | null; allLeads: Lead[]; open: boolean; onClose: () => void; onAction: (lead: Lead, action: string) => void }) {
  if (!lead) return null;
  const alerts = leadAlerts(lead, allLeads);
  const completedTasks = lead.tasks.filter((task) => task.completed);
  const openTasks = lead.tasks.filter((task) => !task.completed);
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="w-[560px] overflow-y-auto p-0 sm:max-w-[560px]">
        <div className="p-6 pb-4"><SheetHeader><SheetTitle className="text-xl">{lead.parentName} / {lead.childName}</SheetTitle><SheetDescription>{lead.state} · {lead.source} · {lead.owner || "Unassigned"}</SheetDescription></SheetHeader><div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={lead.status} variant={statusVariant(lead.status)} /><StatusBadge status={lead.priority} variant={lead.priority === "Hot" ? "destructive" : lead.priority === "Warm" ? "warning" : "muted"} />{alerts.map((alert) => <StatusBadge key={alert.label} status={alert.label} variant={alert.severity === "red" ? "destructive" : "warning"} />)}</div><div className="mt-4 grid grid-cols-3 gap-2">{["Call", "Email", "Send Form", "Mark Contacted", "Assign Owner", "Open Lead"].map((action) => <Button key={action} variant="outline" size="sm" className="h-auto flex-col gap-1 py-2 text-[10px]" onClick={() => onAction(lead, action)}>{action === "Call" ? <Phone className="h-3.5 w-3.5" /> : action === "Email" ? <Mail className="h-3.5 w-3.5" /> : action === "Send Form" ? <Send className="h-3.5 w-3.5" /> : action === "Assign Owner" ? <UserPlus className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}{action}</Button>)}</div></div>
        <Separator />
        <Tabs defaultValue="overview" className="p-4"><TabsList className="grid h-auto w-full grid-cols-4 gap-1 xl:grid-cols-7"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="contact">Contact</TabsTrigger><TabsTrigger value="forms">Forms</TabsTrigger><TabsTrigger value="vob">VOB</TabsTrigger><TabsTrigger value="tasks">Tasks</TabsTrigger><TabsTrigger value="docs">Docs</TabsTrigger><TabsTrigger value="timeline">Timeline</TabsTrigger></TabsList>
          <TabsContent value="overview" className="space-y-3 pt-3"><DetailGrid rows={[["Current status", lead.status], ["Next action", lead.nextAction], ["Days in stage", `${lead.daysInStage} days`], ["Blockers", alerts.map((a) => a.label).join(", ") || "None"]]} /></TabsContent>
          <TabsContent value="contact" className="space-y-3 pt-3"><DetailGrid rows={[["Phone", lead.phone], ["Email", lead.email], ["Last contact", shortDate(lead.lastContacted)], ["Owner", lead.owner || "Unassigned"]]} /><Timeline items={lead.communications.map((c) => ({ id: c.id, title: c.subject || c.type.toUpperCase(), text: c.preview, timestamp: c.timestamp, user: c.user }))} /></TabsContent>
          <TabsContent value="forms" className="space-y-3 pt-3"><DetailGrid rows={[["Initial form", lead.formStatus], ["Consent", lead.consentStatus], ["Form link", lead.initialFormLink || "—"], ["Review", lead.formReviewStatus]]} /><div className="flex gap-2"><Button size="sm" onClick={() => onAction(lead, "Send Form")}>Send/resend packet</Button><Button variant="outline" size="sm">Copy form link</Button></div></TabsContent>
          <TabsContent value="vob" className="space-y-3 pt-3"><DetailGrid rows={[["Insurance", lead.insurance], ["Insurance type", lead.insuranceType], ["VOB status", lead.vobStatus], ["VOB file", lead.vobFile?.name || "Not uploaded"], ["Payment plan", lead.paymentPlanNeeded ? lead.paymentPlanStatus : "Not required"]]} /></TabsContent>
          <TabsContent value="tasks" className="space-y-4 pt-3"><TaskList title="Open tasks" tasks={openTasks} /><TaskList title="Completed tasks" tasks={completedTasks} /></TabsContent>
          <TabsContent value="docs" className="space-y-2 pt-3">{lead.documents.length ? lead.documents.map((doc) => <div key={`${doc.name}-${doc.type}`} className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-3 text-sm"><span className="flex items-center gap-2 text-foreground"><FileText className="h-4 w-4 text-primary" />{doc.name}</span><span className="text-xs text-muted-foreground">{doc.type} · {shortDate(doc.uploadedAt)}</span></div>) : <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>}</TabsContent>
          <TabsContent value="timeline" className="pt-3"><Timeline items={lead.timeline.map((event) => ({ id: event.id, title: event.description, text: event.type, timestamp: event.timestamp, user: event.user }))} /></TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function DetailGrid({ rows }: { rows: [string, string][] }) {
  return <div className="grid gap-3 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="rounded-lg border border-border/60 bg-background p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p></div>)}</div>;
}

function TaskList({ title, tasks }: { title: string; tasks: Lead["tasks"] }) {
  return <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4><div className="space-y-2">{tasks.length ? tasks.map((task) => <div key={task.id} className="rounded-lg border border-border/60 bg-background p-3 text-sm"><div className="flex items-center justify-between gap-3"><span className={task.completed ? "text-muted-foreground line-through" : "text-foreground"}>{task.title}</span><span className="text-xs text-muted-foreground">{task.dueDate || "No due date"}</span></div><p className="mt-1 text-xs text-muted-foreground">Owner: {task.owner || "Unassigned"}</p></div>) : <p className="text-sm text-muted-foreground">None</p>}</div></div>;
}

function Timeline({ items }: { items: { id: string; title: string; text: string; timestamp: string; user?: string }[] }) {
  return <div className="space-y-3">{items.map((item) => <div key={item.id} className="flex gap-3"><span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10"><Clock className="h-3.5 w-3.5 text-primary" /></span><div><p className="text-sm font-medium text-foreground">{item.title}</p><p className="text-xs text-muted-foreground">{item.text}</p><p className="mt-1 text-[11px] text-muted-foreground">{shortDate(item.timestamp)}{item.user ? ` · ${item.user}` : ""}</p></div></div>)}</div>;
}
