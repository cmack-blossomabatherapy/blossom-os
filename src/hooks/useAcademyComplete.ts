import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { loadCurriculum, getMyEnrollment, listProgress } from "@/lib/academy/api";

/**
 * Returns whether the current user has completed the Operations Academy.
 * Admins, training admins, HR roles always count as complete (bypass the lock).
 * Completion = every required module that applies to the enrollee's path is `completed` (or `waived`).
 */
export function useAcademyComplete() {
  const { user, roles, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);

  const bypass =
    isAdmin ||
    roles.some((r) => ["training_admin", "hr", "hr_admin", "hr_manager", "exec", "ops_manager"].includes(r));

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!user?.id) { setLoading(false); setComplete(false); return; }
      if (bypass) { setLoading(false); setComplete(true); return; }
      setLoading(true);
      try {
        const { data: emp } = await supabase
          .from("employees").select("id").eq("user_id", user.id).maybeSingle();
        if (!emp) { if (!cancelled) { setComplete(false); setLoading(false); } return; }
        const enrollment = await getMyEnrollment(emp.id);
        if (!enrollment) { if (!cancelled) { setComplete(false); setLoading(false); } return; }
        if (enrollment.status === "completed") {
          if (!cancelled) { setComplete(true); setLoading(false); } return;
        }
        const cur = await loadCurriculum();
        if (!cur) { if (!cancelled) { setComplete(false); setLoading(false); } return; }
        const progress = await listProgress(enrollment.id);
        const path = enrollment.path;
        const allModules = cur.phases.flatMap((p) => p.weeks.flatMap((w) => w.modules));
        const required = allModules.filter(
          (m) => m.is_required && (m.applies_to === "either" || m.applies_to === path),
        );
        if (required.length === 0) { if (!cancelled) { setComplete(false); setLoading(false); } return; }
        const done = new Set(
          progress.filter((p) => p.status === "completed" || p.status === "waived").map((p) => p.module_id),
        );
        const allDone = required.every((m) => done.has(m.id));
        if (!cancelled) { setComplete(allDone); setLoading(false); }
      } catch {
        if (!cancelled) { setComplete(false); setLoading(false); }
      }
    }
    void check();
    return () => { cancelled = true; };
  }, [user?.id, bypass]);

  return { loading, complete, bypass };
}