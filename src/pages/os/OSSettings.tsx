import { useState } from "react";
import { Bell, Fingerprint, KeyRound, Lock, Settings, User } from "lucide-react";
import { OSShell } from "./OSShell";
import { ProfileEditorCard } from "@/components/profile/ProfileEditorCard";
import { SecurityMfaCard } from "@/components/profile/SecurityMfaCard";
import { SecurityKeysCard } from "@/components/profile/SecurityKeysCard";
import { LoginsSection } from "@/components/profile/LoginsSection";
import NotificationPreferences from "@/pages/NotificationPreferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SettingsTab = "profile" | "security" | "logins" | "notifications";

const tabs: Array<{ id: SettingsTab; label: string; icon: typeof Settings }> = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "logins", label: "Logins", icon: KeyRound },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export default function OSSettings() {
  const { user } = useAuth();
  const [active, setActive] = useState<SettingsTab>("profile");

  return (
    <OSShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pb-10">
        <header className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <Settings className="h-3.5 w-3.5 text-primary" /> User settings
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Manage your Blossom OS account</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Update your information, secure sign-in, saved logins, and notification preferences.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm shadow-sm">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Signed in as</p>
              <p className="mt-0.5 font-medium text-foreground">{user?.email ?? "Blossom user"}</p>
            </div>
          </div>
        </header>

        <nav className="grid gap-2 rounded-2xl border border-border/60 bg-card p-2 shadow-sm sm:grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  selected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {active === "profile" && (
          <div className="grid gap-4 md:grid-cols-2">
            <ProfileEditorCard />
          </div>
        )}

        {active === "security" && (
          <div className="grid gap-4 md:grid-cols-2">
            <PasswordCard />
            <SecurityMfaCard />
            <SecurityKeysCard />
          </div>
        )}

        {active === "logins" && user?.id && <LoginsSection userId={user.id} />}

        {active === "notifications" && (
          <div className="rounded-3xl border border-border/60 bg-card/80 p-1 shadow-sm">
            <NotificationPreferences />
          </div>
        )}
      </div>
    </OSShell>
  );
}

function PasswordCard() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setSaving(true);
    const { error } = await updatePassword(password);
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }
    setPassword("");
    setConfirm("");
    toast.success("Password updated.");
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Fingerprint className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Password</h2>
      </div>
      <form onSubmit={savePassword} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="settings-new-password" className="text-xs">New password</Label>
          <Input
            id="settings-new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settings-confirm-password" className="text-xs">Confirm password</Label>
          <Input
            id="settings-confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="Re-enter new password"
          />
        </div>
        <Button size="sm" type="submit" disabled={saving} className="gap-1.5">
          <Lock className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Update password"}
        </Button>
      </form>
    </section>
  );
}