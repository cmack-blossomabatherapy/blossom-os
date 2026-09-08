/**
 * Clinic Operations metrics (staff-facing, `clinic-operations`).
 *
 * Sources: the curated `report_billing_facts` (delivered hours) and
 * `v_cr_schedule_current` (scheduled hours, cancellations, timesheet
 * conversion) snapshots, grouped by clinic via the shared
 * `clinicNormalizer` helpers. Current authorization fields are read only
 * where the source can prove them (never a fabricated capacity number).
 *
 * Deliberate boundaries:
 * - This is NOT a capacity, staffing-coverage, census, or utilization report.
 *   None of those concepts are provable from the current exports — see
 *   `CLINIC_OPS_DATA_GAP_NOTE`.
 * - Cancellations and timesheet-conversion status use the shared
 *   `scheduleTruth` rules so this report never disagrees with another
 *   scheduling report about what "cancelled" or "converted" means.
 * - A session only counts toward "elapsed, unconverted" when its event date
 *   is strictly before the caller-supplied `today` — a future session is
 *   simply not due for conversion yet, never "unconverted".
 */
import type { ReportBillingFactRow, CrScheduleCurrentRow } from "../types";
import {
  CLINIC_OTHER,
  CLINIC_PEACHTREE,
  CLINIC_RIVERDALE,
  clinicKeyOf,
  clinicLabelOf,
  matchesClinicScope,
  type ClinicKey,
} from "./clinicNormalizer";
import { buildClientIdentityResolver, type ClientIdentityInput } from "./clientIdentity";
import {
  eventDurationHours,
  isCancelledEventStrict,
  isConvertedToTimesheet,
  isDeletedEvent,
} from "../scheduleTruth";
import { CODE_DIRECT, CODE_SUPERVISION, CODE_PARENT_TRAINING, normalizeCode } from "./codes";
import { finiteNumberOrNull } from "./numeric";

export const CLINIC_OPS_DATA_GAP_NOTE =
  "This report cannot measure clinic capacity, staffing coverage, client census, or utilization. Those would require an authoritative clinic capacity/room roster, a staff assignment roster, and a client census/enrollment feed — none of which are present in the CentralReach exports this report reads.";

export interface ClinicOpsBillingInput {
  dateOfService: string | null;
  procedureCode: string | null;
  hours: number | null;
  clientName: string | null;
  clientCrId: string | null;
  providerName: string | null;
  location: string | null;
  isVoid: boolean | null;
  deleted: boolean | null;
}

export interface ClinicOpsScheduleInput {
  eventDate: string | null;
  startTime: string | null;
  endTime: string | null;
  serviceCode: string | null;
  scheduledHours: number | null;
  clientName: string | null;
  clientCrId: string | null;
  providerName: string | null;
  location: string | null;
  status: string | null;
  attendance: string | null;
  cancelled: boolean | null;
  deleted: boolean | null;
  convertedToTimesheet: boolean | null;
  cancellationReason: string | null;
}

export function projectBillingFact(r: ReportBillingFactRow): ClinicOpsBillingInput {
  return {
    dateOfService: r.date_of_service,
    procedureCode: r.procedure_code,
    hours: r.hours,
    clientName: r.client_name,
    clientCrId: r.client_cr_id ?? null,
    providerName: r.provider_name,
    location: r.location,
    isVoid: r.is_void,
    deleted: r.deleted,
  };
}

export function projectScheduleCurrent(r: CrScheduleCurrentRow): ClinicOpsScheduleInput {
  return {
    eventDate: r.event_date,
    startTime: r.start_time,
    endTime: r.end_time,
    serviceCode: r.service_code ?? r.procedure_code ?? r.billing_code,
    scheduledHours: r.scheduled_hours,
    clientName: r.client_name,
    clientCrId: r.client_cr_id ?? null,
    providerName: r.provider_name,
    location: r.location,
    status: r.status,
    attendance: r.attendance,
    cancelled: r.cancelled,
    deleted: r.deleted,
    convertedToTimesheet: r.converted_to_timesheet,
    cancellationReason: r.cancellation_reason,
  };
}

export interface ClinicCodeMix {
  key: string;
  label: string;
  hours: number;
}

export interface ClinicSummary {
  clinicKey: ClinicKey;
  clinicLabel: string;
  activeClients: number;
  providers: number;
  deliveredHours: number;
  upcomingScheduledHours: number;
  strictCancellations: number;
  elapsedUnconverted: number;
  codeMix: ClinicCodeMix[];
}

export interface ActionQueueRow {
  key: string;
  kind: "unconverted" | "cancelled";
  date: string | null;
  clinicKey: ClinicKey;
  clinicLabel: string;
  client: string;
  provider: string;
  hours: number;
  reason: string | null;
}

export interface ClinicOperationsMetrics {
  activeClients: number;
  providers: number;
  deliveredHours: number;
  upcomingScheduledHours: number;
  strictCancellations: number;
  elapsedUnconverted: number;
  codeMix: ClinicCodeMix[];
  clinics: ClinicSummary[];
  actionQueue: ActionQueueRow[];
  /** True when the selected window extends beyond the schedule snapshot coverage. */
  scheduleCoverageIncomplete: boolean;
  dataQualityWarnings: string[];
}

const CODE_LABELS: Record<string, string> = {
  [CODE_DIRECT]: "97153 — Direct",
  [CODE_SUPERVISION]: "97155 — Supervision",
  [CODE_PARENT_TRAINING]: "97156 — Parent Training",
};

function codeLabel(code: string): string {
  return CODE_LABELS[code] ?? (code ? code : "Undocumented code");
}

function name(v: string | null | undefined): string {
  const s = String(v ?? "").trim();
  return s || "Unknown";
}

export interface ClinicOperationsInput {
  billing: ClinicOpsBillingInput[];
  schedule: ClinicOpsScheduleInput[];
  clinicScope: ClinicKey | "all";
  /** Local `YYYY-MM-DD`. Elapsed = event date strictly before this. */
  today: string;
  /** `v_cr_schedule_current` coverage end from freshness, if known. */
  scheduleCoverageEnd: string | null;
  /** `v_cr_schedule_current` coverage start from freshness, if known. */
  scheduleCoverageStart?: string | null;
  /** Selected filter window end (`filters.to`), if set. */
  windowTo: string | null;
  /** Selected filter window start (`filters.from`), if set. */
  windowFrom?: string | null;
}

export function computeClinicOperations(input: ClinicOperationsInput): ClinicOperationsMetrics {
  const { clinicScope, today } = input;

  const billing = input.billing.filter(
    (r) => !r.isVoid && !r.deleted && matchesClinicScope(r.location, clinicScope),
  );
  const schedule = input.schedule.filter(
    (r) => !isDeletedEvent({ deleted: r.deleted, status: r.status }) && matchesClinicScope(r.location, clinicScope),
  );

  const identityInputs: ClientIdentityInput[] = [
    ...billing.map((r) => ({ clientName: r.clientName, clientCrId: r.clientCrId })),
    ...schedule.map((r) => ({ clientName: r.clientName, clientCrId: r.clientCrId })),
  ];
  const resolver = buildClientIdentityResolver(identityInputs);

  const clinicAgg = new Map<
    ClinicKey,
    {
      clients: Set<string>;
      providers: Set<string>;
      deliveredHours: number;
      upcomingScheduledHours: number;
      strictCancellations: number;
      elapsedUnconverted: number;
      codeMix: Map<string, number>;
    }
  >();
  const getAgg = (key: ClinicKey) => {
    let agg = clinicAgg.get(key);
    if (!agg) {
      agg = {
        clients: new Set(),
        providers: new Set(),
        deliveredHours: 0,
        upcomingScheduledHours: 0,
        strictCancellations: 0,
        elapsedUnconverted: 0,
        codeMix: new Map(),
      };
      clinicAgg.set(key, agg);
    }
    return agg;
  };

  const overallCodeMix = new Map<string, number>();
  const actionQueue: ActionQueueRow[] = [];

  for (const r of billing) {
    const key = clinicKeyOf(r.location);
    const agg = getAgg(key);
    const hours = finiteNumberOrNull(r.hours) ?? 0;
    agg.deliveredHours += hours;
    agg.clients.add(resolver.keyFor(r.clientCrId, r.clientName));
    const provider = name(r.providerName);
    if (provider !== "Unknown") agg.providers.add(provider);

    const code = normalizeCode(r.procedureCode);
    if (code) {
      agg.codeMix.set(code, (agg.codeMix.get(code) ?? 0) + hours);
      overallCodeMix.set(code, (overallCodeMix.get(code) ?? 0) + hours);
    }
  }

  for (const r of schedule) {
    const key = clinicKeyOf(r.location);
    const agg = getAgg(key);
    agg.clients.add(resolver.keyFor(r.clientCrId, r.clientName));
    const provider = name(r.providerName);
    if (provider !== "Unknown") agg.providers.add(provider);

    const truthRow = {
      event_date: r.eventDate,
      start_time: r.startTime,
      end_time: r.endTime,
      scheduled_hours: r.scheduledHours,
      status: r.status,
      attendance: r.attendance,
      cancelled: r.cancelled,
      deleted: r.deleted,
      converted_to_timesheet: r.convertedToTimesheet,
      cancellation_reason: r.cancellationReason,
    };
    const hours = eventDurationHours(truthRow);
    const isFuture = !!r.eventDate && r.eventDate >= today;
    const cancelled = isCancelledEventStrict(truthRow);

    if (cancelled) {
      agg.strictCancellations += 1;
      actionQueue.push({
        key: `cancelled-${r.eventDate}-${r.clientCrId ?? r.clientName}-${actionQueue.length}`,
        kind: "cancelled",
        date: r.eventDate,
        clinicKey: key,
        clinicLabel: clinicLabelOf(r.location),
        client: name(r.clientName),
        provider: name(r.providerName),
        hours,
        reason: r.cancellationReason?.trim() || null,
      });
      continue;
    }

    if (isFuture) {
      agg.upcomingScheduledHours += hours;
    } else {
      // Elapsed, kept session: only an EXPLICITLY false conversion flag counts
      // as unconverted work. A null/unknown flag is not evidence of a missing
      // timesheet, so it is excluded rather than counted against the provider.
      const conversionKnown = r.convertedToTimesheet != null;
      const converted = isConvertedToTimesheet(truthRow);
      if (conversionKnown && !converted) {
        agg.elapsedUnconverted += 1;
        actionQueue.push({
          key: `unconverted-${r.eventDate}-${r.clientCrId ?? r.clientName}-${actionQueue.length}`,
          kind: "unconverted",
          date: r.eventDate,
          clinicKey: key,
          clinicLabel: clinicLabelOf(r.location),
          client: name(r.clientName),
          provider: name(r.providerName),
          hours,
          reason: null,
        });
      }
    }
  }

  const clinics: ClinicSummary[] = [...clinicAgg.entries()]
    .map(([clinicKey, agg]) => ({
      clinicKey,
      clinicLabel:
        clinicKey === "riverdale" ? CLINIC_RIVERDALE : clinicKey === "peachtree_corners" ? CLINIC_PEACHTREE : CLINIC_OTHER,
      activeClients: agg.clients.size,
      providers: agg.providers.size,
      deliveredHours: Math.round(agg.deliveredHours * 100) / 100,
      upcomingScheduledHours: Math.round(agg.upcomingScheduledHours * 100) / 100,
      strictCancellations: agg.strictCancellations,
      elapsedUnconverted: agg.elapsedUnconverted,
      codeMix: [...agg.codeMix.entries()]
        .map(([code, hours]) => ({ key: code, label: codeLabel(code), hours: Math.round(hours * 100) / 100 }))
        .sort((a, b) => b.hours - a.hours),
    }))
    .sort((a, b) => a.clinicLabel.localeCompare(b.clinicLabel));

  // Largest actionable backlog first: unconverted hours, then cancellation count.
  actionQueue.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "unconverted" ? -1 : 1;
    return b.hours - a.hours;
  });

  const totalActiveClients = new Set(
    [...billing, ...schedule].map((r) => resolver.keyFor(r.clientCrId, r.clientName)),
  ).size;
  const totalProviders = new Set(
    [...billing, ...schedule]
      .map((r) => name(r.providerName))
      .filter((n) => n !== "Unknown"),
  ).size;
  const totalDelivered = billing.reduce((s, r) => s + (finiteNumberOrNull(r.hours) ?? 0), 0);
  const totalUpcoming = clinics.reduce((s, c) => s + c.upcomingScheduledHours, 0);
  const totalCancellations = clinics.reduce((s, c) => s + c.strictCancellations, 0);
  const totalUnconverted = clinics.reduce((s, c) => s + c.elapsedUnconverted, 0);

  const endsAfterCoverage = !!(
    input.windowTo && input.scheduleCoverageEnd && input.windowTo > input.scheduleCoverageEnd
  );
  const startsBeforeCoverage = !!(
    input.windowFrom &&
    input.scheduleCoverageStart &&
    input.windowFrom < input.scheduleCoverageStart
  );
  const scheduleCoverageIncomplete = endsAfterCoverage || startsBeforeCoverage;

  const warnings = [CLINIC_OPS_DATA_GAP_NOTE];
  if (scheduleCoverageIncomplete) {
    const bounds = [
      input.scheduleCoverageStart ? `from ${input.scheduleCoverageStart}` : null,
      input.scheduleCoverageEnd ? `through ${input.scheduleCoverageEnd}` : null,
    ]
      .filter(Boolean)
      .join(" ");
    warnings.push(
      `The selected date range falls outside the scheduling snapshot coverage (${bounds}). Upcoming scheduled hours, cancellations, and timesheet-conversion status are incomplete for dates outside that window.`,
    );
  }

  return {
    activeClients: totalActiveClients,
    providers: totalProviders,
    deliveredHours: Math.round(totalDelivered * 100) / 100,
    upcomingScheduledHours: Math.round(totalUpcoming * 100) / 100,
    strictCancellations: totalCancellations,
    elapsedUnconverted: totalUnconverted,
    codeMix: [...overallCodeMix.entries()]
      .map(([code, hours]) => ({ key: code, label: codeLabel(code), hours: Math.round(hours * 100) / 100 }))
      .sort((a, b) => b.hours - a.hours),
    clinics,
    actionQueue,
    scheduleCoverageIncomplete,
    dataQualityWarnings: warnings,
  };
}
