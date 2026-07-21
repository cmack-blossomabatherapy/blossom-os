import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, LifeBuoy, Users, Search, Mail, Phone } from "lucide-react";
import {
  SUPPORT_CATEGORIES, SUPPORT_STATUS_LABELS, SUPPORT_STATUS_STYLES, URGENCY_STYLES,
  categoryFor, type SupportCategoryKey,
} from "./config";
import { useMySupportRequests, useSupportContacts } from "./useSupport";
import NewSupportRequestDialog from "./NewSupportRequestDialog";
import SupportRequestDrawer from "./SupportRequestDrawer";
import { useBcbaIdentity } from "../useBcbaIdentity";
import { BcbaPreviewBanner } from "../BcbaPreviewBanner";
import { BcbaMappingDiagnostic } from "../BcbaMappingDiagnostic";

function fmt(d?: string | null) { if (!d) return "—"; try { return new Date(d).toLocaleDateString(); } catch { return "—"; } }

export default function SupportPage() {
  const [params, setParams] = useSearchParams();
  const identity = useBcbaIdentity();
  const uid = identity.scopedAuthUserId;
  const uname = identity.displayName ?? undefined;
  const readOnly = identity.readOnly;
  const [dlgOpen, setDlgOpen] = useState(false);
  const [initialCat, setInitialCat] = useState<SupportCategoryKey | undefined>();
  const selectedId = params.get("id");
  const setSelected = (id: string | null) => {
    const n = new URLSearchParams(params);
    if (id) n.set("id", id); else n.delete("id");
    setParams(n, { replace: true });
  };

  const requests = useMySupportRequests(uid);
  const contacts = useSupportContacts();

  const [contactSearch, setContactSearch] = useState("");
  const filteredContacts = useMemo(() => {
    const s = contactSearch.trim().toLowerCase();
    const list = contacts.data ?? [];
    if (!s) return list;
    return list.filter((c: any) =>
      [c.name, c.title, c.team, c.friendly_role, (c.categories ?? []).join(" "), (c.states ?? []).join(" ")]
        .filter(Boolean).some((v: string) => v.toLowerCase().includes(s))
    );
  }, [contactSearch, contacts.data]);

  const openCategories = (r: any[]) => {
    const active = r.filter((x) => !["resolved","closed"].includes(x.status));
    return active.length;
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <BcbaPreviewBanner />
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Support</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Send a request to the right team without knowing the org chart. Every request has an owner, status, due date, and audit history.
          </p>
        </div>
        <Button
          disabled={readOnly}
          title={readOnly ? "Read-only in preview mode" : undefined}
          onClick={() => { setInitialCat(undefined); setDlgOpen(true); }}
        >
          <Plus className="h-4 w-4 mr-1.5" /> New request
        </Button>
      </div>

      <div className="mb-4"><BcbaMappingDiagnostic onRetry={() => { requests.refetch(); }} /></div>

      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new">Get help</TabsTrigger>
          <TabsTrigger value="mine">
            <LifeBuoy className="h-3.5 w-3.5 mr-1.5" /> My requests {requests.data ? `(${openCategories(requests.data)})` : ""}
          </TabsTrigger>
          <TabsTrigger value="team"><Users className="h-3.5 w-3.5 mr-1.5" /> My support team</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUPPORT_CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.key}
                  disabled={readOnly}
                  onClick={() => { if (readOnly) return; setInitialCat(c.key); setDlgOpen(true); }}
                  className="text-left rounded-xl border bg-card hover:shadow-sm hover:border-primary/40 transition p-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={readOnly ? "Read-only in preview mode" : undefined}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 text-primary p-2"><Icon className="h-4 w-4" /></div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{c.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{c.description}</div>
                      <div className="text-[11px] text-muted-foreground mt-2">
                        {c.friendlyOwner} · SLA {c.defaultSlaHours}h
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="mine" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr className="text-left">
                      <th className="p-3 font-medium">Subject</th>
                      <th className="p-3 font-medium">Category</th>
                      <th className="p-3 font-medium">Owner</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Urgency</th>
                      <th className="p-3 font-medium">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(requests.data ?? []).map((r: any) => (
                      <tr key={r.id} className="border-t border-border/50 hover:bg-muted/20 cursor-pointer" onClick={() => setSelected(r.id)}>
                        <td className="p-3">{r.subject}</td>
                        <td className="p-3 text-muted-foreground">{categoryFor(r.category).label}</td>
                        <td className="p-3">{r.owner_name ?? r.owner_team ?? "Routing…"}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${SUPPORT_STATUS_STYLES[r.status]}`}>
                            {SUPPORT_STATUS_LABELS[r.status]}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${URGENCY_STYLES[r.urgency]}`}>
                            {r.urgency}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{fmt(r.due_at)}</td>
                      </tr>
                    ))}
                    {(requests.data ?? []).length === 0 && (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">You have no support requests yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-4 space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} className="pl-7" placeholder="Search by name, role, or topic" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredContacts.map((c: any) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.friendly_role ?? c.title}</div>
                    </div>
                    {c.is_primary && <span className="text-[10px] rounded-full bg-primary/10 text-primary px-1.5 py-0.5">Primary</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-2">{c.team}</div>
                  <div className="mt-3 space-y-1 text-xs">
                    {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-primary hover:underline"><Mail className="h-3 w-3" /> {c.email}</a>}
                    {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-primary hover:underline"><Phone className="h-3 w-3" /> {c.phone}</a>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredContacts.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground text-sm py-8">
                No contacts yet. Leadership can add them from the admin console.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {uid && (
        <NewSupportRequestDialog
          open={dlgOpen}
          onOpenChange={setDlgOpen}
          bcbaId={uid}
          bcbaName={uname}
          initialCategory={initialCat}
        />
      )}
      <SupportRequestDrawer id={selectedId} onClose={() => setSelected(null)} />
    </div>
  );
}