import { OSShell } from "./OSShell";
import { Settings } from "lucide-react";

export default function OSSettings() {
  return (
    <OSShell>
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Settings className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Coming soon — workspace preferences, notifications, and integrations.</p>
        </div>
      </div>
    </OSShell>
  );
}