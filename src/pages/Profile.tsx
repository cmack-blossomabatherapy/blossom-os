import { Award, GraduationCap, Sparkles, Trophy, Compass, RotateCcw, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { resetOnboarding, setPreviewLocked } from "@/lib/onboarding/storage";

export default function Profile() {
  const { user } = useAuth();
  const ob = useOnboardingStatus();
  const name = (user?.user_metadata?.full_name as string | undefined) || user?.email?.split("@")[0] || "Blossom User";
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "BU";

  const badges = [
    { e: "🌱", l: "Day 1", earned: true },
    { e: "📘", l: "First Course", earned: true },
    { e: "🤝", l: "Team Met", earned: true },
    { e: "🔒", l: "HIPAA", earned: true },
    { e: "⭐", l: "5 Lessons", earned: true },
    { e: "🏆", l: "Track Master", earned: false },
    { e: "🎓", l: "Graduate", earned: false },
    { e: "💎", l: "Mentor", earned: false },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-12">
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary)/0.12),hsl(var(--accent)/0.12))] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-md">
            {initials}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold capitalize tracking-tight text-foreground">{name}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge variant="secondary" className="text-[11px]">Intake Staff</Badge>
              <Badge variant="outline" className="text-[11px]"><Sparkles className="mr-1 h-3 w-3" /> Onboarding {ob.percent}%</Badge>
              {ob.status === "completed" && <Badge className="text-[11px]">Onboarding complete</Badge>}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Onboarding</h2>
          </div>
          <Badge variant={ob.status === "completed" ? "default" : "outline"} className="text-[10px]">
            {ob.status === "completed" ? "Completed" : ob.status === "in_progress" ? "In progress" : "Not started"}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Journey</span>
            <span className="tabular-nums text-foreground">{ob.completedCount}/{ob.totalRequired} · {ob.percent}%</span>
          </div>
          <Progress value={ob.percent} className="h-1.5" />
          {ob.completedAt && (
            <p className="text-[11px] text-muted-foreground">
              Completed {new Date(ob.completedAt).toLocaleDateString()} · Certificate {ob.certificateId}
            </p>
          )}
          {!ob.isComplete && ob.nextStep && (
            <p className="text-[11px] text-muted-foreground">Next: <span className="text-foreground">{ob.nextStep.title}</span></p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {!ob.isComplete && (
            <Button asChild size="sm">
              <Link to={ob.nextStep?.path || "/onboarding"}>Continue onboarding</Link>
            </Button>
          )}
          {ob.status === "completed" && (
            <Button asChild size="sm" variant="outline">
              <Link to="/onboarding/complete">View certificate</Link>
            </Button>
          )}
          {ob.bypassReal && (
            <>
              <Button size="sm" variant="ghost" onClick={() => setPreviewLocked(!ob.previewLocked)} className="gap-1.5">
                {ob.previewLocked ? <><EyeOff className="h-3.5 w-3.5" /> Exit locked preview</> : <><Eye className="h-3.5 w-3.5" /> Preview as locked user</>}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { resetOnboarding(); }} className="gap-1.5 text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
            </>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Learning Progress</h2>
          </div>
          <div className="space-y-3 text-sm">
            {[
              { l: "Onboarding", v: 40 },
              { l: "Required Training", v: 60 },
              { l: "Role Academy", v: 25 },
            ].map((p) => (
              <div key={p.l}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-foreground">{p.l}</span>
                  <span className="text-muted-foreground">{p.v}%</span>
                </div>
                <Progress value={p.v} className="h-1.5" />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Certifications</h2>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="rounded-xl border border-border/50 p-3"><p className="font-medium text-foreground">HIPAA Awareness</p><p className="text-[11px] text-muted-foreground">Valid through 2026</p></li>
            <li className="rounded-xl border border-border/50 p-3"><p className="font-medium text-foreground">Blossom Systems Foundation</p><p className="text-[11px] text-muted-foreground">Awarded May 1</p></li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Badges</h2>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {badges.map((b, i) => (
              <div key={i} className={`flex flex-col items-center gap-1 rounded-xl border border-border/50 p-2 text-[10px] ${b.earned ? "" : "opacity-40"}`}>
                <span className="text-xl">{b.e}</span>
                <span className="text-muted-foreground">{b.l}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
