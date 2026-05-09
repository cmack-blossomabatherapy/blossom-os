import { useEffect, useMemo, useState } from "react";
import { Lock, Plus, RotateCcw, Shield, Trash2, Unlock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ROLE_META, type AppRole } from "@/lib/roles";
import {
  DEFAULT_ALLOWLIST,
  getAllowlist,
  matches,
  resetAllowlist,
  setAllowlistForRole,
  subscribeAllowlist,
  type RoleAllowlist,
} from "@/lib/onboarding/allowlist";
import { ALWAYS_OPEN_ROUTES } from "@/components/auth/OnboardingGate";
import { useToast } from "@/hooks/use-toast";

const SUGGESTIONS = [
  "/my-learning",
  "/announcements",
  "/resources",
  "/training/*",
  "/catalog",
  "/academy",
];

function baselineLabels(): string[] {
  return ALWAYS_OPEN_ROUTES.map((r) => (typeof r === "string" ? r : r.toString()));
}

export function OnboardingAllowlistPanel() {
  const { toast } = useToast();
  const [allowlist, setAllowlist] = useState<RoleAllowlist>(() => getAllowlist());
  const [role, setRole] = useState<AppRole>("rbt");
  const [draft, setDraft] = useState("");
  const [testPath, setTestPath] = useState("/my-learning");

  useEffect(() => subscribeAllowlist(() => setAllowlist(getAllowlist())), []);

  const patterns = allowlist[role] ?? [];
  const sortedRoles = useMemo(
    () => [...ROLE_META].sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );

  const save = (next: string[]) => {
    setAllowlistForRole(role, next);
    toast({ title: "Allow-list updated", description: `${ROLE_META.find((r) => r.key === role)?.label} can now access ${next.length} extra route${next.length === 1 ? "" : "s"} before onboarding completion.` });
  };

  const addPattern = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    if (!value.startsWith("/")) {
      toast({ title: "Invalid pattern", description: "Patterns must start with '/'.", variant: "destructive" });
      return;
    }
    if (patterns.includes(value)) return;
    save([...patterns, value]);
    setDraft("");
  };

  const remove = (p: string) => save(patterns.filter((x) => x !== p));

  const handleReset = () => {
    resetAllowlist();
    toast({ title: "Reset to defaults", description: "Role allow-list restored to the built-in starter list." });
  };

  // Live test: who can reach `testPath` before onboarding?
  const matchingRoles = useMemo(() => {
    return ROLE_META.filter((r) => (allowlist[r.key] ?? []).some((p) => matches(testPath, p)));
  }, [allowlist, testPath]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Onboarding Allow-list</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose extra routes each role can reach <em>before</em> onboarding is complete. Everything else stays locked behind the onboarding gate.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle className="text-sm">Always open (baseline)</AlertTitle>
        <AlertDescription className="mt-1 text-xs">
          These routes are unlocked for every signed-in user regardless of role:
          <div className="mt-2 flex flex-wrap gap-1.5">
            {baselineLabels().map((p) => (
              <Badge key={p} variant="secondary" className="font-mono text-[10px]">{p}</Badge>
            ))}
          </div>
        </AlertDescription>
      </Alert>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Role</label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {sortedRoles.map((r) => (
                  <SelectItem key={r.key} value={r.key}>
                    <span className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                      {r.label}
                      <span className="text-[10px] text-muted-foreground">({r.key})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Reset all to defaults
          </Button>
        </div>

        <div className="mt-5 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Allowed routes ({patterns.length})</p>
          {patterns.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-center text-xs text-muted-foreground">
              No extra routes for this role yet — only the baseline above is unlocked.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {patterns.map((p) => {
                const isDefault = (DEFAULT_ALLOWLIST[role] ?? []).includes(p);
                return (
                  <li
                    key={p}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card px-3 py-2"
                  >
                    <span className="flex items-center gap-2">
                      <Unlock className="h-3.5 w-3.5 text-primary" />
                      <code className="font-mono text-xs">{p}</code>
                      {isDefault && <Badge variant="secondary" className="text-[10px]">default</Badge>}
                    </span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove(p)} aria-label={`Remove ${p}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPattern(draft); } }}
              placeholder="/my-learning  or  /training/*"
              className="h-9 max-w-[280px] font-mono text-xs"
            />
            <Button size="sm" onClick={() => addPattern(draft)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add route
            </Button>
            <span className="text-[11px] text-muted-foreground">Use trailing <code className="font-mono">/*</code> for prefix match.</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-muted-foreground">Suggestions:</span>
            {SUGGESTIONS.filter((s) => !patterns.includes(s)).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addPattern(s)}
                className="rounded-md border border-dashed border-border/70 px-2 py-0.5 font-mono text-[10px] text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Test a path</label>
            <Input
              value={testPath}
              onChange={(e) => setTestPath(e.target.value)}
              placeholder="/some/path"
              className="h-9 font-mono text-xs"
            />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">
            Roles that can reach <code className="font-mono text-foreground">{testPath || "—"}</code> before onboarding completion:
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {matchingRoles.length === 0 ? (
              <Badge variant="outline" className="gap-1 text-[10px]"><Lock className="h-3 w-3" /> None — gated for everyone</Badge>
            ) : (
              matchingRoles.map((r) => (
                <Badge key={r.key} className="text-[10px]">{r.label}</Badge>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
