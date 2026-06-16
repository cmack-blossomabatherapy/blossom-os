import { FileText, Plus } from "lucide-react";
import { GrowthPageShell, ComingSoonNotice } from "@/components/os/growth/GrowthPageShell";

export default function IntakeTasks() {
  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Intake Tasks"
      description="Your personal intake task list — follow-ups, missing information, and lead actions."
      actions={[{ label: "Add task", icon: Plus, variant: "default" }]}
    >
      <ComingSoonNotice message="The live intake task list will appear here once intake workflows are connected." />
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" /> You have no tasks assigned right now.
        </div>
      </div>
    </GrowthPageShell>
  );
}