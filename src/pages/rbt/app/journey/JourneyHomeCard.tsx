import { Link } from "react-router-dom";
import { CardFrame } from "../CardFrame";
import { useAuth } from "@/contexts/AuthContext";
import { useJourney } from "./useJourney";
import { ChevronRight, Sparkles, Clock } from "lucide-react";

export function JourneyHomeCard() {
  const { user } = useAuth();
  const { nextOpen, byKey, instances, loading } = useJourney(user?.id);
  if (loading || !instances.length) return null;

  if (!nextOpen) {
    const done = instances.filter((i) => i.status === "completed").length;
    return (
      <CardFrame title="First 90 days" subtitle={`${done} of ${instances.length} check-ins complete`} state="success"
        action={<Link to="/rbt/app/journey" className="inline-flex items-center text-sm text-primary">View <ChevronRight className="h-4 w-4" /></Link>}>
        <p className="text-sm text-muted-foreground">You’re all caught up. Your next check-in will appear here when it’s time.</p>
      </CardFrame>
    );
  }
  const cfg = byKey.get(nextOpen.checkpoint_key);
  return (
    <CardFrame title="Your next check-in" subtitle={cfg?.supportive_intro ?? "A short, supportive check-in."} state="success"
      action={<Link to={`/rbt/app/journey/${nextOpen.id}`} className="inline-flex items-center text-sm text-primary">Open <ChevronRight className="h-4 w-4" /></Link>}>
      <div className="flex items-center gap-3">
        <span className="h-10 w-10 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center">
          {cfg?.is_celebration ? <Sparkles className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{cfg?.label ?? nextOpen.checkpoint_key}</p>
          <p className="text-xs text-muted-foreground">Due {new Date(nextOpen.due_date).toLocaleDateString()}</p>
        </div>
        <Link to={`/rbt/app/journey/${nextOpen.id}`} className="rounded-xl bg-primary text-primary-foreground h-10 min-h-10 px-4 inline-flex items-center text-sm font-medium">
          Start
        </Link>
      </div>
    </CardFrame>
  );
}