/**
 * Blossom Identity System — Identity tab
 *
 * The canonical identity surface on every employee profile:
 *   • Profile Completion meter (photo / bio / skills / contact / emergency)
 *   • Bio + About me editing
 *   • Expertise / Skills / Languages tag editing
 *   • Reports-To and Direct-Reports tiles wired to the live org chart
 *
 * Lives next to EmployeeProfile.tsx and is mounted as the new "Identity" tab.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CheckCircle2, Circle, Sparkles, Save, X, Plus, UserSquare2,
  Users2, ShieldAlert, Mail, Phone, Building2, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEmployeeDirectory, type DirectoryEmployee } from "@/hooks/useEmployeeDirectory";

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-border/70 bg-card", className)}>
      {children}
    </div>
  );
}

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h2 className="text-sm font-semibold tracking-tight text-foreground">{children}</h2>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

type IdentityRow = {
  bio: string | null;
  about_me: string | null;
  expertise: string[] | null;
  skills: string[] | null;
  languages: string[] | null;
  emergency_contact: { name?: string; relationship?: string; phone?: string; email?: string } | null;
  nfc_settings: { enabled?: boolean; public?: boolean; internal?: boolean; business_card?: boolean; emergency?: boolean } | null;
  photo_url: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
};

type Completion = {
  score: number;
  has_photo: boolean;
  has_bio: boolean;
  has_skills: boolean;
  has_contact: boolean;
  has_emergency: boolean;
};

function ChipEditor({
  label, hint, values, onChange, suggestions = [],
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");
  const remove = (v: string) => onChange(values.filter((x) => x !== v));
  const add = (v: string) => {
    const t = v.trim();
    if (!t || values.includes(t)) return;
    onChange([...values, t]);
    setDraft("");
  };
  const remaining = suggestions.filter((s) => !values.includes(s));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-foreground">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground">
            {v}
            <button onClick={() => remove(v)} className="opacity-60 hover:opacity-100">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <div className="inline-flex items-center gap-1">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); add(draft); }
              if (e.key === "Backspace" && !draft && values.length) remove(values[values.length - 1]);
            }}
            placeholder="Type and press Enter"
            className="h-7 w-40 text-xs"
          />
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => add(draft)}>
            <Plus className="size-3" /> Add
          </Button>
        </div>
      </div>
      {remaining.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {remaining.slice(0, 8).map((s) => (
            <button key={s} onClick={() => add(s)}
              className="rounded-full border border-dashed border-border/70 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const SUGGESTED_EXPERTISE = [
  "CentralReach", "ABA Operations", "Recruiting", "Scheduling", "Authorizations",
  "QA", "Training", "HR", "Finance", "Payroll", "Marketing", "Systems & Software",
  "Power BI", "Leadership", "Compliance", "Automations", "Microsoft 365",
  "Monday.com", "SharePoint", "Data Analytics",
];
const SUGGESTED_LANGUAGES = ["English", "Spanish", "Hebrew", "Russian", "ASL"];

function CompletionRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-xs">
      {ok ? <CheckCircle2 className="size-3.5 text-primary" /> : <Circle className="size-3.5 text-muted-foreground/50" />}
      <span className={cn(ok ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </li>
  );
}

export function IdentityTab({ m }: { m: DirectoryEmployee }) {
  const { byUuid, reportsOf } = useEmployeeDirectory();
  const [row, setRow] = useState<IdentityRow | null>(null);
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [saving, setSaving] = useState(false);

  const manager = m.managerId ? byUuid.get(m.managerId) : null;
  const directReports = m.uuid ? reportsOf(m.uuid) : [];

  // Load identity row + completion in parallel.
  useEffect(() => {
    if (!m.uuid) return;
    let cancelled = false;
    (async () => {
      const [empRes, compRes] = await Promise.all([
        supabase.from("employees")
          .select("bio,about_me,expertise,skills,languages,emergency_contact,nfc_settings,photo_url,avatar_url,email,phone")
          .eq("id", m.uuid!).maybeSingle(),
        supabase.from("employee_profile_completion")
          .select("score,has_photo,has_bio,has_skills,has_contact,has_emergency")
          .eq("employee_id", m.uuid!).maybeSingle(),
      ]);
      if (cancelled) return;
      if (empRes.data) setRow(empRes.data as IdentityRow);
      if (compRes.data) setCompletion(compRes.data as Completion);
    })();
    return () => { cancelled = true; };
  }, [m.uuid]);

  const updateRow = (patch: Partial<IdentityRow>) =>
    setRow((prev) => (prev ? { ...prev, ...patch } : prev));

  const save = async () => {
    if (!m.uuid || !row) return;
    setSaving(true);
    const { error } = await supabase.from("employees").update({
      bio: row.bio,
      about_me: row.about_me,
      expertise: row.expertise ?? [],
      skills: row.skills ?? [],
      languages: row.languages ?? [],
      emergency_contact: row.emergency_contact ?? null,
      nfc_settings: row.nfc_settings ?? {},
    }).eq("id", m.uuid);
    setSaving(false);
    if (error) { toast.error(`Save failed: ${error.message}`); return; }
    toast.success("Identity profile saved");
    // Reload completion
    const { data } = await supabase.from("employee_profile_completion")
      .select("score,has_photo,has_bio,has_skills,has_contact,has_emergency")
      .eq("employee_id", m.uuid).maybeSingle();
    if (data) setCompletion(data as Completion);
  };

  const pct = completion?.score ?? 0;

  return (
    <div className="space-y-8">
      {/* Profile completion meter */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Profile completion</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight">{pct}%</span>
              <span className="text-xs text-muted-foreground">
                {pct === 100 ? "Complete — your badge is ready" : "A few details left to unlock the full Smart Badge"}
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <Sparkles className="size-5 text-primary" />
        </div>
        <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <CompletionRow ok={!!completion?.has_photo}     label="Profile photo" />
          <CompletionRow ok={!!completion?.has_bio}       label="Bio written" />
          <CompletionRow ok={!!completion?.has_skills}    label="Skills / expertise" />
          <CompletionRow ok={!!completion?.has_contact}   label="Email + phone" />
          <CompletionRow ok={!!completion?.has_emergency} label="Emergency contact" />
        </ul>
      </Card>

      {/* Identity editor */}
      {row && (
        <Card id="badge-about" className="p-6 scroll-mt-24">
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle hint="Shown on directory, NFC badge, and digital business card">About</SectionTitle>
            <Button size="sm" onClick={save} disabled={saving} className="text-xs">
              <Save className="size-3.5" /> {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Short bio (1 line)</label>
              <Input
                value={row.bio ?? ""}
                onChange={(e) => updateRow({ bio: e.target.value })}
                placeholder="e.g. Clinical operations leader for the Carolinas."
                maxLength={140}
              />
              <p className="mt-1 text-[10px] text-muted-foreground">Appears under the name on the badge & directory.</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">About me</label>
              <Textarea
                value={row.about_me ?? ""}
                onChange={(e) => updateRow({ about_me: e.target.value })}
                placeholder="A longer paragraph people see when they open your profile."
                rows={3}
              />
            </div>
          </div>

          <div id="badge-tags" className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3 scroll-mt-24">
            <ChipEditor
              label="Expertise"
              hint="Operational"
              values={row.expertise ?? []}
              onChange={(v) => updateRow({ expertise: v })}
              suggestions={SUGGESTED_EXPERTISE}
            />
            <ChipEditor
              label="Skills"
              values={row.skills ?? []}
              onChange={(v) => updateRow({ skills: v })}
            />
            <ChipEditor
              label="Languages"
              values={row.languages ?? []}
              onChange={(v) => updateRow({ languages: v })}
              suggestions={SUGGESTED_LANGUAGES}
            />
          </div>

          <div id="badge-emergency" className="mt-6 border-t border-border/60 pt-5 scroll-mt-24">
            <SectionTitle hint="Used for emergency contact only — never shown publicly">Emergency contact</SectionTitle>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <Input placeholder="Name" value={row.emergency_contact?.name ?? ""}
                onChange={(e) => updateRow({ emergency_contact: { ...row.emergency_contact, name: e.target.value } })} />
              <Input placeholder="Relationship" value={row.emergency_contact?.relationship ?? ""}
                onChange={(e) => updateRow({ emergency_contact: { ...row.emergency_contact, relationship: e.target.value } })} />
              <Input placeholder="Phone" value={row.emergency_contact?.phone ?? ""}
                onChange={(e) => updateRow({ emergency_contact: { ...row.emergency_contact, phone: e.target.value } })} />
              <Input placeholder="Email" value={row.emergency_contact?.email ?? ""}
                onChange={(e) => updateRow({ emergency_contact: { ...row.emergency_contact, email: e.target.value } })} />
            </div>
          </div>

          <div id="badge-visibility" className="mt-6 border-t border-border/60 pt-5 scroll-mt-24">
            <SectionTitle hint="Controls what shows when this employee's NFC badge is tapped">Smart Badge visibility</SectionTitle>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {(["public", "internal", "business_card", "emergency"] as const).map((k) => {
                const on = !!row.nfc_settings?.[k];
                const labels: Record<string, string> = {
                  public: "Public profile",
                  internal: "Internal view",
                  business_card: "Business card",
                  emergency: "Emergency profile",
                };
                return (
                  <button
                    key={k}
                    onClick={() => updateRow({ nfc_settings: { ...row.nfc_settings, [k]: !on } })}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium transition",
                      on
                        ? "border-primary/40 bg-primary/5 text-foreground"
                        : "border-border/70 bg-card text-muted-foreground hover:border-border",
                    )}
                  >
                    {labels[k]}
                    <span className={cn("ml-2 inline-block size-2 rounded-full", on ? "bg-primary" : "bg-muted-foreground/40")} />
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Org structure */}
      <Card className="p-6">
        <SectionTitle hint="Synced live from the org chart">Organizational structure</SectionTitle>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Reports to */}
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Reports to</p>
            {manager ? (
              <Link to={`/user-management/${manager.id}`}
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 p-3 transition hover:bg-muted/60">
                {manager.photo
                  ? <img src={manager.photo} alt="" className="size-10 rounded-full object-cover" />
                  : <div className="size-10 rounded-full bg-muted grid place-items-center text-xs font-semibold">{initials(manager.name)}</div>}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{manager.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{manager.title}</p>
                </div>
              </Link>
            ) : (
              <p className="text-xs text-muted-foreground">No manager assigned</p>
            )}
          </div>

          {/* Department / state */}
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Department</p>
            <div className="space-y-1.5 text-sm">
              <p className="inline-flex items-center gap-1.5"><Building2 className="size-3.5 text-muted-foreground" /> {m.departmentName ?? "Unassigned"}</p>
              <p className="inline-flex items-center gap-1.5 text-muted-foreground"><MapPin className="size-3.5" /> {(m.states ?? []).join(", ") || "—"}</p>
              {m.email && <p className="inline-flex items-center gap-1.5 text-muted-foreground"><Mail className="size-3.5" /> {m.email}</p>}
              {m.phone && <p className="inline-flex items-center gap-1.5 text-muted-foreground"><Phone className="size-3.5" /> {m.phone}</p>}
            </div>
          </div>

          {/* Direct reports */}
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              Direct reports {directReports.length > 0 && <span className="ml-1 text-foreground">({directReports.length})</span>}
            </p>
            {directReports.length === 0 ? (
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserSquare2 className="size-3.5" /> No direct reports
              </p>
            ) : (
              <ul className="space-y-1.5">
                {directReports.slice(0, 6).map((d) => (
                  <li key={d.uuid ?? d.id}>
                    <Link to={`/user-management/${d.id}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs hover:bg-muted">
                      {d.photo
                        ? <img src={d.photo} alt="" className="size-6 rounded-full object-cover" />
                        : <div className="size-6 rounded-full bg-muted grid place-items-center text-[10px] font-semibold">{initials(d.name)}</div>}
                      <span className="truncate font-medium text-foreground">{d.name}</span>
                      <span className="truncate text-muted-foreground">· {d.title}</span>
                    </Link>
                  </li>
                ))}
                {directReports.length > 6 && (
                  <li className="px-2 text-[11px] text-muted-foreground">+ {directReports.length - 6} more</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}