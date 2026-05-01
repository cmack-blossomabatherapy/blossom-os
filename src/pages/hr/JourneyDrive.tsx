import { ArrowLeft, ExternalLink, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";

const DRIVE_FOLDER_ID = "13iq1d2GMtdiY-6U0oRUuLYODQ3l2BaEZ";
const DRIVE_EMBED_URL = `https://drive.google.com/embeddedfolderview?id=${DRIVE_FOLDER_ID}#grid`;
const DRIVE_OPEN_URL = `https://drive.google.com/drive/folders/${DRIVE_FOLDER_ID}?usp=drive_link`;

export default function JourneyDrive() {
  return (
    <PageShell
      title="RBT Resource Drive"
      description="Curated Google Drive with all RBT training materials, forms, and guides."
      icon={FolderOpen}
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/hr/journey">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Training Hub
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={DRIVE_OPEN_URL} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" /> Open in Google Drive
            </a>
          </Button>
        </div>
      }
    >
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="border-b border-border/60 bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          Browsing the curated Drive folder. Click any file to open it in a new tab.
        </div>
        <iframe
          title="Curated RBT Resource Drive"
          src={DRIVE_EMBED_URL}
          className="w-full h-[calc(100vh-220px)] min-h-[560px] bg-background"
          loading="lazy"
        />
      </div>
    </PageShell>
  );
}