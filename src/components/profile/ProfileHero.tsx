import { Sparkles, GraduationCap, KeyRound, Plane, Award } from "lucide-react";
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
    <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)] p-6 text-primary-foreground shadow-lg sm:p-9 animate-fade-in">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,hsl(var(--primary-foreground)/0.25),transparent_45%),radial-gradient(circle_at_90%_120%,hsl(var(--primary-foreground)/0.18),transparent_50%)]" />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-5 min-w-0">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-primary-foreground/15 text-2xl font-bold backdrop-blur-md shadow-sm border border-primary-foreground/20">
              {p.initials}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight capitalize truncate">{p.name}</h1>
              <p className="text-sm text-primary-foreground/80 truncate">{p.email}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.role && <Badge variant="secondary" className="bg-primary-foreground/15 text-primary-foreground border-0 backdrop-blur-md text-[11px]">{p.role}</Badge>}
                {p.department && <Badge variant="secondary" className="bg-primary-foreground/15 text-primary-foreground border-0 backdrop-blur-md text-[11px]">{p.department}</Badge>}
                {p.state && <Badge variant="secondary" className="bg-primary-foreground/15 text-primary-foreground border-0 backdrop-blur-md text-[11px]">{p.state}</Badge>}
                {p.manager && <Badge variant="secondary" className="bg-primary-foreground/15 text-primary-foreground border-0 backdrop-blur-md text-[11px]">Mgr · {p.manager}</Badge>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatTile label="Onboarding" value={`${p.onboardingPercent}%`} />
            <StatTile label="Academy" value={`${p.academyPercent ?? 0}%`} />
            <StatTile label="Badges" value={`${p.badgesEarned}/${p.badgesTotal}`} />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button variant="hero" size="sm" onClick={p.onContinueTraining}>
              <GraduationCap className="h-4 w-4" /> Continue Training
            </Button>
            <Button variant="heroOutline" size="sm" onClick={p.onRequestPTO}>
              <Plane className="h-4 w-4" /> Request PTO
            </Button>
            <Button variant="heroOutline" size="sm" onClick={p.onViewLogins}>
              <KeyRound className="h-4 w-4" /> View Logins
            </Button>
            <Button variant="heroOutline" size="sm" onClick={p.onViewCertificates}>
              <Award className="h-4 w-4" /> Certificates
            </Button>
          </div>
        </div>

        {p.onboardingComplete && (
          <div className="hidden lg:flex items-center gap-2 self-start rounded-full bg-primary-foreground/15 px-4 py-2 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" /> Onboarding complete
          </div>
        )}
      </div>
    </section>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-primary-foreground/10 p-3 backdrop-blur-md border border-primary-foreground/10">
      <p className="text-xl sm:text-2xl font-semibold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-[10px] sm:text-[11px] uppercase tracking-wider text-primary-foreground/85">{label}</p>
    </div>
  );
}