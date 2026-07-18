import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type BcbaDashboardCard = {
  id: string;
  card_type: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  priority: number;
  is_enabled: boolean;
  starts_at: string | null;
  ends_at: string | null;
  lifecycle_stages: string[];
  target_roles: string[];
  target_states: string[];
  target_clinics: string[];
  target_user_ids: string[];
  required_action: unknown;
  data_source: string | null;
  freshness_hint: string | null;
  cta_label: string | null;
  cta_link: string | null;
  icon: string | null;
  color: string | null;
  config: Record<string, unknown>;
};

export type BcbaViewerContext = {
  userId?: string;
  lifecycleStage?: string;
  role?: string;
  state?: string;
  clinic?: string;
};

function inWindow(c: BcbaDashboardCard, now: Date) {
  if (c.starts_at && new Date(c.starts_at) > now) return false;
  if (c.ends_at && new Date(c.ends_at) < now) return false;
  return true;
}
function matchesTarget(list: string[], val?: string) {
  return list.length === 0 || (val ? list.includes(val) : false);
}
function matchesUsers(list: string[], id?: string) {
  return list.length === 0 || (id ? list.includes(id) : false);
}

export function useBcbaDashboardCards() {
  const { user } = useAuth();
  const [cards, setCards] = useState<BcbaDashboardCard[]>([]);
  const [lifecycleStage, setLifecycleStage] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [cardsRes, stateRes] = await Promise.all([
          supabase
            .from("bcba_dashboard_cards" as any)
            .select("*")
            .eq("is_enabled", true)
            .order("priority", { ascending: true }),
          user
            ? supabase
                .from("bcba_lifecycle_state" as any)
                .select("stage")
                .eq("employee_id", user.id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null } as any),
        ]);
        if (cancelled) return;
        if (cardsRes.error) throw cardsRes.error;
        setCards((cardsRes.data as any) ?? []);
        setLifecycleStage((stateRes.data as any)?.stage);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Could not load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const context: BcbaViewerContext = { userId: user?.id, lifecycleStage };

  const visible = useMemo(() => {
    const now = new Date();
    return cards
      .filter((c) => inWindow(c, now))
      .filter((c) => matchesTarget(c.lifecycle_stages, context.lifecycleStage))
      .filter((c) => matchesTarget(c.target_roles, "bcba"))
      .filter((c) => matchesTarget(c.target_states, context.state))
      .filter((c) => matchesTarget(c.target_clinics, context.clinic))
      .filter((c) => matchesUsers(c.target_user_ids, context.userId))
      .sort((a, b) => a.priority - b.priority);
  }, [cards, context.lifecycleStage, context.userId]);

  return { cards: visible, loading, error, context };
}

export async function logBcbaCardEngagement(
  cardId: string,
  userId: string,
  eventType: "view" | "click" | "dismiss",
) {
  try {
    await supabase.from("bcba_dashboard_card_engagement" as any).insert({
      card_id: cardId,
      user_id: userId,
      event_type: eventType,
    });
  } catch {
    // best-effort
  }
}