import type { ProviderAdapter } from "./types.ts";
import { mailchimpAdapter } from "./providers/mailchimp.ts";
import { resendAdapter } from "./providers/resend.ts";
import { retellAdapter } from "./providers/retell.ts";
import { ctmAdapter } from "./providers/ctm.ts";
import { apploiAdapter } from "./providers/apploi.ts";
import { centralreachAdapter } from "./providers/centralreach.ts";
import { solumAdapter } from "./providers/solum.ts";
import { eligiproAdapter } from "./providers/eligipro.ts";
import { ms365Adapter } from "./providers/ms365.ts";
import { jivetelAdapter } from "./providers/jivetel.ts";
import { makeAdapter } from "./providers/make.ts";
import { jotformAdapter } from "./providers/jotform.ts";
import { calendlyAdapter } from "./providers/calendly.ts";
import { goIntegrateNavaAdapter } from "./providers/goIntegrateNava.ts";
import { viventiumAdapter } from "./providers/viventium.ts";
import { googleAdsAdapter } from "./providers/googleAds.ts";
import { metaAdsAdapter } from "./providers/metaAds.ts";
import { fathomAdapter } from "./providers/fathom.ts";
import { bloomgrowthAdapter } from "./providers/bloomgrowth.ts";

const ADAPTERS: ProviderAdapter[] = [
  mailchimpAdapter,
  resendAdapter,
  retellAdapter,
  ctmAdapter,
  apploiAdapter,
  centralreachAdapter,
  solumAdapter,
  eligiproAdapter,
  ms365Adapter,
  jivetelAdapter,
  makeAdapter,
  jotformAdapter,
  calendlyAdapter,
  goIntegrateNavaAdapter,
  viventiumAdapter,
  googleAdsAdapter,
  metaAdsAdapter,
  fathomAdapter,
  bloomgrowthAdapter,
];

const REGISTRY = new Map<string, ProviderAdapter>(ADAPTERS.map((a) => [a.id, a]));

export function getAdapter(integrationId: string): ProviderAdapter | undefined {
  return REGISTRY.get(integrationId);
}

export function listAdapters(): ProviderAdapter[] {
  return [...ADAPTERS];
}

export const REQUIRED_PROVIDERS = ADAPTERS.map((a) => a.id);

/**
 * Retired adapters — kept as source files for historical migration/tests
 * only. They must NOT be added back to REQUIRED_PROVIDERS. Jotform is the
 * canonical replacement for both.
 */
export const RETIRED_PROVIDERS = ["leadtrap", "pandadoc"] as const;