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
  employee_id: string;
  name: string;
  email: string | null;
  state: string | null;
  stage: string | null;
  pathway: string | null;
  readiness_complete: number;
  readiness_total: number;
  readiness_overdue: number;
  staffing_status: string | null;
  first_session_date: string | null;
  journey_status: string;
  risk: string | null;
  next_action: string;
  owner: string | null;
}

function fmt(d: string | null) { return d ? new Date(d).toLocaleDateString() : "—"; }

export default function RbtJourneyCommandCenter() {
  const { user, roles } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string>("all");
  const [risk, setRisk] = useState<string>("all");
  const [refreshedAt, setRefreshedAt] = useState<Date>(new Date());

  const load = async () => {
    const [ls, ss, gs, fc, ji, pa, pw] = await Promise.all([
      supabase.from("rbt_lifecycle_state" as any).select("employee_id,stage,pathway_id"),
      supabase.from("rbt_staffing_status" as any).select("employee_id,status,assigned_coordinator"),
      supabase.from("rbt_readiness_gate_state" as any).select("employee_id,status,due_at"),
      supabase.from("rbt_first_case" as any).select("employee_id,start_date,status"),
      supabase.from("rbt_journey_instances" as any).select("employee_id,checkpoint_key,status,risk_level,followup_action,owner_role,due_date,resolution_status"),
      supabase.from("rbt_pathway_assignments" as any).select("employee_id,pathway_id,active").eq("active", true),
      supabase.from("rbt_pathways" as any).select("id,name"),
    ]);
    const stages = (ls.data as any[]) ?? [];
    const ids = Array.from(new Set(stages.map((s) => s.employee_id)));
    const { data: emps } = await supabase.from("employees" as any)
      .select("id,first_name,last_name,full_name,email,state").in("id", ids);
    const now = Date.now();
    const pwName = new Map<string, string>(((pw.data as any[]) ?? []).map((p) => [p.id, p.name]));
    const paByEmp = new Map<string, string>(((pa.data as any[]) ?? []).map((p) => [p.employee_id, pwName.get(p.pathway_id) ?? "—"]));
    const ssByEmp = new Map<string, any>(((ss.data as any[]) ?? []).map((s) => [s.employee_id, s]));
    const fcByEmp = new Map<string, any>(((fc.data as any[]) ?? []).map((f) => [f.employee_id, f]));
    const rGates = new Map<string, { total: number; done: number; overdue: number }>();
    ((gs.data as any[]) ?? []).forEach((g) => {
      const cur = rGates.get(g.employee_id) ?? { total: 0, done: 0, overdue: 0 };
      cur.total += 1;
      if (g.status === "approved" || g.status === "waived") cur.done += 1;
      else if (g.due_at && new Date(g.due_at).getTime() < now) cur.overdue += 1;
      rGates.set(g.employee_id, cur);
    });
    const journeyByEmp = new Map<string, any[]>();
    ((ji.data as any[]) ?? []).forEach((j) => {
      const arr = journeyByEmp.get(j.employee_id) ?? [];
      arr.push(j);
      journeyByEmp.set(j.employee_id, arr);
    });

    const built: Row[] = stages.map((s: any) => {
      const e = (emps as any[])?.find((x) => x.id === s.employee_id);
      const g = rGates.get(s.employee_id) ?? { total: 0, done: 0, overdue: 0 };
      const st = ssByEmp.get(s.employee_id);
      const fcv = fcByEmp.get(s.employee_id);
      const js = (journeyByEmp.get(s.employee_id) ?? []) as any[];
      const openJ = js.filter((j) => j.status !== "completed" && j.resolution_status !== "resolved");
      const highest = openJ.reduce((acc: string | null, j) => {
        const lvl = j.risk_level;
        const rank = (r: string | null) => (r === "high" ? 3 : r === "medium" ? 2 : r === "low" ? 1 : 0);
        return rank(lvl) > rank(acc) ? lvl : acc;
      }, null);
      const nextAction =
        g.overdue > 0 ? `Resolve ${g.overdue} overdue readiness gate${g.overdue > 1 ? "s" : ""}`
        : st?.status === "ready_for_matching" ? "Match to a case"
        : !fcv && s.stage === "case_confirmed" ? "Schedule first session"
        : openJ[0]?.followup_action || (openJ.length ? `Follow up on ${openJ[0].checkpoint_key}` : "On track");
      return {
        employee_id: s.employee_id,
        name: e?.full_name || [e?.first_name, e?.last_name].filter(Boolean).join(" ") || "Unknown",
        email: e?.email ?? null,
        state: e?.state ?? null,
        stage: s.stage ?? null,
        pathway: paByEmp.get(s.employee_id) ?? null,
        readiness_complete: g.done,
        readiness_total: g.total,
        readiness_overdue: g.overdue,
        staffing_status: st?.status ?? null,
        first_session_date: fcv?.start_date ?? null,
        journey_status: openJ.length ? `${openJ.length} open` : "clear",
        risk: highest,
        next_action: nextAction,
        owner: st?.assigned_coordinator ?? openJ[0]?.owner_role ?? null,
      };
    });
    setRows(built);
    setRefreshedAt(new Date());
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      if (query && !r.name.toLowerCase().includes(query) && !r.email?.toLowerCase().includes(query)) return false;
      if (stage !== "all" && r.stage !== stage) return false;
      if (risk !== "all" && (r.risk ?? "none") !== risk) return false;
      return true;
    });
  }, [rows, q, stage, risk]);

  if (!canAccessAdminHub(user, roles)) return <Navigate to="/" replace />;

  const kpis = [
    { label: "RBTs in journey", value: rows?.length ?? "—" },
    { label: "Ready for staffing", value: rows?.filter((r) => r.staffing_status === "ready_for_matching").length ?? 0, tone: "warn" as const },
    { label: "High risk", value: rows?.filter((r) => r.risk === "high").length ?? 0, tone: "danger" as const },
    { label: "Overdue readiness", value: rows?.reduce((n, r) => n + r.readiness_overdue, 0) ?? 0, tone: "danger" as const },
    { label: "Awaiting first session", value: rows?.filter((r) => !r.first_session_date && r.staffing_status === "case_confirmed").length ?? 0 },
  ];

  const stages = Array.from(new Set((rows ?? []).map((r) => r.stage).filter(Boolean) as string[]));

  return (
    <DashboardShell
      title="RBT Journey Command Center"
      subtitle="One row per RBT from lifecycle through first case and 30/60/90-day check-ins. Only exceptions surface as next actions."
      source="Blossom OS · Lifecycle, Readiness, First Case & Journey tables"
      freshness={refreshedAt.toLocaleTimeString()}
      kpis={kpis}
      onRefresh={() => void load()}
      onExport={() => exportCsv("rbt-journey.csv", filtered as any)}
      search={{ value: q, onChange: setQ, placeholder: "Search RBT name or email..." }}
      filters={
        <>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Lifecycle stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {stages.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={risk} onValueChange={setRisk}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Risk" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All risks</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="none">None</SelectItem>
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
              <th className="px-3 py-3">Stage</th>
              <th className="px-3 py-3">Pathway</th>
              <th className="px-3 py-3">Readiness</th>
              <th className="px-3 py-3">Staffing</th>
              <th className="px-3 py-3">First session</th>
              <th className="px-3 py-3">Risk</th>
              <th className="px-3 py-3">Next action</th>
              <th className="px-3 py-3">Owner</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows === null && (<tr><td colSpan={11} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>)}
            {rows !== null && filtered.length === 0 && (
              <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">No RBTs match these filters. You're all caught up.</td></tr>
            )}
            {filtered.map((r) => (
              <tr key={r.employee_id} className="border-b transition-colors hover:bg-muted/40">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground">{r.email}</p>
                </td>
                <td className="px-3 py-3 text-xs">{r.state ?? "—"}</td>
                <td className="px-3 py-3 text-xs">{r.stage ?? "—"}</td>
                <td className="px-3 py-3 text-xs">{r.pathway ?? "—"}</td>
                <td className="px-3 py-3 text-xs">
                  <span className="font-medium">{r.readiness_complete}/{r.readiness_total}</span>
                  {r.readiness_overdue > 0 && <span className="ml-1 text-red-600">·{r.readiness_overdue} overdue</span>}
                </td>
                <td className="px-3 py-3 text-xs">{r.staffing_status ?? "—"}</td>
                <td className="px-3 py-3 text-xs">{fmt(r.first_session_date)}</td>
                <td className="px-3 py-3"><RiskPill level={r.risk} /></td>
                <td className="px-3 py-3 text-xs">{r.next_action}</td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{r.owner ?? "—"}</td>
                <td className="px-3 py-3">
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/team/${r.employee_id}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
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