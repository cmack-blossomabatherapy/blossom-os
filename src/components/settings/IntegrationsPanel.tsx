import { SettingsPanel } from "./SettingsPanel";
import { IntakeCommunicationSetupPanel } from "./IntakeCommunicationSetupPanel";
import { IntegrationsHubPointer } from "@/components/integrations/IntegrationsHubPointer";

/**
 * Settings → Integrations no longer renders its own status grid. All
 * integration readiness/health surfaces are consolidated under
 * Admin → Integrations so users see one home and one set of states.
 */
export function IntegrationsPanel() {
  return (
    <SettingsPanel
      title="Integrations"
      description="Connection status for every source system is managed in Admin → Integrations."
      showSave={false}
    >
      <IntegrationsHubPointer
        description="Forms, insurance verification, clinical data, and messaging connections all report their readiness in one place. Open Admin → Integrations to review or reconnect."
      />
      <div className="mt-6">
        <IntakeCommunicationSetupPanel />
      </div>
    </SettingsPanel>
  );
}
