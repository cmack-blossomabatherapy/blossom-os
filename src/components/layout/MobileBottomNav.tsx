import { Home, GraduationCap, BookOpen, Bell, User, Library } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type Item = { to: string; label: string; icon: typeof Home; match?: (p: string) => boolean };

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { user, isAdmin } = useAuth();

  const items: Item[] = [
    { to: "/", label: "Home", icon: Home, match: (p) => p === "/" || p === "/dashboard" || p.endsWith("-dashboard") },
    { to: "/blossom/academy", label: "Academy", icon: GraduationCap, match: (p) => p.startsWith("/blossom/academy") },
    { to: "/training", label: "Training", icon: BookOpen, match: (p) => p.startsWith("/training") || p === "/hr/journey" },
    { to: "/resources", label: "Resources", icon: Library, match: (p) => p.startsWith("/resources") || p.startsWith("/hr/resources") },
    { to: isAdmin ? "/intelligence" : "/hr", label: isAdmin ? "Insights" : "Profile", icon: isAdmin ? Bell : User, match: (p) => isAdmin ? p.startsWith("/intelligence") : p.startsWith("/hr") },
  ];

  if (!user) return null;

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