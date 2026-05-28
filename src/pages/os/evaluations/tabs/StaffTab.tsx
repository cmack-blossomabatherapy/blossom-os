import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EvaluationsData } from "../useEvaluationsData";
import type { EvalStaff, Evaluation } from "../types";
import { SelfBadge, LeadershipBadge, MeetingBadge, FinalBadge, fmtDate } from "../statusBadges";

type Filter = "all" | "bcba" | "rbt" | "quarterly" | "annual" | "overdue" | "upcoming" | "in_progress" | "complete";

function currentEval(staffId: string, evaluations: Evaluation[]) {
  return evaluations
    .filter((e) => e.staff_id === staffId && e.final_status !== "Complete")
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))[0] ?? null;
}
function lastCompleted(staffId: string, evaluations: Evaluation[]) {
  return evaluations
    .filter((e) => e.staff_id === staffId && e.final_status === "Complete" && e.completed_at)
    .sort((a, b) => +new Date(b.completed_at!) - +new Date(a.completed_at!))[0] ?? null;
}

export default function StaffTab({
  data,
  onOpenStaff,
  onAddStaff,
}: {
  data: EvaluationsData;
  onOpenStaff: (id: string) => void;
  onAddStaff: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [reviewerFilter, setReviewerFilter] = useState<string>("all");

  const reviewers = useMemo(() => {
    const m = new Map<string, string>();
    data.staff.forEach((s) => { if (s.supervisor_id && s.supervisor_name) m.set(s.supervisor_id, s.supervisor_name); });
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [data.staff]);
  const states = useMemo(() => Array.from(new Set(data.staff.map((s) => s.state).filter(Boolean))) as string[], [data.staff]);

  const rows = useMemo(() => {
    let list = data.staff.map((s) => {
      const cur = currentEval(s.id, data.evaluations);
      const last = lastCompleted(s.id, data.evaluations);
      return { s, cur, last };
    });
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(({ s }) =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q)
        || s.email.toLowerCase().includes(q)
        || (s.supervisor_name ?? "").toLowerCase().includes(q),
      );
    }
    if (filter === "bcba") list = list.filter(({ s }) => s.role === "BCBA");
    else if (filter === "rbt") list = list.filter(({ s }) => s.role === "RBT");
    else if (filter === "quarterly") list = list.filter(({ cur }) => cur?.evaluation_type === "Quarterly");
    else if (filter === "annual") list = list.filter(({ cur }) => cur?.evaluation_type === "Annual");
    else if (filter === "overdue") list = list.filter(({ cur }) => cur && (cur.final_status === "Overdue" || (cur.next_review_date && new Date(cur.next_review_date) < new Date())));
    else if (filter === "upcoming") list = list.filter(({ cur }) => {
      if (!cur?.next_review_date) return false;
      const d = new Date(cur.next_review_date);
      const in30 = new Date(); in30.setDate(in30.getDate() + 30);
      return d >= new Date() && d <= in30;
    });
    else if (filter === "in_progress") list = list.filter(({ cur }) => cur && cur.final_status === "In Progress");
    else if (filter === "complete") list = list.filter(({ last }) => !!last);
    if (stateFilter !== "all") list = list.filter(({ s }) => s.state === stateFilter);
    if (reviewerFilter !== "all") list = list.filter(({ s }) => s.supervisor_id === reviewerFilter);
    return list;
  }, [data, query, filter, stateFilter, reviewerFilter]);

  const FILTERS: [Filter, string][] = [
    ["all", "All"], ["bcba", "BCBA"], ["rbt", "RBT"],
    ["quarterly", "Quarterly"], ["annual", "Annual"],
    ["overdue", "Overdue"], ["upcoming", "Upcoming"],
    ["in_progress", "In Progress"], ["complete", "Complete"],
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-8 h-9" placeholder="Search by name, email, or reviewer…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
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

      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cn(
              "h-7 px-3 rounded-lg text-[12px] transition-colors",
              filter === k ? "bg-foreground text-background" : "text-muted-foreground border border-border/70 hover:bg-muted",
            )}
          >{label}</button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
        {data.loading ? (
          <div className="p-8 text-sm text-muted-foreground text-center">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium">No staff members yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Add BCBAs and RBTs to start tracking evaluations.</p>
            <Button size="sm" className="mt-4" onClick={onAddStaff}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Staff Member
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
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
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{s.first_name} {s.last_name}</div>
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
    </div>
  );
}