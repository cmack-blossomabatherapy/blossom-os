import { Badge } from "@/components/ui/badge";
import { LineChart, Sparkles, Target, ClipboardList } from "lucide-react";

interface Props {
  roleLabel: string;
}

/**
 * Empty-state KPI Scorecard shown for roles whose KPIs have not yet been defined.
 * Mirrors the chrome of the State Director scorecard so the section feels intentional,
 * not unfinished.
 */
export function RoleScorecardPlaceholder({ roleLabel }: Props) {
  return (
    <div className="space-y-6">
      <section className="os-rise relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-[hsl(265_100%_98%)] via-white to-[hsl(220_100%_98%)] p-7 shadow-[0_30px_70px_-40px_hsl(265_60%_50%/0.4)]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[hsl(265_70%_70%/0.25)] blur-3xl" />
        <div className="relative">
          <Badge
            variant="secondary"
            className="rounded-full bg-white/80 text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(265_70%_45%)]"
          >
            {roleLabel}
          </Badge>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[32px]">
            KPI Scorecard
          </h1>
          <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">
            A dedicated weekly scorecard for this role is on the way. Once the KPIs that matter
            most for {roleLabel.toLowerCase()} are confirmed, they’ll live here — tracked weekly,
            visualized over time, and ready to push to Bloom Growth.
          </p>
        </div>
      </section>

      <section className="rounded-[24px] border border-foreground/[0.06] bg-white/70 p-8 backdrop-blur">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white shadow-[0_12px_28px_-12px_hsl(265_85%_60%/0.55)]">
            <LineChart className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-[17px] font-semibold tracking-tight">
            KPIs not yet defined
          </h2>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            We’re collecting the right operational measures for {roleLabel}. When leadership
            confirms the scorecard, the metrics below will populate automatically.
          </p>

          <div className="mt-6 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3">
            {[
              { icon: Target, label: "Weekly KPIs" },
              { icon: Sparkles, label: "Trend insights" },
              { icon: ClipboardList, label: "Bloom Growth sync" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-xl border border-dashed border-foreground/10 bg-foreground/[0.02] px-3 py-2.5 text-[12px] text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}