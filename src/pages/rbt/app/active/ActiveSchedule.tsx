import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRbtIdentity } from "../useRbtIdentity";
import { CardFrame } from "../CardFrame";
import { FreshnessPill, freshness } from "./freshness";
import { useCrSync } from "./useCrSync";
import { crSessionUrl } from "./cr";
import { ExternalLink, Flag } from "lucide-react";
import CanonicalSessionsCard from "@/components/reports/CanonicalSessionsCard";

type Tab = "today" | "week" | "upcoming";
type StatusFilter = "all" | "active" | "cancelled";

function matchesFilter(row: any, f: StatusFilter): boolean {
  const s = String(row.status ?? "").toLowerCase();
  if (f === "all") return true;
  if (f === "cancelled") return /cancel/.test(s);
  return !/cancel/.test(s);
}

function StatusPill({ status }: { status?: string | null }) {
  if (!status) return null;
  const tone = /cancel/i.test(status)
    ? "bg-destructive/10 text-destructive"
    : /confirm|scheduled|active/i.test(status)
    ? "bg-primary/10 text-primary"
    : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${tone}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function ActiveSchedule() {
  const { employeeId, loading: idLoading } = useRbtIdentity();
  const [tab, setTab] = useState<Tab>("today");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const crSync = useCrSync();

  useEffect(() => {
    if (idLoading) return;
    if (!employeeId) { setRows([]); return; }
    setError(null);
    const now = new Date();
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    if (tab === "today") end.setDate(start.getDate() + 1);
    else if (tab === "week") end.setDate(start.getDate() + 7);
    else end.setDate(start.getDate() + 30);

    supabase.from("rbt_shift_events" as any)
      .select("id,starts_at,ends_at,client_initials,client_external_id,service_code,location_type,status,bcba_first_name,bcba_last_initial,external_id,source,created_at")
      .eq("employee_id", employeeId)
      .gte("starts_at", start.toISOString())
      .lt("starts_at", end.toISOString())
      .order("starts_at")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setRows((data as any[]) ?? []);
      });
  }, [employeeId, idLoading, tab]);

  const filtered = useMemo(
    () => (rows ?? []).filter((r) => matchesFilter(r, statusFilter)),
    [rows, statusFilter],
  );
  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    filtered.forEach((r) => {
      const k = new Date(r.starts_at).toDateString();
      map.set(k, [...(map.get(k) ?? []), r]);
    });
    return Array.from(map.entries());
  }, [filtered]);
  const totalMinutes = useMemo(
    () => filtered.reduce((s, r) => s + Math.max(0, (new Date(r.ends_at).getTime() - new Date(r.starts_at).getTime()) / 60000), 0),
    [filtered],
  );

  const crFresh = freshness(crSync?.last_success_at, crSync?.stale_after_hours ?? 24);
  const state: "loading" | "empty" | "success" | "error" =
    error ? "error" : rows === null || idLoading ? "loading" : filtered.length === 0 ? "empty" : "success";

  const emptyLabel = rows && rows.length > 0 && filtered.length === 0
    ? `No ${statusFilter === "cancelled" ? "cancelled" : "active"} sessions in this range.`
    : "No sessions in this range. If this looks wrong, CentralReach may not be synced yet.";

  return (
    <div className="space-y-3">
      {!employeeId && !idLoading && (
        <div className="rounded-xl bg-destructive/10 text-destructive text-xs p-3">
          We couldn't match your login to a clinician record. Ask an admin to link you in the CentralReach Data Hub.
        </div>
      )}
      {/* Freshness banner */}
      {crFresh.stale && (
        <div className="rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs p-3">
          Schedule data may be stale — {crFresh.label}. CentralReach is the source of truth.
        </div>
      )}

      {/* Tabs */}
      <div className="rounded-2xl bg-muted/60 p-1 grid grid-cols-3 text-sm">
        {(["today", "week", "upcoming"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`h-9 rounded-xl capitalize transition ${tab === t ? "bg-card shadow-sm font-medium" : "text-muted-foreground"}`}>
            {t === "week" ? "This week" : t}
          </button>
        ))}
      </div>

      {/* Status filter + summary */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex rounded-full bg-muted/60 p-0.5 text-xs">
          {(["all", "active", "cancelled"] as StatusFilter[]).map((f) => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 h-7 rounded-full capitalize transition ${statusFilter === f ? "bg-card shadow-sm font-medium" : "text-muted-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
        {rows && (
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {filtered.length} session{filtered.length === 1 ? "" : "s"} · {(totalMinutes / 60).toFixed(1)} hrs
          </p>
        )}
      </div>

      <CardFrame title={tab === "today" ? "Today" : tab === "week" ? "This week" : "Upcoming (30 days)"}
        state={state}
        emptyLabel={emptyLabel}
        errorLabel="We couldn't load your schedule right now."
        subtitle={crFresh.label}
      >
        <div className="space-y-4">
          {grouped.map(([day, list]) => (
            <div key={day}>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                {new Date(day).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
              </p>
              <ul className="space-y-1.5">
                {list.map((r: any) => (
                  <li key={r.id} className="rounded-xl border border-border/70 bg-card">
                    <button className="w-full p-3 flex items-center gap-3 text-left"
                      onClick={() => setOpenId(openId === r.id ? null : r.id)}>
                      <span className="text-sm font-medium tabular-nums w-16 shrink-0">
                        {new Date(r.starts_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                      <span className="text-sm flex-1 truncate">{r.client_initials ?? "Client"}</span>
                      <StatusPill status={r.status} />
                    </button>
                    {openId === r.id && (
                      <SessionDetail row={r} onReport={() => setOpenId(r.id)} />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardFrame>

      {employeeId && rows !== null && rows.length === 0 && (
        <CanonicalSessionsCard
          title="Imported CentralReach sessions for you"
          scope={{ employeeId }}
          highlightKinds={["direct", "supervision"]}
          showClients
        />
      )}
    </div>
  );
}

function SessionDetail({ row }: { row: any; onReport: () => void }) {
  const { writableEmployeeId, isPreviewing } = useRbtIdentity();
  const [showReport, setShowReport] = useState(false);
  const [text, setText] = useState("");
  const [type, setType] = useState("wrong_time");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!writableEmployeeId || !text.trim()) return;
    const { error } = await supabase.from("rbt_shift_discrepancies" as any).insert({
      employee_id: writableEmployeeId,
      shift_event_id: row.id,
      session_date: new Date(row.starts_at).toISOString().slice(0, 10),
      discrepancy_type: type,
      description: text.trim(),
      status: "open",
    });
    if (error) return setErr(error.message);
    setSent(true); setText("");
  };

  return (
    <div className="border-t border-border/60 p-3 space-y-2 text-sm bg-muted/30 rounded-b-xl">
      <div className="grid grid-cols-2 gap-2">
        <Detail label="Ends" value={new Date(row.ends_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} />
        <Detail label="Service" value={row.service_code ?? "—"} />
        <Detail label="Location" value={row.location_type ?? "—"} />
        <Detail label="BCBA" value={row.bcba_first_name ? `${row.bcba_first_name} ${row.bcba_last_initial ?? ""}` : "—"} />
        <Detail label="Status" value={row.status ?? "—"} />
        <Detail label="Source" value={row.source ?? "centralreach"} />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <a href={crSessionUrl(row.external_id)} target="_blank" rel="noreferrer"
          className="text-xs inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 hover:bg-muted/70">
          <ExternalLink className="h-3.5 w-3.5" /> Open in CentralReach
        </a>
        <button onClick={() => setShowReport((v) => !v)}
          className="text-xs inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 hover:bg-muted/70">
          <Flag className="h-3.5 w-3.5" /> Report discrepancy
        </button>
      </div>

      {showReport && (
        <div className="space-y-2 pt-2">
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="w-full h-10 rounded-xl bg-card border border-border px-3 text-sm">
            <option value="wrong_time">Wrong time</option>
            <option value="wrong_client">Wrong client</option>
            <option value="wrong_location">Wrong location</option>
            <option value="missing_session">Missing session</option>
            <option value="wrong_bcba">Wrong BCBA</option>
            <option value="other">Other</option>
          </select>
          <textarea value={text} onChange={(e) => setText(e.target.value)}
            rows={3} placeholder="What's off? (This does not change CentralReach.)"
            className="w-full rounded-xl bg-card border border-border p-3 text-sm" />
          {err && <p className="text-xs text-destructive">{err}</p>}
          {sent && <p className="text-xs text-primary">Thanks — the ops team will review.</p>}
          <button onClick={submit} disabled={!text.trim() || sent || isPreviewing}
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
            {sent ? "Submitted" : isPreviewing ? "Disabled in preview mode" : "Submit report"}
          </button>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm truncate">{value}</p>
    </div>
  );
}