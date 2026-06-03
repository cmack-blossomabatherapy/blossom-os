import { useEffect, useState } from "react";
import { Fingerprint, KeyRound, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { isPasskeyAvailable, registerPasskey } from "@/lib/security/passkey";
import { toast } from "sonner";

type PasskeyRow = { credential_id: string | null; last_set_at: string };

export function SecurityKeysCard() {
  const { user } = useAuth();
  const [row, setRow] = useState<PasskeyRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const supported = isPasskeyAvailable();

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("employee_pin_settings")
      .select("passkey_credential_id, last_set_at")
      .eq("user_id", user.id)
      .maybeSingle();
    setRow(
      data?.passkey_credential_id
        ? { credential_id: data.passkey_credential_id, last_set_at: data.last_set_at }
        : null,
    );
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function handleRegister() {
    if (!user) return;
    setBusy(true);
    try {
      const result = await registerPasskey({
        userId: user.id,
        userName: user.email ?? user.id,
        displayName: (user.user_metadata?.full_name as string) ?? user.email ?? "Blossom user",
      });
      if (result.ok !== true) {
        if (result.reason === "notSupported") toast.error("Security keys aren't supported on this device.");
        else if (result.reason === "cancelled") toast("Registration cancelled.");
        else toast.error(result.message ?? "Couldn't register security key.");
        return;
      }
      // Try updating an existing row first. If no row matches (RLS or no PIN
      // set yet), `data` will be empty — fall back to an upsert so the key
      // is always persisted.
      const { data: updated, error: updErr } = await supabase
        .from("employee_pin_settings")
        .update({
          passkey_credential_id: result.credentialId,
          passkey_public_key: result.publicKey || null,
        })
        .eq("user_id", user.id)
        .select("user_id");
      if (updErr) throw updErr;
      if (!updated || updated.length === 0) {
        const { error: insErr } = await supabase.from("employee_pin_settings").upsert(
          {
            user_id: user.id,
            pin_hash: "",
            pin_salt: "",
            passkey_credential_id: result.credentialId,
            passkey_public_key: result.publicKey || null,
          },
          { onConflict: "user_id" },
        );
        if (insErr) throw insErr;
      }
      toast.success("Security key registered.");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't register security key.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("employee_pin_settings")
      .update({ passkey_credential_id: null, passkey_public_key: null })
      .eq("user_id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Security key removed.");
    await load();
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Fingerprint className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Security keys & passkeys</h2>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Use Face ID, Touch ID, Windows Hello, or a hardware security key (YubiKey) as a faster way to unlock your secure logins.
      </p>

      {!supported && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
          This browser doesn't support security keys. Try Chrome, Safari, or Edge.
        </div>
      )}

      {supported && loading && (
        <div className="flex h-16 items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {supported && !loading && !row && (
        <Button size="sm" onClick={handleRegister} disabled={busy} className="gap-1.5">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
          Register a security key
        </Button>
      )}

      {supported && !loading && row && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <div className="font-medium text-foreground">Security key</div>
                <div className="text-muted-foreground">
                  Registered {new Date(row.last_set_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Active
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleRegister} disabled={busy} className="gap-1.5">
              <KeyRound className="h-3.5 w-3.5" /> Replace
            </Button>
            <Button size="sm" variant="ghost" onClick={handleRemove} disabled={busy} className="gap-1.5 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}