// Mapsly API proxy — forwards authenticated requests to Mapsly using MAPSLY_API_KEY.
// The client never sees the key; all calls flow through this function.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

const MAPSLY_BASE = "https://api.mapsly.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const key = Deno.env.get("MAPSLY_API_KEY");
  if (!key) {
    return json({ error: "MAPSLY_API_KEY not configured", needsSecret: true }, 503);
  }

  let body: { path?: string; method?: string; body?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const path = (body.path || "").toString();
  if (!path.startsWith("/")) {
    return json({ error: "path must start with /" }, 400);
  }

  const method = (body.method || "GET").toUpperCase();
  const url = `${MAPSLY_BASE}${path}`;

  try {
    const resp = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: method === "GET" || method === "DELETE" ? undefined : JSON.stringify(body.body ?? {}),
    });
    const text = await resp.text();
    let parsed: unknown = text;
    try { parsed = JSON.parse(text); } catch { /* keep raw */ }
    return json({ status: resp.status, ok: resp.ok, data: parsed }, 200);
  } catch (e) {
    return json({ error: String(e) }, 502);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}