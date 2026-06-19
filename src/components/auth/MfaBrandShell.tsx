import { ReactNode } from "react";
import { ShieldCheck, LockKeyhole, Sparkles } from "lucide-react";
import logoWordmark from "@/assets/blossom-logo-wordmark.png";

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Headline used on the desktop brand/security panel. */
  sideTitle?: string;
  /** Supporting paragraph for the brand/security panel. */
  sideDescription?: string;
  /** Optional trust bullets shown on the desktop brand panel. */
  sideItems?: string[];
}

const DEFAULT_SIDE_ITEMS = [
  "HIPAA-conscious access",
  "Staff identity protection",
  "Secure operational workspace",
];

export function MfaBrandShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  sideTitle = "Protected access for Blossom OS",
  sideDescription = "Your workspace contains patient, staff, and operational information. Two-factor verification keeps the system protected before you continue.",
  sideItems = DEFAULT_SIDE_ITEMS,
}: Props) {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-[#f6f8fb] selection:bg-[#2d8a9e]/20"
      style={{ fontFamily: "'Figtree', system-ui, sans-serif" }}
    >
      {/* Ambient brand wash — calm, product-grade, no decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 12% 18%, rgba(45,138,158,0.10) 0%, rgba(45,138,158,0) 60%)," +
            "radial-gradient(50% 45% at 88% 90%, rgba(12,35,64,0.08) 0%, rgba(12,35,64,0) 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] flex-col lg:grid lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:px-12 lg:py-10">
        {/* ── Brand / security panel ─────────────────────────── */}
        <aside className="relative flex flex-col px-6 pt-6 sm:px-10 sm:pt-10 lg:px-0 lg:pt-0">
          <div className="flex items-center gap-2.5">
            <img
              src={logoWordmark}
              alt="Blossom ABA Therapy"
              className="h-8 w-auto object-contain"
            />
          </div>

          {/* Desktop-only: framed security panel that gives the page depth */}
          <div className="mt-10 hidden lg:flex lg:flex-1 lg:flex-col">
            <div
              className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white/60 p-10 backdrop-blur-xl"
              style={{
                boxShadow:
                  "0 1px 0 rgba(255,255,255,0.7) inset, 0 24px 60px -32px rgba(12,35,64,0.18)",
              }}
            >

              <div className="relative flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#2d8a9e]/10 text-[#2d8a9e]">
                  <ShieldCheck className="h-4 w-4" strokeWidth={1.9} />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Blossom OS · Secure access
                </span>
              </div>

              <h2
                className="relative mt-8 max-w-[22ch] text-[28px] font-semibold leading-[1.15] tracking-tight text-[#0c2340]"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
              >
                {sideTitle}
              </h2>
              <p className="relative mt-4 max-w-[40ch] text-sm leading-relaxed text-slate-600">
                {sideDescription}
              </p>

              <ul className="relative mt-8 space-y-3">
                {sideItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm text-slate-700"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#2d8a9e]/10 text-[#2d8a9e]">
                      <LockKeyhole className="h-3 w-3" strokeWidth={2} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="relative mt-auto pt-10">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Sparkles className="h-3.5 w-3.5 text-[#5cbdb9]" />
                  <span>Calm under pressure. Built for operations.</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MFA card column ────────────────────────────────── */}
        <main className="relative flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-0 lg:py-0">
          <div
            className="w-full max-w-[460px] rounded-3xl border border-slate-200/80 bg-white p-7 animate-in fade-in slide-in-from-bottom-4 duration-500 sm:p-9"
            style={{
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.9) inset, 0 24px 60px -28px rgba(12,35,64,0.22), 0 6px 18px -10px rgba(12,35,64,0.12)",
            }}
          >
            <header className="mb-7">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2d8a9e]">
                {eyebrow}
              </span>
              <h1
                className="mt-3 text-[26px] font-semibold leading-tight tracking-tight text-[#0c2340] sm:text-[30px]"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
              >
                {title}
              </h1>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-slate-500">
                {description}
              </p>
            </header>

            {children}

            {footer && (
              <div className="mt-8 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
                {footer}
              </div>
            )}
          </div>
        </main>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[11px] text-slate-400">
        © {new Date().getFullYear()} Blossom ABA Therapy · Secure operational workspace
      </div>
    </div>
  );
}