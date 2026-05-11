import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TrainingCatalog() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Training Catalog</h1>
        <p className="text-sm text-muted-foreground">Every live course in the Blossom Academy will appear here.</p>
      </header>

      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 text-center shadow-sm sm:p-12">
        <div aria-hidden className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(135deg,hsl(var(--primary)/0.18),hsl(var(--accent)/0.10),transparent)]" />
        <div className="relative space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" /> Coming soon
            </span>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">No live courses yet</h2>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              The catalog is being built right now. In the meantime, your guided onboarding has everything you need to get started.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button asChild>
              <Link to="/onboarding">Open onboarding journey <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/help">Help & Support</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}