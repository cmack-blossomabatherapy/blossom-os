import { useEffect, useMemo, useRef, useState } from "react";
import { KeyRound, ExternalLink, Copy, Lock, Eye, EyeOff, ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logVaultEvent } from "@/lib/security/vaultAudit";
import { useToast } from "@/hooks/use-toast";
import { UnlockSheet } from "./UnlockSheet";
import { PinSetupDialog } from "./PinSetupDialog";

const REVEAL_MS = 45_000;

export function LoginsSection({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [pinSetupOpen, setPinSetupOpen] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const timers = useRef<Record<string, number>>({});

  const { data: logins, isLoading } = useQuery({
    queryKey: ["my_logins", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("employee_logins").select("*")
        .eq("user_id", userId).eq("is_active", true).order("system_name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    supabase.from("employee_pin_settings").select("user_id").eq("user_id", userId).maybeSingle()
      .then(({ data }) => setHasPin(!!data));
  }, [userId]);

  useEffect(() => () => {
    Object.values(timers.current).forEach((t) => window.clearTimeout(t));
  }, []);

  function maskFor(id: string) { return revealed[id] ? "" : "••••••••••"; }

  function startUnlock(loginId: string) {
    if (hasPin === false) { setPinSetupOpen(true); return; }
    setUnlocking(loginId);
  }

  function reveal(loginId: string, password: string | null) {
    if (!password) return toast({ title: "No password stored yet" });
    setRevealed((r) => ({ ...r, [loginId]: password }));
    logVaultEvent({ userId, loginId, action: "viewed" });
    if (timers.current[loginId]) window.clearTimeout(timers.current[loginId]);
    timers.current[loginId] = window.setTimeout(() => {
      setRevealed((r) => { const n = { ...r }; delete n[loginId]; return n; });
    }, REVEAL_MS);
  }

  async function copyPassword(loginId: string) {
    const v = revealed[loginId]; if (!v) return;
    await navigator.clipboard.writeText(v);
    logVaultEvent({ userId, loginId, action: "copied_password" });
    toast({ title: "Password copied", description: "Clears in 45 seconds." });
  }

  async function copyUsername(loginId: string, username: string | null) {
    if (!username) return;
    await navigator.clipboard.writeText(username);
    logVaultEvent({ userId, loginId, action: "copied_username" });
    toast({ title: "Username copied" });
  }

  function openUrl(loginId: string, url: string | null) {
    if (!url) return;
    logVaultEvent({ userId, loginId, action: "opened" });
    window.open(url, "_blank", "noreferrer");
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-semibold text-foreground">Secure logins</p>
            <p className="text-[11px] text-muted-foreground">{hasPin === false ? "Set a PIN to start using your vault." : "Unlock to reveal saved passwords."}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setPinSetupOpen(true)}>
          <Lock className="h-4 w-4" /> {hasPin === false ? "Set up PIN" : "Change PIN"}
        </Button>
      </div>

      {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      {logins && logins.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          <KeyRound className="mx-auto mb-2 h-6 w-6 opacity-60" />
          No logins assigned yet. Your admin will share systems here.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {logins?.map((l: any) => {
          const isRevealed = !!revealed[l.id];
          return (
            <div key={l.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{l.system_name}</p>
                  {l.system_category && <Badge variant="outline" className="mt-1 text-[10px]">{l.system_category}</Badge>}
                </div>
                {l.password_reset_required && <Badge variant="destructive" className="text-[10px] gap-1"><AlertTriangle className="h-3 w-3" /> Reset</Badge>}
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <Field label="Username" value={l.username || "—"} onCopy={() => copyUsername(l.id, l.username)} />
                <div className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-background/40 px-2.5 py-1.5">
                  <span className="text-muted-foreground">Password</span>
                  <span className="flex-1 font-mono tabular-nums text-foreground truncate text-right">
                    {isRevealed ? revealed[l.id] : maskFor(l.id)}
                  </span>
                  {isRevealed ? (
                    <>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copyPassword(l.id)}><Copy className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setRevealed((r) => { const n = { ...r }; delete n[l.id]; return n; })}><EyeOff className="h-3.5 w-3.5" /></Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => startUnlock(l.id)}>
                      <Eye className="h-3.5 w-3.5" /> Unlock
                    </Button>
                  )}
                </div>
                {l.login_url && (
                  <Button size="sm" variant="outline" className="w-full" onClick={() => openUrl(l.id, l.login_url)}>
                    <ExternalLink className="h-3.5 w-3.5" /> Open {hostFrom(l.login_url)}
                  </Button>
                )}
                {l.notes && <p className="text-[11px] text-muted-foreground">{l.notes}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <UnlockSheet open={!!unlocking} onOpenChange={(v) => !v && setUnlocking(null)} userId={userId} loginId={unlocking}
        onUnlocked={() => {
          if (!unlocking) return;
          const row = logins?.find((x: any) => x.id === unlocking);
          reveal(unlocking, row?.encrypted_password ?? null);
        }} />
      <PinSetupDialog open={pinSetupOpen} onOpenChange={setPinSetupOpen} userId={userId} onComplete={() => setHasPin(true)} />
    </section>
  );
}

function Field({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-background/40 px-2.5 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex-1 truncate text-right font-medium text-foreground">{value}</span>
      {onCopy && value !== "—" && <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onCopy}><Copy className="h-3.5 w-3.5" /></Button>}
    </div>
  );
}

function hostFrom(url: string) { try { return new URL(url).hostname.replace("www.", ""); } catch { return "site"; } }