import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { EvalStaff } from "./types";

interface Row {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  state?: string;
  supervisor_email?: string;
  hire_date?: string;
  active_status?: string;
  _errors: string[];
  _duplicate: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map((line) => {
    const cells: string[] = [];
    let cur = ""; let inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === "," && !inQ) { cells.push(cur); cur = ""; }
      else cur += ch;
    }
    cells.push(cur);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = (cells[i] ?? "").trim()));
    return obj;
  });
}

export default function ImportStaffDialog({
  open, onOpenChange, existing, onImported,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existing: EvalStaff[];
  onImported: () => void;
}) {
  const [csv, setCsv] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [importing, setImporting] = useState(false);

  function preview() {
    const parsed = parseCsv(csv);
    const existingEmails = new Set(existing.map((s) => s.email.toLowerCase()));
    const out: Row[] = parsed.map((p) => {
      const errs: string[] = [];
      const role = (p.role ?? "").toUpperCase();
      if (!p.first_name) errs.push("missing first name");
      if (!p.last_name) errs.push("missing last name");
      if (!p.email || !EMAIL_RE.test(p.email)) errs.push("invalid email");
      if (role !== "BCBA" && role !== "RBT") errs.push("role must be BCBA or RBT");
      return {
        first_name: p.first_name ?? "", last_name: p.last_name ?? "", email: (p.email ?? "").toLowerCase(),
        phone: p.phone, role, state: p.state, supervisor_email: p.supervisor_email,
        hire_date: p.hire_date, active_status: p.active_status,
        _errors: errs, _duplicate: existingEmails.has((p.email ?? "").toLowerCase()),
      };
    });
    setRows(out);
  }

  async function confirmImport() {
    const ok = rows.filter((r) => r._errors.length === 0 && !r._duplicate);
    if (!ok.length) return toast({ title: "Nothing to import" });
    setImporting(true);
    const supervisorByEmail = new Map(existing.map((s) => [s.email.toLowerCase(), s]));
    const payload = ok.map((r) => {
      const supervisor = r.supervisor_email ? supervisorByEmail.get(r.supervisor_email.toLowerCase()) : null;
      return {
        first_name: r.first_name, last_name: r.last_name, email: r.email,
        phone: r.phone || null, role: r.role, state: r.state || null,
        supervisor_id: supervisor?.id ?? null,
        supervisor_name: supervisor ? `${supervisor.first_name} ${supervisor.last_name}` : null,
        hire_date: r.hire_date || null,
        active_status: r.active_status ? !/^(false|no|0|inactive)$/i.test(r.active_status) : true,
      };
    });
    const { error } = await supabase.from("evaluation_staff").insert(payload);
    setImporting(false);
    if (error) return toast({ title: "Import failed", description: error.message, variant: "destructive" });
    toast({ title: `Imported ${payload.length} staff` });
    setCsv(""); setRows([]); onImported(); onOpenChange(false);
  }

  const validCount = rows.filter((r) => r._errors.length === 0 && !r._duplicate).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import BCBA / RBT Staff</DialogTitle>
          <DialogDescription className="text-xs">
            CSV columns: <code>first_name, last_name, email, phone, role, state, supervisor_email, hire_date, active_status</code>
          </DialogDescription>
        </DialogHeader>
        <Textarea rows={8} placeholder="Paste CSV here…" value={csv} onChange={(e) => setCsv(e.target.value)} className="font-mono text-xs" />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={preview} disabled={!csv.trim()}>Preview</Button>
          {rows.length > 0 && <Button size="sm" onClick={confirmImport} disabled={importing || validCount === 0}>Import {validCount} Valid Rows</Button>}
        </div>
        {rows.length > 0 && (
          <div className="border rounded-xl overflow-hidden mt-2">
            <table className="w-full text-xs">
              <thead className="bg-muted text-muted-foreground"><tr><th className="text-left p-2">Email</th><th className="text-left p-2">Name</th><th className="text-left p-2">Role</th><th className="text-left p-2">State</th><th className="text-left p-2">Status</th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 truncate max-w-[160px]">{r.email}</td>
                    <td className="p-2">{r.first_name} {r.last_name}</td>
                    <td className="p-2">{r.role}</td>
                    <td className="p-2">{r.state}</td>
                    <td className="p-2">
                      {r._errors.length > 0 ? <span className="text-destructive">{r._errors.join(", ")}</span> : r._duplicate ? <span className="text-amber-600">duplicate</span> : <span className="text-emerald-600">ready</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}