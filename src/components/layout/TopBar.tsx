import { Search, Plus, CalendarDays, User, UserPlus, FileText, ListPlus, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "./NotificationBell";
import { useNavigate } from "react-router-dom";
import { useState, KeyboardEvent } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { toast } from "sonner";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [newLeadOpen, setNewLeadOpen] = useState(false);

  const submitSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && q.trim()) {
      navigate(`/leads?q=${encodeURIComponent(q.trim())}`);
    }
  };

  const todayIso = new Date().toISOString().split("T")[0];

  return (
    <header className="h-14 border-b border-border bg-card/60 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={submitSearch}
            placeholder="Search leads, clients, calls…"
            className="w-64 h-8 pl-8 text-sm bg-secondary/50 border-border/50 focus:bg-card"
          />
        </div>

        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          onClick={() => navigate("/scheduling")}
        >
          <CalendarDays className="h-3 w-3" />
          Schedule
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-8 gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Create
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

        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => navigate("/team")} aria-label="Profile">
          <User className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <NewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} onCreated={(lead) => navigate(`/leads/${lead.id}`)} />
    </header>
  );
}
