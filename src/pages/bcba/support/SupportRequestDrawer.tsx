import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useSupportRequest, useAddSupportUpdate, useSetSupportStatus } from "./useSupport";
import { SUPPORT_STATUS_LABELS, SUPPORT_STATUS_STYLES, URGENCY_STYLES, categoryFor } from "./config";

function fmt(d?: string | null) { if (!d) return "—"; try { return new Date(d).toLocaleString(); } catch { return "—"; } }

export default function SupportRequestDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const open = !!id;
  const q = useSupportRequest(id);
  const addUpdate = useAddSupportUpdate();
  const setStatus = useSetSupportStatus();
  const [uid, setUid] = useState<string | null>(null);
  const [uname, setUname] = useState<string | null>(null);
  const [body, setBody] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUid(user?.id ?? null);
      setUname(user?.user_metadata?.full_name ?? user?.email ?? null);
    })();
  }, []);

  const r = q.data?.request;
  const cat = r ? categoryFor(r.category) : null;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{r?.subject ?? "Support request"}</SheetTitle>
        </SheetHeader>
        {q.isLoading || !r ? (
          <div className="text-sm text-muted-foreground mt-6">Loading…</div>
        ) : (
          <div className="mt-4 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${SUPPORT_STATUS_STYLES[r.status]}`}>
                {SUPPORT_STATUS_LABELS[r.status]}
              </span>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${URGENCY_STYLES[r.urgency]}`}>
                {r.urgency}
              </span>
              {cat && <span className="text-xs text-muted-foreground">{cat.label}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs text-muted-foreground">Owner</div><div>{r.owner_name ?? r.owner_team ?? "Routing…"}</div></div>
              <div><div className="text-xs text-muted-foreground">Due</div><div>{fmt(r.due_at)}</div></div>
              <div><div className="text-xs text-muted-foreground">SLA</div><div>{r.sla_hours} h</div></div>
              <div><div className="text-xs text-muted-foreground">Created</div><div>{fmt(r.created_at)}</div></div>
              <div><div className="text-xs text-muted-foreground">State / Clinic</div><div>{[r.state, r.clinic].filter(Boolean).join(" · ") || "—"}</div></div>
              <div><div className="text-xs text-muted-foreground">Client ref</div><div>{r.client_ref || "—"}</div></div>
            </div>

            {r.detail && (
              <div className="rounded-lg border p-3 bg-muted/20 text-sm whitespace-pre-wrap">{r.detail}</div>
            )}

            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Updates</div>
              <div className="space-y-2">
                {q.data?.updates.map((u: any) => (
                  <div key={u.id} className="rounded-md border p-2 text-sm">
                    <div className="text-[11px] text-muted-foreground">{u.author_name ?? "System"} · {fmt(u.created_at)} · {u.update_type}</div>
                    <div>{u.body}</div>
                  </div>
                ))}
                {(q.data?.updates ?? []).length === 0 && (
                  <div className="text-xs text-muted-foreground">No updates yet.</div>
                )}
              </div>
              <div className="mt-3 space-y-2">
                <Textarea rows={3} placeholder="Add an update…" value={body} onChange={(e) => setBody(e.target.value)} />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    disabled={!body.trim() || addUpdate.isPending || !uid}
                    onClick={async () => {
                      try {
                        await addUpdate.mutateAsync({ request_id: r.id, author_id: uid!, author_name: uname ?? undefined, body: body.trim() });
                        setBody("");
                      } catch (e: any) { toast.error(e?.message ?? "Could not post."); }
                    }}
                  >Post update</Button>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Status</div>
              <Select
                value={r.status}
                onValueChange={async (v) => {
                  if (!uid) return;
                  try { await setStatus.mutateAsync({ id: r.id, status: v, user_id: uid }); toast.success("Status updated."); }
                  catch (e: any) { toast.error(e?.message ?? "Could not update."); }
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SUPPORT_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              {r.resolution && (
                <div className="mt-2 rounded-md border p-2 text-sm bg-emerald-50/40">
                  <div className="text-[11px] text-emerald-700 uppercase tracking-wide mb-1">Resolution</div>
                  <div>{r.resolution}</div>
                </div>
              )}
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Audit history</div>
              <div className="space-y-1">
                {q.data?.audit.map((a: any) => (
                  <div key={a.id} className="text-[11px] text-muted-foreground">
                    {fmt(a.created_at)} — {a.changed_field}: {a.old_value ? `${a.old_value} → ` : ""}{a.new_value ?? ""}
                  </div>
                ))}
                {(q.data?.audit ?? []).length === 0 && <div className="text-[11px] text-muted-foreground">No changes yet.</div>}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}