import { Sparkles, GraduationCap, KeyRound, Plane, Award, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProfileHeroProps {
  name: string;
  email?: string | null;
  initials: string;
  role?: string;
  department?: string;
  state?: string;
  manager?: string;
  onboardingPercent: number;
  onboardingComplete: boolean;
  academyPercent?: number;
  badgesEarned: number;
  badgesTotal: number;
  onContinueTraining: () => void;
  onRequestPTO: () => void;
  onViewLogins: () => void;
  onViewCertificates: () => void;
}

export function ProfileHero(p: ProfileHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0F1729] text-white shadow-xl animate-fade-in">
      {/* Layered background: deep navy base + brand glow */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_80%_at_85%_-10%,hsl(var(--primary)/0.55),transparent_55%),radial-gradient(90%_70%_at_-10%_120%,hsl(var(--accent)/0.35),transparent_55%)]"
      />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.35)_100%)]" />

      <div className="relative p-5 sm:p-7 lg:p-8 space-y-6">
        {/* Identity row */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-white/30 to-white/0" aria-hidden />
            <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white/10 text-xl sm:text-2xl font-semibold backdrop-blur-xl ring-1 ring-white/20 shadow-md">
              {p.initials}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl sm:text-2xl font-semibold tracking-tight capitalize">{p.name}</h1>
            {p.email && <p className="truncate text-[13px] text-white/65">{p.email}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.role && <Chip>{p.role}</Chip>}
              {p.department && <Chip>{p.department}</Chip>}
              {p.state && <Chip>{p.state}</Chip>}
              {p.manager && <Chip>Mgr · {p.manager}</Chip>}
            </div>
          </div>

          {p.onboardingComplete && (
            <div className="hidden lg:inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold backdrop-blur-md ring-1 ring-white/15">
              <Sparkles className="h-3.5 w-3.5" /> Onboarding complete
            </div>
          )}
        </div>

        {/* Stat rail — segmented, single surface */}
        <div className="grid grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-white/10 backdrop-blur-md">
          <Stat label="Onboarding" value={`${p.onboardingPercent}%`} />
          <Stat label="Academy" value={`${p.academyPercent ?? 0}%`} />
          <Stat label="Badges" value={`${p.badgesEarned}/${p.badgesTotal}`} />
        </div>

        {/* Primary CTA + secondary actions */}
        <div className="space-y-2.5">
          <Button
            onClick={p.onContinueTraining}
            className="group h-11 w-full justify-between gap-2 rounded-xl bg-white text-[#0F1729] hover:bg-white/95 shadow-md"
          >
            <span className="inline-flex items-center gap-2 font-semibold">
              <GraduationCap className="h-4 w-4" /> Continue Training
            </span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>

          <div className="grid grid-cols-3 gap-2">
            <SecondaryAction icon={Plane} label="PTO" onClick={p.onRequestPTO} />
            <SecondaryAction icon={KeyRound} label="Logins" onClick={p.onViewLogins} />
            <SecondaryAction icon={Award} label="Certs" onClick={p.onViewCertificates} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <Badge
      variant="secondary"
      className="rounded-full border-0 bg-white/12 px-2 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-md ring-1 ring-white/15"
    >
      {children}
    </Badge>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-3 sm:py-4 text-center">
      <p className="text-lg sm:text-2xl font-semibold tabular-nums leading-none">{value}</p>
      <p className="mt-1.5 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.08em] text-white/65">
        {label}
      </p>
    </div>
  );
}

function SecondaryAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex h-11 items-center justify-center gap-1.5 rounded-xl bg-white/8 px-2 text-[13px] font-medium text-white/90 ring-1 ring-white/12 backdrop-blur-md transition hover:bg-white/14 hover:text-white active:scale-[0.98]"
    >
      <Icon className="h-4 w-4 opacity-90 transition-transform group-hover:-translate-y-0.5" />
      <span className="truncate">{label}</span>
    </button>
  );
}