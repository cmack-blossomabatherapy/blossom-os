import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BadgeCheck, Languages, Sparkles, Check, Linkedin, ShieldCheck,
  Bot, Workflow, BarChart3, Stethoscope, Cpu, TrendingUp, Wrench,
  GraduationCap, ShieldCheck as Shield, Heart, Users as UsersIcon,
  Building2, MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import blossomLogo from "@/assets/blossom-logo-color.png";
import { variantFor, ACTION_META, type NfcActionKind, type RoleKey } from "./roleVariants";
import { photoForCode } from "@/hooks/useEmployeeDirectory";
import type { LucideIcon } from "lucide-react";

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

function setMeta(attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

type Badge = {
  employee_id: string;
  employee_code: string | null;
  display_name: string;
  preferred_name: string | null;
  job_title: string | null;
  credential: string | null;
  pronouns: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  extension: string | null;
  department_name: string | null;
  states: string[] | null;
  state: string | null;
  bio: string | null;
  about_me: string | null;
  expertise: string[] | null;
  skills: string[] | null;
  languages: string[] | null;
  help_with: string[] | null;
  linkedin_url: string | null;
  leadership_level: string | null;
  emergency_contact: { name?: string; relationship?: string; phone?: string; email?: string } | null;
  nfc_settings: { enabled?: boolean; public?: boolean; internal?: boolean; business_card?: boolean; emergency?: boolean } | null;
  badge_style: "parent_safety" | "business_card";
  role_key: RoleKey | null;
};

function buildVCard(b: Badge) {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${b.display_name}`,
    `N:${b.display_name};;;;`,
    b.job_title ? `TITLE:${b.job_title}` : "",
    "ORG:Blossom ABA Therapy",
    b.email ? `EMAIL;TYPE=WORK:${b.email}` : "",
    b.phone ? `TEL;TYPE=WORK,VOICE:${b.phone}` : "",
    "URL:https://blossomabatherapy.com",
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\r\n");
}

function downloadVCard(b: Badge) {
  const blob = new Blob([buildVCard(b)], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${b.display_name.replace(/\s+/g, "_")}.vcf`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// Map an expertise / skill keyword to a recognizable icon.
function iconForTag(tag: string): LucideIcon {
  const t = tag.toLowerCase();
  if (/ai|automation|bot|gpt/.test(t)) return Bot;
  if (/workflow|process|operation/.test(t)) return Workflow;
  if (/report|analytic|dashboard|data/.test(t)) return BarChart3;
  if (/aba|clinical|therap|behavior/.test(t)) return Stethoscope;
  if (/system|software|tech|integration|api/.test(t)) return Cpu;
  if (/growth|improve|optim/.test(t)) return TrendingUp;
  if (/training|academy|learn|onboard/.test(t)) return GraduationCap;
  if (/quality|compliance|qa|hipaa/.test(t)) return Shield;
  if (/care|family|parent|support/.test(t)) return Heart;
  if (/team|people|hr|recruit/.test(t)) return UsersIcon;
  if (/tool|build|fix/.test(t)) return Wrench;
  return Sparkles;
}

// Split a single bio into two short paragraphs at the nearest sentence break.
function splitBio(text: string): [string, string?] {
  const clean = text.trim();
  if (clean.length < 180) return [clean];
  const half = Math.floor(clean.length / 2);
  const breakAt = clean.indexOf(". ", half - 40);
  if (breakAt > 0 && breakAt < clean.length - 20) {
    return [clean.slice(0, breakAt + 1), clean.slice(breakAt + 2)];
  }
  return [clean];
}

export default function NfcPublicProfile() {
  const { code } = useParams<{ code: string }>();
  const [badge, setBadge] = useState<Badge | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!code) { setIsLoading(false); return; }
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      // RPC is security-definer so it works for anonymous taps without
      // exposing the full employees table.
      const { data, error } = await supabase.rpc("get_nfc_badge", { _code: code });
      if (cancelled) return;
      if (error) {
        console.warn("[nfc] lookup failed", error);
        setBadge(null);
      } else {
        const row = (Array.isArray(data) ? data[0] : data) as Badge | null;
        setBadge(row ?? null);
      }
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [code]);

  const m = badge;

  // Brand the OS tap prompt, page title, and social previews.
  useEffect(() => {
    const personLabel = m?.display_name ? ` — ${m.display_name}` : "";
    document.title = `Blossom Smart Badge${personLabel}`;
    setMeta("name", "description", "Blossom Smart Badge — verify your Blossom ABA Therapy provider.");
    setMeta("name", "theme-color", "#2B7BD5");
    setMeta("property", "og:title", `Blossom Smart Badge${personLabel}`);
    setMeta("property", "og:description", "Verified Blossom ABA Therapy provider badge.");
    setMeta("property", "og:type", "website");
    setMeta("property", "og:image", `${window.location.origin}${blossomLogo}`);
    setMeta("name", "twitter:card", "summary");
    setMeta("name", "twitter:title", `Blossom Smart Badge${personLabel}`);
    setLink("apple-touch-icon", blossomLogo);
  }, [m?.display_name]);

  const statesLabel = (m?.states && m.states.length ? m.states : m?.state ? [m.state] : []).join(", ");
  const stateList = m?.states && m.states.length ? m.states : m?.state ? [m.state] : [];
  const variant = variantFor(m?.role_key);
  // Fallback to a bundled brochure photo when no upload exists yet.
  const resolvedPhoto = m?.photo_url || photoForCode(m?.employee_code) || null;
  // Honor admin-controlled visibility from the Identity tab.
  const settings = m?.nfc_settings ?? {};
  const publicAllowed = settings.public !== false;
  const businessCardAllowed = settings.business_card !== false;
  // Parent-safety fallback when admin hasn't opted into the business-card view.
  const isParentSafety = variant.parentSafety || !businessCardAllowed;

  const hrefFor = (kind: NfcActionKind): string | undefined => {
    if (!m) return undefined;
    switch (kind) {
      case "email":           return m.email ? `mailto:${m.email}` : undefined;
      case "call":            return m.phone ? `tel:${m.phone}` : undefined;
      case "website":         return "https://blossomabatherapy.com";
      case "support_line":    return "tel:+18445566256";
      case "report_concern":  return "mailto:concerns@blossomabatherapy.com";
      case "schedule":        return m.email ? `mailto:${m.email}?subject=Schedule%20request` : undefined;
      case "message":         return m.phone ? `sms:${m.phone}` : undefined;
      default:                return undefined;
    }
  };

  const renderActions = (kinds: NfcActionKind[]) => {
    const items = kinds
      .map((kind) => {
        const meta = ACTION_META[kind];
        const href = hrefFor(kind);
        const isSave = kind === "save_contact";
        if (!isSave && !href) return null;
        return { kind, meta, href, isSave };
      })
      .filter(Boolean) as { kind: NfcActionKind; meta: typeof ACTION_META[NfcActionKind]; href?: string; isSave: boolean }[];
    if (items.length === 0) return null;
    return (
      <div className="grid grid-cols-2 gap-2.5">
        {items.map(({ kind, meta, href, isSave }, idx) => {
          const Icon = meta.icon;
          const isPrimary = idx === 0 && !meta.destructive;
          const tone = meta.destructive
            ? "bg-destructive/10 text-destructive hover:bg-destructive/15 border border-destructive/20"
            : isPrimary
            ? "bg-foreground text-background shadow-sm hover:opacity-90 border border-transparent"
            : "bg-card text-foreground hover:bg-muted border border-border/70";
          const cls = `flex items-center justify-center gap-2 rounded-2xl px-4 h-12 text-[13px] font-semibold transition-all active:scale-[0.98] ${tone}`;
          if (isSave) {
            return (
              <button key={kind} onClick={() => m && downloadVCard(m)} className={cls}>
                <Icon className="size-4" /> {meta.label}
              </button>
            );
          }
          return (
            <a key={kind} href={href} className={cls}>
              <Icon className="size-4" /> {meta.label}
            </a>
          );
        })}
      </div>
    );
  };

  // Layout state for the rich content sections.
  const aboutText = m?.about_me || m?.bio || "";
  const aboutParas = aboutText ? splitBio(aboutText) : [];
  const expertiseTags = [...(m?.expertise ?? []), ...(m?.skills ?? [])].slice(0, 6);
  const showOrg = !isParentSafety && !!m?.department_name;

  return (
    <main className="min-h-screen bg-[oklch(0.985_0.003_100)] dark:bg-background">
      <div className="mx-auto max-w-lg px-4 pb-12 pt-6 sm:px-6">
        <div className="mb-5 flex items-center justify-center">
          <img src={blossomLogo} alt="Blossom ABA Therapy" className="h-7 w-auto opacity-90" />
        </div>

        {isLoading || !m ? (
          <div className="rounded-3xl border border-border/70 bg-card p-10 text-center shadow-sm">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Opening Blossom Smart Badge…</p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">This badge isn't recognized</p>
                <p className="text-xs text-muted-foreground">
                  The card you tapped may have been revoked, or it was programmed with an old URL before this badge system launched. If you're a Blossom team member, reprogram the tag from your employee profile.
                </p>
                {code && (
                  <p className="text-[11px] text-muted-foreground">
                    Scanned code: <span className="font-mono">{code}</span>
                  </p>
                )}
                <a href="mailto:support@blossomabatherapy.com" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                  Contact Blossom support
                </a>
              </div>
            )}
          </div>
        ) : !publicAllowed ? (
          <div className="rounded-3xl border border-border/70 bg-card p-10 text-center shadow-sm space-y-3">
            <p className="text-sm font-medium text-foreground">This badge is private</p>
            <p className="text-xs text-muted-foreground">
              {m.display_name} hasn't enabled the public profile for their Blossom badge. If you need to reach them, please contact Blossom directly.
            </p>
            <a href="tel:+18445566256" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
              Call Blossom support
            </a>
          </div>
        ) : (
          <div className="space-y-5">
            {/* HERO — animated gradient with large photo */}
            <section className="relative overflow-hidden rounded-[2rem] border border-border/60 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_30px_80px_-40px_oklch(0.2_0.02_260/0.35)]">
              {/* Gradient + animated blobs */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/10 to-background" />
              <div className="pointer-events-none absolute -left-16 -top-16 size-64 rounded-full bg-primary/30 blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
              <div className="pointer-events-none absolute -right-20 top-20 size-72 rounded-full bg-[oklch(0.78_0.12_320/0.25)] blur-3xl animate-[pulse_10s_ease-in-out_infinite]" />
              <div className="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-[oklch(0.85_0.1_220/0.25)] blur-3xl animate-[pulse_12s_ease-in-out_infinite]" />

              <div className="relative flex flex-col items-center px-6 pb-7 pt-10 text-center">
                <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-foreground/80 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                  <variant.icon className="size-3" /> {variant.eyebrow}
                </span>

                <div className="relative inline-block">
                  {resolvedPhoto ? (
                    <img
                      src={resolvedPhoto}
                      alt={m.display_name}
                      className="size-32 rounded-full object-cover ring-4 ring-white/70 shadow-[0_20px_50px_-20px_oklch(0.2_0.02_260/0.55)] dark:ring-white/10 sm:size-36"
                    />
                  ) : (
                    <div className="grid size-32 place-items-center rounded-full bg-card text-3xl font-semibold text-muted-foreground ring-4 ring-white/70 shadow-[0_20px_50px_-20px_oklch(0.2_0.02_260/0.55)] dark:ring-white/10 sm:size-36">
                      {initials(m.display_name)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-card p-1 shadow-sm">
                    <div className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-4" strokeWidth={3} />
                    </div>
                  </div>
                </div>

                <h1 className="mt-5 text-[28px] font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
                  {m.display_name}
                  {m.credential ? (
                    <span className="ml-1.5 text-lg font-normal text-muted-foreground">{m.credential}</span>
                  ) : null}
                </h1>
                {m.job_title && (
                  <p className="mt-1 text-[15px] font-medium text-foreground/80">{m.job_title}</p>
                )}
                {(statesLabel || m.department_name) && (
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {statesLabel ? (stateList.length > 1 ? "Multi-State Operations" : statesLabel) : m.department_name}
                  </p>
                )}
                {m.pronouns && <p className="mt-0.5 text-[11px] text-muted-foreground">{m.pronouns}</p>}

                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-foreground/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-background">
                  <BadgeCheck className="size-3.5" /> Verified Blossom Team Member
                </span>

                {/* Quick contact row */}
                <div className="mt-6 w-full">
                  {renderActions(variant.actions.slice(0, 2).concat(variant.actions.includes("save_contact") ? [] : ["save_contact"]).slice(0, 2) as NfcActionKind[])}
                </div>
              </div>
            </section>

            {/* STAT ROW */}
            <section className="grid grid-cols-3 gap-3">
              <StatCard label="Department" value={m.department_name ?? "Blossom ABA"} icon={Building2} />
              <StatCard
                label={stateList.length > 1 ? "Coverage" : "Location"}
                value={stateList.length ? stateList.join(" · ") : "Multi-state"}
                icon={MapPin}
              />
              <StatCard
                label="Expertise"
                value={expertiseTags.length ? `${expertiseTags.length}+` : "—"}
                icon={Sparkles}
              />
            </section>

            {/* ABOUT */}
            {aboutParas.length > 0 && (
              <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  About {m.preferred_name || m.display_name.split(" ")[0]}
                </h3>
                <div className="mt-3 space-y-3">
                  {aboutParas.map((p, i) => (
                    <p key={i} className="text-[14px] leading-relaxed text-foreground/85">{p}</p>
                  ))}
                </div>
              </section>
            )}

            {/* HOW I CAN HELP — centerpiece */}
            {!isParentSafety && m.help_with && m.help_with.length > 0 && (
              <section>
                <div className="mb-3 flex items-end justify-between">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    How I can help
                  </h3>
                  <span className="text-[10px] text-muted-foreground/80">Reach out anytime</span>
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {m.help_with.map((item) => (
                    <div
                      key={item}
                      className="group flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_24px_-12px_oklch(0.2_0.02_260/0.15)]"
                    >
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                      <span className="text-[13px] font-medium leading-snug text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* EXPERTISE — icon cards */}
            {expertiseTags.length > 0 && (
              <section>
                <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Expertise
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {expertiseTags.map((tag) => {
                    const Icon = iconForTag(tag);
                    return (
                      <div
                        key={tag}
                        className="group relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card to-muted/40 p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_24px_-12px_oklch(0.2_0.02_260/0.15)]"
                      >
                        <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="size-4" />
                        </span>
                        <p className="mt-2.5 text-[13px] font-semibold leading-tight text-foreground">{tag}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ORG — Part of */}
            {showOrg && (
              <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Organization
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Part of</p>
                    <p className="mt-0.5 text-[14px] font-semibold text-foreground">{m.department_name}</p>
                  </div>
                  {stateList.length > 0 && (
                    <div>
                      <p className="text-[11px] text-muted-foreground">Operating in</p>
                      <p className="mt-0.5 text-[14px] font-semibold text-foreground">{stateList.join(" · ")}</p>
                    </div>
                  )}
                  {m.languages && m.languages.length > 0 && (
                    <div className="sm:col-span-2">
                      <p className="text-[11px] text-muted-foreground">Languages</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[14px] font-semibold text-foreground">
                        <Languages className="size-3.5 text-muted-foreground" />
                        {m.languages.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* CONTACT — full CTA grid */}
            <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
              <div className="mb-4 flex items-end justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Get in touch
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <ShieldCheck className="size-3 text-primary" /> Verified contact
                </div>
              </div>
              {renderActions(variant.actions)}
              {!isParentSafety && m.linkedin_url && (
                <a
                  href={m.linkedin_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border/70 bg-muted/40 px-4 h-11 text-[12px] font-semibold text-foreground transition hover:bg-muted"
                >
                  <Linkedin className="size-4 text-[#0077B5]" /> View LinkedIn
                </a>
              )}
            </section>
          </div>
        )}

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Powered by Blossom OS · © Blossom ABA Therapy
        </p>
      </div>
    </main>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset]">
      <Icon className="size-3.5 text-muted-foreground" />
      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-tight text-foreground">{value}</p>
    </div>
  );
}