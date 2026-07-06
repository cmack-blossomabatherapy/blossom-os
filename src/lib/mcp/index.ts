import { auth, defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import whoamiTool from "./tools/whoami";

// Build the Supabase Auth issuer URL from the project ref, which Vite inlines
// as a literal at build time. Never derive it from SUPABASE_URL — Lovable Cloud
// serves that from a `.lovable.cloud` proxy host, but Supabase's OAuth
// discovery document publishes the direct `<ref>.supabase.co` issuer and
// mcp-js rejects any token whose configured issuer doesn't match (RFC 8414).
const projectRef =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "blossom-os-mcp",
  title: "Blossom OS",
  version: "0.1.0",
  instructions:
    "Blossom OS operational tools. Use `whoami` to confirm the signed-in account and roles; use `echo` to verify connectivity. Additional operational tools will be added over time.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [echoTool, whoamiTool],
});