import { X, UserPlus, ArrowRight, Send, Tag, ListPlus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeadBulkActionBarProps {
  count: number;
  onClear: () => void;
}

export function LeadBulkActionBar({ count, onClear }: LeadBulkActionBarProps) {
  if (count === 0) return null;
  return (
    <div className="sticky top-0 z-20 bg-foreground text-background rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg animate-fade-in">
      <Button variant="ghost" size="sm" onClick={onClear} className="h-7 w-7 p-0 text-background hover:bg-background/10">
        <X className="h-3.5 w-3.5" />
      </Button>
      <span className="text-sm font-medium">{count} selected</span>
      <div className="h-4 w-px bg-background/20 mx-1" />
      {[
        { icon: UserPlus, label: "Assign" },
        { icon: ArrowRight, label: "Move stage" },
        { icon: Send, label: "Send follow-up" },
        { icon: Tag, label: "Tag" },
        { icon: ListPlus, label: "Create task" },
        { icon: Download, label: "Export" },
      ].map(({ icon: Icon, label }) => (
        <Button key={label} variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-background hover:bg-background/10">
          <Icon className="h-3 w-3" /> {label}
        </Button>
      ))}
    </div>
  );
}
