import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, MapPin, UserRound, ShieldCheck, AlertCircle, Check, ChevronRight, MessageCircle } from "lucide-react";
import { CardFrame } from "../CardFrame";
import { useAuth } from "@/contexts/AuthContext";
import { useFirstCase } from "./useFirstCase";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function formatWhen(d: string | null, w: string | null) {
  if (!d) return "Awaiting confirmed start date";
  const s = new Date(d).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  return w ? `${s} · ${w}` : s;
}

export default function RbtFirstCase() {
  const { user } = useAuth();
  const { primary, items, state, checkins, loading, reload } = useFirstCase(user?.id);
  const [busy, setBusy] = useState<string | null>(null);

  if (loading) return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;
  if (!primary) return (
    <CardFrame title="No first case yet" state="empty"
      emptyLabel="When your first case is scheduled, it will appear here with a guided prep and post-session check-in." />
  );

  const rows = state[primary.id] ?? [];
  const map = new Map(rows.map((r) => [r.item_key, r]));
  const done = rows.filter((r) => r.done).length;
  const total = items.length || 1;

  const toggle = async (key: string, current: boolean) => {
    const row = map.get(key); if (!row) return;
    setBusy(key);
    const { error } = await supabase.from("rbt_first_session_checklist_state" as any)
      .update({ done: !current, done_at: !current ? new Date().toISOString() : null })
      .eq("id", row.id);
    setBusy(null);
    if (error) return toast.error("Could not update");
    await reload();
  };

  const acknowledge = async () => {
    const { error } = await supabase.from("rbt_first_case" as any)
      .update({ readiness_acknowledged_at: new Date().toISOString() }).eq("id", primary.id);
    if (error) return toast.error("Could not acknowledge");
    toast.success("Thanks — your team knows you feel ready.");
    await reload();
  };

  const cr = primary.cr_access_status;
  const crTone = cr === "active" ? "text-primary" : cr === "blocked" ? "text-destructive" : "text-muted-foreground";
  const crLabel = cr === "active" ? "CentralReach ready" : cr === "blocked" ? "CentralReach blocked — contact support" : cr === "pending" ? "CentralReach pending" : "CentralReach status unknown";
  const hasCheckin = (checkins[primary.id] ?? 0) > 0;

  return (
    <div className="space-y-3">
      <CardFrame title="First case overview" subtitle="A guided start — you won’t be alone." state="success">
        <div className="space-y-3 text-sm">
          <p className="inline-flex items-center gap-2"><CalendarClock className="h-4 w-4 text-muted-foreground" />{formatWhen(primary.start_date, primary.session_window_local)}</p>
          {primary.location_type && <p className="inline-flex items-center gap-2 capitalize"><MapPin className="h-4 w-4 text-muted-foreground" />{primary.location_type}</p>}
          {primary.bcba && <p className="inline-flex items-center gap-2"><UserRound className="h-4 w-4 text-muted-foreground" />BCBA: {primary.bcba.first_name} {primary.bcba.last_name}{primary.bcba.email ? ` · ${primary.bcba.email}` : ""}</p>}
          {primary.lead && <p className="inline-flex items-center gap-2"><UserRound className="h-4 w-4 text-muted-foreground" />Lead RBT: {primary.lead.first_name} {primary.lead.last_name}{primary.lead_rbt_attending ? " · will attend first session" : ""}</p>}
          {primary.support && <p className="inline-flex items-center gap-2"><UserRound className="h-4 w-4 text-muted-foreground" />Support: {primary.support.first_name} {primary.support.last_name}{primary.support.email ? ` · ${primary.support.email}` : ""}</p>}
          <p className={`inline-flex items-center gap-1.5 text-xs ${crTone}`}>
            {cr === "blocked" ? <AlertCircle className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />} {crLabel}
          </p>
        </div>
      </CardFrame>

      <CardFrame title="Preparation checklist" subtitle={`${done} of ${total} complete`} state="success">
        <ul className="divide-y divide-border/70">
          {items.map((it) => {
            const row = map.get(it.key);
            const isDone = !!row?.done;
            return (
              <li key={it.key} className="py-3 flex items-start gap-3">
                <button onClick={() => toggle(it.key, isDone)} disabled={busy === it.key}
                  aria-label={isDone ? `Mark ${it.label} incomplete` : `Mark ${it.label} complete`}
                  className={`mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center transition ${isDone ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}>
                  {isDone && <Check className="h-3.5 w-3.5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${isDone ? "line-through text-muted-foreground" : ""}`}>{it.label}</p>
                  {it.description && <p className="text-xs text-muted-foreground mt-0.5">{it.description}</p>}
                </div>
              </li>
            );
          })}
        </ul>
        {done === total && !primary.readiness_acknowledged_at && (
          <button onClick={acknowledge} className="mt-3 w-full rounded-xl bg-primary text-primary-foreground h-11 min-h-11 text-sm font-medium">
            I feel ready
          </button>
        )}
        {primary.readiness_acknowledged_at && (
          <p className="mt-3 text-xs text-primary inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Readiness acknowledged — supervision continues as planned.</p>
        )}
      </CardFrame>

      <CardFrame title="After your first session" subtitle="Two-minute check-in" state="success"
        action={<Link to="/rbt/app/first-case/checkin" className="inline-flex items-center text-sm text-primary">
          {hasCheckin ? "Submit another" : "Start"} <ChevronRight className="h-4 w-4" />
        </Link>}>
        <p className="text-sm text-muted-foreground">Share how it went. Anything you flag stays open until your team resolves it with you.</p>
      </CardFrame>

      <CardFrame title="Need help now?" state="success">
        <Link to="/rbt/app/support" className="inline-flex items-center gap-2 text-sm text-primary">
          <MessageCircle className="h-4 w-4" /> Message the support team
        </Link>
      </CardFrame>
    </div>
  );
}