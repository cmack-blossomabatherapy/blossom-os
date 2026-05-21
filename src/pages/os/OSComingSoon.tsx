import { OSShell } from "./OSShell";
import { LucideIcon, Sparkles, Clock, Check } from "lucide-react";

interface Props {
  title: string;
  tagline: string;
  icon: LucideIcon;
  features: { title: string; description: string }[];
}

export default function OSComingSoon({ title, tagline, icon: Icon, features }: Props) {
  return (
    <OSShell>
      <header className="os-rise flex flex-col items-start gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(265_70%_55%/0.2)] bg-[hsl(265_100%_97%)] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[hsl(265_70%_55%)]">
          <Clock className="h-3 w-3" /> Coming soon
        </span>
        <h1 className="text-[28px] font-semibold tracking-tight md:text-[32px]">{title}</h1>
        <p className="max-w-2xl text-[13.5px] text-muted-foreground">{tagline}</p>
      </header>

      <section className="os-card relative overflow-hidden p-8 md:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-[hsl(265_100%_92%)] to-[hsl(195_100%_92%)] opacity-70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-[hsl(195_100%_92%)] to-[hsl(265_100%_92%)] opacity-60 blur-3xl" />

        <div className="relative flex flex-col items-center text-center">
          <div className="relative">
            <div className="absolute inset-0 -m-3 rounded-[28px] bg-gradient-to-br from-[hsl(265_100%_88%)] to-[hsl(195_100%_88%)] blur-xl opacity-70" />
            <div className="relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-[hsl(265_100%_96%)] to-[hsl(195_100%_96%)] text-[hsl(265_70%_55%)] shadow-[0_22px_50px_-22px_hsl(265_60%_50%/0.45)] ring-1 ring-white/80">
              <Icon className="h-8 w-8" strokeWidth={1.8} />
            </div>
          </div>

          <h2 className="mt-6 text-[22px] font-semibold tracking-tight">We're building something great</h2>
          <p className="mt-2 max-w-lg text-[13.5px] text-muted-foreground">
            This module is being designed and built right now. Here's a preview of what it will deliver when it goes live.
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[hsl(265_70%_55%)]">
            <Sparkles className="h-3.5 w-3.5" /> In active development
          </div>
        </div>

        <div className="relative mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur transition hover:border-[hsl(265_70%_55%/0.25)] hover:bg-white/90"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[hsl(265_100%_96%)] text-[hsl(265_70%_55%)]">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold tracking-tight text-foreground">{f.title}</p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{f.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </OSShell>
  );
}
