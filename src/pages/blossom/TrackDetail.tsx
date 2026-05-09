import { useParams, Link } from "react-router-dom";
import { Compass, Clock, Award, BookOpen, Edit3, ArrowLeft, CheckCircle2 } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { academyTracks } from "@/data/blossomOS";
import { useAuth } from "@/contexts/AuthContext";

export default function TrackDetail() {
  const { trackId } = useParams();
  const { isAdmin } = useAuth();
  const track = academyTracks.find((t) => t.id === trackId);

  if (!track) {
    return (
      <GlassPageShell title="Track not found" description="This academy track does not exist.">
        <Link to="/blossom/academy" className="text-sm text-primary">← Back to Operations Academy</Link>
      </GlassPageShell>
    );
  }

  const sampleModules = Array.from({ length: track.courseCount }).map((_, i) => ({
    id: i,
    title: `${track.name.replace(" Academy", "")} Module ${i + 1}`,
    minutes: 20 + (i % 4) * 15,
    required: i < Math.ceil(track.courseCount * 0.7),
    done: i < Math.floor((track.completion / 100) * track.courseCount),
  }));

  return (
    <GlassPageShell
      eyebrow="Operations Academy"
      eyebrowIcon={Compass}
      title={track.name}
      description={track.description}
      actions={
        <>
          <Link to="/blossom/academy">
            <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button>
          </Link>
          {isAdmin && (
            <Button size="sm" variant="outline"><Edit3 className="h-4 w-4" /> Edit Track</Button>
          )}
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Overview</h3>
              <div className="flex flex-wrap gap-1">
                {track.roles.map((r) => <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>)}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{track.courseCount} modules</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{track.estimatedHours} hours</span>
              <span className="inline-flex items-center gap-1"><Award className="h-3.5 w-3.5" />{track.competencies.length} competencies</span>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Your progress</span>
                <span className="font-medium">{track.completion}%</span>
              </div>
              <Progress value={track.completion} className="h-2" />
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold">Curriculum modules</h3>
            <ul className="divide-y divide-border/50">
              {sampleModules.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={m.done ? "text-success" : "text-muted-foreground"}>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                      <p className="text-[11px] text-muted-foreground">{m.minutes} min · {m.required ? "Required" : "Optional"}</p>
                    </div>
                  </div>
                  <Button size="sm" variant={m.done ? "ghost" : "outline"}>{m.done ? "Review" : "Start"}</Button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Competencies earned</h3>
            <div className="flex flex-wrap gap-2">
              {track.competencies.map((c) => <Badge key={c} className="text-[10px]">{c}</Badge>)}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Optional resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>· {track.name} SOP library</li>
              <li>· Recorded leadership talks</li>
              <li>· Loom video walkthroughs</li>
            </ul>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Completion certificate</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Complete all required modules to earn the {track.name} certificate.
            </p>
          </Card>
        </div>
      </div>
    </GlassPageShell>
  );
}
