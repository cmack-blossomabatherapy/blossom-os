import { useMemo, useState } from "react";
import { CalendarDays, Filter, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { EvaluationsData } from "../useEvaluationsData";
import type { Evaluation, EvalStaff } from "../types";

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function humanLabel(ev: Evaluation): string {
  if (ev.eval_label) return ev.eval_label;
  if (ev.evaluation_type === "30-Day") return "30-Day Review";
  if (ev.evaluation_type === "Annual") return "Annual Performance Review";
  return "Quarterly Review";
}

function daysUntil(d?: string | null): number | null {
  if (!d) return null;
  const ms = new Date(d).getTime() - new Date(new Date().toDateString()).getTime();
  return Math.round(ms / 86400000);
}

export default function ScheduleTab({
  data,
  onOpenStaff,
}: {
  data: EvaluationsData;
  onOpenStaff: (staffId: string) => void;
}) {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [windowFilter, setWindowFilter] = useState<string>("90");
  const [query, setQuery] = useState("");

  const staffById = useMemo(() => {
    const m = new Map<string, EvalStaff>();
    data.staff.forEach((s) => m.set(s.id, s));
    return m;
  }, [data.staff]);

  const rows = useMemo(() => {
    return data.evaluations
      .filter((e) => e.final_status !== "Complete")
      .filter((e) => !!e.due_date)
      .map((e) => {
        const staff = staffById.get(e.staff_id);
        const reviewer = e.assigned_reviewer_id ? staffById.get(e.assigned_reviewer_id) : null;
        return { e, staff, reviewer, days: daysUntil(e.due_date) };
      })
      .filter((r) => !!r.staff)
      .filter((r) => (roleFilter === "all" ? true : r.staff!.role === roleFilter))
      .filter((r) => (typeFilter === "all" ? true : r.e.evaluation_type === typeFilter))
      .filter((r) => {
        if (windowFilter === "overdue") return (r.days ?? 0) < 0;
        if (windowFilter === "all") return true;
        const max = Number(windowFilter);
        return (r.days ?? 0) <= max;
      })
      .filter((r) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          r.staff!.first_name.toLowerCase().includes(q) ||
          r.staff!.last_name.toLowerCase().includes(q) ||
          r.staff!.email.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.e.due_date! < b.e.due_date! ? -1 : 1));
  }, [data.evaluations, staffById, roleFilter, typeFilter, windowFilter, query]);

  const overdueCount = rows.filter((r) => (r.days ?? 0) < 0).length;
  const next30 = rows.filter((r) => (r.days ?? 0) >= 0 && (r.days ?? 0) <= 30).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="text-[11px] text-muted-foreground">Overdue</div>
          <div className="text-2xl font-semibold mt-1 flex items-center gap-2">
            {overdueCount}
            {overdueCount > 0 && <AlertTriangle className="h-4 w-4 text-destructive" />}
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="text-[11px] text-muted-foreground">Due next 30 days</div>
          <div className="text-2xl font-semibold mt-1">{next30}</div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="text-[11px] text-muted-foreground">Total upcoming</div>
          <div className="text-2xl font-semibold mt-1">{rows.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border/60">
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mr-1">
            <Filter className="h-3.5 w-3.5" /> Filters
          </div>
          <Input
            placeholder="Search employee…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-48 text-xs"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="BCBA">BCBA</SelectItem>
              <SelectItem value="RBT">RBT</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="30-Day">30-Day</SelectItem>
              <SelectItem value="Quarterly">Quarterly</SelectItem>
              <SelectItem value="Annual">Annual</SelectItem>
            </SelectContent>
          </Select>
          <Select value={windowFilter} onValueChange={setWindowFilter}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="overdue">Overdue only</SelectItem>
              <SelectItem value="30">Next 30 days</SelectItem>
              <SelectItem value="60">Next 60 days</SelectItem>
              <SelectItem value="90">Next 90 days</SelectItem>
              <SelectItem value="365">Next year</SelectItem>
              <SelectItem value="all">All upcoming</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <CalendarDays className="h-8 w-8 mx-auto mb-3 opacity-40" />
            No evaluations match these filters.
            <div className="text-[11px] mt-1">Schedules are generated automatically when staff are added with a hire date.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="text-[11px] uppercase tracking-wide text-muted-foreground bg-muted/30">
                <tr>
                  <th className="text-left font-medium px-4 py-2.5">Employee</th>
                  <th className="text-left font-medium px-4 py-2.5">Role</th>
                  <th className="text-left font-medium px-4 py-2.5">Review Type</th>
                  <th className="text-left font-medium px-4 py-2.5">Due Date</th>
                  <th className="text-left font-medium px-4 py-2.5">Days Until Due</th>
                  <th className="text-left font-medium px-4 py-2.5">Reviewer</th>
                  <th className="text-left font-medium px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ e, staff, reviewer, days }) => {
                  const overdue = (days ?? 0) < 0;
                  const dueSoon = (days ?? 0) >= 0 && (days ?? 0) <= 14;
                  return (
                    <tr
                      key={e.id}
                      onClick={() => onOpenStaff(staff!.id)}
                      className="border-t border-border/50 hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        {staff!.first_name} {staff!.last_name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{staff!.role}</td>
                      <td className="px-4 py-3">{humanLabel(e)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(e.due_date)}</td>
                      <td className="px-4 py-3">
                        {overdue ? (
                          <Badge variant="destructive" className="text-[10.5px]">
                            {Math.abs(days!)}d overdue
                          </Badge>
                        ) : dueSoon ? (
                          <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 text-[10.5px]">
                            in {days}d
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">in {days}d</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {reviewer ? `${reviewer.first_name} ${reviewer.last_name}` : "Unassigned"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-muted-foreground">{e.final_status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}