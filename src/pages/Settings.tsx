import { PageShell } from "@/components/shared/PageShell";
import { Settings as SettingsIcon } from "lucide-react";

const sections = [
  "States", "Clinics", "Payors", "Form Templates", "Consent Templates",
  "Status Management", "Automation Settings", "Roles & Permissions",
  "Communication Settings", "Integrations", "Branding"
];

export default function SettingsPage() {
  return (
    <PageShell title="Settings" description="Configure your Blossom ABA platform" icon={SettingsIcon}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {sections.map(s => (
          <button key={s} className="bg-card rounded-xl border border-border/60 p-5 text-left hover:border-primary/30 hover:shadow-sm transition-all group">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{s}</h3>
            <p className="text-xs text-muted-foreground mt-1">Configure {s.toLowerCase()}</p>
          </button>
        ))}
      </div>
    </PageShell>
  );
}
