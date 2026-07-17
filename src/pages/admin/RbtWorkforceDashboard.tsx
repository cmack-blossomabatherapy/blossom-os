import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessAdminHub } from "@/lib/adminAccess";
import { DashboardShell, exportCsv, RiskPill } from "@/components/admin/rbt/DashboardShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface Row {
  id: string;
  name: string;
  state: string | null;
  hire_date: string | null;
  tenure_days: number | null;
  is_new: boolean;
  in_first_30: boolean;
  credential_expiring: number;
  supervision_days_since: number | null;
  supervision_flag: boolean;
  training_overdue: number;
  open_support: number;
  hours_issues: number;
  interested_lead: boolean;
  interested_fellowship: boolean;
  turnover_risk: string;
}

function fmt(d: string | null) { return d ? new Date(d).toLocaleDateString() : "—"; }

export default function RbtWorkforceDashboard() {
  const { user, roles } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [view, setView] = useState<string>("all");
  const [refreshedAt, setRefreshedAt] = useState<Date>(new Date());

  const load = async () => {
    const [emps, creds, sup, tprog, help, hours, interests] = await Promise.all([
      supabase.from("employees" as any).select("id,full_name,first_name,last_name,state,hire_date,job_title,status")
        .eq("status","active").in("job_title", ["RBT","Registered Behavior Technician","Behavior Technician","Lead RBT"]).limit(2000),
      supabase.from("rbt_credentials" as any).select("employee_id,expires_on,status"),
      supabase.from("rbt_supervision" as any).select("rbt_employee_id,supervision_date"),
      supabase.from("rbt_pathway_progress" as any).select("employee_id,status"),
      supabase.from("rbt_help_requests" as any).select("rbt_employee_id,status").neq("status","resolved").neq("status","closed"),
      supabase.from("rbt_hours_issues" as any).select("employee_id,status").neq("status","resolved"),
      supabase.from("rbt_career_interests" as any).select("employee_id,interested_in_lead,interested_in_fellowship"),
    ]);
    const now = Date.now();
    const in60 = 60 * 86400000;
    const credByEmp = new Map<string, number>();
    ((creds.data as any[]) ?? []).forEach((c) => {
      if (c.expires_on) {
        const t = new Date(c.expires_on).getTime();
        if (t - now < in60) credByEmp.set(c.employee_id, (credByEmp.get(c.employee_id) ?? 0) + 1);
      }
    });
    const lastSup = new Map<string, number>();
    ((sup.data as any[]) ?? []).forEach((s) => {
      const t = new Date(s.supervision_date).getTime();
      const prev = lastSup.get(s.rbt_employee_id);
      if (prev === undefined || t > prev) lastSup.set(s.rbt_employee_id, t);
    });
    const overdueTrain = new Map<string, number>();
    ((tprog.data as any[]) ?? []).forEach((p) => {
      if (p.status !== "completed" && p.status !== "waived") {
        overdueTrain.set(p.employee_id, (overdueTrain.get(p.employee_id) ?? 0) + 1);
      }
    });
    const helpByEmp = new Map<string, number>();
    ((help.data as any[]) ?? []).forEach((h) => helpByEmp.set(h.rbt_employee_id, (helpByEmp.get(h.rbt_employee_id) ?? 0) + 1));
    const hoursByEmp = new Map<string, number>();
    ((hours.data as any[]) ?? []).forEach((h) => hoursByEmp.set(h.employee_id, (hoursByEmp.get(h.employee_id) ?? 0) + 1));
    const interestBy = new Map<string, any>(((interests.data as any[]) ?? []).map((i) => [i.employee_id, i]));

    const built: Row[] = ((emps.data as any[]) ?? []).map((e) => {
      const tenure = e.hire_date ? Math.floor((now - new Date(e.hire_date).getTime()) / 86400000) : null;
      const lastS = lastSup.get(e.id);
      const daysSince = lastS ? Math.floor((now - lastS) / 86400000) : null;
      const credExp = credByEmp.get(e.id) ?? 0;
      const trainOver = overdueTrain.get(e.id) ?? 0;
      const supOpen = helpByEmp.get(e.id) ?? 0;
      const hIssues = hoursByEmp.get(e.id) ?? 0;
      const supFlag = daysSince == null || daysSince > 30;
      const risk =
        (credExp > 0 || (daysSince != null && daysSince > 45) || hIssues > 1) ? "high"
        : (trainOver > 0 || supOpen > 0 || supFlag) ? "medium"
        : "low";
      const int = interestBy.get(e.id);
      return {
        id: e.id,
        name: e.full_name || [e.first_name, e.last_name].filter(Boolean).join(" ") || "Unknown",
        state: e.state,
        hire_date: e.hire_date,
        tenure_days: tenure,
        is_new: tenure != null && tenure <= 90,
        in_first_30: tenure != null && tenure <= 30,
        credential_expiring: credExp,
        supervision_days_since: daysSince,
        supervision_flag: supFlag,
        training_overdue: trainOver,
        open_support: supOpen,
        hours_issues: hIssues,
        interested_lead: !!int?.interested_in_lead,
        interested_fellowship: !!int?.interested_in_fellowship,
        turnover_risk: risk,
      };
    });
    setRows(built);
    setRefreshedAt(new Date());
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      if (query && !r.name.toLowerCase().includes(query)) return false;
      if (stateFilter !== "all" && r.state !== stateFilter) return false;
      if (view === "new" && !r.is_new) return false;
      if (view === "first30" && !r.in_first_30) return false;
      if (view === "credential" && r.credential_expiring === 0) return false;
      if (view === "supervision" && !r.supervision_flag) return false;
      if (view === "training" && r.training_overdue === 0) return false;
      if (view === "support" && r.open_support === 0) return false;
      if (view === "risk" && r.turnover_risk !== "high") return false;
      return true;
    });
  }, [rows, q, stateFilter, view]);

  if (!canAccessAdminHub(user, roles)) return <Navigate to="/" replace />;

  const kpis = [
    { label: "Active RBTs", value: rows?.length ?? "—" },
    { label: "New (≤90d)", value: rows?.filter((r) => r.is_new).length ?? 0 },
    { label: "Credentials expiring 60d", value: rows?.filter((r) => r.credential_expiring > 0).length ?? 0, tone: "warn" as const },
    { label: "Supervision attention", value: rows?.filter((r) => r.supervision_flag).length ?? 0, tone: "warn" as const },
    { label: "High turnover risk", value: rows?.filter((r) => r.turnover_risk === "high").length ?? 0, tone: "danger" as const },
  ];
  const states = Array.from(new Set((rows ?? []).map((r) => r.state).filter(Boolean) as string[]));

  return (
    <DashboardShell
      title="Active RBT Workforce Dashboard"
      subtitle="One roster, one action list — every column is a click into resolution."
      source="employees · rbt_credentials · rbt_supervision · rbt_pathway_progress · rbt_help_requests · rbt_hours_issues"
      freshness={refreshedAt.toLocaleTimeString()}
      kpis={kpis}
      onRefresh={() => void load()}
      onExport={() => exportCsv("rbt-workforce.csv", filtered as any)}
      search={{ value: q, onChange: setQ, placeholder: "Search RBT..." }}
      filters={
        <>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="State" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="h-9 w-[220px]"><SelectValue placeholder="Saved view" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All active</SelectItem>
              <SelectItem value="new">New RBTs (≤90 days)</SelectItem>
              <SelectItem value="first30">First 30 days</SelectItem>
              <SelectItem value="credential">Credential expirations</SelectItem>
              <SelectItem value="supervision">Supervision attention</SelectItem>
              <SelectItem value="training">Training overdue</SelectItem>
              <SelectItem value="support">Open support issues</SelectItem>
              <SelectItem value="risk">High turnover risk</SelectItem>
            </SelectContent>
          </Select>
        </>
      }
    >
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">RBT</th>
              <th className="px-3 py-3">State</th>
              <th className="px-3 py-3">Hired</th>
              <th className="px-3 py-3">Tenure</th>
              <th className="px-3 py-3">Cred exp.</th>
              <th className="px-3 py-3">Last supervision</th>
              <th className="px-3 py-3">Train overdue</th>
              <th className="px-3 py-3">Support</th>
              <th className="px-3 py-3">Hours</th>
              <th className="px-3 py-3">Interests</th>
              <th className="px-3 py-3">Risk</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows === null && (<tr><td colSpan={12} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>)}
            {rows !== null && filtered.length === 0 && (
              <tr><td colSpan={12} className="px-4 py-8 text-center text-muted-foreground">No RBTs match. You're all caught up.</td></tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-b transition-colors hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-3 py-3 text-xs">{r.state ?? "—"}</td>
                <td className="px-3 py-3 text-xs">{fmt(r.hire_date)}</td>
                <td className="px-3 py-3 text-xs">{r.tenure_days != null ? `${r.tenure_days}d` : "—"}</td>
                <td className="px-3 py-3 text-xs">{r.credential_expiring > 0 ? <span className="text-amber-600">{r.credential_expiring}</span> : "—"}</td>
                <td className="px-3 py-3 text-xs">{r.supervision_days_since != null ? `${r.supervision_days_since}d` : "never"}</td>
                <td className="px-3 py-3 text-xs">{r.training_overdue || "—"}</td>
                <td className="px-3 py-3 text-xs">{r.open_support || "—"}</td>
                <td className="px-3 py-3 text-xs">{r.hours_issues || "—"}</td>
                <td className="px-3 py-3 text-xs text-muted-foreground">
                  {[r.interested_lead && "Lead", r.interested_fellowship && "Fellow"].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-3 py-3"><RiskPill level={r.turnover_risk} /></td>
                <td className="px-3 py-3">
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/team/${r.id}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}