// Temporary endpoint used to preview the new branded welcome email.
// Deploys with verify_jwt=false; safe to delete after the preview send.
import { sendBlossomWelcomeEmail } from "../_shared/welcome-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" && body.email
    ? body.email
    : "cmack@blossomabatherapy.com";
  const result = await sendBlossomWelcomeEmail({
    email,
    displayName: body.displayName ?? "Christina",
    roles: body.roles ?? ["admin", "hr_admin"],
    tempPassword: body.tempPassword ?? "Bl0ss0m-Test!",
    loginUrl: body.loginUrl ?? "https://blossom.abacommandcenter.com/auth",
    jobTitle: body.jobTitle ?? "HR Director",
  });
  return new Response(JSON.stringify(result), {
    status: result.status === "sent" ? 200 : 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});