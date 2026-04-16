import { Search, Plus, Bell, Filter, CalendarDays, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="h-14 border-b border-border bg-card/60 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search everything..."
            className="w-64 h-8 pl-8 text-sm bg-secondary/50 border-border/50 focus:bg-card"
          />
        </div>

        {/* Quick actions */}
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
          <Filter className="h-3 w-3" />
          Filters
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
          <CalendarDays className="h-3 w-3" />
          Date Range
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        <Button size="sm" className="h-8 gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Create
        </Button>

        <Button size="icon" variant="ghost" className="h-8 w-8 relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        <Button size="icon" variant="ghost" className="h-8 w-8">
          <User className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}
