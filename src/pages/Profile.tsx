import { Award, GraduationCap, Sparkles, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const { user } = useAuth();
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
              <Badge variant="outline" className="text-[11px]"><Sparkles className="mr-1 h-3 w-3" /> Onboarding 40%</Badge>
            </div>
          </div>
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
