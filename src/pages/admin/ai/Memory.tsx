import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Brain, Pin, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type Memory = {
  id: string;
  scope: "global" | "role" | "department";
  scope_value: string | null;
  content: string;
  pinned: boolean;
  created_at: string;
};

export default function Memory() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"global" | "role" | "department">("global");
  const [scopeValue, setScopeValue] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("ai_memory_entries" as any)
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    setRows((data ?? []) as unknown as Memory[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function save() {
    if (!content.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("ai_memory_entries" as any).insert({
      scope,
      scope_value: scope === "global" ? null : scopeValue || null,
      content: content.trim(),
      pinned,
      created_by: user?.id,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Memory saved");
    setContent(""); setScopeValue(""); setPinned(false); setOpen(false);
    void load();
  }

  async function togglePin(r: Memory) {
    await supabase.from("ai_memory_entries" as any).update({ pinned: !r.pinned }).eq("id", r.id);
    void load();
  }
  async function remove(id: string) {
    await supabase.from("ai_memory_entries" as any).delete().eq("id", id);
    void load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">AI Memory</h2>
          <p className="text-sm text-muted-foreground">Persistent context injected into every Insights prompt.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New memory</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New memory entry</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Scope</label>
                  <Select value={scope} onValueChange={(v: any) => setScope(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="role">Role</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {scope !== "global" && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{scope === "role" ? "Role" : "Department"}</label>
                    <Input value={scopeValue} onChange={(e) => setScopeValue(e.target.value)} placeholder={scope === "role" ? "bcba" : "scheduling"} />
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Content</label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="e.g. Blossom operates in GA, NC, TN, VA, MD." />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={pinned} onCheckedChange={setPinned} />
                <span className="text-sm">Pin to top of context</span>
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
          <Brain className="h-8 w-8 mx-auto mb-2 opacity-60" />
          No memories yet. Add foundational context the AI should always know.
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] capitalize">{r.scope}{r.scope_value ? `: ${r.scope_value}` : ""}</Badge>
                    {r.pinned && <Badge className="text-[10px]"><Pin className="h-3 w-3 mr-1" />Pinned</Badge>}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{r.content}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => togglePin(r)}><Pin className={`h-4 w-4 ${r.pinned ? "fill-current" : ""}`} /></Button>
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