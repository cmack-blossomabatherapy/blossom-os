import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReferralCompanies } from "@/lib/os/referrals/hooks";
import { createContact, findOrCreateCompany } from "@/lib/os/referrals/api";
import { CONTACT_ROLE_TYPES, CONTACT_STAGES, CONTACT_STATUSES, COMPANY_TYPES, COMPANY_STAGES, PREFERRED_CONTACT_METHODS } from "@/lib/os/referrals/types";
import { extractDomain } from "@/lib/os/referrals/utils";
import { toast } from "@/hooks/use-toast";
import { OwnerCombobox } from "./OwnerCombobox";
import { useOperatorDialogs } from "@/components/os/OperatorDialogs";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; onCreated?: () => void; presetCompanyId?: string }

export function AddReferralDialog({ open, onOpenChange, onCreated, presetCompanyId }: Props) {
  const { data: companies } = useReferralCompanies();
  const { confirmOperator } = useOperatorDialogs();
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [roleType, setRoleType] = useState<string>("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [directPhone, setDirectPhone] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");
  const [city, setCity] = useState("");
  const [stateField, setStateField] = useState("");
  const [zip, setZip] = useState("");
  const [preferred, setPreferred] = useState<string>("");
  const [stage, setStage] = useState<string>("New Contact");
  const [status, setStatus] = useState<string>("New");
  const [owners, setOwners] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");

  // Company selection
  const [companyMode, setCompanyMode] = useState<"existing" | "new" | "none">("existing");
  const [companyId, setCompanyId] = useState<string>(presetCompanyId ?? "");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyType, setNewCompanyType] = useState<string>("");
  const [newCompanyWebsite, setNewCompanyWebsite] = useState("");
  const [newCompanyState, setNewCompanyState] = useState("");
  const [newCompanyPhone, setNewCompanyPhone] = useState("");
  const [newCompanyEmail, setNewCompanyEmail] = useState("");
  const [newCompanyCity, setNewCompanyCity] = useState("");
  const [newCompanyAddr1, setNewCompanyAddr1] = useState("");
  const [newCompanyZip, setNewCompanyZip] = useState("");
  const [newCompanyStage, setNewCompanyStage] = useState<string>("New");
  const [newCompanyNotes, setNewCompanyNotes] = useState("");

  useEffect(() => { if (presetCompanyId) { setCompanyId(presetCompanyId); setCompanyMode("existing"); } }, [presetCompanyId]);

  const sortedCompanies = useMemo(() => [...companies].sort((a, b) => a.company_name.localeCompare(b.company_name)), [companies]);

  function reset() {
    setFirstName(""); setLastName(""); setTitle(""); setRoleType(""); setEmail(""); setPhone("");
    setDirectPhone(""); setMobilePhone(""); setLinkedin(""); setWebsiteUrl("");
    setAddr1(""); setAddr2(""); setCity(""); setStateField(""); setZip("");
    setPreferred(""); setStage("New Contact"); setStatus("New"); setNotes(""); setNextFollowUp("");
    setOwners([]);
    setCompanyMode("existing"); setCompanyId(""); setNewCompanyName(""); setNewCompanyType("");
    setNewCompanyWebsite(""); setNewCompanyState(""); setNewCompanyPhone("");
    setNewCompanyEmail(""); setNewCompanyCity(""); setNewCompanyAddr1(""); setNewCompanyZip("");
    setNewCompanyStage("New"); setNewCompanyNotes("");
  }

  async function handleSave() {
    if (!firstName && !lastName && !email) {
      toast({ title: "Add at least a name or email", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let resolvedCompanyId: string | null = null;
      // Resolve permissively: whichever signal is present wins so the link
      // is never silently lost if the user forgot to toggle the mode.
      if (companyMode === "new" && newCompanyName.trim()) {
        resolvedCompanyId = await findOrCreateCompany({
          company_name: newCompanyName.trim(),
          company_type: newCompanyType || null,
          website_url: newCompanyWebsite || null,
          domain: extractDomain(newCompanyEmail || email, newCompanyWebsite),
          state: newCompanyState || null,
          main_phone: newCompanyPhone || null,
          main_email: newCompanyEmail || null,
          city: newCompanyCity || null,
          address_line_1: newCompanyAddr1 || null,
          zip_code: newCompanyZip || null,
          relationship_stage: newCompanyStage || null,
          notes: newCompanyNotes || null,
          relationship_owner: owners.length ? owners : null,
          source: "Manual",
        });
      } else if (companyId) {
        resolvedCompanyId = companyId;
      } else if (newCompanyName.trim()) {
        resolvedCompanyId = await findOrCreateCompany({
          company_name: newCompanyName.trim(),
          company_type: newCompanyType || null,
          website_url: newCompanyWebsite || null,
          domain: extractDomain(newCompanyEmail || email, newCompanyWebsite),
          state: newCompanyState || null,
          main_phone: newCompanyPhone || null,
          main_email: newCompanyEmail || null,
          city: newCompanyCity || null,
          address_line_1: newCompanyAddr1 || null,
          zip_code: newCompanyZip || null,
          relationship_stage: newCompanyStage || null,
          notes: newCompanyNotes || null,
          relationship_owner: owners.length ? owners : null,
          source: "Manual",
        });
      }
      if (!resolvedCompanyId && companyMode !== "none") {
        const proceed = await confirmOperator({
          title: "Save without a company?",
          description: "No company is linked to this contact yet. You can add or link a company now, or save the contact without one.",
          confirmLabel: "Save without company",
          cancelLabel: "Keep editing",
        });
        if (!proceed) { setSaving(false); return; }
      }
      await createContact({
        company_id: resolvedCompanyId,
        first_name: firstName || null,
        last_name: lastName || null,
        title: title || null,
        role_type: roleType || null,
        email: email || null,
        phone: phone || null,
        direct_phone: directPhone || null,
        mobile_phone: mobilePhone || null,
        linkedin_url: linkedin || null,
        website_url: websiteUrl || null,
        address_line_1: addr1 || null,
        address_line_2: addr2 || null,
        city: city || null,
        state: stateField || null,
        zip_code: zip || null,
        preferred_contact_method: (preferred || null) as never,
        relationship_stage: stage as never,
        status: status as never,
        contact_owner: owners.length ? owners : null,
        notes: notes || null,
        next_follow_up_at: nextFollowUp ? new Date(nextFollowUp).toISOString() : null,
        source: "Manual",
      });
      toast({ title: "Referral contact added" });
      reset();
      onCreated?.();
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Failed to save", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Referral Contact</DialogTitle></DialogHeader>
        <div className="space-y-5">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Contact</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First name</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
              <div><Label>Last name</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
              <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pediatrician, Office Manager" /></div>
              <div>
                <Label>Role type</Label>
                <Select value={roleType} onValueChange={setRoleType}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>{CONTACT_ROLE_TYPES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div><Label>Direct phone</Label><Input value={directPhone} onChange={(e) => setDirectPhone(e.target.value)} /></div>
              <div><Label>Mobile phone</Label><Input value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} /></div>
              <div><Label>LinkedIn URL</Label><Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} /></div>
              <div><Label>Website</Label><Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} /></div>
              <div>
                <Label>Preferred contact</Label>
                <Select value={preferred} onValueChange={setPreferred}>
                  <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                  <SelectContent>{PREFERRED_CONTACT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Owner</Label><OwnerCombobox value={owners} onChange={setOwners} /></div>
              <div className="col-span-2"><Label>Address line 1</Label><Input value={addr1} onChange={(e) => setAddr1(e.target.value)} /></div>
              <div className="col-span-2"><Label>Address line 2</Label><Input value={addr2} onChange={(e) => setAddr2(e.target.value)} /></div>
              <div><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
              <div><Label>State</Label><Input value={stateField} onChange={(e) => setStateField(e.target.value)} placeholder="e.g. NC" /></div>
              <div><Label>Zip code</Label><Input value={zip} onChange={(e) => setZip(e.target.value)} /></div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Company</h3>
            <div className="flex gap-2 text-xs">
              {(["existing", "new", "none"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setCompanyMode(m)}
                  className={`px-3 py-1.5 rounded-full border ${companyMode === m ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground"}`}>
                  {m === "existing" ? "Select existing" : m === "new" ? "Create new" : "No company"}
                </button>
              ))}
            </div>
            {companyMode === "existing" && (
              <div className="space-y-2">
                <Select value={companyId} onValueChange={(v) => { if (v === "__create__") { setCompanyMode("new"); setCompanyId(""); } else setCompanyId(v); }}>
                  <SelectTrigger><SelectValue placeholder="Choose a company" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__create__">+ Create new company...</SelectItem>
                    {sortedCompanies.map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {companyId && (
                  <p className="text-xs text-emerald-600">
                    Linked to {sortedCompanies.find((c) => c.id === companyId)?.company_name ?? "company"}
                  </p>
                )}
              </div>
            )}
            {companyMode === "new" && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Company name</Label><Input value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} /></div>
                <div>
                  <Label>Company type</Label>
                  <Select value={newCompanyType} onValueChange={setNewCompanyType}>
                    <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>{COMPANY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Stage</Label>
                  <Select value={newCompanyStage} onValueChange={setNewCompanyStage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{COMPANY_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Website</Label><Input value={newCompanyWebsite} onChange={(e) => setNewCompanyWebsite(e.target.value)} /></div>
                <div><Label>Main email</Label><Input type="email" value={newCompanyEmail} onChange={(e) => setNewCompanyEmail(e.target.value)} /></div>
                <div><Label>Main phone</Label><Input value={newCompanyPhone} onChange={(e) => setNewCompanyPhone(e.target.value)} /></div>
                <div className="col-span-2"><Label>Address line 1</Label><Input value={newCompanyAddr1} onChange={(e) => setNewCompanyAddr1(e.target.value)} /></div>
                <div><Label>City</Label><Input value={newCompanyCity} onChange={(e) => setNewCompanyCity(e.target.value)} /></div>
                <div><Label>State</Label><Input value={newCompanyState} onChange={(e) => setNewCompanyState(e.target.value)} placeholder="e.g. NC" /></div>
                <div><Label>Zip code</Label><Input value={newCompanyZip} onChange={(e) => setNewCompanyZip(e.target.value)} /></div>
                <div className="col-span-2"><Label>Notes</Label><Textarea value={newCompanyNotes} onChange={(e) => setNewCompanyNotes(e.target.value)} rows={2} /></div>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Relationship</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Stage</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTACT_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTACT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Next follow-up</Label><Input type="datetime-local" value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)} /></div>
              <div className="col-span-2"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
            </div>
          </section>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Add Referral"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}