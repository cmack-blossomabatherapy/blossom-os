import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, History, Brain, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Hit = { id: string; group: string; title: string; subtitle?: string; href: string; icon: any };

export function UniversalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (!open) { setQ(""); setHits([]); return; }
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (!term) { setHits([]); return; }
    const handle = setTimeout(async () => {
      setLoading(true);
      const like = `%${term}%`;
      const [docs, audit, mem, approved] = await Promise.all([
        supabase.from("knowledge_documents").select("id,title,category").or(`title.ilike.${like},description.ilike.${like}`).limit(6),
        supabase.from("ai_audit_log" as any).select("id,prompt,role,created_at").ilike("prompt", like).limit(5),
        supabase.from("ai_memory_entries" as any).select("id,title,scope,scope_value").or(`title.ilike.${like},content.ilike.${like}`).limit(5),
        supabase.from("ai_approved_answers" as any).select("id,question").ilike("question", like).limit(5),
      ]);
      const out: Hit[] = [];
      (docs.data ?? []).forEach((d: any) => out.push({ id: `d-${d.id}`, group: "Knowledge", title: d.title, subtitle: d.category, href: "/admin/ai/knowledge", icon: BookOpen }));
      (approved.data ?? []).forEach((a: any) => out.push({ id: `a-${a.id}`, group: "Approved answers", title: a.question, href: "/admin/ai/training", icon: Sparkles }));
      (mem.data ?? []).forEach((m: any) => out.push({ id: `m-${m.id}`, group: "Memory", title: m.title, subtitle: `${m.scope}${m.scope_value ? `: ${m.scope_value}` : ""}`, href: "/admin/ai/memory", icon: Brain }));
      (audit.data ?? []).forEach((r: any) => out.push({ id: `r-${r.id}`, group: "Audit log", title: r.prompt.slice(0, 80), subtitle: r.role ?? undefined, href: "/admin/ai/audit", icon: History }));
      setHits(out);
      setLoading(false);
    }, 220);
    return () => clearTimeout(handle);
  }, [q]);

  const grouped = hits.reduce<Record<string, Hit[]>>((acc, h) => { (acc[h.group] ??= []).push(h); return acc; }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search knowledge, memory, audit log, approved answers…"
            className="border-0 shadow-none focus-visible:ring-0 px-0 h-9"
          />
          {loading && <Badge variant="outline" className="text-[10px]">Searching…</Badge>}
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!q.trim() ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Type to search across the AI control center.</p>
          ) : hits.length === 0 && !loading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No matches.</p>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-3">
                <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">{group}</p>
                <div className="space-y-1">
                  {items.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => { onOpenChange(false); nav(h.href); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition text-left"
                    >
                      <h.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm truncate">{h.title}</div>
                        {h.subtitle && <div className="text-xs text-muted-foreground truncate">{h.subtitle}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}