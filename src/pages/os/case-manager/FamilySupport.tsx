import { useState } from "react";
import { Heart, Plus, CheckCircle2, Flame, ShieldAlert, CalendarClock } from "lucide-react";
import { useCaseManagerWorkspace } from "@/hooks/useCaseManagerWorkspace";
import { CMPage, Pill, priorityTone, statusTone, FilterBar, FormDialog, familyOptions, familyMap } from "./_shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const NOTE_TYPES = ["general","family_check_in","clinical_observation","risk","celebration","other"];
const STATUSES = ["open","in_progress","waiting","resolved"];

export default function FamilySupportPage() {
  const w = useCaseManagerWorkspace();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [followUpFrom, setFollowUpFrom] = useState<string | null>(null);
  const [issueFrom, setIssueFrom] = useState<string | null>(null);
  const [escalationFrom, setEscalationFrom] = useState<string | null>(null);

  const options = familyOptions(w.assignments);
  const fam = familyMap(w.assignments);
  const noteById = (id: string | null) => w.notes.find((n) => n.id === id);

  const rows = w.notes.filter((n) => {
    if (status !== "all" && n.status !== status) return false;
    if (q) {
      const s = q.toLowerCase();
      if (![n.title, n.body, n.client_name].some((x) => (x ?? "").toLowerCase().includes(s))) return false;
    }
    return true;
  });

  return (
    <CMPage
      eyebrow="Case Manager · Family Support"
      title="Family Support Notes"
      description="Case notes about how each family is doing — surfaced to whoever can help next."
      loading={w.loading}
      error={w.error}
      empty={!w.loading && w.notes.length === 0 ? { icon: Heart, title: "No case notes yet", hint: "Add your first family check-in note." } : null}
      actions={<Button size="sm" onClick={() => setAddOpen(true)}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add case note</Button>}
    >
      <FilterBar>
        <Input placeholder="Search notes…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <span className="text-[11px] text-muted-foreground">{rows.length} of {w.notes.length}</span>
      </FilterBar>

      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((n) => (
          <div key={n.id} className="rounded-2xl border border-white/70 bg-white/80 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-semibold">{n.title ?? n.note_type}</p>
                <p className="mt-0.5 text-[11.5px] text-muted-foreground">{n.client_name ?? "—"}{n.state ? ` · ${n.state}` : ""}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Pill tone={statusTone(n.status)}>{n.status}</Pill>
                {n.priority && <Pill tone={priorityTone(n.priority)}>{n.priority}</Pill>}
              </div>
            </div>
            <p className="mt-2 text-[12.5px] text-foreground/80 whitespace-pre-line">{n.body}</p>
            {n.due_at && <p className="mt-1.5 text-[11px] text-muted-foreground">Due {new Date(n.due_at).toLocaleDateString()}</p>}
            {n.resolution_note && <p className="mt-1.5 rounded-md bg-muted/40 p-2 text-[11.5px]"><span className="text-muted-foreground">Resolution: </span>{n.resolution_note}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {n.status !== "resolved" && <Button size="sm" variant="outline" onClick={() => setResolveId(n.id)}><CheckCircle2 className="mr-1 h-3 w-3" /> Resolve</Button>}
              <Button size="sm" variant="ghost" onClick={() => setFollowUpFrom(n.id)}><CalendarClock className="mr-1 h-3 w-3" /> Follow-up</Button>
              <Button size="sm" variant="ghost" onClick={() => setIssueFrom(n.id)}><ShieldAlert className="mr-1 h-3 w-3" /> Issue</Button>
              <Button size="sm" variant="ghost" onClick={() => setEscalationFrom(n.id)}><Flame className="mr-1 h-3 w-3" /> Escalate</Button>
              {STATUSES.filter((s) => s !== n.status).slice(0, 3).map((s) => (
                <Button key={s} size="sm" variant="ghost" onClick={async () => { await w.updateNote(n.id, { status: s }); toast.success("Status updated"); }}>{s}</Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <FormDialog
        open={addOpen} onOpenChange={setAddOpen}
        title="Add case note" submitLabel="Add note"
        fields={[
          { key: "client_name", label: "Family / client", type: "select", options },
          { key: "note_type", label: "Type", type: "select", options: NOTE_TYPES, defaultValue: "family_check_in" },
          { key: "title", label: "Title" },
          { key: "body", label: "Note", type: "textarea", required: true },
          { key: "priority", label: "Priority", type: "select", options: ["low","normal","high","urgent"], defaultValue: "normal" },
          { key: "status", label: "Status", type: "select", options: STATUSES, defaultValue: "open" },
          { key: "due_at", label: "Due", type: "date" },
        ]}
        onSubmit={async (v) => {
          const client_id = v.client_name ? fam.get(v.client_name) ?? null : null;
          await w.createNote({
            client_name: v.client_name || null, client_id,
            note_type: v.note_type || "general", title: v.title || null,
            body: v.body, priority: v.priority || null, status: v.status || "open",
            due_at: v.due_at ? new Date(v.due_at).toISOString() : null,
          } as any);
          toast.success("Note added");
        }}
      />
      <FormDialog
        open={!!resolveId} onOpenChange={(o) => !o && setResolveId(null)}
        title="Resolve note" submitLabel="Resolve"
        fields={[{ key: "resolution_note", label: "Resolution", type: "textarea", required: true }]}
        onSubmit={async (v) => {
          if (!resolveId) return;
          await w.updateNote(resolveId, { status: "resolved", resolved_at: new Date().toISOString(), resolution_note: v.resolution_note } as any);
          toast.success("Resolved");
        }}
      />
      <FormDialog
        open={!!followUpFrom} onOpenChange={(o) => !o && setFollowUpFrom(null)}
        title="Create follow-up from note" submitLabel="Create"
        fields={[
          { key: "title", label: "Title", required: true },
          { key: "priority", label: "Priority", type: "select", options: ["low","normal","high","urgent"], defaultValue: "normal" },
          { key: "due_at", label: "Due", type: "datetime" },
        ]}
        onSubmit={async (v) => {
          const n = noteById(followUpFrom);
          await w.createFollowUp({ client_id: n?.client_id ?? null, client_name: n?.client_name ?? null, title: v.title, description: n?.body, priority: v.priority, status: "open", category: "family_check_in", due_at: v.due_at ? new Date(v.due_at).toISOString() : null } as any);
          toast.success("Follow-up created");
        }}
      />
      <FormDialog
        open={!!issueFrom} onOpenChange={(o) => !o && setIssueFrom(null)}
        title="Log service issue from note" submitLabel="Log"
        fields={[
          { key: "title", label: "Title", required: true },
          { key: "issue_type", label: "Issue type", type: "select", options: ["scheduling","staffing","authorization","clinical","billing","other"], defaultValue: "clinical" },
          { key: "severity", label: "Severity", type: "select", options: ["low","medium","high","urgent"], defaultValue: "medium" },
          { key: "owner_department", label: "Owner", type: "select", options: ["scheduling","staffing","authorizations","clinical","qa","billing"] },
        ]}
        onSubmit={async (v) => {
          const n = noteById(issueFrom);
          await w.createServiceIssue({ client_id: n?.client_id ?? null, client_name: n?.client_name ?? null, title: v.title, description: n?.body, issue_type: v.issue_type, severity: v.severity, status: "open", owner_department: v.owner_department || null } as any);
          toast.success("Issue logged");
        }}
      />
      <FormDialog
        open={!!escalationFrom} onOpenChange={(o) => !o && setEscalationFrom(null)}
        title="Escalate from note" submitLabel="Escalate"
        fields={[
          { key: "reason", label: "Reason", required: true },
          { key: "escalation_type", label: "Type", type: "select", options: ["family_dissatisfaction","service_gap","clinical_concern","staffing_concern","authorization_risk","other"], defaultValue: "family_dissatisfaction" },
          { key: "severity", label: "Severity", type: "select", options: ["low","medium","high","urgent"], defaultValue: "medium" },
        ]}
        onSubmit={async (v) => {
          const n = noteById(escalationFrom);
          await w.createEscalation({ client_id: n?.client_id ?? null, client_name: n?.client_name ?? null, reason: v.reason, summary: n?.body, escalation_type: v.escalation_type, severity: v.severity, status: "open" } as any);
          toast.success("Escalation created");
        }}
      />
    </CMPage>
  );
}