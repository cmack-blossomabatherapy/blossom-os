import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BadgeCheck, ShieldAlert, PhoneCall, MapPin, Building2, Mail, Phone, UserPlus, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import blossomLogo from "@/assets/blossom-logo-color.png";

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
  display_name: string;
  job_title: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  department_name: string | null;
  states: string[] | null;
  state: string | null;
  badge_style: "parent_safety" | "business_card";
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
  const isParentSafety = m?.badge_style === "parent_safety";

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
        ) : (
          <article className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_24px_60px_-30px_oklch(0.2_0.02_260/0.25)]">
            <div className="flex flex-col items-center gap-3 px-8 pt-10 pb-6">
              {m.photo_url ? (
                <img src={m.photo_url} alt="" className="size-28 rounded-full object-cover ring-2 ring-primary/30" />
              ) : (
                <div className="size-28 rounded-full bg-muted grid place-items-center text-xl font-semibold text-muted-foreground ring-2 ring-primary/30">
                  {initials(m.display_name)}
                </div>
              )}
              <div className="text-center">
                <h1 className="text-xl font-semibold tracking-tight">{m.display_name}</h1>
                {m.job_title && <p className="text-sm text-muted-foreground">{m.job_title}</p>}
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <BadgeCheck className="size-3.5" /> Verified Blossom employee
              </span>
            </div>

            <div className="border-t border-border/60 px-8 py-5 text-sm">
              <dl className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="size-3.5" /> {m.department_name ?? "Blossom ABA Therapy"}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-3.5" /> {statesLabel || "Multi-state"}
                </div>
              </dl>
            </div>

            {isParentSafety ? (
              <>
                <div className="grid grid-cols-2 gap-px bg-border/60">
                  <a href="tel:+18445566256" className="flex items-center justify-center gap-2 bg-card px-4 py-4 text-sm font-medium text-foreground hover:bg-muted transition">
                    <PhoneCall className="size-4" /> Contact Blossom
                  </a>
                  <a href="mailto:concerns@blossomabatherapy.com" className="flex items-center justify-center gap-2 bg-card px-4 py-4 text-sm font-medium text-destructive hover:bg-muted transition">
                    <ShieldAlert className="size-4" /> Report concern
                  </a>
                </div>
                <p className="border-t border-border/60 px-8 py-4 text-center text-[11px] text-muted-foreground">
                  Verified {new Date().toLocaleDateString()} · Personal contact info is never shown
                </p>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-px bg-border/60 sm:grid-cols-2">
                  {m.email && (
                    <a href={`mailto:${m.email}`} className="flex items-center justify-center gap-2 bg-card px-4 py-4 text-sm font-medium text-foreground hover:bg-muted transition">
                      <Mail className="size-4" /> Email
                    </a>
                  )}
                  {m.phone && (
                    <a href={`tel:${m.phone}`} className="flex items-center justify-center gap-2 bg-card px-4 py-4 text-sm font-medium text-foreground hover:bg-muted transition">
                      <Phone className="size-4" /> Call
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-px bg-border/60 sm:grid-cols-2 border-t border-border/60">
                  <button onClick={() => downloadVCard(m)} className="flex items-center justify-center gap-2 bg-card px-4 py-4 text-sm font-medium text-primary hover:bg-muted transition">
                    <UserPlus className="size-4" /> Save to Contacts
                  </button>
                  <a href="https://blossomabatherapy.com" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-card px-4 py-4 text-sm font-medium text-foreground hover:bg-muted transition">
                    <Globe className="size-4" /> Visit Blossom
                  </a>
                </div>
                <p className="border-t border-border/60 px-8 py-4 text-center text-[11px] text-muted-foreground">
                  Verified Blossom ABA Therapy team member · Tap Save to Contacts to add to your phone
                </p>
              </>
            )}
          </article>
        )}

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          © Blossom ABA Therapy
        </p>
      </div>
    </main>
  );
}