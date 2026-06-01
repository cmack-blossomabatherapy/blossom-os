import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, User, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function ProfileEditorCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["profile_editor", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, phone, email, job_title, department, state")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data as any;
    },
  });

  useEffect(() => {
    if (!data) return;
    setDisplayName(data.display_name ?? "");
    setPhone(data.phone ?? "");
  }, [data]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const payload: Record<string, any> = { display_name: displayName.trim() || null, phone: phone.trim() || null };
    const { error } = await supabase.from("profiles").update(payload).eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated.");
    qc.invalidateQueries({ queryKey: ["profile_editor", user.id] });
    qc.invalidateQueries({ queryKey: ["profile_row", user.id] });
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:col-span-2">
      <div className="mb-3 flex items-center gap-2">
        <User className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Personal information</h2>
      </div>
      {isLoading ? (
        <div className="flex h-16 items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="display_name" className="text-xs">Display name</Label>
              <Input id="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value.slice(0, 80))} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs">Phone</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value.slice(0, 32))} placeholder="(555) 555-5555" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input value={data?.email ?? user?.email ?? ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Input value={data?.job_title ?? "—"} disabled />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save changes
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Email is managed by IT. To change it, contact HR.
          </p>
        </div>
      )}
    </section>
  );
}