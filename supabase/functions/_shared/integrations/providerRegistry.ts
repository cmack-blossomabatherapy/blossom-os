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
import { pandadocAdapter } from "./providers/pandadoc.ts";
import { leadtrapAdapter } from "./providers/leadtrap.ts";
import { calendlyAdapter } from "./providers/calendly.ts";
import { goIntegrateNavaAdapter } from "./providers/goIntegrateNava.ts";
import { viventiumAdapter } from "./providers/viventium.ts";

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
  pandadocAdapter,
  leadtrapAdapter,
  calendlyAdapter,
  goIntegrateNavaAdapter,
  viventiumAdapter,
];

const REGISTRY = new Map<string, ProviderAdapter>(ADAPTERS.map((a) => [a.id, a]));

export function getAdapter(integrationId: string): ProviderAdapter | undefined {
  return REGISTRY.get(integrationId);
}

export function listAdapters(): ProviderAdapter[] {
  return [...ADAPTERS];
}

export const REQUIRED_PROVIDERS = ADAPTERS.map((a) => a.id);