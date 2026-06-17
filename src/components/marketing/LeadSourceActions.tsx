import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Upload, ArrowRight, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import {
  buildLeadSourceDefaults,
  getLeadSourceOption,
} from "@/lib/leads/leadSourceConfig";

interface LeadSourceActionsProps {
  /** Display label for the source (e.g. "LeadTrap", "Facebook Ads"). */
  sourceLabel: string;
  /**
   * Value that ends up in `intake_leads.lead_source` and on `?source=…`
   * when filtering /leads. Should match what the importer will emit.
   */
  sourceValue: string;
  /** Optional UTM source default for Add Lead. */
  utmSource?: string;
  /** Optional UTM medium default for Add Lead. */
  utmMedium?: string;
  /** Optional UTM campaign default for Add Lead. */
  utmCampaign?: string;
  /** Future integration that will eventually feed this page. */
  integrationId?: string;
  /** Extra tags applied to leads created from this source page. */
  defaultTags?: string[];
  /** Source-page identifier persisted in source_metadata. */
  sourcePage?: string;
}

/**
 * Standard action bar surfaced on every marketing/lead-source page.
 * - Add Lead → opens the canonical NewLeadDialog with this source pre-filled.
 * - Import Leads → stub; structural placeholder for the real importer.
 * - View Leads From This Source → /leads?source=<value>
 * - Open Patient Journey → /patient-journey
 */
export function LeadSourceActions({
  sourceLabel,
  sourceValue,
  utmSource,
  utmMedium,
  utmCampaign,
  integrationId,
  defaultTags,
  sourcePage,
}: LeadSourceActionsProps) {
  const [addOpen, setAddOpen] = useState(false);
  const filteredLeadsHref = `/leads?source=${encodeURIComponent(sourceValue)}`;
  const opt = getLeadSourceOption(sourceValue);
  const resolvedIntegrationId = integrationId ?? opt?.integrationId;
  const baseDefaults = buildLeadSourceDefaults(sourceValue, {
    utmCampaign,
    sourcePage,
    extraTags: defaultTags,
  });
  const dialogDefaults = {
    ...baseDefaults,
    utmSource: utmSource ?? baseDefaults.utmSource,
    utmMedium: utmMedium ?? baseDefaults.utmMedium,
    sourceMetadata: {
      ...baseDefaults.sourceMetadata,
      integration_id: resolvedIntegrationId ?? baseDefaults.sourceMetadata.integration_id,
      source_label: sourceLabel ?? baseDefaults.sourceMetadata.source_label,
      source_page: sourcePage ?? baseDefaults.sourceMetadata.source_page,
    },
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card/70 p-3">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Lead
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            toast.info(`${sourceLabel} importer coming soon`, {
              description:
                resolvedIntegrationId
                  ? `Connector "${resolvedIntegrationId}" will accept webhook/API events here.`
                  : "This page is wired and ready — the live connector will plug in here.",
            })
          }
        >
          <Upload className="mr-1.5 h-4 w-4" />
          Import Leads
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <Link to={filteredLeadsHref}>
            <ArrowRight className="mr-1.5 h-4 w-4" />
            View Leads From {sourceLabel}
          </Link>
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <Link to="/patient-journey">
            <HeartHandshake className="mr-1.5 h-4 w-4" />
            Open Patient Journey
          </Link>
        </Button>
      </div>

      <NewLeadDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaults={dialogDefaults}
      />
    </>
  );
}