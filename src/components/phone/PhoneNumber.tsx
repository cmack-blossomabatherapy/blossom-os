import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhoneDisplay, telHref, toE164 } from "@/lib/phone/format";
import { supabase } from "@/integrations/supabase/client";

type Ctx = {
  leadId?: string | null;
  clientId?: string | null;
  employeeId?: string | null;
  label?: string;
};

type Props = {
  value: string | null | undefined;
  context?: Ctx;
  className?: string;
  compact?: boolean;
  /** Hide the visible number, only render the call icon. */
  iconOnly?: boolean;
};

async function logDialIntent(target: string, ctx?: Ctx) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData?.user?.id;
    if (!uid) return;
    await supabase.from("phone_dial_events").insert({
      user_id: uid,
      target_number_e164: target,
      linked_lead_id: ctx?.leadId ?? null,
      linked_client_id: ctx?.clientId ?? null,
      linked_employee_id: ctx?.employeeId ?? null,
      context_label: ctx?.label ?? null,
    });
  } catch (err) {
    // Fire-and-forget — never block dial on logging failure.
    console.warn("phone_dial_events insert failed", err);
  }
}

/**
 * Universal click-to-call. Renders the formatted number as a link that opens
 * the OS's registered `tel:` handler (GoIntegrator, native dialer, softphone),
 * and logs a dial-intent row so we can later reconcile against the CTM webhook.
 */
export function PhoneNumber({ value, context, className, compact, iconOnly }: Props) {
  const e164 = toE164(value);
  const display = formatPhoneDisplay(value);
  if (!e164) {
    return <span className={cn("text-muted-foreground", className)}>{display || "—"}</span>;
  }
  const href = telHref(value);
  return (
    <a
      href={href}
      onClick={() => {
        void logDialIntent(e164, context);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 text-primary hover:underline",
        compact && "text-xs",
        className,
      )}
      aria-label={`Call ${display}`}
    >
      <Phone className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {!iconOnly && <span>{display}</span>}
    </a>
  );
}

export default PhoneNumber;
