import { X, UserPlus, ArrowRight, Send, Tag, ListPlus, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { LeadStatus, pipelineStages } from "@/data/leads";

interface LeadBulkActionBarProps {
  count: number;
  selectedIds: string[];
  onClear: () => void;
  onAssign: (owner: string) => void;
  onMoveStage: (status: LeadStatus) => void;
  onSendFollowUp: () => void;
  onTag: () => void;
  onCreateTask: () => void;
  onExport: () => void;
  onDelete: () => void;
  owners: string[];
}

export function LeadBulkActionBar({
  count, onClear, onAssign, onMoveStage, onSendFollowUp,
  onTag, onCreateTask, onExport, onDelete, owners,
}: LeadBulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="sticky top-[120px] z-20 bg-foreground text-background rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg animate-fade-in">
      <Button variant="ghost" size="sm" onClick={onClear} className="h-7 w-7 p-0 text-background hover:bg-background/10">
        <X className="h-3.5 w-3.5" />
      </Button>
      <span className="text-sm font-medium">{count} selected</span>
      <div className="h-4 w-px bg-background/20 mx-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-background hover:bg-background/10">
            <UserPlus className="h-3 w-3" /> Assign
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="text-[10px]">Assign to coordinator</DropdownMenuLabel>
          {owners.map((o) => (
            <DropdownMenuItem key={o} onClick={() => onAssign(o)}>{o}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-background hover:bg-background/10">
            <ArrowRight className="h-3 w-3" /> Move stage
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="text-[10px]">Move to</DropdownMenuLabel>
          {pipelineStages.map((s) => (
            <DropdownMenuItem key={s.name} onClick={() => onMoveStage(s.name)}>{s.name}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-background hover:bg-background/10" onClick={onSendFollowUp}>
        <Send className="h-3 w-3" /> Send follow-up
      </Button>
      <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-background hover:bg-background/10" onClick={onTag}>
        <Tag className="h-3 w-3" /> Tag
      </Button>
      <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-background hover:bg-background/10" onClick={onCreateTask}>
        <ListPlus className="h-3 w-3" /> Create task
      </Button>
      <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-background hover:bg-background/10" onClick={onExport}>
        <Download className="h-3 w-3" /> Export
      </Button>
      <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-destructive-foreground hover:bg-destructive/30" onClick={onDelete}>
        <Trash2 className="h-3 w-3" /> Delete
      </Button>
    </div>
  );
}
