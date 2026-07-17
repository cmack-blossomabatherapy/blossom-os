import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const DAYS = [
  { key: "mon", label: "Mon" }, { key: "tue", label: "Tue" }, { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" }, { key: "fri", label: "Fri" }, { key: "sat", label: "Sat" }, { key: "sun", label: "Sun" },
];
const SETTINGS = ["clinic", "home", "school"];

export function AvailabilityEditor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState<string[]>([]);
  const [prefs, setPrefs] = useState<string[]>([]);
  const [maxHours, setMaxHours] = useState<string>("");
  const [radius, setRadius] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [tempStart, setTempStart] = useState<string>("");
  const [tempEnd, setTempEnd] = useState<string>("");
  const [tempReason, setTempReason] = useState<string>("");

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase.from("rbt_availability_profile" as any)
        .select("*").eq("employee_id", user.id).maybeSingle();
      const p: any = data ?? {};
      setDays((p.days as string[]) ?? []);
      setPrefs((p.preferred_settings as string[]) ?? []);
      setMaxHours(p.max_weekly_hours != null ? String(p.max_weekly_hours) : "");
      setRadius(p.travel_radius_miles != null ? String(p.travel_radius_miles) : "");
      setNotes(p.notes ?? "");
      setLoading(false);
    })();
  }, [open, user]);

  function toggle(list: string[], val: string, setter: (v: string[]) => void) {
    setter(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("rbt_availability_profile" as any).upsert({
      employee_id: user.id,
      days,
      preferred_settings: prefs,
      clinic_available: prefs.includes("clinic"),
      home_available: prefs.includes("home"),
      school_available: prefs.includes("school"),
      max_weekly_hours: maxHours ? parseInt(maxHours, 10) : null,
      travel_radius_miles: radius ? parseInt(radius, 10) : null,
      notes: notes.trim() || null,
      updated_by: user.id,
    }, { onConflict: "employee_id" });
    if (tempStart && tempEnd) {
      await supabase.from("rbt_availability_overrides" as any).insert({
        employee_id: user.id, starts_on: tempStart, ends_on: tempEnd, reason: tempReason || null, created_by: user.id,
      });
      setTempStart(""); setTempEnd(""); setTempReason("");
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Availability saved. Our scheduling team will use this.");
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Your availability</SheetTitle></SheetHeader>
        {loading ? (
          <div className="mt-6 h-32 rounded-2xl bg-muted animate-pulse" />
        ) : (
          <div className="mt-4 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Days available</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => toggle(days, d.key, setDays)}
                    className={`h-9 px-3 rounded-full text-xs font-medium border transition ` +
                      (days.includes(d.key)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border/70 text-muted-foreground")}
                  >{d.label}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Preferred settings</p>
              <div className="flex flex-wrap gap-2">
                {SETTINGS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggle(prefs, s, setPrefs)}
                    className={`h-9 px-3 rounded-full text-xs font-medium border capitalize transition ` +
                      (prefs.includes(s)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border/70 text-muted-foreground")}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Max weekly hours</p>
                <Input inputMode="numeric" value={maxHours} onChange={(e) => setMaxHours(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 30" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Travel radius (mi)</p>
                <Input inputMode="numeric" value={radius} onChange={(e) => setRadius(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 20" />
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Notes for scheduling</p>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything scheduling should know." />
            </div>

            <div className="rounded-2xl border border-border/70 p-4">
              <p className="text-sm font-medium">Temporary change</p>
              <p className="mt-0.5 text-xs text-muted-foreground">e.g. vacation, exam week</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Input type="date" value={tempStart} onChange={(e) => setTempStart(e.target.value)} />
                <Input type="date" value={tempEnd} onChange={(e) => setTempEnd(e.target.value)} />
              </div>
              <Input className="mt-2" placeholder="Reason (optional)" value={tempReason} onChange={(e) => setTempReason(e.target.value)} />
            </div>

            <Button className="w-full" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save availability"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}