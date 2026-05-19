import { OSShell } from "./OSShell";
import { Sparkles, LucideIcon } from "lucide-react";

export default function OSPlaceholder({ title, description, icon: Icon = Sparkles }: { title: string; description: string; icon?: LucideIcon }) {
  return (
    <OSShell>
      <header className="os-rise">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(265_70%_55%)]">Blossom OS · Preview</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight md:text-[32px]">{title}</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">{description}</p>
      </header>

      <section className="os-card flex flex-col items-center justify-center py-20 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-[hsl(265_100%_95%)] to-[hsl(285_100%_95%)] text-[hsl(265_70%_55%)] shadow-[0_18px_40px_-22px_hsl(265_60%_50%/0.45)]">
          <Icon className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-[20px] font-semibold tracking-tight">Coming next phase</h2>
        <p className="mt-2 max-w-md text-[13px] text-muted-foreground">
          This screen will be built out in the next phase of the Blossom OS redesign with full
          wireframes, mock data, and the polished interactions you saw on the Dashboard.
        </p>
        <div className="mt-6 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          {["KPI strip", "Primary view", "Filter rail"].map((s) => (
            <div key={s} className="rounded-2xl border border-white/70 bg-white/60 p-4 text-left">
              <div className="os-skeleton h-3 w-1/2 rounded" />
              <div className="os-skeleton mt-2 h-2.5 w-3/4 rounded" />
              <div className="os-skeleton mt-5 h-16 w-full rounded-xl" />
              <p className="mt-3 text-[11px] font-medium text-muted-foreground">{s}</p>
            </div>
          ))}
        </div>
      </section>
    </OSShell>
  );
}