import { Home, Compass, GraduationCap, Library, User, Calendar, LifeBuoy } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRoleSafe } from "@/contexts/OSRoleContext";

type Item = { to: string; label: string; icon: typeof Home; match?: (p: string) => boolean };

const GENERIC_ITEMS: Item[] = [
  { to: "/", label: "Home", icon: Home, match: (p) => p === "/" },
  { to: "/academy", label: "Academy", icon: Compass, match: (p) => p.startsWith("/academy") || p.startsWith("/blossom/academy") },
  { to: "/my-learning", label: "Learning", icon: GraduationCap, match: (p) => p.startsWith("/my-learning") || p.startsWith("/training") || p.startsWith("/catalog") || p === "/hr/journey" },
  { to: "/resources", label: "Resources", icon: Library, match: (p) => p.startsWith("/resources") || p.startsWith("/hr/resources") },
  { to: "/profile", label: "Profile", icon: User, match: (p) => p.startsWith("/profile") },
];

const RBT_ITEMS: Item[] = [
  { to: "/rbt/app/home",     label: "Home",     icon: Home,          match: (p) => p === "/rbt/app/home" || p === "/rbt/app" },
  { to: "/rbt/app/schedule", label: "Schedule", icon: Calendar,      match: (p) => p.startsWith("/rbt/app/schedule") },
  { to: "/rbt/app/learn",    label: "Learn",    icon: GraduationCap, match: (p) => p.startsWith("/rbt/app/learn") },
  { to: "/rbt/app/support",  label: "Support",  icon: LifeBuoy,      match: (p) => p.startsWith("/rbt/app/support") },
  { to: "/rbt/app/me",       label: "Me",       icon: User,          match: (p) => p.startsWith("/rbt/app/me") || p.startsWith("/profile") },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { user, loading } = useAuth();
  const osRole = useOSRoleSafe();

  if (loading || !user) return null;

  // RbtAppShell renders its own bottom nav inside /rbt/app/*; don't stack.
  if (pathname.startsWith("/rbt/app")) return null;

  const isRbt = osRole?.role === "rbt";
  const items = isRbt ? RBT_ITEMS : GENERIC_ITEMS;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-card/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)", paddingTop: "6px" }}
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = item.match ? item.match(pathname) : pathname === item.to;
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <NavLink
                to={item.to}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-all",
                    active && "bg-primary/12"
                  )}
                >
                  <Icon className={cn("h-[18px] w-[18px]", active && "scale-110")} />
                </span>
                <span className="leading-none">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}