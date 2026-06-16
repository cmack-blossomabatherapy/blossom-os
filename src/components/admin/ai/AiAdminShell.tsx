import { ReactNode, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, ShieldCheck, GraduationCap, History,
  Brain, BarChart3, Sparkles, Search, Command, Lock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UniversalSearch } from "./UniversalSearch";

const NAV = [
  { to: "/admin/ai",             label: "Dashboard",   icon: LayoutDashboard, end: true },
  { to: "/admin/ai/knowledge",   label: "Knowledge",   icon: BookOpen },
  { to: "/admin/ai/permissions", label: "Permissions", icon: ShieldCheck },
  { to: "/admin/ai/training",    label: "Training",    icon: GraduationCap },
  { to: "/admin/ai/audit",       label: "Audit Log",   icon: History },
  { to: "/admin/ai/memory",      label: "Memory",      icon: Brain },
  { to: "/admin/ai/analytics",   label: "Analytics",   icon: BarChart3 },
  { to: "/admin/ai/appearance",  label: "Appearance",  icon: Sparkles },
];

function Restricted() {
  const nav = useNavigate();
  return (
    <div className="min-h-[80vh] grid place-items-center p-8">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-muted grid place-items-center">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Restricted</h1>
        <p className="text-sm text-muted-foreground">
          The Blossom OS Insights control center is only available to Super Admins.
          This access attempt has been recorded.
        </p>
        <Button variant="outline" onClick={() => nav("/")}>Go Home</Button>
      </div>
    </div>
  );
}

export function AiAdminShell({ children }: { children?: ReactNode }) {
  const { isAdmin, loading } = useAuth();
  const { pathname } = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (loading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Restricted />;

  const active = NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-6">
        {/* Top bar */}
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white shadow-lg shadow-purple-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Blossom OS Insights</div>
            <h1 className="text-xl font-semibold tracking-tight truncate">{active?.label ?? "Control Center"}</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 h-10 px-3 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:bg-muted transition w-72"
            >
              <Search className="h-4 w-4" />
              <span>Search everything…</span>
              <kbd className="ml-auto text-[10px] bg-muted rounded px-1.5 py-0.5 flex items-center gap-0.5">
                <Command className="h-3 w-3" />K
              </kbd>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
          {/* Left rail */}
          <nav className="space-y-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground",
                  )
                }
              >
                <n.icon className="h-4 w-4" />
                <span>{n.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Content */}
          <main className="min-w-0">{children ?? <Outlet />}</main>
        </div>
      </div>

      <UniversalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}