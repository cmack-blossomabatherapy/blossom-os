import { Link } from "react-router-dom";
import { GraduationCap, BookOpen, Compass, Settings as SettingsIcon, Sparkles } from "lucide-react";
import heroImg from "@/assets/blossom-hero.jpg";

const actions = [
  { label: "Continue Training", to: "/training", icon: GraduationCap, variant: "primary" as const },
  { label: "View Resource Hub", to: "/resources", icon: BookOpen },
  { label: "Operations Academy", to: "/blossom/academy", icon: Compass },
  { label: "Admin Settings", to: "/settings", icon: SettingsIcon },
];

export function BlossomHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[0_30px_80px_-40px_hsl(var(--primary)/0.4)]">
      <img
        src={heroImg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-90"
      />
      <div className="absolute inset-0 bg-[linear-gradient(105deg,hsl(var(--card))_0%,hsl(var(--card)/0.9)_38%,hsl(var(--card)/0.4)_70%,transparent_100%)]" />
      <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:p-12">
        <div className="space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" />
            Blossom Operating System
          </span>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Blossom ABA <span className="text-gradient-brand">Command Center</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Your central hub for training, operations, resources, and team accountability —
              built for every Blossom department, location, and leader.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {actions.map(({ label, to, icon: Icon, variant }) => (
              <Link
                key={label}
                to={to}
                className={
                  variant === "primary"
                    ? "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
                    : "inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-4 py-2.5 text-sm font-medium text-foreground backdrop-blur transition-all hover:border-primary/40 hover:bg-background"
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="hidden lg:block" />
      </div>
    </section>
  );
}
