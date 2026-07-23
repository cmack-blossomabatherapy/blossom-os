/**
 * Provider Readiness Manifest — Slice 3.
 *
 * Truthful, static mirror of the server-side provider adapter registry
 * (`supabase/functions/_shared/integrations/providerRegistry.ts`). Kept in
 * `src/` so the browser can render a Super Admin readiness view without
 * bundling Deno adapters. A parity test in
 * `src/test/providerReadinessManifest.test.ts` enforces the mirror stays
 * in lock-step with the adapter capabilities.
 *
 * IMPORTANT: This module never exposes secret VALUES — only credential
 * NAMES and honest capability flags. Sync capability declared here MUST
 * be executed as `dryRun` from the UI (see `IntegrationsReadiness.tsx`).
 */

export type ReadinessLabel =
  | "connected"
  | "ingest_only"
  | "ready_to_configure"
  | "needs_credentials"
  | "vendor_docs_required"
  | "manual_local"
  | "retired";

export interface ProviderReadinessEntry {
  id: string;
  displayName: string;
  classification: string;
  /** Retired = removed from active registry; kept for history-only. */
  retired?: boolean;
  requiredSecrets: string[];
  optionalSecrets: string[];
  capabilities: {
    probe: boolean;
    pullSync: boolean;
    webhook: boolean;
    oauth: boolean;
    localOnly: boolean;
    outboundDisabled: boolean;
    documentationUrl: string;
    /** Free-form adapter-declared state, e.g. `ingest_only`, `vendor_docs_required`. */
    operationalState?: string;
  };
}

export const PROVIDER_READINESS_MANIFEST: ProviderReadinessEntry[] = [
  {
    id: "mailchimp",
    displayName: "Mailchimp",
    classification: "email_marketing",
    requiredSecrets: ["MAILCHIMP_API_KEY", "MAILCHIMP_SERVER_PREFIX"],
    optionalSecrets: [],
    capabilities: {"probe": true, "pullSync": true, "webhook": true, "oauth": false, "localOnly": false, "outboundDisabled": true, "documentationUrl": "https://mailchimp.com/developer/marketing/api/", "operationalState": "ingest_only"},
  },
  {
    id: "resend",
    displayName: "Resend",
    classification: "transactional_email_preserved",
    requiredSecrets: ["RESEND_API_KEY"],
    optionalSecrets: ["RESEND_WEBHOOK_SIGNING_SECRET"],
    capabilities: {"probe": true, "pullSync": false, "webhook": true, "oauth": false, "localOnly": false, "outboundDisabled": false, "documentationUrl": "https://resend.com/docs/api-reference/introduction", "operationalState": "report_only"},
  },
  {
    id: "retell",
    displayName: "Retell AI",
    classification: "ai_voice",
    requiredSecrets: ["RETELL_API_KEY"],
    optionalSecrets: ["RETELL_WEBHOOK_SECRET"],
    capabilities: {"probe": true, "pullSync": true, "webhook": true, "oauth": false, "localOnly": false, "outboundDisabled": true, "documentationUrl": "https://docs.retellai.com/", "operationalState": "ingest_only"},
  },
  {
    id: "ctm",
    displayName: "CallTrackingMetrics (CTM)",
    classification: "phone_call_tracking",
    requiredSecrets: ["CTM_API_KEY", "CTM_WEBHOOK_SECRET"],
    optionalSecrets: ["CTM_API_BASE_URL", "CTM_ACCOUNT_ID", "CTM_PROBE_PATH"],
    capabilities: {"probe": true, "pullSync": true, "webhook": true, "oauth": false, "localOnly": false, "outboundDisabled": true, "documentationUrl": "https://developers.calltrackingmetrics.com/", "operationalState": "ingest_only"},
  },
  {
    id: "apploi",
    displayName: "Apploi",
    classification: "recruiting_ats",
    requiredSecrets: ["APPLOI_API_KEY"],
    optionalSecrets: ["APPLOI_API_BASE_URL", "APPLOI_PROBE_PATH", "APPLOI_CANDIDATES_PATH"],
    capabilities: {"probe": true, "pullSync": true, "webhook": true, "oauth": false, "localOnly": false, "outboundDisabled": true, "documentationUrl": "https://developers.apploi.com/", "operationalState": "read_only"},
  },
  {
    id: "centralreach",
    displayName: "CentralReach (Enhanced API)",
    classification: "clinical_emr",
    requiredSecrets: ["CENTRALREACH_CLIENT_ID", "CENTRALREACH_CLIENT_SECRET", "CENTRALREACH_API_BASE_URL"],
    optionalSecrets: ["CENTRALREACH_TOKEN_URL", "CENTRALREACH_PROBE_PATH", "CENTRALREACH_SCOPE"],
    capabilities: {"probe": true, "pullSync": true, "webhook": false, "oauth": false, "localOnly": false, "outboundDisabled": true, "documentationUrl": "https://developers.centralreach.com/", "operationalState": "ingest_only"},
  },
  {
    id: "solum",
    displayName: "Solom / Solum (VOB)",
    classification: "eligibility_vob",
    requiredSecrets: ["SOLUM_API_KEY"],
    optionalSecrets: ["SOLUM_API_BASE_URL", "SOLUM_PROBE_PATH", "SOLOM_API_KEY"],
    capabilities: {"probe": true, "pullSync": false, "webhook": true, "oauth": false, "localOnly": false, "outboundDisabled": true, "documentationUrl": "https://solumhealth.com/", "operationalState": "vendor_docs_required"},
  },
  {
    id: "eligipro",
    displayName: "Eligipro",
    classification: "eligibility",
    requiredSecrets: ["ELIGIPRO_API_KEY"],
    optionalSecrets: ["ELIGIPRO_API_BASE_URL", "ELIGIPRO_PROBE_PATH"],
    capabilities: {"probe": true, "pullSync": false, "webhook": true, "oauth": false, "localOnly": false, "outboundDisabled": true, "documentationUrl": "https://www.eligipro.com/", "operationalState": "vendor_docs_required"},
  },
  {
    id: "ms365",
    displayName: "Microsoft 365 (Graph)",
    classification: "productivity_calendar_mail",
    requiredSecrets: ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET", "MICROSOFT_TENANT_ID", "MICROSOFT_REDIRECT_URI", "OAUTH_TOKEN_ENCRYPTION_KEY"],
    optionalSecrets: [],
    capabilities: {"probe": true, "pullSync": true, "webhook": false, "oauth": true, "localOnly": false, "outboundDisabled": true, "documentationUrl": "https://learn.microsoft.com/graph/api/overview", "operationalState": "per_user_oauth"},
  },
  {
    id: "jivetel",
    displayName: "Jivetel / NetSapiens",
    classification: "phone_system",
    requiredSecrets: ["JIVETEL_API_KEY"],
    optionalSecrets: ["JIVETEL_API_BASE_URL", "JIVETEL_PROBE_PATH"],
    capabilities: {"probe": true, "pullSync": false, "webhook": true, "oauth": false, "localOnly": false, "outboundDisabled": true, "documentationUrl": "https://docs.netsapiens.com/", "operationalState": "ingest_only"},
  },
  {
    id: "make",
    displayName: "Make.com (migration bridge)",
    classification: "automation_bridge",
    requiredSecrets: ["MAKE_WEBHOOK_SECRET", "MAKE_OUTBOUND_WEBHOOK_URL"],
    optionalSecrets: [],
    capabilities: {"probe": true, "pullSync": false, "webhook": true, "oauth": false, "localOnly": false, "outboundDisabled": false, "documentationUrl": "https://www.make.com/en/api-documentation", "operationalState": "migration_bridge"},
  },
  {
    id: "jotform",
    displayName: "Jotform",
    classification: "forms_intake_documents",
    requiredSecrets: ["JOTFORM_API_KEY", "JOTFORM_API_BASE_URL", "JOTFORM_WEBHOOK_TOKEN"],
    optionalSecrets: ["JOTFORM_FORM_IDS", "JOTFORM_FORM_PURPOSES_JSON", "JOTFORM_FIELD_MAP_JSON"],
    capabilities: {"probe": true, "pullSync": true, "webhook": true, "oauth": false, "localOnly": false, "outboundDisabled": true, "documentationUrl": "https://api.jotform.com/docs/", "operationalState": "ingest_only"},
  },
  {
    id: "calendly",
    displayName: "Calendly",
    classification: "scheduling",
    requiredSecrets: ["CALENDLY_CLIENT_ID", "CALENDLY_CLIENT_SECRET", "CALENDLY_WEBHOOK_SIGNING_KEY"],
    optionalSecrets: ["CALENDLY_ACCESS_TOKEN", "CALENDLY_API_BASE_URL", "CALENDLY_PROBE_PATH", "CALENDLY_ORGANIZATION_URI"],
    capabilities: {"probe": true, "pullSync": true, "webhook": true, "oauth": true, "localOnly": false, "outboundDisabled": true, "documentationUrl": "https://developer.calendly.com/api-docs/", "operationalState": "ingest_only"},
  },
  {
    id: "go-integrate-nava",
    displayName: "Go Integrator Nava",
    classification: "communications_desktop_cti",
    requiredSecrets: [],
    optionalSecrets: [],
    capabilities: {"probe": false, "pullSync": false, "webhook": false, "oauth": false, "localOnly": true, "outboundDisabled": true, "documentationUrl": "https://help.nava.gointegrator.com/help?item=2505&lang=us&version=4.2", "operationalState": "manual_local_setup"},
  },
  {
    id: "viventium",
    displayName: "Viventium",
    classification: "hris",
    requiredSecrets: ["VIVENTIUM_USERNAME", "VIVENTIUM_PASSWORD", "VIVENTIUM_COMPANY_CODE", "VIVENTIUM_DIVISION_CODE"],
    optionalSecrets: ["VIVENTIUM_BASE_URL"],
    capabilities: {"probe": true, "pullSync": true, "webhook": false, "oauth": false, "localOnly": false, "outboundDisabled": true, "documentationUrl": "https://www.viventium.com/", "operationalState": "ingest_only"},
  },
  {
    id: "google-ads",
    displayName: "Google Ads",
    classification: "marketing_ads",
    requiredSecrets: ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN"],
    optionalSecrets: ["GOOGLE_ADS_LOGIN_CUSTOMER_ID", "GOOGLE_ADS_CUSTOMER_ID", "GOOGLE_ADS_ACCESS_LEVEL"],
    capabilities: {"probe": true, "pullSync": true, "webhook": false, "oauth": true, "localOnly": false, "outboundDisabled": true, "documentationUrl": "https://developers.google.com/google-ads/api/docs/start", "operationalState": "vendor_docs_required"},
  },
  {
    id: "meta-ads",
    displayName: "Meta Ads",
    classification: "marketing_ads",
    requiredSecrets: ["META_ADS_ACCESS_TOKEN", "META_ADS_AD_ACCOUNT_ID"],
    optionalSecrets: ["META_ADS_API_VERSION"],
    capabilities: {"probe": true, "pullSync": true, "webhook": false, "oauth": true, "localOnly": false, "outboundDisabled": true, "documentationUrl": "https://developers.facebook.com/docs/marketing-api/", "operationalState": "ingest_only"},
  },
  {
    id: "fathom",
    displayName: "Fathom Analytics",
    classification: "web_analytics",
    requiredSecrets: ["FATHOM_API_KEY"],
    optionalSecrets: ["FATHOM_SITE_ID"],
    capabilities: {"probe": true, "pullSync": true, "webhook": false, "oauth": false, "localOnly": false, "outboundDisabled": true, "documentationUrl": "https://usefathom.com/api", "operationalState": "ingest_only"},
  },
  {
    id: "bloomgrowth",
    displayName: "Bloom Growth",
    classification: "operations_l10",
    requiredSecrets: ["BLOOMGROWTH_API_KEY"],
    optionalSecrets: ["BLOOMGROWTH_ORG_ID", "BLOOMGROWTH_API_BASE_URL"],
    capabilities: {"probe": true, "pullSync": false, "webhook": false, "oauth": false, "localOnly": false, "outboundDisabled": true, "documentationUrl": "https://www.bloomgrowth.com/", "operationalState": "vendor_docs_required"},
  },
  {
    id: "leadtrap",
    displayName: "LeadTrap (retired)",
    classification: "forms_intake_documents",
    retired: true,
    requiredSecrets: [],
    optionalSecrets: [],
    capabilities: { probe: false, pullSync: false, webhook: false, oauth: false, localOnly: false, outboundDisabled: true, documentationUrl: "https://leadtrap.io/", operationalState: "retired" },
  },
  {
    id: "pandadoc",
    displayName: "PandaDoc (retired)",
    classification: "esign_documents",
    retired: true,
    requiredSecrets: [],
    optionalSecrets: [],
    capabilities: { probe: false, pullSync: false, webhook: false, oauth: false, localOnly: false, outboundDisabled: true, documentationUrl: "https://developers.pandadoc.com/", operationalState: "retired" },
  },
] = [
  {
    id: "jotform",
    displayName: "Jotform",
    classification: "forms_intake_documents",
    requiredSecrets: ["JOTFORM_API_KEY", "JOTFORM_API_BASE_URL", "JOTFORM_WEBHOOK_TOKEN"],
    optionalSecrets: ["JOTFORM_FORM_IDS", "JOTFORM_FORM_PURPOSES_JSON", "JOTFORM_FIELD_MAP_JSON"],
    capabilities: {
      probe: true, pullSync: true, webhook: true, oauth: false, localOnly: false,
      outboundDisabled: true, documentationUrl: "https://api.jotform.com/docs/",
      operationalState: "ingest_only",
    },
  },
  {
    id: "centralreach",
    displayName: "CentralReach (Enhanced API)",
    classification: "clinical_emr",
    requiredSecrets: ["CENTRALREACH_CLIENT_ID", "CENTRALREACH_CLIENT_SECRET", "CENTRALREACH_API_BASE_URL"],
    optionalSecrets: ["CENTRALREACH_SCOPE", "CENTRALREACH_TOKEN_URL"],
    capabilities: {
      probe: true, pullSync: true, webhook: false, oauth: true, localOnly: false,
      outboundDisabled: true, documentationUrl: "https://developers.centralreach.com/",
      operationalState: "ingest_only",
    },
  },
  {
    id: "viventium",
    displayName: "Viventium",
    classification: "hris",
    requiredSecrets: ["VIVENTIUM_USERNAME", "VIVENTIUM_PASSWORD", "VIVENTIUM_COMPANY_CODE", "VIVENTIUM_DIVISION_CODE"],
    optionalSecrets: ["VIVENTIUM_BASE_URL"],
    capabilities: {
      probe: true, pullSync: true, webhook: false, oauth: false, localOnly: false,
      outboundDisabled: true, documentationUrl: "https://www.viventium.com/",
      operationalState: "ingest_only",
    },
  },
  {
    id: "apploi",
    displayName: "Apploi",
    classification: "recruiting_ats",
    requiredSecrets: ["APPLOI_API_KEY"],
    optionalSecrets: ["APPLOI_API_BASE_URL"],
    capabilities: {
      probe: true, pullSync: true, webhook: true, oauth: false, localOnly: false,
      outboundDisabled: true, documentationUrl: "https://developers.apploi.com/",
      operationalState: "ingest_only",
    },
  },
  {
    id: "ms365",
    displayName: "Microsoft 365 (Graph)",
    classification: "productivity_calendar_mail",
    requiredSecrets: ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET", "MICROSOFT_TENANT_ID", "MICROSOFT_REDIRECT_URI", "OAUTH_TOKEN_ENCRYPTION_KEY"],
    optionalSecrets: [],
    capabilities: {
      probe: true, pullSync: true, webhook: true, oauth: true, localOnly: false,
      outboundDisabled: true, documentationUrl: "https://learn.microsoft.com/en-us/graph/overview",
      operationalState: "ingest_only",
    },
  },
  {
    id: "calendly",
    displayName: "Calendly",
    classification: "scheduling",
    requiredSecrets: ["CALENDLY_CLIENT_ID", "CALENDLY_CLIENT_SECRET", "CALENDLY_WEBHOOK_SIGNING_KEY"],
    optionalSecrets: ["CALENDLY_ORGANIZATION_URI", "CALENDLY_API_BASE_URL"],
    capabilities: {
      probe: true, pullSync: true, webhook: true, oauth: true, localOnly: false,
      outboundDisabled: true, documentationUrl: "https://developer.calendly.com/",
      operationalState: "ingest_only",
    },
  },
  {
    id: "ctm",
    displayName: "CallTrackingMetrics (CTM)",
    classification: "phone_call_tracking",
    requiredSecrets: ["CTM_API_KEY", "CTM_WEBHOOK_SECRET"],
    optionalSecrets: ["CTM_API_BASE_URL", "CTM_ACCOUNT_ID", "CTM_PROBE_PATH"],
    capabilities: {
      probe: true, pullSync: true, webhook: true, oauth: false, localOnly: false,
      outboundDisabled: true, documentationUrl: "https://developers.calltrackingmetrics.com/",
      operationalState: "ingest_only",
    },
  },
  {
    id: "retell",
    displayName: "Retell AI",
    classification: "ai_voice",
    requiredSecrets: ["RETELL_API_KEY"],
    optionalSecrets: ["RETELL_WEBHOOK_SECRET"],
    capabilities: {
      probe: true, pullSync: true, webhook: true, oauth: false, localOnly: false,
      outboundDisabled: true, documentationUrl: "https://docs.retellai.com/",
      operationalState: "ingest_only",
    },
  },
  {
    id: "jivetel",
    displayName: "Jivetel / NetSapiens",
    classification: "phone_system",
    requiredSecrets: ["JIVETEL_API_KEY"],
    optionalSecrets: ["JIVETEL_API_BASE_URL", "JIVETEL_PROBE_PATH"],
    capabilities: {
      probe: true, pullSync: false, webhook: true, oauth: false, localOnly: false,
      outboundDisabled: true, documentationUrl: "https://docs.netsapiens.com/",
      operationalState: "ingest_only",
    },
  },
  {
    id: "solum",
    displayName: "Solom / Solum (VOB)",
    classification: "eligibility_vob",
    requiredSecrets: ["SOLUM_API_KEY"],
    optionalSecrets: ["SOLUM_API_BASE_URL", "SOLUM_PROBE_PATH", "SOLOM_API_KEY"],
    capabilities: {
      probe: true, pullSync: false, webhook: true, oauth: false, localOnly: false,
      outboundDisabled: true, documentationUrl: "https://solumhealth.com/",
      operationalState: "vendor_docs_required",
    },
  },
  {
    id: "eligipro",
    displayName: "Eligipro",
    classification: "eligibility",
    requiredSecrets: ["ELIGIPRO_API_KEY"],
    optionalSecrets: ["ELIGIPRO_API_BASE_URL", "ELIGIPRO_PROBE_PATH"],
    capabilities: {
      probe: true, pullSync: false, webhook: true, oauth: false, localOnly: false,
      outboundDisabled: true, documentationUrl: "https://www.eligipro.com/",
      operationalState: "vendor_docs_required",
    },
  },
  {
    id: "mailchimp",
    displayName: "Mailchimp",
    classification: "email_marketing",
    requiredSecrets: ["MAILCHIMP_API_KEY", "MAILCHIMP_SERVER_PREFIX"],
    optionalSecrets: ["MAILCHIMP_AUDIENCE_ID"],
    capabilities: {
      probe: true, pullSync: true, webhook: true, oauth: false, localOnly: false,
      outboundDisabled: true, documentationUrl: "https://mailchimp.com/developer/marketing/api/",
      operationalState: "ingest_only",
    },
  },
  {
    id: "resend",
    displayName: "Resend",
    classification: "transactional_email_preserved",
    requiredSecrets: ["RESEND_API_KEY"],
    optionalSecrets: ["RESEND_WEBHOOK_SIGNING_SECRET"],
    capabilities: {
      probe: true, pullSync: false, webhook: true, oauth: false, localOnly: false,
      outboundDisabled: true, documentationUrl: "https://resend.com/docs",
      operationalState: "report_only",
    },
  },
  {
    id: "make",
    displayName: "Make.com (migration bridge)",
    classification: "automation_bridge",
    requiredSecrets: ["MAKE_WEBHOOK_SECRET", "MAKE_OUTBOUND_WEBHOOK_URL"],
    optionalSecrets: [],
    capabilities: {
      probe: true, pullSync: false, webhook: true, oauth: false, localOnly: false,
      outboundDisabled: false, documentationUrl: "https://www.make.com/en/api-documentation",
      operationalState: "migration_bridge",
    },
  },
  {
    id: "go-integrate-nava",
    displayName: "Go Integrator Nava",
    classification: "communications_desktop_cti",
    requiredSecrets: ["GO_INTEGRATE_NAVA_API_KEY"],
    optionalSecrets: ["GO_INTEGRATE_NAVA_WEBHOOK_SECRET"],
    capabilities: {
      probe: false, pullSync: false, webhook: false, oauth: false, localOnly: true,
      outboundDisabled: true, documentationUrl: "https://www.mondago.com/go-integrator-nava/",
      operationalState: "manual_local_setup",
    },
  },
  {
    id: "google-ads",
    displayName: "Google Ads",
    classification: "marketing_ads",
    requiredSecrets: ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN"],
    optionalSecrets: ["GOOGLE_ADS_LOGIN_CUSTOMER_ID", "GOOGLE_ADS_CUSTOMER_ID", "GOOGLE_ADS_ACCESS_LEVEL"],
    capabilities: {
      probe: true, pullSync: true, webhook: false, oauth: true, localOnly: false,
      outboundDisabled: true, documentationUrl: "https://developers.google.com/google-ads/api/docs/start",
      operationalState: "vendor_docs_required",
    },
  },
  {
    id: "meta-ads",
    displayName: "Meta Ads",
    classification: "marketing_ads",
    requiredSecrets: ["META_ADS_ACCESS_TOKEN", "META_ADS_AD_ACCOUNT_ID"],
    optionalSecrets: ["META_ADS_API_VERSION"],
    capabilities: {
      probe: true, pullSync: true, webhook: false, oauth: true, localOnly: false,
      outboundDisabled: true, documentationUrl: "https://developers.facebook.com/docs/marketing-api/",
      operationalState: "ingest_only",
    },
  },
  {
    id: "fathom",
    displayName: "Fathom Analytics",
    classification: "web_analytics",
    requiredSecrets: ["FATHOM_API_KEY"],
    optionalSecrets: ["FATHOM_SITE_ID"],
    capabilities: {
      probe: true, pullSync: true, webhook: false, oauth: false, localOnly: false,
      outboundDisabled: true, documentationUrl: "https://usefathom.com/api",
      operationalState: "ingest_only",
    },
  },
  {
    id: "bloomgrowth",
    displayName: "Bloom Growth",
    classification: "operations_l10",
    requiredSecrets: ["BLOOMGROWTH_API_KEY"],
    optionalSecrets: ["BLOOMGROWTH_ORG_ID", "BLOOMGROWTH_API_BASE_URL"],
    capabilities: {
      probe: true, pullSync: false, webhook: false, oauth: false, localOnly: false,
      outboundDisabled: true, documentationUrl: "https://www.bloomgrowth.com/",
      operationalState: "vendor_docs_required",
    },
  },
  // -- Retired: kept for history only --
  {
    id: "leadtrap",
    displayName: "LeadTrap (retired)",
    classification: "forms_intake_documents",
    retired: true,
    requiredSecrets: [],
    optionalSecrets: [],
    capabilities: {
      probe: false, pullSync: false, webhook: false, oauth: false, localOnly: false,
      outboundDisabled: true, documentationUrl: "https://leadtrap.io/",
      operationalState: "retired",
    },
  },
  {
    id: "pandadoc",
    displayName: "PandaDoc (retired)",
    classification: "esign_documents",
    retired: true,
    requiredSecrets: [],
    optionalSecrets: [],
    capabilities: {
      probe: false, pullSync: false, webhook: false, oauth: false, localOnly: false,
      outboundDisabled: true, documentationUrl: "https://developers.pandadoc.com/",
      operationalState: "retired",
    },
  },
];

export interface ReadinessRuntimeState {
  connectionStatus?: string | null;
  lastSuccessAt?: string | null;
  lastErrorAt?: string | null;
  lastError?: string | null;
  lastSyncAt?: string | null;
  lastSyncStatus?: string | null;
  /** Names of required secrets known to be present. Names only — never values. */
  presentRequiredSecrets?: string[];
}

/**
 * Compute the single truthful readiness label + next action from the
 * manifest entry and (optional) runtime state. Ordering is deliberate:
 * retired ▸ manual_local ▸ vendor_docs_required ▸ needs_credentials
 * ▸ connected ▸ ingest_only ▸ ready_to_configure.
 */
export function deriveReadiness(
  entry: ProviderReadinessEntry,
  runtime: ReadinessRuntimeState = {},
): { label: ReadinessLabel; nextAction: string } {
  if (entry.retired) {
    return { label: "retired", nextAction: "Retired — no configuration required." };
  }
  if (entry.capabilities.localOnly) {
    return {
      label: "manual_local",
      nextAction: "Install the local desktop client — cloud probe/sync not applicable.",
    };
  }
  if (entry.capabilities.operationalState === "vendor_docs_required") {
    return {
      label: "vendor_docs_required",
      nextAction: `Obtain vendor endpoint + auth docs. See ${entry.capabilities.documentationUrl}.`,
    };
  }
  const missing = entry.requiredSecrets.filter(
    (name) => !(runtime.presentRequiredSecrets ?? []).includes(name),
  );
  if (entry.requiredSecrets.length > 0 && runtime.presentRequiredSecrets !== undefined && missing.length > 0) {
    return {
      label: "needs_credentials",
      nextAction: `Add secret(s): ${missing.join(", ")}.`,
    };
  }
  if (runtime.connectionStatus === "connected" || runtime.lastSuccessAt) {
    return {
      label: entry.capabilities.operationalState === "ingest_only" ? "ingest_only" : "connected",
      nextAction: "No action required. Read-only ingest is active.",
    };
  }
  if (entry.requiredSecrets.length > 0 && runtime.presentRequiredSecrets === undefined) {
    // No visibility into secret presence — treat as ready to configure.
    return {
      label: "ready_to_configure",
      nextAction: `Configure required credentials: ${entry.requiredSecrets.join(", ")}.`,
    };
  }
  return {
    label: "ready_to_configure",
    nextAction: entry.capabilities.probe
      ? "Run Test Connection to verify credentials."
      : `Follow ${entry.capabilities.documentationUrl} to complete setup.`,
  };
}

export const READINESS_LABELS: Record<ReadinessLabel, { text: string; tone: "emerald" | "sky" | "amber" | "rose" | "slate" | "violet" }> = {
  connected: { text: "Connected", tone: "emerald" },
  ingest_only: { text: "Ingest-only", tone: "sky" },
  ready_to_configure: { text: "Ready to configure", tone: "violet" },
  needs_credentials: { text: "Needs credentials", tone: "amber" },
  vendor_docs_required: { text: "Needs vendor docs", tone: "amber" },
  manual_local: { text: "Manual local", tone: "slate" },
  retired: { text: "Retired", tone: "slate" },
};
