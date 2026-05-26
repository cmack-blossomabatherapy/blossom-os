import { OSShell } from "../OSShell";
import { Sparkles, type LucideIcon, ChevronRight } from "lucide-react";

interface FuturePreview {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface Props {
  eyebrow?: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  features?: FuturePreview[];
  aiPreview?: string[];
}

/**
 * Premium Case Manager "Coming Soon" page.
 * Used across every Case Manager surface while we scaffold the role.
 * Calm, supportive, warm — mobile-first, role-aware.
 */
export default function CaseManagerComingSoon({
  eyebrow = "Case Manager · Preview",
  title,
  description,
  icon: Icon = Sparkles,
  features = [],
  aiPreview,
}: Props) {
  return (
    <OSShell>
      {/* HERO */}
      <header className="os-rise relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-[hsl(330_100%_98%)] via-white to-[hsl(265_100%_98%)] p-6 md:p-8 shadow-[0_18px_50px_-30px_hsl(330_40%_50%/0.25)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[hsl(330_100%_92%)]/60 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-20 h-48 w-48 rounded-full bg-[hsl(265_100%_94%)]/70 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[hsl(330_85%_70%)] to-[hsl(285_85%_70%)] text-white shadow-[0_14px_36px_-14px_hsl(330_60%_55%/0.55)]">
              <Icon className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(330_70%_55%)]">{eyebrow}</p>
              <h1 className="mt-2 text-[26px] font-semibold tracking-tight md:text-[32px]">{title}</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-[hsl(330_80%_88%)] bg-white/80 px-3 py-1.5 text-[11.5px] font-medium text-[hsl(330_60%_45%)] backdrop-blur">
            <span className="relative grid h-2 w-2 place-items-center">
              <span className="absolute h-2 w-2 animate-ping rounded-full bg-[hsl(330_85%_70%)] opacity-60" />
              <span className="h-2 w-2 rounded-full bg-[hsl(330_85%_60%)]" />
            </span>
            Currently in development
          </div>
        </div>
      </header>

      {/* FUTURE FEATURES */}
      {features.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Future features</h2>
            <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Preview</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-5 shadow-[0_8px_24px_-18px_hsl(265_50%_40%/0.18)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-22px_hsl(265_55%_45%/0.28)]"
              >
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(330_100%_96%)] to-[hsl(265_100%_96%)] text-[hsl(330_60%_50%)]">
                  <f.icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <p className="mt-3 text-[14px] font-semibold tracking-tight text-foreground">{f.title}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{f.description}</p>
                <div className="mt-4 space-y-2">
                  <div className="os-skeleton h-2 w-3/4 rounded-full" />
                  <div className="os-skeleton h-2 w-1/2 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI PREVIEW */}
      {aiPreview && aiPreview.length > 0 && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-[hsl(265_60%_92%)] bg-gradient-to-br from-[hsl(265_100%_98%)] via-white to-[hsl(285_100%_98%)] p-5 md:p-6">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <p className="text-[13px] font-semibold tracking-tight">Ask Blossom AI · upcoming</p>
          </div>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {aiPreview.map((line) => (
              <li
                key={line}
                className="flex items-start gap-2 rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-[12.5px] text-foreground/80 backdrop-blur-sm"
              >
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(265_70%_55%)]" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-6 px-1 text-[12px] text-muted-foreground">
        This page is part of the Case Manager role rollout. Functionality will arrive in the next phase — your menu, layout, and design are ready.
      </p>
    </OSShell>
  );
}