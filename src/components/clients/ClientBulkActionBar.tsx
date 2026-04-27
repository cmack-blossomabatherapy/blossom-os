import { X, UserPlus, Users, ArrowRight, Calendar, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { ClientStage } from "@/data/clients";

interface ClientBulkActionBarProps {
  count: number;
  onClear: () => void;
  onAssignBcba: (bcba: string) => void;
  onAssignRbt: (rbt: string) => void;
  onMoveStage: (stage: ClientStage) => void;
  onSetStartDate: () => void;
  onExport: () => void;
  onDelete: () => void;
  bcbas: string[];
  rbts: string[];
  movableStages: ClientStage[];
}

export function ClientBulkActionBar({
  count, onClear, onAssignBcba, onAssignRbt, onMoveStage, onSetStartDate, onExport, onDelete, bcbas, rbts, movableStages,
}: ClientBulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="sticky top-[140px] z-20 bg-foreground text-background rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg animate-fade-in">
      <Button variant="ghost" size="sm" onClick={onClear} className="h-7 w-7 p-0 text-background hover:bg-background/10">
        <X className="h-3.5 w-3.5" />
      </Button>
      <span className="text-sm font-medium">{count} selected</span>
      <div className="h-4 w-px bg-background/20 mx-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-background hover:bg-background/10">
            <UserPlus className="h-3 w-3" /> Assign BCBA
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="text-[10px]">Assign BCBA</DropdownMenuLabel>
          {bcbas.map((b) => <DropdownMenuItem key={b} onClick={() => onAssignBcba(b)}>{b}</DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-background hover:bg-background/10">
            <Users className="h-3 w-3" /> Assign RBT
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="text-[10px]">Assign RBT</DropdownMenuLabel>
          {rbts.map((r) => <DropdownMenuItem key={r} onClick={() => onAssignRbt(r)}>{r}</DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-background hover:bg-background/10">
            <ArrowRight className="h-3 w-3" /> Move stage
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-[400px] overflow-y-auto">
          <DropdownMenuLabel className="text-[10px]">Move to</DropdownMenuLabel>
          {movableStages.length === 0 && <DropdownMenuItem disabled>No shared next stage</DropdownMenuItem>}
          {movableStages.map((stage) => (
            <DropdownMenuItem key={stage} onClick={() => onMoveStage(stage)}>{stage}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-background hover:bg-background/10" onClick={onSetStartDate}>
        <Calendar className="h-3 w-3" /> Set start date
      </Button>
      <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-background hover:bg-background/10" onClick={onExport}>
        <Download className="h-3 w-3" /> Export
      </Button>
      <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs hover:bg-destructive/30" onClick={onDelete}>
        <Trash2 className="h-3 w-3" /> Delete
      </Button>
    </div>
  );
}
