import { Eye, EyeOff, RotateCcw, Settings as SettingsIcon, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { resetOnboarding, setPreviewLocked } from "@/lib/onboarding/storage";
import { PathSwitcher } from "@/components/onboarding/PathSwitcher";
import { useAuth } from "@/contexts/AuthContext";

export function SettingsSection({ ob }: { ob: any }) {
  const { signOut } = useAuth();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2"><SettingsIcon className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Onboarding path</h2></div>
        <PathSwitcher path={ob.path} disabled={ob.isComplete && !ob.bypassReal} />
        {ob.bypassReal && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => setPreviewLocked(!ob.previewLocked)} className="gap-1.5">
              {ob.previewLocked ? <><EyeOff className="h-3.5 w-3.5" /> Exit locked preview</> : <><Eye className="h-3.5 w-3.5" /> Preview as locked user</>}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => resetOnboarding()} className="gap-1.5 text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" /> Reset onboarding
            </Button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Account</h2></div>
        <div className="flex flex-col gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/notification-preferences">Notification preferences</Link></Button>
          <Button variant="ghost" size="sm" onClick={() => signOut()} className="justify-start text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </section>
    </div>
  );
}