import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface Row {
  id: string; field_key: string; label: string; section: string | null;
  is_required_documentation: boolean; is_operational_only: boolean;
}

/**
 * Admin-only console: defines which supervision fields count as
 * required documentation vs operational-only tracking.
 */
export default function BcbaSupervisionConfigPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["bcba-supervision-config-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bcba_supervision_config")
        .select("id,field_key,label,section,is_required_documentation,is_operational_only")
        .order("section").order("label");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Row> }) => {
      const { error } = await supabase.from("bcba_supervision_config").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bcba-supervision-config-admin"] }),
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">Supervision Configuration</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Choose which fields BCBAs must complete to close a supervision record. Operational-only fields are helpful for follow-up but don't block save. Blossom OS does not replace BACB or CentralReach records of record.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <div className="rounded-xl border border-border/70 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Field</th>
                <th className="text-left px-3 py-3">Section</th>
                <th className="text-center px-3 py-3">Required documentation</th>
                <th className="text-center px-3 py-3">Operational only</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {(data ?? []).map(r => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium">{r.label}</td>
                  <td className="px-3 py-3 text-muted-foreground">{r.section ?? "—"}</td>
                  <td className="px-3 py-3 text-center">
                    <Checkbox checked={r.is_required_documentation} onCheckedChange={v => toggle.mutate({ id: r.id, patch: { is_required_documentation: !!v, is_operational_only: v ? false : r.is_operational_only } })} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Checkbox checked={r.is_operational_only} onCheckedChange={v => toggle.mutate({ id: r.id, patch: { is_operational_only: !!v, is_required_documentation: v ? false : r.is_required_documentation } })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}