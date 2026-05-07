import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type TCRow = {
  id: string;
  course_id: string;
  sort_order: number;
  required: boolean;
  due_after_days: number | null;
  title: string;
  minutes: number;
};

function Row({ row, onToggleRequired, onDueChange, onRemove }: {
  row: TCRow;
  onToggleRequired: (id: string, v: boolean) => void;
  onDueChange: (id: string, v: number | null) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/40 px-2 py-2">
      <button {...attributes} {...listeners} className="cursor-grab touch-none text-muted-foreground hover:text-foreground" title="Drag to reorder">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-[11px] font-semibold">{row.sort_order}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{row.title}</p>
        <p className="text-[11px] text-muted-foreground">{row.minutes} min</p>
      </div>
      <div className="flex items-center gap-1.5">
        <Badge variant={row.required ? "default" : "secondary"} className="h-5 text-[10px]">{row.required ? "Required" : "Optional"}</Badge>
        <Switch checked={row.required} onCheckedChange={(v) => onToggleRequired(row.id, v)} />
      </div>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          value={row.due_after_days ?? ""}
          onChange={(e) => onDueChange(row.id, e.target.value === "" ? null : Number(e.target.value))}
          className="h-7 w-16 text-xs"
          placeholder="—"
        />
        <span className="text-[11px] text-muted-foreground">days</span>
      </div>
      <Button variant="ghost" size="sm" onClick={() => onRemove(row.id)} className="text-destructive">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function TrackCoursesSortable({
  rows,
  onReorder,
  onToggleRequired,
  onDueChange,
  onRemove,
}: {
  rows: TCRow[];
  onReorder: (orderedIds: string[]) => void;
  onToggleRequired: (id: string, v: boolean) => void;
  onDueChange: (id: string, v: number | null) => void;
  onRemove: (id: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = rows.findIndex((r) => r.id === active.id);
    const newIdx = rows.findIndex((r) => r.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(rows, oldIdx, newIdx);
    onReorder(next.map((r) => r.id));
  };
  if (rows.length === 0) {
    return <p className="rounded-lg border border-dashed border-border/50 py-6 text-center text-xs text-muted-foreground">No courses yet. Add one below.</p>;
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {rows.map((r) => (
            <Row key={r.id} row={r} onToggleRequired={onToggleRequired} onDueChange={onDueChange} onRemove={onRemove} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
