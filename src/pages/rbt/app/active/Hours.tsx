import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CardFrame } from "../CardFrame";
import { FreshnessPill, freshness } from "./freshness";
import { useRbtIdentity } from "../useRbtIdentity";
import {
  deriveHoursSnapshotFromCanonical,
  type CanonicalHoursSnapshot,
} from "@/lib/os/reporting/canonicalRoleBridge";

export default function Hours() {
  const { employeeId, writableEmployeeId, loading: idLoading, isPreviewing } = useRbtIdentity();
  const [snap, setSnap] = useState<any | null | undefined>(undefined);
  const [canonicalSnap, setCanonicalSnap] = useState<CanonicalHoursSnapshot | null>(null);
  const [issues, setIssues] = useState<any[] | null>(null);
  const [form, setForm] = useState({ issue_type: "missing_hours", expected: "", reported: "", description: "" });
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = () => {
    if (idLoading) return;
    if (!employeeId) { setSnap(null); setIssues([]); return; }
    supabase.from("rbt_hours_snapshots" as any)
      .select("period_start,period_end,scheduled_hours,completed_hours,cancelled_hours,imported_hours,last_import_at,source")
      .eq("employee_id", employeeId)
      .order("period_end", { ascending: false })
      .limit(1)
      .then(async ({ data }) => {
        const row = (data as any[])?.[0] ?? null;
        setSnap(row);
        if (!row) {
          // Role table has no snapshot — fold in canonical delivered rows.
          const canon = await deriveHoursSnapshotFromCanonical({ employeeId });
          setCanonicalSnap(canon);
        } else {
          setCanonicalSnap(null);
        }
      });
    supabase.from("rbt_hours_issues" as any)
      .select("id,issue_type,description,status,created_at,resolution_note,resolved_at")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setIssues((data as any[]) ?? []));
  };
  useEffect(load, [employeeId, idLoading]);

  const submit = async () => {
    if (!writableEmployeeId || !form.description.trim()) return;
    setErr(null);
    const { error } = await supabase.from("rbt_hours_issues" as any).insert({
      employee_id: writableEmployeeId,
      period_start: snap?.period_start,
      period_end: snap?.period_end,
      issue_type: form.issue_type,
      expected_hours: form.expected ? Number(form.expected) : null,
      reported_hours: form.reported ? Number(form.reported) : null,
      description: form.description.trim(),
      status: "open",
    });
    if (error) return setErr(error.message);
    setSent(true);
    setForm({ issue_type: "missing_hours", expected: "", reported: "", description: "" });
    load();
  };

  const usingCanonical = snap === null && !!canonicalSnap;
  const activeSnap = snap ?? (canonicalSnap
    ? {
        period_start: canonicalSnap.periodStart,
        period_end: canonicalSnap.periodEnd,
        scheduled_hours: null,
        completed_hours: canonicalSnap.completedHours,
        cancelled_hours: canonicalSnap.cancelledHours,
        imported_hours: canonicalSnap.importedHours,
        last_import_at: canonicalSnap.lastImportAt,
        source: "canonical",
      }
    : null);
  const discrepancy = activeSnap && !usingCanonical
    ? Math.abs((activeSnap.completed_hours ?? 0) - (activeSnap.imported_hours ?? 0)) > 0.25
    : false;
  const fresh = freshness(activeSnap?.last_import_at, 72);

  return (
    <div className="space-y-3">
      <CardFrame
        title={usingCanonical ? "Month to date" : "Current pay period"}
        subtitle={activeSnap ? `${activeSnap.period_start} → ${activeSnap.period_end}` : undefined}
        state={snap === undefined ? "loading" : activeSnap === null ? "empty" : "success"}
        emptyLabel="No hours have been imported yet."
      >
        {activeSnap && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="Scheduled"
                value={activeSnap.scheduled_hours}
                unavailable={usingCanonical}
                unavailableHint="Not available yet"
              />
              <Stat label="Completed" value={activeSnap.completed_hours} />
              <Stat label="Cancelled" value={activeSnap.cancelled_hours} tone="muted" />
              <Stat label="Imported" value={activeSnap.imported_hours} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <FreshnessPill f={fresh} />
              {discrepancy && (
                <span className="text-xs text-amber-700 dark:text-amber-400">
                  Possible discrepancy between completed & imported
                </span>
              )}
            </div>
            {usingCanonical && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Scheduled hours will appear here once your schedule is finalized. If something looks off, submit a report below.
              </p>
            )}
          </>
        )}
      </CardFrame>

      <CardFrame title="Report an hours issue" state="success"
        action={
          <button onClick={submit} disabled={!form.description.trim() || isPreviewing}
            className="rounded-xl bg-primary text-primary-foreground px-5 h-11 font-medium disabled:opacity-60">
            Submit
          </button>
        }
      >
        <div className="space-y-2">
          <select value={form.issue_type} onChange={(e) => setForm({ ...form, issue_type: e.target.value })}
            className="w-full h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm">
            <option value="missing_hours">Missing hours</option>
            <option value="extra_hours">Extra hours logged</option>
            <option value="wrong_pay_period">Wrong pay period</option>
            <option value="cancellation_disputed">Cancellation looks wrong</option>
            <option value="other">Other</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" step="0.25" placeholder="Expected hrs" value={form.expected}
              onChange={(e) => setForm({ ...form, expected: e.target.value })}
              className="h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm" />
            <input type="number" step="0.25" placeholder="Reported hrs" value={form.reported}
              onChange={(e) => setForm({ ...form, reported: e.target.value })}
              className="h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm" />
          </div>
          <textarea rows={3} placeholder="Tell us what happened" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-xl bg-muted/60 border border-border p-3 text-sm" />
          {err && <p className="text-xs text-destructive">{err}</p>}
          {sent && <p className="text-xs text-primary">Thanks — payroll will look into this.</p>}
        </div>
      </CardFrame>

      <CardFrame title="Your reports" state={issues === null ? "loading" : issues.length === 0 ? "empty" : "success"}
        emptyLabel="No hours reports submitted.">
        <ul className="divide-y divide-border/70">
          {issues?.map((i) => (
            <li key={i.id} className="py-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize">{i.issue_type.replace(/_/g, " ")}</span>
                <span className="text-xs rounded-full bg-muted px-2 py-0.5 capitalize">{i.status}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{i.description}</p>
              {i.resolution_note && (
                <p className="text-xs mt-1 rounded-lg bg-muted p-2">{i.resolution_note}</p>
              )}
            </li>
          ))}
        </ul>
      </CardFrame>

    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  unavailable,
  unavailableHint,
}: {
  label: string;
  value: number | null | undefined;
  tone?: "muted";
  unavailable?: boolean;
  unavailableHint?: string;
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      {unavailable ? (
        <>
          <p className="text-xl font-semibold tabular-nums mt-0.5 text-muted-foreground">—</p>
          {unavailableHint && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{unavailableHint}</p>
          )}
        </>
      ) : (
        <p className={`text-xl font-semibold tabular-nums mt-0.5 ${tone === "muted" ? "text-muted-foreground" : ""}`}>
          {(Number(value) || 0).toFixed(2)}
        </p>
      )}
    </div>
  );
}