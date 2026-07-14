/**
 * Shared helpers for mapping a task (or any linked record) to the correct
 * detail-drawer deep link across Blossom OS. Keeps deep-link URLs consistent
 * with the Company Home event drawer and other cross-record surfaces.
 */

export type RelatedRecordType =
  | "lead"
  | "client"
  | "authorization"
  | "auth"
  | "assessment"
  | "qa"
  | "qa_review"
  | "employee"
  | "candidate"
  | "task";

export interface RelatedRecordRef {
  related_record_type?: string | null;
  related_record_id?: string | null;
  related_record_label?: string | null;
  related_url?: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  lead: "Lead",
  client: "Client",
  authorization: "Authorization",
  auth: "Authorization",
  assessment: "Assessment",
  qa: "QA Review",
  qa_review: "QA Review",
  employee: "Employee",
  candidate: "Candidate",
  task: "Task",
};

export function relatedRecordTypeLabel(type?: string | null): string | null {
  if (!type) return null;
  return TYPE_LABEL[type.toLowerCase()] ?? type;
}

/**
 * Resolve a canonical deep-link URL for a related record.
 * Honors an explicit `related_url` first, then falls back to a type/id map
 * that opens the correct detail drawer.
 */
export function resolveRelatedRecordHref(ref: RelatedRecordRef): string | null {
  if (ref.related_url && ref.related_url.trim()) return ref.related_url;
  const type = (ref.related_record_type ?? "").toLowerCase();
  const id = ref.related_record_id;
  if (!type || !id) return null;
  const eid = encodeURIComponent(id);
  switch (type) {
    case "lead":
      return `/leads?view=pipeline&lead=${eid}`;
    case "client":
      return `/os/clients?client=${eid}`;
    case "authorization":
    case "auth":
      return `/os/authorizations?authId=${eid}`;
    case "assessment":
      return `/os/assessments?assessment=${eid}`;
    case "qa":
    case "qa_review":
      return `/qa-workspace?review=${eid}`;
    case "employee":
      return `/user-management?user=${eid}`;
    case "candidate":
      return `/os/recruiting?candidate=${eid}`;
    case "task":
      return `/tasks?task=${eid}`;
    default:
      return null;
  }
}

/** Human-readable chip label such as "Lead · Ava Chen" or "Authorization". */
export function relatedRecordChipLabel(ref: RelatedRecordRef): string | null {
  const typeLabel = relatedRecordTypeLabel(ref.related_record_type);
  if (!typeLabel && !ref.related_record_label) return null;
  if (ref.related_record_label && typeLabel) {
    return `${typeLabel} · ${ref.related_record_label}`;
  }
  return ref.related_record_label ?? typeLabel ?? null;
}