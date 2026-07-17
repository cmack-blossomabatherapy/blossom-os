import { Link } from "react-router-dom";
import { CardFrame } from "../CardFrame";
import { useAuth } from "@/contexts/AuthContext";
import { useJourney } from "./useJourney";
import { Check, ChevronRight, Sparkles, Clock } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Not yet",
  open: "Ready",
  overdue: "Ready",
  completed: "Done",
  skipped: "Skipped",
};

export default function RbtJourney() {
  const { user } = useAuth();
  const { instances, byKey, loading } = useJourney(user?.id);

  if (loading) return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;
  if (!instances.length) return (
    <CardFrame title="Your first 90 days" state="empty"
      emptyLabel="Your check-ins appear here once your first session date is scheduled." />
  );

  return (
    <div className="space-y-3">
      <CardFrame title="Your first 90 days" subtitle="Small check-ins to make sure you feel supported." state="success">
        <ul className="divide-y divide-border/70">
          {instances.map((i) => {
            const cfg = byKey.get(i.checkpoint_key);
            const done = i.status === "completed";
            const ready = i.status === "open" || i.status === "overdue";
            return (
              <li key={i.id} className="py-3 flex items-start gap-3">
                <span className={`mt-0.5 h-8 w-8 shrink-0 rounded-full border-2 flex items-center justify-center ${done ? "bg-primary border-primary text-primary-foreground" : ready ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
                  {done ? <Check className="h-4 w-4" /> : cfg?.is_celebration ? <Sparkles className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{cfg?.label ?? i.checkpoint_key}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(i.scheduled_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    {" · "}{STATUS_LABEL[i.status] ?? i.status}
                  </p>
                </div>
                {ready && (
                  <Link to={`/rbt/app/journey/${i.id}`} className="inline-flex items-center h-9 min-h-9 rounded-xl bg-primary text-primary-foreground px-3 text-sm font-medium">
                    Open <ChevronRight className="h-4 w-4 ml-0.5" />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </CardFrame>
    </div>
  );
}