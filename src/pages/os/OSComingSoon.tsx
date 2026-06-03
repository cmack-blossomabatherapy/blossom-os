import { OSShell } from "./OSShell";
import { Sparkles, LucideIcon, Rocket, Clock, Wand2 } from "lucide-react";

export default function OSComingSoon({ title, description, icon: Icon = Sparkles }: { title: string; description: string; icon?: LucideIcon }) {
  return (
    <OSShell>
      <div className="mx-auto flex w-full max-w-[720px] flex-col items-center justify-center py-16 text-center">
        {/* Hero icon */}
        <div className="grid h-20 w-20 place-items-center rounded-[24px] bg-gradient-to-br from-[hsl(265_100%_95%)] to-[hsl(285_100%_95%)] text-[hsl(265_70%_55%)] shadow-[0_24px_60px_-28px_hsl(265_60%_50%/0.45)]">
          <Icon className="h-9 w-9" />
        </div>

        {/* Coming soon badge */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[hsl(265_70%_55%/0.18)] bg-[hsl(265_70%_55%/0.06)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(265_70%_55%)]">
          <Clock className="h-3 w-3" />
          Coming Soon
        </div>

        {/* Title */}
        <h1 className="mt-5 text-[28px] font-semibold tracking-tight md:text-[36px]">
          {title}
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
          {description}
        </p>

        {/* Feature preview cards */}
        <div className="mt-10 grid w-full max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: Wand2, label: "AI Assistant", desc: "Ask anything about operations" },
            { icon: Rocket, label: "Smart Actions", desc: "Workflow suggestions & automations" },
            { icon: Sparkles, label: "Insights", desc: "Operational intelligence on demand" },
          ].map((f) => (
            <div key={f.label} className="rounded-2xl border border-white/70 bg-white/60 p-5 text-left opacity-60">
              <f.icon className="h-5 w-5 text-[hsl(265_70%_55%)]" />
              <p className="mt-3 text-[13px] font-semibold">{f.label}</p>
              <p className="mt-1 text-[11.5px] text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="mt-10 text-[12px] text-muted-foreground">
          We&apos;re building this with your operational workflows in mind. Check back soon!
        </p>
      </div>
    </OSShell>
  );
}
