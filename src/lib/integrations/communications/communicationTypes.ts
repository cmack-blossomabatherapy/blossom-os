/**
 * Communication service types — used by the Intake communication layer
 * to abstract over CTM (call tracking), Jivetel (outbound calling),
 * Mailchimp Email, and Mailchimp SMS.
 *
 * Every action should return a CommunicationResult so the UI can show
 * a consistent "success" / "needs configuration" state without breaking.
 */

export type CommunicationActionType =
  | "call"
  | "sms"
  | "email"
  | "intake-packet"
  | "missing-info-reminder"
  | "vob-update"
  | "general-follow-up";

export type CommunicationProvider =
  | "ctm"
  | "jivetel"
  | "mailchimp-email"
  | "mailchimp-sms"
  | "fallback";

export interface LeadCommunicationContext {
  leadId: string;
  phone?: string | null;
  email?: string | null;
  parentName?: string | null;
  childName?: string | null;
  state?: string | null;
  insurance?: string | null;
}

export interface CommunicationResult {
  success: boolean;
  provider: CommunicationProvider;
  action: CommunicationActionType;
  leadId: string;
  timestamp: string;
  message: string;
  /** True when the underlying integration is not configured yet. */
  needsConfiguration?: boolean;
  /** Which admin integration to set up to fix this. */
  configHint?: string;
  /**
   * True when the action was blocked because Intake is in INGEST_ONLY mode.
   * UI should render this as a neutral "preview only" state rather than an
   * error or missing-config warning.
   */
  previewOnly?: boolean;
}

export type EmailTemplateKey =
  | "intake-packet"
  | "missing-info-reminder"
  | "vob-update"
  | "general-follow-up"
  | "document-request-insurance-card"
  | "document-request-diagnosis"
  | "document-request-consent-form"
  | "document-request-intake-packet"
  | "document-request-generic";

export type SmsTemplateKey =
  | "missing-info-reminder"
  | "appointment-confirmation"
  | "intake-packet-reminder"
  | "general-follow-up";