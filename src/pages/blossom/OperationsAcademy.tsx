import { Link } from "react-router-dom";
import { Compass, Clock, Users as UsersIcon, ArrowRight } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { academyTracks } from "@/data/blossomOS";

export default function OperationsAcademy() {
  return (
    <GlassPageShell
      eyebrow="Operations Academy"
      eyebrowIcon={Compass}
      title="Structured learning paths"
      description="Role-based academies designed to teach how Blossom operates — from first-day fundamentals to leadership mastery."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {academyTracks.map((track) => (
          <Link
            key={track.id}
            to={`/blossom/academy/${track.id}`}
            className="group flex flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Compass className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-[10px]">{track.department}</Badge>
            </div>
            <div className="mt-4 space-y-2 flex-1">
              <h3 className="text-base font-semibold text-foreground">{track.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{track.description}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Compass className="h-3 w-3" />{track.courseCount} courses</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{track.estimatedHours}h</span>
              <span className="col-span-2 inline-flex items-center gap-1"><UsersIcon className="h-3 w-3" />{track.roles.join(" · ")}</span>
            </div>
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium text-foreground">{track.completion}%</span>
              </div>
              <Progress value={track.completion} className="h-1.5" />
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs font-medium text-primary">
              <span>View Track</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </GlassPageShell>
  );
}
