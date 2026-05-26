import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, GraduationCap, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type Approved = {
  id: string;
  question_pattern: string;
  canonical_answer: string;
  citations: string[] | null;
  active: boolean;
  created_at: string;
};

export default function Training() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Approved[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("ai_approved_answers" as any)
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as unknown as Approved[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function save() {
    if (!q.trim() || !a.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("ai_approved_answers" as any).insert({
      question_pattern: q.trim(),
      canonical_answer: a.trim(),
      active: true,
      created_by: user?.id,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Approved answer saved");
    setQ(""); setA(""); setOpen(false); void load();
  }

  async function toggle(r: Approved) {
    await supabase.from("ai_approved_answers" as any).update({ active: !r.active }).eq("id", r.id);
    void load();
  }
  async function remove(id: string) {
    await supabase.from("ai_approved_answers" as any).delete().eq("id", id);
    void load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">AI Training</h2>
          <p className="text-sm text-muted-foreground">Approved canonical answers override LLM improvisation for known questions.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />New approved answer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New approved answer</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Question pattern</label>
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. how do I submit a session note" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Canonical answer</label>
                <Textarea value={a} onChange={(e) => setA(e.target.value)} rows={6} placeholder="The exact answer Ask Blossom should give." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-60" />
          No approved answers yet. Add canonical answers for your most-asked questions.
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{r.question_pattern}</p>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{r.canonical_answer}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={r.active ? "secondary" : "outline"} className="text-[10px]">{r.active ? "Active" : "Inactive"}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={r.active} onCheckedChange={() => toggle(r)} />
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}