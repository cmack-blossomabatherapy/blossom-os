import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  listStaffingMatches,
  listFamilyPreferences,
  proposeMatch,
  updateMatchStatus,
  upsertFamilyPreference,
  deleteFamilyPreference,
  listCaseActivity,
  upsertCaseActivity,
  deleteCaseActivity,
  listIntegrationHandoffs,
  upsertIntegrationHandoff,
  type ProposeMatchInput,
  type UpsertFamilyPreferenceInput,
  type UpsertCaseActivityInput,
  type UpsertIntegrationHandoffInput,
} from "@/lib/os/staffing/staffingStore";
import type {
  StaffingMatchRow,
  StaffingMatchStatus,
  FamilyStaffingPreferenceRow,
  StaffingCaseActivityRow,
  StaffingIntegrationHandoffRow,
} from "@/lib/os/staffing/types";

/** Live read of staffing matches + family preferences with mutation helpers. */
export function useStaffingWorkspace() {
  const [matches, setMatches] = useState<StaffingMatchRow[]>([]);
  const [preferences, setPreferences] = useState<FamilyStaffingPreferenceRow[]>([]);
  const [activity, setActivity] = useState<StaffingCaseActivityRow[]>([]);
  const [handoffs, setHandoffs] = useState<StaffingIntegrationHandoffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, p, a, h] = await Promise.all([
        listStaffingMatches(),
        listFamilyPreferences(),
        listCaseActivity().catch(() => [] as StaffingCaseActivityRow[]),
        listIntegrationHandoffs().catch(() => [] as StaffingIntegrationHandoffRow[]),
      ]);
      setMatches(m);
      setPreferences(p);
      setActivity(a);
      setHandoffs(h);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load staffing data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  /* ---------------- match actions ---------------- */

  const propose = useCallback(async (input: ProposeMatchInput) => {
    try {
      const row = await proposeMatch(input);
      setMatches((prev) => [row, ...prev]);
      toast.success(`Match proposed for ${input.rbt_name}`);
      return row;
    } catch (err) {
      toast.error("Failed to propose match", { description: (err as Error).message });
      throw err;
    }
  }, []);

  const setStatus = useCallback(
    async (id: string, status: StaffingMatchStatus, extra?: { rejection_reason?: string; notes?: string }) => {
      try {
        const row = await updateMatchStatus(id, status, extra);
        setMatches((prev) => prev.map((m) => (m.id === id ? row : m)));
        toast.success(`Match marked ${status}`);
        // Audit trail — persist a status_change activity row so match
        // decisions have durable history alongside the match record itself.
        try {
          const title =
            status === "Assigned" ? `Match assigned to ${row.rbt_name}`
            : status === "Rejected" ? `Match rejected for ${row.rbt_name}`
            : status === "Pending" ? `Match re-opened for ${row.rbt_name}`
            : `Match marked ${status} for ${row.rbt_name}`;
          const activityStatus =
            status === "Assigned" ? "resolved"
            : status === "Rejected" ? "resolved"
            : status === "Pending" ? "in_progress"
            : "open";
          const activityRow = await upsertCaseActivity({
            client_id: row.client_id,
            client_name: row.rbt_name, // best available label when client name not hydrated here
            activity_type: "status_change",
            title,
            detail: status === "Rejected" ? extra?.rejection_reason ?? null : extra?.notes ?? null,
            status: activityStatus as StaffingCaseActivityRow["status"],
          });
          setActivity((prev) => [activityRow, ...prev.filter((a) => a.id !== activityRow.id)]);
        } catch (auditErr) {
          // Non-fatal: audit failure must not block the status change UX.
          console.warn("staffing status_change audit write failed", auditErr);
        }
        return row;
      } catch (err) {
        toast.error("Failed to update match", { description: (err as Error).message });
        throw err;
      }
    },
    [],
  );

  /* -------------- preference actions -------------- */

  const savePreference = useCallback(async (input: UpsertFamilyPreferenceInput) => {
    try {
      const row = await upsertFamilyPreference(input);
      setPreferences((prev) => {
        const next = prev.filter((p) => p.id !== row.id);
        return [row, ...next];
      });
      toast.success(input.id ? "Preference updated" : "Preference added");
      return row;
    } catch (err) {
      toast.error("Failed to save preference", { description: (err as Error).message });
      throw err;
    }
  }, []);

  const removePreference = useCallback(async (id: string) => {
    try {
      await deleteFamilyPreference(id);
      setPreferences((prev) => prev.filter((p) => p.id !== id));
      toast.success("Preference removed");
    } catch (err) {
      toast.error("Failed to remove preference", { description: (err as Error).message });
      throw err;
    }
  }, []);

  /* ------------- case activity (notes/escalations/blockers) ------------- */

  const saveActivity = useCallback(async (input: UpsertCaseActivityInput) => {
    try {
      const row = await upsertCaseActivity(input);
      setActivity((prev) => {
        const rest = prev.filter((a) => a.id !== row.id);
        return [row, ...rest];
      });
      toast.success(input.id ? "Activity updated" : `Added ${input.activity_type.replace(/_/g, " ")}`);
      return row;
    } catch (err) {
      toast.error("Failed to save activity", { description: (err as Error).message });
      throw err;
    }
  }, []);

  const removeActivity = useCallback(async (id: string) => {
    try {
      await deleteCaseActivity(id);
      setActivity((prev) => prev.filter((a) => a.id !== id));
      toast.success("Activity removed");
    } catch (err) {
      toast.error("Failed to remove activity", { description: (err as Error).message });
      throw err;
    }
  }, []);

  /* ---------------- apploi / integration handoffs ---------------- */

  const saveHandoff = useCallback(async (input: UpsertIntegrationHandoffInput) => {
    try {
      const row = await upsertIntegrationHandoff(input);
      setHandoffs((prev) => {
        const rest = prev.filter((h) => h.id !== row.id);
        return [row, ...rest];
      });
      toast.success(`Handoff marked ${row.status.replace(/_/g, " ")}`);
      return row;
    } catch (err) {
      toast.error("Failed to update handoff", { description: (err as Error).message });
      throw err;
    }
  }, []);

  return {
    matches,
    preferences,
    activity,
    handoffs,
    loading,
    error,
    refresh,
    propose,
    setStatus,
    savePreference,
    removePreference,
    saveActivity,
    removeActivity,
    saveHandoff,
  };
}