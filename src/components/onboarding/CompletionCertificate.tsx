import { Award, Sparkles } from "lucide-react";

interface Props {
  name: string;
  completedAt?: string;
  certificateId?: string;
}

export function CompletionCertificate({ name, completedAt, certificateId }: Props) {
  const dateStr = completedAt
    ? new Date(completedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return (
    <article
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 text-center shadow-[0_30px_80px_-40px_hsl(var(--primary)/0.4)] sm:p-12"
      aria-label="Blossom Onboarding Completion Certificate"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--primary)/0.10)_0%,hsl(var(--accent)/0.06)_55%,transparent_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-3 rounded-2xl border border-dashed border-border/60"
      />
      <div className="relative space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
          <Award className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <p className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Blossom Academy
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Onboarding Completion Certificate
          </h2>
          <p className="text-sm text-muted-foreground">This certifies that</p>
        </div>
        <p className="text-2xl font-semibold capitalize tracking-tight text-foreground sm:text-3xl">
          {name}
        </p>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground">
          has successfully completed the Blossom Academy onboarding journey, including our mission, vision, core values, required training, and policy acknowledgements.
        </p>
        <div className="grid gap-4 pt-4 text-xs text-muted-foreground sm:grid-cols-3">
          <div>
            <p className="font-semibold uppercase tracking-wider">Completed</p>
            <p className="mt-1 text-foreground">{dateStr}</p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wider">Path</p>
            <p className="mt-1 text-foreground">Blossom Onboarding</p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wider">Certificate ID</p>
            <p className="mt-1 font-mono text-foreground">{certificateId || "BL-PENDING"}</p>
          </div>
        </div>
      </div>
    </article>
  );
}