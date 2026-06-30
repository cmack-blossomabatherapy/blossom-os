import { toast } from "sonner";

/**
 * Honest Apploi sync handler. Until a real integration_connection of provider
 * "apploi" exists with status "connected", we must not pretend a sync ran.
 *
 * Centralizing this prevents fake "synced / queued / simulated" toasts from
 * leaking back into the Recruiting UI.
 */
export const APPLOI_NOT_CONNECTED_MESSAGE =
  "Apploi is not connected yet. Request setup in System Tools \u203A Integrations.";

export function notifyApploiNotConnected() {
  toast.info(APPLOI_NOT_CONNECTED_MESSAGE);
}