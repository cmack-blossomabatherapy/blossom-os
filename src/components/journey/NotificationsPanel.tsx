import { Bell, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  tone: "info" | "warning" | "success";
  title: string;
  detail: string;
}

const TONE: Record<Item["tone"], { icon: typeof Info; cls: string }> = {
  info: { icon: Info, cls: "bg-info/10 text-info" },
  warning: { icon: AlertTriangle, cls: "bg-warning/10 text-warning" },
  success: { icon: CheckCircle2, cls: "bg-success/10 text-success" },
};

export function NotificationsPanel({ items }: { items: Item[] }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" /> Reminders
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Things you should know right now.</p>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">You're all caught up.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((it) => {
            const T = TONE[it.tone];
            const Icon = T.icon;
            return (
              <li key={it.id} className="flex items-start gap-3 rounded-xl border border-border/40 p-3">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", T.cls)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{it.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{it.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
