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
  /** Manager's DB id (uuid). */
  managerId?: string | null;
  email?: string | null;
  phone?: string | null;
  leadershipLevel?: "executive" | "director" | "manager" | "lead" | "individual";
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

interface ViewRow {
  id: string;
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
    name: r.display_name,
    title: r.job_title,
    blurb: r.bio ?? "",
    department: (r.department_slug as DepartmentId) ?? "operations",
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
        "id,employee_code,display_name,preferred_name,first_name,last_name,email,phone,photo_url,image_url,bio,job_title,credential,state,states_supported,leadership_level,leadership_badge,supports_onboarding,featured,manager_id,department_slug",
      )
      .like("employee_code", "dir-%")
      .order("last_name");

    if (!error && data && data.length > 0) {
      setMembers((data as ViewRow[]).map(mapRow));
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const ch = supabase
      .channel("employee-directory")
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "hr_departments" }, () => void load())
      .subscribe();
    return () => {
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
