import { useState } from "react";
import { HeartHandshake, Plus, MessageSquare, CalendarClock, ShieldAlert, Flame, CalendarDays, Users, ShieldCheck } from "lucide-react";
import { useCaseManagerWorkspace } from "@/hooks/useCaseManagerWorkspace";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";
import { useStaffingWorkspace } from "@/hooks/useStaffingWorkspace";
import { CMPage, Pill, FilterBar, FormDialog, SourceStatusChip } from "./_shared";
import { findAuthorizationForAssignment, findCentralReachPairingForAssignment, findCentralReachCoverageRiskForAssignment, findStaffingForAssignment, stringValue, stringOrNull, booleanValue, dateTimeIsoOrNull } from "./_utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STATES = ["GA","NC","TN","VA","MD","FL","TX"];

export default function AssignedFamiliesPage() {
  const w = useCaseManagerWorkspace();
  const auth = useLiveAuthorizations();
  const cr = useCentralReachOps();
  const staffing = useStaffingWorkspace();
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [logCommForId, setLogCommForId] = useState<string | null>(null);
  const [followUpForId, setFollowUpForId] = useState<string | null>(null);
  const [issueForId, setIssueForId] = useState<string | null>(null);
  const [escalationForId, setEscalationForId] = useState<string | null>(null);
  const [schedReqForId, setSchedReqForId] = useState<string | null>(null);
  const [staffReqForId, setStaffReqForId] = useState<string | null>(null);
  const [authReqForId, setAuthReqForId] = useState<string | null>(null);

  const rows = w.assignments.filter((a) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (a.client_name ?? "").toLowerCase().includes(s) || (a.state ?? "").toLowerCase().includes(s);
  });

  const forCtx = (id: string | null) => {
    const a = w.assignments.find((x) => x.id === id);
    return a ? { client_id: a.client_id, client_name: a.client_name, state: a.state } : {};
  };

  // Durable per-family live operating signals — helpers prefer client_id
  // and CentralReach client id before falling back to normalized name.
  const liveFor = (assignment: typeof w.assignments[number]) => {
    const authLive = findAuthorizationForAssignment(auth, assignment);
    const pairing = findCentralReachPairingForAssignment(cr, assignment);
    const risk = findCentralReachCoverageRiskForAssignment(cr, assignment);
    const staffingMatches = findStaffingForAssignment(staffing, assignment).matches;
    const assignedRbts = staffingMatches.filter((m) => m.status === "Assigned").length;
    return { authLive, pairing, risk, assignedRbts };
  };

  return (
    <CMPage
      eyebrow="Case Manager · Families"
      title="Assigned Families"
      description="Every family on your caseload with real-time coordination signals."
      loading={w.loading}
      error={w.error}
      empty={!w.loading && w.assignments.length === 0 ? { icon: HeartHandshake, title: "No assigned families yet", hint: "Add a family below or ask ops leadership to route your caseload." } : null}
      actions={<Button size="sm" onClick={() => setAddOpen(true)}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add family</Button>}
    >
      <FilterBar>
        <Input placeholder="Search families…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <span className="text-[11px] text-muted-foreground">{rows.length} of {w.assignments.length}</span>
        <span className="flex items-center gap-1.5">
          <SourceStatusChip label="Authorizations" loading={auth.loading} error={auth.error} />
          <SourceStatusChip label="CentralReach" loading={cr.loading} error={cr.error} />
          <SourceStatusChip label="Staffing" loading={staffing.loading} error={staffing.error} />
        </span>
      </FilterBar>

      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((a) => {
          const recs = w.recordsByClientId(a.client_id);
          const lastComm = recs.communications[0];
          const nextFollowUp = recs.followUps.filter((f) => f.status === "open" && f.due_at).sort((x,y) => new Date(x.due_at!).getTime() - new Date(y.due_at!).getTime())[0];
          const openIssues = recs.serviceIssues.filter((s) => !["resolved","closed"].includes(s.status)).length;
          const openEsc = recs.escalations.filter((e) => !["resolved","closed"].includes(e.status)).length;
          const openHo = recs.handoffs.filter((h) => !["resolved","closed"].includes(h.status)).length;
          const live = liveFor(a);
          return (
            <div key={a.id} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_8px_24px_-18px_hsl(330_40%_45%/0.18)] backdrop-blur">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold">{a.client_name ?? "Unnamed"}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {a.state && <Pill tone="calm">{a.state}</Pill>}
                    <Pill tone={a.is_primary ? "warm" : "cool"}>{a.is_primary ? "Primary" : "Secondary"}</Pill>
                    {a.centralreach_client_id && <Pill tone="cool">CR · {a.centralreach_client_id}</Pill>}
                    {a.centralreach_sync_status && <Pill tone="violet">{a.centralreach_sync_status}</Pill>}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {live.authLive ? (
                      <Pill tone={live.authLive.riskLevel === "High" ? "alert" : live.authLive.riskLevel === "Medium" ? "amber" : "calm"}>Auth: {live.authLive.stage}</Pill>
                    ) : <Pill tone="cool">Auth: no live record</Pill>}
                    {live.pairing?.bcbaName && <Pill tone="cool">BCBA: {live.pairing.bcbaName}</Pill>}
                    {live.pairing?.rbtName && <Pill tone="cool">RBT: {live.pairing.rbtName}</Pill>}
                    {!live.pairing?.rbtName && live.assignedRbts > 0 && <Pill tone="cool">{live.assignedRbts} assigned</Pill>}
                    {live.risk && <Pill tone={live.risk.level === "uncovered" ? "alert" : "amber"}>Coverage: {live.risk.level.replace("_", " ")}</Pill>}
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                <div className="rounded-lg bg-muted/40 p-2"><p className="text-muted-foreground">Last contact</p><p className="mt-0.5 font-medium">{lastComm ? new Date(lastComm.occurred_at).toLocaleDateString() : "—"}</p></div>
                <div className="rounded-lg bg-muted/40 p-2"><p className="text-muted-foreground">Next follow-up</p><p className="mt-0.5 font-medium">{nextFollowUp?.due_at ? new Date(nextFollowUp.due_at).toLocaleDateString() : "—"}</p></div>
                <div className="rounded-lg bg-muted/40 p-2"><p className="text-muted-foreground">Open</p><p className="mt-0.5 font-medium">{openIssues}i · {openEsc}e · {openHo}h</p></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" onClick={() => setLogCommForId(a.id)}><MessageSquare className="mr-1 h-3 w-3" /> Log contact</Button>
                <Button size="sm" variant="outline" onClick={() => setFollowUpForId(a.id)}><CalendarClock className="mr-1 h-3 w-3" /> Follow-up</Button>
                <Button size="sm" variant="outline" onClick={() => setIssueForId(a.id)}><ShieldAlert className="mr-1 h-3 w-3" /> Issue</Button>
                <Button size="sm" variant="outline" onClick={() => setEscalationForId(a.id)}><Flame className="mr-1 h-3 w-3" /> Escalate</Button>
                <Button size="sm" variant="ghost" onClick={() => setSchedReqForId(a.id)}><CalendarDays className="mr-1 h-3 w-3" /> Sched</Button>
                <Button size="sm" variant="ghost" onClick={() => setStaffReqForId(a.id)}><Users className="mr-1 h-3 w-3" /> Staff</Button>
                <Button size="sm" variant="ghost" onClick={() => setAuthReqForId(a.id)}><ShieldCheck className="mr-1 h-3 w-3" /> Auth</Button>
              </div>
            </div>
          );
        })}
      </div>

      <FormDialog
        open={addOpen} onOpenChange={setAddOpen}
        title="Add assigned family" submitLabel="Add"
        fields={[
          { key: "client_name", label: "Family / client name", required: true },
          { key: "state", label: "State", type: "select", options: STATES },
          { key: "centralreach_client_id", label: "CentralReach client ID" },
          { key: "is_primary_str", label: "Assignment", type: "select", options: ["Primary","Secondary"], defaultValue: "Primary" },
        ]}
        onSubmit={async (v) => {
          await w.createAssignment({ client_name: stringValue(v.client_name), state: stringOrNull(v.state), centralreach_client_id: stringOrNull(v.centralreach_client_id), is_primary: stringValue(v.is_primary_str) !== "Secondary" });
          toast.success("Family added");
        }}
      />

      <FormDialog
        open={!!logCommForId} onOpenChange={(o) => !o && setLogCommForId(null)}
        title="Log parent communication" submitLabel="Log"
        fields={[
          { key: "channel", label: "Channel", type: "select", required: true, options: ["call","email","sms","voicemail","parent_meeting","internal_update","other"] },
          { key: "direction", label: "Direction", type: "select", required: true, options: ["inbound","outbound","internal"] },
          { key: "contact_name", label: "Contact name" },
          { key: "subject", label: "Subject" },
          { key: "summary", label: "Summary", type: "textarea", required: true },
          { key: "outcome", label: "Outcome" },
          { key: "sentiment", label: "Sentiment", type: "select", options: ["positive","neutral","concerned","upset"] },
          { key: "needs_followup", label: "Needs follow-up", type: "checkbox" },
        ]}
        onSubmit={async (v) => {
          const ctx = forCtx(logCommForId);
          await w.logCommunication({ ...ctx, ...v, needs_followup: booleanValue(v.needs_followup) } as unknown as Parameters<typeof w.logCommunication>[0]);
          toast.success("Communication logged");
        }}
      />

      <FormDialog
        open={!!followUpForId} onOpenChange={(o) => !o && setFollowUpForId(null)}
        title="Create follow-up" submitLabel="Create"
        fields={[
          { key: "title", label: "Title", required: true },
          { key: "description", label: "Details", type: "textarea" },
          { key: "category", label: "Category", type: "select", options: ["family_check_in","scheduling","staffing","authorization","clinical","other"], defaultValue: "family_check_in" },
          { key: "priority", label: "Priority", type: "select", options: ["low","normal","high","urgent"], defaultValue: "normal" },
          { key: "due_at", label: "Due", type: "datetime" },
        ]}
        onSubmit={async (v) => {
          const ctx = forCtx(followUpForId);
          await w.createFollowUp({ ...ctx, ...v, status: "open", due_at: dateTimeIsoOrNull(v.due_at) } as unknown as Parameters<typeof w.createFollowUp>[0]);
          toast.success("Follow-up created");
        }}
      />

      <FormDialog
        open={!!issueForId} onOpenChange={(o) => !o && setIssueForId(null)}
        title="Log service issue" submitLabel="Log"
        fields={[
          { key: "title", label: "Title", required: true },
          { key: "description", label: "Description", type: "textarea" },
          { key: "issue_type", label: "Issue type", type: "select", options: ["scheduling","staffing","authorization","clinical","billing","other"], defaultValue: "scheduling" },
          { key: "severity", label: "Severity", type: "select", options: ["low","medium","high","urgent"], defaultValue: "medium" },
          { key: "owner_department", label: "Owner department", type: "select", options: ["scheduling","staffing","authorizations","clinical","qa","billing"] },
          { key: "parent_impact", label: "Parent impact" },
        ]}
        onSubmit={async (v) => {
          const ctx = forCtx(issueForId);
          await w.createServiceIssue({ ...ctx, ...v, status: "open" } as unknown as Parameters<typeof w.createServiceIssue>[0]);
          toast.success("Service issue logged");
        }}
      />

      <FormDialog
        open={!!escalationForId} onOpenChange={(o) => !o && setEscalationForId(null)}
        title="Create escalation" submitLabel="Escalate"
        fields={[
          { key: "reason", label: "Reason", required: true },
          { key: "summary", label: "Summary", type: "textarea" },
          { key: "escalation_type", label: "Escalation type", type: "select", options: ["family_dissatisfaction","service_gap","clinical_concern","staffing_concern","authorization_risk","other"], defaultValue: "family_dissatisfaction" },
          { key: "severity", label: "Severity", type: "select", options: ["low","medium","high","urgent"], defaultValue: "medium" },
          { key: "owner_department", label: "Owner department", type: "select", options: ["scheduling","staffing","authorizations","clinical","leadership","qa"] },
          { key: "escalated_to_role", label: "Escalate to role" },
        ]}
        onSubmit={async (v) => {
          const ctx = forCtx(escalationForId);
          await w.createEscalation({ ...ctx, ...v, status: "open" } as unknown as Parameters<typeof w.createEscalation>[0]);
          toast.success("Escalation created");
        }}
      />

      {[
        { id: schedReqForId, set: setSchedReqForId, title: "Request scheduling update", fn: w.requestSchedulingUpdate },
        { id: staffReqForId, set: setStaffReqForId, title: "Request staffing update", fn: w.requestStaffingUpdate },
        { id: authReqForId, set: setAuthReqForId, title: "Request authorization update", fn: w.requestAuthorizationUpdate },
      ].map((r, i) => (
        <FormDialog
          key={i} open={!!r.id} onOpenChange={(o) => !o && r.set(null)}
          title={r.title} submitLabel="Send request"
          fields={[
            { key: "title", label: "Request title", required: true },
            { key: "request_note", label: "Details", type: "textarea", required: true },
            { key: "priority", label: "Priority", type: "select", options: ["low","normal","high","urgent"], defaultValue: "normal" },
          ]}
          onSubmit={async (v) => {
            const ctx = forCtx(r.id);
            await r.fn({ ...ctx, ...v } as unknown as Parameters<typeof r.fn>[0]);
            toast.success("Request sent");
          }}
        />
      ))}
    </CMPage>
  );
}