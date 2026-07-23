import { listAdapters } from "../supabase/functions/_shared/integrations/providerRegistry.ts";
for (const a of listAdapters()) {
  console.log(JSON.stringify({
    id: a.id,
    required: a.requiredSecrets ?? [],
    optional: a.optionalSecrets ?? [],
    cap: a.capabilities ?? {},
  }));
}
