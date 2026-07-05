import React, { useMemo, useState } from "react";
import { Loader2, AlertCircle, Inbox } from "lucide-react";
import { OSShell } from "../OSShell";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

/* ------------ Page shell ------------ */

export function CMPage({
  eyebrow, title, description, actions, loading, error, empty, children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  empty?: { icon?: any; title: string; hint?: string } | null;
  children: React.ReactNode;
}) {
  return (
    <OSShell>
      <header className="os-rise relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-[hsl(330_100%_98%)] via-white to-[hsl(265_100%_98%)] p-6 md:p-8 shadow-[0_18px_50px_-30px_hsl(330_40%_50%/0.25)]">
        <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-[hsl(330_100%_92%)]/60 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(330_70%_55%)]">{eyebrow}</p>
            <h1 className="mt-1.5 text-[24px] md:text-[30px] font-semibold tracking-tight">{title}</h1>
            {description && <p className="mt-1 text-[13px] text-muted-foreground max-w-2xl">{description}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        </div>
        {error && (
          <p className="relative mt-4 rounded-xl border border-[hsl(10_85%_88%)] bg-[hsl(10_85%_98%)] px-3 py-2 text-[12px] text-[hsl(10_75%_40%)] inline-flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </p>
        )}
      </header>
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/60 bg-white/60 p-10 text-[13px] text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : empty ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/60 bg-white/60 p-10 text-center">
            {(empty.icon ?? Inbox) && React.createElement(empty.icon ?? Inbox, { className: "mb-2 h-5 w-5 text-muted-foreground" })}
            <p className="text-[13px] font-medium">{empty.title}</p>
            {empty.hint && <p className="mt-1 text-[11.5px] text-muted-foreground max-w-md">{empty.hint}</p>}
          </div>
        ) : (
          children
        )}
      </div>
    </OSShell>
  );
}

/* ------------ Pill ------------ */

export function Pill({ children, tone = "calm" }: { children: React.ReactNode; tone?: "calm"|"warm"|"cool"|"amber"|"alert"|"violet" }) {
  const map: Record<string,string> = {
    warm:  "bg-[hsl(330_100%_96%)] text-[hsl(330_60%_45%)] border-[hsl(330_85%_90%)]",
    cool:  "bg-[hsl(210_100%_96%)] text-[hsl(210_70%_42%)] border-[hsl(210_85%_88%)]",
    calm:  "bg-[hsl(160_50%_94%)] text-[hsl(165_55%_32%)] border-[hsl(160_50%_85%)]",
    amber: "bg-[hsl(38_100%_94%)] text-[hsl(28_85%_40%)] border-[hsl(38_85%_85%)]",
    alert: "bg-[hsl(10_85%_96%)] text-[hsl(10_75%_45%)] border-[hsl(10_85%_88%)]",
    violet:"bg-[hsl(265_100%_97%)] text-[hsl(265_60%_50%)] border-[hsl(265_85%_90%)]",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${map[tone]}`}>{children}</span>;
}

export function priorityTone(p?: string | null) {
  if (!p) return "calm" as const;
  const lower = p.toLowerCase();
  if (lower === "urgent" || lower === "critical") return "alert" as const;
  if (lower === "high") return "amber" as const;
  if (lower === "low") return "calm" as const;
  return "cool" as const;
}

export function statusTone(s?: string | null) {
  const lower = (s ?? "").toLowerCase();
  if (["resolved","closed","completed","done"].includes(lower)) return "calm" as const;
  if (["overdue","urgent"].includes(lower)) return "alert" as const;
  if (["waiting","in_progress","in progress"].includes(lower)) return "amber" as const;
  return "cool" as const;
}

/* ------------ Generic form dialog ------------ */

export type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select" | "date" | "datetime" | "checkbox";
  /**
   * Select options. Either a plain string list (legacy behavior — value === label)
   * or a `{ value, label }` list where `value` is the durable identifier that
   * gets submitted. Case Manager family selects use the object form so we
   * submit a stable client_id / assignment_id, not a display name.
   */
  options?: Array<string | { value: string; label: string }>;
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;
};

export function FormDialog({
  open, onOpenChange, title, description, fields, initial, submitLabel = "Save",
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  fields: FieldDef[];
  initial?: Record<string, any>;
  submitLabel?: string;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
}) {
  const initialValues = useMemo(() => {
    const v: Record<string, any> = {};
    fields.forEach((f) => { v[f.key] = initial?.[f.key] ?? f.defaultValue ?? (f.type === "checkbox" ? false : ""); });
    return v;
  }, [fields, initial]);
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [busy, setBusy] = useState(false);

  React.useEffect(() => { if (open) setValues(initialValues); }, [open, initialValues]);

  const submit = async () => {
    for (const f of fields) {
      if (f.required && !values[f.key]) { toast.error(`${f.label} is required`); return; }
    }
    setBusy(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-3 py-2 max-h-[60vh] overflow-y-auto">
          {fields.map((f) => (
            <div key={f.key} className="grid gap-1.5">
              <Label htmlFor={f.key} className="text-[12px]">{f.label}{f.required ? " *" : ""}</Label>
              {f.type === "textarea" ? (
                <Textarea id={f.key} value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} placeholder={f.placeholder} />
              ) : f.type === "select" ? (
                <Select value={values[f.key] ?? ""} onValueChange={(v) => setValues({ ...values, [f.key]: v })}>
                  <SelectTrigger><SelectValue placeholder={f.placeholder ?? "Select…"} /></SelectTrigger>
                  <SelectContent>
                    {(f.options ?? []).map((o) => {
                      const opt = typeof o === "string" ? { value: o, label: o } : o;
                      return <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              ) : f.type === "checkbox" ? (
                <div className="flex items-center gap-2">
                  <Checkbox id={f.key} checked={!!values[f.key]} onCheckedChange={(c) => setValues({ ...values, [f.key]: !!c })} />
                  <Label htmlFor={f.key} className="text-[12px] text-muted-foreground">{f.placeholder ?? "Yes"}</Label>
                </div>
              ) : f.type === "date" ? (
                <Input id={f.key} type="date" value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
              ) : f.type === "datetime" ? (
                <Input id={f.key} type="datetime-local" value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
              ) : (
                <Input id={f.key} value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} placeholder={f.placeholder} />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving…</> : submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------ Filter bar ------------ */

export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 flex flex-wrap items-center gap-2">{children}</div>;
}

/* ------------ Family option list helper ------------
 *
 * Every Case Manager form that picks a family must use a durable identifier
 * as the select value (client_id when present, otherwise assignment.id) so
 * duplicate family names never route work to the wrong client.
 */

export type CMAssignmentLike = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  state: string | null;
  centralreach_client_id?: string | null;
};

export type CMFamilyOption = {
  value: string;              // client_id if present, else assignment id
  label: string;              // "Smith Family - NC - CR 12345"
  client_id: string | null;
  client_name: string | null;
  state: string | null;
  assignment_id: string;
  centralreach_client_id: string | null;
};

export function familySelectOptions(assignments: CMAssignmentLike[]): CMFamilyOption[] {
  return assignments
    .filter((a) => a.client_name)
    .map((a) => {
      const value = a.client_id ?? a.id;
      const parts = [a.client_name as string];
      if (a.state) parts.push(a.state);
      if (a.centralreach_client_id) parts.push(`CR ${a.centralreach_client_id}`);
      return {
        value,
        label: parts.join(" - "),
        client_id: a.client_id,
        client_name: a.client_name,
        state: a.state,
        assignment_id: a.id,
        centralreach_client_id: a.centralreach_client_id ?? null,
      };
    });
}

export function familyOptionByValue(
  assignments: CMAssignmentLike[],
  value: string | null | undefined,
): CMFamilyOption | null {
  if (!value) return null;
  return familySelectOptions(assignments).find((o) => o.value === value) ?? null;
}

/**
 * Spread this onto the payload of any Case Manager write that carries client
 * identity so we always store the durable client_id (when known) alongside a
 * display-friendly client_name and state. Never sends the raw option value as
 * client_name.
 */
export function familyContext(opt: CMFamilyOption | null | undefined) {
  return {
    client_id: opt?.client_id ?? null,
    client_name: opt?.client_name ?? null,
    state: opt?.state ?? null,
  };
}

/* ------------ Data table ------------ */

export function DataCard({ title, count, children }: { title?: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-[0_8px_24px_-18px_hsl(265_50%_40%/0.16)] backdrop-blur-md">
      {title && (
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
          <p className="text-[13px] font-semibold tracking-tight">{title}</p>
          {typeof count === "number" && <span className="text-[11px] text-muted-foreground">{count}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

export function RowActions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1.5">{children}</div>;
}