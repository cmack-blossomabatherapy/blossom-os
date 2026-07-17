import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, Calendar, GraduationCap, LifeBuoy, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/rbt/app/home",     label: "Home",     icon: Home },
  { to: "/rbt/app/schedule", label: "Schedule", icon: Calendar },
  { to: "/rbt/app/learn",    label: "Learn",    icon: GraduationCap },
  { to: "/rbt/app/support",  label: "Support",  icon: LifeBuoy },
  { to: "/rbt/app/me",       label: "Me",       icon: User },
];

export default function RbtAppShell() {
  const location = useLocation();
  const current = tabs.find((t) => location.pathname.startsWith(t.to));
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header
        className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto max-w-3xl px-5 h-14 flex items-center justify-between">
          <span className="text-[15px] font-semibold tracking-tight">
            {current?.label ?? "Blossom"}
          </span>
          <span className="text-xs text-muted-foreground">Blossom OS</span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-5 pb-32 pt-4">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 border-t border-border/70 bg-background/85 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        <ul className="mx-auto max-w-3xl grid grid-cols-5">
          {tabs.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-1 h-16 min-h-[64px] text-[11px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}