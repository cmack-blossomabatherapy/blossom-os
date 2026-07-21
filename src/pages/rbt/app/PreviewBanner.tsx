import { Eye } from "lucide-react";
import { useRbtIdentity } from "./useRbtIdentity";

/**
 * Yellow banner shown at the top of the RBT shell when a super-admin is
 * previewing the experience as a specific RBT employee. Communicates the
 * subject and the fact that writes are disabled.
 */
export function PreviewBanner() {
  const { isPreviewing, displayName, needsVerification, identitySource } = useRbtIdentity();
  if (!isPreviewing) return null;
  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100">
      <div className="mx-auto w-full max-w-3xl md:max-w-5xl px-5 md:px-8 py-2 flex items-center gap-2 text-xs md:text-sm">
        <Eye className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">
          Previewing RBT experience as <strong>{displayName}</strong>
          {needsVerification && identitySource === "name_fallback" && (
            <span className="ml-2 text-[10px] uppercase tracking-widest opacity-70">unverified match</span>
          )}
          . Writes are disabled.
        </span>
      </div>
    </div>
  );
}