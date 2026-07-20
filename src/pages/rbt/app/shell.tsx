import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, Calendar, GraduationCap, LifeBuoy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { RbtAppErrorBoundary } from "./RbtAppErrorBoundary";

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
    <div className="min-h-dvh bg-background text-foreground md:flex">
      {/* Desktop left sidebar */}
      <aside
        className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border/70 md:bg-sidebar md:text-sidebar-foreground md:sticky md:top-0 md:h-dvh"
        aria-label="Primary"
      >
        <div className="h-16 px-6 flex items-center border-b border-border/60">
          <span className="text-base font-semibold tracking-tight">Blossom OS</span>
        </div>
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {tabs.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 h-10 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )
                  }
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="mx-auto w-full max-w-3xl md:max-w-5xl px-5 md:px-8 h-14 md:h-16 flex items-center justify-between">
            <span className="text-[15px] md:text-lg font-semibold tracking-tight">
              {current?.label ?? "Blossom"}
            </span>
            <span className="text-xs text-muted-foreground md:hidden">Blossom OS</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 mx-auto w-full max-w-3xl md:max-w-5xl px-5 md:px-8 pb-32 md:pb-10 pt-4 md:pt-6">
          <RbtAppErrorBoundary key={location.pathname}>
            <Outlet />
          </RbtAppErrorBoundary>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/70 bg-background/85 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary mobile"
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