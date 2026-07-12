import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bindTrainingProgressUser } from "@/lib/training/progressCloud";

/**
 * Mount-once bridge that keeps the local academyData progress store in sync
 * with the current signed-in user's cloud rows in `user_training_progress`.
 */
export function TrainingProgressCloudBridge() {
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!cancelled) await bindTrainingProgressUser(data.user?.id ?? null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void bindTrainingProgressUser(session?.user?.id ?? null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);
  return null;
}

export default TrainingProgressCloudBridge;