import { BarChart3, Download, Mail, Printer } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { blossomReports } from "@/data/blossomOS";
import { Link } from "react-router-dom";

export default function BlossomReports() {
  return (
    <GlassPageShell
      eyebrow="Reports"
      eyebrowIcon={BarChart3}
      title="Training & operations reports"
      description="Foundational reports for training completion, certifications, activity, and compliance."
      actions={
        <Link to="/reports">
          <Button variant="outline" size="sm">Open executive reports →</Button>
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {blossomReports.map((r) => (
          <Card key={r.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <BarChart3 className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
            </div>
            <h3 className="mt-3 text-base font-semibold">{r.title}</h3>
            <p className="mt-1 flex-1 text-xs text-muted-foreground">{r.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-3">
              <Button size="sm" variant="outline" className="h-7 text-[11px]"><Download className="h-3 w-3" /> Export CSV</Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px]"><Mail className="h-3 w-3" /> Email</Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px]"><Printer className="h-3 w-3" /> Print</Button>
            </div>
          </Card>
        ))}
      </div>
    </GlassPageShell>
  );
}
