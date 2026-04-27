import { Search, Plus, CalendarDays, User, UserPlus, FileText, ListPlus, Phone, LogOut, Shield, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "./NotificationBell";
import { useNavigate } from "react-router-dom";
import { useState, KeyboardEvent } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import logo from "@/assets/blossom-logo.png";

interface TopBarProps {
  title: string;
  onOpenMobileMenu?: () => void;
  mobileMenuFloating?: boolean;
}

export function TopBar({ title, onOpenMobileMenu, mobileMenuFloating = false }: TopBarProps) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const { user, roles, isAdmin, signOut } = useAuth();
  const primaryRole = roles[0] ?? "viewer";
  const initials = (user?.user_metadata?.display_name ?? user?.email ?? "U")
    .toString()
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase())
    .join("");

  const submitSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && q.trim()) {
      navigate(`/leads?q=${encodeURIComponent(q.trim())}`);
    }
  };

  const todayIso = new Date().toISOString().split("T")[0];

  return (
    <>
    <header
      className={cn(
        "sticky top-0 z-30 flex shrink-0 items-center justify-between gap-2 overflow-hidden border-b border-border bg-card/95 px-4 backdrop-blur-xl transition-all duration-300 md:static md:h-14 md:translate-y-0 md:overflow-visible md:px-6",
        mobileMenuFloating ? "h-0 -translate-y-full border-transparent py-0 opacity-0" : "h-16 translate-y-0 py-0 opacity-100"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 md:block md:pr-0">
        <img src={logo} alt="Blossom ABA Therapy" className="h-8 w-8 shrink-0 rounded-full object-contain md:hidden" />
        <h1 className="truncate text-[17px] font-semibold leading-tight text-foreground md:text-lg">{title}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
        <div className="relative hidden min-w-0 flex-1 sm:block md:flex-none">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={submitSearch}
            placeholder="Search leads, clients, calls…"
            className="h-8 w-full bg-secondary/50 pl-8 text-sm focus:bg-card md:w-64"
          />
        </div>

        <Button
          size="sm"
          variant="outline"
          className="hidden h-8 gap-1.5 text-xs sm:inline-flex"
          onClick={() => navigate("/scheduling")}
        >
          <CalendarDays className="h-3 w-3" />
          Schedule
        </Button>

        <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" className="h-8 w-8 sm:w-auto sm:gap-1.5 sm:px-3 sm:text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Create new</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setNewLeadOpen(true)}>
              <UserPlus className="h-3.5 w-3.5 mr-2" /> New lead
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { navigate("/tasks"); toast.info("Open the Tasks page to create a task"); }}>
              <ListPlus className="h-3.5 w-3.5 mr-2" /> New task
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/phone-calls")}>
              <Phone className="h-3.5 w-3.5 mr-2" /> Log call
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/documents")}>
              <FileText className="h-3.5 w-3.5 mr-2" /> Upload document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/scheduling?date=${todayIso}`)}>
              <CalendarDays className="h-3.5 w-3.5 mr-2" /> Schedule session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Profile">
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

      <NewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} onCreated={(lead) => navigate(`/leads/${lead.id}`)} />
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
