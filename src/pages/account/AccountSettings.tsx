import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Settings as SettingsIcon, Save, User, MapPin, ExternalLink, Loader2, X, Plus, Shield, Phone, Linkedin, BadgeCheck, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

type NfcSettings = { enabled?: boolean; public?: boolean; internal?: boolean; business_card?: boolean; emergency?: boolean } | null;
type EmergencyContact = { name?: string; relationship?: string; phone?: string; email?: string } | null;

type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  pronouns: string | null;
  address: string | null;
  meeting_link: string | null;
  email: string | null;
  job_title: string;
  employee_code: string | null;
  photo_url: string | null;
  credential: string | null;
  linkedin_url: string | null;
  phone: string | null;
  extension: string | null;
  bio: string | null;
  about_me: string | null;
  expertise: string[] | null;
  skills: string[] | null;
  languages: string[] | null;
  help_with: string[] | null;
  emergency_contact: EmergencyContact;
  nfc_settings: NfcSettings;
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border/60 bg-card shadow-sm ${className}`}>{children}</div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ChipList({
  value,
  onChange,
  placeholder,
}: {
  value: string[] | null;
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const items = value ?? [];
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (items.includes(v)) { setDraft(""); return; }
    onChange([...items, v]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {items.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-xs">
            {tag}
            <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => onChange(items.filter((t) => t !== tag))}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        {items.length === 0 && <span className="text-[11px] text-muted-foreground">None yet</span>}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <Button type="button" variant="outline" size="sm" onClick={add} className="h-9 shrink-0">
          <Plus className="size-3.5" /> Add
        </Button>
      </div>
    </div>
  );
}

export default function AccountSettings() {
  const { user } = useAuth();
  const [row, setRow] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("id,first_name,last_name,preferred_name,pronouns,address,meeting_link,email,job_title,employee_code,photo_url,credential,linkedin_url,phone,extension,bio,about_me,expertise,skills,languages,help_with,emergency_contact,nfc_settings")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast.error("Could not load your profile", { description: error.message });
      }
      setRow((data as ProfileRow) ?? null);
      setNotFound(!data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const update = (patch: Partial<ProfileRow>) =>
    setRow((prev) => (prev ? { ...prev, ...patch } : prev));

  const updateEmergency = (patch: Partial<NonNullable<EmergencyContact>>) =>
    setRow((prev) => (prev ? { ...prev, emergency_contact: { ...(prev.emergency_contact ?? {}), ...patch } } : prev));

  const updateNfc = (patch: Partial<NonNullable<NfcSettings>>) =>
    setRow((prev) => (prev ? { ...prev, nfc_settings: { ...(prev.nfc_settings ?? {}), ...patch } } : prev));

  const uploadPhoto = async (file: File) => {
    if (!row) return;
    setUploadingPhoto(true);
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
    const path = `${row.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("employee-photos").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      // Fallback bucket name used elsewhere in the OS
      const { error: upErr2 } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr2) {
        setUploadingPhoto(false);
        toast.error("Photo upload failed", { description: upErr.message });
        return;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      update({ photo_url: data.publicUrl });
    } else {
      const { data } = supabase.storage.from("employee-photos").getPublicUrl(path);
      update({ photo_url: data.publicUrl });
    }
    setUploadingPhoto(false);
    toast.success("Photo ready — remember to save");
  };

  const save = async () => {
    if (!row) return;
    if (!row.first_name.trim() || !row.last_name.trim()) {
      toast.error("First and last name are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("employees")
      .update({
        first_name: row.first_name.trim(),
        last_name: row.last_name.trim(),
        preferred_name: row.preferred_name?.trim() || null,
        pronouns: row.pronouns?.trim() || null,
        address: row.address?.trim() || null,
        meeting_link: row.meeting_link?.trim() || null,
        photo_url: row.photo_url?.trim() || null,
        credential: row.credential?.trim() || null,
        linkedin_url: row.linkedin_url?.trim() || null,
        phone: row.phone?.trim() || null,
        extension: row.extension?.trim() || null,
        bio: row.bio?.trim() || null,
        about_me: row.about_me?.trim() || null,
        expertise: row.expertise ?? [],
        skills: row.skills ?? [],
        languages: row.languages ?? [],
        help_with: row.help_with ?? [],
        emergency_contact: row.emergency_contact ?? null,
        nfc_settings: row.nfc_settings ?? null,
      })
      .eq("id", row.id);
    setSaving(false);
    if (error) { toast.error("Save failed", { description: error.message }); return; }
    toast.success("Profile updated");
    window.dispatchEvent(new Event("employee-directory:refresh"));
    window.dispatchEvent(new Event("team-directory:refresh"));
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-12">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            <SettingsIcon className="size-3" /> Settings
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Your account</h1>
          <p className="text-sm text-muted-foreground">Update your profile — it powers the team directory, org chart, and your digital business card.</p>
        </div>
      </div>

      <nav className="flex gap-1 rounded-2xl border border-border/60 bg-card p-1 text-sm">
        <span className="flex-1 rounded-xl bg-primary px-3 py-2 text-center font-medium text-primary-foreground shadow-sm">Profile</span>
        <Link to="/profile#settings" className="flex-1 rounded-xl px-3 py-2 text-center text-muted-foreground hover:bg-muted/60 hover:text-foreground">Security &amp; sign-in</Link>
        <Link to="/notification-preferences" className="flex-1 rounded-xl px-3 py-2 text-center text-muted-foreground hover:bg-muted/60 hover:text-foreground">Notifications</Link>
      </nav>

      {loading ? (
        <Card className="grid place-items-center p-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading your profile…
        </Card>
      ) : notFound || !row ? (
        <Card className="p-6">
          <p className="text-sm text-foreground">We couldn't find an employee record linked to this account.</p>
          <p className="mt-1 text-xs text-muted-foreground">Ask your HR admin to link your login to your employee record, then refresh this page.</p>
        </Card>
      ) : (
        <Card className="p-6 space-y-6">
          <header className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold inline-flex items-center gap-2"><User className="size-4 text-primary" /> Profile</h2>
              <p className="text-xs text-muted-foreground">{row.job_title}{row.employee_code ? ` · ${row.employee_code}` : ""}</p>
            </div>
            <Button size="sm" onClick={save} disabled={saving} className="h-9">
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="First name">
              <Input value={row.first_name} onChange={(e) => update({ first_name: e.target.value })} />
            </Field>
            <Field label="Last name">
              <Input value={row.last_name} onChange={(e) => update({ last_name: e.target.value })} />
            </Field>
            <Field label="Preferred name" hint="Shown across the OS when set">
              <Input value={row.preferred_name ?? ""} onChange={(e) => update({ preferred_name: e.target.value })} placeholder="What should we call you?" />
            </Field>
            <Field label="Pronouns">
              <Input value={row.pronouns ?? ""} onChange={(e) => update({ pronouns: e.target.value })} placeholder="she/her, he/him, they/them" />
            </Field>
          </div>

          <div className="border-t border-border/60 pt-5">
            <Field label="Address" hint="Used for HR mailings and onboarding shipments. Never shown publicly.">
              <Textarea
                rows={2}
                value={row.address ?? ""}
                onChange={(e) => update({ address: e.target.value })}
                placeholder="123 Main St, Apt 4B&#10;Atlanta, GA 30303"
              />
            </Field>
          </div>

          <div className="border-t border-border/60 pt-5">
            <Field
              label="Meeting / scheduling link"
              hint="Powers the Schedule button on your digital business card. Most teams use Calendly; Microsoft Bookings also works."
            >
              <div className="flex items-center gap-2">
                <Input
                  value={row.meeting_link ?? ""}
                  onChange={(e) => update({ meeting_link: e.target.value })}
                  placeholder="https://calendly.com/your-handle"
                />
                {row.meeting_link && (
                  <Button asChild variant="outline" size="sm" className="h-9 shrink-0">
                    <a href={row.meeting_link} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-3.5" /> Open
                    </a>
                  </Button>
                )}
              </div>
            </Field>
          </div>

          <div className="border-t border-border/60 pt-4 text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
            <MapPin className="size-3" /> Work email, phone, title, and employment details are managed by HR.
          </div>
        </Card>
      )}
    </div>
  );
}