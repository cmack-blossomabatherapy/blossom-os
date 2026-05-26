import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BCBA, RBT, BCBAStatus, RBTStatus } from "@/lib/workforce/mockStaff";

interface EmployeeRow {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  job_title: string;
  state: string;
  clinic: string | null;
  status: string;
  credential: string | null;
}

interface ClientRow {
  id: string;
  child_name: string | null;
  bcba: string | null;
  rbt: string | null;
  state: string;
  approved_weekly_hours: number | null;
  scheduled_weekly_hours: number | null;
  active_service_status: string | null;
  active_staffing_status: string | null;
  auth_status: string | null;
}

const DEFAULT_CAPACITY = 12;

function bcbaStatus(caseload: number, capacity: number): BCBAStatus {
  if (caseload > capacity) return "Overloaded";
  if (caseload >= capacity - 1) return "Near Capacity";
  if (caseload <= Math.max(2, capacity / 3)) return "Needs Attention";
  return "Healthy";
}

function rbtStatus(util: number): RBTStatus {
  if (util >= 85) return "Healthy";
  if (util >= 60) return "Needs Support";
  if (util > 0) return "Underutilized";
  return "At Risk";
}

function clientRiskTone(c: ClientRow): "ok" | "watch" | "risk" {
  if (c.auth_status && /expired|denied/i.test(c.auth_status)) return "risk";
  if (
    c.approved_weekly_hours &&
    c.scheduled_weekly_hours !== null &&
    c.scheduled_weekly_hours < c.approved_weekly_hours * 0.7
  )
    return "watch";
  return "ok";
}

function fullName(e: EmployeeRow) {
  return `${e.preferred_name || e.first_name} ${e.last_name}`.trim();
}

export interface WorkforceData {
  bcbas: BCBA[];
  rbts: RBT[];
  staffingNeeds: {
    id: string;
    client: string;
    region: string;
    hoursNeeded: number;
    need: "RBT" | "BCBA" | "Partial";
    urgency: "critical" | "high" | "watch";
    owner: string;
  }[];
  loading: boolean;
}

export function useStateWorkforce(state: string): WorkforceData {
  const [data, setData] = useState<WorkforceData>({
    bcbas: [],
    rbts: [],
    staffingNeeds: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [empRes, clientRes] = await Promise.all([
        supabase
          .from("employees")
          .select(
            "id,first_name,last_name,preferred_name,job_title,state,clinic,status,credential",
          )
          .eq("state", state)
          .ilike("job_title", "%bcba%"),
        supabase
          .from("clients")
          .select(
            "id,child_name,bcba,rbt,state,approved_weekly_hours,scheduled_weekly_hours,active_service_status,active_staffing_status,auth_status",
          )
          .eq("state", state),
      ]);

      if (cancelled) return;
      const employees = (empRes.data ?? []) as EmployeeRow[];
      const clients = (clientRes.data ?? []) as ClientRow[];

      // Group clients by BCBA name
      const byBcba = new Map<string, ClientRow[]>();
      clients.forEach((c) => {
        const key = (c.bcba ?? "").trim();
        if (!key) return;
        if (!byBcba.has(key)) byBcba.set(key, []);
        byBcba.get(key)!.push(c);
      });

      const region = (e: EmployeeRow) => e.clinic ?? state;

      const bcbas: BCBA[] = employees.map((e) => {
        const name = fullName(e);
        const assigned = byBcba.get(name) ?? [];
        const active = assigned.filter(
          (c) => (c.active_service_status ?? "").toLowerCase() === "active",
        );
        const caseload = active.length;
        const hours = active.reduce(
          (sum, c) => sum + (c.scheduled_weekly_hours ?? 0),
          0,
        );
        const authRisks = assigned.filter(
          (c) => c.auth_status && /expired|denied|pending/i.test(c.auth_status),
        ).length;
        const staffingGaps = assigned.filter(
          (c) =>
            c.approved_weekly_hours &&
            c.scheduled_weekly_hours !== null &&
            c.scheduled_weekly_hours < c.approved_weekly_hours * 0.8,
        ).length;
        const status = bcbaStatus(caseload, DEFAULT_CAPACITY);
        return {
          id: e.id,
          state,
          name,
          region: region(e),
          caseload,
          capacity: DEFAULT_CAPACITY,
          hours: Math.round(hours * 10) / 10,
          supervisionPct: 0,
          overduePR: 0,
          staffingGaps,
          status,
          authRisks,
          trainingComplete: 0,
          onboarding: "complete",
          clients: assigned.slice(0, 10).map((c) => ({
            name: c.child_name ?? "Unknown",
            hours: c.scheduled_weekly_hours ?? 0,
            risk: clientRiskTone(c),
          })),
        };
      });

      // RBT roster derived from distinct rbt names on clients
      const byRbt = new Map<string, ClientRow[]>();
      clients.forEach((c) => {
        const key = (c.rbt ?? "").trim();
        if (!key) return;
        if (!byRbt.has(key)) byRbt.set(key, []);
        byRbt.get(key)!.push(c);
      });

      const rbts: RBT[] = Array.from(byRbt.entries()).map(([name, list], i) => {
        const scheduledHours = list.reduce(
          (s, c) => s + (c.scheduled_weekly_hours ?? 0),
          0,
        );
        const targetHours = 32;
        const utilization = Math.min(
          100,
          Math.round((scheduledHours / targetHours) * 100),
        );
        const primaryBcba = list.find((c) => c.bcba)?.bcba ?? "—";
        return {
          id: `rbt-${i}`,
          state,
          name,
          region: state,
          bcba: primaryBcba,
          clients: list.length,
          scheduledHours: Math.round(scheduledHours * 10) / 10,
          targetHours,
          utilization,
          trainingComplete: 0,
          supervisionDue: false,
          status: rbtStatus(utilization),
          upcoming: [],
          attendanceConcerns: 0,
          onboarding: "complete",
        };
      });

      // Staffing needs = clients with gap between approved and scheduled hours
      const staffingNeeds = clients
        .filter(
          (c) =>
            c.approved_weekly_hours &&
            c.scheduled_weekly_hours !== null &&
            c.scheduled_weekly_hours < c.approved_weekly_hours,
        )
        .map((c) => {
          const gap =
            (c.approved_weekly_hours ?? 0) - (c.scheduled_weekly_hours ?? 0);
          const urgency: "critical" | "high" | "watch" =
            gap >= 10 ? "critical" : gap >= 5 ? "high" : "watch";
          const need: "RBT" | "BCBA" | "Partial" =
            !c.rbt ? "RBT" : !c.bcba ? "BCBA" : "Partial";
          return {
            id: c.id,
            client: c.child_name ?? "Unknown",
            region: state,
            hoursNeeded: Math.round(gap * 10) / 10,
            need,
            urgency,
            owner:
              need === "RBT"
                ? "Scheduling"
                : need === "BCBA"
                  ? "Staffing"
                  : "Scheduling",
          };
        })
        .sort(
          (a, b) =>
            (a.urgency === "critical" ? 0 : a.urgency === "high" ? 1 : 2) -
            (b.urgency === "critical" ? 0 : b.urgency === "high" ? 1 : 2),
        )
        .slice(0, 8);

      setData({ bcbas, rbts, staffingNeeds, loading: false });
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [state]);

  return data;
}