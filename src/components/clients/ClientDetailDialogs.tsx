import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const toYMD = (d: Date) => format(d, "yyyy-MM-dd");

/* ──────────────────────────────────────────────────────────────────────────
 * Date-only picker (used by Set Start Date, Schedule Assessment)
 * ─────────────────────────────────────────────────────────────────────── */
interface DatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  label: string;
  defaultDate?: string; // YYYY-MM-DD
  confirmLabel?: string;
  onConfirm: (date: string) => void;
}

export function DatePickerDialog({
  open, onOpenChange, title, description, label, defaultDate, confirmLabel = "Save", onConfirm,
}: DatePickerDialogProps) {
  const [date, setDate] = useState<Date | undefined>(defaultDate ? new Date(defaultDate) : new Date());

  useEffect(() => {
    if (open) setDate(defaultDate ? new Date(defaultDate) : new Date());
  }, [open, defaultDate]);

  const submit = () => {
    if (!date) return;
    onConfirm(toYMD(date));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-2">
          <Label>{label}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!date}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Add Task dialog
 * ─────────────────────────────────────────────────────────────────────── */
interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (title: string, dueDate?: string) => void;
}

export function AddTaskDialog({ open, onOpenChange, onConfirm }: AddTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>();

  useEffect(() => {
    if (open) { setTitle(""); setDate(undefined); }
  }, [open]);

  const submit = () => {
    if (!title.trim()) return;
    onConfirm(title.trim(), date ? toYMD(date) : undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Add task</DialogTitle>
          <DialogDescription>Create a task tied to this client.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="e.g. Confirm assessment date with parent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter" && title.trim()) submit(); }}
            />
          </div>
          <div className="space-y-2">
            <Label>Due date <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>No due date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {date && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDate(undefined)}>
                Clear date
              </Button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!title.trim()}>Add task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Schedule Block dialog (day + start/end time)
 * ─────────────────────────────────────────────────────────────────────── */
type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

interface ScheduleBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: Day | null;
  defaultRbt?: string;
  onConfirm: (start: string, end: string) => void;
}

const TIME_OPTIONS = (() => {
  const out: string[] = [];
  for (let h = 6; h <= 20; h++) {
    for (const m of [0, 30]) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

export function ScheduleBlockDialog({ open, onOpenChange, day, defaultRbt, onConfirm }: ScheduleBlockDialogProps) {
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("12:00");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setStart("09:00"); setEnd("12:00"); setError(null); }
  }, [open]);

  const submit = () => {
    if (start >= end) { setError("End time must be after start time."); return; }
    onConfirm(start, end);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Add {day} schedule block</DialogTitle>
          <DialogDescription>
            Define the session window for {day}{defaultRbt ? ` · ${defaultRbt}` : ""}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start time</Label>
            <Select value={start} onValueChange={(v) => { setStart(v); setError(null); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-[260px]">
                {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>End time</Label>
            <Select value={end} onValueChange={(v) => { setEnd(v); setError(null); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-[260px]">
                {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Add block</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Upload Document dialog
 * ─────────────────────────────────────────────────────────────────────── */
interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string, type: string) => void;
}

const DOC_TYPES = ["PDF", "DOCX", "IMG", "XLSX", "Other"];

export function UploadDocumentDialog({ open, onOpenChange, onConfirm }: UploadDocumentDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("PDF");

  useEffect(() => {
    if (open) { setName(""); setType("PDF"); }
  }, [open]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setName(file.name);
    const ext = file.name.split(".").pop()?.toUpperCase();
    if (ext && DOC_TYPES.includes(ext)) setType(ext);
    else if (ext === "JPG" || ext === "JPEG" || ext === "PNG") setType("IMG");
  };

  const submit = () => {
    if (!name.trim()) return;
    onConfirm(name.trim(), type);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
          <DialogDescription>Attach a file or record a document name manually.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-file">File <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="doc-file"
              type="file"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-name">Document name</Label>
            <Input
              id="doc-name"
              placeholder="e.g. Consent Form – Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim()}>Upload</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
