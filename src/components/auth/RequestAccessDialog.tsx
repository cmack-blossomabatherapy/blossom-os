import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_META } from "@/lib/roles";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const ROLE_GROUPS = ["Leadership", "Operations", "Pipeline", "Service", "People", "Support"] as const;
const SELECTABLE_ROLES = ROLE_META.filter((r) => ROLE_GROUPS.includes(r.group as (typeof ROLE_GROUPS)[number]));

interface RequestAccessDialogProps {
  trigger?: React.ReactNode;
}

export function RequestAccessDialog({ trigger }: RequestAccessDialogProps = {}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "", clinic: "", note: "" });

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.role.trim() || !form.clinic.trim()) {
      toast.error("Please fill out all required fields");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("send-access-request", {
      body: {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role.trim(),
        clinic: form.clinic.trim(),
        note: form.note.trim(),
      },
    });
    setSubmitting(false);
    if (error || (data && (data as any).error)) {
      toast.error("Couldn't send your request. Please email hr@blossomabatherapy.com.");
      return;
    }
    toast.success("Request sent! Our team will be in touch shortly.");
    setForm({ name: "", email: "", role: "", clinic: "", note: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            request access
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Request Blossom Academy access</DialogTitle>
          <DialogDescription>
            Tell us a bit about you and our admin team will set up your account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ra-name" className="text-xs font-medium text-foreground/80">Full name</Label>
              <Input id="ra-name" required value={form.name} onChange={update("name")} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ra-email" className="text-xs font-medium text-foreground/80">Work email</Label>
              <Input id="ra-email" type="email" required value={form.email} onChange={update("email")} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ra-role" className="text-xs font-medium text-foreground/80">Role</Label>
              <Select value={form.role} onValueChange={(value) => setForm((f) => ({ ...f, role: value }))}>
                <SelectTrigger id="ra-role" className="h-11 rounded-xl">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {ROLE_GROUPS.map((group) => {
                    const items = SELECTABLE_ROLES.filter((r) => r.group === group);
                    if (items.length === 0) return null;
                    return (
                      <SelectGroup key={group}>
                        <SelectLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">{group}</SelectLabel>
                        {items.map((r) => (
                          <SelectItem key={r.key} value={r.label}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ra-clinic" className="text-xs font-medium text-foreground/80">Clinic / location</Label>
              <Input id="ra-clinic" required value={form.clinic} onChange={update("clinic")} className="h-11 rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ra-note" className="text-xs font-medium text-foreground/80">Anything else? <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea id="ra-note" rows={3} value={form.note} onChange={update("note")} className="rounded-xl resize-none" />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="rounded-xl font-semibold">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}