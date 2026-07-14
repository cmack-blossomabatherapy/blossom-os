import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { OSShell } from "@/pages/os/OSShell";
import { LibraryTabs } from "@/components/resource-library/LibraryTabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Download, ExternalLink, Lock, Calendar, User, FileText, ShieldAlert,
} from "lucide-react";
import { useLibraryResources } from "@/hooks/useLibraryResources";
import { resolveResourceOpenUrl } from "@/lib/resources/resourceStorage";
import { canPreviewInline, fileTypeLabel } from "@/lib/resources/librarySections";
import { cleanResourceTitle } from "@/lib/resources/resourceDisplay";
import { toast } from "sonner";
import { isVisibleToRole, type Resource } from "@/lib/resources/resourceData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRole } from "@/contexts/OSRoleContext";

export default function ResourceLibraryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { resources, loading } = useLibraryResources();
  const { user } = useAuth();
  const { role, activeState } = useOSRole();
  const resource = useMemo(
    () => resources.find((r) => r.id === id && isVisibleToRole(r, role, activeState)) ?? null,
    [resources, id, role, activeState],
  );
  const [signed, setSigned] = useState<string | null>(null);
  const [ack, setAck] = useState(false);

  useEffect(() => {
    if (!resource) { setSigned(null); return; }
    let cancelled = false;
    (async () => {
      const url = await resolveResourceOpenUrl(resource);
      if (!cancelled) setSigned(url);
    })();
    return () => { cancelled = true; };
  }, [resource]);

  async function acknowledge(r: Resource) {
    if (!user) { toast.error("Sign in required."); return; }
    try {
      const { error } = await (supabase.from("hr_document_acknowledgements") as any).insert({
        user_id: user.id,
        document_id: r.id,
      });
      if (error) throw error;
      setAck(true);
      toast.success("Acknowledgement recorded.");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not record acknowledgement.");
    }
  }

  if (loading && !resource) {
    return <OSShell><div className="mx-auto max-w-4xl p-6 text-sm text-muted-foreground">Loading…</div></OSShell>;
  }
  if (!resource) {
    return (
      <OSShell>
        <div className="mx-auto w-full max-w-6xl space-y-4 px-6 py-10 md:px-10">
          <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
          <div className="rounded-2xl border border-dashed border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
            Resource not found or you don't have access.
          </div>
        </div>
      </OSShell>
    );
  }

  const preview = canPreviewInline(resource);
  const ft = fileTypeLabel(resource);

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl space-y-5 px-6 py-10 md:px-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/resource-library"><ArrowLeft className="mr-1.5 h-4 w-4" /> Library</Link>
          </Button>
        </div>
        <LibraryTabs />

        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full">{ft}</Badge>
            {resource.isSensitive && (
              <Badge className="rounded-full bg-amber-100 text-amber-800">
                <Lock className="mr-1 h-3 w-3" /> Sensitive
              </Badge>
            )}
            {resource.requiresAcknowledgement && (
              <Badge className="rounded-full bg-blue-100 text-blue-800">Acknowledgement required</Badge>
            )}
            {resource.visibilityLevel && (
              <Badge variant="outline" className="rounded-full text-[10.5px] uppercase tracking-wider">
                <ShieldAlert className="mr-1 h-3 w-3" />
                {resource.visibilityLevel.replace(/_/g, " ")}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{cleanResourceTitle(resource.title)}</h1>
          {resource.description && (
            <p className="text-[13.5px] text-muted-foreground">{resource.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
            {resource.owner && (<span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" />{resource.owner}</span>)}
            {resource.lastReviewedDate && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Reviewed {new Date(resource.lastReviewedDate).toLocaleDateString()}
              </span>
            )}
            {resource.resourceId && (<span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{resource.resourceId}</span>)}
          </div>
        </header>

        <div className="rounded-2xl border border-border/60 bg-card p-4">
          {preview === "pdf" && signed && (
            <iframe src={signed} title={resource.title} className="h-[70vh] w-full rounded-xl border border-border/40" />
          )}
          {preview === "video" && signed && (
            <video src={signed} controls className="aspect-video w-full rounded-xl bg-black" />
          )}
          {preview === "image" && signed && (
            <img src={signed} alt={resource.title} className="mx-auto max-h-[70vh] rounded-xl object-contain" />
          )}
          {(!preview || !signed) && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/40 p-10 text-center text-sm text-muted-foreground">
              {signed
                ? "Preview not available for this file type. Use Download to open it."
                : (resource.storagePath || resource.url ? "Preparing signed link…" : "No file attached yet.")}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {signed && (
            <>
              <Button asChild size="sm">
                <a href={signed} download={resource.fileName ?? resource.title}>
                  <Download className="mr-1.5 h-4 w-4" /> Download
                </a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href={signed} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-1.5 h-4 w-4" /> Open in new tab
                </a>
              </Button>
            </>
          )}
          {resource.requiresAcknowledgement && !ack && (
            <Button size="sm" variant="secondary" onClick={() => acknowledge(resource)}>
              I've read this — acknowledge
            </Button>
          )}
          {ack && (
            <Badge className="rounded-full bg-emerald-100 text-emerald-800">Acknowledgement recorded</Badge>
          )}
        </div>
      </div>
    </OSShell>
  );
}
