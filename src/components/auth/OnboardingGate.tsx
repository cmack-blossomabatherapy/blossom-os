import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { LockedStateCard } from "@/components/onboarding/LockedStateCard";
import { useAuth } from "@/contexts/AuthContext";
import { isAllowedForRoles, subscribeAllowlist } from "@/lib/onboarding/allowlist";
import type { AppRole } from "@/lib/roles";
import { findMatchingLock, useMyRouteLocks } from "@/lib/onboarding/routeLocks";

/**
 * Routes (or path prefixes) that are always available, even before onboarding is complete.
 * Everything not in this list is gated for non-bypass users.
 */
export const ALWAYS_OPEN_ROUTES: (string | RegExp)[] = [
  "/",
  "/auth",
  "/welcome",
  "/profile",
  "/help",
  "/notification-preferences",
  "/mobile/permissions",
  /^\/onboarding(\/.*)?$/,
  // The training course player is allowed so users can complete required onboarding training.
  /^\/training\/course\/.*/,
];

function isOpenPath(pathname: string): boolean {
  return ALWAYS_OPEN_ROUTES.some((r) =>
    typeof r === "string" ? r === pathname : r.test(pathname),
  );
}

interface Props {
  children: ReactNode;
  /** Force-gate this child even if the path would otherwise be open. */
  force?: boolean;
  sectionLabel?: string;
  description?: string;
}

export function OnboardingGate({ children, force, sectionLabel, description }: Props) {
  const { pathname } = useLocation();
  const { isComplete, loading } = useOnboardingStatus();
  const { roles } = useAuth();
  const { locks, loading: locksLoading } = useMyRouteLocks();
  // Re-render on allowlist changes so admin edits take effect immediately.
  const [, setTick] = useState(0);
  useEffect(() => subscribeAllowlist(() => setTick((t) => t + 1)), []);

  if (loading || locksLoading) return null;

  // Route locks apply to everyone (even fully-onboarded users) and override allow-lists.
  const lock = findMatchingLock(pathname, locks);
  if (lock) {
    return (
      <LockedStateCard
        sectionLabel={sectionLabel || "This page"}
        description={`Temporarily locked by an admin. Reason: ${lock.reason}${lock.expires_at ? ` · Unlocks ${new Date(lock.expires_at).toLocaleString()}` : ""}`}
      />
    );
  }

  if (isComplete) return <>{children}</>;
  if (!force && isOpenPath(pathname)) return <>{children}</>;
  if (!force && isAllowedForRoles(pathname, roles as AppRole[])) return <>{children}</>;
  return <LockedStateCard sectionLabel={sectionLabel} description={description} />;
}