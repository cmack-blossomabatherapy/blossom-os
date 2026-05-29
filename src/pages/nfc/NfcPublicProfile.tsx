import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BadgeCheck, MapPin, Building2, Languages, Sparkles, Check, Linkedin, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import blossomLogo from "@/assets/blossom-logo-color.png";
import { variantFor, ACTION_META, type NfcActionKind, type RoleKey } from "./roleVariants";
import { photoForCode } from "@/hooks/useEmployeeDirectory";

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
    const cols = items.length === 1 ? "grid-cols-1" : "grid-cols-2";
    return (
      <div className={`grid ${cols} gap-3`}>
        {items.map(({ kind, meta, href, isSave }, idx) => {
          const Icon = meta.icon;
          // First action = primary filled; second = dark/foreground; rest = muted.
          const isPrimary = idx === 0 && !meta.destructive;
          const isDark = idx === 1 && !meta.destructive;
          const tone = meta.destructive
            ? "bg-destructive/10 text-destructive hover:bg-destructive/15"
            : isPrimary
            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:opacity-95"
            : isDark
            ? "bg-foreground text-background hover:opacity-95"
            : "bg-muted text-foreground hover:bg-muted/80";
          const cls = `flex flex-col items-center justify-center gap-1.5 rounded-2xl px-4 py-4 text-[12px] font-semibold transition-all active:scale-[0.98] ${tone}`;
          if (isSave) {
            return (
              <button key={kind} onClick={() => m && downloadVCard(m)} className={cls}>
                <Icon className="size-5" /> {meta.label}
              </button>
            );
          }
          return (
            <a key={kind} href={href} className={cls}>
              <Icon className="size-5" /> {meta.label}
            </a>
          );
        })}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/40 px-5 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-center">
          <img src={blossomLogo} alt="Blossom ABA Therapy" className="h-8 w-auto" />
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
          <article className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_24px_60px_-30px_oklch(0.2_0.02_260/0.25)]">
            {/* Eyebrow */}
            <div className="flex items-center justify-center gap-1.5 px-8 pt-6 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <variant.icon className="size-3" /> {variant.eyebrow}
            </div>

            {/* Hero */}
            <div className="flex flex-col items-center px-8 pt-4 pb-6 text-center">
              <div className="relative inline-block">
                {resolvedPhoto ? (
                  <img
                    src={resolvedPhoto}
                    alt=""
                    className="size-28 rounded-full object-cover border-4 border-card shadow-md ring-1 ring-border/60"
                  />
                ) : (
                  <div className="size-28 rounded-full bg-muted grid place-items-center text-2xl font-semibold text-muted-foreground border-4 border-card shadow-md ring-1 ring-border/60">
                    {initials(m.display_name)}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 rounded-full bg-card p-1 shadow-sm">
                  <div className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" strokeWidth={3} />
                  </div>
                </div>
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                {m.display_name}
                {m.credential ? (
                  <span className="ml-1.5 text-base font-normal text-muted-foreground">{m.credential}</span>
                ) : null}
              </h1>
              {m.job_title && <p className="text-sm font-medium text-muted-foreground">{m.job_title}</p>}
              {m.pronouns && <p className="mt-0.5 text-[11px] text-muted-foreground">{m.pronouns}</p>}

              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                <BadgeCheck className="size-3.5" /> Verified Blossom Employee
              </span>

              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
                {m.about_me || m.bio || variant.tagline}
              </p>
            </div>

            {/* Sectioned content */}
            <div className="space-y-7 px-6 pb-2">
              {/* Core info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-muted/60 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Department</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                    {m.department_name ?? "Blossom ABA"}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/60 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Location</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                    {statesLabel || "Multi-state"}
                  </p>
                </div>
                {m.languages && m.languages.length > 0 && (
                  <div className="col-span-2 rounded-2xl bg-muted/60 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Languages</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Languages className="size-3.5 text-muted-foreground" />
                      {m.languages.join(", ")}
                    </p>
                  </div>
                )}
              </div>

              {/* How I can help */}
              {!isParentSafety && m.help_with && m.help_with.length > 0 ? (
                <div>
                  <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    How I can help
                  </h3>
                  <ul className="space-y-2.5">
                    {m.help_with.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-[13px] font-medium text-foreground">
                        <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Expertise tags */}
              {(m.expertise?.length || m.skills?.length) ? (
                <div>
                  <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[...(m.expertise ?? []), ...(m.skills ?? [])].slice(0, 6).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                      >
                        <Sparkles className="size-3 opacity-60" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* LinkedIn callout */}
              {!isParentSafety && m.linkedin_url ? (
                <a
                  href={m.linkedin_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/5 p-3.5 transition hover:bg-primary/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-lg bg-[#0077B5] text-white">
                      <Linkedin className="size-4" />
                    </span>
                    <span className="text-sm font-semibold text-primary">Connect on LinkedIn</span>
                  </div>
                  <span className="text-primary transition-transform group-hover:translate-x-0.5">→</span>
                </a>
              ) : null}
            </div>

            {/* Contact actions */}
            <div className="px-6 pt-6 pb-6">
              {renderActions(variant.actions)}
            </div>

            {/* Verified footer */}
            <div className="border-t border-border/60 bg-muted/40 px-6 py-4">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Verified Blossom Member
                </span>
              </div>
              <p className="mt-1.5 text-center text-[10px] leading-tight text-muted-foreground/80">
                {isParentSafety
                  ? `Verified ${new Date().toLocaleDateString()} · Personal contact info is never shown`
                  : "Tap Save to Contacts to add this professional to your phone"}
              </p>
            </div>
          </article>
        )}

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          © Blossom ABA Therapy
        </p>
      </div>
    </main>
  );
}