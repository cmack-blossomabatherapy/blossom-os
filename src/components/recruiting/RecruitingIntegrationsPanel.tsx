import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Mail, Wallet, PlugZap } from "lucide-react";

type Status = "not_connected" | "coming_soon" | "live";

interface IntegrationRow {
  key: string;
  name: string;
  purpose: string;
  icon: typeof PlugZap;
  status: Status;
  note: string;
}

const INTEGRATIONS: IntegrationRow[] = [
  {
    key: "apploi",
    name: "Apploi",
    purpose: "Applicant tracking source for RBT/BCBA candidates",
    icon: Briefcase,
    status: "not_connected",
    note: "When connected, new applicants will sync into the Recruiting Pipeline automatically.",
  },
  {
    key: "outlook",
    name: "Microsoft Outlook",
    purpose: "Interview scheduling and recruiter mailbox",
    icon: Mail,
    status: "not_connected",
    note: "Will enable two-way calendar sync and one-click email logging on candidates.",
  },
  {
    key: "viventium",
    name: "Viventium",
    purpose: "New-hire payroll and onboarding hand-off",
    icon: Wallet,
    status: "not_connected",
    note: "Once linked, accepted offers will provision the new-hire packet directly in Viventium.",
  },
];

function statusBadge(s: Status) {
  if (s === "live") return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Connected</Badge>;
  if (s === "coming_soon") return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Coming soon</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">Not connected yet</Badge>;
}

export function RecruitingIntegrationsPanel() {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <PlugZap className="h-4 w-4 text-primary" /> Recruiting integrations
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Source systems that will plug into the recruiting workflow. Until connected, data is entered manually inside Blossom OS.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {INTEGRATIONS.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.key}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{row.name}</span>
                  {statusBadge(row.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{row.purpose}</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1">{row.note}</p>
              </div>
              <Button size="sm" variant="outline" disabled className="shrink-0">
                Request setup
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}