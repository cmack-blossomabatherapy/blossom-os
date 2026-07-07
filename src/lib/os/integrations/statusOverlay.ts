/**
 * Truthful integration-status overlay.
 *
 * Given a static registry status and (optionally) a live
 * `integration_connections` row, derive the single canonical
 * IntegrationStatus we show in the admin Integrations page.
 *
 * Vocabulary — end-to-end, always honest:
 *  - "connected"            live row + probed successfully (last_success_at)
 *  - "syncing"              live row is actively syncing
 *  - "configured"           live row exists with secrets but has never
 *                           been probed successfully — proven credentials,
 *                           no proven flow
 *  - "probe_pending"        live row status is pending/probing
 *  - "credentials_required" live row exists but needs secrets and has none
 *  - "reauth"               live row status is needs_attention
 *  - "error"                live row status is error
 *  - "delayed"              (reserved — not derived here today)
 *  - "disconnected"         no live row and registry does not mark planned
 *  - "coming_soon"          registry marks the integration planned / not ready
 *
 * The function NEVER returns "connected" for an integration that lacks a
 * live row — the static catalog cannot vouch for a real backend link.
 */
export type IntegrationStatus =
  | "connected"
  | "syncing"
  | "delayed"
  | "error"
  | "reauth"
  | "disconnected"
  | "credentials_required"
  | "probe_pending"
  | "configured"
  | "coming_soon";

export type RegistryStatusHint =
  // subset of the registry status vocabulary that matters for overlay
  | "coming_soon"
  | "disconnected"
  | "other";

export interface LiveConnectionForOverlay {
  status: string;
  credential_mode: string;
  secret_names: string[] | null | undefined;
  last_tested_at: string | null | undefined;
  last_success_at: string | null | undefined;
}

export function deriveIntegrationStatus(
  live: LiveConnectionForOverlay | null | undefined,
  registryHint: RegistryStatusHint,
): IntegrationStatus {
  if (!live) {
    return registryHint === "coming_soon" ? "coming_soon" : "disconnected";
  }

  const hasSecrets = (live.secret_names?.length ?? 0) > 0;
  const requiresSecrets =
    live.credential_mode !== "none" && live.credential_mode !== "public";
  const neverProbedSuccessfully = !live.last_success_at;
  const neverProbedAtAll = !live.last_tested_at && !live.last_success_at;

  // Credentials gate first — if we require secrets and have none, that trumps
  // any optimistic status the row carries.
  if (requiresSecrets && !hasSecrets) return "credentials_required";

  switch (live.status) {
    case "connected":
      if (neverProbedAtAll) return "probe_pending";
      if (neverProbedSuccessfully) return "configured";
      return "connected";
    case "syncing":
      return "syncing";
    case "error":
      return "error";
    case "needs_attention":
      return "reauth";
    case "pending":
    case "probing":
      return "probe_pending";
    case "not_configured":
      // No secrets branch already handled above; if secrets are present but
      // the row is still not_configured, treat it as configured (credentials
      // stored, provider link not yet completed).
      return hasSecrets ? "configured" : "disconnected";
    default:
      return "disconnected";
  }
}
