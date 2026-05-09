import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { SettingsPanel } from "./SettingsPanel";

export function GeneralSettingsPanel() {
  return (
    <SettingsPanel title="General Settings" description="Company identity, timezone, and platform defaults">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Company Name">
          <Input defaultValue="Blossom ABA Therapy" className="h-9 text-sm" />
        </Field>
        <Field label="Default Timezone">
          <Input defaultValue="America/New_York" className="h-9 text-sm" />
        </Field>
        <Field label="Default State">
          <Input defaultValue="GA" className="h-9 text-sm" />
        </Field>
        <Field label="Support Email">
          <Input defaultValue="ops@blossomaba.com" className="h-9 text-sm" />
        </Field>
        <Field label="Primary Brand Color" hint="HSL token used across the app">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-primary border border-border/60" />
            <Input defaultValue="hsl(212 71% 50%)" className="h-9 text-sm font-mono" />
          </div>
        </Field>
        <Field label="Logo">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 border border-border/60 flex items-center justify-center text-primary text-xs font-bold">
              BAB
            </div>
            <button className="text-xs text-primary hover:underline">Upload new</button>
          </div>
        </Field>
      </div>

      <div className="mt-6 pt-5 border-t border-border/40 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platform behavior</h3>
        <Toggle label="Require 2FA for admin accounts" defaultChecked />
        <Toggle label="Auto-archive completed tasks after 30 days" defaultChecked />
        <Toggle label="Show system tips in detail panels" defaultChecked={false} />
      </div>

      <div className="mt-6 pt-5 border-t border-border/40 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Layout</h3>
        <div className="flex items-center justify-between bg-secondary/30 border border-border/40 rounded-lg px-3 py-2.5 gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">Reset sidebar layout</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Restore navigation sections to their default open/collapsed state.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs shrink-0"
            onClick={() => {
              try {
                localStorage.removeItem("sidebar-open-sections");
              } catch { /* ignore */ }
              window.dispatchEvent(new Event("sidebar:reset-layout"));
              toast.success("Sidebar layout reset to defaults");
            }}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
          </Button>
        </div>
      </div>
    </SettingsPanel>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between bg-secondary/30 border border-border/40 rounded-lg px-3 py-2">
      <span className="text-xs text-foreground">{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
