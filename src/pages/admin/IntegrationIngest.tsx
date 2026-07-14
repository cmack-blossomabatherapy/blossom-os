import { IntegrationIngestPreviewPanel } from "@/components/marketing/IntegrationIngestPreviewPanel";

/**
 * Admin-only Integration Ingest preview. Restricted to super admins via
 * the /admin/integration-ingest route (AdminRoute guard). Previously lived
 * on the Marketing → Lead Sources page; moved here so operators don't see
 * raw ingest diagnostics on an operational page.
 */
export default function IntegrationIngestAdminPage() {
  return (
    <div className="px-6 md:px-10 py-8 max-w-7xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Integration Ingest</h1>
        <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
          Preview and inspect raw ingest activity for lead-source integrations. Admin-only diagnostic surface.
        </p>
      </header>
      <IntegrationIngestPreviewPanel />
    </div>
  );
}