import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronRight, Download, Mail, BellRing, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { EvaluationsData } from "../useEvaluationsData";
import type { EvalStaff, Evaluation } from "../types";
import { SelfBadge, LeadershipBadge, MeetingBadge, FinalBadge, fmtDate } from "../statusBadges";

export type SavedView =
  | "all" | "overdue" | "due_this_month" | "self_pending" | "leadership_pending"
  | "meetings_needed" | "ready_to_finalize" | "complete" | "not_scheduled";

const SAVED_VIEWS: { id: SavedView; label: string }[] = [
  { id: "all", label: "All Evaluations" },
  { id: "overdue", label: "Overdue" },
  { id: "due_this_month", label: "Due This Month" },
  { id: "self_pending", label: "Self Evals Pending" },
  { id: "leadership_pending", label: "Leadership Pending" },
  { id: "meetings_needed", label: "Meetings Needed" },
  { id: "ready_to_finalize", label: "Ready to Finalize" },
  { id: "complete", label: "Complete" },
  { id: "not_scheduled", label: "Not Scheduled" },
];

function currentEval(staffId: string, evaluations: Evaluation[]) {
  const open = evaluations.filter((e) => e.staff_id === staffId && e.final_status !== "Complete");
  if (open.length === 0) return null;
  // Prefer evaluations that are actively in progress (self/leadership/meeting started)
  // over "Not Started" placeholders, then pick the one with the soonest next review date.
  const rank = (e: Evaluation) => {
    if (e.final_status === "In Progress") return 0;
    if (e.self_status !== "Not Sent" || e.leadership_status !== "Not Started" || e.meeting_status !== "Not Scheduled") return 1;
    return 2;
  };
  return open.sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    const da = a.next_review_date ? +new Date(a.next_review_date) : Infinity;
    const db = b.next_review_date ? +new Date(b.next_review_date) : Infinity;
    if (da !== db) return da - db;
    return +new Date(b.created_at) - +new Date(a.created_at);
  })[0];
}
function lastCompleted(staffId: string, evaluations: Evaluation[]) {
  return evaluations
    .filter((e) => e.staff_id === staffId && e.final_status === "Complete" && e.completed_at)
    .sort((a, b) => +new Date(b.completed_at!) - +new Date(a.completed_at!))[0] ?? null;
}

const isTest = (s: EvalStaff) => (s.notes ?? "").startsWith("[TEST]");

export default function StaffTab({
  data,
  onOpenStaff,
  initialView,
}: {
  data: EvaluationsData;
  onOpenStaff: (id: string) => void;
  initialView?: SavedView;
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<SavedView>(initialView ?? "all");
  useEffect(() => { if (initialView) setView(initialView); }, [initialView]);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [reviewerFilter, setReviewerFilter] = useState<string>("all");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [includeTest, setIncludeTest] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<null | "self" | "reminder" | "inactive">(null);
  const [working, setWorking] = useState(false);

  const reviewers = useMemo(() => {
    const m = new Map<string, string>();
    data.staff.forEach((s) => { if (s.supervisor_id && s.supervisor_name) m.set(s.supervisor_id, s.supervisor_name); });
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [data.staff]);
  const states = useMemo(() => Array.from(new Set(data.staff.map((s) => s.state).filter(Boolean))) as string[], [data.staff]);

  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const rows = useMemo(() => {
    let list = data.staff.map((s) => {
      const cur = currentEval(s.id, data.evaluations);
      const last = lastCompleted(s.id, data.evaluations);
      return { s, cur, last };
    });
    if (!includeInactive) list = list.filter(({ s }) => s.active_status);
    if (!includeTest) list = list.filter(({ s }) => !isTest(s));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(({ s }) =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q)
        || s.email.toLowerCase().includes(q)
        || (s.supervisor_name ?? "").toLowerCase().includes(q),
      );
    }
    if (roleFilter !== "all") list = list.filter(({ s }) => s.role === roleFilter);
    if (typeFilter !== "all") list = list.filter(({ cur }) => cur?.evaluation_type === typeFilter);
    if (view === "overdue") list = list.filter(({ cur }) => cur && (cur.final_status === "Overdue" || (cur.next_review_date && new Date(cur.next_review_date) < now)));
    else if (view === "due_this_month") list = list.filter(({ cur }) => {
      if (!cur?.next_review_date) return false;
      const d = new Date(cur.next_review_date);
      return d >= now && d <= endOfMonth;
    });
    else if (view === "self_pending") list = list.filter(({ cur }) => cur && cur.self_status !== "Completed");
    else if (view === "leadership_pending") list = list.filter(({ cur }) => cur && cur.self_status === "Completed" && cur.leadership_status !== "Completed");
    else if (view === "meetings_needed") list = list.filter(({ cur }) => cur && cur.leadership_status === "Completed" && cur.meeting_status !== "Completed");
    else if (view === "ready_to_finalize") list = list.filter(({ cur }) => cur && cur.self_status === "Completed" && cur.leadership_status === "Completed" && cur.meeting_status === "Completed" && cur.final_status !== "Complete");
    else if (view === "complete") list = list.filter(({ last }) => !!last);
    else if (view === "not_scheduled") list = list.filter(({ cur }) => !cur);
    if (stateFilter !== "all") list = list.filter(({ s }) => s.state === stateFilter);
    if (reviewerFilter !== "all") list = list.filter(({ s }) => s.supervisor_id === reviewerFilter);
    return list;
  }, [data, query, view, roleFilter, typeFilter, stateFilter, reviewerFilter, includeInactive, includeTest]);

  const visibleIds = useMemo(() => rows.map((r) => r.s.id), [rows]);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(visibleIds));
  }
  function toggleOne(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  function exportCSV() {
    const picked = rows.filter((r) => selected.has(r.s.id));
    if (picked.length === 0) return toast({ title: "Select staff to export" });
    const header = ["First Name","Last Name","Email","Role","State","Reviewer","Type","Next Review","Self","Leadership","Meeting","Final","Last Completed"];
    const lines = picked.map(({ s, cur, last }) => [
      s.first_name, s.last_name, s.email, s.role, s.state ?? "",
      s.supervisor_name ?? "", cur?.evaluation_type ?? s.evaluation_frequency,
      cur?.next_review_date ?? "", cur?.self_status ?? "", cur?.leadership_status ?? "",
      cur?.meeting_status ?? "", cur?.final_status ?? "Not Scheduled",
      last?.completed_at ?? "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `evaluations-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  async function bulkMarkInactive() {
    const ids = Array.from(selected);
    setWorking(true);
    const { error } = await supabase.from("evaluation_staff").update({ active_status: false }).in("id", ids);
    setWorking(false); setBulkConfirm(null);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: `${ids.length} marked inactive` });
    setSelected(new Set()); data.refresh();
  }

  async function bulkQueueEmail(emailType: "Self Eval Request" | "Self Eval Reminder") {
    const picked = rows.filter((r) => selected.has(r.s.id));
    const template = data.templates.find((t) =>
      emailType === "Self Eval Request"
        ? t.template_key === "self_eval_request"
        : t.template_key === "self_eval_reminder",
    );
    if (!template) {
      setBulkConfirm(null);
      return toast({ title: "Email template missing", description: "Add the template under Email Queue first.", variant: "destructive" });
    }
    const rowsToInsert = picked
      .filter((r) => r.s.email)
      .map((r) => ({
        evaluation_id: r.cur?.id ?? null,
        staff_id: r.s.id,
        recipient_email: r.s.email,
        email_type: template.email_type,
        subject: template.subject.replace(/\{\{employee_first_name\}\}/g, r.s.first_name),
        body: template.body.replace(/\{\{employee_first_name\}\}/g, r.s.first_name),
        template_key: template.template_key,
        status: "Queued" as const,
      }));
    if (rowsToInsert.length === 0) {
      setBulkConfirm(null);
      return toast({ title: "No eligible staff", description: "Selected staff are missing email addresses.", variant: "destructive" });
    }
    setWorking(true);
    const { error } = await supabase.from("evaluation_emails").insert(rowsToInsert);
    setWorking(false); setBulkConfirm(null);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: `${rowsToInsert.length} email(s) queued`, description: "Open Email Queue to send or review." });
    setSelected(new Set()); data.refresh();
  }

  const confirmCopy = bulkConfirm === "inactive"
    ? { title: "Mark staff inactive?", body: `You are about to mark ${selected.size} staff inactive. They will be hidden from active filters and skipped on upcoming evaluations. This cannot be undone without admin support.`, action: bulkMarkInactive, label: "Mark inactive" }
    : bulkConfirm === "self"
    ? { title: "Send self evaluations?", body: `You are about to queue self evaluation emails for ${selected.size} staff. Emails will appear in the Email Queue.`, action: () => bulkQueueEmail("Self Eval Request"), label: "Queue emails" }
    : bulkConfirm === "reminder"
    ? { title: "Send reminders?", body: `You are about to queue reminder emails for ${selected.size} staff.`, action: () => bulkQueueEmail("Self Eval Reminder"), label: "Queue reminders" }
    : null;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-8 h-9" placeholder="Search by name, email, or reviewer…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-9 w-[120px]"><SelectValue placeholder="All roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="BCBA">BCBA</SelectItem>
            <SelectItem value="RBT">RBT</SelectItem>
            <SelectItem value="Office">Office Staff</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-[130px]"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="10-Day">10-Day</SelectItem>
            <SelectItem value="30-Day">30-Day</SelectItem>
            <SelectItem value="90-Day">90-Day</SelectItem>
            <SelectItem value="Quarterly">Quarterly</SelectItem>
            <SelectItem value="Annual">Annual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="All states" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={reviewerFilter} onValueChange={setReviewerFilter}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="All reviewers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All reviewers</SelectItem>
            {reviewers.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Saved views */}
      <div className="flex flex-wrap items-center gap-1.5">
        {SAVED_VIEWS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={cn(
              "h-7 px-3 rounded-lg text-[12px] transition-colors",
              view === id ? "bg-foreground text-background" : "text-muted-foreground border border-border/70 hover:bg-muted",
            )}
          >{label}</button>
        ))}
        <div className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox checked={includeInactive} onCheckedChange={(v) => setIncludeInactive(!!v)} /> Include inactive
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox checked={includeTest} onCheckedChange={(v) => setIncludeTest(!!v)} /> Include test data
          </label>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="rounded-xl border border-border/70 bg-muted/40 px-3 py-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium mr-2">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => setBulkConfirm("self")} disabled={working}>
            <Mail className="h-3.5 w-3.5 mr-1.5" /> Send self evaluations
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBulkConfirm("reminder")} disabled={working}>
            <BellRing className="h-3.5 w-3.5 mr-1.5" /> Send reminders
          </Button>
          <Button size="sm" variant="outline" onClick={exportCSV} disabled={working}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBulkConfirm("inactive")} disabled={working}>
            <UserMinus className="h-3.5 w-3.5 mr-1.5" /> Mark inactive
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="ml-auto text-xs">Clear</Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
        {data.loading ? (
          <div className="p-8 text-sm text-muted-foreground text-center">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium">No staff members found.</p>
            <p className="text-xs text-muted-foreground mt-1">Staff are managed through User Management. Ask HR or a Super Admin to add staff there.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 w-8">
                    <Checkbox
                      checked={allSelected ? true : someSelected ? "indeterminate" : false}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="text-left font-medium px-4 py-3">Employee</th>
                  <th className="text-left font-medium px-3 py-3">Role</th>
                  <th className="text-left font-medium px-3 py-3">State</th>
                  <th className="text-left font-medium px-3 py-3">Reviewer</th>
                  <th className="text-left font-medium px-3 py-3">Type</th>
                  <th className="text-left font-medium px-3 py-3">Next Review</th>
                  <th className="text-left font-medium px-3 py-3">Self</th>
                  <th className="text-left font-medium px-3 py-3">Leadership</th>
                  <th className="text-left font-medium px-3 py-3">Meeting</th>
                  <th className="text-left font-medium px-3 py-3">Final</th>
                  <th className="text-left font-medium px-3 py-3">Last Completed</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {rows.map(({ s, cur, last }) => (
                  <tr
                    key={s.id}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => onOpenStaff(s.id)}
                  >
                    <td className="px-3 py-2.5" onClick={(e) => { e.stopPropagation(); toggleOne(s.id); }}>
                      <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleOne(s.id)} aria-label="Select row" />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium flex items-center gap-1.5">
                        {s.first_name} {s.last_name}
                        {isTest(s) && <span className="text-[9px] uppercase tracking-wider rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 border border-amber-500/30">Test</span>}
                        {!s.active_status && <span className="text-[9px] uppercase tracking-wider rounded bg-muted text-muted-foreground px-1.5 py-0.5 border">Inactive</span>}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{s.email}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs">{s.role}</td>
                    <td className="px-3 py-2.5 text-xs">{s.state ?? "—"}</td>
                    <td className="px-3 py-2.5 text-xs">{s.supervisor_name ?? "—"}</td>
                    <td className="px-3 py-2.5 text-xs">{cur?.evaluation_type ?? s.evaluation_frequency}</td>
                    <td className="px-3 py-2.5 text-xs">{fmtDate(cur?.next_review_date ?? null)}</td>
                    <td className="px-3 py-2.5">{cur ? <SelfBadge s={cur.self_status} /> : <span className="text-xs text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2.5">{cur ? <LeadershipBadge s={cur.leadership_status} /> : <span className="text-xs text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2.5">{cur ? <MeetingBadge s={cur.meeting_status} /> : <span className="text-xs text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2.5">{cur ? <FinalBadge s={cur.final_status} /> : <span className="text-xs text-muted-foreground">Not Scheduled</span>}</td>
                    <td className="px-3 py-2.5 text-xs">{fmtDate(last?.completed_at ?? null)}</td>
                    <td className="px-3 py-2.5"><ChevronRight className="h-4 w-4 text-muted-foreground" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{rows.length} of {data.staff.length} staff members</p>

      <AlertDialog open={!!bulkConfirm} onOpenChange={(o) => !o && setBulkConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCopy?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmCopy?.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmCopy?.action(); }} disabled={working}>
              {working ? "Working…" : confirmCopy?.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}