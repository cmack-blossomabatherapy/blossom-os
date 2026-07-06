import { useState } from "react";
import { ShieldAlert, Plus, CheckCircle2, Send, CalendarClock, Flame } from "lucide-react";
import { useCaseManagerWorkspace } from "@/hooks/useCaseManagerWorkspace";
import { CMPage, Pill, FilterBar, FormDialog } from "./_shared";
import { priorityTone, statusTone, familySelectOptions, familyOptionByValue, familyContext, stringValue, dateTimeIsoOrNull, type CMFormValues } from "./_utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const TYPES = ["scheduling","staffing","authorization","clinical","billing","other"];
const SEVERITIES = ["low","medium","high","urgent"];
const STATUSES = ["open","in_progress","waiting","resolved","closed"];
const DEPTS = ["scheduling","staffing","authorizations","clinical","qa","billing"];

export default function ServiceIssuesPage() {
  const w = useCaseManagerWorkspace();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [sev, setSev] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [followUpId, setFollowUpId] = useState<string | null>(null);
  const [escalateId, setEscalateId] = useState<string | null>(null);
  const [handoffId, setHandoffId] = useState<string | null>(null);

  const options = familySelectOptions(w.assignments);
  const pickFamily = (v: CMFormValues) => familyOptionByValue(w.assignments, stringValue(v.family));
  const issueById = (id: string | null) => w.serviceIssues.find((s) => s.id === id);

  const rows = w.serviceIssues.filter((i) => {
    if (status !== "all" && i.status !== status) return false;
    if (type !== "all" && i.issue_type !== type) return false;
    if (sev !== "all" && i.severity !== sev) return false;
    if (q) { const s = q.toLowerCase(); if (![i.title, i.description, i.client_name].some((x) => (x ?? "").toLowerCase().includes(s))) return false; }
    return true;
  });

  return (
    <CMPage
      eyebrow="Case Manager · Service Issues"
      title="Service Issues"
      description="Family-impacting operational issues, tracked to resolution."
      loading={w.loading}
      error={w.error}
      empty={!w.loading && w.serviceIssues.length === 0 ? { icon: ShieldAlert, title: "No service issues yet", hint: "Log your first service issue when you spot family impact." } : null}
      actions={<Button size="sm" onClick={() => setAddOpen(true)}><Plus className="mr-1.5 h-3.5 w-3.5" /> New issue</Button>}
    >
      <FilterBar>
        <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Select value={type} onValueChange={setType}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem>{TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Select value={sev} onValueChange={setSev}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All severities</SelectItem>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <span className="text-[11px] text-muted-foreground">{rows.length} of {w.serviceIssues.length}</span>
      </FilterBar>

      <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 divide-y divide-border/60">
        {rows.map((i) => (
          <div key={i.id} className="p-3.5 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{i.title}</p>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">{i.client_name ?? "—"} · {i.issue_type}{i.owner_department ? ` → ${i.owner_department}` : ""}</p>
              {i.description && <p className="mt-1 text-[12px] text-foreground/80 line-clamp-2">{i.description}</p>}
              {i.parent_impact && <p className="mt-1 text-[11.5px]"><span className="text-muted-foreground">Parent impact: </span>{i.parent_impact}</p>}
              {i.resolution_note && <p className="mt-1 rounded-md bg-muted/40 p-2 text-[11.5px]"><span className="text-muted-foreground">Resolution: </span>{i.resolution_note}</p>}
              <div className="mt-1.5 flex flex-wrap gap-1.5"><Pill tone={statusTone(i.status)}>{i.status}</Pill><Pill tone={priorityTone(i.severity)}>{i.severity}</Pill></div>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              {!["resolved","closed"].includes(i.status) && <Button size="sm" variant="outline" onClick={() => setResolveId(i.id)}><CheckCircle2 className="mr-1 h-3 w-3" /> Resolve</Button>}
              <Button size="sm" variant="ghost" onClick={() => setEditId(i.id)}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => setFollowUpId(i.id)}><CalendarClock className="mr-1 h-3 w-3" /> Follow-up</Button>
              <Button size="sm" variant="ghost" onClick={() => setEscalateId(i.id)}><Flame className="mr-1 h-3 w-3" /> Escalate</Button>
              <Button size="sm" variant="ghost" onClick={() => setHandoffId(i.id)}><Send className="mr-1 h-3 w-3" /> Handoff</Button>
            </div>
          </div>
        ))}
      </div>

      <FormDialog open={addOpen} onOpenChange={setAddOpen} title="New service issue" submitLabel="Create"
        fields={[
          { key: "family", label: "Family / client", type: "select", options },
          { key: "title", label: "Title", required: true },
          { key: "description", label: "Description", type: "textarea" },
          { key: "issue_type", label: "Type", type: "select", options: TYPES, defaultValue: "scheduling" },
          { key: "severity", label: "Severity", type: "select", options: SEVERITIES, defaultValue: "medium" },
          { key: "owner_department", label: "Owner department", type: "select", options: DEPTS },
          { key: "parent_impact", label: "Parent impact" },
          { key: "due_at", label: "Due", type: "datetime" },
        ]}
        onSubmit={async (v) => { const { family: _f, ...rest } = v; await w.createServiceIssue({ ...rest, ...familyContext(pickFamily(v)), status: "open", due_at: dateTimeIsoOrNull(v.due_at) } as unknown as Parameters<typeof w.createServiceIssue>[0]); toast.success("Issue created"); }}
      />
      {editId && (
        <FormDialog open={!!editId} onOpenChange={(o) => !o && setEditId(null)} title="Edit issue" submitLabel="Save"
          initial={issueById(editId) as unknown as CMFormValues}
          fields={[
            { key: "title", label: "Title", required: true },
            { key: "description", label: "Description", type: "textarea" },
            { key: "status", label: "Status", type: "select", options: STATUSES },
            { key: "severity", label: "Severity", type: "select", options: SEVERITIES },
            { key: "owner_department", label: "Owner department", type: "select", options: DEPTS },
            { key: "parent_impact", label: "Parent impact" },
          ]}
          onSubmit={async (v) => { if (!editId) return; await w.updateServiceIssue(editId, v as unknown as Parameters<typeof w.updateServiceIssue>[1]); toast.success("Updated"); }}
        />
      )}
      <FormDialog open={!!resolveId} onOpenChange={(o) => !o && setResolveId(null)} title="Resolve issue" submitLabel="Resolve"
        fields={[{ key: "resolution_note", label: "Resolution note", type: "textarea", required: true }]}
        onSubmit={async (v) => { if (!resolveId) return; await w.resolveServiceIssue(resolveId, stringValue(v.resolution_note)); toast.success("Resolved"); }}
      />
      <FormDialog open={!!followUpId} onOpenChange={(o) => !o && setFollowUpId(null)} title="Follow-up from issue" submitLabel="Create"
        fields={[
          { key: "title", label: "Title", required: true },
          { key: "priority", label: "Priority", type: "select", options: ["low","normal","high","urgent"], defaultValue: "normal" },
          { key: "due_at", label: "Due", type: "datetime" },
        ]}
        onSubmit={async (v) => { const i = issueById(followUpId); await w.createFollowUp({ client_id: i?.client_id ?? null, client_name: i?.client_name ?? null, title: stringValue(v.title), priority: stringValue(v.priority), status: "open", category: i?.issue_type ?? "other", due_at: dateTimeIsoOrNull(v.due_at) }); toast.success("Follow-up created"); }}
      />
      <FormDialog open={!!escalateId} onOpenChange={(o) => !o && setEscalateId(null)} title="Escalate issue" submitLabel="Escalate"
        fields={[
          { key: "reason", label: "Reason", required: true },
          { key: "summary", label: "Summary", type: "textarea" },
          { key: "severity", label: "Severity", type: "select", options: SEVERITIES, defaultValue: "high" },
        ]}
        onSubmit={async (v) => { const i = issueById(escalateId); await w.createEscalation({ client_id: i?.client_id ?? null, client_name: i?.client_name ?? null, reason: stringValue(v.reason), summary: stringValue(v.summary), severity: stringValue(v.severity), status: "open", escalation_type: "service_gap", owner_department: i?.owner_department ?? null }); toast.success("Escalated"); }}
      />
      <FormDialog open={!!handoffId} onOpenChange={(o) => !o && setHandoffId(null)} title="Handoff to owner department" submitLabel="Send"
        fields={[
          { key: "to_department", label: "Department", type: "select", options: DEPTS, required: true },
          { key: "title", label: "Handoff title", required: true },
          { key: "request_note", label: "Details", type: "textarea", required: true },
          { key: "priority", label: "Priority", type: "select", options: ["low","normal","high","urgent"], defaultValue: "normal" },
        ]}
        onSubmit={async (v) => { const i = issueById(handoffId); await w.createHandoff({ client_id: i?.client_id ?? null, client_name: i?.client_name ?? null, handoff_type: "service_issue", status: "open", ...v } as unknown as Parameters<typeof w.createHandoff>[0]); toast.success("Handoff sent"); }}
      />
    </CMPage>
  );
}