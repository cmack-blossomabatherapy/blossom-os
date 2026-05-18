import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { matches } from "@/lib/onboarding/allowlist";

export interface RouteLock {
  id: string;
  user_id: string | null;
  route_pattern: string;
  reason: string;
  locked_by: string | null;
  created_at: string;
  expires_at: string | null;
  active: boolean;
}

function isLive(l: RouteLock): boolean {
  if (!l.active) return false;
  if (l.expires_at && new Date(l.expires_at).getTime() <= Date.now()) return false;
  return true;
}

/** Find the first active lock that matches `pathname` for the current user. */
export function findMatchingLock(pathname: string, locks: RouteLock[]): RouteLock | null {
  for (const l of locks) {
    if (!isLive(l)) continue;
    if (matches(pathname, l.route_pattern) || pathname === l.route_pattern) return l;
  }
  return null;
}

/** Hook: live route locks affecting the current user (their own + global). */
export function useMyRouteLocks() {
  const { user } = useAuth();
  const [locks, setLocks] = useState<RouteLock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLocks([]); setLoading(false); return; }
    let alive = true;
    const load = async () => {
      const { data } = await supabase
        .from("onboarding_route_locks")
        .select("*")
        .eq("active", true)
        .or(`user_id.eq.${user.id},user_id.is.null`);
      if (!alive) return;
      setLocks((data as RouteLock[] | null) ?? []);
      setLoading(false);
    };
    void load();
    const ch = supabase
      .channel(`route-locks-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "onboarding_route_locks" }, () => void load())
      .subscribe();
    return () => { alive = false; void supabase.removeChannel(ch); };
  }, [user]);

  return { locks, loading };
}

/** Admin: list locks for a specific user (plus global). */
export async function fetchLocksFor(userId: string): Promise<RouteLock[]> {
  const { data } = await supabase
    .from("onboarding_route_locks")
    .select("*")
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order("created_at", { ascending: false });
  return (data as RouteLock[] | null) ?? [];
}

export async function createLock(input: {
  userId: string | null;
  routePattern: string;
  reason: string;
  expiresAt?: string | null;
}) {
  const { data: auth } = await supabase.auth.getUser();
  return supabase.from("onboarding_route_locks").insert({
    user_id: input.userId,
    route_pattern: input.routePattern.trim(),
    reason: input.reason.trim(),
    expires_at: input.expiresAt ?? null,
    locked_by: auth.user?.id ?? null,
  });
}

export async function deactivateLock(id: string) {
  return supabase.from("onboarding_route_locks").update({ active: false }).eq("id", id);
}