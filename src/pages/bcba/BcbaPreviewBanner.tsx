import { Eye } from "lucide-react";
import { useBcbaIdentity } from "./useBcbaIdentity";

/**
 * Yellow banner shown at the top of BCBA pages when a super-admin previews
 * the experience as a specific BCBA. Communicates the subject and the fact
 * that writes are disabled.
 */
export function BcbaPreviewBanner() {
  const { isPreviewing, displayName, needsVerification, identitySource } = useBcbaIdentity();
  if (!isPreviewing) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="bcba-preview-banner"
      className="border-b border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-2 flex items-center gap-2 text-xs md:text-sm">
        <Eye className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">
          Previewing BCBA experience as <strong>{displayName}</strong>
          {needsVerification && identitySource === "name_fallback" && (
            <span className="ml-2 text-[10px] uppercase tracking-widest opacity-70">unverified match</span>
          )}
          . Writes are disabled.
        </span>
      </div>
    </div>
  );
}