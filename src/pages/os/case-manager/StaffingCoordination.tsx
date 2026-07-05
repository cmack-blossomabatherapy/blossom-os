import { useState } from "react";
import { Send, ShieldAlert, CalendarClock, Flame } from "lucide-react";
import { useCaseManagerWorkspace } from "@/hooks/useCaseManagerWorkspace";
import { CMPage, Pill, priorityTone, statusTone, FormDialog, familySelectOptions, familyOptionByValue, familyContext } from "./_shared";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function StaffingCoordinationPage() {
  const w = useCaseManagerWorkspace();
  const [requestOpen, setRequestOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);

  const options = familySelectOptions(w.assignments);
  const pickFamily = (v: any) => familyOptionByValue(w.assignments, v?.family);

  const openStaffing = w.openHandoffs.filter((h) => h.to_department === "staffing" || h.handoff_type === "staffing_update");
  const staffIssues = w.openServiceIssues.filter((i) => i.issue_type === "staffing" || i.owner_department === "staffing");
  const staffFollowUps = w.followUps.filter((f) => f.status === "open" && f.category === "staffing");

  return (
    <CMPage
      eyebrow="Case Manager · Staffing"
      title="Staffing Coordination"
      description="Visibility into staffing continuity. Case Managers surface family needs — Staffing owns placement."
      loading={w.loading}
      error={w.error}
      actions={
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setRequestOpen(true)}><Send className="mr-1.5 h-3.5 w-3.5" /> Request update</Button>
          <Button size="sm" variant="outline" onClick={() => setIssueOpen(true)}><ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> Log concern</Button>
          <Button size="sm" variant="outline" onClick={() => setFollowUpOpen(true)}><CalendarClock className="mr-1.5 h-3.5 w-3.5" /> Follow-up</Button>
          <Button size="sm" variant="ghost" onClick={() => setEscalateOpen(true)}><Flame className="mr-1.5 h-3.5 w-3.5" /> Escalate</Button>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/70 bg-white/80 p-4"><p className="text-[11px] text-muted-foreground">Assigned families</p><p className="mt-1 text-[22px] font-semibold">{w.assignments.length}</p></div>
        <div className="rounded-2xl border border-white/70 bg-white/80 p-4"><p className="text-[11px] text-muted-foreground">Open staffing requests</p><p className="mt-1 text-[22px] font-semibold">{openStaffing.length}</p></div>
        <div className="rounded-2xl border border-white/70 bg-white/80 p-4"><p className="text-[11px] text-muted-foreground">Staffing issues</p><p className="mt-1 text-[22px] font-semibold">{staffIssues.length}</p></div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
          <p className="text-[13px] font-semibold">Open staffing handoffs</p>
          <div className="mt-2 divide-y divide-border/60">
            {openStaffing.length === 0 && <p className="p-3 text-[12px] text-muted-foreground">No open staffing requests.</p>}
            {openStaffing.map((h) => (
              <div key={h.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-[12.5px] font-medium">{h.title}</p><p className="text-[11px] text-muted-foreground">{h.client_name ?? "—"} · {new Date(h.created_at).toLocaleDateString()}</p>{h.request_note && <p className="mt-1 text-[11.5px] text-foreground/70 line-clamp-2">{h.request_note}</p>}</div>
                <div className="flex flex-col items-end gap-1.5"><Pill tone={priorityTone(h.priority)}>{h.priority}</Pill><Button size="sm" variant="ghost" onClick={async () => { await w.resolveHandoff(h.id); toast.success("Resolved"); }}>Resolve</Button></div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
          <p className="text-[13px] font-semibold">Staffing issues & follow-ups</p>
          <div className="mt-2 divide-y divide-border/60">
            {staffIssues.length === 0 && staffFollowUps.length === 0 && <p className="p-3 text-[12px] text-muted-foreground">Nothing staffing-related right now.</p>}
            {staffIssues.map((i) => (
              <div key={i.id} className="py-2.5"><p className="text-[12.5px] font-medium">{i.title}</p><p className="text-[11px] text-muted-foreground">{i.client_name ?? "—"} · {i.status}</p><div className="mt-1 flex gap-1.5"><Pill tone={statusTone(i.status)}>{i.status}</Pill><Pill tone={priorityTone(i.severity)}>{i.severity}</Pill></div></div>
            ))}
            {staffFollowUps.map((f) => (
              <div key={f.id} className="py-2.5"><p className="text-[12.5px] font-medium">{f.title}</p><p className="text-[11px] text-muted-foreground">{f.client_name ?? "—"}{f.due_at ? ` · due ${new Date(f.due_at).toLocaleDateString()}` : ""}</p></div>
            ))}
          </div>
        </div>
      </div>

      <FormDialog open={requestOpen} onOpenChange={setRequestOpen} title="Request staffing update" submitLabel="Send"
        fields={[
          { key: "family", label: "Family / client", type: "select", options },
          { key: "title", label: "Title", required: true },
          { key: "request_note", label: "Details", type: "textarea", required: true },
          { key: "priority", label: "Priority", type: "select", options: ["low","normal","high","urgent"], defaultValue: "normal" },
        ]}
        onSubmit={async (v) => { const { family: _f, ...rest } = v; await w.requestStaffingUpdate({ ...rest, ...familyContext(pickFamily(v)) } as any); toast.success("Sent to Staffing"); }}
      />
      <FormDialog open={issueOpen} onOpenChange={setIssueOpen} title="Log family staffing concern" submitLabel="Log"
        fields={[
          { key: "family", label: "Family / client", type: "select", options },
          { key: "title", label: "Title", required: true },
          { key: "description", label: "Description", type: "textarea" },
          { key: "severity", label: "Severity", type: "select", options: ["low","medium","high","urgent"], defaultValue: "medium" },
          { key: "parent_impact", label: "Parent impact" },
        ]}
        onSubmit={async (v) => { const { family: _f, ...rest } = v; await w.createServiceIssue({ ...rest, ...familyContext(pickFamily(v)), issue_type: "staffing", owner_department: "staffing", status: "open" } as any); toast.success("Issue logged"); }}
      />
      <FormDialog open={followUpOpen} onOpenChange={setFollowUpOpen} title="Staffing follow-up" submitLabel="Create"
        fields={[
          { key: "family", label: "Family / client", type: "select", options },
          { key: "title", label: "Title", required: true },
          { key: "priority", label: "Priority", type: "select", options: ["low","normal","high","urgent"], defaultValue: "normal" },
          { key: "due_at", label: "Due", type: "datetime" },
        ]}
        onSubmit={async (v) => { const { family: _f, ...rest } = v; await w.createFollowUp({ ...rest, ...familyContext(pickFamily(v)), category: "staffing", status: "open", due_at: v.due_at ? new Date(v.due_at).toISOString() : null } as any); toast.success("Follow-up created"); }}
      />
      <FormDialog open={escalateOpen} onOpenChange={setEscalateOpen} title="Escalate staffing issue" submitLabel="Escalate"
        fields={[
          { key: "family", label: "Family / client", type: "select", options },
          { key: "reason", label: "Reason", required: true },
          { key: "summary", label: "Summary", type: "textarea" },
          { key: "severity", label: "Severity", type: "select", options: ["low","medium","high","urgent"], defaultValue: "high" },
        ]}
        onSubmit={async (v) => { const { family: _f, ...rest } = v; await w.createEscalation({ ...rest, ...familyContext(pickFamily(v)), escalation_type: "staffing_concern", owner_department: "staffing", status: "open" } as any); toast.success("Escalated"); }}
      />
    </CMPage>
  );
}