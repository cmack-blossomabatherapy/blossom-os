import { Link } from "react-router-dom";
import { CalendarClock, ChevronRight, MapPin, UserRound, ShieldCheck, AlertCircle } from "lucide-react";
import { CardFrame } from "../CardFrame";
import { useFirstCase } from "./useFirstCase";
import { useAuth } from "@/contexts/AuthContext";

function formatWhen(d: string | null, w: string | null) {
  if (!d) return "Awaiting confirmed start date";
  const date = new Date(d);
  const s = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return w ? `${s} · ${w}` : s;
}

export function FirstCaseHomeCard() {
  const { user } = useAuth();
  const { primary, primaryProgress, loading } = useFirstCase(user?.id);
  if (loading || !primary) return null;

  const done = primaryProgress.done, total = primaryProgress.total || 1;
  const pct = Math.round((done / total) * 100);
  const cr = primary.cr_access_status;
  const crLabel = cr === "active" ? "CentralReach ready" : cr === "blocked" ? "CentralReach blocked" : cr === "pending" ? "CentralReach pending" : "CentralReach unknown";
  const crTone = cr === "active" ? "text-primary" : cr === "blocked" ? "text-destructive" : "text-muted-foreground";

  return (
    <CardFrame title="Your first case" subtitle="A guided start — you won’t be alone." state="success"
      action={<Link to="/rbt/app/first-case" className="inline-flex items-center text-sm text-primary">Open <ChevronRight className="h-4 w-4" /></Link>}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-muted-foreground" />{formatWhen(primary.start_date, primary.session_window_local)}</span>
          {primary.location_type && <span className="inline-flex items-center gap-1.5 capitalize"><MapPin className="h-4 w-4 text-muted-foreground" />{primary.location_type}</span>}
          {primary.bcba && <span className="inline-flex items-center gap-1.5"><UserRound className="h-4 w-4 text-muted-foreground" />BCBA {primary.bcba.first_name} {primary.bcba.last_name}</span>}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1 ${crTone}`}>
            {cr === "blocked" ? <AlertCircle className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            {crLabel}
          </span>
          {primary.lead_rbt_attending && <span className="text-primary">Lead RBT will be present</span>}
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5"><span>Preparation</span><span className="tabular-nums">{done}/{total}</span></div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
        </div>
        <div className="flex gap-2 pt-1">
          <Link to="/rbt/app/first-case" className="flex-1 rounded-xl bg-primary text-primary-foreground h-11 min-h-11 inline-flex items-center justify-center text-sm font-medium">Prepare</Link>
          <Link to="/rbt/app/first-case/checkin" className="flex-1 rounded-xl border border-border h-11 min-h-11 inline-flex items-center justify-center text-sm font-medium">Post-session check-in</Link>
        </div>
      </div>
    </CardFrame>
  );
}