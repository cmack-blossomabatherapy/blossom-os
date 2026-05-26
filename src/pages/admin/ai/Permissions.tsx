import { AiAdminShell } from "@/components/admin/ai/AiAdminShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAiScope } from "@/lib/ai/aiPermissions";
import type { OSRole } from "@/lib/os/permissions";
import { CheckCircle2, XCircle } from "lucide-react";

const ROLES: OSRole[] = ["super_admin","executive_leadership","operations_leadership","state_director","intake_coordinator","authorization_coordinator","scheduling_team","recruiting_team","hr_team","billing_finance","qa_team","payroll_coordinator","bcba","rbt","marketing_team"];
const CATS = ["sop","training","insurance","state","workflow","policy","terminology","role","faq","directory"] as const;

export default function AiPermissions() {
  return (
    <AiAdminShell>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">What every role can ask Blossom AI about. Scope, masked fields, and accessible record types.</p>
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left p-3 font-medium sticky left-0 bg-muted/40">Role</th>
                  <th className="text-left p-3 font-medium">Scope</th>
                  {CATS.map((c) => <th key={c} className="text-center p-2 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">{c}</th>)}
                  <th className="text-left p-3 font-medium">Masked fields</th>
                </tr>
              </thead>
              <tbody>
                {ROLES.map((r) => {
                  const s = getAiScope(r);
                  return (
                    <tr key={r} className="border-t">
                      <td className="p-3 font-medium sticky left-0 bg-background">{r}</td>
                      <td className="p-3"><Badge variant="outline" className="text-[10px]">{s.dataScope}</Badge></td>
                      {CATS.map((c) => (
                        <td key={c} className="text-center p-2">
                          {s.categories.includes(c)
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" />
                            : <XCircle className="h-4 w-4 text-muted-foreground/40 inline" />}
                        </td>
                      ))}
                      <td className="p-3 text-xs text-muted-foreground">{s.maskedFields.length === 0 ? "—" : `${s.maskedFields.length} fields`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="text-xs text-muted-foreground">Permissions are defined in code and enforced by RLS on the knowledge base. Per-role overrides land in a future update.</p>
      </div>
    </AiAdminShell>
  );
}