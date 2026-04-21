import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Search } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  REVIEW_RATING_META, REVIEW_STATUS_META, REVIEW_TYPE_LABEL,
  type Employee, type EmployeeReview,
} from "@/lib/hr/types";

type Row = EmployeeReview & { employee: Pick<Employee, "id" | "first_name" | "last_name" | "job_title" | "state"> | null };

export default function Reviews() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "open" | "due" | "completed">("open");

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("employee_reviews")
      .select("*, employee:employees(id, first_name, last_name, job_title, state)")
      .order("due_date", { ascending: true, nullsFirst: false });
    setRows((data ?? []) as unknown as Row[]);
    setLoading(false);
  }

  const today = new Date().toISOString().slice(0, 10);
  const filtered = useMemo(() => {
    let r = rows;
    if (tab === "open") r = r.filter((x) => !["completed", "cancelled"].includes(x.status));
    else if (tab === "due") r = r.filter((x) => x.due_date && x.due_date <= today && !["completed", "cancelled"].includes(x.status));
    else if (tab === "completed") r = r.filter((x) => x.status === "completed");
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((x) => `${x.employee?.first_name} ${x.employee?.last_name} ${x.employee?.job_title}`.toLowerCase().includes(q));
    }
    return r;
  }, [rows, tab, search, today]);

  const counts = {
    open: rows.filter((x) => !["completed", "cancelled"].includes(x.status)).length,
    due: rows.filter((x) => x.due_date && x.due_date <= today && !["completed", "cancelled"].includes(x.status)).length,
    completed: rows.filter((x) => x.status === "completed").length,
  };

  return (
    <PageShell title="Performance Reviews" description="Review cycles, ratings, and acknowledgments." icon={Star}>
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="open">Open ({counts.open})</TabsTrigger>
              <TabsTrigger value="due">Due / Overdue ({counts.due})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
              <TabsTrigger value="all">All ({rows.length})</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee" className="pl-7 h-8 w-56 text-xs" />
          </div>
        </div>

        {loading ? <Skeleton className="h-40" /> : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">No reviews match.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3">Employee</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Rating</th>
                  <th className="py-2 pr-3">Reviewer</th>
                  <th className="py-2 pr-3">Due</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/30 hover:bg-muted/20">
                    <td className="py-2 pr-3">
                      {r.employee ? (
                        <Link to={`/hr/employees/${r.employee.id}`} className="font-medium text-foreground hover:text-primary">
                          {r.employee.first_name} {r.employee.last_name}
                        </Link>
                      ) : "—"}
                      <p className="text-[11px] text-muted-foreground">{r.employee?.job_title ?? ""} · {r.employee?.state ?? ""}</p>
                    </td>
                    <td className="py-2 pr-3 text-foreground">{REVIEW_TYPE_LABEL[r.review_type]}</td>
                    <td className="py-2 pr-3">
                      <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border", REVIEW_STATUS_META[r.status].tone)}>
                        {REVIEW_STATUS_META[r.status].label}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      {r.overall_rating ? (
                        <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border", REVIEW_RATING_META[r.overall_rating].tone)}>
                          {REVIEW_RATING_META[r.overall_rating].label}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{r.reviewer_name ?? "—"}</td>
                    <td className="py-2 pr-3 tabular-nums text-muted-foreground">{r.due_date ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageShell>
  );
}