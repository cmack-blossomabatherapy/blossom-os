import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

type Settings = {
  id?: string;
  greeting: string;
  tone: string;
  suggested_prompts: string[];
};

const DEFAULTS: Settings = {
  greeting: "Hi! I'm Blossom AI. What can I help with?",
  tone: "warm",
  suggested_prompts: ["Show today's staffing gaps", "Summarize this week's intake", "Which auths expire soon?"],
};

export default function Appearance() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPrompt, setNewPrompt] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("ai_appearance_settings" as any).select("*").limit(1).maybeSingle();
      if (data) setS({ ...DEFAULTS, ...(data as any) });
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    const payload = {
      greeting: s.greeting,
      tone: s.tone,
      suggested_prompts: s.suggested_prompts,
    };
    const { error } = s.id
      ? await supabase.from("ai_appearance_settings" as any).update(payload).eq("id", s.id)
      : await supabase.from("ai_appearance_settings" as any).insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  }

  if (loading) return <div className="text-muted-foreground text-sm flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">AI Appearance</h2>
        <p className="text-sm text-muted-foreground">How Insights presents itself to employees.</p>
      </div>

      <Card className="p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Greeting</label>
          <Textarea value={s.greeting} onChange={(e) => setS({ ...s, greeting: e.target.value })} rows={2} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Tone</label>
          <Select value={s.tone} onValueChange={(v) => setS({ ...s, tone: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="warm">Warm & supportive</SelectItem>
              <SelectItem value="professional">Professional & precise</SelectItem>
              <SelectItem value="concise">Concise & direct</SelectItem>
              <SelectItem value="coaching">Coaching & explanatory</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Suggested prompts</label>
          <div className="space-y-2 mt-2">
            {s.suggested_prompts.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={p} onChange={(e) => {
                  const next = [...s.suggested_prompts]; next[i] = e.target.value; setS({ ...s, suggested_prompts: next });
                }} />
                <Button variant="ghost" size="icon" onClick={() => setS({ ...s, suggested_prompts: s.suggested_prompts.filter((_, j) => j !== i) })}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Input value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} placeholder="Add a suggested prompt…" />
              <Button variant="outline" size="icon" onClick={() => {
                if (!newPrompt.trim()) return;
                setS({ ...s, suggested_prompts: [...s.suggested_prompts, newPrompt.trim()] });
                setNewPrompt("");
              }}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Save</Button>
        </div>
      </Card>

      <Card className="p-5 bg-muted/40">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Preview</span>
        </div>
        <p className="text-sm">{s.greeting}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {s.suggested_prompts.map((p, i) => (
            <span key={i} className="text-xs px-2 py-1 rounded-full bg-background border">{p}</span>
          ))}
        </div>
      </Card>
    </div>
  );
}