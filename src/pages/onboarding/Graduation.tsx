import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Award, Sparkles, ArrowRight, Download, BookOpen, Library, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompletionCertificate } from "@/components/onboarding/CompletionCertificate";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useAuth } from "@/contexts/AuthContext";
import { markModuleComplete } from "@/lib/onboarding/storage";

export default function Graduation() {
  const status = useOnboardingStatus();
  const { user } = useAuth();
  const name = (user?.user_metadata?.full_name as string | undefined) || user?.email?.split("@")[0] || "Blossom Team Member";

  useEffect(() => {
    if (status.isComplete) markModuleComplete("grad.cert");
  }, [status.isComplete]);

  const completedPhases = status.phaseProgress.filter((p) => p.complete && p.phase.id !== "graduation");

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-12">
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary)/0.16),hsl(var(--accent)/0.10))] p-6 text-center sm:p-12">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <Trophy className="h-7 w-7" />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" /> Graduation
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Congratulations — Blossom Onboarding Complete
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          You've moved through every phase of your first four weeks at Blossom. The full Academy is now unlocked — Training Catalog, Resource Hub, Growth Pathways, and more.
        </p>
      </header>

      <CompletionCertificate name={name} completedAt={status.completedAt} certificateId={status.certificateId} />

      {completedPhases.length > 0 && (
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-foreground">Completed milestones</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {completedPhases.map((p) => (
              <li key={p.phase.id} className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 p-2.5 text-xs">
                <Award className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-foreground">{p.phase.weekLabel}</span>
                <span className="text-muted-foreground">— {p.phase.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="lg" className="gap-2">
          <Link to="/"><Sparkles className="h-4 w-4" /> Enter Blossom Academy <ArrowRight className="h-4 w-4" /></Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="gap-2">
          <Link to="/catalog"><BookOpen className="h-4 w-4" /> Browse Training Catalog</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="gap-2">
          <Link to="/hr/resources"><Library className="h-4 w-4" /> Resource Hub</Link>
        </Button>
        <Button variant="ghost" size="lg" className="gap-2" onClick={() => window.print()}>
          <Download className="h-4 w-4" /> Save certificate
        </Button>
      </div>
    </div>
  );
}