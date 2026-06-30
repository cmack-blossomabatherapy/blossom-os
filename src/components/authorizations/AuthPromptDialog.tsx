import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Reusable prompt-style dialog used to replace `window.prompt` flows in the
 * Authorizations workspace. Caller passes `open`, `onCancel`, `onSubmit`, and
 * presentation props. Supports plain text, textarea, or fixed-option select.
 */
export interface AuthPromptDialogProps {
  open: boolean;
  title: string;
  description?: string;
  label: string;
  initialValue?: string;
  placeholder?: string;
  multiline?: boolean;
  options?: string[]; // when provided, renders a select
  submitLabel?: string;
  pending?: boolean;
  onCancel: () => void;
  onSubmit: (value: string) => void | Promise<void>;
}

export function AuthPromptDialog({
  open,
  title,
  description,
  label,
  initialValue = "",
  placeholder,
  multiline,
  options,
  submitLabel = "Confirm",
  pending,
  onCancel,
  onSubmit,
}: AuthPromptDialogProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="grid gap-1.5 py-2">
          <Label>{label}</Label>
          {options ? (
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger>
                <SelectValue placeholder={placeholder ?? "Choose…"} />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : multiline ? (
            <Textarea
              autoFocus
              rows={4}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
            />
          ) : (
            <Input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const v = value.trim();
              if (!v) return;
              void onSubmit(v);
            }}
            disabled={pending || !value.trim()}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}