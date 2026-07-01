import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCompany, createContact } from "@/lib/os/referrals/api";
import { COMPANY_TYPES, COMPANY_STAGES, COMPANY_STATUSES, CONTACT_ROLE_TYPES, PREFERRED_CONTACT_METHODS } from "@/lib/os/referrals/types";
import { extractDomain } from "@/lib/os/referrals/utils";
import { toast } from "@/hooks/use-toast";
import { OwnerCombobox } from "./OwnerCombobox";

export function AddCompanyDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated?: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");
  const [zip, setZip] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [status, setStatus] = useState<string>("Active");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [stage, setStage] = useState<string>("New");
  const [owners, setOwners] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Optional initial contact
  const [addContact, setAddContact] = useState(false);
  const [cFirst, setCFirst] = useState("");
  const [cLast, setCLast] = useState("");
  const [cTitle, setCTitle] = useState("");
  const [cRole, setCRole] = useState<string>("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cPreferred, setCPreferred] = useState<string>("");

  async function handleSave() {
    if (!name.trim()) { toast({ title: "Company name required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const created = await createCompany({
        company_name: name.trim(),
        company_type: type || null,
        website_url: website || null,
        domain: extractDomain(email, website),
        main_email: email || null,
        main_phone: phone || null,
        state: state || null,
        city: city || null,
        address_line_1: addr1 || null,
        address_line_2: addr2 || null,
        zip_code: zip || null,
        service_area: serviceArea || null,
        status: status as never,
        next_follow_up_at: nextFollowUp ? new Date(nextFollowUp).toISOString() : null,
        relationship_stage: stage as never,
        relationship_owner: owners.length ? owners : null,
        notes: notes || null,
        source: "Manual",
      });
      if (addContact && (cFirst || cLast || cEmail)) {
        await createContact({
          company_id: created.id,
          first_name: cFirst || null,
          last_name: cLast || null,
          title: cTitle || null,
          role_type: cRole || null,
          email: cEmail || null,
          phone: cPhone || null,
          preferred_contact_method: (cPreferred || null) as never,
          contact_owner: owners.length ? owners : null,
          source: "Manual",
        });
      }
      toast({ title: "Company added" });
      setName(""); setType(""); setWebsite(""); setEmail(""); setPhone(""); setState(""); setCity("");
      setAddr1(""); setAddr2(""); setZip(""); setServiceArea(""); setStatus("Active"); setNextFollowUp("");
      setStage("New"); setOwners([]); setNotes("");
      setAddContact(false); setCFirst(""); setCLast(""); setCTitle(""); setCRole(""); setCEmail(""); setCPhone(""); setCPreferred("");
      onCreated?.();
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Failed to save", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Company</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Company name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>{COMPANY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Stage</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{COMPANY_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{COMPANY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Service area</Label><Input value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} placeholder="e.g. Charlotte Metro" /></div>
          <div><Label>Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
          <div><Label>Main email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Main phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div><Label>Owner</Label><OwnerCombobox value={owners} onChange={setOwners} /></div>
          <div className="col-span-2"><Label>Address line 1</Label><Input value={addr1} onChange={(e) => setAddr1(e.target.value)} /></div>
          <div className="col-span-2"><Label>Address line 2</Label><Input value={addr2} onChange={(e) => setAddr2(e.target.value)} /></div>
          <div><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
          <div><Label>State</Label><Input value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. NC" /></div>
          <div><Label>Zip code</Label><Input value={zip} onChange={(e) => setZip(e.target.value)} /></div>
          <div><Label>Next follow-up</Label><Input type="datetime-local" value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)} /></div>
          <div className="col-span-2"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
        </div>
        <div className="mt-4 border-t pt-4 space-y-3">
          <button type="button" onClick={() => setAddContact((v) => !v)}
            className="text-sm font-medium text-primary hover:underline">
            {addContact ? "- Remove initial contact" : "+ Add an initial contact for this company"}
          </button>
          {addContact && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First name</Label><Input value={cFirst} onChange={(e) => setCFirst(e.target.value)} /></div>
              <div><Label>Last name</Label><Input value={cLast} onChange={(e) => setCLast(e.target.value)} /></div>
              <div><Label>Title</Label><Input value={cTitle} onChange={(e) => setCTitle(e.target.value)} /></div>
              <div>
                <Label>Role type</Label>
                <Select value={cRole} onValueChange={setCRole}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>{CONTACT_ROLE_TYPES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Email</Label><Input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} /></div>
              <div><Label>Phone</Label><Input value={cPhone} onChange={(e) => setCPhone(e.target.value)} /></div>
              <div>
                <Label>Preferred contact</Label>
                <Select value={cPreferred} onValueChange={setCPreferred}>
                  <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                  <SelectContent>{PREFERRED_CONTACT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Add Company"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}