export type Employee = {
  extension: string;
  name?: string;
  department?: string;
  role?: string;
};

export type CallQueue = {
  queue: string;
  state: string;
  timeframe: string;
  agents: string[];
  voicemail: string;
  routing: string;
};

export type SharedDeptCategory =
  | "HR"
  | "Scheduling"
  | "General Inquiries"
  | "Overflow"
  | "After Hours";

export type SharedRouting = {
  id: string;
  department: string;
  category: SharedDeptCategory;
  extension: string;
  businessHoursRouting: string;
  afterHoursRouting: string;
  agents: string[];
  priority: number;
  backupPath?: string;
};

export type StateDirectoryEntry = {
  state: string;
  direct: string;
  mainAA: string;
  intakeRouting: string;
};

export type RequestStatus =
  | "Draft"
  | "Submitted"
  | "Approved"
  | "Sent to Telecom"
  | "Updated"
  | "Test Call Complete"
  | "Reverted"
  | "Closed";

export type RoutingType =
  | "CQ"
  | "Shared Routing"
  | "HR"
  | "Scheduling"
  | "Inquiry"
  | "Overflow"
  | "After Hours"
  | "Auto Attendant"
  | "Ring Group"
  | "Voicemail";

export type ImpactRow = {
  sourceId: string;
  routingType: RoutingType;
  name: string;
  state?: string;
  timeframe?: string;
  currentExtension: string;
  newExtension: string;
  priority?: number;
  rollbackRequired: boolean;
  selected: boolean;
  notes?: string;
};

export type RollbackItem = { key: string; label: string; done: boolean };

export type RequestRoutingScope = "Call Queue" | "Shared Department Routing" | "Both";

export type AuditEntry = { at: string; actor: string; action: string; detail?: string };

export type ChangeRequest = {
  id: string;
  submittedBy: string;
  dateSubmitted: string;
  urgency: "Normal" | "Urgent" | "Emergency";
  reason: "PTO" | "Sick" | "Coverage" | "Staffing" | "Other";
  employeeOut: string;
  currentExtension: string;
  newExtension: string;
  backupExtension?: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timeZone: string;
  notes: string;
  routingScope: RequestRoutingScope;
  sharedCategories: SharedDeptCategory[];
  affectedRouting: ImpactRow[];
  status: RequestStatus;
  rollbackItems: RollbackItem[];
  revertedBy?: string;
  revertNotes?: string;
  vendorTicketNumber?: string;
  vendorChangeEmailSentAt?: string;
  vendorRollbackEmailSentAt?: string;
  auditLog?: AuditEntry[];
};

export type AdminSettings = {
  vendorEmail: string;
  vendorName: string;
  vendorSupportNotes: string;
  opsEmail: string;
  mainNumberPrimary: string;
  mainNumberSecondary: string;
  afterHoursNumber: string;
  retellEnabled: boolean;
  mondayBoardUrl: string;
  makeScenarioUrl: string;
  voicemailEmails: {
    GA: string;
    NC: string;
    TN: string;
    VA: string;
    MD: string;
    main: string;
  };
  businessHours: {
    adminWeekday: string;   // Mon–Thu
    adminFriday: string;    // Fri
    directorsWeekday: string;
    directorsFriday: string;
  };
  teamsWebhookUrl: string;
  slackWebhookUrl: string;
  autoRollbackEnabled: boolean;
};

export type CoverageTemplate = {
  id: string;
  name: string;
  description?: string;
  backupExtension: string;
  sharedCategories: SharedDeptCategory[];
  scope: RequestRoutingScope;
};

export type HolidayProfile = {
  id: string;
  name: string;
  date: string;
  afterHoursMessage: string;
  routeAllTo: string;
};

export const DEFAULT_SETTINGS: AdminSettings = {
  vendorEmail: "support@jivetel.com",
  vendorName: "Jivetel Support",
  vendorSupportNotes:
    "Call Jivetel and choose Option 2 (Tech Support). Ask for Shane.",
  opsEmail: "ops@blossomabatherapy.com",
  mainNumberPrimary: "1-877-315-1069",
  mainNumberSecondary: "732-730-7505",
  afterHoursNumber: "732-612-0376",
  retellEnabled: true,
  mondayBoardUrl: "",
  makeScenarioUrl: "",
  voicemailEmails: {
    GA:   "gaintakes@blossomabatherapy.com",
    NC:   "ncintakes@blossomabatherapy.com",
    TN:   "tnintakes@blossomabatherapy.com",
    VA:   "vaintakes@blossomabatherapy.com",
    MD:   "mdintakes@blossomabatherapy.com",
    main: "intake@blossomabatherapy.com",
  },
  businessHours: {
    adminWeekday:     "Mon–Thu 9:00 AM – 2:00 PM",
    adminFriday:      "Fri 9:00 AM – 12:00 PM",
    directorsWeekday: "Mon–Thu 9:00 AM – 4:30 PM",
    directorsFriday:  "Fri 9:00 AM – 12:00 PM",
  },
  teamsWebhookUrl: "",
  slackWebhookUrl: "",
  autoRollbackEnabled: true,
};

export const SEED_COVERAGE_TEMPLATES: CoverageTemplate[] = [
  {
    id: "CT-AFT-FLOAT",
    name: "Afternoon Floater Coverage",
    description: "Route afternoon queues to floater 132 with shared intake fallback.",
    backupExtension: "111",
    sharedCategories: [],
    scope: "Call Queue",
  },
  {
    id: "CT-HR-OUT",
    name: "HR Out — Route to Voicemail",
    description: "When 146 is out, send HR (602) to VM602 and forward after-hours.",
    backupExtension: "VM602",
    sharedCategories: ["HR"],
    scope: "Shared Department Routing",
  },
];

export const SEED_HOLIDAY_PROFILES: HolidayProfile[] = [
  {
    id: "HP-XMAS",
    name: "Christmas Day",
    date: "2026-12-25",
    afterHoursMessage: "Our offices are closed for the holiday. Please call back tomorrow.",
    routeAllTo: "732-612-0376",
  },
  {
    id: "HP-JUL4",
    name: "Independence Day",
    date: "2026-07-04",
    afterHoursMessage: "Our offices are closed today. We will return next business day.",
    routeAllTo: "732-612-0376",
  },
];

// Real Blossom extensions. Names intentionally left blank — fill in via Admin
// Settings as people are assigned. Departments/roles reflect actual routing.
export const SEED_EMPLOYEES: Employee[] = [
  { extension: "109", department: "VA Intake",          role: "Intake Agent" },
  { extension: "111", department: "Shared Intake",      role: "Intake Agent (Day)" },
  { extension: "112", department: "TN Intake",          role: "Intake Agent (Backup)" },
  { extension: "114", department: "Scheduling",         role: "Scheduling" },
  { extension: "125", department: "Shared Intake",      role: "Intake Agent (Day)" },
  { extension: "131", department: "VA Intake",          role: "Intake Agent (Primary)" },
  { extension: "132", department: "Afternoon Floater",  role: "Afternoon Coverage" },
  { extension: "134", department: "TN Intake",          role: "Intake Agent (Primary)" },
  { extension: "146", department: "HR",                 role: "HR" },
];

export const SEED_QUEUES: CallQueue[] = [
  { queue: "9106", state: "MD", timeframe: "Day", agents: ["111", "125"], voicemail: "VM9106", routing: "5009 MD Intake" },
  { queue: "9107", state: "MD", timeframe: "Afternoon", agents: ["132"], voicemail: "VM9106", routing: "5009 MD Intake" },
  { queue: "9108", state: "GA", timeframe: "Day", agents: ["111", "125"], voicemail: "VM9108", routing: "5010 GA Intake" },
  { queue: "9109", state: "GA", timeframe: "Afternoon", agents: ["132"], voicemail: "VM9108", routing: "5010 GA Intake" },
  { queue: "9112", state: "NC", timeframe: "Day", agents: ["111", "125"], voicemail: "VM9112", routing: "5011 NC Intake" },
  { queue: "9113", state: "NC", timeframe: "Afternoon", agents: ["132"], voicemail: "VM9112", routing: "5011 NC Intake" },
  { queue: "9116", state: "TN", timeframe: "Day", agents: ["134", "112"], voicemail: "VM9116", routing: "5012 TN Intake" },
  { queue: "9117", state: "TN", timeframe: "Afternoon", agents: ["132"], voicemail: "VM9116", routing: "5012 TN Intake" },
  { queue: "9114", state: "VA", timeframe: "Day", agents: ["131", "109"], voicemail: "VM9114", routing: "5013 VA Intake" },
  { queue: "9115", state: "VA", timeframe: "Afternoon", agents: ["132"], voicemail: "VM9114", routing: "5013 VA Intake" },
  { queue: "9105", state: "Shared", timeframe: "Business Hours", agents: ["111", "125"], voicemail: "N/A", routing: "604 General Inquiries" },
];

export const SEED_SHARED: SharedRouting[] = [
  { id: "SR-HR-602", department: "HR", category: "HR", extension: "602", businessHoursRouting: "146", afterHoursRouting: "732-612-0376", agents: ["146"], priority: 1, backupPath: "Voicemail VM602" },
  { id: "SR-SCH-603", department: "Scheduling", category: "Scheduling", extension: "603", businessHoursRouting: "114", afterHoursRouting: "N/A", agents: ["114"], priority: 1, backupPath: "Voicemail VM603" },
  { id: "SR-GEN-604", department: "General Inquiries", category: "General Inquiries", extension: "604", businessHoursRouting: "9105 (Agents 111, 125)", afterHoursRouting: "732-612-0376", agents: ["111", "125"], priority: 1, backupPath: "Overflow → 605" },
];

export const STATE_DIRECTORY: StateDirectoryEntry[] = [
  { state: "Georgia",        direct: "404-891-1880", mainAA: "AA9000", intakeRouting: "5010" },
  { state: "North Carolina", direct: "704-703-6002", mainAA: "AA9000", intakeRouting: "5011" },
  { state: "Tennessee",      direct: "615-307-8057", mainAA: "AA9000", intakeRouting: "5012" },
  { state: "Virginia",       direct: "703-540-1020", mainAA: "AA9000", intakeRouting: "5013" },
  { state: "Maryland",       direct: "410-205-6266", mainAA: "AA9000", intakeRouting: "5009" },
];

export const STATUSES: RequestStatus[] = [
  "Draft", "Submitted", "Approved", "Sent to Telecom", "Updated", "Test Call Complete", "Reverted", "Closed",
];

export const SHARED_CATEGORIES: SharedDeptCategory[] = [
  "HR", "Scheduling", "General Inquiries", "Overflow", "After Hours",
];

export function computeImpacts(opts: {
  currentExtension: string;
  newExtension: string;
  queues: CallQueue[];
  shared: SharedRouting[];
  scope: RequestRoutingScope;
  sharedCategories: SharedDeptCategory[];
}): ImpactRow[] {
  const { currentExtension, newExtension, queues, shared, scope, sharedCategories } = opts;
  const ext = currentExtension.trim();
  if (!ext) return [];
  const rows: ImpactRow[] = [];
  if (scope === "Call Queue" || scope === "Both") {
    for (const q of queues) {
      if (!q.agents.includes(ext)) continue;
      rows.push({
        sourceId: `CQ-${q.queue}`,
        routingType: "CQ",
        name: `${q.queue} ${q.state} ${q.timeframe}`,
        state: q.state,
        timeframe: q.timeframe,
        currentExtension: ext,
        newExtension,
        priority: 1,
        rollbackRequired: true,
        selected: true,
      });
    }
  }
  if (scope === "Shared Department Routing" || scope === "Both") {
    const catFilter = sharedCategories.length
      ? (s: SharedRouting) => sharedCategories.includes(s.category)
      : () => true;
    for (const s of shared.filter(catFilter)) {
      const hitsBH = s.agents.includes(ext) || s.businessHoursRouting.includes(ext);
      const hitsAH = s.afterHoursRouting.includes(ext);
      if (hitsBH) {
        rows.push({
          sourceId: `SR-${s.id}-BH`,
          routingType: s.category === "HR" ? "HR"
            : s.category === "Scheduling" ? "Scheduling"
            : s.category === "General Inquiries" ? "Inquiry"
            : s.category === "Overflow" ? "Overflow"
            : "Shared Routing",
          name: `${s.department} ${s.extension} (Business Hours)`,
          currentExtension: ext,
          newExtension,
          priority: s.priority,
          rollbackRequired: true,
          selected: true,
          notes: s.backupPath,
        });
      }
      if (hitsAH) {
        rows.push({
          sourceId: `SR-${s.id}-AH`,
          routingType: "After Hours",
          name: `${s.department} ${s.extension} (After Hours)`,
          currentExtension: ext,
          newExtension,
          priority: s.priority,
          rollbackRequired: true,
          selected: true,
          notes: s.backupPath,
        });
      }
    }
  }
  return rows;
}

export function findExtensionEverywhere(
  ext: string,
  queues: CallQueue[],
  shared: SharedRouting[],
) {
  const trimmed = ext.trim();
  if (!trimmed) return { queues: [], shared: [] as SharedRouting[] };
  return {
    queues: queues.filter((q) => q.agents.includes(trimmed)),
    shared: shared.filter(
      (s) => s.agents.includes(trimmed) || s.businessHoursRouting.includes(trimmed) || s.afterHoursRouting.includes(trimmed),
    ),
  };
}

export function buildRollbackItems(impacts: ImpactRow[]): RollbackItem[] {
  const items: RollbackItem[] = [];
  const selected = impacts.filter((i) => i.selected && i.rollbackRequired);
  const typeMap: Record<string, string> = {
    CQ: "CQ routing restored",
    "Shared Routing": "Shared routing restored",
    HR: "HR routing restored",
    Scheduling: "Scheduling routing restored",
    Inquiry: "Inquiry queue routing restored",
    Overflow: "Overflow routing restored",
    "After Hours": "After-hours routing restored",
    "Auto Attendant": "Auto attendant verified",
    "Ring Group": "Ring group restored",
    Voicemail: "Voicemail routing restored",
  };
  const seen = new Set<string>();
  for (const i of selected) {
    const label = typeMap[i.routingType] ?? `${i.routingType} restored`;
    if (seen.has(label)) continue;
    seen.add(label);
    items.push({ key: `restore-${i.routingType}`, label, done: false });
  }
  const baseline: RollbackItem[] = [
    { key: "test-calls", label: "Test calls completed", done: false },
    { key: "voicemail", label: "Voicemail confirmed", done: false },
    { key: "after-hours-verified", label: "After-hours routing verified", done: false },
    { key: "shared-test-call", label: "Shared test call completed", done: false },
    { key: "original-restored", label: "Original extension fully restored", done: false },
    { key: "final-test", label: "Final test call completed", done: false },
  ];
  return [...items, ...baseline];
}

export function detectRequestConflicts(
  draft: Pick<ChangeRequest, "id" | "currentExtension" | "newExtension" | "startDate" | "endDate">,
  all: ChangeRequest[],
): { type: "current-in-use" | "new-in-use"; request: ChangeRequest }[] {
  const conflicts: { type: "current-in-use" | "new-in-use"; request: ChangeRequest }[] = [];
  for (const r of all) {
    if (r.id === draft.id) continue;
    if (["Closed", "Reverted", "Draft"].includes(r.status)) continue;
    const overlap = !(r.endDate < draft.startDate || r.startDate > draft.endDate);
    if (!overlap) continue;
    if (r.currentExtension === draft.currentExtension) conflicts.push({ type: "current-in-use", request: r });
    if (r.newExtension === draft.currentExtension || r.currentExtension === draft.newExtension) {
      conflicts.push({ type: "new-in-use", request: r });
    }
  }
  return conflicts;
}

export function buildVendorEmail(
  req: ChangeRequest,
  kind: "change" | "rollback",
  settings: AdminSettings,
): { subject: string; body: string; to: string } {
  const selected = req.affectedRouting.filter((a) => a.selected);
  const lines: string[] = [];
  const isRollback = kind === "rollback";
  if (isRollback) {
    lines.push(`Hello ${settings.vendorName},`, "");
    lines.push(`Please ROLLBACK the temporary extension change associated with request ${req.id}.`);
    lines.push(`Restore extension ${req.newExtension} back to the original extension ${req.currentExtension} in all locations listed below.`);
  } else {
    lines.push(`Hello ${settings.vendorName},`, "");
    lines.push(`Please apply the following temporary call routing change (request ${req.id}).`);
    lines.push(`Replace extension ${req.currentExtension} with ${req.newExtension} in all locations listed below.`);
  }
  lines.push("");
  lines.push(`Employee out: ${req.employeeOut}`);
  lines.push(`Reason: ${req.reason}`);
  lines.push(`Urgency: ${req.urgency}`);
  lines.push(`Effective: ${req.startDate} ${req.startTime} ${req.timeZone}`);
  lines.push(`Through:   ${req.endDate} ${req.endTime} ${req.timeZone}`);
  if (req.backupExtension) lines.push(`Backup extension: ${req.backupExtension}`);
  if (req.vendorTicketNumber) lines.push(`Vendor ticket #: ${req.vendorTicketNumber}`);
  lines.push("", "AFFECTED ROUTING:");
  if (selected.length === 0) lines.push("  (none selected)");
  else {
    for (const a of selected) {
      const from = isRollback ? a.newExtension : a.currentExtension;
      const to = isRollback ? a.currentExtension : a.newExtension;
      lines.push(`  • [${a.routingType}] ${a.name} — change ext ${from} → ${to}` + (a.priority ? ` (priority ${a.priority})` : ""));
    }
  }
  if (req.notes) lines.push("", "NOTES:", req.notes);
  lines.push("");
  lines.push(isRollback ? "Please confirm rollback completion and run a test call." : "Please confirm completion and run a test call.");
  lines.push("", `Submitted by: ${req.submittedBy}`, `Reply to: ${settings.opsEmail}`);
  const subject = isRollback
    ? `[ROLLBACK] ${req.id} — Restore ext ${req.newExtension} → ${req.currentExtension}`
    : `[ROUTING CHANGE] ${req.id} — Replace ext ${req.currentExtension} → ${req.newExtension}`;
  return { subject, body: lines.join("\n"), to: settings.vendorEmail };
}

export function appendAudit(req: ChangeRequest, entry: Omit<AuditEntry, "at">): ChangeRequest {
  return { ...req, auditLog: [...(req.auditLog ?? []), { ...entry, at: new Date().toISOString() }] };
}