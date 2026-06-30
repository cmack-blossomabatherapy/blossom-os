import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  listStaffingMatches,
  listFamilyPreferences,
  proposeMatch,
  updateMatchStatus,
  upsertFamilyPreference,
  deleteFamilyPreference,
  type ProposeMatchInput,
  type UpsertFamilyPreferenceInput,
} from "@/lib/os/staffing/staffingStore";
import type {
  StaffingMatchRow,
  StaffingMatchStatus,
  FamilyStaffingPreferenceRow,
} from "@/lib/os/staffing/types";

/** Live read of staffing matches + family preferences with mutation helpers. */
export function useStaffingWorkspace() {
  const [matches, setMatches] = useState<StaffingMatchRow[]>([]);
  const [preferences, setPreferences] = useState<FamilyStaffingPreferenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, p] = await Promise.all([listStaffingMatches(), listFamilyPreferences()]);
      setMatches(m);
      setPreferences(p);
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

  return {
    matches,
    preferences,
    loading,
    error,
    refresh,
    propose,
    setStatus,
    savePreference,
    removePreference,
  };
}