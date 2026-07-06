import { useState } from "react";
import { Flame, Plus, CheckCircle2, Undo2, CalendarClock, ShieldAlert } from "lucide-react";
import { useCaseManagerWorkspace } from "@/hooks/useCaseManagerWorkspace";
import { CMPage, Pill, FilterBar, FormDialog } from "./_shared";
import { priorityTone, statusTone, familySelectOptions, familyOptionByValue, familyContext, stringValue, dateTimeIsoOrNull, type CMFormValues } from "./_utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const TYPES = ["family_dissatisfaction","service_gap","clinical_concern","staffing_concern","authorization_risk","other"];
const SEVERITIES = ["low","medium","high","urgent"];
const STATUSES = ["open","in_progress","waiting","resolved","closed"];
const DEPTS = ["scheduling","staffing","authorizations","clinical","leadership","qa"];

export default function EscalationsPage() {
  const w = useCaseManagerWorkspace();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [dept, setDept] = useState("all");
  const [sev, setSev] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [followUpId, setFollowUpId] = useState<string | null>(null);
  const [issueId, setIssueId] = useState<string | null>(null);

  const options = familySelectOptions(w.assignments);
  const pickFamily = (v: CMFormValues) => familyOptionByValue(w.assignments, stringValue(v.family));
  const escById = (id: string | null) => w.escalations.find((e) => e.id === id);

  const rows = w.escalations.filter((e) => {
    if (status !== "all" && e.status !== status) return false;
    if (dept !== "all" && e.owner_department !== dept) return false;
    if (sev !== "all" && e.severity !== sev) return false;
    if (q) { const s = q.toLowerCase(); if (![e.reason, e.summary, e.client_name].some((x) => (x ?? "").toLowerCase().includes(s))) return false; }
    return true;
  });

  return (
    <CMPage
      eyebrow="Case Manager · Escalations"
      title="Escalations"
      description="Elevated coordination requests that need cross-department action."
      loading={w.loading}
      error={w.error}
      empty={!w.loading && w.escalations.length === 0 ? { icon: Flame, title: "No escalations yet", hint: "Create an escalation when a family needs leadership attention." } : null}
      actions={<Button size="sm" onClick={() => setAddOpen(true)}><Plus className="mr-1.5 h-3.5 w-3.5" /> New escalation</Button>}
    >
      <FilterBar>
        <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Select value={dept} onValueChange={setDept}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All departments</SelectItem>{DEPTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Select value={sev} onValueChange={setSev}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All severities</SelectItem>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <span className="text-[11px] text-muted-foreground">{rows.length} of {w.escalations.length}</span>
      </FilterBar>

      <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 divide-y divide-border/60">
        {rows.map((e) => (
          <div key={e.id} className="p-3.5 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{e.reason}</p>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">{e.client_name ?? "—"} · {e.escalation_type}{e.owner_department ? ` → ${e.owner_department}` : ""}{e.escalated_to_role ? ` · to ${e.escalated_to_role}` : ""}</p>
              {e.summary && <p className="mt-1 text-[12px] text-foreground/80 line-clamp-2">{e.summary}</p>}
              {e.resolution_note && <p className="mt-1 rounded-md bg-muted/40 p-2 text-[11.5px]"><span className="text-muted-foreground">Resolution: </span>{e.resolution_note}</p>}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Pill tone={statusTone(e.status)}>{e.status}</Pill>
                <Pill tone={priorityTone(e.severity)}>{e.severity}</Pill>
                {e.parent_communication_needed && <Pill tone="amber">Parent comm needed</Pill>}
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              {!["resolved","closed"].includes(e.status) ? (
                <Button size="sm" variant="outline" onClick={() => setResolveId(e.id)}><CheckCircle2 className="mr-1 h-3 w-3" /> Resolve</Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={async () => { await w.updateEscalation(e.id, { status: "open", resolved_at: null }); toast.success("Reopened"); }}><Undo2 className="mr-1 h-3 w-3" /> Reopen</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setEditId(e.id)}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => setFollowUpId(e.id)}><CalendarClock className="mr-1 h-3 w-3" /> Follow-up</Button>
              <Button size="sm" variant="ghost" onClick={() => setIssueId(e.id)}><ShieldAlert className="mr-1 h-3 w-3" /> Linked issue</Button>
            </div>
          </div>
        ))}
      </div>

      <FormDialog open={addOpen} onOpenChange={setAddOpen} title="New escalation" submitLabel="Create"
        fields={[
          { key: "family", label: "Family / client", type: "select", options },
          { key: "reason", label: "Reason", required: true },
          { key: "summary", label: "Summary", type: "textarea" },
          { key: "escalation_type", label: "Type", type: "select", options: TYPES, defaultValue: "family_dissatisfaction" },
          { key: "severity", label: "Severity", type: "select", options: SEVERITIES, defaultValue: "medium" },
          { key: "owner_department", label: "Owner department", type: "select", options: DEPTS },
          { key: "escalated_to_role", label: "Escalated to role" },
          { key: "parent_communication_needed", label: "Parent communication needed", type: "checkbox" },
        ]}
        onSubmit={async (v) => { const { family: _f, ...rest } = v; await w.createEscalation({ ...rest, ...familyContext(pickFamily(v)), status: "open" } as unknown as Parameters<typeof w.createEscalation>[0]); toast.success("Escalation created"); }}
      />
      {editId && (
        <FormDialog open={!!editId} onOpenChange={(o) => !o && setEditId(null)} title="Edit escalation" submitLabel="Save"
          initial={escById(editId) as unknown as CMFormValues}
          fields={[
            { key: "reason", label: "Reason", required: true },
            { key: "summary", label: "Summary", type: "textarea" },
            { key: "status", label: "Status", type: "select", options: STATUSES },
            { key: "severity", label: "Severity", type: "select", options: SEVERITIES },
            { key: "owner_department", label: "Owner department", type: "select", options: DEPTS },
            { key: "escalated_to_role", label: "Escalated to role" },
          ]}
          onSubmit={async (v) => { if (!editId) return; await w.updateEscalation(editId, v as unknown as Parameters<typeof w.updateEscalation>[1]); toast.success("Updated"); }}
        />
      )}
      <FormDialog open={!!resolveId} onOpenChange={(o) => !o && setResolveId(null)} title="Resolve escalation" submitLabel="Resolve"
        fields={[{ key: "resolution_note", label: "Resolution note", type: "textarea", required: true }]}
        onSubmit={async (v) => { if (!resolveId) return; await w.resolveEscalation(resolveId, stringValue(v.resolution_note)); toast.success("Resolved"); }}
      />
      <FormDialog open={!!followUpId} onOpenChange={(o) => !o && setFollowUpId(null)} title="Follow-up from escalation" submitLabel="Create"
        fields={[
          { key: "title", label: "Title", required: true },
          { key: "priority", label: "Priority", type: "select", options: ["low","normal","high","urgent"], defaultValue: "high" },
          { key: "due_at", label: "Due", type: "datetime" },
        ]}
        onSubmit={async (v) => { const e = escById(followUpId); await w.createFollowUp({ client_id: e?.client_id ?? null, client_name: e?.client_name ?? null, title: stringValue(v.title), priority: stringValue(v.priority), status: "open", category: "other", due_at: dateTimeIsoOrNull(v.due_at) }); toast.success("Follow-up created"); }}
      />
      <FormDialog open={!!issueId} onOpenChange={(o) => !o && setIssueId(null)} title="Link a service issue" submitLabel="Create"
        fields={[
          { key: "title", label: "Title", required: true },
          { key: "description", label: "Description", type: "textarea" },
          { key: "issue_type", label: "Type", type: "select", options: ["scheduling","staffing","authorization","clinical","billing","other"], defaultValue: "clinical" },
          { key: "severity", label: "Severity", type: "select", options: SEVERITIES, defaultValue: "high" },
        ]}
        onSubmit={async (v) => { const e = escById(issueId); await w.createServiceIssue({ client_id: e?.client_id ?? null, client_name: e?.client_name ?? null, ...v, status: "open", owner_department: e?.owner_department ?? null } as unknown as Parameters<typeof w.createServiceIssue>[0]); toast.success("Linked issue created"); }}
      />
    </CMPage>
  );
}