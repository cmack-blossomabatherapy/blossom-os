import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CardFrame } from "../CardFrame";

export default function Supervision() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[] | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("rbt_supervision" as any)
      .select("id,supervision_date,bcba_id,supervision_type,notes,feedback,competency_area,status,signed_by_bcba_at,acknowledged_by_rbt_at")
      .eq("rbt_employee_id", user.id)
      .order("supervision_date", { ascending: false })
      .limit(20)
      .then(({ data }) => setRows((data as any[]) ?? []));
  }, [user?.id]);

  const last = rows?.[0];
  const nextPlanned = rows?.find((r) => new Date(r.supervision_date) > new Date());

  // Monthly status: percent of the current month's 5% requirement met (approx by hours logged this month)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthCount = rows?.filter((r) => (r.supervision_date ?? "").startsWith(currentMonth)).length ?? 0;

  const ack = async (id: string) => {
    await supabase.from("rbt_supervision" as any)
      .update({ acknowledged_by_rbt_at: new Date().toISOString() })
      .eq("id", id);
    setRows((prev) => prev?.map((r) => r.id === id ? { ...r, acknowledged_by_rbt_at: new Date().toISOString() } : r) ?? null);
  };

  const state = rows === null ? "loading" : rows.length === 0 ? "empty" : "success";

  return (
    <div className="space-y-3">
      <div className="grid gap-3 grid-cols-2">
        <CardFrame title="Last supervision" state={state} emptyLabel="No supervision on record yet.">
          {last && (
            <>
              <p className="text-lg font-semibold tracking-tight">
                {new Date(last.supervision_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{last.supervision_type ?? "General"}</p>
            </>
          )}
        </CardFrame>
        <CardFrame title="Next planned" state={rows === null ? "loading" : nextPlanned ? "success" : "empty"}
          emptyLabel="Nothing scheduled yet.">
          {nextPlanned && (
            <>
              <p className="text-lg font-semibold tracking-tight">
                {new Date(nextPlanned.supervision_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{nextPlanned.supervision_type ?? "General"}</p>
            </>
          )}
        </CardFrame>
      </div>

      <CardFrame title="This month" state="success" subtitle="Supervision entries logged">
        <p className="text-2xl font-semibold tabular-nums">{monthCount}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Your BCBA tracks the exact hour requirement in CentralReach.
        </p>
      </CardFrame>

      <CardFrame title="Feedback & follow-ups" state={state} emptyLabel="No supervision notes yet.">
        <ul className="space-y-3">
          {rows?.slice(0, 10).map((r) => (
            <li key={r.id} className="rounded-xl border border-border/70 bg-card p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {new Date(r.supervision_date).toLocaleDateString()}
                </span>
                {!r.acknowledged_by_rbt_at && r.signed_by_bcba_at && (
                  <button onClick={() => ack(r.id)}
                    className="text-xs rounded-full bg-primary text-primary-foreground px-3 py-1">
                    Acknowledge
                  </button>
                )}
              </div>
              {r.competency_area && (
                <p className="text-xs text-muted-foreground mt-1">{r.competency_area}</p>
              )}
              {r.feedback && <p className="text-sm mt-2 leading-relaxed">{r.feedback}</p>}
            </li>
          ))}
        </ul>
      </CardFrame>

      <div className="grid gap-3 grid-cols-2">
        <Link to="/rbt/app/learn" className="rounded-2xl border border-border/70 bg-card p-4 text-sm text-center hover:bg-muted/50">
          Follow-up training
        </Link>
        <Link to="/rbt/app/support" className="rounded-2xl border border-border/70 bg-card p-4 text-sm text-center hover:bg-muted/50">
          Request support
        </Link>
      </div>
    </div>
  );
}