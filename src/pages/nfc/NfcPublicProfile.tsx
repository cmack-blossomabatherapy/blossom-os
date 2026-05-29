import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BadgeCheck, ShieldAlert, PhoneCall, MapPin, Building2 } from "lucide-react";
import { useEmployeeDirectory } from "@/hooks/useEmployeeDirectory";
import { supabase } from "@/integrations/supabase/client";
import blossomLogo from "@/assets/blossom-logo-color.png";

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

export default function NfcPublicProfile() {
  const { code } = useParams<{ code: string }>();
  const { members, loading } = useEmployeeDirectory();
  const [resolvedUuid, setResolvedUuid] = useState<string | null>(null);
  const [lookupDone, setLookupDone] = useState(false);

  // Try slug/uuid first; otherwise resolve by NFC tag_code.
  const direct = members.find((x) => x.id === code || x.uuid === code) ?? null;

  useEffect(() => {
    if (!code || direct) { setLookupDone(true); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("employee_nfc_tags")
        .select("employee_id,is_active").eq("tag_code", code).eq("is_active", true).maybeSingle();
      if (cancelled) return;
      setResolvedUuid(data?.employee_id ?? null);
      setLookupDone(true);
    })();
    return () => { cancelled = true; };
  }, [code, direct]);

  const m = direct ?? (resolvedUuid ? members.find((x) => x.uuid === resolvedUuid) ?? null : null);
  const isLoading = loading || (!direct && !lookupDone);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/40 px-5 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-center">
          <img src={blossomLogo} alt="Blossom ABA Therapy" className="h-8 w-auto" />
        </div>

        {isLoading || !m ? (
          <div className="rounded-3xl border border-border/70 bg-card p-10 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">{isLoading ? "Verifying…" : "This employee tag is not recognized or has been revoked."}</p>
          </div>
        ) : (
          <article className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_24px_60px_-30px_oklch(0.2_0.02_260/0.25)]">
            <div className="flex flex-col items-center gap-3 px-8 pt-10 pb-6">
              {m.photo ? (
                <img src={m.photo} alt="" className="size-28 rounded-full object-cover ring-2 ring-primary/30" />
              ) : (
                <div className="size-28 rounded-full bg-muted grid place-items-center text-xl font-semibold text-muted-foreground ring-2 ring-primary/30">
                  {initials(m.name)}
                </div>
              )}
              <div className="text-center">
                <h1 className="text-xl font-semibold tracking-tight">{m.name}</h1>
                <p className="text-sm text-muted-foreground">{m.title}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <BadgeCheck className="size-3.5" /> Verified Blossom employee
              </span>
            </div>

            <div className="border-t border-border/60 px-8 py-5 text-sm">
              <dl className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="size-3.5" /> {m.departmentName ?? "Blossom ABA Therapy"}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-3.5" /> {(m.states ?? []).join(", ") || "Multi-state"}
                </div>
              </dl>
            </div>

            <div className="grid grid-cols-2 gap-px bg-border/60">
              <a href="tel:+18445566256" className="flex items-center justify-center gap-2 bg-card px-4 py-4 text-sm font-medium text-foreground hover:bg-muted transition">
                <PhoneCall className="size-4" /> Contact Blossom
              </a>
              <a href="mailto:concerns@blossomabatherapy.com" className="flex items-center justify-center gap-2 bg-card px-4 py-4 text-sm font-medium text-destructive hover:bg-muted transition">
                <ShieldAlert className="size-4" /> Report concern
              </a>
            </div>

            <p className="border-t border-border/60 px-8 py-4 text-center text-[11px] text-muted-foreground">
              Verified {new Date().toLocaleString()} · Personal contact info is never shown
            </p>
          </article>
        )}

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          © Blossom ABA Therapy
        </p>
      </div>
    </main>
  );
}