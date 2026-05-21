import { ReactNode } from "react";
import { Sparkles, ShieldCheck } from "lucide-react";
import logoWordmark from "@/assets/blossom-logo-wordmark.png";

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function MfaBrandShell({ eyebrow, title, description, children, footer }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)] opacity-[0.06] lg:hidden" />

      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 text-primary-foreground lg:flex bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,hsl(var(--primary-foreground)/0.25),transparent_45%),radial-gradient(circle_at_90%_120%,hsl(var(--primary-foreground)/0.18),transparent_50%)]" />
        <div className="relative flex items-center">
          <div className="rounded-2xl bg-primary-foreground px-5 py-3 shadow-lg ring-1 ring-primary-foreground/30">
            <img src={logoWordmark} alt="Blossom ABA Therapy" className="h-10 w-auto object-contain" />
          </div>
        </div>
        <div className="relative max-w-md space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5" /> Two-factor security
          </div>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            One more step to keep client data safe.
          </h2>
          <p className="text-base leading-relaxed text-primary-foreground/85">
            Blossom OS uses time-based one-time codes from an authenticator app on your phone.
            Your verification stays valid for 30 days on this device.
          </p>
          <ul className="space-y-2 pt-2 text-sm text-primary-foreground/85">
            {[
              "Works with Google Authenticator, Authy, 1Password",
              "No SMS — codes never leave your device",
              "Required for every Blossom team member",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-primary-foreground" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} Blossom ABA Therapy
        </div>
      </div>

      {/* Content panel */}
      <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:min-h-0 lg:py-16">
        <div className="w-full max-w-[460px]">
          <div className="mb-8 flex items-center justify-center lg:hidden">
            <div className="rounded-2xl bg-card px-5 py-3 shadow-sm ring-1 ring-border">
              <img src={logoWordmark} alt="Blossom ABA Therapy" className="h-9 w-auto object-contain" />
            </div>
          </div>

          <div className="mb-7 space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" /> {eyebrow}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>

          {children}

          {footer && <div className="mt-6 text-center text-xs text-muted-foreground">{footer}</div>}

          <p className="mt-6 text-center text-[11px] text-muted-foreground lg:hidden">
            © {new Date().getFullYear()} Blossom ABA Therapy
          </p>
        </div>
      </div>
    </div>
  );
}