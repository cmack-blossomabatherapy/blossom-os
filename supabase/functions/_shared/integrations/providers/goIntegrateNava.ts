import type { ProviderAdapter } from "../types.ts";

/**
 * Go Integrator Nava — corrected classification.
 *
 * Nava is a desktop CTI/CRM companion that bridges to NetSapiens /
 * Jivetel phone systems. Its HTTP(S) client API requires a UNITE license
 * and runs on the user's local machine — it is NOT reachable from cloud
 * Edge Functions. Prior classification as "eligibility" was wrong.
 *
 * Docs:
 * - https://help.nava.gointegrator.com/help?item=2505&lang=us&version=4.2
 * - https://nava.gointegrator.com/connection-method-protocols-2/
 *
 * Operationally this adapter reports honestly: manual_local_setup, and
 * Run Sync is unsupported. Setup is linked to Jivetel / NetSapiens.
 */
export const goIntegrateNavaAdapter: ProviderAdapter = {
  id: "go-integrate-nava",
  classification: "communications_desktop_cti",
  requiredSecrets: [],
  optionalSecrets: [],
  capabilities: {
    localOnly: true,
    outboundDisabled: true,
    probe: false,
    pullSync: false,
    webhook: false,
    documentationUrl:
      "https://help.nava.gointegrator.com/help?item=2505&lang=us&version=4.2",
    operationalState: "manual_local_setup",
  },

  async probe() {
    return {
      ok: true,
      status: "manual_local_setup",
      message:
        "Go Integrator Nava is a local desktop CTI client (requires UNITE license) and is not cloud-testable. Configure per user against the Blossom NetSapiens/Jivetel host.",
    };
  },

  async sync() {
    return {
      ok: false,
      status: "failed",
      message:
        "not_cloud_testable: Go Integrator Nava runs on the user's desktop. Cloud pull-sync is unsupported by design.",
    };
  },

  normalizeWebhook() {
    return { metadata: { note: "go_integrate_nava_has_no_cloud_webhook" } };
  },
};