import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import { useAuth } from "@/contexts/AuthContext";
import {
  employeeFullName, RELATIONSHIP_LABELS, type Employee, type RelationshipKind,
} from "@/lib/hr/types";
import { toast } from "sonner";

interface RelRow { id: string; kind: RelationshipKind; related_employee_id: string }

export function HierarchyTab({ employee }: { employee: Employee }) {
  const { hasPerm } = useAuth();
  const canEdit = hasPerm("hr.employees.edit");
  const [rels, setRels] = useState<RelRow[]>([]);
  const [people, setPeople] = useState<Map<string, Employee>>(new Map());
  const [reports, setReports] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [kind, setKind] = useState<RelationshipKind>("direct_manager");
  const [relatedId, setRelatedId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, [employee.id]);

  async function load() {
    setLoading(true);
    const [r, dr] = await Promise.all([
      supabase.from("employee_relationships").select("id, kind, related_employee_id").eq("employee_id", employee.id),
      supabase.from("employee_relationships").select("employee_id").eq("related_employee_id", employee.id).eq("kind", "direct_manager"),
    ]);
    const { data: all } = await supabase.from("employees").select("*").neq("id", employee.id).order("last_name");
    setAllEmployees((all ?? []) as Employee[]);
    const rows = (r.data ?? []) as RelRow[];
    setRels(rows);
    const ids = new Set<string>(rows.map((row) => row.related_employee_id));
    const reportIds = (dr.data ?? []).map((x: { employee_id: string }) => x.employee_id);
    const allIds = Array.from(new Set([...ids, ...reportIds]));
    if (allIds.length) {
      const { data: emps } = await supabase.from("employees").select("*").in("id", allIds);
      const m = new Map<string, Employee>();
      (emps ?? []).forEach((e) => m.set(e.id, e as Employee));
      setPeople(m);
      setReports(reportIds.map((id) => m.get(id)).filter(Boolean) as Employee[]);
    } else {
      setPeople(new Map());
      setReports([]);
    }
    setLoading(false);
  }

  async function addRelationship() {
    if (!relatedId) { toast.error("Choose a person."); return; }
    const { error } = await supabase.from("employee_relationships").insert({ employee_id: employee.id, related_employee_id: relatedId, kind });
    if (error) { toast.error(error.message); return; }
    toast.success("Hierarchy updated.");
    setRelatedId("");
    void load();
  }

  async function removeRelationship(id: string) {
    const { error } = await supabase.from("employee_relationships").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Relationship removed.");
    void load();
  }

  if (loading) return <Skeleton className="h-40" />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Manager chain</h3>
        </div>
        {canEdit && (
          <div className="mb-4 grid gap-2 rounded-lg border border-border/50 bg-secondary/20 p-3 md:grid-cols-[160px_1fr_auto]">
            <Select value={kind} onValueChange={(value) => setKind(value as RelationshipKind)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(RELATIONSHIP_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={relatedId} onValueChange={setRelatedId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Choose employee" /></SelectTrigger>
              <SelectContent>{allEmployees.map((person) => <SelectItem key={person.id} value={person.id}>{employeeFullName(person)} · {person.job_title}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" onClick={addRelationship}>Add</Button>
          </div>
        )}
        {rels.length === 0 ? (
          <p className="text-xs text-muted-foreground">No relationships defined yet.</p>
        ) : (
          <div className="space-y-2">
            {rels.map((r) => {
              const p = people.get(r.related_employee_id);
              if (!p) return null;
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/30">
                  <Link to={`/hr/employees/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <EmployeeAvatar employee={p} size="md" />
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{employeeFullName(p)}</p><p className="text-[11px] text-muted-foreground">{p.job_title}</p></div>
                  </Link>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{RELATIONSHIP_LABELS[r.kind]}</span>
                  {canEdit && <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => removeRelationship(r.id)}>Remove</Button>}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Direct reports</h3>
        {reports.length === 0 ? (
          <p className="text-xs text-muted-foreground">No direct reports.</p>
        ) : (
          <div className="space-y-2">
            {reports.map((p) => (
              <Link key={p.id} to={`/hr/employees/${p.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                <EmployeeAvatar employee={p} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{employeeFullName(p)}</p>
                  <p className="text-[11px] text-muted-foreground">{p.job_title} · {p.state}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}