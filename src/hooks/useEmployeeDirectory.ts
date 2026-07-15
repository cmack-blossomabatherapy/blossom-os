/**
 * Centralized Employee Directory hook.
 *
 * One source of truth for: Team Directory, Org Chart, employee profile pages,
 * leadership lists, onboarding-support filters, and admin tooling.
 *
 * Reads the `v_employee_directory` view (live). Subscribes to `employees` &
 * `hr_departments` realtime so any admin edit instantly propagates.
 * Falls back to the bundled brochure data on error so the UI never goes blank.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  TEAM_MEMBERS as STATIC_TEAM_MEMBERS,
  DEPARTMENTS as STATIC_DEPARTMENTS,
  ALL_STATES,
  ORG_FLOW,
  type TeamMember,
  type DepartmentId,
} from "@/data/teamDirectory";

export type DirectoryEmployee = TeamMember & {
  /** Stable DB id (uuid) — used for org-chart edges + profile routing. */
  uuid?: string;
  /** auth.users.id linked to this employee (null when no login yet). */
  authUserId?: string | null;
  /** Manager's DB id (uuid). */
  managerId?: string | null;
  email?: string | null;
  phone?: string | null;
  leadershipLevel?: "executive" | "director" | "manager" | "lead" | "individual";
  /** Live department id (uuid) from hr_departments. */
  departmentId?: string | null;
  /** Live department name (e.g. "Intake"). */
  departmentName?: string | null;
  /** Live employee status from HR (`active`, `inactive`, `terminated`, ...). */
  status?: string | null;
};

interface DirectoryResult {
  members: DirectoryEmployee[];
  departments: typeof STATIC_DEPARTMENTS;
  states: readonly string[];
  orgFlow: typeof ORG_FLOW;
  loading: boolean;
  /** All members reporting to the given uuid. */
  reportsOf: (managerUuid: string) => DirectoryEmployee[];
  /** Lookup helpers. */
  byUuid: Map<string, DirectoryEmployee>;
  byCode: Map<string, DirectoryEmployee>;
}

// Map employee_code ("dir-chad-kaufman") back to bundled photo for crisp images.
const PHOTO_BY_CODE: Record<string, string | undefined> = Object.fromEntries(
  STATIC_TEAM_MEMBERS.map((m) => [`dir-${m.id}`, m.photo]),
);

/**
 * Resolve a fallback brochure photo for a given `employees.employee_code`.
 * Used by the public Smart Badge page so seeded employees show a real face
 * before anyone uploads a custom photo.
 */
export function photoForCode(code: string | null | undefined): string | undefined {
  if (!code) return undefined;
  return PHOTO_BY_CODE[code];
}

interface ViewRow {
  id: string;
  user_id: string | null;
  employee_code: string | null;
  display_name: string;
  preferred_name: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  image_url: string | null;
  bio: string | null;
  job_title: string;
  credential: string | null;
  state: string;
  states_supported: string[] | null;
  leadership_level: DirectoryEmployee["leadershipLevel"];
  leadership_badge: string | null;
  supports_onboarding: boolean;
  featured: boolean;
  manager_id: string | null;
  department_slug: string | null;
  department_id: string | null;
  department_name: string | null;
  status: string | null;
}

function mapRow(r: ViewRow): DirectoryEmployee {
  const code = r.employee_code ?? r.id;
  const slugId = code.replace(/^dir-/, "");
  const isLeader =
    r.leadership_level === "executive" ||
    r.leadership_level === "director" ||
    r.leadership_level === "manager";
  return {
    id: slugId,
    uuid: r.id,
    authUserId: r.user_id ?? null,
    name: r.display_name,
    title: r.job_title,
    blurb: r.bio ?? "",
    department: (r.department_slug as DepartmentId) ?? ("unassigned" as DepartmentId),
    states: r.states_supported && r.states_supported.length ? r.states_supported : [r.state],
    leadership: isLeader || r.featured,
    supportsOnboarding: r.supports_onboarding,
    credential: r.credential ?? undefined,
    // Uploaded photo wins so HR/admin/self updates show everywhere instantly.
    photo: r.photo_url ?? r.image_url ?? PHOTO_BY_CODE[code] ?? undefined,
    email: r.email,
    phone: r.phone,
    managerId: r.manager_id,
    leadershipLevel: r.leadership_level,
    departmentId: r.department_id,
    departmentName: r.department_name,
    status: r.status,
  };
}

const STATIC_AS_DIRECTORY: DirectoryEmployee[] = STATIC_TEAM_MEMBERS.map((m) => ({ ...m }));

export function useEmployeeDirectory(): DirectoryResult {
  const [members, setMembers] = useState<DirectoryEmployee[]>(STATIC_AS_DIRECTORY);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase
      .from("v_employee_directory")
      .select(
        "id,user_id,employee_code,display_name,preferred_name,first_name,last_name,email,phone,photo_url,image_url,bio,job_title,credential,state,states_supported,leadership_level,leadership_badge,supports_onboarding,featured,manager_id,department_slug,department_id,department_name,status",
      )
      .order("last_name");

    if (!error && data && data.length > 0) {
      setMembers((data as ViewRow[]).map(mapRow));
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const onRefresh = () => void load();
    window.addEventListener("employee-directory:refresh", onRefresh);
    const ch = supabase
      .channel(`employee-directory-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "hr_departments" }, () => void load())
      .subscribe();
    return () => {
      window.removeEventListener("employee-directory:refresh", onRefresh);
      void supabase.removeChannel(ch);
    };
  }, []);

  return useMemo<DirectoryResult>(() => {
    const byUuid = new Map<string, DirectoryEmployee>();
    const byCode = new Map<string, DirectoryEmployee>();
    members.forEach((m) => {
      if (m.uuid) byUuid.set(m.uuid, m);
      byCode.set(m.id, m);
    });
    return {
      members,
      departments: STATIC_DEPARTMENTS,
      states: ALL_STATES,
      orgFlow: ORG_FLOW,
      loading,
      byUuid,
      byCode,
      reportsOf: (managerUuid: string) => members.filter((m) => m.managerId === managerUuid),
    };
  }, [members, loading]);
}
