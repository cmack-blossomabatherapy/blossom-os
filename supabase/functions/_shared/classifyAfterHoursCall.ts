// Shared classifier for After-Hours AI calls (Retell). Used by both the
// realtime webhook and the historical sync so every row lands in the correct
// department bucket.
export type AfterHoursDept =
  | 'intake'
  | 'scheduling'
  | 'state_director'
  | 'hr'
  | 'urgent';

export function classifyAfterHoursCall(
  reason: string | null | undefined,
  custom: Record<string, any> | null | undefined,
): AfterHoursDept {
  const r = (reason ?? '').toLowerCase();
  const urg = (custom?.urgency_level ?? '').toString().toLowerCase();
  const summary = (custom?.call_summary ?? '').toString().toLowerCase();
  const blob = `${r} ${summary}`;

  if (custom?.emergency_flag === true || urg === 'high' || /emergency|crisis|urgent|safety|911/.test(blob)) {
    return 'urgent';
  }
  if (/complaint|escalat|manager|director|supervisor|unhappy|angry/.test(blob)) {
    return 'state_director';
  }
  if (/schedul|cancel|reschedule|appointment|session time|no.?show|late arriv/.test(blob)) {
    return 'scheduling';
  }
  if (/\bhr\b|payroll|paycheck|benefits|employee|staff (?:issue|question)|job|hiring|apply|application|w-?2|1099/.test(blob)) {
    return 'hr';
  }
  return 'intake';
}