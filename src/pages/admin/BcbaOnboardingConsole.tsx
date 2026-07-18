import { useEffect, useMemo, useState } from "react";
import { Users, Search, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BcbaOnboardingPage from "@/pages/bcba/onboarding/BcbaOnboardingPage";

/**
 * Admin console for New BCBA Onboarding.
 *
 * Role views (BCBA · Credentialing · HR · Clinical Leadership · Training ·
 * Systems · State Leadership · Super Admin) are surfaced as owner filters that
 * highlight the pending items owned by each team. Selecting a BCBA opens the
 * same journey view the employee sees — plus internal instructions and audit.
 */

type BcbaRow = { user_id: string; name: string; email: string | null; pending: number; gates_open: number };

const OWNER_TABS = [
  { key: "all",                 label: "All" },
  { key: "bcba",                label: "BCBA" },
  { key: "credentialing",       label: "Credentialing" },
  { key: "hr",                  label: "HR" },
  { key: "clinical_leadership", label: "Clinical Leadership" },
  { key: "training",            label: "Training" },
  { key: "systems",             label: "Systems" },
  { key: "state_leadership",    label: "State Leadership" },
  { key: "super_admin",         label: "Super Admin" },
] as const;

export default function BcbaOnboardingConsole() {
  const [tab, setTab] = useState<(typeof OWNER_TABS)[number]["key"]>("all");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<BcbaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);

      // Pull all instance rows joined to template + minimal profile info.
      const { data } = await supabase
        .from("bcba_onboarding_items")
        .select("bcba_user_id, status, template:bcba_onboarding_template_items(owner_role, is_completion_gate)");

      const grouped = new Map<string, BcbaRow>();
      for (const r of (data ?? []) as any[]) {
        const uid = r.bcba_user_id as string;
        if (!grouped.has(uid)) {
          grouped.set(uid, { user_id: uid, name: uid.slice(0, 8), email: null, pending: 0, gates_open: 0 });
        }
        const row = grouped.get(uid)!;
        const isDone = r.status === "completed" || r.status === "approved";
        if (!isDone) {
          if (tab === "all" || r.template?.owner_role === tab) row.pending += 1;
          if (r.template?.is_completion_gate) row.gates_open += 1;
        }
      }

      // Enrich names from profiles when possible.
      const ids = Array.from(grouped.keys());
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", ids);
        for (const p of (profs ?? []) as any[]) {
          const row = grouped.get(p.id);
          if (row) {
            row.name = p.full_name || p.email || row.name;
            row.email = p.email;
          }
        }
      }

      setRows(Array.from(grouped.values()).sort((a, b) => b.pending - a.pending));
      setLoading(false);
    })();
  }, [tab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.name.toLowerCase().includes(q) || (r.email ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  if (selected) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 md:px-6 py-6 md:py-10">
        <Button variant="ghost" className="mb-4 rounded-xl" onClick={() => setSelected(null)}>
          ← Back to BCBAs
        </Button>
        <BcbaOnboardingPage bcbaUserId={selected} canEdit={true} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-6 md:py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">BCBA Onboarding</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One coherent journey per BCBA — filter by owning team to work your queue.
        </p>
      </header>

      <div className="mb-5 flex items-center gap-2 flex-wrap">
        {OWNER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`h-9 rounded-full px-3.5 text-sm transition
              ${tab === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4 relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search BCBAs by name or email"
          className="pl-9 h-10 rounded-xl"
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border/70 bg-card p-8 text-center text-muted-foreground">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-card p-8 text-center">
          <Users className="mx-auto h-6 w-6 text-muted-foreground" strokeWidth={1.75} />
          <p className="mt-2 text-sm text-muted-foreground">No BCBAs match this queue.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <button
              key={r.user_id}
              onClick={() => setSelected(r.user_id)}
              className="w-full text-left rounded-2xl border border-border/70 bg-card p-4 hover:-translate-y-0.5 transition-transform flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{r.name}</p>
                {r.email && <p className="text-xs text-muted-foreground truncate">{r.email}</p>}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                <span>{r.pending} pending</span>
                {r.gates_open > 0 && (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {r.gates_open} gate{r.gates_open > 1 ? "s" : ""}
                  </span>
                )}
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}