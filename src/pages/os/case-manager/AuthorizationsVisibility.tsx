import { useState } from "react";
import { Send, ShieldAlert, CalendarClock, Flame } from "lucide-react";
import { useCaseManagerWorkspace } from "@/hooks/useCaseManagerWorkspace";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { CMPage, Pill, FormDialog, SourceStatusChip } from "./_shared";
import { priorityTone, statusTone, familySelectOptions, familyOptionByValue, familyContext, findAuthorizationForAssignment, stringValue, dateTimeIsoOrNull, type CMFormValues } from "./_utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AuthorizationsVisibilityPage() {
  const w = useCaseManagerWorkspace();
  const auth = useLiveAuthorizations();
  const [requestOpen, setRequestOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);

  const options = familySelectOptions(w.assignments);
  const pickFamily = (v: CMFormValues) => familyOptionByValue(w.assignments, stringValue(v.family));

  const openAuth = w.openHandoffs.filter((h) => h.to_department === "authorizations" || h.handoff_type === "authorization_update");
  const authIssues = w.openServiceIssues.filter((i) => i.issue_type === "authorization" || i.owner_department === "authorizations");
  const authFollowUps = w.followUps.filter((f) => f.status === "open" && f.category === "authorization");

  // Durable matching first (see _shared.tsx). Case Manager sees this as
  // read-only status; Authorizations still owns execution.

  return (
    <CMPage
      eyebrow="Case Manager · Authorizations"
      title="Authorizations Visibility"
      description="Read-only visibility into authorization risk. Requests route to the Authorizations team."
      loading={w.loading}
      error={w.error}
      actions={
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setRequestOpen(true)}><Send className="mr-1.5 h-3.5 w-3.5" /> Request update</Button>
          <Button size="sm" variant="outline" onClick={() => setIssueOpen(true)}><ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> Flag concern</Button>
          <Button size="sm" variant="outline" onClick={() => setFollowUpOpen(true)}><CalendarClock className="mr-1.5 h-3.5 w-3.5" /> Follow-up</Button>
          <Button size="sm" variant="ghost" onClick={() => setEscalateOpen(true)}><Flame className="mr-1.5 h-3.5 w-3.5" /> Escalate</Button>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/70 bg-white/80 p-4"><p className="text-[11px] text-muted-foreground">Assigned families</p><p className="mt-1 text-[22px] font-semibold">{w.assignments.length}</p></div>
        <div className="rounded-2xl border border-white/70 bg-white/80 p-4"><p className="text-[11px] text-muted-foreground">Open auth requests</p><p className="mt-1 text-[22px] font-semibold">{openAuth.length}</p></div>
        <div className="rounded-2xl border border-white/70 bg-white/80 p-4"><p className="text-[11px] text-muted-foreground">Auth issues</p><p className="mt-1 text-[22px] font-semibold">{authIssues.length}</p></div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/70 bg-white/80 p-4">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold">Live authorization status per assigned family</p>
          <div className="flex items-center gap-2">
            <SourceStatusChip label="Authorizations" loading={auth.loading} error={auth.error} />
            <span className="text-[10.5px] text-muted-foreground">Source: authorization operational records. Read-only. Authorizations owns execution.</span>
          </div>
        </div>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="text-[10.5px] uppercase tracking-wide text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="py-2 pr-3 text-left">Family</th>
                <th className="py-2 pr-3 text-left">Stage</th>
                <th className="py-2 pr-3 text-left">Type</th>
                <th className="py-2 pr-3 text-left">Hours</th>
                <th className="py-2 pr-3 text-left">Expires</th>
                <th className="py-2 pr-3 text-left">Risk</th>
                <th className="py-2 pr-3 text-left">CR link</th>
              </tr>
            </thead>
            <tbody>
              {w.assignments.length === 0 && (
                <tr><td colSpan={7} className="py-3 text-muted-foreground">No assigned families.</td></tr>
              )}
              {w.assignments.map((a) => {
                const live = findAuthorizationForAssignment(auth, a);
                return (
                  <tr key={a.id} className="border-b border-border/40 last:border-b-0">
                    <td className="py-2 pr-3">
                      <p className="font-medium">{a.client_name ?? "—"}</p>
                      <p className="text-[10.5px] text-muted-foreground">{a.state ?? ""}{a.centralreach_client_id ? ` · CR ${a.centralreach_client_id}` : ""}</p>
                    </td>
                    {live ? (
                      <>
                        <td className="py-2 pr-3">{live.stage}</td>
                        <td className="py-2 pr-3">{live.authType}</td>
                        <td className="py-2 pr-3">{live.hours ?? "—"}</td>
                        <td className="py-2 pr-3">{live.expirationDate ? new Date(live.expirationDate).toLocaleDateString() : "—"}</td>
                        <td className="py-2 pr-3"><Pill tone={live.riskLevel === "High" ? "alert" : live.riskLevel === "Medium" ? "amber" : "calm"}>{live.riskLevel}{live.missingInfo ? " · missing docs" : ""}</Pill></td>
                        <td className="py-2 pr-3"><Pill tone={a.centralreach_sync_status === "synced" ? "calm" : "amber"}>{a.centralreach_sync_status ?? "unsynced"}</Pill></td>
                      </>
                    ) : (
                      <td colSpan={6} className="py-2 pr-3 text-muted-foreground">No live authorization record found for this family.</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
          <p className="text-[13px] font-semibold">Auth handoffs, issues & follow-ups</p>
          <div className="mt-2 divide-y divide-border/60">
            {openAuth.length === 0 && authIssues.length === 0 && authFollowUps.length === 0 && <p className="p-3 text-[12px] text-muted-foreground">Nothing authorization-related right now.</p>}
            {openAuth.map((h) => (
              <div key={h.id} className="py-2.5 flex items-start justify-between gap-3"><div><p className="text-[12.5px] font-medium">{h.title}</p><p className="text-[11px] text-muted-foreground">Handoff · {h.client_name ?? "—"}</p></div><Pill tone={priorityTone(h.priority)}>{h.priority}</Pill></div>
            ))}
            {authIssues.map((i) => (
              <div key={i.id} className="py-2.5"><p className="text-[12.5px] font-medium">{i.title}</p><p className="text-[11px] text-muted-foreground">Issue · {i.client_name ?? "—"}</p><div className="mt-1 flex gap-1.5"><Pill tone={statusTone(i.status)}>{i.status}</Pill><Pill tone={priorityTone(i.severity)}>{i.severity}</Pill></div></div>
            ))}
            {authFollowUps.map((f) => (
              <div key={f.id} className="py-2.5"><p className="text-[12.5px] font-medium">{f.title}</p><p className="text-[11px] text-muted-foreground">Follow-up · {f.client_name ?? "—"}{f.due_at ? ` · due ${new Date(f.due_at).toLocaleDateString()}` : ""}</p></div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
          <p className="text-[13px] font-semibold">CentralReach sync</p>
          <div className="mt-2 divide-y divide-border/60">
            {w.assignments.length === 0 && <p className="p-3 text-[12px] text-muted-foreground">No assigned families.</p>}
            {w.assignments.map((a) => (
              <div key={a.id} className="py-2 flex items-center justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-[12.5px] font-medium">{a.client_name ?? "—"}</p><p className="text-[10.5px] text-muted-foreground">{a.centralreach_client_id ? `CR ${a.centralreach_client_id}` : "Not linked"}</p></div>
                <Pill tone={a.centralreach_sync_status === "synced" ? "calm" : "amber"}>{a.centralreach_sync_status ?? "unsynced"}</Pill>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FormDialog open={requestOpen} onOpenChange={setRequestOpen} title="Request authorization update" submitLabel="Send"
        fields={[
          { key: "family", label: "Family / client", type: "select", options },
          { key: "title", label: "Title", required: true },
          { key: "request_note", label: "Details", type: "textarea", required: true },
          { key: "priority", label: "Priority", type: "select", options: ["low","normal","high","urgent"], defaultValue: "normal" },
        ]}
        onSubmit={async (v) => { const { family: _f, ...rest } = v; await w.requestAuthorizationUpdate({ ...rest, ...familyContext(pickFamily(v)) } as unknown as Parameters<typeof w.requestAuthorizationUpdate>[0]); toast.success("Sent to Authorizations"); }}
      />
      <FormDialog open={issueOpen} onOpenChange={setIssueOpen} title="Flag authorization concern" submitLabel="Log"
        fields={[
          { key: "family", label: "Family / client", type: "select", options },
          { key: "title", label: "Title", required: true },
          { key: "description", label: "Description", type: "textarea" },
          { key: "severity", label: "Severity", type: "select", options: ["low","medium","high","urgent"], defaultValue: "medium" },
        ]}
        onSubmit={async (v) => { const { family: _f, ...rest } = v; await w.createServiceIssue({ ...rest, ...familyContext(pickFamily(v)), issue_type: "authorization", owner_department: "authorizations", status: "open" } as unknown as Parameters<typeof w.createServiceIssue>[0]); toast.success("Issue logged"); }}
      />
      <FormDialog open={followUpOpen} onOpenChange={setFollowUpOpen} title="Authorization follow-up" submitLabel="Create"
        fields={[
          { key: "family", label: "Family / client", type: "select", options },
          { key: "title", label: "Title", required: true },
          { key: "priority", label: "Priority", type: "select", options: ["low","normal","high","urgent"], defaultValue: "normal" },
          { key: "due_at", label: "Due", type: "datetime" },
        ]}
        onSubmit={async (v) => { const { family: _f, ...rest } = v; await w.createFollowUp({ ...rest, ...familyContext(pickFamily(v)), category: "authorization", status: "open", due_at: dateTimeIsoOrNull(v.due_at) } as unknown as Parameters<typeof w.createFollowUp>[0]); toast.success("Follow-up created"); }}
      />
      <FormDialog open={escalateOpen} onOpenChange={setEscalateOpen} title="Escalate auth risk" submitLabel="Escalate"
        fields={[
          { key: "family", label: "Family / client", type: "select", options },
          { key: "reason", label: "Reason", required: true },
          { key: "summary", label: "Summary", type: "textarea" },
          { key: "severity", label: "Severity", type: "select", options: ["low","medium","high","urgent"], defaultValue: "high" },
        ]}
        onSubmit={async (v) => { const { family: _f, ...rest } = v; await w.createEscalation({ ...rest, ...familyContext(pickFamily(v)), escalation_type: "authorization_risk", owner_department: "authorizations", status: "open" } as unknown as Parameters<typeof w.createEscalation>[0]); toast.success("Escalated"); }}
      />
    </CMPage>
  );
}