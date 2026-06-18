/**
 * Sprint 12 — Unified Work Queue model.
 *
 * Pure types + helpers describing operational work items across Intake,
 * Marketing, BD, Auth, Scheduling, Staffing, Credentialing, HR, QA,
 * Clinical, State Operations, and Operations Leadership.
 *
 * State Directors monitor and unblock — they are NOT the default executor
 * for normal departmental work. Department ownership is encoded here so
 * future role-scoped views can filter on it without re-modeling.
 */

export type WorkDepartment =
  | "Intake"
  | "Marketing"
  | "Business Development"
  | "Authorizations"
  | "Scheduling"
  | "Staffing"
  | "Credentialing"
  | "HR"
  | "QA"
  | "Clinical"
  | "State Operations"
  | "Operations Leadership"
  | "System";

export type WorkItemStatus =
  | "new"
  | "open"
  | "in_progress"
  | "waiting"
  | "blocked"
  | "escalated"
  | "resolved"
  | "closed"
  | "ignored";

export type WorkItemPriority = "low" | "normal" | "high" | "urgent" | "critical";

export type WorkItemType =
  | "lead_follow_up"
  | "missing_information"
  | "source_review"
  | "auth_issue"
  | "denial_follow_up"
  | "approved_auth_review"
  | "scheduling_gap"
  | "staffing_gap"
  | "credentialing_item"
  | "hr_item"
  | "qa_review"
  | "clinical_risk"
  | "state_escalation"
  | "system_request"
  | "report_review"
  | "general_task";

export type EscalationLevel = 1 | 2 | 3 | 4;

export interface WorkItem {
  id: string;
  title: string;
  description?: string;
  type: WorkItemType;
  department: WorkDepartment;
  ownerId?: string;
  ownerName?: string;
  assignedRole?: string;
  state?: string;
  priority: WorkItemPriority;
  status: WorkItemStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  escalatedAt?: string;
  resolvedAt?: string;
  snoozedUntil?: string;
  relatedLeadId?: string;
  relatedPatientId?: string;
  relatedUserId?: string;
  relatedSourceEventId?: string;
  relatedActivityEventId?: string;
  sourceSystem?: string;
  tags?: string[];
  escalationReason?: string;
  escalationLevel?: EscalationLevel;
  resolutionNotes?: string;
  metadata?: Record<string, unknown>;
}

export const PRIORITY_RANK: Record<WorkItemPriority, number> = {
  critical: 5,
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

/* ---------------------------- Helpers ---------------------------- */

export function normalizeWorkItem(input: Partial<WorkItem>): WorkItem {
  const id = input.id ?? `wi_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    title: input.title ?? "Untitled work item",
    description: input.description,
    type: input.type ?? "general_task",
    department: input.department ?? "Operations Leadership",
    ownerId: input.ownerId,
    ownerName: input.ownerName,
    assignedRole: input.assignedRole,
    state: input.state,
    priority: input.priority ?? "normal",
    status: input.status ?? "open",
    dueDate: input.dueDate,
    createdAt: input.createdAt ?? new Date().toISOString(),
    updatedAt: input.updatedAt ?? input.createdAt ?? new Date().toISOString(),
    escalatedAt: input.escalatedAt,
    resolvedAt: input.resolvedAt,
    snoozedUntil: input.snoozedUntil,
    relatedLeadId: input.relatedLeadId,
    relatedPatientId: input.relatedPatientId,
    relatedUserId: input.relatedUserId,
    relatedSourceEventId: input.relatedSourceEventId,
    relatedActivityEventId: input.relatedActivityEventId,
    sourceSystem: input.sourceSystem,
    tags: input.tags ?? [],
    escalationReason: input.escalationReason,
    escalationLevel: input.escalationLevel,
    resolutionNotes: input.resolutionNotes,
    metadata: input.metadata,
  };
}

export function getWorkItemPriority(item: WorkItem): WorkItemPriority {
  if (item.priority === "critical" || item.priority === "urgent") return item.priority;
  if (isWorkItemOverdue(item)) return item.priority === "low" ? "normal" : "high";
  return item.priority;
}

export function getWorkItemAgeDays(item: WorkItem): number {
  const start = new Date(item.createdAt).getTime();
  return Math.max(0, Math.floor((Date.now() - start) / 86_400_000));
}

export type DueStatus = "no_due_date" | "due_today" | "due_soon" | "overdue" | "future";

export function getWorkItemDueStatus(item: WorkItem): DueStatus {
  if (!item.dueDate) return "no_due_date";
  const due = new Date(item.dueDate).getTime();
  const now = Date.now();
  const dayMs = 86_400_000;
  if (due < now - dayMs / 2) return "overdue";
  if (due < now + dayMs) return "due_today";
  if (due < now + 3 * dayMs) return "due_soon";
  return "future";
}

export function isWorkItemOverdue(item: WorkItem): boolean {
  if (item.status === "resolved" || item.status === "closed" || item.status === "ignored")
    return false;
  return getWorkItemDueStatus(item) === "overdue";
}

export function isWorkItemEscalated(item: WorkItem): boolean {
  return item.status === "escalated" || Boolean(item.escalatedAt);
}

export function getRecommendedWorkAction(item: WorkItem): string {
  if (item.status === "resolved" || item.status === "closed") return "Archive";
  if (item.status === "escalated") return "Review escalation";
  if (item.status === "blocked") return "Unblock or escalate";
  if (item.status === "waiting") return "Check status";
  if (isWorkItemOverdue(item)) return "Take action now";
  if (item.status === "new") return "Triage and assign";
  switch (item.type) {
    case "lead_follow_up":
      return "Contact family";
    case "missing_information":
      return "Collect missing item";
    case "source_review":
      return "Review source event";
    case "auth_issue":
      return "Resolve auth blocker";
    case "denial_follow_up":
      return "Appeal or document";
    case "scheduling_gap":
      return "Cover open hours";
    case "staffing_gap":
      return "Match staff to client";
    case "credentialing_item":
      return "Submit credential update";
    case "hr_item":
      return "Complete HR step";
    case "qa_review":
      return "Review documentation";
    case "clinical_risk":
      return "Engage clinical lead";
    case "state_escalation":
      return "Coordinate with State Director";
    default:
      return "Make progress";
  }
}

export function getDepartmentOwnerLabel(department: WorkDepartment): string {
  switch (department) {
    case "Intake":
      return "Intake owns this work";
    case "Marketing":
      return "Marketing owns campaigns, source performance, and source follow-up";
    case "Business Development":
      return "BD owns referral relationships and community follow-up";
    case "Authorizations":
      return "Authorizations owns auth submission, missing documents, and denials";
    case "Scheduling":
      return "Scheduling owns coverage coordination";
    case "Staffing":
      return "Staffing owns placement and availability matching";
    case "Credentialing":
      return "Credentialing owns BCBA/provider/payer readiness";
    case "HR":
      return "HR owns people operations and onboarding";
    case "QA":
      return "QA owns documentation quality and supervision review";
    case "Clinical":
      return "Clinical leadership owns clinical risk and BCBA support";
    case "State Operations":
      return "State Directors monitor and unblock — not default executor";
    case "Operations Leadership":
      return "Operations Leadership owns cross-department flow";
    case "System":
      return "System / platform";
  }
}

export function getEscalationLevel(item: WorkItem): EscalationLevel {
  if (item.escalationLevel) return item.escalationLevel;
  if (item.priority === "critical") return 4;
  if (item.priority === "urgent") return 3;
  if (item.state) return 3;
  return 2;
}

/** Who should see the escalation, in order. State Directors are visibility-only
 *  unless the escalation has clear state impact. */
export function getEscalationRoute(item: WorkItem): string[] {
  const level = getEscalationLevel(item);
  const route = [item.department, "Operations Leadership"];
  if (level >= 3 && item.state) route.splice(1, 0, "State Operations");
  if (level >= 4) route.push("Executive / Super Admin");
  return route;
}

/* ---------------------------- Filtering ---------------------------- */

export interface WorkItemFilters {
  search?: string;
  department?: WorkDepartment | "all";
  ownerId?: string;
  ownerName?: string;
  state?: string | "all";
  priority?: WorkItemPriority | "all";
  status?: WorkItemStatus | "all" | "active";
  type?: WorkItemType | "all";
  due?: "all" | "today" | "overdue" | "soon";
  view?: "all" | "my" | "department" | "escalations" | "overdue";
  currentUserId?: string;
  currentDepartment?: WorkDepartment;
}

export function filterWorkItems(items: WorkItem[], filters: WorkItemFilters): WorkItem[] {
  const q = filters.search?.trim().toLowerCase();
  return items.filter((i) => {
    if (filters.view === "my" && filters.currentUserId && i.ownerId !== filters.currentUserId)
      return false;
    if (
      filters.view === "department" &&
      filters.currentDepartment &&
      i.department !== filters.currentDepartment
    )
      return false;
    if (filters.view === "escalations" && !isWorkItemEscalated(i)) return false;
    if (filters.view === "overdue" && !isWorkItemOverdue(i)) return false;
    if (filters.department && filters.department !== "all" && i.department !== filters.department)
      return false;
    if (filters.ownerId && i.ownerId !== filters.ownerId) return false;
    if (filters.state && filters.state !== "all" && (i.state ?? "") !== filters.state) return false;
    if (filters.priority && filters.priority !== "all" && i.priority !== filters.priority)
      return false;
    if (filters.status && filters.status !== "all") {
      if (filters.status === "active") {
        if (i.status === "resolved" || i.status === "closed" || i.status === "ignored")
          return false;
      } else if (i.status !== filters.status) return false;
    }
    if (filters.type && filters.type !== "all" && i.type !== filters.type) return false;
    if (filters.due === "overdue" && !isWorkItemOverdue(i)) return false;
    if (filters.due === "today" && getWorkItemDueStatus(i) !== "due_today") return false;
    if (filters.due === "soon" && getWorkItemDueStatus(i) !== "due_soon") return false;
    if (q) {
      const hay = [
        i.title,
        i.description,
        i.ownerName,
        i.department,
        i.state,
        i.tags?.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function sortWorkItemsByUrgency(items: WorkItem[]): WorkItem[] {
  return [...items].sort((a, b) => {
    const escA = isWorkItemEscalated(a) ? 1 : 0;
    const escB = isWorkItemEscalated(b) ? 1 : 0;
    if (escA !== escB) return escB - escA;
    const ovA = isWorkItemOverdue(a) ? 1 : 0;
    const ovB = isWorkItemOverdue(b) ? 1 : 0;
    if (ovA !== ovB) return ovB - ovA;
    const pr = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
    if (pr !== 0) return pr;
    const dueA = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
    const dueB = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
    return dueA - dueB;
  });
}

export function groupWorkItemsByDepartment(
  items: WorkItem[],
): { department: WorkDepartment; items: WorkItem[] }[] {
  const map = new Map<WorkDepartment, WorkItem[]>();
  for (const i of items) {
    const arr = map.get(i.department) ?? [];
    arr.push(i);
    map.set(i.department, arr);
  }
  return Array.from(map, ([department, items]) => ({
    department,
    items: sortWorkItemsByUrgency(items),
  }));
}

export function groupWorkItemsByState(
  items: WorkItem[],
): { state: string; items: WorkItem[] }[] {
  const map = new Map<string, WorkItem[]>();
  for (const i of items) {
    const key = i.state ?? "Unassigned";
    const arr = map.get(key) ?? [];
    arr.push(i);
    map.set(key, arr);
  }
  return Array.from(map, ([state, items]) => ({
    state,
    items: sortWorkItemsByUrgency(items),
  }));
}

/* ---------------------------- Seed ---------------------------- */

export function seedWorkItems(): WorkItem[] {
  const now = Date.now();
  const at = (mins: number) => new Date(now - mins * 60_000).toISOString();
  const due = (hours: number) => new Date(now + hours * 3_600_000).toISOString();
  const items: Partial<WorkItem>[] = [
    {
      title: "Follow up with parent — Jaden Howard (GA)",
      description: "Parent left voicemail; intake follow-up scheduled and overdue.",
      type: "lead_follow_up",
      department: "Intake",
      ownerName: "Maria Lopez",
      state: "GA",
      priority: "high",
      status: "open",
      dueDate: due(-4),
      relatedLeadId: "L-2018",
      createdAt: at(60 * 26),
      tags: ["intake", "voicemail"],
    },
    {
      title: "Missing insurance card — NC lead",
      description: "Need front/back of card to start VOB.",
      type: "missing_information",
      department: "Intake",
      ownerName: "Sasha Long",
      state: "NC",
      priority: "normal",
      status: "waiting",
      dueDate: due(20),
      relatedLeadId: "L-1972",
      createdAt: at(60 * 12),
    },
    {
      title: "Review CTM after-hours call",
      description: "Inbound call from GA needs lead triage and dedupe.",
      type: "source_review",
      department: "Marketing",
      ownerName: "Marketing Ops",
      state: "GA",
      priority: "high",
      status: "new",
      dueDate: due(6),
      createdAt: at(60 * 2),
      sourceSystem: "CTM / CallTrackingMetrics",
    },
    {
      title: "Pediatrician referral partner follow-up",
      description: "Quarterly relationship check with Dr. Patel office.",
      type: "general_task",
      department: "Business Development",
      ownerName: "BD Team",
      state: "NC",
      priority: "normal",
      status: "open",
      dueDate: due(48),
      createdAt: at(60 * 18),
    },
    {
      title: "PR missing — AUTH-1042 cannot submit",
      description: "Treatment plan PR not finalized; auth submission blocked.",
      type: "auth_issue",
      department: "Authorizations",
      ownerName: "Auth Team",
      state: "GA",
      priority: "urgent",
      status: "blocked",
      dueDate: due(-12),
      createdAt: at(60 * 36),
      tags: ["auth", "blocker"],
    },
    {
      title: "Denial follow-up — Aetna reauth",
      description: "Denied for medical necessity; appeal due in 7 days.",
      type: "denial_follow_up",
      department: "Authorizations",
      ownerName: "Auth Team",
      state: "GA",
      priority: "high",
      status: "in_progress",
      dueDate: due(96),
      createdAt: at(60 * 8),
    },
    {
      title: "Scheduling gap — Ava Kim (Tue/Thu PM)",
      type: "scheduling_gap",
      department: "Scheduling",
      ownerName: "Devon Ross",
      state: "NC",
      priority: "high",
      status: "open",
      dueDate: due(24),
      createdAt: at(60 * 5),
    },
    {
      title: "No RBT match — Sophia Reyes",
      description: "Hard-to-staff; 14 days unstaffed.",
      type: "staffing_gap",
      department: "Staffing",
      ownerName: "Staffing Lead",
      state: "NC",
      priority: "critical",
      status: "escalated",
      escalatedAt: at(60 * 2),
      escalationLevel: 3,
      escalationReason: "Family at risk of churn after 14 days unstaffed.",
      relatedLeadId: "L-1990",
      dueDate: due(-24),
      createdAt: at(60 * 24 * 14),
      tags: ["staffing", "churn-risk"],
    },
    {
      title: "BCBA payer credential expiring — BCBS",
      description: "Credential expires in 21 days; need re-attestation.",
      type: "credentialing_item",
      department: "Credentialing",
      ownerName: "Credentialing Team",
      state: "GA",
      priority: "high",
      status: "open",
      dueDate: due(24 * 14),
      createdAt: at(60 * 24 * 2),
    },
    {
      title: "Onboarding document missing — new RBT",
      type: "hr_item",
      department: "HR",
      ownerName: "HR Team",
      state: "GA",
      priority: "normal",
      status: "open",
      dueDate: due(48),
      createdAt: at(60 * 30),
    },
    {
      title: "QA documentation review overdue — Liam P.",
      type: "qa_review",
      department: "QA",
      ownerName: "Ashley Tran",
      state: "GA",
      priority: "high",
      status: "open",
      dueDate: due(-6),
      createdAt: at(60 * 24 * 3),
    },
    {
      title: "Supervision risk flagged — Marc Vega",
      description: "Supervision % below threshold across last two weeks.",
      type: "clinical_risk",
      department: "Clinical",
      ownerName: "Clinical Lead",
      state: "NC",
      priority: "urgent",
      status: "escalated",
      escalatedAt: at(60 * 12),
      escalationLevel: 3,
      escalationReason: "Supervision % below threshold; potential billing risk.",
      dueDate: due(24),
      createdAt: at(60 * 24 * 4),
    },
    {
      title: "State escalation — GA cross-department stuck case",
      description: "Auth + scheduling stuck for 9 days; needs State Director unblock.",
      type: "state_escalation",
      department: "State Operations",
      ownerName: "GA State Director",
      state: "GA",
      priority: "critical",
      status: "escalated",
      escalatedAt: at(60 * 6),
      escalationLevel: 4,
      escalationReason: "Cross-department ownership unclear; family churn risk.",
      dueDate: due(12),
      createdAt: at(60 * 24 * 9),
    },
  ];
  return items.map(normalizeWorkItem);
}