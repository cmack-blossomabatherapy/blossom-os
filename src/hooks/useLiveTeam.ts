import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TeamMember, Department, TeamStatus } from "@/data/team";

interface EmployeeRow {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  job_title: string;
  department_id: string | null;
  state: string;
  clinic: string | null;
  status: string;
  hire_date: string | null;
  start_date: string | null;
}
interface DeptRow { id: string; name: string }

const DEPT_MAP: Record<string, Department> = {
  Intake: "Intake",
  Authorizations: "Auth",
  "QA / Compliance": "QA",
  Scheduling: "Scheduling",
  Staffing: "Staffing",
  "Clinic Operations": "Clinics",
  Executive: "Exec",
  Operations: "Exec",
};

function mapDept(name: string | undefined): Department {
  if (!name) return "Exec";
  return DEPT_MAP[name] ?? "Exec";
}

function mapStatus(s: string): TeamStatus {
  if (s === "active") return "Active";
  if (s === "on_leave") return "On Leave";
  return "Inactive";
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export interface LiveTeamResult {
  members: TeamMember[];
  loading: boolean;
  reload: () => Promise<void>;
}

/**
 * Live team directory sourced from the `employees` table.
 * Maps each employee row to the legacy TeamMember shape so all existing
 * Team views (directory, workload, org chart, performance) keep working
 * without changes — workload/performance metrics start at zero until those
 * modules wire in real signals.
 */
export function useLiveTeam(): LiveTeamResult {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [empRes, deptRes] = await Promise.all([
      supabase
        .from("employees")
        .select(
          "id,user_id,first_name,last_name,preferred_name,email,phone,job_title,department_id,state,clinic,status,hire_date,start_date",
        )
        .order("last_name"),
      supabase.from("hr_departments").select("id,name"),
    ]);
    const employees = (empRes.data ?? []) as EmployeeRow[];
    const depts = (deptRes.data ?? []) as DeptRow[];
    const deptById = new Map(depts.map((d) => [d.id, d.name]));

    const mapped: TeamMember[] = employees.map((e) => {
      const fullName = `${e.preferred_name || e.first_name} ${e.last_name}`.trim();
      const deptName = e.department_id ? deptById.get(e.department_id) : undefined;
      return {
        id: e.id,
        name: fullName,
        initials: initials(fullName),
        role: e.job_title,
        department: mapDept(deptName),
        states: [e.state],
        email: e.email ?? "",
        phone: e.phone ?? "",
        status: mapStatus(e.status),
        hiredAt: e.hire_date ?? e.start_date ?? new Date().toISOString(),
        reportsTo: null,
        responsibilities: [],
        workload: {
          leads: 0,
          clients: 0,
          auths: 0,
          qa: 0,
          tasksOpen: 0,
          tasksOverdue: 0,
          tasksCompletedMonth: 0,
        },
        workloadLevel: "Light",
        performance: [],
        capacityPct: 0,
      };
    });
    setMembers(mapped);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const onRefresh = () => void load();
    window.addEventListener("team-directory:refresh", onRefresh);
    return () => window.removeEventListener("team-directory:refresh", onRefresh);
  }, []);

  return { members, loading, reload: load };
}