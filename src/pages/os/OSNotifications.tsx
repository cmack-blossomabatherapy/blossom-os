import { OSShell } from "./OSShell";
import { Bell } from "lucide-react";

const NOTIFICATIONS = [
  { id: 1, title: "Welcome to Blossom OS", body: "Your workspace is ready. Explore the sidebar to get started.", time: "Just now", unread: true },
  { id: 2, title: "New BCBA session imported", body: "12 sessions were added to the latest weekly snapshot.", time: "2h ago", unread: true },
  { id: 3, title: "Authorization expiring soon", body: "3 authorizations expire in the next 14 days.", time: "Yesterday", unread: false },
  { id: 4, title: "Training assigned", body: "You've been assigned the State Director onboarding track.", time: "2 days ago", unread: false },
];

export default function OSNotifications() {
  return (
    <OSShell>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Notifications</h1>
            <p className="text-sm text-muted-foreground">Recent alerts and updates from across your workspace.</p>
          </div>
        </div>
        <div className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card">
          {NOTIFICATIONS.map((n) => (
            <div key={n.id} className="flex items-start gap-3 p-4">
              <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.unread ? "bg-primary" : "bg-muted-foreground/30"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="shrink-0 text-xs text-muted-foreground">{n.time}</p>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </OSShell>
  );
}