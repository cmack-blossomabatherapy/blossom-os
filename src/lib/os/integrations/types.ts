/**
 * Blossom OS — Integration backbone types.
 *
 * Shared contracts used by the Admin > Integrations catalog, integration
 * adapters (CentralReach, Viventium, CTM, Retell, etc.), Patient Lifetime
 * Journey events, and the User/Patient Activity surfaces.
 *
 * These types are intentionally framework-agnostic so a future API/sync
 * layer can hydrate them without rewriting consuming pages.
 */

export type IntegrationStatus =
  | "connected"
  | "configured"
  | "planned"
  | "maybe"
  | "not_configured"
  | "needs_attention"
  | "error"
  | "disabled";

export type IntegrationMethod =
  | "api"
  | "webhook"
  | "oauth"
  | "file_import"
  | "manual_upload"
  | "embedded_link"
  | "planned";

export type IntegrationCategory =
  | "clinical_emr"
  | "marketing"
  | "lead_capture"
  | "recruiting"
  | "hris"
  | "eligibility"
  | "documents"
  | "communications"
  | "meetings"
  | "ai_voice"
  | "forms_intake_documents";

export type IntegrationCriticality = "critical" | "standard" | "optional" | "maybe";

export interface BlossomIntegration {
  id: string;
  /** Internal / canonical name. */
  name: string;
  /** Human display label (e.g. "CTM / CallTrackingMetrics"). */
  displayName: string;
  category: IntegrationCategory;
  ownerDepartment: string;
  criticality: IntegrationCriticality;
  status: IntegrationStatus;
  methods: IntegrationMethod[];
  inboundData: string[];
  outboundData: string[];
  dependentModules: string[];
  sourceOfTruthFor: string[];
  notes: string;
  /**
   * Legacy/technical integration retained in the registry for code
   * compatibility (e.g. old Make.com automation bridge events) but hidden
   * from user-facing readiness surfaces. UI code should filter these out
   * by default.
   */
  internalOnly?: boolean;
}

export interface IntegrationSyncRun {
  id: string;
  integrationId: string;
  startedAt: string;
  completedAt?: string;
  status: "success" | "partial" | "failed" | "running";
  recordsReceived?: number;
  recordsUpdated?: number;
  recordsCreated?: number;
  errorMessage?: string;
}

export interface ExternalIdentityLink {
  id: string;
  entityType:
    | "patient"
    | "lead"
    | "employee"
    | "candidate"
    | "provider"
    | "referral_partner";
  blossomId: string;
  integrationId: string;
  externalId: string;
  externalUrl?: string;
  lastVerifiedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Patient Lifetime Journey event sources
// ─────────────────────────────────────────────────────────────────────────────

export type PatientJourneyEventSource =
  | "manual"
  | "ctm"
  | "retell"
  | "leadtrap"
  | "facebook_ads"
  | "google_ads"
  | "mailchimp"
  | "outlook"
  | "centralreach"
  | "eligipro"
  | "solum"
  | "pandadoc"
  | "calendly"
  | "jotform";

export interface PatientJourneyEvent {
  id: string;
  patientOrLeadId: string;
  source: PatientJourneyEventSource;
  /** e.g. "call_received", "vob_complete", "auth_approved" */
  type: string;
  title: string;
  description?: string;
  occurredAt: string;
  actorName?: string;
  externalUrl?: string;
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CentralReach adapter shape
//
// CentralReach remains the EMR. This is the Blossom OS adapter layer for the
// CentralReach API / import pipeline. Concrete implementations may be mock
// today and real API tomorrow without changing consumer code.
// ─────────────────────────────────────────────────────────────────────────────

export interface CRClient {
  id: string;
  externalId: string;
  firstName: string;
  lastName: string;
  state?: string;
  status?: string;
}

export interface CRProvider {
  id: string;
  externalId: string;
  fullName: string;
  role: "BCBA" | "RBT" | "Other";
  state?: string;
}

export interface CRScheduleEvent {
  id: string;
  clientId: string;
  providerId: string;
  startsAt: string;
  endsAt: string;
  serviceCode?: string;
  status?: string;
}

export interface CRAuthorization {
  id: string;
  clientId: string;
  payer: string;
  startsOn: string;
  endsOn: string;
  hoursAuthorized: number;
  hoursUsed: number;
  status: string;
}

export interface CRSession {
  id: string;
  clientId: string;
  providerId: string;
  date: string;
  durationMinutes: number;
  serviceCode: string;
  billed?: boolean;
}

export interface CRCancellation {
  id: string;
  clientId: string;
  providerId?: string;
  date: string;
  reason?: string;
}

export interface CRSupervisionMetric {
  providerId: string;
  periodStart: string;
  periodEnd: string;
  supervisionHours: number;
  requiredHours: number;
}

export interface CRClinicalDocument {
  id: string;
  clientId: string;
  kind: string;
  signedAt?: string;
  url?: string;
}

export interface CentralReachAdapter {
  getClients(): Promise<CRClient[]>;
  getProviders(): Promise<CRProvider[]>;
  getAuthorizations(): Promise<CRAuthorization[]>;
  getScheduleEvents(): Promise<CRScheduleEvent[]>;
  getSessions(): Promise<CRSession[]>;
  getCancellations(): Promise<CRCancellation[]>;
}