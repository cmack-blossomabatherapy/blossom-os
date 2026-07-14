import { Link, useNavigate } from "react-router-dom";
import { Compass, Clock, Users as UsersIcon, Eye, ArrowLeft, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JourneyHero } from "@/components/onboarding/JourneyHero";
import { StepCompleteButton } from "@/components/onboarding/StepCompleteButton";
import { academyTracks } from "@/data/blossomOS";

export default function OnboardingAcademyPreview() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-16 animate-fade-in">
      <JourneyHero
        eyebrow="Operations Academy · Preview"
        title="A peek at the Operations Academy"
        description="This is a look at the structured learning paths you'll unlock soon. Browse what's inside — you'll get hands-on access after onboarding."
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/onboarding"))}>
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
        </Button>
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-[11px] font-medium text-muted-foreground">
          <Eye className="h-3.5 w-3.5" /> Read-only preview
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {academyTracks.map((track) => (
          <div
            key={track.id}
            aria-disabled
            className="group relative flex cursor-default select-none flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Compass className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-[10px]">{track.department}</Badge>
            </div>
            <div className="mt-4 flex-1 space-y-2">
              <h3 className="text-base font-semibold text-foreground">{track.name}</h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">{track.description}</p>
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
            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> Available after onboarding</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Sample data shown for preview. Tracks, progress, and courses become interactive once you've completed onboarding.
      </p>

      <StepCompleteButton stepId="how-it-works" />
    </div>
  );
}
