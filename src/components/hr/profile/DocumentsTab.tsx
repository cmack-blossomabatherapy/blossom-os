import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import type { DocStatus, Employee } from "@/lib/hr/types";

interface Doc {
  id: string; doc_type: string; name: string; status: DocStatus;
  required: boolean; expires_on: string | null; created_at: string;
}

const STATUS_TONE: Record<DocStatus, string> = {
  missing:   "bg-destructive/10 text-destructive border-destructive/30",
  requested: "bg-warning/10 text-warning border-warning/30",
  uploaded:  "bg-info/10 text-info border-info/30",
  verified:  "bg-success/10 text-success border-success/30",
  expired:   "bg-destructive/10 text-destructive border-destructive/30",
};

export function DocumentsTab({ employee }: { employee: Employee }) {
  const { hasPerm } = useAuth();
  const canManage = hasPerm("hr.documents.manage");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [docType, setDocType] = useState("offer_letter");
  const [required, setRequired] = useState(true);

  useEffect(() => { void load(); }, [employee.id]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("employee_documents_hr")
      .select("id, doc_type, name, status, required, expires_on, created_at")
      .eq("employee_id", employee.id)
      .order("created_at", { ascending: false });
    setDocs((data ?? []) as Doc[]);
    setLoading(false);
  }

  async function add() {
    if (!name) { toast.error("Document name is required."); return; }
    const { error } = await supabase.from("employee_documents_hr").insert({
      employee_id: employee.id, name, doc_type: docType, required, status: "requested",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Document added.");
    setOpen(false); setName(""); setDocType("offer_letter"); setRequired(true);
    void load();
  }

  async function setStatus(id: string, status: DocStatus) {
    const { error } = await supabase.from("employee_documents_hr").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated."); void load(); }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Documents</h3>
        {canManage && <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Add</Button>}
      </div>
      {loading ? <Skeleton className="h-24" /> : docs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No documents on file yet.</p>
      ) : (
        <div className="space-y-1.5">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                <p className="text-[11px] text-muted-foreground">{d.doc_type.replace(/_/g, " ")}{d.required ? " · required" : ""}{d.expires_on ? ` · expires ${d.expires_on}` : ""}</p>
              </div>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_TONE[d.status]}`}>{d.status}</span>
              {canManage && (
                <Select value={d.status} onValueChange={(v) => setStatus(d.id, v as DocStatus)}>
                  <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="missing">Missing</SelectItem>
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="uploaded">Uploaded</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add document</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div>
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="offer_letter">Offer letter</SelectItem>
                  <SelectItem value="tax_form">Tax form</SelectItem>
                  <SelectItem value="direct_deposit">Direct deposit</SelectItem>
                  <SelectItem value="handbook_ack">Handbook acknowledgment</SelectItem>
                  <SelectItem value="license">License</SelectItem>
                  <SelectItem value="background_check">Background check</SelectItem>
                  <SelectItem value="i9">I-9</SelectItem>
                  <SelectItem value="certification">Certification</SelectItem>
                  <SelectItem value="review_form">Review form</SelectItem>
                  <SelectItem value="disciplinary">Disciplinary</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={add}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}