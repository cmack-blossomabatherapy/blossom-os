import { useAuth } from "@/contexts/AuthContext";
import { useExperienceLabController, type UseExperienceLab } from "@/lib/rbt/experienceLab";

/**
 * Thin adapter around useExperienceLabController that wires it into the
 * live auth context. RBT-facing consumers should call THIS hook so that
 * eligibility always reflects the underlying auth roles, not the
 * OSRoleProvider view-as override.
 */
export function useExperienceLab(): UseExperienceLab {
  const { roles, user } = useAuth();
  return useExperienceLabController(roles, user?.id ?? null);
}