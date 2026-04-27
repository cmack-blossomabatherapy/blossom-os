import { useMemo, useState } from "react";
import {
  AlertTriangle, ArrowRight, BarChart3, CheckCircle2, Clock, CreditCard, DollarSign, Download,
  FileWarning, Filter, LineChart, ListChecks, Receipt, RefreshCw, Search, ShieldCheck, TrendingUp, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type StateCode = "GA" | "NC" | "TN" | "VA" | "MD";
type ClientType = "Clinic" | "Home" | "Hybrid" | "School";
type Network = "INN" | "OON";
type FinancialStatus = "Approved" | "Payment Plan" | "Review Needed" | "Blocked" | "At Risk";
type BillingStatus = "Ready" | "Submitted" | "Pending" | "Issue" | "Resolved";
type AuthStatus = "Lead" | "Financial" | "Client" | "Auth" | "Active" | "Revenue";
type PaymentPlanStatus = "None" | "Pending" | "Active" | "Completed";
type KpiKey = "expected" | "collected" | "risk" | "plans" | "avg" | "blocked" | "time" | "payroll";

type Task = { title: string; owner: string; due: string; priority: "Routine" | "Elevated" | "High" | "Critical" };
type FinanceClient = {
  id: string; client: string; guardian: string; state: StateCode; clinic: string; clientType: ClientType; payor: string; network: Network;
  deductible: number; coinsurance: number; expectedRevenue: number; collectedRevenue: number; blockedRevenue: number; payrollCost: number;
  financialStatus: FinancialStatus; billingStatus: BillingStatus; authStatus: AuthStatus; paymentPlan: PaymentPlanStatus; paymentPlanAmount: number;
  profitabilityScore: number; approvalRate: number; denialRate: number; avgApprovalDays: number; daysToRevenue: number; reauthDays: number;
  claimsSubmitted: number; claimsPending: number; claimsIssues: number; claimsResolved: number; nextAction: string; riskReason: string;
  tasks: Task[]; timeline: string[];
};

const ALL = "All";
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (value: number) => `${Math.round(value)}%`;
const sum = (items: FinanceClient[], get: (item: FinanceClient) => number) => items.reduce((total, item) => total + get(item), 0);
const avg = (values: number[]) => values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : 0;

const financeClients: FinanceClient[] = [
  { id: "FIN-1001", client: "Emma Thompson", guardian: "Janelle Thompson", state: "GA", clinic: "Peachtree Corners", clientType: "Clinic", payor: "Aetna", network: "INN", deductible: 750, coinsurance: 10, expectedRevenue: 18400, collectedRevenue: 13200, blockedRevenue: 0, payrollCost: 7200, financialStatus: "Approved", billingStatus: "Submitted", authStatus: "Revenue", paymentPlan: "None", paymentPlanAmount: 0, profitabilityScore: 88, approvalRate: 94, denialRate: 3, avgApprovalDays: 8, daysToRevenue: 21, reauthDays: 74, claimsSubmitted: 18, claimsPending: 4, claimsIssues: 0, claimsResolved: 14, nextAction: "Monitor weekly collections", riskReason: "Healthy revenue flow", tasks: [{ title: "Review April EOB", owner: "Mina Santos", due: "Apr 29", priority: "Routine" }], timeline: ["Benefits verified", "Auth approved", "Claims submitted", "Revenue collected"] },
  { id: "FIN-1002", client: "Mason Lee", guardian: "Angela Lee", state: "NC", clinic: "Charlotte Midtown", clientType: "Home", payor: "BCBS NC", network: "INN", deductible: 1500, coinsurance: 20, expectedRevenue: 12600, collectedRevenue: 4200, blockedRevenue: 1800, payrollCost: 6100, financialStatus: "Payment Plan", billingStatus: "Pending", authStatus: "Active", paymentPlan: "Active", paymentPlanAmount: 220, profitabilityScore: 71, approvalRate: 88, denialRate: 7, avgApprovalDays: 11, daysToRevenue: 34, reauthDays: 42, claimsSubmitted: 9, claimsPending: 6, claimsIssues: 1, claimsResolved: 2, nextAction: "Confirm May payment draft", riskReason: "Client responsibility requires active plan", tasks: [{ title: "Confirm payment plan draft", owner: "Theo Banks", due: "Today", priority: "High" }], timeline: ["VOB completed", "Payment plan signed", "First claim pending", "Draft scheduled"] },
  { id: "FIN-1003", client: "Ava Brooks", guardian: "Michael Brooks", state: "TN", clinic: "Nashville East", clientType: "Hybrid", payor: "United Healthcare", network: "OON", deductible: 3000, coinsurance: 30, expectedRevenue: 22100, collectedRevenue: 3800, blockedRevenue: 9600, payrollCost: 9800, financialStatus: "At Risk", billingStatus: "Issue", authStatus: "Auth", paymentPlan: "Pending", paymentPlanAmount: 340, profitabilityScore: 46, approvalRate: 74, denialRate: 18, avgApprovalDays: 19, daysToRevenue: 48, reauthDays: 18, claimsSubmitted: 7, claimsPending: 3, claimsIssues: 3, claimsResolved: 1, nextAction: "Escalate OON benefit exception", riskReason: "OON deductible and reauth expiration risk", tasks: [{ title: "Escalate OON exception", owner: "Mina Santos", due: "Today", priority: "Critical" }], timeline: ["OON benefits flagged", "Single case agreement requested", "Claim issue opened", "Reauth due soon"] },
  { id: "FIN-1004", client: "Noah Rivera", guardian: "Camila Rivera", state: "VA", clinic: "Richmond West", clientType: "Clinic", payor: "Cigna", network: "INN", deductible: 500, coinsurance: 15, expectedRevenue: 9800, collectedRevenue: 7600, blockedRevenue: 0, payrollCost: 4300, financialStatus: "Approved", billingStatus: "Resolved", authStatus: "Revenue", paymentPlan: "Completed", paymentPlanAmount: 0, profitabilityScore: 91, approvalRate: 92, denialRate: 4, avgApprovalDays: 9, daysToRevenue: 18, reauthDays: 96, claimsSubmitted: 11, claimsPending: 1, claimsIssues: 0, claimsResolved: 10, nextAction: "Close resolved claim batch", riskReason: "Resolved claim adjustment", tasks: [{ title: "Archive resolved claim note", owner: "Theo Banks", due: "Apr 30", priority: "Routine" }], timeline: ["Auth approved", "Claims corrected", "Payment received", "Plan completed"] },
  { id: "FIN-1005", client: "Sophia Grant", guardian: "Erin Grant", state: "MD", clinic: "Bethesda North", clientType: "Home", payor: "Kaiser", network: "INN", deductible: 1200, coinsurance: 10, expectedRevenue: 14600, collectedRevenue: 6100, blockedRevenue: 2200, payrollCost: 7900, financialStatus: "Review Needed", billingStatus: "Pending", authStatus: "Active", paymentPlan: "Pending", paymentPlanAmount: 185, profitabilityScore: 63, approvalRate: 84, denialRate: 9, avgApprovalDays: 14, daysToRevenue: 39, reauthDays: 31, claimsSubmitted: 13, claimsPending: 5, claimsIssues: 1, claimsResolved: 7, nextAction: "Send updated family responsibility estimate", riskReason: "Payment plan unsigned", tasks: [{ title: "Send updated estimate", owner: "Rhea Patel", due: "Today", priority: "High" }], timeline: ["Benefits updated", "Estimate revised", "Plan pending signature", "Claims pending"] },
  { id: "FIN-1006", client: "Liam Carter", guardian: "Paige Carter", state: "GA", clinic: "Riverdale", clientType: "Home", payor: "Humana", network: "INN", deductible: 900, coinsurance: 0, expectedRevenue: 11200, collectedRevenue: 9700, blockedRevenue: 0, payrollCost: 5100, financialStatus: "Approved", billingStatus: "Ready", authStatus: "Revenue", paymentPlan: "None", paymentPlanAmount: 0, profitabilityScore: 93, approvalRate: 91, denialRate: 5, avgApprovalDays: 10, daysToRevenue: 17, reauthDays: 83, claimsSubmitted: 14, claimsPending: 0, claimsIssues: 0, claimsResolved: 14, nextAction: "Submit next weekly claim batch", riskReason: "Ready for clean billing", tasks: [{ title: "Submit weekly claims", owner: "Mina Santos", due: "Apr 28", priority: "Routine" }], timeline: ["Eligibility confirmed", "Auth connected", "Clean claims", "Revenue cycle healthy"] },
  { id: "FIN-1007", client: "Olivia Singh", guardian: "Ravi Singh", state: "NC", clinic: "Raleigh Cary", clientType: "Clinic", payor: "Medicaid NC", network: "INN", deductible: 0, coinsurance: 0, expectedRevenue: 15800, collectedRevenue: 12100, blockedRevenue: 0, payrollCost: 8400, financialStatus: "Approved", billingStatus: "Submitted", authStatus: "Revenue", paymentPlan: "None", paymentPlanAmount: 0, profitabilityScore: 79, approvalRate: 96, denialRate: 2, avgApprovalDays: 7, daysToRevenue: 20, reauthDays: 66, claimsSubmitted: 20, claimsPending: 5, claimsIssues: 0, claimsResolved: 15, nextAction: "Watch payroll margin", riskReason: "Higher staffing cost", tasks: [{ title: "Review payroll margin", owner: "Rhea Patel", due: "May 1", priority: "Elevated" }], timeline: ["Medicaid auth active", "Claims submitted", "Payroll reviewed", "Collections steady"] },
  { id: "FIN-1008", client: "Ethan Moore", guardian: "Laura Moore", state: "TN", clinic: "Memphis Central", clientType: "Clinic", payor: "Tricare", network: "INN", deductible: 300, coinsurance: 10, expectedRevenue: 7200, collectedRevenue: 1600, blockedRevenue: 3100, payrollCost: 3900, financialStatus: "Blocked", billingStatus: "Issue", authStatus: "Client", paymentPlan: "None", paymentPlanAmount: 0, profitabilityScore: 38, approvalRate: 78, denialRate: 15, avgApprovalDays: 17, daysToRevenue: 52, reauthDays: 22, claimsSubmitted: 4, claimsPending: 2, claimsIssues: 2, claimsResolved: 0, nextAction: "Resolve missing modifier before billing", riskReason: "Claim modifier issue blocking revenue", tasks: [{ title: "Fix missing modifier", owner: "Theo Banks", due: "Today", priority: "Critical" }], timeline: ["Client converted", "Modifier missing", "Claim rejected", "Revenue blocked"] },
  { id: "FIN-1009", client: "Mia Johnson", guardian: "Terrell Johnson", state: "VA", clinic: "Norfolk Harbor", clientType: "Home", payor: "Anthem", network: "OON", deductible: 2500, coinsurance: 25, expectedRevenue: 16800, collectedRevenue: 5200, blockedRevenue: 4200, payrollCost: 7600, financialStatus: "At Risk", billingStatus: "Pending", authStatus: "Active", paymentPlan: "Active", paymentPlanAmount: 260, profitabilityScore: 57, approvalRate: 81, denialRate: 12, avgApprovalDays: 16, daysToRevenue: 41, reauthDays: 27, claimsSubmitted: 10, claimsPending: 6, claimsIssues: 1, claimsResolved: 3, nextAction: "Confirm OON claim documentation", riskReason: "OON paperwork incomplete", tasks: [{ title: "Collect OON documentation", owner: "Mina Santos", due: "Tomorrow", priority: "High" }], timeline: ["OON packet opened", "Payment plan active", "Claims pending", "Reauth approaching"] },
  { id: "FIN-1010", client: "Jackson Reed", guardian: "Nora Reed", state: "MD", clinic: "Baltimore Harbor", clientType: "Hybrid", payor: "CareFirst", network: "INN", deductible: 650, coinsurance: 20, expectedRevenue: 10400, collectedRevenue: 8400, blockedRevenue: 0, payrollCost: 5000, financialStatus: "Approved", billingStatus: "Resolved", authStatus: "Revenue", paymentPlan: "Completed", paymentPlanAmount: 0, profitabilityScore: 86, approvalRate: 90, denialRate: 5, avgApprovalDays: 10, daysToRevenue: 19, reauthDays: 88, claimsSubmitted: 12, claimsPending: 1, claimsIssues: 0, claimsResolved: 11, nextAction: "Review resolved underpayment", riskReason: "Minor underpayment resolved", tasks: [{ title: "Validate underpayment correction", owner: "Rhea Patel", due: "May 2", priority: "Routine" }], timeline: ["Benefits approved", "Underpayment corrected", "Revenue posted", "Claims resolved"] },
  { id: "FIN-1011", client: "Isabella Wilson", guardian: "Carla Wilson", state: "GA", clinic: "Peachtree Corners", clientType: "Clinic", payor: "Aetna", network: "INN", deductible: 1100, coinsurance: 20, expectedRevenue: 19300, collectedRevenue: 6800, blockedRevenue: 5200, payrollCost: 9100, financialStatus: "Review Needed", billingStatus: "Pending", authStatus: "Auth", paymentPlan: "Pending", paymentPlanAmount: 315, profitabilityScore: 60, approvalRate: 94, denialRate: 3, avgApprovalDays: 8, daysToRevenue: 37, reauthDays: 45, claimsSubmitted: 8, claimsPending: 7, claimsIssues: 0, claimsResolved: 1, nextAction: "Finalize high-deductible estimate", riskReason: "High deductible before revenue ramp", tasks: [{ title: "Finalize deductible estimate", owner: "Theo Banks", due: "Tomorrow", priority: "High" }], timeline: ["High deductible identified", "Estimate drafted", "Auth linked", "Claims pending"] },
  { id: "FIN-1012", client: "Harper Allen", guardian: "Morgan Allen", state: "TN", clinic: "Nashville East", clientType: "School", payor: "United Healthcare", network: "INN", deductible: 800, coinsurance: 10, expectedRevenue: 13200, collectedRevenue: 10900, blockedRevenue: 0, payrollCost: 5700, financialStatus: "Approved", billingStatus: "Submitted", authStatus: "Revenue", paymentPlan: "None", paymentPlanAmount: 0, profitabilityScore: 90, approvalRate: 74, denialRate: 18, avgApprovalDays: 19, daysToRevenue: 23, reauthDays: 57, claimsSubmitted: 16, claimsPending: 3, claimsIssues: 0, claimsResolved: 13, nextAction: "Submit school-session documentation", riskReason: "Documentation watch", tasks: [{ title: "Attach school documentation", owner: "Mina Santos", due: "Apr 30", priority: "Elevated" }], timeline: ["School setting approved", "Claims submitted", "Revenue posted", "Documentation watch"] },
  { id: "FIN-1013", client: "Caleb West", guardian: "Tanya West", state: "NC", clinic: "Raleigh Cary", clientType: "Hybrid", payor: "BCBS NC", network: "OON", deductible: 4000, coinsurance: 35, expectedRevenue: 20500, collectedRevenue: 0, blockedRevenue: 12800, payrollCost: 8200, financialStatus: "Blocked", billingStatus: "Issue", authStatus: "Financial", paymentPlan: "Pending", paymentPlanAmount: 410, profitabilityScore: 29, approvalRate: 88, denialRate: 7, avgApprovalDays: 11, daysToRevenue: 61, reauthDays: 12, claimsSubmitted: 0, claimsPending: 0, claimsIssues: 2, claimsResolved: 0, nextAction: "Leadership review before start approval", riskReason: "OON exposure and no collections", tasks: [{ title: "Leadership finance review", owner: "Rhea Patel", due: "Today", priority: "Critical" }], timeline: ["Financial review opened", "OON exposure flagged", "Plan not signed", "Start approval blocked"] },
  { id: "FIN-1014", client: "Grace Turner", guardian: "Olena Turner", state: "VA", clinic: "Richmond West", clientType: "Clinic", payor: "Cigna", network: "INN", deductible: 0, coinsurance: 10, expectedRevenue: 11800, collectedRevenue: 9300, blockedRevenue: 0, payrollCost: 4800, financialStatus: "Approved", billingStatus: "Ready", authStatus: "Revenue", paymentPlan: "None", paymentPlanAmount: 0, profitabilityScore: 95, approvalRate: 92, denialRate: 4, avgApprovalDays: 9, daysToRevenue: 16, reauthDays: 121, claimsSubmitted: 15, claimsPending: 0, claimsIssues: 0, claimsResolved: 15, nextAction: "Continue clean claim cadence", riskReason: "No current risk", tasks: [{ title: "Prepare May billing cadence", owner: "Theo Banks", due: "May 3", priority: "Routine" }], timeline: ["Clean eligibility", "Auth active", "Revenue posted", "Billing ready"] },
  { id: "FIN-1015", client: "Daniel Kim", guardian: "Hana Kim", state: "MD", clinic: "Bethesda North", clientType: "Home", payor: "Kaiser", network: "INN", deductible: 2000, coinsurance: 15, expectedRevenue: 15100, collectedRevenue: 2400, blockedRevenue: 6200, payrollCost: 6900, financialStatus: "At Risk", billingStatus: "Issue", authStatus: "Active", paymentPlan: "Active", paymentPlanAmount: 295, profitabilityScore: 52, approvalRate: 84, denialRate: 9, avgApprovalDays: 14, daysToRevenue: 46, reauthDays: 8, claimsSubmitted: 6, claimsPending: 4, claimsIssues: 2, claimsResolved: 0, nextAction: "Resolve reauth and denied claim bundle", riskReason: "Reauth expires in 8 days", tasks: [{ title: "Escalate reauth denial bundle", owner: "Mina Santos", due: "Today", priority: "Critical" }], timeline: ["Payment plan active", "Claim denied", "Reauth urgent", "Revenue at risk"] },
];

function StatusPill({ label, tone = "info" }: { label: string; tone?: "success" | "warning" | "critical" | "info" }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold", tone === "success" && "bg-success/10 text-success", tone === "warning" && "bg-warning/15 text-warning", tone === "critical" && "bg-destructive/10 text-destructive", tone === "info" && "bg-primary/10 text-primary")}>{label}</span>;
}

function toneFor(client: FinanceClient) {
  if (client.financialStatus === "Blocked" || client.reauthDays <= 14 || client.blockedRevenue > 7000) return "critical";
  if (client.financialStatus === "At Risk" || client.financialStatus === "Review Needed" || client.billingStatus === "Issue") return "warning";
  return "success";
}

export default function FinanceDashboard() {
  const [dateRange, setDateRange] = useState("This Month");
  const [stateFilter, setStateFilter] = useState(ALL);
  const [clinicFilter, setClinicFilter] = useState(ALL);
  const [payorFilter, setPayorFilter] = useState(ALL);
  const [clientTypeFilter, setClientTypeFilter] = useState(ALL);
  const [financialFilter, setFinancialFilter] = useState(ALL);
  const [billingFilter, setBillingFilter] = useState(ALL);
  const [query, setQuery] = useState("");
  const [activeKpi, setActiveKpi] = useState<KpiKey>("expected");
  const [selectedClient, setSelectedClient] = useState<FinanceClient | null>(financeClients[0]);

  const states = [ALL, ...Array.from(new Set(financeClients.map((client) => client.state)))];
  const clinics = [ALL, ...Array.from(new Set(financeClients.map((client) => client.clinic)))];
  const payors = [ALL, ...Array.from(new Set(financeClients.map((client) => client.payor)))];
  const clientTypes = [ALL, ...Array.from(new Set(financeClients.map((client) => client.clientType)))];
  const financialStatuses = [ALL, ...Array.from(new Set(financeClients.map((client) => client.financialStatus)))];
  const billingStatuses = [ALL, ...Array.from(new Set(financeClients.map((client) => client.billingStatus)))];

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return financeClients
      .filter((client) => stateFilter === ALL || client.state === stateFilter)
      .filter((client) => clinicFilter === ALL || client.clinic === clinicFilter)
      .filter((client) => payorFilter === ALL || client.payor === payorFilter)
      .filter((client) => clientTypeFilter === ALL || client.clientType === clientTypeFilter)
      .filter((client) => financialFilter === ALL || client.financialStatus === financialFilter)
      .filter((client) => billingFilter === ALL || client.billingStatus === billingFilter)
      .filter((client) => !q || [client.client, client.guardian, client.payor, client.clinic, client.nextAction].some((field) => field.toLowerCase().includes(q)));
  }, [billingFilter, clinicFilter, clientTypeFilter, financialFilter, payorFilter, query, stateFilter]);

  const kpiFiltered = useMemo(() => {
    if (activeKpi === "plans") return filtered.filter((client) => client.paymentPlan !== "None");
    if (activeKpi === "risk") return filtered.filter((client) => ["At Risk", "Blocked", "Review Needed"].includes(client.financialStatus));
    if (activeKpi === "blocked") return filtered.filter((client) => client.blockedRevenue > 0);
    if (activeKpi === "payroll") return [...filtered].sort((a, b) => b.payrollCost - a.payrollCost).slice(0, 10);
    if (activeKpi === "time") return [...filtered].sort((a, b) => b.daysToRevenue - a.daysToRevenue).slice(0, 10);
    return filtered;
  }, [activeKpi, filtered]);

  const expected = sum(filtered, (client) => client.expectedRevenue);
  const collected = sum(filtered, (client) => client.collectedRevenue);
  const blocked = sum(filtered, (client) => client.blockedRevenue);
  const payroll = sum(filtered, (client) => client.payrollCost);
  const atRisk = sum(filtered.filter((client) => ["At Risk", "Blocked", "Review Needed"].includes(client.financialStatus)), (client) => client.expectedRevenue - client.collectedRevenue);
  const margin = expected ? Math.round(((expected - payroll) / expected) * 100) : 0;

  const kpis: Array<{ key: KpiKey; title: string; value: string; meta: string; icon: typeof DollarSign; tone: "success" | "warning" | "critical" | "info" }> = [
    { key: "expected", title: "Expected Revenue", value: currency.format(expected), meta: `${filtered.length} clients`, icon: DollarSign, tone: "success" },
    { key: "collected", title: "Collected Revenue", value: currency.format(collected), meta: `${expected ? Math.round((collected / expected) * 100) : 0}% collected`, icon: Receipt, tone: "success" },
    { key: "risk", title: "At-Risk Revenue", value: currency.format(atRisk), meta: `${filtered.filter((c) => ["At Risk", "Blocked", "Review Needed"].includes(c.financialStatus)).length} clients`, icon: AlertTriangle, tone: "warning" },
    { key: "plans", title: "Payment Plans", value: String(filtered.filter((c) => c.paymentPlan !== "None").length), meta: currency.format(sum(filtered, (c) => c.paymentPlanAmount)), icon: CreditCard, tone: "info" },
    { key: "avg", title: "Avg Client Value", value: currency.format(filtered.length ? expected / filtered.length : 0), meta: `${pct(avg(filtered.map((c) => c.profitabilityScore)))} score`, icon: TrendingUp, tone: "success" },
    { key: "blocked", title: "Revenue Blocked", value: currency.format(blocked), meta: `${filtered.filter((c) => c.blockedRevenue > 0).length} blockers`, icon: FileWarning, tone: blocked > 15000 ? "critical" : "warning" },
    { key: "time", title: "Avg Time to Revenue", value: `${avg(filtered.map((c) => c.daysToRevenue))}d`, meta: "first clean payment", icon: Clock, tone: "info" },
    { key: "payroll", title: "Payroll Cost", value: currency.format(payroll), meta: `${margin}% gross margin`, icon: Wallet, tone: margin >= 45 ? "success" : "warning" },
  ];

  const pipelineStages: AuthStatus[] = ["Lead", "Financial", "Client", "Auth", "Active", "Revenue"];
  const queue = {
    urgent: filtered.filter((client) => toneFor(client) === "critical"),
    today: filtered.filter((client) => client.tasks.some((task) => task.due === "Today" || task.due === "Tomorrow")),
    blockers: filtered.filter((client) => client.blockedRevenue > 0 || client.billingStatus === "Issue"),
  };
  const payorRows = payors.filter((item) => item !== ALL).map((payor) => {
    const rows = filtered.filter((client) => client.payor === payor);
    return { payor, rows, approval: avg(rows.map((client) => client.approvalRate)), denial: avg(rows.map((client) => client.denialRate)), revenue: sum(rows, (client) => client.expectedRevenue), days: avg(rows.map((client) => client.avgApprovalDays)) };
  }).filter((row) => row.rows.length > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Finance Dashboard</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Revenue, profitability, billing health, and financial risk across the pipeline.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.success("Finance export prepared")}><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button size="sm" onClick={() => toast.success("Finance dashboard refreshed")} className="shadow-sm"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          </div>
        </div>
        <div className="sticky top-0 z-20 rounded-xl border border-border/60 bg-card/95 p-4 shadow-sm backdrop-blur-xl">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Filter className="h-4 w-4 text-primary" />Finance Filters</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
            <Select value={dateRange} onValueChange={setDateRange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Today", "This Week", "This Month", "Last Month", "Quarter to Date", "Custom Range"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            <Select value={stateFilter} onValueChange={setStateFilter}><SelectTrigger><SelectValue placeholder="State" /></SelectTrigger><SelectContent>{states.map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All States" : item}</SelectItem>)}</SelectContent></Select>
            <Select value={clinicFilter} onValueChange={setClinicFilter}><SelectTrigger><SelectValue placeholder="Clinic" /></SelectTrigger><SelectContent>{clinics.map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All Clinics" : item}</SelectItem>)}</SelectContent></Select>
            <Select value={payorFilter} onValueChange={setPayorFilter}><SelectTrigger><SelectValue placeholder="Payor" /></SelectTrigger><SelectContent>{payors.map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All Payors" : item}</SelectItem>)}</SelectContent></Select>
            <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}><SelectTrigger><SelectValue placeholder="Client type" /></SelectTrigger><SelectContent>{clientTypes.map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All Client Types" : item}</SelectItem>)}</SelectContent></Select>
            <Select value={financialFilter} onValueChange={setFinancialFilter}><SelectTrigger><SelectValue placeholder="Financial status" /></SelectTrigger><SelectContent>{financialStatuses.map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All Financial" : item}</SelectItem>)}</SelectContent></Select>
            <Select value={billingFilter} onValueChange={setBillingFilter}><SelectTrigger><SelectValue placeholder="Billing status" /></SelectTrigger><SelectContent>{billingStatuses.map((item) => <SelectItem key={item} value={item}>{item === ALL ? "All Billing" : item}</SelectItem>)}</SelectContent></Select>
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search clients…" className="pl-9" /></div>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => <button key={kpi.key} type="button" onClick={() => setActiveKpi(kpi.key)} className={cn("rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md", activeKpi === kpi.key ? "border-primary ring-2 ring-primary/15" : "border-border/60")}>
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{kpi.title}</p><p className="mt-2 text-2xl font-semibold text-foreground">{kpi.value}</p></div><span className={cn("rounded-lg p-2", kpi.tone === "success" && "bg-success/10 text-success", kpi.tone === "warning" && "bg-warning/15 text-warning", kpi.tone === "critical" && "bg-destructive/10 text-destructive", kpi.tone === "info" && "bg-primary/10 text-primary")}><kpi.icon className="h-4 w-4" /></span></div>
          <p className="mt-3 text-xs text-muted-foreground">{kpi.meta}</p>
        </button>)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Financial Action Queue" icon={ListChecks}>
          <div className="grid gap-3 lg:grid-cols-3">
            <QueueColumn title="Urgent Now" rows={queue.urgent} onSelect={setSelectedClient} />
            <QueueColumn title="Follow-Up Today" rows={queue.today} onSelect={setSelectedClient} />
            <QueueColumn title="Revenue Blockers" rows={queue.blockers} onSelect={setSelectedClient} />
          </div>
        </Card>
        <Card title="Revenue Pipeline" icon={BarChart3}>
          <div className="space-y-3">
            {pipelineStages.map((stage) => {
              const count = filtered.filter((client) => client.authStatus === stage).length;
              const amount = sum(filtered.filter((client) => client.authStatus === stage), (client) => client.expectedRevenue);
              const width = filtered.length ? Math.max(8, (count / filtered.length) * 100) : 0;
              return <div key={stage} className="grid grid-cols-[92px_1fr_104px] items-center gap-3 text-sm"><span className="font-medium text-foreground">{stage}</span><div className="h-9 overflow-hidden rounded-lg bg-muted"><div className="h-full rounded-lg bg-primary/75" style={{ width: `${width}%` }} /></div><span className="text-right text-xs text-muted-foreground">{count} · {currency.format(amount)}</span></div>;
            })}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card title="Client Profitability" icon={LineChart}>
          <FinanceTable rows={kpiFiltered} onSelect={setSelectedClient} />
        </Card>
        <div className="space-y-6">
          <Card title="Payment Plan Tracking" icon={CreditCard}><PlanSummary rows={filtered} /></Card>
          <Card title="Billing & Claims" icon={Receipt}><ClaimsSummary rows={filtered} /></Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card title="Payor Performance" icon={ShieldCheck}><PayorPerformance rows={payorRows} /></Card>
        <Card title="Reauth Risk" icon={FileWarning}><ReauthRisk rows={filtered} onSelect={setSelectedClient} /></Card>
        <Card title="Payroll vs Revenue" icon={Wallet}><PayrollRevenue rows={filtered} /></Card>
      </section>

      <Card title="Finance Worklist" icon={ListChecks}>
        <Worklist rows={kpiFiltered} onSelect={setSelectedClient} />
      </Card>

      <ClientPanel client={selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)} />
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: typeof DollarSign; children: React.ReactNode }) {
  return <section className="rounded-xl border border-border/60 bg-card p-5 shadow-sm"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-base font-semibold text-foreground"><Icon className="h-4 w-4 text-primary" />{title}</h2></div>{children}</section>;
}

function QueueColumn({ title, rows, onSelect }: { title: string; rows: FinanceClient[]; onSelect: (client: FinanceClient) => void }) {
  return <div className="rounded-lg border border-border/60 bg-background p-3"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold text-foreground">{title}</p><span className="text-xs text-muted-foreground">{rows.length}</span></div><div className="space-y-2">{rows.slice(0, 4).map((client) => <button key={`${title}-${client.id}`} type="button" onClick={() => onSelect(client)} className="w-full rounded-lg border border-border/50 bg-card p-3 text-left transition-colors hover:bg-secondary"><div className="flex items-start justify-between gap-2"><p className="text-sm font-medium text-foreground">{client.client}</p><StatusPill label={client.financialStatus} tone={toneFor(client)} /></div><p className="mt-1 text-xs text-muted-foreground">{client.nextAction}</p><p className="mt-2 text-xs font-medium text-primary">{currency.format(client.blockedRevenue || client.expectedRevenue - client.collectedRevenue)} exposure</p></button>)}{rows.length === 0 && <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">No items in this queue.</p>}</div></div>;
}

function FinanceTable({ rows, onSelect }: { rows: FinanceClient[]; onSelect: (client: FinanceClient) => void }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead className="text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{["Client", "Payor", "INN/OON", "Deductible", "Coinsurance", "Expected revenue", "Payment plan", "Profitability score"].map((header) => <th key={header} className="px-3 py-2 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-border/50">{rows.map((client) => <tr key={client.id} onClick={() => onSelect(client)} className="cursor-pointer hover:bg-muted/30"><td className="px-3 py-3"><p className="font-medium text-foreground">{client.client}</p><p className="text-xs text-muted-foreground">{client.clinic} · {client.state}</p></td><td className="px-3 py-3">{client.payor}</td><td className="px-3 py-3"><StatusPill label={client.network} tone={client.network === "INN" ? "success" : "warning"} /></td><td className="px-3 py-3">{currency.format(client.deductible)}</td><td className="px-3 py-3">{client.coinsurance}%</td><td className="px-3 py-3 font-medium text-foreground">{currency.format(client.expectedRevenue)}</td><td className="px-3 py-3">{client.paymentPlan === "None" ? "—" : `${client.paymentPlan} · ${currency.format(client.paymentPlanAmount)}`}</td><td className="px-3 py-3"><div className="flex items-center gap-2"><Progress value={client.profitabilityScore} className="h-2 w-24" /><span className="text-xs text-muted-foreground">{client.profitabilityScore}</span></div></td></tr>)}</tbody></table></div>;
}

function PlanSummary({ rows }: { rows: FinanceClient[] }) {
  const groups: PaymentPlanStatus[] = ["Pending", "Active", "Completed"];
  return <div className="space-y-3">{groups.map((group) => { const matching = rows.filter((client) => client.paymentPlan === group); return <div key={group} className="rounded-lg border border-border/60 bg-background p-3"><div className="flex items-center justify-between"><p className="font-medium text-foreground">{group}</p><span className="text-sm text-muted-foreground">{matching.length}</span></div><p className="mt-1 text-sm text-muted-foreground">{currency.format(sum(matching, (client) => client.paymentPlanAmount))} monthly responsibility</p></div>; })}</div>;
}

function ClaimsSummary({ rows }: { rows: FinanceClient[] }) {
  const submitted = sum(rows, (client) => client.claimsSubmitted), pending = sum(rows, (client) => client.claimsPending), issues = sum(rows, (client) => client.claimsIssues), resolved = sum(rows, (client) => client.claimsResolved);
  return <div className="grid grid-cols-2 gap-3 text-sm">{[["Claims submitted", submitted, "info"], ["Pending", pending, "warning"], ["Issues", issues, "critical"], ["Resolved", resolved, "success"]].map(([label, value, tone]) => <div key={String(label)} className="rounded-lg border border-border/60 bg-background p-3"><StatusPill label={String(label)} tone={tone as "success" | "warning" | "critical" | "info"} /><p className="mt-3 text-2xl font-semibold text-foreground">{String(value)}</p></div>)}</div>;
}

function PayorPerformance({ rows }: { rows: Array<{ payor: string; rows: FinanceClient[]; approval: number; denial: number; revenue: number; days: number }> }) {
  return <div className="space-y-3">{rows.map((row) => <div key={row.payor} className="rounded-lg border border-border/60 bg-background p-3"><div className="flex items-center justify-between"><p className="font-medium text-foreground">{row.payor}</p><p className="text-sm text-muted-foreground">{currency.format(row.revenue)}</p></div><div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground"><span>Approval {row.approval}%</span><span>Denial {row.denial}%</span><span>{row.days}d avg</span></div><Progress value={row.approval} className="mt-3 h-2" /></div>)}</div>;
}

function ReauthRisk({ rows, onSelect }: { rows: FinanceClient[]; onSelect: (client: FinanceClient) => void }) {
  return <div className="space-y-2">{[...rows].sort((a, b) => a.reauthDays - b.reauthDays).slice(0, 6).map((client) => <button key={client.id} type="button" onClick={() => onSelect(client)} className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-background p-3 text-left hover:bg-secondary"><div><p className="font-medium text-foreground">{client.client}</p><p className="text-xs text-muted-foreground">{currency.format(client.expectedRevenue - client.collectedRevenue)} revenue at risk</p></div><StatusPill label={`${client.reauthDays}d`} tone={client.reauthDays <= 14 ? "critical" : client.reauthDays <= 45 ? "warning" : "success"} /></button>)}</div>;
}

function PayrollRevenue({ rows }: { rows: FinanceClient[] }) {
  const expected = sum(rows, (client) => client.expectedRevenue), payroll = sum(rows, (client) => client.payrollCost), collected = sum(rows, (client) => client.collectedRevenue);
  return <div className="space-y-4"><div><div className="mb-2 flex justify-between text-sm"><span className="text-muted-foreground">Collected vs expected</span><span className="font-medium text-foreground">{expected ? pct((collected / expected) * 100) : "0%"}</span></div><Progress value={expected ? (collected / expected) * 100 : 0} className="h-2" /></div><div><div className="mb-2 flex justify-between text-sm"><span className="text-muted-foreground">Payroll cost load</span><span className="font-medium text-foreground">{expected ? pct((payroll / expected) * 100) : "0%"}</span></div><Progress value={expected ? (payroll / expected) * 100 : 0} className="h-2" /></div><div className="grid grid-cols-2 gap-3"><div className="rounded-lg bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Revenue</p><p className="text-lg font-semibold text-foreground">{currency.format(expected)}</p></div><div className="rounded-lg bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Payroll</p><p className="text-lg font-semibold text-foreground">{currency.format(payroll)}</p></div></div></div>;
}

function Worklist({ rows, onSelect }: { rows: FinanceClient[]; onSelect: (client: FinanceClient) => void }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[1280px] text-sm"><thead className="text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{["Client", "State", "Clinic", "Payor", "Financial", "Billing", "Auth", "Expected", "Collected", "Blocked", "Payroll", "Reauth", "Next action"].map((header) => <th key={header} className="px-3 py-2 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-border/50">{rows.map((client) => <tr key={client.id} onClick={() => onSelect(client)} className="cursor-pointer hover:bg-muted/30"><td className="px-3 py-3 font-medium text-foreground">{client.client}</td><td className="px-3 py-3">{client.state}</td><td className="px-3 py-3">{client.clinic}</td><td className="px-3 py-3">{client.payor}</td><td className="px-3 py-3"><StatusPill label={client.financialStatus} tone={toneFor(client)} /></td><td className="px-3 py-3">{client.billingStatus}</td><td className="px-3 py-3">{client.authStatus}</td><td className="px-3 py-3">{currency.format(client.expectedRevenue)}</td><td className="px-3 py-3">{currency.format(client.collectedRevenue)}</td><td className="px-3 py-3">{currency.format(client.blockedRevenue)}</td><td className="px-3 py-3">{currency.format(client.payrollCost)}</td><td className="px-3 py-3">{client.reauthDays}d</td><td className="px-3 py-3">{client.nextAction}</td></tr>)}</tbody></table></div>;
}

function ClientPanel({ client, onOpenChange }: { client: FinanceClient | null; onOpenChange: (open: boolean) => void }) {
  return <Sheet open={!!client} onOpenChange={onOpenChange}><SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl"><SheetHeader>{client && <><SheetTitle>{client.client}</SheetTitle><SheetDescription>{client.clinic} · {client.payor} · {client.network}</SheetDescription></>}</SheetHeader>{client && <Tabs defaultValue="overview" className="mt-6"><TabsList className="grid h-auto grid-cols-2 gap-1 md:grid-cols-4">{["overview", "benefits", "payment", "revenue", "payroll", "auth", "tasks", "timeline"].map((tab) => <TabsTrigger key={tab} value={tab} className="capitalize">{tab === "payment" ? "Plan" : tab}</TabsTrigger>)}</TabsList><TabsContent value="overview"><PanelBlock items={[["Guardian", client.guardian], ["Financial Status", client.financialStatus], ["Billing Status", client.billingStatus], ["Risk", client.riskReason], ["Next Action", client.nextAction]]} /></TabsContent><TabsContent value="benefits"><PanelBlock items={[["Payor", client.payor], ["Network", client.network], ["Deductible", currency.format(client.deductible)], ["Coinsurance", `${client.coinsurance}%`], ["Client Type", client.clientType]]} /></TabsContent><TabsContent value="payment"><PanelBlock items={[["Plan Status", client.paymentPlan], ["Monthly Amount", currency.format(client.paymentPlanAmount)], ["Deductible", currency.format(client.deductible)], ["Responsibility", `${client.coinsurance}% coinsurance`]]} /></TabsContent><TabsContent value="revenue"><PanelBlock items={[["Expected", currency.format(client.expectedRevenue)], ["Collected", currency.format(client.collectedRevenue)], ["Blocked", currency.format(client.blockedRevenue)], ["Days to Revenue", `${client.daysToRevenue} days`], ["Profitability", `${client.profitabilityScore}/100`]]} /></TabsContent><TabsContent value="payroll"><PanelBlock items={[["Payroll Impact", currency.format(client.payrollCost)], ["Gross Margin", pct(((client.expectedRevenue - client.payrollCost) / client.expectedRevenue) * 100)], ["Payroll Load", pct((client.payrollCost / client.expectedRevenue) * 100)]]} /></TabsContent><TabsContent value="auth"><PanelBlock items={[["Auth Stage", client.authStatus], ["Reauth Timeline", `${client.reauthDays} days`], ["Approval Rate", `${client.approvalRate}%`], ["Avg Approval Time", `${client.avgApprovalDays} days`]]} /></TabsContent><TabsContent value="tasks"><div className="space-y-3">{client.tasks.map((task) => <div key={task.title} className="rounded-lg border border-border/60 bg-background p-3"><div className="flex items-center justify-between"><p className="font-medium text-foreground">{task.title}</p><StatusPill label={task.priority} tone={task.priority === "Critical" ? "critical" : task.priority === "High" ? "warning" : "info"} /></div><p className="mt-1 text-sm text-muted-foreground">{task.owner} · {task.due}</p></div>)}</div></TabsContent><TabsContent value="timeline"><div className="space-y-3">{client.timeline.map((event, index) => <div key={event} className="flex gap-3"><span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span><p className="rounded-lg bg-background p-3 text-sm text-foreground ring-1 ring-border/60">{event}</p></div>)}</div></TabsContent></Tabs>}</SheetContent></Sheet>;
}

function PanelBlock({ items }: { items: Array<[string, string]> }) {
  return <div className="mt-4 space-y-3">{items.map(([label, value]) => <div key={label} className="rounded-lg border border-border/60 bg-background p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium text-foreground">{value}</p></div>)}<Separator /></div>;
}
