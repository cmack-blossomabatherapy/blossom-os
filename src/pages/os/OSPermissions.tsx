import { ShieldCheck, Check, Minus, Sparkles } from "lucide-react";
import { OSShell } from "./OSShell";
import { useOSRole } from "@/contexts/OSRoleContext";
import {
  OS_ROLES, ROLE_PROFILES, MODULE_ROUTES, OS_ACTIONS,
  type OSModule, type OSAction,
} from "@/lib/os/permissions";
import { Navigate } from "react-router-dom";

const MODULE_LABELS: Record<OSModule, string> = {
  dashboard: "Dashboard", command_center: "Command Center",
  leads: "Leads", intake: "Intake", clients: "Clients", authorizations: "Authorizations",
  scheduling: "Scheduling", cases: "Case Management",
  staff: "RBT / BCBA", recruiting: "Recruiting", credentialing: "Credentialing",
  employee_ops: "Employee Ops", evaluations: "Evaluations", training: "Training Academy",
  reports: "Reports", kpi: "KPI Tracking", vob: "VOB Decision Center", workflows: "Workflow Center", sop: "Resource Library",
  marketing: "Marketing Ops", analytics_hub: "Analytics Hub",
  billing: "Billing", payroll: "Payroll", revenue: "Revenue Analytics", insurance: "Insurance Tracking",
  tech_requests: "Tech Requests", internal_requests: "Internal Requests",
  open_issues: "Open Issues", projects: "Project Tracking",
  ai_assistant: "Operational Insights", ai_insights: "AI Insights", automation_center: "Automation Center",
  predictive_alerts: "Predictive Alerts", ai_workflows: "AI Workflows",
  hr: "HR Suite", user_management: "User Management", state_management: "State Management",
  settings: "Settings", permissions: "Permissions",
  integrations: "Integrations",
  marketing_dashboard: "Marketing Dashboard",
  campaigns: "Campaign Center",
  lead_sources: "Lead Source Analytics",
  seo_content: "SEO & Content",
  referrals: "Referrals",
  recruiting_marketing: "Recruiting Marketing",
  state_growth: "State Growth Analytics",
  reputation: "Reputation Mgmt",
  community_outreach: "Community Outreach",
  marketing_reports: "Marketing Reports",
  web_analytics: "Web Analytics",
  call_tracking: "Call Tracking",
  phone_system: "Phone System",
  attribution_roi: "Attribution & ROI",
};

export default function OSPermissions() {
  const { platform } = useOSRole();
  if (!platform("managePermissions")) return <Navigate to="/" replace />;

  return (
    <OSShell>
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(280_85%_72%)] text-white">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Permission Architecture</h1>
            <p className="text-[12.5px] text-muted-foreground">Role-based navigation, data scope, actions, and leadership visibility.</p>
          </div>
        </div>
      </header>

      {/* Role overview cards */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {OS_ROLES.map((r) => {
          const p = ROLE_PROFILES[r.id];
          return (
            <div key={r.id} className="os-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[14px] font-semibold tracking-tight">{r.label}</p>
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{r.tier}</p>
                </div>
                <span className="rounded-lg bg-foreground/[0.05] px-2 py-0.5 text-[10.5px] font-semibold capitalize text-foreground/70">
                  {p.scope} scope
                </span>
              </div>
              <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">Modules ({p.modules.length})</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {p.modules.map((m) => (
                  <span key={m} className="rounded-md bg-[hsl(265_85%_96%)] px-1.5 py-0.5 text-[10.5px] font-medium text-[hsl(265_60%_45%)]">
                    {MODULE_LABELS[m]}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[10.5px]">
                {(Object.entries(p.leadership) as [string, boolean][])
                  .filter(([, v]) => v)
                  .map(([k]) => (
                    <span key={k} className="inline-flex items-center gap-1 rounded-md bg-foreground/[0.04] px-1.5 py-0.5 font-medium text-foreground/70">
                      <Sparkles className="h-2.5 w-2.5" /> {k.replace(/([A-Z])/g, " $1")}
                    </span>
                  ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Action matrix */}
      <section className="os-card overflow-hidden p-0">
        <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <p className="text-[13.5px] font-semibold tracking-tight">Action permission matrix</p>
          <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">view · create · edit · delete · approve · export · assign</p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-[12px]">
            <thead className="bg-foreground/[0.025] text-left text-[10.5px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Role</th>
                {(Object.keys(MODULE_ROUTES) as OSModule[]).filter((m) => m !== "permissions").map((m) => (
                  <th key={m} className="px-2 py-2.5 text-center font-semibold">{MODULE_LABELS[m]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OS_ROLES.map((r) => {
                const p = ROLE_PROFILES[r.id];
                return (
                  <tr key={r.id} className="border-t border-border/40">
                    <td className="px-4 py-2 font-medium">{r.label}</td>
                    {(Object.keys(MODULE_ROUTES) as OSModule[]).filter((m) => m !== "permissions").map((m) => {
                      const actions = p.actions[m] ?? [];
                      const visible = p.modules.includes(m);
                      if (!visible) return <td key={m} className="px-2 py-2 text-center text-muted-foreground/50"><Minus className="mx-auto h-3 w-3" /></td>;
                      return (
                        <td key={m} className="px-2 py-2 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            {OS_ACTIONS.map((a) => (
                              <span
                                key={a}
                                title={a}
                                className={
                                  actions.includes(a)
                                    ? "h-1.5 w-1.5 rounded-full bg-[hsl(265_85%_60%)]"
                                    : "h-1.5 w-1.5 rounded-full bg-foreground/10"
                                }
                              />
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Legend */}
      <section className="os-card p-4">
        <p className="text-[13px] font-semibold tracking-tight">Data visibility scope</p>
        <ul className="mt-2 grid gap-2 text-[12px] text-foreground/75 sm:grid-cols-3">
          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[hsl(265_70%_55%)]" /> <span><b>Company:</b> sees all records across every state.</span></li>
          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[hsl(265_70%_55%)]" /> <span><b>State:</b> scoped to records inside the active state.</span></li>
          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[hsl(265_70%_55%)]" /> <span><b>Assigned:</b> only records explicitly assigned to the user.</span></li>
        </ul>
        <p className="mt-4 text-[11.5px] text-muted-foreground">
          Navigation visibility is independent from record-level access. Example: a BCBA sees “Clients” in the sidebar, but only the clients assigned to them appear in lists.
        </p>
      </section>
    </OSShell>
  );
}