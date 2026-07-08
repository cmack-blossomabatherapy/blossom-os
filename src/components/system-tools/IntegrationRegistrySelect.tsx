/**
 * IntegrationRegistrySelect
 *
 * Reusable dropdown for choosing a related integration by registry key.
 * Used by Workflow Inventory, Issue Tracker, and Request Intake dialogs
 * so that `related_integration_id` is always a stable registry key
 * (e.g. `centralreach`, `viventium`) instead of a free-text string.
 */
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BLOSSOM_INTEGRATIONS } from "@/lib/os/integrations/integrationRegistry";

export const NONE_INTEGRATION_VALUE = "__none__";

/** All non-internal integrations, sorted by display name. */
export function getIntegrationSelectOptions(): { id: string; label: string }[] {
  return BLOSSOM_INTEGRATIONS
    .filter((i) => !i.internalOnly)
    .map((i) => ({ id: i.id, label: i.displayName ?? i.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function IntegrationRegistrySelect({
  value,
  onChange,
  label = "Related integration",
  id,
}: {
  value: string | null | undefined;
  onChange: (next: string) => void;
  label?: string | null;
  id?: string;
}) {
  const options = getIntegrationSelectOptions();
  const current = value && value.length > 0 ? value : NONE_INTEGRATION_VALUE;
  return (
    <div>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Select
        value={current}
        onValueChange={(v) => onChange(v === NONE_INTEGRATION_VALUE ? "" : v)}
      >
        <SelectTrigger id={id} aria-label={label ?? "Related integration"}>
          <SelectValue placeholder="Select integration" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_INTEGRATION_VALUE}>— None —</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}