import { useClients } from "@/contexts/ClientsContext";

/**
 * Shared warning banner for Scheduling Team work surfaces when the durable
 * Scheduling overlay (assignRbt / setStartDate / scheduleSlots) cannot be
 * loaded. Renders nothing when the overlay is healthy.
 */
export function SchedulingOverlayWarning() {
  const { schedulingOverlayError } = useClients();
  if (!schedulingOverlayError) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
    >
      <span className="font-semibold whitespace-nowrap">
        Scheduling overlay unavailable —
      </span>
      <span>
        showing Monday-only data. Blossom OS scheduling assignments, start
        dates, and schedule overlays could not be loaded.{" "}
        {schedulingOverlayError}
      </span>
    </div>
  );
}

export default SchedulingOverlayWarning;