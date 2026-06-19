import { ReactNode } from "react";
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
    <div
      className="relative min-h-screen w-full overflow-hidden bg-[#f8fafc] selection:bg-[#2d8a9e]/20"
      style={{ fontFamily: "'Figtree', system-ui, sans-serif" }}
    >
      {/* Brand logo — top left, clean */}
      <div className="absolute left-6 top-6 z-10 sm:left-10 sm:top-10">
        <img
          src={logoWordmark}
          alt="Blossom ABA Therapy"
          className="h-8 w-auto object-contain opacity-90"
        />
      </div>

      {/* Subtle bento brand accent — bottom right */}
      <div className="pointer-events-none absolute bottom-10 right-10 hidden gap-3 opacity-20 sm:flex">
        <div className="h-10 w-10 rounded-2xl bg-[#5cbdb9]" />
        <div className="h-10 w-10 rounded-2xl border-2 border-[#1a4a6e]" />
      </div>

      <div className="relative flex min-h-screen w-full items-center justify-center p-6">
        <div className="w-full max-w-[440px] rounded-3xl border border-slate-200/80 bg-white p-8 shadow-2xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-700 sm:p-10">
          <header className="mb-10 text-center sm:text-left">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {eyebrow}
            </span>
            <h1
              className="mt-3 text-[28px] font-semibold leading-tight tracking-tight text-[#0c2340] sm:text-[32px]"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              {title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">{description}</p>
          </header>

          {children}

          {footer && (
            <div className="mt-10 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
              {footer}
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-[11px] text-slate-300">
        © {new Date().getFullYear()} Blossom ABA Therapy
      </div>
    </div>
  );
}