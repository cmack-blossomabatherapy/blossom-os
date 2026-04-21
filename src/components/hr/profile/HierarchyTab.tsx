import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import {
  employeeFullName, RELATIONSHIP_LABELS, type Employee, type RelationshipKind,
} from "@/lib/hr/types";

interface RelRow { id: string; kind: RelationshipKind; related_employee_id: string }

export function HierarchyTab({ employee }: { employee: Employee }) {
  const [rels, setRels] = useState<RelRow[]>([]);
  const [people, setPeople] = useState<Map<string, Employee>>(new Map());
  const [reports, setReports] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, [employee.id]);

  async function load() {
    setLoading(true);
    const [r, dr] = await Promise.all([
      supabase.from("employee_relationships").select("id, kind, related_employee_id").eq("employee_id", employee.id),
      supabase.from("employee_relationships").select("employee_id").eq("related_employee_id", employee.id).eq("kind", "direct_manager"),
    ]);
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

  if (loading) return <Skeleton className="h-40" />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Manager chain</h3>
        {rels.length === 0 ? (
          <p className="text-xs text-muted-foreground">No relationships defined yet.</p>
        ) : (
          <div className="space-y-2">
            {rels.map((r) => {
              const p = people.get(r.related_employee_id);
              if (!p) return null;
              return (
                <Link key={r.id} to={`/hr/employees/${p.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                  <EmployeeAvatar employee={p} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{employeeFullName(p)}</p>
                    <p className="text-[11px] text-muted-foreground">{p.job_title}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{RELATIONSHIP_LABELS[r.kind]}</span>
                </Link>
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