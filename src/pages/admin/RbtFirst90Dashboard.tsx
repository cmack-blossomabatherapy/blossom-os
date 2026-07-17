import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessAdminHub } from "@/lib/adminAccess";
import { DashboardShell, exportCsv, RiskPill } from "@/components/admin/rbt/DashboardShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink } from "lucide-react";

interface Row {
  id: string;
  employee_id: string;
  name: string;
  checkpoint: string;
  due_date: string | null;
  status: string;
  risk: string | null;
  owner_role: string | null;
  outreach_count: number;
  resolution_status: string | null;
  followup: string | null;
}

function fmt(d: string | null) { return d ? new Date(d).toLocaleDateString() : "—"; }

export default function RbtFirst90Dashboard() {
  const { user, roles } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [checkpoint, setCheckpoint] = useState<string>("all");
  const [status, setStatus] = useState<string>("open");
  const [refreshedAt, setRefreshedAt] = useState<Date>(new Date());

  const load = async () => {
    const [ji, out] = await Promise.all([
      supabase.from("rbt_journey_instances" as any)
        .select("id,employee_id,checkpoint_key,due_date,status,risk_level,owner_role,resolution_status,followup_action")
        .order("due_date", { ascending: true }),
      supabase.from("rbt_journey_outreach" as any).select("instance_id"),
    ]);
    const inst = (ji.data as any[]) ?? [];
    const ids = Array.from(new Set(inst.map((i) => i.employee_id)));
    const { data: emps } = await supabase.from("employees" as any)
      .select("id,full_name,first_name,last_name").in("id", ids);
    const outCount = new Map<string, number>();
    ((out.data as any[]) ?? []).forEach((o) => outCount.set(o.instance_id, (outCount.get(o.instance_id) ?? 0) + 1));
    const built: Row[] = inst.map((i: any) => {
      const e = (emps as any[])?.find((x) => x.id === i.employee_id);
      return {
        id: i.id,
        employee_id: i.employee_id,
        name: e?.full_name || [e?.first_name, e?.last_name].filter(Boolean).join(" ") || "Unknown",
        checkpoint: i.checkpoint_key,
        due_date: i.due_date,
        status: i.status,
        risk: i.risk_level,
        owner_role: i.owner_role,
        outreach_count: outCount.get(i.id) ?? 0,
        resolution_status: i.resolution_status,
        followup: i.followup_action,
      };
    });
    setRows(built);
    setRefreshedAt(new Date());
  };

  useEffect(() => { void load(); }, []);

  const resolve = async (id: string) => {
    const note = window.prompt("Resolution note (required):", "");
    if (!note) return;
    const { error } = await supabase.from("rbt_journey_instances" as any)
      .update({ resolution_status: "resolved", resolution_note: note, resolved_at: new Date().toISOString(), status: "completed" })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Checkpoint resolved");
    void load();
  };

  const now = Date.now();
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      if (query && !r.name.toLowerCase().includes(query)) return false;
      if (checkpoint !== "all" && r.checkpoint !== checkpoint) return false;
      if (status === "open" && (r.status === "completed" || r.resolution_status === "resolved")) return false;
      if (status === "missed" && !(r.due_date && new Date(r.due_date).getTime() < now && r.status !== "completed")) return false;
      if (status === "high_risk" && r.risk !== "high") return false;
      return true;
    });
  }, [rows, q, checkpoint, status, now]);

  if (!canAccessAdminHub(user, roles)) return <Navigate to="/" replace />;

  const kpis = [
    { label: "Open check-ins", value: rows?.filter((r) => r.status !== "completed").length ?? "—" },
    { label: "Missed", value: rows?.filter((r) => r.due_date && new Date(r.due_date).getTime() < now && r.status !== "completed").length ?? 0, tone: "danger" as const },
    { label: "High risk", value: rows?.filter((r) => r.risk === "high").length ?? 0, tone: "danger" as const },
    { label: "Awaiting outreach", value: rows?.filter((r) => r.status !== "completed" && r.outreach_count === 0).length ?? 0, tone: "warn" as const },
    { label: "Resolved 30d", value: rows?.filter((r) => r.resolution_status === "resolved").length ?? 0, tone: "good" as const },
  ];
  const checkpoints = Array.from(new Set((rows ?? []).map((r) => r.checkpoint)));

  return (
    <DashboardShell
      title="First 90 Days Dashboard"
      subtitle="30 / 60 / 90-day check-ins with missed alerts, risk scoring, outreach history, and mandatory resolution notes."
      source="rbt_journey_instances + rbt_journey_outreach"
      freshness={refreshedAt.toLocaleTimeString()}
      kpis={kpis}
      onRefresh={() => void load()}
      onExport={() => exportCsv("rbt-first-90.csv", filtered as any)}
      search={{ value: q, onChange: setQ, placeholder: "Search RBT..." }}
      filters={
        <>
          <Select value={checkpoint} onValueChange={setCheckpoint}>
            <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Checkpoint" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All checkpoints</SelectItem>
              {checkpoints.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
              <SelectItem value="high_risk">High risk</SelectItem>
              <SelectItem value="all">All</SelectItem>
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
              <th className="px-3 py-3">Checkpoint</th>
              <th className="px-3 py-3">Due</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Risk</th>
              <th className="px-3 py-3">Owner</th>
              <th className="px-3 py-3">Outreach</th>
              <th className="px-3 py-3">Follow-up</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows === null && (<tr><td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>)}
            {rows !== null && filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No check-ins matching. Nice work.</td></tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-b transition-colors hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-3 py-3 text-xs">{r.checkpoint}</td>
                <td className="px-3 py-3 text-xs">{fmt(r.due_date)}</td>
                <td className="px-3 py-3 text-xs">{r.status}</td>
                <td className="px-3 py-3"><RiskPill level={r.risk} /></td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{r.owner_role ?? "—"}</td>
                <td className="px-3 py-3 text-xs">{r.outreach_count}</td>
                <td className="px-3 py-3 text-xs max-w-[220px] truncate" title={r.followup ?? ""}>{r.followup ?? "—"}</td>
                <td className="px-3 py-3 flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => resolve(r.id)}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </Button>
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