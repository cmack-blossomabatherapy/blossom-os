import { Search, User, UserPlus, LogOut, Shield, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertsPanel } from "@/components/alerts/AlertsPanel";
import { useNavigate, useLocation } from "react-router-dom";
import { CommandPalette, useCommandPalette } from "./CommandPalette";
import { ResumeOnboardingButton } from "@/components/onboarding/ResumeOnboardingButton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import logoWordmark from "@/assets/blossom-logo-wordmark.png";

interface TopBarProps {
  title: string;
  onOpenMobileMenu?: () => void;
  mobileMenuFloating?: boolean;
}

export function TopBar({ title, onOpenMobileMenu, mobileMenuFloating = false }: TopBarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const { user, roles, isAdmin, signOut } = useAuth();
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette();
  const primaryRole = roles[0] ?? "viewer";
  const initials = (user?.user_metadata?.display_name ?? user?.email ?? "U")
    .toString()
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase())
    .join("");

  return (
    <>
    <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    <header
      className={cn(
        "sticky top-0 z-30 flex shrink-0 items-center justify-between gap-2 overflow-hidden border-b border-border bg-card/95 px-4 backdrop-blur-xl transition-all duration-300 md:static md:h-14 md:translate-y-0 md:overflow-visible md:px-6",
        mobileMenuFloating ? "h-0 -translate-y-full border-transparent py-0 opacity-0" : "h-16 translate-y-0 py-0 opacity-100"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4 md:pr-0">
        <img
          src={logoWordmark}
          alt="Blossom ABA Therapy"
          className="h-7 shrink-0 object-contain sm:h-8 md:h-9"
        />
        {!isHome && (
          <>
            <div className="hidden h-6 w-px bg-border/70 sm:block" />
            <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground/90 sm:text-base md:text-[17px]">
              {title}
            </h1>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          aria-label="Open command palette"
          className="hidden h-8 items-center gap-2 rounded-md border border-border/60 bg-secondary/50 px-2.5 text-left text-sm text-muted-foreground transition hover:bg-secondary focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring sm:inline-flex md:w-64"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 truncate">Search…</span>
          <kbd className="pointer-events-none hidden rounded border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:inline-block">
            ⌘K
          </kbd>
        </button>

        <AlertsPanel />
        <ResumeOnboardingButton variant="topbar" className="ml-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="hidden h-8 w-8 sm:inline-flex" aria-label="Profile">
              {initials ? (
                <span className="h-7 w-7 rounded-full bg-primary/10 text-primary text-[11px] font-semibold flex items-center justify-center">
                  {initials}
                </span>
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground truncate">{user?.email ?? "Signed in"}</span>
                <span className="text-[11px] text-muted-foreground capitalize flex items-center gap-1">
                  <Shield className="h-3 w-3" /> {primaryRole}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isAdmin && (
              <DropdownMenuItem onClick={() => navigate("/team")}>
                <UserPlus className="h-3.5 w-3.5 mr-2" /> Manage team
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10 shrink-0 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

    </header>
    <Button
      size="icon"
      className={cn(
        "fixed right-3 top-[calc(0.625rem+env(safe-area-inset-top))] z-50 h-11 w-11 rounded-full bg-card/90 text-foreground shadow-lg ring-1 ring-border/80 backdrop-blur-xl transition-all duration-300 hover:bg-card md:hidden",
        mobileMenuFloating ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
      )}
      onClick={onOpenMobileMenu}
      aria-label="Open navigation menu"
    >
      <Menu className="h-5 w-5 text-primary" />
    </Button>
    </>
  );
}
