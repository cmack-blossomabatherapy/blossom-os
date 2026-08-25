/**
 * Payment Reconciliation metrics (finance-staff facing).
 *
 * Sources: the curated `v_cr_payments_current` and `v_cr_era_reconciliation`
 * snapshots.
 *
 * Deliberate boundaries:
 * - **No money.** Payment and remittance amount units are unconfirmed in the
 *   CentralReach exports, so volume and coverage are reported in counts and
 *   dates only. Never render or estimate a dollar figure from these sources.
 * - **No raw identifiers.** Check numbers, payment references and notes are
 *   restricted and never selected into the curated views this module reads.
 * - **No inferred exceptions.** A payment is only "applied" when the source row
 *   proves a billing-entry link; a remittance only carries a reconcile status
 *   when the source states it. Everything else is "Not documented".
 * - This is a reconciliation-status surface, not a revenue-cycle or denial
 *   dashboard.
 */

import type { CrEraReconciliationRow, CrPaymentCurrentRow } from "../types";
import { validDay } from "./authorizationActions";
import { finiteNumberOrNull } from "./numeric";

export const PAYMENT_AMOUNT_SUPPRESSION_NOTE =
  "Payment and remittance amounts are hidden: the CentralReach exports do not confirm the unit of their amount columns, so no dollar value or total can be stated honestly here.";

export const NOT_DOCUMENTED = "Not documented";

export type PaymentApplicationState =
  | "Applied to a billing entry"
  | "Not applied"
  | typeof NOT_DOCUMENTED;

export interface PaymentRow {
  key: string;
  recordDate: string | null;
  dateOfService: string | null;
  client: string;
  payor: string;
  department: string;
  paymentType: string;
  location: string;
  labels: string;
  isCopay: boolean | null;
  voided: boolean | null;
  application: PaymentApplicationState;
}

export type EraReconcileState =
  | "Fully reconciled"
  | "Partially reconciled"
  | "Not reconciled"
  | "Over reconciled"
  | typeof NOT_DOCUMENTED;

export interface EraRow {
  key: string;
  receivedDate: string | null;
  payor: string;
  labels: string;
  claimCount: number | null;
  clientCount: number | null;
  reconcileState: EraReconcileState;
  sourceStatus: string;
}

export interface ReconciliationBucket {
  key: string;
  name: string;
  count: number;
}

export interface PaymentReconciliationMetrics {
  totalPayments: number;
  paymentsCoverageStart: string | null;
  paymentsCoverageEnd: string | null;
  paymentDateNotDocumented: number;
  appliedPayments: number;
  unappliedPayments: number;
  applicationNotDocumented: number;
  voidedPayments: number;
  copayPayments: number;
  paymentTypeMix: ReconciliationBucket[];
  paymentPayors: ReconciliationBucket[];
  paymentRows: PaymentRow[];
  /** Payments the source proves are not applied to a billing entry. */
  unappliedQueue: PaymentRow[];

  totalEraRemittances: number;
  eraClaimsCovered: number | null;
  eraFully: number;
  eraPartially: number;
  eraNone: number;
  eraOver: number;
  eraNotDocumented: number;
  eraStatusMix: ReconciliationBucket[];
  eraRows: EraRow[];
  /** Remittances the source proves are unreconciled or over-reconciled. */
  eraExceptionQueue: EraRow[];

  dataQualityWarnings: string[];
}

const text = (value: unknown, fallback = NOT_DOCUMENTED): string => {
  if (value == null) return fallback;
  const s = String(value).trim();
  return s ? s : fallback;
};

/**
 * Maps a raw CentralReach reconcile status to one of the four documented ERA
 * states. Anything unrecognised stays `Not documented` — never guessed.
 */
export function normalizeEraStatus(raw: unknown): EraReconcileState {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return NOT_DOCUMENTED;
  if (s.includes("over")) return "Over reconciled";
  if (s.includes("full") || s === "reconciled" || s === "complete") return "Fully reconciled";
  if (s.includes("partial")) return "Partially reconciled";
  if (s.includes("none") || s.includes("not reconciled") || s === "unreconciled") {
    return "Not reconciled";
  }
  return NOT_DOCUMENTED;
}

function bucket<T>(rows: T[], pick: (row: T) => string): ReconciliationBucket[] {
  const map = new Map<string, ReconciliationBucket>();
  for (const row of rows) {
    const name = pick(row);
    const key = name.toLowerCase();
    const entry = map.get(key) ?? { key, name, count: 0 };
    entry.count += 1;
    map.set(key, entry);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function computePaymentReconciliation(
  payments: CrPaymentCurrentRow[],
  era: CrEraReconciliationRow[],
): PaymentReconciliationMetrics {
  const paymentRows: PaymentRow[] = payments.map((r, index) => ({
    key: r.id ?? r.source_row_id ?? `payment-${index}`,
    recordDate: validDay(r.record_date) ?? validDay(r.creation_date),
    dateOfService: validDay(r.date_of_service),
    client: text(r.client_name),
    payor: text(r.payor),
    department: text(r.department),
    paymentType: text(r.payment_type),
    location: text(r.primary_location),
    labels: text(r.payment_labels),
    isCopay: r.is_copay ?? null,
    voided: r.is_voided ?? null,
    application:
      r.applied_to_billing_entry == null
        ? NOT_DOCUMENTED
        : r.applied_to_billing_entry
          ? "Applied to a billing entry"
          : "Not applied",
  }));

  const dates = paymentRows
    .map((r) => r.recordDate)
    .filter((d): d is string => d != null)
    .sort();

  const eraRows: EraRow[] = era.map((r, index) => ({
    key: r.id ?? r.source_row_id ?? `era-${index}`,
    receivedDate: validDay(r.received_date),
    payor: text(r.payor),
    labels: text(r.era_labels),
    claimCount: finiteNumberOrNull(r.claim_count),
    clientCount: finiteNumberOrNull(r.client_count),
    reconcileState: normalizeEraStatus(r.reconcile_status),
    sourceStatus: text(r.reconcile_status),
  }));

  const eraClaimNumbers = eraRows
    .map((r) => r.claimCount)
    .filter((n): n is number => n != null);

  const warnings: string[] = [PAYMENT_AMOUNT_SUPPRESSION_NOTE];
  const noPaymentDate = paymentRows.filter((r) => r.recordDate == null).length;
  if (noPaymentDate > 0) {
    warnings.push(
      `${noPaymentDate} payment${noPaymentDate === 1 ? " has" : "s have"} no usable posting date in the source and are excluded from date coverage.`,
    );
  }
  const noApplication = paymentRows.filter((r) => r.application === NOT_DOCUMENTED).length;
  if (noApplication > 0) {
    warnings.push(
      `${noApplication} payment${noApplication === 1 ? " does" : "s do"} not state a billing-entry link, so they are not counted as applied or unapplied.`,
    );
  }
  const noEraStatus = eraRows.filter((r) => r.reconcileState === NOT_DOCUMENTED).length;
  if (noEraStatus > 0) {
    warnings.push(
      `${noEraStatus} remittance${noEraStatus === 1 ? " has" : "s have"} no recognised reconcile status and are not counted as an exception.`,
    );
  }

  return {
    totalPayments: paymentRows.length,
    paymentsCoverageStart: dates[0] ?? null,
    paymentsCoverageEnd: dates[dates.length - 1] ?? null,
    paymentDateNotDocumented: noPaymentDate,
    appliedPayments: paymentRows.filter((r) => r.application === "Applied to a billing entry")
      .length,
    unappliedPayments: paymentRows.filter((r) => r.application === "Not applied").length,
    applicationNotDocumented: noApplication,
    voidedPayments: paymentRows.filter((r) => r.voided === true).length,
    copayPayments: paymentRows.filter((r) => r.isCopay === true).length,
    paymentTypeMix: bucket(paymentRows, (r) => r.paymentType),
    paymentPayors: bucket(paymentRows, (r) => r.payor),
    paymentRows,
    unappliedQueue: paymentRows.filter((r) => r.application === "Not applied"),

    totalEraRemittances: eraRows.length,
    eraClaimsCovered: eraClaimNumbers.length
      ? eraClaimNumbers.reduce((a, b) => a + b, 0)
      : null,
    eraFully: eraRows.filter((r) => r.reconcileState === "Fully reconciled").length,
    eraPartially: eraRows.filter((r) => r.reconcileState === "Partially reconciled").length,
    eraNone: eraRows.filter((r) => r.reconcileState === "Not reconciled").length,
    eraOver: eraRows.filter((r) => r.reconcileState === "Over reconciled").length,
    eraNotDocumented: noEraStatus,
    eraStatusMix: bucket(eraRows, (r) => r.reconcileState),
    eraRows,
    eraExceptionQueue: eraRows.filter(
      (r) =>
        r.reconcileState === "Not reconciled" ||
        r.reconcileState === "Partially reconciled" ||
        r.reconcileState === "Over reconciled",
    ),

    dataQualityWarnings: warnings,
  };
}
