import { mockLeads, type Lead } from "./leads";
import { mockClients, type Client } from "./clients";

export type OpsLaneId = "intake" | "initial-auth" | "assessment" | "qa" | "treatment-auth" | "staffing" | "start";

export interface OpsLane {
  id: OpsLaneId;
  title: string;
  description: string;
  stages: string[];
}

export const opsLanes: OpsLane[] = [];

export type OpsItemKind = "lead" | "client" | "qa";

export interface OpsItem {
  id: string;
  kind: OpsItemKind;
  laneId: OpsLaneId;
  stage: string;
  primaryName: string;
  owner: string;
  state: string;
  daysInStage: number;
  blockers: string[];
  payor?: string;
  bcba?: string | null;
  rbt?: string | null;
  href: string;
}

// QA-specific record with checklist + linked auth
export type QAStage = "Awaiting Treatment Plan" | "In QA Review" | "Ready to Submit" | "Returned";

export interface QAItem {
  id: string;
  clientId: string;
  clientName: string;
  bcba: string | null;
  payor: string;
  state: string;
  owner: string;
  stage: QAStage;
  daysInQA: number;
  treatmentPlanReceived: boolean;
  documentsVerified: boolean;
  readyForSubmission: boolean;
  missingItems: string[];
  linkedAuthId: string;
  linkedAuthStatus: "Awaiting Submission" | "Submitted" | "Approved" | "Denied";
  expirationDays: number;
  documents: { name: string; received: boolean }[];
  tasks: { id: string; title: string; completed: boolean }[];
  timeline: { date: string; event: string }[];
  automationLog: string[];
}

// Build QA records from clients in QA-relevant stages
const buildQAItems = (): QAItem[] => {
  const qaClients = mockClients.filter(
    (c) =>
      c.stage === "In QA" ||
      c.qaStatus !== "Not Started" ||
      c.stage === "Pending Treatment Auth",
  );
  return qaClients.map((c, idx) => {
    const stage: QAStage =
      c.qaStatus === "Complete"
        ? "Ready to Submit"
        : c.qaStatus === "In Review"
          ? "In QA Review"
          : idx % 4 === 0
            ? "Returned"
            : "Awaiting Treatment Plan";
    const treatmentPlanReceived = stage !== "Awaiting Treatment Plan";
    const documentsVerified = stage === "Ready to Submit" || stage === "Returned";
    const readyForSubmission = stage === "Ready to Submit";
    const missing: string[] = [];
    if (!treatmentPlanReceived) missing.push("Treatment Plan");
    if (!documentsVerified) missing.push("Insurance Verification");
    if (stage === "Returned") missing.push("Goal corrections");

    return {
      id: `QA-${c.id}`,
      clientId: c.id,
      clientName: c.childName,
      bcba: c.bcba,
      payor: c.payor,
      state: c.state,
      owner: ["Lisa W.", "Marcus T.", "Priya N."][idx % 3],
      stage,
      daysInQA: Math.min(c.daysInStage, 14),
      treatmentPlanReceived,
      documentsVerified,
      readyForSubmission,
      missingItems: missing,
      linkedAuthId: `A-${2200 + idx}`,
      linkedAuthStatus: stage === "Ready to Submit" ? "Awaiting Submission" : "Awaiting Submission",
      expirationDays: 60 + (idx % 4) * 15,
      documents: [
        { name: "Treatment Plan", received: treatmentPlanReceived },
        { name: "Assessment Report", received: true },
        { name: "Insurance Verification", received: documentsVerified },
        { name: "Parent Consent", received: true },
      ],
      tasks: [
        { id: "qt1", title: "Confirm treatment plan received", completed: treatmentPlanReceived },
        { id: "qt2", title: "Review documents", completed: documentsVerified },
        { id: "qt3", title: "Approve QA", completed: readyForSubmission },
        { id: "qt4", title: "Send to submission", completed: false },
      ],
      timeline: [
        { date: "2026-04-02", event: "Assessment completed" },
        { date: treatmentPlanReceived ? "2026-04-08" : "—", event: "Treatment plan received" },
        { date: stage !== "Awaiting Treatment Plan" ? "2026-04-09" : "—", event: "QA started" },
        { date: readyForSubmission ? "2026-04-12" : "—", event: "QA completed" },
      ],
      automationLog: [
        "QA record created automatically after assessment",
        treatmentPlanReceived ? "Moved to In QA Review on plan upload" : "Awaiting treatment plan upload",
        readyForSubmission ? "Moved to Pending Treatment Auth" : "",
      ].filter(Boolean),
    };
  });
};

export const mockQAItems: QAItem[] = buildQAItems();

export const findQAItem = (id: string): QAItem | undefined => mockQAItems.find((q) => q.id === id);

export const qaStageVariant = (s: QAStage): "default" | "success" | "warning" | "destructive" | "info" | "muted" => {
  const m: Record<QAStage, "default" | "success" | "warning" | "destructive" | "info" | "muted"> = {
    "Awaiting Treatment Plan": "destructive",
    "In QA Review": "warning",
    "Ready to Submit": "success",
    "Returned": "warning",
  };
  return m[s];
};

const leadToOpsItem = (l: Lead): OpsItem | null => {
  const lane = opsLanes.find((ln) => ln.stages.includes(l.status));
  if (!lane) return null;
  return {
    id: l.id,
    kind: "lead",
    laneId: lane.id,
    stage: l.status,
    primaryName: l.childName,
    owner: l.owner,
    state: l.state,
    daysInStage: l.daysInStage,
    blockers: [],
    payor: l.payor,
    href: `/leads?view=pipeline&lead=${l.id}`,
  };
};

const clientToOpsItem = (c: Client): OpsItem | null => {
  const lane = opsLanes.find((ln) => ln.stages.includes(c.stage));
  if (!lane) return null;
  return {
    id: c.id,
    kind: "client",
    laneId: lane.id,
    stage: c.stage,
    primaryName: c.childName,
    owner: c.intakeOwner,
    state: c.state,
    daysInStage: c.daysInStage,
    blockers: c.blockers,
    payor: c.payor,
    bcba: c.bcba,
    rbt: c.rbt,
    href: `/clients/${c.id}`,
  };
};

const qaToOpsItem = (q: QAItem): OpsItem => ({
  id: q.id,
  kind: "qa",
  laneId: "qa",
  stage: q.stage,
  primaryName: q.clientName,
  owner: q.owner,
  state: q.state,
  daysInStage: q.daysInQA,
  blockers: q.missingItems,
  payor: q.payor,
  bcba: q.bcba,
  href: `/qa/${q.id}`,
});

export const getOpsItems = (): OpsItem[] => {
  // Replace generic "In QA" client items with concrete QA items
  const leads = mockLeads.map(leadToOpsItem).filter(Boolean) as OpsItem[];
  const clients = mockClients
    .filter((c) => c.stage !== "In QA")
    .map(clientToOpsItem)
    .filter(Boolean) as OpsItem[];
  const qa = mockQAItems.map(qaToOpsItem);
  return [...leads, ...clients, ...qa];
};

export const getOpsItemsByLane = (laneId: OpsLaneId): OpsItem[] =>
  getOpsItems().filter((i) => i.laneId === laneId);
