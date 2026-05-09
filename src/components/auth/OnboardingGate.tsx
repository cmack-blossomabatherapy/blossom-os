import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { LockedStateCard } from "@/components/onboarding/LockedStateCard";

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

  if (loading) return null;
  if (isComplete) return <>{children}</>;
  if (!force && isOpenPath(pathname)) return <>{children}</>;
  return <LockedStateCard sectionLabel={sectionLabel} description={description} />;
}